/**
 * MCPPanel — Cerebrin MCP Protocol Host
 *
 * Enterprise-only. Permite a Cerebrin actuar como host MCP (Model Context Protocol),
 * exponiendo herramientas y recursos a agentes externos via /api/mcp.
 * Feature-gated: requiere plan Enterprise (canUseMcpHost).
 */

import * as React from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Crown,
  Globe,
  Lock,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Terminal,
  Trash2,
  Zap,
  Copy,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { cn } from "../ui/utils";
import { toast } from "sonner";
import { usePlanFeatures } from "../../contexts/PlanContext";
import { Switch } from "../ui/switch";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface MCPTool {
  id: string;
  name: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  auth: boolean;
  active: boolean;
  callsToday: number;
  color: string;
}

interface MCPServer {
  id: string;
  name: string;
  url: string;
  status: "connected" | "disconnected" | "error";
  tools: number;
  lastPing: string;
  auth: "token" | "oauth" | "none";
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_TOOLS: MCPTool[] = [
  {
    id: "t1", name: "listProjects",
    description: "Lista todos los proyectos activos del workspace con metadata completa",
    method: "GET", endpoint: "/api/mcp/tools/listProjects",
    auth: true, active: true, callsToday: 42, color: "#8B5CF6",
  },
  {
    id: "t2", name: "createTask",
    description: "Crea una nueva tarea con asignación, prioridad y metadata HITL",
    method: "POST", endpoint: "/api/mcp/tools/createTask",
    auth: true, active: true, callsToday: 18, color: "#3B82F6",
  },
  {
    id: "t3", name: "approveHITL",
    description: "Aprueba o rechaza un item en la cola HITL con justificación",
    method: "POST", endpoint: "/api/mcp/tools/approveHITL",
    auth: true, active: true, callsToday: 7, color: "#10B981",
  },
  {
    id: "t4", name: "getAgentStatus",
    description: "Retorna el estado actual y métricas de todos los agentes activos",
    method: "GET", endpoint: "/api/mcp/tools/getAgentStatus",
    auth: true, active: false, callsToday: 0, color: "#F59E0B",
  },
  {
    id: "t5", name: "runStrategicQuery",
    description: "Ejecuta una consulta estratégica a través del AI Router con HITL",
    method: "POST", endpoint: "/api/mcp/tools/runStrategicQuery",
    auth: true, active: true, callsToday: 31, color: "#EC4899",
  },
];

const MOCK_SERVERS: MCPServer[] = [
  {
    id: "srv1", name: "n8n Automation Bridge",
    url: "https://n8n.acmecorp.io/mcp",
    status: "connected", tools: 12, lastPing: "hace 2m",
    auth: "token",
  },
  {
    id: "srv2", name: "Anthropic Claude Server",
    url: "https://api.anthropic.com/mcp",
    status: "connected", tools: 8, lastPing: "hace 5m",
    auth: "oauth",
  },
  {
    id: "srv3", name: "Custom Internal Tools",
    url: "https://tools.acmecorp.io/mcp",
    status: "error", tools: 4, lastPing: "hace 2h",
    auth: "token",
  },
];

// ─── Feature Gate ───────────────────────────────────────────────────────────────

function MCPGate({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 max-w-md mx-auto text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Server className="w-7 h-7 text-indigo-400" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Lock className="w-3 h-3 text-amber-400" />
        </div>
      </div>
      <div>
        <h3 className="text-foreground uppercase tracking-widest mb-2" style={{ fontWeight: 800, fontSize: 13 }}>
          MCP Protocol requiere Enterprise
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Cerebrin puede actuar como un servidor MCP, exponiendo tus agentes y herramientas a cualquier cliente compatible (Claude Desktop, Cursor, n8n).
        </p>
      </div>
      <ul className="space-y-2 text-left w-full max-w-xs">
        {[
          "Expone agentes como herramientas MCP",
          "Compatible con Claude Desktop y Cursor",
          "Autenticación OAuth / Bearer Token",
          "Rate limiting y audit trail incluidos",
        ].map(f => (
          <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onUpgrade}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-all"
        style={{ fontWeight: 600 }}
      >
        <Crown className="w-4 h-4" />
        Actualizar a Enterprise
      </button>
    </div>
  );
}

// ─── Tool Row ───────────────────────────────────────────────────────────────────

function ToolRow({
  tool,
  onToggle,
}: {
  tool: MCPTool;
  onToggle: (id: string) => void;
}) {
  const [copied, setCopied] = React.useState(false);

  const methodColors: Record<string, string> = {
    GET:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    POST:   "bg-blue-500/15 text-blue-400 border-blue-500/30",
    PUT:    "bg-amber-500/15 text-amber-400 border-amber-500/30",
    DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(`https://api.cerebrin.ai${tool.endpoint}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast("Endpoint copiado", { icon: <Copy className="w-3.5 h-3.5" /> });
    });
  };

  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all",
      tool.active ? "border-border/60 bg-muted/20" : "border-border/30 bg-muted/10 opacity-60"
    )}>
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
        style={{ backgroundColor: `${tool.color}15`, borderColor: `${tool.color}30` }}
      >
        <Terminal className="w-3.5 h-3.5" style={{ color: tool.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-foreground text-sm font-mono" style={{ fontWeight: 600 }}>{tool.name}</span>
          <span className={cn("px-1.5 py-0.5 rounded-md border text-[9px] uppercase tracking-wider", methodColors[tool.method])} style={{ fontWeight: 700 }}>
            {tool.method}
          </span>
          {tool.auth && (
            <span className="px-1.5 py-0.5 rounded-md border bg-muted text-muted-foreground/50 border-border text-[9px] uppercase tracking-wider" style={{ fontWeight: 600 }}>
              Auth
            </span>
          )}
          {tool.callsToday > 0 && (
            <span className="text-muted-foreground/40" style={{ fontSize: 9 }}>
              {tool.callsToday} llamadas hoy
            </span>
          )}
        </div>
        <p className="text-muted-foreground/50 text-xs mt-0.5 truncate">{tool.description}</p>
        <button
          onClick={handleCopyEndpoint}
          className="flex items-center gap-1 mt-1 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
        >
          <code className="font-mono" style={{ fontSize: 9 }}>
            {tool.endpoint}
          </code>
          {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
        </button>
      </div>

      {/* Toggle */}
      <Switch
        checked={tool.active}
        onCheckedChange={() => onToggle(tool.id)}
        className="data-[state=checked]:bg-violet-600 shrink-0"
      />
    </div>
  );
}

// ─── Server Row ─────────────────────────────────────────────────────────────────

function ServerRow({ server, onDelete }: { server: MCPServer; onDelete: (id: string) => void }) {
  const statusConfig = {
    connected:    { dot: "bg-emerald-500 animate-pulse", text: "text-emerald-400", label: "Conectado" },
    disconnected: { dot: "bg-muted-foreground/30",       text: "text-muted-foreground/40", label: "Desconectado" },
    error:        { dot: "bg-red-500 animate-pulse",     text: "text-red-400", label: "Error" },
  };
  const st = statusConfig[server.status];

  return (
    <div className={cn(
      "flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all group",
      server.status === "error" ? "border-red-500/20 bg-red-500/5" : "border-border/60 bg-muted/20"
    )}>
      <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm" style={{ fontWeight: 600 }}>{server.name}</span>
          <span className={cn("flex items-center gap-1 text-[9px] uppercase tracking-wider", st.text)} style={{ fontWeight: 600 }}>
            <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
            {st.label}
          </span>
        </div>
        <p className="font-mono text-muted-foreground/40 text-xs mt-0.5 truncate">{server.url}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-muted-foreground/30" style={{ fontSize: 9 }}>{server.tools} herramientas</span>
          <span className="text-muted-foreground/30" style={{ fontSize: 9 }}>Ping: {server.lastPing}</span>
          <span className="text-muted-foreground/30 uppercase tracking-wider" style={{ fontSize: 9 }}>Auth: {server.auth}</span>
        </div>
      </div>
      <button
        onClick={() => onDelete(server.id)}
        className="p-1.5 rounded-lg text-muted-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function MCPPanel() {
  const { canUseMcpHost, tier, upgradeTo } = usePlanFeatures();
  const [hostEnabled, setHostEnabled] = React.useState(true);
  const [tools, setTools] = React.useState<MCPTool[]>(MOCK_TOOLS);
  const [servers, setServers] = React.useState<MCPServer[]>(MOCK_SERVERS);
  const [pinging, setPinging] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const ENDPOINT_BASE = "https://api.cerebrin.ai/api/mcp";
  const MCP_TOKEN = "mcp_tok_••••••••••••••••••••••••••••••••••••5Xq2";

  const handleUpgrade = () => {
    upgradeTo("Enterprise");
  };

  const handleToggleTool = (id: string) => {
    setTools(prev => prev.map(t => {
      if (t.id !== id) return t;
      const next = { ...t, active: !t.active };
      toast(next.active ? `${t.name} activado` : `${t.name} desactivado`, {
        description: `Herramienta MCP ${next.active ? "expuesta" : "ocultada"} del protocolo`,
      });
      return next;
    }));
  };

  const handleDeleteServer = (id: string) => {
    const server = servers.find(s => s.id === id);
    setServers(prev => prev.filter(s => s.id !== id));
    toast.error("Servidor MCP desconectado", { description: server?.name });
  };

  const handlePingAll = () => {
    setPinging(true);
    setTimeout(() => {
      setPinging(false);
      toast.success("Ping completado", {
        description: `${servers.filter(s => s.status === "connected").length} de ${servers.length} servidores activos`,
      });
    }, 1500);
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(ENDPOINT_BASE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast("Endpoint MCP copiado", { icon: <Copy className="w-3.5 h-3.5" /> });
    });
  };

  if (!canUseMcpHost) {
    return (
      <div className="p-7">
        <div className="mb-6">
          <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>MCP Protocol Host</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Expón tus agentes como herramientas MCP para clientes externos
          </p>
        </div>
        <MCPGate onUpgrade={handleUpgrade} />
      </div>
    );
  }

  const activeTools = tools.filter(t => t.active).length;
  const connectedServers = servers.filter(s => s.status === "connected").length;
  const totalCalls = tools.reduce((s, t) => s + t.callsToday, 0);

  return (
    <div className="p-7 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-foreground text-xl" style={{ fontWeight: 700 }}>MCP Protocol Host</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          Cerebrin actúa como servidor MCP, exponiendo agentes y herramientas via /api/mcp · Plan: {tier}
        </p>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-border/60 bg-muted/20">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span className="text-foreground text-sm" style={{ fontWeight: 600 }}>MCP Host</span>
        </div>
        <Switch
          checked={hostEnabled}
          onCheckedChange={(v) => {
            setHostEnabled(v);
            toast(v ? "MCP Host activado" : "MCP Host desactivado", {
              description: v
                ? `Endpoint disponible en ${ENDPOINT_BASE}`
                : "El protocolo MCP está temporalmente offline",
            });
          }}
          className="data-[state=checked]:bg-indigo-600"
        />
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <span className={cn("w-1.5 h-1.5 rounded-full", hostEnabled ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30")} />
          <span className="text-muted-foreground text-xs">
            {hostEnabled ? "Online" : "Offline"}
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <span className="text-muted-foreground/50 text-xs">{totalCalls} llamadas hoy</span>
        <div className="h-4 w-px bg-border" />
        <span className="text-muted-foreground/50 text-xs">{activeTools} tools · {connectedServers} servers</span>
      </div>

      {/* Endpoint box */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Endpoint del Servidor MCP</p>
            <p className="text-muted-foreground/50" style={{ fontSize: 11 }}>Usa esta URL en tu cliente MCP (Claude Desktop, Cursor, etc.)</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {/* Base URL */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontWeight: 600 }}>
              Base URL
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/60 border border-border/60">
              <code className="flex-1 font-mono text-sm text-indigo-400 truncate">{ENDPOINT_BASE}</code>
              <button
                onClick={handleCopyEndpoint}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Token */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontWeight: 600 }}>
              Bearer Token
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/60 border border-border/60">
              <code className="flex-1 font-mono text-xs text-muted-foreground/50 truncate">{MCP_TOKEN}</code>
              <Lock className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
            </div>
          </div>

          {/* Quick config snippet */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block" style={{ fontWeight: 600 }}>
              claude_desktop_config.json
            </label>
            <div className="px-4 py-3 rounded-xl bg-slate-950 border border-border/30 overflow-x-auto">
              <pre className="text-emerald-400/80 font-mono" style={{ fontSize: 10, lineHeight: 1.6 }}>
{`{
  "mcpServers": {
    "cerebrin": {
      "url": "${ENDPOINT_BASE}",
      "headers": {
        "Authorization": "Bearer <YOUR_TOKEN>"
      }
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Exposed Tools */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Terminal className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Herramientas Expuestas</p>
            <p className="text-muted-foreground/50" style={{ fontSize: 11 }}>
              {activeTools} de {tools.length} habilitadas · GET /api/mcp/tools para listar
            </p>
          </div>
        </div>
        <div className="p-4 space-y-2">
          {tools.map(tool => (
            <ToolRow key={tool.id} tool={tool} onToggle={handleToggleTool} />
          ))}
        </div>
      </section>

      {/* Connected Servers */}
      <section className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Servidores MCP Conectados</p>
            <p className="text-muted-foreground/50" style={{ fontSize: 11 }}>
              {connectedServers} de {servers.length} activos
            </p>
          </div>
          <button
            onClick={handlePingAll}
            disabled={pinging}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 text-muted-foreground/50 hover:text-foreground hover:border-border transition-all text-xs disabled:opacity-40 shrink-0"
          >
            {pinging
              ? <><Loader2 className="w-3 h-3 animate-spin" />Pinging…</>
              : <><RefreshCw className="w-3 h-3" />Ping All</>
            }
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 transition-all text-xs shrink-0"
            style={{ fontWeight: 600 }}
            onClick={() => toast.info("Conectar nuevo servidor MCP", { description: "POST /api/mcp/servers — funcionalidad backend requerida" })}
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>
        <div className="p-4 space-y-2">
          {servers.map(server => (
            <ServerRow key={server.id} server={server} onDelete={handleDeleteServer} />
          ))}
        </div>
      </section>

      {/* Docs link */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-indigo-500/8 border border-indigo-500/15">
        <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-indigo-400/80 text-xs leading-relaxed">
            <span style={{ fontWeight: 600 }}>Documentación MCP:</span> El protocolo es compatible con MCP v0.9+.
            Rate limiting: 1000 req/min por workspace. Todos los accesos quedan registrados en el audit log.
          </p>
        </div>
        <button
          className="flex items-center gap-1 text-indigo-400/60 hover:text-indigo-300 transition-colors shrink-0"
          onClick={() => toast.info("Abriendo documentación MCP…")}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
