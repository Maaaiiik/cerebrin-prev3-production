import * as React from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "../ui/command";
import {
  Bot,
  FileOutput,
  FileText,
  FolderKanban,
  LayoutTemplate,
  LifeBuoy,
  Lightbulb,
  ListTodo,
  Plus,
  Rocket,
  Settings,
  Shield,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import type { SettingsView } from "../settings/SettingsHub";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (section: string, view?: SettingsView) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {

  const navigate = React.useCallback(
    (section: string, view?: SettingsView) => {
      onNavigate?.(section, view);
      onOpenChange(false);
    },
    [onNavigate, onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar comandos, proyectos, agentes..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>

        {/* ── Navigate ───────────────────────────────────────────────────────── */}
        <CommandGroup heading="Navegar">
          <CommandItem onSelect={() => navigate("cockpit")}>
            <Rocket className="text-violet-400" />
            <span>The Cockpit</span>
            <CommandShortcut>⌘1</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("tasks")}>
            <ListTodo className="text-blue-400" />
            <span>My Tasks</span>
            <CommandShortcut>⌘2</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("projects")}>
            <FolderKanban className="text-emerald-400" />
            <span>Project Engine</span>
            <CommandShortcut>⌘3</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("incubadora")}>
            <Lightbulb className="text-amber-400" />
            <span>Incubadora</span>
            <CommandShortcut>⌘4</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("modals")}>
            <LayoutTemplate className="text-pink-400" />
            <span>UI Lab · Modals</span>
            <CommandShortcut>⌘5</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("settings")}>
            <Settings className="text-slate-400" />
            <span>Settings</span>
            <CommandShortcut>⌘6</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("studio")}>
            <FileOutput className="text-cyan-400" />
            <span>Template Studio</span>
            <CommandShortcut>⌘7</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("documents")}>
            <FileText className="text-indigo-400" />
            <span>Document Pipeline</span>
            <CommandShortcut>⌘0</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* ── NEXO Admin ─────────────────────────────────────────────────────── */}
        <CommandGroup heading="NEXO Admin Center">
          <CommandItem onSelect={() => navigate("admin")}>
            <Shield className="text-violet-400" />
            <span>Abrir NEXO Admin Center</span>
            <CommandShortcut>⌘8</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("admin")}>
            <FolderKanban className="text-blue-400" />
            <span>CRM de Workspaces</span>
            <CommandShortcut className="text-violet-400/60">NEXO</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("admin")}>
            <Zap className="text-amber-400" />
            <span>Usage Audit · Slots & Tokens</span>
            <CommandShortcut className="text-violet-400/60">NEXO</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("admin")}>
            <LifeBuoy className="text-red-400" />
            <span>Centro de Soporte</span>
            <CommandShortcut className="text-violet-400/60">NEXO</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("settings", "vault")}>
            <Zap className="text-emerald-400" />
            <span>Vault — BYO API Keys</span>
            <CommandShortcut className="text-emerald-400/60">Vault</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("settings", "mcp")}>
            <Sparkles className="text-indigo-400" />
            <span>MCP Protocol Host</span>
            <CommandShortcut className="text-indigo-400/60">MCP</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* ── Create ─────────────────────────────────────────────────────────── */}
        <CommandGroup heading="Crear">
          <CommandItem>
            <Plus className="text-blue-400" />
            <span>Nueva Tarea</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <FolderKanban className="text-emerald-400" />
            <span>Nuevo Proyecto</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Lightbulb className="text-amber-400" />
            <span>Nueva Idea</span>
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("documents")}>
            <FileText className="text-indigo-400" />
            <span>Nuevo Documento</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* ── Agents ─────────────────────────────────────────────────────────── */}
        <CommandGroup heading="Invocar Agente">
          <CommandItem>
            <Bot className="text-violet-400" />
            <span>Invocar writer-bot</span>
            <CommandShortcut>@w</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Bot className="text-blue-400" />
            <span>Invocar analyst-bot</span>
            <CommandShortcut>@a</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Bot className="text-emerald-400" />
            <span>Invocar strategy-bot</span>
            <CommandShortcut>@s</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Bot className="text-amber-400" />
            <span>Invocar dev-bot</span>
            <CommandShortcut>@d</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* ── Account ────────────────────────────────────────────────────────── */}
        <CommandGroup heading="Cuenta">
          <CommandItem onSelect={() => navigate("settings", "profile")}>
            <User className="text-slate-400" />
            <span>Mi Perfil</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("settings", "workspace")}>
            <Settings className="text-slate-400" />
            <span>Configuración del Workspace</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("settings", "agents")}>
            <Sparkles className="text-violet-400" />
            <span>Gobernanza de IA</span>
          </CommandItem>
          <CommandItem onSelect={() => navigate("settings", "plan")}>
            <Zap className="text-amber-400" />
            <span>Plan & Add-ons</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
