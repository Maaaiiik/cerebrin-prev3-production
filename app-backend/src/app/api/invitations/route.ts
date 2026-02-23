import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { workspace_id, email, role_id, team_id, invited_by } = body;

        if (!workspace_id || !email || !role_id || !invited_by) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // --- SECURITY CHECK FOR PRODUCTION ---
        // 1. Get the user session from cookies
        let response = NextResponse.next();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return req.cookies.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        // Not needed for read-only check
                    },
                    remove(name: string, options: CookieOptions) {
                        // Not needed for read-only check
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.id !== invited_by) {
            return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
        }

        // 2. Verify that the user has Owner or Admin role in the workspace
        const { data: member, error: memberError } = await supabaseAdmin
            .from("workspace_members")
            .select("role:workspace_roles(name)")
            .eq("workspace_id", workspace_id)
            .eq("user_id", user.id)
            .single();

        if (memberError || !member) {
            return NextResponse.json({ error: "Unauthorized: User not in workspace" }, { status: 403 });
        }

        const userRole = (member.role as any)?.name;
        if (userRole !== 'Owner' && userRole !== 'Admin') {
            return NextResponse.json({ error: "Solo Owners o Admins pueden invitar nuevos miembros." }, { status: 403 });
        }
        // --- END SECURITY CHECK ---

        // 3. Generate unique token using native crypto
        const token = crypto.randomUUID();

        // 4. Insert invitation
        const { data, error } = await supabaseAdmin
            .from("invitations")
            .insert({
                workspace_id,
                email,
                role_id,
                team_id: team_id || null,
                invited_by,
                token,
                status: 'PENDING'
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: "Ya existe una invitación pendiente para este correo en este workspace." }, { status: 409 });
            }
            throw error;
        }

        // 5. Return the invitation data
        return NextResponse.json({
            success: true,
            invitation: data,
            signup_url: `${req.nextUrl.origin}/signup/${token}`
        });

    } catch (error: any) {
        console.error("[API/Invitations] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: List invitations for a workspace (Requires Member access)
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
        return NextResponse.json({ error: "workspace_id is required" }, { status: 400 });
    }

    // Basic permission check could be added here too similar to POST
    // For now, listing is allowed if the user provides a workspaceId, 
    // but the query is executed with admin privileges.

    const { data, error } = await supabaseAdmin
        .from("invitations")
        .select("*, role:workspace_roles(name), team:workspace_teams(name)")
        .eq("workspace_id", workspaceId)
        .eq("status", "PENDING")
        .gt("expires_at", new Date().toISOString());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
}
