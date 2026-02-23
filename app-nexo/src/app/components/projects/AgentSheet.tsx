import { useEffect, useRef, useState } from "react";
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
  Bot,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  Send,
  Terminal,
  User,
  Zap,
} from "lucide-react";
import { cn } from "../ui/utils";
import { format, parseISO } from "date-fns";
import type { Project, SelectedItem, Task, SubTask } from "./types";
import React from "react";

// ─── Log Entry ────────────────────────────────────────────────────────────────

type LogType = "agent" | "human" | "system";

interface LogEntry {
  id: string;
  type: LogType;
  ts: string;
  agent?: string;
  message: string;
}

// ─── Seed logs per task ───────────────────────────────────────────────────────

const SEED_LOGS: LogEntry[] = [
  {
    id: "s1",
    type: "system",
    ts: "08:40:00",
    message: "Task initialized · writer-bot assigned · context loaded",
  },
  {
    id: "s2",
    type: "agent",
    ts: "08:42:11",
    agent: "@writer-bot",
    message: "Fetching project brief and brand assets from knowledge base...",
  },
  {
    id: "s3",
    type: "agent",
    ts: "08:42:18",
    agent: "@writer-bot",
    message: "Loaded: brand-guidelines-v3.pdf (42 pp) · tone-of-voice.md · competitor-analysis.csv",
  },
  {
    id: "s4",
    type: "agent",
    ts: "08:42:35",
    agent: "@writer-bot",
    message: "Draft #1 complete → 847 words · Hero · Features · Pricing · CTA",
  },
  {
    id: "s5",
    type: "human",
    ts: "08:43:01",
    message: "@writer-bot the hero value prop is too generic, rewrite it with a B2B SaaS focus and emphasize time-to-market",
  },
  {
    id: "s6",
    type: "agent",
    ts: "08:43:04",
    agent: "@writer-bot",
    message: "Understood. Rewriting hero · targeting B2B decision-makers · emphasizing ROI and speed-to-market...",
  },
  {
    id: "s7",
    type: "agent",
    ts: "08:43:21",
    agent: "@writer-bot",
    message: "Hero rewrite complete → 142 words · Approval required before proceeding",
  },
  {
    id: "s8",
    type: "system",
    ts: "08:44:22",
    message: "Draft #2 queued for HITL review · 1 approval pending · SLA: 4 h",
  },
  {
    id: "s9",
    type: "human",
    ts: "08:45:10",
    message: "@writer-bot add a pricing comparison table — 3 tiers (Starter / Growth / Enterprise) × 8 feature rows",
  },
  {
    id: "s10",
    type: "agent",
    ts: "08:45:13",
    agent: "@writer-bot",
    message: "Generating pricing comparison table · Starter / Growth / Enterprise...",
  },
  {
    id: "s11",
    type: "agent",
    ts: "08:45:31",
    agent: "@writer-bot",
    message: "Table created → 3 tiers × 8 features · Markdown + HTML variants available",
  },
  {
    id: "s12",
    type: "system",
    ts: "08:46:30",
    message: "Draft #3 queued for HITL review · Awaiting human approval",
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { dot: string; text: string; label: string }> = {
  PENDING:     { dot: "bg-slate-600",       text: "text-slate-500",  label: "Pending" },
  IN_PROGRESS: { dot: "bg-blue-400",        text: "text-blue-400",   label: "In Progress" },
  COMPLETED:   { dot: "bg-emerald-400",     text: "text-emerald-400",label: "Completed" },
  BLOCKED:     { dot: "bg-rose-400",        text: "text-rose-400",   label: "Blocked" },
};

function now(): string {
  return new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Console Log Line ─────────────────────────────────────────────────────────

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

  // agent action
  return (
    <div className="py-0.5 pl-1">
      <div className="flex items-start gap-2">
        <span className="text-slate-700 font-mono text-[10px] shrink-0 mt-px select-none tabular-nums">
          {entry.ts}
        </span>
        <span className="text-violet-400 font-mono text-[10px] shrink-0 mt-px">{entry.agent}</span>
        <span className="text-slate-500 font-mono text-xs leading-relaxed">{entry.message}</span>
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ agent }: { agent: string }) {
  return (
    <div className="py-0.5 pl-1 flex items-center gap-2">
      <Loader2 className="w-3 h-3 text-violet-500 animate-spin shrink-0" />
      <span className="text-violet-400 font-mono text-[10px]">{agent}</span>
      <span className="text-slate-600 font-mono text-xs">processing instruction</span>
      <span className="flex gap-0.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-violet-600/60 animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </span>
    </div>
  );
}

// ─── Metadata Field ───────────────────────────────────────────────────────────

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
        <span className="text-xs text-slate-600 uppercase tracking-widest" style={{ fontSize: "10px" }}>
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

// ─── Agent Sheet ──────────────────────────────────────────────────────────────

interface AgentSheetProps {
  selection: SelectedItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentSheet({ selection, open, onOpenChange }: AgentSheetProps) {
  const { item, project, parentTask } = selection;

  const [logs, setLogs] = useState<LogEntry[]>(SEED_LOGS);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [meta, setMeta] = useState({
    estimated_hours: item.metadata.estimated_hours,
    cost: item.metadata.cost,
    weight: item.metadata.weight,
  });

  const logEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isAgent = item.assignee_type === "AGENT";
  const st = STATUS_STYLES[item.status];

  // Auto-scroll console to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, isProcessing]);

  // Reset logs when selection changes
  useEffect(() => {
    setLogs(SEED_LOGS);
    setInput("");
    setIsProcessing(false);
    setMeta({
      estimated_hours: item.metadata.estimated_hours,
      cost: item.metadata.cost,
      weight: item.metadata.weight,
    });
  }, [item.id]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    const humanEntry: LogEntry = {
      id: Date.now().toString(),
      type: "human",
      ts: now(),
      message: trimmed,
    };

    setLogs((p) => [...p, humanEntry]);
    setInput("");
    setIsProcessing(true);

    // Simulate agent processing
    const delay = 900 + Math.random() * 600;
    setTimeout(() => {
      const agentReply: LogEntry = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        ts: now(),
        agent: isAgent ? "@writer-bot" : "@strategy-bot",
        message: generateAgentReply(trimmed),
      };
      setLogs((p) => [...p, agentReply]);
      setIsProcessing(false);
    }, delay);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden",
          "bg-card border-l border-border",
          "sm:max-w-xl w-full"
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-slate-800/80 pr-14">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-3">
            <BreadcrumbList className="text-[11px]">
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {project.client}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-slate-700">
                <ChevronRight className="w-3 h-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  className="text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {project.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {parentTask && (
                <div className="contents">
                  <BreadcrumbSeparator className="text-slate-700">
                    <ChevronRight className="w-3 h-3" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      href="#"
                      className="text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      {parentTask.title}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </div>
              )}
              <BreadcrumbSeparator className="text-slate-700">
                <ChevronRight className="w-3 h-3" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-slate-400 truncate max-w-[140px]">
                  {item.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Task title */}
          <SheetTitle className="text-slate-100 text-base mb-3 pr-2" style={{ fontWeight: 600 }}>
            {item.title}
          </SheetTitle>

          {/* Task meta badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Assignee */}
            <div className="flex items-center gap-1.5">
              {isAgent ? (
                <Bot className="w-3.5 h-3.5 text-violet-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span
                className={cn(
                  "text-xs",
                  isAgent ? "text-violet-400" : "text-slate-500"
                )}
              >
                {isAgent ? "Agent-assigned" : "Human-assigned"}
              </span>
            </div>

            <span className="text-slate-700">·</span>

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", st.dot)} />
              <span className={cn("text-xs", st.text)}>{st.label}</span>
            </div>

            <span className="text-slate-700">·</span>

            {/* Due date */}
            <span className="text-xs text-slate-600">
              Due {format(parseISO(item.due_date), "MMM d, yyyy")}
            </span>
          </div>
        </div>

        {/* ── Metadata fields ──────────────────────────────────────────────── */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-800/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <MetaField
            icon={Clock}
            label="Est. Hours"
            value={meta.estimated_hours}
            suffix="h"
            onChange={(v) => setMeta((p) => ({ ...p, estimated_hours: v }))}
          />
          <MetaField
            icon={DollarSign}
            label="Cost"
            value={meta.cost}
            prefix="$"
            onChange={(v) => setMeta((p) => ({ ...p, cost: v }))}
          />
          <MetaField
            icon={Zap}
            label="Weight"
            value={meta.weight}
            suffix="%"
            onChange={(v) => setMeta((p) => ({ ...p, weight: v }))}
          />
        </div>

        {/* ── Instruction Console ───────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 flex flex-col" style={{ background: "#090E17" }}>
          {/* Console header */}
          <div className="shrink-0 flex items-center gap-2.5 px-5 py-3 border-b border-slate-800/60">
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            <span
              className="text-slate-600 font-mono uppercase tracking-widest"
              style={{ fontSize: "10px" }}
            >
              Instruction Console
            </span>
            <div className="flex-1" />
            {/* Traffic-light dots — purely decorative, terminal aesthetic */}
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>
          </div>

          {/* Log area */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-0.5">
            {logs.map((entry) => (
              <LogLine key={entry.id} entry={entry} />
            ))}
            {isProcessing && (
              <TypingIndicator agent={isAgent ? "@writer-bot" : "@strategy-bot"} />
            )}
            <div ref={logEndRef} />
          </div>

          {/* Input bar */}
          <div
            className="shrink-0 border-t border-slate-800/60 px-5 py-3"
            style={{ background: "#0A1020" }}
          >
            <div className="flex items-end gap-3">
              {/* Prompt symbol */}
              <span className="text-emerald-500 font-mono text-sm mb-2.5 shrink-0 select-none">
                &gt;
              </span>

              {/* Input */}
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
                placeholder="@writer-bot instruct the agent… (Enter to send, Shift+Enter for new line)"
                disabled={isProcessing}
                className={cn(
                  "flex-1 bg-transparent resize-none outline-none font-mono text-xs",
                  "text-slate-300 placeholder:text-slate-700",
                  "leading-relaxed"
                )}
              />

              {/* Send button */}
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

            {/* Hint */}
            <p className="text-slate-800 font-mono text-[10px] mt-1.5 ml-5">
              ↵ send · shift+↵ newline · @mention an agent to target
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Simulated agent reply generator ─────────────────────────────────────────

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
  return "Processing instruction · analyzing context and generating output...";
}