import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * PATCH /api/admin/workspaces/:id/capacity
 * Overrides the maximum agent slots for a specific workspace.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { agentSlotOverride } = await req.json();
        const workspaceId = params.id;

        if (agentSlotOverride === undefined) {
            return NextResponse.json({ error: "agentSlotOverride is required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from("workspace_subscriptions")
            .update({ agent_slot_override: agentSlotOverride })
            .eq("workspace_id", workspaceId)
            .select()
            .single();

        if (error) throw error;

        // Log the action for audit
        console.log(`[ADMIN] Capacity override for ${workspaceId}: +${agentSlotOverride} slots.`);

        return NextResponse.json({ success: true, updated: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
