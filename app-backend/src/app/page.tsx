"use client";

import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { supabaseClient } from "@/lib/supabase";
import {
  Brain,
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  ZapOff,
  Radio,
  Plus,
  BarChart3,
  Search,
  LayoutGrid,
  Bell,
  X,
  ChevronRight
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import { format } from "date-fns";
import { DetailType } from "@/components/dashboard/DashboardDetailSheet";
import { IdeaForm } from "@/components/features/IdeaForm";
import { ProjectForm } from "@/components/features/ProjectForm";
import { cn } from "@/lib/utils";
import { useUserPerspective } from "@/context/UserPerspectiveContext";
import { PerspectiveSwitcher } from "@/components/PerspectiveSwitcher";
import { useResponsive } from "@/hooks/useResponsive";
import { Sheet } from "@/components/ui/Sheet";
import { Bot, Send } from "lucide-react";

export default function Home() {
  const { activeWorkspaceId, workspaces, isLoading: isContextLoading } = useWorkspace();
  const { t } = useConfig();
  const { profile, canAccess, isWidgetVisible, canUseFeature } = useUserPerspective();
  const { isMobile } = useResponsive();
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

  const [stats, setStats] = useState({
    ideasCount: 0,
    activeTasksCount: 0,
    upcomingTasks: [] as any[],
    activeProjects: [] as any[],
    recentActivity: [] as any[],
    pendingApprovalsCount: 0,
    agentState: "idle" as "idle" | "thinking" | "working",
    loading: true
  });

  const [detailType, setDetailType] = useState<DetailType | 'approvals'>(null);
  const [activeModal, setActiveModal] = useState<'idea' | 'project' | null>(null);
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t("dashboard.welcome"));
    else if (hour < 20) setGreeting(t("dashboard.welcome"));
    else setGreeting(t("dashboard.welcome"));
  }, [t]);

  useEffect(() => {
    async function fetchStats() {
      if (!activeWorkspaceId) return;

      setStats(prev => ({ ...prev, loading: true }));

      try {
        const [
          ideaRes,
          taskRes,
          upcomingRes,
          projectsRes,
          activityRes,
          approvalsRes
        ] = await Promise.all([
          supabaseClient.from("idea_pipeline").select("*", { count: 'exact', head: true }).eq("workspace_id", activeWorkspaceId).eq("status", "pending"),
          supabaseClient.from("documents").select("*", { count: 'exact', head: true }).eq("workspace_id", activeWorkspaceId).neq("category", "Finalizado").eq("type", "task"),
          supabaseClient.from("documents").select("id, title, due_date, category").eq("workspace_id", activeWorkspaceId).neq("category", "Finalizado").not("due_date", "is", null).order("due_date", { ascending: true }).limit(3),
          supabaseClient.from("documents").select("id, title, category, ai_analysis, status").eq("workspace_id", activeWorkspaceId).contains("tags", ["proyecto"]).neq("category", "Finalizado").limit(3),
          supabaseClient.from("activity_feed").select("id, action_type, description, created_at").eq("workspace_id", activeWorkspaceId).order("created_at", { ascending: false }).limit(5),
          supabaseClient.from("agent_approval_queue").select("*", { count: 'exact', head: true }).eq("workspace_id", activeWorkspaceId).eq("status", "pending")
        ]);

        setStats({
          ideasCount: ideaRes.count || 0,
          activeTasksCount: taskRes.count || 0,
          upcomingTasks: upcomingRes.data || [],
          activeProjects: projectsRes.data || [],
          recentActivity: activityRes.data || [],
          pendingApprovalsCount: approvalsRes.count || 0,
          agentState: "idle",
          loading: false
        });

      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }

    if (!isContextLoading) fetchStats();
  }, [activeWorkspaceId, isContextLoading]);

  // Animation Variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (!activeWorkspaceId && !isContextLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 grid-pattern bg-white dark:bg-slate-950">
        <div className="p-12 text-center animate-fade-in">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <LayoutGrid className="w-10 h-10 text-indigo-500 opacity-60" />
          </div>
          <p className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-2">Select a Workspace</p>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Please select a workspace from the sidebar to begin managing your missions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 p-6 lg:p-12 overflow-y-auto custom-scrollbar">

      {/* Top Navigation / Global Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className={cn(isMobile && "pl-12")}>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {greeting}, <span className="text-indigo-600">{t("dashboard.commander")}.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm md:text-base">Node: {activeWorkspace?.name || "Tactical Operations"}</p>
        </div>

        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar py-2">
          <PerspectiveSwitcher />
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder={isMobile ? "Search..." : "Search missions..."}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-full md:w-64 shadow-sm"
            />
          </div>
          <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-500 transition-all shadow-sm shrink-0">
            <Bell size={20} />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      {(!profile.ui.hide_metrics || profile.mode === 'director') && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10"
        >
          <MetricCard
            icon={<LightbulbIcon />}
            title={t("sidebar.idea_incubator")}
            value={stats.ideasCount}
            trend="+12%"
            color="indigo"
          />
          <MetricCard
            icon={<TargetIcon />}
            title={t("sidebar.project_fleet")}
            value={stats.activeProjects.length}
            trend="Stable"
            color="emerald"
          />
          <MetricCard
            icon={<ZapIcon />}
            title={t("sidebar.operations_pulse")}
            value={stats.activeTasksCount}
            trend="Optimal"
            color="amber"
          />
          <div className="dashboard-card p-6 flex flex-col justify-between bg-indigo-600 border-none dark:bg-indigo-600 group relative overflow-hidden cursor-pointer" onClick={() => setActiveModal('idea')}>
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
            <div className="relative">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white mb-4">
                <Plus size={24} />
              </div>
              <h3 className="text-white font-bold">{t("dashboard.new_input")}</h3>
              <p className="text-indigo-100 text-xs mt-1">{t("dashboard.log_signal")}</p>
            </div>
            <ArrowRight className="text-white self-end group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col: Tactical Focus */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Target size={20} className="text-indigo-500" />
              {t("dashboard.tactical_focus")}
            </h2>
            <Link href="/projects" className="text-xs font-bold text-indigo-500 hover:underline">{t("dashboard.all_intel")}</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.loading ? [1, 2].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />) : (
              stats.activeProjects.map(proj => (
                <div key={proj.id} className="dashboard-card p-8 group overflow-hidden relative">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">TRK_ID: {proj.id.split('-')[0]}</span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1 group-hover:text-indigo-500 transition-colors uppercase">{proj.title}</h3>
                    </div>
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                      {proj.category}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-6 relative overflow-hidden group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                      {proj.ai_analysis || "Awaiting tactical assessment from AI Swarm..."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <button className="text-xs text-indigo-600 font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open Dossier <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Timeline & Activity */}
        <div className="space-y-8">
          {/* Next Up */}
          <div className="dashboard-card p-8">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              {t("dashboard.next_up")}
            </h2>
            <div className="space-y-6">
              {stats.upcomingTasks.map(task => (
                <div key={task.id} className="flex gap-4 group cursor-pointer">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-indigo-500 transition-colors" />
                    <div className="w-px flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold tracking-tighter tabular-nums mb-1">
                      T-MINUS {Math.max(0, Math.floor((new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} DAYS
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 font-medium uppercase mt-1">{task.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Pulse */}
          <div className="dashboard-card p-8 bg-slate-900 dark:bg-slate-900 text-white border-none shadow-xl shadow-indigo-900/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <BarChart3 size={100} />
            </div>
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <Radio size={16} className="text-emerald-500" />
              {t("dashboard.signal_pulse")}
            </h2>
            <div className="space-y-6 relative z-10">
              {stats.recentActivity.map(act => (
                <div key={act.id} className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0 group">
                  <div className="p-1.5 bg-white/5 rounded-lg text-slate-400 group-hover:text-emerald-400 transition-colors">
                    <Zap size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-300 leading-tight mb-1">{act.description}</p>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{format(new Date(act.created_at), "HH:mm:ss")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Detail Overlay */}
      {detailType && (
        <DashboardDetailSheet
          isOpen={!!detailType}
          onClose={() => setDetailType(null)}
          type={detailType === 'approvals' ? 'tasks' : detailType!}
          t={t}
        />
      )}

      {/* Idea Modal */}
      <AnimatePresence>
        {activeModal === 'idea' && (
          <IdeaForm externalOpen={true} onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'project' && (
          <ProjectForm externalOpen={true} onClose={() => setActiveModal(null)} />
        )}
      </AnimatePresence>

      <ShadowChat />
    </div>
  );
}

// --- Shadow Chat Component (Focus Mode Feature) ---
type ChatMessage = { role: 'user' | 'assistant'; content: string; id: string }

function ShadowChat() {
  const { canUseFeature } = useUserPerspective();
  const { activeWorkspaceId } = useWorkspace();
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: isMobile
      ? "Commander, I'm analyzing your mobile session. Focus is optimal. Need a tactical brief?"
      : "Commander, I've analyzed your current focus. Your tactical load is optimal. Need help?",
    id: 'init'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading || !activeWorkspaceId) return;

    const userMsg: ChatMessage = { role: 'user', content: text, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Create a placeholder for the streaming assistant reply
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }]);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const token = session?.access_token;

      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, workspaceId: activeWorkspaceId, history })
      });

      if (!res.ok || !res.body) throw new Error('Error del servidor');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              accumulated += data.chunk;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: accumulated } : m
              ));
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Error al conectar con el agente. Intenta de nuevo.' }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, activeWorkspaceId, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const MessageBubble = ({ msg }: { msg: ChatMessage }) => (
    <div className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed',
        msg.role === 'user'
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm italic'
      )}>
        {msg.content || <span className="opacity-40 animate-pulse">▋</span>}
      </div>
    </div>
  );

  if (!canUseFeature('shadow_chat_enabled')) return null;

  // Mobile: FAB + Bottom Sheet
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-500/40 flex items-center justify-center z-50 active:scale-95 transition-transform"
        >
          <Bot size={28} />
        </button>
        <Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} side="bottom">
          <div className="flex flex-col h-full bg-white dark:bg-slate-950 p-6 pt-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl"><Bot size={24} /></div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Shadow AI</h3>
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Intelligence</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              <div ref={messagesEndRef} />
            </div>
            <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-2">
              <input
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Talk to Shadow..."
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                onClick={sendMessage} disabled={isLoading || !input.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-40"
              >
                {isLoading ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin block" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </Sheet>
      </>
    );
  }

  // Desktop: Sidebar
  return (
    <div className={cn(
      "fixed right-0 top-0 bottom-0 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 transition-all z-40 flex flex-col shadow-2xl",
      isOpen ? "w-80" : "w-0 overflow-hidden border-none"
    )}>
      <div className="p-5 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Shadow AI</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-colors">
          <ChevronRight size={16} className="text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-900 flex gap-2">
        <input
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Summon intelligence..."
          className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        <button
          onClick={sendMessage} disabled={isLoading || !input.trim()}
          className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40"
        >
          {isLoading
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin block" />
            : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}

// --- Internal Components ---

function MetricCard({ icon, title, value, trend, color }: any) {
  const colorStyles: any = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10"
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="dashboard-card p-8 flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn("p-3 rounded-2xl flex items-center justify-center", colorStyles[color])}>
          {icon}
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{trend}</span>
        </div>
      </div>
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
        <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{value}</p>
      </div>
    </motion.div>
  );
}

// Minimal Icons to match SaaS aesthetic
const LightbulbIcon = () => <Brain size={20} />;
const TargetIcon = () => <Target size={20} />;
const ZapIcon = () => <Zap size={20} />;

// Reusable DashboardDetailSheet wrapper (premium side panel)
function DashboardDetailSheet({ isOpen, onClose, type, t }: { isOpen: boolean, onClose: () => void, type: string, t: any }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[90]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 z-[100] shadow-2xl p-10 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                  {type === 'ideas' ? <Brain size={24} /> : type === 'projects' ? <Target size={24} /> : <Zap size={24} />}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                  {type === 'ideas' ? t("ideas.title") : type === 'projects' ? t("projects.title") : "Metrics"}
                </h2>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-2xl transition-all">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
              <div className="space-y-10">
                <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Strategic Analysis</h3>
                  <p className="text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                    Exploration and detailed monitoring of {type} active in the current workspace.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Health</p>
                    <p className="text-2xl font-black text-emerald-500 italic">98%</p>
                  </div>
                  <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Load</p>
                    <p className="text-2xl font-black text-indigo-500 italic">Low</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-10 border-t border-slate-100 dark:border-slate-800">
              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                Export Node Data
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
