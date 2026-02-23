import { useState, useRef } from "react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  Loader2,
  Plus,
  User,
} from "lucide-react";
import { cn } from "../ui/utils";
import { format, parseISO } from "date-fns";
import { UniversalTaskSheet, type UniversalEntity } from "../shared/UniversalTaskSheet";
import type { Project, SubTask, Task, TaskStatus } from "./types";
import {
  useViewConfig,
  ViewConfigCtx,
  useVC,
  ViewCustomizerTrigger,
  ViewCustomizerPanel,
  type VCField,
} from "../shared/ViewCustomizer";
import { usePullToRefresh } from "../../hooks/useSwipeGestures";
import { useResponsive } from "../../hooks/useResponsive";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const PROJECTS: Project[] = [
  {
    id: "p1",
    correlativeId: "PROJ-005",
    title: "Q1 Marketing Initiative",
    client: "Ebox.lat",
    progress_pct: 58,
    tasks: [
      {
        id: "t1",
        correlativeId: "TASK-005",
        title: "Landing Page Redesign",
        assignee_type: "AGENT",
        progress_pct: 72,
        status: "IN_PROGRESS",
        due_date: "2026-02-20",
        metadata: { weight: 45, estimated_hours: 12, cost: 850 },
        subtasks: [
          {
            id: "st1",
            correlativeId: "SBTK-001",
            title: "Write copy for new landing page",
            assignee_type: "AGENT",
            progress_pct: 85,
            status: "IN_PROGRESS",
            due_date: "2026-02-20",
            metadata: { weight: 60, estimated_hours: 6, cost: 400 },
          },
          {
            id: "st2",
            correlativeId: "SBTK-002",
            title: "Design hero section mockup",
            assignee_type: "HUMAN",
            progress_pct: 20,
            status: "PENDING",
            due_date: "2026-02-22",
            metadata: { weight: 40, estimated_hours: 5, cost: 350 },
          },
        ],
      },
      {
        id: "t2",
        correlativeId: "TASK-006",
        title: "Content Calendar — Q1",
        assignee_type: "AGENT",
        progress_pct: 65,
        status: "IN_PROGRESS",
        due_date: "2026-02-25",
        metadata: { weight: 30, estimated_hours: 8, cost: 600 },
        subtasks: [
          {
            id: "st3",
            correlativeId: "SBTK-003",
            title: "Blog posts × 4 (2,000 words each)",
            assignee_type: "AGENT",
            progress_pct: 80,
            status: "IN_PROGRESS",
            due_date: "2026-02-24",
            metadata: { weight: 55, estimated_hours: 5, cost: 380 },
          },
          {
            id: "st4",
            correlativeId: "SBTK-004",
            title: "Social media asset pack",
            assignee_type: "AGENT",
            progress_pct: 40,
            status: "PENDING",
            due_date: "2026-02-26",
            metadata: { weight: 45, estimated_hours: 3, cost: 220 },
          },
        ],
      },
      {
        id: "t3",
        correlativeId: "TASK-007",
        title: "Campaign Analytics Setup",
        assignee_type: "HUMAN",
        progress_pct: 30,
        status: "PENDING",
        due_date: "2026-02-28",
        metadata: { weight: 25, estimated_hours: 6, cost: 0 },
      },
    ],
  },
  {
    id: "p2",
    correlativeId: "PROJ-006",
    title: "Platform 3.0 Launch",
    client: "Ebox.lat",
    progress_pct: 41,
    tasks: [
      {
        id: "t4",
        correlativeId: "TASK-008",
        title: "API Documentation",
        assignee_type: "AGENT",
        progress_pct: 70,
        status: "IN_PROGRESS",
        due_date: "2026-02-23",
        metadata: { weight: 35, estimated_hours: 10, cost: 750 },
        subtasks: [
          {
            id: "st5",
            correlativeId: "SBTK-005",
            title: "Endpoints reference (REST + GraphQL)",
            assignee_type: "AGENT",
            progress_pct: 90,
            status: "IN_PROGRESS",
            due_date: "2026-02-22",
            metadata: { weight: 65, estimated_hours: 6, cost: 450 },
          },
          {
            id: "st6",
            correlativeId: "SBTK-006",
            title: "SDK quickstart guide",
            assignee_type: "AGENT",
            progress_pct: 40,
            status: "PENDING",
            due_date: "2026-02-23",
            metadata: { weight: 35, estimated_hours: 4, cost: 300 },
          },
        ],
      },
      {
        id: "t5",
        correlativeId: "TASK-009",
        title: "Beta Testing Plan",
        assignee_type: "HUMAN",
        progress_pct: 35,
        status: "IN_PROGRESS",
        due_date: "2026-02-25",
        metadata: { weight: 40, estimated_hours: 14, cost: 0 },
        subtasks: [
          {
            id: "st7",
            correlativeId: "SBTK-007",
            title: "Define 40 test scenarios",
            assignee_type: "HUMAN",
            progress_pct: 60,
            status: "IN_PROGRESS",
            due_date: "2026-02-24",
            metadata: { weight: 50, estimated_hours: 8, cost: 0 },
          },
          {
            id: "st8",
            correlativeId: "SBTK-008",
            title: "QA environment setup",
            assignee_type: "HUMAN",
            progress_pct: 10,
            status: "PENDING",
            due_date: "2026-02-25",
            metadata: { weight: 50, estimated_hours: 6, cost: 0 },
          },
        ],
      },
      {
        id: "t6",
        correlativeId: "TASK-010",
        title: "Go-live Launch Checklist",
        assignee_type: "HUMAN",
        progress_pct: 15,
        status: "PENDING",
        due_date: "2026-02-28",
        metadata: { weight: 25, estimated_hours: 4, cost: 0 },
      },
    ],
  },
  {
    id: "p3",
    correlativeId: "PROJ-007",
    title: "LATAM Expansion",
    client: "Ebox.lat",
    progress_pct: 25,
    tasks: [
      {
        id: "t7",
        correlativeId: "TASK-011",
        title: "Competitive Market Analysis",
        assignee_type: "AGENT",
        progress_pct: 55,
        status: "IN_PROGRESS",
        due_date: "2026-02-27",
        metadata: { weight: 40, estimated_hours: 18, cost: 1200 },
      },
      {
        id: "t8",
        correlativeId: "TASK-012",
        title: "Partner Outreach Playbook",
        assignee_type: "HUMAN",
        progress_pct: 10,
        status: "PENDING",
        due_date: "2026-03-05",
        metadata: { weight: 35, estimated_hours: 10, cost: 0 },
      },
      {
        id: "t9",
        correlativeId: "TASK-013",
        title: "Regulatory Compliance Review",
        assignee_type: "AGENT",
        progress_pct: 5,
        status: "PENDING",
        due_date: "2026-03-10",
        metadata: { weight: 25, estimated_hours: 20, cost: 1500 },
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  TaskStatus,
  { pill: string; dot: string; label: string }
> = {
  PENDING:     { pill: "bg-slate-800 text-slate-500 border-slate-700/50",         dot: "bg-slate-600",   label: "Pending" },
  IN_PROGRESS: { pill: "bg-blue-500/10 text-blue-400 border-blue-500/20",         dot: "bg-blue-400",    label: "In Progress" },
  COMPLETED:   { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",dot: "bg-emerald-400", label: "Completed" },
  BLOCKED:     { pill: "bg-rose-500/10 text-rose-400 border-rose-500/20",         dot: "bg-rose-400",    label: "Blocked" },
};

function StatusPill({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] shrink-0 select-none",
        s.pill
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {s.label}
    </span>
  );
}

function MiniProgress({
  pct,
  isAgent,
}: {
  pct: number;
  isAgent: boolean;
}) {
  // PHI-OS v2: ultra-thin (h-0.5) progress bar with intensity color by load
  const intensity = pct >= 80 ? "bg-emerald-400" : pct >= 50 ? (isAgent ? "bg-violet-400" : "bg-indigo-400") : pct >= 25 ? (isAgent ? "bg-violet-500/60" : "bg-blue-500/60") : "bg-slate-600";
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-20 h-0.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", intensity)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-slate-600 tabular-nums w-7 text-right">
        {pct}%
      </span>
    </div>
  );
}

function WeightInput({ value }: { value: number }) {
  const [val, setVal] = useState(value);
  return (
    <div
      className="flex items-center gap-0.5 shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="number"
        value={val}
        min={0}
        max={100}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-9 bg-slate-800/60 border border-slate-700/50 rounded-lg text-center text-[10px] text-slate-500 outline-none py-1 hover:border-slate-600 focus:border-violet-500/50 focus:text-slate-300 transition-colors tabular-nums"
      />
      <span className="text-[10px] text-slate-700">%</span>
    </div>
  );
}

// ─── View config fields ────────────────────────────────────────────────────────

const PROJECT_FIELDS: VCField[] = [
  { key: "status",         label: "Estado de la tarea",       description: "Pill de estado: Pending, In Progress, etc.",      category: "esencial",    locked: true     },
  { key: "progress",       label: "Barra de progreso",        description: "Progreso visual en % por tarea o subtarea",       category: "esencial",    defaultOn: true  },
  { key: "due_date",       label: "Fecha de vencimiento",     description: "Fecha límite formateada junto a cada tarea",      category: "esencial",    defaultOn: true  },
  { key: "weight",         label: "Peso (%)",                 description: "Campo editable de peso relativo de la tarea",     category: "operacional", defaultOn: true  },
  { key: "correlative_id", label: "ID de tarea (TASK-XXX)",   description: "Identificador único visible en la fila",          category: "operacional", defaultOn: false },
  { key: "cost",           label: "Coste estimado ($)",       description: "Coste en USD asociado a la tarea de agente",      category: "avanzado",    defaultOn: false },
];

// ─── Subtask Row ──────────────────────────────────────────────────────────────

function SubtaskRow({
  subtask,
  onSelect,
}: {
  subtask: SubTask;
  onSelect: () => void;
}) {
  const vc = useVC();
  const isAgent = subtask.assignee_type === "AGENT";
  return (
    <div
      onClick={onSelect}
      className="group flex items-center gap-3 pl-16 pr-4 py-2 border-b border-slate-800/30 hover:bg-slate-800/20 cursor-pointer transition-colors duration-100"
    >
      {/* Assignee icon */}
      <div className="shrink-0">
        {isAgent ? (
          <Bot className="w-3.5 h-3.5 text-violet-500/70" />
        ) : (
          <User className="w-3.5 h-3.5 text-slate-600" />
        )}
      </div>

      {/* Subtask type + ID badge */}
      {vc.correlative_id && subtask.correlativeId && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] bg-emerald-500/8 border-emerald-500/15 text-emerald-600/60 shrink-0 font-mono">
          Sub {subtask.correlativeId}
        </span>
      )}

      {/* Title */}
      <span className="flex-1 text-xs text-slate-500 group-hover:text-slate-300 transition-colors truncate">
        {subtask.title}
      </span>

      {/* Status */}
      {vc.status && <StatusPill status={subtask.status} />}

      {/* Weight */}
      {vc.weight && <WeightInput value={subtask.metadata.weight} />}

      {/* Progress */}
      {vc.progress && <MiniProgress pct={subtask.progress_pct} isAgent={isAgent} />}

      {/* Due date */}
      {vc.due_date && (
        <span className="text-[10px] text-slate-700 w-14 text-right shrink-0 tabular-nums">
          {format(parseISO(subtask.due_date), "MMM d")}
        </span>
      )}
    </div>
  );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  expanded,
  onToggleExpand,
  onSelect,
  onSelectSubtask,
}: {
  task: Task;
  expanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  onSelectSubtask: (sub: SubTask) => void;
}) {
  const vc = useVC();
  const isAgent = task.assignee_type === "AGENT";
  const hasChildren = task.subtasks && task.subtasks.length > 0;

  return (
    <div>
      <div
        onClick={onSelect}
        className="group flex items-center gap-3 pl-8 pr-4 py-2.5 border-b border-slate-800/40 hover:bg-slate-800/25 cursor-pointer transition-colors duration-100"
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand();
          }}
          className={cn(
            "shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors",
            hasChildren
              ? "text-slate-600 hover:text-slate-400"
              : "text-transparent pointer-events-none"
          )}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : (
            <span className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Assignee icon */}
        <div className="shrink-0">
          {isAgent ? (
            <Bot className="w-4 h-4 text-violet-400" />
          ) : (
            <User className="w-4 h-4 text-slate-500" />
          )}
        </div>

        {/* Task type + ID badge */}
        {vc.correlative_id && task.correlativeId && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] bg-blue-500/8 border-blue-500/15 text-blue-500/60 shrink-0 font-mono">
            {task.correlativeId}
          </span>
        )}

        {/* Title */}
        <span className="flex-1 text-sm text-slate-300 group-hover:text-slate-100 transition-colors truncate">
          {task.title}
        </span>

        {/* Status */}
        {vc.status && <StatusPill status={task.status} />}

        {/* Weight */}
        {vc.weight && <WeightInput value={task.metadata.weight} />}

        {/* Cost */}
        {vc.cost && task.metadata.cost > 0 && (
          <span className="text-[10px] text-emerald-600/70 tabular-nums shrink-0 w-14 text-right">
            ${task.metadata.cost}
          </span>
        )}

        {/* Progress */}
        {vc.progress && <MiniProgress pct={task.progress_pct} isAgent={isAgent} />}

        {/* Due date */}
        {vc.due_date && (
          <span className="text-[10px] text-slate-600 w-14 text-right shrink-0 tabular-nums">
            {format(parseISO(task.due_date), "MMM d")}
          </span>
        )}
      </div>

      {/* Subtask rows */}
      {expanded &&
        task.subtasks?.map((sub) => (
          <SubtaskRow
            key={sub.id}
            subtask={sub}
            onSelect={() => onSelectSubtask(sub)}
          />
        ))}
    </div>
  );
}

// ─── Project Row ──────────────────────────────────────────────────────────────

function ProjectRow({
  project,
  expanded,
  onToggle,
  expandedTasks,
  onToggleTask,
  onSelectTask,
  onSelectSubtask,
}: {
  project: Project;
  expanded: boolean;
  onToggle: () => void;
  expandedTasks: Set<string>;
  onToggleTask: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onSelectSubtask: (sub: SubTask, parentTask: Task) => void;
}) {
  const vc = useVC();
  const pendingCount = project.tasks.filter((t) => t.status === "PENDING").length;
  const agentCount = project.tasks.filter((t) => t.assignee_type === "AGENT").length;

  return (
    <div>
      {/* Project header row */}
      <div
        onClick={onToggle}
        className="group flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors duration-100 bg-slate-900/30"
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors text-slate-500 hover:text-slate-300"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Project icon */}
        <FolderKanban className="w-4 h-4 text-emerald-400 shrink-0" />

        {/* Correlative ID */}
        {vc.correlative_id && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] bg-emerald-500/8 border-emerald-500/15 text-emerald-600/70 shrink-0 font-mono">
            {project.correlativeId}
          </span>
        )}

        {/* Title */}
        <span
          className="flex-1 text-sm text-slate-100 group-hover:text-white transition-colors truncate"
          style={{ fontWeight: 600 }}
        >
          {project.title}
        </span>

        {/* Client */}
        <span className="text-[10px] text-slate-600 shrink-0">{project.client}</span>

        {/* Task counts */}
        <span className="text-[10px] text-slate-700 shrink-0 tabular-nums">
          {project.tasks.length}t{" "}
          <span className="text-violet-500/60">· {agentCount} ai</span>
          {pendingCount > 0 && (
            <span className="text-amber-600/60"> · {pendingCount}⚠</span>
          )}
        </span>

        {/* Progress */}
        {vc.progress && (
          <MiniProgress pct={project.progress_pct} isAgent={false} />
        )}
      </div>

      {/* Task rows */}
      {expanded &&
        project.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            expanded={expandedTasks.has(task.id)}
            onToggleExpand={() => onToggleTask(task.id)}
            onSelect={() => onSelectTask(task)}
            onSelectSubtask={(sub) => onSelectSubtask(sub, task)}
          />
        ))}
    </div>
  );
}

// ─── Project Engine ───────────────────────────────────────────────────────────

export function ProjectEngine() {
  const { isMobile } = useResponsive();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(["p1", "p2"])
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(
    new Set(["t1", "t4"])
  );
  const [sheetEntity, setSheetEntity] = useState<UniversalEntity | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [vcOpen, setVcOpen] = useState(false);

  // Pull-to-refresh
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isPulling, pullDistance, isRefreshing } = usePullToRefresh(
    scrollContainerRef,
    async () => {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In production, fetch latest projects from API
    },
    { enabled: isMobile }
  );

  const vc = useViewConfig("cerebrin_projects_view", PROJECT_FIELDS);

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTask = (id: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openTask = (task: Task | SubTask, project: Project, parentTask?: Task) => {
    const breadcrumb: Array<{ label: string }> = [
      { label: project.client },
      { label: project.title },
    ];
    if (parentTask) breadcrumb.push({ label: parentTask.title });

    const entity: UniversalEntity = {
      id: task.id,
      title: task.title,
      entityType: parentTask ? "SUBTASK" : "TASK",
      assignee_type: task.assignee_type,
      status: task.status,
      due_date: format(parseISO(task.due_date), "MMM d, yyyy"),
      agent: task.assignee_type === "AGENT" ? "@writer-bot" : undefined,
      breadcrumb,
      metadata: {
        estimated_hours: task.metadata.estimated_hours,
        cost: task.metadata.cost,
        weight: task.metadata.weight,
      },
    };
    setSheetEntity(entity);
    setSheetOpen(true);
  };

  // Aggregate stats
  const totalTasks = PROJECTS.reduce((s, p) => s + p.tasks.length, 0);
  const agentTasks = PROJECTS.reduce(
    (s, p) => s + p.tasks.filter((t) => t.assignee_type === "AGENT").length,
    0
  );
  const inProgressTasks = PROJECTS.reduce(
    (s, p) => s + p.tasks.filter((t) => t.status === "IN_PROGRESS").length,
    0
  );

  return (
    <ViewConfigCtx.Provider value={vc.config}>
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <FolderKanban className="w-4 h-4 text-emerald-400" />
          <h2 className="text-slate-200 text-sm" style={{ fontWeight: 600 }}>
            Project Engine
          </h2>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <span className="text-xs text-slate-600">
            {PROJECTS.length} projects · {totalTasks} tasks ·{" "}
            <span className="text-violet-500/70">{agentTasks} agent</span> ·{" "}
            <span className="text-blue-500/70">{inProgressTasks} in progress</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ViewCustomizerTrigger onClick={() => setVcOpen(true)} isOpen={vcOpen} />
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all text-xs">
            <Plus className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>
      </div>

      {/* ── Column headers ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center px-4 py-2 border-b border-slate-800/40 bg-slate-800/10">
        {/* Spacer for indent + icons */}
        <div className="flex-1" />
        {/* Right-aligned column labels */}
        <div className="flex items-center gap-3 text-[10px] text-slate-700 uppercase tracking-widest shrink-0 pr-1">
          {vc.config.status         && <span className="w-20 text-center">Status</span>}
          {vc.config.weight         && <span className="w-14 text-center">Weight</span>}
          {vc.config.cost           && <span className="w-14 text-center">Cost</span>}
          {vc.config.progress       && <span className="w-28 text-center">Progress</span>}
          {vc.config.due_date       && <span className="w-14 text-right">Due</span>}
        </div>
      </div>

      {/* ── Task list (scrollable) ─────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
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
        {PROJECTS.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            expanded={expandedProjects.has(project.id)}
            onToggle={() => toggleProject(project.id)}
            expandedTasks={expandedTasks}
            onToggleTask={toggleTask}
            onSelectTask={(task) => openTask(task, project)}
            onSelectSubtask={(sub, parentTask) =>
              openTask(sub as Task, project, parentTask)
            }
          />
        ))}

        {/* Add project row */}
        <div className="px-4 py-3 border-b border-slate-800/30">
          <button className="flex items-center gap-2 text-slate-700 hover:text-slate-500 transition-colors text-xs group/add">
            <Plus className="w-3.5 h-3.5 group-hover/add:text-slate-500 transition-colors" />
            Add project
          </button>
        </div>
      </div>

      {/* ── Universal Task Sheet ──────────────────────────────────────── */}
      <UniversalTaskSheet
        entity={sheetEntity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
      {vcOpen && (
        <ViewCustomizerPanel
          title="Personalizar Project Engine"
          subtitle="Elige qué columnas mostrar en la tabla"
          fields={PROJECT_FIELDS}
          config={vc.config}
          onToggleField={vc.toggleField}
          onReset={vc.reset}
          onClose={() => setVcOpen(false)}
        />
      )}
    </div>
    </ViewConfigCtx.Provider>
  );
}