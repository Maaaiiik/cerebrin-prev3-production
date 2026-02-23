/**
 * ChatInput — Input del Shadow Chat
 * Especificación: base_cerebrin_v3.md - PANTALLA 3: SHADOW CHAT - Barra de Input
 * 
 * Features:
 * - Input de texto con placeholder
 * - Botón de adjuntar archivo (📎)
 * - Botón de enviar
 * - Acciones rápidas (chips) que aparecen al hacer focus
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Paperclip,
  FileText,
  BarChart2,
  Search,
  Mail,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  { id: 'quote', label: 'Crear cotización', icon: FileText },
  { id: 'summarize', label: 'Resumir', icon: BarChart2 },
  { id: 'research', label: 'Investigar', icon: Search },
  { id: 'email', label: 'Redactar email', icon: Mail }
];

export function ChatInput({ 
  onSend, 
  onAttach, 
  placeholder = '¿En qué te ayudo hoy?',
  disabled = false 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleQuickAction = (actionId: string) => {
    const prompts: Record<string, string> = {
      quote: 'Ayúdame a crear una cotización para ',
      summarize: 'Haz un resumen de ',
      research: 'Investiga sobre ',
      email: 'Redacta un email para '
    };
    setMessage(prompts[actionId] || '');
    setIsFocused(true);
  };

  return (
    <div className="border-t border-border bg-card/95 backdrop-blur-sm">
      {/* Quick Actions */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-1.5 flex items-center gap-1 flex-wrap border-b border-border">
              <Zap className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className="
                      px-1.5 py-0.5 rounded-md text-[10px]
                      bg-violet-500/10 hover:bg-violet-500/20
                      text-violet-300 border border-violet-500/30
                      transition-colors flex items-center gap-1
                    "
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="p-2.5 flex items-end gap-2">
        {/* Attach button */}
        {onAttach && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onAttach}
            className="shrink-0 w-8 h-8"
            disabled={disabled}
          >
            <Paperclip className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              w-full px-2.5 py-1.5 
              bg-muted border border-border rounded-lg
              text-xs text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-violet-500/50
              resize-none max-h-20
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{
              minHeight: '32px',
              height: 'auto'
            }}
          />
        </div>

        {/* Send button */}
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled}
          className="shrink-0 w-8 h-8 bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  );
}
