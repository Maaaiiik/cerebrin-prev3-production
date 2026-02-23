import { genAI } from '@/lib/gemini';
import { supabaseAdmin } from '@/lib/supabase';

export interface MirroringInsight {
    category: 'profesional' | 'estudios' | 'clientes' | 'agenda' | 'proveedores' | 'proyectos' | 'ideas';
    content: any;
    summary: string;
}

export const MirroringService = {
    /**
     * Group logs by session/topic, summarize them with AI, and save to agent_memory.
     */
    async summarizeLogsToMemory(twinId: string): Promise<{ count: number }> {
        // 1. Fetch Twin Data
        const { data: twin, error: twinError } = await supabaseAdmin
            .from('ai_twins')
            .select('*, agents(*)')
            .eq('id', twinId)
            .single();

        if (twinError || !twin) throw twinError || new Error('Twin not found');

        const logs = twin.learning_logs || [];
        if (!Array.isArray(logs) || logs.length < 5) {
            console.log(`[MirroringService] Not enough logs (${logs.length}) to summarize for twin ${twinId}`);
            return { count: 0 };
        }

        // 2. Prepare AI Summarization
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { temperature: 0.1 },
            systemInstruction: `Eres un procesador de Memoria Episódica para un sistema de Multi-Agentes.
            Tu tarea es analizar un log de acciones de un usuario y extraer "Patrones de Comportamiento" o "Conocimiento Clave".
            
            FORMATO DE SALIDA (JSON):
            {
              "insights": [
                {
                  "category": "profesional | estudios | clientes | agenda | proveedores | proyectos | ideas",
                  "summary": "Breve descripción del patrón aprendido",
                  "content": { "metadata_adicional": "debe ser útil para un prompt" }
                }
              ]
            }
            
            REGLAS:
            1. Solo extrae cosas que parezcan repetitivas o decisiones importantes.
            2. Ignora ruidos o errores de sistema.
            3. El contenido debe ser accionable por otro agente.`
        });

        const prompt = `Analiza los siguientes logs del usuario:
        ${JSON.stringify(logs.slice(-20))} // Analizamos los últimos 20 logs
        
        Extrae hasta 3 insights clave que el Clon de este usuario deba recordar.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return { count: 0 };

            const { insights } = JSON.parse(jsonMatch[0]) as { insights: MirroringInsight[] };

            // 3. Insert into agent_memory
            let insertedCount = 0;
            for (const insight of insights) {
                const { error: memoryError } = await supabaseAdmin
                    .from('agent_memory')
                    .insert({
                        user_id: twin.user_id,
                        agent_id: twin.agent_id,
                        category: insight.category,
                        memory_type: 'episodic',
                        content: {
                            ...insight.content,
                            ai_summary: insight.summary,
                            source_twin_id: twinId,
                            resonance_at_capture: twin.resonance_score
                        }
                    });

                if (!memoryError) insertedCount++;
            }

            // 4. Optionally clear old logs or mark as processed
            // (For now, we just keep them, but in production we'd prune)

            return { count: insertedCount };
        } catch (err) {
            console.error('[MirroringService] Error processing AI response:', err);
            return { count: 0 };
        }
    }
};
