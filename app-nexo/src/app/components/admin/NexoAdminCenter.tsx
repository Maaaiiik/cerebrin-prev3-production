import * as React from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  DollarSign,
  Edit3,
  Eye,
  Filter,
  Globe,
  HeadphonesIcon,
  Inbox,
  LifeBuoy,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  Zap,
  Radio,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "../ui/utils";
import {
  useViewConfig,
  ViewCustomizerTrigger,
  ViewCustomizerPanel,
  type VCField,
} from "../shared/ViewCustomizer";
import {
  MOCK_WORKSPACES, MOCK_TICKETS, MOCK_EVENT_LOGS, MOCK_MRR_HISTORY, MOCK_CHURN_HISTORY,
  impersonateWorkspace, sendTicketMessage,
  calculateNPS, fetchActiveSurveys, createSurvey,
  type TicketMessage, type Survey, type NPSResult, type CreateSurveyRequest,
} from "../../services/api";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AdminModule = "workspaces" | "usage" | "financial" | "feedback" | "support";

type Tier = "Starter" | "Pro" | "Enterprise";
type WorkspaceHealth = "healthy" | "at-risk" | "churned";

interface Workspace {
  id: string;
  name: string;
  company: string;
  tier: Tier;
  health: WorkspaceHealth;
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

interface EventLog {
  id: string;
  workspace: string;
  event: string;
  agent: string;
  tokens: number;
  status: "ok" | "warning" | "error";
  timestamp: string;
}

interface SupportTicket {
  id: string;
  workspace: string;
  subject: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved" | "pending";
  created: string;
  assignee: string | null;
  category: string;
  messages: TicketMessage[];
}

// ─── Data (from API service layer — swap MOCK_* for real fetch calls) ──────────

const WORKSPACES: Workspace[]        = MOCK_WORKSPACES as Workspace[];
const MRR_HISTORY                    = MOCK_MRR_HISTORY;
const CHURN_HISTORY                  = MOCK_CHURN_HISTORY;
const EVENT_LOGS: EventLog[]         = MOCK_EVENT_LOGS as EventLog[];
const SUPPORT_TICKETS: SupportTicket[] = MOCK_TICKETS as SupportTicket[];

const NPS_DISTRIBUTION = [
  { name: "Promotores (9-10)", value: 42, color: "#10B981" },
  { name: "Pasivos (7-8)",     value: 31, color: "#3B82F6" },
  { name: "Detractores (0-6)", value: 27, color: "#EF4444" },
];

const SURVEY_COMMENTS = [
  { workspace: "Acme Corp",     score: 9, comment: "The HITL approval flow is exactly what we needed. Game changer for our compliance team.", time: "2h ago" },
  { workspace: "Stratos AI",    score: 10, comment: "SwarmPulse HUD gives us real-time visibility we never had before. Absolutely love it.", time: "5h ago" },
  { workspace: "Momentum Labs", score: 8, comment: "Solid product. Would love more export formats from Template Studio.", time: "1d ago" },
  { workspace: "TechVentures",  score: 8, comment: "Webhook integration docs could be clearer but the product itself is great.", time: "2d ago" },
  { workspace: "StartupXYZ",    score: 5, comment: "The UI is complex for a small team. We need a simpler onboarding path.", time: "3d ago" },
];

// ─── Subcomponents ─────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: Tier }) {
  const styles: Record<Tier, string> = {
    Starter:    "bg-slate-700/60 text-slate-300 border-slate-600/50",
    Pro:        "bg-blue-500/15 text-blue-300 border-blue-500/30",
    Enterprise: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  };
  const icons: Record<Tier, React.ReactNode> = {
    Starter:    <Zap className="w-2.5 h-2.5" />,
    Pro:        <Star className="w-2.5 h-2.5" />,
    Enterprise: <Crown className="w-2.5 h-2.5" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs", styles[tier])}>
      {icons[tier]}
      {tier}
    </span>
  );
}

function HealthDot({ health }: { health: WorkspaceHealth }) {
  const styles: Record<WorkspaceHealth, { dot: string; label: string; text: string }> = {
    healthy:  { dot: "bg-emerald-500", label: "Healthy",  text: "text-emerald-400" },
    "at-risk":{ dot: "bg-amber-500",   label: "At Risk",  text: "text-amber-400"   },
    churned:  { dot: "bg-red-500",     label: "Churned",  text: "text-red-400"     },
  };
  const s = styles[health];
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot, health === "healthy" && "animate-pulse")} />
      <span className={cn("text-xs", s.text)}>{s.label}</span>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: SupportTicket["priority"] }) {
  const s: Record<SupportTicket["priority"], string> = {
    critical: "bg-red-500/15 text-red-300 border-red-500/30",
    high:     "bg-orange-500/15 text-orange-300 border-orange-500/30",
    medium:   "bg-amber-500/15 text-amber-300 border-amber-500/30",
    low:      "bg-slate-600/40 text-slate-400 border-slate-600/40",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-xs capitalize", s[priority])}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: SupportTicket["status"] }) {
  const s: Record<SupportTicket["status"], string> = {
    open:        "bg-blue-500/15 text-blue-300 border-blue-500/30",
    "in-progress":"bg-violet-500/15 text-violet-300 border-violet-500/30",
    pending:     "bg-amber-500/15 text-amber-300 border-amber-500/30",
    resolved:    "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  const labels: Record<SupportTicket["status"], string> = {
    open: "Open", "in-progress": "In Progress", pending: "Pending", resolved: "Resolved",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-xs", s[status])}>
      {labels[status]}
    </span>
  );
}

function MetricCard({
  label, value, sub, trend, trendUp, color = "violet", icon: Icon,
}: {
  label: string; value: string; sub: string; trend?: string; trendUp?: boolean; color?: string; icon: React.ElementType;
}) {
  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    violet:  { bg: "bg-violet-500/10",  icon: "text-violet-400",  border: "border-violet-500/20" },
    emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20" },
    blue:    { bg: "bg-blue-500/10",    icon: "text-blue-400",    border: "border-blue-500/20" },
    red:     { bg: "bg-red-500/10",     icon: "text-red-400",     border: "border-red-500/20" },
  };
  const c = colorMap[color] || colorMap.violet;
  return (
    <div className={cn("rounded-2xl border p-5 flex flex-col gap-3", c.border, "bg-slate-800/60 backdrop-blur-sm")}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", c.bg)}>
          <Icon className={cn("w-4 h-4", c.icon)} />
        </div>
      </div>
      <div>
        <p className="text-2xl text-white" style={{ fontWeight: 700 }}>{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
      </div>
      {trend && (
        <div className={cn("flex items-center gap-1 text-xs", trendUp ? "text-emerald-400" : "text-red-400")}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

// ─── Module 1: Workspaces CRM ─────────────────────────────────────────────────

const WS_FIELDS: VCField[] = [
  { key: "agents",      label: "Capacidad de agentes", description: "Barra de uso de slots del plan",              category: "esencial",    locked: true     },
  { key: "mrr",         label: "MRR por workspace",    description: "Ingreso mensual recurrente",                  category: "esencial",    defaultOn: true  },
  { key: "nps",         label: "Último NPS",           description: "Score NPS más reciente del workspace",        category: "operacional", defaultOn: false },
  { key: "last_active", label: "Última actividad",     description: "Cuándo fue el último acceso al sistema",      category: "operacional", defaultOn: false },
  { key: "projects",    label: "Proyectos activos",    description: "Contador de proyectos del workspace",         category: "avanzado",    defaultOn: false },
];

function WorkspacesCRM() {
  const [search, setSearch] = React.useState("");
  const [filterTier, setFilterTier] = React.useState<Tier | "all">("all");
  const [planModal, setPlanModal] = React.useState<Workspace | null>(null);
  const [capacityModal, setCapacityModal] = React.useState<Workspace | null>(null);
  const [impersonateId, setImpersonateId] = React.useState<string | null>(null);
  const [selectedTier, setSelectedTier] = React.useState<Tier>("Pro");
  const [agentOverride, setAgentOverride] = React.useState("");
  const [vcOpen, setVcOpen] = React.useState(false);
  const [newWsModal, setNewWsModal] = React.useState(false);
  const [newWsForm, setNewWsForm] = React.useState({ name: "", company: "", country: "🇺🇸", tier: "Starter" as Tier });
  const [newWsLoading, setNewWsLoading] = React.useState(false);
  const vc = useViewConfig("cerebrin_admin_workspaces_v1", WS_FIELDS);

  const filtered = WORKSPACES.filter((ws) => {
    const matchSearch = ws.name.toLowerCase().includes(search.toLowerCase()) ||
      ws.company.toLowerCase().includes(search.toLowerCase());
    const matchTier = filterTier === "all" || ws.tier === filterTier;
    return matchSearch && matchTier;
  });

  return (
    <div className="flex flex-col gap-5 p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>CRM de Workspaces</h2>
          <p className="text-slate-400 text-sm mt-0.5">Gestión centralizada de todos los tenants de Cerebrin</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{WORKSPACES.length} workspaces totales</span>
          <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />
          <button
            onClick={() => { setNewWsModal(true); setNewWsForm({ name: "", company: "", country: "🇺🇸", tier: "Starter" }); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Workspace
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total MRR", value: "$24,591", color: "text-emerald-400" },
          { label: "Enterprise", value: WORKSPACES.filter(w => w.tier === "Enterprise").length.toString(), color: "text-violet-400" },
          { label: "At Risk", value: WORKSPACES.filter(w => w.health === "at-risk" || w.health === "churned").length.toString(), color: "text-amber-400" },
          { label: "NPS Medio", value: "7.8", color: "text-blue-400" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className={cn("text-xl mt-1", card.color)} style={{ fontWeight: 700 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar workspace..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "Starter", "Pro", "Enterprise"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs transition-colors",
                filterTier === t
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-white"
              )}
            >
              {t === "all" ? "Todos" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-700/50 overflow-hidden flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/80">
              {(["Workspace","Tier","Salud"] as const).map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider" style={{ fontWeight: 500 }}>{h}</th>
              ))}
              {vc.config.agents      && <th className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider" style={{ fontWeight: 500 }}>Agentes</th>}
              {vc.config.mrr         && <th className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider" style={{ fontWeight: 500 }}>MRR</th>}
              {vc.config.nps         && <th className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider" style={{ fontWeight: 500 }}>Último NPS</th>}
              {vc.config.last_active && <th className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider" style={{ fontWeight: 500 }}>Activo</th>}
              {vc.config.projects    && <th className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider" style={{ fontWeight: 500 }}>Proyectos</th>}
              <th className="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wider" style={{ fontWeight: 500 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ws, i) => (
              <tr
                key={ws.id}
                className={cn(
                  "border-b border-slate-700/30 transition-colors hover:bg-slate-800/40",
                  i % 2 === 0 ? "bg-slate-800/20" : "bg-slate-800/5"
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{ws.country}</span>
                    <div>
                      <p className="text-slate-200 text-xs" style={{ fontWeight: 600 }}>{ws.name}</p>
                      <p className="text-slate-500 text-xs">{ws.company}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><TierBadge tier={ws.tier} /></td>
                <td className="px-4 py-3"><HealthDot health={ws.health} /></td>
                {vc.config.agents && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 w-20 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div className={cn("h-full rounded-full", ws.agents / ws.maxAgents > 0.8 ? "bg-amber-500" : "bg-violet-500")} style={{ width: `${(ws.agents / ws.maxAgents) * 100}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{ws.agents}/{ws.maxAgents}</span>
                    </div>
                  </td>
                )}
                {vc.config.mrr && (
                  <td className="px-4 py-3"><span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>${ws.mrr}/mo</span></td>
                )}
                {vc.config.nps && (
                  <td className="px-4 py-3">
                    {ws.nps !== null ? (
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-xs", ws.nps >= 9 ? "bg-emerald-500/20 text-emerald-400" : ws.nps >= 7 ? "bg-blue-500/20 text-blue-400" : "bg-red-500/20 text-red-400")} style={{ fontWeight: 700 }}>{ws.nps}</div>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                )}
                {vc.config.last_active && (
                  <td className="px-4 py-3"><span className="text-slate-500 text-xs">{ws.lastActive}</span></td>
                )}
                {vc.config.projects && (
                  <td className="px-4 py-3"><span className="text-slate-400 text-xs">{ws.projects}/{ws.maxProjects}</span></td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setPlanModal(ws); setSelectedTier(ws.tier); }}
                      className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs transition-colors"
                    >
                      Update Plan
                    </button>
                    <button
                      onClick={() => { setCapacityModal(ws); setAgentOverride(""); }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs transition-colors"
                    >
                      +Capacity
                    </button>
                    <button
                      onClick={() => setImpersonateId(ws.id)}
                      className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 text-slate-400 hover:text-white transition-colors"
                      title={`Impersonate ${ws.name}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {vcOpen && (
        <ViewCustomizerPanel
          title="CRM de Workspaces"
          subtitle="Elige qué columnas mostrar en la tabla"
          fields={WS_FIELDS}
          config={vc.config}
          onToggleField={vc.toggleField}
          onReset={vc.reset}
          onClose={() => setVcOpen(false)}
        />
      )}

      {/* Plan Update Modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPlanModal(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white text-sm" style={{ fontWeight: 600 }}>Actualizar Plan</h3>
                <p className="text-slate-400 text-xs mt-0.5">{planModal.name}</p>
              </div>
              <button onClick={() => setPlanModal(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 mb-5">
              {(["Starter", "Pro", "Enterprise"] as Tier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all",
                    selectedTier === tier
                      ? "border-violet-500/50 bg-violet-600/15"
                      : "border-slate-700/50 bg-slate-800/50 hover:border-slate-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <TierBadge tier={tier} />
                    <span className="text-slate-300 text-xs">
                      {tier === "Starter" ? "$99/mo · 3 agents · 5 projects" :
                       tier === "Pro" ? "$499/mo · 8 agents · 20 projects" :
                       "$1,299/mo · 15 agents · unlimited projects"}
                    </span>
                  </div>
                  {selectedTier === tier && <Check className="w-3.5 h-3.5 text-violet-400" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPlanModal(null)} className="flex-1 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={() => setPlanModal(null)} className="flex-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Override Modal */}
      {capacityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCapacityModal(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white text-sm" style={{ fontWeight: 600 }}>Capacity Override</h3>
                <p className="text-slate-400 text-xs mt-0.5">{capacityModal.name} · Plan {capacityModal.tier}</p>
              </div>
              <button onClick={() => setCapacityModal(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 mb-4">
              <p className="text-amber-300 text-xs">Esta acción permite superar el límite del plan sin cambiar el tier de facturación.</p>
            </div>
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-1.5 block">Slots extra de agentes (actual: {capacityModal.maxAgents})</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setAgentOverride(v => String(Math.max(0, Number(v || 0) - 1)))} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  value={agentOverride}
                  onChange={(e) => setAgentOverride(e.target.value)}
                  placeholder="0"
                  className="flex-1 text-center py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-violet-500/50"
                />
                <button onClick={() => setAgentOverride(v => String(Number(v || 0) + 1))} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-700">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {agentOverride && Number(agentOverride) > 0 && (
                <p className="text-xs text-violet-400 mt-1.5">Nuevo límite: {capacityModal.maxAgents + Number(agentOverride)} agentes</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCapacityModal(null)} className="flex-1 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={() => setCapacityModal(null)} className="flex-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors">Aplicar Override</button>
            </div>
          </div>
        </div>
      )}

      {/* New Workspace Modal */}
      {newWsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setNewWsModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-slate-700/60 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white text-sm" style={{ fontWeight: 600 }}>Crear Nuevo Workspace</h3>
                <p className="text-slate-400 text-xs mt-0.5">El workspace quedará activo inmediatamente tras la creación</p>
              </div>
              <button onClick={() => setNewWsModal(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3 mb-5">
              {/* Workspace name */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Nombre del workspace <span className="text-red-400">*</span></label>
                <input
                  value={newWsForm.name}
                  onChange={(e) => setNewWsForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="ej. Acme Corp Workspace"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Company */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Empresa <span className="text-red-400">*</span></label>
                <input
                  value={newWsForm.company}
                  onChange={(e) => setNewWsForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="ej. Acme Corp"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
                />
              </div>

              {/* Country & Tier row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">País</label>
                  <select
                    value={newWsForm.country}
                    onChange={(e) => setNewWsForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                  >
                    {["🇺🇸", "🇪🇸", "🇲🇽", "🇦🇷", "🇧🇷", "🇨🇴", "🇬🇧", "🇩🇪", "🇫🇷", "🇯🇵"].map(flag => (
                      <option key={flag} value={flag}>{flag}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Plan inicial</label>
                  <select
                    value={newWsForm.tier}
                    onChange={(e) => setNewWsForm(f => ({ ...f, tier: e.target.value as Tier }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50"
                  >
                    <option value="Starter">Starter — $99/mo</option>
                    <option value="Pro">Pro — $499/mo</option>
                    <option value="Enterprise">Enterprise — $1,299/mo</option>
                  </select>
                </div>
              </div>

              {/* Plan preview pill */}
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/40 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TierBadge tier={newWsForm.tier} />
                  <span className="text-slate-400 text-xs">
                    {newWsForm.tier === "Starter" ? "3 agentes · 5 proyectos" : newWsForm.tier === "Pro" ? "8 agentes · 20 proyectos" : "15 agentes · proyectos ilimitados"}
                  </span>
                </div>
                <span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>
                  {newWsForm.tier === "Starter" ? "$99" : newWsForm.tier === "Pro" ? "$499" : "$1,299"}/mo
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setNewWsModal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-sm hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                disabled={!newWsForm.name.trim() || !newWsForm.company.trim() || newWsLoading}
                onClick={() => {
                  if (!newWsForm.name.trim() || !newWsForm.company.trim()) return;
                  setNewWsLoading(true);
                  setTimeout(() => {
                    setNewWsLoading(false);
                    setNewWsModal(false);
                    toast.success(`Workspace "${newWsForm.name}" creado`, { description: `Plan ${newWsForm.tier} · ${newWsForm.company}` });
                  }, 1200);
                }}
                className="flex-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors flex items-center justify-center gap-2"
              >
                {newWsLoading
                  ? <span className="contents"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Creando...</span>
                  : <span className="contents"><Plus className="w-3.5 h-3.5" /> Crear Workspace</span>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impersonate Toast */}
      {impersonateId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-sm shadow-2xl">
          <Eye className="w-4 h-4 text-amber-400" />
          <span className="text-amber-200 text-sm">
            Impersonando <strong>{WORKSPACES.find(w => w.id === impersonateId)?.name}</strong> — Vista de solo lectura
          </span>
          <button onClick={() => setImpersonateId(null)} className="ml-2 text-amber-400 hover:text-amber-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Module 2: Usage Audit ─────────────────────────────────────────────────────

const USAGE_FIELDS: VCField[] = [
  { key: "slots_tracker",  label: "Slots Tracker",           description: "Gráficas de uso de slots por workspace",   category: "esencial",    locked: true    },
  { key: "token_summary",  label: "Resumen de tokens",       description: "KPIs rápidos de tokens, warnings y errores", category: "esencial",  defaultOn: true  },
  { key: "log_agent",      label: "Columna Agente",          description: "Nombre del agente en el log de eventos",   category: "operacional", defaultOn: true  },
  { key: "log_tokens",     label: "Columna Tokens",          description: "Tokens consumidos por evento",             category: "operacional", defaultOn: false },
  { key: "log_timestamp",  label: "Columna Timestamp",       description: "Hora exacta del evento",                   category: "avanzado",    defaultOn: false },
];

function UsageAudit() {
  const [filter, setFilter] = React.useState<"all" | "ok" | "warning" | "error">("all");
  const [vcOpen, setVcOpen] = React.useState(false);
  const vc = useViewConfig("cerebrin_admin_usage_v1", USAGE_FIELDS);

  const filteredLogs = EVENT_LOGS.filter(e => filter === "all" || e.status === filter);
  const totalTokensToday = EVENT_LOGS.reduce((sum, e) => sum + e.tokens, 0);

  return (
    <div className="flex flex-col gap-5 p-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>Usage Audit & Monitor</h2>
          <p className="text-slate-400 text-sm mt-0.5">Slots de agentes por workspace y log global de eventos IA</p>
        </div>
        <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />
      </div>

      {/* Slots Tracker */}
      <div>
        <h3 className="text-slate-300 text-sm mb-3" style={{ fontWeight: 600 }}>Slots Tracker — Agentes por Workspace</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {WORKSPACES.map((ws) => {
            const pct = (ws.agents / ws.maxAgents) * 100;
            const isHigh = pct > 80;
            return (
              <div key={ws.id} className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{ws.country}</span>
                    <span className="text-slate-200 text-xs" style={{ fontWeight: 600 }}>{ws.name}</span>
                    <TierBadge tier={ws.tier} />
                  </div>
                  <span className={cn("text-xs", isHigh ? "text-amber-400" : "text-slate-400")} style={{ fontWeight: 600 }}>
                    {ws.agents}/{ws.maxAgents}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pct >= 100 ? "bg-red-500" : isHigh ? "bg-amber-500" : "bg-violet-500"
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-slate-500 text-xs">{Math.round(pct)}% usado</span>
                  {isHigh && <span className="text-amber-400 text-xs">⚠ Cerca del límite</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Token Summary */}
      {vc.config.token_summary && <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3">
          <p className="text-xs text-slate-400">Tokens Hoy</p>
          <p className="text-emerald-400 text-xl mt-1" style={{ fontWeight: 700 }}>{(totalTokensToday / 1000).toFixed(1)}K</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3">
          <p className="text-xs text-slate-400">Eventos con Warning</p>
          <p className="text-amber-400 text-xl mt-1" style={{ fontWeight: 700 }}>{EVENT_LOGS.filter(e => e.status === "warning").length}</p>
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3">
          <p className="text-xs text-slate-400">Errores Detectados</p>
          <p className="text-red-400 text-xl mt-1" style={{ fontWeight: 700 }}>{EVENT_LOGS.filter(e => e.status === "error").length}</p>
        </div>
      </div>}

      {/* Event Log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>Log de Eventos Admin — Tiempo Real</h3>
          <div className="flex items-center gap-1">
            {(["all", "ok", "warning", "error"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs transition-colors capitalize",
                  filter === f ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {f === "all" ? "Todos" : f}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-800/80">
                {(["Time","Workspace","Evento"] as const).map(h => (
                  <th key={h} className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>{h}</th>
                ))}
                {vc.config.log_agent     && <th className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>Agente</th>}
                {vc.config.log_tokens    && <th className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>Tokens</th>}
                <th className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider" style={{ fontWeight: 500 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr key={log.id} className={cn("border-b border-slate-700/20", i % 2 === 0 ? "bg-slate-800/20" : "")}>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="px-4 py-2.5 text-slate-300" style={{ fontWeight: 500 }}>{log.workspace}</td>
                  <td className="px-4 py-2.5 text-slate-400">{log.event}</td>
                  {vc.config.log_agent && (
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300">
                        <Bot className="w-2.5 h-2.5" />{log.agent}
                      </span>
                    </td>
                  )}
                  {vc.config.log_tokens && (
                    <td className="px-4 py-2.5 font-mono">
                      <span className={cn(log.tokens > 30000 ? "text-amber-400" : "text-slate-400")}>{log.tokens.toLocaleString()}</span>
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs",
                      log.status === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                      log.status === "warning" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                      "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                      {log.status === "ok" && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {log.status === "warning" && <AlertTriangle className="w-2.5 h-2.5" />}
                      {log.status === "error" && <AlertCircle className="w-2.5 h-2.5" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {vcOpen && (
        <ViewCustomizerPanel
          title="Usage Audit"
          subtitle="Configura qué secciones y columnas mostrar"
          fields={USAGE_FIELDS}
          config={vc.config}
          onToggleField={vc.toggleField}
          onReset={vc.reset}
          onClose={() => setVcOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Module 3: Financial HUD ───────────────────────────────────────────────────

const customTooltipStyle = {
  backgroundColor: "#1E293B",
  border: "1px solid rgba(148,163,184,0.15)",
  borderRadius: "12px",
  padding: "8px 12px",
  color: "#E2E8F0",
  fontSize: "12px",
};

const FINANCIAL_FIELDS: VCField[] = [
  { key: "kpi_cards",      label: "KPI Cards principales",   description: "MRR, Churn Rate y Profit Margin",             category: "esencial",    locked: true    },
  { key: "secondary_kpis", label: "KPIs secundarios",        description: "ARR, clientes activos, ARPU y LTV estimado",  category: "operacional", defaultOn: false },
  { key: "mrr_chart",      label: "Gráfica MRR vs Coste",    description: "Evolución del MRR y coste IA en 7 meses",     category: "operacional", defaultOn: true  },
  { key: "churn_chart",    label: "Gráfica de Churn",        description: "Evolución del churn rate en 7 meses",         category: "avanzado",    defaultOn: false },
  { key: "profit_table",   label: "Tabla de márgenes",       description: "Detalle de profit y margen por mes",          category: "avanzado",    defaultOn: false },
];

function FinancialHUD() {
  const [vcOpen, setVcOpen] = React.useState(false);
  const vc = useViewConfig("cerebrin_admin_financial_v1", FINANCIAL_FIELDS);
  const currentMRR = MRR_HISTORY[MRR_HISTORY.length - 1].mrr;
  const prevMRR = MRR_HISTORY[MRR_HISTORY.length - 2].mrr;
  const mrrGrowth = (((currentMRR - prevMRR) / prevMRR) * 100).toFixed(1);

  const currentCost = MRR_HISTORY[MRR_HISTORY.length - 1].cost;
  const profitMargin = (((currentMRR - currentCost) / currentMRR) * 100).toFixed(1);

  const currentChurn = CHURN_HISTORY[CHURN_HISTORY.length - 1].rate;
  const prevChurn = CHURN_HISTORY[CHURN_HISTORY.length - 2].rate;
  const churnDelta = (currentChurn - prevChurn).toFixed(1);

  const profitData = MRR_HISTORY.map(d => ({
    ...d,
    profit: d.mrr - d.cost,
    margin: Number((((d.mrr - d.cost) / d.mrr) * 100).toFixed(1)),
  }));

  return (
    <div className="flex flex-col gap-5 p-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>Financial Intelligence</h2>
          <p className="text-slate-400 text-sm mt-0.5">Money HUD — Ingresos, churn y márgenes en tiempo real</p>
        </div>
        <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          label="MRR Actual"
          value={`$${currentMRR.toLocaleString()}`}
          sub="Ingreso mensual recurrente"
          trend={`+${mrrGrowth}% vs mes anterior`}
          trendUp
          color="emerald"
          icon={DollarSign}
        />
        <MetricCard
          label="Churn Rate"
          value={`${currentChurn}%`}
          sub="% de usuarios que abandonan"
          trend={`${churnDelta}% vs mes anterior`}
          trendUp={Number(churnDelta) < 0}
          color="blue"
          icon={TrendingDown}
        />
        <MetricCard
          label="Profit Margin"
          value={`${profitMargin}%`}
          sub={`Ingresos $${currentMRR.toLocaleString()} · Coste IA $${currentCost.toLocaleString()}`}
          trend={`$${(currentMRR - currentCost).toLocaleString()} neto este mes`}
          trendUp
          color="violet"
          icon={Percent}
        />
      </div>

      {/* Secondary KPIs */}
      {vc.config.secondary_kpis && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "ARR Proyectado", value: `$${(currentMRR * 12).toLocaleString()}`, note: "Anualizado" },
          { label: "Clientes Activos", value: WORKSPACES.filter(w => w.health === "healthy").length.toString(), note: `De ${WORKSPACES.length} totales` },
          { label: "ARPU", value: `$${Math.round(currentMRR / WORKSPACES.length).toLocaleString()}`, note: "Ingreso por workspace" },
          { label: "LTV Estimado", value: "$18,420", note: "Basado en churn rate" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-slate-700/40 bg-slate-800/40 px-4 py-3">
            <p className="text-xs text-slate-500">{kpi.label}</p>
            <p className="text-white text-lg mt-1" style={{ fontWeight: 700 }}>{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{kpi.note}</p>
          </div>
        ))}
      </div>}

      {/* Charts Row */}
      {vc.config.mrr_chart && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MRR Chart */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>MRR vs Coste IA (7 meses)</h3>
            <span className="text-xs text-slate-500">Últimos 7 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MRR_HISTORY}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="mrr" stroke="#10B981" strokeWidth={2} fill="url(#mrrGrad)" name="MRR" />
              <Area type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={2} fill="url(#costGrad)" name="Coste IA" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Margin Chart */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>Margen de Beneficio (%)</h3>
            <span className="text-xs text-emerald-400" style={{ fontWeight: 600 }}>{profitMargin}% actual</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => [`${v}%`, "Margen"]} />
              <Bar dataKey="margin" radius={[6, 6, 0, 0]}>
                {profitData.map((_, index) => (
                  <Cell key={index} fill={index === profitData.length - 1 ? "#8B5CF6" : "#6366F1"} fillOpacity={index === profitData.length - 1 ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>}

      {/* Churn Trend */}
      {vc.config.churn_chart && <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>Tendencia de Churn Rate</h3>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400">Bajando — Buena señal</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={CHURN_HISTORY}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 6]} />
            <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => [`${v}%`, "Churn"]} />
            <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: "#3B82F6", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>}

      {vcOpen && (
        <ViewCustomizerPanel
          title="Financial Intelligence"
          subtitle="Controla qué métricas y gráficas mostrar"
          fields={FINANCIAL_FIELDS}
          config={vc.config}
          onToggleField={vc.toggleField}
          onReset={vc.reset}
          onClose={() => setVcOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Module 4: Feedback & Encuestas ───────────────────────────────────────────

const FEEDBACK_FIELDS: VCField[] = [
  { key: "nps_score",   label: "NPS Score Global",       description: "Puntuación NPS con distribución visual",    category: "esencial",    locked: true    },
  { key: "pie_chart",   label: "Gráfica de distribución", description: "Pie chart de promotores, pasivos y detractores", category: "operacional", defaultOn: true  },
  { key: "comments",    label: "Comentarios recientes",  description: "Últimas respuestas textuales de clientes",   category: "operacional", defaultOn: false },
];

function FeedbackCenter() {
  const [vcOpen, setVcOpen] = React.useState(false);
  const vc = useViewConfig("cerebrin_admin_feedback_v1", FEEDBACK_FIELDS);
  const [activeTab, setActiveTab] = React.useState<"builder" | "results">("results");
  const [questionType, setQuestionType] = React.useState<"nps" | "text">("nps");
  const [question, setQuestion] = React.useState("¿Qué probabilidad hay de que recomiendes Cerebrin a un colega? (0-10)");
  const [target, setTarget] = React.useState<"all" | "pro" | "new">("all");
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [npsResult, setNpsResult] = React.useState<NPSResult | null>(null);
  const [activeSurveys, setActiveSurveys] = React.useState<Survey[]>([]);
  const [npsLoading, setNpsLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([calculateNPS(), fetchActiveSurveys()]).then(([nps, surveys]) => {
      setNpsResult(nps);
      setActiveSurveys(surveys);
      setNpsLoading(false);
    });
  }, []);

  const promoters  = npsResult?.promoters  ?? NPS_DISTRIBUTION[0].value;
  const passives   = npsResult?.passives   ?? NPS_DISTRIBUTION[1].value;
  const detractors = npsResult?.detractors ?? NPS_DISTRIBUTION[2].value;
  const npsScore   = npsResult?.score      ?? (NPS_DISTRIBUTION[0].value - NPS_DISTRIBUTION[2].value);
  const totalResp  = npsResult?.total_responses ?? (promoters + passives + detractors);

  const npsDistDisplay = [
    { name: "Promotores (9-10)", value: promoters,  color: "#10B981" },
    { name: "Pasivos (7-8)",     value: passives,   color: "#3B82F6" },
    { name: "Detractores (0-6)", value: detractors, color: "#EF4444" },
  ];

  return (
    <div className="flex flex-col gap-5 p-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>Feedback & Encuestas</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-sm">
              {activeSurveys.length > 0
                ? `${activeSurveys.length} campaña${activeSurveys.length > 1 ? "s" : ""} activa${activeSurveys.length > 1 ? "s" : ""}`
                : npsLoading ? "Cargando campañas…" : "Sin campañas activas"}
            </p>
            {!npsLoading && (
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs",
                npsScore >= 50 ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                  : npsScore >= 0 ? "bg-blue-500/10 border-blue-500/25 text-blue-400"
                  : "bg-red-500/10 border-red-500/25 text-red-400"
              )} style={{ fontWeight: 700 }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: npsScore >= 50 ? "#10B981" : npsScore >= 0 ? "#3B82F6" : "#EF4444" }} />
                NPS {npsScore >= 0 ? "+" : ""}{npsScore} · {totalResp} resp.
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />
          <div className="flex items-center gap-1 rounded-xl bg-slate-800/60 border border-slate-700/50 p-1">
          {([["results", "Resultados"], ["builder", "Survey Builder"]] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs transition-all",
                activeTab === tab ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      </div>

      {activeTab === "results" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* NPS Score */}
          <div className="col-span-1 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>NPS Score Global</h3>
              {npsLoading
                ? <div className="w-3.5 h-3.5 rounded-full border border-slate-600 border-t-indigo-400 animate-spin" />
                : <span className="text-[9px] text-slate-600 font-mono">GET /api/surveys/nps</span>}
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-500"
                  style={{ borderColor: npsScore >= 50 ? "#10B981" : npsScore >= 0 ? "#3B82F6" : "#EF4444" }}
                >
                  <span
                    className="text-3xl transition-all duration-500"
                    style={{ fontWeight: 800, color: npsScore >= 50 ? "#10B981" : npsScore >= 0 ? "#3B82F6" : "#EF4444" }}
                  >
                    {npsScore >= 0 ? "+" : ""}{npsScore}
                  </span>
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
              <p className="text-sm text-emerald-400" style={{ fontWeight: 600 }}>
                {npsScore >= 70 ? "Excelente 🎉" : npsScore >= 30 ? "Muy Bueno ✅" : npsScore >= 0 ? "Bueno 👍" : "En Riesgo ⚠️"}
              </p>
              <p className="text-xs text-slate-500 text-center">
                {npsLoading ? "Cargando…" : `Basado en ${totalResp} respuestas`}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {npsDistDisplay.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-slate-400">{item.name}</span>
                      <span className="text-xs text-slate-400">{item.value}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active surveys from fetchActiveSurveys() */}
            {activeSurveys.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700/30 space-y-1.5">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-2">Campañas activas · /api/surveys/active</p>
                {activeSurveys.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/30">
                    <div className="flex items-center gap-2">
                      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
                        s.type === "NPS" ? "bg-emerald-400" : s.type === "CSAT" ? "bg-blue-400" : "bg-violet-400"
                      )} />
                      <span className="text-[10px] text-slate-300 truncate max-w-[110px]" title={s.title}>{s.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[9px] text-slate-600">{s.responses} resp.</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md border",
                        s.type === "NPS" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : s.type === "CSAT" ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-violet-500/10 border-violet-500/20 text-violet-400"
                      )} style={{ fontWeight: 700 }}>{s.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pie Chart */}
          {vc.config.pie_chart && <div className="col-span-1 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
            <h3 className="text-slate-300 text-sm mb-2" style={{ fontWeight: 600 }}>Distribución de Satisfacción</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={npsDistDisplay}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {npsDistDisplay.map((entry, index) => (
                    <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} formatter={(v: number) => [`${v}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4">
              {npsDistDisplay.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-400">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>}

          {/* Comments */}
          <div className="col-span-1 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 overflow-hidden flex flex-col">
            <h3 className="text-slate-300 text-sm mb-3" style={{ fontWeight: 600 }}>Comentarios Recientes</h3>
            <div className="space-y-3 overflow-auto flex-1">
              {SURVEY_COMMENTS.map((c, i) => (
                <div key={i} className="rounded-xl bg-slate-800/60 border border-slate-700/30 px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-400">{c.workspace}</span>
                    <div className="flex items-center gap-1">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center text-xs",
                          c.score >= 9 ? "bg-emerald-500/20 text-emerald-400" :
                          c.score >= 7 ? "bg-blue-500/20 text-blue-400" :
                          "bg-red-500/20 text-red-400"
                        )}
                        style={{ fontWeight: 700 }}
                      >
                        {c.score}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">"{c.comment}"</p>
                  <p className="text-xs text-slate-600 mt-1">{c.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "builder" && (
        <div className="max-w-2xl">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6">
            <h3 className="text-slate-200 text-sm mb-5" style={{ fontWeight: 600 }}>Crear Nueva Encuesta</h3>

            {/* Question Type */}
            <div className="mb-5">
              <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Tipo de Pregunta</label>
              <div className="flex gap-2">
                {[
                  { id: "nps" as const, label: "NPS (1-10)", icon: Star },
                  { id: "text" as const, label: "Texto Libre", icon: MessageSquare },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setQuestionType(id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all",
                      questionType === id
                        ? "border-violet-500/50 bg-violet-600/15 text-violet-300"
                        : "border-slate-700/50 bg-slate-800 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-5">
              <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Pregunta</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-200 text-sm resize-none focus:outline-none focus:border-violet-500/50 placeholder:text-slate-500"
                placeholder="Escribe tu pregunta..."
              />
            </div>

            {/* Targeting */}
            <div className="mb-5">
              <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider">Audiencia</label>
              <div className="flex gap-2">
                {[
                  { id: "all" as const, label: "Todos", count: WORKSPACES.length },
                  { id: "pro" as const, label: "Solo Pro", count: WORKSPACES.filter(w => w.tier === "Pro").length },
                  { id: "new" as const, label: "Solo Nuevos (< 90d)", count: 3 },
                ].map(({ id, label, count }) => (
                  <button
                    key={id}
                    onClick={() => setTarget(id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all",
                      target === id
                        ? "border-blue-500/50 bg-blue-600/15 text-blue-300"
                        : "border-slate-700/50 bg-slate-800 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    <Users className="w-3.5 h-3.5" />
                    {label}
                    <span className={cn("px-1.5 py-0.5 rounded-md text-xs", target === id ? "bg-blue-500/20" : "bg-slate-700")}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {questionType === "nps" && (
              <div className="mb-5 rounded-xl border border-slate-600/50 bg-slate-900/50 p-4">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Preview</p>
                <p className="text-slate-200 text-sm mb-3">{question}</p>
                <div className="flex gap-1">
                  {Array.from({ length: 11 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs border"
                      style={{
                        backgroundColor: i <= 6 ? "rgba(239,68,68,0.1)" : i <= 8 ? "rgba(59,130,246,0.1)" : "rgba(16,185,129,0.1)",
                        borderColor: i <= 6 ? "rgba(239,68,68,0.2)" : i <= 8 ? "rgba(59,130,246,0.2)" : "rgba(16,185,129,0.2)",
                        color: i <= 6 ? "#F87171" : i <= 8 ? "#60A5FA" : "#34D399",
                        fontWeight: 600,
                      }}
                    >
                      {i}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={async () => {
                if (!question.trim()) {
                  toast.error("Error", { description: "La pregunta no puede estar vacía" });
                  return;
                }
                setSending(true);
                try {
                  const surveyReq: CreateSurveyRequest = {
                    workspace_id: "ws_nexo",
                    title: questionType === "nps" ? "NPS Survey" : "Feedback Survey",
                    question_type: questionType === "nps" ? "NPS" : "Text",
                    question_text: question,
                    target_audience: target,
                    active: true,
                  };
                  const result = await createSurvey(surveyReq);
                  setSent(true);
                  toast.success("¡Encuesta enviada!", {
                    description: `Se envió a ${result.target_count} workspaces. ID: ${result.survey_id.slice(0, 12)}...`,
                  });
                  // Refresh active surveys list
                  const surveys = await fetchActiveSurveys();
                  setActiveSurveys(surveys);
                } catch (error) {
                  console.error("Failed to create survey:", error);
                  toast.error("Error al crear encuesta", { description: "Intenta nuevamente" });
                } finally {
                  setSending(false);
                }
              }}
              disabled={sent || sending || !question.trim()}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all",
                sent
                  ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-default"
                  : sending
                  ? "bg-violet-600/50 text-white/50 cursor-wait"
                  : "bg-violet-600 hover:bg-violet-500 text-white"
              )}
            >
              {sent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  ¡Encuesta enviada!
                </>
              ) : sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Encuesta
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {vcOpen && (
        <ViewCustomizerPanel
          title="Feedback & Encuestas"
          subtitle="Configura qué secciones del panel NPS mostrar"
          fields={FEEDBACK_FIELDS}
          config={vc.config}
          onToggleField={vc.toggleField}
          onReset={vc.reset}
          onClose={() => setVcOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Module 5: Support Center ──────────────────────────────────────────────────

const SUPPORT_FIELDS: VCField[] = [
  { key: "ticket_priority", label: "Badge de prioridad",    description: "Prioridad crítica, alta, media o baja",          category: "esencial",    locked: true    },
  { key: "ticket_status",   label: "Badge de estado",       description: "Estado del ticket: abierto, en progreso…",        category: "esencial",    locked: true    },
  { key: "ticket_workspace",label: "Workspace asociado",    description: "A qué workspace pertenece el ticket",             category: "operacional", defaultOn: true  },
  { key: "ticket_category", label: "Categoría del ticket",  description: "Tipo de incidencia: Error, Billing, UI Bug…",     category: "operacional", defaultOn: false },
  { key: "ticket_assignee", label: "Agente asignado",       description: "Miembro del equipo de soporte asignado",          category: "operacional", defaultOn: true  },
  { key: "ticket_time",     label: "Tiempo de creación",    description: "Cuándo fue creado el ticket",                     category: "avanzado",    defaultOn: false },
];

function SupportCenter() {
  const [filter, setFilter] = React.useState<"all" | "open" | "in-progress" | "resolved">("all");
  const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [vcOpen, setVcOpen] = React.useState(false);
  const vc = useViewConfig("cerebrin_admin_support_v1", SUPPORT_FIELDS);

  const filtered = SUPPORT_TICKETS.filter((t) => filter === "all" || t.status === filter);
  const openCount = SUPPORT_TICKETS.filter(t => t.status === "open").length;
  const criticalCount = SUPPORT_TICKETS.filter(t => t.priority === "critical").length;
  const inProgressCount = SUPPORT_TICKETS.filter(t => t.status === "in-progress").length;

  return (
    <div className="flex flex-col gap-5 p-6 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>Centro de Soporte — Muro de Fuego</h2>
          <p className="text-slate-400 text-sm mt-0.5">Queue de tickets de soporte con priorización inteligente</p>
        </div>
        <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Tickets Abiertos", value: openCount, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Críticos", value: criticalCount, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
          { label: "En Ejecución", value: inProgressCount, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          { label: "Resueltos Hoy", value: SUPPORT_TICKETS.filter(t => t.status === "resolved").length, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        ].map((stat) => (
          <div key={stat.label} className={cn("rounded-xl border px-4 py-3", stat.bg)}>
            <p className="text-xs text-slate-400">{stat.label}</p>
            <p className={cn("text-2xl mt-1", stat.color)} style={{ fontWeight: 700 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        {([["all", "Todos"], ["open", "Abiertos"], ["in-progress", "En Ejecución"], ["resolved", "Resueltos"]] as const).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs transition-colors",
              filter === f ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white bg-slate-800 border border-slate-700/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ticket grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
        {filtered.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => setSelectedTicket(ticket)}
            className={cn(
              "rounded-2xl border bg-slate-800/40 p-4 cursor-pointer transition-all hover:border-slate-600",
              ticket.priority === "critical" ? "border-red-500/30 hover:border-red-500/50" :
              ticket.priority === "high" ? "border-orange-500/20" :
              "border-slate-700/40",
              selectedTicket?.id === ticket.id && "ring-1 ring-violet-500/50"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-mono">{ticket.id}</span>
                {vc.config.ticket_priority && <PriorityBadge priority={ticket.priority} />}
              </div>
              {vc.config.ticket_status && <StatusBadge status={ticket.status} />}
            </div>
            <p className="text-slate-200 text-sm mb-2" style={{ fontWeight: 500 }}>{ticket.subject}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {vc.config.ticket_workspace && (
                  <div className="contents">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-400">{ticket.workspace}</span>
                    {vc.config.ticket_category && <span className="text-xs text-slate-600">·</span>}
                  </div>
                )}
                {vc.config.ticket_category && <span className="text-xs text-slate-500">{ticket.category}</span>}
              </div>
              <div className="flex items-center gap-1.5">
                {vc.config.ticket_assignee && (ticket.assignee ? (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white" style={{ fontSize: 8, fontWeight: 700 }}>{ticket.assignee[0]}</span>
                    </div>
                    <span className="text-xs text-slate-400">{ticket.assignee}</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-600">Sin asignar</span>
                ))}
                {vc.config.ticket_time && <span className="text-xs text-slate-600">· {ticket.created}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ticket detail panel */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelectedTicket(null)}>
          <div className="flex-1" />
          <div
            className="w-full max-w-md h-full border-l border-slate-700/60 bg-slate-900 flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
              <div>
                <p className="text-xs text-slate-500 font-mono">{selectedTicket.id}</p>
                <h3 className="text-white text-sm mt-0.5" style={{ fontWeight: 600 }}>{selectedTicket.subject}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta */}
            <div className="px-5 py-4 border-b border-slate-700/30 space-y-3">
              <div className="flex items-center gap-3">
                <PriorityBadge priority={selectedTicket.priority} />
                <StatusBadge status={selectedTicket.status} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Workspace", value: selectedTicket.workspace },
                  { label: "Categoría", value: selectedTicket.category },
                  { label: "Creado", value: selectedTicket.created },
                  { label: "Asignado a", value: selectedTicket.assignee || "Sin asignar" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="text-xs text-slate-300 mt-0.5" style={{ fontWeight: 500 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-3 border-b border-slate-700/30 flex gap-2">
              <button className="flex-1 px-3 py-2 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs hover:bg-violet-600/30 transition-colors">
                Asignarme
              </button>
              <button className="flex-1 px-3 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-600/30 transition-colors">
                Marcar Resuelto
              </button>
              <button className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs hover:bg-slate-700 transition-colors">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Thread */}
            <div className="flex-1 px-5 py-4 overflow-auto space-y-3">
              {(selectedTicket.messages ?? []).map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "rounded-xl p-3 border",
                    msg.role === "user"
                      ? "bg-slate-800/60 border-slate-700/30"
                      : "bg-violet-500/10 border-violet-500/20"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                      msg.role === "user"
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : "bg-gradient-to-br from-violet-500 to-blue-500"
                    )}>
                      <span
                        className={msg.role === "user" ? "text-blue-300" : "text-white"}
                        style={{ fontSize: 8, fontWeight: 700 }}
                      >
                        {msg.author[0]}
                      </span>
                    </div>
                    <span className={cn("text-xs", msg.role === "user" ? "text-slate-400" : "text-violet-400")}>
                      {msg.author}
                      {msg.role === "support" && <span className="text-slate-600 ml-1">· Soporte Cerebrin</span>}
                      <span className="text-slate-600 ml-2">· {msg.created_at}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{msg.body}</p>
                </div>
              ))}
              {(selectedTicket.messages ?? []).length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No hay mensajes aún.</p>
              )}
            </div>

            {/* Reply box */}
            <div className="px-5 py-4 border-t border-slate-700/30">
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Responder al ticket..."
                  rows={2}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-200 text-xs resize-none focus:outline-none focus:border-violet-500/50 placeholder:text-slate-500"
                />
                <button
                  onClick={async () => {
                    if (!replyText.trim()) return;
                    await sendTicketMessage(selectedTicket.id, replyText);
                    toast.success(`Respuesta enviada al ticket ${selectedTicket.id}`);
                    setReplyText("");
                  }}
                  className="px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {vcOpen && (
        <ViewCustomizerPanel
          title="Centro de Soporte"
          subtitle="Configura qué campos mostrar en cada ticket"
          fields={SUPPORT_FIELDS}
          config={vc.config}
          onToggleField={vc.toggleField}
          onReset={vc.reset}
          onClose={() => setVcOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Main NEXO Admin Center ────────────────────────────────────────────────────

interface NexoAdminCenterProps {
  onBack: () => void;
}

const MODULES: { id: AdminModule; label: string; icon: React.ElementType; desc: string; badge?: string }[] = [
  { id: "workspaces", label: "CRM de Workspaces",          icon: Building2,       desc: "Gestión de tenants y planes" },
  { id: "usage",      label: "Usage Audit",                icon: Activity,        desc: "Slots y log de agentes",      badge: "1 error" },
  { id: "financial",  label: "Financial Intelligence",     icon: DollarSign,      desc: "MRR, churn y márgenes" },
  { id: "feedback",   label: "Feedback & Encuestas",       icon: MessageSquare,   desc: "NPS y campañas activas" },
  { id: "support",    label: "Centro de Soporte",          icon: LifeBuoy,        desc: "Muro de fuego",               badge: "3 open" },
];

export function NexoAdminCenter({ onBack }: NexoAdminCenterProps) {
  const [activeModule, setActiveModule] = React.useState<AdminModule>("workspaces");

  const renderModule = () => {
    switch (activeModule) {
      case "workspaces": return <WorkspacesCRM />;
      case "usage":      return <UsageAudit />;
      case "financial":  return <FinancialHUD />;
      case "feedback":   return <FeedbackCenter />;
      case "support":    return <SupportCenter />;
    }
  };

  const currentModule = MODULES.find(m => m.id === activeModule)!;

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* ── PHI-OS v2 · Mission Control Tactical Header ── */}
      <header className="h-14 shrink-0 flex items-center gap-4 px-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm"
        style={{ borderBottomColor: "rgba(99,102,241,0.12)" }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-indigo-500/30 transition-all text-xs"
          style={{ fontWeight: 600, letterSpacing: "0.04em" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          ESC
        </button>

        {/* NEXO Branding — PHI-OS v2 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center relative" style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: "linear-gradient(135deg, #4F46E5, #6366F1)",
          }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white" style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.12em", fontStyle: "italic" }}>NEXO</p>
            <p className="text-indigo-400/60" style={{ fontSize: 9, letterSpacing: "0.2em", fontWeight: 700, textTransform: "uppercase" }}>Admin Center · v2</p>
          </div>
        </div>

        <div className="w-px h-7 bg-slate-800" />

        {/* Breadcrumb — tactical */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 uppercase tracking-widest" style={{ fontSize: 10, fontWeight: 700 }}>Cerebrin</span>
          <ChevronRight className="w-3 h-3 text-slate-700" />
          <span className="text-indigo-300 uppercase tracking-widest" style={{ fontSize: 10, fontWeight: 700 }}>{currentModule.label}</span>
        </div>

        <div className="flex-1" />

        {/* Live status chips */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700 }}>Operativo</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-500/8 border border-indigo-500/15">
            <Radio className="w-2.5 h-2.5 text-indigo-400" />
            <span className="text-indigo-400 uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700 }}>SSE Live</span>
          </div>
          <div className="text-slate-600 uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700 }}>
            {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Module sidebar */}
        <aside className="w-56 shrink-0 border-r border-slate-800/60 bg-slate-900/50 flex flex-col">
          <div className="p-3 flex-1">
            <p className="text-xs text-slate-600 uppercase tracking-wider px-2 py-2" style={{ fontWeight: 600 }}>
              Módulos Admin
            </p>
            <div className="space-y-0.5">
              {MODULES.map((mod) => {
                const Icon = mod.icon;
                const isActive = activeModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModule(mod.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left group",
                      isActive
                        ? "bg-indigo-600/15 border border-indigo-500/25"
                        : "hover:bg-slate-800/60 border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                      isActive ? "bg-indigo-600/25" : "bg-slate-800 group-hover:bg-slate-700"
                    )}>
                      <Icon className={cn("w-3.5 h-3.5", isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs truncate", isActive ? "text-indigo-200" : "text-slate-400 group-hover:text-slate-200")} style={{ fontWeight: isActive ? 700 : 400 }}>
                        {mod.label}
                      </p>
                      <p className="text-slate-600 truncate" style={{ fontSize: 10 }}>{mod.desc}</p>
                    </div>
                    {mod.badge && (
                      <span className={cn(
                        "shrink-0 px-1.5 py-0.5 rounded-md text-xs",
                        mod.badge.includes("error") ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                      )}>
                        {mod.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin identity */}
          <div className="p-3 border-t border-slate-800/60">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/40">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 truncate" style={{ fontWeight: 600 }}>Alex Rivera</p>
                <p className="text-slate-600 truncate" style={{ fontSize: 10 }}>Super Admin</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Module content */}
        <main className="flex-1 min-w-0 overflow-hidden bg-slate-950">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
