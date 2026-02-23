/**
 * SetupWizardV3 — Onboarding simplificado para v3.0
 * 
 * 🎯 TESTING ACTIVO:
 * Este componente se muestra automáticamente al cargar la app.
 * 
 * Flujo (5 pasos):
 * 0. Bienvenida con typing animation
 * 1. Selección de perfil (Vendedor, Estudiante, Freelancer)
 * 2. Tipo de trabajo (Solo/Equipo)
 * 3. Nivel de autonomía (Observer, Operator, Executor)
 * 4. Loading (2.5s)
 * 5. Preview del agente → Confetti
 * 
 * Para resetear:
 * - Click en [Reset] en el debug panel (esquina inferior izquierda)
 * - O en consola: localStorage.clear(); location.reload();
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, BookOpen, Users, Briefcase } from 'lucide-react';
import { Button } from '../ui/button';
import { CerebrinLogo } from '../shared/CerebrinLogo';
import { AgentProfileBuilder } from './AgentProfileBuilder';
import { OnboardingConfetti } from './OnboardingConfetti';

interface SetupWizardV3Props {
  onComplete: (redirectTo: string) => void;
  onAcademicMode?: () => void;
}

type Step = 0 | 1 | 2 | 3 | 4 | 5;

// Mapeo: Frontend → Backend
type ProfileType = 'vendedor' | 'estudiante' | 'freelancer';
type AutonomyLevel = 'observer' | 'operator' | 'executor';

interface OnboardingData {
  profile_type: ProfileType;
  team_type: 'solo' | 'team';
  autonomy_level: AutonomyLevel;
  agent_name: string;
  pain_points: string[];
}

const PROFILES = [
  {
    id: 'vendedor' as ProfileType,
    emoji: '💼',
    label: 'Vendedor / Comercial',
    description: 'Cotizaciones, seguimientos, reportes',
    pain_points: ['Cotizaciones manuales', 'Seguimiento a clientes', 'Reportes semanales'],
  },
  {
    id: 'estudiante' as ProfileType,
    emoji: '📚',
    label: 'Estudiante',
    description: 'Organizar ramos, tareas, evaluaciones',
    pain_points: ['Organizar horario', 'Recordar evaluaciones', 'Gestionar documentos'],
  },
  {
    id: 'freelancer' as ProfileType,
    emoji: '🎨',
    label: 'Freelancer',
    description: 'Proyectos, propuestas, facturación',
    pain_points: ['Gestionar proyectos', 'Propuestas rápidas', 'Tracking de tiempo'],
  },
];

const AUTONOMY_LEVELS = [
  {
    id: 'observer' as AutonomyLevel,
    emoji: '🎯',
    label: 'Yo quiero decidir todo',
    description: 'El agente me muestra opciones y yo apruebo cada paso. Máximo control.',
    backend_value: {
      maturity_mode: 'observer',
      hitl_level: 'full_manual',
    },
  },
  {
    id: 'operator' as AutonomyLevel,
    emoji: '🔄',
    label: 'Equilibrado',
    badge: 'Recomendado',
    description: 'El agente me pide aprobación solo para acciones importantes. El resto va solo.',
    backend_value: {
      maturity_mode: 'operator',
      hitl_level: 'plan_only',
    },
  },
  {
    id: 'executor' as AutonomyLevel,
    emoji: '⚡',
    label: 'Que trabaje solo, solo avísame',
    description: 'El agente trabaja en background y me muestra el resultado cuando termina.',
    backend_value: {
      maturity_mode: 'executor',
      hitl_level: 'autonomous',
    },
  },
];

export function SetupWizardV3({ onComplete, onAcademicMode }: SetupWizardV3Props) {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Log de bienvenida
  useEffect(() => {
    console.log('🧠 Cerebrin Onboarding V3.0 cargado');
    console.log('📊 Modo:', import.meta.env.VITE_USE_MOCK_DATA !== 'false' ? 'Mock' : 'Real API');
  }, []);

  // Respuestas del usuario
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [teamType, setTeamType] = useState<'solo' | 'team' | null>(null);
  const [autonomy, setAutonomy] = useState<AutonomyLevel | null>(null);
  const [agentName, setAgentName] = useState('');

  // Handler para el shortcut de "Soy estudiante"
  const handleStudentShortcut = () => {
    setProfile('estudiante');
    setCurrentStep(1); // Ir a Step1 con estudiante pre-seleccionado
  };

  // Agente creado
  const [createdAgent, setCreatedAgent] = useState<any>(null);

  // Typing animation
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // ─── Typing animation effect ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isTyping) return;

    const messages: Record<Step, string[]> = {
      0: [
        '¡Hola! Soy Cerebrin 🧠',
        'Voy a crear tu asistente de IA personalizado en menos de 3 minutos.',
        '¿Empezamos?',
      ],
      1: [],
      2: [],
      3: [],
      4: [
        'Perfecto. Estoy creando tu asistente...',
      ],
      5: [],
    };

    const texts = messages[currentStep];
    if (!texts || texts.length === 0) {
      setIsTyping(false);
      return;
    }

    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let accumulated = '';

    const interval = setInterval(() => {
      if (currentTextIndex >= texts.length) {
        setIsTyping(false);
        clearInterval(interval);
        return;
      }

      const currentText = texts[currentTextIndex];
      
      if (currentCharIndex < currentText.length) {
        accumulated += currentText[currentCharIndex];
        setTypingText(accumulated);
        currentCharIndex++;
      } else {
        setTimeout(() => {
          accumulated += '\n\n';
          setTypingText(accumulated);
          currentTextIndex++;
          currentCharIndex = 0;
        }, 600);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [currentStep, isTyping]);

  // Auto-start typing en step 0
  useEffect(() => {
    if (currentStep === 0) {
      setIsTyping(true);
    }
  }, [currentStep]);

  // ─── Backend API calls ───────────────────────────────────────────────────────

  const createAgentInBackend = async () => {
    if (!profile || !autonomy) {
      throw new Error('Faltan datos del perfil o autonomía');
    }

    // TODO: Reemplazar con llamada real al backend
    // POST /api/onboarding/:session_id/complete
    const response = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_type: profile,
        team_type: teamType || 'solo',
        autonomy_level: autonomy,
        agent_name: agentName || `Mi Asistente ${profile}`,
      }),
    });

    if (!response.ok) {
      throw new Error('Error al crear el agente');
    }

    return response.json();
  };

  // ─── Navigation handlers ─────────────────────────────────────────────────────

  const handleNext = () => {
    setCurrentStep((currentStep + 1) as Step);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleCreateAgent = async () => {
    try {
      setIsLoading(true);
      setCurrentStep(4); // Loading step
      setIsTyping(true);

      // Simular delay de creación (2.5s)
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Llamada real al backend
      const result = await createAgentInBackend();
      
      setCreatedAgent(result);
      setCurrentStep(5); // Preview step
      setIsLoading(false);
    } catch (err) {
      console.error('Error creating agent:', err);
      setError('Error al crear el asistente. Intenta de nuevo.');
      setIsLoading(false);
      setCurrentStep(3); // Volver a autonomía
    }
  };

  const handleFinish = () => {
    setShowConfetti(true);
    setTimeout(() => {
      // Redirigir según perfil
      const redirectMap: Record<ProfileType, string> = {
        vendedor: '/cockpit',
        estudiante: '/academic',
        freelancer: '/cockpit',
      };
      onComplete(redirectMap[profile!] || '/cockpit');
    }, 2000);
  };

  const handleSkip = () => {
    if (confirm('¿Estás seguro? Podrás configurar tu agente más tarde desde Configuración.')) {
      onComplete('/cockpit');
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <Step0Welcome 
              typingText={typingText}
              isTyping={isTyping}
              onNext={handleNext}
              onAcademicMode={handleStudentShortcut}
            />
          )}
          
          {currentStep === 1 && (
            <Step1Profile
              selectedProfile={profile}
              onNext={(selectedProfile) => {
                setProfile(selectedProfile);
                handleNext();
              }}
              onBack={handleBack}
            />
          )}

          {currentStep === 2 && (
            <Step2TeamType
              selectedTeam={teamType}
              onNext={(team) => {
                setTeamType(team);
                handleNext();
              }}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <Step3Autonomy
              selectedAutonomy={autonomy}
              onNext={(level) => {
                setAutonomy(level);
                // Auto-advance a creación
                setTimeout(() => handleCreateAgent(), 500);
              }}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <Step4Loading typingText={typingText} />
          )}

          {currentStep === 5 && createdAgent && (
            <Step5Preview
              agent={createdAgent}
              profile={profile!}
              onConfirm={handleFinish}
              onBack={() => setCurrentStep(1)}
            />
          )}
        </AnimatePresence>

        {/* Skip button */}
        {currentStep > 0 && currentStep < 4 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={handleSkip}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Quiero configurarlo yo mismo →
          </motion.button>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2 text-sm text-destructive max-w-md text-center"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Confetti */}
      {showConfetti && <OnboardingConfetti />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Step 0: Welcome ─────────────────────────────────────────────────────────

function Step0Welcome({ 
  typingText, 
  isTyping, 
  onNext, 
  onAcademicMode 
}: { 
  typingText: string; 
  isTyping: boolean; 
  onNext: () => void; 
  onAcademicMode?: () => void;
}) {
  return (
    <motion.div
      key="step0"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-6"
    >
      {/* Logo */}
      <div className="flex justify-center">
        <CerebrinLogo size={100} animated={true} />
      </div>

      {/* Typing text */}
      <div className="min-h-[80px] flex flex-col items-center justify-center">
        <p className="text-lg text-foreground/90 max-w-md mx-auto leading-normal whitespace-pre-line">
          {typingText.split(/\n+/)[0]}
          {isTyping && <span className="animate-pulse">|</span>}
        </p>
      </div>

      {/* Buttons */}
      <AnimatePresence>
        {!isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-2"
          >
            <Button
              size="lg"
              onClick={onNext}
              className="bg-violet-600 hover:bg-violet-500 text-white px-8 shadow-lg shadow-violet-500/30"
            >
              ¡Empecemos!
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>

            {onAcademicMode && (
              <div className="text-center">
                <button
                  onClick={onAcademicMode}
                  className="text-sm text-muted-foreground hover:text-violet-600 transition-colors underline"
                >
                  Soy estudiante 📚
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Step 1: Perfil ──────────────────────────────────────────────────────────

function Step1Profile({ 
  selectedProfile, 
  onNext, 
  onBack 
}: { 
  selectedProfile: ProfileType | null; 
  onNext: (profile: ProfileType) => void; 
  onBack: () => void;
}) {
  const [profile, setProfile] = useState<ProfileType | null>(selectedProfile);

  const handleNext = () => {
    if (profile) {
      onNext(profile);
    }
  };

  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">¿Qué describe mejor tu trabajo?</h2>
        <p className="text-sm text-muted-foreground">Elegiremos las herramientas ideales para ti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => setProfile(p.id)}
            className={`
              p-6 rounded-xl border-2 transition-all text-center space-y-2 hover:scale-105
              ${profile === p.id
                ? 'border-violet-500 bg-violet-500/10 scale-105 shadow-lg shadow-violet-500/20'
                : 'border-border hover:border-violet-500/50 bg-card'
              }
            `}
          >
            <div className="text-4xl">{p.emoji}</div>
            <div className="font-semibold text-sm">{p.label}</div>
            <div className="text-xs text-muted-foreground">{p.description}</div>
          </button>
        ))}
      </div>

      {/* Pain points preview */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-muted/50 rounded-lg p-4 space-y-2"
        >
          <p className="text-xs text-muted-foreground font-semibold">Tu asistente te ayudará con:</p>
          <div className="space-y-1">
            {PROFILES.find(p => p.id === profile)?.pain_points.map((pain, i) => (
              <div key={i} className="text-sm text-foreground/80 flex items-center gap-2">
                <span className="text-violet-500">✓</span> {pain}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        <Button
          onClick={handleNext}
          disabled={!profile}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Siguiente
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Tipo de trabajo ────────────────────────────────────────────────

function Step2TeamType({ 
  selectedTeam, 
  onNext, 
  onBack 
}: { 
  selectedTeam: 'solo' | 'team' | null; 
  onNext: (team: 'solo' | 'team') => void; 
  onBack: () => void;
}) {
  const [team, setTeam] = useState<'solo' | 'team' | null>(selectedTeam);

  const handleNext = () => {
    if (team) {
      onNext(team);
    }
  };

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">¿Trabajas solo/a o en equipo?</h2>
        <p className="text-sm text-muted-foreground">Esto nos ayuda a configurar permisos y colaboración</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setTeam('solo')}
          className={`
            p-8 rounded-xl border-2 transition-all text-center space-y-3 hover:scale-105
            ${team === 'solo'
              ? 'border-violet-500 bg-violet-500/10 scale-105 shadow-lg shadow-violet-500/20'
              : 'border-border hover:border-violet-500/50 bg-card'
            }
          `}
        >
          <div className="text-5xl">🧍</div>
          <div>
            <div className="font-semibold">Solo/a</div>
            <div className="text-xs text-muted-foreground mt-1">
              Soy freelancer, estudiante o profesional independiente
            </div>
          </div>
        </button>

        <button
          onClick={() => setTeam('team')}
          className={`
            p-8 rounded-xl border-2 transition-all text-center space-y-3 hover:scale-105
            ${team === 'team'
              ? 'border-violet-500 bg-violet-500/10 scale-105 shadow-lg shadow-violet-500/20'
              : 'border-border hover:border-violet-500/50 bg-card'
            }
          `}
        >
          <div className="text-5xl">👥</div>
          <div>
            <div className="font-semibold">En equipo</div>
            <div className="text-xs text-muted-foreground mt-1">
              Trabajo con colegas o reporto a alguien
            </div>
          </div>
        </button>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        <Button
          onClick={handleNext}
          disabled={!team}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Siguiente
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 3: Autonomía ───────────────────────────────────────────────────────

function Step3Autonomy({ 
  selectedAutonomy, 
  onNext, 
  onBack 
}: { 
  selectedAutonomy: AutonomyLevel | null; 
  onNext: (level: AutonomyLevel) => void; 
  onBack: () => void;
}) {
  const [autonomy, setAutonomy] = useState<AutonomyLevel | null>(selectedAutonomy);

  const handleNext = () => {
    if (autonomy) {
      onNext(autonomy);
    }
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">¿Cómo prefieres trabajar con tu asistente?</h2>
        <p className="text-sm text-muted-foreground">Puedes cambiar esto en cualquier momento</p>
      </div>

      <div className="space-y-3">
        {AUTONOMY_LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => setAutonomy(level.id)}
            className={`
              w-full p-5 rounded-xl border-2 transition-all text-left space-y-1 hover:scale-[1.02]
              ${autonomy === level.id
                ? 'border-violet-500 bg-violet-500/10 scale-[1.02] shadow-lg shadow-violet-500/20'
                : 'border-border hover:border-violet-500/50 bg-card'
              }
            `}
          >
            <div className="font-semibold flex items-center gap-2">
              <span>{level.emoji}</span>
              {level.label}
              {level.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                  {level.badge}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground pl-6">
              {level.description}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        <Button
          onClick={handleNext}
          disabled={!autonomy}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Crear mi asistente
          <Sparkles className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 4: Loading ─────────────────────────────────────────────────────────

function Step4Loading({ typingText }: { typingText: string }) {
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50); // 2.5 seconds total

    // Progress messages
    const timeouts = [
      setTimeout(() => setMessages((m) => [...m, '✅ Creando agente personalizado']), 500),
      setTimeout(() => setMessages((m) => [...m, '✅ Configurando nivel de autonomía']), 1200),
      setTimeout(() => setMessages((m) => [...m, '✅ Activando plantillas y workflows']), 1900),
      setTimeout(() => setMessages((m) => [...m, '✅ Tu asistente está listo']), 2400),
    ];

    return () => {
      clearInterval(interval);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center space-y-8"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600"
      >
        <Sparkles className="w-10 h-10 text-white animate-pulse" />
      </motion.div>

      <div className="space-y-3">
        <p className="text-lg text-foreground/90">{typingText}</p>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-2 min-h-[120px]">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-muted-foreground"
          >
            {msg}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Step 5: Preview ─────────────────────────────────────────────────────────

function Step5Preview({ 
  agent, 
  profile,
  onConfirm, 
  onBack 
}: { 
  agent: any;
  profile: ProfileType;
  onConfirm: () => void; 
  onBack: () => void;
}) {
  const profileData = PROFILES.find(p => p.id === profile);

  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">✨ Tu asistente está listo</h2>
        <p className="text-sm text-muted-foreground">Esto es lo que he configurado para ti</p>
      </div>

      {/* Agent card */}
      <div className="bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-background border-2 border-violet-500/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl">
            {profileData?.emoji}
          </div>
          <div>
            <h3 className="font-bold text-lg">{agent.name || `Mi Asistente ${profileData?.label}`}</h3>
            <p className="text-sm text-muted-foreground">{profileData?.description}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-violet-500">✓</span>
            <span>Modo: <strong>{agent.maturity_mode || 'Equilibrado'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-violet-500">✓</span>
            <span>Plantillas activadas: <strong>{profileData?.pain_points.length}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-violet-500">✓</span>
            <span>Workflows configurados: <strong>Listos</strong></span>
          </div>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Próximos pasos:</p>
        <div className="space-y-1 text-sm">
          <div>1. Conecta Google Drive para que lea tus documentos</div>
          <div>2. Prueba a pedirle: "{profileData?.pain_points[0]}"</div>
          <div>3. Personaliza tu asistente en Configuración</div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onBack}>
          Ajustar algo antes
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-violet-600 hover:bg-violet-500"
        >
          ¡Comenzar a trabajar!
          <Sparkles className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
