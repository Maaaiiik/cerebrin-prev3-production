/**
 * ShadowChatMobile — Bottom sheet variant of Shadow Chat for mobile
 * 
 * Floating action button + bottom drawer implementation
 */

import * as React from "react";
import { Bot, Send, X } from "lucide-react";
import { cn } from "../ui/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

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
    content: "Hola 👋 Soy tu asistente personal. ¿En qué puedo ayudarte?",
    timestamp: "10:30 AM",
  },
];

export function ShadowChatMobile() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open]);

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

    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: "Entendido. En modo demo mis respuestas son limitadas, pero en producción te daría ayuda contextual basada en tus tareas.",
        timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 flex items-center justify-center transition-all duration-200 active:scale-95"
        title="Abrir asistente IA"
      >
        <Bot className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-400 border-2 border-background animate-pulse" />
      </button>

      {/* Bottom Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Bot className="w-5 h-5 text-emerald-400" />
              Tu Asistente IA
            </SheetTitle>
          </SheetHeader>

          {/* Quick Suggestions */}
          <div className="px-4 py-3 border-b border-border/50 space-y-2 shrink-0">
            <div className="flex flex-wrap gap-2">
              {["¿Qué es prioritario?", "Crear tarea"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs text-foreground border border-border/60 transition-colors"
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
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold",
                    msg.role === "agent"
                      ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-400"
                      : "bg-violet-600/20 border border-violet-500/30 text-violet-400"
                  )}
                >
                  {msg.role === "agent" ? <Bot className="w-4 h-4" /> : "Tú"}
                </div>

                <div
                  className={cn(
                    "flex-1 rounded-2xl px-4 py-3 max-w-[85%]",
                    msg.role === "agent"
                      ? "bg-muted border border-border/60"
                      : "bg-violet-600/15 border border-violet-500/30"
                  )}
                >
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
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
                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-emerald-600/20 border border-emerald-500/30">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-muted border border-border/60 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
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
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribe tu pregunta..."
                className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  input.trim()
                    ? "bg-emerald-600 text-white active:scale-95"
                    : "bg-muted text-muted-foreground/40"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
