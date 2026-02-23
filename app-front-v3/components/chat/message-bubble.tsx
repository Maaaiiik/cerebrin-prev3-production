"use client"

import { motion } from "framer-motion"

export interface Message {
  id: string
  role: "ai" | "human"
  content: string
  timestamp: Date
}

interface MessageBubbleProps {
  message: Message
  index: number
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const isAI = message.role === "ai"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isAI
            ? "rounded-tl-md bg-primary text-primary-foreground"
            : "rounded-tr-md bg-accent text-accent-foreground"
        }`}
      >
        <p className="text-sm font-medium leading-relaxed">{message.content}</p>
        <p
          className={`mt-1 text-[10px] ${
            isAI ? "text-primary-foreground/60" : "text-accent-foreground/60"
          }`}
        >
          {message.timestamp.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  )
}
