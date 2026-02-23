import { NextRequest, NextResponse } from 'next/server';

/**
 * 🌉 PRE-V3 CHAT BRIDGE
 * Este endpoint es el puente entre el Front-end Minimalista y n8n.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, audio, userId = 'default_user' } = body;

        if (!message && !audio) {
            return NextResponse.json({ error: 'Cuerpo vacío' }, { status: 400 });
        }

        // URL del Webhook Maestro de n8n definido en docker-compose
        const n8nWebhookUrl = process.env.N8N_MASTER_WEBHOOK_URL || 'http://localhost:5678/webhook/master-orchestrator';

        // Enviamos la petición a n8n para que procese el "Cerebro" y escriba en Google Sheets
        const response = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                raw_input: message,
                audio_payload: audio, // Base64 si existe
                timestamp: new Date().toISOString(),
            }),
        });

        if (!response.ok) {
            throw new Error(`n8n error: ${response.statusText}`);
        }

        const n8nData = await response.json();

        // Estructura de respuesta esperada desde n8n (según BACKEND_INFRA_PREV3.md)
        // n8nData: { text: string, action_card?: { title, url, actions } }

        return NextResponse.json({
            success: true,
            reply: n8nData.text || "He procesado tu solicitud.",
            actionCard: n8nData.action_card || null
        });

    } catch (error: any) {
        console.error('[PRE-V3 BRIDGE ERROR]:', error.message);
        return NextResponse.json({
            success: false,
            reply: "Ups, tuve un problema conectando con mi orquestador. ¿Podrías intentar de nuevo?",
            error: error.message
        }, { status: 500 });
    }
}
