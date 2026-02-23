import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { TieredMemoryService } from '@/services/TieredMemoryService';

/**
 * AI Strategic Router v3
 * Features:
 * 1. Hybrid Routing (Frontier vs Local)
 * 2. BYO-API Support
 * 3. Cognitive Mirror (HITL for critical tasks)
 * 4. Tiered Memory Optimization
 * 5. Permission Ladder (Gradual Autonomy)
 */
export async function POST(req: Request) {
    try {
        const { workspaceId, agentId, prompt, taskType, customApiKey, userId } = await req.json();

        // 1. Context Optimization (Tiered Memory)
        const context = await TieredMemoryService.getOptimizedContext(workspaceId, agentId);

        // 2. Permission Ladder Check
        const { data: agentConfig } = await supabaseAdmin
            .from('agent_configs')
            .select('assigned_user_id, is_cognitive_mirror, permission_package, autonomy_level')
            .eq('id', agentId)
            .single();

        const isAutonomous = agentConfig?.permission_package === 'EXECUTOR' || agentConfig?.autonomy_level === 3;
        const isCriticalTask = taskType === 'STRATEGIC' || taskType === 'HIGH_RISK_FINANCIAL';

        // Logic: HITL if task is critical OR if agent is in 'OBSERVER' mode.
        if ((agentConfig?.is_cognitive_mirror && !isAutonomous) || (isCriticalTask && !isAutonomous)) {
            console.log(`[AI-ROUTER] HITL Triggered: Level ${agentConfig?.autonomy_level} requires human validation.`);

            return NextResponse.json({
                status: 'AWAITING_HUMAN_APPROVAL',
                message: 'This action is outside your agent\'s current autonomy level. Please review and approve.',
                required_level: isCriticalTask ? 3 : 2,
                current_level: agentConfig?.autonomy_level || 1
            });
        }

        // 4. Hybrid Routing & BYO-API
        const { data: wsConfig } = await supabaseAdmin.from('workspaces').select('byo_api_enabled').eq('id', workspaceId).single();
        const model = isCriticalTask ? 'gpt-4o' : 'local-mistral-8b';

        return NextResponse.json({
            success: true,
            meta: {
                model,
                context_tier: 'WARM',
                autonomy: agentConfig?.permission_package
            },
            response: `[${agentConfig?.permission_package}] Executed ${taskType} using ${model}.`
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
