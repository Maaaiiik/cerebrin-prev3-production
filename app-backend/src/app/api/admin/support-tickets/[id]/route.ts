import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * PATCH /api/admin/support-tickets/:id
 * Updates status and priority of a ticket.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { status, priority, assigneeId } = await req.json();
        const ticketId = params.id;

        const { data, error } = await supabaseAdmin
            .from("support_tickets")
            .update({
                status,
                priority,
                assignee_id: assigneeId,
                updated_at: new Date().toISOString()
            })
            .eq("id", ticketId)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
