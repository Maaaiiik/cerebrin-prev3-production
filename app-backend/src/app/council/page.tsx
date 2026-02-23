"use client";

import React, { useState, useEffect } from "react";
import { Bot, Sparkles, Send, BrainCircuit, AlertTriangle, Loader2, X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfig } from "@/context/ConfigContext";
import { cn } from "@/lib/utils";

export default function CouncilPage() {
    const { t } = useConfig();
    const [query, setQuery] = useState("");
    const [responses, setResponses] = useState<{ [key: string]: string }>({
        claude: "",
        gpt: "",
        gemini: "",
        judge: ""
    });
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [keys, setKeys] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const storedKeys = localStorage.getItem("api_keys");
        if (storedKeys) {
            setKeys(JSON.parse(storedKeys));
        }
    }, []);

    const handleAsk = async () => {
        if (!query) return;

        setResponses({ claude: "", gpt: "", gemini: "", judge: "" });
        setIsSynthesizing(true);

        try {
            const response = await fetch('/api/council/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: query })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed search");

            setResponses({
                claude: data.responses.claude || "No response received.",
                gpt: data.responses.gpt || "No response received.",
                gemini: data.responses.gemini || "No response received.",
                judge: data.judge || "Pending consensus."
            });
        } catch (error: any) {
            console.error("Council consultation failed:", error);
            setResponses(prev => ({
                ...prev,
                judge: `Connection Error: ${error.message}`
            }));
        } finally {
            setIsSynthesizing(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 lg:p-12 bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
                            {t("council.subtitle")}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                        {t("council.title")}
                    </h1>
                </div>

                <div className="flex gap-3">
                    {['openai', 'anthropic', 'gemini'].map(k => (
                        <div key={k} className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                            keys[k]
                                ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                        )}>
                            {k} {keys[k] ? "✓" : "×"}
                        </div>
                    ))}
                </div>
            </div>

            {/* Prompt Input */}
            <div className="max-w-5xl mx-auto w-full mb-12 relative z-10 px-4">
                <div className="dashboard-card p-2 flex items-center pr-4 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
                    <div className="flex-1 flex items-center gap-4 pl-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            <Bot size={24} />
                        </div>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none py-4 text-slate-900 dark:text-white placeholder:text-slate-400 font-bold outline-none text-lg"
                            placeholder={t("council.placeholder")}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                        />
                        <button
                            onClick={handleAsk}
                            disabled={isSynthesizing || !query}
                            className="p-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 rounded-2xl text-white transition-all shadow-lg shadow-indigo-500/30 active:scale-95 flex items-center justify-center"
                        >
                            {isSynthesizing ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Council Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 overflow-y-auto pb-64 custom-scrollbar px-2">
                <ModelCard
                    name="Claude 3.5"
                    type="ANTHROPIC_CORE"
                    color="orange"
                    loading={isSynthesizing && !responses.claude}
                    content={responses.claude}
                    t={t}
                />
                <ModelCard
                    name="GPT-4o"
                    type="OPENAI_ENGINE"
                    color="emerald"
                    loading={isSynthesizing && !responses.gpt}
                    content={responses.gpt}
                    t={t}
                />
                <ModelCard
                    name="Gemini 1.5 Pro"
                    type="GOOGLE_BRAIN"
                    color="blue"
                    loading={isSynthesizing && !responses.gemini}
                    content={responses.gemini}
                    t={t}
                />
            </div>

            {/* Verdict Area (Floating bottom) */}
            <AnimatePresence>
                {(responses.judge || isSynthesizing) && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="absolute bottom-10 left-6 right-6 lg:left-12 lg:right-12 z-50 pointer-events-none"
                    >
                        <div className="max-w-6xl mx-auto pointer-events-auto">
                            <div className="bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-[3rem] p-8 lg:p-10 shadow-[0_30px_100px_rgba(79,70,229,0.2)] backdrop-blur-xl flex flex-col md:flex-row items-center md:items-start gap-10">
                                <div className="shrink-0 relative">
                                    <div className="absolute inset-0 bg-indigo-600 rounded-3xl blur-2xl opacity-20 animate-pulse" />
                                    <div className="relative bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-500/40">
                                        <BrainCircuit size={48} className="text-white" />
                                    </div>
                                </div>
                                <div className="flex-1 max-h-[350px] overflow-y-auto pr-6 custom-scrollbar">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
                                            {t("council.verdict")}
                                        </h3>
                                        <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900">
                                            Consensus Level: High
                                        </div>
                                    </div>

                                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-bold scroll-smooth">
                                        {responses.judge ? (
                                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 whitespace-pre-wrap">{responses.judge}</div>
                                        ) : (
                                            <div className="flex flex-col gap-4">
                                                <div className="text-lg text-indigo-600 dark:text-indigo-400 flex items-center gap-3">
                                                    <Loader2 className="animate-spin" size={20} />
                                                    {t("council.synthesizing")}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                                                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ModelCard({ name, type, color, loading, content, t }: any) {
    const colorStyles: any = {
        orange: "text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/10",
        emerald: "text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10",
        blue: "text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/10",
    };

    const dotColors: any = {
        orange: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]",
        emerald: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
        blue: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="dashboard-card p-10 flex flex-col group hover:shadow-2xl transition-all"
        >
            <div className="flex items-center justify-between mb-8">
                <div className={cn("px-4 py-2 rounded-2xl border font-black uppercase tracking-tighter italic text-lg", colorStyles[color])}>
                    {name}
                </div>
                <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors uppercase font-mono tracking-tighter">
                    {type}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-3 custom-scrollbar text-slate-600 dark:text-slate-400 font-bold leading-relaxed text-sm italic">
                {loading ? (
                    <div className="space-y-4">
                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                        <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                    </div>
                ) : content ? (
                    <div className="animate-in fade-in duration-500 whitespace-pre-wrap">{content}</div>
                ) : (
                    <span className="text-slate-300 dark:text-slate-800">{t("council.waiting")}</span>
                )}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("council.status")}</span>
                <div className={cn("w-2 h-2 rounded-full", dotColors[color])} />
            </div>
        </motion.div>
    );
}
