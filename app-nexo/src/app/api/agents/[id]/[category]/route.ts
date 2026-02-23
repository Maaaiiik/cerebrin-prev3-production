import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PATCH /api/agents/[id]/[category]
 * Generic handler for AgentConfigSheet updates.
 * Categories: permissions, scope, limits, integrations
 */
export async function PATCH(
    request: Request,
    { params }: { params: { id: string, category: string } }
) {
    const agentId = params.id;
    const category = params.category;
    const body = await request.json();

    // Validate the category exists in the agent_configs columns or metadata
    // In our simplified schema, we'll store these in the config_json or specific columns

    const updatePayload: any = {};

    // Logic to determine where to store data based on category
    if (category === 'limits') {
        updatePayload.config_json = {
            ...(await getExistingConfig(agentId)),
            limits: body
        };
    } else if (category === 'permissions') {
        updatePayload.is_active = body.is_active ?? true;
        updatePayload.config_json = {
            ...(await getExistingConfig(agentId)),
            permissions: body
        };
    } else {
        // scope, integrations
        updatePayload.config_json = {
            ...(await getExistingConfig(agentId)),
            [category]: body
        };
    }

    const { data: updatedAgent, error } = await supabaseAdmin
        .from('agent_configs')
        .update(updatePayload)
        .eq('id', agentId)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the change in the audit log
    await supabaseAdmin.from('agent_config_audit_log').insert([{
        agent_config_id: agentId,
        change_type: `update_${category}`,
        previous_value: {}, // Would fetch old value in production
        new_value: body,
        changed_by: 'system' // Should be auth.uid()
    }]);

    return NextResponse.json(updatedAgent);
}

async function getExistingConfig(id: string) {
    const { data } = await supabaseAdmin
        .from('agent_configs')
        .select('config_json')
        .eq('id', id)
        .single();
    return data?.config_json || {};
}
