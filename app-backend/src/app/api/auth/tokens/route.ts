import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { webcrypto } from 'node:crypto';

/**
 * POST /api/auth/tokens
 * Generates a new access token (API or MCP).
 */
export async function POST(request: Request) {
    const body = await request.json();
    const { workspace_id, user_id, name, type = 'mcp', scopes = ['read'] } = body;

    if (!workspace_id || !user_id || !name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a random token
    const rawToken = `cb_${type === 'mcp' ? 'ms' : 'sk'}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const prefix = rawToken.substring(0, 8);

    // Hash the token for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(rawToken);
    const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data: tokenEntry, error } = await supabaseAdmin
        .from('access_tokens')
        .insert([{
            workspace_id,
            user_id,
            name,
            token_hash: tokenHash,
            prefix,
            access_type: type,
            scopes
        }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the raw token ONLY ONCE
    return NextResponse.json({
        ...tokenEntry,
        raw_token: rawToken
    });
}

/**
 * GET /api/auth/tokens?workspace_id=...
 * Lists tokens for the workspace.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
        return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const { data: tokens, error } = await supabaseAdmin
        .from('access_tokens')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(tokens);
}
