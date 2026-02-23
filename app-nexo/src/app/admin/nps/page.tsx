"use client";

import React, { useEffect, useState } from "react";
import {
    MessageSquare,
    Plus,
    BarChart3,
    ArrowUpRight,
    Search,
    CheckCircle2,
    Users,
    Smile,
    Meh,
    Frown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NPSResult {
    score: number;
    totalResponses: number;
    distribution: {
        promoters: number;
        passives: number;
        detractors: number;
    };
    comments: Array<{
        workspace: string;
        score: number;
        comment: string;
        createdAt: string;
    }>;
}

export default function NPSPage() {
    const [data, setData] = useState<NPSResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulated fetch - In prod: fetch('/api/admin/nps/results')
        const mockData: NPSResult = {
            score: 74,
            totalResponses: 156,
            distribution: {
                promoters: 65,
                passives: 25,
                detractors: 10
            },
            comments: [
                {
                    workspace: "Cyberdyne Systems",
                    score: 10,
                    comment: "La automatización de procesos es de otro planeta. Ahorro masivo.",
                    createdAt: new Date().toISOString()
                },
                {
                    workspace: "Wayne Ent",
                    score: 4,
                    comment: "Un poco complejo de configurar al inicio. Necesito más guías.",
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                }
            ]
        };

        setTimeout(() => {
            setData(mockData);
            setLoading(false);
        }, 500);
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Feedback Intelligence</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global NPS & Satisfaction Analysis</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20">
                    <Plus size={16} />
                    Initialize Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main NPS Card */}
                <div className="lg:col-span-4 bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 backdrop-blur-sm flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20" />
                    <div className="w-24 h-24 rounded-full border-4 border-indigo-500/30 flex items-center justify-center mb-6 relative">
                        <span className="text-5xl font-black italic tracking-tighter text-white">{data?.score}</span>
                        <div className="absolute -bottom-2 bg-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Score</div>
                    </div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.4em] mb-8">Net Promoter Score</h4>

                    <div className="w-full space-y-4">
                        <DistributionRow icon={Smile} label="Promoters" val={data?.distribution.promoters || 0} color="bg-emerald-500" />
                        <DistributionRow icon={Meh} label="Passives" val={data?.distribution.passives || 0} color="bg-slate-700" />
                        <DistributionRow icon={Frown} label="Detractors" val={data?.distribution.detractors || 0} color="bg-red-500" />
                    </div>
                </div>

                {/* Recent Comments Feed */}
                <div className="lg:col-span-8 space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    <div className="bg-slate-950/20 p-4 border-b border-slate-800 flex items-center justify-between uppercase">
                        <span className="text-[10px] font-black text-slate-500 tracking-widest">Global Sentiments</span>
                        <BarChart3 size={14} className="text-slate-700" />
                    </div>
                    {data?.comments.map((c, i) => (
                        <div key={i} className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-colors relative overflow-hidden group">
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1",
                                c.score >= 9 ? "bg-emerald-500" : c.score <= 6 ? "bg-red-500" : "bg-slate-700"
                            )} />
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-[10px] font-black text-white border border-slate-800">
                                        {c.score}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">{c.workspace}</p>
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <button className="text-slate-600 group-hover:text-indigo-400 transition-colors">
                                    <Search size={14} />
                                </button>
                            </div>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed italic">"{c.comment}"</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function DistributionRow({ icon: Icon, label, val, color }: any) {
    return (
        <div className="flex items-center gap-4">
            <Icon size={14} className="text-slate-500" />
            <div className="flex-1 flex flex-col gap-1 text-left">
                <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    <span>{label}</span>
                    <span>{val}%</span>
                </div>
                <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${val}%` }} />
                </div>
            </div>
        </div>
    );
}
