import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { streamChat, generatePlan, GeminiMessage, AgentContext } from '@/lib/ai-router'

// ─────────────────────────────────────────────
// POST /api/agent/chat
// El endpoint principal del Shadow Chat.
// Devuelve una Server-Sent Events (SSE) stream.
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { message, workspaceId, agentId, history = [], mode = 'chat' } = body

        if (!message || !workspaceId) {
            return new Response(
                JSON.stringify({ error: 'message y workspaceId son requeridos' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // ── KILL SWITCH ──────────────────────────────────────────────────────────
        // GEMINI_ENABLED=false → respuesta simulada, $0 en tokens, ideal para dev/QA
        // GEMINI_ENABLED=true  → llamada real a Gemini Flash
        if (process.env.GEMINI_ENABLED !== 'true') {
            const mockResponse = `👋 **[MODO SIMULADO — Sin costo]**\n\nRecibí tu mensaje: *"${message}"*\n\nEsta es una respuesta de prueba del agente. Cuando estés listo para activar Gemini, cambia \`GEMINI_ENABLED=true\` en tu \`.env.local\` y reinicia el servidor.\n\n¿En qué más puedo ayudarte?`

            const encoder = new TextEncoder()
            const words = mockResponse.split(' ')

            const stream = new ReadableStream({
                async start(controller) {
                    // Simular streaming palabra por palabra
                    for (const word of words) {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: word + ' ' })}\n\n`))
                        await new Promise(r => setTimeout(r, 30)) // ~30ms entre palabras
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                    controller.close()
                },
            })

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            })
        }
        // ── FIN KILL SWITCH ──────────────────────────────────────────────────────

        // Autenticación via Supabase
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader } } }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Sesión inválida' }), { status: 401 })
        }

        // Obtener configuración del agente desde Supabase
        let agentCtx: AgentContext = {
            workspaceId,
            userId: user.id,
            agentName: 'Mi Asistente',
            hitlLevel: 'plan_only',
            maturityMode: 'operator',
            resonanceScore: 50,
        }

        if (agentId) {
            const { data: agent } = await supabase
                .from('agents')
                .select('name, emoji, persona, hitl_level, maturity_mode, resonance_score, system_prompt')
                .eq('id', agentId)
                .eq('owner_id', user.id)
                .single()

            if (agent) {
                agentCtx = {
                    ...agentCtx,
                    agentName: `${agent.emoji ?? '🤖'} ${agent.name}`,
                    agentPersona: agent.persona,
                    hitlLevel: agent.hitl_level,
                    maturityMode: agent.maturity_mode,
                    resonanceScore: agent.resonance_score,
                    systemPrompt: agent.system_prompt,
                }
            }
        }

        // Modo PLAN — genera plan de subtareas antes de ejecutar
        if (mode === 'plan') {
            const plan = await generatePlan(agentCtx, message)

            // Si el HITL requiere aprobación del plan, guardar en approval queue
            if (agentCtx.hitlLevel === 'plan_only' || agentCtx.hitlLevel === 'full_manual') {
                await supabase.from('agent_approval_queue').insert({
                    agent_id: agentId,
                    workspace_id: workspaceId,
                    user_id: user.id,
                    action_type: 'execute_plan',
                    action_title: `Plan: ${plan.summary}`,
                    action_description: `${plan.plan.length} pasos · ~${plan.estimatedMinutes} min`,
                    action_payload: plan,
                    status: 'pending',
                    priority: 'normal',
                })
            }

            return new Response(JSON.stringify(plan), {
                headers: { 'Content-Type': 'application/json' },
            })
        }

        // Modo CHAT — streaming de respuesta en tiempo real (SSE)
        // Convierte el historial del frontend al formato de Gemini
        const geminiHistory: GeminiMessage[] = history.map(
            (msg: { role: string; content: string }) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            })
        )

        const encoder = new TextEncoder()
        let fullText = ''

        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of streamChat(agentCtx, message, geminiHistory)) {
                        fullText += chunk
                        // SSE format: "data: <chunk>\n\n"
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
                    }

                    // Al terminar, verificar si la respuesta requiere una aprobación
                    const requiresApproval =
                        /enviar|publicar|eliminar|borrar|modificar el archivo|crear en drive/i.test(fullText)

                    if (requiresApproval && agentId) {
                        const { data: approval } = await supabase
                            .from('agent_approval_queue')
                            .insert({
                                agent_id: agentId,
                                workspace_id: workspaceId,
                                user_id: user.id,
                                action_type: 'agent_action',
                                action_title: 'Acción propuesta por el agente',
                                action_description: fullText.slice(0, 200),
                                action_payload: { full_response: fullText, original_message: message },
                                status: 'pending',
                                priority: 'normal',
                            })
                            .select('id')
                            .single()

                        // Enviar el ID de aprobación para que el frontend muestre el ApprovalCard
                        controller.enqueue(
                            encoder.encode(
                                `data: ${JSON.stringify({
                                    done: true,
                                    requiresApproval: true,
                                    approvalId: approval?.id,
                                })}\n\n`
                            )
                        )
                    } else {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
                    }

                    // Incrementar el contador de tokens (background, no bloquea la respuesta)
                    const supabaseService = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!
                    )
                    // Estimación: ~4 chars por token
                    const estimatedTokens = Math.ceil((message.length + fullText.length) / 4)
                    await supabaseService.rpc('increment_workspace_usage', {
                        v_workspace_id: workspaceId,
                        v_user_id: user.id,
                        v_tokens: estimatedTokens,
                        v_cost_usd: estimatedTokens * 0.0000004, // Gemini Flash: $0.40/1M tokens
                        v_model: 'gemini-2.0-flash',
                    })
                } catch (error) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ error: 'Error procesando respuesta' })}\n\n`)
                    )
                } finally {
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no', // Necesario para Nginx/Vercel
            },
        })
    } catch (error) {
        console.error('[/api/agent/chat] Error:', error)
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
