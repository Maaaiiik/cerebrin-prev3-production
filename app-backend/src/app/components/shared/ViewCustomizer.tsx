/**
 * ViewCustomizer — shared field-visibility system
 */

import * as React from "react";
import { Check, GripVertical, Lock, RefreshCw, Settings2, X } from "lucide-react";
import { cn } from "../ui/utils";
import { fetchViewConfig, saveViewConfig } from "../../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type VCCategory = "esencial" | "operacional" | "avanzado";

export interface VCField {
  key: string;
  label: string;
  description: string;
  category: VCCategory;
  locked?: boolean;
  defaultOn?: boolean;
}

export type VCConfig = Record<string, boolean>;

// ─── Context ───────────────────────────────────────────────────────────────────

export const ViewConfigCtx = React.createContext<VCConfig>({});
export function useVC(): VCConfig { return React.useContext(ViewConfigCtx); }

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useViewConfig(storageKey: string, fields: VCField[]) {
  const buildDefault = React.useCallback((): VCConfig => {
    const cfg: VCConfig = {};
    for (const f of fields) {
      if (f.locked) { cfg[f.key] = true; continue; }
      cfg[f.key] = f.defaultOn ?? (f.category === "esencial");
    }
    return cfg;
  }, [fields]);

  const [config, setConfig] = React.useState<VCConfig>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return { ...buildDefault(), ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return buildDefault();
  });

  React.useEffect(() => {
    fetchViewConfig(storageKey).then(remote => {
      if (remote) setConfig(prev => ({ ...buildDefault(), ...remote, ...Object.fromEntries(
        fields.filter(f => f.locked).map(f => [f.key, true])
      )}));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = React.useCallback((next: VCConfig) => {
    setConfig(next);
    saveViewConfig(storageKey, next).catch(() => {});
  }, [storageKey]);

  const toggleField = React.useCallback((key: string) => {
    setConfig(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveViewConfig(storageKey, next).catch(() => {});
      return next;
    });
  }, [storageKey]);

  const reset = React.useCallback(() => persist(buildDefault()), [persist, buildDefault]);
  const isVisible = React.useCallback((key: string): boolean => config[key] ?? false, [config]);

  return { config, toggleField, reset, isVisible };
}

// ─── Category metadata ─────────────────────────────────────────────────────────

const CAT: Record<VCCategory, { label: string; dot: string; pill: string }> = {
  esencial:    { label: "Esencial",    dot: "bg-emerald-500", pill: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  operacional: { label: "Operacional", dot: "bg-blue-500",    pill: "bg-blue-500/10 border-blue-500/20 text-blue-400"          },
  avanzado:    { label: "Avanzado",    dot: "bg-violet-500",  pill: "bg-violet-500/10 border-violet-500/20 text-violet-400"    },
};

// ─── Trigger button ────────────────────────────────────────────────────────────

export function ViewCustomizerTrigger({
  onClick,
  isOpen,
  className,
}: {
  onClick: () => void;
  isOpen?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all shrink-0",
        isOpen
          ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
          : "bg-muted border-border text-muted-foreground hover:border-violet-500/30 hover:text-foreground",
        className
      )}
    >
      <Settings2 className="w-3.5 h-3.5" />
      Personalizar
    </button>
  );
}

// ─── Customizer Panel ──────────────────────────────────────────────────────────

export function ViewCustomizerPanel({
  title,
  subtitle,
  fields,
  config,
  onToggleField,
  onReset,
  onClose,
}: {
  title: string;
  subtitle?: string;
  fields: VCField[];
  config: VCConfig;
  onToggleField: (key: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const grouped = React.useMemo(() => {
    const g: Record<VCCategory, VCField[]> = { esencial: [], operacional: [], avanzado: [] };
    for (const f of fields) g[f.category].push(f);
    return g;
  }, [fields]);

  const visibleCount = fields.filter(f => !f.locked && config[f.key]).length;

  return (
    <div>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 bottom-0 z-50 w-72 flex flex-col bg-card border-l border-border shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0">
              <Settings2 className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>{title}</p>
              {subtitle && <p className="text-muted-foreground/50 text-xs">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active count */}
        <div className="px-5 py-2.5 border-b border-border/40 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/50">
            {visibleCount} campo{visibleCount !== 1 ? "s" : ""} activo{visibleCount !== 1 ? "s" : ""}
          </span>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Restaurar
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {(["esencial", "operacional", "avanzado"] as VCCategory[]).map(cat => {
            const catFields = grouped[cat];
            if (!catFields.length) return null;
            const meta = CAT[cat];
            return (
              <div key={cat}>
                <span
                  className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border mb-2", meta.pill)}
                  style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </span>

                <div className="space-y-1">
                  {catFields.map(field => {
                    const isOn     = config[field.key];
                    const isLocked = field.locked;
                    return (
                      <div
                        key={field.key}
                        onClick={() => !isLocked && onToggleField(field.key)}
                        className={cn(
                          "flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all",
                          isLocked
                            ? "border-transparent cursor-default"
                            : isOn
                              ? "border-violet-500/20 bg-violet-500/5 cursor-pointer"
                              : "border-transparent hover:bg-muted/40 cursor-pointer"
                        )}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isLocked ? (
                            <div className="w-4 h-4 rounded border border-border bg-muted flex items-center justify-center">
                              <Lock className="w-2 h-2 text-muted-foreground/30" />
                            </div>
                          ) : (
                            <div className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                              isOn ? "bg-violet-600 border-violet-500" : "border-border"
                            )}>
                              {isOn && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs" style={{ fontWeight: isOn || isLocked ? 600 : 400 }}>
                              {field.label}
                            </p>
                            {isLocked && (
                              <span className="text-muted-foreground/25" style={{ fontSize: 9 }}>
                                Siempre visible
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: 10, lineHeight: 1.4 }}>
                            {field.description}
                          </p>
                        </div>

                        {!isLocked && (
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/15 mt-0.5 shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border p-4">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-colors"
            style={{ fontWeight: 600 }}
          >
            Listo
          </button>
        </div>
      </aside>
    </div>
  );
}
