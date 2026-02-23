"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { KanbanItem } from "@/types/supabase";
import { cn } from "@/lib/utils";
import { Calendar, Tag, GitMerge, Lightbulb, FileText, Link as LinkIcon, Folder, CheckSquare, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CardProps {
    item: KanbanItem;
    onClick?: (item: KanbanItem) => void;
    onApprove?: (item: KanbanItem) => void;
    onReject?: (item: KanbanItem) => void;
    onArchive?: (item: KanbanItem) => void;
}

export function Card({ item, onClick, onApprove, onReject, onArchive }: CardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        data: { item },
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    const isPending = item.tags?.includes('pending_approval');
    const progress = (item.original_data as any).progress_pct || 0;

    const getIcon = () => {
        if (item.type === 'idea') return <Lightbulb size={14} className="text-amber-400" />;
        if (item.doc_type === 'link') return <LinkIcon size={14} className="text-sky-400" />;
        if (item.parent_id) return <CheckSquare size={14} className="text-emerald-400" />;
        return <Folder size={14} className="text-indigo-400" />;
    };

    const getPriorityColor = () => {
        if (item.priority > 7) return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
        if (item.priority > 4) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
        return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onClick?.(item)}
            className={cn(
                "bg-slate-900 mb-3 p-4 rounded-2xl border transition-all hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] group relative select-none overflow-hidden",
                isDragging && "opacity-50 grayscale rotate-2 scale-95 z-50",
                isPending ? "border-amber-500/40 shadow-[0_0_15px_-3px_rgba(234,179,8,0.2)]" : "border-slate-800"
            )}
        >
            {/* Background progress accent */}
            <div
                className="absolute left-0 bottom-0 h-0.5 bg-indigo-500/30 transition-all duration-1000"
                style={{ width: `${progress}%` }}
            />

            {/* Top Bar: Metadata & Actions */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1 px-1.5 bg-slate-950/80 rounded border border-slate-800 flex items-center gap-1.5">
                            {getIcon()}
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                {item.type === 'idea' ? 'Brief' : item.parent_id ? 'Task' : 'Asset'}
                            </span>
                        </div>
                        {item.priority && <div className={cn("w-1.5 h-1.5 rounded-full", getPriorityColor())} />}
                    </div>
                </div>

                {/* Hover Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onArchive?.(item); }}
                        title="Archivar"
                    >
                        <Trash2 size={12} />
                    </button>
                    {!isPending && (
                        <div className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/5 cursor-grab">
                            <GitMerge size={12} />
                        </div>
                    )}
                </div>
            </div>

            {/* Title & Description */}
            <div className="mb-4">
                <h4 className="text-slate-100 font-bold text-sm leading-tight mb-1 group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {item.title}
                </h4>
                {item.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 italic font-medium">
                        {item.description}
                    </p>
                )}
            </div>

            {/* Sub-details (Progress & Context) */}
            <div className="space-y-3">
                {/* Progress Bar (Visible) */}
                {(item.type === 'document' || item.type === 'idea') && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-black uppercase text-slate-600 tracking-tighter">
                            <span>Progreso Operativo</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Pending Approval HUD */}
                {isPending && (
                    <div className="pt-2 flex items-center gap-2 border-t border-amber-500/10">
                        <button
                            className="flex-1 bg-amber-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-black py-1.5 px-1 rounded-md border border-emerald-500/20 transition-all uppercase tracking-widest"
                            onClick={(e) => { e.stopPropagation(); onApprove?.(item); }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            Aprobar
                        </button>
                        <button
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-black py-1.5 px-2 rounded-md border border-red-500/20 transition-all uppercase"
                            onClick={(e) => { e.stopPropagation(); onReject?.(item); }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Trash2 size={10} />
                        </button>
                    </div>
                )}

                {/* Footer: Dates & Tags */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
                    <div className="flex items-center gap-2">
                        {item.due_date && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                new Date(item.due_date) < new Date() ? "text-red-400 bg-red-500/10" : "text-slate-500 bg-slate-950/50"
                            )}>
                                <Calendar size={10} />
                                {format(new Date(item.due_date), "dd MMM", { locale: es })}
                            </div>
                        )}
                        {item.tags?.slice(0, 1).map(tag => tag !== 'pending_approval' && (
                            <div key={tag} className="flex items-center gap-1 text-[9px] font-black text-slate-600 uppercase tracking-tighter">
                                <Tag size={10} />
                                {tag}
                            </div>
                        ))}
                    </div>

                    <div className="text-[9px] font-black text-slate-700 uppercase italic">
                        ID: {item.id.substring(0, 4)}
                    </div>
                </div>
            </div>
        </div>
    );
}
