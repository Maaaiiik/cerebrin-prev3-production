import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/workspace/teams?workspace_id=...
 * Lists all teams for a specific workspace.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
        return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const { data: teams, error } = await supabaseAdmin
        .from('teams')
        .select(`
      *,
      members:team_members(count),
      agents:team_agents(count)
    `)
        .eq('workspace_id', workspaceId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(teams);
}

/**
 * POST /api/workspace/teams
 * Creates a new team in the workspace.
 */
export async function POST(request: Request) {
    const body = await request.json();
    const { workspace_id, name, description, emoji, color } = body;

    if (!workspace_id || !name) {
        return NextResponse.json({ error: 'workspace_id and name are required' }, { status: 400 });
    }

    const { data: team, error } = await supabaseAdmin
        .from('teams')
        .insert([{
            workspace_id,
            name,
            description,
            emoji,
            color
        }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(team);
}
