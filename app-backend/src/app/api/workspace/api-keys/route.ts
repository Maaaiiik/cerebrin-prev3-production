import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/workspace/api-keys?workspace_id=...
 * Returns the list of API Keys/Access Tokens for the workspace.
 * Used in the Agent Factory panel.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
        return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const { data: tokens, error } = await supabaseAdmin
        .from('access_tokens')
        .select('id, name, prefix, access_type, created_at, last_used_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tokens);
}
