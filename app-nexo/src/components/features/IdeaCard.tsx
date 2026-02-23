"use client";

import React, { useState } from "react";
import { Idea } from "@/types/supabase";
import { useConfig } from "@/context/ConfigContext";
import Link from "next/link";
import {
    CheckCircle,
    Link as LinkIcon,
    Sparkles,
    Clock,
    Zap,
    Target,
    Briefcase,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Calendar,
    Trash2,
    Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { HistoryTimeline } from "./HistoryTimeline";

interface IdeaCardProps {
    idea: Idea;
    activeTab: 'incubator' | 'projects';
    onPromote: (idea: Idea) => void;
    onDiscard?: (idea: Idea) => void;
    workspaceName: string;
}

export function IdeaCard({ idea, activeTab, onPromote, onDiscard, workspaceName }: IdeaCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { t } = useConfig();

    const getPriorityStyles = (score: number) => {
        if (score >= 8) return "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900";
        if (score >= 5) return "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900";
        return "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900";
    };

    const getStatusStyles = () => {
        if (activeTab === 'projects') return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900";
        return "bg-slate-50 dark:bg-slate-900/50 text-slate-500 border-slate-200 dark:border-slate-800";
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "dashboard-card group relative flex flex-col h-full",
                activeTab === 'projects' && "border-emerald-200 dark:border-emerald-800/50"
            )}
        >
            <div className="p-8 pb-4 flex-1">
                {/* Header Tags */}
                <div className="flex items-center justify-between mb-6">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        getPriorityStyles(idea.priority_score)
                    )}>
                        {t("ideas.priority")} {idea.priority_score}
                    </span>
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
                        <Briefcase size={12} />
                        <span className="truncate max-w-[100px]">{workspaceName}</span>
                    </div>
                </div>

                {/* Title & Desc */}
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight">
                    <span className="text-slate-300 dark:text-slate-700 font-mono mr-2">#{idea.idea_number}</span>
                    {idea.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-3 mb-6">
                    {idea.description}
                </p>

                {/* AI Insight Pill */}
                {idea.ai_analysis && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl mb-6 relative overflow-hidden group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t("ideas.ai_hints")}</span>
                        </div>
                        <p className="text-[11px] text-indigo-700/70 dark:text-indigo-300/60 leading-tight font-bold italic">
                            "{idea.ai_analysis}"
                        </p>
                    </div>
                )}
            </div>

            {/* Footer / Meta Area */}
            <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl">
                <div className="flex items-center justify-between gap-4">

                    {activeTab === 'incubator' ? (
                        <>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("ideas.maturity")}</span>
                                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-black">{idea.progress_pct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${idea.progress_pct}%` }}
                                        className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onDiscard?.(idea)}
                                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all shadow-sm"
                                    title="Discard"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={() => onPromote(idea)}
                                    className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                    title="Launch Project"
                                >
                                    <ArrowRight size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex items-center justify-between">
                            <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2",
                                getStatusStyles()
                            )}>
                                <CheckCircle size={12} />
                                {t("ideas.active")}
                            </div>
                            <Link
                                href={`/projects/${idea.id}`}
                                className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2 hover:gap-3 transition-all"
                            >
                                {t("ideas.view_kanban")} <ArrowRight size={14} />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Expand Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full mt-4 py-1 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Expandable History */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="p-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Clock size={12} /> {t("ideas.timeline")}
                            </h4>
                            <HistoryTimeline taskId={idea.id} taskType="idea" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
