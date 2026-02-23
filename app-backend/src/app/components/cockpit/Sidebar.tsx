import { cn } from "../ui/utils";
import {
  Bot,
  ChevronLeft,
  ChevronRight,
  FileOutput,
  FileText,
  FolderKanban,
  HelpCircle,
  LayoutTemplate,
  Lightbulb,
  ListTodo,
  Rocket,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import { useAppPreferences } from "../../contexts/AppPreferences";
import { useUserPerspective } from "../../contexts/UserPerspective";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const agents = [
  { id: "writer",   name: "writer-bot",   status: "active", tasks: 4, color: "#8B5CF6" },
  { id: "analyst",  name: "analyst-bot",  status: "active", tasks: 7, color: "#3B82F6" },
  { id: "strategy", name: "strategy-bot", status: "idle",   tasks: 0, color: "#10B981" },
  { id: "dev",      name: "dev-bot",      status: "active", tasks: 3, color: "#F59E0B" },
];

const statusColors: Record<string, string> = {
  active: "bg-emerald-500",
  idle:   "bg-muted-foreground/40",
  error:  "bg-red-500",
};

export function Sidebar({ collapsed, onToggle, activeSection, onSectionChange }: SidebarProps) {
  const { t } = useAppPreferences();
  const { canAccess, profile } = useUserPerspective();

  // Nav items built from translations so labels respond to language changes
  const allNavItems = [
    { id: "cockpit",      icon: Rocket,        label: t("nav_cockpit"),    badge: null },
    { id: "tasks",        icon: ListTodo,       label: t("nav_tasks"),      badge: "12" },
    { id: "projects",     icon: FolderKanban,   label: t("nav_projects"),   badge: null },
    { id: "incubadora",   icon: Lightbulb,      label: t("nav_incubadora"), badge: "3"  },
    { id: "studio",       icon: FileOutput,     label: t("nav_studio"),     badge: null },
    { id: "documents",    icon: FileText,       label: "Documentos",        badge: null },
    { id: "marketplace",  icon: ShoppingBag,    label: "Marketplace",       badge: "New" },
    { id: "modals",       icon: LayoutTemplate, label: t("nav_modals"),     badge: null },
  ];

  // V3.0 Testing nav items (always visible for testing)
  const v3TestingItems = [
    { id: "onboarding-v3",        icon: Zap,              label: "🎯 Onboarding V3",     badge: "New" },
    { id: "onboarding-dashboard", icon: LayoutDashboard,  label: "📊 Dashboard V3",      badge: "New" },
  ];

  // Filter nav items based on perspective visibility
  const navItems = allNavItems.filter((item) => 
    canAccess(item.id as keyof typeof profile.sections)
  );

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full border-r border-border bg-sidebar transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <p className="text-foreground text-sm" style={{ fontWeight: 600 }}>Cerebrin</p>
              <p className="text-muted-foreground text-xs">Strategy OS</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-muted/80 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* Primary Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group",
                  isActive
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "shrink-0 w-4 h-4",
                    isActive ? "text-violet-400" : "text-muted-foreground/60 group-hover:text-foreground"
                  )}
                />
                {!collapsed && (
                  <span className="inline-flex items-center gap-1.5 flex-1">
                    <span className="flex-1 text-left text-sm truncate">{item.label}</span>
                    {item.badge && !profile.ui.simplified_nav && (
                      <span className="shrink-0 px-1.5 py-0.5 text-xs rounded-md bg-muted text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* V3.0 Testing Section */}
        {!collapsed && (
          <div className="mt-6">
            <div className="px-3 mb-2 flex items-center gap-2">
              <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">V3.0 Testing</p>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-1">
              {v3TestingItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 group",
                      isActive
                        ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "shrink-0 w-4 h-4",
                        isActive ? "text-emerald-400" : "text-muted-foreground/60 group-hover:text-foreground"
                      )}
                    />
                    <span className="inline-flex items-center gap-1.5 flex-1">
                      <span className="flex-1 text-left text-sm truncate">{item.label}</span>
                      {item.badge && (
                        <span className="shrink-0 px-1.5 py-0.5 text-xs rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Agents Section */}
        {!collapsed && (
          <div className="mt-6">
            <div className="px-3 mb-2 flex items-center gap-2">
              <p className="text-xs text-muted-foreground/50 uppercase tracking-wider">{t("agents_section")}</p>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-1">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => onSectionChange("settings")}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors cursor-pointer group"
                  title={`Configurar ${agent.name}`}
                >
                  <div className="relative shrink-0">
                    {/* Hexagon for AI agent identity */}
                    <div
                      className="w-4 h-4"
                      style={{
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        backgroundColor: `${agent.color}25`,
                        border: `1px solid ${agent.color}60`,
                      }}
                    />
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-sidebar",
                        statusColors[agent.status]
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate group-hover:text-foreground">{agent.name}</p>
                  </div>
                  {agent.tasks > 0 && (
                    <span className="shrink-0 text-xs font-mono" style={{ color: agent.color, fontSize: 10, fontWeight: 700 }}>
                      {agent.tasks}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mt-6 space-y-2">
            {agents.map((agent) => (
              <div key={agent.id} className="flex justify-center" title={agent.name}>
                <div className="relative">
                  <div
                    className="w-4 h-4"
                    style={{
                      clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                      backgroundColor: `${agent.color}25`,
                      border: `1px solid ${agent.color}60`,
                    }}
                  />
                  <span
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-sidebar",
                      statusColors[agent.status]
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom Nav */}
      <div className="p-2 border-t border-border space-y-1">
        <button
          onClick={() => onSectionChange("settings")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? t("nav_settings") : undefined}
        >
          <Settings className="shrink-0 w-4 h-4" />
          {!collapsed && <span className="text-sm">{t("nav_settings")}</span>}
        </button>
        {/* NEXO Admin Center */}
        <button
          onClick={() => onSectionChange("admin")}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors group",
            activeSection === "admin"
              ? "bg-violet-600/20 text-violet-300"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          title={collapsed ? "NEXO Admin" : undefined}
        >
          <div className="relative shrink-0">
            <Shield
              className={cn(
                "w-4 h-4",
                activeSection === "admin" ? "text-violet-400" : "text-muted-foreground/60 group-hover:text-foreground"
              )}
            />
            {activeSection !== "admin" && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500" />
            )}
          </div>
          {!collapsed && (
            <span className="inline-flex items-center gap-1.5 flex-1">
              <span className="flex-1 text-left text-sm truncate">NEXO Admin</span>
              <span className="shrink-0 px-1.5 py-0.5 text-xs rounded-md bg-violet-500/20 text-violet-400 border border-violet-500/30">
                Admin
              </span>
            </span>
          )}
        </button>
        <button
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={collapsed ? t("nav_help") : undefined}
        >
          <HelpCircle className="shrink-0 w-4 h-4" />
          {!collapsed && <span className="text-sm">{t("nav_help")}</span>}
        </button>
      </div>
    </aside>
  );
}
