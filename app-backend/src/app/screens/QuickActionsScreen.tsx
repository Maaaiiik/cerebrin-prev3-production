/**
 * Quick Actions Screen - Pantalla completa para acciones rápidas
 * Cerebrin v3.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  FileText,
  Calendar,
  DollarSign,
  BookOpen,
  Briefcase,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

type ProfileType = 'vendedor' | 'estudiante' | 'freelancer';

type QuickActionType =
  | 'cotizacion'
  | 'seguimiento'
  | 'venta'
  | 'tarea'
  | 'apuntes'
  | 'sesion_estudio'
  | 'proyecto'
  | 'horas'
  | 'factura';

interface QuickAction {
  id: QuickActionType;
  name: string;
  description: string;
  icon: any;
  color: string;
  profile: ProfileType;
  fields: FormField[];
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'date' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

interface ActionHistory {
  id: string;
  action_type: QuickActionType;
  action_name: string;
  timestamp: string;
  status: 'success' | 'error';
  data: Record<string, any>;
}

// ============================================================
// ACTIONS CONFIG
// ============================================================

const QUICK_ACTIONS: QuickAction[] = [
  // VENDEDOR
  {
    id: 'cotizacion',
    name: 'Nueva Cotización',
    description: 'Crear cotización para cliente',
    icon: FileText,
    color: 'emerald',
    profile: 'vendedor',
    fields: [
      { name: 'cliente', label: 'Cliente', type: 'text', placeholder: 'Acme Corp', required: true },
      { name: 'monto', label: 'Monto', type: 'number', placeholder: '5000', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Detalle de la cotización...', required: true },
    ],
  },
  {
    id: 'seguimiento',
    name: 'Agendar Seguimiento',
    description: 'Programar llamada con cliente',
    icon: Calendar,
    color: 'blue',
    profile: 'vendedor',
    fields: [
      { name: 'cliente', label: 'Cliente', type: 'text', placeholder: 'Juan Pérez', required: true },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'notas', label: 'Notas', type: 'textarea', placeholder: 'Temas a tratar...' },
    ],
  },
  {
    id: 'venta',
    name: 'Registrar Venta',
    description: 'Confirmar venta cerrada',
    icon: DollarSign,
    color: 'green',
    profile: 'vendedor',
    fields: [
      { name: 'cliente', label: 'Cliente', type: 'text', placeholder: 'Acme Corp', required: true },
      { name: 'monto', label: 'Monto', type: 'number', placeholder: '10000', required: true },
      { name: 'producto', label: 'Producto/Servicio', type: 'text', placeholder: 'Plan Enterprise', required: true },
    ],
  },

  // ESTUDIANTE
  {
    id: 'tarea',
    name: 'Nueva Tarea',
    description: 'Crear tarea académica',
    icon: CheckCircle2,
    color: 'violet',
    profile: 'estudiante',
    fields: [
      { name: 'titulo', label: 'Título', type: 'text', placeholder: 'Ensayo de historia', required: true },
      { name: 'materia', label: 'Materia', type: 'text', placeholder: 'Historia Universal', required: true },
      { name: 'fecha', label: 'Fecha de entrega', type: 'date', required: true },
      { name: 'prioridad', label: 'Prioridad', type: 'select', options: ['Alta', 'Media', 'Baja'], required: true },
    ],
  },
  {
    id: 'apuntes',
    name: 'Registrar Apuntes',
    description: 'Guardar notas de clase',
    icon: BookOpen,
    color: 'amber',
    profile: 'estudiante',
    fields: [
      { name: 'materia', label: 'Materia', type: 'text', placeholder: 'Matemáticas', required: true },
      { name: 'tema', label: 'Tema', type: 'text', placeholder: 'Derivadas', required: true },
      { name: 'contenido', label: 'Contenido', type: 'textarea', placeholder: 'Apuntes de la clase...', required: true },
    ],
  },
  {
    id: 'sesion_estudio',
    name: 'Agendar Estudio',
    description: 'Programar sesión de estudio',
    icon: Clock,
    color: 'cyan',
    profile: 'estudiante',
    fields: [
      { name: 'materia', label: 'Materia', type: 'text', placeholder: 'Física', required: true },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
      { name: 'duracion', label: 'Duración (min)', type: 'number', placeholder: '60', required: true },
    ],
  },

  // FREELANCER
  {
    id: 'proyecto',
    name: 'Nuevo Proyecto',
    description: 'Crear proyecto para cliente',
    icon: Briefcase,
    color: 'indigo',
    profile: 'freelancer',
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', placeholder: 'Diseño web Acme', required: true },
      { name: 'cliente', label: 'Cliente', type: 'text', placeholder: 'Acme Corp', required: true },
      { name: 'presupuesto', label: 'Presupuesto', type: 'number', placeholder: '15000', required: true },
      { name: 'deadline', label: 'Deadline', type: 'date', required: true },
    ],
  },
  {
    id: 'horas',
    name: 'Registrar Horas',
    description: 'Trackear tiempo trabajado',
    icon: Clock,
    color: 'orange',
    profile: 'freelancer',
    fields: [
      { name: 'proyecto', label: 'Proyecto', type: 'text', placeholder: 'Diseño web Acme', required: true },
      { name: 'horas', label: 'Horas', type: 'number', placeholder: '4', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Actividades realizadas...', required: true },
    ],
  },
  {
    id: 'factura',
    name: 'Crear Factura',
    description: 'Generar factura para cliente',
    icon: Receipt,
    color: 'teal',
    profile: 'freelancer',
    fields: [
      { name: 'cliente', label: 'Cliente', type: 'text', placeholder: 'Acme Corp', required: true },
      { name: 'monto', label: 'Monto', type: 'number', placeholder: '5000', required: true },
      { name: 'concepto', label: 'Concepto', type: 'text', placeholder: 'Servicios de diseño', required: true },
      { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    ],
  },
];

// Mock history
const MOCK_HISTORY: ActionHistory[] = [
  {
    id: '1',
    action_type: 'cotizacion',
    action_name: 'Nueva Cotización',
    timestamp: '2026-02-22T10:30:00Z',
    status: 'success',
    data: { cliente: 'Acme Corp', monto: '5000' },
  },
  {
    id: '2',
    action_type: 'proyecto',
    action_name: 'Nuevo Proyecto',
    timestamp: '2026-02-22T09:15:00Z',
    status: 'success',
    data: { nombre: 'Diseño web', cliente: 'StartupXYZ' },
  },
  {
    id: '3',
    action_type: 'tarea',
    action_name: 'Nueva Tarea',
    timestamp: '2026-02-21T16:45:00Z',
    status: 'success',
    data: { titulo: 'Ensayo de historia', materia: 'Historia' },
  },
];

// ============================================================
// COMPONENT
// ============================================================

interface QuickActionsScreenProps {
  onBack?: () => void;
}

export function QuickActionsScreen({ onBack }: QuickActionsScreenProps = {}) {
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>('vendedor');
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<ActionHistory[]>(MOCK_HISTORY);

  const profileActions = QUICK_ACTIONS.filter(a => a.profile === selectedProfile);

  function handleFieldChange(fieldName: string, value: any) {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAction) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add to history
      const newHistoryItem: ActionHistory = {
        id: Date.now().toString(),
        action_type: selectedAction.id,
        action_name: selectedAction.name,
        timestamp: new Date().toISOString(),
        status: 'success',
        data: formData,
      };

      setHistory(prev => [newHistoryItem, ...prev]);

      toast.success(`${selectedAction.name} creada exitosamente! 🎉`);

      // Reset
      setFormData({});
      setSelectedAction(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al ejecutar acción');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${hours}h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
              <div className="p-2 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-lg border border-violet-500/30">
                <Zap className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Acciones Rápidas</h1>
                <p className="text-sm text-slate-400">Ejecuta tareas en segundos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['vendedor', 'estudiante', 'freelancer'] as ProfileType[]).map(profile => (
            <button
              key={profile}
              onClick={() => {
                setSelectedProfile(profile);
                setSelectedAction(null);
              }}
              className={`
                px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all
                ${selectedProfile === profile
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              {profile === 'vendedor' && '💼 Vendedor'}
              {profile === 'estudiante' && '📚 Estudiante'}
              {profile === 'freelancer' && '💻 Freelancer'}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Actions Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold text-white">Acciones disponibles</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {profileActions.map(action => {
                  const Icon = action.icon;
                  const isSelected = selectedAction?.id === action.id;

                  return (
                    <motion.button
                      key={action.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => {
                        setSelectedAction(action);
                        setFormData({});
                      }}
                      className={`
                        p-6 rounded-xl border text-left transition-all group
                        ${isSelected
                          ? `bg-${action.color}-500/10 border-${action.color}-500/50 shadow-lg shadow-${action.color}-500/20`
                          : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`
                          p-3 rounded-lg bg-${action.color}-500/20 border border-${action.color}-500/30
                          group-hover:scale-110 transition-transform
                        `}>
                          <Icon className={`w-6 h-6 text-${action.color}-400`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white mb-1">{action.name}</h3>
                          <p className="text-sm text-slate-400">{action.description}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              {selectedAction && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mt-6 p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg bg-${selectedAction.color}-500/20 border border-${selectedAction.color}-500/30`}>
                      {<selectedAction.icon className={`w-5 h-5 text-${selectedAction.color}-400`} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedAction.name}</h3>
                      <p className="text-sm text-slate-400">{selectedAction.description}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {selectedAction.fields.map(field => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-400 ml-1">*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                          <textarea
                            value={formData[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={field.required}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                          >
                            <option value="">Seleccionar...</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                          />
                        )}
                      </div>
                    ))}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Ejecutando...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            Ejecutar Acción
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedAction(null)}
                        className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-lg font-semibold hover:bg-slate-700 transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Historial reciente</h2>
            </div>

            <div className="space-y-3">
              {history.slice(0, 10).map(item => {
                const action = QUICK_ACTIONS.find(a => a.id === item.action_type);
                if (!action) return null;

                const Icon = action.icon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-${action.color}-500/20 border border-${action.color}-500/30`}>
                        <Icon className={`w-4 h-4 text-${action.color}-400`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white text-sm">{item.action_name}</h4>
                          {item.status === 'success' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                          {Object.entries(item.data).slice(0, 2).map(([key, val]) => (
                            <span key={key} className="mr-3">
                              {key}: {val}
                            </span>
                          ))}
                        </p>
                        <p className="text-xs text-slate-500">{formatTimestamp(item.timestamp)}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {history.length === 0 && (
              <div className="p-8 text-center border border-dashed border-slate-700 rounded-lg">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No hay acciones recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
