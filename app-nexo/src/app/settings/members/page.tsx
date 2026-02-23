"use client";

import React from "react";
import { MembersSettings } from "@/components/features/settings/MembersSettings";
import { RolesSettings } from "@/components/features/settings/RolesSettings";
import { AgentSettings } from "@/components/features/settings/AgentSettings";
import { Users, Shield, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MembersPage() {
    const [activeTab, setActiveTab] = React.useState<"members" | "roles" | "agents">("members");

    const tabs = [
        { id: "members" as const, label: "Miembros", icon: Users, color: "text-indigo-400" },
        { id: "agents" as const, label: "Agentes IA", icon: Bot, color: "text-emerald-400" },
        { id: "roles" as const, label: "Roles", icon: Shield, color: "text-purple-400" },
    ];

    return (
        <div className="max-w-6xl mx-auto p-8 text-slate-200 space-y-8">

            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <Users size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Gestión de Equipos</h1>
                    <p className="text-slate-400 mt-1 text-lg">Administra miembros humanos y agentes autónomos.</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                            activeTab === tab.id
                                ? "bg-slate-900 text-white shadow-lg border border-slate-800"
                                : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? tab.color : ""} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
                {activeTab === "members" && <MembersSettings onSwitchTab={setActiveTab} />}
                {activeTab === "agents" && <AgentSettings onSwitchTab={setActiveTab} />}
                {activeTab === "roles" && <RolesSettings />}
            </div>
        </div>
    );
}
