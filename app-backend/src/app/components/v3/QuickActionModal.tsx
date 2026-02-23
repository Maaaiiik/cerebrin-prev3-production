import { useState } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface QuickActionModalProps {
  open: boolean;
  onClose: () => void;
  actionId: string;
  actionLabel: string;
  profileType: 'vendedor' | 'estudiante' | 'freelancer';
}

export function QuickActionModal({ open, onClose, actionId, actionLabel, profileType }: QuickActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Configuración de formularios según acción
  const getFormConfig = () => {
    // Vendedor
    if (actionId === 'new-quote') {
      return {
        title: 'Nueva Cotización',
        icon: '💼',
        fields: [
          { id: 'client', label: 'Cliente', type: 'text', placeholder: 'Nombre del cliente' },
          { id: 'product', label: 'Producto/Servicio', type: 'text', placeholder: 'Ej: Consultoría' },
          { id: 'amount', label: 'Monto', type: 'number', placeholder: '0' },
        ]
      };
    }
    if (actionId === 'pipeline') {
      return {
        title: 'Ver Pipeline',
        icon: '📊',
        isView: true,
        content: 'Vista del pipeline próximamente...'
      };
    }
    if (actionId === 'followups') {
      return {
        title: 'Seguimientos',
        icon: '📧',
        isView: true,
        content: 'Lista de seguimientos próximamente...'
      };
    }

    // Estudiante
    if (actionId === 'add-course') {
      return {
        title: 'Agregar Ramo',
        icon: '📚',
        fields: [
          { id: 'name', label: 'Nombre del Ramo', type: 'text', placeholder: 'Ej: Cálculo I' },
          { id: 'code', label: 'Código', type: 'text', placeholder: 'Ej: MAT101' },
          { id: 'professor', label: 'Profesor', type: 'text', placeholder: 'Nombre del profesor' },
          { id: 'credits', label: 'Créditos', type: 'number', placeholder: '0' },
        ]
      };
    }
    if (actionId === 'schedule') {
      return {
        title: 'Ver Horario',
        icon: '📅',
        isView: true,
        content: 'Tu horario semanal próximamente...'
      };
    }
    if (actionId === 'tasks') {
      return {
        title: 'Tareas Próximas',
        icon: '✅',
        isView: true,
        content: 'Lista de tareas próximamente...'
      };
    }

    // Freelancer
    if (actionId === 'new-project') {
      return {
        title: 'Nuevo Proyecto',
        icon: '🚀',
        fields: [
          { id: 'name', label: 'Nombre del Proyecto', type: 'text', placeholder: 'Ej: Rediseño web ABC' },
          { id: 'client', label: 'Cliente', type: 'text', placeholder: 'Nombre del cliente' },
          { id: 'deadline', label: 'Fecha límite', type: 'date' },
          { id: 'budget', label: 'Presupuesto', type: 'number', placeholder: '0' },
        ]
      };
    }
    if (actionId === 'new-proposal') {
      return {
        title: 'Nueva Propuesta',
        icon: '📄',
        fields: [
          { id: 'client', label: 'Cliente', type: 'text', placeholder: 'Nombre del cliente' },
          { id: 'service', label: 'Servicio', type: 'text', placeholder: 'Ej: Desarrollo web' },
          { id: 'duration', label: 'Duración (semanas)', type: 'number', placeholder: '0' },
          { id: 'amount', label: 'Monto', type: 'number', placeholder: '0' },
        ]
      };
    }
    if (actionId === 'log-time') {
      return {
        title: 'Registrar Tiempo',
        icon: '⏱️',
        fields: [
          { id: 'project', label: 'Proyecto', type: 'text', placeholder: 'Selecciona proyecto' },
          { id: 'hours', label: 'Horas', type: 'number', placeholder: '0' },
          { id: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Qué trabajaste?' },
        ]
      };
    }

    return { title: actionLabel, icon: '⚡', fields: [] };
  };

  const config = getFormConfig();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success(`${config.title} creado exitosamente! 🎉`);
    setIsSubmitting(false);
    onClose();
    setFormData({});
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{config.icon}</div>
              <h2 className="text-lg font-bold text-foreground">{config.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {config.isView ? (
              // Vista simple
              <div className="py-12 text-center">
                <div className="text-5xl mb-4">{config.icon}</div>
                <p className="text-muted-foreground">{config.content}</p>
              </div>
            ) : (
              // Formulario
              <form onSubmit={handleSubmit} className="space-y-4">
                {config.fields?.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        placeholder={field.placeholder}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.id] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isSubmitting ? 'Guardando...' : 'Crear'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
