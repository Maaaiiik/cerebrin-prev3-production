"use client";

import React, { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { supabaseClient } from "@/lib/supabase";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Document } from "@/types/supabase";
import { Column } from "./Column";
import { Card } from "./Card";
import { CardDetailModal } from "./CardDetailModal";
import { createPortal } from "react-dom";
import { useKanbanData } from "@/hooks/useKanbanData";
import { KanbanItem } from "@/types/supabase";
import { useWorkspace } from "@/context/WorkspaceContext";
import { Filter, ChevronDown, Check, Loader2, LayoutGrid, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
    // No props needed for now
}

const COLUMNS = ["Investigación", "Planificación", "Ejecución", "Revisión", "Terminado"];

export function KanbanBoard({ }: KanbanBoardProps) {
    const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
    const [groupBy, setGroupBy] = useState<'status' | 'parent'>('status');

    const { items: kanbanItems, refresh, loading, setItems } = useKanbanData(selectedWorkspaceIds);
    const { workspaces } = useWorkspace();

    const getParentTitle = (parentId?: string) => {
        if (!parentId) return "Sin Referencia (Huérfano)";
        const parent = kanbanItems.find(i => i.id === parentId);
        return parent ? parent.title : `Activo: ${parentId.substring(0, 8)}`;
    };

    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<KanbanItem | null>(null);

    const [showArchived, setShowArchived] = useState(false);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const toggleWorkspace = (id: string) => {
        setSelectedWorkspaceIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(wId => wId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) { setActiveId(null); return; }

        const activeId = active.id as string;
        const overId = over.id as string;
        const activeItem = kanbanItems.find(i => i.id === activeId);

        if (!activeItem) return;

        // Determine New Status
        let newStatus = activeItem.status;
        if (COLUMNS.includes(overId as any)) {
            newStatus = overId;
        } else {
            const overItem = kanbanItems.find(i => i.id === overId);
            if (overItem) newStatus = overItem.status;
        }

        if (activeItem.status !== newStatus) {
            setActiveId(null);

            // OPTIMISTIC UPDATE: Update UI immediately
            const previousItems = [...kanbanItems];

            // @ts-ignore - setItems is exposed from useKanbanData
            setItems(prev => prev.map(item =>
                item.id === activeId ? { ...item, status: newStatus } : item
            ));

            try {

                // Call API Route to handle the move (Bypasses RLS)
                const response = await fetch('/api/documents/move', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: activeId,
                        newStatus: newStatus,
                        type: activeItem.type,
                        userId: 'user-bypass',
                        workspaceId: activeItem.workspace_id,
                        previousStatus: activeItem.status
                    })
                });

                if (!response.ok) {
                    throw new Error("API Update Failed");
                }

            } catch (error) {
                console.error("Move failed:", error);
                alert("Error al mover el item.");
                // Revert optimistic update
                // @ts-ignore
                setItems(previousItems);
                refresh();
            }
        }
    };

    const handleArchive = async (item: KanbanItem) => {
        if (!confirm(`¿Archivar "${item.title}"?`)) return;

        try {
            if (item.type === 'document') {
                const { error } = await supabaseClient
                    .from('documents')
                    .update({ is_archived: true })
                    .eq('id', item.id);
                if (error) throw error;
            } else if (item.type === 'idea') {
                const { error } = await supabaseClient
                    .from('idea_pipeline')
                    .update({ status: 'discarded' })
                    .eq('id', item.id);
                if (error) throw error;
            }
            refresh();
        } catch (error: any) {
            console.error("Archive failed:", error);
            alert("Error al archivar");
        }
    };

    // Supervision Handlers
    const handleApprove = async (item: KanbanItem) => {
        if (item.type === 'document') {
            const newTags = item.tags?.filter(t => t !== 'pending_approval') || [];
            const { error } = await supabaseClient
                .from('documents')
                .update({ tags: newTags })
                .eq('id', item.id);

            if (error) alert("Error al aprobar");
            else refresh();
        }
    };

    const handleReject = async (item: KanbanItem) => {
        // ... (existing implementation)
        const { data: history } = await supabaseClient
            .from('task_history')
            .select('*')
            .eq('task_id', item.id)
            .order('changed_at', { ascending: false })
            .limit(1)
            .single();

        if (history && history.previous_status) {
            await supabaseClient
                .from('documents')
                .update({ category: history.previous_status, tags: item.tags?.filter(t => t !== 'pending_approval') })
                .eq('id', item.id);
            refresh();
        } else {
            if (confirm("No se encontró historial previo. ¿Deseas eliminar este ítem?")) {
                await supabaseClient.from('documents').delete().eq('id', item.id);
                refresh();
            }
        }
    };

    const activeKanbanItem = activeId ? kanbanItems.find((i) => i.id === activeId) : null;

    if (loading && kanbanItems.length === 0) return (
        <div className="h-full flex flex-col items-center justify-center p-10 text-slate-500 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="animate-pulse font-bold tracking-widest text-xs uppercase">Sincronizando Archivos...</p>
        </div>
    );

    const displayItems = kanbanItems.filter(item => {
        const isArchived = (item.type === 'document' && (item.original_data as any).is_archived) ||
            (item.type === 'idea' && item.status === 'discarded');
        return showArchived ? isArchived : !isArchived;
    });

    // Grouping Logic
    const parents = Array.from(new Set(displayItems.map(i => i.parent_id || "null")));

    return (
        <div className="flex flex-col h-full bg-slate-950/20">
            {/* Filter Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <LayoutGrid size={20} />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight italic">Centro de Control de Activos</h2>
                        <span className="text-[10px] font-black text-slate-500 bg-slate-800/50 px-2.5 py-1 rounded-full border border-slate-700 uppercase tracking-widest">
                            {displayItems.length} Unidades
                        </span>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setGroupBy('status')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                groupBy === 'status' ? "bg-slate-800 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Vista General
                        </button>
                        <button
                            onClick={() => setGroupBy('parent')}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                groupBy === 'parent' ? "bg-slate-800 text-indigo-400 shadow-lg" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            Por Parent
                        </button>
                        <div className="w-px h-4 bg-slate-800 mx-1" />
                        <button
                            onClick={() => setShowArchived(!showArchived)}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors border",
                                showArchived ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-transparent border-transparent text-slate-500 hover:bg-slate-800"
                            )}
                        >
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {/* Workspace Multi-Select (Compact) */}
                    <button
                        onClick={() => setSelectedWorkspaceIds([])}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                            selectedWorkspaceIds.length === 0 ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                        )}
                    >
                        Todo
                    </button>
                    {workspaces.map(ws => (
                        <button
                            key={ws.id}
                            onClick={() => toggleWorkspace(ws.id)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                selectedWorkspaceIds.includes(ws.id) ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-400" : "bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700"
                            )}
                        >
                            {ws.name}
                        </button>
                    ))}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto overflow-y-auto p-6 custom-scrollbar bg-slate-950/10">
                    <div className="flex flex-col min-w-[1600px] h-full gap-8">

                        {groupBy === 'status' ? (
                            /* NORMAL KANBAN Grid */
                            <div className="flex flex-row gap-6 h-full">
                                {COLUMNS.map((col) => (
                                    <div key={col} className="flex-1 min-w-[320px]">
                                        <Column
                                            id={col}
                                            title={col}
                                            items={displayItems.filter((item) => item.status === col)}
                                            onCardClick={(item) => setSelectedItem(item)}
                                            onApprove={handleApprove}
                                            onReject={handleReject}
                                            onArchive={handleArchive}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* SWIMLANES: Group by Parent */
                            <div className="space-y-12">
                                {parents.map((parentId: string) => {
                                    const groupItems = displayItems.filter((i: KanbanItem) => (i.parent_id || "null") === parentId);
                                    if (groupItems.length === 0) return null;

                                    return (
                                        <div key={parentId} className="space-y-4">
                                            <div className="flex items-center gap-4 px-2">
                                                <div className="h-px flex-1 bg-slate-800/50"></div>
                                                <div className="flex flex-col items-center gap-1">
                                                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                                        <Layers size={14} className="text-indigo-500" />
                                                        {getParentTitle(parentId === "null" ? undefined : parentId)}
                                                    </h3>
                                                    {parentId !== "null" && (
                                                        <div className="text-[9px] font-bold text-slate-600 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                                            {groupItems.length} Activos Relacionados
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="h-px flex-1 bg-slate-800/50"></div>
                                            </div>

                                            <div className="grid grid-cols-5 gap-6">
                                                {COLUMNS.map((col: string) => (
                                                    <div key={col} className="min-h-[100px]">
                                                        <Column
                                                            id={`${parentId}-${col}`}
                                                            title={col}
                                                            items={groupItems.filter((i: KanbanItem) => i.status === col)}
                                                            onCardClick={(item: KanbanItem) => setSelectedItem(item)}
                                                            onApprove={handleApprove}
                                                            onReject={handleReject}
                                                            onArchive={handleArchive}
                                                            hideTitle={true}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {createPortal(
                    <DragOverlay>
                        {activeKanbanItem ? <Card item={activeKanbanItem} /> : null}
                    </DragOverlay>,
                    document.body
                )}

                {selectedItem && selectedItem.type === 'document' && (
                    <CardDetailModal
                        document={selectedItem.original_data as Document}
                        isOpen={!!selectedItem}
                        onClose={() => setSelectedItem(null)}
                    />
                )}
            </DndContext>
        </div>
    );
}
