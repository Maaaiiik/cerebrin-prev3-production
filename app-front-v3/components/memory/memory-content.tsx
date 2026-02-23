"use client"

import { motion } from "framer-motion"
import { CerebrinAvatar } from "@/components/cerebrin-avatar"
import {
  MemoryCategoryCard,
  PurgeButton,
  CreateNodeButton,
  demoCategories,
} from "@/components/memory/memory-cards"

export function MemoryContent() {
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
          <h1 className="text-xl font-extrabold text-foreground">Memory Vault</h1>
          <p className="text-sm text-muted-foreground">
            Todo lo que Cerebrin sabe sobre ti
          </p>
        </div>
      </motion.div>

      {/* Category cards */}
      <div className="flex flex-col gap-4">
        {demoCategories.map((category, i) => (
          <MemoryCategoryCard key={category.id} category={category} index={i} />
        ))}

        <CreateNodeButton />
        <PurgeButton />
      </div>
    </div>
  )
}
