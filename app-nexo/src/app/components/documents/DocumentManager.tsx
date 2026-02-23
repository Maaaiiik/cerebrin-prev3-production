/**
 * DocumentManager — Cerebrin PHI-OS v2
 *
 * Pipeline de documentos estratégicos con las 5 categorías del Master Brief:
 * Investigación → Planificación → Ejecución → Revisión → Terminado
 *
 * Metadata requerida por cada doc: progress_pct, priority_score, weight
 * priority_score > 7 = Critical (badge rojo)
 */

import * as React from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  FolderKanban,
  GripVertical,
  Layers,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import type { DocumentCategory } from "../../services/api";
import { querySemanticResonance, type SemanticSearchResult } from "../../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DocumentMeta {
  progress_pct: number;      // 0-100
  priority_score: number;    // 0-10, >7 = Critical (rojo)
  weight: number;            // 0.0-1.0
}

interface CerebrDocument {
  id: string;
  title: string;
  description: string;
  category: DocumentCategory;
  metadata: DocumentMeta;
  agent: string;
  agentColor: string;
  agentType: "RESEARCHER" | "WRITER" | "MANAGER";
  hitl_status: "PENDING" | "APPROVED" | "REJECTED" | null;
  created_at: string;
  updated_at: string;
}

// ─── Category Config ────────────────────────────────────────────────────────────

const CATEGORIES: {
  id: DocumentCategory;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
  description: string;
}[] = [
  {
    id: "Investigación",
    label: "Investigación",
    icon: Search,
    color: "#3B82F6",
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-400",
    dot: "bg-blue-500",
    description: "Análisis y recopilación de datos",
  },
  {
    id: "Planificación",
    label: "Planificación",
    icon: Target,
    color: "#8B5CF6",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    text: "text-violet-400",
    dot: "bg-violet-500",
    description: "Diseño de estrategia y roadmap",
  },
  {
    id: "Ejecución",
    label: "Ejecución",
    icon: Zap,
    color: "#F59E0B",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    text: "text-amber-400",
    dot: "bg-amber-500",
    description: "Implementación activa",
  },
  {
    id: "Revisión",
    label: "Revisión",
    icon: RefreshCw,
    color: "#EC4899",
    bg: "bg-pink-500/10",
    border: "border-pink-500/25",
    text: "text-pink-400",
    dot: "bg-pink-500",
    description: "Control de calidad y aprobación HITL",
  },
  {
    id: "Terminado",
    label: "Terminado",
    icon: CheckCircle2,
    color: "#10B981",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
    description: "Documentos finalizados y aprobados",
  },
];

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const SEED_DOCS: CerebrDocument[] = [
  {
    id: "DOC-001",
    title: "Análisis de Competidores Q1 2026",
    description: "Mapeo competitivo con scoring de feature parity vs. top 5 rivales del mercado LATAM.",
    category: "Investigación",
    metadata: { progress_pct: 65, priority_score: 8.4, weight: 0.9 },
    agent: "analyst-bot",
    agentColor: "#3B82F6",
    agentType: "RESEARCHER",
    hitl_status: "PENDING",
    created_at: "2026-02-18",
    updated_at: "2026-02-21",
  },
  {
    id: "DOC-002",
    title: "Benchmarking ICP — Enterprise SaaS",
    description: "Perfil de cliente ideal con datos cuantitativos de 40+ entrevistas y análisis de CRM.",
    category: "Investigación",
    metadata: { progress_pct: 100, priority_score: 6.2, weight: 0.6 },
    agent: "research-bot",
    agentColor: "#6366F1",
    agentType: "RESEARCHER",
    hitl_status: "APPROVED",
    created_at: "2026-02-10",
    updated_at: "2026-02-19",
  },
  {
    id: "DOC-003",
    title: "OKR Cascade 2026 — Strategic Plan",
    description: "Objetivos anuales en cascada desde C-level a equipos. 4 O · 16 KR definidos.",
    category: "Planificación",
    metadata: { progress_pct: 80, priority_score: 9.2, weight: 1.0 },
    agent: "strategy-bot",
    agentColor: "#10B981",
    agentType: "MANAGER",
    hitl_status: "PENDING",
    created_at: "2026-02-15",
    updated_at: "2026-02-21",
  },
  {
    id: "DOC-004",
    title: "Go-To-Market Plan LATAM",
    description: "Estrategia de entrada a mercados CL, MX, CO. Pricing, canales y recursos requeridos.",
    category: "Planificación",
    metadata: { progress_pct: 45, priority_score: 7.8, weight: 0.8 },
    agent: "strategy-bot",
    agentColor: "#10B981",
    agentType: "MANAGER",
    hitl_status: null,
    created_at: "2026-02-19",
    updated_at: "2026-02-21",
  },
  {
    id: "DOC-005",
    title: "Partner Portal MVP — Spec Técnico",
    description: "Especificaciones funcionales para el portal de partners. API design, auth flows y wireframes.",
    category: "Planificación",
    metadata: { progress_pct: 30, priority_score: 5.5, weight: 0.5 },
    agent: "dev-bot",
    agentColor: "#F59E0B",
    agentType: "WRITER",
    hitl_status: null,
    created_at: "2026-02-20",
    updated_at: "2026-02-21",
  },
  {
    id: "DOC-006",
    title: "Campaign Q2: Product Launch v3.0",
    description: "Copia completa de la campaña de lanzamiento: landing, email sequence y ads copy.",
    category: "Ejecución",
    metadata: { progress_pct: 72, priority_score: 8.9, weight: 0.9 },
    agent: "writer-bot",
    agentColor: "#8B5CF6",
    agentType: "WRITER",
    hitl_status: "PENDING",
    created_at: "2026-02-17",
    updated_at: "2026-02-21",
  },
  {
    id: "DOC-007",
    title: "API Integration Docs v2",
    description: "Documentación técnica para la API pública. Endpoints, auth, webhooks y ejemplos de código.",
    category: "Ejecución",
    metadata: { progress_pct: 88, priority_score: 6.1, weight: 0.7 },
    agent: "dev-bot",
    agentColor: "#F59E0B",
    agentType: "WRITER",
    hitl_status: null,
    created_at: "2026-02-16",
    updated_at: "2026-02-21",
  },
  {
    id: "DOC-008",
    title: "Executive Report: Revenue Q4 2025",
    description: "Reporte ejecutivo con análisis de varianza, drivers de crecimiento y proyecciones Q1.",
    category: "Revisión",
    metadata: { progress_pct: 95, priority_score: 9.5, weight: 1.0 },
    agent: "analyst-bot",
    agentColor: "#3B82F6",
    agentType: "RESEARCHER",
    hitl_status: "PENDING",
    created_at: "2026-02-14",
    updated_at: "2026-02-21",
  },
  {
    id: "DOC-009",
    title: "SOC2 Compliance Brief",
    description: "Resumen de cumplimiento normativo para el proceso de certificación SOC2 Type II.",
    category: "Revisión",
    metadata: { progress_pct: 90, priority_score: 7.3, weight: 0.8 },
    agent: "compliance-bot",
    agentColor: "#EC4899",
    agentType: "RESEARCHER",
    hitl_status: "PENDING",
    created_at: "2026-02-12",
    updated_at: "2026-02-20",
  },
  {
    id: "DOC-010",
    title: "Product Brief: Cerebrin 2.0",
    description: "Visión de producto, diferenciadores clave y roadmap de features para la versión 2.0.",
    category: "Terminado",
    metadata: { progress_pct: 100, priority_score: 5.8, weight: 1.0 },
    agent: "strategy-bot",
    agentColor: "#10B981",
    agentType: "MANAGER",
    hitl_status: "APPROVED",
    created_at: "2026-01-20",
    updated_at: "2026-02-10",
  },
  {
    id: "DOC-011",
    title: "Onboarding Guide Enterprise 2025",
    description: "Guía completa de onboarding para clientes Enterprise con playbook de adopción.",
    category: "Terminado",
    metadata: { progress_pct: 100, priority_score: 4.2, weight: 0.7 },
    agent: "writer-bot",
    agentColor: "#8B5CF6",
    agentType: "WRITER",
    hitl_status: "APPROVED",
    created_at: "2026-01-28",
    updated_at: "2026-02-05",
  },
];

// ─── HITL Status Config ─────────────────────────────────────────────────────────

const HITL_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  PENDING:  { label: "Pendiente",  badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",  dot: "bg-amber-500 animate-pulse" },
  APPROVED: { label: "Aprobado",   badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-500" },
  REJECTED: { label: "Rechazado",  badge: "bg-red-500/15 text-red-400 border-red-500/30",        dot: "bg-red-500" },
};

const AGENT_TYPE_ICON: Record<string, { label: string; color: string }> = {
  RESEARCHER: { label: "RESEARCHER", color: "#3B82F6" },
  WRITER:     { label: "WRITER",     color: "#8B5CF6" },
  MANAGER:    { label: "MANAGER",    color: "#10B981" },
};

// ─── Sub-Components ─────────────────────────────────────────────────────────────

function PriorityBadge({ score }: { score: number }) {
  const isCritical = score > 7;
  const isHigh = score > 5 && score <= 7;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] uppercase tracking-wider",
        isCritical
          ? "bg-red-500/15 text-red-400 border-red-500/30"
          : isHigh
          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
          : "bg-muted text-muted-foreground border-border"
      )}
      style={{ fontWeight: 700 }}
    >
      {isCritical && <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />}
      {score.toFixed(1)}
    </span>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative h-1.5 rounded-full bg-muted/60 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
      />
    </div>
  );
}

function WeightPips({ weight }: { weight: number }) {
  const filled = Math.round(weight * 5);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 h-1.5 rounded-sm",
            i < filled ? "bg-indigo-400/70" : "bg-muted-foreground/15"
          )}
        />
      ))}
    </div>
  );
}

function DocCard({
  doc,
  catCfg,
  onMoveNext,
  onDelete,
  compact,
}: {
  doc: CerebrDocument;
  catCfg: typeof CATEGORIES[0];
  onMoveNext: (id: string) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  const isCritical = doc.metadata.priority_score > 7;
  const agentTypeMeta = AGENT_TYPE_ICON[doc.agentType];

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2.5 p-3.5 rounded-2xl border bg-card transition-all duration-200 cursor-default",
        isCritical
          ? "border-red-500/25 hover:border-red-500/40"
          : "border-border/60 hover:border-border",
        "hover:shadow-lg hover:shadow-black/20"
      )}
    >
      {/* Critical accent line */}
      {isCritical && (
        <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r bg-red-500/60" />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-muted-foreground/40" style={{ fontSize: 9, fontWeight: 700 }}>
            {doc.id}
          </span>
          <PriorityBadge score={doc.metadata.priority_score} />
          {doc.hitl_status && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border",
                HITL_CONFIG[doc.hitl_status].badge
              )}
              style={{ fontSize: 9, fontWeight: 600 }}
            >
              <span className={cn("w-1 h-1 rounded-full shrink-0", HITL_CONFIG[doc.hitl_status].dot)} />
              {HITL_CONFIG[doc.hitl_status].label}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-popover border-border shadow-xl p-1">
            {doc.category !== "Terminado" && (
              <DropdownMenuItem
                onClick={() => onMoveNext(doc.id)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs"
              >
                <ChevronRight className="w-3.5 h-3.5 text-violet-400" />
                Avanzar etapa
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-border/60" />
            <DropdownMenuItem
              onClick={() => onDelete(doc.id)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs text-red-400 focus:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title & description */}
      <div>
        <p className="text-foreground text-sm leading-snug" style={{ fontWeight: 600 }}>
          {doc.title}
        </p>
        {!compact && (
          <p className="text-muted-foreground/60 text-xs leading-relaxed mt-0.5 line-clamp-2">
            {doc.description}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <ProgressBar pct={doc.metadata.progress_pct} color={catCfg.color} />

      {/* Metadata row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-muted-foreground/40" />
          <span className="text-muted-foreground/50 text-xs">{doc.metadata.progress_pct}%</span>
        </div>
        <div className="flex items-center gap-1" title={`Weight: ${doc.metadata.weight}`}>
          <Layers className="w-3 h-3 text-muted-foreground/40" />
          <WeightPips weight={doc.metadata.weight} />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3 text-muted-foreground/30" />
          <span className="text-muted-foreground/30 text-xs">{doc.updated_at}</span>
        </div>
      </div>

      {/* Agent badge */}
      <div className="flex items-center gap-1.5 pt-0.5 border-t border-border/40">
        <div
          className="w-4 h-4 flex items-center justify-center shrink-0"
          style={{
            clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            backgroundColor: `${doc.agentColor}20`,
          }}
        />
        <Bot className="w-3 h-3 shrink-0" style={{ color: doc.agentColor }} />
        <span className="text-xs" style={{ color: doc.agentColor, fontSize: 10, fontWeight: 600 }}>
          {doc.agent}
        </span>
        <span className="ml-auto text-muted-foreground/25 uppercase tracking-wider" style={{ fontSize: 8 }}>
          {agentTypeMeta.label}
        </span>
      </div>
    </div>
  );
}

// ─── Create Document Dialog ─────────────────────────────────────────────────────

function CreateDocDialog({
  open,
  onOpenChange,
  onCreated,
  defaultCategory,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (doc: CerebrDocument) => void;
  defaultCategory?: DocumentCategory;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<DocumentCategory>(defaultCategory ?? "Investigación");
  const [agentId, setAgentId] = React.useState("writer");
  const [priorityScore, setPriorityScore] = React.useState(5);
  const [weight, setWeight] = React.useState(0.5);
  const [loading, setLoading] = React.useState(false);

  const AGENT_OPTIONS = [
    { id: "writer",   name: "writer-bot",   color: "#8B5CF6", type: "WRITER" as const },
    { id: "analyst",  name: "analyst-bot",  color: "#3B82F6", type: "RESEARCHER" as const },
    { id: "strategy", name: "strategy-bot", color: "#10B981", type: "MANAGER" as const },
    { id: "dev",      name: "dev-bot",      color: "#F59E0B", type: "WRITER" as const },
  ];

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setCategory(defaultCategory ?? "Investigación");
      setAgentId("writer");
      setPriorityScore(5);
      setWeight(0.5);
    }
  }, [open, defaultCategory]);

  const selectedAgent = AGENT_OPTIONS.find(a => a.id === agentId)!;
  const canSubmit = title.trim().length > 0;

  const handleCreate = () => {
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      const counter = parseInt(localStorage.getItem("cerebrin_doc_counter") ?? "11", 10) + 1;
      localStorage.setItem("cerebrin_doc_counter", String(counter));
      const newDoc: CerebrDocument = {
        id: `DOC-${String(counter).padStart(3, "0")}`,
        title: title.trim(),
        description: description.trim() || "Sin descripción",
        category,
        metadata: { progress_pct: 0, priority_score: priorityScore, weight },
        agent: selectedAgent.name,
        agentColor: selectedAgent.color,
        agentType: selectedAgent.type,
        hitl_status: priorityScore > 7 ? "PENDING" : null,
        created_at: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString().split("T")[0],
      };
      onCreated(newDoc);
      setLoading(false);
      onOpenChange(false);
      toast.success("Documento creado", {
        description: `${newDoc.id} · ${newDoc.title}${priorityScore > 7 ? " · HITL activado automáticamente" : ""}`,
      });
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border border-border shadow-2xl rounded-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-foreground text-sm" style={{ fontWeight: 700 }}>
                Nuevo Documento Estratégico
              </DialogTitle>
              <p className="text-indigo-400/60 font-mono" style={{ fontSize: 10 }}>
                POST /api/documents · PHI-OS v2
              </p>
            </div>
          </div>
          <DialogDescription className="text-muted-foreground text-xs mt-1">
            Los documentos con priority_score {">"} 7 activan HITL automáticamente
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600 }}>
              Título <span className="text-destructive">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSubmit && handleCreate()}
              placeholder="Nombre del documento..."
              className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600 }}>
              Descripción
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Contexto, objetivos y alcance del documento..."
              className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 resize-none transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600 }}>
              Categoría Pipeline
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all",
                    category === cat.id
                      ? cn(cat.bg, cat.border, cat.text)
                      : "bg-muted/20 border-border/40 text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
                  )}
                  style={{ fontWeight: category === cat.id ? 700 : 400 }}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Score */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between" style={{ fontWeight: 600 }}>
              <span>Priority Score</span>
              <span className={cn("font-mono", priorityScore > 7 ? "text-red-400" : "text-muted-foreground")}>
                {priorityScore.toFixed(1)} {priorityScore > 7 ? "· CRÍTICO" : ""}
              </span>
            </label>
            <input
              type="range"
              min={0} max={10} step={0.1}
              value={priorityScore}
              onChange={e => setPriorityScore(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground/30 mt-1">
              <span>0 — Baja</span>
              <span>5 — Media</span>
              <span>10 — Crítica</span>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between" style={{ fontWeight: 600 }}>
              <span>Weight</span>
              <span className="font-mono text-muted-foreground">{weight.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={weight}
              onChange={e => setWeight(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Agent */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600 }}>
              Agente Asignado
            </label>
            <div className="flex flex-wrap gap-2">
              {AGENT_OPTIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setAgentId(a.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all",
                    agentId === a.id ? "border-border bg-muted/60" : "border-border/40 text-muted-foreground/50 hover:border-border"
                  )}
                >
                  <div
                    className="w-3 h-3"
                    style={{
                      clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
                      backgroundColor: `${a.color}20`,
                      border: `1px solid ${a.color}50`,
                    }}
                  />
                  <span style={{ fontSize: 10, fontWeight: agentId === a.id ? 700 : 400 }}>{a.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* HITL warning */}
          {priorityScore > 7 && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-400/80 text-xs leading-relaxed">
                Priority score {">"} 7 — Este documento activará HITL y requerirá aprobación humana antes de ejecutarse.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-end gap-3 bg-muted/20">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs text-muted-foreground border border-border hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!canSubmit || loading}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-white transition-all",
              !canSubmit || loading
                ? "bg-muted border border-border text-muted-foreground cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40"
            )}
            style={{ fontWeight: 600 }}
          >
            {loading ? <><Loader2 className="w-3 h-3 animate-spin" />Creando…</> : <><FileText className="w-3 h-3" />Crear Documento</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── List View ──────────────────────────────────────────────────────────────────

function DocListView({
  docs,
  onMoveNext,
  onDelete,
}: {
  docs: CerebrDocument[];
  onMoveNext: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const maxScore = 10;
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-muted-foreground/40 uppercase tracking-wider" style={{ fontSize: 9, fontWeight: 600 }}>
        <span>Documento</span>
        <span className="text-center w-20">Categoría</span>
        <span className="text-center w-16">Progreso</span>
        <span className="text-center w-12">Score</span>
        <span className="text-center w-20">Agente</span>
        <span className="text-center w-6"></span>
      </div>
      {docs.map(doc => {
        const catCfg = CATEGORIES.find(c => c.id === doc.category)!;
        const isCritical = doc.metadata.priority_score > 7;
        return (
          <div
            key={doc.id}
            className={cn(
              "flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 md:gap-4 items-start md:items-center px-4 py-3 rounded-xl border transition-all hover:bg-muted/30",
              isCritical ? "border-red-500/20" : "border-border/40"
            )}
          >
            {/* Title */}
            <div className="min-w-0 w-full md:w-auto">
              <div className="flex items-center gap-2">
                {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />}
                <p className="text-foreground text-sm truncate" style={{ fontWeight: 500 }}>{doc.title}</p>
              </div>
              <p className="font-mono text-muted-foreground/30 truncate" style={{ fontSize: 9 }}>{doc.id}</p>
            </div>

            {/* Mobile: Stats Row */}
            <div className="flex md:hidden items-center gap-3 w-full flex-wrap">
              {/* Category */}
              <span className={cn("px-2 py-0.5 rounded-lg border text-xs", catCfg.bg, catCfg.border, catCfg.text)} style={{ fontSize: 9, fontWeight: 600 }}>
                {doc.category}
              </span>

              {/* Progress */}
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${doc.metadata.progress_pct}%`, backgroundColor: catCfg.color, opacity: 0.7 }} />
                </div>
                <span className="text-muted-foreground/50" style={{ fontSize: 9 }}>{doc.metadata.progress_pct}%</span>
              </div>

              {/* Score */}
              <PriorityBadge score={doc.metadata.priority_score} />

              {/* Agent */}
              <div className="flex items-center gap-1">
                <Bot className="w-3 h-3 shrink-0" style={{ color: doc.agentColor }} />
                <span className="text-xs truncate" style={{ color: doc.agentColor, fontSize: 10, fontWeight: 600 }}>{doc.agent.replace("-bot", "")}</span>
              </div>
            </div>

            {/* Desktop: Category */}
            <div className="hidden md:block w-20 text-center">
              <span className={cn("px-2 py-0.5 rounded-lg border text-xs", catCfg.bg, catCfg.border, catCfg.text)} style={{ fontSize: 9, fontWeight: 600 }}>
                {doc.category}
              </span>
            </div>

            {/* Desktop: Progress */}
            <div className="hidden md:block w-16">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${doc.metadata.progress_pct}%`, backgroundColor: catCfg.color, opacity: 0.7 }} />
                </div>
                <span className="text-muted-foreground/50" style={{ fontSize: 9 }}>{doc.metadata.progress_pct}%</span>
              </div>
            </div>

            {/* Desktop: Score */}
            <div className="hidden md:block w-12 text-center">
              <PriorityBadge score={doc.metadata.priority_score} />
            </div>

            {/* Desktop: Agent */}
            <div className="hidden md:flex w-20 items-center gap-1 justify-center">
              <Bot className="w-3 h-3 shrink-0" style={{ color: doc.agentColor }} />
              <span className="text-xs truncate" style={{ color: doc.agentColor, fontSize: 10, fontWeight: 600 }}>{doc.agent.replace("-bot", "")}</span>
            </div>

            {/* Actions */}
            <div className="w-6 absolute top-3 right-3 md:relative md:top-auto md:right-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-lg text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted transition-colors">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 bg-popover border-border shadow-xl p-1">
                  {doc.category !== "Terminado" && (
                    <DropdownMenuItem onClick={() => onMoveNext(doc.id)} className="text-xs px-2 py-1.5 rounded-lg cursor-pointer">
                      Avanzar etapa
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem onClick={() => onDelete(doc.id)} className="text-xs px-2 py-1.5 rounded-lg cursor-pointer text-red-400 focus:text-red-400">
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function DocumentManager() {
  const [docs, setDocs] = React.useState<CerebrDocument[]>(SEED_DOCS);
  const [viewMode, setViewMode] = React.useState<"kanban" | "list">("kanban");
  const [activeCategory, setActiveCategory] = React.useState<DocumentCategory | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [semanticMode, setSemanticMode] = React.useState(false);
  const [semanticResults, setSemanticResults] = React.useState<SemanticSearchResult[]>([]);
  const [semanticLoading, setSemanticLoading] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createCategory, setCreateCategory] = React.useState<DocumentCategory>("Investigación");

  const handleMoveNext = (id: string) => {
    const order: DocumentCategory[] = ["Investigación", "Planificación", "Ejecución", "Revisión", "Terminado"];
    setDocs(prev => prev.map(d => {
      if (d.id !== id) return d;
      const idx = order.indexOf(d.category);
      if (idx >= order.length - 1) return d;
      const nextCat = order[idx + 1];
      toast.success(`${d.id} movido a ${nextCat}`, {
        description: d.title,
      });
      return { ...d, category: nextCat, updated_at: new Date().toISOString().split("T")[0] };
    }));
  };

  const handleDelete = (id: string) => {
    const doc = docs.find(d => d.id === id);
    setDocs(prev => prev.filter(d => d.id !== id));
    toast.error("Documento eliminado", { description: `${id} · ${doc?.title}` });
  };

  const handleCreated = (doc: CerebrDocument) => {
    setDocs(prev => [doc, ...prev]);
  };

  // Semantic search effect
  React.useEffect(() => {
    if (!semanticMode || !searchQuery.trim()) {
      setSemanticResults([]);
      return;
    }

    const performSemanticSearch = async () => {
      setSemanticLoading(true);
      try {
        const results = await querySemanticResonance({
          query: searchQuery,
          workspace_id: "ws_default",
          limit: 5,
          category_filter: activeCategory !== "all" ? [activeCategory] : undefined,
        });
        setSemanticResults(results);
      } catch (error) {
        console.error("Semantic search failed:", error);
        toast.error("Error en búsqueda semántica");
        setSemanticResults([]);
      } finally {
        setSemanticLoading(false);
      }
    };

    const debounce = setTimeout(performSemanticSearch, 600);
    return () => clearTimeout(debounce);
  }, [searchQuery, semanticMode, activeCategory]);

  const filteredDocs = docs.filter(d => {
    const matchesCat = activeCategory === "all" || d.category === activeCategory;
    const matchesSearch = !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Stats
  const criticalCount = docs.filter(d => d.metadata.priority_score > 7).length;
  const pendingHitl = docs.filter(d => d.hitl_status === "PENDING").length;
  const avgProgress = Math.round(docs.reduce((s, d) => s + d.metadata.progress_pct, 0) / docs.length);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-4 border-b border-border/60 bg-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h1
                  className="text-foreground uppercase tracking-widest"
                  style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.15em" }}
                >
                  Document Pipeline
                </h1>
                <p className="text-indigo-400/60 font-mono" style={{ fontSize: 9 }}>
                  PHI-OS v2 · {docs.length} documentos activos
                </p>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-center">
              <p className="text-red-400 tabular-nums" style={{ fontWeight: 800, fontSize: 18 }}>{criticalCount}</p>
              <p className="text-muted-foreground/40 uppercase tracking-wider" style={{ fontSize: 8 }}>Críticos</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-amber-400 tabular-nums" style={{ fontWeight: 800, fontSize: 18 }}>{pendingHitl}</p>
              <p className="text-muted-foreground/40 uppercase tracking-wider" style={{ fontSize: 8 }}>HITL Pending</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <p className="text-emerald-400 tabular-nums" style={{ fontWeight: 800, fontSize: 18 }}>{avgProgress}%</p>
              <p className="text-muted-foreground/40 uppercase tracking-wider" style={{ fontSize: 8 }}>Progreso medio</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border">
              <Search className="w-3.5 h-3.5 text-muted-foreground/40" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={semanticMode ? "Búsqueda semántica..." : "Buscar documentos..."}
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none w-40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground/40 hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Semantic Search Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-muted/40">
              <Sparkles className={cn("w-3.5 h-3.5 transition-colors", semanticMode ? "text-violet-400" : "text-muted-foreground/40")} />
              <span className="text-xs text-muted-foreground/60">Semántica</span>
              <Switch
                checked={semanticMode}
                onCheckedChange={setSemanticMode}
                className="data-[state=checked]:bg-violet-500"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("kanban")}
                className={cn("px-3 py-1.5 text-xs transition-colors", viewMode === "kanban" ? "bg-violet-600/20 text-violet-300" : "text-muted-foreground hover:bg-muted")}
                title="Vista Kanban"
              >
                <FolderKanban className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn("px-3 py-1.5 text-xs transition-colors", viewMode === "list" ? "bg-violet-600/20 text-violet-300" : "text-muted-foreground hover:bg-muted")}
                title="Vista Lista"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Create */}
            <button
              onClick={() => { setCreateCategory("Investigación"); setCreateOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs border border-indigo-500/40 transition-all"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Doc
            </button>
          </div>
        </div>
      </div>

      {/* ── Category filter tabs ── */}
      {viewMode === "list" && (
        <div className="shrink-0 flex items-center gap-1.5 px-6 py-3 border-b border-border/40 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-all",
              activeCategory === "all"
                ? "bg-muted/60 border-border text-foreground"
                : "border-transparent text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30"
            )}
            style={{ fontWeight: activeCategory === "all" ? 600 : 400 }}
          >
            <Filter className="w-3 h-3" />
            Todos ({docs.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = docs.filter(d => d.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-all",
                  activeCategory === cat.id
                    ? cn(cat.bg, cat.border, cat.text)
                    : "border-transparent text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30"
                )}
                style={{ fontWeight: activeCategory === cat.id ? 600 : 400 }}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {semanticMode && searchQuery.trim() ? (
          /* Semantic Search Results */
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-foreground font-semibold">Búsqueda Semántica</h2>
                  <p className="text-muted-foreground text-sm">
                    {semanticLoading ? "Buscando..." : `${semanticResults.length} resultados para "${searchQuery}"`}
                  </p>
                </div>
              </div>

              {/* Loading state */}
              {semanticLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              )}

              {/* Results */}
              {!semanticLoading && semanticResults.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground">No se encontraron documentos relacionados</p>
                </div>
              )}

              {!semanticLoading && semanticResults.length > 0 && (
                <div className="space-y-3">
                  {semanticResults.map((result) => {
                    const cat = CATEGORIES.find((c) => c.id === result.category);
                    const CatIcon = cat?.icon ?? FileText;
                    return (
                      <div
                        key={result.id}
                        className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cat?.bg, cat?.border, "border")}>
                              <CatIcon className="w-4 h-4" style={{ color: cat?.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-foreground font-semibold mb-1 truncate">{result.title}</h3>
                              <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{result.excerpt}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className={cn("text-xs", cat?.text)}>
                                  {result.category}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {result.metadata.progress_pct}% completado
                                </Badge>
                                {result.metadata.priority_score > 7 && (
                                  <Badge variant="destructive" className="text-xs">
                                    Critical
                                  </Badge>
                                )}
                                <span className="text-muted-foreground/40 text-xs">
                                  Última modificación: {result.last_modified}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 mb-1">
                              <Target className="w-3.5 h-3.5 text-violet-400" />
                              <span className="text-violet-400 font-mono font-bold text-sm">
                                {Math.round(result.score * 100)}%
                              </span>
                            </div>
                            <p className="text-muted-foreground/40 text-xs">relevancia</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : viewMode === "kanban" ? (
          /* Kanban view */
          <div className="flex h-full gap-3 p-4 overflow-x-auto [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border">
            {CATEGORIES.map(cat => {
              const colDocs = docs.filter(d =>
                d.category === cat.id &&
                (!searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase()))
              );
              const CatIcon = cat.icon;
              return (
                <div
                  key={cat.id}
                  className="flex flex-col shrink-0 rounded-2xl border border-border/60 bg-muted/20 overflow-hidden"
                  style={{ width: 280 }}
                >
                  {/* Column header */}
                  <div className={cn("flex items-center gap-2.5 px-4 py-3 border-b shrink-0", cat.border, cat.bg)}>
                    <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: cat.color }} />
                    <p className="text-foreground text-xs truncate flex-1" style={{ fontWeight: 700 }}>
                      {cat.label}
                    </p>
                    <span
                      className={cn("shrink-0 px-2 py-0.5 rounded-full border text-xs", cat.bg, cat.border, cat.text)}
                      style={{ fontWeight: 700, fontSize: 10 }}
                    >
                      {colDocs.length}
                    </span>
                    <button
                      onClick={() => { setCreateCategory(cat.id); setCreateOpen(true); }}
                      className="shrink-0 p-1 rounded-lg hover:bg-muted/60 transition-colors"
                      title={`Nuevo doc en ${cat.label}`}
                    >
                      <Plus className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground" />
                    </button>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border">
                    {colDocs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-40">
                        <CatIcon className="w-6 h-6 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground/50">Sin documentos</p>
                        <button
                          onClick={() => { setCreateCategory(cat.id); setCreateOpen(true); }}
                          className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs mt-1", cat.bg, cat.border, cat.text)}
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </button>
                      </div>
                    ) : (
                      colDocs.map(doc => (
                        <DocCard
                          key={doc.id}
                          doc={doc}
                          catCfg={cat}
                          onMoveNext={handleMoveNext}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>

                  {/* Column footer stats */}
                  <div className="px-4 py-2 border-t border-border/40 shrink-0 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-muted-foreground/30" />
                      <span className="text-muted-foreground/30" style={{ fontSize: 9 }}>
                        avg {colDocs.length > 0 ? Math.round(colDocs.reduce((s, d) => s + d.metadata.progress_pct, 0) / colDocs.length) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-muted-foreground/30" />
                      <span className="text-muted-foreground/30" style={{ fontSize: 9 }}>
                        {colDocs.filter(d => d.metadata.priority_score > 7).length} críticos
                      </span>
                    </div>
                    <div className="flex-1" />
                    <GripVertical className="w-3 h-3 text-muted-foreground/15" title="Drag hint" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="flex-1 overflow-y-auto p-6">
            {filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground/40">
                <FileText className="w-10 h-10" />
                <p className="text-sm">No hay documentos que coincidan</p>
              </div>
            ) : (
              <DocListView docs={filteredDocs} onMoveNext={handleMoveNext} onDelete={handleDelete} />
            )}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <CreateDocDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
        defaultCategory={createCategory}
      />
    </div>
  );
}
