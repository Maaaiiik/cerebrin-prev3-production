"use client";

import React, { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Loader2, Check, X, Eye, Bot, Calendar, Layers, Zap, Info, ShieldCheck, AlertTriangle, Plus, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ApprovalRequest {
    id: string;
    workspace_id: string;
    agent_id: string;
    action_type: 'CREATE' | 'UPDATE' | 'DELETE';
    entity_type: 'TASK' | 'IDEA' | 'PROJECT';
    target_id: string | null;
    proposed_data: any;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
    agent_name?: string;
}

export function ApprovalPanel() {
    const { activeWorkspaceId } = useWorkspace();
    const [requests, setRequests] = useState<ApprovalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [viewingRequest, setViewingRequest] = useState<ApprovalRequest | null>(null);

    useEffect(() => {
        if (activeWorkspaceId) fetchRequests();
    }, [activeWorkspaceId]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabaseClient
                .from("agent_approval_queue")
                .select("*, agent:agents(name)")
                .eq("workspace_id", activeWorkspaceId!)
                .eq("status", "pending")
                .order("created_at", { ascending: false });

            if (data) {
                setRequests(data.map((r: any) => ({
                    ...r,
                    agent_name: r.agent?.name || "Agente Desconocido"
                })));
            }
        } catch (err) {
            console.error("Error fetching approval requests:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, approve: boolean) => {
        setProcessingId(requestId);
        try {
            const request = requests.find(r => r.id === requestId);
            if (!request) return;

            if (approve) {
                // Perform the actual action
                const { action_type, entity_type, proposed_data, target_id } = request;
                const table = entity_type === 'IDEA' ? 'idea_pipeline' : 'documents';

                if (action_type === 'CREATE') {
                    await supabaseClient.from(table).insert(proposed_data);
                } else if (action_type === 'UPDATE' && target_id) {
                    await supabaseClient.from(table).update(proposed_data).eq("id", target_id);
                } else if (action_type === 'DELETE' && target_id) {
                    await supabaseClient.from(table).delete().eq("id", target_id);
                }
            }

            // Update status in the queue
            const { error } = await supabaseClient
                .from("agent_approval_queue")
                .update({
                    status: approve ? 'approved' : 'rejected',
                    processed_at: new Date().toISOString()
                })
            if (error) throw error;

            // 4. Log to Activity Feed
            const actionVerb = approve ? "Aprobó" : "Rechazó";
            const entityLabel = request.entity_type === 'TASK' ? 'Tarea' :
                request.entity_type === 'IDEA' ? 'Idea' : 'Proyecto';
            const actionLabel = request.action_type === 'CREATE' ? 'creación' :
                request.action_type === 'UPDATE' ? 'actualización' : 'eliminación';

            await supabaseClient.from("activity_feed").insert({
                workspace_id: activeWorkspaceId,
                action_type: approve ? "agent_action_approved" : "agent_action_rejected",
                description: `${actionVerb} ${actionLabel} de ${entityLabel} propuesta por ${request.agent_name}.`,
                metadata: {
                    agent_id: request.agent_id,
                    request_id: requestId,
                    entity_type: request.entity_type,
                    action_type: request.action_type
                }
            });

            setRequests(prev => prev.filter(r => r.id !== requestId));
            setViewingRequest(null);
        } catch (err: any) {
            alert("Error al procesar: " + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="py-20 text-center text-slate-500">
            <Loader2 className="animate-spin inline mr-2" /> Sincronizando peticiones de agentes...
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="text-indigo-400" size={20} />
                        Cola de Aprobación
                    </h3>
                    <p className="text-slate-400 text-sm">Revisa y autoriza las acciones propuestas por tus Agentes IA.</p>
                </div>
                <div className="bg-slate-900 px-3 py-1 rounded-full border border-slate-800 text-xs font-bold text-slate-500">
                    {requests.length} Pendientes
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="py-16 bg-slate-950/30 border border-dashed border-slate-800 rounded-3xl text-center">
                    <Check className="text-emerald-500/20 mx-auto mb-4" size={48} />
                    <p className="text-slate-400 font-medium">Todo al día.</p>
                    <p className="text-slate-500 text-sm mt-1">No hay acciones pendientes de revisión.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-lg"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0",
                                    request.action_type === 'CREATE' ? "bg-emerald-500/20 text-emerald-400" :
                                        request.action_type === 'UPDATE' ? "bg-amber-500/20 text-amber-400" :
                                            "bg-red-500/20 text-red-400"
                                )}>
                                    {request.action_type === 'CREATE' ? <Plus size={20} /> :
                                        request.action_type === 'UPDATE' ? <RefreshCw size={20} /> : <Trash size={20} />}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm">
                                        {request.action_type === 'CREATE' ? 'Crear' :
                                            request.action_type === 'UPDATE' ? 'Actualizar' : 'Eliminar'} {request.entity_type}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                        <Bot size={12} className="text-indigo-400" />
                                        <span>Propuesto por <strong>{request.agent_name}</strong></span>
                                        <span>•</span>
                                        <span>{new Date(request.created_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewingRequest(request)}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                    title="Ver Detalles"
                                >
                                    <Eye size={18} />
                                </button>
                                <button
                                    onClick={() => handleAction(request.id, false)}
                                    disabled={!!processingId}
                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    title="Rechazar"
                                >
                                    <X size={18} />
                                </button>
                                <button
                                    onClick={() => handleAction(request.id, true)}
                                    disabled={!!processingId}
                                    className="p-2 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-all disabled:opacity-50"
                                    title="Aprobar"
                                >
                                    {processingId === request.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for viewing details */}
            <AnimatePresence>
                {viewingRequest && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Zap className="text-yellow-400" size={20} />
                                    Detalles de la Acción
                                </h3>
                                <button onClick={() => setViewingRequest(null)} className="text-slate-500 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/50">
                                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest block mb-2">Datos Propuestos</label>
                                    <pre className="text-xs text-indigo-400 font-mono whitespace-pre-wrap overflow-y-auto max-h-60 custom-scrollbar">
                                        {JSON.stringify(viewingRequest.proposed_data, null, 2)}
                                    </pre>
                                </div>

                                <div className="flex gap-3 text-xs text-slate-400 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                                    <Info className="shrink-0 text-indigo-400" size={16} />
                                    <p>Al aprobar esta acción, los cambios se aplicarán inmediatamente a la base de datos de producción.</p>
                                </div>
                            </div>

                            <div className="p-6 bg-slate-950/50 flex justify-end gap-3">
                                <button
                                    onClick={() => handleAction(viewingRequest.id, false)}
                                    className="px-6 py-2 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                                >
                                    Rechazar
                                </button>
                                <button
                                    onClick={() => handleAction(viewingRequest.id, true)}
                                    className="px-8 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                >
                                    Aprobar Cambio
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Inline helper for Refresh icon
function RefreshCw(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
