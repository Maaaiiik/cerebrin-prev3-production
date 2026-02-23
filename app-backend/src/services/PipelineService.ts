import { supabaseAdmin } from '@/lib/supabase';
import { OpenClawService, AGENT_ROLES, type AgentRole, type Platform } from './OpenClawService';
import { streamChat } from '@/lib/ai-router';
import type { AgentContext } from '@/lib/gemini';

// ─────────────────────────────────────────────────────────────────────────────
// PipelineService — Multi-Role Orchestrator
//
// Manages the lifecycle of a "pipeline" where ONE agent assumes different
// roles sequentially to complete a complex task.
//
// Flow: Director → Investigador → Escritor → Revisor → Director → Deliver
// ─────────────────────────────────────────────────────────────────────────────

export type PipelineStatus = 'created' | 'planning' | 'in_progress' | 'review' | 'approval' | 'completed' | 'failed';
export type TaskPhase = 'research' | 'writing' | 'review' | 'final_review' | 'delivery';

export interface PipelineStep {
    phase: TaskPhase;
    role: string;           // Role ID from AGENT_ROLES
    task_title: string;
    input: string;         // Input context for this step
    output?: string;       // Result of this step
    status: 'pending' | 'running' | 'completed' | 'failed' | 'needs_revision';
    started_at?: string;
    completed_at?: string;
    quality_score?: number; // 1-10, set by reviewer
}

export interface Pipeline {
    id: string;
    project_id: string;
    workspace_id: string;
    user_id: string;
    agent_id: string;
    original_request: string;
    current_phase: TaskPhase;
    current_role: string;
    steps: PipelineStep[];
    status: PipelineStatus;
    final_output?: string;
    platform: Platform;
    created_at: string;
}

// ─── Pipeline Service ────────────────────────────────────────────────────────

export const PipelineService = {

    /**
     * Creates a new pipeline from a user's request.
     * The Director role analyzes the request and creates the project + tasks.
     */
    async createPipeline(payload: {
        workspaceId: string;
        userId: string;
        agentId: string;
        request: string;
        platform: Platform;
    }): Promise<Pipeline> {

        // 1. Create the Project in Cerebrin
        const { data: project, error: projectError } = await supabaseAdmin
            .from('documents')
            .insert({
                workspace_id: payload.workspaceId,
                user_id: payload.userId,
                title: `📋 ${payload.request.slice(0, 80)}`,
                type: 'project',
                status: 'En progreso',
                priority: 'high',
                progress_pct: 0,
                metadata: {
                    source: 'pipeline',
                    original_request: payload.request,
                    platform: payload.platform,
                    agent_id: payload.agentId,
                },
            })
            .select()
            .single();

        if (projectError) throw projectError;

        // 2. Define the pipeline steps
        const steps: PipelineStep[] = [
            {
                phase: 'research',
                role: 'investigador',
                task_title: 'Investigación y recopilación de datos',
                input: payload.request,
                status: 'pending',
            },
            {
                phase: 'writing',
                role: 'escritor',
                task_title: 'Redacción y storytelling',
                input: '', // Will be filled with research output
                status: 'pending',
            },
            {
                phase: 'review',
                role: 'revisor',
                task_title: 'Revisión de calidad',
                input: '',
                status: 'pending',
            },
            {
                phase: 'final_review',
                role: 'director',
                task_title: 'Revisión final del Director',
                input: '',
                status: 'pending',
            },
            {
                phase: 'delivery',
                role: 'director',
                task_title: 'Entrega de resultados',
                input: '',
                status: 'pending',
            },
        ];

        // 3. Create subtasks in Cerebrin for each step
        for (const step of steps) {
            await supabaseAdmin
                .from('documents')
                .insert({
                    workspace_id: payload.workspaceId,
                    user_id: payload.userId,
                    title: `${AGENT_ROLES[step.role]?.name || '🤖'} ${step.task_title}`,
                    type: 'task',
                    status: 'PENDING',
                    priority: step.phase === 'research' ? 'high' : 'medium',
                    progress_pct: 0,
                    metadata: {
                        parent_project_id: project.id,
                        pipeline_phase: step.phase,
                        pipeline_role: step.role,
                        source: 'pipeline',
                    },
                });
        }

        // 4. Store pipeline state
        const pipeline: Pipeline = {
            id: `pipe_${Date.now()}`,
            project_id: project.id,
            workspace_id: payload.workspaceId,
            user_id: payload.userId,
            agent_id: payload.agentId,
            original_request: payload.request,
            current_phase: 'research',
            current_role: 'investigador',
            steps,
            status: 'created',
            platform: payload.platform,
            created_at: new Date().toISOString(),
        };

        // Store pipeline in activity_feed for tracking
        await supabaseAdmin
            .from('activity_feed')
            .insert({
                workspace_id: payload.workspaceId,
                agent_id: payload.agentId,
                user_id: payload.userId,
                action_type: 'pipeline_created',
                title: `Pipeline creado: ${payload.request.slice(0, 60)}`,
                description: `${steps.length} fases · Roles: ${steps.map(s => AGENT_ROLES[s.role]?.name).join(' → ')}`,
                metadata: { pipeline },
            });

        return pipeline;
    },

    /**
     * Executes the current step of a pipeline using the assigned role.
     * Returns the output text from the AI.
     */
    async executeStep(pipeline: Pipeline): Promise<string> {
        const stepIndex = pipeline.steps.findIndex(s => s.status === 'pending');
        if (stepIndex === -1) throw new Error('No pending steps in pipeline');

        const step = pipeline.steps[stepIndex];
        const role = AGENT_ROLES[step.role];

        // Mark step as running
        step.status = 'running';
        step.started_at = new Date().toISOString();

        // Build input context — chain from previous steps
        let contextInput = step.input || '';
        if (stepIndex > 0) {
            const previousOutputs = pipeline.steps
                .slice(0, stepIndex)
                .filter(s => s.output)
                .map(s => `--- Resultado de ${AGENT_ROLES[s.role]?.name} ---\n${s.output}`)
                .join('\n\n');
            contextInput = `PEDIDO ORIGINAL: ${pipeline.original_request}\n\n${previousOutputs}\n\nTU TAREA: ${step.task_title}`;
        }

        // Build agent context for the AI Router
        const agentCtx: AgentContext = {
            workspaceId: pipeline.workspace_id,
            userId: pipeline.user_id,
            agentName: role.name,
            agentPersona: role.system_prompt,
            hitlLevel: 'plan_only',
            maturityMode: 'operator',
            resonanceScore: 70,
            systemPrompt: role.system_prompt,
        };

        // Execute using AI Router (streams but we collect full output)
        let fullOutput = '';
        try {
            for await (const chunk of streamChat(agentCtx, contextInput, [])) {
                fullOutput += chunk;
            }
        } catch (error) {
            console.error(`[Pipeline] Step ${step.phase} failed:`, error);
            step.status = 'failed';
            throw error;
        }

        // Save the output
        step.output = fullOutput;
        step.status = 'completed';
        step.completed_at = new Date().toISOString();

        // Update the task in Cerebrin as completed
        await supabaseAdmin
            .from('documents')
            .update({
                status: 'Hecho',
                progress_pct: 100,
                metadata: {
                    pipeline_phase: step.phase,
                    pipeline_role: step.role,
                    output_preview: fullOutput.slice(0, 500),
                    completed_at: step.completed_at,
                },
            })
            .eq('workspace_id', pipeline.workspace_id)
            .eq('type', 'task')
            .filter('metadata->>pipeline_phase', 'eq', step.phase)
            .filter('metadata->>parent_project_id', 'eq', pipeline.project_id);

        // Update project progress
        const completedSteps = pipeline.steps.filter(s => s.status === 'completed').length;
        const progressPct = Math.round((completedSteps / pipeline.steps.length) * 100);

        await supabaseAdmin
            .from('documents')
            .update({ progress_pct: progressPct })
            .eq('id', pipeline.project_id);

        // Log activity
        await supabaseAdmin
            .from('activity_feed')
            .insert({
                workspace_id: pipeline.workspace_id,
                agent_id: pipeline.agent_id,
                action_type: 'pipeline_step_completed',
                title: `${role.name} completó: ${step.task_title}`,
                description: fullOutput.slice(0, 200),
                metadata: {
                    pipeline_id: pipeline.id,
                    phase: step.phase,
                    role: step.role,
                    quality_score: step.quality_score,
                },
            });

        return fullOutput;
    },

    /**
     * Runs the FULL pipeline end-to-end.
     * Each step feeds into the next. Notifies the user at each transition.
     */
    async runFullPipeline(pipeline: Pipeline): Promise<Pipeline> {
        pipeline.status = 'in_progress';

        for (let i = 0; i < pipeline.steps.length; i++) {
            const step = pipeline.steps[i];
            if (step.status !== 'pending') continue;

            const role = AGENT_ROLES[step.role];
            pipeline.current_phase = step.phase;
            pipeline.current_role = step.role;

            // Notify user about the current phase
            if (pipeline.platform !== 'web') {
                await OpenClawService.notifyProgress(
                    pipeline.user_id,
                    pipeline.platform,
                    `${role.name} está trabajando en: *${step.task_title}*\n⏳ Esto puede tomar unos minutos...`
                );
            }

            // Execute step
            try {
                await this.executeStep(pipeline);
            } catch (error) {
                pipeline.status = 'failed';
                console.error(`[Pipeline] Failed at step ${i}:`, error);

                if (pipeline.platform !== 'web') {
                    await OpenClawService.notifyProgress(
                        pipeline.user_id,
                        pipeline.platform,
                        `❌ Hubo un error en la fase *${step.task_title}*. Revisando...`
                    );
                }
                return pipeline;
            }

            // Special handling for REVIEWER — check quality score
            if (step.phase === 'review' && step.output) {
                const qualityMatch = step.output.match(/score.*?(\d+)/i);
                const score = qualityMatch ? parseInt(qualityMatch[1]) : 7;
                step.quality_score = score;

                if (score < 6) {
                    // Send back to writer for revision
                    step.status = 'needs_revision';
                    const writerStep = pipeline.steps.find(s => s.phase === 'writing');
                    if (writerStep) {
                        writerStep.status = 'pending';
                        writerStep.input = `REVISIÓN NECESARIA (Score: ${score}/10)\n\nFeedback del revisor:\n${step.output}\n\nTexto original:\n${writerStep.output}`;
                        writerStep.output = undefined;
                        i = pipeline.steps.indexOf(writerStep) - 1; // Go back to writer
                    }
                    continue;
                }
            }
        }

        // Pipeline completed — prepare for delivery
        pipeline.status = 'approval';
        pipeline.final_output = pipeline.steps
            .filter(s => s.phase === 'writing' || s.phase === 'final_review')
            .map(s => s.output)
            .filter(Boolean)
            .join('\n\n');

        // Create an approval request (HITL)
        await supabaseAdmin
            .from('agent_approval_queue')
            .insert({
                workspace_id: pipeline.workspace_id,
                agent_id: pipeline.agent_id,
                user_id: pipeline.user_id,
                action_type: 'pipeline_delivery',
                action_title: `📋 Resultado: ${pipeline.original_request.slice(0, 60)}`,
                action_description: `Pipeline completado · ${pipeline.steps.length} fases · Listo para entrega`,
                action_payload: {
                    pipeline_id: pipeline.id,
                    project_id: pipeline.project_id,
                    final_output: pipeline.final_output?.slice(0, 5000),
                    quality_score: pipeline.steps.find(s => s.phase === 'review')?.quality_score,
                },
                status: 'pending',
                priority: 'normal',
            });

        // Notify user to approve
        if (pipeline.platform !== 'web') {
            await OpenClawService.notifyProgress(
                pipeline.user_id,
                pipeline.platform,
                `✅ *Pipeline completado*\n\n📋 _${pipeline.original_request.slice(0, 80)}_\n\nEl resultado está listo. Revísalo en tu panel de Cerebrin y aprueba para generar el PDF y enviarlo.\n\n👉 Responde *"aprobar"* para confirmar o *"revisar"* para ver detalles.`
            );
        }

        return pipeline;
    },

    /**
     * Called when user approves the pipeline result.
     * Triggers PDF generation and delivery automations.
     */
    async approvePipeline(pipeline: Pipeline): Promise<void> {
        pipeline.status = 'completed';

        // Update project as completed
        await supabaseAdmin
            .from('documents')
            .update({
                status: 'Hecho',
                progress_pct: 100,
            })
            .eq('id', pipeline.project_id);

        // Update approval queue
        await supabaseAdmin
            .from('agent_approval_queue')
            .update({
                status: 'approved',
                resolved_at: new Date().toISOString(),
            })
            .eq('workspace_id', pipeline.workspace_id)
            .filter('action_payload->>pipeline_id', 'eq', pipeline.id);

        // Trigger n8n webhook for PDF generation (if configured)
        const N8N_WEBHOOK_URL = process.env.N8N_PDF_WEBHOOK_URL;
        if (N8N_WEBHOOK_URL) {
            try {
                await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        pipeline_id: pipeline.id,
                        project_id: pipeline.project_id,
                        user_id: pipeline.user_id,
                        workspace_id: pipeline.workspace_id,
                        title: pipeline.original_request,
                        content: pipeline.final_output,
                        platform: pipeline.platform,
                        deliver_to: pipeline.platform, // 'whatsapp' | 'telegram'
                    }),
                });
                console.log('[Pipeline] PDF webhook triggered successfully');
            } catch (error) {
                console.error('[Pipeline] PDF webhook failed:', error);
            }
        }

        // Log completion
        await supabaseAdmin
            .from('activity_feed')
            .insert({
                workspace_id: pipeline.workspace_id,
                agent_id: pipeline.agent_id,
                action_type: 'pipeline_completed',
                title: `✅ Pipeline completado y aprobado`,
                description: pipeline.original_request,
                metadata: {
                    pipeline_id: pipeline.id,
                    project_id: pipeline.project_id,
                    total_steps: pipeline.steps.length,
                    quality_score: pipeline.steps.find(s => s.phase === 'review')?.quality_score,
                },
            });
    },
};
