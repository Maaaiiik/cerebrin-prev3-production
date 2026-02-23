/**
 * API Types - Contratos de datos entre Frontend y Backend
 * Cerebrin v3.0
 */

// ============================================================
// COMMON TYPES
// ============================================================

export type ProfileType = 'vendedor' | 'estudiante' | 'freelancer';

export type AutomationStatus = 'active' | 'paused' | 'error';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export type ActivityType = 'automation' | 'manual';

// ============================================================
// USER & PROFILE
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  profile_type: ProfileType;
  created_at: string;
  updated_at: string;
}

export interface ProfileSettings {
  user_id: string;
  profile_type: ProfileType;
  notifications_email: boolean;
  notifications_reminders: boolean;
  notifications_push: boolean;
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  timezone: string;
}

// ============================================================
// AUTOMATIONS
// ============================================================

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  icon_name: string;
  color: string;
  executions_count: number;
  executions_today: number;
  last_run_at: string | null;
  time_saved_minutes: number;
  requires_services: string[]; // ['gmail', 'calendar', 'telegram']
  created_at: string;
  updated_at: string;
}

export interface AutomationStats {
  total_active: number;
  total_executions_today: number;
  total_time_saved_weekly: number; // in minutes
}

export interface ToggleAutomationRequest {
  automation_id: string;
  status: 'active' | 'paused';
}

export interface ToggleAutomationResponse {
  success: boolean;
  automation: Automation;
}

// ============================================================
// INTEGRATIONS
// ============================================================

export interface Integration {
  id: string;
  user_id: string;
  service_name: 'gmail' | 'calendar' | 'telegram';
  status: IntegrationStatus;
  connected_at: string | null;
  access_token?: string; // Encrypted en backend
  refresh_token?: string; // Encrypted en backend
  metadata: Record<string, any>; // Service-specific data
  created_at: string;
  updated_at: string;
}

export interface ConnectIntegrationRequest {
  service_name: 'gmail' | 'calendar' | 'telegram';
  auth_code?: string; // OAuth code
  credentials?: Record<string, any>; // For Telegram bot token, etc.
}

export interface ConnectIntegrationResponse {
  success: boolean;
  integration: Integration;
  redirect_url?: string; // For OAuth flows
}

export interface DisconnectIntegrationRequest {
  service_name: 'gmail' | 'calendar' | 'telegram';
}

// ============================================================
// ACTIVITY
// ============================================================

export interface Activity {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string;
  automation_id?: string;
  automation_name?: string;
  timestamp: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityFilters {
  type?: ActivityType | 'all';
  search?: string;
  limit?: number;
  offset?: number;
  date_from?: string;
  date_to?: string;
}

export interface ActivityResponse {
  activities: Activity[];
  total_count: number;
  has_more: boolean;
}

// ============================================================
// QUICK ACTIONS
// ============================================================

export interface QuickActionRequest {
  action_type: string; // 'cotizacion', 'proyecto', 'tarea', etc.
  data: Record<string, any>; // Form data
}

export interface QuickActionResponse {
  success: boolean;
  activity_id: string;
  message: string;
}

// ============================================================
// SETTINGS
// ============================================================

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
  profile_type?: ProfileType;
}

export interface UpdateSettingsRequest {
  notifications_email?: boolean;
  notifications_reminders?: boolean;
  notifications_push?: boolean;
  theme?: 'light' | 'dark';
  language?: 'es' | 'en';
  timezone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface Enable2FARequest {
  method: 'totp' | 'sms';
}

export interface Enable2FAResponse {
  success: boolean;
  qr_code?: string; // For TOTP
  backup_codes?: string[];
}

// ============================================================
// ONBOARDING
// ============================================================

export interface CompleteOnboardingRequest {
  profile_type: ProfileType;
  name: string;
  goals?: string[];
}

export interface CompleteOnboardingResponse {
  success: boolean;
  user: User;
  default_automations: Automation[];
}

// ============================================================
// API RESPONSE WRAPPER
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================
// PAGINATION
// ============================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
  has_more: boolean;
}
