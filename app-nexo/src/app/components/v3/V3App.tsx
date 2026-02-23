import { useState, useEffect } from 'react';
import { V3Dashboard } from './V3Dashboard';
import { SetupWizard } from '../setup/SetupWizard';
import { V3Cockpit } from './V3Cockpit';
import { V3Settings } from './V3Settings';
import { V3Navigation } from './V3Navigation';
import { QuickActionsScreen } from '../../screens/QuickActionsScreen';
import { ActivityTimelineScreen } from '../../screens/ActivityTimelineScreen';
import { IntegrationsScreen } from '../../screens/IntegrationsScreen';
import { isOnboardingCompleted } from '../../services/onboarding';
import { Toaster } from 'sonner';

type V3Section = 'dashboard' | 'cockpit' | 'settings' | 'quick-actions' | 'activity' | 'integrations';

export function V3App() {
  const [activeSection, setActiveSection] = useState<V3Section>('dashboard');
  const [showSetup, setShowSetup] = useState(() => !isOnboardingCompleted());

  useEffect(() => {
    const completed = isOnboardingCompleted();
    setShowSetup(!completed);
  }, []);

  const handleSetupComplete = () => {
    setShowSetup(false);
    setActiveSection('dashboard');
  };

  // Mostrar onboarding si no está completado
  if (showSetup) {
    return (
      <div>
        <SetupWizard 
          onComplete={handleSetupComplete}
          onAcademicMode={() => {
            // En v3 no manejamos academic mode por ahora
            setShowSetup(false);
            setActiveSection('dashboard');
          }}
        />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // Renderizar contenido principal con navegación
  return (
    <div>
      {/* Navigation - Solo mostrar en secciones que NO tienen su propio layout completo */}
      {activeSection !== 'dashboard' && activeSection !== 'settings' && (
        <V3Navigation 
          currentView={activeSection}
          onNavigate={setActiveSection}
        />
      )}

      {/* Content */}
      {activeSection === 'dashboard' && (
        <V3Dashboard 
          onNavigate={(section) => {
            if (section === 'cockpit') {
              setActiveSection('cockpit');
            } else if (section === 'settings') {
              setActiveSection('settings');
            } else if (section === 'integrations') {
              setActiveSection('integrations');
            }
          }}
        />
      )}

      {activeSection === 'cockpit' && (
        <V3Cockpit onBack={() => setActiveSection('dashboard')} />
      )}

      {activeSection === 'settings' && (
        <V3Settings onNavigate={(section) => {
          if (section === 'integrations') {
            setActiveSection('integrations');
          }
        }} />
      )}

      {activeSection === 'quick-actions' && (
        <QuickActionsScreen onBack={() => setActiveSection('dashboard')} />
      )}

      {activeSection === 'activity' && (
        <ActivityTimelineScreen onBack={() => setActiveSection('dashboard')} />
      )}

      {activeSection === 'integrations' && (
        <IntegrationsScreen onBack={() => setActiveSection('settings')} />
      )}

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
