"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabaseClient } from "@/lib/supabase";
import { User, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Member {
    id: string; // auth.users.id
    email: string;
    role_name?: string;
    member_type: 'human' | 'ai';
    is_agent?: boolean;
}

interface MemberSelectorProps {
    workspaceId: string;
    value: string | null; // Selected user_id
    onChange: (userId: string | null, memberName: string) => void;
    label?: string;
    className?: string;
}

export function MemberSelector({ workspaceId, value, onChange, label = "Responsable", className }: MemberSelectorProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!workspaceId) return;
            setLoading(true);
            try {
                // 1. Fetch Human Members
                const { data: membersData, error: mError } = await supabaseClient
                    .from('workspace_members')
                    .select('user_id, role_name, member_type')
                    .eq('workspace_id', workspaceId);

                if (mError) throw mError;

                // 2. Fetch AI Agents
                const { data: agentsData, error: aError } = await supabaseClient
                    .from('workspace_agents')
                    .select('id, name, role:workspace_roles(name)')
                    .eq('workspace_id', workspaceId);

                if (aError) console.error("Error fetching agents:", aError);

                const humans: Member[] = (membersData || []).map((m: any) => ({
                    id: m.user_id,
                    email: m.user_id === value ? "Cargando..." : `Miembro (${m.user_id.slice(0, 4)})`,
                    role_name: m.role_name,
                    member_type: 'human'
                }));

                const agents: Member[] = (agentsData || []).map((a: any) => ({
                    id: a.id,
                    email: `${a.name} (IA)`,
                    role_name: a.role?.name || "Agent",
                    member_type: 'ai',
                    is_agent: true
                }));

                setMembers([...humans, ...agents]);

                // Fetch real emails for these IDs (if profile table exists, this is better)
                const { data: { user } } = await supabaseClient.auth.getUser();
                if (user) {
                    setMembers(prev => prev.map(m =>
                        m.id === user.id ? { ...m, email: `${user.email} (Yo)` } : m
                    ));
                }

            } catch (e) {
                console.error("Error fetching workspace members:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [workspaceId]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedMember = members.find(m => m.id === value);

    return (
        <div className={cn("space-y-1 relative", className)} ref={containerRef}>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
                <User size={10} /> {label}
            </label>

            <div
                onClick={() => !loading && setIsOpen(!isOpen)}
                className={cn(
                    "w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-colors",
                    loading && "opacity-50 cursor-wait"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {loading ? (
                        <Loader2 size={12} className="animate-spin text-slate-500" />
                    ) : (
                        <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0",
                            selectedMember?.member_type === 'ai' ? "bg-purple-600" : "bg-emerald-600"
                        )}>
                            {selectedMember?.email.charAt(0).toUpperCase() || "?"}
                        </div>
                    )}
                    <span className="truncate">{selectedMember?.email || "Sin Asignar"}</span>
                </div>
                <ChevronDown size={12} className="text-slate-500" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                    <div
                        onClick={() => { onChange(null, "Sin Asignar"); setIsOpen(false); }}
                        className="px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 cursor-pointer hover:text-white border-b border-slate-800"
                    >
                        Sin Asignar
                    </div>
                    {members.map((member) => (
                        <div
                            key={member.id}
                            onClick={() => { onChange(member.id, member.email); setIsOpen(false); }}
                            className={cn(
                                "px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 cursor-pointer hover:text-white flex items-center gap-2",
                                value === member.id && "bg-indigo-600/10 text-indigo-400 font-medium"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                                member.member_type === 'ai' ? "bg-purple-600" : "bg-emerald-600"
                            )}>
                                {member.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="truncate">{member.email}</span>
                                <span className="text-[10px] text-slate-500">{member.role_name || member.member_type}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
