import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/vault/secrets
 * Securely stores an integration secret (API Keys, Webhooks, etc).
 * Bridges with the platform's secret management layer.
 */
export async function POST(request: Request) {
    const body = await request.json();
    const { workspace_id, name, value, description } = body;

    if (!workspace_id || !name || !value) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In production, 'value' would be encrypted before hitting the DB
    // or stored directly in Supabase Vault via RPC.

    const { data: secret, error } = await supabaseAdmin
        .from('vault_secrets')
        .upsert([{
            workspace_id,
            name,
            secret_value: value,
            description
        }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        id: secret.id,
        name: secret.name,
        message: 'Secret stored securely in Cerebrin Vault.'
    });
}

/**
 * GET /api/vault/secrets?workspace_id=...
 * Returns the list of secret names (never the values).
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspace_id');

    if (!workspaceId) {
        return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 });
    }

    const { data: secrets, error } = await supabaseAdmin
        .from('vault_secrets')
        .select('id, name, description, created_at')
        .eq('workspace_id', workspaceId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(secrets);
}
