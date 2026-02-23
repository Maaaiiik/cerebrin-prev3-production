import { useEffect, useState } from "react";
import {
  Bot,
  Calendar,
  ChevronRight,
  FolderKanban,
  Keyboard,
  Lightbulb,
  Rocket,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { CaptureIdeaModal } from "./CaptureIdeaModal";
import { CreateProjectModal } from "./CreateProjectModal";

// ─── Captured / deployed log entries ─────────────────────────────────────────

interface LogEntry {
  id: string;
  type: "idea" | "project";
  label: string;
  detail: string;
  ts: string;
}

// ─── Feature pill ─────────────────────────────────────────────────────────────

function FeaturePill({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border",
        color
      )}
      style={{ fontSize: "11px" }}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {label}
    </span>
  );
}

// ─── Modal trigger card ───────────────────────────────────────────────────────

function ModalCard({
  icon: Icon,
  iconBg,
  iconColor,
  accentBar,
  title,
  subtitle,
  features,
  kbd,
  buttonLabel,
  buttonClass,
  onClick,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentBar: string;
  title: string;
  subtitle: string;
  features: { icon: React.ElementType; label: string; color: string }[];
  kbd: string;
  buttonLabel: string;
  buttonClass: string;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 overflow-hidden",
        "hover:border-slate-600/60 transition-all duration-200 group"
      )}
    >
      {/* Top accent bar */}
      <div className={cn("h-0.5 w-full", accentBar)} />

      <div className="p-6 flex flex-col gap-5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                iconBg
              )}
            >
              <Icon className={cn("w-5 h-5", iconColor)} />
            </div>
            <div>
              <h3
                className="text-slate-100"
                style={{ fontSize: "15px", fontWeight: 700 }}
              >
                {title}
              </h3>
              <p className="text-slate-600 mt-0.5" style={{ fontSize: "11px" }}>
                {subtitle}
              </p>
            </div>
          </div>

          {/* Keyboard shortcut badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 border border-slate-700/50 rounded-lg shrink-0">
            <Keyboard className="w-2.5 h-2.5 text-slate-600" />
            <span className="text-slate-600 font-mono" style={{ fontSize: "10px" }}>
              {kbd}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800" />

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          {features.map((f) => (
            <FeaturePill key={f.label} icon={f.icon} label={f.label} color={f.color} />
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA button */}
        <button
          onClick={onClick}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border transition-all duration-150",
            buttonClass
          )}
          style={{ fontSize: "13px", fontWeight: 600 }}
        >
          {buttonLabel}
          <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// ─── Activity log item ────────────────────────────────────────────────────────

function LogItem({ entry }: { entry: LogEntry }) {
  const isIdea = entry.type === "idea";
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-800/60 last:border-b-0">
      <div
        className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isIdea
            ? "bg-violet-500/10 border border-violet-500/20"
            : "bg-blue-500/10 border border-blue-500/20"
        )}
      >
        {isIdea ? (
          <Lightbulb className="w-3 h-3 text-violet-400" />
        ) : (
          <Rocket className="w-3 h-3 text-blue-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-slate-300 truncate"
          style={{ fontSize: "12px", fontWeight: 600 }}
        >
          {entry.label}
        </p>
        <p className="text-slate-600" style={{ fontSize: "10px" }}>
          {entry.detail}
        </p>
      </div>
      <span className="text-slate-700 shrink-0 tabular-nums" style={{ fontSize: "10px" }}>
        {entry.ts}
      </span>
    </div>
  );
}

// ─── Modal Showcase ───────────────────────────────────────────────────────────

export function ModalShowcase() {
  const [captureOpen, setCaptureOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const active = document.activeElement;
        if (
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement
        )
          return;
        setCaptureOpen(true);
      }
      if (e.key === "p" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const active = document.activeElement;
        if (
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement
        )
          return;
        setProjectOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleCapture = (idea: {
    title: string;
    description: string;
    priority: number;
  }) => {
    setLog((prev) => [
      {
        id: Date.now().toString(),
        type: "idea",
        label: idea.title,
        detail: `Priority ${idea.priority}/10 · ${idea.description ? idea.description.slice(0, 48) + "…" : "No description"}`,
        ts: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      },
      ...prev,
    ]);
  };

  const handleDeploy = (project: {
    name: string;
    workspace: string;
    template: string;
  }) => {
    const ws = { ebox: "Ebox.lat", internal: "Cerebrin Internal", latam: "LATAM Expansion" }[project.workspace] ?? project.workspace;
    const tpl = { sprint: "Sprint Execution", research: "Research & Define", scale: "Scale & Optimize" }[project.template] ?? project.template;
    setLog((prev) => [
      {
        id: Date.now().toString(),
        type: "project",
        label: project.name,
        detail: `${ws} · ${tpl}`,
        ts: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      },
      ...prev,
    ]);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-6 py-8">

        {/* ── Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span className="text-slate-600 text-xs uppercase tracking-widest" style={{ fontWeight: 600 }}>
              UI Component Library
            </span>
          </div>
          <h1
            className="text-slate-100 mb-2"
            style={{ fontSize: "22px", fontWeight: 700 }}
          >
            Modal Dialogs
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
            Two distinct interaction patterns — ultra-minimal idea capture and a structured project deployment form. Both use glassmorphism overlays and context-aware focus rings.
          </p>
        </div>

        {/* ── Modal trigger cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

          {/* Capture Idea */}
          <ModalCard
            icon={Lightbulb}
            iconBg="bg-violet-500/10 border-violet-500/20"
            iconColor="text-violet-400"
            accentBar="bg-gradient-to-r from-transparent via-violet-500/60 to-transparent"
            title="Capture Idea"
            subtitle="Ultra-minimalist · 3 inputs · frictionless"
            features={[
              { icon: Lightbulb, label: "Idea Title", color: "bg-slate-800/60 border-slate-700/50 text-slate-500" },
              { icon: Zap, label: "Quick Description", color: "bg-slate-800/60 border-slate-700/50 text-slate-500" },
              { icon: Sparkles, label: "Priority 1–10", color: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
            ]}
            kbd="N"
            buttonLabel="Open Capture Idea"
            buttonClass="bg-violet-600/80 hover:bg-violet-600 text-white border-violet-500/40 shadow-sm shadow-violet-950/40"
            onClick={() => setCaptureOpen(true)}
          />

          {/* Create Project */}
          <ModalCard
            icon={Rocket}
            iconBg="bg-blue-500/10 border-blue-500/20"
            iconColor="text-blue-400"
            accentBar="bg-gradient-to-r from-transparent via-blue-500/60 to-transparent"
            title="Create Master Project"
            subtitle="Structured · 2-column · full governance"
            features={[
              { icon: FolderKanban, label: "Name & Workspace", color: "bg-slate-800/60 border-slate-700/50 text-slate-500" },
              { icon: Calendar, label: "Target Date", color: "bg-slate-800/60 border-slate-700/50 text-slate-500" },
              { icon: Users, label: "Assign Team", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
              { icon: Bot, label: "AI Agents", color: "bg-violet-500/10 border-violet-500/20 text-violet-400" },
              { icon: Zap, label: "Process Template", color: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
            ]}
            kbd="P"
            buttonLabel="Open Create Project"
            buttonClass="bg-blue-600/80 hover:bg-blue-600 text-white border-blue-500/40 shadow-sm shadow-blue-950/40"
            onClick={() => setProjectOpen(true)}
          />
        </div>

        {/* ── Design spec callout */}
        <div className="rounded-2xl border border-slate-700/40 bg-slate-800/20 p-5 mb-8">
          <p
            className="text-slate-500 mb-3 uppercase tracking-widest"
            style={{ fontSize: "10px", fontWeight: 600 }}
          >
            Design Spec
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Overlay", value: "backdrop-blur-xl + bg-slate-950/70" },
              { label: "Modal surface", value: "#111926 · ring-1 ring-white/4" },
              { label: "Border radius", value: "rounded-2xl (16px)" },
              { label: "Idea focus ring", value: "violet-500/60 · ring-2" },
              { label: "Project focus ring", value: "blue-500/60 · ring-2" },
              { label: "Primary actions", value: "violet (Capture) / blue (Deploy)" },
            ].map((spec) => (
              <div key={spec.label}>
                <p
                  className="text-slate-600 mb-0.5"
                  style={{ fontSize: "10px", fontWeight: 600 }}
                >
                  {spec.label}
                </p>
                <p className="text-slate-400 font-mono" style={{ fontSize: "11px" }}>
                  {spec.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Activity log */}
        {log.length > 0 && (
          <div className="rounded-2xl border border-slate-700/40 bg-slate-800/20 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <p
                className="text-slate-500 uppercase tracking-widest"
                style={{ fontSize: "10px", fontWeight: 600 }}
              >
                Captured this session
              </p>
              <span className="text-slate-700 tabular-nums" style={{ fontSize: "10px" }}>
                {log.length} item{log.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="px-5 divide-y divide-slate-800/40">
              {log.map((entry) => (
                <LogItem key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state for log */}
        {log.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center mb-1">
              <Sparkles className="w-4 h-4 text-slate-700" />
            </div>
            <p className="text-slate-600 text-sm">No items captured yet</p>
            <p className="text-slate-700" style={{ fontSize: "11px" }}>
              Open a modal above and submit it — captured ideas and deployed projects will appear here
            </p>
          </div>
        )}
      </div>

      {/* ── Modals */}
      <CaptureIdeaModal
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        onCapture={handleCapture}
      />
      <CreateProjectModal
        open={projectOpen}
        onOpenChange={setProjectOpen}
        onDeploy={handleDeploy}
      />
    </div>
  );
}
