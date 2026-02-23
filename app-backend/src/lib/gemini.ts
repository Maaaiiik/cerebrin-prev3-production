import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai'

// ─────────────────────────────────────────────
// Gemini Client — Cerebrin MVP
// Modelo base: gemini-2.0-flash (gratis en AI Studio)
// ─────────────────────────────────────────────

const apiKey = process.env.GEMINI_API_KEY || 'dummy_key_for_build_purposes';
const genAI = new GoogleGenerativeAI(apiKey);

// Configuración por defecto para el agente conversacional
const DEFAULT_CONFIG: GenerationConfig = {
    temperature: 0.7,       // Creativo pero consistente
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 2048,
}

// Configuración para tareas de extracción/análisis (más determinista)
const ANALYTICAL_CONFIG: GenerationConfig = {
    temperature: 0.1,
    topP: 0.9,
    topK: 20,
    maxOutputTokens: 1024,
}

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type AgentMode = 'observer' | 'operator' | 'executor'
export type TaskType = 'chat' | 'plan' | 'extract' | 'document' | 'summarize'

export interface AgentContext {
    workspaceId: string
    userId: string
    agentName: string
    agentPersona?: string
    hitlLevel: 'full_manual' | 'plan_only' | 'result_only' | 'autonomous'
    maturityMode: AgentMode
    resonanceScore: number
    systemPrompt?: string
}

export interface GeminiMessage {
    role: 'user' | 'model'
    parts: { text: string }[]
}

export interface AgentResponse {
    text: string
    requiresApproval: boolean
    actionType?: string
    actionPayload?: Record<string, unknown>
    confidence: number
    tokensUsed?: number
}

// ─────────────────────────────────────────────
// System Prompt Builder
// Construye el prompt base del agente según su contexto
// ─────────────────────────────────────────────

export function buildSystemPrompt(ctx: AgentContext): string {
    const modeInstructions: Record<AgentMode, string> = {
        observer: `Estás en modo OBSERVER. Aún estás aprendiendo los patrones de trabajo del usuario. 
Haz preguntas clarificadoras y sugiere posibilidades sin comprometerte a ejecutar nada. 
Siempre termina con una pregunta de confirmación.`,
        operator: `Estás en modo OPERATOR. Puedes proponer planes de acción concretos y esperar aprobación.
Cuando identifiques una tarea clara, presenta un plan estructurado con pasos numerados y pide aprobación antes de proceder.`,
        executor: `Estás en modo EXECUTOR. Tienes alto nivel de confianza calibrado con el usuario.
Puedes actuar directamente en tareas rutinarias, pero siempre informa lo que hiciste.
Para acciones irreversibles (enviar emails, borrar archivos) siempre pide confirmación explícita.`,
    }

    const hitlInstructions: Record<AgentContext['hitlLevel'], string> = {
        full_manual: 'IMPORTANTE: Antes de cada subtarea, presenta qué vas a hacer y espera aprobación explícita.',
        plan_only: 'IMPORTANTE: Presenta el plan completo primero y espera aprobación. Una vez aprobado, ejecuta sin interrupciones.',
        result_only: 'IMPORTANTE: Trabaja de forma autónoma y solo presenta el resultado final.',
        autonomous: 'IMPORTANTE: Actúa directamente en tareas rutinarias pre-aprobadas. Informa el resultado brevemente.',
    }

    return `Eres ${ctx.agentName}, un asistente de IA personal de Cerebrin.

${ctx.systemPrompt || 'Ayudas al usuario a ser más productivo delegando tareas repetitivas.'}

MODO ACTUAL: ${ctx.maturityMode.toUpperCase()} (Resonance Score: ${ctx.resonanceScore}/100)
${modeInstructions[ctx.maturityMode]}

NIVEL DE AUTONOMÍA:
${hitlInstructions[ctx.hitlLevel]}

FORMATO DE RESPUESTA:
- Sé conciso y directo. No uses jerga técnica innecesaria.
- Cuando propongas un plan, usa listas numeradas.
- Cuando necesites información adicional, haz UNA sola pregunta a la vez.
- Responde siempre en el mismo idioma que el usuario.

WORKSPACE ID: ${ctx.workspaceId}
`
}

// ─────────────────────────────────────────────
// Chat Session (mantiene historial de conversación)
// ─────────────────────────────────────────────

export function createChatSession(
    ctx: AgentContext,
    history: GeminiMessage[] = []
) {
    const model: GenerativeModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: DEFAULT_CONFIG,
        systemInstruction: buildSystemPrompt(ctx),
    })

    return model.startChat({ history })
}

// ─────────────────────────────────────────────
// Streaming Chat — para el Shadow Chat en tiempo real
// Devuelve un AsyncGenerator que va yielding chunks de texto
// ─────────────────────────────────────────────

export async function* streamAgentResponse(
    ctx: AgentContext,
    message: string,
    history: GeminiMessage[] = []
): AsyncGenerator<string> {
    const model: GenerativeModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: DEFAULT_CONFIG,
        systemInstruction: buildSystemPrompt(ctx),
    })

    const chat = model.startChat({ history })
    const result = await chat.sendMessageStream(message)

    for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) yield text
    }
}

// ─────────────────────────────────────────────
// Single-shot tasks (no necesitan historial)
// Ideal para: resumir, extraer datos, generar documentos
// ─────────────────────────────────────────────

export async function runAgentTask(
    taskType: TaskType,
    prompt: string,
    context?: string
): Promise<AgentResponse> {
    const model: GenerativeModel = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: taskType === 'extract' ? ANALYTICAL_CONFIG : DEFAULT_CONFIG,
    })

    const fullPrompt = context
        ? `CONTEXTO DISPONIBLE:\n${context}\n\n---\n\nTAREA:\n${prompt}`
        : prompt

    const result = await model.generateContent(fullPrompt)
    const response = result.response
    const text = response.text()

    // Estima si la respuesta requiere aprobación según palabras clave
    const requiresApproval = /enviar|publicar|eliminar|borrar|modificar|actualizar|crear|guardar/i.test(prompt)

    return {
        text,
        requiresApproval,
        confidence: 0.85,
        tokensUsed: response.usageMetadata?.totalTokenCount,
    }
}

// ─────────────────────────────────────────────
// Multimodal Task (Images / PDFs)
// ─────────────────────────────────────────────

export async function runMultimodalTask(
    prompt: string,
    files: Array<{ mimeType: string; data: string }> // data as base64
): Promise<AgentResponse> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: ANALYTICAL_CONFIG,
    })

    const promptParts = [
        prompt,
        ...files.map(f => ({
            inlineData: {
                data: f.data,
                mimeType: f.mimeType,
            },
        })),
    ]

    const result = await model.generateContent(promptParts)
    const response = result.response
    const text = response.text()

    return {
        text,
        requiresApproval: false,
        confidence: 0.9,
        tokensUsed: response.usageMetadata?.totalTokenCount,
    }
}

// ─────────────────────────────────────────────
// Plan Generator — genera plan estructurado de subtareas
// ─────────────────────────────────────────────

export async function generateAgentPlan(
    ctx: AgentContext,
    userRequest: string,
    availableTools: string[] = []
): Promise<{
    plan: Array<{ step: number; title: string; description: string; requiresApproval: boolean }>
    summary: string
    estimatedMinutes: number
}> {
    const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { ...ANALYTICAL_CONFIG, maxOutputTokens: 1024 },
        systemInstruction: buildSystemPrompt(ctx),
    })

    const prompt = `El usuario solicita: "${userRequest}"
  
Herramientas disponibles: ${availableTools.length > 0 ? availableTools.join(', ') : 'búsqueda web, redacción de documentos, gestión de tareas'}

Genera un plan de acción en formato JSON exacto:
{
  "summary": "Descripción breve de qué va a hacer el agente",
  "estimatedMinutes": número,
  "plan": [
    {
      "step": 1,
      "title": "Título corto",
      "description": "Qué hace exactamente en este paso",
      "requiresApproval": true/false
    }
  ]
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    try {
        // Extraer JSON de la respuesta (Gemini a veces agrega markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
    } catch {
        // Si falla el parse, devolver estructura mínima
    }

    return {
        summary: userRequest,
        estimatedMinutes: 5,
        plan: [{ step: 1, title: 'Procesar solicitud', description: userRequest, requiresApproval: true }],
    }
}

export { genAI }
