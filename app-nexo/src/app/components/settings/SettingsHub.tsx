import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Bell,
  Bot,
  Building2,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Eye,
  EyeOff,
  FlaskConical,
  Globe,
  Info,
  Key,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Palette,
  Plug,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  Upload,
  User,
  Users,
  Webhook,
  X,
  Zap,
  Server,
  Database,
} from "lucide-react";
import { Switch } from "../ui/switch";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import { useAppPreferences, type Theme, type Language } from "../../contexts/AppPreferences";
import { useUserPerspective } from "../../contexts/UserPerspective";
import { AgentPermissionsPanel } from "./AgentPermissionsPanel";
import { AgentConfigSheet, type AgentForConfig } from "./AgentConfigSheet";
import { PlanAddonPanel } from "./PlanAddonPanel";
import { TeamsPanel } from "./TeamsPanel";
import { VaultPanel } from "./VaultPanel";
import { MCPPanel } from "./MCPPanel";
import { PerspectiveSettings } from "./PerspectiveSettings";
import { FeatureFlagsPanel } from "../admin/FeatureFlagsPanel";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SettingsView = "general" | "workspace" | "agents" | "api" | "profile" | "permissions" | "plan" | "teams" | "security" | "vault" | "mcp" | "perspective" | "features";
type AgentType = "CONTENT" | "DATA" | "STRATEGY" | "ENGINEERING" | "RESEARCH" | "LEGAL";
type AgentHierarchyType = "CAPTAIN" | "DT" | "SPECIALIST";
type AIModel = "gpt-4o" | "gpt-4o-mini" | "claude-3.5";

interface Agent {
  id: string;
  name: string;
  type: AgentType;
  hierarchyType: AgentHierarchyType; // For visual hierarchy badges
  model: AIModel;
  systemPrompt: string;
  active: boolean;
  tasksCompleted: number;
  avgConfidence: number;
  lastRun: string;
  hitl: boolean;
  emoji?: string; // For avatar fallback
}

// ─── Static data ──────────────────────────────────────────────────────────────

const INITIAL_AGENTS: Agent[] = [
  {
    id: "writer",
    name: "Writer-Bot",
    type: "CONTENT",
    hierarchyType: "DT",
    emoji: "✍️",
    model: "gpt-4o",
    systemPrompt:
      "You are a strategic content creator for B2B SaaS. Draft compelling copy, blog posts, and marketing materials aligned with Cerebrin's AI-governance positioning. Always maintain an executive-level tone and cite data when available.",
    active: true,
    tasksCompleted: 284,
    avgConfidence: 91,
    lastRun: "2 min ago",
    hitl: true,
  },
  {
    id: "analyst",
    name: "Analyst-Bot",
    type: "DATA",
    hierarchyType: "DT",
    emoji: "📊",
    model: "gpt-4o",
    systemPrompt:
      "Analyze business data, market trends, and operational metrics. Generate actionable insights with statistical confidence levels. Flag anomalies and surface strategic opportunities from complex datasets.",
    active: true,
    tasksCompleted: 412,
    avgConfidence: 87,
    lastRun: "5 min ago",
    hitl: false,
  },
  {
    id: "strategy",
    name: "Strategy-Bot",
    type: "STRATEGY",
    hierarchyType: "CAPTAIN",
    emoji: "🎯",
    model: "gpt-4o",
    systemPrompt:
      "Design and validate strategic initiatives using OKRs, SWOT, and Jobs-to-be-Done frameworks. Score ideas by impact/effort matrix and produce structured recommendation reports with risk assessment.",
    active: true,
    tasksCompleted: 156,
    avgConfidence: 89,
    lastRun: "12 min ago",
    hitl: true,
  },
  {
    id: "dev",
    name: "Dev-Bot",
    type: "ENGINEERING",
    hierarchyType: "SPECIALIST",
    emoji: "🔧",
    model: "gpt-4o",
    systemPrompt:
      "Generate, review, and document code across TypeScript, Python, and SQL. Perform automated code reviews, write unit tests, and propose architecture improvements following SOLID principles and clean code standards.",
    active: true,
    tasksCompleted: 331,
    avgConfidence: 93,
    lastRun: "1 min ago",
    hitl: false,
  },
  {
    id: "research",
    name: "Research-Bot",
    type: "RESEARCH",
    hierarchyType: "SPECIALIST",
    emoji: "🔬",
    model: "gpt-4o-mini",
    systemPrompt:
      "Conduct deep market research, competitive analysis, and technology landscape assessments. Synthesize multi-source information into structured intelligence briefs with confidence scoring and source attribution.",
    active: false,
    tasksCompleted: 67,
    avgConfidence: 84,
    lastRun: "3 days ago",
    hitl: true,
  },
  {
    id: "compliance",
    name: "Compliance-Bot",
    type: "LEGAL",
    hierarchyType: "DT",
    emoji: "⚖️",
    model: "gpt-4o-mini",
    systemPrompt:
      "Monitor regulatory changes, review contracts for risk clauses, and ensure all AI outputs comply with GDPR, LGPD, and SOC2 requirements. Generate audit trails and flag high-risk content automatically.",
    active: false,
    tasksCompleted: 23,
    avgConfidence: 96,
    lastRun: "1 day ago",
    hitl: true,
  },
];

const AGENT_TYPE_STYLES: Record<
  AgentType,
  { label: string; bg: string; border: string; text: string; iconColor: string }
> = {
  CONTENT:     { label: "Content",     bg: "bg-violet-500/10",  border: "border-violet-500/25",  text: "text-violet-400",  iconColor: "text-violet-400" },
  DATA:        { label: "Data",        bg: "bg-blue-500/10",    border: "border-blue-500/25",    text: "text-blue-400",    iconColor: "text-blue-400" },
  STRATEGY:    { label: "Strategy",    bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-400", iconColor: "text-emerald-400" },
  ENGINEERING: { label: "Engineering", bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-400",   iconColor: "text-amber-400" },
  RESEARCH:    { label: "Research",    bg: "bg-muted",          border: "border-border",         text: "text-muted-foreground", iconColor: "text-muted-foreground" },
  LEGAL:       { label: "Legal",       bg: "bg-rose-500/10",    border: "border-rose-500/25",    text: "text-rose-400",    iconColor: "text-rose-400" },
};

const AI_MODELS: { id: AIModel; label: string; badge: string; desc: string }[] = [
  { id: "gpt-4o",      label: "GPT-4o",      badge: "OpenAI",    desc: "Most capable · Best for complex reasoning" },
  { id: "gpt-4o-mini", label: "GPT-4o mini", badge: "OpenAI",    desc: "Fast & efficient · Cost-optimized" },
  { id: "claude-3.5",  label: "Claude 3.5",  badge: "Anthropic", desc: "Long context · Superior instruction following" },
];

const MOCK_API_KEY  = "sk-cerebrin-prod-9x2mK7pQ4nL8wR3vE6bT";
const MOCK_BASE_URL = "https://api.cerebrin.ai/v1";
const MOCK_WEBHOOK  = "https://hooks.cerebrin.ai/v1/agent-events";

// ─── Glassmorphism overlay ────────────────────────────────────────────────────

function GlassOverlay() {
  return (
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 backdrop-blur-xl bg-background/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
  );
}

// ─── Field label ──────────────────────────────────────────────────────────────

function FL({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-muted-foreground uppercase tracking-widest" style={{ fontSize: "10px", fontWeight: 600 }}>
        {children}
      </label>
      {hint && <span className="text-muted-foreground/40" style={{ fontSize: "10px" }}>{hint}</span>}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none bg-muted/60 border border-border/60 transition-all duration-150 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 hover:border-border";

// ─── General Settings Panel ───────────────────────────────────────────────────

const THEME_SETTINGS: { value: Theme; icon: React.ElementType }[] = [
  { value: "light",  icon: Sun     },
  { value: "dark",   icon: Moon    },
  { value: "system", icon: Monitor },
];

const LANG_SETTINGS: { value: Language; flag: string; label: string }[] = [
  { value: "en", flag: "🇺🇸", label: "English (US)" },
  { value: "es", flag: "🇪🇸", label: "Español"      },
];

function ThemeMockup({ mode }: { mode: "light" | "dark" | "system" }) {
  const isDark   = mode === "dark";
  const isSystem = mode === "system";
  return (
    <div
      className={cn(
        "relative rounded-xl border overflow-hidden",
        isDark   ? "bg-slate-900 border-slate-700"
        : isSystem ? "border-border"
        : "bg-slate-100 border-slate-300"
      )}
      style={{ width: 72, height: 52 }}
    >
      {isSystem && <div className="absolute inset-y-0 left-0 right-1/2 bg-slate-100" />}
      {isSystem && <div className="absolute inset-y-0 left-1/2 right-0 bg-slate-900" />}
      {isSystem && <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-500/40" />}
      <div className={cn("absolute left-1 top-1 bottom-1 w-3 rounded-md",
        isDark ? "bg-slate-800" : isSystem ? "bg-slate-200/60" : "bg-slate-300"
      )} />
      <div className="absolute left-5 top-2 right-1.5 space-y-1">
        <div className={cn("h-1.5 w-full rounded-sm", isDark ? "bg-slate-700" : "bg-slate-300")} />
        <div className={cn("h-1 w-3/4 rounded-sm",   isDark ? "bg-slate-800" : "bg-slate-200")} />
        <div className={cn("h-1 w-full rounded-sm",  isDark ? "bg-slate-800" : "bg-slate-200")} />
        <div className={cn("h-2 w-1/2 rounded-sm mt-1", isDark ? "bg-violet-700/60" : "bg-violet-300/80")} />
      </div>
    </div>
  );
}

function GeneralSettingsPanel() {
  const { theme, setTheme, language, setLanguage, t } = useAppPreferences();
  const [notifEmail, setNotifEmail] = React.useState(true);
  const [notifInApp, setNotifInApp] = React.useState(true);
  const [notifSlack, setNotifSlack] = React.useState(false);
  const [dateFormat, setDateFormat]  = React.useState("DD/MM/YYYY");

  const themeLabel: Record<Theme, string>    = { light: t("theme_light"), dark: t("theme_dark"), system: t("theme_system") };
  const themeDesc:  Record<Theme, string>    = { light: t("theme_light_desc"), dark: t("theme_dark_desc"), system: t("theme_system_desc") };

  return (
    <div className="p-7 space-y-7 max-w-2xl">
      <div>
        <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>{t("general_settings")}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{t("general_settings_desc")}</p>
      </div>

      {/* Appearance Card */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Palette className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>{t("appearance_card_title")}</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{t("appearance_card_desc")}</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <p className="text-muted-foreground/60 uppercase tracking-widest mb-4" style={{ fontSize: "9px", fontWeight: 600 }}>{t("color_theme")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {THEME_SETTINGS.map(({ value, icon: Icon }) => {
              const isActive = theme === value;
              return (
                <button key={value} onClick={() => setTheme(value)}
                  className={cn(
                    "flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border transition-all duration-200",
                    isActive
                      ? "border-violet-500/50 bg-violet-600/10 ring-1 ring-violet-500/20"
                      : "border-border/50 bg-muted/30 hover:border-border hover:bg-muted/60"
                  )}>
                  <ThemeMockup mode={value} />
                  <div className="flex items-center gap-1.5 w-full">
                    <Icon className={cn("w-3 h-3 shrink-0", isActive ? "text-violet-400" : "text-muted-foreground/50")} />
                    <span className={cn("text-xs flex-1", isActive ? "text-violet-300" : "text-muted-foreground")} style={{ fontWeight: isActive ? 600 : 400 }}>
                      {themeLabel[value]}
                    </span>
                    {isActive && <div className="w-4 h-4 rounded-full bg-violet-600 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                  </div>
                  <p className={cn("text-center w-full", isActive ? "text-violet-400/60" : "text-muted-foreground/40")} style={{ fontSize: "9px" }}>
                    {themeDesc[value]}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Language & Region Card */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>{t("lang_region_title")}</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{t("lang_region_desc")}</p>
          </div>
        </div>
        <div className="px-5 py-5 space-y-5">
          <div>
            <p className="text-muted-foreground/60 uppercase tracking-widest mb-3" style={{ fontSize: "9px", fontWeight: 600 }}>{t("display_language")}</p>
            <div className="flex gap-2.5">
              {LANG_SETTINGS.map(({ value, flag, label }) => {
                const isActive = language === value;
                return (
                  <button key={value} onClick={() => setLanguage(value)}
                    className={cn(
                      "flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200",
                      isActive ? "border-blue-500/40 bg-blue-600/10 ring-1 ring-blue-500/20" : "border-border/50 bg-muted/30 hover:border-border"
                    )}>
                    <span className="text-xl">{flag}</span>
                    <div className="text-left">
                      <p className={cn("text-sm", isActive ? "text-blue-300" : "text-foreground")} style={{ fontWeight: isActive ? 600 : 400 }}>{label}</p>
                    </div>
                    {isActive && <div className="ml-auto w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>{t("timezone")}</p>
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/50 bg-muted/30">
              <Globe className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
              <span className="text-foreground flex-1 text-sm">America/Santiago</span>
              <span className="text-muted-foreground/60 text-xs">UTC−3</span>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>{t("date_format")}</p>
            <div className="flex gap-2">
              {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map((fmt) => (
                <button key={fmt}
                  onClick={() => setDateFormat(fmt)}
                  className={cn("px-3 py-2 rounded-xl border transition-all font-mono",
                    dateFormat === fmt
                      ? "border-blue-500/40 bg-blue-600/10 text-blue-300"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                  )} style={{ fontSize: "11px" }}>
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Card */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>{t("notif_title")}</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{t("notif_desc")}</p>
          </div>
        </div>
        <div className="divide-y divide-border/40">
          {[
            { labelKey: "notif_email" as const, descKey: "notif_email_desc" as const, state: notifEmail, setState: setNotifEmail },
            { labelKey: "notif_inapp" as const, descKey: "notif_inapp_desc" as const, state: notifInApp, setState: setNotifInApp },
            { labelKey: "notif_slack" as const, descKey: "notif_slack_desc" as const, state: notifSlack, setState: setNotifSlack },
          ].map(({ labelKey, descKey, state, setState }) => (
            <div key={labelKey} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-foreground text-sm" style={{ fontWeight: 500 }}>{t(labelKey)}</p>
                <p className="text-muted-foreground" style={{ fontSize: "11px" }}>{t(descKey)}</p>
              </div>
              <Switch
                checked={state}
                onCheckedChange={setState}
                className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-switch-background"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Create Agent Modal ───────────────────────────────────────────────────────

function CreateAgentModal({
  open,
  onOpenChange,
  onDeploy,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeploy: (agent: Agent) => void;
}) {
  const [name,     setName]     = React.useState("");
  const [type,     setType]     = React.useState<AgentType>("CONTENT");
  const [model,    setModel]    = React.useState<AIModel>("gpt-4o");
  const [prompt,   setPrompt]   = React.useState("");
  const [hitl,     setHitl]     = React.useState(true);
  const [deploying, setDeploying] = React.useState(false);
  const [done,      setDone]      = React.useState(false);

  const canDeploy = name.trim().length > 0 && prompt.trim().length > 10;
  const reset = () => { setName(""); setType("CONTENT"); setModel("gpt-4o"); setPrompt(""); setHitl(true); setDeploying(false); setDone(false); };

  const handleDeploy = () => {
    if (!canDeploy) return;
    setDeploying(true);
    setTimeout(() => {
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name: name.trim(),
        type, model,
        systemPrompt: prompt.trim(),
        active: true,
        tasksCompleted: 0,
        avgConfidence: 0,
        lastRun: "Never",
        hitl,
      };
      onDeploy(newAgent);
      setDone(true);
      setTimeout(() => { reset(); onOpenChange(false); }, 700);
    }, 1000);
  };

  const handleClose = () => { reset(); onOpenChange(false); };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogPrimitive.Portal>
        <GlassOverlay />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-popover border border-border/60 rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/[0.04] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 duration-200">
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <button onClick={handleClose} className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-xl text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-foreground text-base" style={{ fontWeight: 700 }}>
                  Create Agent
                </DialogPrimitive.Title>
                <p className="text-muted-foreground mt-0.5" style={{ fontSize: "11px" }}>Configure a new autonomous AI worker</p>
              </div>
            </div>

            <div className="h-px bg-border/60 mb-5" />

            <div className="space-y-4">
              {/* Name */}
              <div>
                <FL>Agent Name</FL>
                <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Outreach-Bot" className={inputCls} />
              </div>

              {/* Type grid */}
              <div>
                <FL>Agent Type</FL>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                  {(Object.entries(AGENT_TYPE_STYLES) as [AgentType, typeof AGENT_TYPE_STYLES[AgentType]][]).map(([t, s]) => (
                    <button key={t} type="button" onClick={() => setType(t)}
                      className={cn("px-3 py-2 rounded-xl border text-left transition-all duration-150",
                        type === t ? cn(s.bg, s.border, s.text) : "bg-muted/40 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                      )} style={{ fontSize: "11px", fontWeight: type === t ? 600 : 400 }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model */}
              <div>
                <FL>Base Model</FL>
                <div className="space-y-1.5">
                  {AI_MODELS.map((m) => (
                    <button key={m.id} type="button" onClick={() => setModel(m.id)}
                      className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all duration-150 text-left",
                        model === m.id ? "bg-violet-500/8 border-violet-500/40" : "bg-muted/30 border-border/50 hover:border-border/80"
                      )}>
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        model === m.id ? "border-violet-500" : "border-muted-foreground/30")}>
                        {model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-sm", model === m.id ? "text-foreground" : "text-muted-foreground")} style={{ fontWeight: 600 }}>{m.label}</span>
                        <span className="text-muted-foreground/50 ml-2" style={{ fontSize: "10px" }}>{m.badge}</span>
                        <p className="text-muted-foreground/50 truncate" style={{ fontSize: "10px" }}>{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* System prompt */}
              <div>
                <FL hint={`${prompt.length} chars`}>System Prompt</FL>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Define the agent's core directive, capabilities, constraints, and output format…"
                  rows={4} className={cn(inputCls, "resize-none leading-relaxed font-mono")} style={{ fontSize: "12px" }} />
              </div>

              {/* HITL */}
              <div className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-muted/30 border border-border/50">
                <div>
                  <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Require Human Approval</p>
                  <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Agent outputs must be reviewed before execution</p>
                </div>
                <Switch checked={hitl} onCheckedChange={setHitl}
                  className="data-[state=checked]:bg-violet-600 data-[state=unchecked]:bg-switch-background" />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex items-center justify-between">
              <button onClick={handleClose} className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all" style={{ fontSize: "13px" }}>
                Cancel
              </button>
              <button onClick={handleDeploy} disabled={!canDeploy || deploying}
                className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all duration-200",
                  canDeploy && !done ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-950/50 border border-violet-500/40"
                  : done ? "bg-emerald-600/80 text-white border border-emerald-500/40"
                  : "bg-muted/60 text-muted-foreground cursor-not-allowed border border-border/30"
                )} style={{ fontSize: "13px", fontWeight: 600 }}>
                {deploying && !done ? (
                  <span className="inline-flex items-center gap-1.5"><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Deploying…</span>
                ) : done ? (
                  <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Deployed ✓</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" />Deploy Agent</span>
                )}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ─── Agent card ───────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  onToggle,
  onDelete,
  onConfigure,
}: {
  agent: Agent;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onConfigure: (agent: Agent) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [testing, setTesting]   = React.useState(false);
  const { t } = useAppPreferences();
  const style = AGENT_TYPE_STYLES[agent.type];
  const model = AI_MODELS.find((m) => m.id === agent.model);

  const handleTestAgent = () => {
    if (!agent.active) {
      toast.error("Agente inactivo", { description: "Activa el agente antes de ejecutar una prueba." });
      return;
    }
    setTesting(true);
    setTimeout(() => {
      setTesting(false);
      toast.success(`Test completado — ${agent.name}`, {
        description: `Confianza: ${agent.avgConfidence > 0 ? agent.avgConfidence + "%" : "N/A"} · HITL: ${agent.hitl ? "activo" : "inactivo"}`,
      });
    }, 1600);
  };

  return (
    <div className={cn(
      "flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden",
      agent.active
        ? "bg-muted/40 border-border/60 hover:border-border"
        : "bg-muted/20 border-border/30 hover:border-border/50 opacity-70 hover:opacity-90"
    )}>
      {/* Status bar at top */}
      <div className={cn("h-0.5", agent.active ? cn("bg-gradient-to-r from-transparent", `via-${style.text.replace("text-", "")}/40`, "to-transparent") : "bg-border/30")} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            {/* Bot icon box */}
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", style.bg, style.border)}>
              <Bot className={cn("w-5 h-5", style.iconColor)} />
            </div>
            <div>
              <h4 className="text-foreground text-sm" style={{ fontWeight: 700 }}>{agent.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border", style.bg, style.border, style.text)} style={{ fontWeight: 600 }}>
                  {style.label}
                </span>
                <span className="text-muted-foreground/50" style={{ fontSize: "10px" }}>{model?.label}</span>
              </div>
            </div>
          </div>

          {/* Switch */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Switch
              checked={agent.active}
              onCheckedChange={() => onToggle(agent.id)}
              className={cn(
                "data-[state=unchecked]:bg-switch-background",
                agent.type === "CONTENT"     && "data-[state=checked]:bg-violet-600",
                agent.type === "DATA"        && "data-[state=checked]:bg-blue-600",
                agent.type === "STRATEGY"    && "data-[state=checked]:bg-emerald-600",
                agent.type === "ENGINEERING" && "data-[state=checked]:bg-amber-600",
                agent.type === "RESEARCH"    && "data-[state=checked]:bg-slate-600",
                agent.type === "LEGAL"       && "data-[state=checked]:bg-rose-600",
              )}
            />
            <span className={cn("text-[10px]", agent.active ? "text-emerald-400" : "text-muted-foreground/50")}>
              {agent.active ? t("active") : t("inactive")}
            </span>
          </div>
        </div>

        {/* System prompt */}
        <div className="mb-3.5">
          <p className="text-muted-foreground/60 uppercase tracking-widest mb-1.5" style={{ fontSize: "9px", fontWeight: 600 }}>System Prompt</p>
          <div className="relative">
            <p className={cn("text-muted-foreground leading-relaxed transition-all duration-200", !expanded && "line-clamp-2")}
              style={{ fontSize: "11px" }}>
              {agent.systemPrompt}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <button onClick={() => setExpanded((v) => !v)}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                style={{ fontSize: "10px" }}>
                {expanded ? "↑ collapse" : "→ expand"}
              </button>
              <span className="text-muted-foreground/20">·</span>
              <button
                onClick={handleTestAgent}
                disabled={testing}
                className="flex items-center gap-1 text-muted-foreground/40 hover:text-violet-400 transition-colors disabled:opacity-50"
                style={{ fontSize: "10px" }}
              >
                {testing
                  ? <span className="inline-flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border border-violet-400/30 border-t-violet-400 animate-spin" />Testing…</span>
                  : <span className="inline-flex items-center gap-1.5"><FlaskConical className="w-3 h-3" />Test Agent</span>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-muted-foreground tabular-nums" style={{ fontSize: "11px" }}>{agent.tasksCompleted.toLocaleString()} tasks</span>
          </div>
          {agent.avgConfidence > 0 && (
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-muted-foreground tabular-nums" style={{ fontSize: "11px" }}>{agent.avgConfidence}% conf.</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-muted-foreground/60" style={{ fontSize: "11px" }}>{agent.lastRun}</span>
          </div>
          {agent.hitl && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500/80">
              HITL
            </span>
          )}
          {/* Configure button */}
          <button
            onClick={() => onConfigure(agent)}
            className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all duration-150 shrink-0"
            style={{ fontSize: "11px", fontWeight: 700 }}
          >
            <Settings className="w-3 h-3" />
            Configurar
          </button>
          <button onClick={() => onDelete(agent.id)} className="text-muted-foreground/20 hover:text-rose-500/70 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── API Code Block ───────────────────────────────────────────────────────────

function CodeLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("leading-6 select-all", className)}>{children}</div>;
}
const K = ({ children }: { children: React.ReactNode }) => <span className="text-blue-400">{children}</span>;
const S = ({ children }: { children: React.ReactNode }) => <span className="text-emerald-400">{children}</span>;
const N = ({ children }: { children: React.ReactNode }) => <span className="text-amber-400">{children}</span>;
const C = ({ children }: { children: React.ReactNode }) => <span className="text-slate-600">{children}</span>;
const P = ({ children }: { children: React.ReactNode }) => <span className="text-slate-400">{children}</span>;
const M = ({ children }: { children: React.ReactNode }) => <span className="text-violet-400">{children}</span>;
// suppress unused var warnings
void C;

// ─── API key row ──────────────────────────────────────────────────────────────

function ApiKeyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied,   setCopied]   = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);

  const displayValue = label === "API Key"
    ? (revealed ? value : value.slice(0, 17) + "•".repeat(20))
    : value;

  const handleCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.06] last:border-b-0">
      <span className="text-slate-500 w-28 shrink-0" style={{ fontSize: "11px" }}>{label}</span>
      <span className={cn("flex-1 text-slate-300 truncate", mono && "font-mono")} style={{ fontSize: "11px" }}>
        {displayValue}
      </span>
      <div className="flex items-center gap-1.5 shrink-0">
        {label === "API Key" && (
          <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 whitespace-nowrap" style={{ fontSize: "9px", fontWeight: 600 }}>
            Scope: Ebox.lat
          </span>
        )}
        {label === "API Key" && (
          <button onClick={() => setRevealed((v) => !v)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/10 transition-all">
            {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        )}
        <button onClick={handleCopy}
          className={cn("flex items-center gap-1 px-2 py-1 rounded-lg border transition-all", copied
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-white/10 text-slate-600 hover:text-slate-300 hover:border-white/20"
          )} style={{ fontSize: "10px" }}>
          {copied ? <span className="inline-flex items-center gap-1.5"><Check className="w-2.5 h-2.5" />Copied</span> : <span className="inline-flex items-center gap-1.5"><Copy className="w-2.5 h-2.5" />Copy</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Agent Factory Panel ──────────────────────────────────────────────────────

function AgentFactoryPanel({ onCreateClick }: { onCreateClick: () => void }) {
  const [agents, setAgents]           = React.useState<Agent[]>(INITIAL_AGENTS);
  const [configAgent, setConfigAgent] = React.useState<AgentForConfig | null>(null);
  const [configOpen, setConfigOpen]   = React.useState(false);
  const [createOpen, setCreateOpen]   = React.useState(false);
  const { t } = useAppPreferences();

  const toggleAgent = (id: string) =>
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));

  const deleteAgent = (id: string) =>
    setAgents((prev) => prev.filter((a) => a.id !== id));

  const openConfig = (agent: Agent) => {
    setConfigAgent({
      id: agent.id,
      name: agent.name,
      type: agent.hierarchyType,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      emoji: agent.emoji,
      active: agent.active,
      tasksCompleted: agent.tasksCompleted,
      avgConfidence: agent.avgConfidence,
      lastRun: agent.lastRun,
      hitl: agent.hitl,
    });
    setConfigOpen(true);
  };

  const activeCount = agents.filter((a) => a.active).length;
  const PLAN_AGENT_LIMIT = 10;
  const atAgentLimit = agents.length >= PLAN_AGENT_LIMIT;

  return (
    <div>
    <div className="p-7 space-y-7">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>{t("agent_factory_title")}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {agents.length} {t("agents_configured")} · <span className="text-emerald-400">{activeCount} {t("agents_active")}</span>
            {" · "}
            <span className={cn("tabular-nums", atAgentLimit ? "text-rose-400" : "text-muted-foreground/40")} style={{ fontSize: "12px" }}>
              {agents.length}/{PLAN_AGENT_LIMIT} Growth
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={() => {
              if (atAgentLimit) {
                toast.error("Límite de agentes alcanzado", { description: `El plan Growth permite hasta ${PLAN_AGENT_LIMIT} agentes. Actualiza a Enterprise para más.` });
                return;
              }
              setCreateOpen(true);
              onCreateClick();
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl border shadow-lg transition-all duration-150",
              atAgentLimit
                ? "bg-muted/60 border-border/40 text-muted-foreground/50 cursor-not-allowed shadow-none"
                : "bg-violet-600 hover:bg-violet-500 text-white border-violet-500/40 shadow-violet-950/40"
            )}
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            {atAgentLimit ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {atAgentLimit ? "Límite del plan" : t("create_agent")}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: PLAN_AGENT_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    i < agents.length ? (atAgentLimit ? "bg-rose-500" : "bg-violet-500") : "bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>
            {atAgentLimit && (
              <button
                onClick={() => toast("Upgrade a Enterprise", { description: "Agentes ilimitados, enjambre autónomo y funciones avanzadas." })}
                className="flex items-center gap-0.5 text-violet-400 hover:text-violet-300 transition-colors"
                style={{ fontSize: "9px", fontWeight: 600 }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onToggle={toggleAgent} onDelete={deleteAgent} onConfigure={openConfig} />
        ))}
      </div>

      {/* ── Swarm Agents ── */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-violet-500/15">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-foreground text-sm" style={{ fontWeight: 700 }}>Enjambre de Agentes</p>
              <span className="px-1.5 py-0.5 rounded-md bg-violet-600/20 border border-violet-500/30 text-violet-400" style={{ fontSize: "9px", fontWeight: 700 }}>ENTERPRISE</span>
              <span className="px-1.5 py-0.5 rounded-md bg-muted/60 border border-border text-muted-foreground/40" style={{ fontSize: "9px", fontWeight: 600 }}>BETA</span>
            </div>
            <p className="text-muted-foreground/50 text-xs mt-0.5">Agentes que contratan a otros agentes para completar tareas complejas de forma autónoma</p>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground/25 shrink-0" />
        </div>
        <div className="p-5 space-y-4">
          {/* Concept banner */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-violet-500/8 border border-violet-500/20">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-violet-300/70 text-xs leading-relaxed">
              El <strong className="text-violet-300">Agente Líder</strong> detecta necesidades, contrata agentes especializados del workspace con{" "}
              <strong className="text-violet-300">créditos internos</strong>, coordina la ejecución vía MCP y entrega el resultado al equipo humano vía HITL.
              El 90% del trabajo interdepartamental ocurre sin intervención humana — a la velocidad del silicio, no del correo electrónico.
            </p>
          </div>

          {/* Flow visualization */}
          <div>
            <p className="text-muted-foreground/40 uppercase tracking-widest mb-3" style={{ fontSize: "9px", fontWeight: 600 }}>Flujo activo (demo)</p>
            <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
              {/* Leader */}
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-violet-500/30 bg-violet-500/10 min-w-[96px]">
                <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-violet-300 text-center" style={{ fontSize: "10px", fontWeight: 600 }}>Agente Líder</p>
                <p className="text-violet-300/40 text-center" style={{ fontSize: "9px" }}>Lanzamiento de Producto</p>
              </div>
              {/* Sub-agents */}
              {agents.slice(0, 3).map((a) => {
                const s = AGENT_TYPE_STYLES[a.type];
                return (
                  <div key={a.id} className="contents">
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20" />
                      <span className="text-muted-foreground/20" style={{ fontSize: "8px" }}>contrata</span>
                    </div>
                    <div className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border min-w-[90px]", s.bg, s.border)}>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", s.bg, s.border)}>
                        <Bot className={cn("w-4 h-4", s.iconColor)} />
                      </div>
                      <p className={cn("text-center", s.text)} style={{ fontSize: "10px", fontWeight: 600 }}>{a.name}</p>
                      <p className="text-muted-foreground/30 text-center" style={{ fontSize: "9px" }}>{a.tasksCompleted} tasks</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Token credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Créditos disponibles", value: "2,400", color: "text-foreground" },
              { label: "Usados este mes",       value: "340",   color: "text-amber-400" },
              { label: "Delegaciones activas",  value: "12",    color: "text-violet-400" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl border border-border/40 bg-muted/20">
                <p className={cn("tabular-nums", stat.color)} style={{ fontSize: "20px", fontWeight: 700 }}>{stat.value}</p>
                <p className="text-muted-foreground/40 mt-0.5" style={{ fontSize: "10px" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => toast("Enjambre de Agentes · Enterprise", { description: "Contacta a ventas para activar agentes autónomos con delegación inter-agente y créditos internos." })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-violet-500/30 bg-violet-600/10 text-violet-400 hover:bg-violet-600/20 transition-all"
            style={{ fontSize: "13px", fontWeight: 600 }}
          >
            <Lock className="w-3.5 h-3.5" />
            Activar Enjambre · Hablar con Ventas →
          </button>
        </div>
      </div>

      {/* API section */}
      <div id="api-section">
        {/* Section divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-border/50" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-muted/60 border border-border/50">
            <Plug className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-muted-foreground/60" style={{ fontSize: "10px", fontWeight: 600 }}>API & Integrations</span>
          </div>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        {/* OpenClaw portal */}
        <OpenClawPortal />
      </div>
    </div>

    {/* Agent Config Sheet */}
    <AgentConfigSheet
      agent={configAgent}
      open={configOpen}
      onOpenChange={setConfigOpen}
    />

    {/* Create Agent Modal — lives here so it can add to local agents state */}
    <CreateAgentModal
      open={createOpen}
      onOpenChange={setCreateOpen}
      onDeploy={(newAgent) => {
        setAgents((prev) => [...prev, newAgent]);
        toast.success(`Agente desplegado`, {
          description: `${newAgent.name} está activo y listo para recibir tareas.`,
        });
      }}
    />
    </div>
  );
}

// ─── OpenClaw API Portal ──────────────────────────────────────────────────────
// Note: The API portal deliberately keeps dark terminal-style backgrounds (bg-code-bg)
// in both light and dark modes — this is intentional for code/terminal aesthetics.

function OpenClawPortal() {
  const [testing,      setTesting]      = React.useState(false);
  const [testResponse, setTestResponse] = React.useState<string | null>(null);
  const [webhookUrl,   setWebhookUrl]   = React.useState(MOCK_WEBHOOK);
  const [webhookSaved, setWebhookSaved] = React.useState(false);

  const runTest = () => {
    setTesting(true);
    setTestResponse(null);
    setTimeout(() => {
      setTesting(false);
      setTestResponse(`{\n  "task_id": "tsk_01khy0xj1gmaw",\n  "status": "queued",\n  "agent": "writer-bot",\n  "estimated_completion": "2026-02-20T14:35:00Z",\n  "hitl_checkpoint": "required",\n  "queue_position": 2\n}`);
    }, 1800);
  };

  const saveWebhook = () => {
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-border/50">
      {/* Portal header */}
      <div className="bg-code-bg px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-100 text-sm" style={{ fontWeight: 700 }}>OpenClaw Integration Portal</span>
                <span className="px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 font-mono" style={{ fontSize: "9px" }}>v1.4.2</span>
              </div>
              <p className="text-slate-500" style={{ fontSize: "11px" }}>Cerebrin AI API · REST · Webhooks · SDKs</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-400" style={{ fontSize: "10px" }}>API Operational</span>
          </div>
        </div>
      </div>

      {/* Credentials block */}
      <div className="bg-code-bg px-6 py-1">
        <ApiKeyRow label="API Key"     value={MOCK_API_KEY}  />
        <ApiKeyRow label="Base URL"    value={MOCK_BASE_URL} />
        <ApiKeyRow label="Environment" value="production"    mono={false} />
        <ApiKeyRow label="Plan Tier"   value="Growth · 100 req/min" mono={false} />
      </div>

      {/* Rate limit bar */}
      <div className="bg-code-bg-deep px-6 py-3 border-t border-white/[0.04] border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-600" style={{ fontSize: "10px" }}>Rate limit usage · this minute</span>
          <span className="text-slate-500 font-mono" style={{ fontSize: "10px" }}>23 / 100 req</span>
        </div>
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full transition-all" style={{ width: "23%" }} />
        </div>
      </div>

      {/* Code example */}
      <div className="bg-code-bg px-6 py-5">
        {/* Endpoint label */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-400 font-mono" style={{ fontSize: "10px", fontWeight: 700 }}>POST</span>
          <span className="text-slate-400 font-mono" style={{ fontSize: "11px" }}>/v1/agent/request</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={runTest} disabled={testing}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all duration-150",
                testing ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                : "border-white/10 text-slate-500 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/8"
              )} style={{ fontSize: "11px", fontWeight: 600 }}>
              {testing ? <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />Running…</span> : <span className="inline-flex items-center gap-1.5"><Zap className="w-3 h-3" />Test Request</span>}
            </button>
          </div>
        </div>

        {/* Request code block */}
        <div className="bg-black/30 rounded-xl border border-white/[0.06] p-4 font-mono overflow-x-auto" style={{ fontSize: "11px" }}>
          <CodeLine><M>POST</M> <S>{MOCK_BASE_URL}</S><P>/agent/request</P></CodeLine>
          <CodeLine><K>Authorization</K><P>: Bearer </P><S>sk-cerebrin-prod-••••••••</S></CodeLine>
          <CodeLine><K>Content-Type</K><P>: application/json</P></CodeLine>
          <CodeLine>&nbsp;</CodeLine>
          <CodeLine><P>{"{"}</P></CodeLine>
          <CodeLine>&nbsp;&nbsp;<K>"agent_id"</K><P>: </P><S>"writer-bot"</S><P>,</P></CodeLine>
          <CodeLine>&nbsp;&nbsp;<K>"task"</K><P>: </P><S>"Generate Q1 strategy brief for LATAM"</S><P>,</P></CodeLine>
          <CodeLine>&nbsp;&nbsp;<K>"context"</K><P>: {"{"}</P></CodeLine>
          <CodeLine>&nbsp;&nbsp;&nbsp;&nbsp;<K>"workspace"</K><P>: </P><S>"ebox"</S><P>,</P></CodeLine>
          <CodeLine>&nbsp;&nbsp;&nbsp;&nbsp;<K>"priority"</K><P>: </P><N>8</N><P>,</P></CodeLine>
          <CodeLine>&nbsp;&nbsp;&nbsp;&nbsp;<K>"hitl"</K><P>: </P><N>true</N></CodeLine>
          <CodeLine>&nbsp;&nbsp;<P>{"}"}</P></CodeLine>
          <CodeLine><P>{"}"}</P></CodeLine>
        </div>

        {/* Response block */}
        {(testResponse || testing) && (
          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              {testing ? (
                <span className="inline-flex items-center gap-1.5"><Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                <span className="text-violet-400" style={{ fontSize: "10px" }}>Sending request…</span></span>
              ) : (
                <span className="inline-flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-400 font-mono" style={{ fontSize: "10px", fontWeight: 600 }}>200 OK</span>
                <span className="text-slate-600" style={{ fontSize: "10px" }}>· 142ms</span></span>
              )}
            </div>
            {testResponse && (
              <div className="bg-emerald-950/20 rounded-xl border border-emerald-500/15 p-4 font-mono" style={{ fontSize: "11px" }}>
                <pre className="text-emerald-400/80 leading-6 whitespace-pre">{testResponse}</pre>
              </div>
            )}
          </div>
        )}

        {/* SDK install */}
        <div className="mt-5 pt-4 border-t border-white/[0.06]">
          <p className="text-slate-600 mb-2" style={{ fontSize: "10px", fontWeight: 600 }}>SDK QUICKSTART</p>
          <div className="flex items-center gap-3 bg-black/20 rounded-xl border border-white/[0.06] px-4 py-2.5">
            <span className="text-slate-600 font-mono" style={{ fontSize: "11px" }}>$</span>
            <span className="text-slate-400 font-mono flex-1" style={{ fontSize: "11px" }}>npm install @cerebrin/sdk</span>
            <button onClick={() => navigator.clipboard.writeText("npm install @cerebrin/sdk").catch(() => {})}
              className="text-slate-700 hover:text-slate-400 transition-colors">
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Webhook block */}
      <div className="bg-code-bg-deep px-6 py-5 border-t border-white/[0.04]">
        <div className="flex items-center gap-2 mb-4">
          <Webhook className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400 text-sm" style={{ fontWeight: 600 }}>Webhook Configuration</span>
        </div>

        <div className="space-y-3">
          {/* Webhook URL */}
          <div>
            <p className="text-slate-600 mb-1.5" style={{ fontSize: "10px" }}>Endpoint URL</p>
            <div className="flex gap-2">
              <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-slate-300 bg-black/20 border border-white/10 outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 font-mono transition-all"
                style={{ fontSize: "11px" }} />
              <button onClick={saveWebhook}
                className={cn("px-4 py-2 rounded-xl border transition-all text-xs shrink-0",
                  webhookSaved ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300"
                )} style={{ fontWeight: 600 }}>
                {webhookSaved ? "✓ Saved" : "Save"}
              </button>
            </div>
          </div>

          {/* Event subscriptions */}
          <div>
            <p className="text-slate-600 mb-2" style={{ fontSize: "10px" }}>Event Subscriptions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                "agent.task.completed",
                "agent.task.failed",
                "hitl.review.required",
                "hitl.review.approved",
                "agent.status.changed",
                "project.promoted",
              ].map((evt) => (
                <WebhookEvent key={evt} label={evt} />
              ))}
            </div>
          </div>

          {/* Signing secret */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div>
              <p className="text-slate-500 text-xs" style={{ fontWeight: 600 }}>Signing Secret</p>
              <p className="text-slate-700 font-mono" style={{ fontSize: "10px" }}>whsec_•••••••••••••••••••••••••••••••</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all" style={{ fontSize: "11px" }}>
              <RefreshCw className="w-3 h-3" />
              Rotate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhookEvent({ label }: { label: string }) {
  const [checked, setChecked] = React.useState(
    ["agent.task.completed", "hitl.review.required", "hitl.review.approved"].includes(label)
  );
  return (
    <button type="button" onClick={() => setChecked((v) => !v)}
      className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-left",
        checked ? "border-violet-500/30 bg-violet-500/8 text-violet-400" : "border-white/10 bg-white/[0.02] text-slate-600 hover:border-white/20 hover:text-slate-500"
      )}>
      <div className={cn("w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 transition-all",
        checked ? "border-violet-500 bg-violet-600" : "border-white/20")}>
        {checked && <Check className="w-2 h-2 text-white" />}
      </div>
      <span className="font-mono truncate" style={{ fontSize: "9px" }}>{label}</span>
    </button>
  );
}

// ─── API & Webhooks dedicated panel ───────────────────────────────────────────

function ApiWebhooksPanel() {
  const { t } = useAppPreferences();
  return (
    <div className="p-7 space-y-7">
      <div>
        <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>{t("api_webhooks_title")}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{t("api_webhooks_desc")}</p>
      </div>
      <OpenClawPortal />
    </div>
  );
}

// ─── Placeholder panels ───────────────────────────────────────────────────────

function PlaceholderPanel({ icon: Icon, title, description, items }: {
  icon: React.ElementType;
  title: string;
  description: string;
  items?: { icon: React.ElementType; label: string; value: string }[];
}) {
  return (
    <div className="p-7 space-y-7">
      <div>
        <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>{title}</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
      </div>
      {items ? (
        <div className="rounded-2xl border border-border/60 bg-muted/20 divide-y divide-border/40">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-4 px-5 py-4">
              <item.icon className="w-4 h-4 text-muted-foreground/50 shrink-0" />
              <span className="text-muted-foreground flex-1 text-sm">{item.label}</span>
              <span className="text-foreground text-sm" style={{ fontWeight: 500 }}>{item.value}</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 border border-border/60 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm mb-1" style={{ fontWeight: 600 }}>{title}</p>
          <p className="text-muted-foreground/50 text-xs max-w-xs">{description}</p>
          <div className="mt-4 px-3 py-1.5 rounded-lg bg-muted border border-border/50">
            <span className="text-muted-foreground/50 text-xs">Coming soon</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Profile Panel ────────────────────────────────────────────────────────────

function ProfilePanel() {
  const [displayName, setDisplayName] = React.useState("Carlos M.");
  const [email,       setEmail]       = React.useState("carlos@ebox.lat");
  const [jobTitle,    setJobTitle]    = React.useState("Head of Strategy");
  const [twoFactor,   setTwoFactor]   = React.useState(true);
  const [saving, setSaving]           = React.useState(false);
  const [pwForm, setPwForm]           = React.useState({ current: "", next: "", confirm: "" });
  const [savingPw, setSavingPw]       = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext,    setShowNext]    = React.useState(false);

  const handleSaveProfile = () => {
    if (!displayName.trim() || !email.trim()) {
      toast.error("Campos requeridos", { description: "El nombre y email no pueden estar vacíos." });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Perfil actualizado", { description: "Los cambios se guardaron correctamente." });
    }, 900);
  };

  const handleSavePw = () => {
    if (!pwForm.current) {
      toast.error("Contraseña actual requerida");
      return;
    }
    if (pwForm.next.length < 8) {
      toast.error("Contraseña demasiado corta", { description: "Mínimo 8 caracteres." });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSavingPw(true);
    setTimeout(() => {
      setSavingPw(false);
      setPwForm({ current: "", next: "", confirm: "" });
      toast.success("Contraseña actualizada", { description: "Recuerda guardarla en un lugar seguro." });
    }, 900);
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none bg-muted/60 border border-border/60 transition-all duration-150 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 hover:border-border";

  return (
    <div className="p-7 space-y-7 max-w-2xl">
      <div>
        <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>Mi Perfil</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Gestiona tu información personal y seguridad de cuenta</p>
      </div>

      {/* Avatar + name */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Información Personal</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Nombre, cargo y dirección de correo</p>
          </div>
        </div>
        <div className="px-5 py-5 space-y-4">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/25 flex items-center justify-center">
                <span className="text-2xl" style={{ fontWeight: 700, color: "#a78bfa" }}>CM</span>
              </div>
              <button
                onClick={() => toast("Subida de avatar próximamente", { description: "Esta funcionalidad requiere backend. Ver notas para el equipo." })}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-violet-600 border border-violet-500/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div>
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Carlos Méndez</p>
              <p className="text-muted-foreground/60" style={{ fontSize: "11px" }}>Haz hover sobre el avatar para cambiar la foto</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>Nombre</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} placeholder="Tu nombre completo" />
            </div>
            <div>
              <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>Cargo</label>
              <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls} placeholder="Tu cargo en la organización" />
            </div>
          </div>
          <div>
            <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="tu@empresa.com" />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/40 transition-all text-xs disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {saving
                ? <span className="inline-flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Guardando…</span>
                : <span className="inline-flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />Guardar cambios</span>
              }
            </button>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Seguridad</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Contraseña y autenticación en dos pasos</p>
          </div>
        </div>
        <div className="px-5 py-5 space-y-4">
          {/* 2FA toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/30">
            <div>
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Autenticación en dos pasos (2FA)</p>
              <p className="text-muted-foreground" style={{ fontSize: "11px" }}>
                {twoFactor ? "Protegido con app de autenticación" : "Cuenta sin segundo factor — mayor riesgo"}
              </p>
            </div>
            <Switch
              checked={twoFactor}
              onCheckedChange={(v) => {
                setTwoFactor(v);
                toast(v ? "2FA activado" : "2FA desactivado", {
                  description: v ? "Tu cuenta ahora requiere un segundo factor." : "Recomendamos mantener el 2FA activo.",
                });
              }}
              className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-switch-background"
            />
          </div>

          {/* Change password */}
          <div className="space-y-3">
            <p className="text-muted-foreground/60 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 600 }}>Cambiar contraseña</p>
            {[
              { label: "Contraseña actual", field: "current" as const, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
              { label: "Nueva contraseña",  field: "next"    as const, show: showNext,    toggle: () => setShowNext(v => !v) },
              { label: "Confirmar nueva",   field: "confirm" as const, show: showNext,    toggle: () => {} },
            ].map(({ label, field, show, toggle }) => (
              <div key={field} className="relative">
                <label className="block text-muted-foreground/50 mb-1.5" style={{ fontSize: "10px" }}>{label}</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={pwForm[field]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
                    placeholder="••••••••••••"
                    className={cn(inputCls, "pr-9")}
                  />
                  {field !== "confirm" && (
                    <button
                      type="button"
                      onClick={toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    >
                      {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-1">
              <button
                onClick={handleSavePw}
                disabled={savingPw || (!pwForm.current && !pwForm.next)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-600 text-white border border-amber-500/40 transition-all text-xs disabled:opacity-40"
                style={{ fontWeight: 600 }}
              >
                {savingPw
                  ? <span className="inline-flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Actualizando…</span>
                  : <span className="inline-flex items-center gap-1.5"><Key className="w-3.5 h-3.5" />Actualizar contraseña</span>
                }
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-rose-500/20 bg-rose-500/5 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-rose-500/15">
          <Info className="w-3.5 h-3.5 text-rose-400" />
          <p className="text-rose-400 text-sm" style={{ fontWeight: 600 }}>Zona de peligro</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 500 }}>Eliminar mi cuenta</p>
            <p className="text-muted-foreground/60" style={{ fontSize: "11px" }}>Esta acción es permanente e irreversible</p>
          </div>
          <button
            onClick={() => toast.error("Acción no disponible", { description: "Contacta a tu administrador para eliminar la cuenta." })}
            className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all text-xs"
            style={{ fontWeight: 600 }}
          >
            Eliminar cuenta
          </button>
        </div>
      </section>
    </div>
  );
}

// ─── Workspace Panel ──────────────────────────────────────────────────────────

function WorkspacePanel() {
  const [wsName,       setWsName]       = React.useState("Ebox.lat");
  const [inviteDomain, setInviteDomain] = React.useState("@ebox.lat");
  const [ssoEnabled,   setSsoEnabled]   = React.useState(false);
  const [ssoProvider,  setSsoProvider]  = React.useState<"google" | "okta" | "azure">("google");
  const [saving,       setSaving]       = React.useState(false);
  const [inviteEmail,  setInviteEmail]  = React.useState("");
  const [inviting,     setInviting]     = React.useState(false);
  const [showRenameHistory, setShowRenameHistory] = React.useState(false);
  const RENAME_HISTORY = [
    { from: "Ebox",    to: "Ebox.lat", date: "28 Ene 2026 · 14:22", user: "carlos@ebox.lat" },
    { from: "EboxLat", to: "Ebox",     date: "12 Ene 2026 · 09:15", user: "carlos@ebox.lat" },
  ];

  const inputCls = "w-full px-3.5 py-2.5 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none bg-muted/60 border border-border/60 transition-all duration-150 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 hover:border-border";

  const handleSave = () => {
    if (!wsName.trim()) {
      toast.error("El nombre del workspace no puede estar vacío.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Workspace actualizado", { description: `Los cambios en "${wsName}" se guardaron.` });
    }, 900);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Email inválido", { description: "Ingresa un correo válido para invitar." });
      return;
    }
    setInviting(true);
    setTimeout(() => {
      setInviting(false);
      toast.success("Invitación enviada", { description: `Se envió un enlace de acceso a ${inviteEmail}` });
      setInviteEmail("");
    }, 1200);
  };

  const SSO_PROVIDERS = [
    { id: "google" as const, label: "Google Workspace", emoji: "🔵" },
    { id: "okta"   as const, label: "Okta",             emoji: "🔴" },
    { id: "azure"  as const, label: "Microsoft Azure",  emoji: "🟦" },
  ];

  return (
    <div className="p-7 space-y-7 max-w-2xl">
      <div>
        <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>Workspace & Equipo</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Configura el workspace, miembros e identidad corporativa</p>
      </div>

      {/* General config */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Información del Workspace</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Nombre, dominio y configuración general</p>
          </div>
        </div>
        <div className="px-5 py-5 space-y-5">

          {/* ── Workspace name ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-muted-foreground/60 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 600 }}>
                Nombre del Workspace
              </label>
              <button
                onClick={() => setShowRenameHistory((v) => !v)}
                className="flex items-center gap-1 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
                style={{ fontSize: "9px" }}
              >
                <Clock className="w-2.5 h-2.5" />
                Renombrado 2 veces · últ. 28 Ene
                <ChevronRight className={cn("w-2.5 h-2.5 transition-transform duration-200", showRenameHistory && "rotate-90")} />
              </button>
            </div>
            <input value={wsName} onChange={(e) => setWsName(e.target.value)} className={inputCls} placeholder="Nombre de tu organización" />

            {/* Immutable slug */}
            <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40">
              <Lock className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />
              <span className="text-muted-foreground/40" style={{ fontSize: "10px" }}>Slug permanente:</span>
              <code className="text-muted-foreground/60 font-mono" style={{ fontSize: "10px" }}>ebox-lat</code>
              <span className="text-muted-foreground/30 ml-1" style={{ fontSize: "10px" }}>· No cambia al renombrar · Úsalo en APIs y webhooks</span>
            </div>

            {/* Rename impact warning */}
            {wsName !== "Ebox.lat" && wsName.trim() !== "" && (
              <div className="flex items-start gap-2.5 mt-2.5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-amber-300" style={{ fontSize: "11px", fontWeight: 600 }}>Impacto del renombre</p>
                  <p className="text-amber-300/60" style={{ fontSize: "10px" }}>
                    Este cambio se registrará en el audit log con timestamp y usuario responsable.
                    Los <span style={{ fontWeight: 600 }}>agentes, equipos, proyectos y tareas</span> actualizarán
                    su referencia de display automáticamente. Los documentos exportados con el nombre anterior
                    mantendrán el historial marcado como «renombrado desde Ebox.lat».
                    Las integraciones externas que usen el <span className="font-mono">slug</span> no se ven afectadas.
                  </p>
                </div>
              </div>
            )}

            {/* Collapsible rename history */}
            {showRenameHistory && (
              <div className="rounded-xl border border-border/40 bg-muted/30 overflow-hidden mt-2.5">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
                  <Clock className="w-3 h-3 text-muted-foreground/40" />
                  <span className="text-muted-foreground/50 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 600 }}>Historial de cambios de nombre</span>
                </div>
                <div className="divide-y divide-border/30">
                  {RENAME_HISTORY.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <code className="text-muted-foreground/40 font-mono" style={{ fontSize: "10px" }}>{entry.from}</code>
                          <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/20" />
                          <code className="text-foreground/60 font-mono" style={{ fontSize: "10px" }}>{entry.to}</code>
                        </div>
                        <p className="text-muted-foreground/30 mt-0.5" style={{ fontSize: "9px" }}>{entry.user}</p>
                      </div>
                      <span className="text-muted-foreground/30 shrink-0 tabular-nums" style={{ fontSize: "9px" }}>{entry.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Domain filter ── */}
          <div>
            <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>
              Dominio de invitación
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/35 pointer-events-none" />
              <input
                value={inviteDomain}
                onChange={(e) => setInviteDomain(e.target.value)}
                className={cn(inputCls, "pl-9 pr-9")}
                placeholder="@tuempresa.com"
              />
              {inviteDomain.trim().length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inviteDomain) ? (
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                      <X className="w-2.5 h-2.5 text-rose-400" />
                    </div>
                  )}
                </div>
              )}
            </div>

            <p
              className={cn(
                "mt-1.5 flex items-center gap-1 transition-colors",
                !inviteDomain.trim()
                  ? "text-muted-foreground/30"
                  : /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inviteDomain)
                  ? "text-emerald-400/70"
                  : "text-rose-400/70"
              )}
              style={{ fontSize: "10px" }}
            >
              {!inviteDomain.trim() && <span className="inline-flex items-center gap-1"><Info className="w-2.5 h-2.5 shrink-0" />Sin filtro activo · Cualquier email puede ser invitado — recomendamos configurar un dominio</span>}
              {inviteDomain.trim() && /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inviteDomain) && <span className="inline-flex items-center gap-1"><Check className="w-2.5 h-2.5 shrink-0" />Filtro activo · Solo emails <code className="font-mono mx-0.5">{inviteDomain}</code> pasarán la validación</span>}
              {inviteDomain.trim() && !/^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inviteDomain) && <span className="inline-flex items-center gap-1"><X className="w-2.5 h-2.5 shrink-0" />Formato inválido · Usa el formato <code className="font-mono mx-0.5">@empresa.com</code></span>}
            </p>

            {inviteDomain !== "@ebox.lat" && /^@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(inviteDomain) && (
              <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-lg bg-blue-500/8 border border-blue-500/20">
                <Info className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-blue-300/60" style={{ fontSize: "10px" }}>
                  Las invitaciones pendientes con <code className="font-mono">@ebox.lat</code> seguirán siendo válidas.
                  El nuevo filtro aplica solo a invitaciones enviadas desde este momento.
                </p>
              </div>
            )}
          </div>

          {/* ── Plan limits ── */}
          <div className="rounded-2xl border border-border/50 bg-muted/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-violet-400" />
                <span className="text-foreground" style={{ fontSize: "11px", fontWeight: 600 }}>Plan Growth · Límites activos</span>
              </div>
              <button
                onClick={() => toast("Actualiza tu plan", { description: "Más asientos, agentes y funciones premium." })}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-600/15 border border-violet-500/25 text-violet-400 hover:bg-violet-600/25 transition-all"
                style={{ fontSize: "9px", fontWeight: 600 }}
              >
                <Sparkles className="w-2.5 h-2.5" />
                Upgrade
              </button>
            </div>
            <div className="divide-y divide-border/30">
              {([
                { icon: Users,  label: "Asientos",        used: 8,  limit: 100, color: "bg-emerald-500", warn: false },
                { icon: Bot,    label: "Agentes IA",       used: 6,  limit: 10,  color: "bg-violet-500",  warn: true  },
                { icon: Shield, label: "Invitaciones/mes", used: 14, limit: 20,  color: "bg-blue-500",    warn: true  },
              ] as { icon: React.ElementType; label: string; used: number; limit: number; color: string; warn: boolean }[]).map(({ icon: Icon, label, used, limit, color, warn }) => {
                const pct = Math.round((used / limit) * 100);
                const atLimit = used >= limit;
                return (
                  <div key={label} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3 text-muted-foreground/40" />
                        <span className="text-muted-foreground" style={{ fontSize: "11px" }}>{label}</span>
                        {atLimit && (
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400" style={{ fontSize: "8px", fontWeight: 700 }}>LÍMITE</span>
                        )}
                        {!atLimit && warn && pct >= 70 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400" style={{ fontSize: "8px", fontWeight: 600 }}>{100 - pct}% libre</span>
                        )}
                      </div>
                      <span className={cn("tabular-nums", atLimit ? "text-rose-400" : "text-foreground")} style={{ fontSize: "11px", fontWeight: 600 }}>
                        {used}<span className="text-muted-foreground/40" style={{ fontWeight: 400 }}>/{limit}</span>
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-muted/60">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", atLimit ? "bg-rose-500" : warn && pct >= 70 ? "bg-amber-500" : color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Save ── */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="flex items-center gap-1.5 text-muted-foreground/30" style={{ fontSize: "10px" }}>
              <Shield className="w-3 h-3" />
              Los cambios quedan registrados en el audit log
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/40 transition-all text-xs disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {saving
                ? <span className="inline-flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Guardando…</span>
                : <span className="inline-flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />Guardar cambios</span>
              }
            </button>
          </div>
        </div>
      </section>

      {/* Invite member */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Invitar Miembro</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Envía un link de acceso por email</p>
          </div>
        </div>
        <div className="px-5 py-5">
          <div className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="email@empresa.com"
              className={cn(inputCls, "flex-1")}
            />
            <button
              onClick={handleInvite}
              disabled={inviting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 text-white border border-emerald-500/40 transition-all text-xs shrink-0 disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {inviting
                ? <span className="inline-flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Enviando…</span>
                : <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Invitar</span>
              }
            </button>
          </div>
        </div>
      </section>

      {/* SSO */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>SSO / SAML</p>
              <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Inicio de sesión único para tu organización</p>
            </div>
          </div>
          <Switch
            checked={ssoEnabled}
            onCheckedChange={(v) => {
              setSsoEnabled(v);
              if (v) toast.success("SSO habilitado", { description: `Proveedor: ${SSO_PROVIDERS.find(p => p.id === ssoProvider)?.label}` });
              else toast("SSO desactivado");
            }}
            className="data-[state=checked]:bg-amber-600 data-[state=unchecked]:bg-switch-background"
          />
        </div>
        {ssoEnabled && (
          <div className="px-5 py-4 space-y-3">
            <p className="text-muted-foreground/60 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 600 }}>Proveedor de identidad</p>
            <div className="flex gap-2">
              {SSO_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSsoProvider(p.id)}
                  className={cn(
                    "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all",
                    ssoProvider === p.id
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border"
                  )}
                  style={{ fontSize: "11px", fontWeight: ssoProvider === p.id ? 600 : 400 }}
                >
                  <span>{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-300/70 text-xs">La configuración SAML completa requiere acceso al panel de administración. Contacta a tu proveedor de identidad para obtener el metadata XML.</p>
            </div>
          </div>
        )}
        {!ssoEnabled && (
          <div className="px-5 py-3">
            <p className="text-muted-foreground/40 text-xs">Habilita SSO para que tu equipo acceda con sus cuentas corporativas</p>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Gatekeeper / Security Panel ─────────────────────────────────────────────

const GATEKEEPER_LOGS = [
  { id: "GL-001", ts: "21 Feb · 15:43", agent: "Writer-Bot",   action: "doc_read",    resource: "cerebrin://docs/Q3-Report",          result: "ALLOWED", reason: "Scope OK"              },
  { id: "GL-002", ts: "21 Feb · 15:41", agent: "Analyst-Bot",  action: "data_query",  resource: "cerebrin://workspace/CRM",            result: "BLOCKED", reason: "PII detected"          },
  { id: "GL-003", ts: "21 Feb · 15:38", agent: "Dev-Bot",      action: "code_exec",   resource: "cerebrin://docs/API-Spec",            result: "ALLOWED", reason: "Scope OK"              },
  { id: "GL-004", ts: "21 Feb · 15:29", agent: "Research-Bot", action: "external_api",resource: "api.hubspot.com/v3/contacts",          result: "BLOCKED", reason: "external_api=BLOCKED" },
  { id: "GL-005", ts: "21 Feb · 14:55", agent: "Writer-Bot",   action: "doc_write",   resource: "cerebrin://docs/DRAFT-001",           result: "ALLOWED", reason: "APPROVAL granted"      },
  { id: "GL-006", ts: "21 Feb · 14:33", agent: "Strategy-Bot", action: "idea_create", resource: "cerebrin://incubadora",               result: "ALLOWED", reason: "Scope OK"              },
  { id: "GL-007", ts: "21 Feb · 13:02", agent: "Analyst-Bot",  action: "project_read",resource: "cerebrin://projects/P-003",           result: "BLOCKED", reason: "Out of scope"          },
];

function GatekeeperPanel() {
  const [provider,     setProvider]     = React.useState<"PRIVATE" | "S3" | "GCS">("PRIVATE");
  const [endpointUrl,  setEndpointUrl]  = React.useState("https://data.empresa.com/cerebrin-vault");
  const [saving,       setSaving]       = React.useState(false);
  const [mcpEnabled,   setMcpEnabled]   = React.useState(false);
  const [logFilter,    setLogFilter]    = React.useState<"ALL" | "ALLOWED" | "BLOCKED">("ALL");
  const [refreshingLog, setRefreshingLog] = React.useState(false);

  const inputCls = "w-full px-3.5 py-2.5 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/40 outline-none bg-muted/60 border border-border/60 transition-all duration-150 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 hover:border-border";

  const filteredLogs = logFilter === "ALL" ? GATEKEEPER_LOGS : GATEKEEPER_LOGS.filter((l) => l.result === logFilter);

  const RESULT_STYLE: Record<string, { bg: string; border: string; text: string }> = {
    ALLOWED: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    BLOCKED: { bg: "bg-rose-500/10",    border: "border-rose-500/20",    text: "text-rose-400"    },
  };

  return (
    <div className="p-7 space-y-7 max-w-2xl overflow-y-auto h-full">
      <div>
        <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>Seguridad & Gatekeeper</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Privacy Receptionist, MCP Host y auditoría de acceso de agentes a datos
        </p>
      </div>

      {/* ── Privacy Receptionist ── */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Privacy Receptionist</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Servidor de datos privado — todas las peticiones de agentes pasan por aquí</p>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-600/15 border border-violet-500/25 text-violet-400 shrink-0" style={{ fontWeight: 700 }}>Enterprise</span>
        </div>
        <div className="px-5 py-5 space-y-5">
          {/* Storage provider */}
          <div>
            <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>
              Proveedor de almacenamiento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {([
                { id: "PRIVATE" as const, label: "Servidor Privado", emoji: "🏢" },
                { id: "S3"      as const, label: "Amazon S3",        emoji: "☁️" },
                { id: "GCS"     as const, label: "Google Cloud",     emoji: "🔵" },
              ]).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border transition-all",
                    provider === p.id
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-300"
                      : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border"
                  )}
                >
                  <span style={{ fontSize: "20px" }}>{p.emoji}</span>
                  <span style={{ fontSize: "10px", fontWeight: provider === p.id ? 600 : 400 }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>
              Endpoint URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/35 pointer-events-none" />
              <input
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                className={cn(inputCls, "pl-9")}
                placeholder="https://data.empresa.com/cerebrin-vault"
              />
            </div>
            <p className="text-muted-foreground/30 mt-1.5" style={{ fontSize: "10px" }}>
              Los agentes enviarán todas las peticiones de datos a esta URL. Debe implementar la API de Receptionist.
            </p>
          </div>

          {/* Auth Secret (Vault) */}
          <div>
            <label className="block text-muted-foreground/60 uppercase tracking-widest mb-2" style={{ fontSize: "9px", fontWeight: 600 }}>
              Auth Secret · Vault
            </label>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 border border-border/50">
              <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm" style={{ fontWeight: 500 }}>Gatekeeper API Key</p>
                <p className="font-mono text-muted-foreground/40" style={{ fontSize: 10 }}>
                  gk-secret-xxxxxx{"•".repeat(24)}
                </p>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0" style={{ fontWeight: 700 }}>VAULT</span>
              <button
                className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted shrink-0"
                style={{ fontWeight: 600 }}
                onClick={() => toast.success("Auth Secret actualizado", { description: "El nuevo valor se cifró y almacenó en el Vault." })}
              >
                Actualizar
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSaving(true);
                setTimeout(() => {
                  setSaving(false);
                  toast.success("Privacy Receptionist guardado", { description: `Configuración almacenada · Proveedor: ${provider} · ${endpointUrl}` });
                }, 900);
              }}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/40 transition-all text-xs disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              {saving
                ? <span className="inline-flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />Guardando…</span>
                : <span className="inline-flex items-center gap-1.5"><Save className="w-3.5 h-3.5" />Guardar configuración</span>
              }
            </button>
          </div>
        </div>
      </section>

      {/* ── MCP Host ── */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Plug className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div>
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>MCP Host · Model Context Protocol</p>
              <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Cerebrin como host para agentes externos vía SSE Transport</p>
            </div>
          </div>
          <Switch
            checked={mcpEnabled}
            onCheckedChange={(v) => {
              setMcpEnabled(v);
              if (v) toast.success("MCP Host activado", { description: "Endpoint: /api/mcp · SSE Transport habilitado" });
              else    toast("MCP Host desactivado");
            }}
            className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-switch-background"
          />
        </div>
        <div className="px-5 py-4 space-y-3">
          {[
            { label: "Endpoint SSE",   value: "/api/mcp",                                                  color: "text-indigo-400" },
            { label: "Recursos MCP",   value: "cerebrin://workspace/summary · cerebrin://docs/all",        color: "text-violet-400" },
            { label: "Tools activos",  value: "search_knowledge · record_resonance · check_budget",        color: "text-muted-foreground/60" },
            { label: "Acceso",         value: "Requiere Access Token configurado en este panel",            color: "text-muted-foreground/40" },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-3">
              <span className="text-muted-foreground/40 w-28 shrink-0 pt-0.5" style={{ fontSize: "11px" }}>{row.label}</span>
              <code className={cn("text-xs font-mono leading-relaxed", row.color)}>{row.value}</code>
            </div>
          ))}
          {!mcpEnabled && (
            <div className="flex items-start gap-2 mt-2 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/40">
              <Info className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
              <p className="text-muted-foreground/50 text-xs">
                Activa el MCP Host para que agentes externos (Claude Desktop, GPT-4o Assistants) puedan leer documentos y ejecutar acciones vía RPC sobre tus datos de Cerebrin.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Gatekeeper Access Log ── */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0">
            <Database className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Log de Acceso · Gatekeeper</p>
            <p className="text-muted-foreground" style={{ fontSize: "11px" }}>Historial de solicitudes filtradas — /api/gatekeeper/logs</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(["ALL", "ALLOWED", "BLOCKED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs transition-all border",
                  logFilter === f
                    ? f === "ALLOWED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : f === "BLOCKED" ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-violet-500/10 border-violet-500/20 text-violet-400"
                    : "border-border/40 text-muted-foreground/50 hover:border-border"
                )}
                style={{ fontWeight: logFilter === f ? 700 : 400 }}
              >
                {f === "ALL" ? "Todos" : f}
              </button>
            ))}
            <button
              onClick={() => { setRefreshingLog(true); setTimeout(() => { setRefreshingLog(false); toast.success("Log actualizado", { description: "Datos sincronizados desde /api/gatekeeper/logs" }); }, 900); }}
              disabled={refreshingLog}
              className="p-1.5 rounded-lg border border-border/40 text-muted-foreground/50 hover:text-foreground hover:border-border transition-all disabled:opacity-40"
            >
              <RefreshCw className={cn("w-3 h-3", refreshingLog && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Log rows */}
        <div className="divide-y divide-border/30">
          {filteredLogs.map((log) => {
            const rs = RESULT_STYLE[log.result];
            return (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-muted-foreground/40 font-mono" style={{ fontSize: "9px" }}>{log.id}</code>
                    <span className="text-foreground text-xs" style={{ fontWeight: 600 }}>{log.agent}</span>
                    <span className="text-muted-foreground/40 font-mono text-[10px]">{log.action}</span>
                  </div>
                  <p className="text-muted-foreground/50 font-mono truncate mt-0.5" style={{ fontSize: "10px" }}>{log.resource}</p>
                  <p className="text-muted-foreground/30 mt-0.5" style={{ fontSize: "9px" }}>{log.reason}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md border", rs.bg, rs.border, rs.text)} style={{ fontWeight: 700 }}>
                    {log.result}
                  </span>
                  <span className="text-muted-foreground/30 tabular-nums" style={{ fontSize: "9px" }}>{log.ts}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats footer */}
        <div className="px-5 py-3 border-t border-border/30 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-muted-foreground/40 text-xs">{GATEKEEPER_LOGS.filter(l => l.result === "ALLOWED").length} permitidos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className="text-muted-foreground/40 text-xs">{GATEKEEPER_LOGS.filter(l => l.result === "BLOCKED").length} bloqueados</span>
          </div>
          <span className="ml-auto text-muted-foreground/30 text-xs">
            Tasa de bloqueo: {Math.round((GATEKEEPER_LOGS.filter(l => l.result === "BLOCKED").length / GATEKEEPER_LOGS.length) * 100)}%
          </span>
        </div>
      </section>
    </div>
  );
}

// ─── Settings Nav ─────────────────────────────────────────────────────────────

function SettingsNav({ active, onChange, onBack }: { active: SettingsView; onChange: (v: SettingsView) => void; onBack: () => void }) {
  const { t } = useAppPreferences();
  const { isSettingsTabVisible } = useUserPerspective();

  const NAV_GROUPS = [
    {
      labelKey: "account" as const,
      items: [
        { id: "general" as SettingsView, icon: Settings, labelKey: "general"    as const },
        { id: "profile" as SettingsView, icon: User,     labelKey: "my_profile" as const },
        { id: "perspective" as SettingsView, icon: Eye,  labelKey: "general"    as const, customLabel: "Perspectiva" },
      ],
    },
    {
      labelKey: "organization" as const,
      items: [
        { id: "workspace" as SettingsView, icon: Building2, labelKey: "workspace_team" as const },
        { id: "teams"     as SettingsView, icon: Users,     labelKey: "teams"          as const },
        { id: "plan"      as SettingsView, icon: Sparkles,  labelKey: "plan_addons"    as const },
      ],
    },
    {
      labelKey: "ai_configuration" as const,
      items: [
        { id: "agents"      as SettingsView, icon: Bot,      labelKey: "agent_factory" as const },
        { id: "permissions" as SettingsView, icon: Shield,   labelKey: "permissions"   as const },
        { id: "api"         as SettingsView, icon: Code2,    labelKey: "api_webhooks"  as const },
        { id: "security"    as SettingsView, icon: Server,   labelKey: "general"       as const, customLabel: "Seguridad & Gatekeeper" },
        { id: "vault"       as SettingsView, icon: Key,      labelKey: "general"       as const, customLabel: "Vault BYO-API" },
        { id: "mcp"         as SettingsView, icon: Terminal, labelKey: "general"       as const, customLabel: "MCP Protocol" },
        { id: "features"    as SettingsView, icon: Zap,      labelKey: "general"       as const, customLabel: "Feature Flags" },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border/60 bg-sidebar flex flex-col overflow-y-auto">
      <div className="px-4 py-5 border-b border-border/40">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4 group"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground" />
          <span className="text-sm" style={{ fontWeight: 500 }}>{t("back_to_cockpit")}</span>
        </button>
        <p className="text-foreground text-sm" style={{ fontWeight: 700 }}>{t("settings")}</p>
        <p className="text-muted-foreground/50 mt-0.5" style={{ fontSize: "10px" }}>Cerebrin · v2.1.0</p>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-4">
        {NAV_GROUPS.map((group) => {
          // Filter items by perspective visibility
          const visibleItems = group.items.filter(item => isSettingsTabVisible(item.id as keyof import("../../contexts/UserPerspective").PerspectiveProfile["settings_tabs"]));
          
          // Skip group if no items visible
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.labelKey}>
              <p className="px-3 mb-1.5 text-muted-foreground/40 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 700 }}>
                {t(group.labelKey)}
              </p>
              {visibleItems.map((item) => {
                const isActive = active === item.id;
                const isAI     = group.labelKey === "ai_configuration";
                return (
                  <button key={item.id} onClick={() => onChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 text-left group relative",
                      isActive
                        ? isAI ? "bg-violet-600/10 text-violet-300" : "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}>
                    {/* Active indicator */}
                    {isActive && (
                      <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full",
                        isAI ? "bg-violet-500" : "bg-muted-foreground/60")} />
                    )}
                    <item.icon className={cn("w-3.5 h-3.5 shrink-0",
                      isActive ? (isAI ? "text-violet-400" : "text-foreground") : "text-muted-foreground/50 group-hover:text-muted-foreground"
                    )} />
                    <span style={{ fontSize: "12px", fontWeight: isActive ? 600 : 400 }}>{"customLabel" in item ? (item as { customLabel: string }).customLabel : t(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Danger zone */}
      <div className="p-2 border-t border-border/40">
        <button
          onClick={() => {
            toast("¿Cerrar sesión?", {
              description: "Serás redirigido a la pantalla de inicio de sesión.",
              action: { label: "Confirmar", onClick: () => toast.success("Sesión cerrada") },
            });
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/8 transition-all"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span style={{ fontSize: "12px" }}>{t("sign_out")}</span>
        </button>
      </div>
    </aside>
  );
}

// ─── Settings Hub ─────────────────────────────────────────────────────────────

export function SettingsHub({ initialView = "agents", onBack }: { initialView?: SettingsView; onBack: () => void }) {
  const [activeView, setActiveView] = React.useState<SettingsView>(initialView);

  // Update activeView if initialView changes
  React.useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  return (
    <div className="flex h-full min-h-0 bg-background">
      {/* Settings left nav */}
      <SettingsNav active={activeView} onChange={setActiveView} onBack={onBack} />

      {/* Right content panel */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {activeView === "agents" && (
          <AgentFactoryPanel onCreateClick={() => {}} />
        )}
        {activeView === "permissions" && (
          <div className="h-full flex flex-col overflow-hidden">
            <AgentPermissionsPanel />
          </div>
        )}
        {activeView === "teams" && (
          <div className="h-full flex flex-col overflow-hidden">
            <TeamsPanel />
          </div>
        )}
        {activeView === "api"      && <ApiWebhooksPanel />}
        {activeView === "general"  && <GeneralSettingsPanel />}
        {activeView === "workspace" && <WorkspacePanel />}
        {activeView === "profile"   && <ProfilePanel />}
        {activeView === "perspective" && <PerspectiveSettings />}
        {activeView === "features"    && <FeatureFlagsPanel onBack={() => setActiveView("general")} />}
        {activeView === "plan"      && <PlanAddonPanel />}
        {activeView === "security"  && <GatekeeperPanel />}
        {activeView === "vault"     && <VaultPanel />}
        {activeView === "mcp"       && <MCPPanel />}
      </main>
    </div>
  );
}
