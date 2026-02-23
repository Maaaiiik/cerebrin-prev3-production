"use client";

import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { supabaseClient } from "@/lib/supabase";
import {
    Lightbulb,
    FileText,
    BrainCircuit,
    TrendingUp,
    Activity,
    Calendar,
    Layers,
    AlertTriangle,
    ShieldAlert,
    Target,
    Zap,
    History,
    ShieldCheck,
    Crosshair,
    ArrowRight,
    Globe
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function GlobalDashboard() {
    const { workspaces, isLoading: isContextLoading } = useWorkspace();
    const { t } = useConfig();

    const [stats, setStats] = useState({
        ideasCount: 0,
        activeTasksCount: 0,
        upcomingTasks: [] as any[],
        activeProjects: [] as any[],
        recentActivity: [] as any[],
        atRiskItems: [] as any[],
        loading: true
    });

    const getWorkspaceName = (id: string) => {
        return workspaces.find(w => w.id === id)?.name || "Unknown";
    };

    useEffect(() => {
        async function fetchStats() {
            if (isContextLoading) return;

            setStats(prev => ({ ...prev, loading: true }));

            // Fallback for mock mode
            if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
                setTimeout(() => {
                    setStats({
                        ideasCount: 32,
                        activeTasksCount: 18,
                        upcomingTasks: [
                            { id: "1", title: "Quarterly Report", due_date: new Date().toISOString(), category: "In Progress", workspace_id: "1" },
                            { id: "2", title: "Compliance Review", due_date: new Date(Date.now() + 86400000).toISOString(), category: "Research", workspace_id: "2" }
                        ],
                        activeProjects: [
                            { id: "1", title: "Project Phoenix", ai_analysis: "Market strategy phase initiated.", category: "Strategy", workspace_id: "1" },
                            { id: "2", title: "Titan Infrastructure", ai_analysis: "Scaling protocols validated.", category: "Operations", workspace_id: "2" }
                        ],
                        recentActivity: [
                            { id: "1", action_type: "promote_idea", description: "Market signal promoted to project Phoenix", created_at: new Date().toISOString(), workspace_id: "1" },
                            { id: "2", action_type: "agent_sync", description: "Node Titan synchronization complete", created_at: new Date(Date.now() - 3600000).toISOString(), workspace_id: "2" }
                        ],
                        atRiskItems: [],
                        loading: false
                    });
                }, 1000);
                return;
            }

            try {
                const [ideasRes, tasksRes, upcomingRes, projectsRes, activityRes] = await Promise.all([
                    supabaseClient.from("idea_pipeline").select("*", { count: 'exact', head: true }),
                    supabaseClient.from("documents").select("*", { count: 'exact', head: true }).neq("category", "Finalizado"),
                    supabaseClient.from("documents").select("id, title, due_date, category, workspace_id").neq("category", "Finalizado").not("due_date", "is", null).order("due_date", { ascending: true }).limit(5),
                    supabaseClient.from("documents").select("id, title, category, ai_analysis, workspace_id").contains("tags", ["proyecto"]).neq("category", "Finalizado").limit(4),
                    supabaseClient.from("activity_feed").select("id, action_type, description, created_at, workspace_id").order("created_at", { ascending: false }).limit(10)
                ]);

                setStats({
                    ideasCount: ideasRes.count || 0,
                    activeTasksCount: tasksRes.count || 0,
                    upcomingTasks: upcomingRes.data || [],
                    activeProjects: projectsRes.data || [],
                    recentActivity: activityRes.data || [],
                    atRiskItems: (upcomingRes.data || []).filter((t: any) => new Date(t.due_date) < new Date()),
                    loading: false
                });

            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        }

        fetchStats();
    }, [isContextLoading]);

    return (
        <div className="p-6 lg:p-12 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scrollbar relative">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8 relative z-10">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Globe size={16} className="text-indigo-600 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{t("global.title")}</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                        Mission <span className="text-indigo-600">Control.</span>
                    </h1>

                    {/* Node Cluster Display */}
                    <div className="flex items-center gap-6 mt-8 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm w-fit">
                        <div className="flex -space-x-2">
                            {workspaces.slice(0, 8).map((w, i) => (
                                <div key={w.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm" title={w.name}>
                                    <span className="text-[10px] font-black text-slate-500">{w.name.charAt(0)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("global.nodes")}</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{workspaces.length.toString().padStart(2, '0')}</span>
                        </div>
                    </div>
                </div>

                <div className="hidden md:flex flex-col items-end">
                    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-right">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">{t("global.system_time")}</span>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{format(new Date(), "HH:mm:ss")}</span>
                        <div className="flex items-center gap-2 mt-2 justify-end">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">System Optimal</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategic Pillars - TOP KPI BOXES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {stats.loading ? [1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />) : (
                    <>
                        <StrategicPillarCard
                            title={t("global.strategic_ideation")}
                            label="Phase 01"
                            value={stats.ideasCount}
                            meta="+12.4% vs prev"
                            icon={<Lightbulb className="w-6 h-6" />}
                            color="indigo"
                        />
                        <StrategicPillarCard
                            title={t("global.operational_execution")}
                            label="Phase 02"
                            value={stats.activeTasksCount}
                            meta="Efficiency: 98%"
                            icon={<Zap className="w-6 h-6" />}
                            color="emerald"
                        />
                        <StrategicPillarCard
                            title={t("global.governance_risk")}
                            label="Phase 03"
                            value={stats.atRiskItems.length > 0 ? "ALERT" : "SECURE"}
                            meta={stats.atRiskItems.length > 0 ? `${stats.atRiskItems.length} Breaches Detected` : "Risk index: 0.02"}
                            icon={<ShieldCheck className="w-6 h-6" />}
                            color={stats.atRiskItems.length > 0 ? "red" : "amber"}
                            alert={stats.atRiskItems.length > 0}
                        />
                    </>
                )}
            </div>

            {/* Detailed Sub-Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* COLUMN 1: Signals (Ideation) */}
                <div className="space-y-6">
                    <SectionHeader title={t("global.strategic_ideation")} count={stats.ideasCount} color="indigo" />
                    <div className="dashboard-card p-1 dark:bg-slate-900/50">
                        <div className="p-8 space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex flex-col p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group cursor-pointer">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">Signal Sigma_{i}</span>
                                        <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">Strategic intelligence capture regarding market expansion node {i}.</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: Missions (Execution) */}
                <div className="space-y-6">
                    <SectionHeader title={t("global.operational_execution")} count={stats.activeProjects.length} color="emerald" />
                    <div className="space-y-4">
                        {stats.activeProjects.map(proj => (
                            <Link key={proj.id} href="/documents" className="block">
                                <motion.div
                                    whileHover={{ y: -4 }}
                                    className="dashboard-card p-8 group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{getWorkspaceName(proj.workspace_id)}</span>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase mt-1 group-hover:text-emerald-500 transition-colors">{proj.title}</h3>
                                        </div>
                                    </div>
                                    <div className="py-2 border-l-2 border-emerald-500 pl-4 mb-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                            {proj.ai_analysis || "Awaiting intelligence analysis..."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        Deployment active // {proj.category}
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* COLUMN 3: Monitoring (NOC/Risk) */}
                <div className="space-y-6">
                    <SectionHeader title={t("global.governance_risk")} count={stats.atRiskItems.length} color="red" />

                    {/* RISK CARD */}
                    <div className="dashboard-card p-8 bg-white dark:bg-slate-900 border-none shadow-xl shadow-slate-200 dark:shadow-black">
                        <h4 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <AlertTriangle size={14} className="animate-pulse" />
                            {t("global.at_risk")}
                        </h4>
                        <div className="space-y-4">
                            {stats.atRiskItems.length === 0 ? (
                                <div className="p-12 text-center opacity-40">
                                    <ShieldCheck size={40} className="mx-auto mb-4 text-emerald-500" />
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Zone Secure</p>
                                </div>
                            ) : (
                                stats.atRiskItems.map(item => (
                                    <div key={item.id} className="p-5 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/50">
                                        <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-1 uppercase leading-tight">{item.title}</h5>
                                        <div className="flex justify-between items-center mt-3">
                                            <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter tabular-nums">BREACH: {format(new Date(item.due_date), "dd.MM")}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{getWorkspaceName(item.workspace_id)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* OPS LOG CARD */}
                    <div className="dashboard-card p-8 dark:bg-slate-900/40">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                            <History size={14} />
                            {t("global.ops_log")}
                        </h4>
                        <div className="space-y-5 relative">
                            <div className="absolute left-[3.5px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" />
                            {stats.recentActivity.slice(0, 6).map(act => (
                                <div key={act.id} className="relative pl-6 group">
                                    <div className="absolute left-0 top-1 w-2 h-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 z-10 group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-all" />
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight mb-1 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">{act.description}</p>
                                    <span className="text-[10px] font-mono text-slate-400 uppercase">{format(new Date(act.created_at), "HH:mm:ss")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- Internal Components ---

function StrategicPillarCard({ title, label, value, meta, icon, color, alert = false }: any) {
    const colorStyles: any = {
        indigo: "text-indigo-600 bg-white dark:bg-slate-900 outline-indigo-500/0 hover:outline-indigo-500/20",
        emerald: "text-emerald-600 bg-white dark:bg-slate-900 outline-emerald-500/0 hover:outline-emerald-500/20",
        amber: "text-amber-600 bg-white dark:bg-slate-900 outline-amber-500/0 hover:outline-amber-500/20",
        red: "text-red-500 bg-white dark:bg-slate-900 outline-red-500/0 hover:outline-red-500/20"
    };

    const iconStyles: any = {
        indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600",
        emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600",
        amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600",
        red: "bg-red-50 dark:bg-red-500/10 text-red-500"
    };

    return (
        <motion.div
            whileHover={{ y: -6 }}
            className={cn(
                "dashboard-card p-10 outline outline-4 transition-all duration-300",
                colorStyles[color],
                alert && "outline-red-500/20 bg-red-50/20 dark:bg-red-950/20"
            )}
        >
            <div className="flex items-start justify-between mb-8">
                <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{title}</h3>
                </div>
                <div className={cn("p-4 rounded-2xl flex items-center justify-center shadow-sm", iconStyles[color])}>
                    {icon}
                </div>
            </div>
            <div className="flex items-end justify-between">
                <span className={cn("text-5xl font-black tracking-tighter tabular-nums", alert && "animate-pulse")}>{value}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 max-w-[80px] text-right leading-tight pb-1">{meta}</span>
            </div>
        </motion.div>
    );
}

function SectionHeader({ title, count, color }: any) {
    const accents: any = {
        indigo: "bg-indigo-600 shadow-indigo-500/30",
        emerald: "bg-emerald-600 shadow-emerald-500/30",
        red: "bg-red-600 shadow-red-500/30",
    }
    return (
        <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200 dark:border-slate-800 mb-4 px-2">
            <div className="flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full shadow-lg", accents[color])} />
                <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-sans">{title}</h2>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">[{count.toString().padStart(2, '0')}]</span>
        </div>
    )
}
