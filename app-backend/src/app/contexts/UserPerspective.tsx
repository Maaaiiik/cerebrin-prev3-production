/**
 * UserPerspective Context — Cerebrin Dual-Mode Experience
 *
 * Gestiona perfiles de usuario (Director / Focus / Custom) para personalizar
 * la UI según el rol y preferencias del usuario.
 *
 * → REAL: Sync con backend via /api/users/me/perspective
 * → Combina con PlanContext (tier restrictions override profile)
 *
 * Perfiles Predefinidos:
 *   - DIRECTOR: Vista completa con analytics, admin, widgets avanzados
 *   - FOCUS: Vista simplificada solo tareas + Shadow Chat
 *   - CUSTOM: Usuario personaliza todo
 */

import * as React from "react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PerspectiveMode = "director" | "focus" | "custom";
export type UserRole = "owner" | "pm" | "executor" | "viewer";

export interface PerspectiveProfile {
  id: string;
  name: string;
  mode: PerspectiveMode;
  role: UserRole;

  // Visibility Rules - Sidebar sections
  sections: {
    cockpit: boolean;
    tasks: boolean;
    projects: boolean;
    incubadora: boolean;
    studio: boolean;
    documents: boolean;
    admin: boolean;
    settings: boolean;
    marketplace: boolean;
    modals: boolean; // UI Lab
    race: boolean; // Strategic Race (standalone view)
    docs: boolean; // Documentation
  };

  // Cockpit Widgets visibility
  cockpit_widgets: {
    agents: boolean; // Swarm Pulse
    approvals: boolean; // Approval Queue
    projects: boolean; // Critical Projects
    analytics: boolean; // Analytics Dashboard
    race: boolean; // Strategic Race HUD
    create: boolean; // Quick Create Bar
    tco: boolean; // TCO Shield
    hitl: boolean; // HITL Tickets Panel
  };

  // Settings Tabs visibility
  settings_tabs: {
    general: boolean;
    workspace: boolean;
    agents: boolean;
    api: boolean;
    profile: boolean;
    perspective: boolean;
    permissions: boolean;
    plan: boolean;
    teams: boolean;
    security: boolean;
    vault: boolean;
    mcp: boolean;
  };

  // Features (acciones específicas)
  features: {
    can_create_projects: boolean;
    can_approve_hitl: boolean;
    can_configure_agents: boolean;
    can_see_analytics: boolean;
    can_see_financials: boolean;
    can_impersonate: boolean; // NEXO admin only
    shadow_chat_enabled: boolean; // The Shadow Chat (Focus mode)
  };

  // UI Preferences
  ui: {
    simplified_nav: boolean; // Ocultar badges, stats en sidebar
    hide_metrics: boolean; // Ocultar costes, tokens en widgets
    default_view: string; // "tasks" | "cockpit"
    compact_mode: boolean; // UI más densa
  };
}

// ─── Preset Profiles ───────────────────────────────────────────────────────────

export const PRESET_PROFILES: Record<PerspectiveMode, PerspectiveProfile> = {
  director: {
    id: "preset_director",
    name: "Vista Director",
    mode: "director",
    role: "owner",
    sections: {
      cockpit: true,
      tasks: true,
      projects: true,
      incubadora: true,
      studio: true,
      documents: true,
      admin: true, // Se filtra por permisos reales
      settings: true,
      marketplace: true,
      modals: true,
      race: true,
      docs: true,
    },
    cockpit_widgets: {
      agents: true,
      approvals: true,
      projects: true,
      analytics: true,
      race: true,
      create: true,
      tco: true,
      hitl: true,
    },
    settings_tabs: {
      general: true,
      workspace: true,
      agents: true,
      api: true,
      profile: true,
      perspective: true,
      permissions: true,
      plan: true,
      teams: true,
      security: true,
      vault: true,
      mcp: true,
    },
    features: {
      can_create_projects: true,
      can_approve_hitl: true,
      can_configure_agents: true,
      can_see_analytics: true,
      can_see_financials: true,
      can_impersonate: false, // Se habilita por rol real
      shadow_chat_enabled: false,
    },
    ui: {
      simplified_nav: false,
      hide_metrics: false,
      default_view: "cockpit",
      compact_mode: false,
    },
  },

  focus: {
    id: "preset_focus",
    name: "Vista Focus",
    mode: "focus",
    role: "executor",
    sections: {
      cockpit: false, // ❌ No cockpit
      tasks: true, // ✅ Solo tareas
      projects: false, // ❌ No project engine
      incubadora: false,
      studio: false,
      documents: true, // ✅ Puede ver docs
      admin: false, // ❌ No admin
      settings: true, // ✅ Settings básico
      marketplace: false,
      modals: false,
      race: false,
      docs: true, // ✅ Documentación
    },
    cockpit_widgets: {
      // No aplica, cockpit está deshabilitado
      agents: false,
      approvals: false,
      projects: false,
      analytics: false,
      race: false,
      create: false,
      tco: false,
      hitl: false,
    },
    settings_tabs: {
      general: true,
      workspace: false,
      agents: false,
      api: false,
      profile: true,
      perspective: true,
      permissions: false,
      plan: false,
      teams: false,
      security: true,
      vault: false,
      mcp: false,
    },
    features: {
      can_create_projects: false,
      can_approve_hitl: false,
      can_configure_agents: false,
      can_see_analytics: false,
      can_see_financials: false,
      can_impersonate: false,
      shadow_chat_enabled: true, // ✅ The Shadow Chat
    },
    ui: {
      simplified_nav: true,
      hide_metrics: true,
      default_view: "tasks",
      compact_mode: true,
    },
  },

  custom: {
    id: "preset_custom",
    name: "Vista Personalizada",
    mode: "custom",
    role: "pm",
    // Default: mezcla de director y focus, usuario puede modificar
    sections: {
      cockpit: true,
      tasks: true,
      projects: true,
      incubadora: true,
      studio: false,
      documents: true,
      admin: false,
      settings: true,
      marketplace: true,
      modals: false,
      race: false,
      docs: true,
    },
    cockpit_widgets: {
      agents: true,
      approvals: true,
      projects: true,
      analytics: false,
      race: false,
      create: true,
      tco: false,
      hitl: true,
    },
    settings_tabs: {
      general: true,
      workspace: true,
      agents: true,
      api: false,
      profile: true,
      perspective: true,
      permissions: false,
      plan: true,
      teams: true,
      security: true,
      vault: false,
      mcp: false,
    },
    features: {
      can_create_projects: true,
      can_approve_hitl: true,
      can_configure_agents: false,
      can_see_analytics: false,
      can_see_financials: false,
      can_impersonate: false,
      shadow_chat_enabled: false,
    },
    ui: {
      simplified_nav: false,
      hide_metrics: false,
      default_view: "cockpit",
      compact_mode: false,
    },
  },
};

// ─── Context ───────────────────────────────────────────────────────────────────

interface UserPerspectiveCtx {
  profile: PerspectiveProfile;
  mode: PerspectiveMode;
  isLoading: boolean;

  // Actions
  setMode: (mode: PerspectiveMode) => void;
  updateProfile: (updates: Partial<PerspectiveProfile>) => void;
  resetToPreset: (mode: PerspectiveMode) => void;

  // Helpers
  canAccess: (section: keyof PerspectiveProfile["sections"]) => boolean;
  canUseFeature: (feature: keyof PerspectiveProfile["features"]) => boolean;
  isWidgetVisible: (widget: keyof PerspectiveProfile["cockpit_widgets"]) => boolean;
  isSettingsTabVisible: (tab: keyof PerspectiveProfile["settings_tabs"]) => boolean;
}

const UserPerspectiveContext = React.createContext<UserPerspectiveCtx | null>(null);

// ─── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cerebrin_user_perspective";

function loadFromStorage(): PerspectiveProfile {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as PerspectiveProfile;
      // Validate mode exists in presets
      if (PRESET_PROFILES[parsed.mode]) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  // Default: Director mode
  return PRESET_PROFILES.director;
}

function saveToStorage(profile: PerspectiveProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function UserPerspectiveProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<PerspectiveProfile>(loadFromStorage);
  const [isLoading, setIsLoading] = React.useState(false);

  // Sync profile to localStorage on change
  React.useEffect(() => {
    saveToStorage(profile);
  }, [profile]);

  // TODO: Sync with backend on mount
  // React.useEffect(() => {
  //   fetchUserPerspective().then(serverProfile => {
  //     if (serverProfile) setProfile(serverProfile);
  //   }).catch(() => { /* offline */ });
  // }, []);

  const setMode = React.useCallback((mode: PerspectiveMode) => {
    setIsLoading(true);
    // TODO: PATCH /api/users/me/perspective { mode }
    setTimeout(() => {
      const preset = PRESET_PROFILES[mode];
      setProfile(preset);
      setIsLoading(false);
      toast.success(`Vista cambiada a ${preset.name}`, {
        description:
          mode === "focus"
            ? "UI simplificada enfocada en tus tareas"
            : mode === "director"
            ? "Acceso completo a analytics y controles"
            : "Vista personalizada activada",
      });
    }, 300);
  }, []);

  const updateProfile = React.useCallback(
    (updates: Partial<PerspectiveProfile>) => {
      setProfile((prev) => {
        const updated = { ...prev, ...updates };
        // Si se modifica algo en custom, mantener mode custom
        if (prev.mode !== "custom") {
          updated.mode = "custom";
          updated.name = "Vista Personalizada";
        }
        return updated;
      });
      toast.success("Vista actualizada");
      // TODO: PATCH /api/users/me/perspective (debounced)
    },
    []
  );

  const resetToPreset = React.useCallback((mode: PerspectiveMode) => {
    const preset = PRESET_PROFILES[mode];
    setProfile(preset);
    toast.success(`Restaurado a ${preset.name}`);
    // TODO: POST /api/users/me/perspective/reset { mode }
  }, []);

  // ── Helper functions ───────────────────────────────────────────────────────

  const canAccess = React.useCallback(
    (section: keyof PerspectiveProfile["sections"]): boolean => {
      return profile.sections[section] ?? false;
    },
    [profile]
  );

  const canUseFeature = React.useCallback(
    (feature: keyof PerspectiveProfile["features"]): boolean => {
      return profile.features[feature] ?? false;
    },
    [profile]
  );

  const isWidgetVisible = React.useCallback(
    (widget: keyof PerspectiveProfile["cockpit_widgets"]): boolean => {
      return profile.cockpit_widgets[widget] ?? false;
    },
    [profile]
  );

  const isSettingsTabVisible = React.useCallback(
    (tab: keyof PerspectiveProfile["settings_tabs"]): boolean => {
      return profile.settings_tabs[tab] ?? false;
    },
    [profile]
  );

  const value: UserPerspectiveCtx = {
    profile,
    mode: profile.mode,
    isLoading,
    setMode,
    updateProfile,
    resetToPreset,
    canAccess,
    canUseFeature,
    isWidgetVisible,
    isSettingsTabVisible,
  };

  return (
    <UserPerspectiveContext.Provider value={value}>{children}</UserPerspectiveContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useUserPerspective(): UserPerspectiveCtx {
  const ctx = React.useContext(UserPerspectiveContext);
  if (!ctx) {
    throw new Error("useUserPerspective must be used within <UserPerspectiveProvider>");
  }
  return ctx;
}

// ─── Convenience Hooks ─────────────────────────────────────────────────────────

/** Check if current mode is Focus */
export function useFocusMode(): boolean {
  const { mode } = useUserPerspective();
  return mode === "focus";
}

/** Check if current mode is Director */
export function useDirectorMode(): boolean {
  const { mode } = useUserPerspective();
  return mode === "director";
}

/** Get UI preferences */
export function useUIPref() {
  const { profile } = useUserPerspective();
  return profile.ui;
}
