import { API_ROUTES } from "@/lib/constants";
import { Idea } from "@/types/supabase";

export class IdeaService {
    /**
     * Creates a new idea in the pipeline.
     */
    static async create(payload: Partial<Idea>) {
        const response = await fetch(API_ROUTES.IDEAS.CREATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to create idea");
        return response.json();
    }

    /**
     * Promotes an idea to a full Project.
     */
    static async promote(ideaId: string) {
        const response = await fetch(API_ROUTES.IDEAS.PROMOTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ideaId }),
        });

        if (!response.ok) throw new Error("Failed to promote idea");
        return response.json();
    }
}
