import { API_ROUTES } from "@/lib/constants";
import { Document } from "@/types/supabase";

export class DocumentService {
    /**
     * Creates a new document or task.
     */
    static async create(payload: Partial<Document>) {
        const response = await fetch(API_ROUTES.DOCS.CREATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to create document");
        return response.json();
    }

    /**
     * Updates existing documents (triggers cascading progress logic).
     */
    static async updateBatch(updates: Array<Partial<Document> & { id: string }>) {
        const response = await fetch(API_ROUTES.DOCS.UPDATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates }),
        });

        if (!response.ok) throw new Error("Failed to update documents");
        return response.json();
    }
}
