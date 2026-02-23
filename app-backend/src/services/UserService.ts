import { supabaseAdmin } from '@/lib/supabase';

/**
 * UserService: Handles all operations related to user profiles and perspectives.
 */
export const UserService = {

    /**
     * Gets the current perspective for a user in a specific workspace.
     */
    async getPerspective(userId: string, workspaceId: string) {
        const { data, error } = await supabaseAdmin
            .from('user_perspectives')
            .select('*')
            .eq('user_id', userId)
            .eq('workspace_id', workspaceId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Marks onboarding as completed for a user in a workspace.
     */
    async markOnboardingCompleted(userId: string, workspaceId: string, data: any = {}) {
        const { error } = await supabaseAdmin
            .from('user_perspectives')
            .update({
                onboarding_completed: true,
                onboarding_data: data,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('workspace_id', workspaceId);

        if (error) throw error;
        return { success: true };
    },

    /**
     * Updates the user's perspective.
     */
    async updatePerspective(userId: string, workspaceId: string, updates: any) {
        const { data, error } = await supabaseAdmin
            .from('user_perspectives')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('workspace_id', workspaceId);

        if (error) throw error;
        return data;
    },

    /**
     * Resets the perspective to a predefined preset.
     */
    async resetToPreset(userId: string, workspaceId: string, mode: 'director' | 'focus') {
        const isDirector = mode === 'director';

        const preset = {
            mode,
            sections: isDirector ? {
                cockpit: true, tasks: true, projects: true, incubadora: true,
                studio: true, documents: true, admin: true, settings: true, marketplace: true
            } : {
                cockpit: false, tasks: true, projects: false, incubadora: false,
                studio: false, documents: true, admin: false, settings: true, marketplace: false
            },
            features: isDirector ? {
                can_create_projects: true, can_approve_hitl: true, can_configure_agents: true,
                can_see_analytics: true, can_see_financials: true, shadow_chat_enabled: false
            } : {
                can_create_projects: false, can_approve_hitl: false, can_configure_agents: false,
                can_see_analytics: false, can_see_financials: false, shadow_chat_enabled: true
            },
            ui: isDirector ? {
                simplified_nav: false, hide_metrics: false, default_view: "cockpit"
            } : {
                simplified_nav: true, hide_metrics: true, default_view: "tasks"
            }
        };

        const { data, error } = await supabaseAdmin
            .from('user_perspectives')
            .upsert({
                user_id: userId,
                workspace_id: workspaceId,
                ...preset,
                onboarding_completed: false,
                subscription_plan: 'free',
                weekly_token_limit: 50000,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, workspace_id' });

        if (error) throw error;
        return data;
    }
};
