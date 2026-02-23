/**
 * AgentMarketplace — Sección 14 del Master Brief
 *
 * Tienda de especialistas pre-entrenados.
 * El botón "Contratar" clona el agente al pool privado del cliente.
 *
 * → REAL: GET /api/marketplace/agents
 *         POST /api/marketplace/agents/:id/hire (clona al workspace)
 */

import * as React from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  Check,
  Code2,
  Crown,
  Filter,
  FlaskConical,
  Gavel,
  Globe,
  Loader2,
  Lock,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import { usePlanFeatures } from "../../contexts/PlanContext";
import { hireMarketplaceAgent, type HireAgentResponse } from "../../services/api";
import { AgentAvatar } from "../common/AgentAvatar";
import { AgentTypePill } from "../common/AgentHierarchyBadge";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AgentSpecialty =
  | "RESEARCH"
  | "CONTENT"
  | "ENGINEERING"
  | "STRATEGY"
  | "LEGAL"
  | "FINANCE"
  | "MARKETING"
  | "SALES";

type AgentTier = "Standard" | "Pro" | "Enterprise";

interface MarketplaceAgent {
  id: string;
  name: string;
  emoji: string;
  specialty: AgentSpecialty;
  tier: AgentTier;
  description: string;
  longDesc: string;
  credits: number;
  rating: number;
  reviews: number;
  tasksCompleted: number;
  successRate: number;
  model: string;
  tags: string[];
  popular?: boolean;
  new?: boolean;
  enterpriseOnly?: boolean;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  features: string[];
  // Avatar & hierarchy fields
  type: "CAPTAIN" | "DT" | "SPECIALIST";
  avatar_url?: string;
  avatar_color?: string;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MARKETPLACE_AGENTS: MarketplaceAgent[] = [
  {
    id: "m-001",
    name: "Market Intel Pro",
    emoji: "🔭",
    specialty: "RESEARCH",
    tier: "Pro",
    description: "Deep market research & competitive intelligence",
    longDesc: "Analiza 500+ fuentes de datos simultáneamente para producir briefs de inteligencia competitiva con scoring de confianza y citación de fuentes.",
    credits: 150,
    rating: 4.9,
    reviews: 284,
    tasksCompleted: 12400,
    successRate: 97,
    model: "gpt-4o",
    tags: ["Market Research", "Competitor Analysis", "Trend Forecasting"],
    popular: true,
    accentColor: "text-blue-400",
    accentBg: "bg-blue-500/10",
    accentBorder: "border-blue-500/30",
    features: ["500+ data sources", "Confidence scoring", "PDF/Excel export", "Auto-scheduling"],
    type: "DT", // Pro tier = Director Técnico
    avatar_color: "#3B82F6",
  },
  {
    id: "m-002",
    name: "LegalEagle AI",
    emoji: "⚖️",
    specialty: "LEGAL",
    tier: "Enterprise",
    description: "Contract review & regulatory compliance engine",
    longDesc: "Revisa contratos en 40+ idiomas, identifica cláusulas de riesgo, y genera resúmenes ejecutivos con recomendaciones de negociación basadas en jurisprudencia.",
    credits: 400,
    rating: 4.8,
    reviews: 156,
    tasksCompleted: 6800,
    successRate: 99,
    model: "gpt-4o",
    tags: ["Contract Review", "GDPR", "SOC2", "Risk Assessment"],
    enterpriseOnly: true,
    accentColor: "text-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/30",
    features: ["40+ jurisdictions", "Risk scoring", "Clause extraction", "GDPR/SOC2 checks"],
    type: "CAPTAIN", // Enterprise = Captain
    avatar_color: "#F59E0B",
  },
  {
    id: "m-003",
    name: "CopyForge",
    emoji: "✍️",
    specialty: "CONTENT",
    tier: "Standard",
    description: "High-conversion B2B content & copywriting",
    longDesc: "Especializado en copy B2B SaaS: landing pages, emails de activación, decks ejecutivos y contenido SEO con voz de marca coherente.",
    credits: 80,
    rating: 4.7,
    reviews: 512,
    tasksCompleted: 28900,
    successRate: 94,
    model: "claude-3.5",
    tags: ["B2B Copy", "SEO", "Email Marketing", "Landing Pages"],
    popular: true,
    accentColor: "text-violet-400",
    accentBg: "bg-violet-500/10",
    accentBorder: "border-violet-500/30",
    features: ["Brand voice matching", "SEO optimization", "A/B variants", "Tone analysis"],
    type: "SPECIALIST", // Standard tier
    avatar_color: "#8B5CF6",
  },
  {
    id: "m-004",
    name: "DevArchitect",
    emoji: "🏗️",
    specialty: "ENGINEERING",
    tier: "Pro",
    description: "System architecture & code review specialist",
    longDesc: "Diseña arquitecturas de microservicios, revisa pull requests aplicando SOLID, genera specs técnicas y propone mejoras de rendimiento con benchmarks.",
    credits: 200,
    rating: 4.8,
    reviews: 198,
    tasksCompleted: 9200,
    successRate: 96,
    model: "gpt-4o",
    tags: ["Architecture", "Code Review", "TypeScript", "Cloud"],
    accentColor: "text-emerald-400",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/30",
    features: ["Multi-language", "CI/CD integration", "Security scanning", "Performance benchmarks"],
    type: "DT", // Pro tier
    avatar_color: "#10B981",
  },
  {
    id: "m-005",
    name: "OKR Oracle",
    emoji: "🎯",
    specialty: "STRATEGY",
    tier: "Pro",
    description: "OKR design, cascade & strategy validation",
    longDesc: "Diseña OKRs alineados a la visión de negocio, simula cascadas entre equipos, y genera scorecards con análisis de riesgo estratégico y recomendaciones.",
    credits: 175,
    rating: 4.9,
    reviews: 341,
    tasksCompleted: 15600,
    successRate: 98,
    model: "gpt-4o",
    tags: ["OKR", "Strategy", "SWOT", "Roadmap"],
    popular: true,
    accentColor: "text-indigo-400",
    accentBg: "bg-indigo-500/10",
    accentBorder: "border-indigo-500/30",
    features: ["OKR cascade simulation", "Risk scoring", "Alignment heatmap", "Quarterly reports"],
    type: "DT", // Pro tier
    avatar_color: "#6366F1",
  },
  {
    id: "m-006",
    name: "FinanceMind",
    emoji: "📊",
    specialty: "FINANCE",
    tier: "Enterprise",
    description: "Financial modeling & CFO-grade analysis",
    longDesc: "Construye modelos financieros, proyecciones de runway, análisis de cohorts SaaS y escenarios de M&A con presentaciones listas para inversores.",
    credits: 350,
    rating: 4.7,
    reviews: 89,
    tasksCompleted: 3400,
    successRate: 97,
    model: "gpt-4o",
    tags: ["Financial Modeling", "SaaS Metrics", "M&A", "Investor Deck"],
    enterpriseOnly: true,
    new: true,
    accentColor: "text-rose-400",
    accentBg: "bg-rose-500/10",
    accentBorder: "border-rose-500/30",
    features: ["SaaS metrics", "Scenario modeling", "Excel/Sheets export", "Investor templates"],
    type: "CAPTAIN", // Enterprise tier
    avatar_color: "#F43F5E",
  },
  {
    id: "m-007",
    name: "GrowthGunner",
    emoji: "🚀",
    specialty: "MARKETING",
    tier: "Standard",
    description: "Growth hacking & acquisition funnel optimizer",
    longDesc: "Diseña experimentos de growth, analiza embudos de adquisición, propone campañas de PLG y genera informes de atribución multi-canal.",
    credits: 90,
    rating: 4.6,
    reviews: 423,
    tasksCompleted: 19800,
    successRate: 93,
    model: "claude-3.5",
    tags: ["Growth Hacking", "PLG", "Attribution", "Experiments"],
    accentColor: "text-orange-400",
    accentBg: "bg-orange-500/10",
    accentBorder: "border-orange-500/30",
    features: ["A/B experiment design", "Funnel analysis", "PLG motions", "Attribution models"],
    type: "SPECIALIST", // Standard tier
    avatar_color: "#FB923C",
  },
  {
    id: "m-008",
    name: "DealCloser",
    emoji: "🤝",
    specialty: "SALES",
    tier: "Pro",
    description: "B2B sales enablement & proposal generator",
    longDesc: "Genera propuestas comerciales personalizadas, analiza ICP, produce battle cards competitivos y diseña playbooks de ventas B2B enterprise.",
    credits: 160,
    rating: 4.7,
    reviews: 267,
    tasksCompleted: 11300,
    successRate: 95,
    model: "gpt-4o",
    tags: ["Sales Enablement", "Proposals", "ICP", "Battle Cards"],
    new: true,
    accentColor: "text-cyan-400",
    accentBg: "bg-cyan-500/10",
    accentBorder: "border-cyan-500/30",
    features: ["Custom proposals", "ICP analysis", "Battle cards", "Sales playbooks"],
    type: "DT", // Pro tier
    avatar_color: "#22D3EE",
  },
];

const SPECIALTY_META: Record<AgentSpecialty, { label: string; icon: React.ElementType }> = {
  RESEARCH:    { label: "Research",    icon: FlaskConical },
  CONTENT:     { label: "Content",     icon: Megaphone   },
  ENGINEERING: { label: "Engineering", icon: Code2        },
  STRATEGY:    { label: "Strategy",    icon: TrendingUp  },
  LEGAL:       { label: "Legal",       icon: Gavel        },
  FINANCE:     { label: "Finance",     icon: BarChart3   },
  MARKETING:   { label: "Marketing",   icon: Globe        },
  SALES:       { label: "Sales",       icon: Sparkles    },
};

const TIER_META: Record<AgentTier, { label: string; color: string; bg: string; border: string }> = {
  Standard:   { label: "Standard",   color: "text-slate-300",   bg: "bg-slate-700/60",    border: "border-slate-600/50"   },
  Pro:        { label: "Pro",        color: "text-violet-300",  bg: "bg-violet-500/15",   border: "border-violet-500/30"  },
  Enterprise: { label: "Enterprise", color: "text-amber-300",   bg: "bg-amber-500/15",    border: "border-amber-500/30"   },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-2.5 h-2.5",
            i < Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

function AgentCard({
  agent,
  hired,
  isSuccess,
  onHire,
}: {
  agent: MarketplaceAgent;
  hired: boolean;
  isSuccess?: boolean;
  onHire: (a: MarketplaceAgent) => void;
}) {
  const { tier } = usePlanFeatures();
  const specMeta = SPECIALTY_META[agent.specialty];
  const SpecIcon = specMeta.icon;
  const tierMeta = TIER_META[agent.tier];
  const isLocked = agent.enterpriseOnly && tier !== "Enterprise";

  return (
    <div
      className={cn(
        "flex flex-col rounded-3xl border bg-card overflow-hidden transition-all duration-200 hover:border-slate-600 group relative",
        isLocked ? "opacity-60" : "",
        isSuccess && "ring-2 ring-emerald-400/50 animate-pulse"
      )}
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
        {agent.popular && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400" style={{ fontWeight: 700 }}>
            🔥 Popular
          </span>
        )}
        {agent.new && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" style={{ fontWeight: 700 }}>
            ✨ New
          </span>
        )}
        {isLocked && (
          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400" style={{ fontWeight: 700 }}>
            <Lock className="w-2.5 h-2.5" /> Enterprise
          </span>
        )}
      </div>

      {/* Header */}
      <div className={cn("px-5 pt-5 pb-4 border-b border-border/60", agent.accentBg)}>
        <div className="flex items-start gap-3">
          {/* Avatar con AgentAvatar component */}
          <AgentAvatar
            src={agent.avatar_url}
            fallback={agent.emoji}
            color={agent.avatar_color}
            size="md"
            shape="hexagon"
            alt={agent.name}
          />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-foreground text-sm truncate" style={{ fontWeight: 700 }}>
                {agent.name}
              </h3>
              <AgentTypePill type={agent.type} />
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border", tierMeta.bg, tierMeta.border, tierMeta.color)} style={{ fontWeight: 600 }}>
                {agent.tier === "Enterprise" && <Crown className="w-2.5 h-2.5" />}
                {agent.tier}
              </span>
              <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md", agent.accentBg, agent.accentBorder, "border", agent.accentColor)} style={{ fontWeight: 600 }}>
                <SpecIcon className="w-2.5 h-2.5" />
                {specMeta.label}
              </span>
            </div>
          </div>
        </div>

        <p className="text-muted-foreground/70 text-xs mt-3 leading-relaxed">{agent.description}</p>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { label: "Completadas",  value: (agent.tasksCompleted / 1000).toFixed(1) + "k", color: agent.accentColor },
            { label: "Éxito",        value: agent.successRate + "%",                          color: "text-emerald-400" },
            { label: "Modelo",       value: agent.model,                                       color: "text-muted-foreground/60" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-muted/30 border border-border/40 px-2.5 py-2 text-center">
              <p className={cn("tabular-nums", s.color)} style={{ fontSize: "14px", fontWeight: 700 }}>{s.value}</p>
              <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: "9px" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <StarRating rating={agent.rating} />
          <span className="text-foreground text-xs tabular-nums" style={{ fontWeight: 700 }}>{agent.rating}</span>
          <span className="text-muted-foreground/40 text-xs">({agent.reviews} reviews)</span>
        </div>

        {/* Features */}
        <div className="space-y-1">
          {agent.features.slice(0, 3).map((f) => (
            <div key={f} className="flex items-center gap-2">
              <Check className={cn("w-3 h-3 shrink-0", agent.accentColor)} />
              <span className="text-muted-foreground/60 text-xs">{f}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {agent.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted border border-border/50 text-muted-foreground/50 font-mono"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-foreground tabular-nums" style={{ fontSize: "18px", fontWeight: 800 }}>
            {agent.credits}
          </span>
          <span className="text-muted-foreground/50 text-xs">créditos</span>
        </div>

        {hired ? (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            <span className="text-xs" style={{ fontWeight: 700 }}>Contratado</span>
          </div>
        ) : isLocked ? (
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400/60 text-xs cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            <Crown className="w-3.5 h-3.5" />
            Enterprise
          </button>
        ) : (
          <button
            onClick={() => onHire(agent)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-2xl border text-xs transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg",
              agent.accentBg,
              agent.accentBorder,
              agent.accentColor
            )}
            style={{ fontWeight: 700 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Contratar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Hire Confirmation Modal ────────────────────────────────────────────────────

function HireModal({
  agent,
  creditsBalance,
  onConfirm,
  onCancel,
}: {
  agent: MarketplaceAgent;
  creditsBalance: number;
  onConfirm: (response: HireAgentResponse) => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call backend API to hire agent
      const response = await hireMarketplaceAgent({
        agent_id: agent.id,
        workspace_id: "ws_default", // TODO: Get from context
      });

      // Simulate processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));

      setLoading(false);
      onConfirm(response);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Error al contratar agente");
    }
  };

  const remainingCredits = creditsBalance - agent.credits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            {/* Avatar con AgentAvatar component */}
            <AgentAvatar
              src={agent.avatar_url}
              fallback={agent.emoji}
              color={agent.avatar_color}
              size="md"
              shape="hexagon"
              alt={agent.name}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-foreground text-base" style={{ fontWeight: 700 }}>{agent.name}</h3>
                <AgentTypePill type={agent.type} />
              </div>
              <p className="text-muted-foreground/60 text-xs">Confirmar contratación</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-muted-foreground/50 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Agent Preview */}
        <div className="rounded-2xl bg-muted/30 border border-border/50 p-4 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground/50 text-xs">Especialidad</span>
            <span className="text-foreground text-xs" style={{ fontWeight: 600 }}>{agent.specialty}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground/50 text-xs">Tier</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-lg", agent.accentBg, agent.accentColor)} style={{ fontWeight: 600 }}>
              {agent.tier}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground/50 text-xs">Modelo</span>
            <span className="text-foreground text-xs font-mono" style={{ fontWeight: 600 }}>{agent.model}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <span className="text-muted-foreground/50 text-xs">Rating</span>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-foreground text-xs" style={{ fontWeight: 600 }}>
                {agent.rating} <span className="text-muted-foreground/40">({agent.reviews})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="rounded-2xl bg-muted/20 border border-border/40 p-4 mb-4">
          <p className="text-muted-foreground/70 text-xs mb-2 uppercase tracking-wider" style={{ fontWeight: 700 }}>
            Características
          </p>
          <ul className="space-y-1.5">
            {agent.features.slice(0, 3).map((feat, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", agent.accentColor)} />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Credits Breakdown */}
        <div className="rounded-2xl bg-violet-500/8 border border-violet-500/20 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-violet-400/70 text-xs">Balance actual</span>
            <span className="text-violet-400 text-sm tabular-nums" style={{ fontWeight: 700 }}>
              {creditsBalance} créditos
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-violet-400/70 text-xs">Costo de contratación</span>
            <span className="text-violet-400 text-sm tabular-nums" style={{ fontWeight: 700 }}>
              -{agent.credits} créditos
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-violet-500/20">
            <span className="text-violet-400 text-xs" style={{ fontWeight: 700 }}>Balance restante</span>
            <span className={cn("text-sm tabular-nums", remainingCredits >= 100 ? "text-emerald-400" : "text-amber-400")} style={{ fontWeight: 700 }}>
              {remainingCredits} créditos
            </span>
          </div>
        </div>

        {/* Info Message */}
        <div className="rounded-xl bg-blue-500/8 border border-blue-500/15 px-3 py-2.5 mb-5 flex items-start gap-2">
          <Bot className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-blue-400/80 text-xs leading-relaxed">
            El agente clonado aparecerá en tu <span className="font-semibold">Agent Factory</span> y podrás personalizar permisos, prompts y configuración.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl bg-red-500/8 border border-red-500/20 px-3 py-2.5 mb-4 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400/80 text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-muted border border-border text-muted-foreground text-sm hover:bg-muted/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontWeight: 700 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Clonando…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                Confirmar ({agent.credits} ⚡)
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function AgentMarketplace() {
  const { tier, agentLimit } = usePlanFeatures();
  const [search, setSearch] = React.useState("");
  const [filterSpecialty, setFilterSpecialty] = React.useState<AgentSpecialty | "all">("all");
  const [filterTier, setFilterTier] = React.useState<AgentTier | "all">("all");
  const [hireModal, setHireModal] = React.useState<MarketplaceAgent | null>(null);
  const [hiredIds, setHiredIds] = React.useState<Set<string>>(new Set());
  const [creditsBalance, setCreditsBalance] = React.useState(840);
  const [successAnimation, setSuccessAnimation] = React.useState<string | null>(null);

  const filtered = MARKETPLACE_AGENTS.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchSpec = filterSpecialty === "all" || a.specialty === filterSpecialty;
    const matchTier = filterTier === "all" || a.tier === filterTier;
    return matchSearch && matchSpec && matchTier;
  });

  const handleHire = (agent: MarketplaceAgent) => {
    // Validar créditos suficientes
    if (creditsBalance < agent.credits) {
      toast.error("Créditos insuficientes", {
        description: `Necesitas ${agent.credits} créditos pero solo tienes ${creditsBalance}. Compra más créditos en Settings → Plan.`,
      });
      return;
    }

    // Validar capacidad de agentes (si hay límite)
    const currentAgents = hiredIds.size;
    if (agentLimit !== null && currentAgents >= agentLimit) {
      toast.error("Capacidad máxima alcanzada", {
        description: `Tu plan ${tier} permite hasta ${agentLimit} agentes. Mejora tu plan para contratar más.`,
      });
      return;
    }

    // Mostrar modal de confirmación
    setHireModal(agent);
  };

  const handleHireConfirm = (response: HireAgentResponse) => {
    // Update hired IDs
    setHiredIds((prev) => new Set([...prev, hireModal!.id]));
    
    // Update credits balance
    setCreditsBalance(response.credits_remaining);
    
    // Close modal
    const agentName = hireModal!.name;
    const agentEmoji = hireModal!.emoji;
    setHireModal(null);
    
    // Show success animation
    setSuccessAnimation(hireModal!.id);
    setTimeout(() => setSuccessAnimation(null), 2000);
    
    // Success toast with rich details
    toast.success(`${agentEmoji} ${agentName} contratado exitosamente`, {
      description: `El agente ha sido clonado a tu Agent Factory. ${response.credits_deducted} créditos deducidos. Balance: ${response.credits_remaining} créditos.`,
      duration: 5000,
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/60 bg-card/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <ShoppingCart className="w-4.5 h-4.5 text-violet-400" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h1
              className="text-foreground uppercase tracking-widest"
              style={{ fontWeight: 800, fontSize: 12, fontStyle: "italic", letterSpacing: "0.16em" }}
            >
              Agent Marketplace
            </h1>
            <p className="text-muted-foreground/50 text-xs mt-0.5">
              {MARKETPLACE_AGENTS.length} especialistas disponibles · Pool privado con contratación instantánea
            </p>
          </div>
        </div>

        {/* Credits balance */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 tabular-nums" style={{ fontWeight: 700 }}>{creditsBalance}</span>
            <span className="text-amber-400/60 text-xs">créditos</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/50 border border-border/50">
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-md",
              tier === "Enterprise" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
              tier === "Pro" ? "bg-violet-500/15 text-violet-400 border border-violet-500/30" :
              "bg-slate-700/60 text-slate-300 border border-slate-600/50"
            )} style={{ fontSize: "10px", fontWeight: 700 }}>
              {tier}
            </span>
            {agentLimit !== null && (
              <span className="text-muted-foreground/50 text-xs">{agentLimit} slots</span>
            )}
          </div>
          <button
            className="p-2 rounded-xl border border-border/50 text-muted-foreground/40 hover:text-muted-foreground hover:border-border transition-all"
            title="Actualizar catálogo"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border/40 shrink-0 bg-background overflow-x-auto">
        {/* Search */}
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar agente, etiqueta..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-500/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted-foreground/40" />
            </button>
          )}
        </div>

        {/* Specialty filter */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
          {(["all", ...Object.keys(SPECIALTY_META)] as const).map((s) => {
            const meta = s !== "all" ? SPECIALTY_META[s as AgentSpecialty] : null;
            const Icon = meta?.icon;
            return (
              <button
                key={s}
                onClick={() => setFilterSpecialty(s as AgentSpecialty | "all")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0",
                  filterSpecialty === s
                    ? "bg-violet-600 text-white"
                    : "bg-muted/40 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:border-border"
                )}
                style={{ fontWeight: filterSpecialty === s ? 700 : 400 }}
              >
                {Icon && <Icon className="w-2.5 h-2.5" />}
                {s === "all" ? "Todos" : SPECIALTY_META[s as AgentSpecialty].label}
              </button>
            );
          })}
        </div>

        {/* Tier filter */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          {(["all", "Standard", "Pro", "Enterprise"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTier(t as AgentTier | "all")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap",
                filterTier === t
                  ? "bg-violet-600 text-white"
                  : "bg-muted/40 border border-border/40 text-muted-foreground/60 hover:text-foreground hover:border-border"
              )}
              style={{ fontWeight: filterTier === t ? 700 : 400 }}
            >
              {t === "all" ? "Todos" : t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Bot className="w-12 h-12 text-muted-foreground/20" />
            <div className="text-center">
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>No se encontraron agentes</p>
              <p className="text-muted-foreground/50 text-xs mt-1">Intenta con otros filtros o términos de búsqueda</p>
            </div>
            <button onClick={() => { setSearch(""); setFilterSpecialty("all"); setFilterTier("all"); }} className="text-xs text-violet-400 hover:underline">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-muted-foreground/40 text-xs mb-4" style={{ fontWeight: 500 }}>
              {filtered.length} agente{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
              {hiredIds.size > 0 && <span className="text-emerald-400/70 ml-2">· {hiredIds.size} contratado{hiredIds.size !== 1 ? "s" : ""}</span>}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  hired={hiredIds.has(agent.id)}
                  isSuccess={successAnimation === agent.id}
                  onHire={handleHire}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Hire modal ── */}
      {hireModal && (
        <HireModal
          agent={hireModal}
          creditsBalance={creditsBalance}
          onConfirm={handleHireConfirm}
          onCancel={() => setHireModal(null)}
        />
      )}
    </div>
  );
}
