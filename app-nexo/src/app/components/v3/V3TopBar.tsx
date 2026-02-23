/**
 * V3TopBar — Top Bar del Dashboard v3.0
 * Especificación: base_cerebrin_v3.md - PANTALLA 2: DASHBOARD
 * 
 * Features:
 * - Saludo contextual según hora del día
 * - Indicador de tiempo del día (mañana/tarde/noche)
 * - Botón de Modo Focus/Director
 * - Notificaciones
 * - Botón para abrir Shadow Chat
 * - Contador de productividad
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Menu, 
  Bell, 
  MessageSquare, 
  Sun, 
  Cloud, 
  Moon,
  Flame,
  Target,
  BarChart3
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface V3TopBarProps {
  userName?: string;
  onMenuClick?: () => void;
  onChatClick?: () => void;
  onNotificationsClick?: () => void;
  notificationCount?: number;
  completedTasksToday?: number;
  dashboardMode?: 'focus' | 'director';
  onModeChange?: (mode: 'focus' | 'director') => void;
}

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function V3TopBar({ 
  userName = 'Sofía',
  onMenuClick,
  onChatClick,
  onNotificationsClick,
  notificationCount = 0,
  completedTasksToday = 0,
  dashboardMode = 'focus',
  onModeChange
}: V3TopBarProps) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [greeting, setGreeting] = useState('Buenos días');

  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      
      if (hour >= 5 && hour < 12) {
        setTimeOfDay('morning');
        setGreeting('Buenos días');
      } else if (hour >= 12 && hour < 18) {
        setTimeOfDay('afternoon');
        setGreeting('Buenas tardes');
      } else if (hour >= 18 && hour < 22) {
        setTimeOfDay('evening');
        setGreeting('Buenas tardes');
      } else {
        setTimeOfDay('night');
        setGreeting('Buenas noches');
      }
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  const { icon: TimeIcon, color: timeIconColor } = {
    morning: { icon: Sun, color: 'text-amber-400' },
    afternoon: { icon: Sun, color: 'text-orange-400' },
    evening: { icon: Cloud, color: 'text-slate-400' },
    night: { icon: Moon, color: 'text-indigo-300' }
  }[timeOfDay];

  const handleToggleMode = () => {
    if (onModeChange) {
      const newMode = dashboardMode === 'focus' ? 'director' : 'focus';
      onModeChange(newMode);
    }
  };

  const modeConfig = {
    focus: {
      icon: Target,
      label: 'Focus',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30'
    },
    director: {
      icon: BarChart3,
      label: 'Director',
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30'
    }
  }[dashboardMode];

  const ModeIcon = modeConfig.icon;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Left side - Menu + Greeting */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Menu button - Mobile only */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden shrink-0"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Greeting with time indicator */}
          <div className="flex items-center gap-2">
            <TimeIcon className={`w-4 h-4 md:w-5 md:h-5 shrink-0 ${timeIconColor}`} />
            <div className="flex flex-col md:flex-row md:items-center md:gap-2">
              <span className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap">
                {greeting}, {userName}
              </span>
              <span className="hidden md:inline text-xl">👋</span>
            </div>
          </div>
        </div>

        {/* Right side - Mode + Productivity + Notifications + Chat */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Mode toggle button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleMode}
            className={`shrink-0 gap-1.5 ${modeConfig.bg} ${modeConfig.border} hover:${modeConfig.bg}`}
            title={`Cambiar a modo ${dashboardMode === 'focus' ? 'Director' : 'Focus'}`}
          >
            <ModeIcon className={`w-3.5 h-3.5 ${modeConfig.color}`} />
            <span className={`hidden md:inline text-xs font-semibold ${modeConfig.color}`}>
              {modeConfig.label}
            </span>
          </Button>

          {/* Productivity counter - Desktop only, shows when > 0 */}
          {completedTasksToday > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-orange-300">
                {completedTasksToday} {completedTasksToday === 1 ? 'tarea completada' : 'tareas completadas'} hoy
              </span>
            </motion.div>
          )}

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationsClick}
            className="relative shrink-0"
            aria-label={`Notificaciones${notificationCount > 0 ? ` (${notificationCount})` : ''}`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Chat button - Opens Shadow Chat */}
          <Button
            variant="default"
            size="sm"
            onClick={onChatClick}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-semibold">Chat</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
