import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/integrations/link-channel
//
// Links a messaging channel (WhatsApp, Telegram, Discord) to a user's workspace.
// Called during onboarding after the user provides their contact info.
//
// Body:
//   platform: 'whatsapp' | 'telegram' | 'discord'
//   contact_id: string (phone number or username)
//   workspace_id?: string
//
// This endpoint:
//   1. Saves the channel link in user_perspectives
//   2. Registers the contact with OpenClaw Gateway
//   3. Sends a verification message to the user
// ─────────────────────────────────────────────────────────────────────────────

const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3100';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const authHeader = req.headers.get('authorization');
        let userId: string | null = null;

        if (authHeader) {
            const token = authHeader.split(' ')[1];
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
            if (!error && user) userId = user.id;
        }

        // Also accept userId in body for dev mode
        const body = await req.json();
        const { platform, contact_id, workspace_id, user_id: bodyUserId } = body;
        userId = userId || bodyUserId;

        if (!userId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        if (!platform || !contact_id) {
            return NextResponse.json(
                { error: 'Se requiere platform y contact_id' },
                { status: 400 }
            );
        }

        // Validate platform
        const validPlatforms = ['whatsapp', 'telegram', 'discord'];
        if (!validPlatforms.includes(platform)) {
            return NextResponse.json(
                { error: `Plataforma no válida. Opciones: ${validPlatforms.join(', ')}` },
                { status: 400 }
            );
        }

        // Normalize contact_id
        let normalizedContact = contact_id.trim();
        if (platform === 'whatsapp') {
            // Remove spaces, dashes, and ensure + prefix for phone numbers
            normalizedContact = normalizedContact.replace(/[\s\-()]/g, '');
            if (!normalizedContact.startsWith('+')) {
                normalizedContact = '+' + normalizedContact;
            }
        } else if (platform === 'telegram') {
            // Ensure @ prefix for Telegram usernames
            if (!normalizedContact.startsWith('@') && !/^\d+$/.test(normalizedContact)) {
                normalizedContact = '@' + normalizedContact;
            }
        }

        // Get or find workspace
        let wsId = workspace_id;
        if (!wsId) {
            const { data: ws } = await supabaseAdmin
                .from('workspaces')
                .select('id')
                .or(`user_id.eq.${userId},owner_id.eq.${userId}`)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            wsId = ws?.id;
        }

        // Save channel link in user_perspectives
        if (wsId) {
            // Update existing perspective with messaging info
            const { error: updateError } = await supabaseAdmin
                .from('user_perspectives')
                .update({
                    phone: platform === 'whatsapp' ? normalizedContact : undefined,
                    metadata: {
                        messaging_platform: platform,
                        messaging_contact: normalizedContact,
                        linked_at: new Date().toISOString(),
                    },
                })
                .eq('user_id', userId)
                .eq('workspace_id', wsId);

            // If no existing row, create one
            if (updateError) {
                await supabaseAdmin
                    .from('user_perspectives')
                    .insert({
                        user_id: userId,
                        workspace_id: wsId,
                        phone: platform === 'whatsapp' ? normalizedContact : null,
                        mode: 'focus',
                        sections: {},
                        features: {},
                        ui: {},
                        metadata: {
                            messaging_platform: platform,
                            messaging_contact: normalizedContact,
                            linked_at: new Date().toISOString(),
                        },
                    });
            }
        }

        // Register with OpenClaw Gateway
        let openclawRegistered = false;
        try {
            const response = await fetch(`${OPENCLAW_GATEWAY_URL}/api/contacts/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENCLAW_API_KEY}`,
                },
                body: JSON.stringify({
                    platform,
                    contact_id: normalizedContact,
                    user_id: userId,
                    workspace_id: wsId,
                    webhook_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/openclaw`,
                }),
            });
            openclawRegistered = response.ok;
        } catch (err) {
            console.warn('[link-channel] OpenClaw registration failed (gateway may be offline):', err);
        }

        // Send verification message (if OpenClaw is available)
        let verificationSent = false;
        if (openclawRegistered) {
            try {
                const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

                // Store verification code
                await supabaseAdmin.from('activity_feed').insert({
                    workspace_id: wsId,
                    user_id: userId,
                    action_type: 'channel_verification',
                    title: `Verificación de ${platform}`,
                    description: `Código enviado a ${normalizedContact}`,
                    metadata: {
                        platform,
                        contact: normalizedContact,
                        verification_code: verificationCode,
                        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
                    },
                });

                const welcomeMessages: Record<string, string> = {
                    whatsapp: `🧠 *Cerebrin* — ¡Bienvenido!\n\nTu cuenta está vinculada. Ahora puedes:\n\n📋 Escribir *"tareas"* para ver pendientes\n📊 Escribir *"estado"* para ver tu dashboard\n✅ Escribir *"ayuda"* para ver comandos\n\nO simplemente cuéntame qué necesitas y lo haré por ti. 🚀`,
                    telegram: `🧠 *Cerebrin* — ¡Bienvenido!\n\nTu cuenta está vinculada. Ahora puedes:\n\n📋 /tareas — Ver pendientes\n📊 /estado — Ver dashboard\n✅ /ayuda — Ver comandos\n\nO simplemente cuéntame qué necesitas. 🚀`,
                    discord: `🧠 **Cerebrin** — ¡Bienvenido!\n\nTu cuenta está vinculada. Usa estos comandos:\n\n📋 \`!tareas\` — Ver pendientes\n📊 \`!estado\` — Ver dashboard\n✅ \`!ayuda\` — Ver comandos\n\nO simplemente cuéntame qué necesitas. 🚀`,
                };

                await fetch(`${OPENCLAW_GATEWAY_URL}/api/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENCLAW_API_KEY}`,
                    },
                    body: JSON.stringify({
                        to: normalizedContact,
                        platform,
                        text: welcomeMessages[platform],
                    }),
                });

                verificationSent = true;
            } catch (err) {
                console.warn('[link-channel] Verification message failed:', err);
            }
        }

        // Log the linking event
        if (wsId) {
            await supabaseAdmin.from('activity_feed').insert({
                workspace_id: wsId,
                user_id: userId,
                action_type: 'channel_linked',
                title: `Canal vinculado: ${platform}`,
                description: `${normalizedContact} vinculado exitosamente`,
                metadata: {
                    platform,
                    contact: normalizedContact,
                    openclaw_registered: openclawRegistered,
                    verification_sent: verificationSent,
                },
            });
        }

        return NextResponse.json({
            success: true,
            platform,
            contact: normalizedContact,
            workspace_id: wsId,
            openclaw_registered: openclawRegistered,
            verification_sent: verificationSent,
            message: openclawRegistered
                ? `✅ ${platform} vinculado. Te enviamos un mensaje de bienvenida.`
                : `✅ ${platform} registrado. La conexión con el agente se activará cuando OpenClaw esté disponible.`,
        });

    } catch (error: any) {
        console.error('[link-channel] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
