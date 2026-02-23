/**
 * V3Dashboard — Dashboard Principal v3.0
 * Especificación: base_cerebrin_v3.md - PANTALLA 2: DASHBOARD
 * 
 * Layout completo según especificación:
 * - V3TopBar con saludo contextual
 * - AgentStatusBanner prominente
 * - MIS TAREAS HOY con swipe gestures
 * - SUGERENCIAS DEL AGENTE (cuando hay)
 * - V3BottomNav (mobile)
 * - QuickActionFAB contextual
 * 
 * Estados: sin tareas, primer uso, con approvals, weekend
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Sparkles,
  ChevronRight,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { V3TopBar } from './V3TopBar';
import { AgentStatusBanner } from './AgentStatusBanner';
import { V3BottomNav } from './V3BottomNav';
import { TaskCard } from './TaskCard';
import { AgentSuggestionCard } from './AgentSuggestionCard';
import { QuickActionFAB } from './QuickActionFAB';
import { EmptyState } from './EmptyState';
import { ApprovalCard } from './ApprovalCard';
import { DesktopSidebar } from './DesktopSidebar';
import { ShadowChat } from './ShadowChat';
import { getCurrentSession } from '../../services/onboardingV3';
import { toast } from 'sonner';

interface V3DashboardProps {
  onNavigate: (section: string) => void;
}

// Mock data - En producción vendrá del backend
const MOCK_TASKS = [
  {
    id: '1',
    title: 'Cotización para Empresa ABC',
    priority: 'high' as const,
    completed: false,
    createdByAgent: false,
    dueDate: 'Hoy, 15:00'
  },
  {
    id: '2',
    title: 'Responder email de Juan Pérez',
    priority: 'medium' as const,
    completed: false,
    createdByAgent: true,
    dueDate: 'Hoy, 17:00'
  },
  {
    id: '3',
    title: 'Revisar informe semanal',
    priority: 'low' as const,
    completed: true,
    createdByAgent: true,
    dueDate: 'Hoy, 10:00'
  }
];

const MOCK_SUGGESTIONS = [
  {
    id: 's1',
    type: 'document' as const,
    title: 'Cotización para ABC lista para revisión',
    description: 'He preparado la cotización para Empresa ABC basándome en tu plantilla estándar y los precios de febrero 2026.',
    actionLabel: 'Ver borrador',
    confidence: 'high' as const,
    timestamp: 'Hace 5 min'
  }
];

const MOCK_APPROVALS = [
  {
    id: 'a1',
    actionType: 'Enviar email',
    title: 'Sofia AI quiere enviar un email',
    description: 'Propongo enviar la cotización de Empresa ABC a juanperez@abc.com por $1.250.000',
    previewLabel: 'Ver borrador del email',
    timestamp: 'Hace 10 min'
  }
];

export function V3Dashboard({ onNavigate }: V3DashboardProps) {
  const [userName, setUserName] = useState('Sofía');
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [suggestions, setSuggestions] = useState(MOCK_SUGGESTIONS);
  const [approvals, setApprovals] = useState(MOCK_APPROVALS);
  const [showFirstTimeBanner, setShowFirstTimeBanner] = useState(false);
  const [completedTasksToday, setCompletedTasksToday] = useState(1);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<'focus' | 'director'>('focus');

  useEffect(() => {
    // Obtener datos del usuario
    const session = getCurrentSession();
    if (session?.answers?.name) {
      setUserName(session.answers.name);
    }

    // Verificar si es primer uso (después del onboarding)
    const isFirstTime = localStorage.getItem('cerebrin_first_dashboard_visit') !== 'false';
    if (isFirstTime) {
      setShowFirstTimeBanner(true);
      localStorage.setItem('cerebrin_first_dashboard_visit', 'false');
    }
  }, []);

  // Handlers
  const handleCompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.completed) {
      setCompletedTasksToday(prev => prev + 1);
      toast.success('Tarea completada', {
        description: task.title
      });
    }
  };

  const handleTaskAction = (taskId: string, action: 'edit' | 'delegate' | 'delete') => {
    const task = tasks.find(t => t.id === taskId);
    
    if (action === 'delete') {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Tarea eliminada');
    } else if (action === 'delegate') {
      toast.info('Delegando al agente...', {
        description: `${task?.title} será procesada por Sofia AI`
      });
    } else if (action === 'edit') {
      toast.info('Editando tarea...');
    }
  };

  const handleSuggestionAction = (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId);
    toast.info('Abriendo sugerencia...', {
      description: suggestion?.title
    });
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toast.success('Sugerencia descartada');
  };

  const handleApprovalAction = (approvalId: string, action: 'approve' | 'reject') => {
    setApprovals(prev => prev.filter(a => a.id !== approvalId));
    
    if (action === 'approve') {
      toast.success('Acción aprobada', {
        description: 'Sofia AI ejecutará la acción ahora'
      });
    } else {
      toast.info('Acción rechazada');
    }
  };

  const handleQuickAction = (actionId: string) => {
    const actionMap: Record<string, string> = {
      'plan-day': 'Planificando tu día...',
      'view-calendar': 'Abriendo calendario...',
      'new-task': 'Creando nueva tarea...',
      'new-quote': 'Creando cotización...',
      'followup': 'Preparando seguimiento...',
      'day-summary': 'Generando resumen del día...',
      'prepare-tomorrow': 'Planificando mañana...'
    };

    toast.info(actionMap[actionId] || 'Procesando acción...');
  };

  const handleBottomNavNavigate = (view: string) => {
    setCurrentView(view);
    
    if (view === 'chat') {
      setIsChatOpen(true);
    } else if (view === 'settings') {
      onNavigate('settings');
    } else if (view === 'tasks') {
      // Ya estamos en dashboard que muestra tareas
      toast.info('Vista de tareas');
    } else if (view === 'documents') {
      toast.info('Documentos - Próximamente');
    }
  };

  const handleSidebarNavigate = (view: string) => {
    setCurrentView(view);
    
    if (view === 'settings') {
      onNavigate('settings');
    } else if (view === 'tasks' || view === 'documents' || view === 'projects') {
      toast.info(`${view.charAt(0).toUpperCase() + view.slice(1)} - Próximamente`);
    }
  };

  const handleModeChange = (mode: 'focus' | 'director') => {
    setDashboardMode(mode);
    toast.success(`Cambiado a modo ${mode === 'focus' ? 'Focus' : 'Director'}`);
  };

  // Calcular estado del dashboard
  const activeTasks = tasks.filter(t => !t.completed);
  const hasNoTasks = tasks.length === 0;
  const allTasksCompleted = tasks.length > 0 && activeTasks.length === 0;
  const hasSuggestions = suggestions.length > 0;
  const hasApprovals = approvals.length > 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        currentView={currentView}
        onNavigate={handleSidebarNavigate}
        agentName="Sofia AI"
        pendingTasksCount={activeTasks.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TopBar */}
        <V3TopBar
          userName={userName}
          onMenuClick={() => toast.info('Menú - Próximamente')}
          onChatClick={() => setIsChatOpen(true)}
          onNotificationsClick={() => toast.info('Notificaciones - Próximamente')}
          notificationCount={approvals.length + suggestions.length}
          completedTasksToday={completedTasksToday}
          dashboardMode={dashboardMode}
          onModeChange={handleModeChange}
        />

      {/* Main Content */}
      <main className="flex-1 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
          
          {/* First time banner */}
          <AnimatePresence>
            {showFirstTimeBanner && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      ⚡ ¡Tu agente está listo!
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Cuéntale qué necesitas hacer hoy. Ella te ayudará a organizarte.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsChatOpen(true)}
                    className="shrink-0 text-xs gap-2"
                  >
                    Abrir chat
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 w-6 h-6"
                    onClick={() => setShowFirstTimeBanner(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AgentStatusBanner */}
          <AgentStatusBanner
            agentName="Sofia AI"
            status={hasApprovals ? 'error' : hasSuggestions ? 'active' : 'active'}
            message={
              hasApprovals 
                ? 'Necesito tu aprobación para continuar'
                : hasSuggestions 
                  ? `Tengo ${suggestions.length} ${suggestions.length === 1 ? 'sugerencia lista' : 'sugerencias listas'} para ti`
                  : 'Observando tu trabajo para ayudarte mejor'
            }
            suggestionsCount={suggestions.length}
            resonanceScore={73}
            onActionClick={hasSuggestions ? () => setIsChatOpen(true) : undefined}
          />

          {/* Approvals (sticky cuando existen) */}
          <AnimatePresence>
            {hasApprovals && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                {approvals.map((approval, index) => (
                  <ApprovalCard
                    key={approval.id}
                    {...approval}
                    onApprove={() => handleApprovalAction(approval.id, 'approve')}
                    onReject={() => handleApprovalAction(approval.id, 'reject')}
                    onPreview={() => toast.info('Vista previa...')}
                    index={index}
                    total={approvals.length}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* MIS TAREAS HOY */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-foreground uppercase tracking-wide">
                Mis Tareas Hoy
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toast.info('Nueva tarea - Próximamente')}
                className="text-xs gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Agregar tarea</span>
              </Button>
            </div>

            {/* Empty state o lista de tareas */}
            {hasNoTasks ? (
              <EmptyState type="no-tasks" onAction={() => setIsChatOpen(true)} />
            ) : allTasksCompleted ? (
              <EmptyState type="all-done" onAction={() => setIsChatOpen(true)} />
            ) : (
              <div className="space-y-2">
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    {...task}
                    onComplete={handleCompleteTask}
                    onEdit={(id) => handleTaskAction(id, 'edit')}
                    onDelegate={(id) => handleTaskAction(id, 'delegate')}
                    onDelete={(id) => handleTaskAction(id, 'delete')}
                    onClick={(id) => toast.info(`Abriendo tarea ${id}`)}
                    draggable={true}
                  />
                ))}
              </div>
            )}
          </section>

          {/* SUGERENCIAS DEL AGENTE */}
          <AnimatePresence>
            {hasSuggestions && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold text-foreground uppercase tracking-wide">
                    Sugerencias del Agente
                  </h2>
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/30">
                    {suggestions.length} {suggestions.length === 1 ? 'nueva' : 'nuevas'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {suggestions.map(suggestion => (
                    <AgentSuggestionCard
                      key={suggestion.id}
                      {...suggestion}
                      onAction={handleSuggestionAction}
                      onDismiss={handleDismissSuggestion}
                    />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Help hint */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Tip:</span> Desliza las tareas hacia la derecha para marcarlas como completadas, o hacia la izquierda para ver más opciones.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile only */}
      <V3BottomNav
        currentView={currentView}
        onNavigate={handleBottomNavNavigate}
        unreadCount={suggestions.length}
        pendingTasksCount={activeTasks.length}
      />

      {/* Quick Action FAB */}
      <QuickActionFAB onAction={handleQuickAction} />
      </div>

      {/* Shadow Chat - Desktop: Panel lateral, Mobile: Bottom sheet */}
      <ShadowChat
        agentName="Sofia AI"
        agentMode="OPERATOR"
        resonanceScore={73}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSettingsClick={() => onNavigate('settings')}
      />
    </div>
  );
}
