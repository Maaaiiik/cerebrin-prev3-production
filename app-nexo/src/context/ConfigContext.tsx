"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";
type Language = "en" | "es";

interface ConfigContextType {
    theme: Theme;
    language: Language;
    toggleTheme: () => void;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
    en: {
        // Sidebar
        "sidebar.command_center": "Command Center",
        "sidebar.strategic_systems": "Strategic Systems",
        "sidebar.global_status": "Global Status // NOC",
        "sidebar.idea_incubator": "Idea Incubator",
        "sidebar.project_fleet": "Project Fleet",
        "sidebar.knowledge_base": "Knowledge Base",
        "sidebar.chronos": "Chronos // Calendar",
        "sidebar.command_protocol": "Command Protocol",
        "sidebar.ai_council": "AI Council",
        "sidebar.squad_management": "Squad Management",
        "sidebar.mission_logs": "Mission Logs",
        "sidebar.operations_pulse": "Operations Pulse",
        "sidebar.alerts": "Alerts",
        "sidebar.config": "Config",
        "sidebar.end_session": "End Session",
        "sidebar.theme_light": "Light Mode",
        "sidebar.theme_dark": "Dark Mode",
        "sidebar.lang_en": "English",
        "sidebar.lang_es": "Spanish",

        // Dashboard
        "dashboard.welcome": "Welcome back",
        "dashboard.commander": "Commander",
        "dashboard.neural_link": "Neural Link Active",
        "dashboard.signals": "signals",
        "dashboard.action_items": "Action Items Pending // Agent Council",
        "dashboard.agent_swarm": "IA Swarm has proposed tactical changes requiring authorize.",
        "dashboard.authorize": "Authorize Changes",
        "dashboard.new_input": "New Input",
        "dashboard.log_signal": "Log Signal // Idea",
        "dashboard.new_init": "New Deployment",
        "dashboard.start_mission": "Launch Mission // Project",
        "dashboard.view_reports": "View Reports",
        "dashboard.all_intel": "All Intelligence",
        "dashboard.tactical_focus": "Main Tactical Focus // Active Missions",
        "dashboard.next_up": "Next Up // Temporal Deadlines",
        "dashboard.signal_pulse": "Signal Pulse // Real-time Feed",

        // Global HUD
        "global.title": "Global Status // NOC",
        "global.subtitle": "Mission Control HUD",
        "global.nodes": "Nodes Active",
        "global.system_time": "System Time",
        "global.strategic_ideation": "Strategic Ideation",
        "global.operational_execution": "Operational Execution",
        "global.governance_risk": "Governance & Risk",
        "global.threat_intel": "Threat Intelligence",
        "global.ops_log": "Operations Log",
        "global.at_risk": "Critical Assets // Alert",

        // Ideas
        "ideas.title": "Incubadora",
        "ideas.subtitle": "Madura tus conceptos, evalúa su impacto y conviértelos en proyectos.",
        "ideas.tab_seeds": "SEMILLAS / INCUBADORA",
        "ideas.tab_projects": "PROYECTOS ACTIVOS",
        "ideas.trash": "Papelera / Descartados",
        "ideas.empty_title": "Tu Incubadora está vacía",
        "ideas.empty_desc": "Aquí aparecerán las señales y hallazgos que tu Agente descubra. También puedes sembrar tus propias ideas para que el sistema las analice.",
        "ideas.empty_desc_projects": "Promote ideas desde la incubadora una vez estén maduras para que aparezcan aquí.",
        "ideas.priority": "Prioridad",
        "ideas.maturity": "Madurez",
        "ideas.effort": "Esfuerzo",
        "ideas.source": "Fuente",
        "ideas.timeline": "Timeline de Actividad",
        "ideas.view_kanban": "Ver en Tablero",
        "ideas.active": "ACTIVO",
        "ideas.ai_hints": "AI Hints"
    },
    es: {
        // Sidebar
        "sidebar.command_center": "Centro de Mando",
        "sidebar.strategic_systems": "Sistemas Estratégicos",
        "sidebar.global_status": "Estado Global // NOC",
        "sidebar.idea_incubator": "Incubadora de Ideas",
        "sidebar.project_fleet": "Flota de Proyectos",
        "sidebar.knowledge_base": "Base de Conocimiento",
        "sidebar.chronos": "Chronos // Calendario",
        "sidebar.command_protocol": "Protocolo de Mando",
        "sidebar.ai_council": "Consejo de IA",
        "sidebar.squad_management": "Gestión de Escuadras",
        "sidebar.mission_logs": "Registros de Misión",
        "sidebar.operations_pulse": "Pulso de Operaciones",
        "sidebar.alerts": "Alertas",
        "sidebar.config": "Configuración",
        "sidebar.end_session": "Cerrar Sesión",
        "sidebar.theme_light": "Modo Claro",
        "sidebar.theme_dark": "Modo Oscuro",
        "sidebar.lang_en": "Inglés",
        "sidebar.lang_es": "Español",

        // Dashboard
        "dashboard.welcome": "Bienvenido de nuevo",
        "dashboard.commander": "Comandante",
        "dashboard.neural_link": "Enlace Neural Activo",
        "dashboard.signals": "señales",
        "dashboard.action_items": "Tareas Pendientes // Consejo de Agentes",
        "dashboard.agent_swarm": "El enjambre de IA ha propuesto cambios tácticos que requieren autorización.",
        "dashboard.authorize": "Autorizar Cambios",
        "dashboard.new_input": "Nueva Entrada",
        "dashboard.log_signal": "Registrar Señal // Idea",
        "dashboard.new_init": "Nuevo Despliegue",
        "dashboard.start_mission": "Lanzar Misión // Proyecto",
        "dashboard.view_reports": "Ver Reportes",
        "dashboard.all_intel": "Toda la Inteligencia",
        "dashboard.tactical_focus": "Enfoque Táctico // Misiones Activas",
        "dashboard.next_up": "Siguiente // Plazos Temporales",
        "dashboard.signal_pulse": "Pulso de Señal // Feed en Tiempo Real",

        // Global HUD
        "global.title": "Estado Global // NOC",
        "global.subtitle": "HUD Control de Misión",
        "global.nodes": "Nodos Activos",
        "global.system_time": "Hora del Sistema",
        "global.strategic_ideation": "Ideación Estratégica",
        "global.operational_execution": "Ejecución Operativa",
        "global.governance_risk": "Gobernanza y Riesgo",
        "global.threat_intel": "Inteligencia de Amenazas",
        "global.ops_log": "Bitácora de Operaciones",
        "global.at_risk": "Activos Críticos // Alerta",

        // Ideas
        "ideas.title": "Incubadora",
        "ideas.subtitle": "Madura tus conceptos, evalúa su impacto y conviértelos en proyectos.",
        "ideas.tab_seeds": "SEMILLAS / INCUBADORA",
        "ideas.tab_projects": "PROYECTOS ACTIVOS",
        "ideas.trash": "Papelera / Descartados",
        "ideas.empty_title": "Tu Incubadora está vacía",
        "ideas.empty_desc": "Aquí aparecerán las señales y hallazgos que tu Agente descubra. También puedes sembrar tus propias ideas para que el sistema las analice.",
        "ideas.empty_desc_projects": "Promueve ideas desde la incubadora una vez estén maduras para que aparezcan aquí.",
        "ideas.priority": "Prioridad",
        "ideas.maturity": "Madurez",
        "ideas.effort": "Esfuerzo",
        "ideas.source": "Fuente",
        "ideas.timeline": "Línea de Tiempo",
        "ideas.view_kanban": "Ver en Tablero",
        "ideas.active": "ACTIVO",
        "ideas.ai_hints": "AI Hints",

        // Projects
        "projects.title": "Flota de Proyectos",
        "projects.subtitle": "Supervisa el avance, tareas y entregables de todas las misiones.",
        "projects.from_incubator": "Desde Incubadora",
        "projects.filter_node": "Filtrar Nodo",
        "projects.trash": "Papelera / Archivados",
        "projects.archived": "Archivados",
        "projects.active": "Activo",
        "projects.empty_title": "No hay misiones activas",
        "projects.empty_desc": "Comienza creando un proyecto o promueve una idea desde la incubadora.",
        "projects.empty_trash": "La papelera está vacía",
        "projects.restore": "Restaurar",
        "projects.archive": "Archivar",
        "projects.view_details": "Ver Detalles",

        // Council
        "council.title": "Consejo de Inteligencia",
        "council.subtitle": "Gobernanza de IA Estratégica",
        "council.placeholder": "Ingrese consulta estratégica para el consejo...",
        "council.verdict": "Veredicto del Juez Supremo",
        "council.synthesizing": "Sintetizando consenso estratégico...",
        "council.waiting": "Esperando directivas...",
        "council.status": "Estatus",

        // Activity
        "activity.title": "Bitácora de Operaciones",
        "activity.subtitle": "Cronología de eventos y acciones autónomas.",
        "activity.category": "Categoría",
        "activity.user": "Usuario",
        "activity.details": "Detalles",

        // Calendar
        "calendar.title": "Hoja de Ruta Estratégica",
        "calendar.subtitle": "Planifica y sincroniza hitos en toda la organización.",

        // Assets
        "assets.title": "Gestor de Activos",
        "assets.subtitle": "Gestión inteligente de activos estratégicos.",
        "assets.kanban": "Kanban",
        "assets.calendar": "Calendario",
        "assets.syncing": "Sincronizando con el centro de mando...",

        // Teams
        "teams.title": "Gestión de Equipos",
        "teams.subtitle": "Administra la fuerza de trabajo biológica y artificial.",
        "teams.members": "Miembros",
        "teams.members_desc": "Coordinación humana",
        "teams.agents": "Agentes IA",
        "teams.agents_desc": "Despliegue autónomo",
        "teams.roles": "Jerarquías",
        "teams.roles_desc": "Protocolos de acceso",
        "teams.active": "Activos",
        "teams.balanced": "Equilibrado",

        // Settings
        "settings.title": "Configuración",
        "settings.subtitle": "Gestiona tu workspace, conexiones de agentes y plantillas.",
        "settings.agent_conn": "Conexión de Agente",
        "settings.agent_desc": "Usa estas credenciales para conectar tus agentes de n8n, Python o LangChain.",
        "settings.workspace_id": "Workspace ID",
        "settings.system_prompt": "Prompt de Sistema (Inicial)",
        "settings.templates": "Plantillas",
        "settings.templates_desc": "Estandariza tus flujos de trabajo con plantillas reutilizables.",
        "settings.teams": "Equipos",
        "settings.teams_desc": "Gestiona miembros humanos, agentes IA e invitaciones.",
        "settings.manage": "Gestionar",
        "settings.active_workspace": "Workspace Activo",
        "settings.stats": "Estadísticas",
        "settings.created": "Creado"
    }
};

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("dark");
    const [language, setLanguage] = useState<Language>("en");

    useEffect(() => {
        const savedTheme = localStorage.getItem("app-theme") as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        }

        const savedLang = localStorage.getItem("app-lang") as Language;
        if (savedLang) setLanguage(savedLang);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("app-theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("app-lang", lang);
    };

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <ConfigContext.Provider value={{ theme, language, toggleTheme, setLanguage: changeLanguage, t }}>
            {children}
        </ConfigContext.Provider>
    );
}

export function useConfig() {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error("useConfig must be used within a ConfigProvider");
    }
    return context;
}
