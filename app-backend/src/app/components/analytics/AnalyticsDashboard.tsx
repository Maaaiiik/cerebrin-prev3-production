import { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Bot,
  BarChart3,
  LineChart,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { cn } from "../ui/utils";
import { Badge } from "../ui/badge";
import {
  LineChart as RechartsLine,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBar,
  Bar,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RealtimeMetric {
  timestamp: string;
  active_agents: number;
  tasks_in_progress: number;
  tokens_per_minute: number;
  cost_per_hour: number;
  approval_queue_length: number;
  success_rate: number;
}

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  tasks_completed: number;
  avg_completion_time_minutes: number;
  success_rate: number;
  tokens_consumed: number;
  cost_usd: number;
  color: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  agent_name: string;
  event_type: "task_complete" | "task_started" | "approval_request" | "error" | "warning";
  description: string;
  metadata?: Record<string, unknown>;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_REALTIME_DATA: RealtimeMetric[] = [
  { timestamp: "10:00", active_agents: 5, tasks_in_progress: 12, tokens_per_minute: 1200, cost_per_hour: 2.4, approval_queue_length: 3, success_rate: 94 },
  { timestamp: "10:15", active_agents: 6, tasks_in_progress: 15, tokens_per_minute: 1450, cost_per_hour: 2.9, approval_queue_length: 4, success_rate: 92 },
  { timestamp: "10:30", active_agents: 7, tasks_in_progress: 18, tokens_per_minute: 1680, cost_per_hour: 3.4, approval_queue_length: 5, success_rate: 95 },
  { timestamp: "10:45", active_agents: 6, tasks_in_progress: 14, tokens_per_minute: 1320, cost_per_hour: 2.6, approval_queue_length: 3, success_rate: 96 },
  { timestamp: "11:00", active_agents: 8, tasks_in_progress: 21, tokens_per_minute: 1920, cost_per_hour: 3.8, approval_queue_length: 6, success_rate: 93 },
  { timestamp: "11:15", active_agents: 7, tasks_in_progress: 17, tokens_per_minute: 1580, cost_per_hour: 3.2, approval_queue_length: 4, success_rate: 97 },
  { timestamp: "11:30", active_agents: 9, tasks_in_progress: 23, tokens_per_minute: 2100, cost_per_hour: 4.2, approval_queue_length: 7, success_rate: 94 },
];

const MOCK_AGENT_PERFORMANCE: AgentPerformance[] = [
  { agent_id: "writer", agent_name: "writer-bot", agent_type: "WRITER", tasks_completed: 284, avg_completion_time_minutes: 18, success_rate: 96, tokens_consumed: 142000, cost_usd: 4.26, color: "#8B5CF6" },
  { agent_id: "analyst", agent_name: "analyst-bot", agent_type: "ANALYST", tasks_completed: 412, avg_completion_time_minutes: 25, success_rate: 94, tokens_consumed: 206000, cost_usd: 6.18, color: "#3B82F6" },
  { agent_id: "strategy", agent_name: "strategy-bot", agent_type: "STRATEGY", tasks_completed: 156, avg_completion_time_minutes: 42, success_rate: 98, tokens_consumed: 78000, cost_usd: 2.34, color: "#10B981" },
  { agent_id: "dev", agent_name: "dev-bot", agent_type: "DEV", tasks_completed: 331, avg_completion_time_minutes: 35, success_rate: 91, tokens_consumed: 165500, cost_usd: 4.97, color: "#EF4444" },
  { agent_id: "research", agent_name: "research-bot", agent_type: "RESEARCH", tasks_completed: 67, avg_completion_time_minutes: 52, success_rate: 97, tokens_consumed: 33500, cost_usd: 1.01, color: "#F59E0B" },
];

const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  { id: "log1", timestamp: "11:34:22", agent_name: "writer-bot", event_type: "task_complete", description: "Completed 'Draft Q4 Marketing Report'" },
  { id: "log2", timestamp: "11:33:18", agent_name: "analyst-bot", event_type: "approval_request", description: "Requesting approval for revenue forecast update" },
  { id: "log3", timestamp: "11:32:45", agent_name: "dev-bot", event_type: "task_started", description: "Started 'Refactor API Auth Layer'" },
  { id: "log4", timestamp: "11:31:09", agent_name: "strategy-bot", event_type: "task_complete", description: "Completed 'OKR Cascade Plan 2026'" },
  { id: "log5", timestamp: "11:29:52", agent_name: "analyst-bot", event_type: "error", description: "API timeout on external data fetch" },
  { id: "log6", timestamp: "11:28:33", agent_name: "writer-bot", event_type: "task_started", description: "Started 'Localize Landing Page (ES/PT)'" },
  { id: "log7", timestamp: "11:27:14", agent_name: "research-bot", event_type: "warning", description: "High token usage detected (>5k tokens)" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [realtimeData, setRealtimeData] = useState<RealtimeMetric[]>(MOCK_REALTIME_DATA);
  const [agentPerf, setAgentPerf] = useState<AgentPerformance[]>(MOCK_AGENT_PERFORMANCE);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(MOCK_ACTIVITY_LOGS);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  // Simulate SSE streaming (replace with real subscribeToAnalytics from api.ts)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      
      const newMetric: RealtimeMetric = {
        timestamp: timeStr,
        active_agents: 6 + Math.floor(Math.random() * 4),
        tasks_in_progress: 15 + Math.floor(Math.random() * 10),
        tokens_per_minute: 1200 + Math.floor(Math.random() * 1000),
        cost_per_hour: 2.4 + Math.random() * 2,
        approval_queue_length: 3 + Math.floor(Math.random() * 5),
        success_rate: 92 + Math.floor(Math.random() * 6),
      };

      setRealtimeData((prev) => [...prev.slice(-6), newMetric]);
    }, 15000); // Update every 15s

    return () => clearInterval(interval);
  }, []);

  const latestMetric = realtimeData[realtimeData.length - 1];
  const previousMetric = realtimeData[realtimeData.length - 2];

  const calculateTrend = (current: number, previous: number) => {
    const diff = current - previous;
    const pct = previous > 0 ? (diff / previous) * 100 : 0;
    return { diff, pct, isPositive: diff >= 0 };
  };

  return (
    <div className="space-y-4 p-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-foreground" style={{ fontWeight: 700 }}>
            ANALYTICS & MONITORING
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time agent performance · SSE streaming
          </p>
        </div>
        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse" />
          Live
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Agentes Activos"
          value={latestMetric.active_agents}
          trend={calculateTrend(latestMetric.active_agents, previousMetric?.active_agents ?? 0)}
          icon={Bot}
          color="text-violet-400"
        />
        <KPICard
          title="Tareas en Curso"
          value={latestMetric.tasks_in_progress}
          trend={calculateTrend(latestMetric.tasks_in_progress, previousMetric?.tasks_in_progress ?? 0)}
          icon={Activity}
          color="text-blue-400"
        />
        <KPICard
          title="Coste/Hora"
          value={`$${latestMetric.cost_per_hour.toFixed(2)}`}
          trend={calculateTrend(latestMetric.cost_per_hour, previousMetric?.cost_per_hour ?? 0)}
          icon={DollarSign}
          color="text-emerald-400"
        />
        <KPICard
          title="Success Rate"
          value={`${latestMetric.success_rate}%`}
          trend={calculateTrend(latestMetric.success_rate, previousMetric?.success_rate ?? 0)}
          icon={CheckCircle2}
          color="text-amber-400"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Token Usage Chart */}
        <ChartCard
          title="Token Usage (per minute)"
          icon={Zap}
          expanded={expandedChart === "tokens"}
          onToggleExpand={() => setExpandedChart(expandedChart === "tokens" ? null : "tokens")}
        >
          <ResponsiveContainer width="100%" height={expandedChart === "tokens" ? 300 : 180}>
            <AreaChart data={realtimeData}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="tokens_per_minute"
                stroke="#8B5CF6"
                fillOpacity={1}
                fill="url(#colorTokens)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Tasks Chart */}
        <ChartCard
          title="Tasks in Progress"
          icon={Activity}
          expanded={expandedChart === "tasks"}
          onToggleExpand={() => setExpandedChart(expandedChart === "tasks" ? null : "tasks")}
        >
          <ResponsiveContainer width="100%" height={expandedChart === "tasks" ? 300 : 180}>
            <RechartsLine data={realtimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="timestamp" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="tasks_in_progress"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 3 }}
              />
            </RechartsLine>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Agent Performance */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>
            Agent Performance
          </h3>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <RechartsBar data={agentPerf}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="agent_name" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="tasks_completed" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <LineChart className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>
            Live Activity Stream
          </h3>
          <Badge variant="secondary" className="ml-auto text-[9px] bg-blue-500/20 text-blue-400">
            SSE
          </Badge>
        </div>
        <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
          {activityLogs.map((log) => (
            <ActivityLogRow key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── KPI Card Component ───────────────────────────────────────────────────────

interface KPICardProps {
  title: string;
  value: string | number;
  trend: { diff: number; pct: number; isPositive: boolean };
  icon: React.ElementType;
  color: string;
}

function KPICard({ title, value, trend, icon: Icon, color }: KPICardProps) {
  const TrendIcon = trend.isPositive ? TrendingUp : TrendingDown;
  const trendColor = trend.isPositive ? "text-emerald-400" : "text-red-400";

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl text-foreground" style={{ fontWeight: 700 }}>
          {value}
        </span>
        <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
          <TrendIcon className="w-3 h-3" />
          <span>{Math.abs(trend.pct).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Chart Card Component ─────────────────────────────────────────────────────

interface ChartCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  expanded: boolean;
  onToggleExpand: () => void;
}

function ChartCard({ title, icon: Icon, children, expanded, onToggleExpand }: ChartCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm text-foreground" style={{ fontWeight: 600 }}>
            {title}
          </h3>
        </div>
        <button
          onClick={onToggleExpand}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Activity Log Row Component ───────────────────────────────────────────────

interface ActivityLogRowProps {
  log: ActivityLog;
}

function ActivityLogRow({ log }: ActivityLogRowProps) {
  const eventIcons: Record<ActivityLog["event_type"], React.ElementType> = {
    task_complete: CheckCircle2,
    task_started: Clock,
    approval_request: Zap,
    error: AlertTriangle,
    warning: AlertTriangle,
  };

  const eventColors: Record<ActivityLog["event_type"], string> = {
    task_complete: "text-emerald-400 bg-emerald-500/10",
    task_started: "text-blue-400 bg-blue-500/10",
    approval_request: "text-violet-400 bg-violet-500/10",
    error: "text-red-400 bg-red-500/10",
    warning: "text-amber-400 bg-amber-500/10",
  };

  const EventIcon = eventIcons[log.event_type];
  const colorClass = eventColors[log.event_type];

  return (
    <div className="px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
          <EventIcon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground/60">{log.timestamp}</span>
            <span className="text-xs text-violet-400" style={{ fontWeight: 600 }}>
              {log.agent_name}
            </span>
          </div>
          <p className="text-sm text-foreground">{log.description}</p>
        </div>
      </div>
    </div>
  );
}
