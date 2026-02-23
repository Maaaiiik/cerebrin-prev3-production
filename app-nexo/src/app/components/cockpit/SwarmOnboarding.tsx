/**
 * SwarmOnboarding — Sección 15 del Master Brief
 *
 * Flujo guiado 3 pasos para usuarios Enterprise:
 *   1. Activación de Agente Líder (EXECUTOR)
 *   2. Configuración de Vault (BYO-API Keys)
 *   3. Primer Milagro (lanzar tarea estratégica con el enjambre)
 *
 * Dispara automáticamente cuando tier sube a Enterprise.
 */

import * as React from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Crown,
  Database,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Plus,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VaultSecret {
  id: string;
  name: string;
  value: string;
  description: string;
  added: boolean;
}

interface SwarmOnboardingProps {
  open: boolean;
  onClose: () => void;
}

// ─── Mock vault templates ───────────────────────────────────────────────────────

const VAULT_TEMPLATES: VaultSecret[] = [
  { id: "v1", name: "OPENAI_API_KEY",    value: "",    description: "OpenAI GPT-4o — Procesamiento IA principal",     added: false },
  { id: "v2", name: "ANTHROPIC_API_KEY", value: "",    description: "Claude 3.5 Sonnet — Análisis avanzado",           added: false },
  { id: "v3", name: "SUPABASE_KEY",      value: "",    description: "Supabase — Base de datos en tiempo real",         added: false },
  { id: "v4", name: "SLACK_BOT_TOKEN",   value: "",    description: "Slack — Notificaciones y alertas del enjambre",   added: false },
];

// ─── Step components ────────────────────────────────────────────────────────────

function StepActivateLeader({
  onNext,
}: {
  onNext: () => void;
}) {
  const [selected, setSelected] = React.useState<"OBSERVER" | "OPERATOR" | "EXECUTOR" | null>(null);
  const [agentName, setAgentName] = React.useState("Strategy Commander");
  const [loading, setLoading] = React.useState(false);

  const configs = [
    {
      id: "OBSERVER" as const,
      label: "Observer",
      desc: "Solo lectura y sugerencias. Sin ejecución.",
      icon: Eye,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
    },
    {
      id: "OPERATOR" as const,
      label: "Operator",
      desc: "Crea y edita. No elimina ni publica.",
      icon: Shield,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/30",
    },
    {
      id: "EXECUTOR" as const,
      label: "Executor",
      desc: "Acceso total incluyendo APIs externas.",
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      recommended: true,
    },
  ];

  const handleActivate = () => {
    if (!selected || !agentName.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Agente Líder activado", {
        description: `${agentName} · Permisos ${selected} configurados`,
      });
      onNext();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-2">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-foreground text-lg" style={{ fontWeight: 700 }}>Activa tu Agente Líder</h3>
        <p className="text-muted-foreground/70 text-sm mt-1.5 max-w-xs mx-auto">
          El Agente Líder coordina el enjambre. Necesita permisos EXECUTOR para operar con autonomía total.
        </p>
      </div>

      {/* Agent name */}
      <div>
        <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 700 }}>
          Nombre del Agente Líder
        </label>
        <div className="relative">
          <Bot className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-400" />
          <input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-muted/50 border border-border/60 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
            placeholder="Strategy Commander"
          />
        </div>
      </div>

      {/* Permission package */}
      <div>
        <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2.5" style={{ fontSize: "9px", fontWeight: 700 }}>
          Paquete de Permisos
        </label>
        <div className="space-y-2">
          {configs.map((cfg) => {
            const Icon = cfg.icon;
            const isActive = selected === cfg.id;
            return (
              <button
                key={cfg.id}
                onClick={() => setSelected(cfg.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left",
                  isActive
                    ? cn(cfg.bg, cfg.border)
                    : "bg-muted/20 border-border/50 hover:border-border"
                )}
              >
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border shrink-0", cfg.bg, cfg.border)}>
                  <Icon className={cn("w-4 h-4", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm", isActive ? cfg.color : "text-foreground")} style={{ fontWeight: 700 }}>
                      {cfg.label}
                    </span>
                    {"recommended" in cfg && cfg.recommended && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400" style={{ fontWeight: 700 }}>
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground/50 text-xs mt-0.5">{cfg.desc}</p>
                </div>
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 shrink-0 transition-all flex items-center justify-center",
                  isActive ? cn(cfg.border.replace("border-", "border-"), cfg.bg) : "border-border"
                )}>
                  {isActive && <div className={cn("w-2 h-2 rounded-full", cfg.color.replace("text-", "bg-"))} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleActivate}
        disabled={!selected || !agentName.trim() || loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontWeight: 700 }}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Activando…</>
        ) : (
          <><Zap className="w-4 h-4" />Activar Agente Líder</>
        )}
      </button>
    </div>
  );
}

function StepVaultSetup({ onNext }: { onNext: () => void }) {
  const [secrets, setSecrets] = React.useState<VaultSecret[]>(VAULT_TEMPLATES);
  const [showValues, setShowValues] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(false);

  const toggleShow = (id: string) =>
    setShowValues((p) => ({ ...p, [id]: !p[id] }));

  const updateValue = (id: string, value: string) =>
    setSecrets((p) => p.map((s) => (s.id === id ? { ...s, value, added: !!value } : s)));

  const addedCount = secrets.filter((s) => s.added).length;

  const handleSave = () => {
    if (addedCount === 0) {
      toast.error("Añade al menos una API Key", { description: "El Vault necesita al menos una credencial para operar." });
      return;
    }
    setLoading(true);
    // → REAL: POST /api/vault/secrets para cada secret con valor
    setTimeout(() => {
      setLoading(false);
      toast.success(`${addedCount} secrets guardados en el Vault`, {
        description: "Cifrado AES-256 · Acceso solo desde agentes autorizados",
      });
      onNext();
    }, 1400);
  };

  return (
    <div className="space-y-6">
      <div className="text-center pb-2">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-foreground text-lg" style={{ fontWeight: 700 }}>Configura el Vault</h3>
        <p className="text-muted-foreground/70 text-sm mt-1.5 max-w-xs mx-auto">
          Tus API Keys propias (BYO-API) se almacenan cifradas. El enjambre las usa sin exponer los valores.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/15">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>Cifrado AES-256 · Zero-knowledge</p>
          <p className="text-emerald-400/60 text-xs mt-0.5">Los valores nunca se almacenan en texto plano ni aparecen en logs.</p>
        </div>
      </div>

      {/* Secrets */}
      <div className="space-y-3">
        {secrets.map((secret) => (
          <div
            key={secret.id}
            className={cn(
              "rounded-2xl border overflow-hidden transition-all",
              secret.added ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-muted/20"
            )}
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key className={cn("w-3.5 h-3.5 shrink-0", secret.added ? "text-emerald-400" : "text-muted-foreground/40")} />
                  <code className={cn("text-xs font-mono", secret.added ? "text-emerald-300" : "text-muted-foreground/70")} style={{ fontWeight: 700 }}>
                    {secret.name}
                  </code>
                  {secret.added && <Check className="w-3 h-3 text-emerald-400" />}
                </div>
                <span className="text-muted-foreground/30 text-[10px]">{secret.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showValues[secret.id] ? "text" : "password"}
                    value={secret.value}
                    onChange={(e) => updateValue(secret.id, e.target.value)}
                    placeholder={`Pegar ${secret.name}...`}
                    className="w-full pr-9 px-3 py-2 rounded-xl bg-background border border-border/50 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500/50 placeholder:text-muted-foreground/30"
                  />
                  <button
                    onClick={() => toggleShow(secret.id)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
                  >
                    {showValues[secret.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add custom */}
      <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-border/50 border-dashed text-muted-foreground/50 hover:text-muted-foreground hover:border-border transition-all text-xs">
        <Plus className="w-3.5 h-3.5" />
        Añadir secret personalizado
      </button>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground/40 text-xs">
          {addedCount}/{secrets.length} secrets configurados
        </p>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm transition-all disabled:opacity-60"
          style={{ fontWeight: 700 }}
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando…</>
          ) : (
            <><Lock className="w-3.5 h-3.5" />Guardar en Vault</>
          )}
        </button>
      </div>
    </div>
  );
}

function StepFirstMiracle({ onClose }: { onClose: () => void }) {
  const [prompt, setPrompt] = React.useState("");
  const [launching, setLaunching] = React.useState(false);
  const [launched, setLaunched] = React.useState(false);

  const EXAMPLE_TASKS = [
    "Analiza los 5 competidores principales de Cerebrin y genera un battle card",
    "Diseña el OKR Q2 para el equipo de producto con métricas clave",
    "Crea el plan de go-to-market para LATAM con budget de $50k",
  ];

  const handleLaunch = () => {
    if (!prompt.trim()) return;
    setLaunching(true);
    // → REAL: POST /api/ai con taskType: STRATEGIC, agentSwarm: true
    setTimeout(() => {
      setLaunching(false);
      setLaunched(true);
    }, 2000);
  };

  if (launched) {
    return (
      <div className="space-y-6 text-center py-4">
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-3xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-amber-400" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-background">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>

        <div>
          <h3 className="text-foreground text-xl" style={{ fontWeight: 800 }}>🎉 Primer Milagro Completado</h3>
          <p className="text-muted-foreground/70 text-sm mt-2 max-w-xs mx-auto leading-relaxed">
            Tu enjambre está en marcha. Los agentes están procesando la tarea. Revisa el Cockpit para ver el progreso en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xs mx-auto">
          {[
            { label: "Agentes activos",    value: "4",     color: "text-violet-400" },
            { label: "Tareas en curso",     value: "12",    color: "text-amber-400"  },
            { label: "ETA",                value: "~8 min", color: "text-emerald-400"},
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl bg-muted/30 border border-border/50 p-3 text-center">
              <p className={cn("tabular-nums", color)} style={{ fontSize: "18px", fontWeight: 800 }}>{value}</p>
              <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: "9px" }}>{label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white transition-all"
          style={{ fontWeight: 700 }}
        >
          <Rocket className="w-4 h-4" />
          Ir al Cockpit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center pb-2">
        <div className="w-16 h-16 rounded-3xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-foreground text-lg" style={{ fontWeight: 700 }}>Primer Milagro</h3>
        <p className="text-muted-foreground/70 text-sm mt-1.5 max-w-xs mx-auto">
          Lanza tu primera tarea estratégica usando el enjambre completo. Los 4 agentes colaborarán en paralelo.
        </p>
      </div>

      {/* Swarm status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {[
          { name: "writer-bot",   type: "CONTENT",  color: "#8B5CF6", status: "ready" },
          { name: "analyst-bot",  type: "RESEARCH", color: "#3B82F6", status: "ready" },
          { name: "strategy-bot", type: "STRATEGY", color: "#10B981", status: "ready" },
          { name: "dev-bot",      type: "ENGINEER", color: "#F59E0B", status: "ready" },
        ].map((agent) => (
          <div key={agent.name} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/50">
            <div
              className="w-6 h-6 shrink-0"
              style={{
                clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
                backgroundColor: `${agent.color}20`,
                border: `1px solid ${agent.color}50`,
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate" style={{ fontWeight: 600 }}>{agent.name}</p>
              <p className="text-[9px] text-muted-foreground/40">{agent.type}</p>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
        ))}
      </div>

      {/* Task prompt */}
      <div>
        <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 700 }}>
          Tarea Estratégica
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder="Describe la tarea que quieres lanzar al enjambre..."
          className="w-full px-3.5 py-2.5 rounded-2xl bg-muted/50 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-violet-500/50 resize-none"
        />
      </div>

      {/* Examples */}
      <div>
        <p className="text-muted-foreground/40 text-xs mb-2" style={{ fontWeight: 600 }}>EJEMPLOS RÁPIDOS</p>
        <div className="space-y-1.5">
          {EXAMPLE_TASKS.map((t) => (
            <button
              key={t}
              onClick={() => setPrompt(t)}
              className="w-full text-left text-xs text-muted-foreground/60 hover:text-violet-400 px-3 py-2 rounded-xl hover:bg-violet-500/5 transition-all"
            >
              → {t}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleLaunch}
        disabled={!prompt.trim() || launching}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontWeight: 700 }}
      >
        {launching ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Lanzando enjambre…</>
        ) : (
          <><Sparkles className="w-4 h-4" />Lanzar tarea al enjambre</>
        )}
      </button>
    </div>
  );
}

// ─── Main SwarmOnboarding ───────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Agente Líder",  icon: Crown,   desc: "Activa tu primer EXECUTOR" },
  { id: 2, label: "Vault Setup",   icon: Database, desc: "Configura tus API Keys"    },
  { id: 3, label: "Primer Milagro",icon: Sparkles, desc: "Lanza tu primera tarea"    },
];

export function SwarmOnboarding({ open, onClose }: SwarmOnboardingProps) {
  const [step, setStep] = React.useState(1);

  if (!open) return null;

  const goNext = () => setStep((s) => Math.min(s + 1, 3));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-border/60 bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-5 border-b border-border/60 bg-gradient-to-r from-violet-500/5 to-amber-500/5">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p
                className="text-foreground uppercase tracking-widest"
                style={{ fontWeight: 800, fontSize: 10, fontStyle: "italic", letterSpacing: "0.2em" }}
              >
                Swarm Onboarding · Enterprise
              </p>
              <p className="text-muted-foreground/50 text-xs mt-0.5">
                Configura tu Autonomous Agent Swarm en 3 pasos
              </p>
            </div>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive    = s.id === step;
              const isCompleted = s.id < step;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center border transition-all",
                      isCompleted ? "bg-emerald-500/20 border-emerald-500/40" :
                      isActive ? "bg-violet-600/20 border-violet-500/40" :
                      "bg-muted/50 border-border/40"
                    )}>
                      {isCompleted
                        ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                        : <Icon className={cn("w-3.5 h-3.5", isActive ? "text-violet-400" : "text-muted-foreground/30")} />
                      }
                    </div>
                    <p className={cn("text-center", isActive ? "text-violet-400" : isCompleted ? "text-emerald-400" : "text-muted-foreground/30")} style={{ fontSize: "9px", fontWeight: isActive ? 700 : 400 }}>
                      {s.label}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("flex-1 h-px mx-2 mb-4 transition-all", isCompleted ? "bg-emerald-500/40" : "bg-border/40")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step body */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {step === 1 && <StepActivateLeader onNext={goNext} />}
          {step === 2 && <StepVaultSetup onNext={goNext} />}
          {step === 3 && <StepFirstMiracle onClose={onClose} />}
        </div>

        {/* Footer nav */}
        {step < 3 && (
          <div className="px-6 py-4 border-t border-border/40 flex items-center justify-between bg-muted/20">
            <p className="text-muted-foreground/30 text-xs">Paso {step} de {STEPS.length}</p>
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              Omitir por ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
