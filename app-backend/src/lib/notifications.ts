import { supabaseAdmin } from "./supabase";

/**
 * Triggers a system notification that feeds into the SSE stream.
 */
export async function triggerNotification(params: {
    workspace_id?: string;
    type: "ticket_critical" | "churn_alert" | "usage_warning" | "agent_complete" | "hitl_pending" | "nps_drop";
    severity: "critical" | "warning" | "info" | "success";
    text: string;
    detail?: string;
    section?: string;
}) {
    try {
        const { data, error } = await supabaseAdmin
            .from("notifications")
            .insert({
                workspace_id: params.workspace_id || null,
                type: params.type,
                severity: params.severity,
                text: params.text,
                detail: params.detail,
                section: params.section || "admin",
                read: false
            });

        if (error) console.error("[NOTIF] Error inserting notification:", error);
        return data;
    } catch (error) {
        console.error("[NOTIF] Trigger failed:", error);
    }
}
