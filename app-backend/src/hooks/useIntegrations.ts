/**
 * useIntegrations Hook - Manejo de integraciones con estados
 * Cerebrin v3.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Integration,
  ApiError,
} from '../services/api';
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  getIntegrationStatuses,
} from '../services/api/integrations';

// ============================================================
// HOOK
// ============================================================

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load integrations on mount
  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getIntegrations();
      setIntegrations(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Error al cargar integraciones');
      console.error('Failed to load integrations:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const connect = useCallback(async (
    serviceName: 'gmail' | 'calendar' | 'telegram',
    credentials?: Record<string, any>
  ) => {
    try {
      const response = await connectIntegration({
        service_name: serviceName,
        credentials,
      });

      // If OAuth redirect is needed
      if (response.redirect_url) {
        window.location.href = response.redirect_url;
        return response;
      }

      // Update local state
      await loadIntegrations();

      return response;
    } catch (err) {
      const apiError = err as ApiError;
      throw new Error(apiError.message || 'Error al conectar servicio');
    }
  }, []);

  const disconnect = useCallback(async (
    serviceName: 'gmail' | 'calendar' | 'telegram'
  ) => {
    try {
      await disconnectIntegration(serviceName);
      
      // Update local state
      await loadIntegrations();
    } catch (err) {
      const apiError = err as ApiError;
      throw new Error(apiError.message || 'Error al desconectar servicio');
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadIntegrations();
  }, []);

  const getStatus = useCallback((serviceName: 'gmail' | 'calendar' | 'telegram') => {
    const integration = integrations.find(i => i.service_name === serviceName);
    return integration?.status || 'disconnected';
  }, [integrations]);

  const isConnected = useCallback((serviceName: 'gmail' | 'calendar' | 'telegram') => {
    return getStatus(serviceName) === 'connected';
  }, [getStatus]);

  return {
    integrations,
    isLoading,
    error,
    connect,
    disconnect,
    refresh,
    getStatus,
    isConnected,
  };
}

// ============================================================
// SPECIFIC SERVICE HOOKS
// ============================================================

export function useGmailIntegration() {
  const { isConnected, connect, disconnect, isLoading, error } = useIntegrations();

  return {
    isConnected: isConnected('gmail'),
    connect: () => connect('gmail'),
    disconnect: () => disconnect('gmail'),
    isLoading,
    error,
  };
}

export function useCalendarIntegration() {
  const { isConnected, connect, disconnect, isLoading, error } = useIntegrations();

  return {
    isConnected: isConnected('calendar'),
    connect: () => connect('calendar'),
    disconnect: () => disconnect('calendar'),
    isLoading,
    error,
  };
}

export function useTelegramIntegration() {
  const { isConnected, connect, disconnect, isLoading, error } = useIntegrations();

  return {
    isConnected: isConnected('telegram'),
    connect: (botToken: string) => connect('telegram', { bot_token: botToken }),
    disconnect: () => disconnect('telegram'),
    isLoading,
    error,
  };
}
