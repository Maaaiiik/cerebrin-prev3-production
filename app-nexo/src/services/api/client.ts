/**
 * API Client - Base HTTP client con manejo de errores, auth, y retry logic
 * Cerebrin v3.0
 */

import { ApiError, ApiResponse } from '../types/api-types';

// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v3';
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// ============================================================
// TYPES
// ============================================================

interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: boolean;
  retries?: number;
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: boolean;
}

// ============================================================
// AUTH TOKEN MANAGEMENT
// ============================================================

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('auth_token');
  }
  return authToken;
}

export function clearAuthToken() {
  setAuthToken(null);
}

// ============================================================
// REQUEST HELPERS
// ============================================================

function getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function fetchWithTimeout(
  url: string,
  config: RequestConfig
): Promise<Response> {
  const timeout = config.timeout || API_TIMEOUT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout', 'TIMEOUT', 408);
    }
    throw error;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// RESPONSE HANDLERS
// ============================================================

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    let errorData: any = null;

    if (isJson) {
      try {
        errorData = await response.json();
      } catch {
        // Ignore parse errors
      }
    }

    const message = errorData?.error?.message || errorData?.message || response.statusText;
    const code = errorData?.error?.code || 'UNKNOWN_ERROR';
    const details = errorData?.error?.details;

    throw new ApiError(message, code, response.status, details);
  }

  if (isJson) {
    const data: ApiResponse<T> = await response.json();
    
    if (!data.success && data.error) {
      throw new ApiError(
        data.error.message,
        data.error.code,
        response.status,
        data.error.details
      );
    }

    return data.data as T;
  }

  // Non-JSON response (should be rare)
  return {} as T;
}

// ============================================================
// MAIN REQUEST FUNCTION
// ============================================================

async function request<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers: customHeaders,
    timeout = API_TIMEOUT,
    retry = true,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = getHeaders(customHeaders);

  const config: RequestConfig = {
    method,
    headers,
    timeout,
    retry,
    retries: 0,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let lastError: Error | null = null;
  const maxAttempts = retry ? MAX_RETRIES : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, config);
      return await handleResponse<T>(response);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) or auth errors
      if (error instanceof ApiError) {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }
      }

      // Retry on network errors or 5xx errors
      if (attempt < maxAttempts - 1) {
        await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new ApiError('Request failed', 'UNKNOWN_ERROR', 500);
}

// ============================================================
// CONVENIENCE METHODS
// ============================================================

export const apiClient = {
  get: <T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post: <T>(endpoint: string, body?: any, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'POST', body });
  },

  put: <T>(endpoint: string, body?: any, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'PUT', body });
  },

  patch: <T>(endpoint: string, body?: any, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'PATCH', body });
  },

  delete: <T>(endpoint: string, options?: Omit<FetchOptions, 'method' | 'body'>): Promise<T> => {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};

// ============================================================
// INTERCEPTORS (for future use)
// ============================================================

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

export function addRequestInterceptor(interceptor: RequestInterceptor) {
  requestInterceptors.push(interceptor);
}

export function addResponseInterceptor(interceptor: ResponseInterceptor) {
  responseInterceptors.push(interceptor);
}

// ============================================================
// EXPORTS
// ============================================================

export { API_BASE_URL, ApiError };
export type { RequestConfig, FetchOptions };
