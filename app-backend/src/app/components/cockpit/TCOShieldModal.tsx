/**
 * TCOShieldModal — Cerebrin PHI-OS v2
 *
 * Aparece cuando el AI Router devuelve status: "BUDGET_EXCEEDED"
 * o cuando cualquier acción del agente supera el límite de presupuesto.
 *
 * Endpoint trigger: POST /api/ai → { status: "BUDGET_EXCEEDED", budget_remaining, limit_usd }
 * Fuente de datos: workspace_usage_stats (TCO Shield / cost_guardian_rules)
 */

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  Headphones,
  Lock,
  MessageSquare,
  Shield,
  ShieldOff,
  Sparkles,
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
import { usePlanFeatures } from "../../contexts/PlanContext";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TCOShieldModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  budgetRemaining?: number; // USD
  limitUsd?: number;        // configured limit
  agentName?: string;
  taskType?: string;
  onUpgrade?: () => void;
}

// ─── Budget gauge ──────────────────────────────────────────────────────────────

function BudgetGauge({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(((limit - used) / limit) * 100, 100);
  const usedPct = 100 - pct;

  const getColor = () => {
    if (usedPct >= 98) return { bar: "bg-red-500", glow: "shadow-red-500/40", text: "text-red-400" };
    if (usedPct >= 85) return { bar: "bg-amber-500", glow: "shadow-amber-500/30", text: "text-amber-400" };
    return { bar: "bg-emerald-500", glow: "shadow-emerald-500/30", text: "text-emerald-400" };
  };
  const c = getColor();

  const segments = Array.from({ length: 20 });

  return (
    <div className="space-y-3">
      {/* Segmented bar */}
      <div className="flex gap-0.5 h-3">
        {segments.map((_, i) => {
          const threshold = ((i + 1) / 20) * 100;
          const filled = threshold <= usedPct;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-all duration-500",
                filled
                  ? i < 14 ? "bg-indigo-500/80" : i < 17 ? "bg-amber-500/80" : "bg-red-500 animate-pulse"
                  : "bg-muted/40"
              )}
              style={{ transitionDelay: `${i * 20}ms` }}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground/50 uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700 }}>
            Presupuesto consumido
          </p>
          <p className={cn("tabular-nums", c.text)} style={{ fontSize: 22, fontWeight: 800 }}>
            ${(limit - used).toFixed(2)} <span className="text-muted-foreground/40" style={{ fontSize: 11 }}>restantes</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground/50 uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700 }}>
            Límite configurado
          </p>
          <p className="text-foreground tabular-nums" style={{ fontSize: 18, fontWeight: 700 }}>
            ${limit.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Usage stat pills */}
      <div className="flex gap-2">
        {[
          { label: "Consumido",   value: `${usedPct.toFixed(1)}%`, color: "bg-red-500/15 border-red-500/25 text-red-400" },
          { label: "Disponible",  value: `$${used.toFixed(2)}`,    color: "bg-muted/40 border-border/50 text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className={cn("flex-1 flex flex-col items-center py-2.5 rounded-xl border", color)}>
            <p className="text-[10px] text-muted-foreground/50 mb-0.5">{label}</p>
            <p className="tabular-nums" style={{ fontWeight: 700, fontSize: 13 }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function TCOShieldModal({
  open,
  onOpenChange,
  budgetRemaining = 2.40,
  limitUsd = 150,
  agentName = "agent-bot",
  taskType = "HIGH_RISK",
  onUpgrade,
}: TCOShieldModalProps) {
  const { tier, upgradeTo } = usePlanFeatures();
  const [contactSent, setContactSent] = useState(false);

  const budgetUsed = limitUsd - budgetRemaining;

  const handleUpgrade = () => {
    onOpenChange(false);
    if (onUpgrade) {
      onUpgrade();
    } else {
      toast.success("Redirigiendo a planes…", {
        description: "Actualizando tu workspace a Enterprise para límites sin tope.",
      });
      upgradeTo("Enterprise");
    }
  };

  const handleContactAdmin = () => {
    setContactSent(true);
    toast.success("Solicitud enviada", {
      description: "El Admin de tu workspace recibirá una notificación para ampliar el límite.",
      duration: 6000,
    });
    setTimeout(() => {
      setContactSent(false);
      onOpenChange(false);
    }, 2000);
  };

  const recommendations = [
    { icon: TrendingUp, label: "Aumentar límite de presupuesto",  desc: "Ajusta el budgetCapUsd en configuración del agente",  action: "Ajustar", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { icon: Shield,     label: "Activar modo conservador",        desc: "El agente pausará antes de tareas costosas",          action: "Activar", color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
    { icon: BarChart3,  label: "Revisar consumo de tokens",       desc: "Identifica qué operaciones consumen más presupuesto", action: "Ver",     color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border border-border shadow-2xl shadow-red-500/10 rounded-3xl p-0 gap-0 overflow-hidden">

        {/* ── Header */}
        <DialogHeader className="px-6 pt-6 pb-5 border-b border-border/60 relative">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />

          <div className="relative flex items-start gap-4">
            {/* Shield icon with pulse */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
                <ShieldOff className="w-5 h-5 text-red-400" />
              </div>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-card flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <DialogTitle className="text-foreground text-sm leading-tight" style={{ fontWeight: 800 }}>
                  Límite de Operación Alcanzado
                </DialogTitle>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 shrink-0" style={{ fontSize: 9, fontWeight: 700 }}>
                  <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse inline-block" />
                  TCO SHIELD
                </span>
              </div>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
                <span className="font-mono text-red-400/80 text-[11px]">{agentName}</span>
                {" "}intentó ejecutar una tarea{" "}
                <span className="font-mono text-red-400/80">{taskType}</span>
                {" "}pero el presupuesto configurado se agotó.
                El Guardián TCO bloqueó la operación para proteger tu wallet.
              </DialogDescription>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="shrink-0 p-1.5 rounded-xl text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* ── Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

          {/* Budget gauge */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-foreground/70 uppercase tracking-wider" style={{ fontWeight: 700 }}>
                Monitor de Presupuesto · cost_guardian_rules
              </span>
            </div>
            <BudgetGauge used={budgetUsed} limit={limitUsd} />
          </div>

          {/* Source info */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-300/80 leading-relaxed">
                El límite <span className="font-mono text-amber-300 bg-amber-500/15 px-1 py-0.5 rounded">${limitUsd} USD</span> está configurado en
                {" "}<span className="font-mono text-amber-300">AgentLimits.budgetCapUsd</span>.
                Fuente de datos en tiempo real: <span className="font-mono text-amber-300/70">workspace_usage_stats</span>.
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <p className="text-muted-foreground/50 uppercase tracking-widest mb-3" style={{ fontSize: 9, fontWeight: 700 }}>
              Acciones recomendadas
            </p>
            <div className="space-y-2">
              {recommendations.map(({ icon: Icon, label, desc, action, color, bg }) => (
                <div
                  key={label}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity", bg)}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", color)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs", color)} style={{ fontWeight: 600 }}>{label}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5">{desc}</p>
                  </div>
                  <span className={cn("shrink-0 px-2 py-0.5 rounded-md text-[10px] border", bg, color)} style={{ fontWeight: 700 }}>
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Plan upgrade CTA (if not Enterprise) */}
          {tier !== "Enterprise" && (
            <div className="rounded-2xl border border-violet-500/25 bg-violet-600/8 overflow-hidden">
              <div className="px-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <p className="text-foreground text-xs" style={{ fontWeight: 700 }}>Enterprise · Límites Ilimitados</p>
                </div>
                <p className="text-muted-foreground/60 text-xs leading-relaxed mb-3">
                  Con el plan Enterprise, el TCO Shield opera con <span className="text-violet-400">alertas granulares</span> sin bloqueos. Tus agentes continúan ejecutando mientras recibes notificaciones en tiempo real.
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {["Límites por equipo", "Alertas Slack/Email", "Dashboard TCO en vivo", "cost_guardian avanzado"].map((f) => (
                    <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-600/15 border border-violet-500/25 text-violet-400" style={{ fontSize: 10, fontWeight: 600 }}>
                      <Zap className="w-2.5 h-2.5" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer actions */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center gap-3">
          <button
            onClick={handleContactAdmin}
            disabled={contactSent}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs transition-all duration-200",
              contactSent
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 cursor-default"
                : "bg-muted border-border text-muted-foreground hover:border-blue-500/40 hover:text-blue-400"
            )}
            style={{ fontWeight: 600 }}
          >
            {contactSent ? (
              <>
                <MessageSquare className="w-3.5 h-3.5" />
                Solicitud enviada
              </>
            ) : (
              <>
                <Headphones className="w-3.5 h-3.5" />
                Contactar Admin
              </>
            )}
          </button>

          {tier !== "Enterprise" ? (
            <button
              onClick={handleUpgrade}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-xs border border-violet-500/40 transition-all duration-200 shadow-lg shadow-violet-500/20"
              style={{ fontWeight: 700 }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade a Enterprise
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                onOpenChange(false);
                toast.info("Abriendo configuración de límites…");
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs border border-indigo-500/40 transition-all"
              style={{ fontWeight: 700 }}
            >
              <Lock className="w-3.5 h-3.5" />
              Ajustar límites del agente
            </button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
