"use client";

import React from "react";
import { MembersSettings } from "@/components/features/settings/MembersSettings";
import { RolesSettings } from "@/components/features/settings/RolesSettings";
import { AgentSettings } from "@/components/features/settings/AgentSettings";
import { Users, Shield, Bot, Users2 } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamsPage() {
    const { t } = useConfig();
    const [activeTab, setActiveTab] = React.useState<"members" | "roles" | "agents">("members");

    const tabs = [
        { id: "members" as const, label: t("teams.members"), icon: Users, color: "text-indigo-600 dark:text-indigo-400", desc: t("teams.members_desc") },
        { id: "agents" as const, label: t("teams.agents"), icon: Bot, color: "text-emerald-600 dark:text-emerald-400", desc: t("teams.agents_desc") },
        { id: "roles" as const, label: t("teams.roles"), icon: Shield, color: "text-purple-600 dark:text-purple-400", desc: t("teams.roles_desc") },
    ];

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-12 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                            {t("teams.title")}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-xl">
                            {t("teams.subtitle")}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-center gap-6 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("teams.active")}</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white uppercase italic">{t("teams.balanced")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative p-8 rounded-[2.5rem] border-2 text-left transition-all duration-300 group overflow-hidden",
                                activeTab === tab.id
                                    ? "bg-white dark:bg-slate-900 border-indigo-600 shadow-2xl shadow-indigo-500/10"
                                    : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm"
                            )}
                        >
                            <div className={cn(
                                "p-4 rounded-3xl mb-6 w-fit transition-transform group-hover:scale-110 shadow-sm border",
                                activeTab === tab.id
                                    ? "bg-indigo-600 text-white border-indigo-500"
                                    : "bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700"
                            )}>
                                <tab.icon size={28} />
                            </div>
                            <h3 className={cn(
                                "text-2xl font-black italic uppercase tracking-tight mb-2",
                                activeTab === tab.id ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"
                            )}>{tab.label}</h3>
                            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{tab.desc}</p>

                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="tabGlowEffect"
                                    className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl rounded-full"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="dashboard-card p-10 lg:p-16 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-16 opacity-[0.03] dark:opacity-[0.02] pointer-events-none text-slate-900 dark:text-white">
                        <Users2 size={500} />
                    </div>

                    <div className="relative z-10 font-bold">
                        {activeTab === "members" && <MembersSettings onSwitchTab={setActiveTab} />}
                        {activeTab === "agents" && <AgentSettings onSwitchTab={setActiveTab} />}
                        {activeTab === "roles" && <RolesSettings />}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
