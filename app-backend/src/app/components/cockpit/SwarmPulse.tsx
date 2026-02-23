/**
 * SwarmPulse — Mission Control HUD
 * Radial agent swarm visualizer with animated rings & live feed
 * Replaces the previous static bar chart AgentPulse
 */

import { useState, useEffect } from "react";
import { Activity, Clock, Code2, FileText, Lightbulb, ListTodo, Loader2, Radio } from "lucide-react";
import { cn } from "../ui/utils";
import { hexPoints } from "../shared/HexagonAgent";
import { AgentTypeIcon } from "../common/AgentHierarchyBadge";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface SwarmAgent {
  id: string;
  name: string;
  color: string;
  tasks: number;
  trend: string;
  status: "active" | "idle" | "blocked";
  /** Angle in degrees (0=right, 90=down, 180=left, 270=up) */
  angle: number;
  currentTask: string;
  // Avatar & hierarchy fields
  type: "CAPTAIN" | "DT" | "SPECIALIST";
  emoji?: string;
  avatar_url?: string;
}

const SWARM_AGENTS: SwarmAgent[] = [
  { id: "writer",   name: "writer-bot",   color: "#8B5CF6", tasks: 71, trend: "+12%", status: "active",  angle: 315, currentTask: "Drafting Q3 Report…", type: "DT", emoji: "✍️" },
  { id: "analyst",  name: "analyst-bot",  color: "#3B82F6", tasks: 86, trend: "+8%",  status: "active",  angle: 225, currentTask: "Recalibrating forecast…", type: "DT", emoji: "📊" },
  { id: "strategy", name: "strategy-bot", color: "#10B981", tasks: 57, trend: "+21%", status: "idle",    angle: 135, currentTask: "Idle — awaiting task", type: "CAPTAIN", emoji: "🎯" },
  { id: "dev",      name: "dev-bot",      color: "#F59E0B", tasks: 97, trend: "+5%",  status: "active",  angle: 45,  currentTask: "OAuth 2.0 refactor…", type: "SPECIALIST", emoji: "🔧" },
];

interface FeedItem {
  id: string;
  ts: string;
  agentId: string;
  agentColor: string;
  action: string;
  type: "CODE" | "DOC" | "DATA" | "IDEA" | "TASK";
  origin?: "n8n";
}

const LIVE_FEED: FeedItem[] = [
  { id: "f1", ts: "Just now", agentId: "dev",      agentColor: "#F59E0B", action: "Committed OAuth 2.0 auth refactor to feature branch", type: "CODE" },
  { id: "f2", ts: "1m ago",   agentId: "writer",   agentColor: "#8B5CF6", action: "Generated Q3 Marketing Report draft — 2,847 words", type: "DOC",  origin: "n8n" },
  { id: "f3", ts: "2m ago",   agentId: "analyst",  agentColor: "#3B82F6", action: "Revenue forecast updated — Q4 delta: +12.4%", type: "DATA" },
  { id: "f4", ts: "5m ago",   agentId: "strategy", agentColor: "#10B981", action: "Identified 3 new expansion opportunities in LATAM", type: "IDEA", origin: "n8n" },
  { id: "f5", ts: "7m ago",   agentId: "dev",      agentColor: "#F59E0B", action: "156 unit tests passed / 0 failed", type: "CODE" },
  { id: "f6", ts: "12m ago",  agentId: "writer",   agentColor: "#8B5CF6", action: "LATAM landing page localisation ES/PT complete", type: "DOC" },
  { id: "f7", ts: "18m ago",  agentId: "analyst",  agentColor: "#3B82F6", action: "Competitive landscape scored: 14 threats identified", type: "DATA" },
];

const TYPE_ICON: Record<FeedItem["type"], React.ElementType> = {
  CODE: Code2,
  DOC:  FileText,
  DATA: ListTodo,
  IDEA: Lightbulb,
  TASK: ListTodo,
};

// ─── SVG constants ────────────────────────────────────────────────────────────

const CX = 130;
const CY = 130;
const ORBIT_R = 88;
const CENTER_HEX_R = 20;
const AGENT_HEX_R = 14;
const RING_RADII = [38, 62, 88];
const TICK_COUNT = 12;

function agentPos(angle: number) {
  const rad = (Math.PI / 180) * angle;
  return {
    x: CX + ORBIT_R * Math.cos(rad),
    y: CY + ORBIT_R * Math.sin(rad),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RadarHUD({ tick }: { tick: number }) {
  const sweepAngle = (tick * 6) % 360;

  return (
    <svg
      viewBox={`0 0 ${CX * 2} ${CY * 2}`}
      className="w-full h-full"
      style={{ maxWidth: 260, maxHeight: 260 }}
    >
      <defs>
        {/* Radial grid gradient */}
        <radialGradient id="hudBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#1e293b" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
        </radialGradient>

        {/* Radar sweep gradient */}
        <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#8B5CF6" stopOpacity="0" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.35" />
        </linearGradient>

        {/* Per-agent glow filters */}
        {SWARM_AGENTS.map((a) => (
          <filter key={a.id} id={`glow-${a.id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        ))}
        <filter id="centerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Clip to circle */}
        <clipPath id="hudClip">
          <circle cx={CX} cy={CY} r={CX - 2} />
        </clipPath>
      </defs>

      {/* ── Background */}
      <circle cx={CX} cy={CY} r={CX - 2} fill="url(#hudBg)" />

      {/* ── Cross-hairs */}
      <g stroke="rgba(100,116,139,0.2)" strokeWidth="0.5" clipPath="url(#hudClip)">
        <line x1={CX} y1="2" x2={CX} y2={CY * 2 - 2} />
        <line x1="2" y1={CY} x2={CX * 2 - 2} y2={CY} />
        {/* diagonal cross */}
        <line x1="10" y1="10" x2={CX * 2 - 10} y2={CY * 2 - 10} />
        <line x1={CX * 2 - 10} y1="10" x2="10" y2={CY * 2 - 10} />
      </g>

      {/* ── Tick marks on outer ring */}
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const a = (Math.PI * 2 * i) / TICK_COUNT;
        const ro = CX - 4;
        const ri = ro - 5;
        return (
          <line
            key={i}
            x1={CX + ri * Math.cos(a)}
            y1={CY + ri * Math.sin(a)}
            x2={CX + ro * Math.cos(a)}
            y2={CY + ro * Math.sin(a)}
            stroke="rgba(100,116,139,0.4)"
            strokeWidth="1"
          />
        );
      })}

      {/* ── Concentric rings */}
      {RING_RADII.map((r, i) => (
        <circle
          key={r}
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke="rgba(100,116,139,0.25)"
          strokeWidth={i === 2 ? 1 : 0.5}
          strokeDasharray={i === 2 ? "4 4" : "2 4"}
        />
      ))}

      {/* ── Radar sweep */}
      <g
        transform={`rotate(${sweepAngle} ${CX} ${CY})`}
        clipPath="url(#hudClip)"
      >
        <path
          d={`M ${CX} ${CY} L ${CX + (CX - 4)} ${CY} A ${CX - 4} ${CX - 4} 0 0 0 ${CX + (CX - 4) * Math.cos((Math.PI / 180) * 60)} ${CY - (CX - 4) * Math.sin((Math.PI / 180) * 60)} Z`}
          fill="url(#sweepGrad)"
          opacity="0.6"
        />
        <line
          x1={CX}
          y1={CY}
          x2={CX + CX - 4}
          y2={CY}
          stroke="#8B5CF6"
          strokeWidth="1"
          opacity="0.7"
        />
      </g>

      {/* ── Orbit path (dashed) */}
      <circle
        cx={CX}
        cy={CY}
        r={ORBIT_R}
        fill="none"
        stroke="rgba(139,92,246,0.12)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />

      {/* ── Lines from center to each agent */}
      {SWARM_AGENTS.map((agent) => {
        const pos = agentPos(agent.angle);
        return (
          <line
            key={agent.id}
            x1={CX}
            y1={CY}
            x2={pos.x}
            y2={pos.y}
            stroke={agent.color}
            strokeWidth="0.75"
            strokeOpacity={agent.status === "active" ? 0.35 : 0.12}
            strokeDasharray="3 4"
          />
        );
      })}

      {/* ── Agent hexagons */}
      {SWARM_AGENTS.map((agent) => {
        const pos = agentPos(agent.angle);
        const isActive = agent.status === "active";
        return (
          <g key={agent.id} filter={isActive ? `url(#glow-${agent.id})` : undefined}>
            {/* Outer glow pulse */}
            {isActive && (
              <polygon
                points={hexPoints(pos.x, pos.y, AGENT_HEX_R + 5)}
                fill={agent.color}
                fillOpacity="0.08"
                stroke={agent.color}
                strokeWidth="0.5"
                strokeOpacity="0.3"
              />
            )}
            {/* Main hex */}
            <polygon
              points={hexPoints(pos.x, pos.y, AGENT_HEX_R)}
              fill={agent.color}
              fillOpacity={isActive ? 0.18 : 0.07}
              stroke={agent.color}
              strokeWidth={isActive ? 1.5 : 0.75}
              strokeOpacity={isActive ? 0.9 : 0.3}
            />
            {/* Agent emoji in center */}
            <foreignObject
              x={pos.x - 8}
              y={pos.y - 8}
              width={16}
              height={16}
              className="pointer-events-none"
            >
              <div className="flex items-center justify-center w-full h-full text-xs">
                {agent.emoji || agent.name[0].toUpperCase()}
              </div>
            </foreignObject>
          </g>
        );
      })}

      {/* ── Central Cerebrin hexagon */}
      <g filter="url(#centerGlow)">
        {/* Outer glow ring */}
        <polygon
          points={hexPoints(CX, CY, CENTER_HEX_R + 8)}
          fill="#8B5CF6"
          fillOpacity="0.07"
          stroke="#8B5CF6"
          strokeWidth="0.5"
          strokeOpacity="0.2"
        />
        {/* Main hex */}
        <polygon
          points={hexPoints(CX, CY, CENTER_HEX_R)}
          fill="#8B5CF6"
          fillOpacity="0.25"
          stroke="#8B5CF6"
          strokeWidth="2"
          strokeOpacity="0.9"
        />
        {/* Inner hex */}
        <polygon
          points={hexPoints(CX, CY, CENTER_HEX_R * 0.6)}
          fill="#8B5CF6"
          fillOpacity="0.4"
          stroke="none"
        />
        {/* Core dot */}
        <circle cx={CX} cy={CY} r={4} fill="#c4b5fd" />
      </g>

      {/* ── Agent labels */}
      {SWARM_AGENTS.map((agent) => {
        const pos = agentPos(agent.angle);
        // Push label outward from hex center
        const labelRad = (Math.PI / 180) * agent.angle;
        const lx = pos.x + (AGENT_HEX_R + 10) * Math.cos(labelRad);
        const ly = pos.y + (AGENT_HEX_R + 10) * Math.sin(labelRad);
        return (
          <text
            key={agent.id}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={agent.color}
            fontSize="7"
            fontFamily="monospace"
            opacity={agent.status === "active" ? 0.9 : 0.4}
          >
            {agent.name.replace("-bot", "")}
          </text>
        );
      })}

      {/* ── Outer border */}
      <circle
        cx={CX}
        cy={CY}
        r={CX - 2}
        fill="none"
        stroke="rgba(139,92,246,0.25)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function FeedBadge({ type, origin }: { type: FeedItem["type"]; origin?: "n8n" }) {
  const Icon = TYPE_ICON[type];
  const typeColors: Record<FeedItem["type"], string> = {
    CODE: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    DOC:  "text-violet-400 bg-violet-500/10 border-violet-500/25",
    DATA: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    IDEA: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    TASK: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border", typeColors[type])} style={{ fontSize: 9, fontWeight: 700 }}>
        <Icon className="w-2.5 h-2.5" />
        {type}
      </span>
      {origin === "n8n" && (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border"
          style={{ fontSize: 9, fontWeight: 700, backgroundColor: "#EA4B0015", borderColor: "#EA4B0040", color: "#EA4B00" }}
        >
          ⚡ n8n
        </span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SwarmPulse() {
  const [tick, setTick] = useState(0);
  const [activeAgentIdx, setActiveAgentIdx] = useState(0);

  // Advance radar tick every 100ms
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  // Cycle through active agents for highlighting
  useEffect(() => {
    const id = setInterval(() => setActiveAgentIdx((i) => (i + 1) % SWARM_AGENTS.length), 2500);
    return () => clearInterval(id);
  }, []);

  const totalTasks = SWARM_AGENTS.reduce((s, a) => s + a.tasks, 0);
  const activeCount = SWARM_AGENTS.filter((a) => a.status === "active").length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Header */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-violet-400" />
          <h3 className="text-foreground text-sm" style={{ fontWeight: 600 }}>
            Swarm Pulse
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Mission Control · Agent Swarm Activity</span>
        <div className="flex-1 h-px bg-border" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">{activeCount}/{SWARM_AGENTS.length} online</span>
        </div>
      </div>

      {/* ── Body */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">

        {/* ── Left: Radial HUD */}
        <div className="flex flex-col items-center justify-center gap-3 shrink-0">
          <div
            className="rounded-full border border-violet-500/20 bg-slate-950/80 flex items-center justify-center"
            style={{ width: 260, height: 260, minWidth: 260, minHeight: 260, boxShadow: "0 0 40px rgba(139,92,246,0.08) inset, 0 0 20px rgba(139,92,246,0.05)" }}
          >
            <RadarHUD tick={tick} />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {SWARM_AGENTS.map((agent, i) => (
              <div
                key={agent.id}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-500",
                  i === activeAgentIdx
                    ? "border-opacity-60 bg-opacity-15"
                    : "border-border/40 bg-muted/20"
                )}
                style={
                  i === activeAgentIdx
                    ? { borderColor: `${agent.color}60`, backgroundColor: `${agent.color}15` }
                    : {}
                }
              >
                <span
                  className={cn("w-1.5 h-1.5 rounded-full", agent.status === "active" ? "animate-pulse" : "")}
                  style={{ backgroundColor: agent.status === "active" ? agent.color : "#475569" }}
                />
                <span className="text-xs">
                  <AgentTypeIcon type={agent.type} />
                </span>
                <span
                  className="font-mono"
                  style={{ fontSize: 10, color: i === activeAgentIdx ? agent.color : "#64748b", fontWeight: 600 }}
                >
                  {agent.name}
                </span>
                {agent.status === "active" && (
                  <Loader2
                    className="w-2.5 h-2.5 animate-spin"
                    style={{ color: agent.color, opacity: 0.7 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Stats + Live feed */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">

          {/* Agent stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
            {SWARM_AGENTS.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-muted/20"
              >
                {/* Mini hex indicator with emoji */}
                <div
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md border"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                    backgroundColor: `${agent.color}18`,
                    borderColor: `${agent.color}40`,
                  }}
                >
                  <span className="text-xs">
                    {agent.emoji || agent.name[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-foreground truncate" style={{ fontSize: 11, fontWeight: 600 }}>
                      {agent.name}
                    </p>
                    <span className="text-xs">
                      <AgentTypeIcon type={agent.type} />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-mono" style={{ fontSize: 10 }}>
                      {agent.trend}
                    </span>
                    <span className="text-muted-foreground/40 font-mono" style={{ fontSize: 9 }}>
                      •
                    </span>
                    <span className="text-muted-foreground/60 font-mono" style={{ fontSize: 9 }}>
                      {agent.tasks} tasks
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  {agent.status === "active" ? (
                    <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/30 block" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Live activity feed */}
          <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-muted/20 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-foreground/70" style={{ fontWeight: 600 }}>
                Live Action Feed
              </span>
              <span className="ml-auto font-mono text-muted-foreground/50" style={{ fontSize: 10 }}>
                {totalTasks} total today
              </span>
            </div>
            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
              {LIVE_FEED.map((item, i) => {
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-2.5 px-3 py-2.5",
                      i < LIVE_FEED.length - 1 && "border-b border-border/30"
                    )}
                  >
                    {/* Agent hex dot */}
                    <div
                      className="shrink-0 mt-0.5 w-4 h-4 flex items-center justify-center"
                      style={{
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        backgroundColor: `${item.agentColor}25`,
                        border: `1px solid ${item.agentColor}50`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <FeedBadge type={item.type} origin={item.origin} />
                        <span className="font-mono text-muted-foreground/40" style={{ fontSize: 9 }}>
                          {item.agentId}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed truncate">
                        {item.action}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground/30" />
                      <span className="font-mono text-muted-foreground/40" style={{ fontSize: 9 }}>
                        {item.ts}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}