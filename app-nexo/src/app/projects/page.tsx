"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { supabaseClient } from "@/lib/supabase";
import { Document } from "@/types/supabase";
import { Loader2, Briefcase, Plus, FolderOpen, ArrowRight, Clock, Filter, Trash2, RefreshCw, Zap, Search } from "lucide-react";
import Link from "next/link";
import { ProjectForm } from "@/components/features/ProjectForm";
import { ProjectCard } from "@/components/features/ProjectCard";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProjectsListPage() {
    const { workspaces, activeWorkspaceId, setActiveWorkspaceId, isLoading: isContextLoading } = useWorkspace();
    const { t } = useConfig();

    const [projects, setProjects] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterWorkspace, setFilterWorkspace] = useState<string | 'all'>('all');
    const [showArchived, setShowArchived] = useState(false);

    // Sync filter with context
    useEffect(() => {
        if (activeWorkspaceId) {
            setFilterWorkspace(activeWorkspaceId);
        }
    }, [activeWorkspaceId]);

    useEffect(() => {
        fetchProjects();
    }, [filterWorkspace, activeWorkspaceId, showArchived]);

    const fetchProjects = async () => {
        setLoading(true);

        const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder");
        if (isMockMode) {
            setProjects([
                { id: "p1", title: "Project Phoenix", category: "In Progress", workspace_id: "ws1", type: "project", created_at: new Date().toISOString() } as any,
                { id: "p2", title: "Titan Infrastructure", category: "Strategy", workspace_id: "ws2", type: "project", created_at: new Date().toISOString() } as any
            ]);
            setLoading(false);
            return;
        }

        let query = supabaseClient
            .from("documents")
            .select("*")
            .or("type.eq.project,category.eq.En Progreso,category.eq.Proyectos,category.eq.project,type.eq.En Progreso")
            .is("parent_id", null)
            .order("created_at", { ascending: false });

        if (showArchived) {
            query = query.eq("is_archived", true);
        } else {
            query = query.or("is_archived.eq.false,is_archived.is.null");
        }

        if (filterWorkspace !== 'all') {
            query = query.eq("workspace_id", filterWorkspace);
        }

        const { data, error } = await query;
        if (error) console.error("Error fetching projects:", error);
        else setProjects(data || []);
        setLoading(false);
    };

    const handleDiscard = async (project: Document) => {
        const action = showArchived ? "RESTAURAR" : "ARCHIVAR";
        if (!confirm(`Confirm ${action} for "${project.title}"?`)) return;

        try {
            const { error } = await supabaseClient
                .from("documents")
                .update({ is_archived: !showArchived })
                .eq('id', project.id);

            if (error) throw error;
            fetchProjects();
        } catch (err: any) {
            alert(`Error: ` + err.message);
        }
    };

    const getWorkspaceName = (id: string) => {
        return workspaces.find(w => w.id === id)?.name || "Unknown Node";
    };

    return (
        <div className="p-6 lg:p-12 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 custom-scrollbar">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                            {t("projects.title")}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
                            {t("projects.subtitle")}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/ideas"
                            className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                        >
                            <Zap size={16} className="text-amber-500" />
                            <span>{t("projects.from_incubator")}</span>
                        </Link>
                        <ProjectForm onSuccess={fetchProjects} />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 mr-2">
                            <Filter size={16} />
                        </div>
                        <button
                            onClick={() => {
                                setFilterWorkspace('all');
                                setActiveWorkspaceId(null);
                            }}
                            className={cn(
                                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                                filterWorkspace === 'all'
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            )}
                        >
                            All Nodes
                        </button>
                        {workspaces.map(ws => (
                            <button
                                key={ws.id}
                                onClick={() => {
                                    setFilterWorkspace(ws.id);
                                    setActiveWorkspaceId(ws.id);
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                                    filterWorkspace === ws.id
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                )}
                            >
                                {ws.name}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                            showArchived
                                ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        )}
                    >
                        <Trash2 size={14} />
                        {showArchived ? t("projects.archived") : t("projects.trash")}
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-900 rounded-3xl animate-pulse" />)}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="py-20 animate-fade-in">
                        <EmptyState
                            icon={showArchived ? Trash2 : FolderOpen}
                            title={showArchived ? t("projects.empty_trash") : t("projects.empty_title")}
                            description={
                                showArchived
                                    ? ""
                                    : t("projects.empty_desc")
                            }
                            color={showArchived ? "orange" : "indigo"}
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {projects.map((project, i) => (
                                <motion.div
                                    key={project.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <ProjectCard
                                        project={project}
                                        workspaceName={getWorkspaceName(project.workspace_id)}
                                        onDiscard={handleDiscard}
                                        isArchived={showArchived}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
