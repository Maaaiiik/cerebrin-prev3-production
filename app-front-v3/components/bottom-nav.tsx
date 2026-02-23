"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { MessageCircle, Plug, Brain } from "lucide-react"

const navItems = [
  { href: "/", label: "Cockpit", icon: MessageCircle },
  { href: "/connectors", label: "Conectores", icon: Plug },
  { href: "/memory", label: "Memoria", icon: Brain },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="border-t border-border bg-card/80 backdrop-blur-xl" role="navigation" aria-label="Navegacion principal">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 px-4 py-2"
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-secondary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
              </span>
              <span
                className={`relative z-10 text-xs font-semibold transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
