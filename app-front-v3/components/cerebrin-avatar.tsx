"use client"

import { motion, AnimatePresence } from "framer-motion"

export type CerebrinState = "idle" | "thinking" | "happy" | "error" | "talking"

interface CerebrinAvatarProps {
  state?: CerebrinState
  size?: number
  className?: string
}

export function CerebrinAvatar({ state = "idle", size = 120, className = "" }: CerebrinAvatarProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        animate={getBodyAnimation(state)}
        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      >
        {/* Brain body */}
        <motion.g>
          {/* Main brain shape - rounded, cute */}
          <motion.path
            d="M100 30 C55 30, 25 65, 25 100 C25 140, 55 170, 100 170 C145 170, 175 140, 175 100 C175 65, 145 30, 100 30Z"
            fill="var(--cerebrin-violet)"
            stroke="none"
            animate={getBrainPulse(state)}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
          {/* Brain folds - left side */}
          <motion.path
            d="M60 70 C75 60, 85 75, 75 85 C65 95, 50 90, 55 78"
            fill="none"
            stroke="var(--cerebrin-pink)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          <motion.path
            d="M50 100 C65 92, 80 105, 68 115 C56 125, 42 118, 48 106"
            fill="none"
            stroke="var(--cerebrin-pink)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          <motion.path
            d="M65 130 C78 122, 88 135, 78 142 C68 149, 55 144, 60 134"
            fill="none"
            stroke="var(--cerebrin-pink)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Brain folds - right side */}
          <motion.path
            d="M140 70 C125 60, 115 75, 125 85 C135 95, 150 90, 145 78"
            fill="none"
            stroke="var(--cerebrin-pink)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          <motion.path
            d="M150 100 C135 92, 120 105, 132 115 C144 125, 158 118, 152 106"
            fill="none"
            stroke="var(--cerebrin-pink)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          <motion.path
            d="M135 130 C122 122, 112 135, 122 142 C132 149, 145 144, 140 134"
            fill="none"
            stroke="var(--cerebrin-pink)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Center fold line */}
          <motion.path
            d="M100 45 C100 45, 98 80, 100 100 C102 120, 100 155, 100 155"
            fill="none"
            stroke="var(--cerebrin-pink)"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.4"
          />
        </motion.g>

        {/* Face */}
        <g>
          {/* Eyes */}
          <AnimatePresence mode="wait">
            {state === "happy" ? (
              <motion.g key="happy-eyes">
                {/* Happy squinted eyes */}
                <motion.path
                  d="M72 95 C78 88, 90 88, 96 95"
                  fill="none"
                  stroke="#1A1A2E"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
                <motion.path
                  d="M104 95 C110 88, 122 88, 128 95"
                  fill="none"
                  stroke="#1A1A2E"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </motion.g>
            ) : state === "error" ? (
              <motion.g key="error-eyes">
                {/* X eyes for error */}
                <motion.g>
                  <line x1="78" y1="85" x2="90" y2="97" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="90" y1="85" x2="78" y2="97" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
                </motion.g>
                <motion.g>
                  <line x1="110" y1="85" x2="122" y2="97" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="122" y1="85" x2="110" y2="97" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
                </motion.g>
              </motion.g>
            ) : (
              <motion.g key="normal-eyes">
                {/* Normal round eyes */}
                <motion.ellipse
                  cx="84"
                  cy="92"
                  rx="8"
                  ry={state === "thinking" ? 8 : 9}
                  fill="#1A1A2E"
                  animate={getEyeAnimation(state)}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.ellipse
                  cx="116"
                  cy="92"
                  rx="8"
                  ry={state === "thinking" ? 8 : 9}
                  fill="#1A1A2E"
                  animate={getEyeAnimation(state)}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                />
                {/* Eye shine */}
                <circle cx="88" cy="88" r="3" fill="white" />
                <circle cx="120" cy="88" r="3" fill="white" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Cheeks (blush) */}
          <motion.ellipse
            cx="65"
            cy="108"
            rx="10"
            ry="6"
            fill="var(--cerebrin-pink)"
            opacity={state === "happy" ? 0.5 : 0.25}
            animate={state === "happy" ? { opacity: [0.3, 0.5, 0.3] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.ellipse
            cx="135"
            cy="108"
            rx="10"
            ry="6"
            fill="var(--cerebrin-pink)"
            opacity={state === "happy" ? 0.5 : 0.25}
            animate={state === "happy" ? { opacity: [0.3, 0.5, 0.3] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          {/* Mouth */}
          <AnimatePresence mode="wait">
            {state === "happy" ? (
              <motion.path
                key="happy-mouth"
                d="M85 118 C90 130, 110 130, 115 118"
                fill="none"
                stroke="#1A1A2E"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                exit={{ opacity: 0 }}
              />
            ) : state === "thinking" ? (
              <motion.ellipse
                key="thinking-mouth"
                cx="100"
                cy="122"
                rx="5"
                ry="6"
                fill="#1A1A2E"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rx: [5, 6, 5], ry: [6, 7, 6] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : state === "talking" ? (
              <motion.ellipse
                key="talking-mouth"
                cx="100"
                cy="120"
                rx="8"
                ry="5"
                fill="#1A1A2E"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, ry: [5, 8, 3, 7, 5] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
            ) : state === "error" ? (
              <motion.path
                key="error-mouth"
                d="M85 128 C90 120, 110 120, 115 128"
                fill="none"
                stroke="#EF4444"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            ) : (
              <motion.path
                key="idle-mouth"
                d="M90 118 C95 124, 105 124, 110 118"
                fill="none"
                stroke="#1A1A2E"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>
        </g>

        {/* Thinking sparkles */}
        {state === "thinking" && (
          <motion.g>
            <motion.circle
              cx="160"
              cy="45"
              r="4"
              fill="var(--cerebrin-violet)"
              animate={{ opacity: [0, 1, 0], y: [0, -5, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.circle
              cx="170"
              cy="60"
              r="3"
              fill="var(--cerebrin-blue)"
              animate={{ opacity: [0, 1, 0], y: [0, -5, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            />
            <motion.circle
              cx="155"
              cy="35"
              r="2.5"
              fill="var(--cerebrin-pink)"
              animate={{ opacity: [0, 1, 0], y: [0, -5, 0], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
            />
          </motion.g>
        )}

        {/* Happy sparkles / stars */}
        {state === "happy" && (
          <motion.g>
            <motion.text
              x="155"
              y="50"
              fontSize="16"
              animate={{ opacity: [0, 1, 0], rotate: [0, 20, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {'✦'}
            </motion.text>
            <motion.text
              x="35"
              y="55"
              fontSize="12"
              animate={{ opacity: [0, 1, 0], rotate: [0, -20, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              {'✦'}
            </motion.text>
          </motion.g>
        )}
      </motion.svg>
    </div>
  )
}

function getBodyAnimation(state: CerebrinState) {
  switch (state) {
    case "thinking":
      return { rotate: [-2, 2, -2], y: [0, -3, 0] }
    case "happy":
      return { y: [0, -8, 0], scale: [1, 1.05, 1] }
    case "error":
      return { x: [-3, 3, -3, 3, 0], rotate: [0, -2, 2, -2, 0] }
    case "talking":
      return { y: [0, -2, 0] }
    default:
      return { y: [0, -4, 0] }
  }
}

function getBrainPulse(state: CerebrinState) {
  switch (state) {
    case "thinking":
      return { scale: [1, 1.02, 1] }
    case "happy":
      return { scale: [1, 1.03, 1] }
    default:
      return { scale: [1, 1.01, 1] }
  }
}

function getEyeAnimation(state: CerebrinState) {
  switch (state) {
    case "thinking":
      return { cy: [92, 90, 92] }
    case "talking":
      return { ry: [9, 8, 9] }
    default:
      return { ry: [9, 1, 9] }
  }
}
