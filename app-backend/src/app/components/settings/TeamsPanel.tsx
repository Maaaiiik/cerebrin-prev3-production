/**
 * TeamsPanel — Sección 16 del Master Brief
 *
 * Gestión de equipos (Teams Framework) con APIs reales:
 *   GET    /api/workspace/teams
 *   POST   /api/workspace/teams
 *   PATCH  /api/workspace/teams/:id
 *   DELETE /api/workspace/teams/:id
 *   POST   /api/workspace/teams/:id/members
 *   DELETE /api/workspace/teams/:id/members/:memberId
 *   PATCH  /api/workspace/teams/:id/members/:memberId
 *   POST   /api/workspace/teams/:id/agents
 *   DELETE /api/workspace/teams/:id/agents/:agentId
 *
 * Patrón de actualización: optimistic update + rollback en error.
 */

import * as React from "react";
import {
  Bot,
  Check,
  ChevronRight,
  Crown,
  Edit3,
  FolderKanban,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  User,
  UserMinus,
  UserPlus,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import {
  fetchTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  toggleTeamLead,
  addTeamAgent,
  removeTeamAgent,
  type Team,
  type TeamMember,
  type TeamAgent,
  type TeamMemberRole,
  type TeamAgentType,
} from "../../services/api";

// ─── Local types ──────────────────────────────────────────────────────────────

type TeamTab = "members" | "agents" | "projects";

// ─── Mock candidate pools (workspace members / available agents) ───────────────
// → REAL: GET /api/workspace/members  +  GET /api/workspace/agents

const MEMBER_POOL: TeamMember[] = [
  { id: "u1", name: "Ana García",     email: "ana@company.com",    role: "Admin",  isLead: false, initials: "AG", avatarColor: "#6366F1" },
  { id: "u2", name: "Carlos Méndez", email: "carlos@company.com", role: "Editor", isLead: false, initials: "CM", avatarColor: "#10B981" },
  { id: "u3", name: "Laura Vega",    email: "laura@company.com",  role: "Editor", isLead: false, initials: "LV", avatarColor: "#F59E0B" },
  { id: "u4", name: "Tomás Ruiz",    email: "tomas@company.com",  role: "Viewer", isLead: false, initials: "TR", avatarColor: "#EF4444" },
  { id: "u5", name: "Sofía Herrera", email: "sofia@company.com",  role: "Admin",  isLead: false, initials: "SH", avatarColor: "#8B5CF6" },
  { id: "u6", name: "Diego Morales", email: "diego@company.com",  role: "Viewer", isLead: false, initials: "DM", avatarColor: "#3B82F6" },
];

const AGENT_POOL: TeamAgent[] = [
  { id: "writer",     name: "Writer-Bot",     type: "CONTENT",     active: true,  tasksCompleted: 284 },
  { id: "analyst",    name: "Analyst-Bot",    type: "DATA",        active: true,  tasksCompleted: 412 },
  { id: "strategy",   name: "Strategy-Bot",   type: "STRATEGY",    active: true,  tasksCompleted: 156 },
  { id: "dev",        name: "Dev-Bot",        type: "ENGINEERING", active: true,  tasksCompleted: 331 },
  { id: "research",   name: "Research-Bot",   type: "RESEARCH",    active: false, tasksCompleted: 67  },
  { id: "compliance", name: "Compliance-Bot", type: "LEGAL",       active: false, tasksCompleted: 23  },
];

// ─── Constants ─────────────────────────────────────────────────────────────────

const TEAM_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6", "#EC4899", "#14B8A6"];
const TEAM_EMOJIS = ["🚀", "⚙️", "🎯", "💡", "🔬", "📊", "🛡️", "🌍", "⚡", "🏆"];

const ROLE_STYLES: Record<TeamMemberRole, { bg: string; text: string; border: string }> = {
  Admin:  { bg: "bg-violet-500/12", text: "text-violet-400", border: "border-violet-500/25" },
  Editor: { bg: "bg-blue-500/12",   text: "text-blue-400",   border: "border-blue-500/25"   },
  Viewer: { bg: "bg-slate-700/50",  text: "text-slate-400",  border: "border-slate-600/40"  },
};

const AGENT_TYPE_STYLE: Record<TeamAgentType, { label: string; color: string }> = {
  CONTENT:     { label: "Content",     color: "#8B5CF6" },
  DATA:        { label: "Data",        color: "#3B82F6" },
  STRATEGY:    { label: "Strategy",    color: "#10B981" },
  ENGINEERING: { label: "Engineering", color: "#F59E0B" },
  RESEARCH:    { label: "Research",    color: "#94A3B8" },
  LEGAL:       { label: "Legal",       color: "#EF4444" },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ initials, color, size = "md", ring }: { initials: string; color: string; size?: "sm" | "md" | "lg"; ring?: boolean }) {
  const sz = { sm: "w-6 h-6 text-[9px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" }[size];
  return (
    <div
      className={cn("rounded-full flex items-center justify-center shrink-0 select-none", sz, ring && "ring-2 ring-slate-900")}
      style={{ backgroundColor: `${color}25`, border: `1.5px solid ${color}50`, color }}
    >
      <span style={{ fontWeight: 700 }}>{initials}</span>
    </div>
  );
}

function RoleBadge({ role }: { role: TeamMemberRole }) {
  const s = ROLE_STYLES[role];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-lg border text-xs", s.bg, s.text, s.border)} style={{ fontWeight: 600 }}>
      {role === "Admin" && <Crown className="w-2.5 h-2.5 mr-1" />}
      {role}
    </span>
  );
}

function AgentHexBadge({ type }: { type: TeamAgentType }) {
  const s = AGENT_TYPE_STYLE[type];
  return (
    <div
      className="w-6 h-6 shrink-0 flex items-center justify-center"
      style={{ clipPath: "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)", backgroundColor: `${s.color}20`, border: `1px solid ${s.color}40` }}
    >
      <Bot className="w-3 h-3" style={{ color: s.color }} />
    </div>
  );
}

// ─── Sync Status Badge ─────────────────────────────────────────────────────────

function SyncBadge({ syncing, error }: { syncing: boolean; error?: boolean }) {
  if (syncing) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" style={{ fontSize: 9, fontWeight: 700 }}>
        <Loader2 className="w-2.5 h-2.5 animate-spin" />
        SYNCING…
      </span>
    );
  }
  if (error) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400" style={{ fontSize: 9, fontWeight: 700 }}>
        ✗ SYNC ERROR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" style={{ fontSize: 9, fontWeight: 700 }}>
      <Wifi className="w-2.5 h-2.5" />
      API SYNCED
    </span>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TeamSkeleton() {
  return (
    <div className="flex h-full min-h-0 animate-pulse">
      <aside className="w-64 shrink-0 border-r border-slate-800/60 flex flex-col">
        <div className="px-4 py-4 border-b border-slate-800/60">
          <div className="h-4 w-24 bg-slate-800 rounded-lg mb-3" />
          <div className="h-8 w-full bg-slate-800 rounded-xl" />
        </div>
        <div className="p-2 space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full bg-slate-800/60 rounded-2xl" />
          ))}
        </div>
      </aside>
      <div className="flex-1 p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
        <div className="h-6 w-48 bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 bg-slate-800/60 rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-800/60 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-800/40 rounded-2xl" />
      </div>
    </div>
  );
}

// ─── Create / Edit Team Modal ──────────────────────────────────────────────────

function TeamFormModal({
  team,
  onSave,
  onClose,
  saving,
}: {
  team?: Team | null;
  onSave: (data: { name: string; description: string; color: string; emoji: string }) => void;
  onClose: () => void;
  saving?: boolean;
}) {
  const [name,        setName]        = React.useState(team?.name        ?? "");
  const [description, setDescription] = React.useState(team?.description ?? "");
  const [color,       setColor]       = React.useState(team?.color       ?? TEAM_COLORS[0]);
  const [emoji,       setEmoji]       = React.useState(team?.emoji       ?? TEAM_EMOJIS[0]);

  const isEdit = !!team;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>
              {isEdit ? "Editar equipo" : "Nuevo equipo"}
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {isEdit ? "Modifica los datos del equipo" : "Define nombre, identidad y descripción"}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Preview */}
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-800/40">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${color}20`, border: `1.5px solid ${color}40` }}
            >
              {emoji}
            </div>
            <div>
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>{name || "Nombre del equipo"}</p>
              <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{description || "Descripción del equipo…"}</p>
            </div>
          </div>

          {/* Emoji picker */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block" style={{ fontWeight: 700 }}>Icono</label>
            <div className="flex flex-wrap gap-2">
              {TEAM_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-lg transition-all",
                    emoji === e ? "bg-indigo-600/20 ring-2 ring-indigo-500/40" : "bg-slate-800 hover:bg-slate-700"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block" style={{ fontWeight: 700 }}>Color de equipo</label>
            <div className="flex gap-2 flex-wrap">
              {TEAM_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-lg transition-all"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : "none", outlineOffset: 2 }}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block" style={{ fontWeight: 700 }}>Nombre *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Growth Squad"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block" style={{ fontWeight: 700 }}>Descripción</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Propósito y responsabilidades del equipo…"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
            />
          </div>

          {/* API endpoint hint */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-800">
            <span className="text-[9px] font-mono text-slate-600">{isEdit ? "PATCH /api/workspace/teams/:id" : "POST /api/workspace/teams"}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 text-sm hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (!name.trim()) return;
                onSave({ name: name.trim(), description: description.trim(), color, emoji });
              }}
              disabled={!name.trim() || saving}
              className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm transition-colors flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? "Guardar cambios" : "Crear equipo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Member Modal ──────────────────────────────────────────────────────────

function AddMemberModal({
  team,
  onAdd,
  onClose,
}: {
  team: Team;
  onAdd: (member: TeamMember, role: TeamMemberRole) => void;
  onClose: () => void;
}) {
  const [search, setSearch]     = React.useState("");
  const [role, setRole]         = React.useState<TeamMemberRole>("Editor");
  const [selected, setSelected] = React.useState<TeamMember | null>(null);
  const [saving,   setSaving]   = React.useState(false);

  const existing   = new Set(team.members.map(m => m.id));
  const candidates = MEMBER_POOL.filter(
    m => !existing.has(m.id) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
     m.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await addTeamMember(team.id, selected.id, role);
      onAdd(selected, role);
    } catch {
      toast.error("Error al agregar miembro");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>Agregar miembro</h3>
            <p className="text-slate-600 text-xs font-mono mt-0.5">POST /api/workspace/teams/{team.id}/members</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              placeholder="Buscar por nombre o email…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Candidates */}
          <div className="space-y-1 max-h-48 overflow-auto">
            {candidates.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4">No hay más miembros disponibles</p>
            ) : candidates.map(m => (
              <button
                key={m.id}
                onClick={() => setSelected(prev => prev?.id === m.id ? null : m)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                  selected?.id === m.id
                    ? "border-indigo-500/30 bg-indigo-600/10"
                    : "border-transparent hover:bg-slate-800"
                )}
              >
                <Avatar initials={m.initials} color={m.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 truncate" style={{ fontWeight: 500 }}>{m.name}</p>
                  <p className="text-xs text-slate-600 truncate">{m.email}</p>
                </div>
                {selected?.id === m.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Role */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-widest mb-2 block" style={{ fontWeight: 700 }}>Rol</label>
            <div className="flex gap-2">
              {(["Admin", "Editor", "Viewer"] as TeamMemberRole[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex-1 py-2 rounded-xl border text-xs transition-all",
                    role === r
                      ? "border-indigo-500/40 bg-indigo-600/15 text-indigo-300"
                      : "border-slate-700 bg-slate-800 text-slate-500 hover:text-slate-300"
                  )}
                  style={{ fontWeight: role === r ? 600 : 400 }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!selected || saving}
              className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm transition-colors flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Agent Modal ──────────────────────────────────────────────────────────

function AddAgentModal({
  team,
  onAdd,
  onClose,
}: {
  team: Team;
  onAdd: (agent: TeamAgent) => void;
  onClose: () => void;
}) {
  const existing   = new Set(team.agents.map(a => a.id));
  const candidates = AGENT_POOL.filter(a => !existing.has(a.id));
  const [selected, setSelected] = React.useState<TeamAgent | null>(null);
  const [saving,   setSaving]   = React.useState(false);

  const handleAdd = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await addTeamAgent(team.id, selected.id);
      onAdd(selected);
    } catch {
      toast.error("Error al asignar agente");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl border border-slate-700/60 bg-slate-900 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>Asignar agente al equipo</h3>
            <p className="text-slate-600 text-xs font-mono mt-0.5">POST /api/workspace/teams/{team.id}/agents</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <div className="space-y-1 max-h-56 overflow-auto">
            {candidates.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-6">Todos los agentes ya están asignados a este equipo</p>
            ) : candidates.map(a => {
              const s = AGENT_TYPE_STYLE[a.type];
              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(prev => prev?.id === a.id ? null : a)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left",
                    selected?.id === a.id
                      ? "border-violet-500/30 bg-violet-600/10"
                      : "border-transparent hover:bg-slate-800"
                  )}
                >
                  <AgentHexBadge type={a.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-slate-200 truncate" style={{ fontWeight: 500 }}>{a.name}</p>
                      {!a.active && <span className="text-xs text-slate-600">(Inactivo)</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: s.color, opacity: 0.8 }}>{s.label} · {a.tasksCompleted} tareas</p>
                  </div>
                  {selected?.id === a.id && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!selected || saving}
              className="flex-1 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm transition-colors flex items-center justify-center gap-2"
              style={{ fontWeight: 600 }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Asignar agente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team Detail Panel ─────────────────────────────────────────────────────────

function TeamDetail({
  team,
  onUpdate,
  onDelete,
}: {
  team: Team;
  onUpdate: (updated: Team) => void;
  onDelete: () => void;
}) {
  const [tab,           setTab]           = React.useState<TeamTab>("members");
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [addAgentOpen,  setAddAgentOpen]  = React.useState(false);
  const [editOpen,      setEditOpen]      = React.useState(false);
  const [editSaving,    setEditSaving]    = React.useState(false);
  const [menuOpen,      setMenuOpen]      = React.useState(false);
  const [mutatingId,    setMutatingId]    = React.useState<string | null>(null); // tracks in-flight member/agent ops

  // ── Member handlers ─────────────────────────────────────────────────────────

  const handleAddMember = (member: TeamMember, role: TeamMemberRole) => {
    // API call already done inside AddMemberModal — optimistically update local state
    onUpdate({ ...team, members: [...team.members, { ...member, role }] });
    setAddMemberOpen(false);
    toast.success(`${member.name} agregado como ${role}`, {
      description: `POST /api/workspace/teams/${team.id}/members ✓`,
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    const m = team.members.find(x => x.id === memberId);
    const previous = team.members;
    onUpdate({ ...team, members: team.members.filter(x => x.id !== memberId) });
    setMutatingId(memberId);
    try {
      await removeTeamMember(team.id, memberId);
      toast.success(`${m?.name} removido del equipo`, {
        description: `DELETE /api/workspace/teams/${team.id}/members/${memberId} ✓`,
      });
    } catch {
      onUpdate({ ...team, members: previous });
      toast.error("Error al remover miembro — cambio revertido");
    } finally {
      setMutatingId(null);
    }
  };

  const handleChangeRole = async (memberId: string, role: TeamMemberRole) => {
    const previous = team.members;
    onUpdate({ ...team, members: team.members.map(m => m.id === memberId ? { ...m, role } : m) });
    setMutatingId(memberId);
    try {
      await updateTeamMemberRole(team.id, memberId, role);
    } catch {
      onUpdate({ ...team, members: previous });
      toast.error("Error al cambiar rol — cambio revertido");
    } finally {
      setMutatingId(null);
    }
  };

  const handleToggleLead = async (memberId: string) => {
    const member = team.members.find(m => m.id === memberId);
    const newIsLead = !member?.isLead;
    const previous = team.members;
    onUpdate({ ...team, members: team.members.map(m => ({ ...m, isLead: m.id === memberId ? newIsLead : false })) });
    setMutatingId(memberId);
    try {
      await toggleTeamLead(team.id, memberId, newIsLead);
    } catch {
      onUpdate({ ...team, members: previous });
      toast.error("Error al actualizar team lead");
    } finally {
      setMutatingId(null);
    }
  };

  // ── Agent handlers ──────────────────────────────────────────────────────────

  const handleAddAgent = (agent: TeamAgent) => {
    // API call already done inside AddAgentModal
    onUpdate({ ...team, agents: [...team.agents, agent] });
    setAddAgentOpen(false);
    toast.success(`${agent.name} asignado al equipo`, {
      description: `POST /api/workspace/teams/${team.id}/agents ✓`,
    });
  };

  const handleRemoveAgent = async (agentId: string) => {
    const a = team.agents.find(x => x.id === agentId);
    const previous = team.agents;
    onUpdate({ ...team, agents: team.agents.filter(x => x.id !== agentId) });
    setMutatingId(agentId);
    try {
      await removeTeamAgent(team.id, agentId);
      toast.success(`${a?.name} removido del equipo`, {
        description: `DELETE /api/workspace/teams/${team.id}/agents/${agentId} ✓`,
      });
    } catch {
      onUpdate({ ...team, agents: previous });
      toast.error("Error al remover agente — cambio revertido");
    } finally {
      setMutatingId(null);
    }
  };

  // ── Edit handler ─────────────────────────────────────────────────────────────

  const handleEditSave = async (data: { name: string; description: string; color: string; emoji: string }) => {
    const previous = { name: team.name, description: team.description, color: team.color, emoji: team.emoji };
    onUpdate({ ...team, ...data });
    setEditSaving(true);
    try {
      await updateTeam(team.id, data);
      setEditOpen(false);
      toast.success("Equipo actualizado", {
        description: `PATCH /api/workspace/teams/${team.id} ✓`,
      });
    } catch {
      onUpdate({ ...team, ...previous });
      toast.error("Error al actualizar equipo — cambio revertido");
    } finally {
      setEditSaving(false);
    }
  };

  const lead = team.members.find(m => m.isLead);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Team header */}
      <div className="shrink-0 px-6 py-5 border-b border-slate-800/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: `${team.color}18`, border: `1.5px solid ${team.color}40` }}
            >
              {team.emoji}
            </div>
            <div>
              <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>{team.name}</h2>
              <p className="text-slate-500 text-sm mt-0.5 max-w-md">{team.description}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-xs text-slate-600">
                  <span className="text-slate-400" style={{ fontWeight: 600 }}>{team.members.length}</span> miembros
                </span>
                <span className="text-xs text-slate-600">
                  <span className="text-slate-400" style={{ fontWeight: 600 }}>{team.agents.length}</span> agentes
                </span>
                <span className="text-xs text-slate-600">
                  <span className="text-slate-400" style={{ fontWeight: 600 }}>{team.projects.length}</span> proyectos
                </span>
                {lead && (
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span className="text-xs text-amber-400/80">{lead.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 relative">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              Editar
            </button>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-500 hover:text-white transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 z-30 w-44 rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl py-1" onMouseLeave={() => setMenuOpen(false)}>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar equipo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs */}
      <div className="shrink-0 flex items-center gap-1 px-6 pt-3 border-b border-slate-800/60">
        {([
          { id: "members"  as TeamTab, label: "Miembros",    icon: Users,        count: team.members.length  },
          { id: "agents"   as TeamTab, label: "Agentes IA",  icon: Bot,          count: team.agents.length   },
          { id: "projects" as TeamTab, label: "Proyectos",   icon: FolderKanban, count: team.projects.length },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all text-xs -mb-px",
              tab === t.id
                ? "border-indigo-500 text-indigo-300"
                : "border-transparent text-slate-500 hover:text-slate-300"
            )}
            style={{ fontWeight: tab === t.id ? 600 : 400 }}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-xs",
              tab === t.id ? "bg-indigo-500/20 text-indigo-300" : "bg-slate-800 text-slate-600"
            )} style={{ fontSize: 10 }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tab Content */}
      <div className="flex-1 overflow-auto p-6">

        {/* ── Members tab */}
        {tab === "members" && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-widest" style={{ fontWeight: 700 }}>
                {team.members.length} miembro{team.members.length !== 1 && "s"}
              </p>
              <button
                onClick={() => setAddMemberOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs transition-colors"
                style={{ fontWeight: 600 }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Agregar miembro
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              {team.members.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Sin miembros</p>
                  <p className="text-xs text-slate-700 mt-1">Agrega miembros para colaborar en este equipo</p>
                </div>
              ) : team.members.map((member, i) => (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-800/30",
                    i < team.members.length - 1 && "border-b border-slate-800/60",
                    mutatingId === member.id && "opacity-60"
                  )}
                >
                  <div className="relative">
                    <Avatar initials={member.initials} color={member.avatarColor} size="md" />
                    {member.isLead && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                        <Crown className="w-2 h-2 text-amber-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-200 truncate" style={{ fontWeight: 600 }}>{member.name}</p>
                      {member.isLead && <span className="text-xs text-amber-400/70">Team Lead</span>}
                      {mutatingId === member.id && <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />}
                    </div>
                    <p className="text-xs text-slate-600 truncate">{member.email}</p>
                  </div>

                  {/* Role selector */}
                  <select
                    value={member.role}
                    onChange={e => handleChangeRole(member.id, e.target.value as TeamMemberRole)}
                    disabled={mutatingId === member.id}
                    className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 cursor-pointer disabled:opacity-50"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleLead(member.id)}
                      disabled={mutatingId === member.id}
                      title={member.isLead ? "Quitar como lead" : "Hacer team lead"}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors disabled:opacity-40",
                        member.isLead
                          ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                          : "text-slate-600 hover:text-amber-400 hover:bg-amber-500/10"
                      )}
                    >
                      <Crown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={mutatingId === member.id}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Agents tab */}
        {tab === "agents" && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-widest" style={{ fontWeight: 700 }}>
                {team.agents.length} agente{team.agents.length !== 1 && "s"} asignado{team.agents.length !== 1 && "s"}
              </p>
              <button
                onClick={() => setAddAgentOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-3.5 h-3.5" />
                Asignar agente
              </button>
            </div>

            {/* Agent pool overview */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden">
              {team.agents.length === 0 ? (
                <div className="py-12 text-center">
                  <Bot className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-sm text-slate-600">Sin agentes asignados</p>
                  <p className="text-xs text-slate-700 mt-1">Asigna bots de IA para que trabajen en este equipo</p>
                </div>
              ) : team.agents.map((agent, i) => {
                const s = AGENT_TYPE_STYLE[agent.type];
                return (
                  <div
                    key={agent.id}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-800/30",
                      i < team.agents.length - 1 && "border-b border-slate-800/60",
                      mutatingId === agent.id && "opacity-60"
                    )}
                  >
                    <AgentHexBadge type={agent.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-200" style={{ fontWeight: 600 }}>{agent.name}</p>
                        <span
                          className="px-1.5 py-0.5 rounded-md text-xs border"
                          style={{ backgroundColor: `${s.color}15`, borderColor: `${s.color}30`, color: s.color, fontSize: 10, fontWeight: 600 }}
                        >
                          {s.label}
                        </span>
                        {!agent.active && (
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-600 text-xs">Inactivo</span>
                        )}
                        {mutatingId === agent.id && <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{agent.tasksCompleted} tareas completadas</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", agent.active ? "bg-emerald-400 animate-pulse" : "bg-slate-600")} />
                      <button
                        onClick={() => handleRemoveAgent(agent.id)}
                        disabled={mutatingId === agent.id}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* HITL note */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-violet-500/6 border border-violet-500/15">
              <Zap className="w-3.5 h-3.5 text-violet-400 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-400/80 leading-relaxed">
                Los agentes de este equipo operan bajo el protocolo HITL del workspace. Configura los permisos globales en <strong className="text-violet-300">Settings → Permisos</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── Projects tab */}
        {tab === "projects" && (
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 uppercase tracking-widest" style={{ fontWeight: 700 }}>
                {team.projects.length} proyecto{team.projects.length !== 1 && "s"}
              </p>
              <button
                onClick={() => toast.info("Vincula proyectos desde el Project Engine")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/25 text-emerald-300 text-xs transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-3.5 h-3.5" />
                Vincular proyecto
              </button>
            </div>

            {team.projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 py-14 text-center">
                <FolderKanban className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-600">Sin proyectos vinculados</p>
                <p className="text-xs text-slate-700 mt-1">Vincula proyectos del Project Engine a este equipo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {team.projects.map(p => {
                  const statusColor = p.status === "active" ? "#10B981" : p.status === "at-risk" ? "#F59E0B" : "#6366F1";
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-800 bg-slate-800/20 hover:bg-slate-800/40 transition-colors">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                      <p className="flex-1 text-sm text-slate-200" style={{ fontWeight: 500 }}>{p.name}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-0.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: statusColor }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right tabular-nums">{p.progress}%</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {addMemberOpen && <AddMemberModal team={team} onAdd={handleAddMember} onClose={() => setAddMemberOpen(false)} />}
      {addAgentOpen  && <AddAgentModal  team={team} onAdd={handleAddAgent}  onClose={() => setAddAgentOpen(false)} />}
      {editOpen      && <TeamFormModal  team={team} onSave={handleEditSave} onClose={() => setEditOpen(false)} saving={editSaving} />}
    </div>
  );
}

// ─── Teams Panel (main export) ─────────────────────────────────────────────────

export function TeamsPanel() {
  const [teams,      setTeams]      = React.useState<Team[]>([]);
  const [loading,    setLoading]    = React.useState(true);
  const [syncing,    setSyncing]    = React.useState(false);
  const [syncError,  setSyncError]  = React.useState(false);
  const [selected,   setSelected]   = React.useState<string>("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createSaving, setCreateSaving] = React.useState(false);
  const [search,     setSearch]     = React.useState("");

  const selectedTeam = teams.find(t => t.id === selected) ?? null;

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  // ── Initial fetch ────────────────────────────────────────────────────────────

  React.useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSyncError(false);
      try {
        const data = await fetchTeams("ws_default");
        setTeams(data);
        if (data.length > 0) setSelected(data[0].id);
      } catch {
        setSyncError(true);
        toast.error("Error al cargar equipos", {
          description: "GET /api/workspace/teams falló — mostrando datos locales",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Refresh ──────────────────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setSyncing(true);
    setSyncError(false);
    try {
      const data = await fetchTeams("ws_default");
      setTeams(data);
      if (!selected && data.length > 0) setSelected(data[0].id);
      toast.success("Equipos sincronizados", { description: "GET /api/workspace/teams ✓" });
    } catch {
      setSyncError(true);
      toast.error("Error de sincronización");
    } finally {
      setSyncing(false);
    }
  };

  // ── Create team ──────────────────────────────────────────────────────────────

  const handleCreate = async (data: { name: string; description: string; color: string; emoji: string }) => {
    const tempId = `temp_${Date.now()}`;
    const optimistic: Team = {
      id: tempId, members: [], agents: [], projects: [],
      createdAt: new Date().toLocaleDateString("es-ES", { month: "short", year: "numeric" }),
      ...data,
    };
    setTeams(prev => [...prev, optimistic]);
    setSelected(tempId);
    setCreateOpen(false);
    setCreateSaving(true);
    setSyncing(true);
    try {
      const created = await createTeam("ws_default", data);
      setTeams(prev => prev.map(t => t.id === tempId ? created : t));
      setSelected(created.id);
      toast.success(`Equipo "${created.name}" creado`, {
        description: "POST /api/workspace/teams ✓",
      });
    } catch {
      setTeams(prev => prev.filter(t => t.id !== tempId));
      setSelected(teams[0]?.id ?? "");
      toast.error("Error al crear equipo — cambio revertido");
    } finally {
      setCreateSaving(false);
      setSyncing(false);
    }
  };

  // ── Update team ──────────────────────────────────────────────────────────────

  const handleUpdate = (updated: Team) => {
    setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  // ── Delete team ──────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    const team = teams.find(t => t.id === id);
    const previousTeams = teams;
    const remaining = teams.filter(t => t.id !== id);
    setTeams(remaining);
    setSelected(remaining[0]?.id ?? "");
    setSyncing(true);
    try {
      await deleteTeam(id);
      toast.success(`Equipo "${team?.name}" eliminado`, {
        description: `DELETE /api/workspace/teams/${id} ✓`,
      });
    } catch {
      setTeams(previousTeams);
      setSelected(id);
      toast.error("Error al eliminar equipo — cambio revertido");
    } finally {
      setSyncing(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────

  if (loading) return <TeamSkeleton />;

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left: Teams list ──────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 border-r border-slate-800/60 flex flex-col bg-slate-900/30">
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-white text-sm" style={{ fontWeight: 700 }}>Equipos</h2>
              <p className="text-slate-600 text-xs">{teams.length} equipos en el workspace</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleRefresh}
                disabled={syncing}
                className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-500 hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                title="Sincronizar con API"
              >
                <RefreshCw className={cn("w-3 h-3", syncing && "animate-spin")} />
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                className="w-7 h-7 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors"
                title="Crear equipo"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sync badge */}
          <div className="flex items-center gap-2 mb-3">
            <SyncBadge syncing={syncing} error={syncError} />
            <span className="text-[9px] text-slate-700 font-mono">/api/workspace/teams</span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar equipo…"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/60 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/40 transition-colors"
            />
          </div>
        </div>

        {/* Teams list */}
        <div className="flex-1 overflow-auto py-2 px-2 space-y-1">
          {filteredTeams.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="w-6 h-6 text-slate-700 mx-auto mb-2" />
              <p className="text-xs text-slate-700">Sin resultados</p>
            </div>
          ) : filteredTeams.map(team => {
            const isActive = selected === team.id;
            const isTemp = team.id.startsWith("temp_");
            return (
              <button
                key={team.id}
                onClick={() => setSelected(team.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-2xl border text-left transition-all",
                  isActive
                    ? "border-slate-700/60 bg-slate-800/80"
                    : "border-transparent hover:bg-slate-800/40",
                  isTemp && "opacity-60"
                )}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${team.color}18`, border: `1.5px solid ${team.color}40` }}
                >
                  {isTemp ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: team.color }} /> : team.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm truncate", isActive ? "text-white" : "text-slate-300")} style={{ fontWeight: isActive ? 700 : 500 }}>
                    {team.name}
                  </p>
                  <p className="text-slate-600 text-xs mt-0.5">
                    {team.members.length}m · {team.agents.length}a
                  </p>
                </div>
                {isActive && (
                  <div className="flex flex-col gap-1 shrink-0">
                    <div className="flex items-center gap-1">
                      <User className="w-2.5 h-2.5 text-slate-500" />
                      <span className="text-[9px] text-slate-500 tabular-nums">{team.members.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Bot className="w-2.5 h-2.5 text-violet-500/70" />
                      <span className="text-[9px] text-slate-500 tabular-nums">{team.agents.length}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: API status */}
        <div className="shrink-0 px-4 py-3 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-slate-700" />
            <span className="text-[9px] text-slate-700 font-mono">HITL enabled · Section 16</span>
          </div>
        </div>
      </aside>

      {/* ── Right: Team detail ────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {selectedTeam ? (
          <TeamDetail
            team={selectedTeam}
            onUpdate={handleUpdate}
            onDelete={() => handleDelete(selectedTeam.id)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Users className="w-12 h-12 text-slate-700" />
            <p className="text-slate-500 text-sm">Selecciona o crea un equipo</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-4 h-4" />
              Crear primer equipo
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      {createOpen && <TeamFormModal onSave={handleCreate} onClose={() => setCreateOpen(false)} saving={createSaving} />}
    </div>
  );
}
