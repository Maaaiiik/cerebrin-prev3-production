import { NextResponse } from 'next/server';
import { PerformanceService } from '@/services/PerformanceService';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
        return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 });
    }

    try {
        const standings = await PerformanceService.getLeaderboard(workspaceId);
        return NextResponse.json(standings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
