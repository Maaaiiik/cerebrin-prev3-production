import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PATCH /api/workspace/teams/[id]/members/[userId]
 * Updates a team member's role or lead status.
 */
export async function PATCH(
    request: Request,
    { params }: { params: { id: string, userId: string } }
) {
    const teamId = params.id;
    const userId = params.userId;
    const body = await request.json();
    const { role, is_team_lead } = body;

    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (is_team_lead !== undefined) updateData.is_team_lead = is_team_lead;

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const { data: member, error } = await supabaseAdmin
        .from('team_members')
        .update(updateData)
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(member);
}

/**
 * DELETE /api/workspace/teams/[id]/members/[userId]
 * Removes a member from a team.
 */
export async function DELETE(
    request: Request,
    { params }: { params: { id: string, userId: string } }
) {
    const teamId = params.id;
    const userId = params.userId;

    const { error } = await supabaseAdmin
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
