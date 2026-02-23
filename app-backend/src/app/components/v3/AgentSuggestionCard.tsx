/**
 * AgentSuggestionCard — Sugerencias del agente
 * Especificación: base_cerebrin_v3.md - PANTALLA 2: DASHBOARD
 * 
 * Muestra sugerencias proactivas del agente con acciones
 */

import { motion } from 'motion/react';
import { 
  Lightbulb, 
  FileText, 
  Mail, 
  Calendar,
  TrendingUp,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface AgentSuggestionCardProps {
  id: string;
  type?: 'document' | 'email' | 'meeting' | 'insight' | 'task';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: (id: string) => void;
  onDismiss?: (id: string) => void;
  confidence?: 'high' | 'medium' | 'low';
  timestamp?: string;
}

export function AgentSuggestionCard({
  id,
  type = 'task',
  title,
  description,
  actionLabel = 'Ver',
  onAction,
  onDismiss,
  confidence = 'high',
  timestamp
}: AgentSuggestionCardProps) {
  
  const typeConfig = {
    document: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Documento' },
    email: { icon: Mail, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Email' },
    meeting: { icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Reunión' },
    insight: { icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Insight' },
    task: { icon: Lightbulb, color: 'text-violet-400', bg: 'bg-violet-500/10', label: 'Sugerencia' }
  }[type];

  const confidenceConfig = {
    high: { label: 'Alta confianza', color: 'text-emerald-400', bg: 'bg-emerald-500/10', emoji: '🟢' },
    medium: { label: 'Confianza media', color: 'text-amber-400', bg: 'bg-amber-500/10', emoji: '🟡' },
    low: { label: 'Revisar', color: 'text-slate-400', bg: 'bg-slate-500/10', emoji: '⚪' }
  }[confidence];

  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="relative bg-gradient-to-br from-violet-500/5 to-transparent border border-violet-500/20 rounded-lg p-4 group hover:border-violet-500/40 transition-colors"
    >
      {/* Sparkle indicator */}
      <div className="absolute -top-1 -right-1">
        <Sparkles className="w-4 h-4 text-violet-400 opacity-60" />
      </div>

      <div className="flex items-start gap-3">
        
        {/* Icon */}
        <div className={`shrink-0 w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
          <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">💡</span>
                <Badge variant="outline" className="text-[10px] bg-violet-500/10 text-violet-300 border-violet-500/30">
                  {typeConfig.label}
                </Badge>
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                {title}
              </h4>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>

          {/* Footer - Confidence + Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Confidence indicator */}
              <Badge 
                variant="outline" 
                className={`text-[10px] ${confidenceConfig.bg} ${confidenceConfig.color} border-${confidenceConfig.color.replace('text-', '')}/30`}
              >
                {confidenceConfig.emoji} {confidenceConfig.label}
              </Badge>
              
              {/* Timestamp */}
              {timestamp && (
                <span className="text-[10px] text-muted-foreground">
                  {timestamp}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(id)}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
                >
                  Ignorar
                </Button>
              )}
              {onAction && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onAction(id)}
                  className="text-xs h-7 px-3 bg-violet-600 hover:bg-violet-700 gap-1"
                >
                  {actionLabel}
                  <ChevronRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
