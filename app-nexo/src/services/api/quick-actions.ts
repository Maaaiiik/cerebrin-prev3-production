/**
 * Quick Actions Service - API calls para acciones rápidas
 * Cerebrin v3.0
 */

import { apiClient } from './client';
import {
  QuickActionRequest,
  QuickActionResponse,
} from '../types/api-types';

// ============================================================
// EXECUTE QUICK ACTION
// ============================================================

/**
 * Ejecuta una acción rápida genérica
 */
export async function executeQuickAction(
  request: QuickActionRequest
): Promise<QuickActionResponse> {
  return apiClient.post<QuickActionResponse>('/quick-actions', request);
}

// ============================================================
// VENDEDOR ACTIONS
// ============================================================

/**
 * Crea una nueva cotización
 */
export async function createCotizacion(data: {
  cliente: string;
  monto: string;
  descripcion: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'cotizacion',
    data,
  });
}

/**
 * Agenda un seguimiento
 */
export async function agendarSeguimiento(data: {
  cliente: string;
  fecha: string;
  notas: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'seguimiento',
    data,
  });
}

/**
 * Registra una venta
 */
export async function registrarVenta(data: {
  cliente: string;
  monto: string;
  producto: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'venta',
    data,
  });
}

// ============================================================
// ESTUDIANTE ACTIONS
// ============================================================

/**
 * Crea una nueva tarea
 */
export async function crearTarea(data: {
  titulo: string;
  materia: string;
  fecha: string;
  prioridad: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'tarea',
    data,
  });
}

/**
 * Registra apuntes
 */
export async function registrarApuntes(data: {
  materia: string;
  tema: string;
  contenido: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'apuntes',
    data,
  });
}

/**
 * Agenda una sesión de estudio
 */
export async function agendarEstudio(data: {
  materia: string;
  fecha: string;
  duracion: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'sesion_estudio',
    data,
  });
}

// ============================================================
// FREELANCER ACTIONS
// ============================================================

/**
 * Crea un nuevo proyecto
 */
export async function crearProyecto(data: {
  nombre: string;
  cliente: string;
  presupuesto: string;
  deadline: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'proyecto',
    data,
  });
}

/**
 * Registra horas trabajadas
 */
export async function registrarHoras(data: {
  proyecto: string;
  horas: string;
  descripcion: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'horas',
    data,
  });
}

/**
 * Crea una factura
 */
export async function crearFactura(data: {
  cliente: string;
  monto: string;
  concepto: string;
  fecha: string;
}): Promise<QuickActionResponse> {
  return executeQuickAction({
    action_type: 'factura',
    data,
  });
}

// ============================================================
// GET QUICK ACTIONS
// ============================================================

/**
 * Obtiene las acciones rápidas disponibles para el perfil actual
 */
export async function getAvailableQuickActions(): Promise<{
  actions: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    icon: string;
    fields: Array<{
      name: string;
      label: string;
      type: string;
      required: boolean;
      placeholder?: string;
    }>;
  }>;
}> {
  return apiClient.get('/quick-actions/available');
}

// ============================================================
// HISTORY
// ============================================================

/**
 * Obtiene el historial de acciones rápidas ejecutadas
 */
export async function getQuickActionsHistory(
  limit: number = 20
): Promise<Array<{
  id: string;
  action_type: string;
  data: Record<string, any>;
  created_at: string;
}>> {
  return apiClient.get(`/quick-actions/history?limit=${limit}`);
}
