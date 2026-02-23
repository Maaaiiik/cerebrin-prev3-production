/**
 * Activity Service - API calls para timeline de actividad
 * Cerebrin v3.0
 */

import { apiClient } from './client';
import {
  Activity,
  ActivityFilters,
  ActivityResponse,
  ActivityType,
} from '../types/api-types';

// ============================================================
// GET ACTIVITIES
// ============================================================

/**
 * Obtiene actividades con filtros
 */
export async function getActivities(
  filters: ActivityFilters = {}
): Promise<ActivityResponse> {
  const params = new URLSearchParams();

  if (filters.type && filters.type !== 'all') {
    params.append('type', filters.type);
  }

  if (filters.search) {
    params.append('search', filters.search);
  }

  if (filters.limit) {
    params.append('limit', filters.limit.toString());
  }

  if (filters.offset) {
    params.append('offset', filters.offset.toString());
  }

  if (filters.date_from) {
    params.append('date_from', filters.date_from);
  }

  if (filters.date_to) {
    params.append('date_to', filters.date_to);
  }

  const query = params.toString();
  const endpoint = query ? `/activity?${query}` : '/activity';

  return apiClient.get<ActivityResponse>(endpoint);
}

/**
 * Obtiene todas las actividades (sin filtros)
 */
export async function getAllActivities(
  limit: number = 50
): Promise<ActivityResponse> {
  return getActivities({ limit });
}

/**
 * Obtiene solo actividades de automatizaciones
 */
export async function getAutomationActivities(
  limit: number = 50
): Promise<ActivityResponse> {
  return getActivities({ type: 'automation', limit });
}

/**
 * Obtiene solo actividades manuales
 */
export async function getManualActivities(
  limit: number = 50
): Promise<ActivityResponse> {
  return getActivities({ type: 'manual', limit });
}

/**
 * Busca actividades por texto
 */
export async function searchActivities(
  searchText: string,
  limit: number = 50
): Promise<ActivityResponse> {
  return getActivities({ search: searchText, limit });
}

/**
 * Busca actividades con filtro de tipo
 */
export async function searchActivitiesWithType(
  searchText: string,
  type: ActivityType | 'all',
  limit: number = 50
): Promise<ActivityResponse> {
  return getActivities({ search: searchText, type, limit });
}

// ============================================================
// GET ACTIVITY BY ID
// ============================================================

/**
 * Obtiene una actividad específica por ID
 */
export async function getActivityById(id: string): Promise<Activity> {
  return apiClient.get<Activity>(`/activity/${id}`);
}

// ============================================================
// CREATE ACTIVITY (Manual)
// ============================================================

/**
 * Crea una actividad manual
 */
export async function createActivity(
  title: string,
  description: string,
  metadata?: Record<string, any>
): Promise<Activity> {
  return apiClient.post<Activity>('/activity', {
    type: 'manual',
    title,
    description,
    metadata: metadata || {},
  });
}

// ============================================================
// PAGINATION
// ============================================================

/**
 * Obtiene la siguiente página de actividades
 */
export async function getNextActivitiesPage(
  currentOffset: number,
  limit: number = 20,
  filters?: Omit<ActivityFilters, 'offset' | 'limit'>
): Promise<ActivityResponse> {
  return getActivities({
    ...filters,
    offset: currentOffset + limit,
    limit,
  });
}

/**
 * Obtiene la página anterior de actividades
 */
export async function getPreviousActivitiesPage(
  currentOffset: number,
  limit: number = 20,
  filters?: Omit<ActivityFilters, 'offset' | 'limit'>
): Promise<ActivityResponse> {
  const offset = Math.max(0, currentOffset - limit);
  return getActivities({
    ...filters,
    offset,
    limit,
  });
}

// ============================================================
// STATS
// ============================================================

/**
 * Obtiene estadísticas de actividad
 */
export async function getActivityStats(): Promise<{
  total_count: number;
  automation_count: number;
  manual_count: number;
  today_count: number;
}> {
  return apiClient.get('/activity/stats');
}

// ============================================================
// REAL-TIME (preparado para SSE/WebSocket)
// ============================================================

/**
 * Subscribe to real-time activity updates (future implementation)
 * Placeholder para cuando implementen SSE o WebSocket
 */
export function subscribeToActivityUpdates(
  onActivity: (activity: Activity) => void,
  onError?: (error: Error) => void
): () => void {
  // TODO: Implementar SSE o WebSocket cuando backend esté listo
  console.log('Real-time activity subscription not yet implemented');
  
  // Return unsubscribe function
  return () => {
    console.log('Unsubscribed from activity updates');
  };
}
