import { NextRequest, NextResponse } from 'next/server';
import { OnboardingService } from '@/services/OnboardingService';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check (using standard JWT from header)
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Body
        const body = await req.json();
        const { profile_type, team_type, autonomy_level, agent_name } = body;

        if (!profile_type || !autonomy_level) {
            return NextResponse.json({ error: 'Faltan datos requeridos (profile_type, autonomy_level)' }, { status: 400 });
        }

        // 3. Complete Onboarding via Service
        const result = await OnboardingService.completeOnboardingV3({
            userId: user.id,
            profileType: profile_type,
            teamType: team_type || 'solo',
            autonomyLevel: autonomy_level,
            agentName: agent_name || `Mi Asistente ${profile_type}`
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[API] Onboarding Complete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
