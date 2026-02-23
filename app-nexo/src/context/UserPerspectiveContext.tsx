"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type PerspectiveMode = "director" | "focus" | "custom";
export type UserRole = "owner" | "pm" | "executor" | "viewer";

export interface PerspectiveProfile {
    id: string;
    name: string;
    mode: PerspectiveMode;
    role: UserRole;

    sections: {
        cockpit: boolean;
        tasks: boolean;
        projects: boolean;
        incubadora: boolean;
        studio: boolean;
        documents: boolean;
        admin: boolean;
        settings: boolean;
        marketplace: boolean;
    };

    cockpit_widgets: {
        agents: boolean;
        approvals: boolean;
        projects: boolean;
        analytics: boolean;
        race: boolean;
        swarm: boolean;
    };

    settings_tabs: {
        general: boolean;
        workspace: boolean;
        agents: boolean;
        api: boolean;
        profile: boolean;
        permissions: boolean;
        plan: boolean;
        teams: boolean;
        security: boolean;
        vault: boolean;
        mcp: boolean;
    };

    features: {
        can_create_projects: boolean;
        can_approve_hitl: boolean;
        can_configure_agents: boolean;
        can_see_analytics: boolean;
        can_see_financials: boolean;
        shadow_chat_enabled: boolean;
    };

    ui: {
        simplified_nav: boolean;
        hide_metrics: boolean;
        default_view: string;
    };

    onboarding_data?: any;
}

const PRESET_PROFILES: Record<PerspectiveMode, Partial<PerspectiveProfile>> = {
    director: {
        name: "Vista Director",
        mode: "director",
        sections: {
            cockpit: true, tasks: true, projects: true, incubadora: true,
            studio: true, documents: true, admin: true, settings: true, marketplace: true
        },
        cockpit_widgets: {
            agents: true, approvals: true, projects: true, analytics: true,
            race: true, swarm: true
        },
        settings_tabs: {
            general: true, workspace: true, agents: true, api: true,
            profile: true, permissions: true, plan: true, teams: true,
            security: true, vault: true, mcp: true
        },
        features: {
            can_create_projects: true, can_approve_hitl: true, can_configure_agents: true,
            can_see_analytics: true, can_see_financials: true, shadow_chat_enabled: false
        },
        ui: {
            simplified_nav: false, hide_metrics: false, default_view: "cockpit"
        }
    },
    focus: {
        name: "Vista Focus",
        mode: "focus",
        sections: {
            cockpit: false, tasks: true, projects: false, incubadora: false,
            studio: false, documents: true, admin: false, settings: true, marketplace: false
        },
        cockpit_widgets: {
            agents: false, approvals: false, projects: false, analytics: false,
            race: false, swarm: false
        },
        settings_tabs: {
            general: true, workspace: false, agents: false, api: false,
            profile: true, permissions: false, plan: false, teams: false,
            security: true, vault: false, mcp: false
        },
        features: {
            can_create_projects: false, can_approve_hitl: false, can_configure_agents: false,
            can_see_analytics: false, can_see_financials: false, shadow_chat_enabled: true
        },
        ui: {
            simplified_nav: true, hide_metrics: true, default_view: "tasks"
        }
    },
    custom: {
        name: "Vista Personalizada",
        mode: "custom"
    }
};

interface UserPerspectiveCtx {
    profile: PerspectiveProfile;
    mode: PerspectiveMode;
    setMode: (mode: PerspectiveMode) => void;
    updateProfile: (updates: Partial<PerspectiveProfile>) => void;
    resetToPreset: (mode: PerspectiveMode) => void;
    canAccess: (section: keyof PerspectiveProfile['sections']) => boolean;
    canUseFeature: (feature: keyof PerspectiveProfile['features']) => boolean;
    isWidgetVisible: (widget: keyof PerspectiveProfile['cockpit_widgets']) => boolean;
    isSettingsTabVisible: (tab: keyof PerspectiveProfile['settings_tabs']) => boolean;
}

const UserPerspectiveContext = createContext<UserPerspectiveCtx | undefined>(undefined);

export function UserPerspectiveProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<PerspectiveMode>("focus");
    const [profile, setProfile] = useState<PerspectiveProfile>(PRESET_PROFILES.focus as PerspectiveProfile);

    useEffect(() => {
        const savedMode = localStorage.getItem("user-perspective-mode") as PerspectiveMode;
        if (savedMode && PRESET_PROFILES[savedMode]) {
            setModeState(savedMode);
            // In a real app, we'd fetch the full profile from the API
            setProfile({ ...(PRESET_PROFILES[savedMode] as PerspectiveProfile) });
        }
    }, []);

    const setMode = async (newMode: PerspectiveMode) => {
        setModeState(newMode);
        localStorage.setItem("user-perspective-mode", newMode);

        // Sync with API
        try {
            await fetch('/api/users/me/perspective/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: newMode })
            });
        } catch (e) {
            console.error("Failed to sync perspective mode", e);
        }

        if (PRESET_PROFILES[newMode]) {
            setProfile({ ...(PRESET_PROFILES[newMode] as PerspectiveProfile) });
        }
    };

    const updateProfile = (updates: Partial<PerspectiveProfile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
        // Future: Sync with PATCH /api/users/me/perspective
    };

    const resetToPreset = (newMode: PerspectiveMode) => {
        setMode(newMode);
    };

    const canAccess = (section: keyof PerspectiveProfile['sections']) => profile.sections[section] !== false;
    const canUseFeature = (feature: keyof PerspectiveProfile['features']) => profile.features[feature] === true;
    const isWidgetVisible = (widget: keyof PerspectiveProfile['cockpit_widgets']) => profile.cockpit_widgets[widget] === true;
    const isSettingsTabVisible = (tab: keyof PerspectiveProfile['settings_tabs']) => profile.settings_tabs[tab] !== false;

    return (
        <UserPerspectiveContext.Provider value={{
            profile, mode, setMode, updateProfile, resetToPreset,
            canAccess, canUseFeature, isWidgetVisible, isSettingsTabVisible
        }}>
            {children}
        </UserPerspectiveContext.Provider>
    );
}

export function useUserPerspective() {
    const context = useContext(UserPerspectiveContext);
    if (context === undefined) {
        throw new Error("useUserPerspective must be used within a UserPerspectiveProvider");
    }
    return context;
}
