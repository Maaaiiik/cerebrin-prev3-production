import { useEffect, useState } from "react";
import { ModalShowcase } from "./components/modals/ModalShowcase";
import { SettingsHub, type SettingsView } from "./components/settings/SettingsHub";
import { ProjectEngine } from "./components/projects/ProjectEngine";
import { StrategyLab } from "./components/incubadora/StrategyLab";
import { TemplateStudio } from "./components/studio/TemplateStudio";
import { AgentMarketplace } from "./components/settings/AgentMarketplace";
import { DocumentManager } from "./components/documents/DocumentManager";
import { CommandPalette } from "./components/cockpit/CommandPalette";
import { Sidebar } from "./components/cockpit/Sidebar";
import { TopNav } from "./components/cockpit/TopNav";
import { MyTasksScreen } from "./components/tasks/MyTasksScreen";
import { AppPreferencesProvider } from "./contexts/AppPreferences";
import { PlanProvider, usePlanFeatures } from "./contexts/PlanContext";
import { UserPerspectiveProvider, useUserPerspective } from "./contexts/UserPerspective";
import { FeatureFlagsProvider } from "./contexts/FeatureFlags";
import { OnboardingTutorial } from "./components/shared/OnboardingTutorial";
import { NexoAdminCenter } from "./components/admin/NexoAdminCenter";
import { CockpitCanvas } from "./components/cockpit/CockpitCanvas";
import { SwarmOnboarding } from "./components/cockpit/SwarmOnboarding";
import { PerspectiveDebug } from "./components/shared/PerspectiveDebug";
import { SetupWizard } from "./components/setup/SetupWizard";
import { SetupDebugger } from "./components/setup/SetupDebugger";
import { AcademicOnboarding } from "./components/setup/AcademicOnboarding";
import { AcademicDashboard } from "./components/academic/AcademicDashboard";
import { OnboardingDemo } from "./components/setup/OnboardingDemo";
import { TestingBanner } from "./components/setup/TestingBanner";
import { OnboardingDashboard } from "./components/dashboard/OnboardingDashboard";
import { V3App } from "./components/v3/V3App";
import { VersionToggle } from "./components/shared/VersionToggle";
import { isOnboardingCompleted } from "./services/onboarding";
import type { AcademicWorkspace } from "./services/academic";
import { BookOpen } from "lucide-react";
import { Toaster } from "sonner";

type Version = 'v3' | 'full';

function AppInner() {
  // Version toggle: v3 o Full Beta
  const [version, setVersion] = useState<Version>(() => {
    const saved = localStorage.getItem('cerebrin_version_mode');
    return (saved === 'v3' || saved === 'full') ? saved : 'v3';
  });

  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("cockpit");
  const [settingsView, setSettingsView] = useState<SettingsView>("agents");
  const [swarmOnboardingOpen, setSwarmOnboardingOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(() => {
    return localStorage.getItem("cerebrin_tutorial_seen") !== "true";
  });
  const [showSetup, setShowSetup] = useState(() => !isOnboardingCompleted());
  const [showAcademicOnboarding, setShowAcademicOnboarding] = useState(false);
  const [academicWorkspace, setAcademicWorkspace] = useState<AcademicWorkspace | null>(null);
  const [showOnboardingDashboard, setShowOnboardingDashboard] = useState(false);

  const { tier } = usePlanFeatures();
  const { profile } = useUserPerspective();

  // Guardar preferencia de versión
  const handleVersionChange = (newVersion: Version) => {
    setVersion(newVersion);
    localStorage.setItem('cerebrin_version_mode', newVersion);
  };

  // Check if onboarding is completed
  useEffect(() => {
    const completed = isOnboardingCompleted();
    setShowSetup(!completed);
  }, []);

  // Set initial view and redirect when perspective changes
  useEffect(() => {
    const defaultView = profile.ui.default_view || "cockpit";
    setActiveSection(defaultView);
  }, [profile.ui.default_view]);

  // Auto-open Swarm Onboarding when tier is Enterprise for the first time
  useEffect(() => {
    if (tier === "Enterprise") {
      const seen = localStorage.getItem("cerebrin_swarm_onboarding_seen");
      if (!seen) {
        setTimeout(() => setSwarmOnboardingOpen(true), 800);
      }
    }
  }, [tier]);

  const handleNavigate = (section: string, view?: SettingsView) => {
    setActiveSection(section);
    if (view) setSettingsView(view);
  };

  const handleTutorialClose = () => {
    setTutorialOpen(false);
    localStorage.setItem("cerebrin_tutorial_seen", "true");
  };

  const handleTutorialOpen = () => setTutorialOpen(true);

  const handleSwarmOnboardingClose = () => {
    setSwarmOnboardingOpen(false);
    localStorage.setItem("cerebrin_swarm_onboarding_seen", "true");
  };

  // ══════════════════════════════════════════════════════════════
  // V3 MODE - Versión aislada para personas naturales
  // ══════════════════════════════════════════════════════════════
  if (version === 'v3') {
    return (
      <div>
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <V3App />
      </div>
    );
  }

  // Global shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCommandOpen((p) => !p); }
      if ((e.metaKey || e.ctrlKey) && e.key === "o") { e.preventDefault(); setActiveSection("onboarding-v3"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); setShowOnboardingDashboard(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === "1") { e.preventDefault(); setActiveSection("cockpit"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "2") { e.preventDefault(); setActiveSection("tasks"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "3") { e.preventDefault(); setActiveSection("projects"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "4") { e.preventDefault(); setActiveSection("incubadora"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "5") { e.preventDefault(); setActiveSection("modals"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "6") { e.preventDefault(); setActiveSection("settings"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "7") { e.preventDefault(); setActiveSection("studio"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "8") { e.preventDefault(); setActiveSection("admin"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "9") { e.preventDefault(); setActiveSection("marketplace"); }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") { e.preventDefault(); setActiveSection("documents"); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSetupComplete = (redirectTo: string) => {
    setShowSetup(false);
    // Mostrar OnboardingDashboard después de completar el setup
    setShowOnboardingDashboard(true);
  };

  const handleAcademicOnboardingComplete = (workspace: AcademicWorkspace) => {
    setAcademicWorkspace(workspace);
    setShowAcademicOnboarding(false);
    setActiveSection('academic');
  };

  // ── Floating tutorial button
  const TutorialButton = () => (
    <button
      onClick={handleTutorialOpen}
      title="Abrir tutorial"
      className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-50 flex items-center gap-2 px-3 py-2 md:px-3.5 md:py-2.5 rounded-2xl bg-violet-600/90 hover:bg-violet-500 text-white text-xs shadow-xl shadow-violet-500/30 transition-all duration-200 hover:scale-105 active:scale-95 border border-violet-400/20"
      style={{ fontWeight: 600 }}
    >
      <BookOpen className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Tutorial</span>
    </button>
  );

  // ══════════════════════════════════════════════════════════════
  // FULL BETA MODE - Sistema completo con todas las features
  // ══════════════════════════════════════════════════════════════

  // ── Setup/Onboarding (first time)
  if (showSetup) {
    return (
      <div>
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <SetupWizard 
          onComplete={handleSetupComplete}
          onAcademicMode={() => {
            setShowSetup(false);
            setShowAcademicOnboarding(true);
          }}
        />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // ── Academic Onboarding
  if (showAcademicOnboarding) {
    return (
      <div>
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <AcademicOnboarding 
          onComplete={handleAcademicOnboardingComplete}
          onBack={() => {
            setShowAcademicOnboarding(false);
            setShowSetup(true);
          }}
        />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // ── Academic Dashboard
  if (activeSection === 'academic' && academicWorkspace) {
    return (
      <div>
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <AcademicDashboard workspace={academicWorkspace} />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // ── Onboarding Dashboard (Post-Setup)
  if (showOnboardingDashboard) {
    return (
      <div>
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <OnboardingDashboard 
          onNavigate={(section) => {
            setShowOnboardingDashboard(false);
            setActiveSection(section);
          }} 
        />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // ── Focus Mode: Onboarding V3 Demo (Testing)
  if (activeSection === "onboarding-v3") {
    return (
      <div>
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <OnboardingDemo />
      </div>
    );
  }

  // ── Focus Mode: Settings Hub
  if (activeSection === "settings") {
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-background">
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <SettingsHub initialView={settingsView} onBack={() => setActiveSection("cockpit")} />
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onNavigate={handleNavigate} />
        <TutorialButton />
        <OnboardingTutorial open={tutorialOpen} onClose={handleTutorialClose} onNavigate={handleNavigate} />
        <SwarmOnboarding open={swarmOnboardingOpen} onClose={handleSwarmOnboardingClose} />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // ── Focus Mode: NEXO Admin Center
  if (activeSection === "admin") {
    return (
      <div className="h-screen overflow-hidden flex flex-col">
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <NexoAdminCenter onBack={() => setActiveSection("cockpit")} />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // ── Focus Mode: My Tasks
  if (activeSection === "tasks") {
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-background">
        <VersionToggle version={version} onVersionChange={handleVersionChange} />
        <MyTasksScreen onNavigate={handleNavigate} onOpenCommand={() => setCommandOpen(true)} />
        <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onNavigate={handleNavigate} />
        <TutorialButton />
        <OnboardingTutorial open={tutorialOpen} onClose={handleTutorialClose} onNavigate={handleNavigate} />
        <SwarmOnboarding open={swarmOnboardingOpen} onClose={handleSwarmOnboardingClose} />
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // ── Standard layout
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <VersionToggle version={version} onVersionChange={handleVersionChange} />
      <TopNav
        onOpenCommand={() => setCommandOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
        onNavigate={handleNavigate}
        activeSection={activeSection}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Hidden on mobile by default */}
        <div className={`${sidebarCollapsed ? 'hidden lg:flex' : 'hidden md:flex'}`}>
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((prev) => !prev)}
            activeSection={activeSection}
            onSectionChange={handleNavigate}
          />
        </div>

        <main className="flex-1 min-w-0 overflow-hidden">
          {activeSection === "cockpit"              && <CockpitCanvas />}
          {activeSection === "projects"             && <ProjectEngine />}
          {activeSection === "incubadora"           && <StrategyLab />}
          {activeSection === "studio"               && <TemplateStudio />}
          {activeSection === "modals"               && <ModalShowcase />}
          {activeSection === "marketplace"          && <AgentMarketplace />}
          {activeSection === "documents"            && <DocumentManager />}
          {activeSection === "onboarding-dashboard" && <OnboardingDashboard onNavigate={handleNavigate} />}
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onNavigate={handleNavigate} />
      <TutorialButton />
      <PerspectiveDebug />
      <SetupDebugger />
      <OnboardingTutorial open={tutorialOpen} onClose={handleTutorialClose} onNavigate={handleNavigate} />
      <SwarmOnboarding open={swarmOnboardingOpen} onClose={handleSwarmOnboardingClose} />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default function App() {
  return (
    <AppPreferencesProvider>
      <PlanProvider>
        <FeatureFlagsProvider>
          <UserPerspectiveProvider>
            <AppInner />
          </UserPerspectiveProvider>
        </FeatureFlagsProvider>
      </PlanProvider>
    </AppPreferencesProvider>
  );
}