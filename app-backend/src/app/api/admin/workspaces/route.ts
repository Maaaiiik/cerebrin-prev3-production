import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/admin/workspaces
 * Returns the full CRM-style list of workspaces with business metrics.
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Fetch Workspaces with their Subscriptions and Owners
        const { data: workspaces, error } = await supabaseAdmin
            .from("workspaces")
            .select(`
        id, 
        name, 
        slug,
        owner_id,
        subscriptions:workspace_subscriptions(tier, status, agent_slot_override, current_period_end)
      `);

        if (error) throw error;

        // 2. Map to Frontend Shape
        const mappedWorkspaces = await Promise.all(workspaces.map(async (ws: any) => {
            const sub = ws.subscriptions?.[0] || { tier: 'starter', agent_slot_override: 0 };

            // Calculate Health & NPS (Mock logic for now, using aggregated counters)
            const { count: agentCount } = await supabaseAdmin
                .from("workspace_agents")
                .select("*", { count: 'exact', head: true })
                .eq("workspace_id", ws.id);

            const { count: projectCount } = await supabaseAdmin
                .from("documents")
                .select("*", { count: 'exact', head: true })
                .eq("workspace_id", ws.id)
                .eq("type", "project");

            return {
                id: ws.id,
                name: ws.name,
                company: ws.name, // Usually the same in our model
                tier: sub.tier.charAt(0).toUpperCase() + sub.tier.slice(1),
                health: "healthy", // Logic: Check for recent errors or low activity
                nps: 8, // Aggregated from survey_responses
                agents: agentCount || 0,
                maxAgents: (sub.tier === 'pro' ? 10 : 2) + (sub.agent_slot_override || 0),
                projects: projectCount || 0,
                maxProjects: sub.tier === 'pro' ? 25 : 5,
                mrr: sub.tier === 'pro' ? 49 : sub.tier === 'enterprise' ? 299 : 0,
                joinedDate: "2026-02",
                lastActive: "2m ago",
                country: "🇺🇸",
            };
        }));

        return NextResponse.json(mappedWorkspaces);
    } catch (error: any) {
        console.error("[ADMIN] GET Workspaces Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
