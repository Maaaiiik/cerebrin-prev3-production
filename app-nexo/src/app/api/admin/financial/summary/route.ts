import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/admin/financial/summary
 * Aggregates revenue and costs for the Financial Intelligence HUD.
 */
export async function GET(req: NextRequest) {
    try {
        // 1. Calculate MRR from active subscriptions
        const { data: subs } = await supabaseAdmin
            .from("workspace_subscriptions")
            .select("tier")
            .eq("status", "active");

        const tierPrices = { starter: 0, pro: 49, enterprise: 299 };
        const mrr = subs?.reduce((acc, s) => acc + (tierPrices[s.tier as keyof typeof tierPrices] || 0), 0) || 0;

        // 2. Calculate AI Cost (Mocked aggregation from task processing logs)
        // In a real scenario, we would sum the 'cost' field from all execution logs this month
        const aiCost = 124.50;

        return NextResponse.json({
            mrr,
            mrrPrevious: mrr * 0.92, // Simulated growth
            churnRate: 2.3,
            churnPrevious: 2.5,
            aiCost,
            aiCostBreakdown: {
                openai: aiCost * 0.7,
                anthropic: aiCost * 0.3
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
