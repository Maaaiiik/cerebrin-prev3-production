import { supabaseAdmin } from "./supabase";

/**
 * Common event types that can trigger external webhooks (n8n, etc.)
 */
export type AutomationEvent =
    | 'on_idea_created'
    | 'on_task_created'
    | 'on_status_change'
    | 'on_approval_required';

/**
 * Triggers configured webhooks for a given workspace/agent and event.
 */
export async function triggerAutomationWebhook(
    workspace_id: string,
    event: AutomationEvent,
    payload: any
) {
    try {
        // 1. Fetch agents in this workspace that have integrations for this event
        const { data: configs, error } = await supabaseAdmin
            .from("agent_configs")
            .select("integrations")
            .filter("integrations", "cs", `[{"enabled": true, "events": ["${event}"]}]`); // Contains selector

        if (error || !configs || configs.length === 0) return;

        for (const config of configs) {
            const activeIntegrations = config.integrations.filter(
                (i: any) => i.enabled && i.events?.includes(event) && i.webhook_url
            );

            for (const integration of activeIntegrations) {
                console.log(`[AUT] Triggering ${integration.provider} for event ${event}...`);

                // Fire and forget (don't await to avoid blocking the client request)
                fetch(integration.webhook_url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event,
                        workspace_id,
                        timestamp: new Date().toISOString(),
                        data: payload
                    })
                }).catch(err => console.error(`[AUT] Webhook failed for ${integration.provider}:`, err));
            }
        }
    } catch (error) {
        console.error("[AUT] Automation trigger error:", error);
    }
}
