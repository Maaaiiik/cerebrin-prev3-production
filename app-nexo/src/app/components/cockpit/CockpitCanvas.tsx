import * as React from "react";
import {
  Bot,
  Check,
  CheckCircle2,
  DollarSign,
  FolderKanban,
  GripVertical,
  Lock,
  MoreHorizontal,
  RefreshCw,
  Settings2,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { useUserPerspective } from "../../contexts/UserPerspective";
import { useFeature } from "../../contexts/FeatureFlags";
import { SwarmPulse } from "./SwarmPulse";
import { ApprovalQueue } from "./ApprovalQueue";
import { CriticalProjects } from "./CriticalProjects";
import { QuickCreateBar } from "./QuickCreateBar";
import { StrategicRaceHUD } from "./StrategicRaceHUD";
import { TCOShieldModal } from "./TCOShieldModal";
import { HITLTicketsPanel } from "./HITLTicketsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  description: string;
  category: "esencial" | "operacional" | "ia";
  locked?: boolean; // always visible
}

interface WidgetDef {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  accentColor: string;
  fields: FieldDef[];
}

interface WidgetState {
  visible: boolean;
  expanded: boolean;
  fields: Record<string, boolean>;
}

type CockpitConfig = Record<string, WidgetState>;

// ─── Widget Registry ───────────────────────────────────────────────────────────

const WIDGETS: WidgetDef[] = [
  {
    id: "agents",
    label: "Estado de Agentes",
    icon: Bot,
    description: "Actividad y estado del swarm de agentes IA",
    accentColor: "#8B5CF6",
    fields: [
      { key: "task_count",     label: "Tareas en progreso",  description: "Total de tareas activas del swarm",           category: "esencial",   locked: true },
      { key: "agent_list",     label: "Lista de agentes",    description: "Pills con estado activo / inactivo",           category: "esencial"                 },
      { key: "last_activity",  label: "Última actividad",    description: "Cuándo fue la última acción por agente",       category: "operacional"              },
      { key: "token_usage",    label: "Tokens usados hoy",   description: "Suma de tokens consumidos en el día",          category: "operacional"              },
      { key: "agent_type",     label: "Tipo de agente",      description: "Rol: WRITER · RESEARCHER · MANAGER",          category: "ia"                       },
      { key: "estimated_cost", label: "Coste estimado",      description: "Estimación de coste USD por consumo IA",       category: "ia"                       },
    ],
  },
  {
    id: "approvals",
    label: "Cola de Aprobaciones",
    icon: CheckCircle2,
    description: "Items HITL pendientes de revisión humana",
    accentColor: "#3B82F6",
    fields: [
      { key: "agent_name",    label: "Agente solicitante",      description: "Qué agente generó el item",           category: "esencial",   locked: true },
      { key: "task_title",    label: "Título de tarea",         description: "Descripción breve del output",        category: "esencial"                },
      { key: "approval_type", label: "Tipo de acción",          description: "DRAFT · REPORT · PUBLISH",           category: "operacional"             },
      { key: "timestamp",     label: "Timestamp",               description: "Cuándo se generó el item",           category: "operacional"             },
      { key: "diff_preview",  label: "Vista previa de cambios", description: "Enlace rápido al diff antes/después", category: "operacional"             },
    ],
  },
  {
    id: "projects",
    label: "Proyectos Críticos",
    icon: FolderKanban,
    description: "Proyectos con riesgo elevado o blockers activos",
    accentColor: "#10B981",
    fields: [
      { key: "health_status",  label: "Estado de salud",   description: "Semáforo: healthy / at-risk / blocked",   category: "esencial",   locked: true },
      { key: "risk_indicator", label: "Nivel de riesgo",   description: "Badge: high / medium / low",              category: "esencial"                },
      { key: "deadline",       label: "Fecha límite",      description: "Deadline del proyecto",                   category: "operacional"             },
      { key: "completion_pct", label: "% completado",      description: "Barra de progreso del proyecto",          category: "operacional"             },
      { key: "assigned_agent", label: "Agente asignado",   description: "Qué agente gestiona el proyecto",         category: "ia"                      },
      { key: "budget_used",    label: "Presupuesto usado", description: "% del budget consumido",                  category: "ia"                      },
    ],
  },
  {
    id: "swarm_hud",
    label: "Swarm Pulse HUD",
    icon: Zap,
    description: "Visualización radial animada — alto detalle para análisis de swarm",
    accentColor: "#F59E0B",
    fields: [], // all-or-nothing widget, no field customization
  },
  {
    id: "race_hud",
    label: "Strategic Race HUD",
    icon: Trophy,
    description: "Clasificación de equipos por rendimiento semanal",
    accentColor: "#F59E0B",
    fields: [], // single-unit widget
  },
];

// ─── Default config builder ────────────────────────────────────────────────────

function buildDefaultConfig(): CockpitConfig {
  const config: CockpitConfig = {};
  for (const w of WIDGETS) {
    const fields: Record<string, boolean> = {};
    for (const f of w.fields) fields[f.key] = f.locked ?? false;

    // Enable sensible defaults per widget
    if (w.id === "agents")    { fields.task_count = true; fields.agent_list = true; }
    if (w.id === "approvals") { fields.agent_name = true; fields.task_title = true; }
    if (w.id === "projects")  { fields.health_status = true; fields.risk_indicator = true; }

    config[w.id] = {
      visible:  w.id !== "swarm_hud" && w.id !== "race_hud", // these hidden by default
      expanded: false,
      fields,
    };
  }
  return config;
}

// ─── Persistence hook ──────────────────────────────────────────────────────────

const STORAGE_KEY = "cerebrin_cockpit_v2";

function useCockpitConfig() {
  const [config, setConfig] = React.useState<CockpitConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored) as CockpitConfig;
    } catch { /* ignore */ }
    return buildDefaultConfig();
  });

  const persist = React.useCallback((next: CockpitConfig) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setConfig(next);
  }, []);

  const toggleWidget  = React.useCallback((id: string) =>
    setConfig((prev) => { const n = { ...prev, [id]: { ...prev[id], visible: !prev[id].visible } }; persist(n); return n; }), [persist]);

  const toggleExpanded = React.useCallback((id: string) =>
    setConfig((prev) => { const n = { ...prev, [id]: { ...prev[id], expanded: !prev[id].expanded } }; persist(n); return n; }), [persist]);

  const toggleField = React.useCallback((wId: string, fKey: string) =>
    setConfig((prev) => {
      const n = { ...prev, [wId]: { ...prev[wId], fields: { ...prev[wId].fields, [fKey]: !prev[wId].fields[fKey] } } };
      persist(n); return n;
    }), [persist]);

  const reset = React.useCallback(() => { const d = buildDefaultConfig(); persist(d); }, [persist]);

  return { config, toggleWidget, toggleExpanded, toggleField, reset };
}

// ─── Mock data (replace with API calls) ───────────────────────────────────────

const AGENT_DATA = [
  { id: "writer",   name: "writer-bot",   status: "active", tasks: 4, color: "#8B5CF6", tokens: 14200, type: "WRITER",     lastActivity: "2m ago"  },
  { id: "analyst",  name: "analyst-bot",  status: "active", tasks: 7, color: "#3B82F6", tokens: 28500, type: "RESEARCHER", lastActivity: "5m ago"  },
  { id: "strategy", name: "strategy-bot", status: "idle",   tasks: 0, color: "#10B981", tokens: 0,     type: "MANAGER",    lastActivity: "1h ago"  },
  { id: "dev",      name: "dev-bot",      status: "active", tasks: 3, color: "#F59E0B", tokens: 9100,  type: "WRITER",     lastActivity: "12m ago" },
];

const APPROVAL_DATA = [
  { id: "a1", agent: "writer-bot",  agentColor: "#8B5CF6", title: "Borrador Q1 Campaign",        type: "DRAFT",   time: "2m ago"  },
  { id: "a2", agent: "analyst-bot", agentColor: "#3B82F6", title: "Análisis de competidores",     type: "REPORT",  time: "10m ago" },
  { id: "a3", agent: "dev-bot",     agentColor: "#F59E0B", title: "Actualización API docs",        type: "PUBLISH", time: "35m ago" },
  { id: "a4", agent: "writer-bot",  agentColor: "#8B5CF6", title: "Email lanzamiento Product v2", type: "DRAFT",   time: "1h ago"  },
  { id: "a5", agent: "analyst-bot", agentColor: "#3B82F6", title: "Reporte mensual KPIs",         type: "REPORT",  time: "2h ago"  },
];

const PROJECT_DATA = [
  { id: "p1", name: "Platform 3.0",     health: "at-risk", risk: "high",   completion: 34, deadline: "Mar 15", agent: "dev-bot",      budgetUsed: 78 },
  { id: "p2", name: "AI Core v2",        health: "at-risk", risk: "medium", completion: 58, deadline: "Apr 2",  agent: "analyst-bot",  budgetUsed: 45 },
  { id: "p3", name: "Q1 Strategy Plan",  health: "healthy", risk: "low",    completion: 82, deadline: "Feb 28", agent: "strategy-bot", budgetUsed: 22 },
];

// ─── Style maps ────────────────────────────────────────────────────────────────

const HEALTH_STYLE: Record<string, { dot: string; label: string }> = {
  healthy:  { dot: "bg-emerald-500",              label: "Healthy"  },
  "at-risk":{ dot: "bg-amber-500 animate-pulse",  label: "At Risk"  },
  blocked:  { dot: "bg-red-500",                  label: "Blocked"  },
};
const RISK_STYLE: Record<string, string> = {
  high:   "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};
const TYPE_STYLE: Record<string, string> = {
  DRAFT:   "bg-violet-500/15 text-violet-400",
  REPORT:  "bg-blue-500/15 text-blue-400",
  PUBLISH: "bg-emerald-500/15 text-emerald-400",
  DEPLOY:  "bg-amber-500/15 text-amber-400",
};
const CATEGORY_META = {
  esencial:    { label: "Esencial",    dot: "bg-emerald-500", textColor: "text-emerald-400", pill: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  operacional: { label: "Operacional", dot: "bg-blue-500",    textColor: "text-blue-400",    pill: "bg-blue-500/10 border-blue-500/20 text-blue-400"          },
  ia:          { label: "Para IA",     dot: "bg-violet-500",  textColor: "text-violet-400",  pill: "bg-violet-500/10 border-violet-500/20 text-violet-400"    },
};

// ─── Card shell wrapper ────────────────────────────────────────────────────────

function CardShell({
  widget, state, children, stat, onToggleExpanded, onToggleField, onOpenCustomizer,
}: {
  widget: WidgetDef;
  state: WidgetState;
  children: React.ReactNode;
  stat: string;
  onToggleExpanded: () => void;
  onToggleField: (key: string) => void;
  onOpenCustomizer: () => void;
}) {
  const Icon = widget.icon;
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${widget.accentColor}18`, border: `1px solid ${widget.accentColor}30` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: widget.accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-xs truncate" style={{ fontWeight: 600 }}>{widget.label}</p>
          <p className="text-muted-foreground/50 text-xs">{stat}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Quick field menu (only for widgets that have configurable fields) */}
          {widget.fields.filter(f => !f.locked).length > 0 && (
            <QuickFieldMenu
              fields={state.fields}
              fieldDefs={widget.fields}
              onToggleField={onToggleField}
              onOpenCustomizer={onOpenCustomizer}
            />
          )}
          {/* Expand toggle */}
          <button
            onClick={onToggleExpanded}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs transition-all",
              state.expanded
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/80"
            )}
          >
            {state.expanded ? "← Compacto" : "Expandir"}
          </button>
        </div>
      </div>
      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto">{children}</div>
    </div>
  );
}

// ─── Quick field menu (⋯ button on each card) ─────────────────────────────────

function QuickFieldMenu({
  fields, fieldDefs, onToggleField, onOpenCustomizer,
}: {
  fields: Record<string, boolean>;
  fieldDefs: FieldDef[];
  onToggleField: (key: string) => void;
  onOpenCustomizer: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/80 transition-colors">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-popover border-border shadow-xl p-1.5">
        <DropdownMenuLabel className="text-muted-foreground px-2 py-1 uppercase tracking-wider" style={{ fontSize: "10px" }}>
          Campos visibles
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60" />
        {fieldDefs.filter(f => !f.locked).map((f) => (
          <DropdownMenuItem
            key={f.key}
            onClick={() => onToggleField(f.key)}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer"
          >
            <div className={cn(
              "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
              fields[f.key] ? "bg-violet-600 border-violet-500" : "border-border"
            )}>
              {fields[f.key] && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{f.label}</p>
              <p className="text-muted-foreground/40 truncate" style={{ fontSize: 10 }}>{f.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-border/60 mt-1" />
        <DropdownMenuItem
          onClick={onOpenCustomizer}
          className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-muted-foreground/60"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="text-xs">Ver todas las opciones</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Compact card: Agents ──────────────────────────────────────────────────────

function AgentCard({ state, onToggleExpanded, onToggleField, onOpenCustomizer }: {
  state: WidgetState; onToggleExpanded: () => void;
  onToggleField: (k: string) => void; onOpenCustomizer: () => void;
}) {
  const widget = WIDGETS.find(w => w.id === "agents")!;
  const f = state.fields;
  const activeCount  = AGENT_DATA.filter(a => a.status === "active").length;
  const totalTasks   = AGENT_DATA.reduce((s, a) => s + a.tasks, 0);
  const totalTokens  = AGENT_DATA.reduce((s, a) => s + a.tokens, 0);

  const body = state.expanded ? <SwarmPulse /> : (
    <div className="p-4 space-y-3">
      {/* Summary pills */}
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl bg-muted/40 px-3 py-2 text-center">
          <p className="text-lg text-foreground" style={{ fontWeight: 700 }}>{activeCount}</p>
          <p className="text-xs text-muted-foreground/50">activos</p>
        </div>
        <div className="flex-1 rounded-xl bg-muted/40 px-3 py-2 text-center">
          <p className="text-lg text-foreground" style={{ fontWeight: 700 }}>{AGENT_DATA.length - activeCount}</p>
          <p className="text-xs text-muted-foreground/50">inactivos</p>
        </div>
        {f.task_count && (
          <div className="flex-1 rounded-xl bg-muted/40 px-3 py-2 text-center">
            <p className="text-lg text-foreground" style={{ fontWeight: 700 }}>{totalTasks}</p>
            <p className="text-xs text-muted-foreground/50">tareas</p>
          </div>
        )}
      </div>
      {/* Token usage — operacional */}
      {f.token_usage && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/8 border border-violet-500/15">
          <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span className="text-xs text-violet-300" style={{ fontWeight: 500 }}>{(totalTokens / 1000).toFixed(1)}K tokens hoy</span>
        </div>
      )}
      {/* Estimated cost — ia */}
      {f.estimated_cost && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-300" style={{ fontWeight: 500 }}>≈ $0.42 estimado hoy</span>
        </div>
      )}
      {/* Agent list — esencial (optional) */}
      {f.agent_list && (
        <div className="space-y-1">
          {AGENT_DATA.map(agent => (
            <div key={agent.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted/40 transition-colors">
              <div
                className="w-5 h-5 shrink-0"
                style={{ clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", backgroundColor: `${agent.color}20`, border: `1px solid ${agent.color}50` }}
              />
              <span className="flex-1 text-xs text-muted-foreground" style={{ fontWeight: 500 }}>{agent.name}</span>
              {f.agent_type    && <span className="text-xs text-muted-foreground/30">{agent.type}</span>}
              {f.last_activity && <span className="text-xs text-muted-foreground/30">{agent.lastActivity}</span>}
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", agent.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/20")} />
              {agent.tasks > 0 && (
                <span className="font-mono text-xs shrink-0" style={{ color: agent.color, fontSize: 10, fontWeight: 700 }}>{agent.tasks}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <CardShell widget={widget} state={state} stat={`${activeCount} activos · ${totalTasks} tareas`}
      onToggleExpanded={onToggleExpanded} onToggleField={onToggleField} onOpenCustomizer={onOpenCustomizer}>
      {body}
    </CardShell>
  );
}

// ─── Compact card: Approvals ───────────────────────────────────────────────────

function ApprovalsCard({ state, onToggleExpanded, onToggleField, onOpenCustomizer, onOpenHITL }: {
  state: WidgetState; onToggleExpanded: () => void;
  onToggleField: (k: string) => void; onOpenCustomizer: () => void;
  onOpenHITL?: () => void;
}) {
  const widget = WIDGETS.find(w => w.id === "approvals")!;
  const f = state.fields;

  const body = state.expanded ? <ApprovalQueue /> : (
    <div className="p-4 space-y-3">
      {/* Count badge */}
      <div className="px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
        <span className="text-blue-400" style={{ fontWeight: 700, fontSize: 18 }}>{APPROVAL_DATA.length}</span>
        <span className="text-blue-400/60 text-xs">esperando tu revisión</span>
      </div>
      {/* Items */}
      <div className="space-y-1">
        {APPROVAL_DATA.slice(0, 4).map(item => (
          <div key={item.id} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
            <div
              className="w-5 h-5 shrink-0"
              style={{ clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", backgroundColor: `${item.agentColor}20`, border: `1px solid ${item.agentColor}50` }}
            />
            <div className="flex-1 min-w-0">
              {f.agent_name && <p className="text-xs text-muted-foreground/60 truncate">{item.agent}</p>}
              {f.task_title && <p className="text-xs text-foreground truncate" style={{ fontWeight: 500 }}>{item.title}</p>}
            </div>
            {f.approval_type && <span className={cn("shrink-0 px-1.5 py-0.5 rounded-md text-xs", TYPE_STYLE[item.type])}>{item.type}</span>}
            {f.timestamp     && <span className="shrink-0 text-xs text-muted-foreground/30">{item.time}</span>}
            {f.diff_preview  && <button className="shrink-0 text-xs text-violet-400 hover:underline" onClick={e => e.stopPropagation()}>diff</button>}
          </div>
        ))}
        {APPROVAL_DATA.length > 4 && (
          <p className="text-xs text-muted-foreground/30 text-center pt-1">+{APPROVAL_DATA.length - 4} más</p>
        )}
      </div>
      {/* HITL Tickets Button */}
      {onOpenHITL && (
        <button
          onClick={onOpenHITL}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white transition-all text-xs"
          style={{ fontWeight: 600 }}
        >
          <Zap className="w-3.5 h-3.5" />
          Abrir HITL Queue
        </button>
      )}
    </div>
  );

  return (
    <CardShell widget={widget} state={state} stat={`${APPROVAL_DATA.length} pendientes`}
      onToggleExpanded={onToggleExpanded} onToggleField={onToggleField} onOpenCustomizer={onOpenCustomizer}>
      {body}
    </CardShell>
  );
}

// ─── Compact card: Projects ────────────────────────────────────────────────────

function ProjectsCard({ state, onToggleExpanded, onToggleField, onOpenCustomizer }: {
  state: WidgetState; onToggleExpanded: () => void;
  onToggleField: (k: string) => void; onOpenCustomizer: () => void;
}) {
  const widget = WIDGETS.find(w => w.id === "projects")!;
  const f = state.fields;
  const criticalCount = PROJECT_DATA.filter(p => p.health !== "healthy").length;

  const body = state.expanded ? <CriticalProjects /> : (
    <div className="p-4 space-y-1.5">
      {PROJECT_DATA.map(project => {
        const hs = HEALTH_STYLE[project.health] ?? HEALTH_STYLE["at-risk"];
        return (
          <div key={project.id} className="px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5">
              <span className={cn("w-2 h-2 rounded-full shrink-0", hs.dot)} />
              <span className="flex-1 text-xs text-foreground truncate" style={{ fontWeight: 600 }}>{project.name}</span>
              {f.risk_indicator && (
                <span className={cn("shrink-0 px-1.5 py-0.5 rounded-md border text-xs", RISK_STYLE[project.risk])}>
                  {project.risk}
                </span>
              )}
              {f.deadline && <span className="shrink-0 text-xs text-muted-foreground/40">{project.deadline}</span>}
            </div>
            {f.completion_pct && (
              <div className="flex items-center gap-2 mt-1.5 pl-4">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", project.health === "at-risk" ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${project.completion}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground/40 shrink-0">{project.completion}%</span>
              </div>
            )}
            {(f.assigned_agent || f.budget_used) && (
              <div className="flex items-center gap-3 mt-1 pl-4">
                {f.assigned_agent && <span className="text-xs text-muted-foreground/30">{project.agent}</span>}
                {f.budget_used    && (
                  <span className={cn("text-xs", project.budgetUsed > 70 ? "text-red-400" : "text-muted-foreground/30")}>
                    Budget: {project.budgetUsed}%
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <CardShell widget={widget} state={state} stat={`${criticalCount} en riesgo`}
      onToggleExpanded={onToggleExpanded} onToggleField={onToggleField} onOpenCustomizer={onOpenCustomizer}>
      {body}
    </CardShell>
  );
}

// ─── Customizer Panel (form-builder style) ─────────────────────────────────────

function CustomizerPanel({
  config, onToggleWidget, onToggleField, onReset, onClose,
}: {
  config: CockpitConfig;
  onToggleWidget: (id: string) => void;
  onToggleField: (wId: string, fKey: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [activeId, setActiveId] = React.useState<string>(WIDGETS[0].id);
  const activeWidget = WIDGETS.find(w => w.id === activeId)!;
  const activeState  = config[activeId];

  const grouped = React.useMemo(() => {
    const g: Record<string, FieldDef[]> = { esencial: [], operacional: [], ia: [] };
    for (const f of activeWidget.fields) g[f.category].push(f);
    return g;
  }, [activeWidget]);

  return (
    <div>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]" onClick={onClose} />

      {/* Slide-in panel */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 md:w-80 flex flex-col bg-card border-l border-border shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
              <Settings2 className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Personalizar Cockpit</p>
              <p className="text-muted-foreground/50 text-xs">Tu vista, tu control</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 space-y-5">

          {/* ── Widget visibility toggles ──────────────── */}
          <section>
            <p className="text-xs text-muted-foreground/40 uppercase tracking-wider mb-2.5" style={{ fontWeight: 600 }}>
              Tarjetas activas
            </p>
            <div className="space-y-1.5">
              {WIDGETS.map(w => {
                const Icon = w.icon;
                const wState = config[w.id];
                const isActive = activeId === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => setActiveId(w.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all",
                      isActive ? "border-border bg-muted/60" : "border-transparent hover:bg-muted/30",
                      !wState.visible && "opacity-40"
                    )}
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${w.accentColor}20` }}>
                      <Icon className="w-3 h-3" style={{ color: w.accentColor }} />
                    </div>
                    <p className="flex-1 text-xs text-foreground truncate" style={{ fontWeight: isActive ? 600 : 400 }}>{w.label}</p>
                    {/* Toggle switch */}
                    <div
                      onClick={e => { e.stopPropagation(); onToggleWidget(w.id); }}
                      className={cn("relative shrink-0 rounded-full transition-colors cursor-pointer", wState.visible ? "bg-violet-600" : "bg-muted-foreground/20")}
                      style={{ width: 32, height: 18 }}
                    >
                      <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-all", wState.visible ? "left-[14px]" : "left-[2px]")} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="h-px bg-border/60" />

          {/* ── Fields for selected widget ─────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs text-muted-foreground/40 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                Campos · {activeWidget.label}
              </p>
              {!activeState.visible && (
                <span className="text-xs text-muted-foreground/30">(tarjeta oculta)</span>
              )}
            </div>

            {activeWidget.fields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/40 px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground/40">Sin campos configurables.</p>
                <p className="text-xs text-muted-foreground/25 mt-1">Esta tarjeta se activa o desactiva como unidad completa.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(["esencial", "operacional", "ia"] as const).map(cat => {
                  const catFields = grouped[cat];
                  if (!catFields.length) return null;
                  const meta = CATEGORY_META[cat];
                  return (
                    <div key={cat}>
                      {/* Category pill */}
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs mb-2", meta.pill)} style={{ fontWeight: 600, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                      <div className="space-y-1">
                        {catFields.map(field => {
                          const isOn     = activeState.fields[field.key];
                          const isLocked = field.locked;
                          return (
                            <div
                              key={field.key}
                              onClick={() => !isLocked && onToggleField(activeId, field.key)}
                              className={cn(
                                "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all",
                                isLocked ? "cursor-default border-transparent" :
                                isOn ? "border-violet-500/20 bg-violet-500/5 cursor-pointer" :
                                "border-transparent hover:bg-muted/40 cursor-pointer"
                              )}
                            >
                              {/* Checkbox */}
                              <div className="mt-0.5 shrink-0">
                                {isLocked ? (
                                  <div className="w-4 h-4 rounded border border-border bg-muted flex items-center justify-center">
                                    <Lock className="w-2 h-2 text-muted-foreground/30" />
                                  </div>
                                ) : (
                                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", isOn ? "bg-violet-600 border-violet-500" : "border-border")}>
                                    {isOn && <Check className="w-2.5 h-2.5 text-white" />}
                                  </div>
                                )}
                              </div>
                              {/* Label + desc */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs" style={{ fontWeight: isOn || isLocked ? 600 : 400 }}>{field.label}</p>
                                  {isLocked && <span className="text-muted-foreground/25" style={{ fontSize: 9 }}>Siempre visible</span>}
                                </div>
                                <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: 10, lineHeight: 1.4 }}>{field.description}</p>
                              </div>
                              {/* Drag handle (visual affordance) */}
                              {!isLocked && <GripVertical className="w-3.5 h-3.5 text-muted-foreground/15 mt-0.5 shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-4 flex gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-muted-foreground/70 text-xs hover:bg-muted/80 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Restaurar
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
            style={{ fontWeight: 600 }}
          >
            Guardar vista
          </button>
        </div>
      </aside>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function CockpitCanvas() {
  const { config, toggleWidget, toggleExpanded, toggleField, reset } = useCockpitConfig();
  const { isWidgetVisible, profile } = useUserPerspective();
  
  // Feature flags
  const quickCreateEnabled = useFeature("cockpit.quick_create");
  const customizerEnabled = useFeature("cockpit.customizer");
  const [customizerOpen, setCustomizerOpen] = React.useState(false);
  const [approvalPanelOpen, setApprovalPanelOpen] = React.useState(false);
  const [hitlPanelOpen, setHitlPanelOpen] = React.useState(false);
  const [tcoShieldOpen, setTcoShieldOpen] = React.useState(false);
  const [tcoShieldData, setTcoShieldData] = React.useState<{ budgetRemaining?: number; limitUsd?: number; agentName?: string; taskType?: string }>({});
  const [clock, setClock] = React.useState(() =>
    new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  React.useEffect(() => {
    const id = setInterval(() =>
      setClock(new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
    , 1000);
    return () => clearInterval(id);
  }, []);

  // Filter widgets by perspective visibility AND cockpit config
  const visibleWidgets = WIDGETS.filter(w => {
    // Map widget IDs to perspective keys
    const perspectiveKey = w.id === "swarm_hud" ? "agents" : w.id;
    return isWidgetVisible(perspectiveKey as keyof typeof profile.cockpit_widgets) && config[w.id]?.visible;
  });

  const compactWidgets  = visibleWidgets.filter(w => !config[w.id]?.expanded);
  const expandedWidgets = visibleWidgets.filter(w =>  config[w.id]?.expanded);

  const renderCard = (w: WidgetDef) => {
    const props = {
      state: config[w.id],
      onToggleExpanded: () => toggleExpanded(w.id),
      onToggleField: (k: string) => toggleField(w.id, k),
      onOpenCustomizer: () => setCustomizerOpen(true),
    };
    switch (w.id) {
      case "agents":    return <AgentCard key={w.id} {...props} />;
      case "approvals": return <ApprovalsCard key={w.id} {...props} onOpenHITL={() => setHitlPanelOpen(true)} />;
      case "projects":  return <ProjectsCard key={w.id} {...props} />;
      case "swarm_hud": return (
        <div key={w.id} className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden min-h-0">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "#F59E0B18", border: "1px solid #F59E0B30" }}>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground text-xs" style={{ fontWeight: 600 }}>Swarm Pulse HUD</p>
              <p className="text-muted-foreground/50 text-xs">Visualización radial completa</p>
            </div>
            <button
              onClick={() => toggleExpanded("swarm_hud")}
              className={cn("px-2.5 py-1 rounded-lg text-xs transition-all", config["swarm_hud"]?.expanded ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30" : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/80")}
            >
              {config["swarm_hud"]?.expanded ? "← Compacto" : "Expandir"}
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden"><SwarmPulse /></div>
        </div>
      );
      case "race_hud": return (
        <div key={w.id} className="flex flex-col rounded-2xl border border-amber-500/20 bg-card overflow-hidden min-h-0">
          <div className="flex-1 min-h-0 overflow-hidden"><StrategicRaceHUD /></div>
        </div>
      );
      default: return null;
    }
  };

  const hasAny = compactWidgets.length > 0 || expandedWidgets.length > 0;

  return (
    <div className="flex flex-col gap-2 md:gap-3 p-2 sm:p-3 md:p-4 h-full overflow-hidden">

      {/* ── PHI-OS v2 · Tactical Mission Header ─────────── */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 shrink-0 overflow-visible">
        {/* Mission label */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div>
            <p className="text-foreground uppercase tracking-widest" style={{ fontWeight: 800, fontSize: 11, letterSpacing: "0.18em", fontStyle: "italic" }}>
              Mission Control
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1 text-indigo-400/70 uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em" }}>
                <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Operativo · {clock}
              </span>
            </div>
          </div>
          {isWidgetVisible("create") && quickCreateEnabled && (
            <>
              <div className="h-6 w-px bg-border/40" />
              <div className="flex-1 min-w-0">
                <QuickCreateBar onApprovalRequired={() => {
                  // Expand the approvals widget and auto-open panel
                  if (!config["approvals"]?.visible) toggleWidget("approvals");
                  if (!config["approvals"]?.expanded) toggleExpanded("approvals");
                  setApprovalPanelOpen(true);
                }} onBudgetExceeded={(data) => {
                  setTcoShieldData(data ?? {});
                  setTcoShieldOpen(true);
                }} />
              </div>
            </>
          )}
        </div>
        {customizerEnabled && (
          <button
            onClick={() => setCustomizerOpen(true)}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs transition-all shrink-0 w-full sm:w-auto justify-center sm:justify-start",
              customizerOpen
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                : "bg-muted border-border text-muted-foreground hover:border-indigo-500/30 hover:text-foreground"
            )}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Personalizar</span>
            <span className="sm:hidden">Personalizar Vista</span>
          </button>
        )}
      </section>

      {/* ── PHI-OS v2 · Ultra-thin workload intensity bar ─ */}
      <div className="h-0.5 rounded-full bg-slate-800 overflow-hidden shrink-0">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400"
          style={{ width: `${Math.min(100, (compactWidgets.length + expandedWidgets.length) / WIDGETS.length * 100)}%`, transition: "width 0.8s ease" }}
        />
      </div>

      {/* ── Row 2: Compact cards ─────────────────────────── */}
      {compactWidgets.length > 0 && (
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3"
          style={{
            flex: expandedWidgets.length > 0 ? "0 0 auto" : "1 1 0",
            minHeight: 0,
          }}
        >
          {compactWidgets.map(w => renderCard(w))}
        </section>
      )}

      {/* ── Row 3: Expanded widgets ──────────────────────── */}
      {expandedWidgets.length > 0 && (
        <section
          className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 flex-1 min-h-0"
        >
          {expandedWidgets.map(w => renderCard(w))}
        </section>
      )}

      {/* ── Empty state ──────────────────────────────────── */}
      {!hasAny && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/40">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-muted-foreground/20" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground/40 uppercase tracking-wider" style={{ fontWeight: 700, fontStyle: "italic" }}>Mission Control · Standby</p>
            <p className="text-xs text-muted-foreground/25 mt-1">Activa módulos desde Personalizar</p>
          </div>
          <button
            onClick={() => setCustomizerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Personalizar vista
          </button>
        </div>
      )}

      {/* ── Customizer panel ─────────────────────────────── */}
      {customizerOpen && (
        <CustomizerPanel
          config={config}
          onToggleWidget={toggleWidget}
          onToggleField={toggleField}
          onReset={reset}
          onClose={() => setCustomizerOpen(false)}
        />
      )}

      {/* ── TCO Shield Modal ─────────────────────────────── */}
      <TCOShieldModal
        open={tcoShieldOpen}
        onOpenChange={setTcoShieldOpen}
        budgetRemaining={tcoShieldData.budgetRemaining}
        limitUsd={tcoShieldData.limitUsd}
        agentName={tcoShieldData.agentName}
        taskType={tcoShieldData.taskType}
      />

      {/* ── HITL Tickets Panel ───────────────────────────── */}
      <HITLTicketsPanel
        open={hitlPanelOpen}
        onClose={() => setHitlPanelOpen(false)}
      />
    </div>
  );
}