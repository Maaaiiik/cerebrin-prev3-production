/**
 * ShadowChat — Panel de chat con el agente
 * Especificación: base_cerebrin_v3.md - PANTALLA 3: SHADOW CHAT
 * 
 * Desktop: Panel fijo de 320px en el lado derecho
 * Mobile: Bottom sheet con drag handle
 * 
 * Features:
 * - Header con estado del agente
 * - Área de mensajes scrollable
 * - ChatInput con acciones rápidas
 * - Estados: activo, pensando, error
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  Settings, 
  X,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { toast } from 'sonner';

interface ShadowChatProps {
  agentName?: string;
  agentMode?: 'OBSERVER' | 'OPERATOR' | 'EXECUTOR';
  resonanceScore?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onSettingsClick?: () => void;
}

type AgentStatus = 'active' | 'thinking' | 'error';

// Mock messages para demostración
const MOCK_MESSAGES = [
  {
    id: '1',
    role: 'agent' as const,
    content: 'Hola Sofía 👋 Estoy lista para ayudarte. ¿Qué necesitas hacer hoy?',
    timestamp: 'Hace 10 min',
    confidence: 'high' as const
  },
  {
    id: '2',
    role: 'user' as const,
    content: 'Necesito crear una cotización para Empresa ABC',
    timestamp: 'Hace 9 min'
  },
  {
    id: '3',
    role: 'agent' as const,
    content: 'Perfecto. He analizado tus últimas cotizaciones y tu catálogo de productos. ¿Quieres que use tu plantilla estándar?',
    timestamp: 'Hace 9 min',
    confidence: 'high' as const,
    sourceCitation: {
      title: 'Cotización_tipo.docx'
    }
  },
  {
    id: '4',
    role: 'user' as const,
    content: 'Sí, usa esa plantilla',
    timestamp: 'Hace 8 min'
  },
  {
    id: '5',
    role: 'agent' as const,
    content: 'He planificado cómo hacer la cotización:',
    timestamp: 'Hace 8 min',
    subtasks: [
      { id: 't1', description: 'Obtener datos del cliente ABC Corp', completed: true },
      { id: 't2', description: 'Seleccionar productos del catálogo 2026', completed: true },
      { id: 't3', description: 'Aplicar precios mayoristas', completed: false },
      { id: 't4', description: 'Generar PDF con tu plantilla', completed: false }
    ],
    estimatedTime: '~3 minutos',
    approval: {
      title: 'Acción propuesta',
      description: 'Generar cotización para ABC Corp con productos seleccionados',
      onApprove: () => toast.success('Cotización aprobada'),
      onReject: () => toast.info('Cotización cancelada')
    }
  }
];

const MODE_CONFIG = {
  OBSERVER: { label: 'Estoy aprendiendo de ti', color: 'text-slate-400', bg: 'bg-slate-500/10' },
  OPERATOR: { label: 'Propongo, tú decides', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  EXECUTOR: { label: 'Actúo cuando es necesario', color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
};

export function ShadowChat({
  agentName = 'Sofia AI',
  agentMode = 'OPERATOR',
  resonanceScore = 73,
  isOpen = false,
  onClose,
  onSettingsClick
}: ShadowChatProps) {
  const [status, setStatus] = useState<AgentStatus>('active');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom cuando llegan nuevos mensajes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    // Agregar mensaje del usuario
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content,
      timestamp: 'Ahora'
    };

    setMessages(prev => [...prev, userMessage]);

    // Simular respuesta del agente
    setStatus('thinking');
    setTimeout(() => {
      const agentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent' as const,
        content: 'Entendido. Déjame procesar eso...',
        timestamp: 'Ahora',
        confidence: 'high' as const
      };
      setMessages(prev => [...prev, agentMessage]);
      setStatus('active');
    }, 1500);
  };

  const handleAttach = () => {
    toast.info('Adjuntar archivo - Próximamente');
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    // Si se arrastra más de 100px hacia abajo, cerrar
    if (info.offset.y > 100 && onClose) {
      onClose();
    }
  };

  const statusConfig = {
    active: { icon: Bot, color: 'text-emerald-400', indicator: '🟢', label: 'activa' },
    thinking: { icon: Loader2, color: 'text-amber-400', indicator: '🟡', label: 'pensando' },
    error: { icon: AlertCircle, color: 'text-red-400', indicator: '🔴', label: 'con problemas' }
  }[status];

  const StatusIcon = statusConfig.icon;
  const modeConfig = MODE_CONFIG[agentMode];

  // Desktop: Panel fijo
  if (!isMobile) {
    return (
      <div className="hidden md:flex md:flex-col h-screen w-80 border-l border-border bg-card">
        {/* Header */}
        <div className="shrink-0 border-b border-border p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <StatusIcon className={`w-4 h-4 ${statusConfig.color} ${status === 'thinking' ? 'animate-spin' : ''}`} />
              <h3 className="text-sm font-semibold text-foreground">
                {statusConfig.indicator} {agentName}
              </h3>
            </div>
            <div className="flex items-center gap-1">
              {onSettingsClick && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSettingsClick}
                  className="w-6 h-6"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Mode & Resonance */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${modeConfig.bg} ${modeConfig.color} border-${modeConfig.color.replace('text-', '')}/30`}>
              {agentMode}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-violet-500/10 text-violet-300 border-violet-500/30">
              <Sparkles className="w-2 h-2 mr-0.5" />
              {resonanceScore}%
            </Badge>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
          {messages.map(message => (
            <ChatMessage key={message.id} {...message} />
          ))}
          <div ref={messagesEndRef} />

          {/* Typing indicator */}
          {status === 'thinking' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0">
          <ChatInput
            onSend={handleSendMessage}
            onAttach={handleAttach}
            disabled={status === 'error'}
          />
        </div>
      </div>
    );
  }

  // Mobile: Bottom sheet
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 bg-black/60 z-40"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-2xl flex flex-col max-h-[70vh]"
          >
            {/* Drag handle */}
            <div className="shrink-0 py-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="shrink-0 border-b border-border px-3 pb-2">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <StatusIcon className={`w-4 h-4 ${statusConfig.color} ${status === 'thinking' ? 'animate-spin' : ''}`} />
                  <h3 className="text-sm font-semibold text-foreground">
                    {statusConfig.indicator} {agentName}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {onSettingsClick && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onSettingsClick}
                      className="w-6 h-6"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  {onClose && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="w-6 h-6"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${modeConfig.bg} ${modeConfig.color}`}>
                  {agentMode}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-violet-500/10 text-violet-300 border-violet-500/30">
                  <Sparkles className="w-2 h-2 mr-0.5" />
                  {resonanceScore}%
                </Badge>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
              {messages.map(message => (
                <ChatMessage key={message.id} {...message} />
              ))}
              <div ref={messagesEndRef} />

              {status === 'thinking' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 pb-safe">
              <ChatInput
                onSend={handleSendMessage}
                onAttach={handleAttach}
                disabled={status === 'error'}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
