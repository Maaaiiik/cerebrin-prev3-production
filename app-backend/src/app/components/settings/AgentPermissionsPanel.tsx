/**
 * AgentPermissionsPanel
 *
 * BACKEND INTEGRATION NOTES:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Permission keys map 1:1 to `workspace_roles.permissions` (jsonb):
 *    { "idea_create": "AUTONOMOUS" | "APPROVAL" | "BLOCKED", ... }
 *
 * 2. agent_type enum: RESEARCHER | WRITER | MANAGER
 *
 * 3. AUTONOMOUS  → executes directly (no queue entry)
 *    APPROVAL    → inserts into `agent_approval_queue` status=PENDING
 *    BLOCKED     → rejected at API gateway with 403
 *
 * 4. On SAVE → PATCH /api/workspace/roles/:agent_type
 *    Body: { permissions: Record<PermKey, PermLevel> }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, type ReactNode } from "react";
import { cn } from "../ui/utils";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  Layers,
  Lightbulb,
  ListTodo,
  Lock,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PermLevel = "AUTONOMOUS" | "APPROVAL" | "BLOCKED";
export type AgentTypeKey = "RESEARCHER" | "WRITER" | "MANAGER";

export type PermKey =
  | "idea_create"   | "idea_update"   | "idea_delete"   | "idea_promote"
  | "task_create"   | "task_update"   | "task_delete"
  | "project_create"| "project_update"| "project_delete"
  | "doc_create"    | "doc_update"    | "doc_delete"
  | "council_query" | "external_api";

export type PermissionsMap = Record<PermKey, PermLevel>;

// ─── Static data (no JSX at module level — avoids Fast Refresh HMR issues) ──

interface PermItem {
  key: PermKey;
  label: string;
  desc: string;
  hardLock?: AgentTypeKey[];
}

interface PermGroupDef {
  id: string;
  label: string;
  Icon: React.ElementType;
  accent: string;
  bgAccent: string;
  borderAccent: string;
  items: PermItem[];
}

const PERM_GROUPS: PermGroupDef[] = [
  {
    id: "ideas",
    label: "Ideas & Pipeline",
    Icon: Lightbulb,
    accent: "text-amber-400",
    bgAccent: "bg-amber-500/8",
    borderAccent: "border-amber-500/20",
    items: [
      { key: "idea_create",  label: "Crear ideas",         desc: "POST /api/ideas — insertar en idea_pipeline" },
      { key: "idea_update",  label: "Editar ideas",         desc: "PATCH /api/ideas/:id — actualizar campos y ai_analysis" },
      { key: "idea_delete",  label: "Eliminar ideas",       desc: "DELETE /api/ideas/:id — marcar is_archived=true" },
      { key: "idea_promote", label: "Promover a Proyecto",  desc: "POST /api/ideas/promote — crea document type=project" },
    ],
  },
  {
    id: "tasks",
    label: "Tareas",
    Icon: ListTodo,
    accent: "text-blue-400",
    bgAccent: "bg-blue-500/8",
    borderAccent: "border-blue-500/20",
    items: [
      { key: "task_create", label: "Crear tareas",                  desc: "POST /api/docs/create con type=task" },
      { key: "task_update", label: "Actualizar estado y progreso",  desc: "POST /api/docs/update — dispara cascade trigger" },
      { key: "task_delete", label: "Eliminar tareas",               desc: "DELETE — elimina subtareas en cascada" },
    ],
  },
  {
    id: "projects",
    label: "Proyectos",
    Icon: Layers,
    accent: "text-violet-400",
    bgAccent: "bg-violet-500/8",
    borderAccent: "border-violet-500/20",
    items: [
      { key: "project_create", label: "Crear proyectos",   desc: "POST /api/docs/create con type=project (nivel 1)" },
      { key: "project_update", label: "Editar proyectos",  desc: "Modificar metadata, título, fechas y asignados" },
      { key: "project_delete", label: "Eliminar proyectos", desc: "Acción destructiva — elimina árbol completo de tareas", hardLock: ["RESEARCHER", "WRITER"] },
    ],
  },
  {
    id: "documents",
    label: "Documentos",
    Icon: FileText,
    accent: "text-sky-400",
    bgAccent: "bg-sky-500/8",
    borderAccent: "border-sky-500/20",
    items: [
      { key: "doc_create", label: "Crear documentos", desc: "POST /api/docs/create con type=internal" },
      { key: "doc_update", label: "Editar documentos", desc: "Crea versión en document_versions al guardar" },
      { key: "doc_delete", label: "Eliminar documentos", desc: "Archiva el documento — WRITER tiene esto en APPROVAL por spec", hardLock: ["RESEARCHER"] },
    ],
  },
  {
    id: "special",
    label: "Capacidades Especiales",
    Icon: Zap,
    accent: "text-rose-400",
    bgAccent: "bg-rose-500/8",
    borderAccent: "border-rose-500/20",
    items: [
      { key: "council_query", label: "Consultar Council (GPT-4o + Claude + Gemini)", desc: "POST /api/council/compare — síntesis multi-LLM", hardLock: ["RESEARCHER"] },
      { key: "external_api",  label: "Acceso a APIs externas (n8n, CRM, etc.)",     desc: "Webhooks externos — registrado en activity_feed", hardLock: ["RESEARCHER"] },
    ],
  },
];

const LEVEL_META: Record<PermLevel, { label: string; short: string; active: string; inactive: string }> = {
  BLOCKED:   { label: "Bloqueado",  short: "Block", active: "bg-rose-500/20 text-rose-400 border-rose-500/40",    inactive: "text-muted-foreground/40 hover:text-rose-400/70 border-transparent" },
  APPROVAL:  { label: "Aprobación", short: "Aprob", active: "bg-amber-500/20 text-amber-400 border-amber-500/40", inactive: "text-muted-foreground/40 hover:text-amber-400/70 border-transparent" },
  AUTONOMOUS:{ label: "Autónomo",   short: "Auto",  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", inactive: "text-muted-foreground/40 hover:text-emerald-400/70 border-transparent" },
};

const PRESETS: Record<string, { label: string; desc: string; emoji: string; color: string; perms: PermissionsMap }> = {
  CAUTIOUS: {
    label: "Cauteloso", desc: "Todo pasa por aprobación humana. Ideal para empezar.", emoji: "🛡️",
    color: "border-blue-500/30 bg-blue-500/6 text-blue-400",
    perms: {
      idea_create:"APPROVAL", idea_update:"APPROVAL", idea_delete:"BLOCKED", idea_promote:"BLOCKED",
      task_create:"APPROVAL", task_update:"APPROVAL", task_delete:"BLOCKED",
      project_create:"BLOCKED", project_update:"APPROVAL", project_delete:"BLOCKED",
      doc_create:"APPROVAL", doc_update:"APPROVAL", doc_delete:"BLOCKED",
      council_query:"APPROVAL", external_api:"BLOCKED",
    },
  },
  STANDARD: {
    label: "Estándar", desc: "Autonomía en lo seguro. Acciones críticas con revisión.", emoji: "⚡",
    color: "border-violet-500/30 bg-violet-500/6 text-violet-400",
    perms: {
      idea_create:"AUTONOMOUS", idea_update:"APPROVAL", idea_delete:"BLOCKED", idea_promote:"APPROVAL",
      task_create:"AUTONOMOUS", task_update:"AUTONOMOUS", task_delete:"APPROVAL",
      project_create:"APPROVAL", project_update:"APPROVAL", project_delete:"BLOCKED",
      doc_create:"AUTONOMOUS", doc_update:"AUTONOMOUS", doc_delete:"APPROVAL",
      council_query:"AUTONOMOUS", external_api:"APPROVAL",
    },
  },
  ADVANCED: {
    label: "Avanzado", desc: "Alta autonomía. Solo acciones destructivas requieren aprobación.", emoji: "🚀",
    color: "border-emerald-500/30 bg-emerald-500/6 text-emerald-400",
    perms: {
      idea_create:"AUTONOMOUS", idea_update:"AUTONOMOUS", idea_delete:"APPROVAL", idea_promote:"APPROVAL",
      task_create:"AUTONOMOUS", task_update:"AUTONOMOUS", task_delete:"APPROVAL",
      project_create:"AUTONOMOUS", project_update:"AUTONOMOUS", project_delete:"APPROVAL",
      doc_create:"AUTONOMOUS", doc_update:"AUTONOMOUS", doc_delete:"APPROVAL",
      council_query:"AUTONOMOUS", external_api:"AUTONOMOUS",
    },
  },
  READ_ONLY: {
    label: "Solo Observar", desc: "El agente analiza y sugiere. Ninguna escritura.", emoji: "👁️",
    color: "border-border bg-muted/20 text-muted-foreground",
    perms: {
      idea_create:"BLOCKED", idea_update:"BLOCKED", idea_delete:"BLOCKED", idea_promote:"BLOCKED",
      task_create:"BLOCKED", task_update:"BLOCKED", task_delete:"BLOCKED",
      project_create:"BLOCKED", project_update:"BLOCKED", project_delete:"BLOCKED",
      doc_create:"BLOCKED", doc_update:"BLOCKED", doc_delete:"BLOCKED",
      council_query:"APPROVAL", external_api:"BLOCKED",
    },
  },
};

const TYPE_DEFAULTS: Record<AgentTypeKey, PermissionsMap> = {
  RESEARCHER: { ...PRESETS.READ_ONLY.perms, idea_create:"AUTONOMOUS", idea_update:"APPROVAL", council_query:"AUTONOMOUS" },
  WRITER:     { ...PRESETS.READ_ONLY.perms, doc_create:"AUTONOMOUS", doc_update:"AUTONOMOUS", doc_delete:"APPROVAL", idea_create:"APPROVAL", task_update:"APPROVAL", council_query:"APPROVAL" },
  MANAGER:    { ...PRESETS.ADVANCED.perms, project_delete:"APPROVAL", doc_delete:"APPROVAL" },
};

const MOCK_AGENTS: Record<AgentTypeKey, { name: string; active: boolean }[]> = {
  RESEARCHER: [{ name: "ResearchBot Alpha", active: true }, { name: "MarketSensor", active: true }, { name: "TrendWatcher", active: false }],
  WRITER:     [{ name: "CopyAgent Pro", active: true }, { name: "ContentCrafter", active: false }],
  MANAGER:    [{ name: "OpsManager", active: true }],
};

const TYPE_META: Record<AgentTypeKey, { label: string; desc: string; color: string; borderColor: string; badge: string }> = {
  RESEARCHER: { label: "Investigador", desc: "Analiza datos, busca tendencias y crea ideas. Sin escritura directa por defecto.", color: "text-amber-400", borderColor: "border-amber-500/30", badge: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  WRITER:     { label: "Escritor",     desc: "Redacta documentos y contenido. Puede crear y editar, pero no eliminar sin aprobación.", color: "text-sky-400",   borderColor: "border-sky-500/30",   badge: "bg-sky-500/15 text-sky-400 border-sky-500/25" },
  MANAGER:    { label: "Manager",      desc: "Acceso amplio de gestión. Puede crear, editar y proponer eliminaciones.", color: "text-violet-400", borderColor: "border-violet-500/30", badge: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PermLevelToggle({ value, onChange, locked }: {
  value: PermLevel;
  onChange: (v: PermLevel) => void;
  locked?: boolean;
}) {
  const levels: PermLevel[] = ["BLOCKED", "APPROVAL", "AUTONOMOUS"];
  const LevelIcons: Record<PermLevel, React.ElementType> = { BLOCKED: Lock, APPROVAL: ShieldCheck, AUTONOMOUS: Zap };

  return (
    <div className={cn("flex items-center rounded-xl border overflow-hidden", locked ? "border-border/30 opacity-50" : "border-border/50")}>
      {levels.map((lvl) => {
        const meta = LEVEL_META[lvl];
        const LvlIcon = LevelIcons[lvl];
        const isActive = value === lvl;
        return (
          <button key={lvl} disabled={locked} onClick={() => !locked && onChange(lvl)} title={meta.label}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] border-r last:border-r-0 border-border/30 transition-all duration-150",
              isActive ? meta.active : meta.inactive,
              locked ? "cursor-not-allowed" : "cursor-pointer"
            )}
            style={{ fontWeight: isActive ? 600 : 400 }}
          >
            <LvlIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{meta.short}</span>
          </button>
        );
      })}
      {locked && (
        <div className="flex items-center px-2 py-1.5 gap-1 text-[10px] text-muted-foreground/40 border-l border-border/30">
          <Lock className="w-2.5 h-2.5" />
          <span>Fijo</span>
        </div>
      )}
    </div>
  );
}

function PermGroupSection({ group, perms, agentType, onChange }: {
  group: PermGroupDef;
  perms: PermissionsMap;
  agentType: AgentTypeKey;
  onChange: (key: PermKey, value: PermLevel) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { Icon } = group;

  return (
    <div className={cn("rounded-2xl border overflow-hidden", group.borderAccent)}>
      <button onClick={() => setCollapsed(p => !p)}
        className={cn("w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:brightness-110", group.bgAccent)}
      >
        <span className={group.accent}><Icon className="w-3.5 h-3.5" /></span>
        <span className={cn("text-sm flex-1", group.accent)} style={{ fontWeight: 600 }}>{group.label}</span>
        <div className="flex items-center gap-1 mr-2">
          {group.items.map((item) => {
            const lvl = perms[item.key];
            return <span key={item.key} className={cn("w-1.5 h-1.5 rounded-full",
              lvl === "AUTONOMOUS" ? "bg-emerald-500" : lvl === "APPROVAL" ? "bg-amber-400" : "bg-rose-500/60"
            )} />;
          })}
        </div>
        {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />}
      </button>

      {!collapsed && (
        <div className="divide-y divide-border/30">
          {group.items.map((item) => {
            const isHardLocked = item.hardLock?.includes(agentType);
            return (
              <div key={item.key} className={cn("flex items-center gap-4 px-4 py-3",
                isHardLocked ? "opacity-60 bg-muted/10" : "hover:bg-muted/10 transition-colors"
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground/85" style={{ fontWeight: 500 }}>{item.label}</p>
                    {isHardLocked && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted border border-border text-[9px] text-muted-foreground/50">
                        <Lock className="w-2 h-2" />Bloqueado por tipo
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5 font-mono">{item.desc}</p>
                </div>
                <div className="shrink-0">
                  <PermLevelToggle
                    value={isHardLocked ? "BLOCKED" : perms[item.key]}
                    onChange={(v) => onChange(item.key, v)}
                    locked={isHardLocked}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function AgentPermissionsPanel() {
  const [activeType, setActiveType] = useState<AgentTypeKey>("RESEARCHER");
  const [permsMap, setPermsMap] = useState<Record<AgentTypeKey, PermissionsMap>>({
    RESEARCHER: { ...TYPE_DEFAULTS.RESEARCHER },
    WRITER:     { ...TYPE_DEFAULTS.WRITER },
    MANAGER:    { ...TYPE_DEFAULTS.MANAGER },
  });
  const [savedFlash, setSavedFlash] = useState(false);
  const [activePreset, setActivePreset] = useState<Record<AgentTypeKey, string | null>>({
    RESEARCHER: null, WRITER: null, MANAGER: null,
  });

  const currentPerms = permsMap[activeType];
  const typeMeta = TYPE_META[activeType];

  const handlePermChange = useCallback((key: PermKey, value: PermLevel) => {
    setPermsMap(prev => ({ ...prev, [activeType]: { ...prev[activeType], [key]: value } }));
    setActivePreset(prev => ({ ...prev, [activeType]: null }));
  }, [activeType]);

  const applyPreset = useCallback((presetKey: string) => {
    setPermsMap(prev => ({ ...prev, [activeType]: { ...PRESETS[presetKey].perms } }));
    setActivePreset(prev => ({ ...prev, [activeType]: presetKey }));
  }, [activeType]);

  const resetToTypeDefault = useCallback(() => {
    setPermsMap(prev => ({ ...prev, [activeType]: { ...TYPE_DEFAULTS[activeType] } }));
    setActivePreset(prev => ({ ...prev, [activeType]: null }));
  }, [activeType]);

  const handleSave = () => {
    // TODO: PATCH /api/workspace/roles/:agent_type
    // Body: { permissions: permsMap[activeType] }
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  };

  const stats = Object.values(currentPerms).reduce(
    (acc, v) => { acc[v]++; return acc; },
    { AUTONOMOUS: 0, APPROVAL: 0, BLOCKED: 0 }
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">

      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              Control de Permisos de Agentes
            </h2>
            <p className="text-muted-foreground/60 text-sm mt-0.5">
              Define qué puede hacer cada tipo de agente · Mapea a{" "}
              <code className="text-[11px] text-violet-400/80 bg-violet-500/10 px-1.5 py-0.5 rounded-md">
                workspace_roles.permissions (jsonb)
              </code>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={cn("text-xs text-emerald-400 flex items-center gap-1.5 transition-all duration-500", savedFlash ? "opacity-100" : "opacity-0")}>
              <Check className="w-3.5 h-3.5" />Guardado
            </span>
            <button onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm transition-all shadow-lg shadow-violet-500/20"
              style={{ fontWeight: 600 }}
            >
              <Save className="w-3.5 h-3.5" />Guardar cambios
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap mt-4">
          {(["AUTONOMOUS", "APPROVAL", "BLOCKED"] as PermLevel[]).map((lvl) => {
            const meta = LEVEL_META[lvl];
            const LvlIcons: Record<PermLevel, React.ElementType> = { AUTONOMOUS: Zap, APPROVAL: ShieldCheck, BLOCKED: Lock };
            const LvlIcon = LvlIcons[lvl];
            return (
              <div key={lvl} className="flex items-center gap-1.5">
                <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border", meta.active)}>
                  <LvlIcon className="w-3 h-3" />
                  <span className="text-[11px]" style={{ fontWeight: 600 }}>{meta.label}</span>
                </div>
                <span className="text-[11px] text-muted-foreground/50">
                  {lvl === "AUTONOMOUS" ? "— Ejecuta sin cola" : lvl === "APPROVAL" ? "— Pasa por HITL queue" : "— Bloqueado en API"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-56 shrink-0 border-r border-border/50 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border/40">
            <p className="text-[11px] text-muted-foreground/50 uppercase tracking-wider px-1" style={{ fontWeight: 600 }}>
              Tipo de Agente
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {(["RESEARCHER", "WRITER", "MANAGER"] as AgentTypeKey[]).map((type) => {
              const meta = TYPE_META[type];
              const agents = MOCK_AGENTS[type];
              const activeAgents = agents.filter(a => a.active).length;
              const typePerms = permsMap[type];
              const typeStats = Object.values(typePerms).reduce(
                (acc, v) => { acc[v]++; return acc; },
                { AUTONOMOUS: 0, APPROVAL: 0, BLOCKED: 0 }
              );
              const isSelected = activeType === type;

              return (
                <button key={type} onClick={() => setActiveType(type)}
                  className={cn("w-full rounded-xl p-3 text-left transition-all duration-150",
                    isSelected ? "bg-muted/60 border border-border" : "hover:bg-muted/30 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn("text-xs", meta.color)} style={{ fontWeight: 700 }}>{meta.label}</span>
                    <span className="text-[10px] text-muted-foreground/50">{activeAgents}/{agents.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(["AUTONOMOUS", "APPROVAL", "BLOCKED"] as PermLevel[]).map((lvl) => (
                      <div key={lvl} title={LEVEL_META[lvl].label}
                        className={cn("h-1 rounded-full transition-all",
                          lvl === "AUTONOMOUS" ? "bg-emerald-500/60" : lvl === "APPROVAL" ? "bg-amber-400/60" : "bg-rose-500/40"
                        )}
                        style={{ flex: typeStats[lvl] || 0.2 }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/40 mt-1.5">
                    {typeStats.AUTONOMOUS}A · {typeStats.APPROVAL}P · {typeStats.BLOCKED}B
                  </p>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border/40 p-3">
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2 px-1" style={{ fontWeight: 600 }}>
              Agentes activos
            </p>
            <div className="space-y-1.5">
              {MOCK_AGENTS[activeType].map((agent) => (
                <div key={agent.name} className="flex items-center gap-2 px-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", agent.active ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                  <span className="text-[11px] text-muted-foreground/60 truncate">{agent.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">

            {/* Type header */}
            <div className={cn("rounded-2xl border p-4 flex items-start gap-4", typeMeta.borderColor)}>
              <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 bg-muted/30", typeMeta.borderColor)}>
                <Bot className={cn("w-5 h-5", typeMeta.color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-sm", typeMeta.color)} style={{ fontWeight: 700 }}>{typeMeta.label} ({activeType})</span>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-[10px]", typeMeta.badge)} style={{ fontWeight: 600 }}>
                    agent_type: {activeType}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground/60 mt-1">{typeMeta.desc}</p>
                <div className="flex items-center gap-4 mt-3">
                  {(["AUTONOMOUS", "APPROVAL", "BLOCKED"] as PermLevel[]).map((lvl) => (
                    <div key={lvl} className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground/60">
                        <span style={{ fontWeight: 700 }}>{stats[lvl]}</span> {LEVEL_META[lvl].label.toLowerCase()}
                      </span>
                    </div>
                  ))}
                  <button onClick={resetToTypeDefault}
                    className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />Restablecer defaults
                  </button>
                </div>
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-3 px-1" style={{ fontWeight: 600 }}>
                Presets rápidos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => {
                  const isActive = activePreset[activeType] === key;
                  return (
                    <button key={key} onClick={() => applyPreset(key)}
                      className={cn("rounded-2xl border p-3 text-left transition-all duration-150",
                        isActive ? preset.color + " shadow-md" : "border-border/50 hover:border-border text-muted-foreground bg-muted/10 hover:bg-muted/20"
                      )}
                    >
                      <div className="text-lg mb-1.5">{preset.emoji}</div>
                      <p className="text-xs" style={{ fontWeight: 700 }}>{preset.label}</p>
                      <p className="text-[10px] mt-0.5 leading-snug opacity-70">{preset.desc}</p>
                      {isActive && (
                        <div className="mt-2 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span className="text-[10px]" style={{ fontWeight: 600 }}>Aplicado</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permission groups */}
            <div>
              <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-3 px-1" style={{ fontWeight: 600 }}>
                Permisos por entidad
              </p>
              <div className="space-y-2.5">
                {PERM_GROUPS.map((group) => (
                  <PermGroupSection
                    key={group.id}
                    group={group}
                    perms={currentPerms}
                    agentType={activeType}
                    onChange={handlePermChange}
                  />
                ))}
              </div>
            </div>

            {/* Backend note */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-violet-300" style={{ fontWeight: 600 }}>
                    Nota de integración · workspace_roles.permissions (jsonb)
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1 leading-relaxed">
                    Al guardar, este mapa se persiste en <code className="text-violet-400/70">workspace_roles</code> para el tipo{" "}
                    <code className="text-violet-400/70">{activeType}</code>. El API gateway consulta este campo antes de procesar
                    cualquier <code className="text-violet-400/70">POST /api/agent/request</code>.
                    Permisos <span className="text-amber-400">APPROVAL</span> generan un registro en{" "}
                    <code className="text-violet-400/70">agent_approval_queue</code> status=<code className="text-violet-400/70">PENDING</code>.
                    Permisos <span className="text-rose-400">BLOCKED</span> retornan <code className="text-violet-400/70">403</code> antes de tocar la cola.
                  </p>
                  <div className="mt-3 rounded-xl bg-black/30 border border-border/40 p-3 font-mono text-[10px] text-muted-foreground/60 overflow-x-auto">
                    <p className="text-violet-400/70 mb-1">{"// workspace_roles.permissions sample"}</p>
                    <p>{"{"}</p>
                    <p className="pl-4"><span className="text-emerald-400">"idea_create"</span>{": "}<span className="text-amber-400">"AUTONOMOUS"</span>,</p>
                    <p className="pl-4"><span className="text-emerald-400">"task_delete"</span>{": "}<span className="text-sky-400">"APPROVAL"</span>,</p>
                    <p className="pl-4"><span className="text-emerald-400">"project_delete"</span>{": "}<span className="text-rose-400">"BLOCKED"</span></p>
                    <p>{"}"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
