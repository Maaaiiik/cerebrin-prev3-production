/**
 * useActivity Hook - Manejo de actividad con filtros y búsqueda
 * Cerebrin v3.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ActivityFilters,
  ActivityType,
  ApiError,
} from '../services/api';
import { getActivities } from '../services/api/activity';

// ============================================================
// HOOK
// ============================================================

export function useActivity(initialFilters: ActivityFilters = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<ActivityFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load activities when filters change
  useEffect(() => {
    loadActivities();
  }, [filters]);

  async function loadActivities() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getActivities(filters);
      setActivities(response.activities);
      setTotalCount(response.total_count);
      setHasMore(response.has_more);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Error al cargar actividad');
      console.error('Failed to load activities:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const setTypeFilter = useCallback((type: ActivityType | 'all') => {
    setFilters(prev => ({ ...prev, type, offset: 0 }));
  }, []);

  const setSearchFilter = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search, offset: 0 }));
  }, []);

  const setDateRange = useCallback((dateFrom?: string, dateTo?: string) => {
    setFilters(prev => ({ ...prev, date_from: dateFrom, date_to: dateTo, offset: 0 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ limit: initialFilters.limit || 20 });
  }, [initialFilters.limit]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    const newOffset = (filters.offset || 0) + (filters.limit || 20);
    const newFilters = { ...filters, offset: newOffset };

    try {
      const response = await getActivities(newFilters);
      setActivities(prev => [...prev, ...response.activities]);
      setTotalCount(response.total_count);
      setHasMore(response.has_more);
      setFilters(newFilters);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Error al cargar más actividad');
    }
  }, [filters, hasMore, isLoading]);

  const refresh = useCallback(async () => {
    setFilters(prev => ({ ...prev, offset: 0 }));
    await loadActivities();
  }, []);

  return {
    activities,
    totalCount,
    hasMore,
    filters,
    isLoading,
    error,
    setTypeFilter,
    setSearchFilter,
    setDateRange,
    clearFilters,
    loadMore,
    refresh,
  };
}

// ============================================================
// FILTERED HOOKS
// ============================================================

export function useAutomationActivity(limit: number = 20) {
  return useActivity({ type: 'automation', limit });
}

export function useManualActivity(limit: number = 20) {
  return useActivity({ type: 'manual', limit });
}
