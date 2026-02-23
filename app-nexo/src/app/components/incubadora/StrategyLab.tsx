import { useState, useRef, useCallback } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Loader2,
  PenLine,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Shield,
  User,
  X,
  Zap,
  Clock,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { cn } from "../ui/utils";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { UniversalTaskSheet, type UniversalEntity } from "../shared/UniversalTaskSheet";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import { toast } from "sonner";
import { promoteIdea } from "../../services/api";
import {
  useViewConfig,
  ViewConfigCtx,
  useVC,
  ViewCustomizerTrigger,
  ViewCustomizerPanel,
  type VCField,
} from "../shared/ViewCustomizer";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Column = "drafts" | "analyzing" | "ready";
type Level = "Low" | "Medium" | "High";

interface IdeaScores {
  fit: number;       // 0-10
  feasibility: Level;
  risk: Level;
  effort: Level;
  strategic: number; // 0-10
  market: number;    // 0-10
  confidence: number;// 0-100
  timeToShip?: string;
  reasoning: string;
}

interface IdeaCard {
  id: string;
  correlativeId: string;
  title: string;
  description: string;
  assignee_type: "HUMAN" | "AGENT";
  column: Column;
  created_at: string;
  scores?: IdeaScores;
}

interface DragItem {
  id: string;
  fromColumn: Column;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_CARDS: IdeaCard[] = [
  // DRAFTS
  {
    id: "d1",
    correlativeId: "IDEA-002",
    title: "B2B Partnership Portal",
    description:
      "Self-service portal allowing channel partners to manage deals, commissions, and co-marketing campaigns without manual ops overhead.",
    assignee_type: "HUMAN",
    column: "drafts",
    created_at: "Feb 18",
  },
  {
    id: "d2",
    correlativeId: "IDEA-003",
    title: "AI-Powered Sales Forecasting",
    description:
      "Use historical pipeline data and real-time market signals to generate quarterly revenue forecasts with probabilistic confidence intervals.",
    assignee_type: "AGENT",
    column: "drafts",
    created_at: "Feb 19",
  },
  {
    id: "d3",
    correlativeId: "IDEA-004",
    title: "Customer Success Chatbot",
    description:
      "Deploy a conversational agent to triage and resolve tier-1 support queries autonomously, targeting a 40% load reduction.",
    assignee_type: "HUMAN",
    column: "drafts",
    created_at: "Feb 20",
  },

  // AI ANALYZING
  {
    id: "a1",
    correlativeId: "IDEA-005",
    title: "Automated Invoice Processing",
    description:
      "Extract, validate, and reconcile invoice data from email attachments using computer vision and NLP, feeding directly into accounting ERP.",
    assignee_type: "AGENT",
    column: "analyzing",
    created_at: "Feb 17",
    scores: {
      fit: 7.8,
      feasibility: "High",
      risk: "Low",
      effort: "Medium",
      strategic: 7.2,
      market: 8.1,
      confidence: 72,
      timeToShip: "8–10 weeks",
      reasoning:
        "Strong automation opportunity with a proven tech stack. Clear ROI path with low regulatory friction.",
    },
  },
  {
    id: "a2",
    correlativeId: "IDEA-006",
    title: "Regional Pricing Engine",
    description:
      "Dynamic pricing for LATAM markets that adjusts subscription tiers based on purchasing power parity and real-time competitor benchmarks.",
    assignee_type: "AGENT",
    column: "analyzing",
    created_at: "Feb 18",
    scores: {
      fit: 8.9,
      feasibility: "Medium",
      risk: "Medium",
      effort: "High",
      strategic: 9.1,
      market: 8.7,
      confidence: 81,
      timeToShip: "12–14 weeks",
      reasoning:
        "High strategic alignment with LATAM expansion roadmap. Complexity lies in multi-currency regulatory compliance.",
    },
  },
  {
    id: "a3",
    correlativeId: "IDEA-007",
    title: "Self-Service Analytics Dashboard",
    description:
      "Embedded analytics giving clients real-time access to usage metrics, ROI attribution reports, and custom cohort analyses.",
    assignee_type: "AGENT",
    column: "analyzing",
    created_at: "Feb 19",
    // no scores yet — analysis just started
  },

  // READY TO PROMOTE
  {
    id: "r1",
    correlativeId: "IDEA-008",
    title: "Embedded Finance Module",
    description:
      "Integrate lending and payment facilitation directly into the platform for LATAM SMBs, enabling revenue-based financing at the point of need.",
    assignee_type: "AGENT",
    column: "ready",
    created_at: "Feb 15",
    scores: {
      fit: 9.2,
      feasibility: "High",
      risk: "Medium",
      effort: "High",
      strategic: 9.5,
      market: 9.1,
      confidence: 91,
      timeToShip: "16–20 weeks",
      reasoning:
        "Highest-ranked opportunity this quarter. 3 design partners committed. Strong PMF signals across LATAM segment.",
    },
  },
  {
    id: "r2",
    correlativeId: "IDEA-009",
    title: "WhatsApp Business Integration",
    description:
      "Trigger AI workflows and deliver agent outputs via WhatsApp — the dominant LATAM channel at 98% mobile penetration.",
    assignee_type: "AGENT",
    column: "ready",
    created_at: "Feb 16",
    scores: {
      fit: 8.7,
      feasibility: "High",
      risk: "Low",
      effort: "Low",
      strategic: 8.4,
      market: 9.3,
      confidence: 88,
      timeToShip: "6–8 weeks",
      reasoning:
        "Lowest effort, maximum market reach. WhatsApp API access already established. Fastest path to user adoption.",
    },
  },
  {
    id: "r3",
    correlativeId: "IDEA-010",
    title: "Enterprise SSO & Compliance",
    description:
      "SAML/OIDC single sign-on with audit logs, data residency controls, and SOC2 Type II certification for enterprise segment unlock.",
    assignee_type: "HUMAN",
    column: "ready",
    created_at: "Feb 16",
    scores: {
      fit: 8.1,
      feasibility: "Medium",
      risk: "Low",
      effort: "Medium",
      strategic: 8.8,
      market: 7.9,
      confidence: 85,
      timeToShip: "10–12 weeks",
      reasoning:
        "Critical unlocker for enterprise deals. 4 active opportunities currently blocked pending compliance certification.",
    },
  },
];

// ─── Column config ────────────────────────────────────────────────────────────

const COLUMN_CONFIG: Record<
  Column,
  {
    label: string;
    subtitle: string;
    accent: string;
    headerBg: string;
    dropRing: string;
    countBg: string;
  }
> = {
  drafts: {
    label: "Drafts",
    subtitle: "Raw ideas · pending analysis",
    accent: "text-slate-500 dark:text-slate-400",
    headerBg: "border-b border-slate-200 dark:border-slate-800/60",
    dropRing: "ring-slate-300 dark:ring-slate-500/30 bg-slate-100/50 dark:bg-slate-500/3",
    countBg: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-500",
  },
  analyzing: {
    label: "AI Analyzing",
    subtitle: "Scoring in progress",
    accent: "text-violet-500 dark:text-violet-400",
    headerBg: "border-b border-violet-200 dark:border-violet-500/20",
    dropRing: "ring-violet-300 dark:ring-violet-500/30 bg-violet-50 dark:bg-violet-500/5",
    countBg: "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  ready: {
    label: "Ready to Promote",
    subtitle: "HITL decision required",
    accent: "text-blue-500 dark:text-blue-400",
    headerBg: "border-b border-blue-200 dark:border-blue-500/20",
    dropRing: "ring-blue-300 dark:ring-blue-500/30 bg-blue-50 dark:bg-blue-500/5",
    countBg: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

// ─── Level colors ─────────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<Level, string> = {
  Low: "text-emerald-600 dark:text-emerald-400",
  Medium: "text-amber-600 dark:text-amber-400",
  High: "text-rose-600 dark:text-rose-400",
};

// ─── Tooltip content components ───────────────────────────────────────────────

function TooltipRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-slate-500 dark:text-slate-400 text-[11px]">{label}</span>
      <span
        className={cn(
          "text-[11px] tabular-nums shrink-0",
          valueClass ?? "text-slate-700 dark:text-slate-300"
        )}
        style={{ fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  );
}

function FitTooltip({ scores }: { scores: IdeaScores }) {
  return (
    <div className="p-3.5 w-52 space-y-2">
      <p
        className="text-slate-200 text-xs mb-3 flex items-center gap-1.5"
        style={{ fontWeight: 600 }}
      >
        <Target className="w-3.5 h-3.5 text-emerald-400" />
        Strategic Fit
      </p>
      <TooltipRow label="Market Opportunity" value={`${scores.market} / 10`} valueClass="text-slate-300" />
      <TooltipRow label="Strategic Alignment" value={`${scores.strategic} / 10`} valueClass="text-slate-300" />
      <TooltipRow label="Overall Fit Score" value={`${scores.fit} / 10`} valueClass="text-emerald-400" />
      <div className="border-t border-slate-700 pt-2 mt-1">
        <TooltipRow label="Agent confidence" value={`${scores.confidence}%`} valueClass="text-violet-400" />
      </div>
    </div>
  );
}

function FeasibilityTooltip({ scores }: { scores: IdeaScores }) {
  return (
    <div className="p-3.5 w-52 space-y-2">
      <p
        className="text-slate-200 text-xs mb-3 flex items-center gap-1.5"
        style={{ fontWeight: 600 }}
      >
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        Feasibility
      </p>
      <TooltipRow label="Tech Complexity" value={scores.effort} valueClass={LEVEL_COLORS[scores.effort]} />
      <TooltipRow label="Overall Feasibility" value={scores.feasibility} valueClass={LEVEL_COLORS[scores.feasibility]} />
      {scores.timeToShip && (
        <TooltipRow label="Est. Time to Ship" value={scores.timeToShip} valueClass="text-slate-400" />
      )}
      <div className="border-t border-slate-700 pt-2 mt-1">
        <TooltipRow label="Agent confidence" value={`${scores.confidence}%`} valueClass="text-violet-400" />
      </div>
    </div>
  );
}

function RiskTooltip({ scores }: { scores: IdeaScores }) {
  return (
    <div className="p-3.5 w-52 space-y-2">
      <p
        className="text-slate-200 text-xs mb-3 flex items-center gap-1.5"
        style={{ fontWeight: 600 }}
      >
        <Shield className="w-3.5 h-3.5 text-blue-400" />
        Risk Assessment
      </p>
      <TooltipRow label="Market Risk" value="Low" valueClass="text-emerald-400" />
      <TooltipRow label="Technical Risk" value={scores.effort === "High" ? "Medium" : "Low"} valueClass={scores.effort === "High" ? "text-amber-400" : "text-emerald-400"} />
      <TooltipRow label="Execution Risk" value={scores.risk} valueClass={LEVEL_COLORS[scores.risk]} />
      <div className="border-t border-slate-700 pt-2 mt-1">
        <p className="text-slate-400 text-[10px] italic leading-relaxed">{scores.reasoning.slice(0, 72)}…</p>
      </div>
    </div>
  );
}

// ─── Score badges ─────────────────────────────────────────────────────────────

function ScoreBadge({
  emoji,
  label,
  tooltipContent,
}: {
  emoji: string;
  label: string;
  tooltipContent: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          className={cn(
            "cursor-default border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400",
            "hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-slate-800 dark:hover:text-slate-200 transition-colors duration-150",
            "text-[10px] px-1.5 py-0.5 rounded-lg select-none"
          )}
        >
          {emoji}&thinsp;{label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="bg-popover border border-border shadow-2xl shadow-black/60 p-0 rounded-xl z-[200]"
      >
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}

function AnalyzingBadge() {
  return (
    <Badge className="border-violet-500/20 bg-violet-500/10 text-violet-400 text-[10px] px-1.5 py-0.5 rounded-lg select-none cursor-default">
      <Loader2 className="w-2.5 h-2.5 animate-spin mr-1" />
      Scoring…
    </Badge>
  );
}

// ─── View config fields ────────────────────────────────────────────────────────

const IDEA_FIELDS: VCField[] = [
  { key: "description",  label: "Descripción de la idea",  description: "Texto descriptivo de 2 líneas bajo el título",          category: "esencial",    defaultOn: true  },
  { key: "scores",       label: "Badges de análisis IA",   description: "Badges de Fit, Feasibility y Risk cuando están listos",  category: "esencial",    defaultOn: true  },
  { key: "confidence",   label: "Nivel de confianza IA",   description: "Porcentaje de confianza del análisis del agente",        category: "operacional", defaultOn: false },
  { key: "time_to_ship", label: "Tiempo estimado",         description: "Estimación de tiempo de entrega (timeToShip)",           category: "operacional", defaultOn: false },
  { key: "reasoning",    label: "Razonamiento del análisis","description": "Texto explicativo del scoring generado por la IA",     category: "avanzado",    defaultOn: false },
];

// ─── Idea card ────────────────────────────────────────────────────────────────

function IdeaCardItem({
  card,
  isPromoting,
  onPromote,
  onViewDetails,
}: {
  card: IdeaCard;
  isPromoting: boolean;
  onPromote?: () => void;
  onViewDetails?: () => void;
}) {
  const vc = useVC();
  const [{ isDragging }, drag] = useDrag<
    DragItem,
    unknown,
    { isDragging: boolean }
  >({
    type: "KANBAN_CARD",
    item: { id: card.id, fromColumn: card.column },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const isAgent = card.assignee_type === "AGENT";
  const isAnalyzing = card.column === "analyzing";
  const isReady = card.column === "ready";

  return (
    <div
      ref={drag}
      className={cn(
        "transition-all duration-200",
        isDragging ? "opacity-40 scale-[0.98]" : "opacity-100 scale-100",
        isPromoting ? "opacity-0 scale-95 pointer-events-none" : ""
      )}
    >
      <Card
        className={cn(
          "relative flex flex-col gap-0 p-4 rounded-2xl cursor-grab active:cursor-grabbing",
          "bg-slate-800/50 border transition-all duration-150",
          isAnalyzing
            ? "border-violet-500/25 hover:border-violet-500/50"
            : isReady
            ? "border-blue-500/15 hover:border-blue-500/35"
            : "border-slate-700/50 hover:border-slate-600",
          isPromoting && "border-emerald-500/40 bg-emerald-500/10"
        )}
      >
        {/* Analyzing scan-line accent */}
        {isAnalyzing && (
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        )}

        {/* Ready top accent */}
        {isReady && (
          <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        )}

        {/* Header: entity type badge + date */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[10px] bg-amber-500/10 border-amber-500/20 text-amber-400">
              <Lightbulb className="w-2.5 h-2.5" />
              <span style={{ fontWeight: 600 }}>Idea</span>
              <span className="font-mono opacity-60">{card.correlativeId}</span>
            </span>
            {isAgent ? (
              <Bot className={cn("w-3 h-3", isAnalyzing ? "text-violet-400 animate-pulse" : "text-violet-500/70")} />
            ) : (
              <User className="w-3 h-3 text-slate-600" />
            )}
          </div>
          <span className="text-[10px] text-slate-700 tabular-nums">{card.created_at}</span>
        </div>

        {/* Title */}
        <h4 className="text-slate-200 text-sm mb-1.5 leading-snug" style={{ fontWeight: 600 }}>
          {card.title}
        </h4>

        {/* Description — configurable */}
        {vc.description && (
          <p
            className="text-slate-500 text-xs leading-relaxed mb-3.5"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {card.description}
          </p>
        )}

        {/* Score badges — configurable */}
        {vc.scores && (
          <div className="flex flex-wrap gap-1.5 mb-0.5">
            {card.scores ? (
              <div className="contents">
                <ScoreBadge emoji="🎯" label={`Fit: ${card.scores.fit}`} tooltipContent={<FitTooltip scores={card.scores} />} />
                <ScoreBadge emoji="⚡" label={`Feasibility: ${card.scores.feasibility}`} tooltipContent={<FeasibilityTooltip scores={card.scores} />} />
                <ScoreBadge emoji="🛡" label={`Risk: ${card.scores.risk}`} tooltipContent={<RiskTooltip scores={card.scores} />} />
              </div>
            ) : isAnalyzing ? (
              <AnalyzingBadge />
            ) : null}
          </div>
        )}

        {/* Confidence + time_to_ship — operacional fields */}
        {card.scores && (vc.confidence || vc.time_to_ship) && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {vc.confidence && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px]">
                <Sparkles className="w-2.5 h-2.5" />
                {card.scores.confidence}% confianza
              </span>
            )}
            {vc.time_to_ship && card.scores.timeToShip && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px]">
                <Clock className="w-2.5 h-2.5" />
                {card.scores.timeToShip}
              </span>
            )}
          </div>
        )}

        {/* Reasoning — avanzado */}
        {vc.reasoning && card.scores?.reasoning && (
          <p className="mt-2 text-[10px] text-slate-600 leading-relaxed italic border-t border-slate-700/40 pt-2">
            "{card.scores.reasoning}"
          </p>
        )}

        {/* Promote button — only for Ready to Promote cards */}
        {isReady && onPromote && (
          <button
            onClick={onPromote}
            className={cn(
              "mt-3.5 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl",
              "bg-blue-600 hover:bg-blue-500 active:bg-blue-700",
              "text-white text-xs transition-all duration-150",
              "border border-blue-500/50 hover:border-blue-400/60",
              "shadow-sm shadow-blue-900/30"
            )}
            style={{ fontWeight: 600 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Promote to Project
          </button>
        )}

        {/* View Details button — always visible */}
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetails?.(); }}
          className={cn(
            "mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl",
            "border border-slate-700/40 text-slate-600 hover:text-slate-300 hover:border-slate-600",
            "text-xs transition-all duration-150"
          )}
        >
          <ExternalLink className="w-3 h-3" />
          View Details
        </button>
      </Card>
    </div>
  );
}

// ─── Add idea form ────────────────────────────────────────────────────────────

function AddIdeaForm({
  onAdd,
  onCancel,
}: {
  onAdd: (title: string, description: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), description.trim());
  };

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600/60 bg-white/50 dark:bg-slate-800/30 p-4 space-y-2.5">
      <input
        ref={titleRef}
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Idea title…"
        className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none"
        style={{ fontWeight: 600 }}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
        placeholder="Brief description…"
        rows={2}
        className="w-full bg-transparent resize-none text-xs text-slate-600 dark:text-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-700 outline-none leading-relaxed"
      />
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-500 dark:text-slate-700">⌘↵ to save · Esc to cancel</span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="text-slate-500 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg transition-all",
              title.trim()
                ? "bg-slate-800 dark:bg-slate-700 text-slate-200 hover:bg-slate-700 dark:hover:bg-slate-600"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            )}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban column ────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  cards,
  promotingIds,
  onMoveCard,
  onPromote,
  onAddCard,
  onViewDetails,
}: {
  column: Column;
  cards: IdeaCard[];
  promotingIds: Set<string>;
  onMoveCard: (id: string, from: Column, to: Column) => void;
  onPromote: (id: string) => void;
  onAddCard: (title: string, description: string) => void;
  onViewDetails: (id: string) => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const config = COLUMN_CONFIG[column];

  const [{ isOver }, drop] = useDrop<DragItem, unknown, { isOver: boolean }>({
    accept: "KANBAN_CARD",
    drop: (item) => {
      if (item.fromColumn !== column) {
        onMoveCard(item.id, item.fromColumn, column);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const handleAdd = (title: string, description: string) => {
    onAddCard(title, description);
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col w-80 shrink-0 h-full">
      {/* Column header */}
      <div className={cn("shrink-0 px-1 pb-3 mb-2", config.headerBg)}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {column === "drafts" && (
              <PenLine className={cn("w-3.5 h-3.5", config.accent)} />
            )}
            {column === "analyzing" && (
              <Bot className={cn("w-3.5 h-3.5 animate-pulse", config.accent)} />
            )}
            {column === "ready" && (
              <Sparkles className={cn("w-3.5 h-3.5", config.accent)} />
            )}
            <h3
              className={cn("text-sm", config.accent)}
              style={{ fontWeight: 700 }}
            >
              {config.label}
            </h3>
          </div>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-md",
              config.countBg
            )}
          >
            {cards.length}
          </span>
        </div>
        <p className="text-[10px] text-slate-700 pl-5.5">{config.subtitle}</p>
      </div>

      {/* Drop zone */}
      <div
        ref={drop}
        className={cn(
          "flex-1 overflow-y-auto space-y-2.5 rounded-2xl p-1 transition-all duration-150",
          "scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent scrollbar-thumb-rounded-full hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-600",
          isOver && `ring-2 ${config.dropRing}`
        )}
      >
        {cards.map((card) => (
          <IdeaCardItem
            key={card.id}
            card={card}
            isPromoting={promotingIds.has(card.id)}
            onPromote={card.column === "ready" ? () => onPromote(card.id) : undefined}
            onViewDetails={() => onViewDetails(card.id)}
          />
        ))}

        {/* Add idea — drafts only */}
        {column === "drafts" && (
          <div className="pt-0.5">
            {showAddForm ? (
              <AddIdeaForm
                onAdd={handleAdd}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-700 hover:text-slate-700 dark:hover:text-slate-500 hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-150 text-xs group"
              >
                <Plus className="w-3.5 h-3.5 group-hover:text-slate-700 dark:group-hover:text-slate-500 transition-colors" />
                Add Idea
              </button>
            )}
          </div>
        )}

        {/* Drop hint when empty and hovering */}
        {cards.length === 0 && !isOver && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-800 text-xs">
            <div className="w-8 h-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center mb-3">
              <Plus className="w-4 h-4" />
            </div>
            Drop cards here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Strategy Lab ─────────────────────────────────────────────────────────────

export function StrategyLab() {
  const [cards, setCards] = useState<IdeaCard[]>(INITIAL_CARDS);
  const [promotingIds, setPromotingIds] = useState<Set<string>>(new Set());
  const [sheetEntity, setSheetEntity] = useState<UniversalEntity | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vcOpen, setVcOpen] = useState(false);

  const vc = useViewConfig("cerebrin_strategylab_view", IDEA_FIELDS);

  // ── Confirm promote dialog
  const [pendingPromoteId, setPendingPromoteId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const requestPromote = useCallback((id: string) => {
    setPendingPromoteId(id);
    setConfirmOpen(true);
  }, []);

  const executePromote = useCallback(async () => {
    if (!pendingPromoteId) return;
    const id = pendingPromoteId;
    const card = cards.find((c) => c.id === id);
    if (!card) return;

    setConfirmOpen(false);
    setPendingPromoteId(null);

    // Stage 1: trigger fade-out animation
    setPromotingIds((prev) => new Set([...prev, id]));

    try {
      // Call real API to promote idea
      const result = await promoteIdea({
        workspace_id: "ws_default",
        idea_id: card.id,
        title: card.title,
        description: card.description,
        scores: card.scores ? {
          fit: card.scores.fit,
          strategic: card.scores.strategic,
          market: card.scores.market,
          confidence: card.scores.confidence,
        } : undefined,
      });

      // Stage 2: remove from board + toast with real idea_number
      setTimeout(() => {
        setCards((prev) => prev.filter((c) => c.id !== id));
        setPromotingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast("Promovido a Proyecto 🚀", {
          description: (
            <span className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-amber-400/70">IDEA-{result.idea_number}</span>
              <span className="truncate max-w-[160px] text-muted-foreground">{card.title}</span>
            </span>
          ),
          action: {
            label: "Ver proyecto",
            onClick: () => {
              window.location.href = result.project_url;
            },
          },
          duration: 8000,
        });
      }, 550);
    } catch (error) {
      console.error("Failed to promote idea:", error);
      setPromotingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.error("Error al promover idea", {
        description: "No se pudo crear el proyecto. Intenta nuevamente.",
      });
    }
  }, [pendingPromoteId, cards]);

  const moveCard = useCallback((id: string, from: Column, to: Column) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, column: to } : c))
    );
  }, []);

  const addCard = useCallback((title: string, description: string) => {
    const newCard: IdeaCard = {
      id: `new-${Date.now()}`,
      correlativeId: `IDEA-${String(Date.now()).slice(-3)}`,
      title,
      description: description || "No description added.",
      assignee_type: "HUMAN",
      column: "drafts",
      created_at: "Feb 20",
    };
    setCards((prev) => [newCard, ...prev]);
  }, []);

  const openDetails = useCallback((id: string) => {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const columnLabel = card.column === "drafts" ? "Drafts" : card.column === "analyzing" ? "AI Analyzing" : "Ready to Promote";
    const entity: UniversalEntity = {
      id: card.id,
      correlativeId: card.correlativeId,
      title: card.title,
      description: card.description,
      entityType: "IDEA",
      assignee_type: card.assignee_type,
      status: card.column,
      breadcrumb: [
        { label: "Strategy Lab" },
        { label: "Incubadora" },
        { label: columnLabel },
      ],
      agent: card.assignee_type === "AGENT" ? "@strategy-bot" : undefined,
      metadata: card.scores ? {
        estimated_hours: 0,
        cost: 0,
        weight: Math.round(card.scores.fit * 10),
      } : undefined,
    };
    setSheetEntity(entity);
    setSheetOpen(true);
  }, [cards]);

  const cardsByColumn = {
    drafts: cards.filter((c) => c.column === "drafts"),
    analyzing: cards.filter((c) => c.column === "analyzing"),
    ready: cards.filter((c) => c.column === "ready"),
  };

  const totalIdeas = cards.length;
  const readyCount = cardsByColumn.ready.length;
  const pendingCard = pendingPromoteId ? cards.find((c) => c.id === pendingPromoteId) : null;

  return (
    <ViewConfigCtx.Provider value={vc.config}>
    <div className="contents">
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-[#0F172A]">
        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-slate-200 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <h2
              className="text-slate-900 dark:text-slate-200 text-sm"
              style={{ fontWeight: 600 }}
            >
              Strategy Lab
            </h2>
            <span className="text-[10px] text-slate-500 dark:text-slate-700">·</span>
            <span className="text-slate-500 dark:text-slate-700 text-xs italic">Incubadora</span>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
            <span className="text-xs text-slate-500 dark:text-slate-600">
              {totalIdeas} ideas in pipeline
              {readyCount > 0 && (
                <span>
                  {" "}·{" "}
                  <span className="text-blue-500 dark:text-blue-400">
                    {readyCount} awaiting promotion
                  </span>
                </span>
              )}
            </span>
          </div>

          {/* Legend + Personalizar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                <span className="text-[11px] text-slate-500 dark:text-slate-600">Human</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-violet-500/70" />
                <span className="text-[11px] text-slate-500 dark:text-slate-600">Agent</span>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />
          </div>
        </div>

        {/* ── Board ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-5 h-full p-5 min-w-max">
            {(["drafts", "analyzing", "ready"] as Column[]).map((col) => (
              <KanbanColumn
                key={col}
                column={col}
                cards={cardsByColumn[col]}
                promotingIds={promotingIds}
                onMoveCard={moveCard}
                onPromote={requestPromote}
                onAddCard={addCard}
                onViewDetails={openDetails}
              />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>

    {/* ── Confirm promote dialog */}
    <ConfirmActionDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      onConfirm={executePromote}
      title="Promote to Project?"
      description={pendingCard ? `"${pendingCard.title}" will be moved to Project Engine and removed from the Incubadora.` : ""}
      confirmLabel="Promote"
      variant="promote"
    />

    {/* ── Universal Task Sheet */}
    <UniversalTaskSheet
      entity={sheetEntity}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
    />

    {/* ── View Customizer */}
    {vcOpen && (
      <ViewCustomizerPanel
        title="Personalizar Strategy Lab"
        subtitle="Elige qué campos mostrar en cada idea"
        fields={IDEA_FIELDS}
        config={vc.config}
        onToggleField={vc.toggleField}
        onReset={vc.reset}
        onClose={() => setVcOpen(false)}
      />
    )}
    </div>
    </ViewConfigCtx.Provider>
  );
}