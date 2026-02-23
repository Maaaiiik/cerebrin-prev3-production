/**
 * AgentAvatar — Componente reutilizable para avatares de agentes
 * 
 * Features:
 * - Placeholder hexagonal cuando no hay imagen
 * - Fallback a emoji o inicial si no hay avatar_url
 * - Tamaños: xs, sm, md, lg, xl
 * - Formas: hexagon (AI) o circle (human)
 * - Color personalizable
 */

import { cn } from "../ui/utils";

interface AgentAvatarProps {
  /** URL de la imagen del avatar (puede ser figma:asset o URL externa) */
  src?: string;
  /** Fallback si no hay src: emoji o letra inicial */
  fallback: string;
  /** Color del avatar en hex (default: violet para AI) */
  color?: string;
  /** Tamaño del avatar */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Forma del avatar */
  shape?: "hexagon" | "circle";
  /** Clase CSS adicional */
  className?: string;
  /** Alt text para accesibilidad */
  alt?: string;
}

const sizeMap = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-12 h-12 text-base",
  lg: "w-16 h-16 text-lg",
  xl: "w-24 h-24 text-2xl",
};

const clipPathHexagon = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export function AgentAvatar({
  src,
  fallback,
  color = "#8B5CF6", // violet-500
  size = "md",
  shape = "hexagon",
  className,
  alt = "Agent avatar",
}: AgentAvatarProps) {
  const sizeClass = sizeMap[size];
  const isHexagon = shape === "hexagon";

  // Si hay imagen, mostrarla
  if (src) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          sizeClass,
          isHexagon ? "" : "rounded-full",
          className
        )}
        style={{
          clipPath: isHexagon ? clipPathHexagon : undefined,
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Fallback: placeholder con emoji/inicial
  return (
    <div
      className={cn(
        "relative flex items-center justify-center font-medium",
        sizeClass,
        isHexagon ? "" : "rounded-full",
        className
      )}
      style={{
        backgroundColor: color,
        clipPath: isHexagon ? clipPathHexagon : undefined,
      }}
    >
      <span className="text-white select-none">
        {fallback}
      </span>
    </div>
  );
}

/**
 * AgentAvatarGroup — Componente para mostrar grupo de avatares apilados
 */

interface AgentAvatarGroupProps {
  agents: Array<{
    id: string;
    name: string;
    avatar_url?: string;
    emoji?: string;
    avatar_color?: string;
  }>;
  max?: number; // Máximo número a mostrar antes de +X
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "hexagon" | "circle";
  className?: string;
}

export function AgentAvatarGroup({
  agents,
  max = 5,
  size = "sm",
  shape = "hexagon",
  className,
}: AgentAvatarGroupProps) {
  const visibleAgents = agents.slice(0, max);
  const remaining = Math.max(0, agents.length - max);

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleAgents.map((agent, index) => (
        <div
          key={agent.id}
          className="ring-2 ring-slate-950"
          style={{ zIndex: visibleAgents.length - index }}
        >
          <AgentAvatar
            src={agent.avatar_url}
            fallback={agent.emoji || agent.name[0].toUpperCase()}
            color={agent.avatar_color}
            size={size}
            shape={shape}
            alt={agent.name}
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "relative flex items-center justify-center font-medium bg-slate-800 text-slate-300 ring-2 ring-slate-950",
            sizeMap[size],
            shape === "hexagon" ? "" : "rounded-full"
          )}
          style={{
            clipPath: shape === "hexagon" ? clipPathHexagon : undefined,
          }}
        >
          <span className="text-xs">+{remaining}</span>
        </div>
      )}
    </div>
  );
}
