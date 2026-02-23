/**
 * ApprovalCard — Tarjeta de aprobación HITL
 * Especificación: base_cerebrin_v3.md - PANTALLA 2: DASHBOARD (Estado con approvals)
 * 
 * Muestra acciones que requieren aprobación del usuario
 */

import { motion } from 'motion/react';
import { 
  Bot, 
  Eye, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ApprovalCardProps {
  id: string;
  actionType: string;
  title: string;
  description: string;
  previewLabel?: string;
  onApprove: () => void;
  onReject: () => void;
  onPreview?: () => void;
  index?: number;
  total?: number;
}

export function ApprovalCard({
  id,
  actionType,
  title,
  description,
  previewLabel = 'Ver borrador',
  onApprove,
  onReject,
  onPreview,
  index = 0,
  total = 1
}: ApprovalCardProps) {
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="sticky top-20 z-30 bg-gradient-to-br from-amber-500/10 to-red-500/10 border-2 border-amber-500/50 rounded-lg p-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {/* Agent avatar */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Bot className="w-5 h-5 text-amber-400" />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">
              {title}
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
            {actionType}
          </Badge>
        </div>

        {/* Counter if multiple */}
        {total > 1 && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-6 h-6" disabled={index === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[40px] text-center">
              {index + 1} de {total}
            </span>
            <Button variant="ghost" size="icon" className="w-6 h-6" disabled={index === total - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-xs md:text-sm text-muted-foreground mb-4 pl-13">
        {description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Preview button */}
        {onPreview && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            className="gap-2 text-xs border-border hover:bg-accent"
          >
            <Eye className="w-4 h-4" />
            {previewLabel}
          </Button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reject button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReject}
          className="gap-2 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <XCircle className="w-4 h-4" />
          Cancelar
        </Button>

        {/* Approve button */}
        <Button
          variant="default"
          size="sm"
          onClick={onApprove}
          className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle2 className="w-4 h-4" />
          Aprobar
        </Button>
      </div>

      {/* Subtle pulsing border to draw attention */}
      <motion.div
        className="absolute inset-0 rounded-lg border-2 border-amber-400/30 pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}
