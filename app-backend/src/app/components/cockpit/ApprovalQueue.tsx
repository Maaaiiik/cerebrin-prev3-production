import { useState } from "react";
import { Bot, Check, Clock, FileText, Lightbulb, ListTodo, RotateCcw, X, Zap } from "lucide-react";
import { cn } from "../ui/utils";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { useAppPreferences } from "../../contexts/AppPreferences";
import { toast } from "sonner";
import { VisualDiffSheet, type VisualDiffItem } from "./VisualDiffSheet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalItem {
  id: number;
  correlativeId: string;
  actionType: "CREATE" | "UPDATE" | "DELETE";
  entityType: "TASK" | "IDEA" | "PROJECT";
  agent: string;
  agentColor: string;
  title: string;
  description: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  time: string;
  origin?: "n8n";
  proposed_data: {
    assignee_type: "HUMAN" | "AGENT";
    metadata?: { estimated_hours?: number; weight?: number };
  };
  diff: VisualDiffItem["diff"];
  rationale?: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const initialQueue: ApprovalItem[] = [
  {
    id: 1,
    correlativeId: "TASK-001",
    actionType: "CREATE",
    entityType: "TASK",
    agent: "writer-bot",
    agentColor: "#8B5CF6",
    title: "Draft Q3 Marketing Report",
    description: "Create 2-page executive summary for stakeholder meeting on Friday",
    urgency: "HIGH",
    time: "2m ago",
    proposed_data: { assignee_type: "AGENT", metadata: { estimated_hours: 3, weight: 0.8 } },
    rationale: "Identified gap in Q3 reporting cycle based on calendar analysis. Stakeholder meeting scheduled for Friday requires an executive-grade summary. Estimated 3h of writing time with high confidence (91%).",
    diff: [
      { key: "title",           label: "Título",          before: null,              after: "Draft Q3 Marketing Report",   changed: true,  isNew: true,  risk: "low" },
      { key: "assignee",        label: "Asignado a",      before: null,              after: "writer-bot (Agente)",          changed: true,  isNew: true,  risk: "low" },
      { key: "estimated_hours", label: "Horas estimadas", before: null,              after: "3h",                           changed: true,  isNew: true,  risk: "low" },
      { key: "weight",          label: "Peso (Progreso)", before: null,              after: "0.8",                          changed: true,  isNew: true,  risk: "low" },
      { key: "priority",        label: "Prioridad",       before: null,              after: "HIGH",                         changed: true,  isNew: true,  risk: "medium" },
      { key: "project",         label: "Proyecto",        before: null,              after: "Q1 Marketing Initiative",      changed: true,  isNew: true,  risk: "low" },
    ],
  },
  {
    id: 2,
    correlativeId: "TASK-002",
    actionType: "UPDATE",
    entityType: "TASK",
    agent: "analyst-bot",
    agentColor: "#3B82F6",
    title: "Update Revenue Forecast Model",
    description: "Recalibrate Q4 projections based on October actuals — delta: +12%",
    urgency: "HIGH",
    time: "5m ago",
    origin: "n8n",
    proposed_data: { assignee_type: "AGENT", metadata: { estimated_hours: 5, weight: 1.0 } },
    rationale: "October actuals received via n8n automation from HubSpot CRM. Detected +12% positive variance against Q4 projection baseline. Model recalibration required before board review. High confidence (94%) in new numbers.",
    diff: [
      { key: "q4_projection", label: "Proyección Q4",    before: "$1.2M",  after: "$1.34M (+12%)",     changed: true,  risk: "medium" },
      { key: "status",        label: "Estado",           before: "In Review", after: "In Progress",    changed: true,  risk: "low" },
      { key: "weight",        label: "Peso (Progreso)",  before: "0.6",    after: "1.0",               changed: true,  risk: "low" },
      { key: "confidence",    label: "Confianza IA",     before: "81%",    after: "94%",               changed: true,  risk: "low" },
      { key: "est_hours",     label: "Horas estimadas",  before: "3h",     after: "5h",                changed: true,  risk: "low" },
      { key: "assignee",      label: "Asignado a",       before: "Human",  after: "analyst-bot",       changed: false, risk: "low" },
    ],
  },
  {
    id: 3,
    correlativeId: "IDEA-001",
    actionType: "CREATE",
    entityType: "IDEA",
    agent: "strategy-bot",
    agentColor: "#10B981",
    title: "Launch Partner Portal MVP",
    description: "New idea generated from competitive landscape analysis (Fit: 8.4)",
    urgency: "MEDIUM",
    time: "12m ago",
    origin: "n8n",
    proposed_data: { assignee_type: "HUMAN", metadata: { weight: 0.6 } },
    rationale: "Competitive landscape analysis triggered via n8n from G2 monitoring. 3 top competitors launched partner portals in last 90 days. Opportunity fit score: 8.4/10 based on ICP alignment and revenue model.",
    diff: [
      { key: "title",       label: "Título de Idea",   before: null, after: "Launch Partner Portal MVP",    changed: true, isNew: true, risk: "low" },
      { key: "fit_score",   label: "Score de Fit",     before: null, after: "8.4 / 10",                    changed: true, isNew: true, risk: "low" },
      { key: "impact",      label: "Impacto estimado", before: null, after: "Alto — +30% pipeline Q1",     changed: true, isNew: true, risk: "medium" },
      { key: "effort",      label: "Esfuerzo",         before: null, after: "Medio — 6–8 semanas",         changed: true, isNew: true, risk: "low" },
      { key: "source",      label: "Fuente",           before: null, after: "G2 Competitive Intelligence", changed: true, isNew: true, risk: "low" },
    ],
  },
  {
    id: 4,
    correlativeId: "TASK-003",
    actionType: "UPDATE",
    entityType: "TASK",
    agent: "dev-bot",
    agentColor: "#F59E0B",
    title: "Refactor API Auth Layer",
    description: "Migrate from JWT to OAuth 2.0 — affects 14 endpoints across 3 services",
    urgency: "HIGH",
    time: "18m ago",
    proposed_data: { assignee_type: "AGENT", metadata: { estimated_hours: 8, weight: 0.9 } },
    rationale: "Security audit flagged JWT implementation as non-compliant with SOC2 Type II requirements. OAuth 2.0 migration will affect 14 endpoints across auth, api, and gateway services. Estimated 8h with 93% confidence.",
    diff: [
      { key: "auth_method",  label: "Método de Auth",  before: "JWT (HS256)",   after: "OAuth 2.0 (PKCE)", changed: true,  risk: "high" },
      { key: "est_hours",    label: "Horas estimadas", before: "4h",            after: "8h",               changed: true,  risk: "medium" },
      { key: "weight",       label: "Peso (Progreso)", before: "0.5",           after: "0.9",              changed: true,  risk: "low" },
      { key: "endpoints",    label: "Endpoints afect.", before: "0",            after: "14",               changed: true,  risk: "high" },
      { key: "soc2_flag",    label: "Flag SOC2",       before: "⚠ No compliant", after: "✓ Compliant",    changed: true,  risk: "low" },
    ],
  },
  {
    id: 5,
    correlativeId: "TASK-004",
    actionType: "CREATE",
    entityType: "TASK",
    agent: "writer-bot",
    agentColor: "#8B5CF6",
    title: "Localize Landing Page (ES/PT)",
    description: "Translate and culturally adapt copy for LATAM market entry campaign",
    urgency: "MEDIUM",
    time: "25m ago",
    proposed_data: { assignee_type: "AGENT", metadata: { estimated_hours: 4, weight: 0.5 } },
    diff: [
      { key: "title",     label: "Título",          before: null, after: "Localize Landing Page (ES/PT)", changed: true, isNew: true, risk: "low" },
      { key: "languages", label: "Idiomas",         before: null, after: "Español (LATAM) + Português",  changed: true, isNew: true, risk: "low" },
      { key: "pages",     label: "Páginas",         before: null, after: "Home, Pricing, Features",      changed: true, isNew: true, risk: "low" },
      { key: "est_hours", label: "Horas estimadas", before: null, after: "4h",                           changed: true, isNew: true, risk: "low" },
    ],
  },
  {
    id: 6,
    correlativeId: "PROJ-001",
    actionType: "CREATE",
    entityType: "PROJECT",
    agent: "strategy-bot",
    agentColor: "#10B981",
    title: "2026 OKR Cascade Plan",
    description: "Auto-generated project scaffold based on annual strategic objectives",
    urgency: "LOW",
    time: "41m ago",
    proposed_data: { assignee_type: "HUMAN", metadata: { weight: 0.7 } },
    diff: [
      { key: "name",    label: "Nombre de Proyecto", before: null, after: "2026 OKR Cascade Plan",     changed: true, isNew: true, risk: "medium" },
      { key: "phases",  label: "Fases",              before: null, after: "Discovery → Planning → Exec", changed: true, isNew: true, risk: "low" },
      { key: "okrs",    label: "OKRs vinculados",    before: null, after: "4 objetivos corporativos",   changed: true, isNew: true, risk: "low" },
      { key: "owner",   label: "Propietario",        before: null, after: "Human (sin asignar)",        changed: true, isNew: true, risk: "low" },
    ],
  },
];

// ─── Style maps ───────────────────────────────────────────────────────────────

const urgencyConfig = {
  HIGH:   { label: "Urgent", class: "bg-red-500/15 text-red-400 border-red-500/30" },
  MEDIUM: { label: "Medium", class: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  LOW:    { label: "Low",    class: "bg-muted text-muted-foreground border-border" },
};

const actionConfig = {
  CREATE: { label: "CREATE", class: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  UPDATE: { label: "UPDATE", class: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  DELETE: { label: "DELETE", class: "bg-red-500/20 text-red-300 border-red-500/30" },
};

const entityIcon: Record<string, React.ElementType> = {
  TASK: ListTodo,
  IDEA: Lightbulb,
  PROJECT: FileText,
};

const entityTypeConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
  TASK:    { color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/25",   label: "Tarea" },
  IDEA:    { color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/25",  label: "Idea" },
  PROJECT: { color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25", label: "Proyecto" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ApprovalQueue() {
  const { t } = useAppPreferences();
  const [queue, setQueue] = useState(initialQueue);
  const [processing, setProcessing] = useState<Record<number, "approving" | "rejecting" | null>>({});

  // Visual Diff Sheet
  const [diffItem, setDiffItem] = useState<VisualDiffItem | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);

  // Confirm dialog
  const [confirmItem, setConfirmItem] = useState<ApprovalItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">("approve");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestAction = (item: ApprovalItem, action: "approve" | "reject") => {
    setConfirmItem(item);
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const executeAction = () => {
    if (!confirmItem) return;
    const item = confirmItem;
    const action = confirmAction;
    const etCfg = entityTypeConfig[item.entityType] ?? entityTypeConfig.TASK;

    setProcessing((prev) => ({ ...prev, [item.id]: action === "approve" ? "approving" : "rejecting" }));
    setTimeout(() => {
      setQueue((prev) => prev.filter((q) => q.id !== item.id));
      setProcessing((prev) => ({ ...prev, [item.id]: null }));

      if (action === "approve") {
        toast.success("Acción aprobada", {
          description: (
            <span className="flex items-center gap-2">
              <span className={cn("font-mono text-[10px]", etCfg.color)}>{item.correlativeId}</span>
              <span className="truncate max-w-[140px] text-muted-foreground">{item.title}</span>
            </span>
          ),
          action: {
            label: "Deshacer",
            onClick: () => {
              setQueue((prev) => [item, ...prev]);
              toast("Aprobación revertida", {
                description: `${item.correlativeId} regresó a la cola`,
                icon: <RotateCcw className="w-3.5 h-3.5" />,
              });
            },
          },
          duration: 6000,
        });
      } else {
        toast.error("Acción rechazada", {
          description: (
            <span className="flex items-center gap-2">
              <span className={cn("font-mono text-[10px]", etCfg.color)}>{item.correlativeId}</span>
              <span className="truncate max-w-[140px] text-muted-foreground">{item.title}</span>
            </span>
          ),
          action: {
            label: "Deshacer",
            onClick: () => {
              setQueue((prev) => [item, ...prev]);
              toast("Rechazo revertido", {
                description: `${item.correlativeId} regresó a la cola`,
                icon: <RotateCcw className="w-3.5 h-3.5" />,
              });
            },
          },
          duration: 6000,
        });
      }
    }, 600);
    setConfirmOpen(false);
  };

  const openDiff = (item: ApprovalItem) => {
    setDiffItem({
      id: item.id,
      correlativeId: item.correlativeId,
      actionType: item.actionType,
      entityType: item.entityType,
      agent: item.agent,
      agentColor: item.agentColor,
      title: item.title,
      description: item.description,
      urgency: item.urgency,
      time: item.time,
      origin: item.origin,
      diff: item.diff,
      rationale: item.rationale,
    });
    setDiffOpen(true);
  };

  const handleDiffApprove = (id: number) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const handleDiffReject = (id: number) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <h3 className="text-foreground text-sm" style={{ fontWeight: 600 }}>
              Approval Queue
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            {queue.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {queue.length} pending
              </span>
            )}
            <span className="text-xs text-muted-foreground">AI actions awaiting your approval</span>
          </div>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground shrink-0">HITL Active</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
        </div>

        {/* Cards Row */}
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {queue.length === 0 ? (
            <div className="h-32 flex items-center justify-center">
              <div className="text-center">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">All caught up — queue is clear</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 pb-1" style={{ minWidth: "max-content" }}>
              {queue.map((item) => {
                const EntityIcon = entityIcon[item.entityType] || ListTodo;
                const isProcessing = processing[item.id];
                const etCfg = entityTypeConfig[item.entityType] ?? entityTypeConfig.TASK;
                const changedCount = item.diff.filter((f) => f.changed).length;
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex flex-col justify-between rounded-2xl border bg-card border-border/60 p-4 transition-all duration-500",
                      "w-72 shrink-0",
                      isProcessing === "approving" && "opacity-0 scale-95 border-blue-500/50 bg-blue-500/10",
                      isProcessing === "rejecting" && "opacity-0 scale-95 border-red-500/50 bg-red-500/10"
                    )}
                  >
                    {/* Top row */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Entity type + correlative ID badge */}
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs",
                              etCfg.bg, etCfg.border, etCfg.color
                            )}
                          >
                            <span style={{ fontWeight: 600 }}>{etCfg.label}</span>
                            <span className="font-mono text-[10px] opacity-70">{item.correlativeId}</span>
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md border text-xs",
                              actionConfig[item.actionType].class
                            )}
                          >
                            {item.actionType}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-md border text-xs",
                              urgencyConfig[item.urgency].class
                            )}
                          >
                            {urgencyConfig[item.urgency].label}
                          </span>
                          {/* n8n origin badge */}
                          {item.origin === "n8n" && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border text-xs"
                              style={{ backgroundColor: "#EA4B0015", borderColor: "#EA4B0040", color: "#EA4B00", fontSize: 10, fontWeight: 700 }}
                            >
                              ⚡ n8n
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground/60 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5 mb-2">
                        <div className={cn("shrink-0 w-8 h-8 rounded-xl border flex items-center justify-center", etCfg.bg, etCfg.border)}>
                          <EntityIcon className={cn("w-4 h-4", etCfg.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate" style={{ fontWeight: 500 }}>
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Agent info */}
                      <div className="flex items-center gap-1.5 mb-2">
                        {/* Mini hexagon for agent */}
                        <div
                          className="w-4 h-4 flex items-center justify-center"
                          style={{
                            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                            backgroundColor: `${item.agentColor}25`,
                          }}
                        />
                        <Bot className="w-3 h-3" style={{ color: item.agentColor }} />
                        <span className="text-xs" style={{ color: item.agentColor }}>{item.agent}</span>
                        {item.proposed_data.metadata?.estimated_hours && (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-xs text-muted-foreground">
                              ~{item.proposed_data.metadata.estimated_hours}h
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Diff preview pill */}
                      <button
                        onClick={() => openDiff(item)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/35 transition-all mb-2.5 group"
                      >
                        <span className="text-violet-400/70 group-hover:text-violet-300 transition-colors" style={{ fontSize: 10 }}>
                          {changedCount} cambio{changedCount !== 1 ? "s" : ""} propuesto{changedCount !== 1 ? "s" : ""}
                        </span>
                        <span className="ml-auto text-violet-500/50 group-hover:text-violet-400 transition-colors" style={{ fontSize: 10, fontWeight: 700 }}>
                          Ver Diff →
                        </span>
                      </button>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => requestAction(item, "approve")}
                        disabled={!!isProcessing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span className="text-xs" style={{ fontWeight: 600 }}>Approve</span>
                      </button>
                      <button
                        onClick={() => requestAction(item, "reject")}
                        disabled={!!isProcessing}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={executeAction}
        variant={confirmAction === "approve" ? "promote" : "destructive"}
        title={confirmAction === "approve" ? "¿Confirmar aprobación?" : "¿Confirmar rechazo?"}
        description={
          confirmAction === "approve"
            ? "Esta acción autorizará al agente de IA a ejecutar la operación propuesta."
            : "Esta acción rechazará la operación propuesta. El agente no podrá ejecutarla hasta ser reautorizado."
        }
        confirmLabel={confirmAction === "approve" ? "Aprobar" : "Rechazar"}
        entityId={confirmItem?.correlativeId}
        entityTitle={confirmItem?.title}
      />

      {/* Visual Diff Sheet */}
      <VisualDiffSheet
        item={diffItem}
        open={diffOpen}
        onOpenChange={setDiffOpen}
        onApprove={handleDiffApprove}
        onReject={handleDiffReject}
      />
    </div>
  );
}