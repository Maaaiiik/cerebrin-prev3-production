import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PipelineService } from '@/services/PipelineService';
import { OpenClawService, type OpenClawMessage, type Platform } from '@/services/OpenClawService';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/openclaw
//
// Receives incoming messages from OpenClaw Gateway (WhatsApp/Telegram).
// This is the entry point for ALL user interactions via messaging platforms.
//
// OpenClaw sends a POST with the user's message, and this endpoint:
// 1. Identifies the user by phone/telegram ID
// 2. Routes to the appropriate handler (new pipeline, approve, etc.)
// 3. Responds via OpenClaw Gateway
// ─────────────────────────────────────────────────────────────────────────────

const WEBHOOK_SECRET = process.env.OPENCLAW_WEBHOOK_SECRET || 'openclaw-webhook-key';

// In-memory pipeline state (in production → Redis or DB)
const activePipelines = new Map<string, any>();

export async function POST(req: NextRequest) {
    try {
        // 1. Verify webhook authenticity
        const authHeader = req.headers.get('x-webhook-secret') || req.headers.get('authorization');
        if (authHeader !== `Bearer ${WEBHOOK_SECRET}` && authHeader !== WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
        }

        // 2. Parse incoming message
        const body = await req.json() as OpenClawMessage;
        const { from, platform, text, media, timestamp } = body;

        if (!from || !text) {
            return NextResponse.json({ error: 'Missing required fields: from, text' }, { status: 400 });
        }

        console.log(`[Webhook] ${platform} message from ${from}: ${text.slice(0, 100)}`);

        // 3. Identify the user by phone number or telegram ID
        const user = await identifyUser(from, platform);

        if (!user) {
            // Unknown user — prompt them to register
            await OpenClawService.sendMessage({
                to: from,
                platform,
                text: `👋 ¡Hola! No encontré tu cuenta en Cerebrin.\n\nPara empezar, regístrate en https://cerebrin.app y vincula tu ${platform === 'whatsapp' ? 'WhatsApp' : 'Telegram'} en Configuración.\n\n¿Necesitas ayuda? Escribe *"ayuda"*.`,
            });
            return NextResponse.json({ status: 'user_not_found', handled: true });
        }

        // 4. Get active agent for this user
        const { data: agent } = await supabaseAdmin
            .from('agents')
            .select('id, name, emoji, hitl_level, maturity_mode')
            .eq('owner_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const agentId = agent?.id || 'default';
        const agentName = agent ? `${agent.emoji || '🤖'} ${agent.name}` : '🤖 Cerebrin';

        // 5. Get workspace
        const { data: workspace } = await supabaseAdmin
            .from('workspaces')
            .select('id')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!workspace) {
            await OpenClawService.sendMessage({
                to: from,
                platform,
                text: `⚠️ No tienes un workspace configurado. Completa el onboarding en https://cerebrin.app primero.`,
            });
            return NextResponse.json({ status: 'no_workspace', handled: true });
        }

        // 6. Route based on message intent
        const lowerText = text.toLowerCase().trim();

        // ── Quick commands ────────────────────────────────────────────────
        if (lowerText === 'estado' || lowerText === 'status') {
            return await handleStatusCommand(from, platform, user.id, workspace.id, agentName);
        }

        if (lowerText === 'aprobar' || lowerText === 'approve') {
            return await handleApproveCommand(from, platform, user.id, workspace.id);
        }

        if (lowerText === 'tareas' || lowerText === 'tasks') {
            return await handleTasksCommand(from, platform, user.id, workspace.id);
        }

        if (lowerText === 'ayuda' || lowerText === 'help') {
            return await handleHelpCommand(from, platform, agentName);
        }

        // ── Check for media (document upload) ─────────────────────────────
        if (media) {
            return await handleMediaUpload(from, platform, user.id, workspace.id, media, text);
        }

        // ── Check for active pipeline ─────────────────────────────────────
        const activePipelineKey = `${user.id}_${workspace.id}`;
        const activePipeline = activePipelines.get(activePipelineKey);

        if (activePipeline && activePipeline.status === 'in_progress') {
            await OpenClawService.sendMessage({
                to: from,
                platform,
                text: `⏳ Ya tienes un pipeline en progreso:\n\n📋 _${activePipeline.original_request.slice(0, 80)}_\n\n${activePipeline.current_role} está trabajando...\n\nEscribe *"estado"* para ver el progreso.`,
            });
            return NextResponse.json({ status: 'pipeline_active', handled: true });
        }

        // ── New pipeline request ──────────────────────────────────────────
        // If the message looks like a substantial request, create a pipeline
        if (text.length > 20 || lowerText.startsWith('crear') || lowerText.startsWith('necesito') || lowerText.startsWith('quiero')) {

            await OpenClawService.sendMessage({
                to: from,
                platform,
                text: `🧠 *${agentName}* — Entendido!\n\nEstoy creando un plan para:\n_"${text.slice(0, 120)}"_\n\n⏳ Descomponiendo en tareas...`,
            });

            // Create and run the pipeline (async — don't block the webhook response)
            const pipeline = await PipelineService.createPipeline({
                workspaceId: workspace.id,
                userId: user.id,
                agentId: agentId,
                request: text,
                platform,
            });

            activePipelines.set(activePipelineKey, pipeline);

            // Run pipeline in background (non-blocking)
            PipelineService.runFullPipeline(pipeline)
                .then(result => {
                    activePipelines.set(activePipelineKey, result);
                })
                .catch(error => {
                    console.error('[Webhook] Pipeline execution error:', error);
                    pipeline.status = 'failed';
                    activePipelines.set(activePipelineKey, pipeline);
                });

            return NextResponse.json({
                status: 'pipeline_started',
                pipeline_id: pipeline.id,
                project_id: pipeline.project_id,
                handled: true,
            });
        }

        // ── Simple chat (short messages, questions) ───────────────────────
        // For quick questions, use the AI directly without a full pipeline
        await handleSimpleChat(from, platform, user.id, workspace.id, agentId, agentName, text);

        return NextResponse.json({ status: 'chat_response', handled: true });

    } catch (error: any) {
        console.error('[Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ─── Helper: Identify user by phone/telegram ID ─────────────────────────────

async function identifyUser(contact: string, platform: string) {
    // Try to find user by phone in user_perspectives
    const { data } = await supabaseAdmin
        .from('user_perspectives')
        .select('user_id')
        .eq('phone', contact)
        .limit(1)
        .single();

    if (data) {
        return { id: data.user_id };
    }

    // Try metadata field (if phone is stored differently)
    const { data: byMeta } = await supabaseAdmin
        .from('user_perspectives')
        .select('user_id')
        .filter('metadata->>phone', 'eq', contact)
        .limit(1)
        .single();

    if (byMeta) {
        return { id: byMeta.user_id };
    }

    return null;
}

// ─── Handler: Status Command ─────────────────────────────────────────────────

async function handleStatusCommand(to: string, platform: Platform, userId: string, workspaceId: string, agentName: string) {
    // Get pending tasks
    const { data: tasks } = await supabaseAdmin
        .from('documents')
        .select('title, status, progress_pct, priority')
        .eq('workspace_id', workspaceId)
        .eq('type', 'task')
        .neq('status', 'Hecho')
        .order('created_at', { ascending: false })
        .limit(5);

    // Get pending approvals
    const { count: pendingApprovals } = await supabaseAdmin
        .from('agent_approval_queue')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending');

    const taskList = (tasks || [])
        .map((t: any) => `  ${t.priority === 'high' ? '🔴' : '🟡'} ${t.title} (${t.progress_pct}%)`)
        .join('\n');

    await OpenClawService.sendMessage({
        to,
        platform,
        text: `📊 *Estado de ${agentName}*\n\n` +
            `📋 *Tareas pendientes:* ${tasks?.length || 0}\n${taskList || '  ✅ No hay tareas pendientes'}\n\n` +
            `⏳ *Aprobaciones pendientes:* ${pendingApprovals || 0}\n\n` +
            `💡 Escribe *"tareas"* para ver todas o *"aprobar"* para revisar pendientes.`,
    });

    return NextResponse.json({ status: 'status_sent', handled: true });
}

// ─── Handler: Approve Command ────────────────────────────────────────────────

async function handleApproveCommand(to: string, platform: Platform, userId: string, workspaceId: string) {
    // Get oldest pending approval
    const { data: approval } = await supabaseAdmin
        .from('agent_approval_queue')
        .select('id, action_title, action_description, action_payload')
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

    if (!approval) {
        await OpenClawService.sendMessage({
            to,
            platform,
            text: `✅ No tienes aprobaciones pendientes. ¡Todo al día!`,
        });
        return NextResponse.json({ status: 'no_approvals', handled: true });
    }

    // Auto-approve the oldest pipeline
    if (approval.action_payload?.pipeline_id) {
        const pipelineKey = `${userId}_${workspaceId}`;
        const pipeline = activePipelines.get(pipelineKey);

        if (pipeline) {
            await PipelineService.approvePipeline(pipeline);
            activePipelines.delete(pipelineKey);

            await OpenClawService.sendMessage({
                to,
                platform,
                text: `✅ *Aprobado:* ${approval.action_title}\n\n🚀 Generando el entregable final...`,
            });
        }
    } else {
        // Simple approval
        await supabaseAdmin
            .from('agent_approval_queue')
            .update({ status: 'approved', resolved_at: new Date().toISOString() })
            .eq('id', approval.id);

        await OpenClawService.sendMessage({
            to,
            platform,
            text: `✅ *Aprobado:* ${approval.action_title}`,
        });
    }

    return NextResponse.json({ status: 'approved', handled: true });
}

// ─── Handler: Tasks Command ──────────────────────────────────────────────────

async function handleTasksCommand(to: string, platform: Platform, userId: string, workspaceId: string) {
    const { data: tasks } = await supabaseAdmin
        .from('documents')
        .select('title, status, priority, due_date')
        .eq('workspace_id', workspaceId)
        .eq('type', 'task')
        .order('created_at', { ascending: false })
        .limit(10);

    const statusEmoji: Record<string, string> = {
        'PENDING': '⬜',
        'Por hacer': '⬜',
        'En progreso': '🔵',
        'IN_PROGRESS': '🔵',
        'Hecho': '✅',
        'DONE': '✅',
    };

    const taskList = (tasks || [])
        .map((t: any, i: number) => `${i + 1}. ${statusEmoji[t.status] || '⬜'} ${t.title}`)
        .join('\n');

    await OpenClawService.sendMessage({
        to,
        platform,
        text: `📋 *Tus tareas (últimas 10):*\n\n${taskList || '✅ No tienes tareas'}\n\n💡 Para crear una nueva tarea, simplemente descríbela.`,
    });

    return NextResponse.json({ status: 'tasks_sent', handled: true });
}

// ─── Handler: Help Command ───────────────────────────────────────────────────

async function handleHelpCommand(to: string, platform: Platform, agentName: string) {
    await OpenClawService.sendMessage({
        to,
        platform,
        text: `🧠 *${agentName} — Comandos disponibles:*\n\n` +
            `📊 *estado* — Ver estado actual del agente\n` +
            `📋 *tareas* — Ver tus tareas pendientes\n` +
            `✅ *aprobar* — Aprobar el resultado pendiente\n` +
            `❓ *ayuda* — Ver este menú\n\n` +
            `*Para solicitar algo nuevo:*\n` +
            `Simplemente escribe lo que necesitas. Por ejemplo:\n` +
            `_"Necesito un informe sobre tendencias de IA en Chile"_\n\n` +
            `El agente creará un proyecto con tareas especializadas y te informará del progreso. 🚀`,
    });

    return NextResponse.json({ status: 'help_sent', handled: true });
}

// ─── Handler: Media Upload ───────────────────────────────────────────────────

async function handleMediaUpload(
    to: string, platform: Platform,
    userId: string, workspaceId: string,
    media: OpenClawMessage['media'], caption: string
) {
    if (!media) return NextResponse.json({ status: 'no_media' });

    // Save document reference in Cerebrin
    await supabaseAdmin
        .from('documents')
        .insert({
            workspace_id: workspaceId,
            user_id: userId,
            title: media.filename || `${media.type}_${Date.now()}`,
            type: 'external',
            status: 'Hecho',
            metadata: {
                source: platform,
                media_type: media.type,
                media_url: media.url,
                mime_type: media.mime_type,
                caption,
                uploaded_via: 'openclaw_webhook',
            },
        });

    await OpenClawService.sendMessage({
        to,
        platform,
        text: `✅ Documento recibido y guardado:\n📄 *${media.filename || 'Archivo'}*\n\n${caption ? `📝 _${caption}_` : ''}`,
    });

    return NextResponse.json({ status: 'media_saved', handled: true });
}

// ─── Handler: Simple Chat ────────────────────────────────────────────────────

async function handleSimpleChat(
    to: string, platform: Platform,
    userId: string, workspaceId: string,
    agentId: string, agentName: string, message: string
) {
    // For quick questions — use AI Router directly (no pipeline)
    const { streamChat } = await import('@/lib/ai-router');

    const agentCtx = {
        workspaceId,
        userId,
        agentName,
        hitlLevel: 'autonomous' as const,
        maturityMode: 'operator' as const,
        resonanceScore: 70,
    };

    let fullResponse = '';
    try {
        for await (const chunk of streamChat(agentCtx, message, [])) {
            fullResponse += chunk;
        }
    } catch {
        fullResponse = `Lo siento, hubo un error procesando tu mensaje. Intenta de nuevo en un momento.`;
    }

    // Truncate for WhatsApp (4096 char limit)
    const truncated = fullResponse.length > 4000
        ? fullResponse.slice(0, 3900) + '\n\n_(Respuesta truncada. Ver detalles en cerebrin.app)_'
        : fullResponse;

    await OpenClawService.sendMessage({
        to,
        platform,
        text: `${agentName}:\n\n${truncated}`,
    });
}
