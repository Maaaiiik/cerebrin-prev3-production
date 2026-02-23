import { genAI } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';

export interface OrgNodeSuggestion {
    name: string;
    type: 'STRATEGIC' | 'TACTICAL' | 'OPERATIONAL';
    level: number;
    description: string;
    suggested_agents: string[];
    children?: OrgNodeSuggestion[];
}

export const ArchitectService = {
    /**
     * Analyzes user description and generates a suggested organizational tree.
     */
    async designOrganization(userIntent: string): Promise<{ nodes: OrgNodeSuggestion[], summary: string }> {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
            systemInstruction: `Eres "The Architect", un consultor experto en diseño organizacional y automatización con IA.
            Tu misión es transformar el "caos" del usuario en un mapa jerárquico de Nodos de Organización (org_nodes).
            
            FORMATO DE SALIDA (JSON EXACTO):
            {
              "summary": "Breve análisis de la estructura sugerida",
              "nodes": [
                {
                  "name": "Nombre claro del nodo",
                  "type": "STRATEGIC | TACTICAL | OPERATIONAL",
                  "level": 0-4,
                  "description": "Por qué es necesario este nodo",
                  "suggested_agents": ["Rol de Agente IA sugerido (ej: Marketing Specialist)"],
                  "children": [...]
                }
              ]
            }
            
            REGLAS:
            1. El nivel 0 debe ser la Raíz (CEO/Owner).
            2. El nivel 1 son las Gerencias/Áreas principales.
            3. Sé audaz pero realista. Para pequeñas empresas, no crees más de 3 niveles.`
        });

        const prompt = `El usuario describe su negocio así: "${userIntent}"
        Genera una estructura sugerida para clonar esta empresa en Cerebrin.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('[ArchitectService] Error parsing AI response:', error);
        }

        return {
            summary: "No se pudo generar una estructura automática. Por favor describe tu empresa con más detalle.",
            nodes: []
        };
    },

    /**
     * Persists the suggested structure to the database.
     */
    async deployStructure(workspaceId: string, nodes: OrgNodeSuggestion[], parentId?: string) {
        for (const node of nodes) {
            const { data: newNode, error: nodeError } = await supabaseAdmin
                .from('org_nodes')
                .insert([{
                    workspace_id: workspaceId,
                    parent_node_id: parentId,
                    name: node.name,
                    node_type: node.type,
                    level_depth: node.level,
                    metadata: { description: node.description, suggested_agents: node.suggested_agents }
                }])
                .select()
                .single();

            if (nodeError) throw nodeError;

            if (node.children && node.children.length > 0) {
                await this.deployStructure(workspaceId, node.children, newNode.id);
            }
        }
    },

    /**
     * Calculates and updates the resonance score for an AI Twin based on its observation logs.
     * Higher resonance means the twin has "learned" more from the user.
     */
    async calculateResonanceScore(twinId: string): Promise<number> {
        const { data: twin, error: fetchError } = await supabaseAdmin
            .from('ai_twins')
            .select('*')
            .eq('id', twinId)
            .single();

        if (fetchError || !twin) throw fetchError || new Error('Twin not found');

        const logs = twin.learning_logs || [];
        if (!Array.isArray(logs) || logs.length === 0) return twin.resonance_score;

        // Simple Heuristic: 
        // 1. Base score from volume of logs (up to 40 points)
        // 2. Bonus for variety of actions (up to 40 points)
        // 3. Multiplier for recency (last log within 24h = 1.2x)

        const volumeScore = Math.min(40, logs.length * 2);

        const uniqueActions = new Set(logs.map(l => l.action_type)).size;
        const varietyScore = Math.min(40, uniqueActions * 10);

        let finalScore = volumeScore + varietyScore;

        // Recency check
        const lastLog = logs[logs.length - 1];
        if (lastLog && lastLog.timestamp) {
            const lastTs = new Date(lastLog.timestamp).getTime();
            const now = Date.now();
            if (now - lastTs < 24 * 60 * 60 * 1000) {
                finalScore *= 1.2;
            }
        }

        // Clamp between 0 and 100
        const clampedScore = Math.min(100, Math.max(0, Math.round(finalScore)));

        // Update DB
        await supabaseAdmin
            .from('ai_twins')
            .update({ resonance_score: clampedScore })
            .eq('id', twinId);

        return clampedScore;
    },

    /**
     * Generates a dynamic system prompt for an AI Twin based on its resonance and memory.
     */
    async getMirroringPrompt(twinId: string): Promise<string> {
        const { data: twin, error } = await supabaseAdmin
            .from('ai_twins')
            .select('*, agents(*), agent_memory(*)')
            .eq('id', twinId)
            .single();

        if (error || !twin) return "Eres un asistente básico.";

        const resonance = twin.resonance_score || 0;
        const memory = (twin as any).agent_memory || [];

        let prompt = `Eres el Clon Digital (AI Twin) de un usuario en Cerebrin.
        Tu nivel de RESONANCIA actual es del ${resonance}%. 
        ${resonance > 80 ? 'Actúa con total confianza, conoces perfectamente los patrones del usuario.' : 'Sé cauteloso y observa antes de proponer cambios drásticos.'}
        
        CONTEXTO EPISÓDICO (Lo que has aprendido):
        ${memory.map((m: any) => `- [${m.category}] ${m.content.ai_summary}`).join('\n')}
        
        INSTRUCCIONES DE IDENTIDAD:
        1. Tu objetivo es reducir la carga cognitiva del usuario "espejeando" su estilo.
        2. Si el usuario te pide hacer algo, consulta tu CONTEXTO EPISÓDICO primero.
        3. Siempre mantén el tono profesional y eficiente de la plataforma.`;

        return prompt;
    }
};
