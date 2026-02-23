import { Bot, Calendar, CheckCircle2, Target, TrendingDown, User } from "lucide-react";
import { cn } from "../ui/utils";

interface Project {
  id: number;
  correlativeId: string;
  title: string;
  progress_pct: number;
  due_date: string;
  tasks_total: number;
  tasks_done: number;
  status: "ON_TRACK" | "AT_RISK" | "COMPLETED";
  owner: string;
  assignee_type: "HUMAN" | "AGENT";
  agents_active: number;
  category: string;
  metadata: { weight: number; estimated_hours: number };
}

const criticalProjects: Project[] = [
  {
    id: 1,
    correlativeId: "PROJ-002",
    title: "LATAM Market Expansion",
    progress_pct: 67,
    due_date: "Mar 15, 2026",
    tasks_total: 48,
    tasks_done: 32,
    status: "ON_TRACK",
    owner: "Elena M.",
    assignee_type: "HUMAN",
    agents_active: 2,
    category: "Growth",
    metadata: { weight: 0.9, estimated_hours: 320 },
  },
  {
    id: 2,
    correlativeId: "PROJ-003",
    title: "Platform 3.0 Release",
    progress_pct: 34,
    due_date: "Feb 28, 2026",
    tasks_total: 112,
    tasks_done: 38,
    status: "AT_RISK",
    owner: "dev-bot",
    assignee_type: "AGENT",
    agents_active: 3,
    category: "Engineering",
    metadata: { weight: 1.0, estimated_hours: 680 },
  },
  {
    id: 3,
    correlativeId: "PROJ-004",
    title: "Q1 Revenue Operations",
    progress_pct: 81,
    due_date: "Mar 31, 2026",
    tasks_total: 24,
    tasks_done: 19,
    status: "ON_TRACK",
    owner: "Alex R.",
    assignee_type: "HUMAN",
    agents_active: 1,
    category: "Revenue",
    metadata: { weight: 0.85, estimated_hours: 160 },
  },
];

const statusConfig = {
  ON_TRACK: {
    label: "On Track",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    barColor: "from-emerald-500 to-emerald-400",
    glowColor: "shadow-emerald-500/20",
  },
  AT_RISK: {
    label: "At Risk",
    badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
    barColor: "from-red-600 to-red-400",
    glowColor: "shadow-red-500/20",
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    barColor: "from-blue-500 to-blue-400",
    glowColor: "shadow-blue-500/20",
  },
};

const categoryColors: Record<string, string> = {
  Growth: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  Engineering: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Revenue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

function WeightedProgressBar({ pct, config }: { pct: number; config: typeof statusConfig.ON_TRACK }) {
  return (
    <div className="relative w-full h-3 rounded-full bg-muted overflow-hidden">
      {/* Track marks */}
      {[25, 50, 75].map((mark) => (
        <div
          key={mark}
          className="absolute top-0 bottom-0 w-px bg-background z-10"
          style={{ left: `${mark}%` }}
        />
      ))}
      {/* Fill */}
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out relative",
          config.barColor
        )}
        style={{ width: `${pct}%` }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
      </div>
    </div>
  );
}

export function CriticalProjects() {
  return (
    <div className="flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-400" />
          <h3 className="text-foreground text-sm" style={{ fontWeight: 600 }}>
            Critical Projects
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Weighted progress — requires attention</span>
        <div className="flex-1 h-px bg-border" />
        <button className="text-xs text-violet-400 hover:text-violet-300 transition-colors shrink-0">
          View all →
        </button>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 min-h-0 overflow-hidden">
        {criticalProjects.map((project) => {
          const config = statusConfig[project.status];
          return (
            <div
              key={project.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card border-border/60 p-5 hover:border-border transition-all duration-200 cursor-pointer group",
                project.status === "AT_RISK" && "border-red-500/30 bg-red-500/5"
              )}
            >
              {/* Top */}
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {/* ── Project type + correlative ID badge */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs bg-violet-500/10 border-violet-500/20 text-violet-400">
                      <span style={{ fontWeight: 600 }}>Proyecto</span>
                      <span className="font-mono text-[10px] opacity-70">{project.correlativeId}</span>
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-md border",
                        categoryColors[project.category] || "text-slate-400 bg-slate-700 border-slate-600"
                      )}
                    >
                      {project.category}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-md border flex items-center gap-1",
                        config.badgeClass
                      )}
                    >
                      {project.status === "AT_RISK" ? (
                        <TrendingDown className="w-2.5 h-2.5" />
                      ) : (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      )}
                      {config.label}
                    </span>
                  </div>
                  <h4 className="text-foreground text-sm truncate group-hover:text-foreground transition-colors" style={{ fontWeight: 600 }}>
                    {project.title}
                  </h4>
                </div>
                {/* Progress circle */}
                <div className="shrink-0 relative w-12 h-12">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1E293B" strokeWidth="4" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={
                        project.status === "AT_RISK" ? "#EF4444"
                        : project.status === "COMPLETED" ? "#3B82F6"
                        : "#10B981"
                      }
                      strokeWidth="4"
                      strokeDasharray={`${(project.progress_pct / 100) * 87.96} 87.96`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-foreground" style={{ fontWeight: 700 }}>
                      {project.progress_pct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Weighted Progress</span>
                  <span className="text-xs text-muted-foreground">
                    {project.tasks_done}/{project.tasks_total} tasks
                  </span>
                </div>
                <WeightedProgressBar pct={project.progress_pct} config={config} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    {project.assignee_type === "HUMAN" ? (
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <User className="w-2.5 h-2.5 text-blue-400" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                        <Bot className="w-2.5 h-2.5 text-violet-400" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">{project.owner}</span>
                  </div>
                  {project.agents_active > 0 && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20">
                      <Bot className="w-2.5 h-2.5 text-violet-400" />
                      <span className="text-xs text-violet-400">{project.agents_active}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground/50" />
                  <span
                    className={cn(
                      "text-xs",
                      project.status === "AT_RISK" ? "text-red-400" : "text-muted-foreground"
                    )}
                  >
                    {project.due_date}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}