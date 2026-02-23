import * as React from "react";
import {
  Lightbulb, ListTodo, FolderKanban, FileText,
  Plus, X, AlertTriangle, RotateCcw, Sparkles,
  Brain, ChevronDown, Loader2, CheckCircle2, Clock,
} from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import { callAIRouter, type AITaskType } from "../../services/api";

// ─── Types ─────────────────────────────────────────────────────────────────

type EntityKind = "IDEA" | "TASK" | "PROJECT" | "DOCUMENT";

interface EntityConfig {
  kind: EntityKind;
  label: string;
  prefix: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgColor: string;
  ringColor: string;
  description: string;
}

const ENTITY_CONFIGS: EntityConfig[] = [
  {
    kind: "IDEA",
    label: "Nueva Idea",
    prefix: "IDEA",
    icon: Lightbulb,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    ringColor: "focus-within:ring-amber-500/40",
    description: "Captura una idea estratégica para evaluarla en la Incubadora",
  },
  {
    kind: "TASK",
    label: "Nueva Tarea",
    prefix: "TASK",
    icon: ListTodo,
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    ringColor: "focus-within:ring-blue-500/40",
    description: "Crea una tarea asignable a ti o a un agente de IA",
  },
  {
    kind: "PROJECT",
    label: "Nuevo Proyecto",
    prefix: "PROJ",
    icon: FolderKanban,
    color: "text-violet-400",
    borderColor: "border-violet-500/30",
    bgColor: "bg-violet-500/10",
    ringColor: "focus-within:ring-violet-500/40",
    description: "Inicia un proyecto con hitos, equipo y seguimiento de IA",
  },
  {
    kind: "DOCUMENT",
    label: "Nuevo Documento",
    prefix: "DOC",
    icon: FileText,
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
    ringColor: "focus-within:ring-emerald-500/40",
    description: "Redacta un documento estratégico asistido por el agente Writer",
  },
];

// ─── Counter helpers ────────────────────────────────────────────────────────

function peekNextId(prefix: string): string {
  const key = `cerebrin_counter_${prefix}`;
  const current = parseInt(localStorage.getItem(key) ?? "0", 10);
  return `${prefix}-${String(current + 1).padStart(3, "0")}`;
}

function consumeNextId(prefix: string): string {
  const key = `cerebrin_counter_${prefix}`;
  const current = parseInt(localStorage.getItem(key) ?? "0", 10);
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return `${prefix}-${String(next).padStart(3, "0")}`;
}

function decrementCounter(prefix: string) {
  const key = `cerebrin_counter_${prefix}`;
  const current = parseInt(localStorage.getItem(key) ?? "0", 10);
  if (current > 0) localStorage.setItem(key, String(current - 1));
}

// ─── Creation Dialog ────────────────────────────────────────────────────────

interface CreateDialogProps {
  config: EntityConfig | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function CreateDialog({ config, open, onOpenChange }: CreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const nextId = config ? peekNextId(config.prefix) : "";

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setConfirmOpen(false);
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [open]);

  if (!config) return null;

  const Icon = config.icon;
  const canSubmit = title.trim().length > 0;

  const handleRequestCreate = () => {
    if (!canSubmit) return;
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    const id = consumeNextId(config.prefix);
    const label = config.label.replace("Nuevo", "").replace("Nueva", "").trim();
    setConfirmOpen(false);
    onOpenChange(false);

    // Show toast with undo
    toast.success(`${label} creado`, {
      description: (
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs opacity-60">{id}</span>
          <span className="truncate max-w-[160px]">{title.trim()}</span>
        </span>
      ),
      action: {
        label: "Deshacer",
        onClick: () => {
          decrementCounter(config.prefix);
          toast("Creación deshecha", {
            description: `${label} "${title.trim()}" eliminado`,
            icon: <RotateCcw className="w-3.5 h-3.5" />,
          });
        },
      },
      duration: 6000,
    });
  };

  return (
    <div>
      {/* ── Creation form dialog */}
      <Dialog open={open && !confirmOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border border-border shadow-2xl rounded-2xl p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3 mb-1">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center border",
                config.bgColor, config.borderColor
              )}>
                <Icon className={cn("w-4.5 h-4.5", config.color)} />
              </div>
              <div>
                <DialogTitle className="text-foreground text-sm" style={{ fontWeight: 700 }}>
                  {config.label}
                </DialogTitle>
                <div className={cn("font-mono text-[10px] mt-0.5", config.color)}>
                  {nextId}
                </div>
              </div>
            </div>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              {config.description}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <div className="px-6 py-5 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                Título <span className="text-destructive">*</span>
              </label>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-muted/40 ring-2 ring-transparent transition-all",
                config.ringColor
              )}>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSubmit) handleRequestCreate();
                    if (e.key === "Escape") onOpenChange(false);
                  }}
                  placeholder={`Nombre del ${config.label.toLowerCase()}...`}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                Descripción <span className="text-muted-foreground/40">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Contexto inicial, objetivo, alcance..."
                className={cn(
                  "w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground",
                  "placeholder:text-muted-foreground/40 outline-none resize-none",
                  "ring-2 ring-transparent transition-all", config.ringColor
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between gap-3 bg-muted/20">
            <div className="text-[10px] text-muted-foreground/40 font-mono">
              ID asignado: <span className={cn("font-mono", config.color)}>{nextId}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl text-xs text-muted-foreground border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestCreate}
                disabled={!canSubmit}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs border transition-all",
                  canSubmit
                    ? cn(config.bgColor, config.borderColor, config.color, "hover:opacity-80")
                    : "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                )}
                style={{ fontWeight: 600 }}
              >
                Crear {config.label.replace("Nuevo", "").replace("Nueva", "").trim()}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation alert dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <AlertDialogTitle className="text-foreground text-sm" style={{ fontWeight: 700 }}>
                Confirmar creación
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground text-xs space-y-2">
              <span className="block">
                Se creará <span className="font-mono text-foreground/80">{nextId}</span> con el título:
              </span>
              <span className="block px-3 py-2 rounded-lg bg-muted/60 border border-border text-foreground text-xs truncate">
                {title.trim()}
              </span>
              <span className="block mt-1 text-muted-foreground/60">
                Podrás deshacer esta acción durante los próximos 6 segundos desde la notificación.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-2">
            <AlertDialogCancel className="rounded-xl text-xs border-border">
              Volver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                "rounded-xl text-xs border transition-all",
                config.bgColor, config.borderColor, config.color,
                "bg-transparent hover:opacity-80"
              )}
              style={{ fontWeight: 600 }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Quick Create Bar ───────────────────────────────────────────────────────

export function QuickCreateBar({ onApprovalRequired, onBudgetExceeded }: {
  onApprovalRequired?: () => void;
  onBudgetExceeded?: (data?: { budgetRemaining?: number; limitUsd?: number; agentName?: string; taskType?: string }) => void;
}) {
  const [activeConfig, setActiveConfig] = useState<EntityConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);

  const handleOpen = (config: EntityConfig) => {
    setActiveConfig(config);
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        {/* Label */}
        <div className="flex items-center gap-1.5 shrink-0 mr-1">
          <Sparkles className="w-3 h-3 text-violet-400" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest" style={{ fontWeight: 600 }}>
            Crear
          </span>
        </div>

        {/* Entity buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {ENTITY_CONFIGS.map((cfg) => {
            const BtnIcon = cfg.icon;
            return (
              <button
                key={cfg.kind}
                onClick={() => handleOpen(cfg)}
                className={cn(
                  "group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs",
                  "transition-all duration-150 hover:scale-105 active:scale-95",
                  cfg.bgColor, cfg.borderColor, cfg.color,
                  "hover:brightness-110"
                )}
                style={{ fontWeight: 600 }}
                title={cfg.description}
              >
                <Plus className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                <BtnIcon className="w-3 h-3" />
                <span>{cfg.label}</span>
              </button>
            );
          })}

          {/* ── AI Task Router button ── */}
          <button
            onClick={() => setAiDialogOpen(true)}
            className={cn(
              "group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs",
              "transition-all duration-150 hover:scale-105 active:scale-95",
              "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:brightness-110"
            )}
            style={{ fontWeight: 600 }}
            title="Enviar tarea al AI Router con HITL"
          >
            <Brain className="w-3 h-3" />
            <span>Tarea IA</span>
          </button>
        </div>
      </div>

      <CreateDialog
        config={activeConfig}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <AITaskDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onApprovalRequired={onApprovalRequired}
        onBudgetExceeded={onBudgetExceeded}
      />
    </div>
  );
}

// ─── AI Task Dialog ─────────────────────────────────────────────────────────

const TASK_TYPE_META: Record<AITaskType, { label: string; desc: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  ROUTINE:    { label: "Routine",    desc: "Tarea estándar — ejecución directa por el agente",               color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
  STRATEGIC:  { label: "Strategic",  desc: "Decisión de alto impacto — requiere aprobación HITL",            color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  icon: Brain        },
  HIGH_RISK:  { label: "High Risk",  desc: "Acción irreversible — nivel de aprobación máximo requerido",     color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: AlertTriangle },
};

const AGENT_OPTIONS = [
  { id: "writer",   name: "writer-bot",   color: "#8B5CF6" },
  { id: "analyst",  name: "analyst-bot",  color: "#3B82F6" },
  { id: "strategy", name: "strategy-bot", color: "#10B981" },
  { id: "dev",      name: "dev-bot",      color: "#F59E0B" },
];

function AITaskDialog({
  open,
  onOpenChange,
  onApprovalRequired,
  onBudgetExceeded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApprovalRequired?: () => void;
  onBudgetExceeded?: (data?: { budgetRemaining?: number; limitUsd?: number; agentName?: string; taskType?: string }) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [taskType, setTaskType] = useState<AITaskType>("ROUTINE");
  const [agentId, setAgentId] = useState("writer");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setPrompt("");
      setTaskType("ROUTINE");
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await callAIRouter({
        workspaceId: "ws_demo_01",
        agentId,
        prompt: prompt.trim(),
        taskType,
        userId: "usr_super_01",
      });

      if (res.status === "AWAITING_HUMAN_APPROVAL") {
        onOpenChange(false);
        toast.warning("Aprobación requerida", {
          description: `Nivel requerido: ${res.required_level} · Actual: ${res.current_level} · La tarea espera revisión humana`,
          duration: 8000,
          action: {
            label: "Ver cola",
            onClick: () => onApprovalRequired?.(),
          },
        });
        // Auto-open approval panel
        onApprovalRequired?.();
      } else if (res.status === "BUDGET_EXCEEDED") {
        onOpenChange(false);
        toast.error("TCO Shield · Presupuesto agotado", {
          description: `Disponible: $${res.budget_remaining?.toFixed(2) ?? "0.00"} / $${res.limit_usd ?? 150} USD`,
          duration: 8000,
          action: { label: "Ver detalles", onClick: () => onBudgetExceeded?.({
            budgetRemaining: res.budget_remaining,
            limitUsd: res.limit_usd,
            agentName: agentId,
            taskType,
          }) },
        });
        onBudgetExceeded?.({
          budgetRemaining: res.budget_remaining,
          limitUsd: res.limit_usd,
          agentName: `${agentId}-bot`,
          taskType,
        });
      } else {
        onOpenChange(false);
        toast.success("Tarea enviada al agente", {
          description: res.result ?? `Task ID: ${res.taskId}`,
        });
      }
    } catch {
      toast.error("Error al enviar la tarea", { description: "Verifica la conexión con /api/ai" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border shadow-2xl rounded-3xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-foreground text-sm" style={{ fontWeight: 700 }}>
                Tarea al AI Router
              </DialogTitle>
              <p className="text-indigo-400/60 font-mono" style={{ fontSize: 10 }}>POST /api/ai</p>
            </div>
          </div>
          <DialogDescription className="text-muted-foreground text-xs mt-1">
            El router analiza el tipo de tarea y aplica el protocolo HITL correspondiente
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {/* Task type selector */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontWeight: 600 }}>
              Tipo de Tarea
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.entries(TASK_TYPE_META) as [AITaskType, typeof TASK_TYPE_META[AITaskType]][]).map(([type, meta]) => {
                const Icon = meta.icon;
                const isActive = taskType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setTaskType(type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border transition-all",
                      isActive ? cn(meta.bg, meta.border) : "bg-muted/20 border-border/50 hover:border-border"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? meta.color : "text-muted-foreground/30")} />
                    <span className={cn("text-[10px]", isActive ? meta.color : "text-muted-foreground/40")} style={{ fontWeight: isActive ? 700 : 400 }}>
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-muted-foreground/40 text-[10px] mt-2">{TASK_TYPE_META[taskType].desc}</p>
          </div>

          {/* Agent selector */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontWeight: 600 }}>
              Agente
            </label>
            <div className="flex items-center gap-2">
              {AGENT_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAgentId(a.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                    agentId === a.id
                      ? "border-border bg-muted/60"
                      : "border-border/40 text-muted-foreground/50 hover:border-border hover:text-muted-foreground"
                  )}
                >
                  <div
                    className="w-3 h-3 shrink-0"
                    style={{
                      clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
                      backgroundColor: `${a.color}20`,
                      border: `1px solid ${a.color}50`,
                    }}
                  />
                  <span style={{ fontSize: 10, fontWeight: agentId === a.id ? 700 : 400 }}>{a.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontWeight: 600 }}>
              Instrucción al Agente <span className="text-destructive">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe la tarea que el agente debe ejecutar..."
              className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>

          {/* HITL warning */}
          {(taskType === "STRATEGIC" || taskType === "HIGH_RISK") && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-400/80 text-xs leading-relaxed">
                Esta tarea requerirá aprobación humana antes de ejecutarse. Se añadirá a la cola HITL.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-end gap-3 bg-muted/20">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs text-muted-foreground border border-border hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs text-white transition-all",
              !prompt.trim() || loading
                ? "bg-muted border border-border text-muted-foreground cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40"
            )}
            style={{ fontWeight: 600 }}
          >
            {loading ? (
              <><Loader2 className="w-3 h-3 animate-spin" />Enviando…</>
            ) : (
              <><Brain className="w-3 h-3" />Enviar al Router</>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}