import { NextRequest, NextResponse } from 'next/server';
import { ArchitectService } from '@/services/ArchitectService';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return NextResponse.json({ error: 'No auth' }, { status: 401 });

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { intent, action, workspace_id, nodes } = await req.json();

        // 1. Action: DESIGN (AI Suggestion)
        if (action === 'design') {
            const suggestion = await ArchitectService.designOrganization(intent);
            return NextResponse.json(suggestion);
        }

        // 2. Action: DEPLOY (Persist to DB)
        if (action === 'deploy') {
            if (!workspace_id || !nodes) return NextResponse.json({ error: 'Missing data' }, { status: 400 });
            await ArchitectService.deployStructure(workspace_id, nodes);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[API] Architect Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
