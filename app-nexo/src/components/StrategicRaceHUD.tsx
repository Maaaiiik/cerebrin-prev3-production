"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Zap, Target, Users, TrendingUp, Flag } from "lucide-react";

/**
 * Mission Control: Strategic Race HUD (Simulation)
 * Demonstrates the gamification of enterprise departments.
 */
export default function StrategicRaceHUD() {
    const [standings, setStandings] = useState([
        { id: 1, area: "Marketing Squad", pilot: "Agent Nexus", progress: 85, pts: 1250, status: "RACING", delta: "+15" },
        { id: 2, area: "Sales Hive", pilot: "Agent Forge", progress: 72, pts: 1040, status: "PIT_STOP", delta: "+5" },
        { id: 3, area: "Legal Fortress", pilot: "Agent Guard", progress: 98, pts: 2100, status: "WINNING", delta: "+30" },
        { id: 4, area: "Operations Core", pilot: "Agent Sync", progress: 45, pts: 600, status: "RACING", delta: "-2" },
    ]);

    // Simulate real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStandings(prev => prev.map(s => ({
                ...s,
                pts: s.pts + Math.floor(Math.random() * 10),
                progress: Math.min(100, s.progress + (Math.random() > 0.7 ? 1 : 0))
            })));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-8 bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <div className="flex justify-between items-end mb-12">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent uppercase tracking-tighter italic">
                        Mission Control: Strategic Race
                    </h1>
                    <p className="text-slate-400 mt-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                        Active Session: Q1 Efficiency Sprint
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm uppercase text-slate-500 font-bold tracking-widest">Global Prize Pool</div>
                    <div className="text-3xl font-mono text-cyan-400">$25,000 GPT-Credits</div>
                </div>
            </div>

            {/* Leaderboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {standings.sort((a, b) => b.pts - a.pts).map((team, index) => (
                    <div
                        key={team.id}
                        className={`relative group p-6 rounded-3xl border transition-all duration-500 hover:scale-[1.02] ${index === 0 ? "bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_40px_-10px_rgba(34,211,238,0.2)]" : "bg-slate-900/50 border-slate-800"
                            }`}
                    >
                        {index === 0 && (
                            <div className="absolute -top-3 -right-3 bg-cyan-400 p-2 rounded-full shadow-lg">
                                <Trophy className="w-5 h-5 text-slate-950" />
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors uppercase italic">{team.area}</h3>
                                <span className="text-xs text-slate-500 font-mono tracking-tighter">{team.pilot}</span>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded-full ${team.status === 'WINNING' ? 'bg-green-500/20 text-green-400' :
                                    team.status === 'PIT_STOP' ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'
                                }`}>
                                {team.status}
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-400 uppercase font-bold tracking-widest">Milestones (Hitos)</span>
                                <span className="text-white font-mono">{team.progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out ${index === 0 ? "bg-gradient-to-r from-cyan-400 to-fuchsia-500" : "bg-slate-600"
                                        }`}
                                    style={{ width: `${team.progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-end">
                            <div>
                                <div className="text-3xl font-black text-white font-mono">{team.pts.toLocaleString()}</div>
                                <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Accumulated PTS</div>
                            </div>
                            <div className={`flex items-center gap-1 font-bold text-sm ${team.delta.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                <TrendingUp className="w-4 h-4" />
                                {team.delta}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rewards Section */}
            <div className="mt-12 p-8 rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-950 border border-slate-800">
                <div className="flex items-center gap-4 mb-6">
                    <Flag className="w-8 h-8 text-fuchsia-500" />
                    <h2 className="text-2xl font-bold italic uppercase">Reward Tiers & Prizes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/50">
                        <h4 className="text-cyan-400 font-bold uppercase text-sm mb-2">1st Place: Elite Status</h4>
                        <p className="text-xs text-slate-400">Unlocks Premium Marketplace Agents and 100% discount on TCO fees for next quarter.</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/50">
                        <h4 className="text-fuchsia-400 font-bold uppercase text-sm mb-2">Milestone: Resonance Master</h4>
                        <p className="text-xs text-slate-400">Awarded for teaching 50+ validated lessons to the workspace memory banks.</p>
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/50">
                        <h4 className="text-amber-400 font-bold uppercase text-sm mb-2">DT (Manager) MVP</h4>
                        <p className="text-xs text-slate-400">Top managing agent gets priority compute latency and advanced reasoning upgrade.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
