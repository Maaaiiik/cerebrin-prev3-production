import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/admin/nps/results
 * Aggregates NPS scores and recent comments.
 */
export async function GET(req: NextRequest) {
    try {
        const { data: responses, error } = await supabaseAdmin
            .from("survey_responses")
            .select(`
        score,
        answer,
        created_at,
        workspace:workspaces(name)
      `)
            .not("score", "is", null);

        if (error) throw error;

        const total = responses.length;
        if (total === 0) {
            return NextResponse.json({ score: 0, totalResponses: 0, distribution: { promoters: 0, passives: 0, detractors: 0 }, comments: [] });
        }

        const promoters = responses.filter(r => r.score >= 9).length;
        const detractors = responses.filter(r => r.score <= 6).length;
        const passives = total - promoters - detractors;

        const npsScore = Math.round(((promoters - detractors) / total) * 100);

        return NextResponse.json({
            score: npsScore,
            totalResponses: total,
            distribution: {
                promoters: Math.round((promoters / total) * 100),
                passives: Math.round((passives / total) * 100),
                detractors: Math.round((detractors / total) * 100),
            },
            comments: responses.map(r => ({
                workspace: r.workspace?.name || "Unknown",
                score: r.score,
                comment: r.answer?.comment || "",
                createdAt: r.created_at
            })).slice(0, 10) // Last 10 comments
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/surveys
 * Creates and dispatches a new survey campaign.
 */
export async function POST(req: NextRequest) {
    try {
        const { question, type, target } = await req.json();

        const { data, error } = await supabaseAdmin
            .from("system_surveys")
            .insert({
                question,
                survey_type: type,
                target_tier: target,
                is_active: true
            })
            .select()
            .single();

        if (error) throw error;

        // Optional: Trigger a system-wide notification for the targeted users
        // triggerNotification(...) 

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
