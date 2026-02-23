/**
 * DesktopSidebar — Navegación lateral para desktop
 * Especificación: base_cerebrin_v3.md - Desktop Layout (Modo Focus)
 * 
 * Sidebar de 240px con navegación principal
 * Items: 🏠 Inicio, 📋 Tareas, 📄 Docs, 📊 Proyectos, ⚙️ Config
 * Colapsable
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  CheckSquare, 
  FileText, 
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bot
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CerebrinLogo } from '../shared/CerebrinLogo';

interface DesktopSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  agentName?: string;
  unreadCount?: number;
  pendingTasksCount?: number;
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: Home, label: 'Inicio' },
  { id: 'tasks', icon: CheckSquare, label: 'Tareas' },
  { id: 'documents', icon: FileText, label: 'Docs' },
  { id: 'projects', icon: BarChart3, label: 'Proyectos' },
  { id: 'settings', icon: Settings, label: 'Config' }
];

export function DesktopSidebar({
  currentView,
  onNavigate,
  agentName = 'Sofia AI',
  unreadCount = 0,
  pendingTasksCount = 0
}: DesktopSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: isCollapsed ? '64px' : '240px' }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex md:flex-col h-screen border-r border-border bg-card sticky top-0 z-40"
    >
      {/* Header con logo */}
      <div className="shrink-0 p-4 border-b border-border flex items-center justify-between gap-2">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <CerebrinLogo size="sm" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Cerebrin</h2>
              <p className="text-[10px] text-muted-foreground">v3.0</p>
            </div>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 flex items-center justify-center">
            <CerebrinLogo size="xs" />
          </div>
        )}
      </div>

      {/* Agent status mini */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="shrink-0 p-3 border-b border-border"
        >
          <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <div className="shrink-0 w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {agentName}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-emerald-400">🟢 Activa</span>
              </div>
            </div>
            <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
          </div>
        </motion.div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = currentView === item.id;
            const Icon = item.icon;
            
            // Badge count
            let badgeCount = 0;
            if (item.id === 'tasks' && pendingTasksCount > 0) badgeCount = pendingTasksCount;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all
                  ${isActive 
                    ? 'bg-violet-600 text-white' 
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {isActive && !isCollapsed && (
                  <motion.div
                    layoutId="sidebarActiveIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : ''}`} />
                
                {!isCollapsed && (
                  <>
                    <span className="text-sm font-medium flex-1 text-left">
                      {item.label}
                    </span>
                    {badgeCount > 0 && (
                      <Badge 
                        variant={isActive ? 'secondary' : 'outline'}
                        className="h-5 min-w-[20px] px-1.5 text-[10px]"
                      >
                        {badgeCount}
                      </Badge>
                    )}
                  </>
                )}

                {isCollapsed && badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {badgeCount > 9 ? '9+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer - Collapse toggle */}
      <div className="shrink-0 p-3 border-t border-border">
        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'sm'}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full ${isCollapsed ? '' : 'gap-2'}`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Colapsar</span>
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
