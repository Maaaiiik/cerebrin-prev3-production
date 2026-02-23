import { useEffect, useState, useCallback, type ElementType } from "react";
import { cn } from "../ui/utils";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Cpu,
  Eye,
  GitBranch,
  Layers,
  LayoutDashboard,
  ListTodo,
  Lock,
  Play,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";

import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  desc: string;
  Visual: ElementType;
  accent: "violet" | "blue" | "emerald" | "amber" | "rose" | "mixed";
}

interface OnboardingTutorialProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (section: string) => void;
}

// ─── Visual Illustrations ─────────────────────────────────────────────────────

function IllustrationWelcome() {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background rings */}
      {[120, 180, 240, 300].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-violet-500/10"
          style={{ width: size, height: size, animationDelay: `${i * 0.3}s` }}
        />
      ))}
      {/* Core logo cluster */}
      <div className="relative flex flex-col items-center gap-3 z-10">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-violet-900/50 border border-violet-500/30 flex items-center justify-center shadow-xl shadow-violet-500/20">
            <Cpu className="w-8 h-8 text-violet-400" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl text-foreground tracking-tight" style={{ fontWeight: 700 }}>Cerebrin</p>
          <p className="text-[11px] text-violet-400/80 tracking-widest uppercase mt-0.5">Strategy Operating System</p>
        </div>
        {/* Orbiting agents */}
        {[
          { icon: <Bot className="w-3 h-3" />, angle: -60, color: "text-violet-400 border-violet-500/40 bg-violet-500/10" },
          { icon: <User className="w-3 h-3" />, angle: 60, color: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
          { icon: <CheckCircle2 className="w-3 h-3" />, angle: 180, color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
        ].map((item, i) => {
          const rad = (item.angle * Math.PI) / 180;
          const r = 72;
          return (
            <div
              key={i}
              className={cn("absolute w-7 h-7 rounded-xl border flex items-center justify-center", item.color)}
              style={{
                left: `calc(50% + ${Math.cos(rad) * r}px - 14px)`,
                top: `calc(50% + ${Math.sin(rad) * r}px - 14px)`,
              }}
            >
              {item.icon}
            </div>
          );
        })}
      </div>
      {/* Tagline */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-border/60 w-12" />
          <span className="text-xs text-muted-foreground/60 px-2">Mantra</span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-border/60 w-12" />
        </div>
        <p className="text-xs text-center text-muted-foreground/70 px-4">
          <span className="text-violet-400">IA ejecuta</span> · <span className="text-blue-400">Humanos controlan</span>
        </p>
      </div>
    </div>
  );
}

function IllustrationTwoActors() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5 p-4">
      <div className="flex items-stretch gap-3 w-full max-w-xs">
        {/* AI side */}
        <div className="flex-1 rounded-2xl border border-violet-500/25 bg-violet-500/6 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-xs text-violet-400" style={{ fontWeight: 600 }}>Agente IA</span>
          </div>
          {["Analiza datos", "Redacta borradores", "Ejecuta tareas", "Sugiere acciones"].map((t, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Zap className="w-2.5 h-2.5 text-violet-400/60 shrink-0" />
              <span className="text-[10px] text-violet-300/70">{t}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="w-px flex-1 bg-border/40" />
          <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center">
            <ShieldCheck className="w-3 h-3 text-muted-foreground/60" />
          </div>
          <div className="w-px flex-1 bg-border/40" />
        </div>

        {/* Human side */}
        <div className="flex-1 rounded-2xl border border-blue-500/25 bg-blue-500/6 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <span className="text-xs text-blue-400" style={{ fontWeight: 600 }}>Humano</span>
          </div>
          {["Aprueba pasos", "Define reglas", "Revisa outputs", "Tiene control"].map((t, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Eye className="w-2.5 h-2.5 text-blue-400/60 shrink-0" />
              <span className="text-[10px] text-blue-300/70">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-500/70" />
          <span className="text-[10px] text-muted-foreground/60">Violeta = IA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500/70" />
          <span className="text-[10px] text-muted-foreground/60">Azul = Humano</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          <span className="text-[10px] text-muted-foreground/60">Verde = Completado</span>
        </div>
      </div>
    </div>
  );
}

function IllustrationCockpit() {
  return (
    <div className="w-full h-full flex flex-col gap-2.5 p-3">
      <div className="flex items-center gap-2 px-1">
        <LayoutDashboard className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs text-muted-foreground/70">The Cockpit · Vista general</span>
      </div>

      {/* Approval queue mini */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider" style={{ fontWeight: 600 }}>Cola de Aprobación</span>
          <span className="text-[10px] text-amber-400 tabular-nums">3 pendientes</span>
        </div>
        {[
          { agent: "ResearchBot", action: "Publicar informe LATAM", color: "text-violet-400" },
          { agent: "CopyAgent", action: "Enviar campaña email", color: "text-violet-400" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <Bot className="w-3 h-3 text-violet-400/60 shrink-0" />
            <span className="text-[10px] text-foreground/70 flex-1 truncate">{item.action}</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Check className="w-2 h-2 text-emerald-400" />
              </div>
              <div className="w-4 h-4 rounded-md bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <X className="w-2 h-2 text-rose-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Agent pulse mini */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider" style={{ fontWeight: 600 }}>Agentes Activos</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        {[
          { name: "ResearchBot", status: "Analizando mercado LATAM", pct: 68 },
          { name: "CopyAgent", status: "Generando contenido", pct: 34 },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className="w-4 h-4 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-2.5 h-2.5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-foreground/80" style={{ fontWeight: 600 }}>{a.name}</span>
                <span className="text-[10px] text-muted-foreground/50 tabular-nums">{a.pct}%</span>
              </div>
              <div className="h-0.5 rounded-full bg-muted mt-0.5">
                <div className="h-full rounded-full bg-violet-500/60" style={{ width: `${a.pct}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IllustrationTasks() {
  const tasks = [
    { title: "Revisar brief de campaña LATAM", done: 1, total: 4, pct: 25, blocked: true },
    { title: "Aprobar wireframes Platform 3.0", done: 3, total: 3, pct: 100, blocked: false },
    { title: "Preparar deck para board", done: 2, total: 5, pct: 40, blocked: true },
    { title: "Reply to FinoTech inquiry", done: 0, total: 0, pct: 100, blocked: false },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between px-1 mb-1">
        <div className="flex items-center gap-2">
          <ListTodo className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-muted-foreground/70">My Tasks · Hoy</span>
        </div>
        <span className="text-[10px] text-muted-foreground/50">1 de 4 hecho</span>
      </div>
      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted overflow-hidden mx-1 mb-1">
        <div className="h-full w-1/4 rounded-full bg-emerald-500/60" />
      </div>
      {tasks.map((t, i) => (
        <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted/20">
          <div className={cn(
            "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0",
            t.pct === 100 && t.done > 0
              ? "bg-emerald-500/70 border-emerald-500"
              : t.blocked
              ? "border-amber-500/50"
              : "border-border"
          )}>
            {t.pct === 100 && t.done > 0 && <Check className="w-2 h-2 text-white" />}
            {t.blocked && <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />}
          </div>
          <span className="text-[10px] text-foreground/80 flex-1 truncate">{t.title}</span>
          {t.total > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-8 h-0.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", t.pct === 100 ? "bg-emerald-500" : t.pct >= 50 ? "bg-emerald-500/60" : "bg-amber-400/60")}
                  style={{ width: `${t.pct}%` }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground/40 tabular-nums">{t.done}/{t.total}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function IllustrationAgents() {
  const steps = [
    { label: "Analiza datos", done: true },
    { label: "Genera borrador", done: true },
    { label: "Solicita aprobación", active: true },
    { label: "Publica resultado", done: false },
  ];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
      {/* Agent card */}
      <div className="w-full max-w-[240px] rounded-2xl border border-violet-500/25 bg-violet-500/6 p-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-foreground/90" style={{ fontWeight: 600 }}>ResearchBot</p>
            <p className="text-[10px] text-violet-400/70">Agente IA · Activo</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Step chain */}
        <div className="space-y-1.5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                s.done
                  ? "bg-emerald-500/70 border-emerald-500"
                  : (s as any).active
                  ? "border-amber-400 bg-amber-400/20 animate-pulse"
                  : "border-border/60"
              )}>
                {s.done && <Check className="w-2.5 h-2.5 text-white" />}
                {(s as any).active && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </div>
              <div className={cn(
                "flex-1 h-px",
                i < steps.length - 1 ? (s.done ? "bg-emerald-500/30" : "bg-border/30") : "hidden"
              )} />
              <span className={cn(
                "text-[10px] flex-1",
                s.done ? "text-muted-foreground/50 line-through" : (s as any).active ? "text-amber-400" : "text-muted-foreground/40"
              )}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Cpu className="w-3 h-3 text-violet-400/60" />
        <span className="text-[10px] text-muted-foreground/50">Paso 3 de 4 · Esperando aprobación</span>
      </div>
    </div>
  );
}

function IllustrationApproval() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      {/* Flow chain */}
      <div className="flex flex-col items-center gap-1 w-full max-w-[220px]">
        {/* Agent action */}
        <div className="w-full rounded-xl border border-violet-500/25 bg-violet-500/8 p-2.5 flex items-center gap-2">
          <Bot className="w-4 h-4 text-violet-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] text-violet-300" style={{ fontWeight: 600 }}>CopyAgent solicita:</p>
            <p className="text-[10px] text-muted-foreground/60">Publicar campaña email a 4,500 contactos</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-1">
          <div className="w-px h-4 bg-border/50" />
        </div>

        {/* Checkpoint */}
        <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/8 p-2.5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] text-amber-300" style={{ fontWeight: 600 }}>Checkpoint de Control</p>
            <p className="text-[10px] text-muted-foreground/60">Requiere aprobación humana</p>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center gap-1">
          <div className="w-px h-4 bg-border/50" />
        </div>

        {/* Decision */}
        <div className="flex gap-2 w-full">
          <div className="flex-1 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-2 flex items-center justify-center gap-1.5">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400" style={{ fontWeight: 600 }}>Aprobar</span>
          </div>
          <div className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/8 p-2 flex items-center justify-center gap-1.5">
            <X className="w-3 h-3 text-rose-400" />
            <span className="text-[10px] text-rose-400" style={{ fontWeight: 600 }}>Rechazar</span>
          </div>
        </div>

        {/* Arrow */}
        <div className="w-px h-4 bg-border/50" />

        {/* Result */}
        <div className="w-full rounded-xl border border-blue-500/25 bg-blue-500/6 p-2.5 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400 shrink-0" />
          <p className="text-[10px] text-blue-300">Tú decides · El agente ejecuta</p>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Permission Presets ────────────────────────────────────────────

const ONBOARDING_PRESETS = [
  {
    key: "CAUTIOUS",
    emoji: "🛡️",
    label: "Cauteloso",
    desc: "Todo pasa por ti antes de ejecutarse.",
    labelColor: "text-blue-400",
    color: "border-blue-500/30 bg-blue-500/6",
    bars: { auto: 0, approval: 10, blocked: 4 },
    recommended: false,
  },
  {
    key: "STANDARD",
    emoji: "⚡",
    label: "Estándar",
    desc: "Autonomía en lo seguro, control en lo crítico.",
    labelColor: "text-violet-400",
    color: "border-violet-500/30 bg-violet-500/6",
    bars: { auto: 7, approval: 5, blocked: 2 },
    recommended: true,
  },
  {
    key: "ADVANCED",
    emoji: "🚀",
    label: "Avanzado",
    desc: "Alta autonomía. Solo apruebas acciones destructivas.",
    labelColor: "text-emerald-400",
    color: "border-emerald-500/30 bg-emerald-500/6",
    bars: { auto: 10, approval: 3, blocked: 1 },
    recommended: false,
  },
  {
    key: "READ_ONLY",
    emoji: "👁️",
    label: "Solo Observar",
    desc: "El agente sugiere. Tú ejecutas todo manualmente.",
    labelColor: "text-muted-foreground",
    color: "border-border bg-muted/15",
    bars: { auto: 0, approval: 1, blocked: 13 },
    recommended: false,
  },
];

function IllustrationPermissions() {
  const [selected, setSelected] = useState<string | null>(() =>
    localStorage.getItem("cerebrin_default_permission_preset")
  );

  const handleSelect = (key: string) => {
    setSelected(key);
    localStorage.setItem("cerebrin_default_permission_preset", key);
  };

  return (
    <div className="w-full h-full flex flex-col gap-2.5 p-4 justify-center">
      <div className="flex items-center gap-2 mb-0.5">
        <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs text-muted-foreground/70">Elige tu perfil de permisos inicial</span>
      </div>

      {/* Preset cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ONBOARDING_PRESETS.map((p) => {
          const isSelected = selected === p.key;
          return (
            <button
              key={p.key}
              onClick={() => handleSelect(p.key)}
              className={cn(
                "rounded-2xl border p-2.5 text-left transition-all duration-200 relative",
                isSelected
                  ? cn(p.color, "shadow-md scale-[1.02]")
                  : "border-border/40 hover:border-border bg-muted/10 hover:bg-muted/20"
              )}
            >
              {p.recommended && !isSelected && (
                <span className="absolute -top-2 left-3 px-1.5 py-0.5 rounded-md bg-violet-500/80 text-[9px] text-white" style={{ fontWeight: 700 }}>
                  Recomendado
                </span>
              )}
              <div className="flex items-start justify-between gap-1 mb-1.5">
                <span className="text-base leading-none">{p.emoji}</span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <p className={cn("text-[11px]", isSelected ? p.labelColor : "text-foreground/80")} style={{ fontWeight: 700 }}>
                {p.label}
              </p>
              <p className="text-[10px] text-muted-foreground/50 leading-snug mt-0.5">{p.desc}</p>
              {/* Mini permission bar */}
              <div className="flex gap-0.5 mt-2 h-1">
                {Array.from({ length: p.bars.auto }).map((_, i) => (
                  <div key={`a${i}`} className="flex-1 rounded-full bg-emerald-500/60" />
                ))}
                {Array.from({ length: p.bars.approval }).map((_, i) => (
                  <div key={`p${i}`} className="flex-1 rounded-full bg-amber-400/60" />
                ))}
                {Array.from({ length: p.bars.blocked }).map((_, i) => (
                  <div key={`b${i}`} className="flex-1 rounded-full bg-rose-500/30" />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-1">
        {[
          { color: "bg-emerald-500/60", label: "Autónomo" },
          { color: "bg-amber-400/60", label: "Aprobación" },
          { color: "bg-rose-500/30", label: "Bloqueado" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", l.color)} />
            <span className="text-[9px] text-muted-foreground/40">{l.label}</span>
          </div>
        ))}
      </div>

      {selected ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
          <p className="text-[11px] text-emerald-300/80">
            Perfil <span style={{ fontWeight: 700 }}>{ONBOARDING_PRESETS.find((p) => p.key === selected)?.label}</span> seleccionado · Puedes ajustar permisos individuales en Settings → Agentes
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 border border-border/30">
          <Sliders className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          <p className="text-[11px] text-muted-foreground/50">Elige un perfil para configurar los permisos iniciales</p>
        </div>
      )}
    </div>
  );
}

function IllustrationFlow() {
  const nodes = [
    { label: "Cockpit", icon: <LayoutDashboard className="w-3 h-3" />, color: "border-violet-500/30 bg-violet-500/10 text-violet-400" },
    { label: "Proyectos", icon: <Layers className="w-3 h-3" />, color: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
    { label: "Tareas", icon: <ListTodo className="w-3 h-3" />, color: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
    { label: "Agentes", icon: <Bot className="w-3 h-3" />, color: "border-violet-500/30 bg-violet-500/10 text-violet-400" },
    { label: "Outputs", icon: <Sparkles className="w-3 h-3" />, color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  ];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
      <div className="flex items-center gap-1.5">
        {nodes.map((n, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={cn("rounded-xl border px-2 py-1.5 flex flex-col items-center gap-1", n.color)}>
              <div className={n.color.split(" ")[2]}>{n.icon}</div>
              <span className={cn("text-[9px]", n.color.split(" ")[2])} style={{ fontWeight: 600 }}>{n.label}</span>
            </div>
            {i < nodes.length - 1 && (
              <ChevronRight className="w-3 h-3 text-border/60 shrink-0" />
            )}
          </div>
        ))}
      </div>
      {/* Human oversight loop */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/6 w-full max-w-xs">
        <RefreshCw className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <div>
          <p className="text-[10px] text-blue-300" style={{ fontWeight: 600 }}>Supervisión continua</p>
          <p className="text-[10px] text-muted-foreground/50">Tú apruebas cada paso crítico del agente</p>
        </div>
      </div>
      {/* Rules feedback */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/20 bg-amber-500/6 w-full max-w-xs">
        <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <div>
          <p className="text-[10px] text-amber-300" style={{ fontWeight: 600 }}>Reglas de perfil activas</p>
          <p className="text-[10px] text-muted-foreground/50">Los agentes sólo actúan dentro de sus límites</p>
        </div>
      </div>
    </div>
  );
}

function IllustrationProjects() {
  const projects = [
    { name: "LATAM Expansion", pct: 38, ai: 3, human: 2, color: "bg-violet-500/60" },
    { name: "Platform 3.0", pct: 71, ai: 1, human: 4, color: "bg-blue-500/60" },
    { name: "Revenue Ops", pct: 55, ai: 2, human: 2, color: "bg-emerald-500/60" },
  ];
  return (
    <div className="w-full h-full flex flex-col gap-2.5 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-3.5 h-3.5 text-blue-400" />
        <span className="text-xs text-muted-foreground/70">Project Engine · Proyectos activos</span>
      </div>
      {projects.map((p, i) => (
        <div key={i} className="rounded-xl border border-border/50 bg-muted/15 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-foreground/85" style={{ fontWeight: 600 }}>{p.name}</span>
            <span className="text-[10px] text-muted-foreground/60 tabular-nums">{p.pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
            <div className={cn("h-full rounded-full", p.color)} style={{ width: `${p.pct}%` }} />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Bot className="w-2.5 h-2.5 text-violet-400/60" />
              <span className="text-[9px] text-muted-foreground/50">{p.ai} agentes</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-2.5 h-2.5 text-blue-400/60" />
              <span className="text-[9px] text-muted-foreground/50">{p.human} humanos</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function IllustrationReady() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5 p-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/25 to-emerald-900/40 border border-emerald-500/30 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <Play className="w-9 h-9 text-emerald-400 ml-1" />
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-xl bg-violet-500/30 border border-violet-500/40 flex items-center justify-center">
          <Bot className="w-4 h-4 text-violet-400" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-7 h-7 rounded-xl bg-blue-500/30 border border-blue-500/40 flex items-center justify-center">
          <User className="w-4 h-4 text-blue-400" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs">
        {[
          { icon: <LayoutDashboard className="w-3 h-3 text-violet-400" />, label: "Cockpit", sub: "Vista general" },
          { icon: <ListTodo className="w-3 h-3 text-blue-400" />, label: "My Tasks", sub: "Tus tareas hoy" },
          { icon: <Layers className="w-3 h-3 text-blue-400" />, label: "Proyectos", sub: "Estado global" },
          { icon: <Bot className="w-3 h-3 text-violet-400" />, label: "Agentes", sub: "IA en acción" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/20">
            {item.icon}
            <div>
              <p className="text-[10px] text-foreground/80" style={{ fontWeight: 600 }}>{item.label}</p>
              <p className="text-[9px] text-muted-foreground/50">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Steps Definition ─────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: "welcome",
    tag: "Bienvenido",
    title: "Gobierna tu trabajo.",
    subtitle: "IA en la ejecución, humanos en el control.",
    desc: "Cerebrin es tu Sistema Operativo de Estrategia. Conecta agentes de IA a tus proyectos y tareas, supervisa cada paso y mantén el control total sobre lo que sucede.",
    Visual: IllustrationWelcome,
    accent: "violet",
  },
  {
    id: "actors",
    tag: "Concepto clave",
    title: "Dos actores, un sistema.",
    subtitle: "IA ejecuta. Tú decides.",
    desc: "Todo en Cerebrin está codificado por color: Violeta es IA, Azul/Verde es humano. Nunca confundirás quién hizo qué. La IA trabaja en el fondo; tú validas cada paso crítico.",
    Visual: IllustrationTwoActors,
    accent: "mixed",
  },
  {
    id: "cockpit",
    tag: "Pantalla 1",
    title: "El Cockpit.",
    subtitle: "Tu centro de mando en tiempo real.",
    desc: "Al abrir Cerebrin verás El Cockpit: acciones de agentes esperando tu aprobación, el estado de todos los agentes activos y un resumen de proyectos críticos. Todo en una sola pantalla.",
    Visual: IllustrationCockpit,
    accent: "violet",
  },
  {
    id: "tasks",
    tag: "Pantalla 2",
    title: "My Tasks.",
    subtitle: "Tu tablero personal de trabajo diario.",
    desc: "Organizado por urgencia: Vencidas, Hoy, Esta semana. Haz clic en el círculo de cada tarea para ver opciones. Las tareas con subtareas muestran su % de avance y se bloquean hasta que todas las subtareas estén completas.",
    Visual: IllustrationTasks,
    accent: "blue",
  },
  {
    id: "projects",
    tag: "Pantalla 3",
    title: "Project Engine.",
    subtitle: "Proyectos con ejecución mixta humano-IA.",
    desc: "Cada proyecto muestra su progreso global y qué actores (agentes o personas) están trabajando en él. Desde aquí puedes crear tareas, asignarlas a agentes y ver el avance en tiempo real.",
    Visual: IllustrationProjects,
    accent: "blue",
  },
  {
    id: "agents",
    tag: "Característica clave",
    title: "Agentes IA trabajando.",
    subtitle: "Cada agente sigue pasos visibles y auditables.",
    desc: "Cuando un agente trabaja en una tarea, puedes ver cada paso que da: qué analizó, qué generó y en qué punto está. No hay caja negra: todo es transparente y controlable.",
    Visual: IllustrationAgents,
    accent: "violet",
  },
  {
    id: "approval",
    tag: "Control humano",
    title: "Tú apruebas cada acción crítica.",
    subtitle: "El agente propone. Tú decides.",
    desc: "Antes de que un agente ejecute una acción importante (enviar emails, publicar contenido, modificar datos), Cerebrin te pide confirmación. Puedes aprobar, rechazar o modificar la acción.",
    Visual: IllustrationApproval,
    accent: "amber",
  },
  {
    id: "rules",
    tag: "Gobernanza",
    title: "Elige tu perfil de permisos.",
    subtitle: "Decide ahora cuánta autonomía le das a tus agentes.",
    desc: "Cada tipo de agente (Investigador, Escritor, Manager) hereda el perfil que elijas. Puedes ajustar permisos individuales después en Settings → Agentes. Los permisos se guardan en workspace_roles y el API los valida en cada acción.",
    Visual: IllustrationPermissions,
    accent: "violet",
  },
  {
    id: "flow",
    tag: "Arquitectura",
    title: "El flujo de información.",
    subtitle: "Todo conectado. Tú siempre en el centro.",
    desc: "Cockpit → Proyectos → Tareas → Agentes → Outputs. La información fluye en cadena, pero tú supervisas cada eslabón. Las reglas de perfil actúan como filtros en cada paso del agente.",
    Visual: IllustrationFlow,
    accent: "mixed",
  },
  {
    id: "ready",
    tag: "¡Listo!",
    title: "Empieza a gobernar.",
    subtitle: "Tu estrategia, con IA como copiloto.",
    desc: "Explora El Cockpit para ver el panorama completo, revisa Mis Tareas para empezar el día, o abre un Proyecto para asignar tu primer agente. Cerebrin está listo para trabajar contigo.",
    Visual: IllustrationReady,
    accent: "emerald",
  },
];

// ─── Accent config ────────────────────────────────────────────────────────────

const ACCENT_CONFIG = {
  violet: {
    tag: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    dot: "bg-violet-500",
    activeDot: "bg-violet-400",
    btn: "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
  },
  blue: {
    tag: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    dot: "bg-blue-500",
    activeDot: "bg-blue-400",
    btn: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25",
    border: "border-blue-500/20",
    glow: "shadow-blue-500/10",
  },
  emerald: {
    tag: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    dot: "bg-emerald-500",
    activeDot: "bg-emerald-400",
    btn: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  amber: {
    tag: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    dot: "bg-amber-500",
    activeDot: "bg-amber-400",
    btn: "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/25",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
  },
  rose: {
    tag: "bg-rose-500/15 text-rose-400 border-rose-500/25",
    dot: "bg-rose-500",
    activeDot: "bg-rose-400",
    btn: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/25",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/10",
  },
  mixed: {
    tag: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    dot: "bg-violet-500",
    activeDot: "bg-violet-400",
    btn: "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
  },
};

// ─── OnboardingTutorial ───────────────────────────────────────────────────────

export function OnboardingTutorial({ open, onClose, onNavigate }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);

  const current = STEPS[step];
  const accent = ACCENT_CONFIG[current.accent];
  const isLast = step === STEPS.length - 1;

  const go = useCallback((dir: "next" | "prev") => {
    if (animating) return;
    const next = dir === "next" ? step + 1 : step - 1;
    if (next < 0 || next >= STEPS.length) return;
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 180);
  }, [step, animating]);

  const handleFinish = () => {
    onClose();
    if (onNavigate) onNavigate("cockpit");
  };

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go("next");
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") go("prev");
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, go, onClose]);

  // Reset on open
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative z-10 w-full max-w-[780px] rounded-3xl border bg-background shadow-2xl overflow-hidden",
          "flex flex-col md:flex-row",
          accent.border,
          accent.glow
        )}
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Left: Visual illustration */}
        <div
          className={cn(
            "md:w-[340px] shrink-0 relative overflow-hidden",
            "min-h-[220px] md:min-h-0",
            "border-b md:border-b-0 md:border-r border-border/50"
          )}
          style={{ background: "rgba(15,23,42,0.6)" }}
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.04) 0%, transparent 70%)" }}
          />
          <div
            className={cn(
              "h-full transition-all duration-180",
              animating
                ? animDir === "next"
                  ? "opacity-0 translate-x-2"
                  : "opacity-0 -translate-x-2"
                : "opacity-100 translate-x-0"
            )}
            style={{ minHeight: 260 }}
          >
            <current.Visual />
          </div>
        </div>

        {/* ── Right: Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-0">
            <span className={cn(
              "inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px]",
              accent.tag
            )} style={{ fontWeight: 600 }}>
              {current.tag}
            </span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div
            className={cn(
              "flex-1 px-6 py-5 transition-all duration-180",
              animating
                ? animDir === "next"
                  ? "opacity-0 translate-y-2"
                  : "opacity-0 -translate-y-2"
                : "opacity-100 translate-y-0"
            )}
          >
            <h2 className="text-foreground mb-1 leading-tight" style={{ fontWeight: 700, fontSize: "1.35rem" }}>
              {current.title}
            </h2>
            <p className="text-muted-foreground/70 mb-4" style={{ fontSize: "0.85rem", fontWeight: 500 }}>
              {current.subtitle}
            </p>
            <p className="text-muted-foreground/60 leading-relaxed" style={{ fontSize: "0.8rem" }}>
              {current.desc}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex flex-col gap-4">
            {/* Step dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i === step || animating) return;
                    setAnimDir(i > step ? "next" : "prev");
                    setAnimating(true);
                    setTimeout(() => { setStep(i); setAnimating(false); }, 180);
                  }}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === step
                      ? cn("w-5 h-1.5", accent.dot)
                      : "w-1.5 h-1.5 bg-border/60 hover:bg-border"
                  )}
                />
              ))}
              <span className="ml-auto text-xs text-muted-foreground/40 tabular-nums">
                {step + 1} / {STEPS.length}
              </span>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3">
              {step > 0 ? (
                <button
                  onClick={() => go("prev")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-all text-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="text-sm text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2"
                >
                  Saltar tutorial
                </button>
              )}

              <button
                onClick={isLast ? handleFinish : () => go("next")}
                className={cn(
                  "ml-auto flex items-center gap-2 px-5 py-2 rounded-xl text-sm transition-all",
                  accent.btn
                )}
                style={{ fontWeight: 600 }}
              >
                {isLast ? (
                  <span className="contents">
                    <Play className="w-3.5 h-3.5" />
                    <span>¡Empezar!</span>
                  </span>
                ) : (
                  <span className="contents">
                    <span>Siguiente</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            </div>

            {/* Keyboard hint */}
            <div className="flex items-center justify-center gap-1.5">
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground/50 text-[10px]">←→</kbd>
              <span className="text-[10px] text-muted-foreground/40">navegar</span>
              <span className="text-[10px] text-muted-foreground/25 mx-1">·</span>
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground/50 text-[10px]">Esc</kbd>
              <span className="text-[10px] text-muted-foreground/40">cerrar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}