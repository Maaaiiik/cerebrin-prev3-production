/**
 * PlanContext — Cerebrin SaaS Plan Gating
 *
 * Reads workspace_subscriptions and exposes feature gates via usePlanFeatures().
 *
 * → REAL: Replace MOCK_SUBSCRIPTION with a Supabase query:
 *   const { data } = await supabase
 *     .from('workspace_subscriptions')
 *     .select('*')
 *     .eq('workspace_id', workspaceId)
 *     .single();
 *
 * Limits:
 *   - Growth/Pro: 10 agents
 *   - Enterprise: unlimited (null)
 */

import * as React from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PlanTier = "Starter" | "Pro" | "Enterprise";

export interface WorkspaceSubscription {
  workspace_id: string;
  tier: PlanTier;
  agent_limit: number | null;      // null = unlimited
  project_limit: number | null;    // null = unlimited
  autonomous_mode: boolean;
  agent_swarm: boolean;
  executor_level: boolean;         // Nivel 3 unlocked
  byo_api: boolean;                // Bring-Your-Own-API keys (Vault)
  white_label: boolean;
  mcp_host: boolean;               // MCP Protocol
  billing_provider: "global66" | "stripe" | null;
}

export interface PlanFeatures {
  tier: PlanTier;
  agentLimit: number | null;
  projectLimit: number | null;
  canUseAutonomousMode: boolean;
  canUseAgentSwarm: boolean;
  canUseExecutorLevel: boolean;
  canUseByoApi: boolean;
  canUseWhiteLabel: boolean;
  canUseMcpHost: boolean;
  isLoading: boolean;
}

interface PlanContextValue extends PlanFeatures {
  subscription: WorkspaceSubscription;
  upgradeTo: (tier: PlanTier) => void;
  requireFeature: (feature: keyof PlanFeatures, requiredTier?: PlanTier) => boolean;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const PlanContext = React.createContext<PlanContextValue | null>(null);

// ─── Mock subscription ────────────────────────────────────────────────────────
// → REAL: Replace with supabase query on workspace_subscriptions table

const MOCK_SUBSCRIPTION: WorkspaceSubscription = {
  workspace_id: "ws_demo_01",
  tier: "Pro",
  agent_limit: 10,
  project_limit: null,
  autonomous_mode: true,
  agent_swarm: false,
  executor_level: false,
  byo_api: false,
  white_label: false,
  mcp_host: false,
  billing_provider: "global66",
};

const PLAN_CONFIGS: Record<PlanTier, WorkspaceSubscription> = {
  Starter: {
    workspace_id: "ws_demo_01",
    tier: "Starter",
    agent_limit: 3,
    project_limit: 5,
    autonomous_mode: false,
    agent_swarm: false,
    executor_level: false,
    byo_api: false,
    white_label: false,
    mcp_host: false,
    billing_provider: "global66",
  },
  Pro: {
    workspace_id: "ws_demo_01",
    tier: "Pro",
    agent_limit: 10,
    project_limit: null,
    autonomous_mode: true,
    agent_swarm: false,
    executor_level: false,
    byo_api: false,
    white_label: false,
    mcp_host: false,
    billing_provider: "global66",
  },
  Enterprise: {
    workspace_id: "ws_demo_01",
    tier: "Enterprise",
    agent_limit: null,
    project_limit: null,
    autonomous_mode: true,
    agent_swarm: true,
    executor_level: true,
    byo_api: true,
    white_label: true,
    mcp_host: true,
    billing_provider: "global66",
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = React.useState<WorkspaceSubscription>(() => {
    // → REAL: fetch from supabase/workspace_subscriptions
    try {
      const stored = localStorage.getItem("cerebrin_plan_tier") as PlanTier | null;
      if (stored && PLAN_CONFIGS[stored]) return PLAN_CONFIGS[stored];
    } catch { /* ignore */ }
    return MOCK_SUBSCRIPTION;
  });
  const [isLoading, setIsLoading] = React.useState(false);

  const upgradeTo = React.useCallback((tier: PlanTier) => {
    setIsLoading(true);
    // → REAL: POST /api/billing/checkout → redirect to Global66
    // → On webhook return (/api/webhooks/global66), call PATCH to update subscription
    setTimeout(() => {
      const newSub = PLAN_CONFIGS[tier];
      setSubscription(newSub);
      localStorage.setItem("cerebrin_plan_tier", tier);
      setIsLoading(false);
      toast.success(`Plan actualizado a ${tier}`, {
        description: tier === "Enterprise"
          ? "Modo Autónomo, Agent Swarm y Vault habilitados"
          : `${newSub.agent_limit ?? "∞"} slots de agentes disponibles`,
      });
    }, 1200);
  }, []);

  const requireFeature = React.useCallback(
    (feature: keyof PlanFeatures, requiredTier: PlanTier = "Enterprise"): boolean => {
      const tierOrder: Record<PlanTier, number> = { Starter: 0, Pro: 1, Enterprise: 2 };
      const currentOrder = tierOrder[subscription.tier];
      const requiredOrder = tierOrder[requiredTier];
      if (currentOrder < requiredOrder) {
        toast.error(`Requiere plan ${requiredTier}`, {
          description: "Actualiza tu suscripción para desbloquear esta función.",
          action: { label: "Ver Planes", onClick: () => {} },
        });
        return false;
      }
      return true;
    },
    [subscription.tier]
  );

  const value: PlanContextValue = {
    tier: subscription.tier,
    agentLimit: subscription.agent_limit,
    projectLimit: subscription.project_limit,
    canUseAutonomousMode: subscription.autonomous_mode,
    canUseAgentSwarm: subscription.agent_swarm,
    canUseExecutorLevel: subscription.executor_level,
    canUseByoApi: subscription.byo_api,
    canUseWhiteLabel: subscription.white_label,
    canUseMcpHost: subscription.mcp_host,
    isLoading,
    subscription,
    upgradeTo,
    requireFeature,
  };

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlanFeatures(): PlanContextValue {
  const ctx = React.useContext(PlanContext);
  if (!ctx) throw new Error("usePlanFeatures must be used within <PlanProvider>");
  return ctx;
}
