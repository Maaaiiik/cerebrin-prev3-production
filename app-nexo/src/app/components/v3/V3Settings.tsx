import { Bell, Globe, Lock, Palette, Smartphone, Trash2, User, Zap, Plug, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface V3SettingsProps {
  onNavigate?: (section: string) => void;
}

export function V3Settings({ onNavigate }: V3SettingsProps = {}) {
  const settingsSections = [
    {
      title: 'Perfil',
      icon: User,
      color: '#3B82F6',
      items: [
        { label: 'Nombre y foto', value: 'Juan Pérez', action: 'Editar' },
        { label: 'Correo electrónico', value: 'juan@example.com', action: 'Cambiar' },
        { label: 'Perfil actual', value: 'Vendedor', action: 'Cambiar perfil' }
      ]
    },
    {
      title: 'Integraciones',
      icon: Zap,
      color: '#8B5CF6',
      items: [
        { label: 'Gmail', value: 'Conectado', status: 'connected', action: 'Desconectar' },
        { label: 'Google Calendar', value: 'Conectado', status: 'connected', action: 'Desconectar' },
        { label: 'Telegram', value: 'No conectado', status: 'disconnected', action: 'Conectar' }
      ]
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      color: '#10B981',
      items: [
        { label: 'Alertas de email', value: 'Activadas', status: 'enabled' },
        { label: 'Recordatorios', value: 'Activadas', status: 'enabled' },
        { label: 'Notificaciones push', value: 'Desactivadas', status: 'disabled' }
      ]
    },
    {
      title: 'Apariencia',
      icon: Palette,
      color: '#F59E0B',
      items: [
        { label: 'Tema', value: 'Oscuro', action: 'Cambiar' },
        { label: 'Idioma', value: 'Español', action: 'Cambiar' }
      ]
    },
    {
      title: 'Privacidad y Seguridad',
      icon: Lock,
      color: '#EF4444',
      items: [
        { label: 'Contraseña', value: '••••••••', action: 'Cambiar' },
        { label: 'Autenticación de dos factores', value: 'Desactivada', action: 'Activar' },
        { label: 'Datos compartidos', value: 'Mínimo', action: 'Ver detalles' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8 pt-20 md:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
          <p className="text-muted-foreground">Personaliza tu experiencia en Cerebrin</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, sectionIndex) => {
            const SectionIcon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                {/* Section Header */}
                <div className="p-5 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${section.color}15` }}
                    >
                      <SectionIcon className="w-5 h-5" style={{ color: section.color }} />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                  </div>
                </div>

                {/* Section Items */}
                <div className="divide-y divide-border">
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground mb-1">
                            {item.label}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              {item.value}
                            </p>
                            {item.status === 'connected' && (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                ✓ Conectado
                              </Badge>
                            )}
                            {item.status === 'disconnected' && (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                                No conectado
                              </Badge>
                            )}
                            {item.status === 'enabled' && (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                                Activado
                              </Badge>
                            )}
                            {item.status === 'disabled' && (
                              <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/30 text-xs">
                                Desactivado
                              </Badge>
                            )}
                          </div>
                        </div>
                        {item.action && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                          >
                            {item.action}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Botón especial para Integraciones */}
                  {section.title === 'Integraciones' && onNavigate && (
                    <div className="p-5 bg-muted/10">
                      <Button
                        onClick={() => onNavigate('integrations')}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      >
                        <Plug className="w-4 h-4 mr-2" />
                        Administrar todas las integraciones
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: settingsSections.length * 0.1 }}
            className="rounded-2xl border border-red-500/30 bg-red-500/5 overflow-hidden"
          >
            <div className="p-5 border-b border-red-500/30 bg-red-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-red-400">Zona de peligro</h2>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Eliminar cuenta
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Esta acción es permanente y no se puede deshacer
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Version Info */}
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              Cerebrin v3.0 • Build 2026.02.22
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Hecho con 💜 para personas extraordinarias
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
