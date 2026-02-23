import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/workspace/teams/[id]/agents
 * Assigns an AI agent to a team.
 */
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const teamId = params.id;
    const body = await request.json();
    const { agent_config_id } = body;

    if (!agent_config_id) {
        return NextResponse.json({ error: 'agent_config_id is required' }, { status: 400 });
    }

    const { data: teamAgent, error } = await supabaseAdmin
        .from('team_agents')
        .insert([{
            team_id: teamId,
            agent_config_id
        }])
        .select()
        .single();

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Agent is already assigned to this team' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(teamAgent);
}

/**
 * GET /api/workspace/teams/[id]/agents
 * Lists all AI agents assigned to a team.
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const teamId = params.id;

    const { data: agents, error } = await supabaseAdmin
        .from('team_agents')
        .select(`
      *,
      agent_config:agent_configs(*)
    `)
        .eq('team_id', teamId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(agents);
}
