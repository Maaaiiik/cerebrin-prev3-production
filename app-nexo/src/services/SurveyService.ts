import { supabaseAdmin } from '@/lib/supabase';

/**
 * SurveyService: Manages system-wide feedback and NPS intelligence.
 */
export const SurveyService = {

    /**
     * Fetches active surveys for a specific workspace tier.
     */
    async getActiveSurveys(tier: string = 'all') {
        const { data, error } = await supabaseAdmin
            .from('system_surveys')
            .select('*')
            .eq('is_active', true)
            .or(`target_tier.eq.all,target_tier.eq.${tier}`);

        if (error) throw error;
        return data;
    },

    /**
     * Submits a survey response.
     */
    async submitResponse(payload: {
        survey_id: string;
        workspace_id: string;
        user_id?: string;
        answer: any;
        score: number;
    }) {
        const { data, error } = await supabaseAdmin
            .from('survey_responses')
            .insert([payload]);

        if (error) throw error;
        return data;
    },

    /**
     * Calculates the Net Promoter Score (NPS) for a workspace or the whole system.
     */
    async calculateNPS(workspaceId?: string) {
        let query = supabaseAdmin.from('survey_responses').select('score');

        if (workspaceId) {
            query = query.eq('workspace_id', workspaceId);
        }

        const { data, error } = await query;
        if (error || !data) throw error || new Error("No survey data");

        const total = data.length;
        if (total === 0) return 0;

        const promoters = data.filter(r => r.score >= 9).length;
        const detractors = data.filter(r => r.score <= 6).length;

        // NPS Formula: % Promoters - % Detractors
        const nps = ((promoters / total) * 100) - ((detractors / total) * 100);
        return Math.round(nps);
    }
};
