import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            title,
            content,
            category,
            type,
            workspace_id,
            parent_id,
            user_id,
            assigned_to,
            assignee_type,
            progress_pct,
            metadata
        } = body;

        // Basic Validation
        if (!title || !workspace_id) {
            return NextResponse.json({ error: "Missing required fields: title, workspace_id" }, { status: 400 });
        }

        // Strict Metadata Contract
        const validatedMetadata = {
            weight: metadata?.weight ?? 1,
            estimated_hours: metadata?.estimated_hours ?? 0,
            cost: metadata?.cost ?? 0,
            ...metadata
        };

        // ... Handle User ID Fallback ...
        let finalUserId = user_id;
        const NIL_UUID = "00000000-0000-0000-0000-000000000000";

        if (!finalUserId || finalUserId === NIL_UUID) {
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
            if (users && users.length > 0) {
                finalUserId = users[0].id;
            } else {
                finalUserId = NIL_UUID;
            }
        }

        const { data, error } = await supabaseAdmin
            .from("documents")
            .insert({
                title,
                content: content || "",
                category: category || "En Progreso",
                type: type || "task",
                workspace_id,
                parent_id: parent_id || null,
                user_id: finalUserId,
                assigned_to: assigned_to || null,
                assignee_type: assignee_type || (assigned_to ? 'HUMAN' : null),
                progress_pct: progress_pct || 0,
                metadata: validatedMetadata
            })
            .select()
            .single();

        if (error) throw error;

        // Automation Bridge (Webhook Out)
        const { triggerAutomationWebhook } = await import("@/lib/automation");
        triggerAutomationWebhook(workspace_id, 'on_task_created', data);

        return NextResponse.json({ success: true, document: data });

    } catch (error: any) {
        console.error("[API] Create Document Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
