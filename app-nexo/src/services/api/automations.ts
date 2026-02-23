/**
 * Automations Service - API calls para automatizaciones
 * Cerebrin v3.0
 */

import { apiClient } from './client';
import {
  Automation,
  AutomationStats,
  ToggleAutomationRequest,
  ToggleAutomationResponse,
} from '../types/api-types';

// ============================================================
// GET AUTOMATIONS
// ============================================================

/**
 * Obtiene todas las automatizaciones del usuario
 */
export async function getAutomations(): Promise<Automation[]> {
  return apiClient.get<Automation[]>('/automations');
}

/**
 * Obtiene una automatización específica por ID
 */
export async function getAutomationById(id: string): Promise<Automation> {
  return apiClient.get<Automation>(`/automations/${id}`);
}

/**
 * Obtiene estadísticas de automatizaciones
 */
export async function getAutomationStats(): Promise<AutomationStats> {
  return apiClient.get<AutomationStats>('/automations/stats');
}

// ============================================================
// TOGGLE AUTOMATION
// ============================================================

/**
 * Activa o pausa una automatización
 */
export async function toggleAutomation(
  automationId: string,
  status: 'active' | 'paused'
): Promise<ToggleAutomationResponse> {
  const request: ToggleAutomationRequest = {
    automation_id: automationId,
    status,
  };

  return apiClient.post<ToggleAutomationResponse>(
    `/automations/${automationId}/toggle`,
    request
  );
}

/**
 * Activa una automatización (helper)
 */
export async function activateAutomation(automationId: string): Promise<ToggleAutomationResponse> {
  return toggleAutomation(automationId, 'active');
}

/**
 * Pausa una automatización (helper)
 */
export async function pauseAutomation(automationId: string): Promise<ToggleAutomationResponse> {
  return toggleAutomation(automationId, 'paused');
}

// ============================================================
// BULK OPERATIONS
// ============================================================

/**
 * Activa múltiples automatizaciones
 */
export async function activateMultipleAutomations(
  automationIds: string[]
): Promise<ToggleAutomationResponse[]> {
  return Promise.all(
    automationIds.map(id => activateAutomation(id))
  );
}

/**
 * Pausa múltiples automatizaciones
 */
export async function pauseMultipleAutomations(
  automationIds: string[]
): Promise<ToggleAutomationResponse[]> {
  return Promise.all(
    automationIds.map(id => pauseAutomation(id))
  );
}

// ============================================================
// CONFIGURATION
// ============================================================

/**
 * Actualiza la configuración de una automatización
 */
export async function updateAutomationConfig(
  automationId: string,
  config: Record<string, any>
): Promise<Automation> {
  return apiClient.patch<Automation>(
    `/automations/${automationId}/config`,
    { config }
  );
}

// ============================================================
// TESTING & EXECUTION
// ============================================================

/**
 * Ejecuta una automatización manualmente (testing)
 */
export async function executeAutomation(automationId: string): Promise<{
  success: boolean;
  execution_id: string;
  result: any;
}> {
  return apiClient.post(`/automations/${automationId}/execute`);
}

/**
 * Obtiene el historial de ejecuciones de una automatización
 */
export async function getAutomationExecutions(
  automationId: string,
  limit: number = 20
): Promise<any[]> {
  return apiClient.get(`/automations/${automationId}/executions`, {
    headers: { 'X-Limit': limit.toString() }
  });
}
