import * as React from "react";
import { fetchUserPreferences, saveUserPreferences } from "../services/api";

export type Theme = "dark" | "light" | "system";
export type Language = "en" | "es";

// ─── Translations ──────────────────────────────────────────────────────────────

export const translations = {
  en: {
    // Sidebar navigation
    nav_cockpit:    "The Cockpit",
    nav_tasks:      "My Tasks",
    nav_projects:   "Project Engine",
    nav_incubadora: "Incubadora",
    nav_modals:     "UI Lab · Modals",
    nav_studio:     "Template Studio",
    nav_settings:   "Settings",
    nav_help:       "Help & Docs",
    agents_section: "AI Agents",

    // TopNav
    appearance:         "Appearance",
    language_label:     "Language",
    notifications:      "Notifications",
    profile:            "Profile",
    workspace_settings: "Workspace Settings",
    ai_governance:      "AI Governance Rules",
    sign_out:           "Sign Out",
    search_placeholder: "Search commands, projects...",
    acme_corp:          "Acme Corp",

    // Settings nav groups
    account:          "Account",
    organization:     "Organization",
    ai_configuration: "AI Configuration",

    // Settings nav items
    general:          "General",
    my_profile:       "My Profile",
    workspace_team:   "Workspace & Team",
    teams:            "Teams",
    agent_factory:    "Agent Factory",
    permissions:      "Agent Permissions",
    api_webhooks:     "API & Webhooks",
    plan_addons:      "Plan & Add-ons",

    // Settings hub
    back_to_cockpit: "Back to Cockpit",
    settings:        "Settings",

    // General settings panel
    general_settings:      "General Settings",
    general_settings_desc: "App-wide configuration, appearance, and regional preferences",
    appearance_card_title: "Appearance",
    appearance_card_desc:  "Choose how Cerebrin looks on your device",
    color_theme:           "Color Theme",
    theme_light:           "Light",
    theme_dark:            "Dark",
    theme_system:          "System",
    theme_light_desc:      "Clean & bright",
    theme_dark_desc:       "Easy on the eyes",
    theme_system_desc:     "Follows your OS",
    lang_region_title:     "Language & Region",
    lang_region_desc:      "Localisation, timezone, and date format",
    display_language:      "Display Language",
    timezone:              "Timezone",
    date_format:           "Date Format",
    notif_title:           "Notification Channels",
    notif_desc:            "How you receive alerts from Cerebrin agents",
    notif_email:           "Email Digest",
    notif_email_desc:      "Daily summary of agent activity",
    notif_inapp:           "In-App Alerts",
    notif_inapp_desc:      "Real-time toast notifications",
    notif_slack:           "Slack Integration",
    notif_slack_desc:      "Push to #ai-ops channel",

    // Agent states
    active:   "Active",
    inactive: "Inactive",

    // Placeholder panels
    workspace_panel_title: "Workspace & Team",
    workspace_panel_desc:  "Manage team members, roles, and organizational settings",
    profile_panel_title:   "My Profile",
    profile_panel_desc:    "Personal account settings, avatar, and security",

    // Agent factory
    agent_factory_title: "Agent Factory",
    agents_configured:   "agents configured",
    agents_active:       "active",
    create_agent:        "Create Agent",

    // API panel
    api_webhooks_title: "API & Webhooks",
    api_webhooks_desc:  "Integrate Cerebrin into your stack via REST API and event webhooks",

    // Template Studio
    studio_title:           "Output Studio",
    studio_subtitle:        "Visual Document Builder",
    studio_toolbox:         "Block Toolbox",
    studio_toolbox_desc:    "Drag blocks onto the canvas",
    studio_canvas:          "Document Canvas",
    studio_properties:      "Block Properties",
    studio_no_selection:    "Select a block on the canvas to edit its properties",
    studio_value_binding:   "Value Binding",
    studio_binding_ph:      "{{ agent.variable_name }}",
    studio_block_heading:   "Heading",
    studio_block_markdown:  "Markdown Body",
    studio_block_table:     "AI Data Table",
    studio_block_keyval:    "Key-Value List",
    studio_block_drive:     "Drive Link Block",
    studio_sync_drive:      "Sync with Google Drive",
    studio_export_pdf:      "Export PDF",
    studio_template_name:   "Template Name",
    studio_new_template:    "New Template",
    studio_drop_hint:       "Drop a block here",
    studio_drop_zone:       "Drag blocks from the toolbox to build your document",
    studio_ai_badge:        "AI-Mapped",
    studio_align_label:     "Text Alignment",
    studio_font_size:       "Font Size",
    studio_block_style:     "Block Style",
    studio_drive_url:       "Drive / Notion URL",
    studio_drive_ph:        "https://drive.google.com/...",
    studio_col_key:         "Key",
    studio_col_value:       "Value",
    studio_add_row:         "Add Row",

    // Universal Task Sheet
    sheet_view_details:     "View Details",
    sheet_more_options:     "More options",
    sheet_edit_details:     "Edit Details",
    sheet_add_to_tasks:     "Add to My Tasks",
    sheet_convert_idea:     "Convert to Idea",
    sheet_promote_project:  "Promote to Project",
    sheet_copy_link:        "Copy Link",
    sheet_description:      "Description",
    sheet_related_links:    "Related Links",
    sheet_paste_link:       "Paste Google Drive or Notion URL...",
    sheet_add_link:         "Attach Link",
    sheet_human_context:    "Human Context",
    sheet_agent_console:    "Agent Console",
    sheet_est_hours:        "Est. Hours",
    sheet_cost:             "Cost",
    sheet_weight:           "Weight",
    sheet_no_description:   "No description yet. Click to add context for your agents.",
    sheet_mock_desc_task:   "This task was generated by an AI agent and is pending human review. Add notes, context, or instructions to guide the agent's next actions.",
    sheet_mock_desc_idea:   "This idea was surfaced by the Strategy AI from market signals and internal data. Review the analysis scores and decide whether to promote it to a Project.",
  },
  es: {
    // Sidebar navigation
    nav_cockpit:    "La Cabina",
    nav_tasks:      "Mis Tareas",
    nav_projects:   "Motor de Proyectos",
    nav_incubadora: "Incubadora",
    nav_modals:     "Lab UI · Modales",
    nav_studio:     "Template Studio",
    nav_settings:   "Configuración",
    nav_help:       "Ayuda & Docs",
    agents_section: "Agentes IA",

    // TopNav
    appearance:         "Apariencia",
    language_label:     "Idioma",
    notifications:      "Notificaciones",
    profile:            "Perfil",
    workspace_settings: "Config. de Workspace",
    ai_governance:      "Gobernanza de IA",
    sign_out:           "Cerrar Sesión",
    search_placeholder: "Buscar comandos, proyectos...",
    acme_corp:          "Acme Corp",

    // Settings nav groups
    account:          "Cuenta",
    organization:     "Organización",
    ai_configuration: "Configuración IA",

    // Settings nav items
    general:          "General",
    my_profile:       "Mi Perfil",
    workspace_team:   "Workspace & Equipo",
    teams:            "Equipos",
    agent_factory:    "Fábrica de Agentes",
    permissions:      "Permisos de Agentes",
    api_webhooks:     "API & Webhooks",
    plan_addons:      "Plan & Add-ons",

    // Settings hub
    back_to_cockpit: "Volver a la Cabina",
    settings:        "Configuración",

    // General settings panel
    general_settings:      "Config. General",
    general_settings_desc: "Configuración global, apariencia y preferencias regionales",
    appearance_card_title: "Apariencia",
    appearance_card_desc:  "Elige cómo se ve Cerebrin en tu dispositivo",
    color_theme:           "Tema de Color",
    theme_light:           "Claro",
    theme_dark:            "Oscuro",
    theme_system:          "Sistema",
    theme_light_desc:      "Limpio y brillante",
    theme_dark_desc:       "Cómodo para la vista",
    theme_system_desc:     "Sigue tu sistema operativo",
    lang_region_title:     "Idioma & Región",
    lang_region_desc:      "Localización, zona horaria y formato de fecha",
    display_language:      "Idioma de Interfaz",
    timezone:              "Zona Horaria",
    date_format:           "Formato de Fecha",
    notif_title:           "Canales de Notificación",
    notif_desc:            "Cómo recibes alertas de los agentes de Cerebrin",
    notif_email:           "Resumen por Email",
    notif_email_desc:      "Resumen diario de actividad de agentes",
    notif_inapp:           "Alertas en la App",
    notif_inapp_desc:      "Notificaciones toast en tiempo real",
    notif_slack:           "Integración con Slack",
    notif_slack_desc:      "Enviar al canal #ai-ops",

    // Agent states
    active:   "Activo",
    inactive: "Inactivo",

    // Placeholder panels
    workspace_panel_title: "Workspace & Equipo",
    workspace_panel_desc:  "Gestiona miembros del equipo, roles y configuración organizacional",
    profile_panel_title:   "Mi Perfil",
    profile_panel_desc:    "Configuración de cuenta personal, avatar y seguridad",

    // Agent factory
    agent_factory_title: "Fábrica de Agentes",
    agents_configured:   "agentes configurados",
    agents_active:       "activos",
    create_agent:        "Crear Agente",

    // API panel
    api_webhooks_title: "API & Webhooks",
    api_webhooks_desc:  "Integra Cerebrin en tu stack vía API REST y webhooks de eventos",

    // Template Studio
    studio_title:           "Output Studio",
    studio_subtitle:        "Constructor Visual de Documentos",
    studio_toolbox:         "Caja de Bloques",
    studio_toolbox_desc:    "Arrastra bloques al lienzo",
    studio_canvas:          "Lienzo de Documento",
    studio_properties:      "Propiedades del Bloque",
    studio_no_selection:    "Selecciona un bloque en el lienzo para editar sus propiedades",
    studio_value_binding:   "Enlace de Valor",
    studio_binding_ph:      "{{ agente.nombre_variable }}",
    studio_block_heading:   "Encabezado",
    studio_block_markdown:  "Cuerpo Markdown",
    studio_block_table:     "Tabla de Datos IA",
    studio_block_keyval:    "Lista Clave-Valor",
    studio_block_drive:     "Bloque de Link Drive",
    studio_sync_drive:      "Sincronizar con Google Drive",
    studio_export_pdf:      "Exportar PDF",
    studio_template_name:   "Nombre de Plantilla",
    studio_new_template:    "Nueva Plantilla",
    studio_drop_hint:       "Suelta un bloque aquí",
    studio_drop_zone:       "Arrastra bloques del toolbox para construir tu documento",
    studio_ai_badge:        "Mapeado IA",
    studio_align_label:     "Alineación de Texto",
    studio_font_size:       "Tamaño de Fuente",
    studio_block_style:     "Estilo del Bloque",
    studio_drive_url:       "URL de Drive / Notion",
    studio_drive_ph:        "https://drive.google.com/...",
    studio_col_key:         "Clave",
    studio_col_value:       "Valor",
    studio_add_row:         "Agregar Fila",

    // Universal Task Sheet
    sheet_view_details:     "Ver Detalles",
    sheet_more_options:     "Más opciones",
    sheet_edit_details:     "Editar Detalles",
    sheet_add_to_tasks:     "Agregar a Mis Tareas",
    sheet_convert_idea:     "Convertir en Idea",
    sheet_promote_project:  "Promover a Proyecto",
    sheet_copy_link:        "Copiar Enlace",
    sheet_description:      "Descripción",
    sheet_related_links:    "Links Relacionados",
    sheet_paste_link:       "Pegar URL de Google Drive o Notion...",
    sheet_add_link:         "Adjuntar Link",
    sheet_human_context:    "Contexto Humano",
    sheet_agent_console:    "Consola del Agente",
    sheet_est_hours:        "Horas Est.",
    sheet_cost:             "Costo",
    sheet_weight:           "Peso",
    sheet_no_description:   "Sin descripción. Haz clic para agregar contexto para tus agentes.",
    sheet_mock_desc_task:   "Esta tarea fue generada por un agente IA y está pendiente de revisión humana. Agrega notas, contexto o instrucciones para guiar las próximas acciones del agente.",
    sheet_mock_desc_idea:   "Esta idea fue identificada por el AI de Estrategia a partir de señales de mercado y datos internos. Revisa los scores de análisis y decide si promoverla a Proyecto.",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// ─── Context ───────────────────────────────────────────────────────────────────

interface AppPreferencesCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "dark" | "light";
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const AppPreferencesContext = React.createContext<AppPreferencesCtx | null>(null);

// ─── Default fallback (used during HMR transitions or if called outside Provider) ─

const DEFAULT_CTX: AppPreferencesCtx = {
  theme:         "dark",
  setTheme:      () => {},
  resolvedTheme: "dark",
  language:      "en",
  setLanguage:   () => {},
  t:             (key) => key,
};

export function AppPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    // Bootstrap from localStorage immediately; API sync happens after mount
    try {
      const s = localStorage.getItem("cerebrin_preferences");
      if (s) return (JSON.parse(s).theme as Theme) ?? "dark";
    } catch { /**/ }
    return "dark";
  });
  const [language, setLanguageState] = React.useState<Language>(() => {
    try {
      const s = localStorage.getItem("cerebrin_preferences");
      if (s) return (JSON.parse(s).language as Language) ?? "en";
    } catch { /**/ }
    return "en";
  });

  // ── Sync from API on mount (multi-platform persistence) ───────────────────
  React.useEffect(() => {
    fetchUserPreferences().then(prefs => {
      if (prefs.theme)    setThemeState(prefs.theme as Theme);
      if (prefs.language) setLanguageState(prefs.language as Language);
    }).catch(() => { /* offline — localStorage values already set */ });
  }, []);

  // Resolve "system" to an actual value
  const resolvedTheme: "dark" | "light" = React.useMemo(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
  }, [theme]);

  // Apply/remove "dark" class on <html>
  React.useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    saveUserPreferences({ theme: t }).catch(() => {});
  }, []);

  const setLanguage = React.useCallback((l: Language) => {
    setLanguageState(l);
    saveUserPreferences({ language: l }).catch(() => {});
  }, []);

  // Simple translation accessor
  const t = React.useCallback(
    (key: TranslationKey): string => translations[language][key] as string,
    [language]
  );

  return (
    <AppPreferencesContext.Provider value={{ theme, setTheme, resolvedTheme, language, setLanguage, t }}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const ctx = React.useContext(AppPreferencesContext);
  return ctx ?? DEFAULT_CTX;
}

/** Convenience hook: returns only the translator function */
export function useTranslation() {
  return useAppPreferences().t;
}