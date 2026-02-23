"use client";

import React, { useEffect, useState } from "react";
import {
    Ticket,
    MessageSquare,
    Clock,
    User,
    CheckCircle2,
    AlertCircle,
    Hash,
    Send,
    ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportTicket {
    id: string;
    workspace: string;
    subject: string;
    priority: "critical" | "high" | "medium" | "low";
    status: "open" | "in-progress" | "resolved" | "pending";
    created: string;
    assignee: string | null;
    category: string;
    messages: Array<{
        id: string;
        role: "user" | "support";
        author: string;
        body: string;
        created_at: string;
    }>;
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState("");

    useEffect(() => {
        // Simulated fetch
        const mockTickets: SupportTicket[] = [
            {
                id: "T-1001",
                workspace: "Cyberdyne Systems",
                subject: "Fallo crítico en agente Research",
                priority: "critical",
                status: "open",
                created: "2024-02-20",
                assignee: null,
                category: "Agent Error",
                messages: [
                    {
                        id: "m1",
                        role: "user",
                        author: "Sarah Connor",
                        body: "El agente Research dejó de responder después del último despliegue de n8n. Necesito ayuda técnica urgente.",
                        created_at: "2024-02-20T10:00:00Z"
                    }
                ]
            },
            {
                id: "T-1002",
                workspace: "Stark Industries",
                subject: "Duda sobre facturación Enterprise",
                priority: "low",
                status: "in-progress",
                created: "2024-02-19",
                assignee: "Vision AI",
                category: "Billing",
                messages: [
                    {
                        id: "m2",
                        role: "user",
                        author: "Pepper Potts",
                        body: "Queremos subir la cuota de agentes de 20 a 50. ¿Nos pueden pasar el presupuesto?",
                        created_at: "2024-02-19T14:30:00Z"
                    }
                ]
            }
        ];

        setTimeout(() => {
            setTickets(mockTickets);
            setLoading(false);
        }, 600);
    }, []);

    const handleSendReply = () => {
        if (!selectedTicket || !reply.trim()) return;

        // Optimistic update
        const newMessage = {
            id: Math.random().toString(),
            role: "support" as const,
            author: "Comandante Admin",
            body: reply,
            created_at: new Date().toISOString()
        };

        setSelectedTicket({
            ...selectedTicket,
            messages: [...selectedTicket.messages, newMessage]
        });
        setReply("");
    };

    return (
        <div className="h-full flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Support Command</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Interaction Thread</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <AlertCircle size={10} /> 1 Critical Active
                    </span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                {/* Ticket List */}
                <div className={cn(
                    "lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar",
                    selectedTicket && "hidden lg:flex"
                )}>
                    {loading ? (
                        Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-slate-900/50 border border-slate-800 rounded-2xl animate-pulse" />)
                    ) : (
                        tickets.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTicket(t)}
                                className={cn(
                                    "p-5 text-left rounded-2xl border transition-all relative overflow-hidden group",
                                    selectedTicket?.id === t.id
                                        ? "bg-indigo-500/10 border-indigo-500/30 ring-1 ring-indigo-500/20"
                                        : "bg-slate-900 border-slate-800 hover:border-slate-700"
                                )}
                            >
                                <div className={cn(
                                    "absolute left-0 top-0 bottom-0 w-1",
                                    t.priority === 'critical' ? "bg-red-500" : t.priority === 'high' ? "bg-orange-500" : "bg-slate-700"
                                )} />
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.id}</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border",
                                        t.status === 'open' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800 text-slate-400 border-slate-700"
                                    )}>
                                        {t.status}
                                    </span>
                                </div>
                                <h4 className="text-sm font-black text-white uppercase italic tracking-tight mb-1 truncate">{t.subject}</h4>
                                <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-tighter opacity-70">{t.workspace}</p>
                                <div className="mt-4 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase">
                                    <span>{t.category}</span>
                                    <div className="flex items-center gap-1">
                                        <Clock size={10} /> 2h
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                {/* Conversation Thread */}
                <div className={cn(
                    "lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl flex flex-col overflow-hidden backdrop-blur-sm",
                    !selectedTicket && "hidden lg:flex items-center justify-center text-slate-600"
                )}>
                    {!selectedTicket ? (
                        <div className="flex flex-col items-center gap-4 opacity-30">
                            <Ticket size={48} />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Select a deployment thread</p>
                        </div>
                    ) : (
                        <>
                            {/* Thread Header */}
                            <div className="p-6 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 text-slate-400">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Hash size={14} className="text-indigo-400" />
                                            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">{selectedTicket.subject}</h3>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedTicket.workspace} — Sector A-12</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                                        Resolve Node
                                    </button>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {selectedTicket.messages.map((m) => (
                                    <div key={m.id} className={cn(
                                        "flex flex-col max-w-[80%]",
                                        m.role === 'support' ? "ml-auto items-end" : "items-start"
                                    )}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.author}</span>
                                            <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{new Date(m.created_at).toLocaleTimeString()}</span>
                                        </div>
                                        <div className={cn(
                                            "p-5 rounded-2xl border",
                                            m.role === 'support'
                                                ? "bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-500/10"
                                                : "bg-slate-950 text-slate-200 border-slate-800"
                                        )}>
                                            <p className="text-sm font-medium leading-relaxed">{m.body}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Input */}
                            <div className="p-6 border-t border-slate-800 bg-slate-950/50">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                        placeholder="Enter command / protocol response..."
                                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-6 pr-16 text-sm font-bold text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 uppercase tracking-widest"
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-2">
                                    <div className="flex items-center gap-1 text-emerald-500">
                                        <CheckCircle2 size={10} /> Encryption Active
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <User size={10} /> Assignee: Vision AI
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
