"use client";

import React, { useEffect, useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { supabaseClient } from "@/lib/supabase";
import { Loader2, Bot, Plus, Trash, Edit2, Play, Save, X, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
    id: string;
    workspace_id: string;
    name: string;
    role_id: string;
    agent_type: 'RESEARCHER' | 'WRITER' | 'MANAGER' | 'CUSTOM';
    team_id: string | null;
    system_prompt: string;
    avatar_url: string;
    personality: any;
    is_active: boolean;
    created_at: string;
    role_name?: string;
    team_name?: string;
}

const AGENT_TEMPLATES = [
    {
        name: "Investigador",
        role: "Research",
        prompt: "Eres un experto en investigación de mercado y análisis de datos. Tu objetivo es encontrar patrones, validar hipótesis y proporcionar datos accionables.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=researcher"
    },
    {
        name: "Copywriter",
        role: "Creative",
        prompt: "Eres un redactor persuasivo experto en marketing digital. Tu objetivo es crear contenido que capture la atención y guíe al usuario hacia la acción.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=writer"
    },
    {
        name: "Supervisor",
        role: "Quality",
        prompt: "Eres un gestor de proyectos con ojo crítico para el detalle. Tu objetivo es revisar la calidad de las tareas, asegurar que se cumplan las guías de estilo y optimizar procesos.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=supervisor"
    }
];

export function AgentSettings({ onSwitchTab }: { onSwitchTab?: (tab: "members" | "roles" | "agents") => void }) {
    const { activeWorkspaceId } = useWorkspace();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [prompt, setPrompt] = useState("");
    const [roleId, setRoleId] = useState("");
    const [agentType, setAgentType] = useState<'RESEARCHER' | 'WRITER' | 'MANAGER' | 'CUSTOM'>("RESEARCHER");
    const [teamId, setTeamId] = useState<string>("");
    const [roles, setRoles] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);

    useEffect(() => {
        if (activeWorkspaceId) {
            fetchAgents();
            fetchRoles();
            fetchTeams();
        }
    }, [activeWorkspaceId]);

    const fetchAgents = async () => {
        setLoading(true);
        const { data, error } = await supabaseClient
            .from("workspace_agents")
            .select("*, role:workspace_roles(name), team:workspace_teams(name)")
            .eq("workspace_id", activeWorkspaceId!);

        if (data) {
            setAgents(data.map((a: any) => ({
                ...a,
                role_name: a.role?.name || "Sin Rol",
                team_name: a.team?.name || "Sin Equipo"
            })));
        }
        setLoading(false);
    };

    const fetchTeams = async () => {
        const { data } = await supabaseClient
            .from("workspace_teams")
            .select("*")
            .eq("workspace_id", activeWorkspaceId!);
        if (data) {
            setTeams(data);
            if (data.length > 0) setTeamId(data[0].id);
        }
    };

    const fetchRoles = async () => {
        const { data } = await supabaseClient
            .from("workspace_roles")
            .select("*")
            .eq("workspace_id", activeWorkspaceId!);
        if (data) {
            setRoles(data);
            // Default to 'Agent' role if exists
            const agentRole = data.find((r: any) => r.name === 'Agent');
            if (agentRole) setRoleId(agentRole.id);
        }
    };

    const handleSaveAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Límite de 5 agentes por equipo (Solo si estamos creando)
            if (!editingAgent) {
                const teamAgentsCount = agents.filter((a: any) => a.team_id === teamId).length;
                if (teamAgentsCount >= 5) {
                    throw new Error("Límite alcanzado: Máximo 5 agentes por equipo en el plan actual.");
                }
            }

            const payload = {
                name,
                system_prompt: prompt,
                workspace_id: activeWorkspaceId,
                role_id: roleId || null,
                agent_type: agentType,
                team_id: teamId || null,
                is_active: true
            };

            let error;
            if (editingAgent) {
                const { error: e } = await supabaseClient
                    .from("workspace_agents")
                    .update(payload)
                    .eq("id", editingAgent.id);
                error = e;
            } else {
                const { error: e } = await supabaseClient
                    .from("workspace_agents")
                    .insert(payload);
                error = e;
            }

            if (error) throw error;
            setIsAdding(false);
            setEditingAgent(null);
            fetchAgents();
        } catch (err: any) {
            alert("Error al guardar agente: " + err.message);
        }
    };

    const applyTemplate = (template: typeof AGENT_TEMPLATES[0]) => {
        setName(template.name);
        setPrompt(template.prompt);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este agente? Se perderá su configuración.")) return;
        const { error } = await supabaseClient.from("workspace_agents").delete().eq("id", id);
        if (!error) fetchAgents();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bot className="text-emerald-400" size={20} />
                        Agentes Especializados
                    </h3>
                    <p className="text-slate-400 text-sm">Configura tus trabajadores autónomos de IA con roles y directrices específicas.</p>
                </div>
                {!isAdding && !editingAgent && (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setName("");
                            setPrompt("");
                            setAgentType("RESEARCHER");
                            if (teams.length > 0) setTeamId(teams[0].id);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm transition-all font-bold shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        <Plus size={18} /> Crear Agente
                    </button>
                )}
            </div>

            {(isAdding || editingAgent) ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-white font-bold flex items-center gap-2">
                            {editingAgent ? <Edit2 size={16} /> : <Sparkles size={16} />}
                            {editingAgent ? "Editar Agente" : "Nuevo Agente"}
                        </h4>
                        <button onClick={() => { setIsAdding(false); setEditingAgent(null); }} className="text-slate-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSaveAgent} className="space-y-6">
                        {!editingAgent && (
                            <div className="space-y-3">
                                <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-2">
                                    <Wand2 size={10} /> Plantillas Rápidas
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {AGENT_TEMPLATES.map((t, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => applyTemplate(t)}
                                            className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-3 rounded-xl cursor-pointer transition-all group"
                                        >
                                            <p className="text-sm font-bold text-slate-200 group-hover:text-emerald-400">{t.name}</p>
                                            <p className="text-[10px] text-slate-500 italic truncate mt-1">{t.role}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre del Agente</label>
                                    <input
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                                        placeholder="Ej: Max I.A."
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Agente</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 outline-none"
                                            value={agentType}
                                            onChange={e => setAgentType(e.target.value as any)}
                                        >
                                            <option value="RESEARCHER">Researcher</option>
                                            <option value="WRITER">Writer</option>
                                            <option value="MANAGER">Manager</option>
                                            <option value="CUSTOM">Personalizado (Full)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipo Asignado</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 outline-none"
                                            value={teamId}
                                            onChange={e => setTeamId(e.target.value)}
                                        >
                                            {teams.map((t: any) => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rol de Workspace</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 outline-none"
                                        value={roleId}
                                        onChange={e => setRoleId(e.target.value)}
                                    >
                                        {roles.map((r: any) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Prompt (Instrucciones Directas)</label>
                                <textarea
                                    required
                                    className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 min-h-[150px] resize-none focus:ring-2 focus:ring-emerald-500/50 outline-none text-sm"
                                    placeholder="Describe cómo debe comportarse este agente..."
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                />
                                <p className="text-[10px] text-slate-500 mt-2 italic">
                                    {agentType === 'RESEARCHER' && "💡 Los Researchers solo pueden proponer ideas en la incubadora."}
                                    {agentType === 'WRITER' && "✍️ Los Writers pueden redactar contenido en proyectos existentes."}
                                    {agentType === 'MANAGER' && "⚡ Los Managers supervisan equipos y gestionan aprobaciones."}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => { setIsAdding(false); setEditingAgent(null); }}
                                className="px-6 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <Save size={18} />
                                {editingAgent ? "Guardar Cambios" : "Activar Agente"}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center text-slate-500">
                            <Loader2 className="animate-spin inline mr-2" /> Cargando cerebro de agentes...
                        </div>
                    ) : agents.length === 0 ? (
                        <div className="col-span-full py-20 bg-slate-950/30 border border-dashed border-slate-800 rounded-3xl text-center">
                            <Bot className="text-slate-700 mx-auto mb-4" size={48} />
                            <p className="text-slate-400 font-medium">No hay agentes configurados.</p>
                            <p className="text-slate-500 text-sm mt-1">Crea tu primer agente para automatizar tareas.</p>
                        </div>
                    ) : agents.map((agent) => (
                        <div key={agent.id} className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/50 transition-all shadow-lg overflow-hidden">
                            {/* Decorative background pulse */}
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                                    <Bot size={24} />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => {
                                            setEditingAgent(agent);
                                            setName(agent.name);
                                            setPrompt(agent.system_prompt);
                                            setRoleId(agent.role_id);
                                            setAgentType(agent.agent_type);
                                            setTeamId(agent.team_id || "");
                                        }}
                                        className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(agent.id)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-white font-bold">{agent.name}</h4>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700 uppercase tracking-tighter">
                                        {agent.role_name}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20 uppercase tracking-tighter">
                                        {agent.agent_type}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-500">
                                        {agent.team_name}
                                    </span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                            </div>

                            <p className="text-xs text-slate-400 mt-4 line-clamp-3 leading-relaxed italic border-l-2 border-slate-800 pl-3">
                                "{agent.system_prompt}"
                            </p>

                            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                                <span className="text-[10px] text-slate-500 font-mono">ID: {agent.id.slice(0, 8)}</span>
                                <div className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-xs font-bold cursor-pointer">
                                    <Play size={12} fill="currentColor" /> Probar Agente
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
