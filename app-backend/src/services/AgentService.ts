import { API_ROUTES } from "@/lib/constants";
import { AgentApprovalRequest } from "@/types/supabase";
import { supabaseAdmin } from "@/lib/supabase";

export class AgentService {
    /**
     * Hires an agent from the marketplace and clones its configuration into the workspace.
     */
    static async hireFromMarketplace(workspaceId: string, marketplaceAgentId: string) {
        // 1. Fetch Marketplace Agent
        const { data: marketAgent, error: marketError } = await supabaseAdmin
            .from('marketplace_agents')
            .select('*')
            .eq('id', marketplaceAgentId)
            .single();

        if (marketError || !marketAgent) throw new Error("Marketplace agent not found");

        // 2. Create Workspace Agent
        const { data: newAgent, error: agentError } = await supabaseAdmin
            .from('workspace_agents')
            .insert([{
                workspace_id: workspaceId,
                name: marketAgent.name,
                system_prompt: marketAgent.base_config?.system_prompt || '',
                personality: marketAgent.base_config?.personality || {},
                agent_type: 'SPECIALIST'
            }])
            .select()
            .single();

        if (agentError) throw agentError;

        // 3. Create Agent Config
        const { error: configError } = await supabaseAdmin
            .from('agent_configs')
            .insert([{
                agent_id: newAgent.id,
                workspace_id: workspaceId,
                operation_mode: marketAgent.base_config?.operation_mode || 'GUIDED',
                permissions: marketAgent.base_config?.permissions || {},
                scope: marketAgent.base_config?.scope || {},
                limits: marketAgent.base_config?.limits || {},
                integrations: marketAgent.base_config?.integrations || []
            }]);

        if (configError) throw configError;

        return newAgent;
    }

    /**
     * Submits a proposed action for Human-In-The-Loop approval.
     */
    static async requestAction(payload: {
        agent_id: string;
        workspace_id: string;
        action_type: AgentApprovalRequest['action_type'];
        entity_type: AgentApprovalRequest['entity_type'];
        proposed_data: any;
        target_id?: string;
    }) {
        const response = await fetch(API_ROUTES.AGENTS.REQUEST, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to submit agent request");
        }

        return response.json();
    }

    /**
     * Tests an agent integration (e.g. n8n or external API).
     */
    static async testIntegration(integrationId: string) {
        const response = await fetch(API_ROUTES.AGENTS.TEST_INTEGRATION, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ integrationId }),
        });

        return response.json();
    }
}
