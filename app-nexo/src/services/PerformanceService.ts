import { supabaseAdmin } from '@/lib/supabase';

/**
 * PerformanceService: Manages the gamification engine.
 * Records points, tracks standings, and validates hitos (milestones).
 */
export const PerformanceService = {

    /**
     * Awards points to a team/agent/user for a specific hito.
     */
    async awardPoints(params: {
        workspaceId: string;
        teamId?: string;
        agentId?: string;
        userId?: string;
        hitoName: string;
        reason?: string;
        metadata?: any;
    }) {
        // 1. Get hito configuration
        const { data: hito } = await supabaseAdmin
            .from('hitos_config')
            .select('id, points_value')
            .eq('workspace_id', params.workspaceId)
            .eq('name', params.hitoName)
            .single();

        if (!hito) {
            console.warn(`Hito ${params.hitoName} not configured for workspace ${params.workspaceId}`);
            return null;
        }

        // 2. Insert into ledger
        const { data: entry, error } = await supabaseAdmin
            .from('performance_ledger')
            .insert([{
                workspace_id: params.workspaceId,
                team_id: params.teamId,
                agent_config_id: params.agentId,
                user_id: params.userId,
                hito_id: hito.id,
                points: hito.points_value,
                reason: params.reason || `Achieved milestone: ${params.hitoName}`,
                metadata: params.metadata || {}
            }]);

        if (error) throw error;
        return entry;
    },

    /**
     * Fetches real-time standings for the "Strategic Race" leaderboard.
     */
    async getLeaderboard(workspaceId: string) {
        const { data, error } = await supabaseAdmin
            .from('team_standings')
            .select(`
        total_pts,
        milestones_reached,
        current_rank,
        team:team_id (name)
      `)
            .eq('workspace_id', workspaceId)
            .order('total_pts', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Initializes default hitos for a new enterprise workspace.
     */
    async initDefaultHitos(workspaceId: string) {
        const defaults = [
            { name: 'SYNERGY_COLLABORATION', points_value: 100, category: 'SYNERGY', description: 'Agent-to-Agent collaboration via MCP' },
            { name: 'EFFICIENCY_GOAL', points_value: 500, category: 'EFFICIENCY', description: 'Reducing TCO monthly target' },
            { name: 'RESONANCE_CONTRIBUTION', points_value: 200, category: 'QUALITY', description: 'Recording a validated lesson learned' }
        ];

        const { error } = await supabaseAdmin
            .from('hitos_config')
            .insert(defaults.map(h => ({ ...h, workspace_id: workspaceId })));

        if (error) throw error;
    }
};
