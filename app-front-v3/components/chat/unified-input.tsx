"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, Send, Square } from "lucide-react"

interface UnifiedInputProps {
  onSendText: (text: string) => void
  onSendAudio?: (blob: Blob) => void
  disabled?: boolean
}

export function UnifiedInput({ onSendText, onSendAudio, disabled }: UnifiedInputProps) {
  const [text, setText] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const handleSend = useCallback(() => {
    if (text.trim() && !disabled) {
      onSendText(text.trim())
      setText("")
    }
  }, [text, disabled, onSendText])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      handleSend()
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        onSendAudio?.(blob)
        stream.getTracks().forEach((track) => track.stop())
        setRecordingTime(0)
      }

      mediaRecorder.start()
      setIsRecording(true)

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch {
      console.error("Microphone access denied")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRecording(false)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="shrink-0 border-t border-border bg-card/80 px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-end gap-3">
        {/* Mic button */}
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.button
              key="stop"
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 1, repeat: Infinity }}
              onClick={stopRecording}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg"
              aria-label="Detener grabacion"
            >
              <Square className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          ) : (
            <motion.button
              key="mic"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={startRecording}
              disabled={disabled}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              aria-label="Grabar audio"
            >
              <Mic className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Text input or recording indicator */}
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-1 items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3"
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="h-3 w-3 rounded-full bg-destructive"
              />
              <span className="text-sm font-semibold text-destructive">
                Grabando... {formatTime(recordingTime)}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-1 items-end gap-2 rounded-2xl border border-border bg-background px-4 py-2"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                disabled={disabled}
                rows={1}
                className="max-h-24 flex-1 resize-none bg-transparent py-1.5 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
                aria-label="Mensaje de texto"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                disabled={!text.trim() || disabled}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
                aria-label="Enviar mensaje"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!isRecording && (
        <p className="mx-auto mt-1.5 max-w-2xl text-center text-[10px] text-muted-foreground">
          Cmd+Enter para enviar
        </p>
      )}
    </div>
  )
}
