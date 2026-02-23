/**
 * OnboardingConfetti — Celebración al completar onboarding
 * Animación de confetti con mensaje de éxito
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export function OnboardingConfetti() {
  const [particles, setParticles] = useState<{ id: number; x: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    // Generar partículas de confetti
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // % de la pantalla
      color: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'][Math.floor(Math.random() * 4)],
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ y: -20, opacity: 1, scale: 1 }}
          animate={{
            y: window.innerHeight + 20,
            opacity: [1, 1, 0],
            scale: [1, 0.8, 0.5],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            delay: particle.delay,
            ease: 'linear',
          }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
          }}
        />
      ))}

      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
      >
        <div className="bg-background/80 backdrop-blur-sm border border-violet-500/30 rounded-2xl px-8 py-6 shadow-2xl">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
            className="inline-block"
          >
            <Sparkles className="w-12 h-12 text-violet-500 mx-auto mb-3" />
          </motion.div>
          <h3 className="text-2xl font-bold mb-2">¡Tu asistente está activo!</h3>
          <p className="text-sm text-muted-foreground">Él ya te está observando. 👁️</p>
        </div>
      </motion.div>
    </div>
  );
}
