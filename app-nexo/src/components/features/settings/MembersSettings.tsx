"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { supabaseClient } from "@/lib/supabase";
import { WorkspaceMember, WorkspaceRole } from "@/types/supabase";
import { Loader2, Plus, User, Bot, Trash, Link as LinkIcon, CheckCircle2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function MembersSettings({ onSwitchTab }: { onSwitchTab?: (tab: "members" | "roles" | "agents") => void }) {
    const { activeWorkspaceId } = useWorkspace();
    const [members, setMembers] = useState<any[]>([]);
    const [roles, setRoles] = useState<WorkspaceRole[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("");

    const [isAddingTeam, setIsAddingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamDesc, setNewTeamDesc] = useState("");

    useEffect(() => {
        if (activeWorkspaceId) fetchData();
    }, [activeWorkspaceId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Roles
            const { data: rolesData } = await supabaseClient
                .from("workspace_roles")
                .select("*")
                .eq("workspace_id", activeWorkspaceId!);

            if (rolesData) setRoles(rolesData);

            // Fetch Teams
            const { data: teamsData } = await supabaseClient
                .from("workspace_teams")
                .select("*")
                .eq("workspace_id", activeWorkspaceId!);
            if (teamsData) setTeams(teamsData);

            // Fetch Members
            const { data: membersData } = await supabaseClient
                .from("workspace_members")
                .select("*, team:workspace_teams(name)")
                .eq("workspace_id", activeWorkspaceId!);

            if (membersData) {
                const enriched = membersData.map((m: any) => ({
                    ...m,
                    role_name: rolesData?.find((r: any) => r.id === m.role_id)?.name || "Unknown",
                    team_name: m.team?.name || "Global / Sin Equipo"
                }));
                setMembers(enriched);
            }

            // Fetch Pending Invitations
            const res = await fetch(`/api/invitations?workspace_id=${activeWorkspaceId}`);
            if (res.ok) {
                const invs = await res.json();
                setPendingInvitations(invs);
            }
        } catch (err) {
            console.error("Error fetching settings data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail || !inviteRole) {
            alert("Email y Rol son obligatorios.");
            return;
        }

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        setLoading(true);
        const res = await fetch("/api/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                workspace_id: activeWorkspaceId,
                email: inviteEmail,
                role_id: inviteRole,
                invited_by: user.id
            })
        });

        if (res.ok) {
            const data = await res.json();
            setInviteEmail("");
            setInviteRole("");
            alert(`Invitación creada. Enlace: ${data.signup_url}`);
            fetchData();
        } else {
            const err = await res.json();
            alert(err.error || "Error al crear invitación");
            setLoading(false);
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        if (!confirm("¿Revocar esta invitación?")) return;
        const { error } = await supabaseClient.from("invitations").delete().eq("id", inviteId);
        if (error) alert(error.message);
        else fetchData();
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabaseClient
            .from("workspace_teams")
            .insert({
                workspace_id: activeWorkspaceId,
                name: newTeamName,
                description: newTeamDesc
            });

        if (error) alert(error.message);
        else {
            setIsAddingTeam(false);
            setNewTeamName("");
            setNewTeamDesc("");
            fetchData();
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm("¿Eliminar este equipo? Los miembros quedarán sin equipo asignado.")) return;
        const { error } = await supabaseClient.from("workspace_teams").delete().eq("id", teamId);
        if (error) alert(error.message);
        else fetchData();
    };

    const handleMoveMember = async (memberId: string, teamId: string | null) => {
        const { error } = await supabaseClient
            .from("workspace_members")
            .update({ team_id: teamId })
            .eq("id", memberId);

        if (error) alert(error.message);
        else fetchData();
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm("¿Eliminar miembro del equipo?")) return;
        const { error } = await supabaseClient.from("workspace_members").delete().eq("id", memberId);
        if (error) alert(error.message);
        else fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="text-indigo-400" size={20} />
                        Gestión de Acceso
                    </h3>
                    <p className="text-slate-400 text-sm">Gestiona miembros, equipos e invitaciones de seguridad.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="email"
                        placeholder="email@usuario.com"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 outline-none w-64"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                    />
                    <div className="flex flex-col">
                        <select
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-slate-400 outline-none focus:border-indigo-500"
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value)}
                        >
                            <option value="">Seleccionar Rol...</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => onSwitchTab?.("roles")}
                            className="text-[10px] text-indigo-400 hover:underline mt-1 text-left flex items-center gap-1"
                        >
                            <Shield size={10} /> Gestionar Roles
                        </button>
                    </div>
                    <button
                        onClick={handleInvite}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Invitar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Members List */}
                <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-2">Lista de Miembros</h4>
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-950 text-slate-500 font-medium uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Usuario</th>
                                    <th className="px-6 py-4">Rol / Equipo</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading && members.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2" /> Cargando equipo...</td></tr>
                                ) : members.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No hay miembros.</td></tr>
                                ) : members.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold",
                                                    member.member_type === 'ai' ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                                                )}>
                                                    {member.member_type === 'ai' ? <Bot size={16} /> : <User size={16} />}
                                                </div>
                                                <div>
                                                    <p className="text-slate-200 font-bold truncate max-w-[120px]">{member.user_id.substring(0, 8)}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{member.member_type === 'ai' ? 'Agent AI' : 'Humano'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] border border-slate-700 font-bold">
                                                    {member.role_name}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <select
                                                        className="bg-transparent text-[11px] text-indigo-400 outline-none hover:underline cursor-pointer"
                                                        value={member.team_id || ""}
                                                        onChange={(e) => handleMoveMember(member.id, e.target.value || null)}
                                                    >
                                                        <option value="">Sin Equipo</option>
                                                        {teams.map(t => (
                                                            <option key={t.id} value={t.id}>{t.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase tracking-wider">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Activo
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Teams & Invitations Management */}
                <div className="space-y-8">
                    {/* Invitations Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Invitaciones Pendientes</h4>
                            <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {pendingInvitations.length}
                            </span>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-2 shadow-xl space-y-1">
                            {pendingInvitations.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-[10px] text-slate-500 italic">No hay invitaciones activas.</p>
                                </div>
                            ) : pendingInvitations.map(inv => (
                                <div key={inv.id} className="bg-slate-950/50 hover:bg-slate-900 border border-slate-800/50 p-3 rounded-xl flex items-center justify-between group transition-all">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs font-bold text-slate-200 truncate">{inv.email}</p>
                                            <span className="bg-indigo-500/10 text-indigo-400 text-[8px] px-1.5 py-0.5 rounded border border-indigo-500/20 font-bold uppercase">
                                                {inv.role?.name || "Member"}
                                            </span>
                                        </div>
                                        <p className="text-[9px] text-slate-500 mt-1 flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                                            Expira {new Date(inv.expires_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 ml-4">
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/signup/${inv.token}`;
                                                navigator.clipboard.writeText(url);
                                                alert("Link de registro copiado!");
                                            }}
                                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                            title="Copiar Enlace"
                                        >
                                            <LinkIcon size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleRevokeInvite(inv.id)}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Revocar"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Teams Management */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Equipos</h4>
                            <button
                                onClick={() => setIsAddingTeam(true)}
                                className="text-indigo-400 hover:text-indigo-300 p-1 rounded-lg hover:bg-indigo-500/10"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {isAddingTeam && (
                            <div className="bg-slate-900 border border-indigo-500/30 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                                <input
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sm text-white outline-none"
                                    placeholder="Nombre del equipo..."
                                    value={newTeamName}
                                    onChange={e => setNewTeamName(e.target.value)}
                                />
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-400 h-16 resize-none outline-none"
                                    placeholder="Descripción corta..."
                                    value={newTeamDesc}
                                    onChange={e => setNewTeamDesc(e.target.value)}
                                />
                                <div className="flex justify-end gap-2 text-xs font-bold">
                                    <button onClick={() => setIsAddingTeam(false)} className="text-slate-500 px-3 py-1">Cancelar</button>
                                    <button
                                        onClick={handleCreateTeam}
                                        className="bg-indigo-600 text-white px-4 py-1 rounded-lg shadow-lg shadow-indigo-500/20"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {teams.length === 0 ? (
                                <div className="p-8 text-center bg-slate-950/30 border border-dashed border-slate-800 rounded-2xl">
                                    <p className="text-xs text-slate-500 italic">No hay equipos creados.</p>
                                </div>
                            ) : teams.map(team => (
                                <div key={team.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl group hover:border-slate-700 transition-all">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-white">{team.name}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{team.description || "Sin descripción"}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteTeam(team.id)}
                                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex -space-x-2">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center">
                                                    <User size={10} className="text-slate-600" />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            {members.filter(m => m.team_id === team.id).length} Miembros
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
