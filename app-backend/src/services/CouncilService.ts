import { API_ROUTES } from "@/lib/constants";

export class CouncilService {
    /**
     * Queries the AI Council (GPT, Claude, Gemini).
     */
    static async compareModels(prompt: string) {
        const response = await fetch(API_ROUTES.COUNCIL.COMPARE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) throw new Error("Council query failed");
        return response.json();
    }
}
