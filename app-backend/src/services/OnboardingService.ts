import { supabaseAdmin } from '@/lib/supabase';
import { AgentService } from './AgentService';
import { PerformanceService } from './PerformanceService';

/**
 * OnboardingService: Orchestrates the "First Mile" of the Enterprise experience.
 */
export const OnboardingService = {

    /**
     * Deploys a complete "Unicorn Swarm" for a new workspace.
     */
    async deployEnterpriseSwarm(payload: {
        workspaceName: string;
        ownerId: string;
        marketplaceAgentIds: string[]; // Initial agents to hire
    }) {
        // 1. Create Workspace
        const { data: workspace, error: wsError } = await supabaseAdmin
            .from('workspaces')
            .insert([{
                name: payload.workspaceName,
                user_id: payload.ownerId,
                owner_id: payload.ownerId,
                subscription_tier: 'enterprise'
            }])
            .select()
            .single();

        if (wsError) throw wsError;

        // 2. Create Default Team (The Command Center)
        const { data: team, error: teamError } = await supabaseAdmin
            .from('teams')
            .insert([{
                workspace_id: workspace.id,
                name: 'Mission Control',
                emoji: '🛰️',
                color: '#4F46E5'
            }])
            .select()
            .single();

        if (teamError) throw teamError;

        // 3. Hire Swarm Agents from Marketplace
        const hiredAgents = [];
        for (const mId of payload.marketplaceAgentIds) {
            const agent = await AgentService.hireFromMarketplace(workspace.id, mId);

            // Link agent to the team
            await supabaseAdmin.from('team_agents').insert([{
                team_id: team.id,
                agent_config_id: (await supabaseAdmin.from('agent_configs').select('id').eq('agent_id', agent.id).single()).data?.id
            }]);

            hiredAgents.push(agent);
        }

        // 4. Initialize Gamification Hitos
        await PerformanceService.initDefaultHitos(workspace.id);

        // 5. Initialize Usage Tracking
        await supabaseAdmin.from('workspace_usage_stats').insert([{
            workspace_id: workspace.id,
            tokens_this_month: 0,
            usd_this_month: 0.0
        }]);

        return {
            workspace,
            team,
            agents: hiredAgents
        };
    },

    /**
     * Completes the V3 Onboarding flow.
     */
    async completeOnboardingV3(payload: {
        userId: string;
        profileType: 'vendedor' | 'estudiante' | 'freelancer';
        teamType: 'solo' | 'team';
        autonomyLevel: 'observer' | 'operator' | 'executor';
        agentName: string;
    }) {
        // 1. Get or Create Default Workspace
        let { data: workspace, error: wsError } = await supabaseAdmin
            .from('workspaces')
            .select('*')
            .eq('user_id', payload.userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (wsError && wsError.code !== 'PGRST116') throw wsError;

        if (!workspace) {
            const { data: newWs, error: createWsError } = await supabaseAdmin
                .from('workspaces')
                .insert([{
                    name: payload.profileType === 'estudiante' ? 'Mi Universidad' : 'Mi Negocio',
                    user_id: payload.userId,
                    owner_id: payload.userId,
                    subscription_tier: 'standard'
                }])
                .select()
                .single();
            if (createWsError) throw createWsError;
            workspace = newWs;
        }

        // 2. Create the specialized Agent
        const agentData = {
            vendedor: { role: 'Sales Specialist', emoji: '💼', description: 'Experto en cotizaciones y seguimiento.' },
            estudiante: { role: 'Academic Assistant', emoji: '📚', description: 'Organizador de estudios y tareas.' },
            freelancer: { role: 'Project Manager', emoji: '🎨', description: 'Gestor de proyectos y facturación.' }
        }[payload.profileType];

        const { data: agent, error: agentError } = await supabaseAdmin
            .from('agents')
            .insert([{
                workspace_id: workspace.id,
                name: payload.agentName,
                role: agentData.role,
                emoji: agentData.emoji,
                description: agentData.description,
                active: true,
                status: 'idle',
                maturity_mode: payload.autonomyLevel
            }])
            .select()
            .single();

        if (agentError) throw agentError;

        // 3. Set User Perspective based on profile
        const isDirector = payload.teamType === 'team' || payload.profileType === 'vendedor';
        const { error: pError } = await supabaseAdmin
            .from('user_perspectives')
            .upsert({
                user_id: payload.userId,
                workspace_id: workspace.id,
                mode: isDirector ? 'director' : 'focus',
                sections: {
                    cockpit: true, tasks: true, projects: true, documents: true, settings: true,
                    incubadora: payload.profileType !== 'estudiante',
                    admin: payload.profileType === 'vendedor',
                    studio: false, marketplace: false
                },
                features: {
                    can_create_projects: true,
                    can_approve_hitl: true,
                    can_configure_agents: true,
                    shadow_chat_enabled: true
                },
                ui: {
                    simplified_nav: !isDirector,
                    default_view: payload.profileType === 'estudiante' ? 'tasks' : 'cockpit'
                }
            }, { onConflict: 'user_id, workspace_id' });

        if (pError) throw pError;

        // 4. Seed Profile-Specific Data (Nodes, Tasks, Twins)
        await this.seedProfileData({
            userId: payload.userId,
            workspaceId: workspace.id,
            agentId: agent.id,
            profileType: payload.profileType
        });

        return {
            workspace_id: workspace.id,
            agent_id: agent.id,
            redirect_to: payload.profileType === 'estudiante' ? '/tasks' : '/cockpit'
        };
    },

    /**
     * Seeds a workspace with initial nodes and tasks based on a profile template.
     */
    async seedProfileData(payload: {
        userId: string;
        workspaceId: string;
        agentId: string;
        profileType: 'vendedor' | 'estudiante' | 'freelancer';
    }) {
        const templates = {
            vendedor: {
                node: { name: 'Comercial & Ventas', type: 'TACTICAL' as const },
                tasks: [
                    { title: 'Definir Pitch de Ventas', priority: 'high' },
                    { title: 'Cargar Lista de Leads Q1', priority: 'medium' },
                    { title: 'Configurar CRM de Seguimiento', priority: 'high' }
                ]
            },
            estudiante: {
                node: { name: 'Gestión Académica', type: 'STRATEGIC' as const },
                tasks: [
                    { title: 'Cargar Horario Semestral', priority: 'high' },
                    { title: 'Listado de Evaluaciones Próximas', priority: 'high' },
                    { title: 'Organizar Carpeta de Apuntes', priority: 'medium' }
                ]
            },
            freelancer: {
                node: { name: 'Operaciones de Proyectos', type: 'TACTICAL' as const },
                tasks: [
                    { title: 'Plantilla de Cotización Estándar', priority: 'high' },
                    { title: 'Revisar Pendientes de Facturación', priority: 'medium' },
                    { title: 'Actualizar Portfolio de Clientes', priority: 'medium' }
                ]
            }
        };

        const template = templates[payload.profileType];

        // 1. Create Main Node
        const { data: node, error: nodeError } = await supabaseAdmin
            .from('org_nodes')
            .insert([{
                workspace_id: payload.workspaceId,
                name: template.node.name,
                node_type: template.node.type,
                level_depth: 1,
                metadata: { description: `Nodo principal para ${payload.profileType}` }
            }])
            .select()
            .single();

        if (nodeError) throw nodeError;

        // 2. Create Initial Tasks (Documents)
        const tasksToInsert = template.tasks.map(t => ({
            workspace_id: payload.workspaceId,
            user_id: payload.userId,
            title: t.title,
            type: 'task',
            status: 'PENDING',
            priority: t.priority,
            progress: 0,
            content: { note: 'Tarea inicial generada por el sistema.' }
        }));

        const { error: tasksError } = await supabaseAdmin
            .from('documents')
            .insert(tasksToInsert);

        if (tasksError) throw tasksError;

        // 3. Create AI Twin Link
        const { error: twinError } = await supabaseAdmin
            .from('ai_twins')
            .insert([{
                user_id: payload.userId,
                agent_id: payload.agentId,
                workspace_id: payload.workspaceId,
                mirroring_mode: 'OBSERVER',
                resonance_score: 50,
                learning_logs: []
            }]);

        if (twinError) throw twinError;

        return { success: true, node_id: node.id };
    }
};
