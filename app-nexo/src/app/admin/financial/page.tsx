"use client";

import React, { useEffect, useState } from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    BarChart3,
    ArrowUpRight,
    CreditCard,
    PieChart,
    Activity,
    Zap,
    Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data following the brief contracts
const FINANCIAL_SUMMARY = {
    mrr: 125400,
    arr: 1504800,
    gross_margin_pct: 74,
    churn_rate_pct: 2.1,
    ltv: 12500,
    cac: 450
};

const MRR_HISTORY = [
    { month: "Sep", mrr: 84000, cost: 22000 },
    { month: "Oct", mrr: 92000, cost: 28000 },
    { month: "Nov", mrr: 105000, cost: 31000 },
    { month: "Dec", mrr: 112000, cost: 34000 },
    { month: "Jan", mrr: 118000, cost: 36000 },
    { month: "Feb", mrr: 125400, cost: 38000 }
];

export default function FinancialPage() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Financial Intelligence</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Revenue & Yield Statistics</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <FinanceStat label="Annual Rec. Revenue" value={`$${(FINANCIAL_SUMMARY.arr / 1000000).toFixed(1)}M`} trend="+14%" />
                <FinanceStat label="Monthly Rec. Revenue" value={`$${(FINANCIAL_SUMMARY.mrr / 1000).toFixed(1)}k`} trend="+8%" />
                <FinanceStat label="Gross Margin" value={`${FINANCIAL_SUMMARY.gross_margin_pct}%`} trend="+2%" />
                <FinanceStat label="Net Churn" value={`${FINANCIAL_SUMMARY.churn_rate_pct}%`} trend="-0.4%" isNegative />
                <FinanceStat label="Customer LTV" value={`$${FINANCIAL_SUMMARY.ltv.toLocaleString()}`} trend="+$450" />
                <FinanceStat label="CAC Ratio" value={`$${FINANCIAL_SUMMARY.cac}`} trend="Stable" color="text-slate-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* MRR vs AI Cost Chart Area */}
                <div className="lg:col-span-8 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                            <Zap size={16} className="text-indigo-400" />
                            MRR Expansion vs AI Cost
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-indigo-500" />
                                <span className="text-[9px] font-black text-slate-500 uppercase">Growth</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-sm bg-slate-600" />
                                <span className="text-[9px] font-black text-slate-500 uppercase">Infrastructure</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-64 flex items-end justify-between gap-4 px-2">
                        {MRR_HISTORY.map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                                <div className="w-full flex flex-col items-center justify-end h-full gap-1">
                                    {/* MRR Bar */}
                                    <div
                                        className="w-full bg-indigo-600/40 border border-indigo-500/20 rounded-t-lg relative group-hover/bar:bg-indigo-500/60 transition-all duration-500"
                                        style={{ height: `${(point.mrr / 130000) * 100}%` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-indigo-400 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                            ${(point.mrr / 1000).toFixed(0)}k
                                        </div>
                                    </div>
                                    {/* Cost Bar */}
                                    <div
                                        className="w-full bg-slate-800 border border-slate-700 rounded-t-sm"
                                        style={{ height: `${(point.cost / 130000) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{point.month}</span>
                            </div>
                        ))}
                    </div>

                    <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
                        <Activity size={240} className="text-indigo-500" />
                    </div>
                </div>

                {/* Tier Distribution / Signals */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest italic mb-6">Subscription Signals</h3>
                        <div className="space-y-4">
                            <SignalItem label="Enterprise Cluster" value="12" pct={45} color="bg-indigo-500" />
                            <SignalItem label="Pro Deployment" value="44" pct={35} color="bg-indigo-400/60" />
                            <SignalItem label="Starter Nodes" value="82" pct={20} color="bg-slate-700" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Efficiency Forecast</p>
                            <h4 className="text-xl font-black italic uppercase tracking-tighter mb-2">High Efficiency Zone</h4>
                            <p className="text-xs font-medium opacity-80 leading-relaxed">
                                El margen bruto ha subido un 4% tras la optimización de los agentes en el tier Enterprise.
                            </p>
                        </div>
                        <TrendingUp size={120} className="absolute -bottom-10 -right-10 opacity-20 rotate-12" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function FinanceStat({ label, value, trend, isNegative, color = "text-white" }: any) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex flex-col gap-0.5">
                <h3 className={cn("text-xl font-black italic tracking-tighter", color)}>{value}</h3>
                <div className={cn(
                    "text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5",
                    isNegative ? "text-red-400" : "text-emerald-400"
                )}>
                    {trend}
                </div>
            </div>
        </div>
    );
}

function SignalItem({ label, value, pct, color }: any) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-end">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{label}</span>
                <span className="text-xs font-black text-white italic">{value}</span>
            </div>
            <div className="h-1 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
