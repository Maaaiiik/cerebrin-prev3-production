"use client";

import React, { useEffect, useState } from "react";
import {
    Users,
    Search,
    Filter,
    MoreHorizontal,
    ExternalLink,
    Zap,
    ShieldAlert,
    ArrowUpRight,
    TrendingUp,
    CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types matching the Brief
interface Workspace {
    id: string;
    name: string;
    company: string;
    tier: "Starter" | "Pro" | "Enterprise";
    health: "healthy" | "at-risk" | "churned";
    nps: number | null;
    agents: number;
    max_agents: number;
    projects: number;
    max_projects: number;
    mrr: number;
    joined_date: string;
    last_active: string;
    country: string;
}

export default function WorkspacesPage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated fetch - In prod: fetch('/api/admin/workspaces')
        const mockWorkspaces: Workspace[] = [
            {
                id: "1",
                name: "Cyberdyne Systems",
                company: "Skynet Global",
                tier: "Enterprise",
                health: "healthy",
                nps: 9.8,
                agents: 12,
                max_agents: 20,
                projects: 45,
                max_projects: 100,
                mrr: 2400,
                joined_date: "2024-01",
                last_active: "2m ago",
                country: "🇺🇸"
            },
            {
                id: "2",
                name: "Stark Industries",
                company: "Stark Tech",
                tier: "Pro",
                health: "at-risk",
                nps: 6.2,
                agents: 8,
                max_agents: 10,
                projects: 12,
                max_projects: 20,
                mrr: 1200,
                joined_date: "2023-11",
                last_active: "4h ago",
                country: "🇺🇸"
            },
            {
                id: "3",
                name: "Wayne Ent",
                company: "Wayne Corp",
                tier: "Enterprise",
                health: "healthy",
                nps: null,
                agents: 15,
                max_agents: 25,
                projects: 88,
                max_projects: 200,
                mrr: 4500,
                joined_date: "2024-02",
                last_active: "Just now",
                country: "🇬🇧"
            }
        ];

        setTimeout(() => {
            setWorkspaces(mockWorkspaces);
            setLoading(false);
        }, 800);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Live Workspaces" value={workspaces.length} icon={Users} trend="+12%" />
                <StatCard label="Avg. MRR / User" value="$1,450" icon={CreditCard} trend="+5%" />
                <StatCard label="Churn Risk" value="4.2%" icon={ShieldAlert} trend="-1%" color="text-emerald-400" />
                <StatCard label="NPS Score" value="84" icon={TrendingUp} trend="+2.4" />
            </div>

            {/* CRM Table Container */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by slug, company or ID..."
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-2 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 uppercase tracking-widest"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-all">
                            <Filter size={14} />
                            Refine Search
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">
                            New Override
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/40">
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Workspace Entity</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan & Revenue</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Deployment Salud</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nodes & Capacity</th>
                                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td colSpan={5} className="p-5 animate-pulse bg-slate-900/20 h-16" />
                                    </tr>
                                ))
                            ) : (
                                workspaces.map((ws) => (
                                    <tr key={ws.id} className="group hover:bg-slate-800/20 transition-colors">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg shadow-inner">
                                                    {ws.country}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white italic tracking-tighter uppercase">{ws.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight opacity-60">{ws.company}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-1">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-fit border",
                                                    ws.tier === 'Enterprise' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
                                                )}>
                                                    {ws.tier}
                                                </span>
                                                <p className="text-xs font-black text-white">${ws.mrr.toLocaleString()}<span className="text-[9px] text-slate-500 ml-1">/MO</span></p>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    ws.health === 'healthy' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                                )} />
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{ws.health}</span>
                                                {ws.nps && (
                                                    <span className="ml-2 text-[9px] font-bold text-slate-500 border-l border-slate-800 pl-2">NPS: {ws.nps}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex flex-col gap-2">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest px-1">
                                                        <span>Agents Used</span>
                                                        <span>{ws.agents}/{ws.max_agents}</span>
                                                    </div>
                                                    <div className="h-1 bg-slate-950 rounded-full border border-slate-800 overflow-hidden w-32">
                                                        <div
                                                            className="h-full bg-indigo-500 rounded-full"
                                                            style={{ width: `${(ws.agents / ws.max_agents) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all tooltip"
                                                    title="Impersonate"
                                                >
                                                    <Zap size={14} />
                                                </button>
                                                <button
                                                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-all"
                                                    title="View Records"
                                                >
                                                    <ExternalLink size={14} />
                                                </button>
                                                <button className="p-2 text-slate-600 hover:text-slate-400">
                                                    <MoreHorizontal size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex items-center justify-between">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Displaying Mission Units 1-3 of 240</p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-black text-slate-600">Prev</button>
                        <button className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-black text-slate-300">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, trend, trendColor = "text-emerald-400", color = "text-white" }: any) {
    return (
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={48} className="text-indigo-500" />
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
            <div className="flex items-end gap-3">
                <h2 className={cn("text-3xl font-black italic tracking-tighter", color)}>{value}</h2>
                <div className={cn("text-[10px] font-black flex items-center gap-0.5 mb-1 opacity-80", trendColor)}>
                    <ArrowUpRight size={10} />
                    {trend}
                </div>
            </div>
        </div>
    );
}
