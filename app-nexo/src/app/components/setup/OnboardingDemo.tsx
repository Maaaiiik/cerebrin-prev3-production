/**
 * OnboardingDemo — Componente para probar el nuevo onboarding v3.0
 * 
 * Uso:
 * - Importar en App.tsx temporalmente
 * - Cambiar activeSection a "onboarding-demo" para ver
 */

import React, { useState } from 'react';
import { SetupWizardV3 } from './SetupWizardV3';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { resetOnboarding, getCurrentSession, isOnboardingCompleted } from '../../services/onboardingV3';

export function OnboardingDemo() {
  const [showWizard, setShowWizard] = useState(true);
  const [completedData, setCompletedData] = useState<any>(null);

  const handleComplete = (redirectTo: string) => {
    console.log('✅ Onboarding completado! Redirect a:', redirectTo);
    setShowWizard(false);
    setCompletedData({ 
      redirectTo, 
      completedAt: new Date().toISOString(),
      message: `En producción, el usuario sería redirigido a: ${redirectTo}`
    });
  };

  const handleReset = () => {
    resetOnboarding();
    setShowWizard(true);
    setCompletedData(null);
    window.location.reload();
  };

  const debugInfo = {
    isCompleted: isOnboardingCompleted(),
    currentSession: getCurrentSession(),
  };

  if (!showWizard && completedData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">✅</div>
            <h1 className="text-3xl font-bold">¡Onboarding Completado!</h1>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {completedData.message}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                <span className="text-sm">🎯 Redirect:</span>
                <code className="text-sm font-mono text-violet-600">{completedData.redirectTo}</code>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Debug Info:</h3>
            <pre className="text-xs bg-background p-4 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          <div className="flex justify-center gap-3">
            <Button 
              onClick={handleReset} 
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Probar de nuevo
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              className="gap-2 bg-violet-600 hover:bg-violet-500"
            >
              Ir al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SetupWizardV3 
        onComplete={handleComplete}
        onAcademicMode={() => {
          console.log('👉 Usuario eligió modo académico (estudiante)');
          alert('Modo académico: En v3.0 esto redirige a un onboarding específico para estudiantes');
        }}
      />
      
      {/* Debug panel (floating) */}
      <div className="fixed bottom-4 left-4 bg-background border rounded-lg p-4 shadow-xl max-w-sm z-50">
        <div className="text-xs space-y-2">
          <h4 className="font-semibold">🔧 Debug Panel</h4>
          <div>
            <strong>Modo:</strong> {import.meta.env.VITE_USE_MOCK_DATA !== 'false' ? 'Mock' : 'Real API'}
          </div>
          <div>
            <strong>Completado:</strong> {debugInfo.isCompleted ? 'Sí' : 'No'}
          </div>
          <div>
            <strong>Step actual:</strong> {debugInfo.currentSession?.current_step ?? 'N/A'}
          </div>
          <Button size="sm" variant="outline" onClick={handleReset} className="w-full mt-2">
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
