import * as React from "react";

/**
 * Feature Flags System — Tipo Elementor
 * 
 * Sistema granular que permite activar/desactivar features por:
 * - Workspace/Cliente
 * - Página completa
 * - Sección dentro de página
 * - Widget/Tarjeta individual
 * - Botones y acciones específicas
 * 
 * Permite personalización progresiva por cliente sin modificar código.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type FeatureScope = "page" | "section" | "widget" | "button" | "action";

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  scope: FeatureScope;
  parentId?: string; // Para features anidadas (ej: botón dentro de widget)
  enabled: boolean;
  category: "cockpit" | "projects" | "agents" | "analytics" | "settings" | "premium" | "beta";
  tier?: "free" | "starter" | "pro" | "enterprise"; // Tier mínimo requerido
  icon?: string;
  color?: string;
}

export interface FeatureFlagConfig {
  workspaceId: string;
  flags: Record<string, boolean>; // flagId -> enabled
  lastUpdated: string;
}

// ─── Default Feature Flags ─────────────────────────────────────────────────────

const DEFAULT_FLAGS: FeatureFlag[] = [
  // ── PAGES ──────────────────────────────────────────────────────────────────
  {
    id: "page.cockpit",
    name: "Cockpit Dashboard",
    description: "Vista principal Mission Control",
    scope: "page",
    enabled: true,
    category: "cockpit",
    tier: "free",
  },
  {
    id: "page.projects",
    name: "Project Engine",
    description: "Gestión de proyectos y tareas",
    scope: "page",
    enabled: true,
    category: "projects",
    tier: "free",
  },
  {
    id: "page.tasks",
    name: "My Tasks",
    description: "Vista personal de tareas",
    scope: "page",
    enabled: true,
    category: "projects",
    tier: "free",
  },
  {
    id: "page.documents",
    name: "Document Manager",
    description: "Gestión de documentos",
    scope: "page",
    enabled: true,
    category: "projects",
    tier: "starter",
  },
  {
    id: "page.studio",
    name: "Template Studio",
    description: "Editor de templates",
    scope: "page",
    enabled: true,
    category: "premium",
    tier: "pro",
  },
  {
    id: "page.incubadora",
    name: "Strategy Lab",
    description: "Laboratorio estratégico",
    scope: "page",
    enabled: true,
    category: "beta",
    tier: "enterprise",
  },
  {
    id: "page.marketplace",
    name: "Agent Marketplace",
    description: "Tienda de agentes especializados",
    scope: "page",
    enabled: true,
    category: "agents",
    tier: "starter",
  },
  {
    id: "page.analytics",
    name: "Analytics Dashboard",
    description: "Analíticas y métricas",
    scope: "page",
    enabled: true,
    category: "analytics",
    tier: "pro",
  },

  // ── COCKPIT SECTIONS ───────────────────────────────────────────────────────
  {
    id: "cockpit.quick_create",
    name: "Quick Create Bar",
    description: "Barra de creación rápida en header",
    scope: "section",
    parentId: "page.cockpit",
    enabled: true,
    category: "cockpit",
    tier: "free",
  },
  {
    id: "cockpit.customizer",
    name: "Vista Personalizable",
    description: "Botón de personalización de widgets",
    scope: "section",
    parentId: "page.cockpit",
    enabled: true,
    category: "cockpit",
    tier: "free",
  },

  // ── COCKPIT WIDGETS ────────────────────────────────────────────────────────
  {
    id: "widget.agents",
    name: "Estado de Agentes",
    description: "Widget de agentes activos",
    scope: "widget",
    parentId: "page.cockpit",
    enabled: true,
    category: "cockpit",
    tier: "free",
  },
  {
    id: "widget.approvals",
    name: "Cola de Aprobaciones",
    description: "Widget de aprobaciones HITL",
    scope: "widget",
    parentId: "page.cockpit",
    enabled: true,
    category: "cockpit",
    tier: "free",
  },
  {
    id: "widget.projects",
    name: "Proyectos Críticos",
    description: "Widget de proyectos en riesgo",
    scope: "widget",
    parentId: "page.cockpit",
    enabled: true,
    category: "cockpit",
    tier: "free",
  },
  {
    id: "widget.swarm_hud",
    name: "Swarm Pulse HUD",
    description: "Visualización radial de swarm",
    scope: "widget",
    parentId: "page.cockpit",
    enabled: false,
    category: "cockpit",
    tier: "pro",
  },
  {
    id: "widget.race_hud",
    name: "Strategic Race HUD",
    description: "Competencia estratégica",
    scope: "widget",
    parentId: "page.cockpit",
    enabled: false,
    category: "cockpit",
    tier: "enterprise",
  },

  // ── QUICK CREATE BUTTONS ───────────────────────────────────────────────────
  {
    id: "action.create_idea",
    name: "Nueva Idea",
    description: "Botón crear idea",
    scope: "button",
    parentId: "cockpit.quick_create",
    enabled: true,
    category: "cockpit",
    tier: "free",
  },
  {
    id: "action.create_task",
    name: "Nueva Tarea",
    description: "Botón crear tarea",
    scope: "button",
    parentId: "cockpit.quick_create",
    enabled: true,
    category: "cockpit",
    tier: "free",
  },
  {
    id: "action.create_project",
    name: "Nuevo Proyecto",
    description: "Botón crear proyecto",
    scope: "button",
    parentId: "cockpit.quick_create",
    enabled: true,
    category: "cockpit",
    tier: "starter",
  },
  {
    id: "action.create_document",
    name: "Nuevo Documento",
    description: "Botón crear documento",
    scope: "button",
    parentId: "cockpit.quick_create",
    enabled: true,
    category: "cockpit",
    tier: "starter",
  },
  {
    id: "action.create_ai_task",
    name: "Tarea IA",
    description: "Botón crear tarea IA",
    scope: "button",
    parentId: "cockpit.quick_create",
    enabled: true,
    category: "cockpit",
    tier: "pro",
  },

  // ── AGENT MARKETPLACE ──────────────────────────────────────────────────────
  {
    id: "marketplace.hire_agents",
    name: "Contratar Agentes",
    description: "Permite contratar agentes del marketplace",
    scope: "action",
    parentId: "page.marketplace",
    enabled: true,
    category: "agents",
    tier: "starter",
  },
  {
    id: "marketplace.clone_agents",
    name: "Clonar Agentes",
    description: "Permite clonar agentes propios",
    scope: "action",
    parentId: "page.marketplace",
    enabled: true,
    category: "agents",
    tier: "pro",
  },

  // ── SETTINGS & PREMIUM ─────────────────────────────────────────────────────
  {
    id: "settings.team_management",
    name: "Gestión de Equipos",
    description: "Panel de equipos y permisos",
    scope: "section",
    parentId: "page.settings",
    enabled: true,
    category: "settings",
    tier: "starter",
  },
  {
    id: "settings.integrations",
    name: "Integraciones",
    description: "Conectar servicios externos",
    scope: "section",
    parentId: "page.settings",
    enabled: true,
    category: "settings",
    tier: "pro",
  },
  {
    id: "settings.sso",
    name: "Single Sign-On",
    description: "Autenticación SSO empresarial",
    scope: "section",
    parentId: "page.settings",
    enabled: false,
    category: "settings",
    tier: "enterprise",
  },

  // ── ANALYTICS ──────────────────────────────────────────────────────────────
  {
    id: "analytics.token_usage",
    name: "Token Usage",
    description: "Gráfico de uso de tokens",
    scope: "widget",
    parentId: "page.analytics",
    enabled: true,
    category: "analytics",
    tier: "pro",
  },
  {
    id: "analytics.cost_tracking",
    name: "Cost Tracking",
    description: "Seguimiento de costos",
    scope: "widget",
    parentId: "page.analytics",
    enabled: true,
    category: "analytics",
    tier: "pro",
  },
  {
    id: "analytics.custom_reports",
    name: "Reportes Personalizados",
    description: "Crear reportes custom",
    scope: "action",
    parentId: "page.analytics",
    enabled: false,
    category: "analytics",
    tier: "enterprise",
  },
];

// ─── Context ───────────────────────────────────────────────────────────────────

interface FeatureFlagsContextValue {
  flags: FeatureFlag[];
  config: FeatureFlagConfig;
  isEnabled: (flagId: string) => boolean;
  toggleFlag: (flagId: string) => void;
  setFlag: (flagId: string, enabled: boolean) => void;
  getFlagsByScope: (scope: FeatureScope) => FeatureFlag[];
  getFlagsByCategory: (category: string) => FeatureFlag[];
  getChildFlags: (parentId: string) => FeatureFlag[];
  resetToDefaults: () => void;
}

const FeatureFlagsContext = React.createContext<FeatureFlagsContextValue | undefined>(undefined);

const STORAGE_KEY = "cerebrin_feature_flags_v1";

// ─── Provider ──────────────────────────────────────────────────────────────────

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = React.useState<FeatureFlagConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FeatureFlagConfig;
        return parsed;
      }
    } catch (err) {
      console.warn("Failed to load feature flags from localStorage:", err);
    }

    // Default config
    const defaultConfig: FeatureFlagConfig = {
      workspaceId: "default",
      flags: {},
      lastUpdated: new Date().toISOString(),
    };

    DEFAULT_FLAGS.forEach(flag => {
      defaultConfig.flags[flag.id] = flag.enabled;
    });

    return defaultConfig;
  });

  // Persist to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn("Failed to save feature flags to localStorage:", err);
    }
  }, [config]);

  const isEnabled = React.useCallback((flagId: string): boolean => {
    return config.flags[flagId] ?? false;
  }, [config.flags]);

  const toggleFlag = React.useCallback((flagId: string) => {
    setConfig(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        [flagId]: !prev.flags[flagId],
      },
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const setFlag = React.useCallback((flagId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        [flagId]: enabled,
      },
      lastUpdated: new Date().toISOString(),
    }));
  }, []);

  const getFlagsByScope = React.useCallback((scope: FeatureScope): FeatureFlag[] => {
    return DEFAULT_FLAGS.filter(f => f.scope === scope);
  }, []);

  const getFlagsByCategory = React.useCallback((category: string): FeatureFlag[] => {
    return DEFAULT_FLAGS.filter(f => f.category === category);
  }, []);

  const getChildFlags = React.useCallback((parentId: string): FeatureFlag[] => {
    return DEFAULT_FLAGS.filter(f => f.parentId === parentId);
  }, []);

  const resetToDefaults = React.useCallback(() => {
    const defaultConfig: FeatureFlagConfig = {
      workspaceId: config.workspaceId,
      flags: {},
      lastUpdated: new Date().toISOString(),
    };

    DEFAULT_FLAGS.forEach(flag => {
      defaultConfig.flags[flag.id] = flag.enabled;
    });

    setConfig(defaultConfig);
  }, [config.workspaceId]);

  const value: FeatureFlagsContextValue = {
    flags: DEFAULT_FLAGS,
    config,
    isEnabled,
    toggleFlag,
    setFlag,
    getFlagsByScope,
    getFlagsByCategory,
    getChildFlags,
    resetToDefaults,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useFeatureFlags() {
  const ctx = React.useContext(FeatureFlagsContext);
  if (!ctx) {
    throw new Error("useFeatureFlags must be used within FeatureFlagsProvider");
  }
  return ctx;
}

// ─── Convenience Hook ──────────────────────────────────────────────────────────

export function useFeature(flagId: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flagId);
}
