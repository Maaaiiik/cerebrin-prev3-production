import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "../ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Bot,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  FolderKanban,
  HardDrive,
  Link2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  Trash2,
  TrendingUp,
  User,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { useAppPreferences } from "../../contexts/AppPreferences";
import { RichTextEditor } from "./RichTextEditor";
import { ConfirmActionDialog } from "./ConfirmActionDialog";
import { useSwipeGestures } from "../../hooks/useSwipeGestures";

// ─── Public Entity Type ───────────────────────────────────────────────────────

export interface UniversalEntity {
  id: string;
  correlativeId?: string;
  title: string;
  description?: string;
  entityType: "TASK" | "IDEA" | "PROJECT" | "SUBTASK" | "APPROVAL";
  assignee_type?: "HUMAN" | "AGENT";
  status?: string;
  due_date?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  agent?: string;
  /** Array of ancestor labels for the breadcrumb path */
  breadcrumb: Array<{ label: string }>;
  metadata?: {
    estimated_hours?: number;
    cost?: number;
    weight?: number;
  };
}

export interface UniversalSheetProps {
  entity: UniversalEntity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Related Link type ────────────────────────────────────────────────────────

interface RelatedLink {
  id: string;
  url: string;
  label: string;
  type: "drive" | "notion" | "other";
}

const MOCK_LINKS: RelatedLink[] = [
  {
    id: "l1",
    url: "https://drive.google.com/file/d/abc123",
    label: "Q1 Brief — Final v3.pdf",
    type: "drive",
  },
];

// ─── Console log types ────────────────────────────────────────────────────────

type LogType = "agent" | "human" | "system";

interface LogEntry {
  id: string;
  type: LogType;
  ts: string;
  agent?: string;
  message: string;
}

const SEED_LOGS: LogEntry[] = [
  { id: "s1", type: "system", ts: "08:40:00", message: "Task initialized · agent assigned · context loaded" },
  { id: "s2", type: "agent",  ts: "08:42:11", agent: "@writer-bot",   message: "Fetching project brief and brand assets from knowledge base..." },
  { id: "s3", type: "agent",  ts: "08:42:18", agent: "@writer-bot",   message: "Loaded: brand-guidelines-v3.pdf · tone-of-voice.md · competitor-analysis.csv" },
  { id: "s4", type: "agent",  ts: "08:42:35", agent: "@writer-bot",   message: "Draft #1 complete → 847 words · Hero · Features · Pricing · CTA" },
  { id: "s5", type: "human",  ts: "08:43:01", message: "@writer-bot the hero value prop is too generic, rewrite with B2B SaaS focus and emphasize time-to-market" },
  { id: "s6", type: "agent",  ts: "08:43:04", agent: "@writer-bot",   message: "Understood. Rewriting hero · targeting B2B decision-makers · emphasizing ROI..." },
  { id: "s7", type: "agent",  ts: "08:43:21", agent: "@writer-bot",   message: "Hero rewrite complete → 142 words · Approval required before proceeding" },
  { id: "s8", type: "system", ts: "08:44:22", message: "Draft #2 queued for HITL review · 1 approval pending · SLA: 4 h" },
];

function now(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function generateAgentReply(instruction: string): string {
  const lower = instruction.toLowerCase();
  if (lower.includes("rewrite") || lower.includes("revise"))
    return "Rewriting content based on your instruction · new draft queued for review";
  if (lower.includes("add") || lower.includes("include"))
    return "Adding requested section · integrating into existing structure...";
  if (lower.includes("remove") || lower.includes("delete"))
    return "Removing specified section · updating document structure...";
  if (lower.includes("shorten") || lower.includes("condense"))
    return "Condensing content · targeting 40% word reduction while preserving key messaging...";
  if (lower.includes("translate"))
    return "Initiating translation pipeline · loading language model...";
  if (lower.includes("format") || lower.includes("style"))
    return "Applying formatting rules · running style guide compliance check...";
  if (lower.includes("analyze") || lower.includes("analyse"))
    return "Running analysis · processing data against strategic objectives...";
  if (lower.includes("promote") || lower.includes("project"))
    return "Generating project scaffold · extracting key milestones from idea brief...";
  return "Processing instruction · analyzing context and generating output...";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LogLine({ entry }: { entry: LogEntry }) {
  if (entry.type === "system") {
    return (
      <div className="flex items-center gap-3 py-1.5 select-none">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-slate-700 font-mono text-[10px] shrink-0 tracking-wider uppercase">
          {entry.ts} · {entry.message}
        </span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>
    );
  }
  if (entry.type === "human") {
    return (
      <div className="py-1 pl-1">
        <div className="flex items-start gap-2">
          <span className="text-emerald-500 font-mono text-xs shrink-0 mt-px select-none">›</span>
          <div>
            <span className="text-slate-700 font-mono text-[10px] mr-2 select-none">{entry.ts}</span>
            <span className="text-emerald-300 font-mono text-xs">{entry.message}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="py-0.5 pl-1">
      <div className="flex items-start gap-2">
        <span className="text-slate-700 font-mono text-[10px] shrink-0 mt-px select-none tabular-nums">{entry.ts}</span>
        <span className="text-violet-400 font-mono text-[10px] shrink-0 mt-px">{entry.agent}</span>
        <span className="text-slate-500 font-mono text-xs leading-relaxed">{entry.message}</span>
      </div>
    </div>
  );
}

function TypingIndicator({ agent }: { agent: string }) {
  return (
    <div className="py-0.5 pl-1 flex items-center gap-2">
      <Loader2 className="w-3 h-3 text-violet-500 animate-spin shrink-0" />
      <span className="text-violet-400 font-mono text-[10px]">{agent}</span>
      <span className="text-slate-600 font-mono text-xs">processing instruction</span>
      <span className="flex gap-0.5 items-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1 h-1 rounded-full bg-violet-600/60 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </span>
    </div>
  );
}

function LinkTypeIcon({ type }: { type: RelatedLink["type"] }) {
  if (type === "drive") return <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  if (type === "notion") return <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  return <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
}

function StatusBadge({ status, entityType }: { status?: string; entityType: UniversalEntity["entityType"] }) {
  if (!status) return null;

  const map: Record<string, { bg: string; text: string; label: string }> = {
    PENDING:     { bg: "bg-muted",             text: "text-muted-foreground", label: "Pending" },
    IN_PROGRESS: { bg: "bg-blue-500/15",       text: "text-blue-400",         label: "In Progress" },
    COMPLETED:   { bg: "bg-emerald-500/15",    text: "text-emerald-400",      label: "Completed" },
    BLOCKED:     { bg: "bg-rose-500/15",       text: "text-rose-400",         label: "Blocked" },
    HIGH:        { bg: "bg-rose-500/15",       text: "text-rose-400",         label: "High Priority" },
    MEDIUM:      { bg: "bg-amber-500/15",      text: "text-amber-400",        label: "Medium Priority" },
    LOW:         { bg: "bg-muted",             text: "text-muted-foreground", label: "Low Priority" },
    drafts:      { bg: "bg-muted",             text: "text-muted-foreground", label: "Draft" },
    analyzing:   { bg: "bg-violet-500/15",     text: "text-violet-400",       label: "AI Analyzing" },
    ready:       { bg: "bg-blue-500/15",       text: "text-blue-400",         label: "Ready to Promote" },
  };

  const cfg = map[status] ?? { bg: "bg-muted", text: "text-muted-foreground", label: status };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs", cfg.bg, cfg.text)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      {cfg.label}
    </span>
  );
}

// ─── MetaField ────────────────────────────────────────────────────────────────

function MetaField({
  icon: Icon,
  label,
  value,
  prefix,
  suffix,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-slate-600" />
        <span className="text-[10px] text-slate-600 uppercase tracking-widest" style={{ fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 focus-within:border-violet-500/50 transition-colors">
        {prefix && <span className="text-slate-600 text-xs shrink-0">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent text-slate-200 text-sm outline-none min-w-0 tabular-nums"
          style={{ fontWeight: 600 }}
        />
        {suffix && <span className="text-slate-600 text-xs shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function UniversalTaskSheet({ entity, open, onOpenChange }: UniversalSheetProps) {
  const { t } = useAppPreferences();

  // ── Console state
  const [logs, setLogs] = useState<LogEntry[]>(SEED_LOGS);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Description state
  const [description, setDescription] = useState("");

  // ── Related links state
  const [links, setLinks] = useState<RelatedLink[]>(MOCK_LINKS);
  const [linkInput, setLinkInput] = useState("");

  // ── Metadata state
  const [meta, setMeta] = useState({ estimated_hours: 0, cost: 0, weight: 0 });

  // ── Title editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── Swipe to close gesture
  const sheetContentRef = useRef<HTMLDivElement>(null);
  const swipeState = useSwipeGestures(sheetContentRef, {
    onSwipeDown: () => {
      if (open && swipeState.distance > 100) {
        onOpenChange(false);
      }
    },
    minSwipeDistance: 80,
  });

  // ── Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "delete" | "convert" | "promote";
  }>({ open: false, action: "delete" });

  const openConfirm = (action: "delete" | "convert" | "promote") => {
    setConfirmDialog({ open: true, action });
  };

  const closeConfirm = () => setConfirmDialog((p) => ({ ...p, open: false }));

  // Reset all state when entity changes
  useEffect(() => {
    if (!entity) return;
    setLogs(SEED_LOGS);
    setInput("");
    setIsProcessing(false);
    setLinks(MOCK_LINKS);
    setLinkInput("");
    setIsEditingTitle(false);
    setEditedTitle(entity.title);
    setMeta({
      estimated_hours: entity.metadata?.estimated_hours ?? 4,
      cost: entity.metadata?.cost ?? 0,
      weight: entity.metadata?.weight ?? 50,
    });
    // Set mock description based on entity type
    setDescription(
      entity.description ??
        (entity.entityType === "IDEA"
          ? "This idea was surfaced by the Strategy AI from market signals and internal data. Review the analysis scores and decide whether to promote it to a Project."
          : "This task was generated by an AI agent and is pending human review. Add notes, context, or instructions to guide the agent's next actions.")
    );
  }, [entity?.id]);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle) {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isEditingTitle]);

  // Auto-scroll console
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, isProcessing]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    setLogs((p) => [...p, { id: Date.now().toString(), type: "human", ts: now(), message: trimmed }]);
    setInput("");
    setIsProcessing(true);
    const agent = entity?.assignee_type === "AGENT" ? (entity?.agent ?? "@writer-bot") : "@strategy-bot";
    setTimeout(() => {
      setLogs((p) => [
        ...p,
        { id: (Date.now() + 1).toString(), type: "agent", ts: now(), agent, message: generateAgentReply(trimmed) },
      ]);
      setIsProcessing(false);
    }, 900 + Math.random() * 600);
  };

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    const type: RelatedLink["type"] = url.includes("drive.google") ? "drive" : url.includes("notion") ? "notion" : "other";
    const label = type === "drive" ? "Google Drive Document" : type === "notion" ? "Notion Page" : "External Link";
    setLinks((prev) => [...prev, { id: Date.now().toString(), url, label, type }]);
    setLinkInput("");
  };

  const removeLink = (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id));

  if (!entity) return null;

  const isAgent = entity.assignee_type === "AGENT";
  const agentName = entity.agent ?? (isAgent ? "@writer-bot" : "@strategy-bot");

  // Entity type icon
  const EntityTypeIcon =
    entity.entityType === "IDEA" ? Sparkles
    : entity.entityType === "PROJECT" ? FolderKanban
    : entity.entityType === "APPROVAL" ? Zap
    : FileText;

  // Color
  const entityTypeColor =
    entity.entityType === "IDEA" ? "text-amber-400"
    : entity.entityType === "PROJECT" ? "text-blue-400"
    : entity.entityType === "APPROVAL" ? "text-violet-400"
    : "text-slate-400";

  // ── Dropdown action handlers
  const handleEditDetails = () => setIsEditingTitle(true);

  const handleAddToTasks = () => {
    toast.success("Agregado a Mis Tareas", {
      description: `"${editedTitle || entity.title}" aparecerá en My Tasks`,
    });
  };

  const handleConvertToIdea = () => {
    openConfirm("convert");
  };

  const handlePromoteToProject = () => {
    openConfirm("promote");
  };

  const handleDelete = () => {
    openConfirm("delete");
  };

  // ── Execute confirmed action
  const executeConfirm = () => {
    const titleUsed = editedTitle || entity.title;
    const id = entity.correlativeId ?? entity.id;
    closeConfirm();

    if (confirmDialog.action === "delete") {
      onOpenChange(false);
      toast.error("Eliminado", {
        description: (
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] opacity-60">{id}</span>
            <span className="truncate max-w-[140px]">{titleUsed}</span>
          </span>
        ),
        action: {
          label: "Deshacer",
          onClick: () => {
            toast("Eliminación revertida", {
              description: `"${titleUsed}" restaurado`,
              icon: <RotateCcw className="w-3.5 h-3.5" />,
            });
          },
        },
        duration: 6000,
      });
    } else if (confirmDialog.action === "convert") {
      toast("Convertido a Idea", {
        description: (
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] opacity-60">{id}</span>
            <span className="truncate max-w-[140px] text-muted-foreground">{titleUsed} → Incubadora</span>
          </span>
        ),
        icon: "✨",
        action: {
          label: "Deshacer",
          onClick: () => toast("Conversión revertida", { icon: <RotateCcw className="w-3.5 h-3.5" /> }),
        },
        duration: 6000,
      });
    } else if (confirmDialog.action === "promote") {
      toast("Promovido a Proyecto", {
        description: (
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] opacity-60">{id}</span>
            <span className="truncate max-w-[140px] text-muted-foreground">El agente generará el scaffold</span>
          </span>
        ),
        icon: "🚀",
        action: {
          label: "Deshacer",
          onClick: () => toast("Promoción revertida", { icon: <RotateCcw className="w-3.5 h-3.5" /> }),
        },
        duration: 6000,
      });
    }
  };

  return (
    <div>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={sheetContentRef}
        side="right"
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden",
          "bg-card border-l border-border",
          "sm:max-w-2xl w-full",
          swipeState.isSwiping && swipeState.direction === "down" && "transition-transform duration-100"
        )}
        style={{
          transform: swipeState.isSwiping && swipeState.direction === "down" 
            ? `translateY(${Math.min(swipeState.distance, 200)}px)` 
            : undefined,
          opacity: swipeState.isSwiping && swipeState.direction === "down"
            ? Math.max(0.5, 1 - swipeState.distance / 300)
            : undefined,
        }}
      >
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* AREA A — Human Context (fills remaining height, scrollable)       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

          {/* ── Fixed header (not scrollable) */}
          <div className="shrink-0 px-6 pt-5 pb-4 border-b border-border/60 pr-16">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-3">
              <BreadcrumbList className="text-[11px]">
                {entity.breadcrumb.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <BreadcrumbSeparator className="text-muted-foreground/30">
                        <ChevronRight className="w-3 h-3" />
                      </BreadcrumbSeparator>
                    )}
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                        {crumb.label}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </span>
                ))}
                <BreadcrumbSeparator className="text-muted-foreground/30">
                  <ChevronRight className="w-3 h-3" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-muted-foreground/80 truncate max-w-[160px]">
                    {entity.title}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Title row + [...] menu */}
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center mt-0.5">
                <EntityTypeIcon className={cn("w-4 h-4", entityTypeColor)} />
              </div>

              <div className="flex-1 min-w-0">
                {/* ── Entity type chip + correlative ID */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px]",
                    entity.entityType === "IDEA" ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                    : entity.entityType === "PROJECT" ? "bg-violet-500/10 border-violet-500/25 text-violet-400"
                    : entity.entityType === "SUBTASK" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-blue-500/10 border-blue-500/25 text-blue-400"
                  )}>
                    <span style={{ fontWeight: 600 }}>
                      {entity.entityType === "IDEA" ? "Idea"
                      : entity.entityType === "PROJECT" ? "Proyecto"
                      : entity.entityType === "SUBTASK" ? "Subtarea"
                      : entity.entityType === "APPROVAL" ? "Aprobación"
                      : "Tarea"}
                    </span>
                    {entity.correlativeId && (
                      <span className="font-mono opacity-70">{entity.correlativeId}</span>
                    )}
                  </span>
                </div>

                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setIsEditingTitle(false);
                      if (e.key === "Escape") { setEditedTitle(entity.title); setIsEditingTitle(false); }
                    }}
                    className="w-full bg-muted border border-violet-500/50 rounded-lg px-2 py-1 text-foreground text-base outline-none"
                    style={{ fontWeight: 700 }}
                  />
                ) : (
                  <SheetTitle
                    className="text-foreground text-base pr-2 leading-snug cursor-pointer hover:text-foreground/80 transition-colors"
                    style={{ fontWeight: 700 }}
                    onClick={() => setIsEditingTitle(true)}
                    title="Clic para editar título"
                  >
                    {editedTitle || entity.title}
                  </SheetTitle>
                )}

                {/* Meta badges row */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {/* Assignee */}
                  <div className="flex items-center gap-1.5">
                    {isAgent ? (
                      <Bot className="w-3.5 h-3.5 text-violet-400" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className={cn("text-xs", isAgent ? "text-violet-400" : "text-muted-foreground")}>
                      {isAgent ? agentName : "Human"}
                    </span>
                  </div>

                  {entity.status && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-muted-foreground/30 text-xs">·</span>
                      <StatusBadge status={entity.status} entityType={entity.entityType} />
                    </span>
                  )}

                  {entity.due_date && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-muted-foreground/30 text-xs">·</span>
                      <span className="text-xs text-muted-foreground">Due {entity.due_date}</span>
                    </span>
                  )}

                  {entity.priority && (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-muted-foreground/30 text-xs">·</span>
                      <StatusBadge status={entity.priority} entityType={entity.entityType} />
                    </span>
                  )}
                </div>
              </div>

              {/* [...] dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="shrink-0 w-8 h-8 rounded-xl border border-border bg-muted hover:bg-accent hover:border-muted-foreground/30 flex items-center justify-center transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-popover border border-border shadow-xl rounded-xl p-1">
                  <DropdownMenuItem
                    onClick={handleEditDetails}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    {t("sheet_edit_details")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleAddToTasks}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-blue-400">{t("sheet_add_to_tasks")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-border" />
                  <DropdownMenuItem
                    onClick={handleConvertToIdea}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400">{t("sheet_convert_idea")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handlePromoteToProject}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{t("sheet_promote_project")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-border" />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* ── Scrollable Area A content */}
          <div className="flex-1 overflow-y-auto min-h-0">

            {/* Metadata fields — only when metadata is available */}
            {entity.metadata && (entity.metadata.estimated_hours || entity.metadata.cost || entity.metadata.weight) && (
              <div className="px-6 py-4 border-b border-border/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <MetaField
                  icon={Clock}
                  label={t("sheet_est_hours")}
                  value={meta.estimated_hours}
                  suffix="h"
                  onChange={(v) => setMeta((p) => ({ ...p, estimated_hours: v }))}
                />
                <MetaField
                  icon={DollarSign}
                  label={t("sheet_cost")}
                  value={meta.cost}
                  prefix="$"
                  onChange={(v) => setMeta((p) => ({ ...p, cost: v }))}
                />
                <MetaField
                  icon={Zap}
                  label={t("sheet_weight")}
                  value={meta.weight}
                  suffix="%"
                  onChange={(v) => setMeta((p) => ({ ...p, weight: v }))}
                />
              </div>
            )}

            {/* Description */}
            <div className="px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  {t("sheet_description")}
                </span>
              </div>
              <RichTextEditor
                initialContent={description ? `<p>${description}</p>` : ""}
                placeholder={t("sheet_no_description")}
                onChange={(html) => setDescription(html)}
              />
            </div>

            {/* Related Links */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider" style={{ fontWeight: 600 }}>
                  {t("sheet_related_links")}
                </span>
                <span className="text-xs text-muted-foreground/30">{links.length}</span>
              </div>

              {/* Existing links */}
              <div className="space-y-2 mb-3">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/50 border border-border/50 hover:border-border hover:bg-muted transition-all"
                  >
                    <LinkTypeIcon type={link.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate" style={{ fontWeight: 500 }}>{link.label}</p>
                      <p className="text-[10px] text-muted-foreground/50 truncate">{link.url}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                      <button
                        onClick={() => removeLink(link.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-destructive/10 transition-colors text-muted-foreground/50 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add link input */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-dashed border-border/60 hover:border-border focus-within:border-violet-500/40 transition-colors">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                    placeholder={t("sheet_paste_link")}
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 outline-none"
                  />
                </div>
                <button
                  onClick={addLink}
                  disabled={!linkInput.trim()}
                  className={cn(
                    "shrink-0 px-3 py-2 rounded-xl text-xs border transition-colors",
                    linkInput.trim()
                      ? "bg-violet-600/20 border-violet-500/30 text-violet-400 hover:bg-violet-600/30"
                      : "bg-muted border-border text-muted-foreground/30 cursor-not-allowed"
                  )}
                >
                  {t("sheet_add_link")}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* AREA B — Agent Console (fixed 260 px, never overlaps AREA A)      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div
          className="flex flex-col border-t border-slate-800/80 shrink-0"
          style={{ height: 260, background: "#090E17" }}
        >
          {/* Console header */}
          <div className="shrink-0 flex items-center gap-2.5 px-5 py-3 border-b border-slate-800/60">
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-600 font-mono uppercase tracking-widest" style={{ fontSize: "10px" }}>
              {t("sheet_agent_console")}
            </span>
            {isAgent && (
              <span className="text-violet-500/60 font-mono text-[10px] ml-1">
                · {agentName}
              </span>
            )}
            <div className="flex-1" />
            {/* HITL indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500/70 font-mono text-[10px]">HITL</span>
            </div>
            {/* Traffic-light dots */}
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>
          </div>

          {/* Log area */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-0.5 min-h-0">
            {logs.map((entry) => (
              <LogLine key={entry.id} entry={entry} />
            ))}
            {isProcessing && <TypingIndicator agent={agentName} />}
            <div ref={logEndRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 border-t border-slate-800/60 px-5 py-3" style={{ background: "#0A1020" }}>
            <div className="flex items-end gap-3">
              <span className="text-emerald-500 font-mono text-sm mb-2.5 shrink-0 select-none">&gt;</span>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                rows={2}
                placeholder={`${agentName} instruct the agent… (Enter to send, Shift+Enter for newline)`}
                disabled={isProcessing}
                className="flex-1 bg-transparent resize-none outline-none font-mono text-xs text-slate-300 placeholder:text-slate-700 leading-relaxed"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isProcessing}
                className={cn(
                  "shrink-0 mb-1 p-2 rounded-xl transition-all duration-150",
                  input.trim() && !isProcessing
                    ? "bg-violet-600 text-white hover:bg-violet-500"
                    : "bg-slate-800 text-slate-600 cursor-not-allowed"
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-slate-800 font-mono text-[10px] mt-1.5 ml-5">
              ↵ send · shift+↵ newline · @mention an agent to target
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* ── Confirmation dialogs (rendered outside Sheet to avoid z-index issues) */}
    <ConfirmActionDialog
      open={confirmDialog.open}
      onOpenChange={closeConfirm}
      onConfirm={executeConfirm}
      variant={
        confirmDialog.action === "delete" ? "destructive"
        : confirmDialog.action === "promote" ? "promote"
        : "convert"
      }
      title={
        confirmDialog.action === "delete" ? "¿Eliminar este elemento?"
        : confirmDialog.action === "promote" ? "¿Promover a Proyecto?"
        : "¿Convertir a Idea?"
      }
      description={
        confirmDialog.action === "delete"
          ? "Esta acción eliminará el elemento permanentemente. Tendrás 6 segundos para deshacer."
          : confirmDialog.action === "promote"
          ? "El agente generará un scaffold de proyecto basado en esta idea. Esta acción modifica el tipo de entidad."
          : "El elemento será movido a la Incubadora como una Idea. Se puede revertir con Deshacer."
      }
      confirmLabel={
        confirmDialog.action === "delete" ? "Eliminar"
        : confirmDialog.action === "promote" ? "Promover"
        : "Convertir"
      }
      entityId={entity.correlativeId}
      entityTitle={editedTitle || entity.title}
    />
    </div>
  );
}