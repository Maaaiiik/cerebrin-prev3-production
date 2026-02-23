import { supabaseAdmin } from '@/lib/supabase';

/**
 * TieredMemoryService: Optimizes AI memory costs.
 * Implements a Hot/Warm/Cold strategy to minimize context window usage.
 */
export const TieredMemoryService = {

    /**
     * Retrieves context for an agent, optimized by tiers.
     * Only pulls 'COLD' memory if it's explicitly relevant.
     */
    async getOptimizedContext(workspaceId: string, agentId: string) {
        // 1. Always pull HOT/WARM memory (Low/Medium cost, high relevance)
        const { data: recentResonance } = await supabaseAdmin
            .from('context_resonance')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('agent_config_id', agentId)
            .in('memory_tier', ['HOT', 'WARM'])
            .order('created_at', { ascending: false })
            .limit(10);

        // 2. Logic: If task is complex, pull a summary of COLD memory
        // (In production, this could be a pre-summarized archive)
        return recentResonance || [];
    },

    /**
     * Archives old memory to the 'COLD' tier to reduce daily processing cost.
     */
    async archiveOldMemory(workspaceId: string, daysThreshold: number = 30) {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

        const { error } = await supabaseAdmin
            .from('context_resonance')
            .update({ memory_tier: 'COLD' })
            .eq('workspace_id', workspaceId)
            .lt('last_accessed_at', thresholdDate.toISOString())
            .neq('memory_tier', 'COLD');

        if (error) throw error;
    },

    /**
     * Records a 'Mirror Lesson' (Cognitive Pattern)
     */
    async recordMirrorLesson(workspaceId: string, userId: string, agentId: string, pattern: any) {
        const { error } = await supabaseAdmin
            .from('context_resonance')
            .insert([{
                workspace_id: workspaceId,
                agent_config_id: agentId,
                topic: `MIRROR_PATTERN_${userId}`,
                content: JSON.stringify(pattern),
                memory_tier: 'HOT', // Patterns are high priority
                metadata: { type: 'cognitive_mirroring', user_id: userId }
            }]);

        if (error) throw error;
    }
};
