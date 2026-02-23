# Cerebrin PRE-V3 Database Schema

This document contains the complete database schema for the Cerebrin PRE-V3 system, optimized for Supabase (PostgreSQL).

## Extensions Required
- `uuid-ossp`: For UUID generation.
- `pgcrypto`: For security functions.

## Tables Overview

### Core Structure
- **workspaces**: Main containers for all data.
- **workspace_members**: Links users to workspaces with roles.
- **workspace_roles**: Custom permission sets.
- **workspace_teams**: Organizational teams.
- **user_perspectives**: UI/UX configuration per user/workspace.

### Agent System
- **agents**: Master agent definitions.
- **agent_configs**: Specific settings for agents in a workspace.
- **workspace_agents**: Instances of agents active in a workspace.
- **agent_memory**: Long-term and short-term memory for AI agents.
- **agent_approval_queue**: HITL (Human In The Loop) approval system.

### Content & Projects
- **documents**: Tasks, notes, and main entities.
- **document_versions**: History of changes.
- **idea_pipeline**: Incubator for new projects/tasks.
- **teams**: Project-specific teams.

### Automation & Infrastructure
- **access_tokens**: API access for external services.
- **api_keys**: User API keys.
- **vault_secrets**: Secure storage for integration keys.
- **notifications**: System and agent alerts.

---

## Complete SQL Schema

```sql
-- 1. ENUMS Y SECUENCIAS
CREATE TYPE public.agent_type_enum AS ENUM ('RESEARCHER', 'WRITER', 'MANAGER', 'SPECIALIST');
CREATE SEQUENCE IF NOT EXISTS idea_pipeline_idea_number_seq;

-- 2. WORKSPACES
CREATE TABLE public.workspaces (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  owner_id uuid,
  subscription_tier text DEFAULT 'free'::text CHECK (subscription_tier = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])),
  byo_api_enabled boolean DEFAULT false,
  CONSTRAINT workspaces_pkey PRIMARY KEY (id)
);

-- 3. AGENTS
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id),
  owner_id uuid,
  name text NOT NULL,
  emoji text DEFAULT '🤖'::text,
  type text NOT NULL DEFAULT 'SALES'::text,
  hierarchy_type text DEFAULT 'SPECIALIST'::text,
  persona text DEFAULT 'custom'::text,
  model text NOT NULL DEFAULT 'gemini-2.0-flash'::text,
  system_prompt text,
  active boolean DEFAULT true,
  hitl_level text NOT NULL DEFAULT 'plan_only'::text CHECK (hitl_level = ANY (ARRAY['full_manual'::text, 'plan_only'::text, 'result_only'::text, 'autonomous'::text])),
  hitl_exceptions jsonb DEFAULT '["send_external_email", "delete_file", "contact_client", "send_whatsapp"]'::jsonb,
  resonance_score integer DEFAULT 0,
  maturity_mode text NOT NULL DEFAULT 'observer'::text CHECK (maturity_mode = ANY (ARRAY['observer'::text, 'operator'::text, 'executor'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agents_pkey PRIMARY KEY (id)
);

CREATE TABLE public.agent_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id),
  operation_mode text DEFAULT 'GUIDED'::text CHECK (operation_mode = ANY (ARRAY['GUIDED'::text, 'ADVANCED'::text])),
  permissions jsonb DEFAULT '{"can_read_files": false, "can_send_emails": false, "can_write_files": false, "can_create_tasks": true, "can_approve_own_output": false, "can_call_external_apis": false}'::jsonb,
  scope jsonb DEFAULT '{"project_ids": [], "data_sources": []}'::jsonb,
  limits jsonb DEFAULT '{"cost_limit_usd": 10.0, "max_runs_per_day": 50, "max_tokens_per_run": 4000}'::jsonb,
  integrations jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  workspace_id uuid REFERENCES public.workspaces(id),
  avatar_url text,
  role_level integer DEFAULT 1,
  assigned_user_id uuid,
  is_cognitive_mirror boolean DEFAULT false,
  autonomy_level integer DEFAULT 1,
  permission_package text DEFAULT 'OBSERVER'::text CHECK (permission_package = ANY (ARRAY['OBSERVER'::text, 'OPERATOR'::text, 'EXECUTOR'::text])),
  CONSTRAINT agent_configs_pkey PRIMARY KEY (id)
);

-- 4. DOCUMENTS & TASKS
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text,
  category text DEFAULT 'Investigación'::text,
  tags text[] DEFAULT '{}'::text[],
  subject text,
  language text,
  priority_score integer CHECK (priority_score >= 1 AND priority_score <= 10),
  workspace_id uuid REFERENCES public.workspaces(id),
  user_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  parent_id uuid REFERENCES public.documents(id),
  is_archived boolean DEFAULT false,
  due_date timestamp with time zone,
  status_detail text DEFAULT 'pending'::text,
  sequence_order integer,
  completion_date timestamp with time zone,
  type text DEFAULT 'internal'::text,
  status text DEFAULT 'Por hacer'::text,
  start_date timestamp with time zone,
  ai_analysis text,
  assigned_to uuid,
  progress_pct integer DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
  assignee_type text CHECK (assignee_type = ANY (ARRAY['HUMAN'::text, 'AGENT'::text])),
  CONSTRAINT documents_pkey PRIMARY KEY (id)
);

-- 5. ACCESS & TOKENS
CREATE TABLE public.access_tokens (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  user_id uuid NOT NULL,
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  prefix text NOT NULL,
  scopes text[] DEFAULT '{read}'::text[],
  access_type text NOT NULL DEFAULT 'mcp'::text,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT access_tokens_pkey PRIMARY KEY (id)
);

-- (This is a truncated version for the documentation file, it contains all 46 tables structure internally)
```

> **Note:** For the full list of all 46 tables, refer to the automated migration scripts.
