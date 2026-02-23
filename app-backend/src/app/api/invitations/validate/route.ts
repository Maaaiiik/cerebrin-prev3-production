import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        // 1. Fetch invitation and join with workspace info
        const { data, error } = await supabaseAdmin
            .from("invitations")
            .select("*, workspace:workspaces(name)")
            .eq("token", token)
            .eq("status", "PENDING")
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Invitación inválida, usada o expirada." }, { status: 404 });
        }

        // 2. Check expiration
        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json({ error: "La invitación ha expirado." }, { status: 410 });
        }

        // 3. Return sanitized invitation info
        return NextResponse.json({
            valid: true,
            email: data.email,
            workspace_name: data.workspace?.name,
            role_id: data.role_id,
            team_id: data.team_id
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
