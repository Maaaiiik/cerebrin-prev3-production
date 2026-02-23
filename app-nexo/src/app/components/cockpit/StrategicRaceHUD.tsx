import { useState, useEffect } from "react";
import { RefreshCw, Trophy, TrendingUp, Users, Zap, ChevronRight, Award, CheckCircle2, Lightbulb, Shield, Sparkles, TrendingUp as TrendingUpIcon, X } from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import { fetchLeaderboard, fetchPointsBreakdown, type LeaderboardEntry, type PointsBreakdown } from "../../services/api";

const MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_ORDER = [1, 0, 2]; // visual: 2nd left, 1st center, 3rd right
const PODIUM_H     = [80, 110, 64];  // bar heights in px
const CURRENT_WEEK = 7;

// ─── Sub-components ────────────────────────────────────────────────────────────

function VelocityDots({ velocity, barColor }: { velocity: number; barColor: string }) {
  const filled = Math.round(velocity / 20);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn("w-1 h-1 rounded-full", i < filled ? barColor + "/70" : "bg-muted-foreground/15")}
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function StrategicRaceHUD() {
  const [data, setData]     = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<LeaderboardEntry | null>(null);
  const [pointsDetail, setPointsDetail] = useState<PointsBreakdown | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Initial load from real API
  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const entries = await fetchLeaderboard();
        setData(entries);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
        toast.error("Error al cargar leaderboard");
      }
    };
    loadLeaderboard();
  }, []);

  // Simulate live micro-updates every 12s (real SSE would replace this)
  useEffect(() => {
    if (data.length === 0) return;
    const id = setInterval(() => {
      setData((prev) =>
        prev.map((d) => ({
          ...d,
          score: d.score + Math.floor(Math.random() * 8),
          tasks: d.tasks + (Math.random() > 0.7 ? 1 : 0),
        }))
      );
    }, 12000);
    return () => clearInterval(id);
  }, [data.length]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const freshData = await fetchLeaderboard();
      setData(
        freshData
          .sort((a, b) => b.score - a.score)
          .map((d, i) => ({ ...d, rank: i + 1 }))
      );
      toast.success("Leaderboard sincronizado", {
        description: "Datos actualizados desde /api/performance/leaderboard",
      });
    } catch (error) {
      console.error("Failed to refresh leaderboard:", error);
      toast.error("Error al actualizar leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const maxScore = data[0]?.score ?? 1;
  const podium   = PODIUM_ORDER.map((i) => data[i]).filter(Boolean);

  const handleTeamClick = async (team: LeaderboardEntry) => {
    setSelectedTeam(team);
    setLoadingDetails(true);
    try {
      const details = await fetchPointsBreakdown(`team_${team.team.toLowerCase()}`);
      setPointsDetail(details);
    } catch (error) {
      console.error("Failed to load points breakdown:", error);
      toast.error("Error al cargar desglose de puntos");
    } finally {
      setLoadingDetails(false);
    }
  };

  const footerStats = [
    { icon: Zap,       label: "Tareas totales",  value: data.reduce((s, d) => s + d.tasks, 0).toString(), color: "text-violet-400" },
    { icon: Users,     label: "Equipos activos", value: data.length.toString(),                            color: "text-blue-400"   },
    { icon: TrendingUpIcon, label: "Vel. media", value: Math.round(data.reduce((s, d) => s + d.velocity, 0) / data.length) + "%", color: "text-emerald-400" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">

      {/* ── Tactical header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-foreground uppercase tracking-widest"
            style={{ fontWeight: 800, fontSize: 10, letterSpacing: "0.18em", fontStyle: "italic" }}
          >
            Strategic Race · Semana {CURRENT_WEEK}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse inline-block" />
            <span
              className="text-muted-foreground/40 uppercase tracking-widest"
              style={{ fontSize: 9, fontWeight: 600 }}
            >
              Live · /api/performance/leaderboard
            </span>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 text-muted-foreground/50 hover:text-foreground hover:border-border transition-all text-xs disabled:opacity-40 shrink-0"
        >
          <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
          {loading ? "Sync…" : "Actualizar"}
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">

        {/* Podium */}
        <div>
          <p
            className="text-muted-foreground/40 uppercase tracking-widest mb-3"
            style={{ fontSize: "9px", fontWeight: 600 }}
          >
            Podio — Top 3
          </p>
          <div className="flex items-end justify-center gap-3">
            {podium.map((team, vi) => {
              const h = PODIUM_H[vi];
              return (
                <div key={team.team} className="flex flex-col items-center gap-1 flex-1">
                  <span style={{ fontSize: 18 }}>{MEDALS[team.rank - 1]}</span>
                  <span style={{ fontSize: 16 }}>{team.emoji}</span>
                  <p className="text-foreground text-center truncate" style={{ fontSize: "10px", fontWeight: 700 }}>
                    {team.team}
                  </p>
                  <p className={cn("tabular-nums text-center", team.textColor)} style={{ fontSize: "9px", fontWeight: 600 }}>
                    {team.score.toLocaleString()}
                  </p>
                  {/* Podium column */}
                  <div
                    className={cn(
                      "w-full rounded-t-lg flex items-end justify-center pb-1.5 border-t-2",
                      team.barColor + "/20",
                      team.barColor.replace("bg-", "border-") + "/40"
                    )}
                    style={{ height: h }}
                  >
                    <span className="text-muted-foreground/25" style={{ fontSize: "11px", fontWeight: 700 }}>
                      #{team.rank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border/40" />

        {/* Race tracks — all teams */}
        <div>
          <p
            className="text-muted-foreground/40 uppercase tracking-widest mb-3"
            style={{ fontSize: "9px", fontWeight: 600 }}
          >
            Clasificación General
          </p>
          <div className="space-y-3.5">
            {data.map((team) => {
              const pct = Math.round((team.score / maxScore) * 100);
              return (
                <div
                  key={team.team}
                  className="cursor-pointer hover:bg-muted/20 -mx-2 px-2 py-2 rounded-xl transition-all duration-200"
                  onClick={() => handleTeamClick(team)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-muted-foreground/40 tabular-nums w-4 text-right"
                        style={{ fontSize: "10px", fontWeight: 600 }}
                      >
                        #{team.rank}
                      </span>
                      <span style={{ fontSize: "14px" }}>{team.emoji}</span>
                      <span className="text-foreground" style={{ fontSize: "11px", fontWeight: 600 }}>
                        {team.team}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "tabular-nums",
                          team.positive ? "text-emerald-400/80" : "text-rose-400/80"
                        )}
                        style={{ fontSize: "10px", fontWeight: 600 }}
                      >
                        {team.delta}
                      </span>
                      <span className={cn("tabular-nums", team.textColor)} style={{ fontSize: "10px", fontWeight: 700 }}>
                        {team.score.toLocaleString()}
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                    </div>
                  </div>

                  {/* Race bar */}
                  <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={cn("absolute left-0 top-0 bottom-0 rounded-full transition-all duration-700", team.barColor + "/60")}
                      style={{ width: `${pct}%` }}
                    />
                    {/* Velocity marker dot */}
                    <div
                      className={cn("absolute top-0.5 w-1 h-1 rounded-full shadow-sm", team.barColor)}
                      style={{ left: `calc(${pct}% - 4px)`, transition: "left 0.7s ease" }}
                    />
                  </div>

                  {/* Sub-stats row */}
                  <div className="flex items-center gap-2.5 mt-1">
                    <span className="text-muted-foreground/30" style={{ fontSize: "9px" }}>
                      {team.tasks} tareas
                    </span>
                    <span className="text-muted-foreground/20">·</span>
                    <span className="text-muted-foreground/30" style={{ fontSize: "9px" }}>
                      vel. {team.velocity}%
                    </span>
                    <span className="text-muted-foreground/20">·</span>
                    <VelocityDots velocity={team.velocity} barColor={team.barColor} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-border/40" />

        {/* Footer stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {footerStats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-2.5 rounded-xl border border-border/40 bg-muted/20">
              <Icon className={cn("w-3 h-3 mb-1.5", color)} />
              <p className={cn("tabular-nums", color)} style={{ fontSize: "18px", fontWeight: 700 }}>
                {value}
              </p>
              <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: "9px" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Points Breakdown Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setSelectedTeam(null); setPointsDetail(null); }}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl m-4" onClick={(e) => e.stopPropagation()}>
            {loadingDetails ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 animate-spin text-violet-400" />
              </div>
            ) : pointsDetail ? (
              <div className="space-y-5 p-6">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                  <span style={{ fontSize: 32 }}>{selectedTeam.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-foreground text-lg" style={{ fontWeight: 700 }}>{selectedTeam.team}</h3>
                    <p className="text-muted-foreground/60 text-xs mt-0.5">Desglose de puntos · Semana {CURRENT_WEEK}</p>
                  </div>
                  <button onClick={() => { setSelectedTeam(null); setPointsDetail(null); }} className="text-muted-foreground/50 hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Total Points */}
                <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-violet-500/10 border border-amber-500/20 p-5 text-center">
                  <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-muted-foreground/60 text-xs uppercase tracking-widest mb-1" style={{ fontWeight: 600 }}>Puntos Totales</p>
                  <p className={cn("text-5xl tabular-nums", selectedTeam.textColor)} style={{ fontWeight: 800 }}>{pointsDetail.total_points.toLocaleString()}</p>
                </div>

                {/* Breakdown */}
                <div>
                  <p className="text-muted-foreground/40 uppercase tracking-widest mb-3" style={{ fontSize: 9, fontWeight: 600 }}>Desglose por Categoría</p>
                  <div className="space-y-2">
                    {[
                      { key: "tasks_completed", label: "Tareas completadas", icon: CheckCircle2, color: "text-blue-400" },
                      { key: "projects_completed", label: "Proyectos terminados", icon: Award, color: "text-violet-400" },
                      { key: "ideas_promoted", label: "Ideas promovidas", icon: Lightbulb, color: "text-amber-400" },
                      { key: "hitl_approvals", label: "Aprobaciones HITL", icon: Shield, color: "text-emerald-400" },
                      { key: "velocity_bonus", label: "Bonus de velocidad", icon: Sparkles, color: "text-rose-400" },
                    ].map(({ key, label, icon: Icon, color }) => {
                      const value = pointsDetail.breakdown[key as keyof typeof pointsDetail.breakdown];
                      return (
                        <div key={key} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40">
                          <div className="flex items-center gap-2.5">
                            <Icon className={cn("w-3.5 h-3.5", color)} />
                            <span className="text-foreground text-sm">{label}</span>
                          </div>
                          <span className={cn("tabular-nums text-sm", color)} style={{ fontWeight: 700 }}>+{value.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activities */}
                <div>
                  <p className="text-muted-foreground/40 uppercase tracking-widest mb-3" style={{ fontSize: 9, fontWeight: 600 }}>Actividad Reciente</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pointsDetail.recent_activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-muted/20 border border-border/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-xs">{activity.action}</p>
                          <p className="text-muted-foreground/50 text-xs mt-0.5">{activity.user_name} · {activity.timestamp}</p>
                        </div>
                        <span className="text-emerald-400 text-xs shrink-0" style={{ fontWeight: 700 }}>+{activity.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
