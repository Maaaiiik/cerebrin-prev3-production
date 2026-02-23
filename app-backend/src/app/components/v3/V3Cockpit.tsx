import { useState } from 'react';
import { ArrowLeft, Bot, Calendar, CheckCircle2, Clock, Sparkles, Zap, TrendingUp, Mail, MessageSquare, Target, Settings, Power, PlayCircle, PauseCircle, BarChart3, Filter, Search, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';

interface V3CockpitProps {
  onBack: () => void;
}

export function V3Cockpit({ onBack }: V3CockpitProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'automations' | 'activity'>('overview');
  const [automationStates, setAutomationStates] = useState<Record<string, boolean>>({
    'auto-1': true,
    'auto-2': true,
    'auto-3': true,
    'auto-4': false,
  });
  const [activityFilter, setActivityFilter] = useState<'all' | 'automations' | 'manual'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - actividad reciente
  const recentActivity = [
    {
      id: '1',
      type: 'automation',
      icon: Mail,
      title: 'Nuevo correo importante detectado',
      description: 'Cliente ABC escribió sobre el proyecto X',
      time: 'Hace 5 min',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      color: '#3B82F6',
      automation: 'Clasificación de emails'
    },
    {
      id: '2',
      type: 'automation',
      icon: Calendar,
      title: 'Recordatorio de reunión',
      description: 'Reunión con equipo en 30 minutos',
      time: 'Hace 12 min',
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      color: '#8B5CF6',
      automation: 'Sincronización de calendario'
    },
    {
      id: '3',
      type: 'automation',
      icon: Target,
      title: 'Tarea completada automáticamente',
      description: 'Seguimiento de proyecto ABC marcado como hecho',
      time: 'Hace 1 hora',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      color: '#10B981',
      automation: 'Auto-seguimiento'
    },
    {
      id: '4',
      type: 'manual',
      icon: CheckCircle2,
      title: 'Cotización enviada',
      description: 'Propuesta enviada a Cliente XYZ',
      time: 'Hace 2 horas',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      color: '#F59E0B',
      automation: null
    },
    {
      id: '5',
      type: 'automation',
      icon: MessageSquare,
      title: 'Notificación enviada por Telegram',
      description: 'Lead caliente: Cliente DEF abrió la propuesta',
      time: 'Hace 3 horas',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      color: '#3B82F6',
      automation: 'Alertas de oportunidades'
    },
    {
      id: '6',
      type: 'automation',
      icon: Mail,
      title: 'Respuesta automática enviada',
      description: 'Email de confirmación a Cliente GHI',
      time: 'Hace 5 horas',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      color: '#8B5CF6',
      automation: 'Respuestas automáticas'
    },
    {
      id: '7',
      type: 'manual',
      icon: Target,
      title: 'Nuevo proyecto creado',
      description: 'Proyecto "Rediseño web" agregado',
      time: 'Ayer',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      color: '#10B981',
      automation: null
    },
  ];

  // Mock data - automatizaciones
  const automations = [
    {
      id: 'auto-1',
      name: 'Clasificación inteligente de emails',
      description: 'Organiza tus correos por prioridad y cliente',
      icon: Mail,
      color: '#3B82F6',
      status: 'active',
      executions: 47,
      lastRun: 'Hace 5 min',
      timeSaved: '45 min/semana'
    },
    {
      id: 'auto-2',
      name: 'Sincronización de calendario',
      description: 'Mantiene tu agenda actualizada en tiempo real',
      icon: Calendar,
      color: '#8B5CF6',
      status: 'active',
      executions: 23,
      lastRun: 'Hace 12 min',
      timeSaved: '30 min/semana'
    },
    {
      id: 'auto-3',
      name: 'Alertas de oportunidades',
      description: 'Te avisa cuando hay leads calientes',
      icon: MessageSquare,
      color: '#10B981',
      status: 'active',
      executions: 12,
      lastRun: 'Hace 3 horas',
      timeSaved: '1.2 h/semana'
    },
    {
      id: 'auto-4',
      name: 'Respuestas automáticas',
      description: 'Responde emails frecuentes automáticamente',
      icon: Sparkles,
      color: '#F59E0B',
      status: 'paused',
      executions: 0,
      lastRun: 'Nunca',
      timeSaved: '0 min/semana'
    },
  ];

  // Mock data - métricas
  const metrics = [
    { label: 'Automatizaciones activas', value: '4', change: '+2', icon: Zap, color: '#8B5CF6' },
    { label: 'Tareas completadas hoy', value: '12', change: '+8', icon: CheckCircle2, color: '#10B981' },
    { label: 'Tiempo ahorrado', value: '2.5h', change: '+0.5h', icon: Clock, color: '#3B82F6' },
    { label: 'Productividad', value: '94%', change: '+12%', icon: TrendingUp, color: '#F59E0B' }
  ];

  const handleToggleAutomation = (id: string) => {
    setAutomationStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredActivity = recentActivity.filter(activity => {
    if (activityFilter === 'automations' && activity.type !== 'automation') return false;
    if (activityFilter === 'manual' && activity.type !== 'manual') return false;
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 pt-0 md:pt-20">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Botón Volver oculto en mobile (usarán navegación) */}
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="hidden md:flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  }}
                >
                  <Bot className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Mi Dashboard</h1>
                <p className="text-xs text-muted-foreground">Todo funcionando perfectamente</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Todo activo
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 rounded-lg bg-muted/50 w-fit">
            {[
              { id: 'overview', label: 'Resumen' },
              { id: 'automations', label: 'Automatizaciones' },
              { id: 'activity', label: 'Actividad' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`
                  px-4 py-2 rounded-md text-sm font-semibold transition-all
                  ${selectedTab === tab.id
                    ? 'bg-violet-600/20 text-violet-300'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, index) => {
                  const Icon = metric.icon;
                  return (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-xl border border-border bg-card p-5 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${metric.color}15` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: metric.color }} />
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                          {metric.change}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Recent Activity */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Actividad reciente</h2>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${activity.color}15` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: activity.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Automations Tab */}
          {selectedTab === 'automations' && (
            <div className="space-y-6">
              {/* Header con stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{Object.values(automationStates).filter(Boolean).length}</p>
                      <p className="text-xs text-muted-foreground">Activas</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">82</p>
                      <p className="text-xs text-muted-foreground">Ejecuciones hoy</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">3.2h</p>
                      <p className="text-xs text-muted-foreground">Ahorradas esta semana</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de automatizaciones */}
              <div className="rounded-2xl border border-border bg-card">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Todas las automatizaciones</h2>
                  <p className="text-sm text-muted-foreground mt-1">Gestiona y monitorea tus automatizaciones</p>
                </div>
                <div className="divide-y divide-border">
                  {automations.map((automation, index) => {
                    const Icon = automation.icon;
                    const isActive = automationStates[automation.id];
                    return (
                      <motion.div
                        key={automation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                              backgroundColor: `${automation.color}20`,
                              border: `1.5px solid ${automation.color}60`,
                            }}
                          >
                            <Icon className="w-6 h-6" style={{ color: automation.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <h3 className="text-sm font-bold text-foreground">{automation.name}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{automation.description}</p>
                              </div>
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => handleToggleAutomation(automation.id)}
                              />
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              <div className="flex items-center gap-1.5">
                                <PlayCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">{automation.executions} ejecuciones</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">Última: {automation.lastRun}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-semibold">{automation.timeSaved} ahorrados</span>
                              </div>
                              {isActive && (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                  Activa
                                </Badge>
                              )}
                              {!isActive && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                                  Pausada
                                </Badge>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-3">
                              <Button variant="outline" size="sm" className="h-8 text-xs">
                                <Settings className="w-3 h-3 mr-1.5" />
                                Configurar
                              </Button>
                              <Button variant="outline" size="sm" className="h-8 text-xs">
                                <BarChart3 className="w-3 h-3 mr-1.5" />
                                Ver estadísticas
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {selectedTab === 'activity' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar actividad..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    </div>
                  </div>

                  {/* Filter buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActivityFilter('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activityFilter === 'all'
                          ? 'bg-violet-600/20 text-violet-300'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      onClick={() => setActivityFilter('automations')}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activityFilter === 'automations'
                          ? 'bg-violet-600/20 text-violet-300'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Automatizaciones
                    </button>
                    <button
                      onClick={() => setActivityFilter('manual')}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activityFilter === 'manual'
                          ? 'bg-violet-600/20 text-violet-300'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-border bg-card">
                <div className="p-6 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Historial de actividad</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {filteredActivity.length} {filteredActivity.length === 1 ? 'evento' : 'eventos'} encontrados
                  </p>
                </div>
                <div className="p-6">
                  {filteredActivity.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">🔍</div>
                      <p className="text-muted-foreground">No se encontró ninguna actividad</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredActivity.map((activity, index) => {
                        const Icon = activity.icon;
                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/30 transition-colors border border-transparent hover:border-border"
                          >
                            {/* Timeline dot */}
                            <div className="relative">
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${activity.color}15` }}
                              >
                                <Icon className="w-5 h-5" style={{ color: activity.color }} />
                              </div>
                              {index < filteredActivity.length - 1 && (
                                <div className="absolute left-1/2 top-10 -translate-x-1/2 w-0.5 h-4 bg-border" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground">{activity.title}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                                  {activity.automation && (
                                    <Badge variant="outline" className="mt-2 bg-violet-500/10 text-violet-400 border-violet-500/30 text-xs">
                                      <Zap className="w-3 h-3 mr-1" />
                                      {activity.automation}
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">{activity.time}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
