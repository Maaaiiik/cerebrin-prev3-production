/**
 * CerebrinLogo — Logo oficial de Cerebrin
 * Cerebro cute y amigable estilo Duolingo
 */

import React from 'react';
import { motion } from 'motion/react';

interface CerebrinLogoProps {
  size?: number;
  animated?: boolean;
  showText?: boolean;
  className?: string;
}

export function CerebrinLogo({ 
  size = 96, 
  animated = true,
  showText = false,
  className = '' 
}: CerebrinLogoProps) {
  const MotionWrapper = animated ? motion.div : 'div';
  const animationProps = animated ? {
    animate: { scale: [1, 1.05, 1] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  } : {};

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      <MotionWrapper
        {...animationProps}
        style={{ width: size, height: size }}
        className="relative"
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Gradiente para el fondo */}
          <defs>
            <linearGradient id="cerebrin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            
            <linearGradient id="cerebrin-brain-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>

          {/* Círculo de fondo */}
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="url(#cerebrin-gradient)"
            className="drop-shadow-lg"
          />

          {/* Cerebro simplificado y cute */}
          <g transform="translate(50, 50)">
            {/* Hemisferio izquierdo */}
            <path
              d="M -18 -10 Q -22 -15, -18 -20 Q -14 -24, -8 -22 Q -4 -25, 0 -24 L 0 20 Q -4 21, -8 20 Q -14 22, -18 18 Q -22 14, -20 8 Q -22 2, -18 -4 Z"
              fill="url(#cerebrin-brain-gradient)"
              stroke="#f5f3ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Hemisferio derecho */}
            <path
              d="M 18 -10 Q 22 -15, 18 -20 Q 14 -24, 8 -22 Q 4 -25, 0 -24 L 0 20 Q 4 21, 8 20 Q 14 22, 18 18 Q 22 14, 20 8 Q 22 2, 18 -4 Z"
              fill="url(#cerebrin-brain-gradient)"
              stroke="#f5f3ff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Detalles del cerebro - pliegues cute */}
            <path
              d="M -12 -12 Q -10 -8, -12 -4"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M -14 2 Q -12 6, -14 10"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M 12 -12 Q 10 -8, 12 -4"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M 14 2 Q 12 6, 14 10"
              stroke="#8b5cf6"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />

            {/* Cara cute */}
            {/* Ojos */}
            <circle cx="-8" cy="-2" r="2.5" fill="#6d28d9" />
            <circle cx="8" cy="-2" r="2.5" fill="#6d28d9" />
            
            {/* Brillo en los ojos */}
            <circle cx="-7" cy="-3" r="1" fill="#f5f3ff" />
            <circle cx="9" cy="-3" r="1" fill="#f5f3ff" />

            {/* Sonrisa */}
            <path
              d="M -6 4 Q 0 8, 6 4"
              stroke="#6d28d9"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Mejillas sonrojadas (opcional) */}
            <circle cx="-16" cy="2" r="2.5" fill="#f472b6" opacity="0.3" />
            <circle cx="16" cy="2" r="2.5" fill="#f472b6" opacity="0.3" />
          </g>

          {/* Destellos/Sparkles alrededor */}
          <g opacity="0.6">
            <circle cx="15" cy="20" r="1.5" fill="#fbbf24">
              {animated && (
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <circle cx="85" cy="30" r="1.5" fill="#fbbf24">
              {animated && (
                <animate
                  attributeName="opacity"
                  values="1;0.3;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <circle cx="80" cy="75" r="1.5" fill="#fbbf24">
              {animated && (
                <animate
                  attributeName="opacity"
                  values="0.5;1;0.5"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        </svg>
      </MotionWrapper>

      {showText && (
        <div className="text-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Cerebrin
          </h1>
          <p className="text-xs text-muted-foreground">Strategy Operating System</p>
        </div>
      )}
    </div>
  );
}
