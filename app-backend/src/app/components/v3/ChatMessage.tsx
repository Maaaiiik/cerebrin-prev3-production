/**
 * ChatMessage — Mensaje del chat con el agente
 * Especificación: base_cerebrin_v3.md - PANTALLA 3: SHADOW CHAT
 * 
 * Features:
 * - Mensaje del agente con avatar
 * - Mensaje del usuario (alineado a la derecha)
 * - SourceCitation (referencias)
 * - ConfidenceBadge (nivel de confianza)
 * - Timestamp
 * - ApprovalCard inline (cuando necesita aprobación)
 */

import { motion } from 'motion/react';
import { 
  Bot, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  XCircle,
  CheckCheck
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ChatMessageProps {
  id: string;
  role: 'agent' | 'user';
  content: string;
  timestamp?: string;
  confidence?: 'high' | 'medium' | 'low';
  sourceCitation?: {
    title: string;
    icon?: any;
  };
  approval?: {
    title: string;
    description: string;
    onApprove: () => void;
    onReject: () => void;
  };
  subtasks?: Array<{
    id: string;
    description: string;
    completed?: boolean;
  }>;
  estimatedTime?: string;
}

export function ChatMessage({
  id,
  role,
  content,
  timestamp,
  confidence,
  sourceCitation,
  approval,
  subtasks,
  estimatedTime
}: ChatMessageProps) {
  
  const isAgent = role === 'agent';

  const confidenceConfig = {
    high: { label: 'Alta confianza', color: 'text-emerald-400', bg: 'bg-emerald-500/10', emoji: '🟢' },
    medium: { label: 'Confianza media', color: 'text-amber-400', bg: 'bg-amber-500/10', emoji: '🟡' },
    low: { label: 'Baja confianza', color: 'text-slate-400', bg: 'bg-slate-500/10', emoji: '⚪' }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isAgent ? '' : 'flex-row-reverse'} mb-3`}
    >
      {/* Avatar */}
      {isAgent && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Bot className="w-3.5 h-3.5 text-violet-400" />
        </div>
      )}

      {/* Message content */}
      <div className={`flex-1 min-w-0 ${isAgent ? 'mr-6' : 'ml-6'}`}>
        {/* Message bubble */}
        <div
          className={`
            rounded-lg p-2.5 
            ${isAgent 
              ? 'bg-card border border-border' 
              : 'bg-violet-600/20 border border-violet-500/30 ml-auto max-w-[80%]'
            }
          `}
        >
          <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
            {content}
          </p>

          {/* Subtasks plan */}
          {subtasks && subtasks.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border space-y-1.5">
              {subtasks.map((task, index) => (
                <div key={task.id} className="flex items-start gap-1.5 text-[11px]">
                  {task.completed ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <span className="text-muted-foreground shrink-0">{index + 1}.</span>
                  )}
                  <span className={task.completed ? 'text-emerald-400' : 'text-muted-foreground'}>
                    {task.description}
                  </span>
                </div>
              ))}
              {estimatedTime && (
                <p className="text-xs text-muted-foreground mt-2">
                  ⏱️ Tiempo estimado: {estimatedTime}
                </p>
              )}
            </div>
          )}

          {/* Source citation */}
          {sourceCitation && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>Según {sourceCitation.title}</span>
              </div>
            </div>
          )}

          {/* Confidence badge */}
          {confidence && (
            <div className="mt-2">
              <Badge 
                variant="outline" 
                className={`text-[10px] ${confidenceConfig[confidence].bg} ${confidenceConfig[confidence].color} border-${confidenceConfig[confidence].color.replace('text-', '')}/30`}
              >
                {confidenceConfig[confidence].emoji} {confidenceConfig[confidence].label}
              </Badge>
            </div>
          )}
        </div>

        {/* Approval card (inline en el chat) */}
        {approval && (
          <div className="mt-2 bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-foreground mb-1">
                  {approval.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {approval.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="default"
                size="sm"
                onClick={approval.onApprove}
                className="text-xs h-7 px-3 bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3" />
                Aprobar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={approval.onReject}
                className="text-xs h-7 px-3 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
              >
                <XCircle className="w-3 h-3" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground ${isAgent ? '' : 'justify-end'}`}>
          {timestamp && <span>{timestamp}</span>}
          {!isAgent && <CheckCheck className="w-3 h-3" />}
        </div>
      </div>
    </motion.div>
  );
}
