import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Lightbulb, X } from "lucide-react";
import { cn } from "../ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CaptureIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture?: (idea: {
    title: string;
    description: string;
    priority: number;
  }) => void;
}

// ─── Glassmorphism Overlay ────────────────────────────────────────────────────

function GlassOverlay() {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50",
        "backdrop-blur-xl",
        "bg-slate-950/70",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "duration-200"
      )}
    />
  );
}

// ─── Field Label ──────────────────────────────────────────────────────────────

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label
        className="text-slate-500 uppercase tracking-widest"
        style={{ fontSize: "10px", fontWeight: 600 }}
      >
        {children}
      </label>
      {hint && (
        <span className="text-slate-700" style={{ fontSize: "10px" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

// ─── Priority Pill Selector ───────────────────────────────────────────────────

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low priority",
  medium: "Medium priority",
  high: "High priority",
  critical: "Critical",
};

function getPriorityLevel(n: number) {
  if (n <= 3) return "low";
  if (n <= 6) return "medium";
  if (n <= 8) return "high";
  return "critical";
}

function PriorityPills({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const selectedLevel = getPriorityLevel(value);

  const activeStyles: Record<string, string> = {
    low: "bg-emerald-500/15 border-emerald-500/50 text-emerald-300",
    medium: "bg-amber-500/15 border-amber-500/50 text-amber-300",
    high: "bg-orange-500/15 border-orange-500/50 text-orange-300",
    critical: "bg-rose-500/15 border-rose-500/60 text-rose-300",
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isSelected = value === n;
          const level = getPriorityLevel(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={cn(
                "flex-1 h-8 rounded-xl border text-xs transition-all duration-150",
                "flex items-center justify-center shrink-0",
                isSelected
                  ? activeStyles[level]
                  : "bg-slate-800/50 border-slate-700/40 text-slate-600 hover:border-slate-600 hover:text-slate-400"
              )}
              style={{ fontWeight: isSelected ? 700 : 400 }}
            >
              {n}
            </button>
          );
        })}
      </div>
      {/* Level indicator */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {(["low", "medium", "high", "critical"] as const).map((lvl) => (
            <div
              key={lvl}
              className={cn(
                "h-0.5 w-8 rounded-full transition-all duration-300",
                lvl === "low" && "bg-emerald-500/40",
                lvl === "medium" && "bg-amber-500/40",
                lvl === "high" && "bg-orange-500/40",
                lvl === "critical" && "bg-rose-500/40",
                lvl === selectedLevel && "opacity-100",
                lvl !== selectedLevel && "opacity-20"
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "transition-colors duration-200",
            selectedLevel === "low" && "text-emerald-400",
            selectedLevel === "medium" && "text-amber-400",
            selectedLevel === "high" && "text-orange-400",
            selectedLevel === "critical" && "text-rose-400"
          )}
          style={{ fontSize: "10px", fontWeight: 600 }}
        >
          {PRIORITY_LABELS[selectedLevel]} · {value}/10
        </span>
      </div>
    </div>
  );
}

// ─── Capture Idea Modal ───────────────────────────────────────────────────────

const inputBase = [
  "w-full px-3.5 py-2.5 rounded-2xl text-sm text-slate-200",
  "placeholder:text-slate-700 outline-none",
  "bg-slate-800/60 border border-slate-700/40",
  "transition-all duration-150",
  "focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10",
  "hover:border-slate-600/60",
].join(" ");

export function CaptureIdeaModal({
  open,
  onOpenChange,
  onCapture,
}: CaptureIdeaModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState(5);
  const [captured, setCaptured] = React.useState(false);

  const canSubmit = title.trim().length > 0;

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriority(5);
    setCaptured(false);
  };

  const handleCapture = () => {
    if (!canSubmit) return;
    onCapture?.({ title: title.trim(), description: description.trim(), priority });
    setCaptured(true);
    setTimeout(() => {
      reset();
      onOpenChange(false);
    }, 700);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogPrimitive.Portal>
        <GlassOverlay />

        <DialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] z-50",
            "-translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md",
            /* Modal surface */
            "bg-[#111926] border border-slate-700/40",
            "rounded-2xl",
            "shadow-2xl shadow-slate-950/80",
            /* Subtle inner highlight */
            "ring-1 ring-white/[0.04]",
            /* Animations */
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-top-2",
            "duration-200"
          )}
        >
          {/* Top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-300 hover:bg-slate-700/60 transition-all duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="p-6">
            {/* ── Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <DialogPrimitive.Title
                  className="text-slate-100 text-base"
                  style={{ fontWeight: 700 }}
                >
                  Capture Idea
                </DialogPrimitive.Title>
                <p className="text-slate-600 mt-0.5" style={{ fontSize: "11px" }}>
                  Log a strategic signal before it disappears
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-800/80 mb-5" />

            {/* ── Form fields */}
            <div className="space-y-4">

              {/* Idea Title */}
              <div>
                <FieldLabel>Idea Title</FieldLabel>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCapture()}
                  placeholder="What's the idea?"
                  className={inputBase}
                />
              </div>

              {/* Quick Description */}
              <div>
                <FieldLabel hint="Optional">Quick Description</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Context, problem statement, or first principles…"
                  rows={3}
                  className={cn(inputBase, "resize-none leading-relaxed")}
                />
              </div>

              {/* Priority */}
              <div>
                <FieldLabel>Priority</FieldLabel>
                <PriorityPills value={priority} onChange={setPriority} />
              </div>
            </div>

            {/* ── Footer */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleClose}
                className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all duration-150"
                style={{ fontSize: "13px" }}
              >
                Cancel
              </button>

              <button
                onClick={handleCapture}
                disabled={!canSubmit}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-200",
                  canSubmit && !captured
                    ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/50 border border-violet-500/40"
                    : captured
                    ? "bg-emerald-600/80 text-white border border-emerald-500/40"
                    : "bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-700/30"
                )}
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {captured ? "Captured ✓" : "Capture"}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}