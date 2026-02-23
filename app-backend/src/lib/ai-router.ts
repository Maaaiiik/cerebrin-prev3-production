import Groq from 'groq-sdk'
import {
    streamAgentResponse as geminiStream,
    runAgentTask as geminiTask,
    generateAgentPlan as geminiPlan,
    AgentContext,
    GeminiMessage,
    AgentResponse,
    TaskType,
} from './gemini'

// Re-export types so consumers only need to import from ai-router
export type { AgentContext, GeminiMessage, AgentResponse, TaskType } from './gemini'

// ─────────────────────────────────────────────
// AI Router — Cerebrin MVP
// Selecciona automáticamente el modelo según la tarea:
//   → Groq (Llama 3.1): tareas rápidas, clasificación, extracción
//   → Gemini Flash: chat, planes, generación de documentos
//
// Ambos son GRATIS en su tier gratuito.
// ─────────────────────────────────────────────

// Groq — ultra rápido, bueno para tareas simples
// Requiere GROQ_API_KEY y GROQ_ENABLED=true para activarse
const groqClient = (process.env.GROQ_API_KEY && process.env.GROQ_ENABLED === 'true')
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null

// Modelo Groq: Llama 3.1 70B (el mejor del plan gratuito)
const GROQ_MODEL = 'llama-3.1-8b-instant' // 8b = más rápido, gratuito

export type AIProvider = 'gemini' | 'groq' | 'auto'

// ─────────────────────────────────────────────
// Routing Logic
// Qué modelo usar según el tipo de tarea
// ─────────────────────────────────────────────
const TASK_ROUTING: Record<TaskType, AIProvider> = {
    chat: 'gemini',      // Conversación fluida → Gemini (mejor contexto largo)
    plan: 'gemini',      // Generación de planes → Gemini (mejor razonamiento)
    document: 'gemini',  // Generar documentos → Gemini (mejor redacción)
    extract: 'groq',     // Extraer datos estructurados → Groq (ultra rápido)
    summarize: 'groq',   // Resumir texto → Groq (eficiente y gratuito)
}

function selectProvider(taskType: TaskType, override?: AIProvider): AIProvider {
    if (override && override !== 'auto') return override
    if (!groqClient) return 'gemini' // Fallback si no hay key de Groq
    return TASK_ROUTING[taskType] ?? 'gemini'
}

// ─────────────────────────────────────────────
// Groq: Chat con streaming
// ─────────────────────────────────────────────
export async function* groqStreamChat(
    ctx: AgentContext,
    message: string,
    history: GeminiMessage[] = []
): AsyncGenerator<string> {
    if (!groqClient) throw new Error('GROQ_API_KEY no configurada')

    const systemPrompt = `Eres ${ctx.agentName}, un asistente de IA de Cerebrin.
Ayudas al usuario a ser más productivo. Sé conciso y directo.
Responde siempre en el mismo idioma del usuario.`

    // Convertir historial al formato OpenAI-compatible (que usa Groq)
    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({
            role: m.role === 'model' ? 'assistant' as const : 'user' as const,
            content: m.parts[0].text,
        })),
        { role: 'user', content: message },
    ]

    const stream = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
    })

    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) yield text
    }
}

// ─────────────────────────────────────────────
// Groq: Single-shot task (sin historial)
// ─────────────────────────────────────────────
export async function groqRunTask(
    prompt: string,
    systemPrompt?: string
): Promise<AgentResponse> {
    if (!groqClient) throw new Error('GROQ_API_KEY no configurada')

    const response = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
            { role: 'system', content: systemPrompt ?? 'Eres un asistente útil y conciso.' },
            { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.2, // Más determinista para extraction/summarize
    })

    const text = response.choices[0].message.content ?? ''
    const tokensUsed = response.usage?.total_tokens

    return {
        text,
        requiresApproval: false,
        confidence: 0.9,
        tokensUsed,
    }
}

// ─────────────────────────────────────────────
// UNIFIED ROUTER: streamChat
// La función principal que usa el Shadow Chat
// ─────────────────────────────────────────────
export async function* streamChat(
    ctx: AgentContext,
    message: string,
    history: GeminiMessage[] = [],
    providerOverride?: AIProvider
): AsyncGenerator<string> {
    const provider = selectProvider('chat', providerOverride)

    if (provider === 'groq' && groqClient) {
        yield* groqStreamChat(ctx, message, history)
    } else {
        yield* geminiStream(ctx, message, history)
    }
}

// ─────────────────────────────────────────────
// UNIFIED ROUTER: runTask
// Para tareas puntuales (extract, summarize, etc.)
// ─────────────────────────────────────────────
export async function runTask(
    taskType: TaskType,
    prompt: string,
    context?: string,
    providerOverride?: AIProvider
): Promise<AgentResponse> {
    const provider = selectProvider(taskType, providerOverride)

    if (provider === 'groq' && groqClient) {
        const fullPrompt = context
            ? `CONTEXTO:\n${context}\n\n---\n\nTAREA:\n${prompt}`
            : prompt
        return groqRunTask(fullPrompt)
    } else {
        return geminiTask(taskType, prompt, context)
    }
}

// ─────────────────────────────────────────────
// UNIFIED ROUTER: generatePlan
// Siempre usa Gemini (mejor razonamiento para planes)
// ─────────────────────────────────────────────
export { generateAgentPlan as generatePlan } from './gemini'

// ─────────────────────────────────────────────
// Estado del router (para el panel de admin)
// ─────────────────────────────────────────────
export function getRouterStatus(): {
    gemini: boolean
    groq: boolean
    enabled: boolean
    defaultProvider: AIProvider
} {
    return {
        gemini: !!process.env.GEMINI_API_KEY,
        groq: !!process.env.GROQ_API_KEY && !!groqClient,
        enabled: process.env.GEMINI_ENABLED === 'true',
        defaultProvider: groqClient ? 'auto' : 'gemini',
    }
}
