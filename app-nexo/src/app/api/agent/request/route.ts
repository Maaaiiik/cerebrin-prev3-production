import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { agent_id, workspace_id, action_type, entity_type, proposed_data, target_id } = body;

        // 1. Basic Validation
        if (!agent_id || !workspace_id || !action_type || !entity_type || !proposed_data) {
            return NextResponse.json({
                error: "Missing fields. Required: agent_id, workspace_id, action_type, entity_type, proposed_data"
            }, { status: 400 });
        }

        // 2. Validate Agent and Fetch Permissions
        const { data: agent, error: agentError } = await supabaseAdmin
            .from("workspace_agents")
            .select(`
                id, 
                is_active, 
                agent_type,
                role:workspace_roles(id, permissions)
            `)
            .eq("id", agent_id)
            .eq("workspace_id", workspace_id)
            .single();

        if (agentError || !agent) {
            return NextResponse.json({ error: "Agent not found or doesn't belong to this workspace." }, { status: 403 });
        }

        if (!agent.is_active) {
            return NextResponse.json({ error: "Agent is currently inactive." }, { status: 403 });
        }

        // 3. Granular Permission Check ({entity}_{action})
        const permissions = (agent.role as any)?.permissions || {};
        const actionsMap = permissions.actions || {}; // New nested structure
        const permissionKey = `${entity_type.toLowerCase()}_${action_type.toLowerCase()}`;
        const permissionValue = actionsMap[permissionKey] || "BLOCKED"; // Default to blocked for safety

        if (permissionValue === "BLOCKED") {
            return NextResponse.json({
                error: `Action '${action_type}' on '${entity_type}' is BLOCKED for this agent role.`
            }, { status: 403 });
        }

        // 5. Fetch Agent Config (for governance and limits)
        const { data: config } = await supabaseAdmin
            .from("agent_configs")
            .select("*")
            .eq("agent_id", agent_id)
            .single();

        // 6. Enforce Limits (Usage/Cost)
        if (config && config.limits) {
            const { max_runs_per_day } = config.limits;

            // Count runs in the last 24 hours
            const yesterday = new Date();
            yesterday.setHours(yesterday.getHours() - 24);

            const { count, error: countError } = await supabaseAdmin
                .from("agent_approval_queue")
                .select("*", { count: 'exact', head: true })
                .eq("agent_id", agent_id)
                .gte("created_at", yesterday.toISOString());

            if (!countError && count !== null && count >= max_runs_per_day) {
                return NextResponse.json({
                    error: `Daily run limit reached (${max_runs_per_day}). Upgrade plan or wait 24h.`
                }, { status: 429 });
            }
        }

        // 7. Insert into Approval Queue
        const { data, error } = await supabaseAdmin
            .from("agent_approval_queue")
            .insert({
                agent_id,
                workspace_id,
                action_type,
                entity_type,
                proposed_data,
                target_id: target_id || null,
                status: 'PENDING',
                agent_config_snapshot: config || null // Added snapshot
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "Action submitted for human approval.",
            request_id: data.id
        });

    } catch (error: any) {
        console.error("[API/Agent/Request] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
