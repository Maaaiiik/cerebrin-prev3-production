import { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Check,
  X,
  MessageSquare,
  Bot,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
  Send,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
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
  fetchHITLTickets,
  approveHITLTicket,
  rejectHITLTicket,
  addHITLComment,
  type HITLTicket,
  type HITLTicketStatus,
  type AgentType,
  type HITLAction,
} from "../../services/api";
import { toast } from "sonner";

interface HITLTicketsPanelProps {
  open: boolean;
  onClose: () => void;
}

type FilterStatus = "all" | HITLTicketStatus;
type FilterAgent = "all" | AgentType;

const STATUS_LABELS: Record<HITLTicketStatus | "all", string> = {
  all: "Todos",
  PENDING: "Pendientes",
  APPROVED: "Aprobados",
  REJECTED: "Rechazados",
  EXPIRED: "Expirados",
};

const AGENT_LABELS: Record<AgentType | "all", string> = {
  all: "Todos los agentes",
  RESEARCHER: "Researcher",
  WRITER: "Writer",
  MANAGER: "Manager",
  ANALYST: "Analyst",
  DEV: "Dev",
  STRATEGY: "Strategy",
};

const ACTION_LABELS: Record<HITLAction, string> = {
  CREATE_TASK: "Crear Tarea",
  UPDATE_TASK: "Actualizar Tarea",
  DELETE_TASK: "Eliminar Tarea",
  CREATE_PROJECT: "Crear Proyecto",
  UPDATE_STRATEGY: "Actualizar Estrategia",
  EXECUTE_WORKFLOW: "Ejecutar Workflow",
};

const AGENT_COLORS: Record<AgentType, string> = {
  RESEARCHER: "#10B981",
  WRITER: "#8B5CF6",
  MANAGER: "#F59E0B",
  ANALYST: "#3B82F6",
  DEV: "#EF4444",
  STRATEGY: "#06B6D4",
};

export function HITLTicketsPanel({ open, onClose }: HITLTicketsPanelProps) {
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<HITLTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<HITLTicket | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [agentFilter, setAgentFilter] = useState<FilterAgent>("all");
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load tickets
  useEffect(() => {
    if (open) {
      loadTickets();
    }
  }, [open, statusFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const status = statusFilter === "all" ? undefined : statusFilter;
      const data = await fetchHITLTickets(status);
      setTickets(data);
    } catch (err) {
      console.error("Failed to load HITL tickets", err);
      toast.error("Error al cargar tickets HITL");
    } finally {
      setLoading(false);
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Agent filter
    if (agentFilter !== "all") {
      result = result.filter((t) => t.agent_type === agentFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.workspace_name.toLowerCase().includes(q) ||
          t.agent_name.toLowerCase().includes(q)
      );
    }

    // Tab filter
    if (activeTab === "pending") {
      result = result.filter((t) => t.status === "PENDING");
    } else {
      result = result.filter((t) => t.status !== "PENDING");
    }

    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tickets, agentFilter, searchQuery, activeTab]);

  const pendingCount = tickets.filter((t) => t.status === "PENDING").length;
  const criticalCount = tickets.filter(
    (t) => t.status === "PENDING" && t.priority === "critical"
  ).length;

  const handleApprove = async (ticket: HITLTicket) => {
    setSubmitting(true);
    try {
      await approveHITLTicket(ticket.id, "Alex Rivera"); // TODO: Get from auth context
      toast.success(`Ticket ${ticket.id} aprobado`, {
        description: ticket.title,
      });
      await loadTickets();
      setSelectedTicket(null);
    } catch (err) {
      console.error("Failed to approve ticket", err);
      toast.error("Error al aprobar ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (ticket: HITLTicket, reason?: string) => {
    setSubmitting(true);
    try {
      await rejectHITLTicket(ticket.id, "Alex Rivera", reason);
      toast.error(`Ticket ${ticket.id} rechazado`, {
        description: ticket.title,
      });
      await loadTickets();
      setSelectedTicket(null);
    } catch (err) {
      console.error("Failed to reject ticket", err);
      toast.error("Error al rechazar ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim()) return;

    setSubmitting(true);
    try {
      const comment = await addHITLComment(selectedTicket.id, "Alex Rivera", commentText);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, comments: [...t.comments, comment] } : t
        )
      );
      setSelectedTicket((prev) =>
        prev ? { ...prev, comments: [...prev.comments, comment] } : null
      );
      setCommentText("");
      toast.success("Comentario agregado");
    } catch (err) {
      console.error("Failed to add comment", err);
      toast.error("Error al agregar comentario");
    } finally {
      setSubmitting(false);
    }
  };

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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-4xl p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <SheetTitle className="text-foreground" style={{ fontWeight: 700 }}>
                  HITL APPROVAL QUEUE
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Human-In-The-Loop · Protocolo de aprobación
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs",
                    criticalCount > 0
                      ? "bg-red-500/20 text-red-400 border-red-500/40"
                      : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                  )}
                >
                  {pendingCount} pendientes
                </Badge>
              )}
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Tabs + Filters */}
        <div className="px-6 py-3 border-b border-border shrink-0 space-y-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pending" | "history")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending" className="relative">
                Pendientes
                {pendingCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-blue-600 text-white text-[9px] px-1.5"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por ticket ID, título, workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v as FilterAgent)}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AGENT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTab === "history" && (
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as FilterStatus)}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* List */}
          <div className="flex-1 overflow-y-auto border-r border-border">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
                <p className="text-sm">Cargando tickets...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                {activeTab === "pending" ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 mb-3 opacity-20 text-emerald-500" />
                    <p className="text-sm">Cola vacía — todo aprobado</p>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No hay tickets en el historial</p>
                  </>
                )}
                {(searchQuery || agentFilter !== "all") && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setAgentFilter("all");
                    }}
                    className="mt-2 text-xs"
                  >
                    Limpiar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredTickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    selected={selectedTicket?.id === ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="w-[45%] shrink-0 flex flex-col bg-muted/20">
            {selectedTicket ? (
              <TicketDetail
                ticket={selectedTicket}
                onApprove={() => handleApprove(selectedTicket)}
                onReject={() => handleReject(selectedTicket)}
                onAddComment={handleAddComment}
                commentText={commentText}
                setCommentText={setCommentText}
                submitting={submitting}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                <Zap className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-sm text-center">
                  Selecciona un ticket para ver detalles
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── TicketRow Component ──────────────────────────────────────────────────────

interface TicketRowProps {
  ticket: HITLTicket;
  selected: boolean;
  onClick: () => void;
}

function TicketRow({ ticket, selected, onClick }: TicketRowProps) {
  const agentColor = AGENT_COLORS[ticket.agent_type];

  const priorityStyles: Record<string, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };

  const statusIcons: Record<HITLTicketStatus, React.ElementType> = {
    PENDING: Timer,
    APPROVED: CheckCircle2,
    REJECTED: XCircle,
    EXPIRED: AlertTriangle,
  };

  const statusColors: Record<HITLTicketStatus, string> = {
    PENDING: "text-blue-400",
    APPROVED: "text-emerald-400",
    REJECTED: "text-red-400",
    EXPIRED: "text-orange-400",
  };

  const StatusIcon = statusIcons[ticket.status];

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
        "px-4 py-3 cursor-pointer transition-all hover:bg-muted/30",
        selected && "bg-violet-500/10 border-l-2 border-violet-500"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Hexagon icon */}
        <div
          className="w-8 h-8 shrink-0 flex items-center justify-center mt-0.5"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            backgroundColor: `${agentColor}25`,
          }}
        >
          <Bot className="w-3.5 h-3.5" style={{ color: agentColor }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-mono text-xs text-violet-400"
              style={{ fontWeight: 700 }}
            >
              {ticket.id}
            </span>
            <Badge
              variant="outline"
              className={cn("text-[9px] h-4 px-1.5", priorityStyles[ticket.priority])}
            >
              {ticket.priority.toUpperCase()}
            </Badge>
            <StatusIcon className={cn("w-3 h-3 ml-auto shrink-0", statusColors[ticket.status])} />
          </div>

          {/* Title */}
          <h4 className="text-sm text-foreground mb-1 truncate" style={{ fontWeight: 600 }}>
            {ticket.title}
          </h4>

          {/* Meta */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span style={{ color: agentColor }}>{ticket.agent_name}</span>
            <span>·</span>
            <span>{ticket.workspace_name}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getRelativeTime(ticket.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TicketDetail Component ───────────────────────────────────────────────────

interface TicketDetailProps {
  ticket: HITLTicket;
  onApprove: () => void;
  onReject: () => void;
  onAddComment: () => void;
  commentText: string;
  setCommentText: (text: string) => void;
  submitting: boolean;
}

function TicketDetail({
  ticket,
  onApprove,
  onReject,
  onAddComment,
  commentText,
  setCommentText,
  submitting,
}: TicketDetailProps) {
  const agentColor = AGENT_COLORS[ticket.agent_type];
  const isPending = ticket.status === "PENDING";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0 bg-background">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="font-mono text-sm text-violet-400"
            style={{ fontWeight: 700 }}
          >
            {ticket.id}
          </span>
          <Badge variant="outline" className="text-[9px]">
            {ACTION_LABELS[ticket.action]}
          </Badge>
        </div>
        <h3 className="text-sm text-foreground mb-1" style={{ fontWeight: 600 }}>
          {ticket.title}
        </h3>
        <p className="text-xs text-muted-foreground/70">{ticket.workspace_name}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Description */}
        <div>
          <h4 className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            Descripción
          </h4>
          <p className="text-sm text-foreground leading-relaxed">{ticket.description}</p>
        </div>

        {/* Rationale */}
        <div>
          <h4 className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="w-3 h-3" />
            Justificación de IA
          </h4>
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
            <p className="text-xs text-foreground/80 leading-relaxed">{ticket.rationale}</p>
          </div>
        </div>

        {/* Estimated Impact */}
        {ticket.estimated_impact && (
          <div>
            <h4 className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
              Impacto Estimado
            </h4>
            <p className="text-sm text-emerald-400">{ticket.estimated_impact}</p>
          </div>
        )}

        {/* Context (JSON) */}
        <div>
          <h4 className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">
            Contexto Técnico
          </h4>
          <pre className="bg-slate-900 text-slate-300 text-xs p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(ticket.context, null, 2)}
          </pre>
        </div>

        {/* Comments */}
        {ticket.comments.length > 0 && (
          <div>
            <h4 className="text-xs text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              Comentarios ({ticket.comments.length})
            </h4>
            <div className="space-y-2">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-muted/50 border border-border rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">
                      {comment.author}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80">{comment.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-border shrink-0 bg-background space-y-2">
        {isPending ? (
          <>
            <div className="flex items-center gap-2">
              <Textarea
                placeholder="Agregar comentario (opcional)..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="resize-none h-16 text-xs"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={onAddComment}
                disabled={!commentText.trim() || submitting}
                className="shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onApprove}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Aprobar
              </Button>
              <Button
                onClick={onReject}
                disabled={submitting}
                variant="destructive"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                ticket.status === "APPROVED" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                ticket.status === "REJECTED" && "bg-red-500/20 text-red-400 border-red-500/40"
              )}
            >
              {ticket.status === "APPROVED" && `✓ Aprobado por ${ticket.approved_by}`}
              {ticket.status === "REJECTED" && `✗ Rechazado por ${ticket.rejected_by}`}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
