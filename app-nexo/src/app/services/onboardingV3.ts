/**
 * Onboarding Service V3 — APIs actualizadas para v3.0
 * 
 * Cambios vs versión anterior:
 * - Mapeo correcto a campos del backend (profile_type, autonomy_level)
 * - Conexión con endpoints reales
 * - Soporte para mock data en desarrollo
 */

// ─── Types matching backend schema ──────────────────────────────────────────

export type ProfileType = 'vendedor' | 'estudiante' | 'freelancer';
export type AutonomyLevel = 'observer' | 'operator' | 'executor';
export type TeamType = 'solo' | 'team';

export interface OnboardingAnswers {
  profile_type: ProfileType;
  team_type: TeamType;
  autonomy_level: AutonomyLevel;
  agent_name?: string;
  pain_points?: string[];
}

export interface OnboardingSession {
  session_id: string;
  user_id: string;
  workspace_id: string;
  current_step: number;
  answers: Partial<OnboardingAnswers>;
  generated_structure?: any;
  confirmed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatedAgent {
  agent_id: string;
  name: string;
  type: 'SALES' | 'RESEARCH' | 'PERSONAL' | 'EXECUTIVE';
  maturity_mode: 'observer' | 'operator' | 'executor';
  hitl_level: 'full_manual' | 'plan_only' | 'autonomous';
  resonance_score: number;
  workspace_id: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

// Toggle between mock data and real API
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

// Backend URL
const API_BASE = import.meta.env.VITE_API_BASE || '';

// ─── Helper: Fetch wrapper ──────────────────────────────────────────────────

async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// ─── Mock Implementation ─────────────────────────────────────────────────────

const MOCK_USER_ID = 'mock-user-123';
const MOCK_WORKSPACE_ID = 'mock-workspace-123';

function getMockSession(): OnboardingSession | null {
  const stored = localStorage.getItem('cerebrin_onboarding_session_v3');
  return stored ? JSON.parse(stored) : null;
}

function saveMockSession(session: OnboardingSession): void {
  localStorage.setItem('cerebrin_onboarding_session_v3', JSON.stringify(session));
}

function clearMockSession(): void {
  localStorage.removeItem('cerebrin_onboarding_session_v3');
}

function generateMockAgent(answers: OnboardingAnswers): CreatedAgent {
  // Mapeo: profile_type → agent type (backend)
  const agentTypeMap: Record<ProfileType, CreatedAgent['type']> = {
    vendedor: 'SALES',
    estudiante: 'PERSONAL',
    freelancer: 'EXECUTIVE',
  };

  // Mapeo: autonomy_level → maturity_mode + hitl_level
  const autonomyMap: Record<AutonomyLevel, { maturity_mode: CreatedAgent['maturity_mode']; hitl_level: CreatedAgent['hitl_level'] }> = {
    observer: { maturity_mode: 'observer', hitl_level: 'full_manual' },
    operator: { maturity_mode: 'operator', hitl_level: 'plan_only' },
    executor: { maturity_mode: 'executor', hitl_level: 'autonomous' },
  };

  const autonomyConfig = autonomyMap[answers.autonomy_level];

  return {
    agent_id: `mock-agent-${Date.now()}`,
    name: answers.agent_name || `Mi Asistente ${answers.profile_type}`,
    type: agentTypeMap[answers.profile_type],
    maturity_mode: autonomyConfig.maturity_mode,
    hitl_level: autonomyConfig.hitl_level,
    resonance_score: 50, // Score inicial
    workspace_id: MOCK_WORKSPACE_ID,
  };
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * POST /api/onboarding/start
 * Inicia una nueva sesión de onboarding
 */
export async function startOnboarding(
  userId: string = MOCK_USER_ID,
  workspaceId: string = MOCK_WORKSPACE_ID
): Promise<OnboardingSession> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    clearMockSession();
    
    const session: OnboardingSession = {
      session_id: `session-${Date.now()}`,
      user_id: userId,
      workspace_id: workspaceId,
      current_step: 0,
      answers: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveMockSession(session);
    return session;
  }

  return apiCall<OnboardingSession>('/api/onboarding/start', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, workspace_id: workspaceId }),
  });
}

/**
 * PATCH /api/onboarding/:session_id
 * Guarda el progreso del onboarding (por paso)
 */
export async function saveOnboardingProgress(
  sessionId: string,
  stepNumber: number,
  answers: Partial<OnboardingAnswers>
): Promise<OnboardingSession> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const session = getMockSession();
    if (!session) {
      throw new Error('No active session');
    }

    const updatedSession: OnboardingSession = {
      ...session,
      current_step: stepNumber,
      answers: { ...session.answers, ...answers },
      updated_at: new Date().toISOString(),
    };

    saveMockSession(updatedSession);
    return updatedSession;
  }

  return apiCall<OnboardingSession>(`/api/onboarding/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ current_step: stepNumber, answers }),
  });
}

/**
 * POST /api/onboarding/:session_id/complete
 * Completa el onboarding y crea el agente
 */
export async function confirmOnboarding(
  sessionId: string
): Promise<{
  agent: CreatedAgent;
  workspace_id: string;
  redirect_to: string;
}> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const session = getMockSession();
    if (!session || !session.answers.profile_type || !session.answers.autonomy_level) {
      throw new Error('Incomplete session data');
    }

    const agent = generateMockAgent(session.answers as OnboardingAnswers);

    // Marcar onboarding como completado
    localStorage.setItem('cerebrin_onboarding_completed_v3', 'true');
    clearMockSession();

    // Redirigir según perfil
    const redirectMap: Record<ProfileType, string> = {
      vendedor: '/cockpit',
      estudiante: '/academic',
      freelancer: '/cockpit',
    };

    return {
      agent,
      workspace_id: MOCK_WORKSPACE_ID,
      redirect_to: redirectMap[session.answers.profile_type as ProfileType] || '/cockpit',
    };
  }

  return apiCall<{
    agent: CreatedAgent;
    workspace_id: string;
    redirect_to: string;
  }>(`/api/onboarding/${sessionId}/complete`, {
    method: 'POST',
  });
}

/**
 * GET /api/onboarding/resume
 * Intenta retomar una sesión de onboarding existente
 */
export async function resumeOnboarding(
  userId: string = MOCK_USER_ID
): Promise<OnboardingSession | null> {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const session = getMockSession();
    
    // Si ya completó, no retornar sesión
    if (isOnboardingCompleted()) {
      return null;
    }

    return session;
  }

  try {
    return await apiCall<OnboardingSession>(`/api/onboarding/resume?user_id=${userId}`);
  } catch (error) {
    // Si no hay sesión, retornar null (no es error)
    return null;
  }
}

/**
 * Check if onboarding is completed (client-side)
 */
export function isOnboardingCompleted(): boolean {
  return localStorage.getItem('cerebrin_onboarding_completed_v3') === 'true';
}

/**
 * Reset onboarding state (for testing/debugging)
 */
export function resetOnboarding(): void {
  localStorage.removeItem('cerebrin_onboarding_completed_v3');
  clearMockSession();
}

/**
 * Get current session (for debugging)
 */
export function getCurrentSession(): OnboardingSession | null {
  if (USE_MOCK) {
    return getMockSession();
  }
  return null; // En modo real, esto se obtiene desde el backend
}
