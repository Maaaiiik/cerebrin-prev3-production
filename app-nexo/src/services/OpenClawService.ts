import { supabaseAdmin } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// OpenClawService — Comunicación bidireccional con OpenClaw Gateway
// ─────────────────────────────────────────────────────────────────────────────

const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:3100';
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY || '';

export interface OpenClawMessage {
    id: string;
    from: string;           // Phone number or Telegram user ID
    platform: 'whatsapp' | 'telegram' | 'web';
    text: string;
    media?: {
        type: 'image' | 'document' | 'audio' | 'video';
        url: string;
        mime_type: string;
        filename?: string;
    };
    timestamp: string;
    metadata?: Record<string, any>;
}

export type Platform = 'whatsapp' | 'telegram' | 'web';

export interface OpenClawOutbound {
    to: string;
    platform: Platform;
    text: string;
    media_url?: string;
    reply_to?: string;
}

export interface AgentRole {
    id: string;
    name: string;
    system_prompt: string;
    skills: string[];       // Skill names available to this role
    temperature: number;
    max_tokens: number;
}

// ─── Predefined Roles ────────────────────────────────────────────────────────

export const AGENT_ROLES: Record<string, AgentRole> = {
    director: {
        id: 'director',
        name: '🧠 Director',
        system_prompt: `Eres el Director del equipo de agentes IA de Cerebrin. Tu rol es:
1. Recibir instrucciones del usuario
2. Descomponer el pedido en un PROYECTO con TAREAS y SUBTAREAS
3. Asignar cada tarea al ROL ESPECIALISTA adecuado
4. Coordinar la ejecución secuencial de las tareas
5. Revisar el resultado final antes de entregarlo al usuario
6. Marcar tareas como completadas y entregar el resultado

REGLAS:
- Siempre crea un plan antes de ejecutar
- Cada tarea debe tener un rol asignado (investigador, escritor, revisor)
- Si el resultado no es satisfactorio, devuélvelo al rol correspondiente
- Comunica el progreso al usuario en cada paso
- Responde SIEMPRE en español`,
        skills: ['task_management', 'role_switching', 'status_reporting'],
        temperature: 0.3,
        max_tokens: 2048,
    },

    investigador: {
        id: 'investigador',
        name: '🔬 Investigador',
        system_prompt: `Eres el Investigador del equipo de Cerebrin. Tu rol es:
1. Buscar información en internet sobre el tema asignado
2. Extraer datos relevantes, estadísticas y hechos clave
3. Organizar la información en un formato estructurado
4. Citar SIEMPRE las fuentes de información
5. Identificar tendencias y patrones

REGLAS:
- Busca información de múltiples fuentes
- Prioriza datos recientes (últimos 12 meses)
- Separa hechos de opiniones
- Incluye estadísticas numéricas cuando sea posible
- Entrega un documento de investigación estructurado
- Responde SIEMPRE en español`,
        skills: ['web_search', 'data_extraction', 'source_citation'],
        temperature: 0.2,
        max_tokens: 4096,
    },

    escritor: {
        id: 'escritor',
        name: '✍️ Escritor',
        system_prompt: `Eres el Escritor del equipo de Cerebrin. Tu rol es:
1. Tomar la información del Investigador y consolidarla
2. Aplicar técnicas de storytelling profesional
3. Crear documentos con estructura clara y narrativa fluida
4. Adaptar el tono al público objetivo
5. Incluir conclusiones y recomendaciones accionables

REGLAS:
- Usa párrafos cortos y secciones claras
- Incluye bullet points para datos clave
- Añade un resumen ejecutivo al inicio
- El documento debe ser auto-explicativo
- Mantén un tono profesional pero accesible
- Responde SIEMPRE en español`,
        skills: ['storytelling', 'document_formatting', 'executive_summary'],
        temperature: 0.6,
        max_tokens: 4096,
    },

    revisor: {
        id: 'revisor',
        name: '🔎 Revisor',
        system_prompt: `Eres el Revisor de Calidad del equipo de Cerebrin. Tu rol es:
1. Revisar el documento del Escritor
2. Verificar coherencia, gramática y estilo
3. Validar que los datos citados sean correctos
4. Evaluar si cumple con el pedido original del usuario
5. Sugerir mejoras o devolver con correcciones

CHECKLIST DE REVISIÓN:
- [ ] ¿El documento responde la pregunta original?
- [ ] ¿La estructura es clara y lógica?
- [ ] ¿Los datos y cifras son correctos?
- [ ] ¿El tono es apropiado para el público?
- [ ] ¿Hay errores de gramática u ortografía?
- [ ] ¿Las conclusiones son accionables?

REGLAS:
- Si hay problemas graves, marca como "NECESITA CORRECCIÓN"
- Si es aceptable, marca como "APROBADO"
- Incluye un score de calidad (1-10)
- Responde SIEMPRE en español`,
        skills: ['quality_check', 'fact_verification', 'grammar_review'],
        temperature: 0.1,
        max_tokens: 2048,
    },
};

// ─── OpenClaw Service ────────────────────────────────────────────────────────

export const OpenClawService = {

    /**
     * Send a message TO the user via OpenClaw Gateway
     */
    async sendMessage(outbound: OpenClawOutbound): Promise<{ success: boolean; messageId?: string }> {
        try {
            const response = await fetch(`${OPENCLAW_GATEWAY_URL}/api/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENCLAW_API_KEY}`,
                },
                body: JSON.stringify(outbound),
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('[OpenClaw] Send error:', error);
                return { success: false };
            }

            const result = await response.json();
            return { success: true, messageId: result.id };
        } catch (error) {
            console.error('[OpenClaw] Connection error:', error);
            return { success: false };
        }
    },

    /**
     * Send a progress update to the user
     */
    async notifyProgress(userId: string, platform: Platform, message: string) {
        // Lookup user's contact info
        const { data: perspective } = await supabaseAdmin
            .from('user_perspectives')
            .select('phone')
            .eq('user_id', userId)
            .single();

        if (!perspective?.phone) {
            console.warn('[OpenClaw] No phone found for user:', userId);
            return;
        }

        return this.sendMessage({
            to: perspective.phone,
            platform,
            text: message,
        });
    },

    /**
     * Send the final deliverable to the user
     */
    async deliverResult(payload: {
        userId: string;
        platform: Platform;
        projectName: string;
        resultText: string;
        pdfUrl?: string;
        suggestedMessage?: string;
    }) {
        const { data: perspective } = await supabaseAdmin
            .from('user_perspectives')
            .select('phone')
            .eq('user_id', payload.userId)
            .single();

        if (!perspective?.phone) return;

        // Send the result text
        await this.sendMessage({
            to: perspective.phone,
            platform: payload.platform,
            text: `✅ *${payload.projectName}*\n\n${payload.resultText.slice(0, 3000)}`,
        });

        // Send PDF if available
        if (payload.pdfUrl) {
            await this.sendMessage({
                to: perspective.phone,
                platform: payload.platform,
                text: `📄 Aquí tienes el informe en PDF:`,
                media_url: payload.pdfUrl,
            });
        }

        // Send suggested forwarding message
        if (payload.suggestedMessage) {
            await this.sendMessage({
                to: perspective.phone,
                platform: payload.platform,
                text: `💡 *Mensaje sugerido para reenviar:*\n\n_${payload.suggestedMessage}_\n\n_(Copia y envía a quien corresponda)_`,
            });
        }
    },

    /**
     * Get the role definition for a specific role ID
     */
    getRole(roleId: string): AgentRole {
        return AGENT_ROLES[roleId] || AGENT_ROLES.director;
    },
};
