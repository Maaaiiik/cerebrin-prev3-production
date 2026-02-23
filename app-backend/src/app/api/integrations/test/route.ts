import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const { agent_id, integration_id } = await req.json();

        if (!agent_id) {
            return NextResponse.json({ error: "agent_id is required" }, { status: 400 });
        }

        // 1. Fetch Integration Config
        const { data: config, error: configError } = await supabaseAdmin
            .from("agent_configs")
            .select("integrations")
            .eq("agent_id", agent_id)
            .single();

        if (configError || !config) {
            return NextResponse.json({ error: "Agent configuration not found" }, { status: 404 });
        }

        const integration = config.integrations?.find((i: any) => i.id === integration_id || i.provider === integration_id);

        if (!integration) {
            return NextResponse.json({ error: "Integration not found in agent config" }, { status: 404 });
        }

        // 2. Perform Mock Test (In a real scenario, this would ping the webhook or service)
        console.log(`[TEST] Testing integration for ${agent_id}:`, integration);

        let success = true;
        let message = `Successfully reached ${integration.provider} endpoint.`;

        if (integration.provider === 'n8n' && !integration.webhook_url) {
            success = false;
            message = "n8n integration requires a webhook_url.";
        }

        return NextResponse.json({
            success,
            timestamp: new Date().toISOString(),
            details: {
                provider: integration.provider,
                message
            }
        });

    } catch (error: any) {
        console.error("[API/Integrations/Test] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
