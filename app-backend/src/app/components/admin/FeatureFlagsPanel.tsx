/**
 * Feature Flags Panel — Configurador Visual tipo Elementor
 * 
 * Permite activar/desactivar features granularmente por workspace/cliente.
 * Organizado por categorías y scope (page, section, widget, button, action).
 */

import * as React from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  Lock,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { useFeatureFlags, type FeatureFlag, type FeatureScope } from "../../contexts/FeatureFlags";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

const SCOPE_CONFIG = {
  page: { label: "Páginas", icon: Layers, color: "#8B5CF6" },
  section: { label: "Secciones", icon: Sparkles, color: "#3B82F6" },
  widget: { label: "Widgets", icon: Zap, color: "#F59E0B" },
  button: { label: "Botones", icon: ToggleRight, color: "#10B981" },
  action: { label: "Acciones", icon: Shield, color: "#EF4444" },
};

const CATEGORY_CONFIG = {
  cockpit: { label: "Cockpit", color: "#8B5CF6" },
  projects: { label: "Projects", color: "#3B82F6" },
  agents: { label: "Agents", color: "#F59E0B" },
  analytics: { label: "Analytics", color: "#10B981" },
  settings: { label: "Settings", color: "#6366F1" },
  premium: { label: "Premium", color: "#EC4899" },
  beta: { label: "Beta", color: "#EF4444" },
};

const TIER_CONFIG = {
  free: { label: "Free", color: "#64748B" },
  starter: { label: "Starter", color: "#3B82F6" },
  pro: { label: "Pro", color: "#8B5CF6" },
  enterprise: { label: "Enterprise", color: "#F59E0B" },
};

// ─── Components ────────────────────────────────────────────────────────────────

function FeatureFlagRow({ flag, isEnabled, onToggle, depth = 0 }: {
  flag: FeatureFlag;
  isEnabled: boolean;
  onToggle: () => void;
  depth?: number;
}) {
  const scopeConfig = SCOPE_CONFIG[flag.scope];
  const ScopeIcon = scopeConfig.icon;
  const tierConfig = flag.tier ? TIER_CONFIG[flag.tier] : null;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150",
        isEnabled
          ? "border-border/60 bg-muted/20 hover:bg-muted/30"
          : "border-border/30 bg-muted/5 hover:bg-muted/10 opacity-60"
      )}
      style={{ marginLeft: depth * 24 }}
    >
      {/* Scope icon */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: `${scopeConfig.color}15`,
          border: `1px solid ${scopeConfig.color}30`,
        }}
      >
        <ScopeIcon className="w-3.5 h-3.5" style={{ color: scopeConfig.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm text-foreground truncate" style={{ fontWeight: 600 }}>
            {flag.name}
          </p>
          {tierConfig && (
            <span
              className="px-1.5 py-0.5 rounded-md border text-xs shrink-0"
              style={{
                backgroundColor: `${tierConfig.color}10`,
                borderColor: `${tierConfig.color}30`,
                color: tierConfig.color,
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              {tierConfig.label}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground/60 truncate">{flag.description}</p>
        <p className="font-mono text-muted-foreground/30 truncate mt-0.5" style={{ fontSize: 9 }}>
          {flag.id}
        </p>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className={cn(
          "relative shrink-0 rounded-full transition-all duration-200",
          isEnabled ? "bg-violet-600" : "bg-muted-foreground/20"
        )}
        style={{ width: 40, height: 22 }}
      >
        <div
          className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200",
            isEnabled ? "left-[22px]" : "left-[2px]"
          )}
        />
      </button>
    </div>
  );
}

function ScopeSection({ scope, flags, isEnabled, onToggle }: {
  scope: FeatureScope;
  flags: FeatureFlag[];
  isEnabled: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const scopeConfig = SCOPE_CONFIG[scope];
  const Icon = scopeConfig.icon;

  const enabledCount = flags.filter(f => isEnabled(f.id)).length;

  return (
    <div className="space-y-2">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${scopeConfig.color}15`,
            border: `1px solid ${scopeConfig.color}30`,
          }}
        >
          <Icon className="w-4 h-4" style={{ color: scopeConfig.color }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
            {scopeConfig.label}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {enabledCount} de {flags.length} activos
          </p>
        </div>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground/50" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        )}
      </button>

      {/* Flags */}
      {expanded && (
        <div className="space-y-1.5 pl-2">
          {flags.map(flag => (
            <FeatureFlagRow
              key={flag.id}
              flag={flag}
              isEnabled={isEnabled(flag.id)}
              onToggle={() => onToggle(flag.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function FeatureFlagsPanel({ onBack }: { onBack: () => void }) {
  const {
    flags,
    config,
    isEnabled,
    toggleFlag,
    getFlagsByScope,
    resetToDefaults,
  } = useFeatureFlags();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterScope, setFilterScope] = React.useState<FeatureScope | "all">("all");
  const [filterCategory, setFilterCategory] = React.useState<string>("all");

  // Filter flags
  const filteredFlags = React.useMemo(() => {
    let result = flags;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        f =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q)
      );
    }

    if (filterScope !== "all") {
      result = result.filter(f => f.scope === filterScope);
    }

    if (filterCategory !== "all") {
      result = result.filter(f => f.category === filterCategory);
    }

    return result;
  }, [flags, searchQuery, filterScope, filterCategory]);

  // Group by scope
  const flagsByScope = React.useMemo(() => {
    const groups: Record<FeatureScope, FeatureFlag[]> = {
      page: [],
      section: [],
      widget: [],
      button: [],
      action: [],
    };

    filteredFlags.forEach(flag => {
      groups[flag.scope].push(flag);
    });

    return groups;
  }, [filteredFlags]);

  const handleReset = () => {
    if (confirm("¿Resetear todas las configuraciones a valores por defecto?")) {
      resetToDefaults();
      toast.success("Configuración reseteada");
    }
  };

  const enabledCount = flags.filter(f => isEnabled(f.id)).length;
  const totalCount = flags.length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <div className="h-4 w-px bg-border/40 hidden sm:block" />
          <div>
            <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
              Feature Flags
            </p>
            <p className="text-xs text-muted-foreground/60">
              {enabledCount} de {totalCount} features activos
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </header>

      {/* Controls */}
      <div className="shrink-0 px-4 sm:px-6 md:px-8 py-4 space-y-3 border-b border-border/40">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar features..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-muted/20 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Scope filter */}
          <select
            value={filterScope}
            onChange={e => setFilterScope(e.target.value as FeatureScope | "all")}
            className="px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(SCOPE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-all"
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        {filterScope === "all" ? (
          <>
            {(Object.keys(SCOPE_CONFIG) as FeatureScope[]).map(scope => {
              const scopeFlags = flagsByScope[scope];
              if (scopeFlags.length === 0) return null;
              return (
                <ScopeSection
                  key={scope}
                  scope={scope}
                  flags={scopeFlags}
                  isEnabled={isEnabled}
                  onToggle={toggleFlag}
                />
              );
            })}
          </>
        ) : (
          <div className="space-y-1.5">
            {filteredFlags.map(flag => (
              <FeatureFlagRow
                key={flag.id}
                flag={flag}
                isEnabled={isEnabled(flag.id)}
                onToggle={() => toggleFlag(flag.id)}
              />
            ))}
          </div>
        )}

        {filteredFlags.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-muted-foreground/20" />
            </div>
            <p className="text-sm text-muted-foreground/60">
              No se encontraron features
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
