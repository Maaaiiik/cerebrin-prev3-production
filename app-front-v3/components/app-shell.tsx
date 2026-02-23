"use client"

import { BottomNav } from "@/components/bottom-nav"

interface AppShellProps {
  children: React.ReactNode
  /** Set to true for pages that manage their own bottom spacing (e.g. chat) */
  noPadding?: boolean
}

export function AppShell({ children, noPadding = false }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top bar */}
      <header className="z-40 flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg viewBox="0 0 200 200" className="h-5 w-5" aria-hidden="true">
              <path
                d="M100 30 C55 30, 25 65, 25 100 C25 140, 55 170, 100 170 C145 170, 175 140, 175 100 C175 65, 145 30, 100 30Z"
                fill="white"
              />
              <path
                d="M60 70 C75 60, 85 75, 75 85"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M140 70 C125 60, 115 75, 125 85"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <ellipse cx="84" cy="92" rx="6" ry="7" fill="#8B5CF6" />
              <ellipse cx="116" cy="92" rx="6" ry="7" fill="#8B5CF6" />
              <circle cx="87" cy="89" r="2" fill="white" />
              <circle cx="119" cy="89" r="2" fill="white" />
              <path
                d="M90 115 C95 121, 105 121, 110 115"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-foreground">Cerebrin</span>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
          C
        </div>
      </header>

      {/* Main content area - fills remaining space between header & nav */}
      <main className={`relative min-h-0 flex-1 ${noPadding ? "flex flex-col overflow-hidden" : "overflow-y-auto pb-0"}`}>
        {children}
      </main>

      {/* Bottom nav - always visible at bottom */}
      <BottomNav />
    </div>
  )
}
