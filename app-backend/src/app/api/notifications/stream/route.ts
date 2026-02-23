import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Server-Sent Events (SSE) Gateway for Notifications
 * Replaces the frontend mock with real-time system alerts.
 */
export async function GET(req: NextRequest) {
    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    // 1. Keep-alive heartbeat every 15s
    const heartbeatInterval = setInterval(() => {
        writer.write(encoder.encode(": heartbeat\n\n"));
    }, 15000);

    // 2. Real-time Subscription to notifications table via Postgres Changes
    const channel = supabaseAdmin
        .channel("nexo_notifications")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "notifications" },
            (payload) => {
                const eventData = JSON.stringify(payload.new);
                writer.write(encoder.encode(`data: ${eventData}\n\n`));
            }
        )
        .subscribe();

    // Handle connection close
    req.signal.onabort = () => {
        clearInterval(heartbeatInterval);
        supabaseAdmin.removeChannel(channel);
        writer.close();
    };

    return new Response(responseStream.readable, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
