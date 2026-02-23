/**
 * VaultPanel — Cerebrin BYO API Keys Vault
 *
 * Enterprise-only. Almacena secretos cifrados en el backend via POST /api/vault/secrets.
 * Feature-gated: requiere plan Enterprise (canUseByoApi).
 */

import * as React from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Key,
  Lock,
  Loader2,
  Plus,
  Shield,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import { usePlanFeatures } from "../../contexts/PlanContext";
import { createVaultSecret } from "../../services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VaultEntry {
  id: string;
  name: string;
  description: string;
  maskedValue: string;
  provider: string;
  providerColor: string;
  created_at: string;
  last_used: string | null;
}

// ─── Seed Data ─────────────────────────────────────────────────────────────────

const SEED_SECRETS: VaultEntry[] = [
  {
    id: "vs_001",
    name: "OPENAI_API_KEY",
    description: "OpenAI GPT-4o para Writer-Bot y Analyst-Bot",
    maskedValue: "sk-••••••••••••••••••••••••••••••••••••••9Kpq",
    provider: "OpenAI",
    providerColor: "#10B981",
    created_at: "2026-01-15",
    last_used: "hace 2m",
  },
  {
    id: "vs_002",
    name: "ANTHROPIC_API_KEY",
    description: "Anthropic Claude 3.5 Sonnet para Dev-Bot",
    maskedValue: "sk-ant-api03-••••••••••••••••••••••••••••••Mxq9",
    provider: "Anthropic",
    providerColor: "#D97706",
    created_at: "2026-01-18",
    last_used: "hace 1h",
  },
  {
    id: "vs_003",
    name: "SERPER_API_KEY",
    description: "Serper.dev para web search en Research-Bot",
    maskedValue: "serper_••••••••••••••••••••••••••••••••••••K7x2",
    provider: "Serper",
    providerColor: "#8B5CF6",
    created_at: "2026-02-01",
    last_used: "hace 3h",
  },
];

const PROVIDER_TEMPLATES = [
  { id: "openai",    name: "OpenAI",     prefix: "sk-",           color: "#10B981", placeholder: "sk-proj-..." },
  { id: "anthropic", name: "Anthropic",  prefix: "sk-ant-",       color: "#D97706", placeholder: "sk-ant-api03-..." },
  { id: "gemini",    name: "Google AI",  prefix: "AIza",          color: "#3B82F6", placeholder: "AIzaSy..." },
  { id: "serper",    name: "Serper",     prefix: "serper_",       color: "#8B5CF6", placeholder: "serper_..." },
  { id: "custom",    name: "Custom",     prefix: "",              color: "#64748B", placeholder: "YOUR_SECRET_HERE" },
];

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SecretRow({
  secret,
  onDelete,
}: {
  secret: VaultEntry;
  onDelete: (id: string) => void;
}) {
  const [revealed, setRevealed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(secret.maskedValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast("Copiado al portapapeles", { icon: <Copy className="w-3.5 h-3.5" /> });
    });
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/30 transition-all group">
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
        style={{ backgroundColor: `${secret.providerColor}15`, borderColor: `${secret.providerColor}30` }}
      >
        <Key className="w-4 h-4" style={{ color: secret.providerColor }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-foreground text-sm font-mono truncate" style={{ fontWeight: 600 }}>
            {secret.name}
          </p>
          <span
            className="shrink-0 px-1.5 py-0.5 rounded-md border text-[9px] uppercase tracking-wider"
            style={{
              backgroundColor: `${secret.providerColor}12`,
              borderColor: `${secret.providerColor}30`,
              color: secret.providerColor,
              fontWeight: 700,
            }}
          >
            {secret.provider}
          </span>
        </div>
        <p className="text-muted-foreground/50 text-xs mt-0.5 truncate">{secret.description}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="font-mono text-muted-foreground/30" style={{ fontSize: 10 }}>
            {revealed ? secret.maskedValue : secret.maskedValue.replace(/[^•]/g, c => c === "s" && secret.maskedValue.startsWith("s") ? "s" : "•").slice(0, 20) + "••••••"}
          </span>
          {secret.last_used && (
            <span className="text-muted-foreground/25" style={{ fontSize: 9 }}>
              Último uso: {secret.last_used}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setRevealed(r => !r)}
          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
          title={revealed ? "Ocultar" : "Revelar"}
        >
          {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors"
          title="Copiar"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => onDelete(secret.id)}
          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Add Secret Dialog ──────────────────────────────────────────────────────────

function AddSecretDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: (entry: VaultEntry) => void;
}) {
  const [name, setName] = React.useState("");
  const [value, setValue] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [provider, setProvider] = React.useState(PROVIDER_TEMPLATES[0]);
  const [showValue, setShowValue] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName("");
      setValue("");
      setDescription("");
      setProvider(PROVIDER_TEMPLATES[0]);
      setShowValue(false);
    }
  }, [open]);

  const canSubmit = name.trim().length > 0 && value.trim().length > 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const result = await createVaultSecret({
        workspace_id: "ws_demo_01",
        name: name.trim().toUpperCase().replace(/\s+/g, "_"),
        value: value.trim(),
        description: description.trim(),
      });

      const newEntry: VaultEntry = {
        id: result.id,
        name: name.trim().toUpperCase().replace(/\s+/g, "_"),
        description: description.trim() || `Secreto ${provider.name}`,
        maskedValue: value.slice(0, 8) + "••••••••••••••••••••••••••••••" + value.slice(-4),
        provider: provider.name,
        providerColor: provider.color,
        created_at: new Date().toISOString().split("T")[0],
        last_used: null,
      };

      onAdded(newEntry);
      onOpenChange(false);
      toast.success("Secreto guardado en Vault", {
        description: `${newEntry.name} cifrado y almacenado de forma segura`,
        icon: <Lock className="w-3.5 h-3.5" />,
      });
    } catch {
      toast.error("Error al guardar el secreto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border border-border shadow-2xl rounded-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-foreground text-sm" style={{ fontWeight: 700 }}>
                Nuevo Secreto en Vault
              </DialogTitle>
              <p className="text-emerald-400/60 font-mono" style={{ fontSize: 10 }}>
                POST /api/vault/secrets · cifrado en tránsito
              </p>
            </div>
          </div>
          <DialogDescription className="text-muted-foreground text-xs">
            Los valores se cifran con AES-256 antes de almacenarse. Nunca se exponen en logs.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Provider */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontWeight: 600 }}>
              Proveedor
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PROVIDER_TEMPLATES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-xl border text-xs transition-all",
                    provider.id === p.id
                      ? "border-border bg-muted/60 text-foreground"
                      : "border-border/40 text-muted-foreground/50 hover:border-border"
                  )}
                  style={{
                    fontWeight: provider.id === p.id ? 700 : 400,
                    ...(provider.id === p.id ? { borderColor: p.color + "50", backgroundColor: p.color + "12", color: p.color } : {}),
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600 }}>
              Nombre de la variable <span className="text-destructive">*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
              placeholder="OPENAI_API_KEY"
              className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border/60 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Value */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600 }}>
              Valor del secreto <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/40 border border-border/60 focus-within:border-emerald-500/50 transition-all">
              <input
                type={showValue ? "text" : "password"}
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={provider.placeholder}
                className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none"
              />
              <button
                onClick={() => setShowValue(s => !s)}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                {showValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block" style={{ fontWeight: 600 }}>
              Descripción
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción interna del secreto..."
              className="w-full px-3 py-2.5 rounded-xl bg-muted/40 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-emerald-400/70 text-xs leading-relaxed">
              El valor se cifra con AES-256-GCM antes de enviarse. Nunca se almacena en texto plano ni aparece en logs de auditoría.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-end gap-3 bg-muted/20">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs text-muted-foreground border border-border hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSubmit || loading}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs transition-all",
              !canSubmit || loading
                ? "bg-muted border border-border text-muted-foreground cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40"
            )}
            style={{ fontWeight: 600 }}
          >
            {loading
              ? <><Loader2 className="w-3 h-3 animate-spin" />Guardando…</>
              : <><Lock className="w-3 h-3" />Guardar en Vault</>
            }
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Feature Gate ───────────────────────────────────────────────────────────────

function VaultGate({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 max-w-md mx-auto text-center">
      <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Lock className="w-7 h-7 text-amber-400" />
      </div>
      <div>
        <h3 className="text-foreground uppercase tracking-widest mb-2" style={{ fontWeight: 800, fontSize: 13 }}>
          Vault requiere Enterprise
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          El Vault de secretos BYO-API está disponible exclusivamente en el plan Enterprise. 
          Almacena tus propias API keys de OpenAI, Anthropic y otros proveedores con cifrado AES-256.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 w-full">
        <ul className="space-y-2 text-left w-full max-w-xs">
          {[
            "Tus propias API keys (OpenAI, Anthropic, Gemini)",
            "Cifrado AES-256 en tránsito y en reposo",
            "Audit log completo de accesos",
            "Rotación automática de secretos",
          ].map(f => (
            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-all mt-2"
          style={{ fontWeight: 600 }}
        >
          <Crown className="w-4 h-4" />
          Actualizar a Enterprise
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function VaultPanel() {
  const { canUseByoApi, tier, upgradeTo } = usePlanFeatures();
  const [secrets, setSecrets] = React.useState<VaultEntry[]>(SEED_SECRETS);
  const [addOpen, setAddOpen] = React.useState(false);

  const handleDelete = (id: string) => {
    const secret = secrets.find(s => s.id === id);
    setSecrets(prev => prev.filter(s => s.id !== id));
    toast.error("Secreto eliminado del Vault", {
      description: secret?.name,
      action: {
        label: "Deshacer",
        onClick: () => {
          if (secret) setSecrets(prev => [secret, ...prev]);
        },
      },
    });
  };

  const handleUpgrade = () => {
    upgradeTo("Enterprise");
    toast.info("Activando plan Enterprise…", {
      description: "Vault BYO-API y MCP Protocol se activarán automáticamente",
    });
  };

  if (!canUseByoApi) {
    return (
      <div className="p-7">
        <div className="mb-6">
          <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>Vault — BYO API Keys</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gestión segura de tus propias API keys con cifrado en tránsito
          </p>
        </div>
        <VaultGate onUpgrade={handleUpgrade} />
      </div>
    );
  }

  const providerGroups = Array.from(new Set(secrets.map(s => s.provider)));

  return (
    <div className="p-7 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>Vault — BYO API Keys</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Secretos cifrados para usar tus propios modelos de IA. Plan: {tier}
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 transition-all shrink-0"
          style={{ fontWeight: 600, fontSize: 12 }}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar Secreto
        </button>
      </div>

      {/* Security banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>
            Vault Activo — Cifrado AES-256-GCM
          </p>
          <p className="text-emerald-400/50 text-xs mt-0.5">
            {secrets.length} secreto{secrets.length !== 1 ? "s" : ""} almacenado{secrets.length !== 1 ? "s" : ""} · POST /api/vault/secrets · Audit log habilitado
          </p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
      </div>

      {/* Secrets list */}
      {secrets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground/40 rounded-2xl border border-dashed border-border/50">
          <Key className="w-8 h-8" />
          <p className="text-sm">No hay secretos en el Vault</p>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <Plus className="w-3 h-3" />
            Agregar primer secreto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {secrets.map(secret => (
            <SecretRow key={secret.id} secret={secret} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Usage by provider */}
      {secrets.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40">
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Proveedores Conectados</p>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {providerGroups.map(provider => {
              const entry = secrets.find(s => s.provider === provider)!;
              return (
                <div key={provider} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border/40 bg-muted/20">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${entry.providerColor}15` }}
                  >
                    <Zap className="w-4 h-4" style={{ color: entry.providerColor }} />
                  </div>
                  <p className="text-foreground text-xs text-center" style={{ fontWeight: 600 }}>{provider}</p>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Warning */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/15">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-400/70 text-xs leading-relaxed">
          <span style={{ fontWeight: 600 }}>Importante:</span> Los secretos se usarán para las llamadas a la API de los agentes asignados. 
          Asegúrate de usar API keys con los permisos mínimos necesarios y monitorea el consumo regularmente.
        </p>
      </div>

      <AddSecretDialog open={addOpen} onOpenChange={setAddOpen} onAdded={entry => setSecrets(prev => [entry, ...prev])} />
    </div>
  );
}
