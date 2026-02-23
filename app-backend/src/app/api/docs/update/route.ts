import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { updates } = body; // Expecting { updates: [{ id: '...', ...changes }] }

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ error: "Invalid updates format. Expected array." }, { status: 400 });
        }

        console.log(`[API] Updating ${updates.length} documents...`);

        const results = [];
        const errors = [];

        for (const update of updates) {
            const { id, metadata, ...changes } = update;
            if (!id) continue;

            const finalUpdate: any = { ...changes };
            if (metadata) {
                finalUpdate.metadata = {
                    weight: metadata.weight ?? 1,
                    estimated_hours: metadata.estimated_hours ?? 0,
                    cost: metadata.cost ?? 0,
                    ...metadata
                };
            }

            const { data, error } = await supabaseAdmin
                .from("documents")
                .update(finalUpdate)
                .eq("id", id)
                .select()
                .single();

            if (error) {
                console.error(`[API] Error updating doc ${id}:`, error);
                errors.push({ id, error });
            } else {
                results.push(data);
            }
        }

        return NextResponse.json({ success: true, updated: results, errors });

    } catch (error: any) {
        console.error("[API] Update Document Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
