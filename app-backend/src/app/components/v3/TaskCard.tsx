/**
 * TaskCard — Tarjeta de tarea con swipe gestures
 * Especificación: base_cerebrin_v3.md - PANTALLA 2: DASHBOARD
 * 
 * Features:
 * - Swipe right → marcar como completada
 * - Swipe left → opciones (editar, delegar, eliminar)
 * - Indicador de prioridad visual
 * - Badge de agente si fue creada por IA
 * - Drag & drop para reordenar (desktop)
 */

import { useState, useRef, TouchEvent, MouseEvent } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'motion/react';
import { 
  Circle, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Bot,
  GripVertical,
  MoreVertical,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface TaskCardProps {
  id: string;
  title: string;
  priority?: 'high' | 'medium' | 'low';
  completed?: boolean;
  createdByAgent?: boolean;
  dueDate?: string;
  assignedTo?: string;
  onComplete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelegate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  draggable?: boolean;
}

export function TaskCard({
  id,
  title,
  priority = 'medium',
  completed = false,
  createdByAgent = false,
  dueDate,
  assignedTo,
  onComplete,
  onEdit,
  onDelegate,
  onDelete,
  onClick,
  draggable = false
}: TaskCardProps) {
  const [showActions, setShowActions] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-100, 0, 100], [0.95, 1, 0.95]);

  const priorityConfig = {
    high: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Alta', emoji: '🔴' },
    medium: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Media', emoji: '🟡' },
    low: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', label: 'Baja', emoji: '⚪' }
  }[priority];

  const PriorityIcon = priorityConfig.icon;

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 80;
    
    if (info.offset.x > threshold && onComplete) {
      // Swipe right - Complete
      onComplete(id);
      x.set(0);
    } else if (info.offset.x < -threshold) {
      // Swipe left - Show actions
      setShowActions(true);
      x.set(0);
    } else {
      x.set(0);
    }
  };

  const handleCardClick = () => {
    if (!showActions && onClick) {
      onClick(id);
    }
  };

  return (
    <div className="relative group">
      {/* Background action hints */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-semibold">Completar</span>
        </div>
        <div className="flex items-center gap-2 text-red-400">
          <span className="text-xs font-semibold">Opciones</span>
          <MoreVertical className="w-5 h-5" />
        </div>
      </div>

      {/* Main card */}
      <motion.div
        drag={draggable ? 'x' : undefined}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, scale }}
        className={`
          relative bg-card border rounded-lg p-3 md:p-4 cursor-pointer
          transition-all hover:bg-accent/50
          ${completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'}
          ${showActions ? 'border-amber-500/50' : ''}
        `}
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-3">
          
          {/* Drag handle - Desktop only */}
          {draggable && (
            <div className="hidden md:flex shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onComplete) onComplete(id);
            }}
            className="shrink-0 mt-0.5"
            aria-label={completed ? 'Marcar como pendiente' : 'Marcar como completada'}
          >
            {completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h4 className={`
                text-sm font-medium flex-1
                ${completed ? 'line-through text-muted-foreground' : 'text-foreground'}
              `}>
                {title}
              </h4>
              
              {/* Priority indicator - Mobile */}
              <span className="md:hidden text-sm shrink-0">
                {priorityConfig.emoji}
              </span>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Priority badge - Desktop */}
              <Badge 
                variant="outline" 
                className={`hidden md:inline-flex text-[10px] ${priorityConfig.bg} ${priorityConfig.color} ${priorityConfig.border}`}
              >
                <PriorityIcon className="w-2.5 h-2.5 mr-1" />
                {priorityConfig.label}
              </Badge>

              {/* Agent badge */}
              {createdByAgent && (
                <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-300 border-violet-500/30">
                  <Bot className="w-2.5 h-2.5 mr-1" />
                  Creada por IA
                </Badge>
              )}

              {/* Due date */}
              {dueDate && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {dueDate}
                </span>
              )}
            </div>
          </div>

          {/* Actions menu - Desktop */}
          <div className="hidden md:flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Actions panel */}
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap"
          >
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(id);
                  setShowActions(false);
                }}
                className="text-xs gap-2"
              >
                <Edit className="w-3 h-3" />
                Editar
              </Button>
            )}
            {onDelegate && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelegate(id);
                  setShowActions(false);
                }}
                className="text-xs gap-2"
              >
                <Send className="w-3 h-3" />
                Delegar al agente
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(id);
                  setShowActions(false);
                }}
                className="text-xs gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-3 h-3" />
                Eliminar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(false);
              }}
              className="text-xs ml-auto"
            >
              Cancelar
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
