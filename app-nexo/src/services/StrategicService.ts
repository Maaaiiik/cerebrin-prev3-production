import { supabaseAdmin } from '@/lib/supabase';
import { PerformanceService } from './PerformanceService';

/**
 * StrategicService: Core intelligence and optimization layer.
 * Implements Contextual Resonance, TCO Shield, and RAG logic.
 */
export const StrategicService = {

    // --- TCO Shield (Cost Guardian) ---
    /**
     * Validates if an action is within budget and doesn't look like an infinite loop.
     */
    async checkCostGuard(workspaceId: string, agentId?: string): Promise<{ allowed: boolean; reason?: string }> {
        // 1. Get current usage
        const { data: usage } = await supabaseAdmin
            .from('workspace_usage_stats')
            .select('*')
            .eq('workspace_id', workspaceId)
            .single();

        // 2. Get rules
        const { data: rules } = await supabaseAdmin
            .from('cost_guardian_rules')
            .select('*')
            .eq('workspace_id', workspaceId)
            .eq('is_active', true);

        if (!rules || rules.length === 0) return { allowed: true };

        // 3. Simple enforcement (Monthly limits)
        for (const rule of rules) {
            if (usage) {
                if (usage.tokens_this_month >= rule.max_tokens_per_month) {
                    return { allowed: false, reason: `TCO Shield: Token limit (${rule.max_tokens_per_month}) reached for this workspace.` };
                }
                if (usage.usd_this_month >= rule.max_usd_per_month) {
                    return { allowed: false, reason: `TCO Shield: USD budget ($${rule.max_usd_per_month}) exceeded for this workspace.` };
                }
            }
        }

        return { allowed: true };
    },

    /**
     * Records usage (tokens and cost) for a workspace.
     */
    async recordUsage(workspaceId: string, tokens: number, costUsd: number) {
        const { error } = await supabaseAdmin.rpc('increment_usage', {
            p_workspace_id: workspaceId,
            p_tokens: tokens,
            p_usd: costUsd
        });

        // Fallback if the RPC doesn't exist yet (updates directly)
        if (error) {
            await supabaseAdmin
                .from('workspace_usage_stats')
                .update({
                    tokens_this_month: tokens, // Note: This is simplified, should be incremental
                    usd_this_month: costUsd,
                    updated_at: new Date().toISOString()
                })
                .eq('workspace_id', workspaceId);
        }
    },

    // --- Contextual Resonance (Memory) ---
    /**
     * Stores a "lesson learned" or contextual insight for the workspace.
     */
    async recordResonance(workspaceId: string, topic: string, content: string, agentId?: string) {
        const { data, error } = await supabaseAdmin
            .from('context_resonance')
            .insert([{
                workspace_id: workspaceId,
                agent_config_id: agentId,
                topic,
                content,
                metadata: { source: 'agent_execution', date: new Date().toISOString() }
            }]);

        if (error) throw error;

        // Award Points for high-quality contribution
        await PerformanceService.awardPoints({
            workspaceId,
            agentId,
            hitoName: 'RESONANCE_CONTRIBUTION',
            reason: `Recorded strategic insight on topic: ${topic}`
        });

        return data;
    },

    /**
     * Retrieves relevant resonances based on a topic (Keyword Fallback).
     */
    async queryResonance(workspaceId: string, topic: string) {
        const { data, error } = await supabaseAdmin
            .from('context_resonance')
            .select('*')
            .eq('workspace_id', workspaceId)
            .ilike('topic', `%${topic}%`)
            .limit(5);

        if (error) throw error;
        return data;
    },

    /**
     * Retrieves relevant resonances based on conceptual similarity (True Semantic Search).
     */
    async querySemanticResonance(workspaceId: string, embedding: number[], threshold: number = 0.7, count: number = 5) {
        const { data, error } = await supabaseAdmin.rpc('match_resonance', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: count,
            p_workspace_id: workspaceId
        });

        if (error) {
            console.error("Semantic search failed:", error);
            return [];
        }
        return data;
    },

    // --- Semantic Search (RAG Bridge) ---
    /**
     * Searches documents by meaning (Simulated via keyword search for this phase).
     */
    async searchKnowledge(workspaceId: string, query: string) {
        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('id, title, content, doc_category')
            .eq('workspace_id', workspaceId)
            .ilike('content', `%${query}%`)
            .limit(10);

        if (error) throw error;
        return data;
    }
};
