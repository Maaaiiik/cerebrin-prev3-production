/**
 * Mock Adapter - Detecta si backend está disponible y usa mock data si no
 * Cerebrin v3.0
 */

import { ApiError } from './api/client';

// ============================================================
// CONFIGURATION
// ============================================================

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true' || true; // Default to mock mode
const BACKEND_CHECK_TIMEOUT = 3000; // 3 seconds

let backendAvailable: boolean | null = null;

// ============================================================
// BACKEND DETECTION
// ============================================================

/**
 * Verifica si el backend está disponible
 */
export async function checkBackendAvailability(): Promise<boolean> {
  if (MOCK_MODE) return false;
  if (backendAvailable !== null) return backendAvailable;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_CHECK_TIMEOUT);

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    backendAvailable = response.ok;
    return response.ok;
  } catch (error) {
    backendAvailable = false;
    return false;
  }
}

/**
 * Retorna si estamos en modo mock
 */
export function isMockMode(): boolean {
  return MOCK_MODE || backendAvailable === false;
}

// ============================================================
// MOCK DATA WRAPPER
// ============================================================

/**
 * Ejecuta una llamada real o retorna mock data
 */
export async function mockOrReal<T>(
  realFn: () => Promise<T>,
  mockData: T | (() => T),
  delay: number = 500
): Promise<T> {
  const isBackendAvailable = await checkBackendAvailability();

  if (isBackendAvailable) {
    // Try real call first
    try {
      return await realFn();
    } catch (error) {
      console.warn('Backend call failed, falling back to mock data:', error);
      // Fall through to mock data
    }
  }

  // Use mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = typeof mockData === 'function' ? mockData() : mockData;
      resolve(data);
    }, delay);
  });
}

/**
 * Simula una llamada API con mock data
 */
export async function simulateApiCall<T>(
  mockData: T | (() => T),
  delay: number = 500,
  shouldFail: boolean = false,
  errorMessage: string = 'Mock API call failed'
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new ApiError(errorMessage, 'MOCK_ERROR', 500));
      } else {
        const data = typeof mockData === 'function' ? mockData() : mockData;
        resolve(data);
      }
    }, delay);
  });
}

// ============================================================
// LOGGER
// ============================================================

export function logMockCall(serviceName: string, method: string) {
  if (isMockMode()) {
    console.log(`🔵 [MOCK] ${serviceName}.${method}()`);
  }
}
