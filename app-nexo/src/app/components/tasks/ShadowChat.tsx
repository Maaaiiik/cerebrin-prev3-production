/**
 * ShadowChat — AI Assistant para Focus Mode
 * 
 * Chat lateral exclusivo del modo Focus que ayuda con tareas,
 * sugerencias de priorización, y resolución de bloqueos.
 * 
 * Features:
 * - Mensajes en tiempo real con IA
 * - Sugerencias contextuales basadas en tareas
 * - Quick actions (crear tarea, marcar prioritaria, etc.)
 */

import * as React from "react";
import { Bot, Send, Sparkles, X, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    role: "agent",
    content: "Hola 👋 Soy tu asistente personal. Estoy aquí para ayudarte a gestionar tus tareas y mantenerte enfocado. ¿En qué puedo ayudarte hoy?",
    timestamp: "10:30 AM",
  },
];

export function ShadowChat() {
  const [messages, setMessages] = React.useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = React.useState("");
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: getSmartResponse(input),
        timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const getSmartResponse = (userInput: string): string => {
    const lower = userInput.toLowerCase();
    
    if (lower.includes("prioridad") || lower.includes("urgente")) {
      return "Entiendo que necesitas priorizar. He analizado tus tareas actuales:\n\n• **Revisar propuesta Q1** está bloqueada esperando feedback\n• **Actualizar dashboard analytics** tiene deadline mañana\n• **Preparar presentación** puede esperar hasta la próxima semana\n\n¿Quieres que marque 'Actualizar dashboard' como alta prioridad?";
    }
    
    if (lower.includes("bloqueada") || lower.includes("bloqueado") || lower.includes("stuck")) {
      return "Veo que tienes 2 tareas bloqueadas:\n\n1. **Revisar propuesta Q1** - esperando aprobación de María\n2. **Deploy a producción** - requiere code review\n\n¿Necesitas que envíe un recordatorio a los responsables?";
    }
    
    if (lower.includes("crear") || lower.includes("nueva tarea")) {
      return "¿Qué tarea quieres crear? Puedo ayudarte a:\n\n• Asignarla al agente correcto\n• Establecer prioridad y deadline\n• Vincularla a un proyecto existente\n\nCuéntame más detalles.";
    }
    
    if (lower.includes("ayuda") || lower.includes("help")) {
      return "Puedo ayudarte con:\n\n✓ Priorizar tareas según urgencia y dependencias\n✓ Resolver bloqueos y enviar recordatorios\n✓ Crear tareas nuevas con configuración óptima\n✓ Sugerirte próximos pasos basados en tu workflow\n\n¿Qué necesitas?";
    }

    return "He registrado tu mensaje. Como estoy en modo demo, mi capacidad de respuesta es limitada. En producción, conectaría con el Strategic AI Router para darte respuestas contextuales basadas en tu historial de tareas y el estado del proyecto. ¿Hay algo más en lo que pueda ayudarte?";
  };

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        title="Abrir Shadow Chat"
      >
        <Bot className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-400 border-2 border-background animate-pulse" />
      </button>
    );
  }

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <Bot className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Tu Asistente IA</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Minimizar"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="px-4 py-3 border-b border-border/50 space-y-2 shrink-0">
        <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-semibold">
          Sugerencias rápidas
        </p>
        <div className="flex flex-wrap gap-2">
          {["¿Qué es prioritario?", "Tareas bloqueadas", "Crear tarea"].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setInput(suggestion);
                setTimeout(() => handleSend(), 100);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-foreground border border-border/60 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 items-start",
              msg.role === "user" && "flex-row-reverse"
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 rounded-lg shrink-0 flex items-center justify-center",
                msg.role === "agent"
                  ? "bg-emerald-600/20 border border-emerald-500/30"
                  : "bg-violet-600/20 border border-violet-500/30"
              )}
            >
              {msg.role === "agent" ? (
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="text-xs text-violet-400 font-semibold">Tú</span>
              )}
            </div>

            {/* Message bubble */}
            <div
              className={cn(
                "flex-1 rounded-2xl px-3.5 py-2.5 max-w-[85%]",
                msg.role === "agent"
                  ? "bg-muted border border-border/60"
                  : "bg-violet-600/15 border border-violet-500/30"
              )}
            >
              <p
                className={cn(
                  "text-sm leading-relaxed whitespace-pre-line",
                  msg.role === "agent" ? "text-foreground" : "text-violet-200"
                )}
              >
                {msg.content}
              </p>
              <span className="text-xs text-muted-foreground/50 mt-1 block">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-emerald-600/20 border border-emerald-500/30">
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="bg-muted border border-border/60 rounded-2xl px-3.5 py-2.5">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribe tu pregunta..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-muted border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
              input.trim()
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground/40 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground/40 mt-2 text-center">
          Presiona <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground/60 font-mono text-[10px]">Enter</kbd> para enviar
        </p>
      </div>
    </aside>
  );
}
