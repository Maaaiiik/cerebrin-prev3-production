/**
 * AgentStatusBanner — Banner del estado del agente
 * Especificación: base_cerebrin_v3.md - PANTALLA 2: DASHBOARD
 * 
 * Muestra:
 * - Estado del agente (activo/pensando/error)
 * - Mensaje contextual
 * - Botón de acción rápida
 * - Resonance score visual
 */

import { motion } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  AlertCircle, 
  ChevronRight,
  Loader2,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface AgentStatusBannerProps {
  agentName?: string;
  status?: 'active' | 'thinking' | 'error' | 'idle';
  message?: string;
  suggestionsCount?: number;
  resonanceScore?: number;
  onActionClick?: () => void;
  actionLabel?: string;
}

export function AgentStatusBanner({
  agentName = 'Sofia AI',
  status = 'active',
  message,
  suggestionsCount = 0,
  resonanceScore = 73,
  onActionClick,
  actionLabel
}: AgentStatusBannerProps) {
  
  const statusConfig = {
    active: {
      icon: Bot,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      indicator: '🟢',
      defaultMessage: suggestionsCount > 0 
        ? `Tengo ${suggestionsCount} ${suggestionsCount === 1 ? 'sugerencia lista' : 'sugerencias listas'} para ti`
        : 'Estoy observando tu trabajo para ayudarte'
    },
    thinking: {
      icon: Loader2,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      indicator: '🟡',
      defaultMessage: 'Estoy analizando tus documentos...'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      indicator: '🔴',
      defaultMessage: 'Necesito tu atención'
    },
    idle: {
      icon: Bot,
      iconColor: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/30',
      indicator: '⚪',
      defaultMessage: 'En espera'
    }
  }[status];

  const StatusIcon = statusConfig.icon;
  const displayMessage = message || statusConfig.defaultMessage;
  const displayActionLabel = actionLabel || (suggestionsCount > 0 ? 'Ver sugerencias' : 'Abrir chat');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative overflow-hidden rounded-lg border
        ${statusConfig.bgColor} ${statusConfig.borderColor}
        p-4 md:p-5
      `}
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />

      <div className="relative flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
        
        {/* Left side - Agent info */}
        <div className="flex items-start gap-3 flex-1">
          {/* Agent avatar */}
          <div className={`
            shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full 
            flex items-center justify-center
            ${statusConfig.bgColor} border ${statusConfig.borderColor}
          `}>
            <StatusIcon 
              className={`w-5 h-5 md:w-6 md:h-6 ${statusConfig.iconColor} ${status === 'thinking' ? 'animate-spin' : ''}`} 
            />
          </div>

          {/* Agent status text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm md:text-base font-semibold text-foreground">
                {statusConfig.indicator} {agentName} está {status === 'active' ? 'activa' : status === 'thinking' ? 'pensando' : status === 'error' ? 'con problemas' : 'inactiva'}
              </h3>
              
              {/* Resonance badge - Desktop only */}
              {status === 'active' && (
                <Badge variant="outline" className="hidden md:inline-flex text-[10px] bg-violet-500/10 text-violet-300 border-violet-500/30">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  {resonanceScore}% sintonía
                </Badge>
              )}
            </div>
            
            <p className="text-xs md:text-sm text-muted-foreground">
              {displayMessage}
            </p>

            {/* Resonance badge - Mobile only */}
            {status === 'active' && (
              <Badge variant="outline" className="md:hidden mt-2 inline-flex text-[10px] bg-violet-500/10 text-violet-300 border-violet-500/30">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                {resonanceScore}% sintonía
              </Badge>
            )}
          </div>
        </div>

        {/* Right side - Action button */}
        {onActionClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onActionClick}
            className="shrink-0 w-full md:w-auto gap-2 border border-border hover:bg-accent"
          >
            {suggestionsCount > 0 && <Zap className="w-4 h-4 text-amber-400" />}
            <span className="text-xs font-semibold">{displayActionLabel}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
