import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * PATCH /api/admin/workspaces/:id/plan
 * Updates the subscription tier for a specific workspace.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { tier } = await req.json();
        const workspaceId = params.id;

        if (!tier || !['Starter', 'Pro', 'Enterprise'].includes(tier)) {
            return NextResponse.json({ error: "Valid tier is required" }, { status: 400 });
        }

        const tierLower = tier.toLowerCase();

        const { data, error } = await supabaseAdmin
            .from("workspace_subscriptions")
            .update({ tier: tierLower })
            .eq("workspace_id", workspaceId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, updated: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
