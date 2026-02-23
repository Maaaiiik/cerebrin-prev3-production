/**
 * Onboarding Service — APIs para el wizard de setup
 * Conecta con backend para guardar progreso y generar agente
 */

export interface OnboardingAnswers {
  boring_tasks: string[];
  work_mode: 'solo' | 'team';
  team_area?: string;
  control_preference: 'manual' | 'equilibrado' | 'autonomo';
}

export interface AgentConfig {
  name: string;
  type: 'CONTENT' | 'DATA' | 'STRATEGY' | 'RESEARCH';
  hitl_level: 'observer' | 'operator' | 'executor';
  initial_skills: string[];
  resonance_score: number;
}

export interface OnboardingSession {
  session_id: string;
  user_id: string;
  workspace_id: string;
  step_number: number;
  answers: Partial<OnboardingAnswers>;
  agent_config?: AgentConfig;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Mock mode vs Real API
const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

// ─── Mock Implementation ───────────────────────────────────────────────────────

const mockSession: OnboardingSession = {
  session_id: 'mock-session-123',
  user_id: 'mock-user-123',
  workspace_id: 'mock-workspace-123',
  step_number: 0,
  answers: {},
  completed: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function generateMockAgentConfig(answers: OnboardingAnswers): AgentConfig {
  const agentTypes: Record<string, AgentConfig['type']> = {
    'cotizaciones': 'CONTENT',
    'informes': 'DATA',
    'agenda': 'STRATEGY',
    'investigar': 'RESEARCH',
    'emails': 'CONTENT',
    'apuntes': 'CONTENT',
  };

  const hitlLevels: Record<string, AgentConfig['hitl_level']> = {
    'manual': 'observer',
    'equilibrado': 'operator',
    'autonomo': 'executor',
  };

  const primaryTask = answers.boring_tasks[0] || 'cotizaciones';
  const agentType = agentTypes[primaryTask] || 'CONTENT';
  const hitlLevel = hitlLevels[answers.control_preference];

  return {
    name: 'Mi Asistente IA',
    type: agentType,
    hitl_level: hitlLevel,
    initial_skills: answers.boring_tasks,
    resonance_score: hitlLevel === 'operator' ? 30 : 0,
  };
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export async function startOnboarding(userId: string, workspaceId: string): Promise<OnboardingSession> {
  if (USE_MOCK) {
    // Mock: simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Limpiar sesión anterior en localStorage
    localStorage.removeItem('cerebrin_onboarding_session');
    
    return {
      ...mockSession,
      user_id: userId,
      workspace_id: workspaceId,
      step_number: 0,
      answers: {},
      completed: false,
    };
  }

  // Real API
  const response = await fetch('/api/setup/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, workspace_id: workspaceId }),
  });

  if (!response.ok) {
    throw new Error('Failed to start onboarding');
  }

  return response.json();
}

export async function saveOnboardingProgress(
  sessionId: string,
  stepNumber: number,
  answers: Partial<OnboardingAnswers>
): Promise<OnboardingSession> {
  if (USE_MOCK) {
    // Mock: guardar en localStorage
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const session: OnboardingSession = {
      ...mockSession,
      session_id: sessionId,
      step_number: stepNumber,
      answers,
      updated_at: new Date().toISOString(),
    };

    localStorage.setItem('cerebrin_onboarding_session', JSON.stringify(session));
    
    return session;
  }

  // Real API
  const response = await fetch(`/api/setup/session/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ step_number: stepNumber, answers }),
  });

  if (!response.ok) {
    throw new Error('Failed to save onboarding progress');
  }

  return response.json();
}

export async function confirmOnboarding(sessionId: string): Promise<{
  agent_id: string;
  agent_name: string;
  workspace_id: string;
  redirect_to: string;
}> {
  if (USE_MOCK) {
    // Mock: simular generación del agente
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const session = localStorage.getItem('cerebrin_onboarding_session');
    const parsedSession: OnboardingSession | null = session ? JSON.parse(session) : null;
    
    const agentConfig = parsedSession?.answers 
      ? generateMockAgentConfig(parsedSession.answers as OnboardingAnswers)
      : { name: 'Mi Asistente IA', type: 'CONTENT', hitl_level: 'operator', initial_skills: [], resonance_score: 30 };

    // Marcar onboarding como completado
    localStorage.setItem('cerebrin_onboarding_completed', 'true');
    localStorage.removeItem('cerebrin_onboarding_session');

    return {
      agent_id: 'mock-agent-456',
      agent_name: agentConfig.name,
      workspace_id: 'mock-workspace-123',
      redirect_to: '/cockpit',
    };
  }

  // Real API
  const response = await fetch(`/api/setup/session/${sessionId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmed: true }),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm onboarding');
  }

  return response.json();
}

export async function resumeOnboarding(userId: string): Promise<OnboardingSession | null> {
  if (USE_MOCK) {
    // Mock: recuperar de localStorage
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const session = localStorage.getItem('cerebrin_onboarding_session');
    return session ? JSON.parse(session) : null;
  }

  // Real API
  const response = await fetch(`/api/setup/session/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (response.status === 404) {
    return null; // No hay sesión guardada
  }

  if (!response.ok) {
    throw new Error('Failed to resume onboarding');
  }

  const session = await response.json();
  return session.completed ? null : session;
}

export function isOnboardingCompleted(): boolean {
  return localStorage.getItem('cerebrin_onboarding_completed') === 'true';
}

export function resetOnboarding(): void {
  localStorage.removeItem('cerebrin_onboarding_completed');
  localStorage.removeItem('cerebrin_onboarding_session');
}
