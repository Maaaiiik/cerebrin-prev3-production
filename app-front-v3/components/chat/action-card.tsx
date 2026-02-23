"use client"

import { motion } from "framer-motion"
import { ExternalLink, Undo2, CheckCircle, Eye, FileSpreadsheet, DollarSign, ClipboardCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface ActionCardData {
  id: string
  title: string
  description?: string
  icon: "sheet" | "expense" | "report" | "generic"
  link?: string
  linkLabel?: string
  actions?: Array<{
    label: string
    variant: "default" | "outline" | "destructive"
    action: string
  }>
}

const iconMap = {
  sheet: FileSpreadsheet,
  expense: DollarSign,
  report: ClipboardCheck,
  generic: Eye,
}

interface ActionCardProps {
  card: ActionCardData
  index: number
  onAction?: (action: string) => void
}

export function ActionCard({ card, index, onAction }: ActionCardProps) {
  const Icon = iconMap[card.icon] || Eye

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="w-full max-w-sm"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-secondary/50 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-card-foreground">{card.title}</h4>
            {card.description && (
              <p className="text-xs text-muted-foreground">{card.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
          {card.link && (
            <Button
              size="sm"
              className="gap-1.5 rounded-xl bg-cerebrin-green text-card font-semibold hover:bg-cerebrin-green/90"
              asChild
            >
              <a href={card.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                {card.linkLabel || "Ver en Sheets"}
              </a>
            </Button>
          )}
          {card.actions?.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              className="gap-1.5 rounded-xl font-semibold"
              onClick={() => onAction?.(action.action)}
            >
              {action.variant === "destructive" ? (
                <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
