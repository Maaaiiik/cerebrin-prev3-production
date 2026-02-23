export type Workspace = {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  created_at?: string;
};

export type WorkspaceRole = {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  permissions: {
    agents?: {
      view_config: boolean;
      edit_config: boolean;
      approve_output: boolean;
    };
    actions?: Record<string, "AUTONOMOUS" | "APPROVAL" | "BLOCKED">;
    billing?: {
      set_limits: boolean;
    };
    [key: string]: any;
  };
  is_system_default: boolean;
  created_at: string;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role_id: string;
  role_name?: string;
  member_type: 'human' | 'ai';
  joined_at: string;
  invited_by?: string;
  users?: {
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
};



export type TaskHistory = {
  id: string;
  task_id: string;
  task_type: 'document' | 'idea';
  previous_status: string;
  new_status: string;
  changed_by?: string; // Human user ID
  agent_id?: string;   // Agent UUID (FK to workspace_agents)
  changed_at: string;
  result_summary?: string;
  details?: string;
  workspace_id: string;
};

export type ApiKey = {
  id: string;
  key_hash: string;
  label: string;
  workspace_id?: string;
  created_at: string;
};

// Extend existing types
export type Idea = {
  id: string;
  title: string;
  description: string;
  priority_score: number; // 1-10
  progress_pct: number; // Native column 0-100%
  status: 'draft' | 'evaluating' | 'prioritized' | 'executed' | 'discarded';
  assigned_to?: string; // Polymorphic UUID
  assignee_type?: 'HUMAN' | 'AGENT';
  source_url?: string;
  ai_analysis?: string;
  estimated_effort?: number; // 1-5
  created_by_type?: 'manual' | 'agent';
  start_date?: string; // ISO Date
  due_date?: string; // ISO Date
  idea_number?: number; // Serial ID
  workspace_id: string;
};

export type Document = {
  id: string;
  title: string;
  content: string; // Markdown
  category: 'Investigación' | 'Planificación' | 'Ejecución' | 'Revisión' | 'Terminado';
  workspace_id: string;
  tags?: string[];
  subject?: string;
  priority_score?: number;
  progress_pct: number; // Performance-first native column
  assigned_to?: string; // Polymorphic UUID
  assignee_type?: 'HUMAN' | 'AGENT';
  metadata: {
    weight: number;
    estimated_hours: number;
    cost: number;
    tokens?: number;
    model?: string;
    [key: string]: any;
  };
  is_archived?: boolean;
  parent_id?: string | null;
  start_date?: string | null; // ISO Date
  due_date?: string | null; // ISO Date
  color?: string; // Hex or Tailwind class
  user_id?: string;
  created_at?: string; // ISO Date
};

export type ProcessTemplate = {
  id: string;
  name: string;
  description?: string;
  steps: Array<{
    title: string;
    category: Document['category'];
    description?: string;
    estimated_effort?: number;
    delay_days?: number; // For due_date calculation
  }>;
  created_at?: string;
};

// Phase 2: Hierarchy & Versioning
export type DocumentVersion = {
  id: string;
  document_id: string;
  content: string;
  version_number: number;
  created_at: string;
  created_by: string;
};

export type AttachmentMap = {
  id: string;
  source_id: string;
  target_id: string;
  target_version_id?: string;
  type: 'reference' | 'output';
  created_at: string;
};

// Unified Kanban Item
export type KanbanItem = {
  id: string;
  title: string;
  status: string; // documents.category OR idea.status
  type: 'document' | 'idea';
  priority: number;
  workspace_id: string;
  // Polymorphic fields
  description?: string; // Idea has description, Document has content (we might use excerpt)
  external_url?: string;
  doc_type?: 'markdown' | 'link'; // Specific to Document
  parent_id?: string; // Specific to Document (Task/Project)
  start_date?: string;
  due_date?: string;
  tags?: string[];
  original_data: Document | Idea; // Keep reference to original object for updates
};

// Phase 3: Advanced Governance & SaaS
export type AgentConfig = {
  id: string;
  agent_id: string;
  operation_mode: 'GUIDED' | 'ADVANCED';
  permissions: {
    can_read_files: boolean;
    can_write_files: boolean;
    can_call_external_apis: boolean;
    can_send_emails: boolean;
    can_create_tasks: boolean;
    can_approve_own_output: boolean;
    [key: string]: boolean;
  };
  scope: {
    project_ids: string[];
    data_sources: string[];
  };
  limits: {
    max_tokens_per_run: number;
    max_runs_per_day: number;
    cost_limit_usd: number;
  };
  integrations: Array<{
    provider: string;
    enabled: boolean;
    secret_id?: string; // Reference to Supabase Vault
    webhook_url?: string; // For n8n
    events?: string[]; // Events that trigger webhooks
  }>;
};

export type AgentApprovalRequest = {
  id: string;
  workspace_id: string;
  agent_id: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'PROMOTE';
  entity_type: 'TASK' | 'IDEA' | 'PROJECT' | 'DOCUMENT';
  proposed_data: any;
  target_id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  agent_config_snapshot?: any;
  created_at: string;
  processed_at?: string;
};

export type WorkspaceSubscription = {
  id: string;
  workspace_id: string;
  tier: 'starter' | 'pro' | 'enterprise';
  modules: {
    has_council: boolean;
    has_process_engine: boolean;
    has_n8n_bridge: boolean;
    has_white_label: boolean;
  };
  limits: {
    agents_count: number;
    projects_count: number;
    members_count: number;
    api_calls_day: number;
  };
  status: 'active' | 'past_due' | 'canceled';
  current_period_end: string;
};

// Frontend Brief: User Preferences & View Configs
export type UserPreferences = {
  user_id: string;
  theme: 'dark' | 'light' | 'system';
  language: 'en' | 'es';
  updated_at: string;
};

export type ViewConfig = {
  user_id: string;
  config_key: string;
  config_json: Record<string, any>;
  updated_at: string;
};

export interface SupportTicket {
  id: string;
  workspace_id: string;
  user_id: string;
  subject: string;
  status: 'open' | 'in-progress' | 'resolved' | 'pending';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee_id?: string;
  created_at: string;
}

export interface NotificationEvent {
  id: string;
  workspace_id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}
