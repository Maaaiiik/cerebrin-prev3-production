import { NextResponse } from 'next/server';
import { OnboardingService } from '@/services/OnboardingService';

export async function POST(request: Request) {
    const body = await request.json();
    const { workspaceName, ownerId, marketplaceAgentIds } = body;

    if (!workspaceName || !ownerId || !marketplaceAgentIds) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
        const result = await OnboardingService.deployEnterpriseSwarm({
            workspaceName,
            ownerId,
            marketplaceAgentIds
        });
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
