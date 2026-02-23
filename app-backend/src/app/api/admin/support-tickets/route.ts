import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/admin/support-tickets
 * Fetches all support tickets with their history.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");

        let query = supabaseAdmin
            .from("support_tickets")
            .select(`
        *,
        messages:ticket_messages(*)
      `)
            .order("created_at", { ascending: false });

        if (status) query = query.eq("status", status);
        if (priority) query = query.eq("priority", priority);

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/support-tickets
 * Create a new ticket (Frontend or Backend triggered).
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { workspace_id, subject, priority, category, initial_message } = body;

        const ticket_id = `T-${Math.floor(1000 + Math.random() * 9000)}`;

        const { data: ticket, error: ticketError } = await supabaseAdmin
            .from("support_tickets")
            .insert({
                id: ticket_id,
                workspace_id,
                subject,
                priority: priority || "medium",
                category,
            })
            .select()
            .single();

        if (ticketError) throw ticketError;

        // Add initial message
        if (initial_message) {
            await supabaseAdmin.from("ticket_messages").insert({
                ticket_id: ticket_id,
                body: initial_message,
                role: "user",
                author_name: "User"
            });
        }

        // TRIGGER NOTIFICATION if critical
        if (priority === "critical") {
            await supabaseAdmin.from("notifications").insert({
                workspace_id,
                type: "ticket_critical",
                severity: "critical",
                text: `Ticket Crítico: ${subject}`,
                detail: `ID: ${ticket_id}`,
                section: "admin"
            });
        }

        return NextResponse.json(ticket);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
