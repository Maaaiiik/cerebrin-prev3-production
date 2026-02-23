import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/admin/support-tickets/:id/reply
 * Appends a new message to the ticket thread.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const ticketId = params.id;
        const { body, role, authorName, authorId } = await req.json();

        const { data, error } = await supabaseAdmin
            .from("ticket_messages")
            .insert({
                ticket_id: ticketId,
                body,
                role: role || 'support',
                author_name: authorName || 'Support Admin',
                author_id: authorId
            })
            .select()
            .single();

        if (error) throw error;

        // Update ticket updated_at
        await supabaseAdmin
            .from("support_tickets")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", ticketId);

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
