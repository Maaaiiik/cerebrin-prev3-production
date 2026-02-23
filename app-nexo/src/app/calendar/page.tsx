"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { supabaseClient } from "@/lib/supabase";
import { Document } from "@/types/supabase";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es, enUS } from "date-fns/locale";
import { format, isSameDay } from "date-fns";
import { Loader2, Calendar as CalendarIcon, ChevronRight, Target, Clock, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarPageProps {
    embedded?: boolean;
}

export default function CalendarPage({ embedded }: CalendarPageProps) {
    const { activeWorkspaceId, isLoading: isContextLoading, workspaces } = useWorkspace();
    const { t, language, theme } = useConfig();

    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    useEffect(() => {
        if (isContextLoading) return;
        if (!activeWorkspaceId) {
            setLoading(false);
            return;
        }

        const fetchDocs = async () => {
            setLoading(true);
            const { data, error } = await supabaseClient
                .from("documents")
                .select("*")
                .eq("workspace_id", activeWorkspaceId)
                .not("due_date", "is", null);

            if (error) {
                console.error("Error fetching tasks for calendar:", error);
            } else {
                setDocuments((data as Document[]) || []);
            }
            setLoading(false);
        };

        fetchDocs();
    }, [activeWorkspaceId, isContextLoading]);

    const getDayIntensity = (date: Date) => {
        const count = documents.filter(doc => doc.due_date && isSameDay(new Date(doc.due_date), date)).length;
        if (count === 0) return "";
        if (count < 2) return "bg-indigo-500/10 border-indigo-500/20";
        if (count < 4) return "bg-indigo-500/30 border-indigo-500/40";
        return "bg-indigo-500/60 border-indigo-500/80 shadow-[0_0_15px_rgba(79,70,229,0.3)]";
    };

    const modifiers = {
        hasTask: (date: Date) => documents.some(doc => doc.due_date && isSameDay(new Date(doc.due_date), date)),
    };

    const taskForSelectedDate = documents.filter(doc =>
        selectedDate && doc.due_date && isSameDay(new Date(doc.due_date), selectedDate)
    );

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    const locale = language === 'es' ? es : enUS;

    return (
        <div className={cn(
            "h-full overflow-hidden bg-slate-950 transition-colors duration-300",
            embedded ? "p-0" : "p-6"
        )}>
            <div className="max-w-[1600px] mx-auto h-full flex flex-col">

                {/* Header Section */}
                {!embedded && (
                    <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
                                <CalendarIcon size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-widest uppercase italic flex items-center gap-3">
                                    MISSION TIMELINE
                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 tracking-normal not-italic">PHI-OS v2</span>
                                </h1>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    {activeWorkspace ? `Sector: ${activeWorkspace.name}` : 'Sincronizando Nodos...'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync Engaged</span>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                                <Plus size={14} />
                                New Deployment
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">

                    {/* Left: Navigation Hub (Calendar) */}
                    <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 flex flex-col h-full overflow-hidden relative group">
                            <style>{`
                                .rdp { --rdp-cell-size: 50px; margin: 0; width: 100%; }
                                .rdp-month { width: 100%; }
                                .rdp-caption { margin-bottom: 1.5rem; }
                                .rdp-caption_label { font-size: 0.9rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: white; italic: true; }
                                .rdp-head_cell { font-size: 0.7rem; font-weight: 900; text-transform: uppercase; color: #475569; letter-spacing: 0.1em; }
                                .rdp-day { font-size: 0.85rem; font-weight: 700; border-radius: 14px; transition: all 0.2s; color: #94a3b8; }
                                .rdp-day:hover { background-color: #1e293b; color: #818cf8; }
                                .rdp-day_selected { background-color: #4f46e5 !important; color: white !important; font-weight: 900; border-radius: 14px; box-shadow: 0 0 20px rgba(79, 70, 229, 0.4); border: 1px solid rgba(129, 140, 248, 0.5); }
                                .rdp-nav_button { background-color: #0f172a; border-radius: 10px; border: 1px solid #1e293b; color: #94a3b8; }
                                .rdp-nav_button:hover { border-color: #4f46e5; color: white; }
                            `}</style>

                            <div className="flex-1 flex items-center justify-center">
                                <DayPicker
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    locale={locale}
                                    modifiers={modifiers}
                                    modifiersClassNames={{
                                        hasTask: "border-b-2 border-indigo-500/50"
                                    }}
                                    className="text-slate-200"
                                />
                            </div>

                            {/* Analytics Overlay (Visual Fluff/Info) */}
                            <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Monthly Load Intensity</p>
                                    <div className="flex gap-1">
                                        {[1, 2.5, 4, 2, 6, 8, 3].map((val, i) => (
                                            <div key={i} className="w-2 rounded-t-sm bg-slate-800 relative h-6 overflow-hidden">
                                                <div className="absolute bottom-0 left-0 right-0 bg-indigo-500/40" style={{ height: `${val * 10}%` }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-black text-white italic tracking-tighter">{documents.length}</p>
                                    <p className="text-[9px] font-black text-indigo-500 uppercase">Active Units</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Operational Detail */}
                    <div className="lg:col-span-8 flex flex-col overflow-hidden">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl h-full flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
                            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/20 backdrop-blur-sm">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                            {selectedDate ? format(selectedDate, "d MMMM yyyy", { locale }) : "PENDING SELECTION"}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-indigo-400" />
                                            <span>{taskForSelectedDate.length} Active Nodes</span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-slate-800" />
                                        <span>Operational Window Open</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                                {loading ? (
                                    [1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl bg-slate-800/50 border border-slate-800" />)
                                ) : taskForSelectedDate.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                        <div className="w-24 h-24 border-2 border-dashed border-slate-800 rounded-full flex items-center justify-center mb-6">
                                            <Target size={32} className="text-slate-800" />
                                        </div>
                                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Zero Operations Detected</h4>
                                    </div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {taskForSelectedDate.map((doc, idx) => (
                                            <motion.div
                                                key={doc.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all relative overflow-hidden"
                                            >
                                                {/* Left intensity bar */}
                                                <div className={cn(
                                                    "absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/20 group-hover:bg-indigo-500 transition-colors",
                                                    (doc.priority_score !== undefined && doc.priority_score !== null && doc.priority_score > 7) ? "bg-red-500" : ""
                                                )} />

                                                <div className="flex items-start justify-between mb-4 pl-2">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">
                                                                {doc.category || 'Strategic Area'}
                                                            </div>
                                                            {doc.subject && (
                                                                <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-black uppercase tracking-widest">
                                                                    {doc.subject}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h4 className="text-lg font-black text-white leading-tight group-hover:text-indigo-300 transition-colors tracking-tighter uppercase italic">
                                                            {doc.title}
                                                        </h4>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase">Load Phase</p>
                                                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{doc.category === 'Terminado' ? 'Complete' : 'Active'}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pl-2">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                            <span>Operational Depth</span>
                                                            <span>{doc.progress_pct}%</span>
                                                        </div>
                                                        <div className="h-1 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                                                            <div
                                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                                style={{ width: `${doc.progress_pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                                            <Target size={10} className="text-indigo-400" />
                                                            Priority: {doc.priority_score > 7 ? 'Critical' : 'Standard'}
                                                        </div>
                                                        <ChevronRight className="text-slate-600 group-hover:text-white transition-colors" size={16} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
