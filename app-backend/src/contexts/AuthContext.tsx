/**
 * Auth Context - Manejo de autenticación y usuario actual
 * Cerebrin v3.0
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ProfileSettings } from '../services/types/api-types';
import { getCurrentUser, getSettings } from '../services/api/profile';
import { setAuthToken, clearAuthToken, getAuthToken } from '../services/api/client';

// ============================================================
// TYPES
// ============================================================

interface AuthContextType {
  user: User | null;
  settings: ProfileSettings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
  updateSettings: (settings: ProfileSettings) => void;
}

// ============================================================
// CONTEXT
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    const token = getAuthToken();
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      await loadUserData();
    } catch (err) {
      console.error('Failed to initialize auth:', err);
      clearAuthToken();
      setError('Sesión expirada. Por favor inicia sesión nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserData() {
    try {
      const [userData, settingsData] = await Promise.all([
        getCurrentUser(),
        getSettings(),
      ]);

      setUser(userData);
      setSettings(settingsData);
      setError(null);
    } catch (err: any) {
      throw err;
    }
  }

  async function login(token: string) {
    setIsLoading(true);
    setError(null);

    try {
      setAuthToken(token);
      await loadUserData();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      clearAuthToken();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    clearAuthToken();
    setUser(null);
    setSettings(null);
    setError(null);
  }

  async function refreshUser() {
    try {
      await loadUserData();
    } catch (err: any) {
      console.error('Failed to refresh user:', err);
      setError('Error al actualizar datos del usuario');
    }
  }

  function updateUser(updatedUser: User) {
    setUser(updatedUser);
  }

  function updateSettings(updatedSettings: ProfileSettings) {
    setSettings(updatedSettings);
  }

  const value: AuthContextType = {
    user,
    settings,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    updateUser,
    updateSettings,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Hook para requerir autenticación
 * Redirige al login si no está autenticado
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // TODO: Redirect to login page
      console.warn('User not authenticated');
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}
