/**
 * useAutomations Hook - Manejo de automatizaciones con estados
 * Cerebrin v3.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Automation,
  AutomationStats,
  ApiError,
} from '../services/api';
import {
  getAutomations,
  getAutomationStats,
  toggleAutomation,
  activateAutomation,
  pauseAutomation,
} from '../services/api/automations';

// ============================================================
// HOOK
// ============================================================

export function useAutomations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load automations on mount
  useEffect(() => {
    loadAutomations();
    loadStats();
  }, []);

  async function loadAutomations() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getAutomations();
      setAutomations(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Error al cargar automatizaciones');
      console.error('Failed to load automations:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    try {
      const data = await getAutomationStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load automation stats:', err);
    }
  }

  const toggle = useCallback(async (
    automationId: string,
    status: 'active' | 'paused'
  ) => {
    try {
      const response = await toggleAutomation(automationId, status);
      
      // Update local state
      setAutomations(prev =>
        prev.map(auto =>
          auto.id === automationId ? response.automation : auto
        )
      );

      // Refresh stats
      await loadStats();

      return response;
    } catch (err) {
      const apiError = err as ApiError;
      throw new Error(apiError.message || 'Error al actualizar automatización');
    }
  }, []);

  const activate = useCallback(async (automationId: string) => {
    return toggle(automationId, 'active');
  }, [toggle]);

  const pause = useCallback(async (automationId: string) => {
    return toggle(automationId, 'paused');
  }, [toggle]);

  const refresh = useCallback(async () => {
    await Promise.all([loadAutomations(), loadStats()]);
  }, []);

  return {
    automations,
    stats,
    isLoading,
    error,
    toggle,
    activate,
    pause,
    refresh,
  };
}

// ============================================================
// SINGLE AUTOMATION HOOK
// ============================================================

export function useAutomation(automationId: string) {
  const { automations, isLoading, error, toggle, activate, pause } = useAutomations();
  
  const automation = automations.find(a => a.id === automationId);

  return {
    automation,
    isLoading,
    error,
    toggle: (status: 'active' | 'paused') => toggle(automationId, status),
    activate: () => activate(automationId),
    pause: () => pause(automationId),
  };
}
