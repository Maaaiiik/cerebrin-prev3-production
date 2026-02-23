/**
 * EmptyState — Estados vacíos inteligentes
 * Especificación: base_cerebrin_v3.md - Estados del Dashboard
 * 
 * Muestra diferentes mensajes según el contexto
 */

import { motion } from 'motion/react';
import { 
  ListTodo, 
  Sparkles, 
  Coffee,
  Sun,
  Moon,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  type?: 'no-tasks' | 'first-time' | 'all-done' | 'weekend';
  onAction?: () => void;
}

export function EmptyState({ type = 'no-tasks', onAction }: EmptyStateProps) {
  
  const configs = {
    'no-tasks': {
      icon: ListTodo,
      iconColor: 'text-violet-400',
      title: 'Aún no tienes tareas para hoy 🌅',
      description: 'Tu agente puede ayudarte a organizarlas. ¿Empezamos?',
      actionLabel: 'Dile a tu agente qué necesitas',
      animation: 'bounce'
    },
    'first-time': {
      icon: Sparkles,
      iconColor: 'text-amber-400',
      title: '¡Bienvenida a tu nuevo espacio de trabajo! ✨',
      description: 'Cuéntale a tu agente qué necesitas hacer hoy y ella te ayudará a organizarte.',
      actionLabel: 'Empezar a trabajar con mi agente',
      animation: 'pulse'
    },
    'all-done': {
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      title: '¡Todo listo por hoy! 🎉',
      description: 'Has completado todas tus tareas. ¿Quieres preparar algo para mañana?',
      actionLabel: 'Preparar tareas para mañana',
      animation: 'bounce'
    },
    'weekend': {
      icon: Coffee,
      iconColor: 'text-orange-400',
      title: '¡Feliz fin de semana! ☕',
      description: 'Tómate un descanso. Tu agente estará aquí cuando vuelvas.',
      actionLabel: 'Ver resumen de la semana',
      animation: 'pulse'
    }
  }[type];

  const Icon = configs.icon;
  const hour = new Date().getHours();
  let timeIcon = Sun;
  let timeIconColor = 'text-amber-400';
  
  if (hour >= 18) {
    timeIcon = Moon;
    timeIconColor = 'text-indigo-400';
  } else if (hour >= 12) {
    timeIcon = Calendar;
    timeIconColor = 'text-blue-400';
  }

  const TimeIcon = timeIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center py-12 md:py-16 px-6"
    >
      {/* Icon */}
      <motion.div
        animate={
          configs.animation === 'bounce'
            ? { y: [0, -10, 0] }
            : { scale: [1, 1.05, 1] }
        }
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className={`
          w-20 h-20 md:w-24 md:h-24 rounded-full
          bg-gradient-to-br from-violet-500/20 to-transparent
          border border-violet-500/30
          flex items-center justify-center
          mb-6
        `}
      >
        <Icon className={`w-10 h-10 md:w-12 md:h-12 ${configs.iconColor}`} />
      </motion.div>

      {/* Title */}
      <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
        {configs.title}
      </h3>

      {/* Description */}
      <p className="text-sm md:text-base text-muted-foreground max-w-md mb-6">
        {configs.description}
      </p>

      {/* Time-based suggestion */}
      <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-muted/50 border border-border">
        <TimeIcon className={`w-4 h-4 ${timeIconColor}`} />
        <span className="text-xs text-muted-foreground">
          {hour >= 5 && hour < 12 && 'Buen momento para planear el día'}
          {hour >= 12 && hour < 18 && 'Tiempo de ser productiva'}
          {hour >= 18 && hour < 22 && 'Hora de revisar lo que lograste'}
          {(hour >= 22 || hour < 5) && 'Tal vez es hora de descansar 😴'}
        </span>
      </div>

      {/* Action button */}
      {onAction && (
        <Button
          onClick={onAction}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {configs.actionLabel}
        </Button>
      )}

      {/* Quick tips */}
      <div className="mt-8 text-left max-w-md">
        <p className="text-xs text-muted-foreground mb-2 font-semibold">
          💡 Tip: Puedes pedirle a tu agente:
        </p>
        <ul className="text-xs text-muted-foreground space-y-1.5">
          <li>• "Hazme una cotización para [cliente]"</li>
          <li>• "Recuérdame seguir con [cliente] en 3 días"</li>
          <li>• "Crea un resumen de mi semana"</li>
          <li>• "¿Qué tareas me faltan para cerrar [proyecto]?"</li>
        </ul>
      </div>
    </motion.div>
  );
}
