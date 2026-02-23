"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useConfig } from "@/context/ConfigContext";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Lightbulb,
    FileText,
    Settings,
    ChevronLeft,
    ChevronRight,
    BrainCircuit,
    Users,
    RefreshCw,
    Activity,
    Calendar,
    ChevronDown,
    Briefcase,
    Bell,
    LogOut,
    Sun,
    Moon,
    Languages,
    Globe,
    Menu
} from "lucide-react";
import { useNotifications } from "@/components/providers/NotificationContext";
import { NotificationSheet } from "@/components/dashboard/NotificationSheet";
import { useUserPerspective } from "@/context/UserPerspectiveContext";
import { useResponsive } from "@/hooks/useResponsive";
import { Sheet } from "@/components/ui/Sheet";

export function Sidebar() {
    const { workspaces, activeWorkspaceId, setActiveWorkspaceId, refreshWorkspaces, isLoading } = useWorkspace();
    const { unreadCount } = useNotifications();
    const { theme, toggleTheme, language, setLanguage, t } = useConfig();
    const { canAccess } = useUserPerspective();
    const { isMobile } = useResponsive();

    const [collapsed, setCollapsed] = useState(false);
    const [tableroOpen, setTableroOpen] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const toggleSidebar = () => setCollapsed(!collapsed);

    if (pathname === "/login") return null;

    const handleWorkspaceClick = (workspaceId: string) => {
        setActiveWorkspaceId(workspaceId);
        if (isMobile) setMobileOpen(false);
        router.push("/");
    };

    const menuGroups = [
        {
            title: t("sidebar.strategic_systems"),
            items: [
                { id: "cockpit", label: t("sidebar.global_status"), href: "/global", icon: BrainCircuit },
                { id: "incubadora", label: t("sidebar.idea_incubator"), href: "/ideas", icon: Lightbulb },
                { id: "projects", label: t("sidebar.project_fleet"), href: "/projects", icon: Briefcase },
                { id: "studio", label: t("sidebar.knowledge_base"), href: "/documents", icon: FileText },
                { id: "chronos", label: t("sidebar.chronos"), href: "/calendar", icon: Calendar },
            ].filter(item => canAccess(item.id as any))
        },
        {
            title: t("sidebar.command_protocol"),
            items: [
                { id: "admin", label: t("sidebar.ai_council"), href: "/council", icon: Users },
                { id: "admin", label: t("sidebar.squad_management"), href: "/teams", icon: Users },
            ].filter(item => canAccess(item.id as any))
        },
        {
            title: t("sidebar.mission_logs"),
            items: [
                { id: "cockpit", label: t("sidebar.operations_pulse"), href: "/activity", icon: Activity },
            ].filter(item => canAccess(item.id as any))
        }
    ].filter(group => group.items.length > 0);

    if (isMobile) {
        return (
            <>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="fixed top-4 left-4 z-[60] p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 active:scale-95 transition-all lg:hidden"
                >
                    <Menu size={20} />
                </button>

                <Sheet isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
                    <div className="h-full bg-slate-900 text-white flex flex-col p-4">
                        <SidebarContent
                            collapsed={false}
                            tableroOpen={tableroOpen}
                            setTableroOpen={setTableroOpen}
                            pathname={pathname}
                            workspaces={workspaces}
                            activeWorkspaceId={activeWorkspaceId}
                            handleWorkspaceClick={handleWorkspaceClick}
                            refreshWorkspaces={refreshWorkspaces}
                            isLoading={isLoading}
                            menuGroups={menuGroups}
                            t={t}
                            theme={theme}
                            toggleTheme={toggleTheme}
                            language={language}
                            setLanguage={setLanguage}
                            unreadCount={unreadCount}
                            setShowNotifications={setShowNotifications}
                            toggleSidebar={toggleSidebar}
                        />
                    </div>
                </Sheet>
                <NotificationSheet isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
            </>
        );
    }

    return (
        <>
            <aside
                className={cn(
                    "h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col z-50 sticky top-0 font-sans",
                    collapsed ? "w-20" : "w-72"
                )}
            >
                <SidebarContent
                    collapsed={collapsed}
                    tableroOpen={tableroOpen}
                    setTableroOpen={setTableroOpen}
                    pathname={pathname}
                    workspaces={workspaces}
                    activeWorkspaceId={activeWorkspaceId}
                    handleWorkspaceClick={handleWorkspaceClick}
                    refreshWorkspaces={refreshWorkspaces}
                    isLoading={isLoading}
                    menuGroups={menuGroups}
                    t={t}
                    theme={theme}
                    toggleTheme={toggleTheme}
                    language={language}
                    setLanguage={setLanguage}
                    unreadCount={unreadCount}
                    setShowNotifications={setShowNotifications}
                    toggleSidebar={toggleSidebar}
                />
            </aside>

            <NotificationSheet isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        </>
    );
}

function SidebarContent({
    collapsed,
    tableroOpen,
    setTableroOpen,
    pathname,
    workspaces,
    activeWorkspaceId,
    handleWorkspaceClick,
    refreshWorkspaces,
    isLoading,
    menuGroups,
    t,
    theme,
    toggleTheme,
    language,
    setLanguage,
    unreadCount,
    setShowNotifications,
    toggleSidebar
}: any) {
    return (
        <div className="flex flex-col h-full">
            {/* Header / Logo */}
            <div className="p-8 pb-4 flex items-center justify-between">
                <div className={cn("flex items-center gap-3", collapsed && "hidden")}>
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <BrainCircuit size={24} className="text-white" />
                    </div>
                    <span className="font-black text-xl tracking-tight">CEREBRIN</span>
                </div>
                {collapsed && (
                    <div className="mx-auto w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <BrainCircuit size={24} className="text-white" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto pt-6 px-4 custom-scrollbar">
                <nav className="space-y-8">
                    {/* Command Center Toggle */}
                    <div>
                        <div
                            onClick={() => !collapsed && setTableroOpen(!tableroOpen)}
                            className={cn(
                                "sidebar-item cursor-pointer",
                                (pathname === "/" || pathname === "/app")
                                    ? "sidebar-item-active"
                                    : "sidebar-item-inactive",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <LayoutDashboard size={20} />
                            {!collapsed && (
                                <div className="flex-1 flex items-center justify-between">
                                    <span className="text-sm font-semibold">{t("sidebar.command_center")}</span>
                                    <ChevronDown size={14} className={cn("transition-transform", !tableroOpen && "-rotate-90")} />
                                </div>
                            )}
                        </div>

                        {!collapsed && tableroOpen && (
                            <div className="mt-2 ml-4 space-y-1 border-l border-white/5 pl-4">
                                {isLoading ? (
                                    <div className="px-3 py-2 text-[11px] text-slate-500 animate-pulse">Syncing...</div>
                                ) : (
                                    <>
                                        {workspaces.map((ws: any) => (
                                            <button
                                                key={ws.id}
                                                onClick={() => handleWorkspaceClick(ws.id)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2 rounded-xl text-[12px] transition-all duration-200 flex items-center gap-2",
                                                    activeWorkspaceId === ws.id
                                                        ? "text-white font-bold bg-white/5 shadow-sm"
                                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    activeWorkspaceId === ws.id ? "bg-indigo-400" : "bg-slate-600"
                                                )} />
                                                <span className="truncate">{ws.name}</span>
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => refreshWorkspaces()}
                                            className="w-full text-left px-3 py-2 text-[10px] text-slate-500 hover:text-emerald-400 flex items-center gap-2 transition-colors uppercase font-black"
                                        >
                                            <RefreshCw size={10} className={cn(isLoading && "animate-spin")} />
                                            <span>Re-Sync</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Groups */}
                    {menuGroups.map((group: any) => (
                        <div key={group.title} className="space-y-1">
                            {!collapsed && (
                                <h3 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                                    {group.title}
                                </h3>
                            )}
                            {group.items.map((item: any) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "sidebar-item",
                                            isActive ? "sidebar-item-active" : "sidebar-item-inactive",
                                            collapsed && "justify-center px-0"
                                        )}
                                    >
                                        <Icon size={20} className="shrink-0" />
                                        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Footer / Toggles */}
            <div className="p-4 bg-black/20 space-y-2">
                {/* Theme and Lang Toggles */}
                <div className={cn("flex items-center gap-2 p-1 bg-white/5 rounded-2xl mb-4", collapsed ? "flex-col" : "justify-between")}>
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center flex-1"
                        title={theme === 'light' ? t("sidebar.theme_dark") : t("sidebar.theme_light")}
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                        className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all flex items-center justify-center flex-1 font-black text-xs"
                        title={t("sidebar.lang_en")}
                    >
                        <Globe size={18} className="mr-1" />
                        {!collapsed && (language === 'en' ? 'EN' : 'ES')}
                    </button>
                </div>

                <button
                    onClick={() => setShowNotifications(true)}
                    className={cn(
                        "w-full sidebar-item sidebar-item-inactive relative",
                        collapsed && "justify-center"
                    )}
                >
                    <Bell size={20} />
                    {!collapsed && <span className="text-sm font-medium">{t("sidebar.alerts")}</span>}
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full border-2 border-slate-900" />
                    )}
                </button>

                <Link
                    href="/settings"
                    className={cn(
                        "sidebar-item sidebar-item-inactive",
                        collapsed && "justify-center"
                    )}
                >
                    <Settings size={20} />
                    {!collapsed && <span className="text-sm font-medium">{t("sidebar.config")}</span>}
                </Link>

                <div className="pt-2 border-t border-white/5">
                    <button className={cn(
                        "w-full sidebar-item text-slate-500 hover:text-red-400 hover:bg-red-400/10",
                        collapsed && "justify-center"
                    )}>
                        <LogOut size={20} />
                        {!collapsed && <span className="text-sm font-medium">{t("sidebar.end_session")}</span>}
                    </button>
                </div>

                {!collapsed && (
                    <div className="px-4 py-2 flex items-center justify-between">
                        <button onClick={toggleSidebar} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                    </div>
                )}
                {collapsed && (
                    <button onClick={toggleSidebar} className="mx-auto p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
                        <ChevronRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
