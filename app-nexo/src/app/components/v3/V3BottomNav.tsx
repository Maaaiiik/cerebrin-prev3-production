/**
 * V3BottomNav — Bottom Navigation para Mobile
 * Especificación: base_cerebrin_v3.md - Layout General
 * 
 * 5 items principales:
 * - Inicio (Dashboard)
 * - Tareas
 * - Chat (prominente)
 * - Documentos
 * - Configuración
 */

import { motion } from 'motion/react';
import { 
  Home, 
  CheckSquare, 
  MessageSquare, 
  FileText, 
  Settings 
} from 'lucide-react';

interface V3BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  unreadCount?: number;
  pendingTasksCount?: number;
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: Home, label: 'Inicio' },
  { id: 'tasks', icon: CheckSquare, label: 'Tareas' },
  { id: 'chat', icon: MessageSquare, label: 'Chat', prominent: true },
  { id: 'documents', icon: FileText, label: 'Docs' },
  { id: 'settings', icon: Settings, label: 'Config' }
];

export function V3BottomNav({ 
  currentView, 
  onNavigate,
  unreadCount = 0,
  pendingTasksCount = 0
}: V3BottomNavProps) {
  
  return (
    <nav className="
      md:hidden fixed bottom-0 left-0 right-0 z-50
      bg-card/95 backdrop-blur-lg border-t border-border
      pb-safe
    ">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          // Badge count
          let badgeCount = 0;
          if (item.id === 'chat' && unreadCount > 0) badgeCount = unreadCount;
          if (item.id === 'tasks' && pendingTasksCount > 0) badgeCount = pendingTasksCount;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-lg transition-all"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Background highlight for active item */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavHighlight"
                  className="absolute inset-0 bg-violet-500/10 rounded-lg"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon container - Prominent for Chat */}
              <div className={`
                relative flex items-center justify-center
                ${item.prominent ? 'w-12 h-12 -mt-4 rounded-full bg-violet-600 shadow-lg shadow-violet-600/30' : 'w-6 h-6'}
              `}>
                <Icon 
                  className={`
                    ${item.prominent ? 'w-6 h-6 text-white' : 'w-5 h-5'}
                    ${isActive && !item.prominent ? 'text-violet-400' : !item.prominent ? 'text-muted-foreground' : ''}
                    transition-colors relative z-10
                  `}
                />
                
                {/* Badge */}
                {badgeCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="
                      absolute -top-1 -right-1 
                      min-w-[18px] h-[18px] px-1
                      flex items-center justify-center
                      rounded-full bg-red-500 
                      text-[10px] font-bold text-white
                      border-2 border-card
                    "
                  >
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </motion.span>
                )}
              </div>

              {/* Label */}
              <span className={`
                text-[10px] font-medium mt-1 relative z-10
                ${isActive ? 'text-violet-400' : 'text-muted-foreground'}
                transition-colors
              `}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
