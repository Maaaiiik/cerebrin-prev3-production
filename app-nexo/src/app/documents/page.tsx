"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Loader2, LayoutGrid, Calendar as CalendarIcon, Filter, Layers, Plus, Search } from "lucide-react";
import { ProcessSelector } from "@/components/ProcessSelector";
import { cn } from "@/lib/utils";
import CalendarPage from "../calendar/page";

export default function DocumentsPage() {
    const { activeWorkspaceId } = useWorkspace();
    const { t } = useConfig();
    const [view, setView] = useState<'kanban' | 'calendar'>('kanban');

    const handleProcessCallback = () => {
        console.log("Process started/finished. Refresh needed.");
    };

    return (
        <div className="h-full flex flex-col p-6 lg:p-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 shrink-0">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                        {t("assets.title")}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
                        {t("assets.subtitle")}
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => setView('kanban')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            view === 'kanban'
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <LayoutGrid size={16} />
                        {t("assets.kanban")}
                    </button>
                    <button
                        onClick={() => setView('calendar')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            view === 'calendar'
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        <CalendarIcon size={16} />
                        {t("assets.calendar")}
                    </button>

                    <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

                    {activeWorkspaceId && (
                        <ProcessSelector
                            workspaceId={activeWorkspaceId}
                            onProcessStarted={handleProcessCallback}
                        />
                    )}
                </div>
            </div>

            {/* Board / Calendar Content Layer */}
            <div className="flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-xl relative overflow-hidden flex flex-col">
                {activeWorkspaceId ? (
                    view === 'kanban' ? (
                        <div className="flex-1 overflow-hidden">
                            <KanbanBoard />
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <CalendarPage embedded />
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-6">
                        <div className="relative">
                            <Loader2 className="animate-spin text-indigo-600" size={64} />
                            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
                        </div>
                        <p className="font-black text-xl italic uppercase tracking-widest animate-pulse">
                            {t("assets.syncing")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
