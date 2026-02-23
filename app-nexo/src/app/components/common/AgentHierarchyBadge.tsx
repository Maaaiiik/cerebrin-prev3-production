/**
 * AgentHierarchyBadge — Componente para mostrar jerarquía de agentes
 * 
 * Tipos de agente:
 * - 👑 CAPTAIN — Líder de swarm (dorado)
 * - 🎯 DT (Director Técnico) — Coordinador estratégico (violeta)
 * - ⚙️ SPECIALIST — Especialista en área (azul)
 * 
 * Usado en: SwarmPulse, AgentConfigSheet, AgentFactory, AgentMarketplace
 */

import { cn } from "../ui/utils";

export type AgentType = "CAPTAIN" | "DT" | "SPECIALIST";

interface AgentHierarchyBadgeProps {
  type: AgentType;
  /** Variante del badge */
  variant?: "default" | "compact" | "minimal";
  /** Tamaño del badge */
  size?: "sm" | "md" | "lg";
  /** Clase CSS adicional */
  className?: string;
}

const typeConfig = {
  CAPTAIN: {
    emoji: "👑",
    label: "Captain",
    description: "Líder de Swarm",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    borderColor: "border-amber-500/30",
  },
  DT: {
    emoji: "🎯",
    label: "DT",
    description: "Director Técnico",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-400",
    borderColor: "border-violet-500/30",
  },
  SPECIALIST: {
    emoji: "⚙️",
    label: "Specialist",
    description: "Especialista",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
  },
};

const sizeMap = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

export function AgentHierarchyBadge({
  type,
  variant = "default",
  size = "md",
  className,
}: AgentHierarchyBadgeProps) {
  // Validación: si type es inválido, usar SPECIALIST como fallback
  const validType = type && typeConfig[type] ? type : "SPECIALIST";
  const config = typeConfig[validType];
  const sizeClass = sizeMap[size];

  // Variante minimal: solo emoji
  if (variant === "minimal") {
    return (
      <span className={cn("inline-block", className)} title={`${config.label} - ${config.description}`}>
        {config.emoji}
      </span>
    );
  }

  // Variante compact: emoji + label
  if (variant === "compact") {
    return (
      <span
        className={cn(
          "inline-flex items-center font-medium rounded-md border",
          config.bgColor,
          config.textColor,
          config.borderColor,
          sizeClass,
          className
        )}
        title={config.description}
      >
        <span>{config.emoji}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  // Variante default: emoji + label + description
  return (
    <div
      className={cn(
        "inline-flex items-center font-medium rounded-md border",
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClass,
        className
      )}
    >
      <span className="text-base">{config.emoji}</span>
      <div className="flex flex-col items-start gap-0 leading-tight">
        <span className="font-semibold">{config.label}</span>
        {size !== "sm" && (
          <span className={cn("text-xs opacity-70", config.textColor)}>
            {config.description}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * AgentTypePill — Versión pill compacta para uso en listas
 */
interface AgentTypePillProps {
  type: AgentType;
  className?: string;
}

export function AgentTypePill({ type, className }: AgentTypePillProps) {
  return (
    <AgentHierarchyBadge
      type={type}
      variant="compact"
      size="sm"
      className={className}
    />
  );
}

/**
 * AgentTypeIcon — Solo el emoji, para uso inline
 */
interface AgentTypeIconProps {
  type: AgentType;
  className?: string;
}

export function AgentTypeIcon({ type, className }: AgentTypeIconProps) {
  return (
    <AgentHierarchyBadge
      type={type}
      variant="minimal"
      className={className}
    />
  );
}
