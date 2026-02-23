"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { supabaseClient } from "@/lib/supabase";
import { Idea } from "@/types/supabase";
import { Loader2, Lightbulb, Search, Filter, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { IdeaForm } from "@/components/features/IdeaForm";
import { IdeaCard } from "@/components/features/IdeaCard";

export default function IdeasPage() {
    const { workspaces, isLoading: isContextLoading } = useWorkspace();
    const { t } = useConfig();

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'incubator' | 'projects'>('incubator');
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        fetchIdeas();
    }, []);

    const fetchIdeas = async () => {
        setLoading(true);

        const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");
        if (isMockMode) {
            setIdeas([
                {
                    id: "mock-1", title: "Automate Ebox Reporting", description: "Use OpenClaw to automate weekly reports...",
                    priority_score: 9, progress_pct: 45, status: "evaluating", workspace_id: "ws-1", estimated_effort: 3, ai_analysis: "High impact",
                    source_url: "https://ebox.lat", idea_number: 1
                },
                {
                    id: "mock-3", title: "Promoted Project Example", description: "Already in Kanban",
                    priority_score: 10, progress_pct: 100, status: "executed", workspace_id: "ws-1", estimated_effort: 5, idea_number: 2
                }
            ]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabaseClient
            .from("idea_pipeline")
            .select("*")
            .order("priority_score", { ascending: false });

        if (error) {
            console.error("Error fetching ideas:", error);
        } else {
            setIdeas(data || []);
        }
        setLoading(false);
    };

    const handlePromote = async (idea: Idea) => {
        if (!confirm(`Promote "${idea.title}" to Mission?`)) return;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");
            const isDev = process.env.NODE_ENV === 'development';

            let userId = user?.id;
            if (!userId && (isMockMode || isDev)) {
                userId = "00000000-0000-0000-0000-000000000000";
            }

            if (!userId) {
                alert("Auth error. Please login.");
                return;
            }

            const response = await fetch('/api/ideas/promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idea_id: idea.id,
                    workspace_id: idea.workspace_id,
                    user_id: userId
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Failed to promote");

            alert(`Success! "${idea.title}" launched.`);
            fetchIdeas();

        } catch (error: any) {
            console.error("Promotion failed:", error);
            alert("Error: " + error.message);
        }
    };

    const handleDiscard = async (idea: Idea) => {
        if (!confirm(`Archive "${idea.title}"?`)) return;

        try {
            const { error } = await supabaseClient
                .from("idea_pipeline")
                .update({ status: 'discarded' })
                .eq('id', idea.id);

            if (error) throw error;
            fetchIdeas();
        } catch (error: any) {
            console.error("Discard failed:", error);
            alert("Error: " + error.message);
        }
    };

    const incubatorIdeas = ideas.filter(i => i.status !== 'executed' && i.status !== 'discarded');
    const projectIdeas = ideas.filter(i => i.status === 'executed');
    const archivedIdeas = ideas.filter(i => i.status === 'discarded');

    const displayedIdeas = showArchived
        ? archivedIdeas
        : activeTab === 'incubator'
            ? incubatorIdeas
            : projectIdeas;

    const getWorkspaceName = (id: string) => {
        return workspaces.find(w => w.id === id)?.name || "Unknown Node";
    };

    return (
        <div className="p-6 lg:p-12 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scrollbar">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                            {t("ideas.title")}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
                            {t("ideas.subtitle")}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search signals..."
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 transition-all"
                            />
                        </div>
                        <IdeaForm onSuccess={fetchIdeas} />
                    </div>
                </div>

                {/* Modern Navigation Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex gap-8">
                        <button
                            onClick={() => { setActiveTab('incubator'); setShowArchived(false); }}
                            className={cn(
                                "pb-4 px-2 text-sm font-black transition-all relative flex items-center gap-3",
                                activeTab === 'incubator' && !showArchived ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            <span className="uppercase tracking-widest">{t("ideas.tab_seeds")}</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors",
                                activeTab === 'incubator' && !showArchived ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                            )}>
                                {incubatorIdeas.length}
                            </span>
                            {activeTab === 'incubator' && !showArchived && (
                                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => { setActiveTab('projects'); setShowArchived(false); }}
                            className={cn(
                                "pb-4 px-2 text-sm font-black transition-all relative flex items-center gap-3",
                                activeTab === 'projects' && !showArchived ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            )}
                        >
                            <span className="uppercase tracking-widest">{t("ideas.tab_projects")}</span>
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors",
                                activeTab === 'projects' && !showArchived ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                            )}>
                                {projectIdeas.length}
                            </span>
                            {activeTab === 'projects' && !showArchived && (
                                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                showArchived
                                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400"
                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <span>{t("ideas.trash")}</span>
                            <span className="opacity-50 font-mono tracking-tighter">[{archivedIdeas.length}]</span>
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-64 rounded-3xl" />
                        ))
                    ) : displayedIdeas.length === 0 ? (
                        <div className="col-span-full py-32">
                            <EmptyState
                                icon={Lightbulb}
                                title={t("ideas.empty_title")}
                                description={
                                    activeTab === 'incubator'
                                        ? t("ideas.empty_desc")
                                        : t("ideas.empty_desc_projects")
                                }
                                color="indigo"
                            />
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {displayedIdeas.map((idea) => (
                                <IdeaCard
                                    key={idea.id}
                                    idea={idea}
                                    activeTab={activeTab}
                                    onPromote={handlePromote}
                                    onDiscard={handleDiscard}
                                    workspaceName={getWorkspaceName(idea.workspace_id)}
                                />
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}
