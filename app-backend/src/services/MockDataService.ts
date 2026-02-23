import { Document, Idea, AgentApprovalRequest } from "@/types/supabase";

/**
 * Service to provide dummy data for UI prototyping.
 * This allows the frontend to be developed without a 100% active backend.
 */
export class MockDataService {
    static getProjects(): Partial<Document>[] {
        return [
            {
                id: "proj-1",
                title: "Expansión Mercado Latam",
                progress_pct: 45,
                category: "En Progreso",
                metadata: { weight: 1, estimated_hours: 120, cost: 450 },
            },
            {
                id: "proj-2",
                title: "Rediseño de Marca Alpha",
                progress_pct: 12,
                category: "Investigación",
                metadata: { weight: 1, estimated_hours: 80, cost: 200 },
            }
        ];
    }

    static getPendingApprovals(): Partial<AgentApprovalRequest>[] {
        return [
            {
                id: "req-1",
                agent_id: "agent-alpha",
                action_type: "CREATE",
                entity_type: "TASK",
                proposed_data: { title: "Nueva Tarea de Soporte", metadata: { weight: 1 } },
                status: "PENDING",
                created_at: new Date().toISOString(),
            }
        ];
    }

    static getAgents(): any[] {
        return [
            { id: "agent-1", name: "Alpha Investigator", agent_type: "RESEARCHER", is_active: true },
            { id: "agent-2", name: "Omega Writer", agent_type: "WRITER", is_active: true },
        ];
    }

    static getIdeas(): Partial<Idea>[] {
        return [
            {
                id: "idea-1",
                title: "Integrar Pagos con Cripto",
                priority_score: 8,
                status: "evaluating",
                idea_number: 101,
            },
            {
                id: "idea-2",
                title: "Sistema de Gamificación",
                priority_score: 6,
                status: "draft",
                idea_number: 102,
            }
        ];
    }
}
