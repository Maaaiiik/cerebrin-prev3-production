"use client";

import React from "react";
import { Document } from "@/types/supabase";
import { useConfig } from "@/context/ConfigContext";
import { cn } from "@/lib/utils";
import { Calendar, Target, Briefcase, ChevronRight, AlertCircle, CheckCircle, Clock, Trash2, RefreshCw, MoreVertical } from "lucide-react";
import Link from "next/link";
import { differenceInDays, isPast, isToday } from "date-fns";

interface ProjectCardProps {
    project: Document;
    workspaceName?: string;
    compact?: boolean;
    onDiscard?: (project: Document) => void;
    isArchived?: boolean;
}

export function ProjectCard({ project, workspaceName, compact = false, onDiscard, isArchived = false }: ProjectCardProps) {
    const { t } = useConfig();

    // --- Business Logic ---
    const getTrafficLightStatus = () => {
        const dueDate = project.due_date ? new Date(project.due_date) : null;
        const priority = (project.metadata as any)?.priority || 0;
        const progress = (project.metadata as any)?.progress || 0;

        if (dueDate && isPast(dueDate) && !isToday(dueDate)) return "red";
        if (priority >= 8 && progress < 20) return "red";
        if (dueDate && differenceInDays(dueDate, new Date()) <= 3) return "yellow";
        if (priority >= 5) return "yellow";
        return "green";
    };

    const statusColor = getTrafficLightStatus();

    const statusStyles: any = {
        red: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900",
        yellow: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900",
        green: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900",
    };

    const progressColors: any = {
        red: "text-red-500",
        yellow: "text-amber-500",
        green: "text-emerald-500",
    };

    return (
        <div className={cn(
            "dashboard-card group relative flex flex-col h-full overflow-hidden transition-all duration-300",
            compact ? "p-6" : "p-8",
            isArchived && "opacity-60 grayscale hover:grayscale-0"
        )}>
            {/* Top Row: Tags */}
            <div className="flex items-center justify-between mb-6">
                <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                    !isArchived ? statusStyles[statusColor] : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                    {!isArchived && (
                        <>
                            {statusColor === 'red' && <AlertCircle size={10} />}
                            {statusColor === 'yellow' && <Clock size={10} />}
                            {statusColor === 'green' && <CheckCircle size={10} />}
                        </>
                    )}
                    {isArchived ? t("projects.archived") : (statusColor === 'red' ? 'Critical' : statusColor === 'yellow' ? 'Attention' : t("projects.active"))}
                </div>

                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                    <Briefcase size={12} />
                    <span className="truncate max-w-[80px]">{workspaceName}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <Link href={`/projects/${project.id}`} className="block">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                        {project.title}
                    </h3>
                </Link>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold uppercase mt-4">
                    {project.due_date && (
                        <div className="flex items-center gap-1.5">
                            <Calendar size={12} />
                            {new Date(project.due_date).toLocaleDateString()}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Target size={12} />
                        P: {(project.metadata as any)?.priority || 0}
                    </div>
                </div>
            </div>

            {/* Bottom: Progress & Actions */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                            <circle
                                cx="20" cy="20" r="16"
                                stroke="currentColor" strokeWidth="3" fill="transparent"
                                strokeDasharray={100}
                                strokeDashoffset={100 - ((project.metadata as any)?.progress || 0)}
                                className={cn("transition-all duration-500", progressColors[statusColor])}
                            />
                        </svg>
                        <span className="absolute text-[10px] font-black text-slate-900 dark:text-white font-mono">
                            {(project.metadata as any)?.progress || 0}%
                        </span>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Progress</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{statusColor} zone</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onDiscard && (
                        <button
                            onClick={() => onDiscard(project)}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm"
                            title={isArchived ? t("projects.restore") : t("projects.archive")}
                        >
                            {isArchived ? <RefreshCw size={16} /> : <Trash2 size={16} />}
                        </button>
                    )}
                    <Link
                        href={`/projects/${project.id}`}
                        className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <ChevronRight size={20} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
