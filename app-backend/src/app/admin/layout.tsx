"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    History,
    Users,
    BarChart3,
    Ticket,
    ShieldCheck,
    TrendingUp,
    Activity,
    MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Workspaces", href: "/admin/workspaces", icon: Users },
    { label: "Financial HUD", href: "/admin/financial", icon: TrendingUp },
    { label: "Usage Audit", href: "/admin/usage", icon: Activity },
    { label: "Tickets", href: "/admin/tickets", icon: Ticket },
    { label: "NPS & Surveys", href: "/admin/nps", icon: MessageSquare },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Admin Sidebar - Mission Control Style */}
            <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col z-20">
                <div className="p-8 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                            <ShieldCheck className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black tracking-[0.2em] uppercase italic text-white">Nexo Admin</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cerebrin OS v2</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Command Modules</p>
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "bg-indigo-500/10 text-white border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]"
                                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent"
                                )}
                            >
                                <Icon size={18} className={cn(isActive ? "text-indigo-400" : "group-hover:text-slate-300")} />
                                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                                {isActive && (
                                    <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-indigo-500 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 bg-slate-900/20">
                    <div className="px-4 py-3 bg-slate-900 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gateway Active</span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">API Latency: 42ms</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
                {/* Top Operational Bar */}
                <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <History size={14} className="text-slate-500" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Session: Stable</span>
                        </div>
                        <div className="h-4 w-px bg-slate-800" />
                        <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] animate-pulse">
                            Live Telemetry Engaged
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest hover:border-indigo-500/50 transition-colors">
                            Emergency Lock
                        </button>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-black text-indigo-400">
                            SA
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>
            </main>
        </div>
    );
}
