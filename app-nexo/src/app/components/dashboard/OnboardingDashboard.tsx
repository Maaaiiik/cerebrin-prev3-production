/**
 * OnboardingDashboard — Dashboard Post-Onboarding para v3.0
 * 
 * Dashboard limpio y amigable que se muestra después de completar el onboarding.
 * Estética "Mission Control" industrial con distinción visual:
 * - AI: Violeta/Hexágonos
 * - Humano: Azul/Verde/Círculos
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Zap, 
  Mail, 
  MessageSquare, 
  Calendar, 
  FileText, 
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Settings,
  Link as LinkIcon,
  Rocket,
  Target,
  TrendingUp,
  PlayCircle,
  ChevronRight,
  Info,
  Briefcase,
  GraduationCap,
  Palette,
  ChevronDown,
  Clock,
  BookOpen,
  Bell,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CerebrinLogo } from '../shared/CerebrinLogo';
import { ServiceConnectionModal } from '../v3/ServiceConnectionModal';
import { QuickActionModal } from '../v3/QuickActionModal';
import { getCurrentSession } from '../../services/onboardingV3';
import type { ProfileType } from '../../services/onboardingV3';

interface OnboardingDashboardProps {
  onNavigate: (section: string) => void;
}

type Service = 'Google Calendar' | 'Gmail' | 'Telegram';

// Configuración por perfil
const PROFILE_CONFIG: Record<ProfileType, {
  icon: any;
  label: string;
  agentName: string;
  greeting: string;
  automations: Array<{
    id: string;
    icon: any;
    label: string;
    description: string;
    howItWorks: string;
    benefit: string;
    status: 'ready' | 'needs_connection';
    service?: string;
    color: string;
  }>;
  quickActions: Array<{
    id: string;
    icon: any;
    label: string;
    color: string;
  }>;
  nextSteps: Array<{
    icon: any;
    label: string;
    description: string;
  }>;
}> = {
  vendedor: {
    icon: Briefcase,
    label: 'Vendedor',
    agentName: 'Mi Asistente de Ventas',
    greeting: '¡Hola! Listo para ayudarte a cerrar más ventas',
    automations: [
      {
        id: 'email-followup',
        icon: Mail,
        label: 'Seguimiento automático de clientes',
        description: 'Detecta emails sin respuesta y envía recordatorios',
        howItWorks: 'Integración con Gmail API que monitorea conversaciones y detecta cuándo un cliente no ha respondido en 3+ días',
        benefit: 'Nunca pierdas una oportunidad por olvido',
        status: 'needs_connection',
        service: 'Gmail',
        color: '#3B82F6',
      },
      {
        id: 'quote-generator',
        icon: FileText,
        label: 'Generador de cotizaciones',
        description: 'Crea cotizaciones profesionales en segundos',
        howItWorks: 'El agente usa templates profesionales + IA para generar documentos listos para enviar con tu branding',
        benefit: 'Reduce de 30min a 2min por cotización',
        status: 'ready',
        color: '#8B5CF6',
      },
      {
        id: 'weekly-report',
        icon: TrendingUp,
        label: 'Reporte semanal automático',
        description: 'Estadísticas de ventas cada lunes a las 9am',
        howItWorks: 'El agente analiza tu pipeline y genera reporte PDF con métricas clave, tendencias y recomendaciones',
        benefit: 'Decisiones data-driven sin esfuerzo',
        status: 'ready',
        color: '#8B5CF6',
      },
      {
        id: 'telegram-alerts',
        icon: MessageSquare,
        label: 'Alertas de oportunidades',
        description: 'Te avisa por Telegram cuando hay leads calientes',
        howItWorks: 'Bot de Telegram que te notifica cuando un lead hace acciones de alto interés (abre propuesta, visita sitio múltiples veces)',
        benefit: 'Actúa rápido en el momento correcto',
        status: 'needs_connection',
        service: 'Telegram',
        color: '#3B82F6',
      },
    ],
    quickActions: [
      { id: 'new-quote', icon: FileText, label: 'Nueva Cotización', color: '#8B5CF6' },
      { id: 'pipeline', icon: Target, label: 'Ver Pipeline', color: '#3B82F6' },
      { id: 'followups', icon: Mail, label: 'Seguimientos', color: '#10B981' },
    ],
    nextSteps: [
      { icon: Mail, label: 'Conectar Gmail', description: 'Para recibir actualizaciones de clientes' },
      { icon: MessageSquare, label: 'Conectar Telegram', description: 'Para alertas en tiempo real' },
      { icon: FileText, label: 'Crear primera cotización', description: 'Prueba el generador de documentos' },
    ],
  },
  
  estudiante: {
    icon: GraduationCap,
    label: 'Estudiante',
    agentName: 'Mi Asistente Académico',
    greeting: 'Mantente al día con tus estudios sin estrés',
    automations: [
      {
        id: 'calendar-sync',
        icon: Calendar,
        label: 'Sincronizar calendario académico',
        description: 'Importa horarios, pruebas y entregas automáticamente',
        howItWorks: 'Integración con Google Calendar que lee eventos académicos y los sincroniza con tu planificador',
        benefit: 'Todo tu calendario en un solo lugar',
        status: 'needs_connection',
        service: 'Google Calendar',
        color: '#3B82F6',
      },
      {
        id: 'exam-reminders',
        icon: Bell,
        label: 'Recordatorios de evaluaciones',
        description: 'Te avisa 1 semana, 3 días y 1 día antes',
        howItWorks: 'El agente analiza tu calendario y envía recordatorios inteligentes con tiempo suficiente para preparar',
        benefit: 'Nunca llegues sin preparar a una prueba',
        status: 'ready',
        color: '#8B5CF6',
      },
      {
        id: 'study-planner',
        icon: BookOpen,
        label: 'Planificador de estudio',
        description: 'Crea planes de estudio personalizados según tus ramos',
        howItWorks: 'IA que genera horarios de estudio optimizados considerando dificultad de cada ramo y tu disponibilidad',
        benefit: 'Estudia mejor, no más horas',
        status: 'ready',
        color: '#8B5CF6',
      },
      {
        id: 'telegram-reminders',
        icon: MessageSquare,
        label: 'Recordatorios por Telegram',
        description: 'Alertas de tareas y evaluaciones en tu móvil',
        howItWorks: 'Bot que te envía notificaciones push con recordatorios de tareas, clases y evaluaciones próximas',
        benefit: 'Recordatorios donde realmente los ves',
        status: 'needs_connection',
        service: 'Telegram',
        color: '#3B82F6',
      },
    ],
    quickActions: [
      { id: 'add-course', icon: BookOpen, label: 'Agregar Ramo', color: '#8B5CF6' },
      { id: 'schedule', icon: Calendar, label: 'Ver Horario', color: '#3B82F6' },
      { id: 'tasks', icon: CheckCircle2, label: 'Tareas Próximas', color: '#10B981' },
    ],
    nextSteps: [
      { icon: Calendar, label: 'Conectar Google Calendar', description: 'Para sincronizar tu horario académico' },
      { icon: MessageSquare, label: 'Conectar Telegram', description: 'Para recibir recordatorios móviles' },
      { icon: BookOpen, label: 'Agregar primer ramo', description: 'Configura tus materias del semestre' },
    ],
  },

  freelancer: {
    icon: Palette,
    label: 'Freelancer',
    agentName: 'Mi Asistente de Proyectos',
    greeting: 'Gestiona tus proyectos como un profesional',
    automations: [
      {
        id: 'project-tracking',
        icon: Target,
        label: 'Seguimiento de proyectos',
        description: 'Monitorea automáticamente el estado de tus proyectos',
        howItWorks: 'El agente revisa deadlines, tareas pendientes y progreso, enviando alertas cuando algo requiere atención',
        benefit: 'Nunca se te pasa un deadline',
        status: 'ready',
        color: '#8B5CF6',
      },
      {
        id: 'proposal-generator',
        icon: FileText,
        label: 'Generador de propuestas',
        description: 'Crea propuestas profesionales en minutos',
        howItWorks: 'Usa templates + IA para generar propuestas completas con timeline, pricing y términos profesionales',
        benefit: 'Gana más proyectos con menos esfuerzo',
        status: 'ready',
        color: '#8B5CF6',
      },
      {
        id: 'time-tracking',
        icon: Clock,
        label: 'Registro de tiempo',
        description: 'Registra automáticamente tiempo trabajado por proyecto',
        howItWorks: 'Detecta actividad en herramientas de trabajo y registra horas automáticamente por proyecto',
        benefit: 'Facturación precisa sin tracking manual',
        status: 'ready',
        color: '#8B5CF6',
      },
      {
        id: 'telegram-updates',
        icon: MessageSquare,
        label: 'Actualizaciones por Telegram',
        description: 'Notificaciones de proyectos en tiempo real',
        howItWorks: 'Bot que te avisa cuando recibes mensajes de clientes, se acerca un deadline o hay cambios importantes',
        benefit: 'Responde rápido, mantén clientes felices',
        status: 'needs_connection',
        service: 'Telegram',
        color: '#3B82F6',
      },
    ],
    quickActions: [
      { id: 'new-project', icon: Rocket, label: 'Nuevo Proyecto', color: '#8B5CF6' },
      { id: 'new-proposal', icon: FileText, label: 'Nueva Propuesta', color: '#3B82F6' },
      { id: 'log-time', icon: Clock, label: 'Registrar Tiempo', color: '#10B981' },
    ],
    nextSteps: [
      { icon: MessageSquare, label: 'Conectar Telegram', description: 'Para recibir actualizaciones de clientes' },
      { icon: Rocket, label: 'Crear primer proyecto', description: 'Empieza a trackear tu trabajo' },
      { icon: FileText, label: 'Generar propuesta', description: 'Prueba el generador de documentos' },
    ],
  },
};

export function OnboardingDashboard({ onNavigate }: OnboardingDashboardProps) {
  const [session, setSession] = useState<any>(null);
  const [profileType, setProfileType] = useState<ProfileType>('freelancer');
  const [showConfetti, setShowConfetti] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [connectionModal, setConnectionModal] = useState<{ open: boolean; service: Service | null }>({
    open: false,
    service: null
  });
  const [quickActionModal, setQuickActionModal] = useState<{ open: boolean; actionId: string | null; actionLabel: string | null }>({
    open: false,
    actionId: null,
    actionLabel: null
  });

  useEffect(() => {
    // Obtener datos del onboarding
    const currentSession = getCurrentSession();
    setSession(currentSession);
    
    if (currentSession?.answers?.profile_type) {
      setProfileType(currentSession.answers.profile_type as ProfileType);
    }

    // Ocultar confetti después de 3s
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const config = PROFILE_CONFIG[profileType];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 pt-0 md:pt-20">
      {/* Header con logo y selector de perfil */}
      <header className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm md:mt-0">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CerebrinLogo className="h-6" />
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Configuración completada
            </Badge>
          </div>

          {/* Selector de perfil (para testing) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ver como:</span>
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
              {(['vendedor', 'estudiante', 'freelancer'] as ProfileType[]).map((profile) => {
                const ProfileIcon = PROFILE_CONFIG[profile].icon;
                return (
                  <button
                    key={profile}
                    onClick={() => setProfileType(profile)}
                    className={`
                      px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-2
                      ${profileType === profile 
                        ? 'bg-violet-600/20 text-violet-300 font-semibold' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                    `}
                  >
                    <ProfileIcon className="w-3.5 h-3.5" />
                    {PROFILE_CONFIG[profile].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

          {/* Título de sección */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-6"
          >
            <h2 className="text-xl text-foreground" style={{ fontWeight: 700 }}>
              Automatizaciones listas para ti
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Conecta tus servicios para activarlas
            </p>
          </motion.div>

          {/* Hero Section con Agente */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative rounded-3xl border border-border bg-gradient-to-br from-card via-card to-violet-500/5 overflow-hidden">
              {/* Background pattern */}
              <div 
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, rgb(139, 92, 246) 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />

              <div className="relative p-8 md:p-10">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                  
                  {/* Avatar del agente (MÁS PEQUEÑO) */}
                  <div className="shrink-0 relative">
                    <div className="relative">
                      {/* Hexágono externo con glow */}
                      <div
                        className="w-24 h-24 absolute blur-xl"
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                          opacity: 0.2,
                        }}
                      />
                      <div
                        className="w-24 h-24 flex items-center justify-center backdrop-blur-sm"
                        style={{
                          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                          background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                        }}
                      >
                        <Bot className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Texto de bienvenida */}
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                      <h1 className="text-2xl md:text-3xl text-foreground" style={{ fontWeight: 700 }}>
                        {config.greeting}
                      </h1>
                      <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
                    </div>
                    <p className="text-base text-muted-foreground">
                      Tu <span className="text-violet-400" style={{ fontWeight: 600 }}>{config.agentName}</span> está listo y configurado
                    </p>
                    <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                      <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        {config.automations.filter(a => a.status === 'ready').length} automatizaciones listas
                      </Badge>
                    </div>
                  </div>

                  {/* CTA Principal */}
                  <div className="shrink-0">
                    <Button
                      size="lg"
                      onClick={() => onNavigate('cockpit')}
                      className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white shadow-lg shadow-violet-500/30"
                    >
                      Ir al Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Automatizaciones Listas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.automations.map((automation, index) => {
                const Icon = automation.icon;
                const isExpanded = expandedCard === automation.id;
                
                return (
                  <motion.div
                    key={automation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 + index * 0.05 }}
                    className="group"
                  >
                    <div className="h-full rounded-2xl border border-border bg-card hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/10 transition-all">
                      <div className="p-5 space-y-4">
                        
                        {/* Header */}
                        <div className="flex items-start gap-3">
                          {/* Icono: hexágono (AI) o círculo (humano) */}
                          <div className="shrink-0">
                            {automation.status === 'ready' ? (
                              // Hexágono para IA
                              <div
                                className="w-11 h-11 flex items-center justify-center"
                                style={{
                                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                  backgroundColor: `${automation.color}20`,
                                  border: `1.5px solid ${automation.color}60`,
                                }}
                              >
                                <Icon className="w-5 h-5" style={{ color: automation.color }} />
                              </div>
                            ) : (
                              // Círculo para conexión humana
                              <div
                                className="w-11 h-11 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: `${automation.color}20`,
                                  border: `1.5px solid ${automation.color}60`,
                                }}
                              >
                                <Icon className="w-5 h-5" style={{ color: automation.color }} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm text-foreground truncate" style={{ fontWeight: 600 }}>
                              {automation.label}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {automation.description}
                            </p>
                          </div>

                          {/* Status badge */}
                          <div className="shrink-0">
                            {automation.status === 'ready' ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                Activa
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                                Conectar
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Botón "Más info" */}
                        <button
                          onClick={() => setExpandedCard(isExpanded ? null : automation.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-xs text-muted-foreground hover:text-foreground"
                        >
                          <div className="flex items-center gap-2">
                            <Info className="w-3.5 h-3.5" />
                            <span>Más detalles</span>
                          </div>
                          <ChevronDown 
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {/* Detalles expandibles */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-2 space-y-3 border-t border-border">
                                {/* Cómo funciona */}
                                <div>
                                  <p className="text-xs font-semibold text-foreground mb-1">
                                    ⚙️ Cómo funciona
                                  </p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {automation.howItWorks}
                                  </p>
                                </div>
                                
                                {/* Beneficio */}
                                <div>
                                  <p className="text-xs font-semibold text-foreground mb-1">
                                    ✨ Beneficio principal
                                  </p>
                                  <p className="text-xs text-violet-400 leading-relaxed">
                                    {automation.benefit}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action button si necesita conexión */}
                        {automation.status === 'needs_connection' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full group-hover:bg-violet-500/10 group-hover:border-violet-500/30 group-hover:text-violet-400 transition-colors"
                            onClick={() => setConnectionModal({ open: true, service: automation.service as Service })}
                          >
                            <LinkIcon className="w-3.5 h-3.5 mr-2" />
                            Conectar {automation.service}
                            <ChevronRight className="w-3.5 h-3.5 ml-auto group-hover:translate-x-1 transition-transform" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Actions + Next Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-lg text-foreground" style={{ fontWeight: 700 }}>
                Acciones rápidas
              </h2>
              <div className="space-y-2">
                {config.quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                      onClick={() => setQuickActionModal({ open: true, actionId: action.id, actionLabel: action.label })}
                      className="w-full group flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-violet-500/30 transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${action.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: action.color }} />
                      </div>
                      <span className="flex-1 text-left text-sm text-foreground" style={{ fontWeight: 500 }}>
                        {action.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="space-y-4"
            >
              <h2 className="text-lg text-foreground" style={{ fontWeight: 700 }}>
                Próximos pasos
              </h2>
              <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                {config.nextSteps.map((step, index) => {
                  const Icon = step.icon;
                  
                  // Determinar acción según el label
                  const handleStepClick = () => {
                    if (step.label.includes('Conectar Gmail')) {
                      setConnectionModal({ open: true, service: 'Gmail' });
                    } else if (step.label.includes('Conectar Google Calendar')) {
                      setConnectionModal({ open: true, service: 'Google Calendar' });
                    } else if (step.label.includes('Conectar Telegram')) {
                      setConnectionModal({ open: true, service: 'Telegram' });
                    } else if (step.label.includes('cotización') || step.label.includes('propuesta')) {
                      // Abrir modal de quick action correspondiente
                      const actionId = step.label.includes('cotización') ? 'new-quote' : 'new-proposal';
                      setQuickActionModal({ open: true, actionId, actionLabel: step.label });
                    } else if (step.label.includes('proyecto')) {
                      setQuickActionModal({ open: true, actionId: 'new-project', actionLabel: 'Nuevo Proyecto' });
                    } else if (step.label.includes('ramo')) {
                      setQuickActionModal({ open: true, actionId: 'add-course', actionLabel: 'Agregar Ramo' });
                    } else {
                      // Default: ir al cockpit
                      onNavigate('cockpit');
                    }
                  };

                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                      onClick={handleStepClick}
                      className="w-full flex items-start gap-3 pb-3 last:pb-0 border-b border-border last:border-0 hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-foreground" style={{ fontWeight: 600 }}>
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-gradient-to-r from-violet-500/10 via-transparent to-violet-500/10"
          >
            <div className="text-center sm:text-left">
              <p className="text-foreground" style={{ fontWeight: 600 }}>
                ¿Listo para empezar?
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Explora el dashboard completo o configura más automatizaciones
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onNavigate('settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Button>
              <Button
                onClick={() => onNavigate('cockpit')}
                className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white"
              >
                Ir al Cockpit
                <Rocket className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Service Connection Modal */}
      {connectionModal.service && (
        <ServiceConnectionModal
          open={connectionModal.open}
          service={connectionModal.service}
          onClose={() => setConnectionModal({ open: false, service: null })}
          onSuccess={() => {
            // Aquí podrías actualizar el estado de la automatización
            console.log(`${connectionModal.service} conectado exitosamente`);
          }}
        />
      )}

      {/* Quick Action Modal */}
      {quickActionModal.actionId && quickActionModal.actionLabel && (
        <QuickActionModal
          open={quickActionModal.open}
          actionId={quickActionModal.actionId}
          actionLabel={quickActionModal.actionLabel}
          profileType={profileType}
          onClose={() => setQuickActionModal({ open: false, actionId: null, actionLabel: null })}
        />
      )}
    </div>
  );
}
