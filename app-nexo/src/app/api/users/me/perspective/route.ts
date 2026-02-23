import { NextResponse } from 'next/server';
import { UserService } from '@/services/UserService';

/**
 * GET /api/users/me/perspective
 * PATCH /api/users/me/perspective
 * POST /api/users/me/perspective/reset
 */

// Mocked user and workspace IDs for Phase 7 (wired to standard session in prod)
const MOCK_USER_ID = "admin-uuid";
const MOCK_WORKSPACE_ID = "master-admin-ws";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId') || MOCK_WORKSPACE_ID;

        const perspective = await UserService.getPerspective(MOCK_USER_ID, workspaceId);

        if (!perspective) {
            // Auto-assign focus if none exists
            await UserService.resetToPreset(MOCK_USER_ID, workspaceId, 'focus');
            const newPerspective = await UserService.getPerspective(MOCK_USER_ID, workspaceId);
            return NextResponse.json(newPerspective);
        }

        return NextResponse.json(perspective);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get('workspaceId') || MOCK_WORKSPACE_ID;

        const updated = await UserService.updatePerspective(MOCK_USER_ID, workspaceId, body);
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { pathname } = new URL(request.url);

    if (pathname.endsWith('/reset')) {
        try {
            const body = await request.json();
            const { mode, workspaceId } = body;
            const targetWs = workspaceId || MOCK_WORKSPACE_ID;

            if (!mode || !['director', 'focus'].includes(mode)) {
                return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
            }

            await UserService.resetToPreset(MOCK_USER_ID, targetWs, mode);
            const resetPerspective = await UserService.getPerspective(MOCK_USER_ID, targetWs);
            return NextResponse.json({ success: true, data: resetPerspective });
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
