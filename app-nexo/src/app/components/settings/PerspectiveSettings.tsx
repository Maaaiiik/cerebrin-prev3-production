/**
 * PerspectiveSettings — Settings tab para personalizar User Perspective
 * 
 * Permite:
 * - Elegir preset (Director / Focus / Custom)
 * - En modo Custom, toggle secciones/widgets/tabs individualmente
 * - Preview de cambios
 * - Restaurar a preset
 */

import * as React from "react";
import { Crown, Target, Sliders, Eye, RotateCcw, Check, Info } from "lucide-react";
import { useUserPerspective, PRESET_PROFILES, type PerspectiveMode } from "../../contexts/UserPerspective";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import { toast } from "sonner";

export function PerspectiveSettings() {
  const { profile, mode, setMode, updateProfile, resetToPreset } = useUserPerspective();

  const presets: Array<{ mode: PerspectiveMode; icon: React.ElementType; color: string; title: string; desc: string }> = [
    {
      mode: "director",
      icon: Crown,
      color: "violet",
      title: "Vista Director",
      desc: "Acceso completo a analytics, admin, y widgets avanzados. Ideal para dueños de agencia y Project Managers.",
    },
    {
      mode: "focus",
      icon: Target,
      color: "emerald",
      title: "Vista Focus",
      desc: "UI minimalista con solo tareas y Shadow Chat. Sin distracciones, perfecto para ejecutores.",
    },
    {
      mode: "custom",
      icon: Sliders,
      color: "blue",
      title: "Vista Personalizada",
      desc: "Controla exactamente qué secciones, widgets y configuraciones ver. Totalmente personalizable.",
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-violet-400" />
            <h1 className="text-lg font-bold text-foreground">Perspectiva de Usuario</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Personaliza tu experiencia en Cerebrin. Elige un perfil predefinido o crea uno a medida.
          </p>
        </div>

        {/* Preset Selector */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
            Perfiles Predefinidos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presets.map((preset) => {
              const Icon = preset.icon;
              const isActive = mode === preset.mode;
              const colorClasses = {
                violet: {
                  border: "border-violet-500/30",
                  bg: "bg-violet-500/10",
                  ring: "ring-violet-500/20",
                  text: "text-violet-400",
                  iconBg: "bg-violet-500/20",
                },
                emerald: {
                  border: "border-emerald-500/30",
                  bg: "bg-emerald-500/10",
                  ring: "ring-emerald-500/20",
                  text: "text-emerald-400",
                  iconBg: "bg-emerald-500/20",
                },
                blue: {
                  border: "border-blue-500/30",
                  bg: "bg-blue-500/10",
                  ring: "ring-blue-500/20",
                  text: "text-blue-400",
                  iconBg: "bg-blue-500/20",
                },
              }[preset.color];

              return (
                <button
                  key={preset.mode}
                  onClick={() => setMode(preset.mode)}
                  className={cn(
                    "relative p-5 rounded-2xl border-2 text-left transition-all duration-200 group",
                    isActive
                      ? `${colorClasses.border} ${colorClasses.bg} ring-4 ${colorClasses.ring}`
                      : "border-border bg-card hover:border-border/60 hover:bg-muted/20"
                  )}
                >
                  {/* Check badge */}
                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                      isActive ? colorClasses.iconBg : "bg-muted"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? colorClasses.text : "text-muted-foreground")} />
                  </div>

                  <h3 className={cn("text-sm font-semibold mb-1", isActive && colorClasses.text)}>
                    {preset.title}
                  </h3>
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">
                    {preset.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Custom Configuration (only if custom mode) */}
        {mode === "custom" && (
          <>
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
                  Secciones Visibles
                </h2>
                <button
                  onClick={() => resetToPreset("custom")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restaurar por defecto
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(profile.sections).map(([key, enabled]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{key}</p>
                      <p className="text-xs text-muted-foreground/60">
                        {key === "cockpit" && "Dashboard principal con widgets"}
                        {key === "tasks" && "Gestión de tareas personales"}
                        {key === "projects" && "Motor de proyectos completo"}
                        {key === "admin" && "Centro de administración NEXO"}
                        {key === "settings" && "Configuración del sistema"}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        const newSections = { ...profile.sections, [key]: checked };
                        updateProfile({ sections: newSections });
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
                Widgets de Cockpit
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(profile.cockpit_widgets).map(([key, enabled]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{key}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        const newWidgets = { ...profile.cockpit_widgets, [key]: checked };
                        updateProfile({ cockpit_widgets: newWidgets });
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-widest">
                Features Especiales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(profile.features).map(([key, enabled]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {key.replace(/_/g, " ").replace(/^can /, "").replace(/^shadow /, "Shadow ")}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => {
                        const newFeatures = { ...profile.features, [key]: checked };
                        updateProfile({ features: newFeatures });
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Info Card */}
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-300">Sincronización multi-dispositivo</p>
            <p className="text-xs text-blue-400/60">
              Tu perfil de perspectiva se sincroniza automáticamente entre todos tus dispositivos.
              Los cambios se guardan al instante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
