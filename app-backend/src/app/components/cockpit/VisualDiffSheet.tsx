/**
 * VisualDiffSheet — HITL Approval Visual Diff Panel
 * Shows Before vs After for AI-proposed changes
 * Human = círculo azul | AI = hexágono violeta
 */

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "../ui/sheet";
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Lightbulb,
  ListTodo,
  Scale,
  Shield,
  User,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiffField {
  key: string;
  label: string;
  before: string | number | null;
  after: string | number | null;
  changed: boolean;
  isNew?: boolean;
  risk?: "low" | "medium" | "high";
}

export interface VisualDiffItem {
  id: number;
  correlativeId: string;
  actionType: "CREATE" | "UPDATE" | "DELETE";
  entityType: "TASK" | "IDEA" | "PROJECT";
  agent: string;
  agentColor?: string;
  title: string;
  description: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  time: string;
  diff: DiffField[];
  rationale?: string;
  origin?: "n8n";
}

interface VisualDiffSheetProps {
  item: VisualDiffItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const entityIconMap: Record<string, React.ElementType> = {
  TASK: ListTodo,
  IDEA: Lightbulb,
  PROJECT: FileText,
};

const riskLabel: Record<string, string> = {
  low: "Bajo riesgo",
  medium: "Riesgo medio",
  high: "Riesgo alto",
};
const riskColor: Record<string, string> = {
  low:    "text-emerald-400",
  medium: "text-amber-400",
  high:   "text-rose-400",
};

type DiffRowWithAction = DiffField & { actionType?: string };

function DiffRow({ field }: { field: DiffField & { actionType?: string } }) {
  const beforeEmpty = field.before === null || field.before === "";
  const afterEmpty  = field.after  === null || field.after  === "";

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] gap-2 items-start px-4 py-2.5 rounded-xl border transition-all duration-150",
        field.changed
          ? field.actionType === "DELETE" || afterEmpty
            ? "bg-rose-500/5 border-rose-500/20"
            : field.isNew || beforeEmpty
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-amber-500/5 border-amber-500/20"
          : "bg-muted/10 border-border/40"
      )}
    >
      {/* Before */}
      <div className="min-w-0">
        {beforeEmpty ? (
          <span className="text-muted-foreground/30 italic" style={{ fontSize: 11 }}>—</span>
        ) : (
          <span
            className={cn(
              "text-xs break-words leading-relaxed",
              field.changed && !afterEmpty ? "text-rose-300 line-through opacity-60" : "text-muted-foreground"
            )}
          >
            {field.before}
          </span>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", field.changed ? "text-amber-400" : "text-muted-foreground/20")} />

      {/* After */}
      <div className="min-w-0">
        {afterEmpty ? (
          <span className="text-rose-400/60 italic" style={{ fontSize: 11 }}>Eliminated</span>
        ) : (
          <span
            className={cn(
              "text-xs break-words leading-relaxed",
              field.changed ? "text-foreground" : "text-muted-foreground"
            )}
            style={field.changed && !beforeEmpty ? { fontWeight: 600 } : {}}
          >
            {field.after}
            {field.changed && field.isNew && (
              <span className="ml-1.5 px-1 py-0.5 rounded text-emerald-400 bg-emerald-500/15 border border-emerald-500/25" style={{ fontSize: 9, fontWeight: 700 }}>
                NEW
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VisualDiffSheet({
  item,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: VisualDiffSheetProps) {
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);

  if (!item) return null;

  const EntityIcon = entityIconMap[item.entityType] ?? ListTodo;
  const changedCount = item.diff.filter((f) => f.changed).length;
  const agentColor = item.agentColor ?? "#8B5CF6";

  const urgencyColors: Record<string, string> = {
    HIGH:   "bg-red-500/15 text-red-400 border-red-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    LOW:    "bg-muted text-muted-foreground border-border",
  };

  const actionColors: Record<string, string> = {
    CREATE: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    UPDATE: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    DELETE: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };

  const handleApprove = () => {
    setConfirming("approve");
    setTimeout(() => {
      onApprove(item.id);
      setConfirming(null);
      onOpenChange(false);
      toast.success("Acción aprobada", {
        description: `${item.correlativeId} · ${item.title}`,
        icon: <Check className="w-3.5 h-3.5 text-emerald-400" />,
      });
    }, 600);
  };

  const handleReject = () => {
    setConfirming("reject");
    setTimeout(() => {
      onReject(item.id);
      setConfirming(null);
      onOpenChange(false);
      toast.error("Acción rechazada", {
        description: `${item.correlativeId} · ${item.title}`,
      });
    }, 600);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col bg-popover border-border/60"
      >
        <SheetTitle className="sr-only">Visual Diff — {item.correlativeId}</SheetTitle>
        <SheetDescription className="sr-only">
          Human-in-the-Loop approval panel showing Before and After comparison of AI-proposed changes.
        </SheetDescription>

        {/* ── Header */}
        <div className="shrink-0 border-b border-border/60">
          {/* Top gradient line */}
          <div className="h-0.5 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

          <div className="flex items-start gap-3 p-5">
            {/* Entity icon */}
            <div className="w-10 h-10 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center shrink-0">
              <EntityIcon className="w-5 h-5 text-muted-foreground/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs text-muted-foreground/60">{item.correlativeId}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border", actionColors[item.actionType])} style={{ fontWeight: 700 }}>
                  {item.actionType}
                </span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border", urgencyColors[item.urgency])} style={{ fontWeight: 600 }}>
                  {item.urgency}
                </span>
                {item.origin === "n8n" && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md border"
                    style={{ fontWeight: 700, backgroundColor: "#EA4B0015", borderColor: "#EA4B0040", color: "#EA4B00" }}
                  >
                    ⚡ vía n8n
                  </span>
                )}
              </div>
              <h3 className="text-foreground text-base truncate" style={{ fontWeight: 700 }}>
                {item.title}
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">{item.description}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/40">{item.time}</span>
            </div>
          </div>

          {/* Agent source row */}
          <div className="flex items-center gap-4 px-5 pb-4">
            {/* AI origin */}
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 flex items-center justify-center"
                style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  backgroundColor: `${agentColor}20`,
                  border: `1px solid ${agentColor}50`,
                }}
              >
                <Bot className="w-2.5 h-2.5" style={{ color: agentColor }} />
              </div>
              <span className="text-xs" style={{ color: agentColor, fontWeight: 600 }}>
                {item.agent}
              </span>
              <span className="text-muted-foreground/30 text-xs">→</span>
            </div>
            {/* Human target */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border border-blue-500/50 bg-blue-500/10 flex items-center justify-center">
                <User className="w-2.5 h-2.5 text-blue-400" />
              </div>
              <span className="text-blue-400 text-xs" style={{ fontWeight: 600 }}>Human Review</span>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/60">
                {changedCount} cambio{changedCount !== 1 ? "s" : ""} propuesto{changedCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Diff Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Visual Diff header */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            {/* Before column header */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/50 bg-muted/20">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-blue-300/80" style={{ fontWeight: 700 }}>ANTES · Estado actual</span>
            </div>
            <div className="w-6" />
            {/* After column header */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-violet-500/25 bg-violet-500/8">
              <div
                className="w-3.5 h-3.5 shrink-0"
                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", backgroundColor: agentColor, opacity: 0.8 }}
              />
              <span className="text-xs text-violet-300/80" style={{ fontWeight: 700 }}>DESPUÉS · Propuesto por IA</span>
            </div>
          </div>

          {/* Diff rows */}
          <div className="space-y-2">
            {item.diff.map((field) => (
              <div key={field.key}>
                <div className="flex items-center gap-2 mb-1 px-1">
                  <p className="text-muted-foreground/50 uppercase tracking-widest" style={{ fontSize: 9, fontWeight: 700 }}>
                    {field.label}
                  </p>
                  {field.risk && field.changed && (
                    <span className={cn("text-[9px]", riskColor[field.risk])}>
                      {field.risk === "high" && <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />}
                      {riskLabel[field.risk]}
                    </span>
                  )}
                </div>
                <DiffRow field={{ ...field, actionType: item.actionType } as DiffRowWithAction} />
              </div>
            ))}
          </div>

          {/* AI Rationale */}
          {item.rationale && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-violet-300/80" style={{ fontWeight: 600 }}>Razonamiento del Agente</span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{item.rationale}</p>
            </div>
          )}

          {/* HITL warning for high-risk items */}
          {item.urgency === "HIGH" && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/5">
              <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300/80 text-xs leading-relaxed">
                Esta acción tiene urgencia <strong>ALTA</strong> y requiere tu aprobación explícita antes de ejecutarse. El agente permanecerá bloqueado hasta que decidas.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer actions */}
        <div className="shrink-0 border-t border-border/60 p-4 flex items-center gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all text-sm"
          >
            Cerrar
          </button>
          <div className="flex-1" />
          {/* Reject */}
          <button
            onClick={handleReject}
            disabled={confirming !== null}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all duration-200 disabled:opacity-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            {confirming === "reject" ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-300/30 border-t-rose-300 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5" />
            )}
            Rechazar
          </button>
          {/* Approve */}
          <button
            onClick={handleApprove}
            disabled={confirming !== null}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-lg shadow-blue-950/40 transition-all duration-200 disabled:opacity-50 text-sm"
            style={{ fontWeight: 600 }}
          >
            {confirming === "approve" ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Aprobar & Ejecutar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}