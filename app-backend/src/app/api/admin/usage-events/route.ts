import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/admin/usage-events
 * Lists recent agent actions with token warnings.
 */
export async function GET(req: NextRequest) {
    try {
        // In a real system, we'd query a 'task_history' or 'audit_log' table
        // For now, we simulate with mock data following the required shape
        const events = [
            {
                id: "ev-001",
                workspaceId: "11111111-1111-1111-1111-111111111111",
                workspace: "Cyberdyne Systems",
                event: "Document Research",
                agentId: "ag-01",
                agent: "Alpha Bot",
                tokens: 35400,
                status: "warning", // Automatic warning logic: tokens > 30k
                timestamp: new Date().toISOString()
            },
            {
                id: "ev-002",
                workspaceId: "22222222-2222-2222-2222-222222222222",
                workspace: "Wayne Enterprises",
                event: "Code Generation",
                agentId: "ag-02",
                agent: "Omega",
                tokens: 12500,
                status: "ok",
                timestamp: new Date(Date.now() - 3600000).toISOString()
            }
        ];

        return NextResponse.json(events);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
