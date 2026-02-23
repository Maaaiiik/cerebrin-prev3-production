/**
 * QuickActionFAB — Floating Action Buttons contextuales
 * 
 * Mejora UX: Botones de acción rápida que cambian según contexto
 * - Mañana: "Planear día", "Ver calendario"
 * - Tarde: "Nueva cotización", "Seguimiento"
 * - Noche: "Resumen del día", "Preparar mañana"
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  FileText, 
  Mail, 
  Calendar,
  TrendingUp,
  Coffee,
  Moon,
  Sun,
  X,
  Zap
} from 'lucide-react';
import { Button } from '../ui/button';

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface QuickActionFABProps {
  onAction: (actionId: string) => void;
  contextActions?: QuickAction[];
}

// Acciones por hora del día
const getTimeBasedActions = (): QuickAction[] => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    // Mañana
    return [
      { id: 'plan-day', label: 'Planear día', icon: Sun, color: 'bg-amber-500' },
      { id: 'view-calendar', label: 'Ver calendario', icon: Calendar, color: 'bg-blue-500' },
      { id: 'new-task', label: 'Nueva tarea', icon: Plus, color: 'bg-violet-500' },
    ];
  } else if (hour >= 12 && hour < 18) {
    // Tarde
    return [
      { id: 'new-quote', label: 'Nueva cotización', icon: FileText, color: 'bg-blue-500' },
      { id: 'followup', label: 'Seguimiento', icon: Mail, color: 'bg-green-500' },
      { id: 'new-task', label: 'Nueva tarea', icon: Plus, color: 'bg-violet-500' },
    ];
  } else if (hour >= 18 && hour < 22) {
    // Noche temprana
    return [
      { id: 'day-summary', label: 'Resumen del día', icon: TrendingUp, color: 'bg-orange-500' },
      { id: 'prepare-tomorrow', label: 'Preparar mañana', icon: Calendar, color: 'bg-purple-500' },
      { id: 'new-task', label: 'Nueva tarea', icon: Plus, color: 'bg-violet-500' },
    ];
  } else {
    // Noche tardía
    return [
      { id: 'day-summary', label: 'Resumen del día', icon: Moon, color: 'bg-indigo-500' },
      { id: 'new-task', label: 'Tarea para mañana', icon: Plus, color: 'bg-violet-500' },
      { id: 'prepare-tomorrow', label: 'Preparar mañana', icon: Calendar, color: 'bg-purple-500' },
    ];
  }
};

export function QuickActionFAB({ onAction, contextActions }: QuickActionFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const actions = contextActions || getTimeBasedActions();

  const handleAction = (actionId: string) => {
    onAction(actionId);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 space-y-2"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    onClick={() => handleAction(action.id)}
                    className={`
                      ${action.color} hover:opacity-90
                      text-white shadow-lg
                      gap-2 pr-4 pl-3 h-12
                      whitespace-nowrap
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{action.label}</span>
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 rounded-full shadow-xl
            ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-700'}
            text-white
            transition-colors
          `}
          aria-label={isOpen ? 'Cerrar acciones rápidas' : 'Abrir acciones rápidas'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Zap className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Pulse animation when closed */}
      {!isOpen && (
        <motion.div
          className="absolute inset-0 rounded-full bg-violet-600 -z-10"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}
