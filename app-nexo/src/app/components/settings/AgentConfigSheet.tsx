/**
 * AgentConfigSheet
 * Full-featured per-agent configuration panel with:
 *  - Safe Mode (novice): 3 guided presets
 *  - Advanced Mode: granular HITL permissions, scope, limits, integrations, audit log
 *
 * BACKEND NOTES:
 *  - Permissions → PATCH /api/agents/:id/permissions  Body: PermissionsMap
 *  - Scope       → PATCH /api/agents/:id/scope        Body: AgentScope
 *  - Limits      → PATCH /api/agents/:id/limits       Body: AgentLimits
 *  - Integrations→ PATCH /api/agents/:id/integrations Body: string[]
 */

import React, { useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "../ui/sheet";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  Clock,
  Code2,
  DollarSign,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  Info,
  Layers,
  Lightbulb,
  ListTodo,
  Lock,
  Plug,
  RefreshCw,
  Save,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchGatekeeperLogs, type GatekeeperLog,
  fetchAgentN8nConfig, saveAgentN8nConfig, testAgentN8nWebhook,
  type N8nAgentConfig,
} from "../../services/api";
import { PermissionLadder, PermissionBadge, type AutonomyLevel as LadderLevel } from "./PermissionLadder";
import { AgentAvatar } from "../common/AgentAvatar";
import { AgentHierarchyBadge, AgentTypePill } from "../common/AgentHierarchyBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermLevel = "AUTONOMOUS" | "APPROVAL" | "BLOCKED";

export type PermKey =
  | "idea_create"   | "idea_update"   | "idea_delete"   | "idea_promote"
  | "task_create"   | "task_update"   | "task_delete"
  | "project_create"| "project_update"| "project_delete"
  | "doc_create"    | "doc_update"    | "doc_delete"
  | "council_query" | "external_api";

export type PermissionsMap = Record<PermKey, PermLevel>;

type SafePreset = "assistant" | "collaborator" | "autonomous";

interface AgentScope {
  projects: string[];   // project IDs
  taskTypes: string[];  // "TASK" | "SUBTASK" | "IDEA" | "PROJECT"
  teams: string[];      // team IDs
  allowAllProjects: boolean;
  allowAllTeams: boolean;
}

interface AgentLimits {
  maxTasksPerHour: number;
  maxApiCallsPerDay: number;
  budgetCapUsd: number;
  confidenceThreshold: number; // 0–100; below this → HITL
  maxConcurrentTasks: number;
}

interface AgentIntegration {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  category: "data" | "comms" | "cloud" | "code";
}

type ConfigTab = "overview" | "mode" | "permissions" | "scope" | "limits" | "integrations" | "automation" | "audit";

export interface AgentForConfig {
  id: string;
  name: string;
  type: "CAPTAIN" | "DT" | "SPECIALIST"; // Agent hierarchy type
  model: string;
  systemPrompt: string;
  active: boolean;
  tasksCompleted: number;
  avgConfidence: number;
  lastRun: string;
  hitl: boolean;
  // Avatar fields
  avatar_url?: string;
  avatar_color?: string;
  emoji?: string;
}

interface AgentConfigSheetProps {
  agent: AgentForConfig | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave?: (agentId: string, changes: Partial<AgentForConfig>) => void;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const DEFAULT_PERMISSIONS: PermissionsMap = {
  idea_create:    "APPROVAL",
  idea_update:    "APPROVAL",
  idea_delete:    "BLOCKED",
  idea_promote:   "BLOCKED",
  task_create:    "APPROVAL",
  task_update:    "AUTONOMOUS",
  task_delete:    "BLOCKED",
  project_create: "BLOCKED",
  project_update: "BLOCKED",
  project_delete: "BLOCKED",
  doc_create:     "APPROVAL",
  doc_update:     "AUTONOMOUS",
  doc_delete:     "BLOCKED",
  council_query:  "AUTONOMOUS",
  external_api:   "BLOCKED",
};

const SAFE_PRESETS: Record<SafePreset, {
  label: string;
  sublabel: string;
  desc: string;
  icon: React.ElementType;
  badge: string;
  badgeClass: string;
  permissions: Partial<PermissionsMap>;
}> = {
  assistant: {
    label: "Modo Asistente",
    sublabel: "Solo lectura + sugerencias",
    desc: "El agente puede leer contexto y generar sugerencias, pero todas sus acciones requieren aprobación humana antes de ejecutarse. Ideal para comenzar.",
    icon: Shield,
    badge: "Más seguro",
    badgeClass: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    permissions: {
      idea_create: "APPROVAL", idea_update: "APPROVAL", idea_delete: "BLOCKED", idea_promote: "BLOCKED",
      task_create: "APPROVAL", task_update: "APPROVAL", task_delete: "BLOCKED",
      project_create: "BLOCKED", project_update: "BLOCKED", project_delete: "BLOCKED",
      doc_create: "APPROVAL", doc_update: "APPROVAL", doc_delete: "BLOCKED",
      council_query: "AUTONOMOUS", external_api: "BLOCKED",
    },
  },
  collaborator: {
    label: "Modo Colaborador",
    sublabel: "Ejecuta con supervisión",
    desc: "El agente puede crear y editar contenido directamente, pero las acciones de alto impacto (eliminar, promover, llamadas externas) requieren aprobación HITL.",
    icon: Users,
    badge: "Recomendado",
    badgeClass: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    permissions: {
      idea_create: "AUTONOMOUS", idea_update: "AUTONOMOUS", idea_delete: "APPROVAL", idea_promote: "APPROVAL",
      task_create: "AUTONOMOUS", task_update: "AUTONOMOUS", task_delete: "APPROVAL",
      project_create: "APPROVAL", project_update: "APPROVAL", project_delete: "BLOCKED",
      doc_create: "AUTONOMOUS", doc_update: "AUTONOMOUS", doc_delete: "APPROVAL",
      council_query: "AUTONOMOUS", external_api: "APPROVAL",
    },
  },
  autonomous: {
    label: "Modo Autónomo",
    sublabel: "Ejecución directa · Solo expertos",
    desc: "El agente ejecuta todas las acciones sin intervención humana. Se recomienda únicamente para agentes auditados y en producción validada. Úsalo con precaución.",
    icon: Zap,
    badge: "Mayor riesgo",
    badgeClass: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    permissions: {
      idea_create: "AUTONOMOUS", idea_update: "AUTONOMOUS", idea_delete: "AUTONOMOUS", idea_promote: "AUTONOMOUS",
      task_create: "AUTONOMOUS", task_update: "AUTONOMOUS", task_delete: "AUTONOMOUS",
      project_create: "AUTONOMOUS", project_update: "AUTONOMOUS", project_delete: "APPROVAL",
      doc_create: "AUTONOMOUS", doc_update: "AUTONOMOUS", doc_delete: "AUTONOMOUS",
      council_query: "AUTONOMOUS", external_api: "AUTONOMOUS",
    },
  },
};

const PERM_SECTIONS: { label: string; icon: React.ElementType; keys: { key: PermKey; label: string; desc: string; risk: "low" | "medium" | "high" }[] }[] = [
  {
    label: "Ideas",
    icon: Lightbulb,
    keys: [
      { key: "idea_create",  label: "Crear Idea",    desc: "Generar nuevas ideas en la Incubadora",                    risk: "low" },
      { key: "idea_update",  label: "Editar Idea",   desc: "Modificar título, descripción y metadatos de ideas",        risk: "low" },
      { key: "idea_promote", label: "Promover",       desc: "Convertir una idea a Proyecto (acción irreversible)",       risk: "high" },
      { key: "idea_delete",  label: "Eliminar Idea", desc: "Borrar ideas permanentemente de la Incubadora",            risk: "high" },
    ],
  },
  {
    label: "Tareas",
    icon: ListTodo,
    keys: [
      { key: "task_create", label: "Crear Tarea",   desc: "Añadir tareas a proyectos o a la cola de trabajo",          risk: "low" },
      { key: "task_update", label: "Editar Tarea",  desc: "Cambiar estado, asignado, metadatos de tareas",             risk: "low" },
      { key: "task_delete", label: "Eliminar Tarea",desc: "Borrar tareas definitivamente del sistema",                  risk: "high" },
    ],
  },
  {
    label: "Proyectos",
    icon: FolderKanban,
    keys: [
      { key: "project_create", label: "Crear Proyecto",   desc: "Crear nuevos proyectos en el Project Engine",          risk: "medium" },
      { key: "project_update", label: "Editar Proyecto",  desc: "Modificar estructura, fases y configuración",          risk: "medium" },
      { key: "project_delete", label: "Eliminar Proyecto",desc: "Eliminar proyectos y toda su estructura de tareas",    risk: "high" },
    ],
  },
  {
    label: "Documentos",
    icon: FileText,
    keys: [
      { key: "doc_create", label: "Crear Documento",  desc: "Generar documentos en el Output Studio",                  risk: "low" },
      { key: "doc_update", label: "Editar Documento", desc: "Modificar contenido y metadatos de documentos",           risk: "low" },
      { key: "doc_delete", label: "Eliminar Documento",desc: "Borrar documentos del repositorio",                      risk: "medium" },
    ],
  },
  {
    label: "Sistema",
    icon: Terminal,
    keys: [
      { key: "council_query", label: "Consultar IA",     desc: "Invocar otros agentes o el Council de IA",             risk: "low" },
      { key: "external_api",  label: "APIs Externas",    desc: "Llamar APIs de terceros (Slack, Drive, CRM, etc.)",    risk: "high" },
    ],
  },
];

const MOCK_PROJECTS = [
  { id: "p1", name: "Q1 Marketing Initiative",  color: "bg-violet-500" },
  { id: "p2", name: "Platform 3.0 Launch",      color: "bg-blue-500" },
  { id: "p3", name: "LATAM Expansion",           color: "bg-emerald-500" },
  { id: "p4", name: "Revenue Operations",        color: "bg-amber-500" },
  { id: "p5", name: "Partner Portal MVP",        color: "bg-rose-500" },
];

const MOCK_TEAMS = [
  { id: "t1", name: "Marketing",   members: 8  },
  { id: "t2", name: "Engineering", members: 14 },
  { id: "t3", name: "Strategy",    members: 5  },
  { id: "t4", name: "Revenue",     members: 6  },
  { id: "t5", name: "Operations",  members: 9  },
];

const MOCK_INTEGRATIONS: AgentIntegration[] = [
  { id: "gdrive",   label: "Google Drive",  icon: "📁", enabled: true,  category: "cloud" },
  { id: "slack",    label: "Slack",          icon: "💬", enabled: false, category: "comms" },
  { id: "notion",   label: "Notion",         icon: "📝", enabled: true,  category: "data" },
  { id: "github",   label: "GitHub",         icon: "🐙", enabled: false, category: "code" },
  { id: "hubspot",  label: "HubSpot",        icon: "🔶", enabled: false, category: "data" },
  { id: "gsheets",  label: "Google Sheets",  icon: "📊", enabled: true,  category: "data" },
  { id: "linear",   label: "Linear",         icon: "🔷", enabled: false, category: "code" },
  { id: "stripe",   label: "Stripe",         icon: "💳", enabled: false, category: "data" },
  { id: "openai",   label: "OpenAI API",     icon: "🤖", enabled: true,  category: "data" },
  { id: "sendgrid", label: "SendGrid",       icon: "📧", enabled: false, category: "comms" },
];

const MOCK_AUDIT = [
  { id: "a1", ts: "2026-02-20 14:32", action: "task_create",    target: "TASK-005 · Landing Page Redesign",  result: "AUTONOMOUS", by: "Sistema" },
  { id: "a2", ts: "2026-02-20 13:15", action: "doc_update",     target: "DOC-003 · Q3 Marketing Report",     result: "AUTONOMOUS", by: "Sistema" },
  { id: "a3", ts: "2026-02-20 12:41", action: "idea_create",    target: "IDEA-003 · AI Sales Forecasting",   result: "APPROVAL",   by: "Sistema" },
  { id: "a4", ts: "2026-02-19 18:02", action: "external_api",   target: "GET api.hubspot.com/v3/contacts",   result: "BLOCKED",    by: "Gateway" },
  { id: "a5", ts: "2026-02-19 14:55", action: "task_update",    target: "TASK-008 · API Documentation",      result: "AUTONOMOUS", by: "Sistema" },
  { id: "a6", ts: "2026-02-19 11:20", action: "idea_delete",    target: "IDEA-002 · B2B Partnership Portal", result: "APPROVAL",   by: "User" },
  { id: "a7", ts: "2026-02-18 09:04", action: "project_create", target: "PROJ-008 · Enterprise Pilot",       result: "BLOCKED",    by: "Gateway" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERM_LEVEL_CONFIG: Record<PermLevel, { label: string; short: string; bg: string; border: string; text: string; dot: string }> = {
  AUTONOMOUS: { label: "Autónomo",  short: "AUTO",   bg: "bg-violet-500/15",  border: "border-violet-500/30",  text: "text-violet-300",        dot: "bg-violet-400" },
  APPROVAL:   { label: "Aprobación",short: "APROV",  bg: "bg-amber-500/15",   border: "border-amber-500/30",   text: "text-amber-300",         dot: "bg-amber-400" },
  BLOCKED:    { label: "Bloqueado", short: "BLOCK",  bg: "bg-slate-800",      border: "border-slate-700/50",   text: "text-slate-500",         dot: "bg-slate-600" },
};

const RISK_COLORS = { low: "text-emerald-400/70", medium: "text-amber-400/70", high: "text-rose-400/70" };

const TAB_ITEMS: { id: ConfigTab; label: string; icon: React.ElementType }[] = [
  { id: "overview",     label: "Resumen",         icon: BarChart3   },
  { id: "mode",         label: "Modo",             icon: Shield      },
  { id: "permissions",  label: "Permisos",         icon: Lock        },
  { id: "scope",        label: "Alcance",           icon: Layers      },
  { id: "limits",       label: "Límites",           icon: TrendingUp  },
  { id: "integrations", label: "Integraciones",     icon: Plug        },
  { id: "automation",   label: "Automatización",    icon: Zap         },
  { id: "audit",        label: "Auditoría",         icon: Terminal    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function PermLevelButton({
  level,
  active,
  onClick,
}: {
  level: PermLevel;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = PERM_LEVEL_CONFIG[level];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-[10px]",
        active ? cn(cfg.bg, cfg.border, cfg.text) : "bg-muted/40 border-border/40 text-muted-foreground/40 hover:border-border hover:text-muted-foreground"
      )}
      style={{ fontWeight: active ? 700 : 400 }}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", active ? cfg.dot : "bg-muted-foreground/20")} />
      {cfg.short}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground/50 uppercase tracking-widest mb-3" style={{ fontSize: "9px", fontWeight: 700 }}>
      {children}
    </p>
  );
}

// ─── Tab panels ───────────────────────────────────────────────────────────────

type AutonomyLevel = 1 | 2 | 3;
type PermPackage = "OBSERVER" | "OPERATOR" | "EXECUTOR";

const AUTONOMY_LEVELS: { level: AutonomyLevel; label: string; sublabel: string; desc: string; color: string; bg: string; border: string }[] = [
  { level: 1, label: "Nivel 1 · Guardián",  sublabel: "HITL en todo",         desc: "Toda acción requiere aprobación humana. Máxima seguridad.",                  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  { level: 2, label: "Nivel 2 · Operador",  sublabel: "HITL en alto riesgo",  desc: "Tareas ROUTINE son autónomas. HIGH_RISK requiere aprobación humana.",        color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  { level: 3, label: "Nivel 3 · Ejecutor",  sublabel: "Máxima autonomía",      desc: "Opera sin intervención excepto en acciones catastróficas. Solo Enterprise.", color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/30"    },
];

const PERM_PACKAGES: { id: PermPackage; label: string; desc: string; perms: string[] }[] = [
  { id: "OBSERVER", label: "Observer",  desc: "Solo lectura y generación de sugerencias.",     perms: ["read_all", "suggest_only"]                      },
  { id: "OPERATOR", label: "Operator",  desc: "Puede crear y editar, no eliminar ni publicar.", perms: ["read_all", "write_standard", "no_delete"]        },
  { id: "EXECUTOR", label: "Executor",  desc: "Acceso completo incluyendo APIs externas.",      perms: ["read_all", "write_all", "external_api", "delete"] },
];

// ─── Privacy Receptionist ────────────────────────────────────────────────────

type StorageProvider = "S3" | "Private" | "GCS" | "Azure";

interface PrivacyReceptionistConfig {
  storage_provider: StorageProvider;
  endpoint_url: string;
  auth_secret_id: string;
  enabled: boolean;
}

const STORAGE_PROVIDERS: { id: StorageProvider; label: string; icon: string; desc: string }[] = [
  { id: "Private", label: "Private Server", icon: "🏛️", desc: "Servidor privado — datos nunca salen de tu infra" },
  { id: "S3",      label: "AWS S3",         icon: "☁️", desc: "Bucket S3 con cifrado SSE-S3 en tu cuenta AWS" },
  { id: "GCS",     label: "Google Cloud",   icon: "🌐", desc: "GCS con políticas IAM propias" },
  { id: "Azure",   label: "Azure Blob",     icon: "🔷", desc: "Azure Blob con managed identity" },
];

function PrivacyReceptionistPanel() {
  const [cfg, setCfg] = React.useState<PrivacyReceptionistConfig>({
    storage_provider: "Private",
    endpoint_url: "",
    auth_secret_id: "",
    enabled: false,
  });
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    if (!cfg.endpoint_url) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      toast.success("Privacy Receptionist configurado", {
        description: `Datos redirigidos a ${cfg.storage_provider}. auth_secret_id en Vault.`,
      });
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all duration-300",
      cfg.enabled ? "border-blue-500/30 bg-blue-500/5" : "border-border/60 bg-muted/20"
    )}>
      <div className="flex items-center gap-3 px-4 py-4">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all",
          cfg.enabled ? "bg-blue-500/15 border-blue-500/30" : "bg-muted border-border"
        )}>
          <Server className={cn("w-4 h-4", cfg.enabled ? "text-blue-400" : "text-muted-foreground/40")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Privacy Receptionist</p>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0" style={{ fontSize: 9, fontWeight: 700 }}>
              <Shield className="w-2 h-2" />
              DATA SOVEREIGNTY
            </span>
          </div>
          <p className="text-muted-foreground/50 text-xs mt-0.5">
            {cfg.enabled ? `Datos → ${cfg.storage_provider}` : "Configura el servidor de datos externo del agente"}
          </p>
        </div>
        <Switch
          checked={cfg.enabled}
          onCheckedChange={(v) => setCfg((p) => ({ ...p, enabled: v }))}
          className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-switch-background shrink-0"
        />
      </div>

      {cfg.enabled && (
        <div className="border-t border-blue-500/15 p-4 space-y-4">
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300/70 text-xs leading-relaxed">
              El Portero interceptará los datos sensibles antes de que toquen la infraestructura de Cerebrin.
              Las credenciales se almacenan en <span className="font-mono text-blue-300">Supabase Vault · AES-256</span>.
            </p>
          </div>

          {/* Storage Provider */}
          <div>
            <p className="text-muted-foreground/50 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 700 }}>
              Proveedor de Almacenamiento (storage_provider)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STORAGE_PROVIDERS.map(({ id, label, icon, desc }) => {
                const active = cfg.storage_provider === id;
                return (
                  <button
                    key={id}
                    onClick={() => setCfg((p) => ({ ...p, storage_provider: id }))}
                    className={cn(
                      "flex items-start gap-2.5 p-3 rounded-xl border transition-all text-left",
                      active ? "border-blue-500/40 bg-blue-600/8" : "border-border/50 bg-muted/20 hover:border-border"
                    )}
                  >
                    <span className="text-sm shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs", active ? "text-foreground" : "text-muted-foreground")} style={{ fontWeight: active ? 700 : 400 }}>{label}</p>
                      <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: "10px", lineHeight: 1.4 }}>{desc}</p>
                    </div>
                    {active && <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-500 flex items-center justify-center shrink-0 mt-0.5"><div className="w-1 h-1 rounded-full bg-white" /></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="text-muted-foreground/50 uppercase tracking-widest mb-1.5 block" style={{ fontSize: "9px", fontWeight: 700 }}>endpoint_url</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/40 focus-within:border-blue-500/40 transition-all">
              <Globe className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              <input
                type="url"
                value={cfg.endpoint_url}
                onChange={(e) => setCfg((p) => ({ ...p, endpoint_url: e.target.value }))}
                placeholder="https://your-private-server.com/api/data"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none font-mono"
                style={{ fontSize: 11 }}
              />
            </div>
          </div>

          {/* Auth Secret ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-muted-foreground/50 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 700 }}>auth_secret_id</label>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground/40" style={{ fontWeight: 600 }}>Vault · AES-256</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/40 focus-within:border-blue-500/40 transition-all">
              <Lock className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              <input
                type="password"
                value={cfg.auth_secret_id}
                onChange={(e) => setCfg((p) => ({ ...p, auth_secret_id: e.target.value }))}
                placeholder="vs_•••••••••••••••••••••"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none font-mono"
                style={{ fontSize: 11 }}
              />
            </div>
            <p className="text-muted-foreground/30 text-[10px] mt-1.5 px-1">
              UUID del secreto en Vault. Usar <span className="font-mono">POST /api/vault/secrets</span> para registrar.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !cfg.endpoint_url}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs transition-all",
              saved ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : saving || !cfg.endpoint_url ? "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                : "bg-blue-600/80 hover:bg-blue-600 text-white border-blue-500/40"
            )}
            style={{ fontWeight: 600 }}
          >
            {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Guardando…</>
              : saved ? <><Check className="w-3.5 h-3.5" />Configuración guardada</>
              : <><Save className="w-3.5 h-3.5" />Guardar configuración</>}
          </button>
        </div>
      )}
    </div>
  );
}

function OverviewPanel({ agent, onNavigate }: { agent: AgentForConfig; onNavigate?: (tab: ConfigTab) => void }) {
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>(1);
  const [permPackage,   setPermPackage]   = useState<PermPackage>("OPERATOR");
  const [mirrorActive,  setMirrorActive]  = useState(false);

  const statItems = [
    { icon: Zap,    label: "Tareas completadas", value: agent.tasksCompleted.toLocaleString(), color: "text-violet-400" },
    { icon: Shield, label: "Confianza promedio",  value: agent.avgConfidence > 0 ? `${agent.avgConfidence}%` : "—",          color: "text-blue-400" },
    { icon: Clock,  label: "Última ejecución",   value: agent.lastRun,                          color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-sm mb-0.5" style={{ fontWeight: 700 }}>Resumen del Agente</h3>
        <p className="text-muted-foreground text-xs">Métricas de rendimiento y estado operativo</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {statItems.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <s.icon className={cn("w-4 h-4 mb-2", s.color)} />
            <p className="text-foreground text-lg tabular-nums" style={{ fontWeight: 700 }}>{s.value}</p>
            <p className="text-muted-foreground/60 mt-0.5" style={{ fontSize: "10px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* System prompt preview */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
          <Terminal className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground/70" style={{ fontWeight: 600 }}>System Prompt</span>
        </div>
        <div className="px-4 py-4">
          <p className="text-muted-foreground text-xs leading-relaxed font-mono">{agent.systemPrompt}</p>
        </div>
      </div>

      {/* HITL status + Permission Badge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* HITL Status */}
        <div className={cn(
          "flex flex-col gap-2 p-4 rounded-2xl border",
          agent.hitl
            ? "bg-amber-500/8 border-amber-500/20"
            : "bg-muted/20 border-border/60"
        )}>
          <div className="flex items-center gap-2">
            <ShieldCheck className={cn("w-4 h-4 shrink-0", agent.hitl ? "text-amber-400" : "text-muted-foreground/40")} />
            <p className="text-foreground text-xs" style={{ fontWeight: 600 }}>
              {agent.hitl ? "HITL Activo" : "HITL Inactivo"}
            </p>
            {!agent.hitl && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 ml-auto shrink-0" style={{ fontSize: "9px" }}>
                <AlertTriangle className="w-2.5 h-2.5" />
                Riesgo
              </span>
            )}
          </div>
          <p className="text-muted-foreground/60 text-[11px]">
            {agent.hitl
              ? "Acciones críticas requieren aprobación humana"
              : "Opera con autonomía completa"
            }
          </p>
        </div>

        {/* Current Permission Level */}
        <div className="flex flex-col gap-2 p-4 rounded-2xl border border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 shrink-0 text-violet-400" />
            <p className="text-foreground text-xs" style={{ fontWeight: 600 }}>
              Nivel de Autonomía
            </p>
          </div>
          <PermissionBadge level={autonomyLevel as LadderLevel} className="self-start" />
        </div>
      </div>

      {/* ── Permission Ladder (New Visual Component) ── */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
          <Layers className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>Permission Ladder</span>
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-violet-600/15 border border-violet-500/25 text-violet-400" style={{ fontWeight: 700 }}>Visual</span>
        </div>
        <div className="p-4">
          <PermissionLadder 
            currentLevel={autonomyLevel as LadderLevel} 
            currentPackage={permPackage}
            showLabel={false}
          />
        </div>
      </div>

      {/* ── Cognitive Mirror (AI Twin) ── */}
      <div className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        mirrorActive ? "border-indigo-500/40 bg-indigo-500/5" : "border-border/60 bg-muted/20"
      )}>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all", mirrorActive ? "bg-indigo-500/15 border-indigo-500/30" : "bg-muted border-border")}>
            <Sparkles className={cn("w-4 h-4", mirrorActive ? "text-indigo-400" : "text-muted-foreground/40")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Cognitive Mirror · AI Twin</p>
              {mirrorActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400" style={{ fontSize: "9px", fontWeight: 700 }}>
                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse inline-block" />
                  MIRROR ACTIVE
                </span>
              )}
            </div>
            <p className="text-muted-foreground/50 text-xs mt-0.5">
              {mirrorActive
                ? `${agent.name} está en modo simbiosis con carlos@ebox.lat`
                : "Vincula el agente a un usuario específico para modo simbiosis"
              }
            </p>
          </div>
          <Switch
            checked={mirrorActive}
            onCheckedChange={setMirrorActive}
            className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-switch-background shrink-0"
          />
        </div>
        {mirrorActive && (
          <div className="px-4 pb-4 space-y-3">
            <div className="h-px bg-indigo-500/15" />
            {/* User binding */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
              <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground" style={{ fontWeight: 600 }}>Carlos García</p>
                <p className="text-[10px] text-muted-foreground/50">carlos@ebox.lat · assigned_user_id: usr_2x9mK</p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-600/15 border border-indigo-500/25 text-indigo-400" style={{ fontWeight: 700 }}>VINCULADO</span>
            </div>
            {/* Simbiosis info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Sesiones espejadas", value: "47" },
                { label: "Decisiones adoptadas", value: "89%" },
              ].map(({ label, value }) => (
                <div key={label} className="px-3 py-2 rounded-xl bg-muted/20 border border-border/40">
                  <p className="text-indigo-400 tabular-nums" style={{ fontSize: "18px", fontWeight: 700 }}>{value}</p>
                  <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: "9px" }}>{label}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground/30 text-[10px] leading-relaxed px-1">
              El agente aprende de las decisiones de este usuario para mejorar sus sugerencias. El modelo cognitivo se actualiza cada 24h. El usuario puede desactivar la simbiosis en cualquier momento.
            </p>
          </div>
        )}
      </div>

      {/* ── Privacy Receptionist ── */}
      <PrivacyReceptionistPanel />

      {/* Quick links */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 divide-y divide-border/40">
        {[
          { label: "Ir a Permisos de Acciones",  icon: Lock,       tab: "permissions" as ConfigTab },
          { label: "Configurar Alcance",          icon: Layers,     tab: "scope" as ConfigTab },
          { label: "Ver Auditoría de Acciones",   icon: Terminal,   tab: "audit" as ConfigTab },
        ].map((link) => (
          <button
            key={link.tab}
            onClick={() => onNavigate?.(link.tab)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left group"
          >
            <div className="flex items-center gap-3">
              <link.icon className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{link.label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ModePanel({
  selectedPreset,
  isAdvanced,
  onSelectPreset,
  onToggleAdvanced,
}: {
  selectedPreset: SafePreset;
  isAdvanced: boolean;
  onSelectPreset: (p: SafePreset) => void;
  onToggleAdvanced: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-sm mb-0.5" style={{ fontWeight: 700 }}>Modo de Operación</h3>
        <p className="text-muted-foreground text-xs">Define cómo interactúa el agente con el sistema. Puedes usar perfiles guiados o configuración granular avanzada.</p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-border/60 bg-muted/20">
        <div>
          <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>
            {isAdvanced ? "Modo Avanzado" : "Modo Guiado"}
          </p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {isAdvanced
              ? "Configuración granular completa de todos los permisos"
              : "Elige un perfil de seguridad predefinido — recomendado para empezar"
            }
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] text-muted-foreground/60">Guiado</span>
          <Switch
            checked={isAdvanced}
            onCheckedChange={onToggleAdvanced}
            className="data-[state=checked]:bg-violet-600 data-[state=unchecked]:bg-switch-background"
          />
          <span className="text-[10px] text-muted-foreground/60">Avanzado</span>
        </div>
      </div>

      {!isAdvanced ? (
        <div>
          {/* Info banner */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-blue-500/8 border border-blue-500/20">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300/80 text-xs leading-relaxed">
              Los presets configuran automáticamente todos los permisos de acción. Puedes cambiar al Modo Avanzado en cualquier momento para personalizar cada permiso individualmente.
            </p>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <SectionLabel>Perfil de Seguridad</SectionLabel>
            {(Object.entries(SAFE_PRESETS) as [SafePreset, typeof SAFE_PRESETS[SafePreset]][]).map(([key, preset]) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === key;
              const isEnterprise = key === "autonomous";
              return (
                <div key={key} className="relative">
                  <button
                    onClick={() => {
                      if (isEnterprise) {
                        toast.error("Modo Autónomo · Plan Enterprise", {
                          description: "Este modo requiere Enterprise para garantizar auditoría completa y gobernanza de IA.",
                        });
                        return;
                      }
                      onSelectPreset(key);
                    }}
                    className={cn(
                      "w-full flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 text-left",
                      isEnterprise
                        ? "border-border/30 bg-muted/10 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-violet-500/40 bg-violet-600/8 ring-1 ring-violet-500/20"
                        : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                      isSelected && !isEnterprise ? "bg-violet-500/15 border-violet-500/30" : "bg-muted border-border"
                    )}>
                      <Icon className={cn("w-5 h-5", isSelected && !isEnterprise ? "text-violet-400" : "text-muted-foreground/50")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={cn("text-sm", isSelected && !isEnterprise ? "text-foreground" : "text-muted-foreground")} style={{ fontWeight: 700 }}>
                          {preset.label}
                        </span>
                        <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md border", preset.badgeClass)} style={{ fontSize: "9px", fontWeight: 700 }}>
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-muted-foreground/60 text-[11px] mb-1">{preset.sublabel}</p>
                      <p className="text-muted-foreground text-xs leading-relaxed">{preset.desc}</p>
                    </div>
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                      isSelected && !isEnterprise ? "border-violet-500 bg-violet-500" : "border-border bg-muted"
                    )}>
                      {isSelected && !isEnterprise && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                  {isEnterprise && (
                    <div className="absolute top-3 right-10 flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-600/15 border border-violet-500/25 pointer-events-none">
                      <Lock className="w-2.5 h-2.5 text-violet-400" />
                      <span className="text-violet-400" style={{ fontSize: "9px", fontWeight: 700 }}>Enterprise</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preset permissions preview */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground/70" style={{ fontWeight: 600 }}>
                Vista previa de permisos — {SAFE_PRESETS[selectedPreset].label}
              </span>
            </div>
            <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(SAFE_PRESETS[selectedPreset].permissions).map(([key, level]) => {
                const cfg = PERM_LEVEL_CONFIG[level as PermLevel];
                return (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground/60 text-[10px] truncate">{key.replace("_", " ")}</span>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md border shrink-0", cfg.bg, cfg.border, cfg.text)} style={{ fontWeight: 700 }}>
                      {cfg.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-violet-500/8 border border-violet-500/20">
          <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-violet-300/80 text-xs leading-relaxed">
            Modo Avanzado activado. Configura cada permiso individualmente en la sección <strong>Permisos</strong>, el alcance en <strong>Alcance</strong>, y los límites operativos en <strong>Límites</strong>.
          </p>
        </div>
      )}
    </div>
  );
}

function PermissionsPanel({
  permissions,
  onChange,
  isAdvanced,
}: {
  permissions: PermissionsMap;
  onChange: (key: PermKey, level: PermLevel) => void;
  isAdvanced: boolean;
}) {
  if (!isAdvanced) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Lock className="w-8 h-8 text-muted-foreground/20" />
        <p className="text-muted-foreground text-sm text-center">Los permisos están gestionados por el Preset seleccionado.</p>
        <p className="text-muted-foreground/50 text-xs text-center">Activa el <strong>Modo Avanzado</strong> en «Modo de Operación» para configurar cada permiso.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-sm mb-0.5" style={{ fontWeight: 700 }}>Permisos de Acción</h3>
        <p className="text-muted-foreground text-xs">Define qué puede hacer este agente en cada tipo de entidad. Las opciones se aplican a la cola HITL en tiempo real.</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-muted/20 border border-border/60 flex-wrap">
        {(Object.entries(PERM_LEVEL_CONFIG) as [PermLevel, typeof PERM_LEVEL_CONFIG[PermLevel]][]).map(([level, cfg]) => (
          <div key={level} className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", cfg.dot)} />
            <span className="text-xs text-muted-foreground"><span style={{ fontWeight: 700 }}>{cfg.short}</span> = {cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Permission sections */}
      {PERM_SECTIONS.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div key={section.label} className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40 bg-muted/10">
              <SectionIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>{section.label}</span>
            </div>
            <div className="divide-y divide-border/30">
              {section.keys.map(({ key, label, desc, risk }) => (
                <div key={key} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground" style={{ fontWeight: 500 }}>{label}</span>
                      <span className={cn("text-[9px]", RISK_COLORS[risk])}>
                        {risk === "high" ? "⚠ riesgo alto" : risk === "medium" ? "· riesgo medio" : "· bajo riesgo"}
                      </span>
                    </div>
                    <p className="text-muted-foreground/60 text-[11px] truncate">{desc}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {(["AUTONOMOUS", "APPROVAL", "BLOCKED"] as PermLevel[]).map((level) => (
                      <PermLevelButton
                        key={level}
                        level={level}
                        active={permissions[key] === level}
                        onClick={() => onChange(key, level)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Risk summary */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-400 text-xs" style={{ fontWeight: 700 }}>Acciones de riesgo alto activas</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(permissions) as [PermKey, PermLevel][])
            .filter(([, v]) => v === "AUTONOMOUS")
            .filter(([k]) => PERM_SECTIONS.flatMap(s => s.keys).find(pk => pk.key === k && pk.risk === "high"))
            .map(([key]) => (
              <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-rose-500/20 bg-rose-500/10 text-rose-400 text-[10px]">
                <Zap className="w-2.5 h-2.5" />
                {key.replace("_", " ")}
              </span>
            ))}
          {(Object.entries(permissions) as [PermKey, PermLevel][])
            .filter(([, v]) => v === "AUTONOMOUS")
            .filter(([k]) => PERM_SECTIONS.flatMap(s => s.keys).find(pk => pk.key === k && pk.risk === "high"))
            .length === 0 && (
              <span className="text-muted-foreground/40 text-xs">Ninguna acción de alto riesgo en modo AUTÓNOMO ✓</span>
            )}
        </div>
      </div>
    </div>
  );
}

function ScopePanel({ scope, onChange }: {
  scope: AgentScope;
  onChange: (s: AgentScope) => void;
}) {
  const toggleProject = (id: string) => {
    const next = scope.projects.includes(id)
      ? scope.projects.filter((p) => p !== id)
      : [...scope.projects, id];
    onChange({ ...scope, projects: next });
  };
  const toggleTeam = (id: string) => {
    const next = scope.teams.includes(id)
      ? scope.teams.filter((t) => t !== id)
      : [...scope.teams, id];
    onChange({ ...scope, teams: next });
  };
  const toggleTaskType = (type: string) => {
    const next = scope.taskTypes.includes(type)
      ? scope.taskTypes.filter((t) => t !== type)
      : [...scope.taskTypes, type];
    onChange({ ...scope, taskTypes: next });
  };

  const taskTypeOptions = [
    { id: "TASK",    label: "Tareas",     icon: ListTodo,    color: "text-blue-400" },
    { id: "SUBTASK", label: "Subtareas",  icon: ListTodo,    color: "text-blue-300/60" },
    { id: "IDEA",    label: "Ideas",      icon: Lightbulb,   color: "text-amber-400" },
    { id: "PROJECT", label: "Proyectos",  icon: FolderKanban,color: "text-violet-400" },
    { id: "DOCUMENT",label: "Documentos", icon: FileText,    color: "text-slate-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-sm mb-0.5" style={{ fontWeight: 700 }}>Alcance de Operación</h3>
        <p className="text-muted-foreground text-xs">Define en qué proyectos, tipos de entidad y equipos puede operar este agente.</p>
      </div>

      {/* Projects scope */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>Proyectos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/50">Acceso total</span>
            <span className="px-1 py-0.5 rounded text-violet-400/50" style={{ fontSize: "8px", fontWeight: 600, border: "1px solid rgba(139,92,246,0.2)" }}>Enterprise</span>
            <Switch
              checked={scope.allowAllProjects}
              onCheckedChange={(v) => {
                if (v) {
                  toast("Plan Enterprise requerido", { description: "El acceso total a proyectos requiere Enterprise. Selecciona proyectos específicos." });
                  return;
                }
                onChange({ ...scope, allowAllProjects: v });
              }}
              className="data-[state=checked]:bg-violet-600 data-[state=unchecked]:bg-switch-background"
            />
          </div>
        </div>
        {!scope.allowAllProjects ? (
          <div className="p-4 space-y-2">
            <p className="text-[10px] text-muted-foreground/50 mb-3">
              Selecciona los proyectos a los que tiene acceso · <span className="text-violet-400">{scope.projects.length} seleccionados</span>
            </p>
            {MOCK_PROJECTS.map((proj) => {
              const selected = scope.projects.includes(proj.id);
              return (
                <button
                  key={proj.id}
                  onClick={() => toggleProject(proj.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 text-left",
                    selected ? "bg-violet-500/10 border-violet-500/30" : "bg-muted/20 border-border/40 hover:border-border"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full shrink-0", proj.color, !selected && "opacity-30")} />
                  <span className={cn("flex-1 text-sm", selected ? "text-foreground" : "text-muted-foreground")} style={{ fontWeight: selected ? 600 : 400 }}>
                    {proj.name}
                  </span>
                  {selected && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-4 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Acceso a todos los proyectos del workspace</span>
          </div>
        )}
      </div>

      {/* Entity types */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>Tipos de Entidad</span>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {taskTypeOptions.map((opt) => {
            const selected = scope.taskTypes.includes(opt.id);
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => toggleTaskType(opt.id)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150",
                  selected ? "bg-blue-500/10 border-blue-500/30" : "bg-muted/20 border-border/40 hover:border-border"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 shrink-0", selected ? opt.color : "text-muted-foreground/30")} />
                <span className={cn("text-sm flex-1 text-left", selected ? "text-foreground" : "text-muted-foreground")} style={{ fontWeight: selected ? 600 : 400 }}>
                  {opt.label}
                </span>
                {selected && <Check className="w-3 h-3 text-blue-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Teams scope */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>Equipos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/50">Todos los equipos</span>
            <span className="px-1 py-0.5 rounded text-violet-400/50" style={{ fontSize: "8px", fontWeight: 600, border: "1px solid rgba(139,92,246,0.2)" }}>Enterprise</span>
            <Switch
              checked={scope.allowAllTeams}
              onCheckedChange={(v) => {
                if (v) {
                  toast("Plan Enterprise requerido", { description: "El acceso a todos los equipos requiere el plan Enterprise." });
                  return;
                }
                onChange({ ...scope, allowAllTeams: v });
              }}
              className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-switch-background"
            />
          </div>
        </div>
        {!scope.allowAllTeams ? (
          <div className="p-4 space-y-2">
            {MOCK_TEAMS.map((team) => {
              const selected = scope.teams.includes(team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => toggleTeam(team.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 text-left",
                    selected ? "bg-emerald-500/10 border-emerald-500/30" : "bg-muted/20 border-border/40 hover:border-border"
                  )}
                >
                  <User className={cn("w-3.5 h-3.5 shrink-0", selected ? "text-emerald-400" : "text-muted-foreground/30")} />
                  <span className={cn("flex-1 text-sm", selected ? "text-foreground" : "text-muted-foreground")} style={{ fontWeight: selected ? 600 : 400 }}>
                    {team.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">{team.members} miembros</span>
                  {selected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-4 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-muted-foreground">Acceso a todos los equipos del workspace</span>
          </div>
        )}
      </div>
    </div>
  );
}

function LimitsPanel({ limits, onChange }: {
  limits: AgentLimits;
  onChange: (l: AgentLimits) => void;
}) {
  const limitItems = [
    {
      label: "Tareas por hora",
      desc: "Máximo de tareas que puede iniciar en 60 minutos",
      icon: Zap,
      field: "maxTasksPerHour" as keyof AgentLimits,
      suffix: "tareas/h",
      min: 1, max: 100, step: 1,
      risk: limits.maxTasksPerHour > 50 ? "alto" : "normal",
    },
    {
      label: "Llamadas API por día",
      desc: "Límite de invocaciones a APIs externas en 24 horas",
      icon: Globe,
      field: "maxApiCallsPerDay" as keyof AgentLimits,
      suffix: "calls/día",
      min: 0, max: 10000, step: 100,
      risk: limits.maxApiCallsPerDay > 5000 ? "alto" : "normal",
    },
    {
      label: "Presupuesto mensual",
      desc: "Tope de gasto en tokens/API para este agente",
      icon: DollarSign,
      field: "budgetCapUsd" as keyof AgentLimits,
      prefix: "$",
      suffix: "USD/mes",
      min: 0, max: 5000, step: 10,
      risk: limits.budgetCapUsd > 1000 ? "alto" : "normal",
    },
    {
      label: "Umbral de confianza HITL",
      desc: "Si la confianza del agente está por debajo de este valor, la acción va a revisión humana",
      icon: Shield,
      field: "confidenceThreshold" as keyof AgentLimits,
      suffix: "%",
      min: 0, max: 100, step: 5,
      risk: limits.confidenceThreshold < 70 ? "alto" : "normal",
    },
    {
      label: "Tareas concurrentes",
      desc: "Número máximo de tareas que puede ejecutar en paralelo",
      icon: Layers,
      field: "maxConcurrentTasks" as keyof AgentLimits,
      suffix: "paralelas",
      min: 1, max: 20, step: 1,
      risk: limits.maxConcurrentTasks > 10 ? "alto" : "normal",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-sm mb-0.5" style={{ fontWeight: 700 }}>Límites Operativos</h3>
        <p className="text-muted-foreground text-xs">Controla el ancho de banda, gasto y autonomía del agente para prevenir comportamientos inesperados.</p>
      </div>

      <div className="space-y-4">
        {limitItems.map((item) => {
          const Icon = item.icon;
          const value = limits[item.field] as number;
          const pct = ((value - item.min) / (item.max - item.min)) * 100;
          return (
            <div key={item.field} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />
                  <span className="text-sm text-foreground" style={{ fontWeight: 600 }}>{item.label}</span>
                  {item.risk === "alto" && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400" style={{ fontSize: "9px", fontWeight: 700 }}>
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Alto
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {item.prefix && <span className="text-muted-foreground text-sm">{item.prefix}</span>}
                  <input
                    type="number"
                    value={value}
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    onChange={(e) => onChange({ ...limits, [item.field]: Number(e.target.value) })}
                    className="w-20 px-2 py-1 rounded-lg bg-muted border border-border text-foreground text-sm text-right outline-none focus:border-violet-500/60 tabular-nums"
                    style={{ fontWeight: 700 }}
                  />
                  <span className="text-muted-foreground/60 text-xs shrink-0">{item.suffix}</span>
                </div>
              </div>
              <p className="text-muted-foreground/50 text-[11px] mb-2.5">{item.desc}</p>
              {/* Slider track */}
              <div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("absolute left-0 top-0 bottom-0 rounded-full transition-all duration-300",
                    item.risk === "alto" ? "bg-amber-500/60" : "bg-violet-500/60"
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground/30">{item.min}</span>
                <span className="text-[10px] text-muted-foreground/30">{item.max}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── n8n Automation Bridge ────────────────────────────────────────────────────
// Kept for IntegrationsPanel backward compat — full version is AutomationPanel (dedicated tab)

const N8N_EVENTS = [
  { id: "nueva_idea",      label: "Nueva Idea creada",           checked: true },
  { id: "cambio_estado",   label: "Cambio de Estado de Tarea",   checked: true },
  { id: "tarea_completada",label: "Tarea Completada",            checked: true },
  { id: "aprobacion_hitl", label: "Solicitud de Aprobación HITL",checked: false },
  { id: "proyecto_creado", label: "Proyecto Creado",             checked: false },
  { id: "idea_promovida",  label: "Idea Promovida a Proyecto",   checked: true },
  { id: "agente_bloqueado",label: "Agente Bloqueado por Límite", checked: false },
];

function N8nConnector() {
  const [enabled, setEnabled]       = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://your-n8n-instance.app/webhook/cerebrin");
  const [saved, setSaved]           = useState(false);
  const [testing, setTesting]       = useState(false);
  const [testOk, setTestOk]         = useState<boolean | null>(null);
  const [events, setEvents]         = useState(N8N_EVENTS);

  const toggleEvent = (id: string) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e)));

  const handleSave = () => {
    setSaved(true);
    toast.success("n8n Webhook guardado", { description: "La URL se almacenó en Vault de forma segura." });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = () => {
    setTesting(true);
    setTestOk(null);
    setTimeout(() => {
      setTesting(false);
      setTestOk(Math.random() > 0.2); // 80% success in mock
    }, 1800);
  };

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all duration-300",
      enabled ? "border-[#EA4B00]/30 bg-[#EA4B00]/5" : "border-border/60 bg-muted/10"
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#EA4B00]/15">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
          style={{ backgroundColor: "#EA4B0018", borderColor: "#EA4B0035" }}>
          <span style={{ fontSize: 18 }}>⚡</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-foreground text-sm" style={{ fontWeight: 700 }}>Automation Bridge · n8n</p>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md border" style={{ backgroundColor: "#EA4B0015", borderColor: "#EA4B0035", color: "#EA4B00", fontWeight: 800 }}>
              Add-on
            </span>
          </div>
          <p className="text-muted-foreground/60 text-xs">Dispara este agente desde workflows n8n y emite eventos de vuelta</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          className="data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-switch-background shrink-0"
        />
      </div>

      {enabled && (
        <div className="p-4 space-y-4">
          {/* Webhook Trigger URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-muted-foreground/60 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 700 }}>
                Webhook Trigger URL
              </p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground/40" style={{ fontWeight: 600 }}>
                Vault · Cifrado AES-256
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-n8n-instance.app/webhook/..."
                className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/30 outline-none bg-muted/60 border border-border/60 focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/10 font-mono transition-all"
                style={{ fontSize: 11 }}
              />
              <button
                onClick={handleSave}
                className={cn(
                  "px-3.5 py-2 rounded-xl border transition-all text-xs shrink-0",
                  saved
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                )}
                style={{ fontWeight: 600 }}
              >
                {saved ? <span className="inline-flex items-center gap-1.5"><Check className="w-3 h-3" />Guardado</span> : "Guardar"}
              </button>
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={testing || !webhookUrl}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs transition-all duration-150",
                testing
                  ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                  : "border-border/60 bg-muted/40 text-muted-foreground hover:border-orange-500/40 hover:text-orange-400"
              )}
              style={{ fontWeight: 600 }}
            >
              {testing ? (
                <span className="inline-flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-orange-300/30 border-t-orange-300 animate-spin" />Probando conexión…</span>
              ) : (
                <span className="inline-flex items-center gap-1.5"><Plug className="w-3 h-3" />Probar Conexión</span>
              )}
            </button>
            {testOk === true && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Check className="w-3 h-3" />Conexión OK — n8n responde
              </span>
            )}
            {testOk === false && (
              <span className="flex items-center gap-1.5 text-xs text-rose-400">
                <AlertTriangle className="w-3 h-3" />Sin respuesta — verifica la URL y permisos
              </span>
            )}
          </div>

          {/* Event Picker */}
          <div>
            <p className="text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 700 }}>
              Eventos que disparan el Webhook
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {events.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => toggleEvent(evt.id)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all text-left",
                    evt.checked
                      ? "border-[#EA4B00]/30 bg-[#EA4B00]/8 text-orange-300"
                      : "border-border/40 bg-muted/20 text-muted-foreground hover:border-border"
                  )}
                >
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0",
                    evt.checked ? "border-orange-500 bg-orange-600" : "border-border"
                  )}>
                    {evt.checked && <Check className="w-2 h-2 text-white" />}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: evt.checked ? 600 : 400 }}>{evt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Badge origin note */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/20 border border-border/40">
            <Info className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
            <p className="text-muted-foreground/60 text-xs">
              Las acciones originadas por n8n mostrarán un badge <span style={{ color: "#EA4B00", fontWeight: 700 }}>⚡ n8n</span> en el Approval Queue y el Activity Feed para identificar su origen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vault Secret Row ─────────────────────────────────────────────────────────

function VaultSecretRow({ label, placeholder }: { label: string; placeholder: string }) {
  const [hasSaved, setHasSaved]   = useState(true); // mock: assume key saved
  const [updating, setUpdating]   = useState(false);
  const [tempVal,  setTempVal]    = useState("");

  if (hasSaved && !updating) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground" style={{ fontWeight: 500 }}>{label}</p>
          <p className="font-mono text-muted-foreground/40" style={{ fontSize: 10 }}>
            {placeholder.slice(0, 8)}{"•".repeat(24)}
          </p>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0" style={{ fontWeight: 700 }}>
          VAULT
        </span>
        <button
          onClick={() => setUpdating(true)}
          className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted shrink-0"
          style={{ fontWeight: 600 }}
        >
          Actualizar
        </button>
        <button
          onClick={() => { setHasSaved(false); setUpdating(false); }}
          className="text-xs text-rose-500/50 hover:text-rose-400 transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10 shrink-0"
          style={{ fontWeight: 600 }}
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Lock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground mb-1" style={{ fontWeight: 500 }}>{label}</p>
        <input
          type="password"
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value)}
          placeholder="Pega tu API key aquí — se cifrará al guardar"
          className="w-full px-3 py-1.5 rounded-lg text-xs text-foreground placeholder:text-muted-foreground/30 outline-none bg-muted/60 border border-border/60 focus:border-violet-500/60 font-mono transition-all"
          autoFocus
        />
      </div>
      <button
        onClick={() => { if (tempVal) { setHasSaved(true); setUpdating(false); setTempVal(""); toast.success("API Key guardada en Vault", { description: "Cifrada con AES-256. No se mostrará nuevamente." }); } }}
        disabled={!tempVal}
        className="px-3 py-1.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white border border-violet-500/40 transition-all disabled:opacity-40 text-xs shrink-0"
        style={{ fontWeight: 600 }}
      >
        Guardar
      </button>
      <button
        onClick={() => { setUpdating(false); setTempVal(""); }}
        className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Integrations Panel ───────────────────────────────────────────────────────

function IntegrationsPanel({
  integrations,
  onChange,
}: {
  integrations: AgentIntegration[];
  onChange: (i: AgentIntegration[]) => void;
}) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    onChange(integrations.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)));

  const testConnection = (id: string) => {
    setTestingId(id);
    setTimeout(() => {
      setTestingId(null);
      setTestResults((prev) => ({ ...prev, [id]: Math.random() > 0.15 }));
    }, 1500);
  };

  const grouped = integrations.reduce<Record<string, AgentIntegration[]>>((acc, i) => {
    acc[i.category] = [...(acc[i.category] ?? []), i];
    return acc;
  }, {});

  const categoryLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    data:  { label: "Datos & CRM",      icon: BarChart3, color: "text-blue-400" },
    comms: { label: "Comunicaciones",   icon: Globe,     color: "text-emerald-400" },
    cloud: { label: "Almacenamiento",   icon: Layers,    color: "text-violet-400" },
    code:  { label: "Dev & Código",     icon: Code2,     color: "text-amber-400" },
  };

  const enabledCount = integrations.filter((i) => i.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-foreground text-sm mb-0.5" style={{ fontWeight: 700 }}>Integraciones Externas</h3>
        <p className="text-muted-foreground text-xs">
          Controla qué servicios de terceros puede invocar este agente.
          <span className="ml-1 text-violet-400">{enabledCount} de {integrations.length} activadas</span>
        </p>
      </div>

      {/* ── n8n Automation Bridge (quick toggle — full config in Automatización tab) */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-border/60 bg-muted/10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "#EA4B0015", borderColor: "#EA4B0030", border: "1px solid" }}>
          <span style={{ fontSize: 16 }}>⚡</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Automation Bridge · n8n</p>
          <p className="text-muted-foreground/50 text-xs mt-0.5">Configura webhooks, eventos y Token Saver en la pestaña <strong className="text-orange-400">Automatización</strong></p>
        </div>
        <Zap className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
      </div>

      {/* ── Permission warning */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/8 border border-amber-500/20">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300/80 text-xs leading-relaxed">
          Las integraciones aquí activadas deben ser también permitidas en la sección de Permisos → <strong>external_api: AUTONOMOUS o APPROVAL</strong>. Si está en BLOCKED, ninguna integración podrá ejecutarse.
        </p>
      </div>

      {/* ── API Keys Vault */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>API Keys · Vault Seguro</span>
          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" style={{ fontWeight: 700 }}>
            AES-256 Cifrado
          </span>
        </div>
        <div className="divide-y divide-border/30">
          <VaultSecretRow label="OpenAI API Key"   placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          <VaultSecretRow label="HubSpot API Key"  placeholder="pat-eu1-xxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          <VaultSecretRow label="Slack Bot Token"  placeholder="xoxb-000000000000-000000000000-xxxxxx" />
        </div>
      </div>

      {/* ── Standard integrations by category */}
      {Object.entries(grouped).map(([cat, items]) => {
        const catCfg = categoryLabels[cat];
        const CatIcon = catCfg.icon;
        return (
          <div key={cat} className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <CatIcon className={cn("w-3.5 h-3.5", catCfg.color)} />
              <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>{catCfg.label}</span>
            </div>
            <div className="divide-y divide-border/30">
              {items.map((integration) => {
                const isTesting = testingId === integration.id;
                const testResult = testResults[integration.id];
                return (
                  <div key={integration.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base shrink-0">{integration.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate" style={{ fontWeight: 500 }}>{integration.label}</p>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] text-muted-foreground/40">
                            {integration.enabled ? "Acceso autorizado" : "Sin acceso"}
                          </p>
                          {testResult === true  && <span className="text-emerald-400 text-[9px]">· ✓ Conectado</span>}
                          {testResult === false && <span className="text-rose-400 text-[9px]">· ✗ Sin respuesta</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {integration.enabled && (
                        <button
                          onClick={() => testConnection(integration.id)}
                          disabled={isTesting}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/50 text-muted-foreground/50 hover:text-foreground hover:border-border transition-all"
                          style={{ fontSize: 10, fontWeight: 600 }}
                        >
                          {isTesting ? (
                            <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/30 border-t-muted-foreground animate-spin" />
                          ) : (
                            <Plug className="w-2.5 h-2.5" />
                          )}
                          Test
                        </button>
                      )}
                      {integration.enabled && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" style={{ fontSize: "9px", fontWeight: 700 }}>
                          <Check className="w-2 h-2" />ACTIVA
                        </span>
                      )}
                      <Switch
                        checked={integration.enabled}
                        onCheckedChange={() => toggle(integration.id)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-switch-background"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Automation Panel (dedicated tab — Section 10) ───────────────────────────
// Replaces the inline N8nConnector with a full-featured panel:
//  - Fetch/save config via PATCH /api/agents/:id/n8n-config
//  - Event Picker (all 7 events)
//  - Token Saver Toggle with model selector
//  - Live test with latency display

const TOKEN_SAVER_MODELS: { id: N8nAgentConfig["token_saver_model"]; label: string; desc: string; saving: string }[] = [
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo",  desc: "Más rápido, menor costo vs GPT-4o", saving: "~85% tokens" },
  { id: "mistral-7b",    label: "Mistral 7B",      desc: "Open-source, servidor privado Cerebrin",saving: "~92% tokens" },
  { id: "llama-3-8b",    label: "LLaMA 3 8B",      desc: "Meta open-source, sin costos de API",  saving: "~95% tokens" },
];

const ALL_EVENTS = [
  { id: "nueva_idea",       label: "Nueva Idea creada",            icon: "💡", category: "ideas"    },
  { id: "cambio_estado",    label: "Cambio de Estado de Tarea",    icon: "🔄", category: "tasks"    },
  { id: "tarea_completada", label: "Tarea Completada",             icon: "✅", category: "tasks"    },
  { id: "aprobacion_hitl",  label: "Solicitud de Aprobación HITL", icon: "🛡️", category: "hitl"     },
  { id: "proyecto_creado",  label: "Proyecto Creado",              icon: "📁", category: "projects" },
  { id: "idea_promovida",   label: "Idea Promovida a Proyecto",    icon: "🚀", category: "ideas"    },
  { id: "agente_bloqueado", label: "Agente Bloqueado por Límite",  icon: "🚫", category: "agents"   },
];

function AutomationPanel({ agentId }: { agentId: string }) {
  const [config, setConfig]     = useState<N8nAgentConfig | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [saved,   setSaved]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency_ms: number; message: string } | null>(null);

  // ── Load config on mount ──────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAgentN8nConfig(agentId).then((cfg) => {
      if (!cancelled) { setConfig(cfg); setLoading(false); }
    }).catch(() => {
      if (!cancelled) { setLoading(false); toast.error("No se pudo cargar configuración n8n"); }
    });
    return () => { cancelled = true; };
  }, [agentId]);

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-orange-500/30 border-t-orange-400 animate-spin" />
        <p className="text-xs text-muted-foreground/50 font-mono">GET /api/agents/{agentId}/n8n-config…</p>
      </div>
    );
  }

  const toggleEvent = (id: string) => {
    setConfig(prev => !prev ? prev : {
      ...prev,
      events: prev.events.includes(id)
        ? prev.events.filter(e => e !== id)
        : [...prev.events, id],
    });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    try {
      await saveAgentN8nConfig(agentId, {
        enabled: config.enabled,
        webhook_url: config.webhook_url,
        events: config.events,
        token_saver_enabled: config.token_saver_enabled,
        token_saver_model: config.token_saver_model,
      });
      setSaved(true);
      toast.success("Configuración n8n guardada en Vault", {
        description: `PATCH /api/agents/${agentId}/n8n-config ✓`,
      });
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Error al guardar configuración n8n");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config?.webhook_url) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testAgentN8nWebhook(agentId, config.webhook_url);
      setTestResult(result);
      if (result.success) {
        toast.success(`Webhook OK · ${result.latency_ms}ms`, { description: result.message });
      } else {
        toast.error("Webhook sin respuesta", { description: result.message });
      }
    } catch {
      toast.error("Error al probar webhook");
    } finally {
      setTesting(false);
    }
  };

  const activeEventCount = config.events.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h3 className="text-foreground text-sm mb-0.5" style={{ fontWeight: 700 }}>Automation Bridge · n8n</h3>
        <p className="text-muted-foreground text-xs">
          Conecta este agente a flujos n8n para delegar procesamiento repetitivo y reducir el consumo de tokens.
          <span className="ml-1 font-mono text-orange-400/70">PATCH /api/agents/{agentId}/n8n-config</span>
        </p>
      </div>

      {/* ── Master Enable ── */}
      <div className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        config.enabled ? "border-[#EA4B00]/30 bg-[#EA4B00]/5" : "border-border/60 bg-muted/10"
      )}>
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
            style={{ backgroundColor: "#EA4B0018", borderColor: "#EA4B0035" }}>
            <span style={{ fontSize: 18 }}>⚡</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-foreground text-sm" style={{ fontWeight: 700 }}>Automation Bridge</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md border"
                style={{ backgroundColor: "#EA4B0015", borderColor: "#EA4B0035", color: "#EA4B00", fontWeight: 800 }}>
                Add-on
              </span>
              {config.enabled && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-orange-400"
                  style={{ fontSize: 9, fontWeight: 700, backgroundColor: "#EA4B0010", border: "1px solid #EA4B0030" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  ACTIVO · {activeEventCount} eventos
                </span>
              )}
            </div>
            <p className="text-muted-foreground/60 text-xs mt-0.5">
              {config.enabled
                ? `Webhook configurado · Token Saver ${config.token_saver_enabled ? "ON" : "OFF"}`
                : "Activa para disparar y recibir flujos desde n8n"}
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(v) => setConfig(prev => prev ? { ...prev, enabled: v } : prev)}
            className="data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-switch-background shrink-0"
          />
        </div>
      </div>

      {config.enabled && (
        <>
          {/* ── Webhook URL ── */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <Globe className="w-3.5 h-3.5 text-orange-400/70" />
              <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>Webhook Trigger URL</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-muted border border-border text-muted-foreground/40" style={{ fontWeight: 600 }}>
                Vault · AES-256
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/40 focus-within:border-orange-500/40 transition-all">
                  <Plug className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                  <input
                    type="url"
                    value={config.webhook_url}
                    onChange={(e) => setConfig(prev => prev ? { ...prev, webhook_url: e.target.value } : prev)}
                    placeholder="https://your-n8n-instance.app/webhook/cerebrin"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none font-mono"
                    style={{ fontSize: 11 }}
                  />
                </div>
              </div>

              {/* ── Test Connection ── */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={handleTest}
                  disabled={testing || !config.webhook_url}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs transition-all",
                    testing
                      ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                      : "border-border/60 bg-muted/40 text-muted-foreground hover:border-orange-500/40 hover:text-orange-400"
                  )}
                  style={{ fontWeight: 600 }}
                >
                  {testing ? (
                    <><div className="w-3 h-3 rounded-full border-2 border-orange-300/30 border-t-orange-300 animate-spin" />Probando…</>
                  ) : (
                    <><Plug className="w-3 h-3" />POST /n8n-config/test</>
                  )}
                </button>
                {testResult && (
                  <span className={cn(
                    "flex items-center gap-1.5 text-xs",
                    testResult.success ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {testResult.success
                      ? <><Check className="w-3 h-3" />OK · {testResult.latency_ms}ms</>
                      : <><AlertTriangle className="w-3 h-3" />{testResult.status_code} Error</>
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Event Picker ── */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
              <Zap className="w-3.5 h-3.5 text-amber-400/70" />
              <span className="text-xs text-foreground/80" style={{ fontWeight: 700 }}>Eventos que disparan el Webhook</span>
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400" style={{ fontWeight: 700 }}>
                {activeEventCount}/{ALL_EVENTS.length} activos
              </span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {ALL_EVENTS.map((evt) => {
                const isActive = config.events.includes(evt.id);
                return (
                  <button
                    key={evt.id}
                    onClick={() => toggleEvent(evt.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left",
                      isActive
                        ? "border-[#EA4B00]/30 bg-[#EA4B00]/8"
                        : "border-border/40 bg-muted/20 hover:border-border"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all",
                      isActive ? "border-orange-500 bg-orange-600" : "border-border bg-muted/40"
                    )}>
                      {isActive && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 12 }}>{evt.icon}</span>
                        <span className={cn("text-xs truncate", isActive ? "text-orange-300" : "text-muted-foreground")}
                          style={{ fontWeight: isActive ? 600 : 400, fontSize: 10 }}>
                          {evt.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Token Saver Toggle ── */}
          <div className={cn(
            "rounded-2xl border overflow-hidden transition-all duration-300",
            config.token_saver_enabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-muted/10"
          )}>
            <div className="flex items-center gap-3 px-4 py-4">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all",
                config.token_saver_enabled ? "bg-emerald-500/15 border-emerald-500/30" : "bg-muted border-border"
              )}>
                <Server className={cn("w-4 h-4", config.token_saver_enabled ? "text-emerald-400" : "text-muted-foreground/40")} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-foreground text-sm" style={{ fontWeight: 700 }}>Token Saver</p>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-md border",
                    config.token_saver_enabled
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-muted border-border text-muted-foreground/40"
                  )} style={{ fontWeight: 700 }}>
                    {config.token_saver_enabled ? `−${TOKEN_SAVER_MODELS.find(m => m.id === config.token_saver_model)?.saving ?? "85%"} tokens` : "DESACTIVADO"}
                  </span>
                </div>
                <p className="text-muted-foreground/60 text-xs mt-0.5">
                  {config.token_saver_enabled
                    ? `n8n pre-procesa con ${config.token_saver_model} antes de pasar al LLM principal`
                    : "Delega tareas de texto a n8n con un modelo ligero antes del LLM costoso"
                  }
                </p>
              </div>
              <Switch
                checked={config.token_saver_enabled}
                onCheckedChange={(v) => setConfig(prev => prev ? { ...prev, token_saver_enabled: v } : prev)}
                className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-switch-background shrink-0"
              />
            </div>

            {config.token_saver_enabled && (
              <div className="px-4 pb-4 space-y-3">
                <div className="h-px bg-emerald-500/15" />
                <div>
                  <p className="text-muted-foreground/50 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 700 }}>
                    Modelo de Pre-procesamiento (token_saver_model)
                  </p>
                  <div className="space-y-1.5">
                    {TOKEN_SAVER_MODELS.map((model) => {
                      const isSelected = config.token_saver_model === model.id;
                      return (
                        <button
                          key={model.id}
                          onClick={() => setConfig(prev => prev ? { ...prev, token_saver_model: model.id } : prev)}
                          className={cn(
                            "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                            isSelected
                              ? "border-emerald-500/40 bg-emerald-600/8"
                              : "border-border/50 bg-muted/20 hover:border-border"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                            isSelected ? "border-emerald-500 bg-emerald-500" : "border-border"
                          )}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-xs", isSelected ? "text-foreground" : "text-muted-foreground")} style={{ fontWeight: isSelected ? 700 : 400 }}>
                                {model.label}
                              </span>
                              <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono" style={{ fontWeight: 700 }}>
                                {model.saving}
                              </span>
                            </div>
                            <p className="text-muted-foreground/50 text-[10px] mt-0.5">{model.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Flow diagram */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/20 border border-border/40">
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono" style={{ fontWeight: 700 }}>Agente</span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-700 border border-slate-600 text-slate-400 font-mono" style={{ fontWeight: 700 }}>n8n</span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono" style={{ fontWeight: 700 }}>{config.token_saver_model}</span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono" style={{ fontWeight: 700 }}>LLM Principal</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── n8n origin badge note ── */}
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/20 border border-border/40">
            <Info className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
            <p className="text-muted-foreground/60 text-xs">
              Las acciones originadas por n8n mostrarán un badge <span style={{ color: "#EA4B00", fontWeight: 700 }}>⚡ n8n</span> en el Approval Queue y el Activity Feed para identificar su origen.
            </p>
          </div>

          {/* ── Save ── */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all",
              saved
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : saving
                ? "bg-muted border-border text-muted-foreground/40 cursor-not-allowed"
                : "bg-orange-600/80 hover:bg-orange-600 text-white border-orange-500/40"
            )}
            style={{ fontWeight: 600 }}
          >
            {saving
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />Guardando en Vault…</>
              : saved
              ? <><Check className="w-4 h-4" />Configuración sincronizada</>
              : <><Save className="w-4 h-4" />Guardar configuración n8n</>
            }
          </button>
        </>
      )}

      {!config.enabled && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-2xl border border-dashed border-border/40">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#EA4B0015", border: "1px solid #EA4B0030" }}>
            <span style={{ fontSize: 24 }}>⚡</span>
          </div>
          <div className="text-center">
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Automation Bridge desactivado</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Activa el toggle para conectar este agente a workflows n8n</p>
          </div>
        </div>
      )}
    </div>
  );
}

type AuditSubTab = "actions" | "gatekeeper";

function AuditPanel() {
  const [activeFilter, setActiveFilter] = useState<"Todo" | "AUTONOMOUS" | "APPROVAL" | "BLOCKED">("Todo");
  const [refreshing, setRefreshing] = useState(false);
  const [entries, setEntries] = useState(MOCK_AUDIT);
  const [subTab, setSubTab] = useState<AuditSubTab>("actions");
  const [gkLogs, setGkLogs] = useState<GatekeeperLog[]>([]);
  const [gkLoading, setGkLoading] = useState(false);
  const [gkFilter, setGkFilter] = useState<"Todo" | "ALLOWED" | "BLOCKED" | "REDIRECTED">("Todo");

  const loadGkLogs = async () => {
    setGkLoading(true);
    try {
      const logs = await fetchGatekeeperLogs();
      setGkLogs(logs);
    } finally {
      setGkLoading(false);
    }
  };

  const handleSubTab = (tab: AuditSubTab) => {
    setSubTab(tab);
    if (tab === "gatekeeper" && gkLogs.length === 0) loadGkLogs();
  };

  const RESULT_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
    AUTONOMOUS: { bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400",  label: "AUTÓNOMO"   },
    APPROVAL:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-400",   label: "APROBACIÓN" },
    BLOCKED:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    label: "BLOQUEADO"  },
  };
  const GK_VERDICT: Record<string, { bg: string; border: string; text: string; label: string }> = {
    ALLOWED:    { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", label: "PERMITIDO"  },
    BLOCKED:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400",    label: "BLOQUEADO"  },
    REDIRECTED: { bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400",    label: "REDIRIGIDO" },
  };
  const GK_CLASS: Record<string, string> = {
    PUBLIC: "text-emerald-400/70", INTERNAL: "text-blue-400/70", CONFIDENTIAL: "text-amber-400/70", RESTRICTED: "text-red-400/70",
  };

  const filtered   = activeFilter === "Todo" ? entries : entries.filter((e) => e.result === activeFilter);
  const filteredGk = gkFilter   === "Todo" ? gkLogs  : gkLogs.filter((l) => l.verdict === gkFilter);

  const handleRefresh = () => {
    setRefreshing(true);
    if (subTab === "gatekeeper") {
      loadGkLogs().then(() => { setRefreshing(false); toast.success("Gatekeeper logs actualizados"); });
    } else {
      setTimeout(() => { setEntries([...MOCK_AUDIT]); setRefreshing(false); toast.success("Log actualizado"); }, 900);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-foreground text-sm mb-0.5" style={{ fontWeight: 700 }}>Auditoría de Acciones</h3>
        <p className="text-muted-foreground text-xs">Registro de acciones del agente y solicitudes filtradas por el Gatekeeper.</p>
      </div>

      {/* ── Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border/50">
        {([
          { id: "actions" as AuditSubTab,    label: "Acciones del Agente",  Icon: Terminal },
          { id: "gatekeeper" as AuditSubTab, label: "Gatekeeper · Portero", Icon: Shield   },
        ]).map(({ id, label, Icon }) => {
          const active = subTab === id;
          return (
            <button
              key={id}
              onClick={() => handleSubTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-all",
                active
                  ? id === "gatekeeper"
                    ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                    : "bg-card text-foreground border border-border shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{ fontWeight: active ? 700 : 400 }}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          );
        })}
      </div>

      {subTab === "actions" ? (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["Todo", "AUTONOMOUS", "APPROVAL", "BLOCKED"] as const).map((f) => {
              const isActive = activeFilter === f;
              const s = f !== "Todo" ? RESULT_STYLES[f] : null;
              return (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={cn("px-3 py-1.5 rounded-lg border text-xs transition-all",
                    isActive && f === "Todo" ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                    : isActive && s ? cn(s.bg, s.border, s.text)
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border"
                  )} style={{ fontWeight: isActive ? 700 : 400 }}>
                  {f === "Todo" ? "Todo" : { AUTONOMOUS: "AUTÓNOMO", APPROVAL: "APROBACIÓN", BLOCKED: "BLOQUEADO" }[f]}
                  {f !== "Todo" && <span className="ml-1.5 opacity-60">({MOCK_AUDIT.filter((e) => e.result === f).length})</span>}
                </button>
              );
            })}
            <button onClick={handleRefresh} disabled={refreshing}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all text-xs disabled:opacity-50">
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              {refreshing ? "Actualizando…" : "Actualizar"}
            </button>
          </div>

          <div className="rounded-2xl border border-border/60 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/40 border-b border-border/60">
              {["Timestamp", "Acción", "Entidad objetivo", "Resultado", "Gatillo"].map((h, i) => (
                <span key={h} className={cn("text-muted-foreground/50 uppercase tracking-wider",
                  i === 0 ? "col-span-3" : i === 1 ? "col-span-2" : i === 2 ? "col-span-4" : i === 3 ? "col-span-2" : "col-span-1"
                )} style={{ fontSize: "9px", fontWeight: 700 }}>{h}</span>
              ))}
            </div>
            <div className="divide-y divide-border/30">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Terminal className="w-6 h-6 text-muted-foreground/20" />
                  <p className="text-muted-foreground/40 text-xs">Sin entradas para el filtro seleccionado</p>
                </div>
              ) : filtered.map((entry) => {
                const rs = RESULT_STYLES[entry.result] ?? RESULT_STYLES.AUTONOMOUS;
                return (
                  <div key={entry.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
                    <span className="col-span-3 text-[10px] text-muted-foreground/50 font-mono tabular-nums">{entry.ts}</span>
                    <span className="col-span-2 text-[10px] text-foreground/70 font-mono">{entry.action}</span>
                    <span className="col-span-4 text-xs text-muted-foreground truncate">{entry.target}</span>
                    <span className={cn("col-span-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] w-fit", rs.bg, rs.border, rs.text)} style={{ fontWeight: 700 }}>{rs.label}</span>
                    <span className="col-span-1 text-[10px] text-muted-foreground/40">{entry.by}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t border-border/60">
              <span className="text-[10px] text-muted-foreground/40">Mostrando {filtered.length} de {MOCK_AUDIT.length} entradas · últimas 7 días</span>
              <button className="flex items-center gap-1.5 text-violet-400/70 hover:text-violet-400 transition-colors text-xs">
                <ExternalLink className="w-3 h-3" />Ver log completo
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Gatekeeper Tab ── */
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-blue-500/8 border border-blue-500/20">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-300/70 text-xs leading-relaxed">
              El <span className="text-blue-300 font-semibold">Portero</span> intercepta todas las solicitudes de datos y aplica políticas
              <span className="font-mono text-blue-300"> RLS</span> antes de permitir acceso.
              Endpoint: <span className="font-mono text-blue-300/70">GET /api/gatekeeper/logs</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(["Todo", "ALLOWED", "BLOCKED", "REDIRECTED"] as const).map((f) => {
              const isActive = gkFilter === f;
              const s = f !== "Todo" ? GK_VERDICT[f] : null;
              return (
                <button key={f} onClick={() => setGkFilter(f)}
                  className={cn("px-3 py-1.5 rounded-lg border text-xs transition-all",
                    isActive && f === "Todo" ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : isActive && s ? cn(s.bg, s.border, s.text)
                    : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border"
                  )} style={{ fontWeight: isActive ? 700 : 400 }}>
                  {f === "Todo" ? "Todo" : GK_VERDICT[f].label}
                  {f !== "Todo" && gkLogs.length > 0 && <span className="ml-1.5 opacity-60">({gkLogs.filter(l => l.verdict === f).length})</span>}
                </button>
              );
            })}
            <button onClick={handleRefresh} disabled={refreshing || gkLoading}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-all text-xs disabled:opacity-50">
              <RefreshCw className={cn("w-3 h-3", (refreshing || gkLoading) && "animate-spin")} />
              {gkLoading ? "Cargando…" : "Actualizar"}
            </button>
          </div>

          <div className="rounded-2xl border border-blue-500/15 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-blue-500/5 border-b border-border/60">
              {["Timestamp", "Agente", "Acción", "Recurso", "Clase", "Veredicto"].map((h, i) => (
                <span key={h} className={cn("text-muted-foreground/50 uppercase tracking-wider",
                  i === 0 ? "col-span-3" : i === 1 ? "col-span-2" : i === 2 ? "col-span-1" : i === 3 ? "col-span-3" : i === 4 ? "col-span-1" : "col-span-2"
                )} style={{ fontSize: "9px", fontWeight: 700 }}>{h}</span>
              ))}
            </div>
            <div className="divide-y divide-border/30">
              {gkLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <RefreshCw className="w-5 h-5 text-muted-foreground/20 animate-spin" />
                  <p className="text-muted-foreground/40 text-xs">Consultando /api/gatekeeper/logs…</p>
                </div>
              ) : filteredGk.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Shield className="w-6 h-6 text-muted-foreground/20" />
                  <p className="text-muted-foreground/40 text-xs">Sin registros · El Portero no ha interceptado solicitudes</p>
                </div>
              ) : filteredGk.map((log) => {
                const vs = GK_VERDICT[log.verdict];
                return (
                  <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-muted/20 transition-colors items-center">
                    <span className="col-span-3 text-[10px] text-muted-foreground/50 font-mono tabular-nums">{log.timestamp}</span>
                    <div className="col-span-2 flex items-center gap-1.5">
                      <div className="w-3 h-3 shrink-0" style={{ clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", backgroundColor: "#3B82F620", border: "1px solid #3B82F650" }} />
                      <span className="text-[10px] text-foreground/70 truncate">{log.agent_name}</span>
                    </div>
                    <span className="col-span-1 text-[10px] text-muted-foreground/60 font-mono uppercase">{log.action}</span>
                    <span className="col-span-3 text-[10px] text-muted-foreground/50 font-mono truncate" title={log.resource}>{log.resource}</span>
                    <span className={cn("col-span-1 uppercase tracking-wider", GK_CLASS[log.data_classification])} style={{ fontWeight: 700, fontSize: 8 }}>{log.data_classification.slice(0, 4)}</span>
                    <span className={cn("col-span-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] w-fit", vs.bg, vs.border, vs.text)} style={{ fontWeight: 700 }}>{vs.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t border-border/60">
              <span className="text-[10px] text-muted-foreground/40">{filteredGk.length} registros · Reglas R-001 a R-015</span>
              <button className="flex items-center gap-1.5 text-blue-400/70 hover:text-blue-400 transition-colors text-xs">
                <ExternalLink className="w-3 h-3" />Ver reglas completas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AgentConfigSheet({ agent, open, onOpenChange, onSave }: AgentConfigSheetProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>("mode");
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<SafePreset>("collaborator");
  const [saving, setSaving] = useState(false);

  const [permissions, setPermissions] = useState<PermissionsMap>(() => ({
    ...DEFAULT_PERMISSIONS,
    ...SAFE_PRESETS.collaborator.permissions,
  } as PermissionsMap));

  const [scope, setScope] = useState<AgentScope>({
    projects: ["p1", "p2"],
    taskTypes: ["TASK", "SUBTASK", "IDEA"],
    teams: ["t1", "t3"],
    allowAllProjects: false,
    allowAllTeams: false,
  });

  const [limits, setLimits] = useState<AgentLimits>({
    maxTasksPerHour: 20,
    maxApiCallsPerDay: 500,
    budgetCapUsd: 150,
    confidenceThreshold: 80,
    maxConcurrentTasks: 3,
  });

  const [integrations, setIntegrations] = useState<AgentIntegration[]>(MOCK_INTEGRATIONS);

  const handleSelectPreset = useCallback((preset: SafePreset) => {
    setSelectedPreset(preset);
    setPermissions((prev) => ({
      ...prev,
      ...SAFE_PRESETS[preset].permissions,
    } as PermissionsMap));
  }, []);

  const handlePermChange = useCallback((key: PermKey, level: PermLevel) => {
    setPermissions((prev) => ({ ...prev, [key]: level }));
  }, []);

  const handleToggleAdvanced = useCallback(() => {
    setIsAdvanced((v) => !v);
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Configuración guardada", {
        description: `Los cambios del agente ${agent?.name} se aplicarán en la próxima ejecución.`,
        duration: 4000,
      });
      onSave?.(agent?.id ?? "", {});
    }, 900);
  };

  if (!agent) return null;

  const PERM_LEVEL_DOT_COLORS: Record<PermLevel, string> = {
    AUTONOMOUS: "bg-violet-400",
    APPROVAL: "bg-amber-400",
    BLOCKED: "bg-slate-600",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col p-0 gap-0 overflow-hidden bg-card border-l border-border sm:max-w-3xl w-full"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center gap-4 px-6 py-4 border-b border-border/60 bg-muted/10">
          {/* Avatar con AgentAvatar component */}
          <AgentAvatar
            src={agent.avatar_url}
            fallback={agent.emoji || agent.name[0]}
            color={agent.avatar_color || "#8B5CF6"}
            size="lg"
            shape="hexagon"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-foreground text-base" style={{ fontWeight: 700 }}>
                {agent.name}
              </SheetTitle>
              {/* Hierarchy Badge */}
              <AgentTypePill type={agent.type} />
            </div>
            <SheetDescription className="sr-only">
              Configuración del agente {agent.name}: permisos, alcance, límites e integraciones.
            </SheetDescription>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px]",
                agent.active
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-muted border-border text-muted-foreground"
              )} style={{ fontWeight: 700 }}>
                <span className={cn("w-1.5 h-1.5 rounded-full", agent.active ? "bg-emerald-400" : "bg-muted-foreground/30")} />
                {agent.active ? "Activo" : "Inactivo"}
              </span>
              <span className="text-muted-foreground/40 text-[10px]">·</span>
              <span className="text-muted-foreground/60 text-[10px]">{agent.model}</span>
              <span className="text-muted-foreground/40 text-[10px]">·</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-md border",
                isAdvanced
                  ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
              )} style={{ fontWeight: 700 }}>
                {isAdvanced ? "Avanzado" : `Preset: ${SAFE_PRESETS[selectedPreset].label}`}
              </span>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs transition-all duration-200 border shrink-0",
              saving
                ? "bg-muted border-border text-muted-foreground"
                : "bg-violet-600 hover:bg-violet-500 border-violet-500/40 text-white shadow-lg shadow-violet-950/40"
            )}
            style={{ fontWeight: 700 }}
          >
            {saving ? (
              <span className="inline-flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Guardando…</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />Guardar</span>
            )}
          </button>
        </div>

        {/* ── Body: sidebar nav + content ────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left tab rail */}
          <nav className="shrink-0 w-44 border-r border-border/60 bg-muted/10 flex flex-col py-3 gap-0.5 overflow-y-auto">
            {TAB_ITEMS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 mx-2 rounded-xl text-left transition-all duration-150 group",
                    isActive
                      ? "bg-violet-600/15 text-violet-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-violet-400" : "text-muted-foreground/50 group-hover:text-muted-foreground")} />
                  <span className="text-xs" style={{ fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
                  {tab.id === "automation" && (
                    <span className="ml-auto text-[8px] px-1 py-0.5 rounded" style={{ backgroundColor: "#EA4B0020", color: "#EA4B00", fontWeight: 700 }}>n8n</span>
                  )}
                  {tab.id === "permissions" && isAdvanced && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400/60 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Divider */}
            <div className="mx-3 my-2 h-px bg-border/40" />

            {/* Mini permissions legend */}
            <div className="px-3 py-2 space-y-1">
              <p className="text-muted-foreground/40 uppercase tracking-wider mb-2" style={{ fontSize: "8px", fontWeight: 700 }}>Leyenda</p>
              {(Object.entries(PERM_LEVEL_DOT_COLORS) as [PermLevel, string][]).map(([level, dotClass]) => (
                <div key={level} className="flex items-center gap-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClass)} />
                  <span className="text-[9px] text-muted-foreground/40">{PERM_LEVEL_CONFIG[level].label}</span>
                </div>
              ))}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto min-h-0 p-6">
            {activeTab === "overview" && <OverviewPanel agent={agent} onNavigate={setActiveTab} />}
            {activeTab === "mode" && (
              <ModePanel
                selectedPreset={selectedPreset}
                isAdvanced={isAdvanced}
                onSelectPreset={handleSelectPreset}
                onToggleAdvanced={handleToggleAdvanced}
              />
            )}
            {activeTab === "permissions" && (
              <PermissionsPanel
                permissions={permissions}
                onChange={handlePermChange}
                isAdvanced={isAdvanced}
              />
            )}
            {activeTab === "scope" && (
              <ScopePanel scope={scope} onChange={setScope} />
            )}
            {activeTab === "limits" && (
              <LimitsPanel limits={limits} onChange={setLimits} />
            )}
            {activeTab === "integrations" && (
              <IntegrationsPanel integrations={integrations} onChange={setIntegrations} />
            )}
            {activeTab === "automation" && <AutomationPanel agentId={agent.id} />}
            {activeTab === "audit" && <AuditPanel />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
