import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/usage-summary
 * Returns global token usage and health counts.
 */
export async function GET(req: NextRequest) {
    try {
        return NextResponse.json({
            tokensToday: 1250400,
            warningsCount: 3,
            errorsCount: 1,
            activeAgents: 45
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
