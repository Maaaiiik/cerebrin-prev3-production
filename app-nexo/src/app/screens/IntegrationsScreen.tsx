/**
 * Integrations Screen - Pantalla de conexión de servicios
 * Cerebrin v3.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plug,
  Mail,
  Calendar,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Trash2,
  Play,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

type IntegrationStatus = 'connected' | 'disconnected' | 'error';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  status: IntegrationStatus;
  connectedAt?: string;
  email?: string;
  error?: string;
  features: string[];
  setupSteps: string[];
}

// ============================================================
// MOCK DATA
// ============================================================

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Conecta tu cuenta de Gmail para automatizar emails',
    icon: Mail,
    color: '#EA4335',
    status: 'disconnected',
    features: [
      'Enviar emails automáticos',
      'Detectar leads en inbox',
      'Seguimiento de conversaciones',
      'Templates personalizados',
    ],
    setupSteps: [
      'Haz click en "Conectar Gmail"',
      'Autoriza el acceso en Google',
      'Selecciona tu cuenta de Gmail',
      'Confirma los permisos',
    ],
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Sincroniza tu calendario para agendar reuniones',
    icon: Calendar,
    color: '#4285F4',
    status: 'disconnected',
    features: [
      'Agendar reuniones automáticamente',
      'Sincronizar eventos',
      'Recordatorios inteligentes',
      'Detección de disponibilidad',
    ],
    setupSteps: [
      'Haz click en "Conectar Calendar"',
      'Autoriza el acceso en Google',
      'Selecciona tu calendario',
      'Confirma los permisos',
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Recibe notificaciones y controla tu negocio desde Telegram',
    icon: MessageSquare,
    color: '#0088CC',
    status: 'disconnected',
    features: [
      'Notificaciones en tiempo real',
      'Control por comandos',
      'Resúmenes diarios',
      'Alertas de leads',
    ],
    setupSteps: [
      'Abre Telegram y busca @BotFather',
      'Crea un nuevo bot con /newbot',
      'Copia el token que te da',
      'Pégalo aquí y guarda',
    ],
  },
];

// ============================================================
// COMPONENT
// ============================================================

interface IntegrationsScreenProps {
  onBack?: () => void;
}

export function IntegrationsScreen({ onBack }: IntegrationsScreenProps = {}) {
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [telegramToken, setTelegramToken] = useState('');
  const [showTelegramInput, setShowTelegramInput] = useState(false);

  // Stats
  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalCount = integrations.length;

  async function handleConnect(integrationId: string) {
    if (integrationId === 'telegram') {
      setShowTelegramInput(true);
      setExpandedId(integrationId);
      return;
    }

    setConnectingId(integrationId);

    try {
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock: Update integration status
      setIntegrations(prev =>
        prev.map(int =>
          int.id === integrationId
            ? {
                ...int,
                status: 'connected' as IntegrationStatus,
                connectedAt: new Date().toISOString(),
                email: integrationId === 'gmail' ? 'usuario@gmail.com' : 'usuario@gmail.com',
              }
            : int
        )
      );

      toast.success(`${integrationId === 'gmail' ? 'Gmail' : 'Google Calendar'} conectado exitosamente`);
    } catch (error) {
      toast.error('Error al conectar. Intenta de nuevo.');
    } finally {
      setConnectingId(null);
    }
  }

  async function handleConnectTelegram() {
    if (!telegramToken.trim()) {
      toast.error('Por favor ingresa un token válido');
      return;
    }

    setConnectingId('telegram');

    try {
      // Simulate API call to validate token
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock: Update integration status
      setIntegrations(prev =>
        prev.map(int =>
          int.id === 'telegram'
            ? {
                ...int,
                status: 'connected' as IntegrationStatus,
                connectedAt: new Date().toISOString(),
                email: `Bot: ${telegramToken.substring(0, 10)}...`,
              }
            : int
        )
      );

      toast.success('Telegram conectado exitosamente');
      setShowTelegramInput(false);
      setTelegramToken('');
    } catch (error) {
      toast.error('Token inválido. Verifica e intenta de nuevo.');
    } finally {
      setConnectingId(null);
    }
  }

  async function handleDisconnect(integrationId: string) {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    const confirmed = window.confirm(
      `¿Estás seguro de desconectar ${integration.name}? Las automatizaciones que usen este servicio dejarán de funcionar.`
    );

    if (!confirmed) return;

    setIntegrations(prev =>
      prev.map(int =>
        int.id === integrationId
          ? {
              ...int,
              status: 'disconnected' as IntegrationStatus,
              connectedAt: undefined,
              email: undefined,
            }
          : int
      )
    );

    toast.success(`${integration.name} desconectado`);
  }

  async function handleTest(integrationId: string) {
    setTestingId(integrationId);

    try {
      // Simulate test
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Conexión verificada exitosamente ✓');
    } catch (error) {
      toast.error('Error en la prueba de conexión');
    } finally {
      setTestingId(null);
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
                title="Volver a configuración"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg border border-emerald-500/30">
                <Plug className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Integraciones</h1>
                <p className="text-sm text-slate-400">
                  {connectedCount} de {totalCount} servicios conectados
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Progreso de conexión</span>
              <span className="text-xs font-bold text-emerald-400">
                {Math.round((connectedCount / totalCount) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(connectedCount / totalCount) * 100}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Info Banner */}
      <div className="container mx-auto px-4 py-4">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-300 mb-1">Conecta tus herramientas</h3>
            <p className="text-xs text-blue-200/80">
              Las integraciones permiten que tus automatizaciones funcionen. Conecta al menos Gmail para empezar.
            </p>
          </div>
        </div>
      </div>

      {/* Integrations List */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            const isExpanded = expandedId === integration.id;
            const isConnecting = connectingId === integration.id;
            const isTesting = testingId === integration.id;

            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border bg-slate-900/30 overflow-hidden transition-all hover:bg-slate-900/50"
                style={{
                  borderColor:
                    integration.status === 'connected'
                      ? `${integration.color}40`
                      : integration.status === 'error'
                      ? '#EF444440'
                      : '#334155',
                }}
              >
                {/* Main Content */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="p-3 rounded-lg shrink-0"
                      style={{
                        backgroundColor: `${integration.color}20`,
                        borderWidth: '1px',
                        borderColor: `${integration.color}40`,
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: integration.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">{integration.name}</h3>
                            {integration.status === 'connected' && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            )}
                            {integration.status === 'error' && (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            )}
                          </div>
                          <p className="text-sm text-slate-400">{integration.description}</p>
                        </div>

                        {/* Status Badge */}
                        <div
                          className={`
                            px-3 py-1 rounded-full text-xs font-semibold shrink-0
                            ${
                              integration.status === 'connected'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : integration.status === 'error'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                            }
                          `}
                        >
                          {integration.status === 'connected'
                            ? 'Conectado'
                            : integration.status === 'error'
                            ? 'Error'
                            : 'Desconectado'}
                        </div>
                      </div>

                      {/* Connected Info */}
                      {integration.status === 'connected' && integration.email && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                          <span>Cuenta: {integration.email}</span>
                          <span>•</span>
                          <span>Conectado el {formatDate(integration.connectedAt)}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {integration.status === 'connected' ? (
                          <>
                            <button
                              onClick={() => handleTest(integration.id)}
                              disabled={isTesting}
                              className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                            >
                              {isTesting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                              {isTesting ? 'Probando...' : 'Probar conexión'}
                            </button>
                            <button
                              onClick={() => handleDisconnect(integration.id)}
                              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 transition-all flex items-center gap-2 text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Desconectar
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleConnect(integration.id)}
                            disabled={isConnecting}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
                          >
                            {isConnecting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                            {isConnecting ? 'Conectando...' : `Conectar ${integration.name}`}
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : integration.id)}
                          className="px-3 py-2 rounded-lg bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 text-sm font-medium"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Menos info
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4" />
                              Más info
                            </>
                          )}
                        </button>
                      </div>
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
                      <div className="px-5 pb-5 border-t border-white/10 pt-5">
                        {/* Telegram Token Input */}
                        {integration.id === 'telegram' &&
                          integration.status === 'disconnected' &&
                          showTelegramInput && (
                            <div className="mb-5 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                              <h4 className="text-sm font-semibold text-white mb-3">
                                Ingresa tu Bot Token
                              </h4>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={telegramToken}
                                  onChange={e => setTelegramToken(e.target.value)}
                                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                  className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm font-mono"
                                />
                                <button
                                  onClick={handleConnectTelegram}
                                  disabled={isConnecting}
                                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all text-sm font-semibold disabled:opacity-50"
                                >
                                  {isConnecting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    'Guardar'
                                  )}
                                </button>
                              </div>
                            </div>
                          )}

                        <div className="grid md:grid-cols-2 gap-5">
                          {/* Features */}
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              Funcionalidades
                            </h4>
                            <ul className="space-y-2">
                              {integration.features.map((feature, idx) => (
                                <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                                  <span className="text-emerald-400 mt-1">•</span>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Setup Steps */}
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                              <Info className="w-4 h-4 text-blue-400" />
                              Cómo conectar
                            </h4>
                            <ol className="space-y-2">
                              {integration.setupSteps.map((step, idx) => (
                                <li key={idx} className="text-sm text-slate-400 flex items-start gap-2">
                                  <span className="text-blue-400 font-semibold shrink-0">
                                    {idx + 1}.
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
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

      {/* Help Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-700">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">
                ¿Problemas para conectar?
              </h3>
              <div className="space-y-2 text-sm text-slate-400">
                <p>
                  • <strong>Gmail/Calendar:</strong> Asegúrate de permitir acceso a apps de terceros en tu
                  cuenta de Google
                </p>
                <p>
                  • <strong>Telegram:</strong> El token debe empezar con números seguido de dos puntos
                  (ejemplo: 123456:ABC...)
                </p>
                <p>
                  • Si el problema persiste, intenta desconectar y volver a conectar el servicio
                </p>
              </div>
              <a
                href="#"
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Ver documentación completa
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
