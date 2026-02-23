import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/financial/history
 * Returns historical MRR and AI Cost points.
 */
export async function GET(req: NextRequest) {
    try {
        const history = [
            { month: "Nov", mrr: 1200, cost: 450 },
            { month: "Dec", mrr: 1500, cost: 520 },
            { month: "Jan", mrr: 2100, cost: 680 },
            { month: "Feb", mrr: 2450, cost: 124 }
        ];

        return NextResponse.json(history);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
