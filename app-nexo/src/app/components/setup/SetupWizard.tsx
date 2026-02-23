/**
 * SetupWizard — Onboarding guiado con "The Architect"
 * Wizard de 5 pasos que genera agente personalizado
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, ArrowRight, Sparkles, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { CerebrinLogo } from '../shared/CerebrinLogo';
import { AgentProfileBuilder } from './AgentProfileBuilder';
import { OnboardingConfetti } from './OnboardingConfetti';
import {
  startOnboarding,
  saveOnboardingProgress,
  confirmOnboarding,
  resumeOnboarding,
  type OnboardingAnswers,
} from '../../services/onboarding';

interface SetupWizardProps {
  onComplete: (redirectTo: string) => void;
  onAcademicMode?: () => void;
}

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const BORING_TASKS = [
  { id: 'cotizaciones', label: '📋 Cotizaciones y propuestas manuales' },
  { id: 'informes', label: '📊 Informes y reportes recurrentes' },
  { id: 'agenda', label: '📅 Gestión de agenda y reuniones' },
  { id: 'investigar', label: '🔍 Buscar información o investigar temas' },
  { id: 'emails', label: '📧 Responder emails repetitivos' },
  { id: 'apuntes', label: '📝 Tomar apuntes y documentar procesos' },
];

const TEAM_AREAS = [
  { id: 'ventas', label: 'Ventas / Comercial' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'operaciones', label: 'Operaciones' },
  { id: 'soporte', label: 'Soporte/Atención al cliente' },
  { id: 'tech', label: 'Desarrollo/Tech' },
  { id: 'finanzas', label: 'Administración / Finanzas' },
  { id: 'educacion', label: 'Educación' },
  { id: 'otro', label: 'Otro' },
];

export function SetupWizard({ onComplete, onAcademicMode }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [agentConfig, setAgentConfig] = useState<any>(null);

  // Typing animation state
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Intentar retomar sesión al montar
  useEffect(() => {
    async function tryResume() {
      try {
        const session = await resumeOnboarding('mock-user-123');
        if (session && !session.completed) {
          setSessionId(session.session_id);
          setCurrentStep(session.step_number as Step);
          setAnswers(session.answers);
        } else {
          // Iniciar nueva sesión
          const newSession = await startOnboarding('mock-user-123', 'mock-workspace-123');
          setSessionId(newSession.session_id);
        }
      } catch (err) {
        console.error('Error resuming onboarding:', err);
        setError('Error al cargar el onboarding');
      }
    }
    tryResume();
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!isTyping) return;

    const messages: Record<Step, string[]> = {
      0: [
        '¡Hola! Soy Cerebrin 🧠',
        'Voy a crear tu asistente de IA personalizado en menos de 5 minutos.',
        'Solo necesito hacerte 4 preguntas. ¿Empezamos?',
      ],
      1: [],
      2: [],
      3: [],
      4: [
        'Perfecto. Estoy diseñando tu asistente...',
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
        // Pausa entre mensajes
        setTimeout(() => {
          accumulated += '\n\n';
          setTypingText(accumulated);
          currentTextIndex++;
          currentCharIndex = 0;
        }, 600);
      }
    }, 20); // 20ms por carácter

    return () => clearInterval(interval);
  }, [currentStep, isTyping]);

  // Auto-start typing en step 0
  useEffect(() => {
    if (currentStep === 0) {
      setIsTyping(true);
    }
  }, [currentStep]);

  const handleNext = async (stepAnswers: Partial<OnboardingAnswers>) => {
    const newAnswers = { ...answers, ...stepAnswers };
    setAnswers(newAnswers);

    try {
      setIsLoading(true);
      await saveOnboardingProgress(sessionId, currentStep + 1, newAnswers);
      setCurrentStep((currentStep + 1) as Step);
      setIsLoading(false);
    } catch (err) {
      console.error('Error saving progress:', err);
      setError('Error al guardar el progreso');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setCurrentStep(4); // Paso de carga
      setIsTyping(true);

      // Simular generación (mensajes de progreso)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const result = await confirmOnboarding(sessionId);
      
      setAgentConfig({
        name: result.agent_name,
        mode: answers.control_preference === 'equilibrado' ? 'Equilibrado' : 'Manual',
        specialty: answers.team_area || 'General',
        first_skill: answers.boring_tasks?.[0] || 'Asistencia general',
      });

      setCurrentStep(5); // Paso de preview
      setIsLoading(false);
    } catch (err) {
      console.error('Error confirming onboarding:', err);
      setError('Error al crear el asistente');
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    setShowConfetti(true);
    setTimeout(() => {
      onComplete('/cockpit');
    }, 2000);
  };

  const handleSkip = () => {
    if (confirm('¿Estás seguro? Podrás configurar tu agente más tarde desde Configuración.')) {
      onComplete('/cockpit');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
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
              onNext={() => setCurrentStep(1)}
              onAcademicMode={onAcademicMode}
            />
          )}
          
          {currentStep === 1 && (
            <Step1BoringTasks
              selectedTasks={answers.boring_tasks || []}
              onNext={(tasks) => handleNext({ boring_tasks: tasks })}
              onBack={handleBack}
            />
          )}

          {currentStep === 2 && (
            <Step2WorkMode
              workMode={answers.work_mode}
              teamArea={answers.team_area}
              onNext={(workMode, teamArea) => handleNext({ work_mode: workMode, team_area: teamArea })}
              onBack={handleBack}
            />
          )}

          {currentStep === 3 && (
            <Step3ControlPreference
              preference={answers.control_preference}
              onNext={(pref) => {
                handleNext({ control_preference: pref });
                // Auto-advance a preview después de guardar
                setTimeout(() => handleConfirm(), 500);
              }}
              onBack={handleBack}
            />
          )}

          {currentStep === 4 && (
            <Step4Loading typingText={typingText} />
          )}

          {currentStep === 5 && agentConfig && (
            <Step5Preview
              agentConfig={agentConfig}
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
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Quiero configurarlo yo mismo →
          </motion.button>
        )}

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2 text-sm text-destructive"
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

// ─── Step 0: Welcome ───────────────────────────────────────────────────────────

function Step0Welcome({ typingText, isTyping, onNext, onAcademicMode }: { typingText: string; isTyping: boolean; onNext: () => void; onAcademicMode?: () => void }) {
  return (
    <motion.div
      key="step0"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="text-center space-y-6"
    >
      {/* Logo Cerebrin */}
      <div className="flex justify-center">
        <CerebrinLogo size={100} animated={true} />
      </div>

      {/* Typing text */}
      <div className="flex flex-col items-center justify-center">
        <p className="text-lg text-foreground/90 max-w-md mx-auto leading-normal">
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
            exit={{ opacity: 0, y: 10 }}
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

// ─── Step 1: Boring Tasks ──────────────────────────────────────────────────────

function Step1BoringTasks({ 
  selectedTasks, 
  onNext, 
  onBack 
}: { 
  selectedTasks: string[]; 
  onNext: (tasks: string[]) => void; 
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(selectedTasks);
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState('');

  const toggleTask = (taskId: string) => {
    if (selected.includes(taskId)) {
      setSelected(selected.filter(id => id !== taskId));
    } else {
      if (selected.length < 2) {
        setSelected([...selected, taskId]);
      }
    }
  };

  const handleNext = () => {
    const finalTasks = showOther && otherText ? [...selected, otherText] : selected;
    if (finalTasks.length > 0) {
      onNext(finalTasks);
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
        <h2 className="text-2xl font-bold">¿Qué tarea te consume más tiempo?</h2>
        <p className="text-sm text-muted-foreground">Elige hasta 2 opciones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BORING_TASKS.map((task) => (
          <button
            key={task.id}
            onClick={() => toggleTask(task.id)}
            disabled={selected.length >= 2 && !selected.includes(task.id)}
            className={`
              p-4 rounded-xl border-2 transition-all text-left
              ${selected.includes(task.id)
                ? 'border-violet-500 bg-violet-500/10 scale-105'
                : 'border-border hover:border-violet-500/50 bg-card'
              }
              ${selected.length >= 2 && !selected.includes(task.id) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-sm">{task.label}</span>
          </button>
        ))}

        {/* Otro */}
        <button
          onClick={() => setShowOther(!showOther)}
          className={`
            p-4 rounded-xl border-2 transition-all text-left
            ${showOther ? 'border-violet-500 bg-violet-500/10' : 'border-border hover:border-violet-500/50 bg-card'}
          `}
        >
          <span className="text-sm">✏️ Otro</span>
        </button>
      </div>

      {showOther && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <input
            type="text"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            placeholder="Describe la tarea..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </motion.div>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        <Button
          onClick={handleNext}
          disabled={selected.length === 0 && !otherText}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Siguiente
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 2: Work Mode ─────────────────────────────────────────────────────────

function Step2WorkMode({
  workMode,
  teamArea,
  onNext,
  onBack,
}: {
  workMode?: 'solo' | 'team';
  teamArea?: string;
  onNext: (mode: 'solo' | 'team', area?: string) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<'solo' | 'team' | null>(workMode || null);
  const [area, setArea] = useState<string | null>(teamArea || null);

  const handleNext = () => {
    if (mode) {
      onNext(mode, area || undefined);
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setMode('solo')}
          className={`
            p-6 rounded-xl border-2 transition-all text-center space-y-2
            ${mode === 'solo'
              ? 'border-violet-500 bg-violet-500/10 scale-105'
              : 'border-border hover:border-violet-500/50 bg-card'
            }
          `}
        >
          <div className="text-3xl">🧍</div>
          <div className="font-semibold">Solo/a</div>
          <div className="text-xs text-muted-foreground">
            Soy freelancer, estudiante o profesional
          </div>
        </button>

        <button
          onClick={() => setMode('team')}
          className={`
            p-6 rounded-xl border-2 transition-all text-center space-y-2
            ${mode === 'team'
              ? 'border-violet-500 bg-violet-500/10 scale-105'
              : 'border-border hover:border-violet-500/50 bg-card'
            }
          `}
        >
          <div className="text-3xl">👥</div>
          <div className="font-semibold">En equipo</div>
          <div className="text-xs text-muted-foreground">
            Tengo colegas o reporto a alguien
          </div>
        </button>
      </div>

      {/* Team area selector */}
      <AnimatePresence>
        {mode === 'team' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <p className="text-sm text-muted-foreground text-center">¿En qué área trabajas?</p>
            <div className="grid grid-cols-2 gap-2">
              {TEAM_AREAS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setArea(a.id)}
                  className={`
                    px-3 py-2 rounded-lg border text-sm transition-all
                    ${area === a.id
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-border hover:border-violet-500/50 bg-card'
                    }
                  `}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        <Button
          onClick={handleNext}
          disabled={!mode || (mode === 'team' && !area)}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Siguiente
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 3: Control Preference ────────────────────────────────────────────────

function Step3ControlPreference({
  preference,
  onNext,
  onBack,
}: {
  preference?: 'manual' | 'equilibrado' | 'autonomo';
  onNext: (pref: 'manual' | 'equilibrado' | 'autonomo') => void;
  onBack: () => void;
}) {
  const [pref, setPref] = useState<'manual' | 'equilibrado' | 'autonomo' | null>(preference || null);

  const handleNext = () => {
    if (pref) {
      onNext(pref);
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
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setPref('manual')}
          className={`
            w-full p-5 rounded-xl border-2 transition-all text-left space-y-1
            ${pref === 'manual'
              ? 'border-violet-500 bg-violet-500/10 scale-105'
              : 'border-border hover:border-violet-500/50 bg-card'
            }
          `}
        >
          <div className="font-semibold flex items-center gap-2">
            🎯 Yo quiero decidir todo
          </div>
          <div className="text-xs text-muted-foreground">
            El agente me muestra opciones y yo apruebo cada paso. Máximo control.
          </div>
        </button>

        <button
          onClick={() => setPref('equilibrado')}
          className={`
            w-full p-5 rounded-xl border-2 transition-all text-left space-y-1
            ${pref === 'equilibrado'
              ? 'border-violet-500 bg-violet-500/10 scale-105'
              : 'border-border hover:border-violet-500/50 bg-card'
            }
          `}
        >
          <div className="font-semibold flex items-center gap-2">
            🔄 Equilibrado
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">Recomendado</span>
          </div>
          <div className="text-xs text-muted-foreground">
            El agente me pide aprobación solo para acciones importantes. El resto va solo.
          </div>
        </button>

        <button
          onClick={() => setPref('autonomo')}
          className={`
            w-full p-5 rounded-xl border-2 transition-all text-left space-y-1
            ${pref === 'autonomo'
              ? 'border-violet-500 bg-violet-500/10 scale-105'
              : 'border-border hover:border-violet-500/50 bg-card'
            }
          `}
        >
          <div className="font-semibold flex items-center gap-2">
            ⚡ Que trabaje solo, solo avísame
          </div>
          <div className="text-xs text-muted-foreground">
            El agente trabaja en background y me muestra el resultado cuando termina.
          </div>
        </button>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onBack}>
          Atrás
        </Button>
        <Button
          onClick={handleNext}
          disabled={!pref}
          className="bg-violet-600 hover:bg-violet-500"
        >
          Siguiente
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Step 4: Loading ───────────────────────────────────────────────────────────

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
      setTimeout(() => setMessages((m) => [...m, '✅ Activando agente personalizado']), 500),
      setTimeout(() => setMessages((m) => [...m, '✅ Configurando nivel de autonomía']), 1200),
      setTimeout(() => setMessages((m) => [...m, '✅ Creando tu primer espacio de trabajo']), 1900),
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

// ─── Step 5: Preview ───────────────────────────────────────────────────────────

function Step5Preview({
  agentConfig,
  onConfirm,
  onBack,
}: {
  agentConfig: any;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">He diseñado esto para ti</h2>
        <p className="text-sm text-muted-foreground">¿Te parece bien?</p>
      </div>

      <AgentProfileBuilder agentConfig={agentConfig} />

      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onBack}>
          Ajustar algo antes
        </Button>
        <Button
          onClick={onConfirm}
          className="bg-violet-600 hover:bg-violet-500"
        >
          ¡Activar mi asistente!
          <Sparkles className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
