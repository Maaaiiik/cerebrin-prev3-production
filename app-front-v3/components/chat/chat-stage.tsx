"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CerebrinAvatar, type CerebrinState } from "@/components/cerebrin-avatar"
import { MessageBubble, type Message } from "@/components/chat/message-bubble"
import { ActionCard, type ActionCardData } from "@/components/chat/action-card"
import { UnifiedInput } from "@/components/chat/unified-input"
import { ScrollArea } from "@/components/ui/scroll-area"

// Demo data for showcase
const demoMessages: Message[] = [
  {
    id: "1",
    role: "ai",
    content: "Hola! Soy Cerebrin, tu asistente inteligente. Puedo ayudarte a gestionar gastos, generar informes y mucho mas. Que necesitas?",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    role: "human",
    content: "Registra un gasto de $45.50 en almuerzo de negocios",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "3",
    role: "ai",
    content: "Listo! He registrado el gasto de $45.50 en la categoria 'Alimentacion - Negocios'. Aqui tienes el detalle:",
    timestamp: new Date(Date.now() - 180000),
  },
]

const demoActionCard: ActionCardData = {
  id: "ac1",
  title: "Gasto Registrado",
  description: "$45.50 - Almuerzo de Negocios",
  icon: "expense",
  link: "#",
  linkLabel: "Ver en Google Sheets",
  actions: [
    { label: "Deshacer", variant: "destructive", action: "undo-expense" },
    { label: "Ver Detalles", variant: "outline", action: "view-details" },
  ],
}

type ChatItem =
  | { type: "message"; data: Message }
  | { type: "action-card"; data: ActionCardData }

export function ChatStage() {
  const [items, setItems] = useState<ChatItem[]>([
    ...demoMessages.map((m) => ({ type: "message" as const, data: m })),
    { type: "action-card", data: demoActionCard },
  ])
  const [cerebrinState, setCerebrinState] = useState<CerebrinState>("idle")
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight
      }
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [items, scrollToBottom])

  const handleSendText = useCallback((text: string) => {
    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "human",
      content: text,
      timestamp: new Date(),
    }
    setItems((prev) => [...prev, { type: "message", data: userMsg }])
    setCerebrinState("thinking")

    // Simulate AI response
    setTimeout(() => {
      setCerebrinState("talking")
      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "ai",
        content: getSmartResponse(text),
        timestamp: new Date(),
      }
      setItems((prev) => [...prev, { type: "message", data: aiMsg }])

      // Sometimes add an action card
      if (text.toLowerCase().includes("gasto") || text.toLowerCase().includes("registra")) {
        setTimeout(() => {
          const card: ActionCardData = {
            id: `ac-${Date.now()}`,
            title: "Accion Completada",
            description: "Registro procesado exitosamente",
            icon: "sheet",
            link: "#",
            linkLabel: "Ver en Sheets",
            actions: [
              { label: "Deshacer", variant: "destructive", action: "undo" },
            ],
          }
          setItems((prev) => [...prev, { type: "action-card", data: card }])
          setCerebrinState("happy")
          setTimeout(() => setCerebrinState("idle"), 3000)
        }, 800)
      } else {
        setTimeout(() => {
          setCerebrinState("happy")
          setTimeout(() => setCerebrinState("idle"), 2000)
        }, 500)
      }
    }, 1500)
  }, [])

  const handleSendAudio = useCallback(() => {
    setCerebrinState("thinking")
    const aiMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "ai",
      content: "He recibido tu mensaje de voz. Procesando el audio... En produccion esto se enviaria al backend para transcripcion.",
      timestamp: new Date(),
    }
    setTimeout(() => {
      setItems((prev) => [...prev, { type: "message", data: aiMsg }])
      setCerebrinState("happy")
      setTimeout(() => setCerebrinState("idle"), 2000)
    }, 2000)
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Chat messages area */}
      <ScrollArea className="min-h-0 flex-1" ref={scrollRef}>
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
          {/* Cerebrin welcome */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2 py-4"
          >
            <CerebrinAvatar state={cerebrinState} size={100} />
            <AnimatePresence mode="wait">
              <motion.p
                key={cerebrinState}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-xs font-semibold text-muted-foreground"
              >
                {getStateLabel(cerebrinState)}
              </motion.p>
            </AnimatePresence>
          </motion.div>

          {/* Messages & cards */}
          {items.map((item, i) =>
            item.type === "message" ? (
              <MessageBubble key={item.data.id} message={item.data} index={i} />
            ) : (
              <div key={item.data.id} className="flex justify-start">
                <ActionCard card={item.data} index={i} />
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <UnifiedInput
        onSendText={handleSendText}
        onSendAudio={handleSendAudio}
      />
    </div>
  )
}

function getStateLabel(state: CerebrinState): string {
  switch (state) {
    case "thinking":
      return "Pensando..."
    case "happy":
      return "Listo!"
    case "error":
      return "Ups, algo salio mal"
    case "talking":
      return "Respondiendo..."
    default:
      return "Listo para ayudarte"
  }
}

function getSmartResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes("hola") || lower.includes("hey")) {
    return "Hola! Que puedo hacer por ti hoy? Puedo registrar gastos, generar informes o consultar tu memoria de datos."
  }
  if (lower.includes("gasto") || lower.includes("registra")) {
    return "He procesado tu solicitud de gasto. El registro ha sido guardado en tu hoja de Google Sheets. Puedes ver los detalles abajo."
  }
  if (lower.includes("informe") || lower.includes("reporte")) {
    return "Voy a generar ese informe para ti. Dame un momento mientras recopilo los datos de tus hojas de calculo..."
  }
  if (lower.includes("memoria") || lower.includes("dato")) {
    return "Puedes revisar toda tu memoria de datos en la seccion Memory Vault. Ahi encontraras tus categorias de Gastos, Salud y Clientes."
  }
  return "Entendido! He procesado tu solicitud. Si necesitas algo mas, estoy aqui para ayudarte. Puedes usar voz o texto."
}
