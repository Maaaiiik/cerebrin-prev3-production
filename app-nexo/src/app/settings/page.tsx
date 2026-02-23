"use client";

import React, { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { Copy, Check, Settings, Code, Key, Briefcase, RefreshCw, Save, Users, Crown, Target } from "lucide-react";
import { useUserPerspective } from "@/context/UserPerspectiveContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import { Bot, ChevronDown, Menu } from "lucide-react";

export default function SettingsPage() {
    const { activeWorkspaceId, workspaces } = useWorkspace();
    const { t, language } = useConfig();
    const { mode, resetToPreset } = useUserPerspective();
    const { isMobile } = useResponsive();
    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const agentPrompt = `
Eres un agente AI conectado al sistema Cerebrin.
Tu Workspace ID es: ${activeWorkspaceId}

Usa las siguientes APIs para gestionar el trabajo:
1. POST /api/ideas - Para capturar nuevas ideas.
2. GET /api/projects - Para leer el estado de los proyectos.
3. POST /api/agent/summary - Para enviar reportes diarios.

Reglas:
- Si una idea está aprobada pero no iniciada, sugierela para promoción.
- Si un proyecto tiene fecha de vencimiento < 3 días y progreso < 50%, márcalo en rojo.
`.trim();

    return (
        <div className="p-6 lg:p-12 h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors duration-300 custom-scrollbar">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className={cn(isMobile && "pl-12")}>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase flex items-center gap-4">
                            {t("settings.title")}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
                            {t("settings.subtitle")}
                        </p>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Connections & Tools */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* Agent Connection Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="dashboard-card p-10"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                                    <Key size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                                    {t("settings.agent_conn")}
                                </h2>
                            </div>

                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 uppercase tracking-wide">
                                {t("settings.agent_desc")}
                            </p>

                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">{t("settings.workspace_id")}</label>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-mono text-indigo-600 dark:text-indigo-400 flex-1 shadow-inner">
                                            {activeWorkspaceId || "Select Node..."}
                                        </div>
                                        <button
                                            onClick={() => activeWorkspaceId && copyToClipboard(activeWorkspaceId, 'wsId')}
                                            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-500 transition-all shadow-sm active:scale-95"
                                        >
                                            {copiedField === 'wsId' ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">{t("settings.system_prompt")}</label>
                                    <div className="relative group">
                                        <pre className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-xs font-mono text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto custom-scrollbar shadow-inner leading-relaxed">
                                            {agentPrompt}
                                        </pre>
                                        <button
                                            onClick={() => copyToClipboard(agentPrompt, 'promt')}
                                            className="absolute top-4 right-4 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-md transition-all active:scale-90"
                                        >
                                            {copiedField === 'promt' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Nav Tools */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="dashboard-card p-10 flex flex-col group hover:border-blue-500/30 transition-all"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-[1.5rem] border border-blue-100 dark:border-blue-900 group-hover:scale-110 transition-transform">
                                        <RefreshCw size={24} />
                                    </div>
                                    <Link
                                        href="/settings/templates"
                                        className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                    >
                                        {t("settings.manage")}
                                    </Link>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
                                    {t("settings.templates")}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                    {t("settings.templates_desc")}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="dashboard-card p-10 flex flex-col group hover:border-indigo-500/30 transition-all"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] border border-indigo-100 dark:border-indigo-900 group-hover:scale-110 transition-transform">
                                        <Users size={24} />
                                    </div>
                                    <Link
                                        href="/settings/members"
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                    >
                                        {t("settings.manage")}
                                    </Link>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
                                    {t("settings.teams")}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                    {t("settings.teams_desc")}
                                </p>
                            </motion.div>
                        </div>

                        {/* UI Perspective Management (Phase 7) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="dashboard-card p-10 mt-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                                    <Settings size={20} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                                    UI Perspective Manager
                                </h2>
                            </div>

                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 uppercase tracking-wide">
                                Personaliza tu interfaz según tu rol actual. El sistema ajustará la visibilidad de herramientas y métricas.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => resetToPreset('director')}
                                    className={cn(
                                        "p-6 rounded-3xl border-2 transition-all text-left group",
                                        mode === 'director'
                                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg"
                                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                    )}
                                >
                                    <Crown size={32} className={cn("mb-4 transition-transform group-hover:scale-110", mode === 'director' ? "text-indigo-600" : "text-slate-400")} />
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Director Mode</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Visión estratégica total. Dashboard de analíticas, control de costes y flujo HITL completo.</p>
                                </button>

                                <button
                                    onClick={() => resetToPreset('focus')}
                                    className={cn(
                                        "p-6 rounded-3xl border-2 transition-all text-left group",
                                        mode === 'focus'
                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-lg"
                                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                                    )}
                                >
                                    <Target size={32} className={cn("mb-4 transition-transform group-hover:scale-110", mode === 'focus' ? "text-emerald-600" : "text-slate-400")} />
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Focus Mode</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Ejecución sin distracciones. Dashboard simplificado, "Mis Tareas" y asistente Shadow AI.</p>
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Node Info */}
                    <div className="lg:col-span-4 space-y-10">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="dashboard-card p-10 border-indigo-100 dark:border-indigo-900/40"
                        >
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-8 flex items-center gap-3">
                                <Briefcase className="text-indigo-600" size={20} />
                                {t("settings.active_workspace")}
                            </h2>

                            {activeWorkspace ? (
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[2rem] mx-auto flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-500/30 mb-6 italic transition-transform hover:rotate-3">
                                        {activeWorkspace.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{activeWorkspace.name}</h3>
                                    <p className="text-indigo-600 font-black text-xs mt-1 uppercase tracking-widest">@{activeWorkspace.slug}</p>

                                    <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-left space-y-6">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t("settings.stats")}</p>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                                                <span className="text-xs font-bold text-slate-500 uppercase">{t("settings.created")}</span>
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{activeWorkspace.created_at ? new Date(activeWorkspace.created_at).toLocaleDateString() : "N/A"}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Node ID</span>
                                                <code className="text-[10px] font-mono font-black text-indigo-600">{activeWorkspace.id.substring(0, 8)}...</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-400 font-bold uppercase italic tracking-widest bg-slate-50 dark:bg-slate-950 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                    Offline Mode
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
