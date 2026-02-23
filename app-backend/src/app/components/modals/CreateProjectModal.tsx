import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Bot,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Globe,
  Cpu,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeploy?: (project: ProjectFormState) => void;
}

interface ProjectFormState {
  name: string;
  workspace: string;
  targetDate: string;
  team: string[];
  template: string;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const WORKSPACES = [
  { id: "ebox", label: "Ebox.lat", Icon: Building2, color: "text-emerald-400" },
  { id: "internal", label: "Cerebrin Internal", Icon: Cpu, color: "text-violet-400" },
  { id: "latam", label: "LATAM Expansion", Icon: Globe, color: "text-blue-400" },
];

const TEAM_MEMBERS = [
  { id: "carlos", name: "Carlos M.", initials: "CM", role: "Product", type: "HUMAN", bg: "#1d4ed8" },
  { id: "ana", name: "Ana R.", initials: "AR", role: "Design", type: "HUMAN", bg: "#be185d" },
  { id: "luis", name: "Luis P.", initials: "LP", role: "Engineering", type: "HUMAN", bg: "#065f46" },
  { id: "sofia", name: "Sofia K.", initials: "SK", role: "Strategy", type: "HUMAN", bg: "#92400e" },
  { id: "writer", name: "@writer-bot", initials: "WB", role: "Content AI", type: "AGENT", bg: "" },
  { id: "analyst", name: "@analyst-bot", initials: "AB", role: "Analytics AI", type: "AGENT", bg: "" },
  { id: "dev", name: "@dev-bot", initials: "DB", role: "Dev AI", type: "AGENT", bg: "" },
];

const TEMPLATES = [
  {
    id: "sprint",
    Icon: Zap,
    label: "Sprint Execution",
    desc: "2-week cycles · standups · retrospectives",
    color: "blue",
    accent: "text-blue-400",
    activeBorder: "border-blue-500/50",
    activeBg: "bg-blue-500/8",
    iconBg: "bg-blue-500/15",
  },
  {
    id: "research",
    Icon: Search,
    label: "Research & Define",
    desc: "Discovery · interviews · prototyping",
    color: "violet",
    accent: "text-violet-400",
    activeBorder: "border-violet-500/50",
    activeBg: "bg-violet-500/8",
    iconBg: "bg-violet-500/15",
  },
  {
    id: "scale",
    Icon: TrendingUp,
    label: "Scale & Optimize",
    desc: "Data-driven growth · KPI playbooks",
    color: "emerald",
    accent: "text-emerald-400",
    activeBorder: "border-emerald-500/50",
    activeBg: "bg-emerald-500/8",
    iconBg: "bg-emerald-500/15",
  },
];

// ─── Glassmorphism Overlay ────────────────────────────────────────────────────

function GlassOverlay() {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50",
        "backdrop-blur-xl",
        "bg-slate-950/70",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "duration-200"
      )}
    />
  );
}

// ─── Field Label ──────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block mb-2 text-slate-500 uppercase tracking-widest"
      style={{ fontSize: "10px", fontWeight: 600 }}
    >
      {children}
    </label>
  );
}

// ─── Input base styles ────────────────────────────────────────────────────────

const inputBase = [
  "w-full px-3.5 py-2.5 rounded-2xl text-sm text-slate-200",
  "placeholder:text-slate-700 outline-none",
  "bg-slate-800/60 border border-slate-700/40",
  "transition-all duration-150",
  "focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10",
  "hover:border-slate-600/60",
].join(" ");

// ─── Workspace Selector ───────────────────────────────────────────────────────

function WorkspaceSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = WORKSPACES.find((w) => w.id === value) ?? WORKSPACES[0];

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl",
          "bg-slate-800/60 border border-slate-700/40",
          "hover:border-slate-600/60 transition-all duration-150",
          open && "border-blue-500/60 ring-2 ring-blue-500/10"
        )}
      >
        <div className="flex items-center gap-2.5">
          <selected.Icon className={cn("w-3.5 h-3.5 shrink-0", selected.color)} />
          <span className="text-slate-200 text-sm">{selected.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-slate-600 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-10 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden">
          {WORKSPACES.map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => {
                onChange(ws.id);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3.5 py-2.5 transition-colors duration-100",
                "hover:bg-slate-800/60",
                value === ws.id && "bg-slate-800/40"
              )}
            >
              <ws.Icon className={cn("w-3.5 h-3.5 shrink-0", ws.color)} />
              <span className="text-slate-300 text-sm flex-1 text-left">{ws.label}</span>
              {value === ws.id && <Check className="w-3 h-3 text-blue-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Team Member Chip ─────────────────────────────────────────────────────────

function TeamMemberChip({
  member,
  selected,
  onToggle,
}: {
  member: (typeof TEAM_MEMBERS)[0];
  selected: boolean;
  onToggle: () => void;
}) {
  const isAgent = member.type === "AGENT";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-150",
        selected
          ? isAgent
            ? "bg-violet-500/12 border-violet-500/40 text-violet-300"
            : "bg-blue-500/12 border-blue-500/40 text-blue-300"
          : "bg-slate-800/40 border-slate-700/40 text-slate-500 hover:border-slate-600 hover:text-slate-300"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-5 h-5 rounded-lg flex items-center justify-center shrink-0",
          isAgent ? "bg-violet-900/60" : ""
        )}
        style={
          !isAgent && member.bg
            ? { background: member.bg + "40", border: `1px solid ${member.bg}60` }
            : undefined
        }
      >
        {isAgent ? (
          <Bot className="w-3 h-3 text-violet-400" />
        ) : (
          <span
            className="text-white"
            style={{ fontSize: "8px", fontWeight: 700 }}
          >
            {member.initials}
          </span>
        )}
      </div>

      {/* Name */}
      <span style={{ fontSize: "11px", fontWeight: selected ? 600 : 400 }}>
        {member.name}
      </span>

      {selected && <Check className="w-2.5 h-2.5 shrink-0" />}
    </button>
  );
}

// ─── Process Template Card ────────────────────────────────────────────────────

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: (typeof TEMPLATES)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all duration-150 text-left",
        selected
          ? cn(template.activeBorder, template.activeBg)
          : "border-slate-700/40 hover:border-slate-600/60 bg-slate-800/30"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
          selected ? template.iconBg : "bg-slate-800"
        )}
      >
        <template.Icon
          className={cn(
            "w-3.5 h-3.5 transition-colors",
            selected ? template.accent : "text-slate-600"
          )}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "transition-colors",
            selected ? "text-slate-100" : "text-slate-400"
          )}
          style={{ fontSize: "12px", fontWeight: 600 }}
        >
          {template.label}
        </p>
        <p className="text-slate-600 truncate" style={{ fontSize: "10px" }}>
          {template.desc}
        </p>
      </div>

      {/* Radio indicator */}
      <div
        className={cn(
          "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-150",
          selected ? template.activeBorder : "border-slate-700"
        )}
      >
        {selected && (
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full",
              template.color === "blue" && "bg-blue-400",
              template.color === "violet" && "bg-violet-400",
              template.color === "emerald" && "bg-emerald-400"
            )}
          />
        )}
      </div>
    </button>
  );
}

// ─── Create Project Modal ─────────────────────────────────────────────────────

export function CreateProjectModal({
  open,
  onOpenChange,
  onDeploy,
}: CreateProjectModalProps) {
  const [form, setForm] = React.useState<ProjectFormState>({
    name: "",
    workspace: "ebox",
    targetDate: "",
    team: [],
    template: "sprint",
  });
  const [deploying, setDeploying] = React.useState(false);
  const [deployed, setDeployed] = React.useState(false);

  const canDeploy = form.name.trim().length > 0;

  const toggleTeamMember = (id: string) => {
    setForm((f) => ({
      ...f,
      team: f.team.includes(id) ? f.team.filter((m) => m !== id) : [...f.team, id],
    }));
  };

  const reset = () => {
    setForm({
      name: "",
      workspace: "ebox",
      targetDate: "",
      team: [],
      template: "sprint",
    });
    setDeploying(false);
    setDeployed(false);
  };

  const handleDeploy = () => {
    if (!canDeploy) return;
    setDeploying(true);
    setTimeout(() => {
      onDeploy?.(form);
      setDeployed(true);
      setTimeout(() => {
        reset();
        onOpenChange(false);
      }, 800);
    }, 900);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogPrimitive.Portal>
        <GlassOverlay />

        <DialogPrimitive.Content
          className={cn(
            "fixed top-[50%] left-[50%] z-50",
            "-translate-x-1/2 -translate-y-1/2",
            "w-full max-w-2xl",
            /* Modal surface */
            "bg-[#111926] border border-slate-700/40",
            "rounded-2xl",
            "shadow-2xl shadow-slate-950/80",
            "ring-1 ring-white/[0.04]",
            /* Animations */
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-top-2",
            "duration-200"
          )}
        >
          {/* Top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-xl text-slate-600 hover:text-slate-300 hover:bg-slate-700/60 transition-all duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="p-6">
            {/* ── Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Rocket className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <DialogPrimitive.Title
                  className="text-slate-100 text-base"
                  style={{ fontWeight: 700 }}
                >
                  Create Master Project
                </DialogPrimitive.Title>
                <p className="text-slate-600 mt-0.5" style={{ fontSize: "11px" }}>
                  Define scope, ownership, and execution blueprint
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-800/80 mb-5" />

            {/* ── Two-column body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ── Left column */}
              <div className="space-y-4">

                {/* Project Name */}
                <div>
                  <FieldLabel>Project Name</FieldLabel>
                  <input
                    autoFocus
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. LATAM WhatsApp Integration"
                    className={inputBase}
                  />
                </div>

                {/* Workspace */}
                <div>
                  <FieldLabel>Workspace</FieldLabel>
                  <WorkspaceSelector
                    value={form.workspace}
                    onChange={(id) => setForm((f) => ({ ...f, workspace: id }))}
                  />
                </div>

                {/* Target Date */}
                <div>
                  <FieldLabel>Target Date</FieldLabel>
                  <div className="relative">
                    <input
                      type="date"
                      value={form.targetDate}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, targetDate: e.target.value }))
                      }
                      style={{ colorScheme: "dark" }}
                      className={cn(
                        inputBase,
                        "pr-10",
                        "[&::-webkit-calendar-picker-indicator]:opacity-0",
                        "[&::-webkit-calendar-picker-indicator]:absolute",
                        "[&::-webkit-calendar-picker-indicator]:inset-0",
                        "[&::-webkit-calendar-picker-indicator]:w-full",
                        "[&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      )}
                    />
                    <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* ── Right column */}
              <div className="space-y-4">

                {/* Assign Team */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="text-slate-500 uppercase tracking-widest"
                      style={{ fontSize: "10px", fontWeight: 600 }}
                    >
                      Assign Team
                    </label>
                    {form.team.length > 0 && (
                      <span
                        className="text-slate-600"
                        style={{ fontSize: "10px" }}
                      >
                        {form.team.length} selected
                      </span>
                    )}
                  </div>

                  {/* Humans */}
                  <div className="mb-2">
                    <p
                      className="text-slate-700 mb-1.5 flex items-center gap-1"
                      style={{ fontSize: "10px" }}
                    >
                      <User className="w-2.5 h-2.5" />
                      Humans
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {TEAM_MEMBERS.filter((m) => m.type === "HUMAN").map((m) => (
                        <TeamMemberChip
                          key={m.id}
                          member={m}
                          selected={form.team.includes(m.id)}
                          onToggle={() => toggleTeamMember(m.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Agents */}
                  <div>
                    <p
                      className="text-slate-700 mb-1.5 flex items-center gap-1"
                      style={{ fontSize: "10px" }}
                    >
                      <Bot className="w-2.5 h-2.5" />
                      AI Agents
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {TEAM_MEMBERS.filter((m) => m.type === "AGENT").map((m) => (
                        <TeamMemberChip
                          key={m.id}
                          member={m}
                          selected={form.team.includes(m.id)}
                          onToggle={() => toggleTeamMember(m.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Separator */}
                <div className="h-px bg-slate-800/60" />

                {/* Process Template */}
                <div>
                  <FieldLabel>Process Template</FieldLabel>
                  <div className="space-y-2">
                    {TEMPLATES.map((t) => (
                      <TemplateCard
                        key={t.id}
                        template={t}
                        selected={form.template === t.id}
                        onSelect={() => setForm((f) => ({ ...f, template: t.id }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer */}
            <div className="mt-6 h-px bg-slate-800/80" />
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={handleClose}
                className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all duration-150"
                style={{ fontSize: "13px" }}
              >
                Cancel
              </button>

              <button
                onClick={handleDeploy}
                disabled={!canDeploy || deploying}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-2xl transition-all duration-200",
                  canDeploy && !deployed
                    ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/60 border border-blue-500/40"
                    : deployed
                    ? "bg-emerald-600/80 text-white border border-emerald-500/40"
                    : "bg-slate-800/60 text-slate-600 cursor-not-allowed border border-slate-700/30"
                )}
                style={{ fontSize: "13px", fontWeight: 600 }}
              >
                {deploying && !deployed ? (
                  <span className="contents">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Deploying…
                  </span>
                ) : deployed ? (
                  <span className="contents">
                    <Sparkles className="w-3.5 h-3.5" />
                    Deployed ✓
                  </span>
                ) : (
                  <span className="contents">
                    <Rocket className="w-3.5 h-3.5" />
                    Deploy Project
                  </span>
                )}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}