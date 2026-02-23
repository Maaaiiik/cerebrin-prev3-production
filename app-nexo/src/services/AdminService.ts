"use client";

import { Document, Idea, Workspace, WorkspaceSubscription, SupportTicket, NotificationEvent } from "@/types/supabase";

/**
 * AdminService handles all calls to /api/admin/* and /api/notifications/*
 * Bridges the frontend UI with the Backend Governance & NEXO infra.
 */
export const AdminService = {
    // --- Workspace CRM ---
    async getWorkspaces(): Promise<any[]> {
        const res = await fetch("/api/admin/workspaces");
        return res.json();
    },

    async updateCapacity(id: string, capacity: { max_agents?: number; max_projects?: number }) {
        const res = await fetch(`/api/admin/workspaces/${id}/capacity`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(capacity),
        });
        return res.json();
    },

    async impersonate(id: string) {
        const res = await fetch(`/api/admin/workspaces/${id}/impersonate`, { method: "POST" });
        return res.json();
    },

    // --- Financial intelligence ---
    async getFinancialSummary() {
        const res = await fetch("/api/admin/financial/summary");
        return res.json();
    },

    async getFinancialHistory() {
        const res = await fetch("/api/admin/financial/history");
        return res.json();
    },

    // --- Support Tickets ---
    async getTickets(status: string = "all"): Promise<any[]> {
        const res = await fetch(`/api/admin/support-tickets?status=${status}`);
        return res.json();
    },

    async updateTicket(id: string, data: any) {
        const res = await fetch(`/api/admin/support-tickets/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async replyToTicket(id: string, message: { body: string; authorId?: string }) {
        const res = await fetch(`/api/admin/support-tickets/${id}/reply`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });
        return res.json();
    },

    // --- NPS & Surveys ---
    async getNPSResults() {
        const res = await fetch("/api/admin/nps/results");
        return res.json();
    },

    async createSurvey(data: { question: string; type: string; target: string }) {
        const res = await fetch("/api/admin/nps/results", { // Using the results route for simplicity in this brief
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // --- Usage Audit ---
    async getUsageEvents() {
        const res = await fetch("/api/admin/usage-events");
        return res.json();
    },

    async getUsageSummary() {
        const res = await fetch("/api/admin/usage-summary");
        return res.json();
    },

    // --- Teams Management ---
    async getTeams(workspaceId: string): Promise<any[]> {
        const res = await fetch(`/api/workspace/teams?workspace_id=${workspaceId}`);
        return res.json();
    },

    async createTeam(data: { workspace_id: string; name: string; emoji?: string; color?: string }) {
        const res = await fetch("/api/workspace/teams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async addTeamMember(teamId: string, data: { user_id: string; role?: string; is_team_lead?: boolean }) {
        const res = await fetch(`/api/workspace/teams/${teamId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async updateTeamMember(teamId: string, userId: string, data: { role?: string; is_team_lead?: boolean }) {
        const res = await fetch(`/api/workspace/teams/${teamId}/members/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async assignTeamAgent(teamId: string, agentConfigId: string) {
        const res = await fetch(`/api/workspace/teams/${teamId}/agents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agent_config_id: agentConfigId }),
        });
        return res.json();
    },

    // --- Access Tokens (API & MCP) ---
    async getTokens(workspaceId: string): Promise<any[]> {
        const res = await fetch(`/api/auth/tokens?workspace_id=${workspaceId}`);
        return res.json();
    },

    async createToken(data: { workspace_id: string; user_id: string; name: string; type?: string }) {
        const res = await fetch("/api/auth/tokens", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // --- Production Endpoints (Agent Factory & Vault) ---
    async updateAgentConfig(agentId: string, category: string, data: any) {
        const res = await fetch(`/api/agents/${agentId}/${category}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    async getWorkspaceApiKeys(workspaceId: string) {
        const res = await fetch(`/api/workspace/api-keys?workspace_id=${workspaceId}`);
        return res.json();
    },

    async saveVaultSecret(data: { workspace_id: string; name: string; value: string; description?: string }) {
        const res = await fetch("/api/vault/secrets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return res.json();
    }
};
