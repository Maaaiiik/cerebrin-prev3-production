"use client"

import { motion } from "framer-motion"
import {
  GoogleAuthCard,
  ChannelCard,
  AIEngineCard,
  InfrastructureStatusCard,
} from "@/components/connectors/connector-cards"
import { CerebrinAvatar } from "@/components/cerebrin-avatar"

export function ConnectorsContent() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col items-center gap-3"
      >
        <CerebrinAvatar state="idle" size={64} />
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-foreground">Conectores</h1>
          <p className="text-sm text-muted-foreground">
            Configura tu infraestructura y servicios
          </p>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        <GoogleAuthCard />
        <ChannelCard />
        <AIEngineCard />
        <InfrastructureStatusCard />
      </div>
    </div>
  )
}
