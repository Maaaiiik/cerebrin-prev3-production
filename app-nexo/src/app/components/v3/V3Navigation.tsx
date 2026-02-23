import { Home, Zap, Settings, User, Sparkles, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface V3NavigationProps {
  currentView: 'dashboard' | 'cockpit' | 'settings' | 'quick-actions' | 'activity';
  onNavigate: (view: 'dashboard' | 'cockpit' | 'settings' | 'quick-actions' | 'activity') => void;
}

export function V3Navigation({ currentView, onNavigate }: V3NavigationProps) {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Inicio',
      icon: Home,
      color: '#3B82F6'
    },
    {
      id: 'quick-actions' as const,
      label: 'Acciones',
      icon: Sparkles,
      color: '#EC4899'
    },
    {
      id: 'activity' as const,
      label: 'Actividad',
      icon: Activity,
      color: '#06B6D4'
    },
    {
      id: 'cockpit' as const,
      label: 'Cockpit',
      icon: Zap,
      color: '#8B5CF6'
    },
    {
      id: 'settings' as const,
      label: 'Config',
      icon: Settings,
      color: '#10B981'
    }
  ];

  return (
    <>
      {/* Desktop Navigation - Top */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Cerebrin</h1>
                <p className="text-xs text-muted-foreground">v3.0</p>
              </div>
            </div>

            {/* Nav Items */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`relative px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isActive
                        ? 'text-violet-300'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    
                    {isActive && (
                      <motion.div
                        layoutId="desktop-active-nav"
                        className="absolute inset-0 bg-violet-600/20 rounded-xl border border-violet-500/30"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                );
              })}

              {/* Avatar */}
              <div className="ml-4 w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all"
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-nav"
                    className="absolute inset-0 bg-violet-600/15 rounded-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 transition-colors ${
                      isActive ? 'text-violet-400' : 'text-muted-foreground'
                    }`}
                    style={isActive ? { color: item.color } : {}}
                  />
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-2 h-2 bg-violet-500 rounded-full"
                    />
                  )}
                </div>
                
                <span
                  className={`text-xs font-semibold transition-colors ${
                    isActive ? 'text-violet-400' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Safe area for iPhone notch */}
        <div className="h-safe-bottom bg-background/95" />
      </nav>
    </>
  );
}
