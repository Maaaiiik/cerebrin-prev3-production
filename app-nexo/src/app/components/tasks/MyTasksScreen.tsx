import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Command,
  ExternalLink,
  FolderOpen,
  HelpCircle,
  Lock,
  Plus,
  Tag,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../ui/utils";
import { format, parseISO } from "date-fns";
import { UniversalTaskSheet, type UniversalEntity } from "../shared/UniversalTaskSheet";
import {
  useViewConfig,
  ViewConfigCtx,
  useVC,
  ViewCustomizerTrigger,
  ViewCustomizerPanel,
  type VCField,
} from "../shared/ViewCustomizer";
import { useUserPerspective } from "../../contexts/UserPerspective";
import { useResponsive } from "../../hooks/useResponsive";
import { usePullToRefresh } from "../../hooks/useSwipeGestures";
import { ShadowChat } from "./ShadowChat";
import { ShadowChatMobile } from "./ShadowChatMobile";
import { Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Subtask {
  id: string;
  title: string;
  status: "PENDING" | "COMPLETED";
}

interface Task {
  id: string;
  correlativeId?: string;
  title: string;
  due_date: string; // YYYY-MM-DD
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: "PENDING" | "COMPLETED";
  project?: string;
  subtasks?: Subtask[];
}

interface MyTasksScreenProps {
  onNavigate: (section: string) => void;
  onOpenCommand: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TODAY = "2026-02-20";
const WEEK_END = "2026-02-27";

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  // Overdue
  {
    id: "ov1",
    correlativeId: "TASK-014",
    title: "Finalize investor deck revisions",
    due_date: "2026-01-30",
    priority: "HIGH",
    status: "PENDING",
    project: "Revenue Ops",
    subtasks: [
      { id: "ov1-s1", title: "Review all slide content", status: "COMPLETED" },
      { id: "ov1-s2", title: "Update financial projections", status: "PENDING" },
      { id: "ov1-s3", title: "Get legal sign-off", status: "PENDING" },
    ],
  },
  {
    id: "ov2",
    correlativeId: "TASK-015",
    title: "Submit Q4 expense reports",
    due_date: "2026-02-01",
    priority: "MEDIUM",
    status: "PENDING",
    project: "Admin",
  },

  // Today
  {
    id: "td1",
    correlativeId: "TASK-016",
    title: "Review LATAM market campaign brief",
    due_date: "2026-02-20",
    priority: "HIGH",
    status: "PENDING",
    project: "LATAM Expansion",
    subtasks: [
      { id: "td1-s1", title: "Read full campaign brief", status: "COMPLETED" },
      { id: "td1-s2", title: "Verify budget allocation", status: "PENDING" },
      { id: "td1-s3", title: "Review timeline with LATAM team", status: "PENDING" },
      { id: "td1-s4", title: "Submit approval memo", status: "PENDING" },
    ],
  },
  {
    id: "td2",
    correlativeId: "TASK-017",
    title: "Approve Platform 3.0 wireframes",
    due_date: "2026-02-20",
    priority: "HIGH",
    status: "PENDING",
    project: "Platform 3.0",
    subtasks: [
      { id: "td2-s1", title: "Review homepage flow", status: "COMPLETED" },
      { id: "td2-s2", title: "Review checkout flow", status: "COMPLETED" },
      { id: "td2-s3", title: "Review onboarding screens", status: "COMPLETED" },
    ],
  },
  {
    id: "td3",
    correlativeId: "TASK-018",
    title: "Weekly team standup notes",
    due_date: "2026-02-20",
    priority: "LOW",
    status: "COMPLETED",
  },
  {
    id: "td4",
    correlativeId: "TASK-019",
    title: "Update personal OKRs for Q1",
    due_date: "2026-02-20",
    priority: "MEDIUM",
    status: "PENDING",
    project: "Strategy",
  },
  {
    id: "td5",
    correlativeId: "TASK-020",
    title: "Reply to FinoTech partnership inquiry",
    due_date: "2026-02-20",
    priority: "MEDIUM",
    status: "PENDING",
  },

  // This Week
  {
    id: "tw1",
    correlativeId: "TASK-021",
    title: "Prepare board deck for strategy review",
    due_date: "2026-02-23",
    priority: "HIGH",
    status: "PENDING",
    project: "Strategy",
    subtasks: [
      { id: "tw1-s1", title: "Gather Q1 KPI data", status: "COMPLETED" },
      { id: "tw1-s2", title: "Draft executive summary", status: "COMPLETED" },
      { id: "tw1-s3", title: "Design slide deck", status: "PENDING" },
      { id: "tw1-s4", title: "Add financial appendix", status: "PENDING" },
      { id: "tw1-s5", title: "Rehearse with team", status: "PENDING" },
    ],
  },
  {
    id: "tw2",
    correlativeId: "TASK-022",
    title: "Review Q1 content calendar",
    due_date: "2026-02-24",
    priority: "LOW",
    status: "PENDING",
    project: "Marketing",
  },
  {
    id: "tw3",
    correlativeId: "TASK-023",
    title: "Sync with dev team on API rollout timeline",
    due_date: "2026-02-25",
    priority: "HIGH",
    status: "PENDING",
    project: "Platform 3.0",
    subtasks: [
      { id: "tw3-s1", title: "Prepare technical questions", status: "COMPLETED" },
      { id: "tw3-s2", title: "Review current API timeline", status: "COMPLETED" },
      { id: "tw3-s3", title: "Document blocker list", status: "PENDING" },
    ],
  },
  {
    id: "tw4",
    correlativeId: "TASK-024",
    title: "Submit partner onboarding proposal",
    due_date: "2026-02-26",
    priority: "MEDIUM",
    status: "PENDING",
    project: "Growth",
  },
  {
    id: "tw5",
    correlativeId: "TASK-025",
    title: "End-of-week progress report for stakeholders",
    due_date: "2026-02-27",
    priority: "LOW",
    status: "PENDING",
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDueDate(dateStr: string, group: "overdue" | "today" | "thisWeek"): string {
  if (group === "today") return "Today";
  const date = parseISO(dateStr);
  if (group === "overdue") return format(date, "MMM d");
  return format(date, "EEE, MMM d");
}

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  HIGH: "bg-rose-500/55",
  MEDIUM: "bg-amber-400/40",
  LOW: "",
};

function getTaskProgress(task: Task): {
  done: number;
  total: number;
  pct: number;
  isBlocked: boolean;
} {
  if (!task.subtasks || task.subtasks.length === 0) {
    return { done: 0, total: 0, pct: 100, isBlocked: false };
  }
  const total = task.subtasks.length;
  const done = task.subtasks.filter((s) => s.status === "COMPLETED").length;
  const pct = Math.round((done / total) * 100);
  return { done, total, pct, isBlocked: done < total };
}

// ─── TaskCheckPopover ────────────────────────────────────────────────────────────

function TaskCheckPopover({
  task,
  onToggle,
  onViewDetail,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onViewDetail: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isCompleted = task.status === "COMPLETED";
  const { done, total, pct, isBlocked } = getTaskProgress(task);
  const hasSubtasks = total > 0;
  const pendingSubtasks = total - done;

  const handleToggle = () => {
    if (!isBlocked || isCompleted) {
      onToggle(task.id);
      setOpen(false);
    }
  };

  const handleViewDetail = () => {
    onViewDetail(task.id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="shrink-0 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        >
          {/* Custom circle — adapts to state */}
          <div
            className={cn(
              "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200",
              isCompleted
                ? "bg-emerald-500/80 border-emerald-500"
                : isBlocked
                ? "border-amber-500/50 hover:border-amber-400 hover:bg-amber-500/10"
                : "border-border hover:border-emerald-500/60 hover:bg-emerald-500/8"
            )}
          >
            {isCompleted && <Check className="w-2.5 h-2.5 text-white" />}
            {!isCompleted && isBlocked && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
            )}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        onClick={(e) => e.stopPropagation()}
        className="w-72 p-2 bg-popover border border-border shadow-2xl shadow-black/40 rounded-2xl"
      >
        {/* ── Primary actions */}
        <div className="space-y-0.5">
          {/* Mark complete / pending */}
          <button
            disabled={isBlocked && !isCompleted}
            onClick={handleToggle}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left",
              isBlocked && !isCompleted
                ? "opacity-40 cursor-not-allowed"
                : isCompleted
                ? "hover:bg-muted text-foreground"
                : "hover:bg-emerald-500/10 text-foreground"
            )}
          >
            <CheckCircle2
              className={cn(
                "w-4 h-4 shrink-0",
                isCompleted
                  ? "text-emerald-500"
                  : isBlocked
                  ? "text-amber-400/60"
                  : "text-emerald-400"
              )}
            />
            <span style={{ fontWeight: 500 }}>
              {isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
            </span>
            {isBlocked && !isCompleted && (
              <Lock className="w-3 h-3 text-amber-400/70 ml-auto shrink-0" />
            )}
          </button>

          {/* View detail */}
          <button
            onClick={handleViewDetail}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-all text-left"
          >
            <ExternalLink className="w-4 h-4 text-violet-400 shrink-0" />
            <span style={{ fontWeight: 500 }}>Ver detalle</span>
          </button>
        </div>

        {/* ── Subtasks section */}
        {hasSubtasks && (
          <div>
            <div className="my-2 border-t border-border/50" />
            <div className="px-3 pb-1">
              {/* Header + count */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground/70 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  Subtareas
                </span>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    pct === 100 ? "text-emerald-400" : "text-muted-foreground/60"
                  )}
                >
                  {done}/{total} · {pct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-emerald-500/60" : "bg-amber-400/60"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Subtask list */}
              <div className="space-y-1.5">
                {task.subtasks!.map((st) => (
                  <div key={st.id} className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                        st.status === "COMPLETED"
                          ? "bg-emerald-500/70 border-emerald-500"
                          : "border-border/80"
                      )}
                    >
                      {st.status === "COMPLETED" && <Check className="w-2 h-2 text-white" />}
                    </div>
                    <span
                      className={cn(
                        "text-xs leading-tight",
                        st.status === "COMPLETED"
                          ? "text-muted-foreground/40 line-through"
                          : "text-foreground/80"
                      )}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Blocking warning */}
        {isBlocked && !isCompleted && (
          <div className="mt-2 mx-1 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/80 leading-snug">
              {pendingSubtasks} subtarea{pendingSubtasks !== 1 ? "s" : ""} pendiente{pendingSubtasks !== 1 ? "s" : ""} · completa todas para finalizar esta tarea
            </p>
          </div>
        )}

        {/* ── All done + unblocked confirmation */}
        {hasSubtasks && pct === 100 && !isCompleted && (
          <div className="mt-2 mx-1 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300/80">¡Todas las subtareas completadas!</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── TaskRow ────────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  group,
  isKeyboardFocused,
  onToggle,
  onClick,
}: {
  task: Task;
  group: "overdue" | "today" | "thisWeek";
  isKeyboardFocused: boolean;
  onToggle: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const vc = useVC();
  const isCompleted = task.status === "COMPLETED";
  const dueLabel = formatDueDate(task.due_date, group);
  const { done, total, pct, isBlocked } = getTaskProgress(task);
  const hasSubtasks = total > 0;

  return (
    <div
      onClick={() => onClick(task.id)}
      className={cn(
        "group flex items-center gap-3.5 px-4 py-2.5 rounded-2xl cursor-pointer",
        "transition-all duration-150",
        "border-l-2",
        isKeyboardFocused && !isCompleted
          ? "bg-muted/50 border-l-violet-500/50"
          : "border-l-transparent hover:bg-muted/30",
        isCompleted && "opacity-40"
      )}
    >
      {/* ── Checkbox / action popover */}
      <TaskCheckPopover
        task={task}
        onToggle={onToggle}
        onViewDetail={onClick}
      />

      {/* Priority dot */}
      {vc.priority_dot && task.priority !== "LOW" && (
        <span className={cn("shrink-0 w-1.5 h-1.5 rounded-full -ml-1.5", PRIORITY_STYLES[task.priority])} />
      )}

      {/* Correlative ID badge */}
      {vc.correlative_id && task.correlativeId && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] bg-blue-500/8 border-blue-500/15 text-blue-500/50 shrink-0 font-mono">
          {task.correlativeId}
        </span>
      )}

      {/* Title */}
      <span
        className={cn(
          "flex-1 text-sm transition-colors duration-200 min-w-0 truncate",
          isCompleted
            ? "line-through text-muted-foreground/50"
            : isKeyboardFocused
            ? "text-foreground"
            : "text-foreground/80 group-hover:text-foreground"
        )}
      >
        {task.title}
      </span>

      {/* ── Mini subtask progress */}
      {vc.subtask_progress && hasSubtasks && !isCompleted && (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-14 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pct === 100 ? "bg-emerald-500" : pct >= 50 ? "bg-emerald-500/60" : "bg-amber-400/60"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span
            className={cn(
              "text-[10px] tabular-nums shrink-0 transition-colors",
              pct === 100 ? "text-emerald-400/70" : isBlocked ? "text-amber-400/60" : "text-muted-foreground/40"
            )}
          >
            {done}/{total}
          </span>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Project */}
        {vc.project_tag && task.project && (
          <span
            className={cn(
              "text-xs transition-all duration-200",
              isKeyboardFocused
                ? "text-muted-foreground"
                : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
            )}
          >
            {task.project}
          </span>
        )}

        {/* [Space] badge */}
        {isKeyboardFocused && !isCompleted && (
          <kbd className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted border border-border text-muted-foreground/70 text-xs select-none">
            Space
          </kbd>
        )}

        {/* Due date */}
        {vc.due_date && (
          <span
            className={cn(
              "text-xs tabular-nums w-16 text-right transition-colors",
              group === "overdue"
                ? "text-rose-500/70"
                : isKeyboardFocused
                ? "text-muted-foreground"
                : "text-muted-foreground/40 group-hover:text-muted-foreground/60"
            )}
          >
            {dueLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── TaskGroup ──────────────────────────────────────────────────────────────────

function TaskGroup({
  heading,
  tasks,
  group,
  focusedId,
  forceAdding,
  onToggle,
  onRowClick,
  onAddTask,
  onForceAddingConsumed,
}: {
  heading: string;
  tasks: Task[];
  group: "overdue" | "today" | "thisWeek";
  focusedId: string | null;
  forceAdding: boolean;
  onToggle: (id: string) => void;
  onRowClick: (id: string) => void;
  onAddTask: (group: string, title: string) => void;
  onForceAddingConsumed: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const pendingCount = tasks.filter((t) => t.status === "PENDING").length;

  // External trigger (e.g. "N" key)
  useEffect(() => {
    if (forceAdding) {
      setAdding(true);
      onForceAddingConsumed();
    }
  }, [forceAdding, onForceAddingConsumed]);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const commit = () => {
    if (draft.trim()) onAddTask(group, draft.trim());
    setDraft("");
    setAdding(false);
  };

  const HEADING_COLOR: Record<typeof group, string> = {
    overdue: "text-rose-500/70",
    today: "text-muted-foreground",
    thisWeek: "text-muted-foreground/60",
  };

  const RULE_COLOR: Record<typeof group, string> = {
    overdue: "bg-rose-500/10",
    today: "bg-border/60",
    thisWeek: "bg-border/40",
  };

  return (
    <section className="mb-10">
      {/* ── Group header */}
      <div className="flex items-center gap-3 mb-2 px-4">
        <h2
          className={cn("text-xs uppercase tracking-widest shrink-0", HEADING_COLOR[group])}
          style={{ fontWeight: 600, letterSpacing: "0.1em" }}
        >
          {heading}
        </h2>
        <span
          className={cn(
            "text-xs shrink-0",
            group === "overdue" ? "text-rose-500/50" : "text-muted-foreground/50"
          )}
        >
          {pendingCount > 0 ? `· ${pendingCount}` : "· all done"}
        </span>
        <div className={cn("flex-1 h-px", RULE_COLOR[group])} />
      </div>

      {/* ── Rows */}
      <div className="space-y-0.5">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            group={group}
            isKeyboardFocused={focusedId === task.id}
            onToggle={onToggle}
            onClick={onRowClick}
          />
        ))}
      </div>

      {/* ── Inline Add */}
      {adding ? (
        <div className="flex items-center gap-3.5 px-4 py-2.5 mt-0.5 rounded-2xl border border-dashed border-border/60 bg-muted/20">
          <div className="shrink-0 w-4 h-4 rounded-full border border-border flex items-center justify-center">
            <Plus className="w-2.5 h-2.5 text-muted-foreground/50" />
          </div>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") { setDraft(""); setAdding(false); }
            }}
            onBlur={commit}
            placeholder="Task name..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
          <span className="text-xs text-muted-foreground/50 shrink-0">↵ save · Esc cancel</span>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-3.5 px-4 py-2 mt-0.5 w-full text-left rounded-2xl text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30 transition-all duration-150 group/add"
        >
          <Plus className="w-3.5 h-3.5 transition-colors group-hover/add:text-muted-foreground" />
          <span className="text-xs">Add task</span>
        </button>
      )}
    </section>
  );
}

// ─── HelpPanel ───────────────────────────────────────────────────────────────

const HELP_ITEMS = [
  {
    icon: <div className="w-4 h-4 rounded-full border-2 border-border flex items-center justify-center shrink-0" />,
    title: "Círculo de la tarea",
    desc: "Haz clic para elegir: ver el detalle completo o marcar como completada.",
  },
  {
    icon: <div className="w-4 h-4 rounded-full border-2 border-amber-500/60 flex items-center justify-center shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" /></div>,
    title: "Tarea bloqueada (ámbar)",
    desc: "Tiene subtareas pendientes. Completa todas antes de cerrar la tarea principal.",
  },
  {
    icon: <div className="w-4 h-4 rounded-full bg-emerald-500/80 border-2 border-emerald-500 flex items-center justify-center shrink-0"><Check className="w-2.5 h-2.5 text-white" /></div>,
    title: "Tarea completada (verde)",
    desc: "Marcada como lista. Puedes reabrirla haciendo clic en el círculo verde.",
  },
  {
    icon: <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden shrink-0 mt-0.5"><div className="h-full w-2/3 rounded-full bg-emerald-500/60" /></div>,
    title: "Barra de progreso",
    desc: "Muestra cuántas subtareas están completas (ej. 2/3). Verde = casi listo · Ámbar = en curso.",
  },
  {
    icon: <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground text-[10px] shrink-0">Space</kbd>,
    title: "Atajos de teclado",
    desc: "↑ ↓ navegar entre tareas · Space marcar completada · N crear tarea · Esc deseleccionar.",
  },
];

function HelpPanel() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-xl border transition-all duration-150 text-xs",
            open
              ? "bg-violet-500/15 border-violet-500/40 text-violet-400"
              : "bg-muted border-border text-muted-foreground/60 hover:border-muted-foreground/40 hover:text-muted-foreground"
          )}
          title="Ayuda"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={8}
        className="w-80 p-0 bg-popover border border-border shadow-2xl shadow-black/40 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
          <div>
            <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>Cómo usar My Tasks</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Guía rápida · 1 min de lectura</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Items */}
        <div className="px-4 py-3 space-y-4">
          {HELP_ITEMS.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex items-center justify-center w-5 shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground/90 leading-snug" style={{ fontWeight: 600 }}>{item.title}</p>
                <p className="text-xs text-muted-foreground/60 leading-snug mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-3 border-t border-border/40 bg-muted/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400/70 shrink-0" />
          <p className="text-[11px] text-muted-foreground/50 leading-snug">
            Usa <span className="text-violet-400/80">⌘K</span> para acceder a comandos rápidos desde cualquier pantalla.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── View config fields ────────────────────────────────────────────────────────

const TASKS_FIELDS: VCField[] = [
  { key: "due_date",         label: "Fecha de vencimiento",     description: "Muestra la fecha límite de cada tarea",               category: "esencial",    locked: true  },
  { key: "priority_dot",     label: "Indicador de prioridad",   description: "Punto de color para tareas HIGH / MEDIUM",            category: "esencial",    defaultOn: true  },
  { key: "subtask_progress", label: "Progreso de subtareas",    description: "Barra mini y contador N/M de subtareas",              category: "esencial",    defaultOn: true  },
  { key: "project_tag",      label: "Proyecto asociado",        description: "Nombre del proyecto al que pertenece la tarea",       category: "esencial",    defaultOn: true  },
  { key: "correlative_id",   label: "ID de referencia (TASK-XXX)", description: "Identificador único de la tarea en el sistema",   category: "operacional", defaultOn: false },
];

// ─── MyTasksScreen ──────────────────────────────────────────────────────────────

export function MyTasksScreen({ onNavigate, onOpenCommand }: MyTasksScreenProps) {
  const { canUseFeature } = useUserPerspective();
  const { isMobile } = useResponsive();
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [addToTodayTrigger, setAddToTodayTrigger] = useState(false);
  const [sheetEntity, setSheetEntity] = useState<UniversalEntity | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vcOpen, setVcOpen] = useState(false);

  const vc = useViewConfig("cerebrin_tasks_view", TASKS_FIELDS);
  const showShadowChat = canUseFeature("shadow_chat_enabled");

  // ── Derived groups
  const overdueTasks = useMemo(
    () => tasks.filter((t) => t.due_date < TODAY && t.status === "PENDING"),
    [tasks]
  );
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.due_date === TODAY),
    [tasks]
  );
  const thisWeekTasks = useMemo(
    () => tasks.filter((t) => t.due_date > TODAY && t.due_date <= WEEK_END),
    [tasks]
  );

  // Flat ordered list for ↑↓ nav (pending tasks only, in display order)
  const orderedPendingIds = useMemo(
    () => [
      ...overdueTasks.map((t) => t.id),
      ...todayTasks.filter((t) => t.status === "PENDING").map((t) => t.id),
      ...thisWeekTasks.map((t) => t.id),
    ],
    [overdueTasks, todayTasks, thisWeekTasks]
  );

  // ── Actions
  const toggleTask = useCallback((id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // Block completion if subtasks are pending
    if (task.status === "PENDING" && task.subtasks && task.subtasks.length > 0) {
      const allDone = task.subtasks.every((s) => s.status === "COMPLETED");
      if (!allDone) return; // blocked — popover handles the visual feedback
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "PENDING" ? "COMPLETED" : "PENDING" }
          : t
      )
    );
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  }, [tasks]);

  const addTask = useCallback((group: string, title: string) => {
    const due =
      group === "today" || group === "overdue" ? TODAY : "2026-02-23";
    setTasks((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, title, due_date: due, priority: "MEDIUM", status: "PENDING" },
    ]);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  }, []);

  // ── Keyboard handler
  useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    };

    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      if (e.key === " " && focusedId) {
        e.preventDefault();
        toggleTask(focusedId);
        setTimeout(() => {
          setFocusedId((prev) => {
            const idx = orderedPendingIds.indexOf(prev ?? "");
            return orderedPendingIds[idx + 1] ?? orderedPendingIds[idx - 1] ?? null;
          });
        }, 50);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedId((prev) => {
          if (!prev) return orderedPendingIds[0] ?? null;
          const idx = orderedPendingIds.indexOf(prev);
          return orderedPendingIds[Math.min(idx + 1, orderedPendingIds.length - 1)] ?? prev;
        });
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedId((prev) => {
          if (!prev) return orderedPendingIds[orderedPendingIds.length - 1] ?? null;
          const idx = orderedPendingIds.indexOf(prev);
          return orderedPendingIds[Math.max(idx - 1, 0)] ?? prev;
        });
        return;
      }

      if (e.key === "Escape") {
        setFocusedId(null);
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setAddToTodayTrigger(true);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusedId, orderedPendingIds, toggleTask]);

  // ── Today progress
  const completedToday = todayTasks.filter((t) => t.status === "COMPLETED").length;
  const totalToday = todayTasks.length;
  const progressPct = totalToday ? (completedToday / totalToday) * 100 : 0;

  const handleRowClick = useCallback((id: string) => {
    setFocusedId(id);
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const group = task.due_date < TODAY ? "Overdue" : task.due_date === TODAY ? "Today" : "This Week";
    const entity: UniversalEntity = {
      id: task.id,
      correlativeId: task.correlativeId,
      title: task.title,
      entityType: "TASK",
      assignee_type: "HUMAN",
      status: task.status,
      due_date: task.due_date,
      priority: task.priority,
      breadcrumb: [
        { label: "My Tasks" },
        { label: group },
        ...(task.project ? [{ label: task.project }] : []),
      ],
      metadata: { estimated_hours: 2, cost: 0, weight: 50 },
    };
    setSheetEntity(entity);
    setSheetOpen(true);
  }, [tasks]);

  // ── Pull-to-refresh
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(
    scrollContainerRef,
    async () => {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In production, fetch latest tasks from API
    },
    { enabled: isMobile }
  );

  return (
    <ViewConfigCtx.Provider value={vc.config}>
    <div className="h-full flex">
    <div className="flex-1 flex flex-col bg-background min-w-0">

      {/* ── Minimal header ─────────────────────────────────────────────────────── */}
      <header className={cn(
        "shrink-0 flex items-center justify-between border-b border-border/60",
        isMobile ? "px-4 h-12" : "px-8 h-14"
      )}>
        {/* Back */}
        {!isMobile && (
          <button
            onClick={() => onNavigate("cockpit")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-150 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cockpit</span>
          </button>
        )}

        {/* Center title */}
        <div className={cn("text-center select-none", isMobile && "flex-1")}>
          <p className={cn("text-foreground", isMobile ? "text-sm" : "text-sm")} style={{ fontWeight: 600 }}>
            My Tasks
          </p>
          {!isMobile && (
            <p className="text-muted-foreground/70 text-xs">Friday, February 20 · Focus Mode</p>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {!isMobile && (
            <span
              className={cn(
                "text-xs text-emerald-500 transition-all duration-500 select-none",
                savedFlash ? "opacity-100" : "opacity-0"
              )}
            >
              Saved
            </span>
          )}
          {!isMobile && <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />}
          {!isMobile && <HelpPanel />}
          <button
            onClick={onOpenCommand}
            className={cn(
              "flex items-center gap-1.5 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40 transition-all text-xs",
              isMobile ? "px-2 py-1.5" : "px-2.5 py-1.5"
            )}
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        </div>
      </header>

      {/* ── Today progress strip ────────────────────────────────────────────────── */}
      <div className={cn(
        "shrink-0 pt-3 pb-2.5 flex items-center gap-4 border-b border-border/30",
        isMobile ? "px-4" : "px-8"
      )}>
        <div className="flex-1 h-[3px] rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500/60 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {!isMobile && (
          <span className="text-xs text-muted-foreground/70 shrink-0 tabular-nums">
            {completedToday} of {totalToday} done today
          </span>
        )}
      </div>

      {/* ── Scrollable task list ────────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative"
        onClick={() => setFocusedId(null)}
      >
        {/* Pull-to-refresh indicator */}
        {isMobile && (isPulling || isRefreshing) && (
          <div
            className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10 transition-opacity"
            style={{
              opacity: isRefreshing ? 1 : Math.min(1, pullDistance / 80),
            }}
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
              <Loader2 className={cn("w-4 h-4 text-violet-400", isRefreshing && "animate-spin")} />
              <span className="text-xs text-violet-400">
                {isRefreshing ? "Actualizando..." : "Suelta para actualizar"}
              </span>
            </div>
          </div>
        )}
        <div
          className={cn(
            "max-w-3xl mx-auto pt-8 pb-6",
            isMobile ? "px-4 pb-24" : "px-2"
          )}
          onClick={(e) => e.stopPropagation()}
        >

          {/* Overdue */}
          {overdueTasks.length > 0 && (
            <TaskGroup
              heading="Overdue"
              tasks={overdueTasks}
              group="overdue"
              focusedId={focusedId}
              forceAdding={false}
              onToggle={toggleTask}
              onRowClick={handleRowClick}
              onAddTask={addTask}
              onForceAddingConsumed={() => {}}
            />
          )}

          {/* Today */}
          <TaskGroup
            heading="Today"
            tasks={todayTasks}
            group="today"
            focusedId={focusedId}
            forceAdding={addToTodayTrigger}
            onToggle={toggleTask}
            onRowClick={handleRowClick}
            onAddTask={addTask}
            onForceAddingConsumed={() => setAddToTodayTrigger(false)}
          />

          {/* This Week */}
          {thisWeekTasks.length > 0 && (
            <TaskGroup
              heading="This Week"
              tasks={thisWeekTasks}
              group="thisWeek"
              focusedId={focusedId}
              forceAdding={false}
              onToggle={toggleTask}
              onRowClick={handleRowClick}
              onAddTask={addTask}
              onForceAddingConsumed={() => {}}
            />
          )}
        </div>
      </div>

      {/* ── Keyboard hints bar ─────────────────────────────────────────────────── */}
      <footer className="shrink-0 flex items-center justify-center gap-6 py-3 border-t border-border/40">
        {[
          { key: "↑ ↓", label: "Navigate" },
          { key: "Space", label: "Toggle done" },
          { key: "N", label: "New task" },
          { key: "Esc", label: "Deselect" },
          { key: "⌘K", label: "Commands" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded-lg bg-muted border border-border text-muted-foreground text-xs select-none">
              {key}
            </kbd>
            <span className="text-xs text-muted-foreground/70">{label}</span>
          </div>
        ))}
      </footer>

      {/* Universal Task Sheet + Customizer */}
      <UniversalTaskSheet
        entity={sheetEntity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
      {vcOpen && (
        <ViewCustomizerPanel
          title="Personalizar My Tasks"
          subtitle="Elige qué campos mostrar en cada tarea"
          fields={TASKS_FIELDS}
          config={vc.config}
          onToggleField={vc.toggleField}
          onReset={vc.reset}
          onClose={() => setVcOpen(false)}
        />
      )}
    </div>

    {/* Shadow Chat (Focus mode only) */}
    {showShadowChat && (isMobile ? <ShadowChatMobile /> : <ShadowChat />)}

    </div>
    </ViewConfigCtx.Provider>
  );
}