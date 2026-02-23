/**
 * PermissionLadder
 * Visual hierarchy component showing agent autonomy levels
 * 🟢 Observer → 🟡 Operator → 🔴 Executor
 * 
 * BACKEND INTEGRATION:
 *  - Maps to agent.autonomy_level field (1-3)
 *  - Reflects permission_package: OBSERVER | OPERATOR | EXECUTOR
 *  - Used in AgentConfigSheet to visualize current autonomy
 */

import React from "react";
import { cn } from "../ui/utils";
import { Eye, Cog, Rocket, Shield, AlertTriangle, Zap, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export type AutonomyLevel = 1 | 2 | 3;
export type PermissionPackage = "OBSERVER" | "OPERATOR" | "EXECUTOR";

interface PermissionLadderProps {
  currentLevel: AutonomyLevel;
  currentPackage?: PermissionPackage;
  className?: string;
  compact?: boolean;
  showLabel?: boolean;
}

interface LadderRung {
  level: AutonomyLevel;
  package: PermissionPackage;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  capabilities: string[];
  restrictions: string[];
  badge: string;
}

const LADDER_RUNGS: LadderRung[] = [
  {
    level: 1,
    package: "OBSERVER",
    label: "Observer",
    icon: Eye,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    description: "Solo lectura y generación de sugerencias. Máxima seguridad.",
    capabilities: [
      "Leer datos y contexto",
      "Generar sugerencias",
      "Analizar información",
      "Reportar hallazgos"
    ],
    restrictions: [
      "No puede crear recursos",
      "No puede modificar datos",
      "No puede ejecutar acciones",
      "Requiere aprobación para todo"
    ],
    badge: "🟢 Seguro"
  },
  {
    level: 2,
    package: "OPERATOR",
    label: "Operator",
    icon: Cog,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    description: "Puede crear y editar recursos estándar. Requiere HITL para alto riesgo.",
    capabilities: [
      "Crear tareas y documentos",
      "Editar contenido existente",
      "Actualizar proyectos",
      "Ejecutar acciones ROUTINE"
    ],
    restrictions: [
      "No puede eliminar recursos",
      "No puede publicar externamente",
      "HITL requerido para HIGH_RISK",
      "No puede modificar permisos"
    ],
    badge: "🟡 Balanceado"
  },
  {
    level: 3,
    package: "EXECUTOR",
    label: "Executor",
    icon: Rocket,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    description: "Autonomía completa. Opera sin intervención. Solo Enterprise.",
    capabilities: [
      "Operación completamente autónoma",
      "Ejecutar acciones críticas",
      "Eliminar y publicar recursos",
      "Acceso a APIs externas",
      "Modificar configuraciones"
    ],
    restrictions: [
      "HITL solo para catástrofes",
      "Requiere plan Enterprise",
      "Auditoría completa obligatoria"
    ],
    badge: "🔴 Máximo"
  }
];

export function PermissionLadder({
  currentLevel,
  currentPackage,
  className,
  compact = false,
  showLabel = true
}: PermissionLadderProps) {
  const currentRung = LADDER_RUNGS.find(r => r.level === currentLevel) || LADDER_RUNGS[0];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {LADDER_RUNGS.map((rung) => {
          const Icon = rung.icon;
          const isActive = rung.level === currentLevel;
          const isPast = rung.level < currentLevel;
          
          return (
            <TooltipProvider key={rung.level}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "relative flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-300",
                      isActive && `${rung.bgColor} ${rung.borderColor}`,
                      isPast && "bg-muted/40 border-border/40",
                      !isActive && !isPast && "bg-muted/20 border-border/30 opacity-50"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? rung.color : "text-muted-foreground/40")} />
                    {isActive && (
                      <div className={cn("absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse", rung.color.replace("text-", "bg-"))} />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{rung.label}</span>
                      <span className="text-xs">{rung.badge}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{rung.description}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm font-semibold">Permission Ladder</p>
            <p className="text-muted-foreground/60 text-xs mt-0.5">
              Nivel de autonomía del agente
            </p>
          </div>
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border", currentRung.bgColor, currentRung.borderColor)}>
            <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", currentRung.color.replace("text-", "bg-"))} />
            <span className={cn("text-xs font-semibold", currentRung.color)}>
              {currentRung.label}
            </span>
          </div>
        </div>
      )}

      {/* Visual Ladder */}
      <div className="relative space-y-3">
        {/* Connection line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-emerald-500/20 via-amber-500/20 to-rose-500/20" />

        {LADDER_RUNGS.map((rung, index) => {
          const Icon = rung.icon;
          const isActive = rung.level === currentLevel;
          const isPast = rung.level < currentLevel;
          const isLocked = rung.level > currentLevel;

          return (
            <div
              key={rung.level}
              className={cn(
                "relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-300",
                isActive && `${rung.bgColor} ${rung.borderColor} ring-1 ring-offset-1 ${rung.borderColor.replace("border-", "ring-")}`,
                isPast && "bg-muted/20 border-border/30",
                isLocked && "bg-muted/10 border-border/20 opacity-60"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-lg border shrink-0 transition-all",
                  isActive && `${rung.bgColor} ${rung.borderColor}`,
                  isPast && "bg-muted/40 border-border/40",
                  isLocked && "bg-muted/20 border-border/20"
                )}
              >
                <Icon className={cn("w-4.5 h-4.5", isActive ? rung.color : "text-muted-foreground/40")} />
                {isActive && (
                  <div className={cn("absolute inset-0 rounded-lg animate-pulse", rung.bgColor, "opacity-50")} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className={cn("text-sm font-semibold", isActive ? "text-foreground" : "text-muted-foreground/70")}>
                    {rung.label}
                  </p>
                  <span className="text-xs text-muted-foreground/50">Nivel {rung.level}</span>
                  {isActive && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-foreground/10 text-foreground font-medium">
                      Actual
                    </span>
                  )}
                  {isLocked && rung.level === 3 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Enterprise
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground/60 mb-2">
                  {rung.description}
                </p>

                {/* Expandable details on active */}
                {isActive && (
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/40">
                    {/* Capabilities */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <p className="text-xs font-semibold text-foreground">Capacidades</p>
                      </div>
                      <ul className="space-y-1">
                        {rung.capabilities.map((cap, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground/70">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Restrictions */}
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <p className="text-xs font-semibold text-foreground">Restricciones</p>
                      </div>
                      <ul className="space-y-1">
                        {rung.restrictions.map((rest, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground/70">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span>{rest}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Badge */}
              <div className="shrink-0">
                <span className="text-lg">{rung.badge.split(" ")[0]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border/30">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-foreground font-medium mb-0.5">
            ¿Cómo cambiar el nivel?
          </p>
          <p className="text-xs text-muted-foreground/60">
            Ajusta el nivel desde la sección <span className="font-semibold text-foreground">Permisos</span> en la configuración del agente. 
            Los cambios se reflejan inmediatamente en el comportamiento del agente.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact badge version for inline display
 */
export function PermissionBadge({ level, className }: { level: AutonomyLevel; className?: string }) {
  const rung = LADDER_RUNGS.find(r => r.level === level) || LADDER_RUNGS[0];
  const Icon = rung.icon;

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border", rung.bgColor, rung.borderColor, className)}>
      <Icon className={cn("w-3.5 h-3.5", rung.color)} />
      <span className={cn("text-xs font-semibold", rung.color)}>
        {rung.label}
      </span>
      <span className="text-[10px] text-muted-foreground/50">
        Lv{level}
      </span>
    </div>
  );
}
