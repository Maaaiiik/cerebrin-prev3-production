import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  BellRing,
  AlertTriangle,
  Bot,
  CheckCheck,
  Filter,
  Search,
  Shield,
  LifeBuoy,
  Zap,
  AlertCircle,
  Trash2,
  ExternalLink,
  X,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";
import {
  fetchNotificationHistory,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type NotificationEvent,
} from "../../services/api";
import { toast } from "sonner";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  liveNotifications: NotificationEvent[];
  onNotificationClick?: (notif: NotificationEvent) => void;
  onMarkRead: (id: string) => void;
}

type FilterType = "all" | "agent_alert" | "hitl_request" | "ticket_update" | "capacity_warning" | "payment_fail";
type SeverityFilter = "all" | "critical" | "warning" | "info";

const TYPE_LABELS: Record<FilterType, string> = {
  all: "Todas",
  agent_alert: "Alertas de Agentes",
  hitl_request: "Solicitudes HITL",
  ticket_update: "Actualizaciones de Tickets",
  capacity_warning: "Advertencias de Capacidad",
  payment_fail: "Fallos de Pago",
};

const SEVERITY_LABELS: Record<SeverityFilter, string> = {
  all: "Todas",
  critical: "Críticas",
  warning: "Advertencias",
  info: "Informativas",
};

export function NotificationsPanel({
  open,
  onClose,
  liveNotifications,
  onNotificationClick,
  onMarkRead,
}: NotificationsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<NotificationEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");

  // Merge live + history, dedupe by id
  const allNotifications = useMemo(() => {
    const map = new Map<string, NotificationEvent>();
    [...liveNotifications, ...history].forEach((n) => map.set(n.id, n));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [liveNotifications, history]);

  // Apply filters
  const filteredNotifications = useMemo(() => {
    let result = allNotifications;

    // Tab filter
    if (activeTab === "unread") {
      result = result.filter((n) => !n.read);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((n) => n.type === typeFilter);
    }

    // Severity filter
    if (severityFilter !== "all") {
      result = result.filter((n) => n.severity === severityFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.workspace?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allNotifications, activeTab, typeFilter, severityFilter, searchQuery]);

  const unreadCount = allNotifications.filter((n) => !n.read).length;
  const criticalCount = allNotifications.filter((n) => n.severity === "critical" && !n.read).length;

  // Load history on mount
  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchNotificationHistory(100);
      setHistory(data);
    } catch (err) {
      console.error("Failed to load notification history", err);
      toast.error("Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      onMarkRead(id);
      // Update local state
      setHistory((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      toast.success("Notificación marcada como leída");
    } catch (err) {
      console.error("Failed to mark notification read", err);
      toast.error("Error al marcar notificación");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      // Mark all as read in local state
      setHistory((prev) => prev.map((n) => ({ ...n, read: true })));
      // Notify parent to update live notifications
      liveNotifications.forEach((n) => onMarkRead(n.id));
      toast.success(`${unreadCount} notificaciones marcadas como leídas`);
    } catch (err) {
      console.error("Failed to mark all read", err);
      toast.error("Error al marcar todas como leídas");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setHistory((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notificación eliminada");
    } catch (err) {
      console.error("Failed to delete notification", err);
      toast.error("Error al eliminar notificación");
    }
  };

  const handleNotificationClick = (n: NotificationEvent) => {
    if (!n.read) {
      handleMarkRead(n.id);
    }
    if (onNotificationClick) {
      onNotificationClick(n);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                {criticalCount > 0 ? (
                  <BellRing className="w-4 h-4 text-red-400" />
                ) : (
                  <Bell className="w-4 h-4 text-violet-400" />
                )}
              </div>
              <div>
                <SheetTitle className="text-foreground" style={{ fontWeight: 700 }}>
                  NOTIFICATION CENTER
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unreadCount > 0 ? (
                    <>
                      <span className="text-violet-400 font-semibold">{unreadCount}</span> sin leer
                      {criticalCount > 0 && (
                        <span className="text-red-400 ml-2">
                          · {criticalCount} críticas
                        </span>
                      )}
                    </>
                  ) : (
                    "Todo al día"
                  )}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Tabs + Filters */}
        <div className="px-6 py-3 border-b border-border shrink-0 space-y-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "unread" | "all")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unread" className="relative">
                Sin leer
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-violet-600 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar notificaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as FilterType)}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick actions */}
          {unreadCount > 0 && (
            <div className="flex items-center justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllRead}
                className="text-xs text-muted-foreground hover:text-foreground h-7"
              >
                <CheckCheck className="w-3 h-3 mr-1.5" />
                Marcar todas como leídas
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mb-3" />
              <p className="text-sm">Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">No hay notificaciones</p>
              {(searchQuery || typeFilter !== "all" || severityFilter !== "all") && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                    setSeverityFilter("all");
                  }}
                  className="mt-2 text-xs"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredNotifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onClick={() => handleNotificationClick(n)}
                  onMarkRead={() => handleMarkRead(n.id)}
                  onDelete={() => handleDelete(n.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="px-6 py-3 border-t border-border shrink-0 bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                <span>{allNotifications.length} total</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>Últimas 24h</span>
              </div>
            </div>
            <button
              onClick={loadHistory}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── NotificationRow Component ────────────────────────────────────────────────

interface NotificationRowProps {
  notification: NotificationEvent;
  onClick: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}

function NotificationRow({ notification, onClick, onMarkRead, onDelete }: NotificationRowProps) {
  const iconMap: Record<NotificationEvent["type"], React.ElementType> = {
    agent_alert: Bot,
    hitl_request: Zap,
    ticket_update: LifeBuoy,
    capacity_warning: AlertTriangle,
    payment_fail: AlertCircle,
  };

  const colorMap: Record<NotificationEvent["severity"], string> = {
    critical: "text-red-400",
    warning: "text-amber-400",
    info: "text-blue-400",
  };

  const bgMap: Record<NotificationEvent["severity"], string> = {
    critical: "bg-red-500/10 border-red-500/20",
    warning: "bg-amber-500/10 border-amber-500/20",
    info: "bg-violet-500/10 border-violet-500/20",
  };

  const Icon = iconMap[notification.type] ?? Bell;
  const isCritical = notification.severity === "critical";

  // Format relative time
  const getRelativeTime = (timestamp: string) => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "ahora";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div
      className={cn(
        "group relative px-6 py-4 cursor-pointer transition-all hover:bg-muted/50",
        !notification.read && "bg-violet-500/[0.02]"
      )}
      onClick={onClick}
    >
      {/* Severity indicator bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-r",
          isCritical
            ? "bg-red-500"
            : notification.severity === "warning"
              ? "bg-amber-500"
              : "bg-violet-500"
        )}
      />

      <div className="flex items-start gap-4">
        {/* Icon + unread indicator */}
        <div className="shrink-0 flex flex-col items-center gap-1.5 pt-0.5">
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
          )}
          <div
            className={cn(
              "w-9 h-9 rounded-xl border flex items-center justify-center",
              bgMap[notification.severity]
            )}
          >
            <Icon className={cn("w-4 h-4", colorMap[notification.severity])} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className="text-sm text-foreground leading-snug"
              style={{ fontWeight: notification.read ? 400 : 600 }}
            >
              {notification.title}
            </h4>
            <span className="text-xs text-muted-foreground/60 shrink-0">
              {getRelativeTime(notification.created_at)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground/70 leading-relaxed mb-2">
            {notification.body}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 flex-wrap">
            {notification.workspace && (
              <Badge variant="outline" className="text-xs h-5">
                {notification.workspace}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-xs h-5",
                isCritical && "border-red-500/40 text-red-400",
                notification.severity === "warning" && "border-amber-500/40 text-amber-400"
              )}
            >
              {notification.severity.toUpperCase()}
            </Badge>
            {notification.action_url && (
              <ExternalLink className="w-3 h-3 text-muted-foreground/40" />
            )}
          </div>
        </div>

        {/* Actions (show on hover) */}
        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.read && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
              className="h-7 w-7 p-0"
              title="Marcar como leída"
            >
              <CheckCheck className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
