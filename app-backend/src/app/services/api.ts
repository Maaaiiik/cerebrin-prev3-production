/**
 * ─── Cerebrin API Service Layer ───────────────────────────────────────────────
 *
 * Centraliza todas las llamadas al backend.
 * En desarrollo se usan mocks; en producción reemplazar BASE_URL
 * y las funciones marcadas como "// → REAL: fetch(...)" con llamadas reales.
 *
 * CONTRATOS COMPLETOS documentados en /docs/backend-contracts.md
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type DocumentCategory =
  | "Investigación"
  | "Planificación"
  | "Ejecución"
  | "Revisión"
  | "Terminado";

export interface DocumentMetadata {
  progress_pct: number;    // 0-100
  priority_score: number;  // 0-10 (>7 = Critical, rojo)
  weight: number;
}

export interface UserPreferences {
  user_id: string;
  theme: "dark" | "light" | "system";
  language: "en" | "es";
  updated_at: string;
}

export interface ViewConfig {
  user_id: string;
  config_key: string;
  config_json: Record<string, boolean>;
  updated_at: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  workspace_id: string;
  is_super_admin: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  company: string;
  tier: "Starter" | "Pro" | "Enterprise";
  health: "healthy" | "at-risk" | "churned";
  nps: number | null;
  agents: number;
  maxAgents: number;
  projects: number;
  maxProjects: number;
  mrr: number;
  joinedDate: string;
  lastActive: string;
  country: string;
}

export interface CapacityOverride {
  maxAgents?: number;
  maxProjects?: number;
}

export interface ImpersonateResponse {
  token: string;
  expires_at: string;
  workspace_name: string;
}

export interface EventLog {
  id: string;
  workspace: string;
  event: string;
  agent: string;
  tokens: number;
  status: "ok" | "warning" | "error";
  timestamp: string;
}

export interface TicketMessage {
  id: string;
  role: "user" | "support";
  author: string;
  body: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;           // T-1000
  workspace: string;
  subject: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved" | "pending";
  created: string;
  assignee: string | null;
  category: string;
  messages: TicketMessage[];
}

export interface NotificationEvent {
  id: string;
  type: "agent_alert" | "hitl_request" | "ticket_update" | "capacity_warning" | "payment_fail";
  title: string;
  body: string;
  workspace?: string;
  severity: "info" | "warning" | "critical";
  created_at: string;
  read?: boolean;
  action_url?: string;  // Optional deep link
}

export interface FinancialSummary {
  mrr: number;
  arr: number;
  gross_margin_pct: number;
  churn_rate_pct: number;
  ltv: number;
  cac: number;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_USER: CurrentUser = {
  id: "usr_super_01",
  email: "admin@cerebrin.io",
  name: "Admin Nexo",
  workspace_id: "ws_nexo",
  is_super_admin: true,
};

export const MOCK_WORKSPACES: Workspace[] = [
  { id: "ws1", name: "Stark Industries",   company: "Stark Industries Inc.",  tier: "Enterprise", health: "healthy",  nps: 10,   agents: 13, maxAgents: 15, projects: 44, maxProjects: 50, mrr: 1299, joinedDate: "2023-09", lastActive: "1m ago",  country: "🇺🇸" },
  { id: "ws2", name: "Wayne Enterprises",  company: "Wayne Ent. LLC",         tier: "Enterprise", health: "healthy",  nps: 9,    agents: 11, maxAgents: 15, projects: 38, maxProjects: 50, mrr: 1299, joinedDate: "2023-11", lastActive: "5m ago",  country: "🇺🇸" },
  { id: "ws3", name: "Acme Corp",          company: "Acme Inc.",              tier: "Pro",        health: "healthy",  nps: 8,    agents: 6,  maxAgents: 8,  projects: 23, maxProjects: 20, mrr: 499,  joinedDate: "2024-01", lastActive: "20m ago", country: "🇬🇧" },
  { id: "ws4", name: "TechVentures",       company: "TechVentures Ltd.",      tier: "Pro",        health: "healthy",  nps: 8,    agents: 4,  maxAgents: 8,  projects: 12, maxProjects: 20, mrr: 499,  joinedDate: "2024-03", lastActive: "1h ago",  country: "🇩🇪" },
  { id: "ws5", name: "Momentum Labs",      company: "Momentum Labs Inc.",     tier: "Pro",        health: "healthy",  nps: 10,   agents: 6,  maxAgents: 8,  projects: 18, maxProjects: 20, mrr: 499,  joinedDate: "2024-02", lastActive: "5m ago",  country: "🇨🇦" },
  { id: "ws6", name: "StartupXYZ",         company: "StartupXYZ SAS",        tier: "Starter",    health: "at-risk",  nps: 5,    agents: 2,  maxAgents: 3,  projects: 4,  maxProjects: 5,  mrr: 99,   joinedDate: "2024-06", lastActive: "3d ago",  country: "🇫🇷" },
  { id: "ws7", name: "Pinnacle Digital",   company: "Pinnacle Digital",       tier: "Starter",    health: "at-risk",  nps: null, agents: 3,  maxAgents: 3,  projects: 7,  maxProjects: 5,  mrr: 99,   joinedDate: "2024-07", lastActive: "6h ago",  country: "🇦🇺" },
  { id: "ws8", name: "Nexora Systems",     company: "Nexora Sys.",            tier: "Starter",    health: "churned",  nps: 3,    agents: 1,  maxAgents: 3,  projects: 1,  maxProjects: 5,  mrr: 99,   joinedDate: "2024-05", lastActive: "2w ago",  country: "🇧🇷" },
];

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: "T-1007", workspace: "Stark Industries",  subject: "dev-bot API calls returning 500 errors on batch runs",
    priority: "critical", status: "in-progress", created: "8m ago",  assignee: "Alex R.", category: "Agent Error",
    messages: [
      { id: "m1", role: "user",    author: "Tony S.",   body: "Our dev-bot is returning 500 errors on every batch run since 10:30 UTC. Production is blocked.", created_at: "8m ago" },
      { id: "m2", role: "support", author: "Alex R.",   body: "Hi Tony, we've reproduced the issue. It's related to a token limit regression in the batch processor. Patch ETA: 30 min.", created_at: "5m ago" },
      { id: "m3", role: "user",    author: "Tony S.",   body: "Confirmed, thanks for the quick response. We'll hold deployments until it's resolved.", created_at: "3m ago" },
    ],
  },
  {
    id: "T-1006", workspace: "StartupXYZ",        subject: "Can't upgrade plan — payment page returns blank screen",
    priority: "high",     status: "open",        created: "1h ago",  assignee: null,      category: "Billing",
    messages: [
      { id: "m4", role: "user", author: "Claire D.", body: "Trying to upgrade from Starter to Pro but clicking 'Upgrade' shows a blank screen. Firefox 124 on Mac.", created_at: "1h ago" },
    ],
  },
  {
    id: "T-1005", workspace: "Pinnacle Digital",  subject: "NPS survey widget not rendering in dashboard",
    priority: "medium",   status: "open",        created: "2h ago",  assignee: null,      category: "UI Bug",
    messages: [
      { id: "m5", role: "user", author: "Sam K.", body: "The NPS widget is completely missing from our dashboard since yesterday's update.", created_at: "2h ago" },
    ],
  },
  {
    id: "T-1004", workspace: "TechVentures",      subject: "Webhook not firing on task completion events",
    priority: "high",     status: "pending",     created: "3h ago",  assignee: "Maria S.", category: "Integration",
    messages: [
      { id: "m6", role: "user",    author: "Lena M.", body: "Our Zapier integration stopped receiving webhooks when tasks are marked complete.", created_at: "3h ago" },
      { id: "m7", role: "support", author: "Maria S.", body: "Investigating. Could you share your webhook endpoint URL and we'll check the delivery logs?", created_at: "2h ago" },
      { id: "m8", role: "user",    author: "Lena M.", body: "Sure, sending via secure channel now.", created_at: "2h ago" },
    ],
  },
  {
    id: "T-1003", workspace: "Wayne Enterprises",  subject: "Agent slot counter stuck at 0 after workspace upgrade",
    priority: "medium",   status: "open",        created: "5h ago",  assignee: null,      category: "Billing",
    messages: [
      { id: "m9", role: "user", author: "Bruce W.", body: "We upgraded to Enterprise yesterday but the agent capacity still shows 3/3 instead of 3/15.", created_at: "5h ago" },
    ],
  },
  {
    id: "T-1002", workspace: "Momentum Labs",     subject: "Template Studio PDF export fails silently on large docs",
    priority: "low",      status: "resolved",    created: "1d ago",  assignee: "Alex R.", category: "Export",
    messages: [
      { id: "m10", role: "user",    author: "Jonas P.", body: "Exporting templates with >10 blocks produces an empty PDF.", created_at: "1d ago" },
      { id: "m11", role: "support", author: "Alex R.",  body: "Fixed in v2.4.1 — added pagination for large exports. Please update and let us know!", created_at: "22h ago" },
      { id: "m12", role: "user",    author: "Jonas P.", body: "Updated and confirmed fixed. Thanks!", created_at: "20h ago" },
    ],
  },
  {
    id: "T-1001", workspace: "Acme Corp",         subject: "HITL approval queue slow to load (>8s)",
    priority: "medium",   status: "resolved",    created: "2d ago",  assignee: "Maria S.", category: "Performance",
    messages: [
      { id: "m13", role: "user",    author: "Ann G.",   body: "Approval queue takes 8+ seconds to load when there are more than 20 pending items.", created_at: "2d ago" },
      { id: "m14", role: "support", author: "Maria S.", body: "Root cause identified: missing DB index on workspace_id. Deployed fix in 20min. Should be <500ms now.", created_at: "2d ago" },
      { id: "m15", role: "user",    author: "Ann G.",   body: "Lightning fast now! Great work.", created_at: "2d ago" },
    ],
  },
];

export const MOCK_EVENT_LOGS: EventLog[] = [
  { id: "e1", workspace: "Stark Industries",  event: "Batch document generation",  agent: "writer-bot",   tokens: 14200, status: "ok",      timestamp: "10:42:01" },
  { id: "e2", workspace: "TechVentures",      event: "Market research analysis",   agent: "analyst-bot",  tokens: 28500, status: "warning", timestamp: "10:41:33" },
  { id: "e3", workspace: "Wayne Enterprises", event: "Strategy synthesis",         agent: "strategy-bot", tokens: 9100,  status: "ok",      timestamp: "10:40:55" },
  { id: "e4", workspace: "Stark Industries",  event: "API integration pipeline",   agent: "dev-bot",      tokens: 42000, status: "error",   timestamp: "10:40:12" },
  { id: "e5", workspace: "Momentum Labs",     event: "Content calendar creation",  agent: "writer-bot",   tokens: 7800,  status: "ok",      timestamp: "10:38:47" },
  { id: "e6", workspace: "StartupXYZ",        event: "Competitor scan",            agent: "analyst-bot",  tokens: 11400, status: "ok",      timestamp: "10:37:22" },
  { id: "e7", workspace: "Pinnacle Digital",  event: "Campaign performance audit", agent: "analyst-bot",  tokens: 18900, status: "warning", timestamp: "10:35:09" },
  { id: "e8", workspace: "Wayne Enterprises", event: "Legal doc review",           agent: "writer-bot",   tokens: 6200,  status: "ok",      timestamp: "10:33:41" },
];

export const MOCK_FINANCIAL_SUMMARY: FinancialSummary = {
  mrr: 24_591,
  arr: 295_092,
  gross_margin_pct: 74.2,
  churn_rate_pct: 2.3,
  ltv: 18_400,
  cac: 920,
};

export const MOCK_MRR_HISTORY = [
  { month: "Aug", mrr: 9200,  cost: 2100 },
  { month: "Sep", mrr: 11400, cost: 2800 },
  { month: "Oct", mrr: 14200, cost: 3500 },
  { month: "Nov", mrr: 16800, cost: 4100 },
  { month: "Dec", mrr: 18900, cost: 4700 },
  { month: "Jan", mrr: 21300, cost: 5200 },
  { month: "Feb", mrr: 24591, cost: 6100 },
];

export const MOCK_CHURN_HISTORY = [
  { month: "Aug", rate: 4.2 },
  { month: "Sep", rate: 3.8 },
  { month: "Oct", rate: 3.1 },
  { month: "Nov", rate: 2.9 },
  { month: "Dec", rate: 3.5 },
  { month: "Jan", rate: 2.7 },
  { month: "Feb", rate: 2.3 },
];

// ─── SSE Notification Stream (mock) ───────────────────────────────────────────
// → REAL: const es = new EventSource(`${BASE_URL}/api/notifications/stream`);

const SSE_MOCK_EVENTS: NotificationEvent[] = [
  { id: "n1", type: "agent_alert",      title: "dev-bot batch failure",        body: "Stark Industries — 42k tokens consumed, status: error",   workspace: "Stark Industries",  severity: "critical", created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),  read: false },
  { id: "n2", type: "hitl_request",     title: "Approval required",            body: "Wayne Ent. — strategy-bot awaits human review",           workspace: "Wayne Enterprises", severity: "warning",  created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),  read: false },
  { id: "n3", type: "ticket_update",    title: "T-1007 updated",               body: "Alex R. replied to Stark Industries ticket",              workspace: "Stark Industries",  severity: "info",     created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), read: false },
  { id: "n4", type: "capacity_warning", title: "Pinnacle Digital at capacity", body: "3/3 agent slots used — consider upgrading plan",          workspace: "Pinnacle Digital",  severity: "warning",  created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), read: false },
  { id: "n5", type: "payment_fail",     title: "Payment failed",               body: "StartupXYZ — card ending 4242 declined (code: do_not_honor)", workspace: "StartupXYZ",   severity: "critical", created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(), read: false },
];

// Extended mock history for the notification panel
const MOCK_NOTIFICATION_HISTORY: NotificationEvent[] = [
  ...SSE_MOCK_EVENTS,
  { id: "n6",  type: "agent_alert",      title: "writer-bot completed batch",     body: "Acme Corp — 14.2k tokens, 3 documents generated",         workspace: "Acme Corp",         severity: "info",     created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),     read: true },
  { id: "n7",  type: "hitl_request",     title: "Strategic decision required",    body: "TechVentures — analyst-bot needs approval for market research", workspace: "TechVentures",   severity: "warning",  created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),     read: true },
  { id: "n8",  type: "ticket_update",    title: "T-1006 assigned",                body: "Maria S. is now handling billing issue",                  workspace: "StartupXYZ",        severity: "info",     created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),    read: true },
  { id: "n9",  type: "capacity_warning", title: "Approaching agent limit",        body: "Wayne Enterprises — 11/15 agent slots used",              workspace: "Wayne Enterprises", severity: "info",     created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),    read: true },
  { id: "n10", type: "agent_alert",      title: "High token usage detected",      body: "Momentum Labs — analyst-bot used 28.5k tokens in single run", workspace: "Momentum Labs", severity: "warning",  created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),    read: true },
  { id: "n11", type: "ticket_update",    title: "T-1002 resolved",                body: "Export issue fixed in v2.4.1",                            workspace: "Momentum Labs",     severity: "info",     created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true },
  { id: "n12", type: "hitl_request",     title: "Budget approval needed",         body: "Pinnacle Digital — campaign budget exceeds threshold",   workspace: "Pinnacle Digital",  severity: "critical", created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), read: true },
];

export function subscribeToNotifications(
  onEvent: (e: NotificationEvent) => void,
  onError?: () => void,
): () => void {
  if (BASE_URL) {
    // → REAL SSE
    const es = new EventSource(`${BASE_URL}/api/notifications/stream`);
    es.onmessage = (e) => { try { onEvent(JSON.parse(e.data)); } catch { /**/ } };
    es.onerror   = onError ?? (() => {});
    return () => es.close();
  }

  // Mock: replay events with delays
  let i = 0;
  let tid: ReturnType<typeof setTimeout>;
  const schedule = () => {
    if (i >= SSE_MOCK_EVENTS.length) return;
    tid = setTimeout(() => {
      onEvent(SSE_MOCK_EVENTS[i++]);
      schedule();
    }, 4000 + Math.random() * 6000);
  };
  schedule();
  return () => clearTimeout(tid);
}

// ─── Notification History & Management ────────────────────────────────────────
// GET /api/notifications/history
// POST /api/notifications/:id/read
// POST /api/notifications/read-all
// DELETE /api/notifications/:id

export async function fetchNotificationHistory(limit = 50): Promise<NotificationEvent[]> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/notifications/history?limit=${limit}`, { credentials: "include" });
    return r.json();
  }
  // Mock: return extended history
  await new Promise((res) => setTimeout(res, 300));
  return JSON.parse(JSON.stringify(MOCK_NOTIFICATION_HISTORY.slice(0, limit)));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
      method: "POST",
      credentials: "include",
    });
    return;
  }
  // Mock: no-op
  await new Promise((res) => setTimeout(res, 100));
}

export async function markAllNotificationsRead(): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: "POST",
      credentials: "include",
    });
    return;
  }
  // Mock: no-op
  await new Promise((res) => setTimeout(res, 200));
}

export async function deleteNotification(id: string): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/notifications/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    return;
  }
  // Mock: no-op
  await new Promise((res) => setTimeout(res, 100));
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export async function fetchUserPreferences(): Promise<UserPreferences> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/user/preferences`, { credentials: "include" });
    return r.json();
  }
  // localStorage fallback (swap for real API when backend is ready)
  const stored = localStorage.getItem("cerebrin_preferences");
  const defaults: UserPreferences = { user_id: "local", theme: "dark", language: "es", updated_at: new Date().toISOString() };
  return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/user/preferences`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    return;
  }
  const existing = JSON.parse(localStorage.getItem("cerebrin_preferences") ?? "{}");
  localStorage.setItem("cerebrin_preferences", JSON.stringify({ ...existing, ...prefs, updated_at: new Date().toISOString() }));
}

// ─── View Configs ──────────────────────────────────────────────────────────────

export async function fetchViewConfig(config_key: string): Promise<Record<string, boolean> | null> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/user/view-configs/${config_key}`, { credentials: "include" });
    if (!r.ok) return null;
    const data: ViewConfig = await r.json();
    return data.config_json;
  }
  const stored = localStorage.getItem(config_key);
  return stored ? JSON.parse(stored) : null;
}

export async function saveViewConfig(config_key: string, config_json: Record<string, boolean>): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/user/view-configs/${config_key}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config_key, config_json }),
    });
    return;
  }
  localStorage.setItem(config_key, JSON.stringify(config_json));
}

// ─── User Perspective ─────────────────────────────────────────────────────────
// → REAL: GET /api/users/me/perspective
// → REAL: PATCH /api/users/me/perspective
// → REAL: POST /api/users/me/perspective/reset
// Note: Types imported from UserPerspective context to avoid duplication

export async function fetchUserPerspective(): Promise<any | null> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/users/me/perspective`, { credentials: "include" });
    if (!r.ok) return null;
    return r.json();
  }
  // localStorage fallback (UserPerspective context handles this already)
  return null;
}

export async function updateUserPerspective(updates: any): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/users/me/perspective`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    return;
  }
  // localStorage handled by context
}

export async function resetUserPerspective(mode: "director" | "focus" | "custom"): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/users/me/perspective/reset`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    return;
  }
  // localStorage handled by context
}

// ─── Admin — Workspaces ────────────────────────────────────────────────────────

export async function fetchWorkspaces(): Promise<Workspace[]> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/admin/workspaces`, { credentials: "include" });
    return r.json();
  }
  return Promise.resolve(MOCK_WORKSPACES);
}

export async function patchCapacity(id: string, override: CapacityOverride): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/admin/workspaces/${id}/capacity`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(override),
    });
    return;
  }
  console.log("[mock] patchCapacity", id, override);
}

export async function impersonateWorkspace(id: string): Promise<ImpersonateResponse> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/admin/workspaces/${id}/impersonate`, {
      method: "POST", credentials: "include",
    });
    return r.json();
  }
  const ws = MOCK_WORKSPACES.find(w => w.id === id);
  return {
    token: `tok_mock_${Math.random().toString(36).slice(2)}`,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    workspace_name: ws?.name ?? id,
  };
}

// ─── Admin — Tickets ──────────────────────────────────────────────────────────

export async function fetchTickets(status?: string): Promise<SupportTicket[]> {
  if (BASE_URL) {
    const q = status ? `?status=${status}` : "";
    const r = await fetch(`${BASE_URL}/api/admin/tickets${q}`, { credentials: "include" });
    return r.json();
  }
  return Promise.resolve(
    status && status !== "all"
      ? MOCK_TICKETS.filter(t => t.status === status)
      : MOCK_TICKETS
  );
}

export async function sendTicketMessage(ticketId: string, body: string): Promise<TicketMessage> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/admin/tickets/${ticketId}/messages`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    return r.json();
  }
  return {
    id: `m_${Date.now()}`,
    role: "support",
    author: "Admin Nexo",
    body,
    created_at: "just now",
  };
}

// ─── Admin — Financial ────────────────────────────────────────────────────────

export async function fetchFinancialSummary(): Promise<FinancialSummary> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/admin/financial/summary`, { credentials: "include" });
    return r.json();
  }
  return Promise.resolve(MOCK_FINANCIAL_SUMMARY);
}

// ─── Strategic AI Router (Contract v3) ────────────────────────────────────────
// POST /api/ai
// taskType: STRATEGIC | ROUTINE | HIGH_RISK
// Response status: "OK" | "AWAITING_HUMAN_APPROVAL" | "BUDGET_EXCEEDED"

export type AITaskType = "STRATEGIC" | "ROUTINE" | "HIGH_RISK";

export interface AIRouterRequest {
  workspaceId: string;
  agentId: string;
  prompt: string;
  taskType: AITaskType;
  userId: string;
}

export interface AIRouterResponse {
  status: "OK" | "AWAITING_HUMAN_APPROVAL" | "BUDGET_EXCEEDED";
  result?: string;
  required_level?: number;  // used when AWAITING_HUMAN_APPROVAL
  current_level?: number;
  taskId?: string;
  budget_remaining?: number; // USD remaining when BUDGET_EXCEEDED
  limit_usd?: number;        // configured limit when BUDGET_EXCEEDED
}

const AI_MOCK_RESPONSES: Record<AITaskType, AIRouterResponse> = {
  ROUTINE:    { status: "OK",                       result: "Tarea procesada por el agente con éxito.",      taskId: "t_mock_routine" },
  STRATEGIC:  { status: "AWAITING_HUMAN_APPROVAL",  required_level: 3, current_level: 1,                    taskId: "t_mock_strategic" },
  HIGH_RISK:  { status: "BUDGET_EXCEEDED",           budget_remaining: 2.40, limit_usd: 150,                 taskId: "t_mock_high_risk" },
};

export async function callAIRouter(req: AIRouterRequest): Promise<AIRouterResponse> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/ai`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    return r.json();
  }
  // Mock: simulate a ~700ms processing delay
  await new Promise((res) => setTimeout(res, 700));
  return AI_MOCK_RESPONSES[req.taskType] ?? AI_MOCK_RESPONSES.ROUTINE;
}

// ─── Vault Secrets ────────────────────────────────────────────────────────────
// POST /api/vault/secrets

export interface VaultSecret {
  workspace_id: string;
  name: string;
  value: string;
  description?: string;
}

export async function createVaultSecret(secret: VaultSecret): Promise<{ id: string }> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/vault/secrets`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(secret),
    });
    return r.json();
  }
  return { id: `vs_${Math.random().toString(36).slice(2)}` };
}

// ─── Billing — Global66 Checkout ──────────────────────────────────────────────
// POST /api/billing/checkout → redirects to Global66
// Webhook return: /api/webhooks/global66

export interface BillingCheckoutRequest {
  workspace_id: string;
  plan_tier: string;
  return_url: string;
}

export interface BillingCheckoutResponse {
  checkout_url: string;  // → redirect to this URL (Global66)
  session_id: string;
}

export async function createBillingCheckout(req: BillingCheckoutRequest): Promise<BillingCheckoutResponse> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/billing/checkout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    return r.json();
  }
  // Mock: simulate Global66 redirect URL
  return {
    checkout_url: `https://global66.com/pay/mock?plan=${req.plan_tier}&session=${Math.random().toString(36).slice(2)}`,
    session_id: `sess_${Math.random().toString(36).slice(2)}`,
  };
}

// ─── Gatekeeper Logs ──────────────────────────────────────────────────────────
// GET /api/gatekeeper/logs

export interface GatekeeperLog {
  id: string;
  timestamp: string;
  agent_id: string;
  agent_name: string;
  action: "read" | "write" | "export" | "query" | "delete";
  resource: string;
  verdict: "ALLOWED" | "BLOCKED" | "REDIRECTED";
  rule_id: string;
  data_classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
}

const MOCK_GATEKEEPER_LOGS: GatekeeperLog[] = [
  { id: "gk1", timestamp: "2026-02-21 14:35", agent_id: "writer",   agent_name: "writer-bot",   action: "read",   resource: "cerebrin://docs/q1-strategy",       verdict: "ALLOWED",    rule_id: "R-001", data_classification: "INTERNAL"     },
  { id: "gk2", timestamp: "2026-02-21 14:22", agent_id: "analyst",  agent_name: "analyst-bot",  action: "write",  resource: "s3://private-bucket/hr-data.csv",   verdict: "BLOCKED",    rule_id: "R-004", data_classification: "CONFIDENTIAL" },
  { id: "gk3", timestamp: "2026-02-21 13:50", agent_id: "dev",      agent_name: "dev-bot",      action: "query",  resource: "cerebrin://workspace/team-emails",  verdict: "REDIRECTED", rule_id: "R-007", data_classification: "RESTRICTED"   },
  { id: "gk4", timestamp: "2026-02-21 13:10", agent_id: "writer",   agent_name: "writer-bot",   action: "read",   resource: "cerebrin://docs/brand-guidelines",  verdict: "ALLOWED",    rule_id: "R-001", data_classification: "PUBLIC"       },
  { id: "gk5", timestamp: "2026-02-21 12:44", agent_id: "analyst",  agent_name: "analyst-bot",  action: "export", resource: "api.external.com/v2/contacts",       verdict: "BLOCKED",    rule_id: "R-012", data_classification: "CONFIDENTIAL" },
  { id: "gk6", timestamp: "2026-02-21 12:01", agent_id: "strategy", agent_name: "strategy-bot", action: "query",  resource: "cerebrin://workspace/summary",       verdict: "ALLOWED",    rule_id: "R-002", data_classification: "INTERNAL"     },
  { id: "gk7", timestamp: "2026-02-21 11:20", agent_id: "dev",      agent_name: "dev-bot",      action: "delete", resource: "cerebrin://docs/temp-cache",         verdict: "BLOCKED",    rule_id: "R-015", data_classification: "INTERNAL"     },
];

export async function fetchGatekeeperLogs(agentId?: string): Promise<GatekeeperLog[]> {
  if (BASE_URL) {
    const q = agentId ? `?agent_id=${agentId}` : "";
    const r = await fetch(`${BASE_URL}/api/gatekeeper/logs${q}`, { credentials: "include" });
    return r.json();
  }
  return Promise.resolve(
    agentId
      ? MOCK_GATEKEEPER_LOGS.filter((l) => l.agent_id === agentId)
      : MOCK_GATEKEEPER_LOGS
  );
}

// ─── Survey / NPS Service ─────────────────────────────────────────────────────
// GET /api/surveys/active
// GET /api/surveys/nps

export interface Survey {
  id: string;
  title: string;
  type: "NPS" | "CSAT" | "Feature";
  active: boolean;
  responses: number;
  avg_score: number;
  created_at: string;
}

export interface NPSResult {
  score: number;          // -100 to +100 (NPS formula)
  promoters: number;      // % of 9-10 respondents
  passives: number;       // % of 7-8 respondents
  detractors: number;     // % of 0-6 respondents
  total_responses: number;
}

const MOCK_SURVEYS: Survey[] = [
  { id: "sv1", title: "Q1 2026 · NPS Mensual",        type: "NPS",     active: true,  responses: 73,  avg_score: 8.2, created_at: "2026-02-01" },
  { id: "sv2", title: "HITL Experience · CSAT",        type: "CSAT",    active: true,  responses: 41,  avg_score: 9.1, created_at: "2026-02-10" },
  { id: "sv3", title: "Feature Demand · Agent Swarm",  type: "Feature", active: false, responses: 128, avg_score: 0,   created_at: "2026-01-15" },
];

export const MOCK_NPS_RESULT: NPSResult = {
  score: 34,
  promoters: 55,
  passives: 24,
  detractors: 21,
  total_responses: 73,
};

export async function fetchActiveSurveys(): Promise<Survey[]> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/surveys/active`, { credentials: "include" });
    return r.json();
  }
  return Promise.resolve(MOCK_SURVEYS.filter((s) => s.active));
}

export async function calculateNPS(workspaceId?: string): Promise<NPSResult> {
  if (BASE_URL) {
    const q = workspaceId ? `?workspace_id=${workspaceId}` : "";
    const r = await fetch(`${BASE_URL}/api/surveys/nps${q}`, { credentials: "include" });
    return r.json();
  }
  return Promise.resolve(MOCK_NPS_RESULT);
}

// ─── Teams API (Section 16) ──────────────────────────────────────────────────
// GET    /api/workspace/teams
// POST   /api/workspace/teams
// PATCH  /api/workspace/teams/:id
// DELETE /api/workspace/teams/:id
// POST   /api/workspace/teams/:id/members
// DELETE /api/workspace/teams/:id/members/:memberId
// PATCH  /api/workspace/teams/:id/members/:memberId
// POST   /api/workspace/teams/:id/agents
// DELETE /api/workspace/teams/:id/agents/:agentId

export type TeamMemberRole = "Admin" | "Editor" | "Viewer";
export type TeamAgentType  = "CONTENT" | "DATA" | "STRATEGY" | "ENGINEERING" | "RESEARCH" | "LEGAL";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  isLead: boolean;
  initials: string;
  avatarColor: string;
}

export interface TeamAgent {
  id: string;
  name: string;
  type: TeamAgentType;
  active: boolean;
  tasksCompleted: number;
}

export interface TeamProject {
  id: string;
  name: string;
  progress: number;
  status: "active" | "at-risk" | "completed";
}

export interface Team {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
  members: TeamMember[];
  agents: TeamAgent[];
  projects: TeamProject[];
  createdAt: string;
}

// ─── Mock seed data ──────────────────────────────────────────────────────────

const MOCK_MEMBER_POOL: TeamMember[] = [
  { id: "u1", name: "Ana García",     email: "ana@company.com",    role: "Admin",  isLead: false, initials: "AG", avatarColor: "#6366F1" },
  { id: "u2", name: "Carlos Méndez", email: "carlos@company.com", role: "Editor", isLead: false, initials: "CM", avatarColor: "#10B981" },
  { id: "u3", name: "Laura Vega",    email: "laura@company.com",  role: "Editor", isLead: false, initials: "LV", avatarColor: "#F59E0B" },
  { id: "u4", name: "Tomás Ruiz",    email: "tomas@company.com",  role: "Viewer", isLead: false, initials: "TR", avatarColor: "#EF4444" },
  { id: "u5", name: "Sofía Herrera", email: "sofia@company.com",  role: "Admin",  isLead: false, initials: "SH", avatarColor: "#8B5CF6" },
  { id: "u6", name: "Diego Morales", email: "diego@company.com",  role: "Viewer", isLead: false, initials: "DM", avatarColor: "#3B82F6" },
];

const MOCK_AGENT_POOL: TeamAgent[] = [
  { id: "writer",     name: "Writer-Bot",     type: "CONTENT",     active: true,  tasksCompleted: 284 },
  { id: "analyst",    name: "Analyst-Bot",    type: "DATA",        active: true,  tasksCompleted: 412 },
  { id: "strategy",   name: "Strategy-Bot",   type: "STRATEGY",    active: true,  tasksCompleted: 156 },
  { id: "dev",        name: "Dev-Bot",        type: "ENGINEERING", active: true,  tasksCompleted: 331 },
  { id: "research",   name: "Research-Bot",   type: "RESEARCH",    active: false, tasksCompleted: 67  },
  { id: "compliance", name: "Compliance-Bot", type: "LEGAL",       active: false, tasksCompleted: 23  },
];

const MOCK_TEAMS_DATA: Team[] = [
  {
    id: "t1", name: "Growth Squad", emoji: "🚀", color: "#6366F1",
    description: "Equipo de crecimiento y marketing de producto. Responsable de MRR y adquisición.",
    createdAt: "Ene 2025",
    members: [
      { ...MOCK_MEMBER_POOL[0], isLead: true },
      { ...MOCK_MEMBER_POOL[1] },
      { ...MOCK_MEMBER_POOL[2] },
    ],
    agents: [MOCK_AGENT_POOL[0], MOCK_AGENT_POOL[1]],
    projects: [
      { id: "p1", name: "Q1 Marketing Initiative", progress: 58, status: "active"  },
      { id: "p2", name: "LATAM Expansion",          progress: 25, status: "at-risk" },
    ],
  },
  {
    id: "t2", name: "Platform Core", emoji: "⚙️", color: "#10B981",
    description: "Ingeniería de plataforma. Arquitectura, APIs, DevOps y seguridad.",
    createdAt: "Feb 2025",
    members: [
      { ...MOCK_MEMBER_POOL[4], isLead: true },
      { ...MOCK_MEMBER_POOL[3] },
    ],
    agents: [MOCK_AGENT_POOL[3], MOCK_AGENT_POOL[1]],
    projects: [
      { id: "p3", name: "Platform 3.0 Launch", progress: 41, status: "active" },
    ],
  },
  {
    id: "t3", name: "Strategy Office", emoji: "🎯", color: "#F59E0B",
    description: "Dirección estratégica y planificación corporativa de largo plazo.",
    createdAt: "Mar 2025",
    members: [{ ...MOCK_MEMBER_POOL[5], isLead: true }],
    agents: [MOCK_AGENT_POOL[2], MOCK_AGENT_POOL[4]],
    projects: [],
  },
];

// Simulated latency for mock API calls
const delay = (ms = 600) => new Promise<void>((res) => setTimeout(res, ms));

export async function fetchTeams(workspaceId = "ws_default"): Promise<Team[]> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/workspace/teams?workspace_id=${workspaceId}`, { credentials: "include" });
    return r.json();
  }
  await delay(500);
  return JSON.parse(JSON.stringify(MOCK_TEAMS_DATA)); // deep clone
}

export async function createTeam(workspaceId: string, data: Pick<Team, "name" | "description" | "color" | "emoji">): Promise<Team> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/workspace/teams`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId, ...data }),
    });
    return r.json();
  }
  await delay(400);
  return {
    id: `t_${Date.now()}`,
    members: [], agents: [], projects: [],
    createdAt: new Date().toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
    ...data,
  };
}

export async function updateTeam(teamId: string, data: Partial<Pick<Team, "name" | "description" | "color" | "emoji">>): Promise<Team> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/workspace/teams/${teamId}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return r.json();
  }
  await delay(350);
  const team = MOCK_TEAMS_DATA.find((t) => t.id === teamId);
  return { ...team!, ...data };
}

export async function deleteTeam(teamId: string): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/workspace/teams/${teamId}`, { method: "DELETE", credentials: "include" });
    return;
  }
  await delay(300);
}

export async function addTeamMember(teamId: string, memberId: string, role: TeamMemberRole): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/workspace/teams/${teamId}/members`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: memberId, role }),
    });
    return;
  }
  await delay(350);
  console.log("[mock] addTeamMember", { teamId, memberId, role });
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/workspace/teams/${teamId}/members/${memberId}`, { method: "DELETE", credentials: "include" });
    return;
  }
  await delay(300);
  console.log("[mock] removeTeamMember", { teamId, memberId });
}

export async function updateTeamMemberRole(teamId: string, memberId: string, role: TeamMemberRole): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/workspace/teams/${teamId}/members/${memberId}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    return;
  }
  await delay(250);
  console.log("[mock] updateTeamMemberRole", { teamId, memberId, role });
}

export async function toggleTeamLead(teamId: string, memberId: string, isLead: boolean): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/workspace/teams/${teamId}/members/${memberId}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_lead: isLead }),
    });
    return;
  }
  await delay(250);
  console.log("[mock] toggleTeamLead", { teamId, memberId, isLead });
}

export async function addTeamAgent(teamId: string, agentId: string): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/workspace/teams/${teamId}/agents`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });
    return;
  }
  await delay(350);
  console.log("[mock] addTeamAgent", { teamId, agentId });
}

export async function removeTeamAgent(teamId: string, agentId: string): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/workspace/teams/${teamId}/agents/${agentId}`, { method: "DELETE", credentials: "include" });
    return;
  }
  await delay(300);
  console.log("[mock] removeTeamAgent", { teamId, agentId });
}

// ─── n8n Automation Config (Section 10) ─────────────────────────────────────
// GET   /api/agents/:id/n8n-config
// PATCH /api/agents/:id/n8n-config
// POST  /api/agents/:id/n8n-config/test

export interface N8nAgentConfig {
  agent_id: string;
  enabled: boolean;
  webhook_url: string;
  events: string[];
  token_saver_enabled: boolean;
  token_saver_model: "gpt-3.5-turbo" | "mistral-7b" | "llama-3-8b";
  last_triggered?: string;
}

export interface N8nTestResult {
  success: boolean;
  latency_ms: number;
  message: string;
  status_code?: number;
}

const MOCK_N8N_CONFIG: N8nAgentConfig = {
  agent_id: "writer",
  enabled: false,
  webhook_url: "https://your-n8n-instance.app/webhook/cerebrin",
  events: ["nueva_idea", "cambio_estado", "tarea_completada", "idea_promovida"],
  token_saver_enabled: false,
  token_saver_model: "gpt-3.5-turbo",
};

export async function fetchAgentN8nConfig(agentId: string): Promise<N8nAgentConfig> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/agents/${agentId}/n8n-config`, { credentials: "include" });
    return r.json();
  }
  await delay(400);
  return { ...MOCK_N8N_CONFIG, agent_id: agentId };
}

export async function saveAgentN8nConfig(agentId: string, config: Omit<N8nAgentConfig, "agent_id">): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/agents/${agentId}/n8n-config`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return;
  }
  await delay(500);
  console.log("[mock] saveAgentN8nConfig", { agentId, config });
}

export async function testAgentN8nWebhook(agentId: string, webhookUrl: string): Promise<N8nTestResult> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/agents/${agentId}/n8n-config/test`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhook_url: webhookUrl }),
    });
    return r.json();
  }
  // Mock: ~80% success, random latency 120–650ms
  await delay(Math.random() * 500 + 800);
  const success = Math.random() > 0.2;
  const latency = Math.floor(Math.random() * 530 + 120);
  return {
    success,
    latency_ms: latency,
    message: success
      ? `Webhook OK — n8n respondió en ${latency}ms`
      : "Connection refused — verifica la URL y permisos de red",
    status_code: success ? 200 : 503,
  };
}

// ─── Performance Leaderboard (StrategicRaceHUD) ──────────────────────────────
// GET /api/performance/leaderboard

export interface LeaderboardEntry {
  rank: number;
  team: string;
  emoji: string;
  score: number;
  tasks: number;
  velocity: number;
  delta: string;
  positive: boolean;
  barColor: string;
  textColor: string;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, team: "Engineering", emoji: "⚙️", score: 9840, tasks: 142, velocity: 94, delta: "+12%", positive: true,  barColor: "bg-amber-500",   textColor: "text-amber-400"  },
  { rank: 2, team: "Marketing",   emoji: "📣", score: 8920, tasks: 118, velocity: 87, delta: "+8%",  positive: true,  barColor: "bg-violet-500",  textColor: "text-violet-400" },
  { rank: 3, team: "Strategy",    emoji: "🧠", score: 7650, tasks: 89,  velocity: 82, delta: "+15%", positive: true,  barColor: "bg-blue-500",    textColor: "text-blue-400"   },
  { rank: 4, team: "Revenue",     emoji: "💰", score: 6820, tasks: 76,  velocity: 78, delta: "+3%",  positive: true,  barColor: "bg-emerald-500", textColor: "text-emerald-400"},
  { rank: 5, team: "Operations",  emoji: "🔧", score: 5940, tasks: 62,  velocity: 71, delta: "-2%",  positive: false, barColor: "bg-rose-500",    textColor: "text-rose-400"   },
];

export async function fetchLeaderboard(workspaceId = "ws_default"): Promise<LeaderboardEntry[]> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/performance/leaderboard?workspace_id=${workspaceId}`, { credentials: "include" });
    return r.json();
  }
  await delay(800);
  // Simulate micro-variance on each fetch
  return MOCK_LEADERBOARD.map((entry) => ({
    ...entry,
    score: entry.score + Math.floor(Math.random() * 20 - 5),
    tasks: entry.tasks + (Math.random() > 0.5 ? 1 : 0),
  }));
}

// ─── Gamification Points API ─────────────────────────────────────────────────
// GET /api/gamification/points/:team_id
// POST /api/gamification/points (award points)

export interface PointsBreakdown {
  team_id: string;
  team_name: string;
  total_points: number;
  breakdown: {
    tasks_completed: number;
    projects_completed: number;
    ideas_promoted: number;
    hitl_approvals: number;
    velocity_bonus: number;
    other: number;
  };
  recent_activities: {
    id: string;
    action: string;
    points: number;
    timestamp: string;
    user_name: string;
  }[];
}

const MOCK_POINTS_BREAKDOWN: PointsBreakdown = {
  team_id: "team_engineering",
  team_name: "Engineering",
  total_points: 9840,
  breakdown: {
    tasks_completed: 4260,     // 142 tasks × 30 pts
    projects_completed: 3000,  // 6 projects × 500 pts
    ideas_promoted: 800,       // 8 ideas × 100 pts
    hitl_approvals: 600,       // 12 approvals × 50 pts
    velocity_bonus: 1180,      // Bonus por velocidad >90%
    other: 0,
  },
  recent_activities: [
    { id: "a1", action: "Proyecto 'Platform 3.0' completado", points: 500, timestamp: "hace 2h", user_name: "Ana García" },
    { id: "a2", action: "5 tareas completadas", points: 150, timestamp: "hace 4h", user_name: "Carlos Méndez" },
    { id: "a3", action: "Idea 'API Gateway' promovida", points: 100, timestamp: "hace 6h", user_name: "Laura Vega" },
    { id: "a4", action: "Aprobación HITL crítica", points: 50, timestamp: "hace 8h", user_name: "Ana García" },
    { id: "a5", action: "Bonus de velocidad semanal", points: 200, timestamp: "hace 1d", user_name: "Team Bonus" },
  ],
};

export async function fetchPointsBreakdown(teamId: string): Promise<PointsBreakdown> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/gamification/points/${teamId}`, { credentials: "include" });
    return r.json();
  }
  await delay(600);
  return JSON.parse(JSON.stringify(MOCK_POINTS_BREAKDOWN));
}

export interface AwardPointsRequest {
  team_id: string;
  user_id: string;
  points: number;
  reason: string;
}

export async function awardPoints(req: AwardPointsRequest): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/gamification/points`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    return;
  }
  await delay(400);
  console.log("[mock] awardPoints", req);
}

// ─── Semantic Resonance Search (DocumentManager) ──────────────────────────────
// POST /api/documents/semantic-search

export interface SemanticSearchRequest {
  query: string;
  workspace_id: string;
  limit?: number;
  category_filter?: DocumentCategory[];
}

export interface SemanticSearchResult {
  id: string;
  title: string;
  category: DocumentCategory;
  score: number;         // 0.0 - 1.0 (semantic similarity)
  excerpt: string;       // snippet with matching context
  metadata: DocumentMetadata;
  last_modified: string;
}

const MOCK_SEMANTIC_RESULTS: SemanticSearchResult[] = [
  {
    id: "doc_q1_strategy",
    title: "Q1 2026 · Strategic Roadmap",
    category: "Planificación",
    score: 0.94,
    excerpt: "...focus on strategic initiatives to drive growth and market expansion across LATAM...",
    metadata: { progress_pct: 72, priority_score: 9, weight: 1.5 },
    last_modified: "2026-02-18",
  },
  {
    id: "doc_market_research",
    title: "LATAM Market Research Analysis",
    category: "Investigación",
    score: 0.89,
    excerpt: "...comprehensive analysis of market opportunities and strategic positioning in key regions...",
    metadata: { progress_pct: 100, priority_score: 8, weight: 1.2 },
    last_modified: "2026-02-15",
  },
  {
    id: "doc_product_vision",
    title: "Product Vision 2026-2028",
    category: "Planificación",
    score: 0.81,
    excerpt: "...long-term strategic vision aligning product roadmap with organizational goals...",
    metadata: { progress_pct: 45, priority_score: 7, weight: 1.8 },
    last_modified: "2026-02-10",
  },
];

export async function querySemanticResonance(req: SemanticSearchRequest): Promise<SemanticSearchResult[]> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/documents/semantic-search`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    return r.json();
  }
  await delay(1200); // Simulate embedding + vector search latency
  // Mock: filter by category if provided
  let results = [...MOCK_SEMANTIC_RESULTS];
  if (req.category_filter && req.category_filter.length > 0) {
    results = results.filter((r) => req.category_filter!.includes(r.category));
  }
  // Apply limit
  if (req.limit) {
    results = results.slice(0, req.limit);
  }
  return results;
}

// ─── Idea Promotion (StrategyLab) ─────────────────────────────────────────────
// POST /api/ideas/promote

export interface PromoteIdeaRequest {
  workspace_id: string;
  idea_id: string;
  title: string;
  description: string;
  scores?: {
    fit: number;
    strategic: number;
    market: number;
    confidence: number;
  };
}

export interface PromoteIdeaResponse {
  project_id: string;
  idea_number: number;      // Serial auto-increment from DB
  promoted_at: string;
  project_url: string;
}

let MOCK_IDEA_COUNTER = 1042; // Mock serial counter

export async function promoteIdea(req: PromoteIdeaRequest): Promise<PromoteIdeaResponse> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/ideas/promote`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    return r.json();
  }
  await delay(900);
  // Mock: increment serial counter
  const ideaNumber = MOCK_IDEA_COUNTER++;
  const projectId = `proj_${Date.now()}`;
  return {
    project_id: projectId,
    idea_number: ideaNumber,
    promoted_at: new Date().toISOString(),
    project_url: `/projects/${projectId}`,
  };
}

// ─── Survey Builder (FeedbackCenter) ──────────────────────────────────────────
// POST /api/surveys/create
// GET  /api/surveys/:surveyId/responses

export interface CreateSurveyRequest {
  workspace_id: string;
  title: string;
  question_type: "NPS" | "CSAT" | "Feature" | "Text";
  question_text: string;
  target_audience: "all" | "pro" | "enterprise" | "new" | "at_risk";
  target_count?: number;
  active?: boolean;
}

export interface CreateSurveyResponse {
  survey_id: string;
  created_at: string;
  target_count: number;
  estimated_delivery: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  workspace_id: string;
  workspace_name: string;
  score?: number;      // For NPS/CSAT
  text?: string;       // For text responses
  created_at: string;
}

export async function createSurvey(req: CreateSurveyRequest): Promise<CreateSurveyResponse> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/surveys/create`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    return r.json();
  }
  await delay(1200);
  // Mock: calculate target count based on audience
  const allWorkspaces = MOCK_WORKSPACES.length;
  let targetCount = allWorkspaces;
  if (req.target_audience === "pro") {
    targetCount = MOCK_WORKSPACES.filter(w => w.tier === "Pro").length;
  } else if (req.target_audience === "enterprise") {
    targetCount = MOCK_WORKSPACES.filter(w => w.tier === "Enterprise").length;
  } else if (req.target_audience === "new") {
    targetCount = 3; // Mock: new workspaces
  } else if (req.target_audience === "at_risk") {
    targetCount = MOCK_WORKSPACES.filter(w => w.health === "at-risk").length;
  }

  return {
    survey_id: `sv_${Date.now()}`,
    created_at: new Date().toISOString(),
    target_count: targetCount,
    estimated_delivery: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // +15 min
  };
}

export async function fetchSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/surveys/${surveyId}/responses`, { credentials: "include" });
    return r.json();
  }
  await delay(800);
  // Mock: generate fake responses
  return MOCK_WORKSPACES.slice(0, 5).map((ws, i) => ({
    id: `resp_${i}`,
    survey_id: surveyId,
    workspace_id: ws.id,
    workspace_name: ws.name,
    score: Math.floor(Math.random() * 11), // 0-10 for NPS
    created_at: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
  }));
}

// ─── HITL (Human-In-The-Loop) Tickets ──────────────────────────────────────────
// GET  /api/hitl/tickets
// POST /api/hitl/tickets/:id/approve
// POST /api/hitl/tickets/:id/reject
// POST /api/hitl/tickets/:id/comments

export type HITLTicketStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type AgentType = "RESEARCHER" | "WRITER" | "MANAGER" | "ANALYST" | "DEV" | "STRATEGY";
export type HITLAction = "CREATE_TASK" | "UPDATE_TASK" | "DELETE_TASK" | "CREATE_PROJECT" | "UPDATE_STRATEGY" | "EXECUTE_WORKFLOW";

export interface HITLComment {
  id: string;
  author: string;
  role: "human" | "agent";
  body: string;
  created_at: string;
}

export interface HITLTicket {
  id: string;                      // T-1000, T-1001, etc.
  ticket_number: number;           // Sequential: 1000, 1001, etc.
  workspace_id: string;
  workspace_name: string;
  agent_type: AgentType;
  agent_name: string;
  action: HITLAction;
  title: string;
  description: string;
  rationale: string;              // AI explanation
  priority: "critical" | "high" | "medium" | "low";
  status: HITLTicketStatus;
  context: Record<string, unknown>; // Full context payload
  estimated_impact?: string;
  created_at: string;
  updated_at: string;
  approved_by?: string;
  rejected_by?: string;
  comments: HITLComment[];
}

// Mock HITL Tickets
const MOCK_HITL_TICKETS: HITLTicket[] = [
  {
    id: "T-1008",
    ticket_number: 1008,
    workspace_id: "ws1",
    workspace_name: "Stark Industries",
    agent_type: "WRITER",
    agent_name: "writer-bot",
    action: "CREATE_TASK",
    title: "Crear reporte ejecutivo Q4 2026",
    description: "El agente propone crear una tarea para generar el reporte trimestral Q4 con datos actualizados de CRM",
    rationale: "Análisis de calendario detectó proximidad de board meeting (3 días). Stakeholders requieren executive summary actualizado con métricas Q4. Confianza: 91%",
    priority: "high",
    status: "PENDING",
    context: {
      task_title: "Draft Q4 Executive Report",
      assignee: "writer-bot",
      estimated_hours: 4,
      deadline: "2026-02-25",
      project_id: "proj_123",
    },
    estimated_impact: "Elimina 4h de trabajo manual + garantiza entrega puntual",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    comments: [],
  },
  {
    id: "T-1007",
    ticket_number: 1007,
    workspace_id: "ws2",
    workspace_name: "Wayne Enterprises",
    agent_type: "ANALYST",
    agent_name: "analyst-bot",
    action: "UPDATE_STRATEGY",
    title: "Actualizar proyección de ingresos Q1 2027",
    description: "Recalibrar modelo financiero basado en actuals de enero (+18% vs forecast)",
    rationale: "Actuals de enero vía n8n + HubSpot mostraron +18% sobre baseline. Modelo actual desactualizado. Riesgo: forecasts incorrectos para board. Confianza: 96%",
    priority: "critical",
    status: "PENDING",
    context: {
      current_projection: "$2.4M",
      new_projection: "$2.83M",
      variance_pct: 18,
      data_source: "HubSpot CRM",
      affected_okrs: ["OKR-2026-R1", "OKR-2026-R2"],
    },
    estimated_impact: "Corrige planning gap de $430K — previene bad decisions",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    comments: [
      {
        id: "c1",
        author: "Bruce W.",
        role: "human",
        body: "¿Cuál es el nivel de confianza en los datos de HubSpot? ¿Se validaron manualmente?",
        created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      },
    ],
  },
  {
    id: "T-1006",
    ticket_number: 1006,
    workspace_id: "ws3",
    workspace_name: "Acme Corp",
    agent_type: "DEV",
    agent_name: "dev-bot",
    action: "EXECUTE_WORKFLOW",
    title: "Migrar autenticación a OAuth 2.0",
    description: "Refactorizar capa de auth para cumplimiento SOC2 — afecta 14 endpoints",
    rationale: "Auditoría SOC2 Type II flagged JWT implementation como non-compliant. OAuth 2.0 PKCE es requirement. 14 endpoints across 3 services requieren migration. ETA: 8h",
    priority: "high",
    status: "APPROVED",
    context: {
      current_method: "JWT (HS256)",
      target_method: "OAuth 2.0 (PKCE)",
      affected_endpoints: 14,
      affected_services: ["auth-service", "api-gateway", "user-service"],
      soc2_requirement: true,
    },
    estimated_impact: "100% SOC2 compliance + better security posture",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    approved_by: "Ana García",
    comments: [
      {
        id: "c2",
        author: "Ana García",
        role: "human",
        body: "Aprobado. Por favor coordinar con equipo de seguridad antes de ejecutar.",
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: "T-1005",
    ticket_number: 1005,
    workspace_id: "ws4",
    workspace_name: "TechVentures",
    agent_type: "RESEARCHER",
    agent_name: "research-bot",
    action: "CREATE_PROJECT",
    title: "Iniciar análisis competitivo AI landscape 2026",
    description: "Proyecto de investigación: mapear 50+ competidores emergentes en AI strategy tools",
    rationale: "G2 monitoring detectó 12 nuevos competidores en últimos 90 días. Fit score promedio: 7.8/10. Requiere deep competitive analysis para defensibilidad",
    priority: "medium",
    status: "REJECTED",
    context: {
      project_name: "AI Competitive Landscape 2026",
      estimated_duration: "4 weeks",
      deliverables: ["Market map", "Feature comparison", "Pricing analysis"],
      budget_estimate: "$2,400",
    },
    estimated_impact: "Strategic visibility + informed product roadmap decisions",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    rejected_by: "Carlos Méndez",
    comments: [
      {
        id: "c3",
        author: "Carlos Méndez",
        role: "human",
        body: "Ya tenemos un análisis similar en curso. Rechazado por duplicación.",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
    ],
  },
  {
    id: "T-1004",
    ticket_number: 1004,
    workspace_id: "ws5",
    workspace_name: "Momentum Labs",
    agent_type: "STRATEGY",
    agent_name: "strategy-bot",
    action: "UPDATE_STRATEGY",
    title: "Ajustar OKRs Q1 basado en performance enero",
    description: "Proponer ajustes a 3 key results basados en actual performance vs targets",
    rationale: "January actuals: 2 KRs at 140% (overperforming), 1 KR at 45% (at-risk). Recommended: aumentar targets en KR1/KR2, refocus resources en KR3",
    priority: "medium",
    status: "PENDING",
    context: {
      kr1: { name: "MRR Growth", current: "140%", proposed: "Aumentar target +25%" },
      kr2: { name: "User Acquisition", current: "138%", proposed: "Aumentar target +20%" },
      kr3: { name: "Churn Reduction", current: "45%", proposed: "Refocus — add resources" },
    },
    estimated_impact: "OKRs más realistas + resource allocation óptimo",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    comments: [],
  },
];

export async function fetchHITLTickets(status?: HITLTicketStatus): Promise<HITLTicket[]> {
  if (BASE_URL) {
    const q = status ? `?status=${status}` : "";
    const r = await fetch(`${BASE_URL}/api/hitl/tickets${q}`, { credentials: "include" });
    return r.json();
  }
  await delay(400);
  return Promise.resolve(
    status
      ? MOCK_HITL_TICKETS.filter((t) => t.status === status)
      : MOCK_HITL_TICKETS
  );
}

export async function approveHITLTicket(ticketId: string, approver: string): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/hitl/tickets/${ticketId}/approve`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approver }),
    });
    return;
  }
  await delay(500);
  console.log(`[mock] Approved HITL ticket ${ticketId} by ${approver}`);
}

export async function rejectHITLTicket(ticketId: string, rejector: string, reason?: string): Promise<void> {
  if (BASE_URL) {
    await fetch(`${BASE_URL}/api/hitl/tickets/${ticketId}/reject`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejector, reason }),
    });
    return;
  }
  await delay(500);
  console.log(`[mock] Rejected HITL ticket ${ticketId} by ${rejector}:`, reason);
}

export async function addHITLComment(ticketId: string, author: string, body: string): Promise<HITLComment> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/hitl/tickets/${ticketId}/comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, body }),
    });
    return r.json();
  }
  await delay(300);
  return {
    id: `c_${Date.now()}`,
    author,
    role: "human",
    body,
    created_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT MARKETPLACE
// ─────────────────────────────────────────────────────────────────────────────

export interface MarketplaceAgent {
  id: string;
  name: string;
  specialty: string;
  tier: string;
  description: string;
  credits: number;
  rating: number;
  reviews: number;
  model: string;
  base_config: {
    system_prompt: string;
    autonomy_level: number;
    permission_package: string;
    default_permissions: Record<string, string>;
  };
}

export interface HireAgentRequest {
  agent_id: string;
  workspace_id: string;
}

export interface HireAgentResponse {
  success: boolean;
  cloned_agent_id: string;
  credits_deducted: number;
  credits_remaining: number;
  agent_name: string;
}

export interface WorkspaceCredits {
  balance: number;
  total_earned: number;
  total_spent: number;
  last_updated: string;
}

/**
 * GET /api/marketplace/agents
 * Fetch available agents in marketplace
 */
export async function fetchMarketplaceAgents(): Promise<MarketplaceAgent[]> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/marketplace/agents`, {
      credentials: "include",
    });
    return r.json();
  }
  // Mock handled in component
  return [];
}

/**
 * POST /api/marketplace/agents/:id/hire
 * Clone marketplace agent to workspace
 * 
 * BACKEND LOGIC:
 * 1. Validate workspace has sufficient credits
 * 2. Validate workspace has available agent slots
 * 3. Clone agent template to workspace's agents table
 * 4. Deduct credits from workspace
 * 5. Send notification event
 */
export async function hireMarketplaceAgent(req: HireAgentRequest): Promise<HireAgentResponse> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/marketplace/agents/${req.agent_id}/hire`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: req.workspace_id }),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.message || "Failed to hire agent");
    }
    return r.json();
  }

  // Mock implementation
  await delay(1200); // Simulate backend processing

  // Simulate validation checks (handled in component)
  return {
    success: true,
    cloned_agent_id: `agent_${Date.now()}`,
    credits_deducted: 150, // Mock value, real value from agent.credits
    credits_remaining: 690, // Mock value, real value from workspace credits
    agent_name: "Market Intel Pro", // Mock value
  };
}

/**
 * GET /api/workspaces/:id/credits
 * Fetch workspace credit balance
 */
export async function fetchWorkspaceCredits(workspaceId: string): Promise<WorkspaceCredits> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/credits`, {
      credentials: "include",
    });
    return r.json();
  }

  await delay(300);
  return {
    balance: 840,
    total_earned: 1000,
    total_spent: 160,
    last_updated: new Date().toISOString(),
  };
}

/**
 * POST /api/workspaces/:id/credits/deduct
 * Deduct credits from workspace (admin only)
 */
export async function deductWorkspaceCredits(
  workspaceId: string,
  amount: number,
  reason: string
): Promise<WorkspaceCredits> {
  if (BASE_URL) {
    const r = await fetch(`${BASE_URL}/api/workspaces/${workspaceId}/credits/deduct`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason }),
    });
    return r.json();
  }

  await delay(300);
  return {
    balance: 690,
    total_earned: 1000,
    total_spent: 310,
    last_updated: new Date().toISOString(),
  };
}