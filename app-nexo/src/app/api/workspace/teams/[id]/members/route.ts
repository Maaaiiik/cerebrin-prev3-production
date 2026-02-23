import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/workspace/teams/[id]/members
 * Adds a new member to a team.
 */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const teamId = params.id;
    const body = await request.json();
    const { user_id, role, is_team_lead } = body;

    if (!user_id) {
        return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { data: member, error } = await supabaseAdmin
        .from('team_members')
        .insert([{
            team_id: teamId,
            user_id,
            role: role || 'Viewer',
            is_team_lead: is_team_lead || false
        }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'User is already a member of this team' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(member);
}

/**
 * GET /api/workspace/teams/[id]/members
 * Lists all members of a team.
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const teamId = params.id;

    const { data: members, error } = await supabaseAdmin
        .from('team_members')
        .select(`
      *,
      profile:auth.users(id, email) -- In a real app we'd join with profiles table
    `)
        .eq('team_id', teamId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(members);
}
