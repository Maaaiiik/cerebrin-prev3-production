/**
 * PlanAddonPanel — Cerebrin SaaS Capacity & Add-on Modules
 * Shows current plan slots usage and individually-toggleable add-on modules
 */

import { useState } from "react";
import {
  Bot,
  Brain,
  Check,
  ChevronRight,
  Crown,
  ExternalLink,
  GitBranch,
  Infinity,
  Layers,
  Palette,
  Plus,
  Rocket,
  Shield,
  Sparkles,
  Zap,
  Globe,
  Loader2,
} from "lucide-react";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import { createBillingCheckout } from "../../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanId = "starter" | "pro" | "enterprise";

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  agentSlots: number | "unlimited";
  icon: React.ElementType;
  badge?: string;
  badgeClass?: string;
  features: string[];
  color: string;
  borderColor: string;
  bgColor: string;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  price: string;
  enabled: boolean;
  badge?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    period: "/mo",
    agentSlots: 2,
    icon: Rocket,
    features: ["2 Agent Slots", "HITL Approval Queue", "Basic Integrations", "5 Projects", "1 Workspace"],
    color: "#64748b",
    borderColor: "border-slate-700/50",
    bgColor: "bg-slate-800/30",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$199",
    period: "/mo",
    agentSlots: 10,
    icon: Zap,
    badge: "Current Plan",
    badgeClass: "bg-violet-500/20 border-violet-500/30 text-violet-300",
    features: ["10 Agent Slots", "Full HITL + Visual Diff", "All Integrations", "Unlimited Projects", "5 Workspaces", "n8n Automation Bridge"],
    color: "#8B5CF6",
    borderColor: "border-violet-500/40",
    bgColor: "bg-violet-500/8",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    agentSlots: "unlimited",
    icon: Crown,
    badge: "Contact Sales",
    badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    features: ["Unlimited Agent Slots", "White-labeling", "SSO & Audit Logs", "SLA 99.99%", "Dedicated Success Manager", "Custom AI Models"],
    color: "#F59E0B",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
  },
];

const INITIAL_ADDONS: AddOn[] = [
  {
    id: "ai-council",
    name: "AI Council Module",
    description: "Compare responses from multiple AI models side-by-side. Run the same task through GPT-4o, Claude, and Gemini simultaneously and pick the best output.",
    icon: Brain,
    color: "#8B5CF6",
    price: "+$29/mo",
    enabled: true,
    badge: "Popular",
  },
  {
    id: "automation-bridge",
    name: "Automation Bridge",
    description: "Native n8n integration. Trigger Cerebrin agents from n8n workflows and emit events back to your automation pipelines. Webhook-first architecture.",
    icon: GitBranch,
    color: "#EA4B00",
    price: "+$19/mo",
    enabled: true,
    badge: "n8n",
  },
  {
    id: "process-engine-pro",
    name: "Process Engine Pro",
    description: "Unlock massive template libraries, bulk project generation, and cross-project workflow templates. Ideal for agencies and consultancies at scale.",
    icon: Layers,
    color: "#10B981",
    price: "+$39/mo",
    enabled: false,
  },
  {
    id: "white-label",
    name: "White-labeling",
    description: "Replace Cerebrin branding with your own logo, colors, and domain. Ideal for resellers and agencies delivering branded AI governance platforms.",
    icon: Palette,
    color: "#3B82F6",
    price: "+$99/mo",
    enabled: false,
    badge: "Enterprise",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SlotBar({
  used,
  total,
  color,
}: {
  used: number;
  total: number | "unlimited";
  color: string;
}) {
  if (total === "unlimited") {
    return (
      <div className="flex items-center gap-2">
        <Infinity className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-xs" style={{ color, fontWeight: 600 }}>Unlimited Slots</span>
      </div>
    );
  }
  const pct = Math.min((used / total) * 100, 100);
  const isCritical = pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Agent Slots
        </span>
        <span
          className="font-mono text-xs"
          style={{ color: isCritical ? "#F59E0B" : color, fontWeight: 700 }}
        >
          {used}/{total} usados
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted/60 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: isCritical ? "#F59E0B" : color,
            boxShadow: `0 0 8px ${isCritical ? "#F59E0B" : color}60`,
          }}
        />
      </div>
      {isCritical && (
        <p className="text-amber-400/80 text-[10px]">⚠ Acercándote al límite — considera hacer upgrade</p>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  current,
  onSelect,
}: {
  plan: Plan;
  current: boolean;
  onSelect: () => void;
}) {
  const Icon = plan.icon;
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex flex-col gap-4 sm:gap-5 md:gap-6 p-4 sm:p-5 md:p-7 rounded-xl md:rounded-2xl border text-left transition-all duration-200",
        current
          ? cn(plan.bgColor, plan.borderColor, "ring-1")
          : "bg-muted/15 border-border/50 hover:border-border hover:bg-muted/30",
        current && "ring-" + plan.color
      )}
      style={current ? { ringColor: plan.color } : {}}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: `${plan.color}18`,
              borderColor: `${plan.color}35`,
            }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color: plan.color, width: 18, height: 18 }} />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 700 }}>{plan.name}</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-foreground" style={{ fontSize: 20, fontWeight: 800 }}>{plan.price}</span>
              <span className="text-muted-foreground text-xs">{plan.period}</span>
            </div>
          </div>
        </div>
        {plan.badge && (
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full border shrink-0", plan.badgeClass)} style={{ fontWeight: 700 }}>
            {plan.badge}
          </span>
        )}
      </div>

      {/* Slot bar (shown only for current) */}
      {current && (
        <SlotBar used={3} total={plan.agentSlots} color={plan.color} />
      )}

      {/* Features */}
      <ul className="space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="w-3 h-3 shrink-0" style={{ color: plan.color }} />
            <span className="text-xs text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {!current && (
        <div
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs transition-all"
          style={{ backgroundColor: `${plan.color}15`, color: plan.color, fontWeight: 600 }}
        >
          {plan.id === "enterprise" ? "Contactar Ventas" : "Upgrade"}
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      )}
      {current && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: plan.color }} />
          <span className="text-xs text-muted-foreground" style={{ fontWeight: 600 }}>Plan activo</span>
        </div>
      )}
    </button>
  );
}

function AddOnCard({
  addon,
  onToggle,
}: {
  addon: AddOn;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const Icon = addon.icon;
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start gap-4 sm:gap-5 md:gap-6 p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl border transition-all duration-200",
        addon.enabled
          ? "bg-muted/30 border-border/70"
          : "bg-muted/10 border-border/40 opacity-70"
      )}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
        style={{
          backgroundColor: `${addon.color}18`,
          borderColor: `${addon.color}35`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color: addon.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-foreground text-sm" style={{ fontWeight: 700 }}>{addon.name}</p>
          {addon.badge && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-md border"
              style={{
                backgroundColor: `${addon.color}15`,
                borderColor: `${addon.color}35`,
                color: addon.color,
                fontWeight: 800,
              }}
            >
              {addon.badge}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground/60 font-mono">{addon.price}</span>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">{addon.description}</p>
      </div>

      {/* Toggle */}
      <Switch
        checked={addon.enabled}
        onCheckedChange={(v) => onToggle(addon.id, v)}
        className="data-[state=checked]:bg-violet-600 data-[state=unchecked]:bg-switch-background shrink-0 mt-0.5"
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PlanAddonPanel() {
  const [currentPlan, setCurrentPlan] = useState<PlanId>("pro");
  const [addons, setAddons] = useState<AddOn[]>(INITIAL_ADDONS);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);

  const handlePlanSelect = async (planId: PlanId) => {
    if (planId === currentPlan) return;
    if (planId === "enterprise") {
      toast.info("Contactando al equipo de ventas…", {
        description: "Un Account Executive se pondrá en contacto contigo en las próximas 24h.",
        icon: <ExternalLink className="w-3.5 h-3.5" />,
      });
      return;
    }

    setCheckoutLoading(planId);
    try {
      // → REAL: POST /api/billing/checkout → redirects to Global66
      const plan = PLANS.find(p => p.id === planId)!;
      const checkout = await createBillingCheckout({
        workspace_id: "ws_demo_01",
        plan_tier: plan.name,
        return_url: window.location.origin + "/settings/plan",
      });

      // Mock: show success toast instead of redirecting
      toast.success(`Redirigiendo a Global66…`, {
        description: `Plan ${plan.name} · Sesión: ${checkout.session_id}`,
        action: {
          label: "Simular Pago",
          onClick: () => {
            setCurrentPlan(planId);
            toast.success(`Plan ${plan.name} activado`, {
              description: "Webhook /api/webhooks/global66 recibido. Suscripción actualizada.",
            });
          },
        },
        duration: 10000,
      });
    } catch {
      toast.error("Error iniciando el checkout", { description: "Verifica la conexión con /api/billing/checkout" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleAddonToggle = (id: string, enabled: boolean) => {
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
    const addon = addons.find((a) => a.id === id);
    if (addon) {
      if (enabled) {
        toast.success(`${addon.name} activado`, { description: `Se añadirá ${addon.price} a tu factura.` });
      } else {
        toast(`${addon.name} desactivado`, { description: "Se eliminará al final del período de facturación." });
      }
    }
  };

  const activePlan = PLANS.find((p) => p.id === currentPlan)!;
  const activeAddons = addons.filter((a) => a.enabled).length;
  const monthlyAddons = addons
    .filter((a) => a.enabled)
    .reduce((sum, a) => sum + parseInt(a.price.replace(/\D/g, "") || "0"), 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8 lg:space-y-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2 md:space-y-3">
        <h2 className="text-foreground text-lg md:text-xl" style={{ fontWeight: 700 }}>Plan & Capacidad</h2>
        <p className="text-muted-foreground text-sm">
          Gestiona tu plan SaaS, slots de agentes y módulos adicionales a la carta.
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 rounded-xl md:rounded-2xl border border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          <span className="text-foreground text-sm" style={{ fontWeight: 600 }}>Plan {activePlan.name}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-muted-foreground text-sm">
            <span className="text-foreground" style={{ fontWeight: 700 }}>3</span>
            {" / "}
            {activePlan.agentSlots === "unlimited" ? "∞" : activePlan.agentSlots} slots usados
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-muted-foreground text-sm">
            <span className="text-foreground" style={{ fontWeight: 700 }}>{activeAddons}</span> add-ons activos
          </span>
        </div>
        <div className="ml-auto">
          <span className="font-mono text-xs text-muted-foreground/60">
            +${monthlyAddons}/mo en add-ons
          </span>
        </div>
      </div>

      {/* Plans */}
      <section className="rounded-xl md:rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Planes de Capacidad</p>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>Gestiona tus slots de agentes y cobertura del workspace</p>
          </div>
        </div>
        <div className="p-4 sm:p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              current={plan.id === currentPlan}
              onSelect={() => handlePlanSelect(plan.id)}
            />
          ))}
        </div>

        {/* Global66 billing notice */}
        <div className="mx-4 sm:mx-6 md:mx-8 mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-5 md:px-6 py-4 sm:py-5 rounded-xl md:rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>Procesado por Global66</p>
            <p className="text-emerald-400/60 text-xs mt-0.5">
              Pagos en CLP, USD y más · Webhook: /api/webhooks/global66 · Checkout: /api/billing/checkout
            </p>
          </div>
          {checkoutLoading && <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />}
        </div>
      </section>

      {/* Agent slots detail */}
      <section className="rounded-xl md:rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Uso de Slots</p>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>Instancias de agentes activos en tu workspace</p>
          </div>
          <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 transition-all" style={{ fontSize: 11, fontWeight: 600 }}>
            <Plus className="w-3 h-3" />
            Nueva Instancia
          </button>
        </div>
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 space-y-4 md:space-y-5">
          {[
            { name: "Writer-Bot · Instancia A", type: "CONTENT",     model: "GPT-4o",      status: "active",   slot: 1, color: "#8B5CF6" },
            { name: "Analyst-Bot · Instancia A", type: "DATA",        model: "GPT-4o",      status: "active",   slot: 2, color: "#3B82F6" },
            { name: "Dev-Bot · Instancia A",     type: "ENGINEERING", model: "Claude 3.5",  status: "active",   slot: 3, color: "#F59E0B" },
          ].map((inst) => (
            <div key={inst.name} className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 md:px-5 py-3 sm:py-4 rounded-lg md:rounded-xl border border-border/50 bg-muted/20">
              <div
                className="w-7 h-7 flex items-center justify-center shrink-0"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  backgroundColor: `${inst.color}20`,
                  border: `1px solid ${inst.color}40`,
                }}
              >
                <Bot className="w-3 h-3" style={{ color: inst.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm truncate" style={{ fontWeight: 600 }}>{inst.name}</p>
                <p className="text-muted-foreground/60 font-mono" style={{ fontSize: 10 }}>
                  {inst.type} · {inst.model}
                </p>
              </div>
              <span className="font-mono text-muted-foreground/40 text-xs">Slot #{inst.slot}</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" style={{ fontSize: 10, fontWeight: 600 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3">
            <span className="text-muted-foreground/50 text-xs">
              {activePlan.agentSlots === "unlimited" ? "∞" : `${10 - 3} slots disponibles`} · Plan {activePlan.name}
            </span>
            <span className="text-muted-foreground/40 text-xs font-mono">3/{activePlan.agentSlots === "unlimited" ? "∞" : activePlan.agentSlots}</span>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="rounded-xl md:rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Módulos Add-on</p>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>Activa capacidades adicionales a la carta según tu operación</p>
          </div>
        </div>
        <div className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-5">
          {addons.map((addon) => (
            <AddOnCard key={addon.id} addon={addon} onToggle={handleAddonToggle} />
          ))}
        </div>
      </section>
    </div>
  );
}