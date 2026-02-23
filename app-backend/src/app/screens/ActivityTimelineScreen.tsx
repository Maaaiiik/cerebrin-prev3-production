/**
 * Activity Timeline Screen - Historial completo de actividad
 * Cerebrin v3.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Search,
  Filter,
  Calendar,
  Zap,
  User,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  Bot,
  TrendingUp,
  Download,
  RefreshCw,
  Sparkles,
  MoreHorizontal,
  ArrowLeft,
} from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================
// TYPES
// ============================================================

type ActivityType = 'automation' | 'manual';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  automation_name?: string;
  automation_id?: string;
  status: 'success' | 'error' | 'pending';
  metadata: {
    icon?: string;
    color?: string;
    agent?: string;
    service?: string;
    [key: string]: any;
  };
}

type FilterType = 'all' | 'automation' | 'manual';
type SortType = 'newest' | 'oldest';

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    type: 'automation',
    title: 'Email de seguimiento enviado',
    description: 'Recordatorio automático enviado a cliente@acme.com por falta de respuesta',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    automation_name: 'Seguimiento automático',
    automation_id: 'auto-1',
    status: 'success',
    metadata: {
      icon: 'Mail',
      color: '#3B82F6',
      agent: 'Asistente de Ventas',
      service: 'Gmail',
      recipient: 'cliente@acme.com',
      template: 'Recordatorio amigable',
    },
  },
  {
    id: '2',
    type: 'manual',
    title: 'Nueva cotización creada',
    description: 'Cotización #1234 para Acme Corp - $5,000',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    status: 'success',
    metadata: {
      icon: 'FileText',
      color: '#10B981',
      cliente: 'Acme Corp',
      monto: '$5,000',
    },
  },
  {
    id: '3',
    type: 'automation',
    title: 'Reunión agendada en calendario',
    description: 'Meeting con StartupXYZ programada para mañana 10:00 AM',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
    automation_name: 'Auto-scheduling',
    automation_id: 'auto-2',
    status: 'success',
    metadata: {
      icon: 'Calendar',
      color: '#8B5CF6',
      agent: 'Asistente de Ventas',
      service: 'Google Calendar',
      meeting_title: 'Demo StartupXYZ',
      meeting_time: 'Mañana 10:00 AM',
    },
  },
  {
    id: '4',
    type: 'manual',
    title: 'Proyecto creado',
    description: 'Nuevo proyecto: Diseño web para StartupXYZ',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6h ago
    status: 'success',
    metadata: {
      icon: 'Briefcase',
      color: '#6366F1',
      proyecto: 'Diseño web StartupXYZ',
      presupuesto: '$15,000',
    },
  },
  {
    id: '5',
    type: 'automation',
    title: 'Notificación de Telegram enviada',
    description: 'Resumen diario enviado a tu chat personal',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8h ago
    automation_name: 'Resumen diario',
    automation_id: 'auto-3',
    status: 'success',
    metadata: {
      icon: 'MessageSquare',
      color: '#06B6D4',
      agent: 'Asistente Personal',
      service: 'Telegram',
      summary_type: 'Resumen diario de ventas',
    },
  },
  {
    id: '6',
    type: 'manual',
    title: 'Tarea académica registrada',
    description: 'Tarea: Ensayo de historia - Entrega 25 Feb',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    status: 'success',
    metadata: {
      icon: 'BookOpen',
      color: '#8B5CF6',
      materia: 'Historia Universal',
      fecha_entrega: '25 Feb',
    },
  },
  {
    id: '7',
    type: 'automation',
    title: 'Lead detectado en inbox',
    description: 'Nuevo cliente potencial identificado: contact@empresa.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(), // Yesterday
    automation_name: 'Detector de leads',
    automation_id: 'auto-4',
    status: 'success',
    metadata: {
      icon: 'Target',
      color: '#F59E0B',
      agent: 'Asistente de Ventas',
      service: 'Gmail',
      lead_email: 'contact@empresa.com',
      confidence: 'Alta',
    },
  },
  {
    id: '8',
    type: 'automation',
    title: 'Error en sincronización',
    description: 'No se pudo acceder a Gmail API - Token expirado',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    automation_name: 'Seguimiento automático',
    automation_id: 'auto-1',
    status: 'error',
    metadata: {
      icon: 'Mail',
      color: '#EF4444',
      agent: 'Asistente de Ventas',
      service: 'Gmail',
      error_type: 'Token expirado',
    },
  },
];

// ============================================================
// ICON MAPPER
// ============================================================

const ICON_MAP: Record<string, any> = {
  Mail,
  FileText,
  Calendar,
  MessageSquare,
  Briefcase: Clock,
  BookOpen: FileText,
  Target: TrendingUp,
};

// ============================================================
// COMPONENT
// ============================================================

interface ActivityTimelineScreenProps {
  onBack?: () => void;
}

export function ActivityTimelineScreen({ onBack }: ActivityTimelineScreenProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let result = [...MOCK_ACTIVITIES];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(a => a.type === filterType);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.description.toLowerCase().includes(query) ||
        a.automation_name?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortType === 'newest') {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else {
      result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    return result;
  }, [searchQuery, filterType, sortType]);

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};

    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp);
      let groupKey: string;

      if (isToday(date)) {
        groupKey = 'Hoy';
      } else if (isYesterday(date)) {
        groupKey = 'Ayer';
      } else {
        groupKey = format(date, "d 'de' MMMM", { locale: es });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  // Stats
  const stats = useMemo(() => {
    const total = MOCK_ACTIVITIES.length;
    const automation = MOCK_ACTIVITIES.filter(a => a.type === 'automation').length;
    const manual = MOCK_ACTIVITIES.filter(a => a.type === 'manual').length;
    const success = MOCK_ACTIVITIES.filter(a => a.status === 'success').length;
    const errors = MOCK_ACTIVITIES.filter(a => a.status === 'error').length;

    return { total, automation, manual, success, errors };
  }, []);

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { locale: es, addSuffix: true });
  }

  function getIconComponent(iconName?: string) {
    if (!iconName) return Activity;
    return ICON_MAP[iconName] || Activity;
  }

  function handleExport() {
    // TODO: Implement export to CSV/PDF
    console.log('Exporting activities...');
  }

  function handleRefresh() {
    // TODO: Refresh activities from backend
    console.log('Refreshing activities...');
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] pb-20">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0D1425]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                title="Volver al inicio"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
                <Activity className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Actividad</h1>
                <p className="text-sm text-slate-400">
                  {filteredActivities.length} {filteredActivities.length === 1 ? 'evento' : 'eventos'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                className="p-2.5 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                title="Actualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={handleExport}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Exportar</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="px-4 py-2 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-0.5">Total</p>
              <p className="text-lg font-bold text-white">{stats.total}</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-violet-500/10 border border-violet-500/30">
              <p className="text-xs text-violet-400 mb-0.5">
                <Bot className="w-3 h-3 inline mr-1" />
                Automatizaciones
              </p>
              <p className="text-lg font-bold text-violet-300">{stats.automation}</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs text-blue-400 mb-0.5">
                <User className="w-3 h-3 inline mr-1" />
                Manuales
              </p>
              <p className="text-lg font-bold text-blue-300">{stats.manual}</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-xs text-emerald-400 mb-0.5">
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                Exitosas
              </p>
              <p className="text-lg font-bold text-emerald-300">{stats.success}</p>
            </div>
            <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 mb-0.5">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Errores
              </p>
              <p className="text-lg font-bold text-red-300">{stats.errors}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="border-b border-white/10 bg-[#0D1425]/50 sticky top-[180px] md:top-[156px] z-30">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar actividades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>

            {/* Filter Type */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  showFilters
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </button>

              <div className="flex gap-1 bg-slate-900/50 rounded-lg p-1 border border-slate-700">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterType('automation')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'automation'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3 h-3 inline mr-1" />
                  IA
                </button>
                <button
                  onClick={() => setFilterType('manual')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    filterType === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3 h-3 inline mr-1" />
                  Manual
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters (collapsed) */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 flex items-center gap-3">
                  <span className="text-sm text-slate-400">Ordenar:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortType('newest')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        sortType === 'newest'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      Más recientes
                    </button>
                    <button
                      onClick={() => setSortType('oldest')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        sortType === 'oldest'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      Más antiguas
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timeline */}
      <div className="container mx-auto px-4 py-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Activity className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No hay actividades</h3>
            <p className="text-sm text-slate-500">
              {searchQuery ? 'No se encontraron resultados' : 'Ejecuta acciones para ver tu actividad aquí'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([date, activities]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wide">{date}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                </div>

                {/* Activities */}
                <div className="space-y-3">
                  {activities.map((activity, index) => {
                    const Icon = getIconComponent(activity.metadata.icon);
                    const isExpanded = expandedId === activity.id;
                    const isAutomation = activity.type === 'automation';

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          relative p-4 rounded-xl border transition-all cursor-pointer
                          ${activity.status === 'error'
                            ? 'bg-red-500/5 border-red-500/30 hover:bg-red-500/10'
                            : isAutomation
                            ? 'bg-violet-500/5 border-violet-500/20 hover:bg-violet-500/10'
                            : 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10'
                          }
                        `}
                        onClick={() => setExpandedId(isExpanded ? null : activity.id)}
                      >
                        {/* Main Content */}
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`
                              p-3 rounded-lg border shrink-0
                              ${activity.status === 'error'
                                ? 'bg-red-500/20 border-red-500/30'
                                : isAutomation
                                ? 'bg-violet-500/20 border-violet-500/30'
                                : 'bg-blue-500/20 border-blue-500/30'
                              }
                            `}
                            style={
                              activity.status !== 'error' && activity.metadata.color
                                ? { backgroundColor: `${activity.metadata.color}20`, borderColor: `${activity.metadata.color}40` }
                                : {}
                            }
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                activity.status === 'error'
                                  ? 'text-red-400'
                                  : isAutomation
                                  ? 'text-violet-400'
                                  : 'text-blue-400'
                              }`}
                              style={activity.status !== 'error' && activity.metadata.color ? { color: activity.metadata.color } : {}}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div className="flex-1">
                                <h3 className="font-semibold text-white mb-1">{activity.title}</h3>
                                <p className="text-sm text-slate-400">{activity.description}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {activity.status === 'success' && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                )}
                                {activity.status === 'error' && (
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                )}
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(activity.timestamp)}
                              </span>

                              {isAutomation && activity.automation_name && (
                                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-medium flex items-center gap-1">
                                  <Bot className="w-3 h-3" />
                                  {activity.automation_name}
                                </span>
                              )}

                              {activity.metadata.service && (
                                <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-300 text-xs font-medium">
                                  {activity.metadata.service}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                                  Detalles
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-3">
                                  {Object.entries(activity.metadata)
                                    .filter(([key]) => !['icon', 'color'].includes(key))
                                    .map(([key, value]) => (
                                      <div key={key} className="flex items-start gap-2">
                                        <span className="text-xs text-slate-500 capitalize min-w-[80px]">
                                          {key.replace(/_/g, ' ')}:
                                        </span>
                                        <span className="text-xs text-white font-medium">{String(value)}</span>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
