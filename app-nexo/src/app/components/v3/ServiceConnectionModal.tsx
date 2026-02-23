import { useState } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';

type Service = 'Google Calendar' | 'Gmail' | 'Telegram';
type ConnectionStatus = 'idle' | 'connecting' | 'success' | 'error';

interface ServiceConnectionModalProps {
  open: boolean;
  onClose: () => void;
  service: Service;
  onSuccess?: () => void;
}

const SERVICE_INFO = {
  'Google Calendar': {
    icon: '📅',
    description: 'Conecta tu calendario de Google para sincronizar eventos automáticamente',
    steps: [
      'Autoriza el acceso a tu cuenta de Google',
      'Selecciona los calendarios que quieres sincronizar',
      'Configura las notificaciones'
    ],
    permissions: ['Ver eventos del calendario', 'Crear eventos', 'Modificar eventos']
  },
  'Gmail': {
    icon: '📧',
    description: 'Conecta tu correo de Gmail para recibir actualizaciones y responder automáticamente',
    steps: [
      'Autoriza el acceso a tu cuenta de Gmail',
      'Selecciona las etiquetas a monitorear',
      'Configura respuestas automáticas'
    ],
    permissions: ['Leer correos', 'Enviar correos en tu nombre', 'Crear etiquetas']
  },
  'Telegram': {
    icon: '✈️',
    description: 'Conecta Telegram para recibir notificaciones instantáneas en tu móvil',
    steps: [
      'Abre el bot @CerebrinBot en Telegram',
      'Presiona "Start" y copia el código',
      'Pega el código aquí para vincular tu cuenta'
    ],
    permissions: ['Enviar mensajes', 'Recibir comandos']
  }
};

export function ServiceConnectionModal({ open, onClose, service, onSuccess }: ServiceConnectionModalProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [telegramCode, setTelegramCode] = useState('');

  const info = SERVICE_INFO[service];

  const handleConnect = async () => {
    setStatus('connecting');
    
    // Simular conexión
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 90% success rate
    if (Math.random() > 0.1) {
      setStatus('success');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 1500);
    } else {
      setStatus('error');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setTelegramCode('');
    onClose();
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
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{info.icon}</div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Conectar {service}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{info.description}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-6">
            {/* Success State */}
            {status === 'success' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-3 py-8"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground">¡Conectado exitosamente!</h3>
                <p className="text-sm text-muted-foreground text-center">
                  {service} está ahora sincronizado con tu cuenta
                </p>
              </motion.div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-3 py-8"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Error al conectar</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Hubo un problema al conectar {service}. Por favor intenta nuevamente.
                </p>
              </motion.div>
            )}

            {/* Normal State */}
            {status !== 'success' && status !== 'error' && (
              <>
                {/* Steps */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Pasos a seguir:</h3>
                  <div className="space-y-2">
                    {info.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 text-xs font-bold text-violet-400">
                          {index + 1}
                        </div>
                        <p className="text-sm text-muted-foreground flex-1 pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telegram Code Input */}
                {service === 'Telegram' && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Código de verificación
                    </label>
                    <input
                      type="text"
                      value={telegramCode}
                      onChange={(e) => setTelegramCode(e.target.value)}
                      placeholder="Ej: ABC123XYZ"
                      className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Permisos necesarios:</h3>
                  <div className="space-y-1.5">
                    {info.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy Note */}
                <div className="rounded-lg bg-violet-500/5 border border-violet-500/20 p-3">
                  <p className="text-xs text-violet-300">
                    🔒 Tus datos están protegidos. Solo accedemos a la información necesaria para las automatizaciones que configuraste.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {status !== 'success' && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={status === 'connecting'}
              >
                Cancelar
              </Button>
              <Button
                onClick={status === 'error' ? () => setStatus('idle') : handleConnect}
                disabled={status === 'connecting' || (service === 'Telegram' && !telegramCode)}
                className="bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400"
              >
                {status === 'connecting' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {status === 'error' ? 'Reintentar' : status === 'connecting' ? 'Conectando...' : 'Conectar'}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
