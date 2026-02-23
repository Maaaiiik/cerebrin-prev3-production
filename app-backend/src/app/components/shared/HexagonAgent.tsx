/**
 * HexagonAgent
 * AI = Hexágonos Neón | Humans = Círculos
 * Identity visual spec for Cerebrin Mission Control
 */

import { cn } from "../ui/utils";

// ─── Helper: compute pointy-top hexagon SVG points ───────────────────────────

export function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface HexagonAgentProps {
  /** Neon colour — must be a valid CSS colour (hex, rgb, hsl…) */
  color: string;
  /** Outer container size in px (both width and height) */
  size?: number;
  /** Whether the agent is currently online/active */
  active?: boolean;
  /** Emit a repeating pulse ring */
  pulse?: boolean;
  /** Show "blocked" / cost-limit state */
  blocked?: boolean;
  /** Arbitrary className on the wrapper */
  className?: string;
  children?: React.ReactNode;
}

const CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export function HexagonAgent({
  color,
  size = 40,
  active = true,
  pulse = false,
  blocked = false,
  className,
  children,
}: HexagonAgentProps) {
  const glowSize = Math.round(size * 0.18);

  return (
    <div
      className={cn("relative flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
    >
      {/* ── Pulse ring (animate-ping) */}
      {pulse && active && !blocked && (
        <div
          className="absolute inset-0 animate-ping"
          style={{
            clipPath: CLIP,
            backgroundColor: color,
            opacity: 0.25,
          }}
        />
      )}

      {/* ── Outer glow */}
      {active && !blocked && (
        <div
          className="absolute inset-0"
          style={{
            clipPath: CLIP,
            backgroundColor: color,
            opacity: 0.15,
            transform: "scale(1.18)",
            filter: `blur(${glowSize}px)`,
          }}
        />
      )}

      {/* ── Main hexagon body */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: size,
          height: size,
          clipPath: CLIP,
          backgroundColor: blocked
            ? "rgba(100,116,139,0.3)"
            : active
            ? `${color}22`
            : `${color}0F`,
          border: `1px solid ${blocked ? "rgba(100,116,139,0.4)" : color}`,
          // clip-path ignores border — simulate it with a slightly-smaller inner hex via pseudo approach (use box-shadow inset)
        }}
      >
        {children}
      </div>

      {/* ── Blocked badge */}
      {blocked && (
        <div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border border-background flex items-center justify-center"
          style={{ fontSize: 7, color: "white", fontWeight: 800 }}
        >
          !
        </div>
      )}
    </div>
  );
}

// ─── Human circle avatar (for contrast with hex agents) ──────────────────────

interface HumanAvatarProps {
  initials?: string;
  size?: number;
  color?: string;
  className?: string;
}

export function HumanAvatar({
  initials = "U",
  size = 32,
  color = "#3B82F6",
  className,
}: HumanAvatarProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 flex items-center justify-center rounded-full border-2",
        className
      )}
      style={{
        width: size,
        height: size,
        borderColor: color,
        backgroundColor: `${color}18`,
        color,
        fontSize: Math.round(size * 0.35),
        fontWeight: 700,
      }}
    >
      {initials}
    </div>
  );
}
