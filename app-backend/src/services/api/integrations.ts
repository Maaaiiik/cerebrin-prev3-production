/**
 * Integrations Service - API calls para integraciones (Gmail, Calendar, Telegram)
 * Cerebrin v3.0
 */

import { apiClient } from './client';
import {
  Integration,
  ConnectIntegrationRequest,
  ConnectIntegrationResponse,
  DisconnectIntegrationRequest,
} from '../types/api-types';

// ============================================================
// GET INTEGRATIONS
// ============================================================

/**
 * Obtiene todas las integraciones del usuario
 */
export async function getIntegrations(): Promise<Integration[]> {
  return apiClient.get<Integration[]>('/integrations');
}

/**
 * Obtiene una integración específica por servicio
 */
export async function getIntegrationByService(
  serviceName: 'gmail' | 'calendar' | 'telegram'
): Promise<Integration | null> {
  try {
    return await apiClient.get<Integration>(`/integrations/${serviceName}`);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Verifica si un servicio está conectado
 */
export async function isServiceConnected(
  serviceName: 'gmail' | 'calendar' | 'telegram'
): Promise<boolean> {
  const integration = await getIntegrationByService(serviceName);
  return integration?.status === 'connected';
}

// ============================================================
// CONNECT INTEGRATION
// ============================================================

/**
 * Inicia el proceso de conexión de una integración
 * - Para OAuth (Gmail, Calendar): Retorna redirect_url
 * - Para Telegram: Envía credentials directamente
 */
export async function connectIntegration(
  request: ConnectIntegrationRequest
): Promise<ConnectIntegrationResponse> {
  return apiClient.post<ConnectIntegrationResponse>('/integrations/connect', request);
}

/**
 * Conecta Gmail (OAuth flow)
 */
export async function connectGmail(): Promise<ConnectIntegrationResponse> {
  return connectIntegration({ service_name: 'gmail' });
}

/**
 * Conecta Google Calendar (OAuth flow)
 */
export async function connectCalendar(): Promise<ConnectIntegrationResponse> {
  return connectIntegration({ service_name: 'calendar' });
}

/**
 * Conecta Telegram con bot token
 */
export async function connectTelegram(botToken: string): Promise<ConnectIntegrationResponse> {
  return connectIntegration({
    service_name: 'telegram',
    credentials: { bot_token: botToken }
  });
}

// ============================================================
// DISCONNECT INTEGRATION
// ============================================================

/**
 * Desconecta una integración
 */
export async function disconnectIntegration(
  serviceName: 'gmail' | 'calendar' | 'telegram'
): Promise<{ success: boolean }> {
  const request: DisconnectIntegrationRequest = { service_name: serviceName };
  return apiClient.post<{ success: boolean }>('/integrations/disconnect', request);
}

/**
 * Desconecta Gmail
 */
export async function disconnectGmail(): Promise<{ success: boolean }> {
  return disconnectIntegration('gmail');
}

/**
 * Desconecta Calendar
 */
export async function disconnectCalendar(): Promise<{ success: boolean }> {
  return disconnectIntegration('calendar');
}

/**
 * Desconecta Telegram
 */
export async function disconnectTelegram(): Promise<{ success: boolean }> {
  return disconnectIntegration('telegram');
}

// ============================================================
// OAUTH CALLBACK
// ============================================================

/**
 * Completa el flujo OAuth con el código recibido
 */
export async function completeOAuthFlow(
  serviceName: 'gmail' | 'calendar',
  authCode: string
): Promise<ConnectIntegrationResponse> {
  return apiClient.post<ConnectIntegrationResponse>('/integrations/oauth/callback', {
    service_name: serviceName,
    auth_code: authCode,
  });
}

// ============================================================
// REFRESH & SYNC
// ============================================================

/**
 * Refresca el token de una integración
 */
export async function refreshIntegrationToken(
  serviceName: 'gmail' | 'calendar' | 'telegram'
): Promise<Integration> {
  return apiClient.post<Integration>(`/integrations/${serviceName}/refresh`);
}

/**
 * Sincroniza datos de una integración
 */
export async function syncIntegration(
  serviceName: 'gmail' | 'calendar' | 'telegram'
): Promise<{ success: boolean; synced_count: number }> {
  return apiClient.post(`/integrations/${serviceName}/sync`);
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Obtiene el estado de todas las integraciones como objeto
 */
export async function getIntegrationStatuses(): Promise<{
  gmail: boolean;
  calendar: boolean;
  telegram: boolean;
}> {
  const integrations = await getIntegrations();
  
  return {
    gmail: integrations.find(i => i.service_name === 'gmail')?.status === 'connected' || false,
    calendar: integrations.find(i => i.service_name === 'calendar')?.status === 'connected' || false,
    telegram: integrations.find(i => i.service_name === 'telegram')?.status === 'connected' || false,
  };
}
