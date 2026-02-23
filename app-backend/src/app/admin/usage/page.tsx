"use client";

import React, { useEffect, useState } from "react";
import {
    Activity,
    Search,
    Terminal,
    Cpu,
    AlertTriangle,
    CheckCircle,
    Database,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventLog {
    id: string;
    workspace: string;
    event: string;
    agent: string;
    tokens: number;
    status: "ok" | "warning" | "error";
    timestamp: string;
}

export default function UsagePage() {
    const [logs, setLogs] = useState<EventLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated live polling
        const mockLogs: EventLog[] = [
            {
                id: "ev-101",
                workspace: "Cyberdyne Systems",
                event: "Document Research",
                agent: "Alpha Bot",
                tokens: 35400,
                status: "warning",
                timestamp: new Date().toISOString()
            },
            {
                id: "ev-102",
                workspace: "Wayne Enterprises",
                event: "Code Generation",
                agent: "Omega",
                tokens: 12500,
                status: "ok",
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: "ev-103",
                workspace: "Stark Industries",
                event: "NPS Analysis",
                agent: "Jarvis v2",
                tokens: 8400,
                status: "ok",
                timestamp: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: "ev-104",
                workspace: "Cyberdyne Systems",
                event: "Failed API Call",
                agent: "Alpha Bot",
                tokens: 0,
                status: "error",
                timestamp: new Date(Date.now() - 86400000).toISOString()
            }
        ];

        setTimeout(() => {
            setLogs(mockLogs);
            setLoading(false);
        }, 500);
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Usage Audit Logs</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Telemetry & Global Performance</p>
                </div>
                <div className="flex gap-4">
                    <SummarySmall label="Tokens Today" value="1.2M" sub="Stable" />
                    <SummarySmall label="Active Agents" value="45" sub="Peak Load" />
                    <SummarySmall label="Global Errs" value="4" sub="24h Window" color="text-red-400" />
                </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative group">
                <div className="p-4 border-b border-slate-800 bg-slate-900/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 rounded-lg border border-slate-800">
                            <Terminal size={12} className="text-indigo-400" />
                            <span className="text-[10px] font-black text-white uppercase">Live Audit Stream</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Connected</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Search size={14} className="text-slate-600" />
                        <input
                            type="text"
                            placeholder="search logs..."
                            className="bg-transparent text-[10px] font-bold uppercase text-white focus:outline-none w-48"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="border-b border-slate-800">
                            <tr>
                                <th className="p-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Source Workspace</th>
                                <th className="p-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Event Protocol</th>
                                <th className="p-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Assigned Agent</th>
                                <th className="p-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Compute Load</th>
                                <th className="p-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono divide-y divide-slate-900">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-indigo-500/5 transition-colors group">
                                    <td className="p-4 text-xs font-bold text-slate-400 uppercase">{log.workspace}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Database size={10} className="text-slate-600" />
                                            <span className="text-xs font-black text-white italic">{log.event}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Cpu size={12} className="text-indigo-500" />
                                            <span className="text-xs font-bold text-slate-300">{log.agent}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs font-black",
                                                log.tokens > 30000 ? "text-orange-400" : "text-white"
                                            )}>{log.tokens.toLocaleString()}</span>
                                            <span className="text-[9px] font-bold text-slate-600 uppercase">tkns</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {log.status === 'ok' && <CheckCircle size={14} className="text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />}
                                        {log.status === 'warning' && <AlertTriangle size={14} className="text-orange-500 animate-pulse" />}
                                        {log.status === 'error' && <AlertTriangle size={14} className="text-red-500" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function SummarySmall({ label, value, sub, color = "text-white" }: any) {
    return (
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl min-w-[120px]">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-tight">{label}</p>
            <div className="flex items-end gap-2">
                <span className={cn("text-lg font-black italic tracking-tighter", color)}>{value}</span>
                <span className="text-[8px] font-black text-emerald-500 mb-1">{sub}</span>
            </div>
        </div>
    );
}
