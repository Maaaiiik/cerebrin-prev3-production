"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { supabaseClient } from "@/lib/supabase";
import { Activity, Loader2, GitCommit, Zap, FileText, CheckCircle, Bot, XCircle, Search, Filter, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";

type ActivityItem = {
    id: string;
    created_at: string;
    action_type: string;
    description: string;
    workspace_id: string;
    metadata?: any;
};

export default function ActivityPage() {
    const { activeWorkspaceId, isLoading: isContextLoading } = useWorkspace();
    const { t, language } = useConfig();

    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [filterAgentId, setFilterAgentId] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isContextLoading) return;
        if (!activeWorkspaceId) {
            setLoading(false);
            setActivities([]);
            return;
        }

        const fetchData = async () => {
            setLoading(true);

            const { data: agentsData } = await supabaseClient
                .from("workspace_agents")
                .select("id, name")
                .eq("workspace_id", activeWorkspaceId!);
            setAgents(agentsData || []);

            let query = supabaseClient
                .from("activity_feed")
                .select("*")
                .eq("workspace_id", activeWorkspaceId)
                .order("created_at", { ascending: false });

            if (filterAgentId !== "all") {
                query = query.contains("metadata", { agent_id: filterAgentId });
            }

            const { data, error } = await query.limit(50);
            if (error) console.error("Error loading activity:", error);
            else setActivities(data || []);
            setLoading(false);
        };

        fetchData();
    }, [activeWorkspaceId, isContextLoading, filterAgentId]);

    const getIcon = (type: string) => {
        if (type.includes("agent")) return <Bot size={18} className="text-indigo-600 dark:text-indigo-400" />;
        if (type.includes("promote")) return <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />;
        if (type.includes("idea")) return <Zap size={18} className="text-amber-600 dark:text-amber-400" />;
        if (type.includes("document")) return <FileText size={18} className="text-blue-600 dark:text-blue-400" />;
        return <GitCommit size={18} className="text-slate-400" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="p-6 lg:p-12 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scrollbar transition-colors duration-300">
            <div className="max-w-5xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                            {t("activity.title")}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
                            {t("activity.subtitle")}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                                value={filterAgentId}
                                onChange={(e) => setFilterAgentId(e.target.value)}
                            >
                                <option value="all">{language === 'es' ? 'Todos los Agentes' : 'All Agents'}</option>
                                {agents.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 rounded-full" />

                    <div className="space-y-12">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="relative pl-16">
                                    <Skeleton className="absolute left-[8px] top-1 w-10 h-10 rounded-2xl" />
                                    <div className="dashboard-card p-6 space-y-3">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                </div>
                            ))
                        ) : activities.length === 0 ? (
                            <div className="text-center py-32">
                                <Activity className="w-16 h-16 mx-auto mb-6 text-slate-200 dark:text-slate-800" />
                                <h3 className="text-xl font-black text-slate-400 uppercase italic">
                                    {language === 'es' ? 'Silencio en las Comunicaciones' : 'Silence in Communications'}
                                </h3>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {activities.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative pl-16 group"
                                    >
                                        <div className="absolute left-[8px] top-1 w-10 h-10 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center z-10 shadow-sm group-hover:scale-110 group-hover:border-indigo-500 transition-all">
                                            {getIcon(item.action_type)}
                                        </div>

                                        <div className="dashboard-card p-8 group-hover:border-indigo-500/30 transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900">
                                                        {item.action_type.replace("_", " ")}
                                                    </span>
                                                    {item.metadata?.agent_name && (
                                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">
                                                            {item.metadata.agent_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                                                    <Clock size={12} />
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </div>

                                            <p className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed text-lg">
                                                {item.description}
                                            </p>

                                            {item.metadata?.details && (
                                                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-500 overflow-x-auto">
                                                    <pre>{JSON.stringify(item.metadata.details, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
