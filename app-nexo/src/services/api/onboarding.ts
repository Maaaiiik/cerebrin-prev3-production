/**
 * Onboarding Service - API calls para proceso de onboarding
 * Cerebrin v3.0
 */

import { apiClient } from './client';
import {
  CompleteOnboardingRequest,
  CompleteOnboardingResponse,
  ProfileType,
} from '../types/api-types';

// ============================================================
// ONBOARDING STATUS
// ============================================================

/**
 * Verifica si el usuario completó el onboarding
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const response = await apiClient.get<{ completed: boolean }>('/onboarding/status');
    return response.completed;
  } catch (error) {
    // Si falla, asumimos que no está completado
    return false;
  }
}

/**
 * Obtiene el progreso del onboarding
 */
export async function getOnboardingProgress(): Promise<{
  completed: boolean;
  current_step: number;
  total_steps: number;
  profile_type?: ProfileType;
}> {
  return apiClient.get('/onboarding/progress');
}

// ============================================================
// COMPLETE ONBOARDING
// ============================================================

/**
 * Completa el proceso de onboarding
 */
export async function completeOnboarding(
  request: CompleteOnboardingRequest
): Promise<CompleteOnboardingResponse> {
  return apiClient.post<CompleteOnboardingResponse>('/onboarding/complete', request);
}

/**
 * Completa onboarding con perfil específico
 */
export async function completeOnboardingWithProfile(
  profileType: ProfileType,
  name: string,
  goals?: string[]
): Promise<CompleteOnboardingResponse> {
  return completeOnboarding({
    profile_type: profileType,
    name,
    goals,
  });
}

// ============================================================
// PROFILE TEMPLATES
// ============================================================

/**
 * Obtiene la plantilla de automatizaciones para un perfil
 */
export async function getProfileTemplate(
  profileType: ProfileType
): Promise<{
  profile_type: ProfileType;
  name: string;
  description: string;
  automations: any[];
  suggested_integrations: string[];
}> {
  return apiClient.get(`/onboarding/templates/${profileType}`);
}

/**
 * Obtiene todas las plantillas disponibles
 */
export async function getAllProfileTemplates(): Promise<any[]> {
  return apiClient.get('/onboarding/templates');
}

// ============================================================
// SKIP ONBOARDING
// ============================================================

/**
 * Salta el onboarding (modo exploración)
 */
export async function skipOnboarding(): Promise<{ success: boolean }> {
  return apiClient.post('/onboarding/skip');
}

// ============================================================
// RESET ONBOARDING
// ============================================================

/**
 * Reinicia el onboarding (solo para testing/desarrollo)
 */
export async function resetOnboarding(): Promise<{ success: boolean }> {
  return apiClient.post('/onboarding/reset');
}
