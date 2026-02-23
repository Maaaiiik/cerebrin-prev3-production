/**
 * SetupDebugger — Herramienta de desarrollo para testear onboarding
 * Solo visible en desarrollo
 */

import React from 'react';
import { Button } from '../ui/button';
import { resetOnboarding, isOnboardingCompleted } from '../../services/onboarding';
import { RefreshCw, Check, X } from 'lucide-react';

export function SetupDebugger() {
  const [completed, setCompleted] = React.useState(isOnboardingCompleted());

  const handleReset = () => {
    if (confirm('¿Resetear onboarding? Esto te llevará al wizard de nuevo.')) {
      resetOnboarding();
      window.location.reload();
    }
  };

  const handleRefresh = () => {
    setCompleted(isOnboardingCompleted());
  };

  // Solo en desarrollo
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-20 right-4 bg-card border border-border rounded-lg p-3 shadow-lg z-50 text-xs space-y-2">
      <div className="font-semibold text-muted-foreground flex items-center gap-2">
        🛠️ Setup Debugger
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Estado:</span>
        {completed ? (
          <span className="flex items-center gap-1 text-green-500">
            <Check className="w-3 h-3" />
            Completado
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-500">
            <X className="w-3 h-3" />
            Pendiente
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          className="text-xs h-7"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleReset}
          className="text-xs h-7"
        >
          Reset Onboarding
        </Button>
      </div>
    </div>
  );
}
