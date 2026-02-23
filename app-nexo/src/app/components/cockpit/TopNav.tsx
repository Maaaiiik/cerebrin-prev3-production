import * as React from "react";
import {
  AlertCircle,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  FileOutput,
  FileText,
  FolderKanban,
  Globe,
  LayoutTemplate,
  LifeBuoy,
  Lightbulb,
  ListTodo,
  Monitor,
  Moon,
  Rocket,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Sun,
  User,
  Bot,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  X,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAppPreferences, type Theme, type Language } from "../../contexts/AppPreferences";
import { cn } from "../ui/utils";
import type { SettingsView } from "../settings/SettingsHub";
import { toast } from "sonner";
import { subscribeToNotifications, type NotificationEvent } from "../../services/api";
import { NotificationsPanel } from "./NotificationsPanel";
import { PerspectiveSwitcher } from "../shared/PerspectiveSwitcher";
import { useResponsive } from "../../hooks/useResponsive";
import { useFocusMode } from "../../contexts/UserPerspective";

// ─── Types ─────────────────────────────────────────────────────────────────────

type NotifSeverity = "critical" | "warning" | "info" | "success";
type NotifTag = "ADMIN" | "HITL" | "AGENT";

interface Notif {
  id: number;
  text: string;
  detail?: string;
  time: string;
  unread: boolean;
  section: string;
  navView?: SettingsView;
  icon: React.ElementType;
  iconColor: string;
  severity: NotifSeverity;
  tag?: NotifTag;
}

// ─── Static seed data ──────────────────────────────────────────────────────────
// NOTE: Replace with live feed from /api/notifications/stream (SSE/WebSocket).
// Shape: { id, type, severity, text, detail, section, timestamp, read, workspaceId }

const SEED_NOTIFICATIONS: Notif[] = [
  {
    id: 10,
    text: "Ticket crítico: dev-bot batch failure",
    detail: "Stark Industries · T-1007",
    time: "8m ago",
    unread: true,
    section: "admin",
    icon: LifeBuoy,
    iconColor: "text-red-400",
    severity: "critical",
    tag: "ADMIN",
  },
  {
    id: 11,
    text: "Churn alert: Nexora Systems inactivo 2 sem.",
    detail: "Salud → Churned · NPS 3/10",
    time: "1h ago",
    unread: true,
    section: "admin",
    icon: TrendingDown,
    iconColor: "text-orange-400",
    severity: "critical",
    tag: "ADMIN",
  },
  {
    id: 1,
    text: "writer-bot completó 3 tareas",
    detail: "Batch: Q1 Content Calendar",
    time: "2m ago",
    unread: true,
    section: "tasks",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
    severity: "success",
    tag: "AGENT",
  },
  {
    id: 2,
    text: "Platform 3.0 está en riesgo",
    detail: "2 blockers sin resolver",
    time: "15m ago",
    unread: true,
    section: "projects",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    severity: "warning",
  },
  {
    id: 3,
    text: "analyst-bot solicita aprobación HITL",
    detail: "Revisar análisis de mercado",
    time: "1h ago",
    unread: false,
    section: "cockpit",
    icon: Bot,
    iconColor: "text-violet-400",
    severity: "info",
    tag: "HITL",
  },
];

// SSE events are now consumed via subscribeToNotifications() from api.ts

// ─── Config ────────────────────────────────────────────────────────────────────

interface TopNavProps {
  onOpenCommand: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onNavigate: (section: string, view?: SettingsView) => void;
  activeSection?: string;
}

// ─── Section metadata for breadcrumb ─────────────────────────────────────────

const SECTION_META: Record<string, { labelKey: string; icon: React.ElementType; color: string }> = {
  cockpit:     { labelKey: "nav_cockpit",    icon: Rocket,        color: "text-violet-400" },
  tasks:       { labelKey: "nav_tasks",      icon: ListTodo,      color: "text-blue-400"   },
  projects:    { labelKey: "nav_projects",   icon: FolderKanban,  color: "text-indigo-400" },
  incubadora:  { labelKey: "nav_incubadora", icon: Lightbulb,     color: "text-amber-400"  },
  studio:      { labelKey: "nav_studio",     icon: FileOutput,    color: "text-emerald-400"},
  documents:   { labelKey: "documents",      icon: FileText,      color: "text-cyan-400"   },
  marketplace: { labelKey: "marketplace",    icon: ShoppingBag,   color: "text-pink-400"   },
  modals:      { labelKey: "nav_modals",     icon: LayoutTemplate,color: "text-slate-400"  },
  settings:    { labelKey: "nav_settings",   icon: Sparkles,      color: "text-violet-400" },
  admin:       { labelKey: "nexo_admin",     icon: Shield,        color: "text-violet-400" },
};

// Fixed labels for keys not in translations
const FIXED_LABELS: Record<string, string> = {
  documents:   "Documentos",
  marketplace: "Marketplace",
  nexo_admin:  "NEXO Admin Center",
};

const THEME_OPTIONS: { value: Theme; icon: React.ElementType; desc: string }[] = [
  { value: "light",  icon: Sun,     desc: "Always light" },
  { value: "dark",   icon: Moon,    desc: "Always dark"  },
  { value: "system", icon: Monitor, desc: "Follow OS"    },
];

const LANG_OPTIONS: { value: Language; native: string; flag: string }[] = [
  { value: "en", native: "English", flag: "🇺🇸" },
  { value: "es", native: "Español", flag: "🇪🇸" },
];

// ─── Tag pill ──────────────────────────────────────────────────────────────────

function TagPill({ tag }: { tag: NotifTag }) {
  const styles: Record<NotifTag, string> = {
    ADMIN: "bg-violet-500/15 text-violet-400 border-violet-500/25",
    HITL:  "bg-blue-500/15 text-blue-400 border-blue-500/25",
    AGENT: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  };
  const icons: Record<NotifTag, React.ReactNode> = {
    ADMIN: <Shield className="w-2 h-2" />,
    HITL:  <Zap className="w-2 h-2" />,
    AGENT: <Bot className="w-2 h-2" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border", styles[tag])} style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.04em" }}>
      {icons[tag]}
      {tag}
    </span>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────────

const utilBtn =
  "relative w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-all duration-150";

const menuCls = "bg-popover border-border text-popover-foreground shadow-2xl shadow-black/30";

// ─── Component ─────────────────────────────────────────────────────────────────

export function TopNav({ onOpenCommand, onNavigate, activeSection = "cockpit" }: TopNavProps) {
  const { theme, setTheme, resolvedTheme, language, setLanguage, t } = useAppPreferences();

  // ── Notification state ────────────────────────────────────────────────────
  const [notifs, setNotifs] = React.useState<Notif[]>(SEED_NOTIFICATIONS);
  const [bellOpen, setBellOpen] = React.useState(false);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [liveNotifications, setLiveNotifications] = React.useState<NotificationEvent[]>([]);

  // Stable ref so the push useEffect doesn't need onNavigate in deps
  const onNavigateRef = React.useRef(onNavigate);
  React.useEffect(() => { onNavigateRef.current = onNavigate; }, [onNavigate]);

  // ── SSE subscription (real or mock via api.ts) ────────────────────────────
  React.useEffect(() => {
    let nextId = 100;
    const unsubscribe = subscribeToNotifications((event: NotificationEvent) => {
      // Add to live notifications for NotificationsPanel
      setLiveNotifications((prev) => [{ ...event, read: false }, ...prev]);

      const iconMap: Record<NotificationEvent["type"], React.ElementType> = {
        agent_alert:      Bot,
        hitl_request:     Zap,
        ticket_update:    LifeBuoy,
        capacity_warning: AlertTriangle,
        payment_fail:     AlertCircle,
      };
      const colorMap: Record<NotificationEvent["severity"], string> = {
        critical: "text-red-400",
        warning:  "text-amber-400",
        info:     "text-blue-400",
      };
      const newNotif: Notif = {
        id: nextId++,
        text: event.title,
        detail: event.body,
        time: "ahora",
        unread: true,
        section: event.type === "hitl_request" ? "cockpit" : "admin",
        icon: iconMap[event.type] ?? Bell,
        iconColor: colorMap[event.severity] ?? "text-slate-400",
        severity: event.severity === "info" ? "info" : event.severity === "warning" ? "warning" : "critical",
        tag: event.type === "hitl_request" ? "HITL" : event.type === "agent_alert" ? "AGENT" : "ADMIN",
      };

      setNotifs((prev) => [newNotif, ...prev]);

      if (event.severity === "critical") {
        toast.error(`🚨 ${event.title}`, {
          description: event.body,
          action: { label: "Ver en NEXO", onClick: () => onNavigateRef.current("admin") },
          duration: 9000,
        });
      } else if (event.severity === "warning") {
        toast.warning(`⚠️ ${event.title}`, { description: event.body, duration: 6000 });
      }
    });

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived values ─────────────────────────────────────────────────────────
  const unread   = notifs.filter((n) => n.unread);
  const critical = unread.filter((n) => n.severity === "critical");
  const hasCritical = critical.length > 0;

  const criticals = notifs.filter((n) => n.severity === "critical");
  const regulars  = notifs.filter((n) => n.severity !== "critical");

  // ── Handlers ───────────────────────────────────────────────────────────────
  const markRead = React.useCallback((id: number) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, unread: false } : n));
  }, []);

  const markAllRead = React.useCallback(() => {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const handleNotifClick = React.useCallback((n: Notif) => {
    markRead(n.id);
    onNavigate(n.section, n.navView);
    setBellOpen(false);
  }, [markRead, onNavigate]);

  const handlePanelNotifClick = React.useCallback((notif: NotificationEvent) => {
    // Navigate based on notification type
    if (notif.type === "hitl_request") {
      onNavigate("cockpit");
    } else if (notif.type === "ticket_update") {
      onNavigate("admin");
    } else {
      onNavigate("admin");
    }
    setPanelOpen(false);
  }, [onNavigate]);

  const handleMarkNotificationRead = React.useCallback((id: string) => {
    setLiveNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const { isMobile, isMobileOrTablet } = useResponsive();
  const isFocusMode = useFocusMode();
  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;
  const currentLang = LANG_OPTIONS.find((l) => l.value === language)!;
  const themeLabel: Record<Theme, string> = {
    light:  t("theme_light"),
    dark:   t("theme_dark"),
    system: t("theme_system"),
  };

  // ── Breadcrumb resolution ──────────────────────────────────────────────────
  const meta = SECTION_META[activeSection] ?? SECTION_META["cockpit"];
  const BreadcrumbIcon = meta.icon;
  const sectionLabel =
    FIXED_LABELS[meta.labelKey] ??
    (t as (key: string) => string)(meta.labelKey) ??
    activeSection;

  // Compact mode: Focus + Mobile
  const isCompact = isFocusMode && isMobile;

  return (
    <header className={cn(
      "shrink-0 flex items-center gap-4 px-4 border-b border-border bg-card",
      isCompact ? "h-14" : "h-14"
    )}>

      {/* ── Mobile Focus Mode: Minimal layout ─────────────────────────────── */}
      {isCompact ? (
        <>
          {/* Logo + Hamburger (if sidebar exists) */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">Cerebrin</span>
            </div>
          </div>

          {/* Only avatar on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t("juan_perez")}</p>
                    <p className="text-xs text-muted-foreground">juan@acme.co</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate("settings", "profile")}>
                <User className="w-4 h-4 mr-2" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate("settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          {/* ── Desktop: Full layout ──────────────────────────────────────────────── */}

      {/* ── Left: Breadcrumb ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground">{t("acme_corp")}</span>
          <span className="text-border">/</span>
          {/* Animated section label */}
          <span
            key={activeSection}
            className="flex items-center gap-1.5 text-foreground"
            style={{
              animation: "breadcrumb-slide 0.22s cubic-bezier(0.4,0,0.2,1) both",
            }}
          >
            <BreadcrumbIcon className={`w-3.5 h-3.5 ${meta.color}`} />
            <span style={{ fontWeight: 600 }}>{sectionLabel}</span>
          </span>
        </div>
      </div>

      {/* ── Center: Command Palette Trigger ──────────────────────────────── */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-muted border border-border text-muted-foreground hover:border-violet-500/50 hover:bg-muted/80 transition-all duration-200 group w-full max-w-md"
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-violet-400 transition-colors" />
          <span className="flex-1 text-left text-sm text-muted-foreground">{t("search_placeholder")}</span>
          <kbd className="px-1.5 py-0.5 text-xs rounded bg-background text-muted-foreground border border-border">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Right: Actions ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">

        {/* Theme Toggle */}
        <PerspectiveSwitcher />

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={utilBtn} title={t("appearance")}>
              <ThemeIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(menuCls, "w-52 p-1.5")}>
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 uppercase tracking-widest" style={{ fontSize: "10px" }}>
              {t("appearance")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60 mb-1" />
            {THEME_OPTIONS.map(({ value, icon: Icon, desc }) => {
              const isActive = theme === value;
              return (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer transition-all",
                    isActive
                      ? "bg-violet-600/15 text-violet-300 focus:bg-violet-600/20 focus:text-violet-200"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center border shrink-0",
                    isActive ? "bg-violet-600/20 border-violet-500/30" : "bg-muted/60 border-border"
                  )}>
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-violet-400" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ fontWeight: isActive ? 600 : 400 }}>{themeLabel[value]}</p>
                    <p className="text-muted-foreground/60" style={{ fontSize: "10px" }}>{desc}</p>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(utilBtn, "gap-1.5 w-auto px-2.5")} title={t("language_label")}>
              <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground text-xs uppercase tracking-wider" style={{ fontWeight: 600 }}>
                {currentLang.value.toUpperCase()}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(menuCls, "w-48 p-1.5")}>
            <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 uppercase tracking-widest" style={{ fontSize: "10px" }}>
              {t("language_label")}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/60 mb-1" />
            {LANG_OPTIONS.map(({ value, native, flag }) => {
              const isActive = language === value;
              return (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setLanguage(value)}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-xl cursor-pointer transition-all",
                    isActive
                      ? "bg-blue-600/15 text-blue-300 focus:bg-blue-600/20 focus:text-blue-200"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground"
                  )}
                >
                  <span className="text-base shrink-0 w-6 text-center">{flag}</span>
                  <p className="flex-1 text-sm" style={{ fontWeight: isActive ? 600 : 400 }}>{native}</p>
                  {isActive && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                utilBtn,
                hasCritical && "border-red-500/40 bg-red-500/8"
              )}
              title={t("notifications")}
            >
              {/* Pulsing ring for critical unread */}
              {hasCritical && (
                <span className="absolute inset-0 rounded-xl animate-ping bg-red-500/15 pointer-events-none" />
              )}
              {hasCritical
                ? <BellRing className="w-4 h-4 text-red-400 relative z-10" />
                : <Bell className="w-4 h-4 text-muted-foreground relative z-10" />
              }
              {/* Badge */}
              {unread.length > 0 && (
                <span
                  className={cn(
                    "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white flex items-center justify-center z-20",
                    hasCritical ? "bg-red-500" : "bg-blue-500"
                  )}
                  style={{ fontSize: "9px", fontWeight: 700 }}
                >
                  {unread.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className={cn(menuCls, "w-96 p-0 overflow-hidden")}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <DropdownMenuLabel className="text-foreground text-sm p-0" style={{ fontWeight: 600 }}>
                  {t("notifications")}
                </DropdownMenuLabel>
                {unread.length > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-white",
                    hasCritical ? "bg-red-500" : "bg-blue-500/80"
                  )} style={{ fontSize: "9px", fontWeight: 700 }}>
                    {unread.length} new
                  </span>
                )}
              </div>
              {unread.length > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                  className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marcar todo leído
                </button>
              )}
            </div>

            {/* ── Critical / Admin section ────────────────────────────────────── */}
            {criticals.length > 0 && (
              <div>
                <div className="px-4 py-1.5 flex items-center gap-2 bg-red-500/5 border-b border-red-500/10">
                  <Shield className="w-3 h-3 text-red-400/70" />
                  <span className="text-red-400/80 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 600 }}>
                    Alertas Críticas NEXO
                  </span>
                  {critical.length > 0 && (
                    <span className="ml-auto bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full" style={{ fontSize: "9px", fontWeight: 700 }}>
                      {critical.length} sin leer
                    </span>
                  )}
                </div>
                {criticals.map((n) => (
                  <NotifRow key={n.id} n={n} onClick={() => handleNotifClick(n)} onDismiss={() => markRead(n.id)} />
                ))}
                {regulars.length > 0 && (
                  <div className="px-4 py-1.5 flex items-center gap-2 border-t border-b border-border bg-muted/20">
                    <span className="text-muted-foreground/50 uppercase tracking-widest" style={{ fontSize: "9px", fontWeight: 600 }}>
                      Actividad General
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Regular notifications ───────────────────────────────────────── */}
            {regulars.map((n) => (
              <NotifRow key={n.id} n={n} onClick={() => handleNotifClick(n)} onDismiss={() => markRead(n.id)} />
            ))}

            {notifs.length === 0 && (
              <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground/40">
                <CheckCircle2 className="w-8 h-8" />
                <p className="text-sm">Todo al día</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-border">
              <DropdownMenuItem
                onClick={() => { setPanelOpen(true); setBellOpen(false); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-none text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/5 cursor-pointer transition-colors font-semibold"
              >
                <Bell className="w-3 h-3" />
                Ver todas las notificaciones
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => { onNavigate("admin"); setBellOpen(false); }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-none text-xs text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted cursor-pointer transition-colors border-t border-border"
              >
                <Shield className="w-3 h-3" />
                NEXO Admin Center
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── User Avatar ──────────────────────────────────────────────────── */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted border border-border hover:border-ring/30 transition-colors ml-0.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
                <span className="text-xs text-white" style={{ fontWeight: 700 }}>A</span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm text-foreground leading-none mb-0.5">Alex Rivera</p>
                <p className="text-xs text-muted-foreground leading-none">Admin</p>
              </div>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(menuCls, "w-56")}>
            <DropdownMenuLabel className="text-foreground">
              <p className="text-sm">Alex Rivera</p>
              <p className="text-xs text-muted-foreground" style={{ fontWeight: 400 }}>alex@acmecorp.io</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => onNavigate("settings", "profile")}
              className="hover:bg-muted text-foreground cursor-pointer"
            >
              {t("profile")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onNavigate("settings", "workspace")}
              className="hover:bg-muted text-foreground cursor-pointer"
            >
              {t("workspace_settings")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onNavigate("settings", "agents")}
              className="hover:bg-muted text-foreground cursor-pointer"
            >
              {t("ai_governance")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onClick={() => onNavigate("admin")}
              className="hover:bg-muted text-foreground cursor-pointer flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              NEXO Admin Center
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="hover:bg-muted text-destructive cursor-pointer">
              {t("sign_out")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </>
      )}

      {/* ── Notifications Panel (Full Screen Sheet) ─────────────────────────── */}
      <NotificationsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        liveNotifications={liveNotifications}
        onNotificationClick={handlePanelNotifClick}
        onMarkRead={handleMarkNotificationRead}
      />
    </header>
  );
}

// ─── NotifRow subcomponent ─────────────────────────────────────────────────────

function NotifRow({
  n,
  onClick,
  onDismiss,
}: {
  n: Notif;
  onClick: () => void;
  onDismiss: () => void;
}) {
  const Icon = n.icon;
  const isCritical = n.severity === "critical";

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-all border-b border-border/40 last:border-b-0",
        isCritical
          ? "hover:bg-red-500/5"
          : n.unread
            ? "hover:bg-violet-500/5"
            : "hover:bg-muted/50",
        !n.unread && "opacity-60"
      )}
      onClick={onClick}
    >
      {/* Severity bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5 rounded-r",
          isCritical ? "bg-red-500" :
          n.severity === "warning" ? "bg-amber-500" :
          n.severity === "success" ? "bg-emerald-500" :
          "bg-violet-500/50"
        )}
      />

      {/* Unread dot + icon */}
      <div className="shrink-0 flex flex-col items-center pt-0.5 gap-1.5">
        <span className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 transition-opacity",
          n.unread
            ? isCritical ? "bg-red-400" : "bg-blue-400"
            : "bg-transparent"
        )} />
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
          isCritical ? "bg-red-500/15" :
          n.severity === "warning" ? "bg-amber-500/15" :
          n.severity === "success" ? "bg-emerald-500/15" :
          "bg-violet-500/15"
        )}>
          <Icon className={cn("w-3.5 h-3.5", n.iconColor)} />
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <p className="text-sm text-foreground leading-snug" style={{ fontWeight: n.unread ? 600 : 400 }}>
            {n.text}
          </p>
          {n.tag && <TagPill tag={n.tag} />}
        </div>
        {n.detail && (
          <p className="text-xs text-muted-foreground/60 mt-0.5">{n.detail}</p>
        )}
        <p className="text-xs text-muted-foreground/40 mt-1">{n.time}</p>
      </div>

      {/* Actions: dismiss + navigate arrow */}
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {n.unread && (
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(); }}
            className="w-5 h-5 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground"
            title="Marcar como leído"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/70 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}