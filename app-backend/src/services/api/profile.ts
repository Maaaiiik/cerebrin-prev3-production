/**
 * Profile & Settings Service - API calls para perfil y configuración de usuario
 * Cerebrin v3.0
 */

import { apiClient } from './client';
import {
  User,
  ProfileSettings,
  UpdateProfileRequest,
  UpdateSettingsRequest,
  ChangePasswordRequest,
  Enable2FARequest,
  Enable2FAResponse,
  ProfileType,
} from '../types/api-types';

// ============================================================
// USER PROFILE
// ============================================================

/**
 * Obtiene el perfil del usuario actual
 */
export async function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/profile/me');
}

/**
 * Actualiza el perfil del usuario
 */
export async function updateProfile(
  updates: UpdateProfileRequest
): Promise<User> {
  return apiClient.patch<User>('/profile/me', updates);
}

/**
 * Actualiza el nombre del usuario
 */
export async function updateName(name: string): Promise<User> {
  return updateProfile({ name });
}

/**
 * Actualiza el avatar del usuario
 */
export async function updateAvatar(avatarUrl: string): Promise<User> {
  return updateProfile({ avatar_url: avatarUrl });
}

/**
 * Cambia el tipo de perfil (Vendedor, Estudiante, Freelancer)
 */
export async function changeProfileType(profileType: ProfileType): Promise<User> {
  return updateProfile({ profile_type: profileType });
}

// ============================================================
// SETTINGS
// ============================================================

/**
 * Obtiene la configuración del usuario
 */
export async function getSettings(): Promise<ProfileSettings> {
  return apiClient.get<ProfileSettings>('/profile/settings');
}

/**
 * Actualiza la configuración del usuario
 */
export async function updateSettings(
  updates: UpdateSettingsRequest
): Promise<ProfileSettings> {
  return apiClient.patch<ProfileSettings>('/profile/settings', updates);
}

/**
 * Actualiza preferencias de notificaciones
 */
export async function updateNotificationSettings(settings: {
  email?: boolean;
  reminders?: boolean;
  push?: boolean;
}): Promise<ProfileSettings> {
  return updateSettings({
    notifications_email: settings.email,
    notifications_reminders: settings.reminders,
    notifications_push: settings.push,
  });
}

/**
 * Cambia el tema (light/dark)
 */
export async function changeTheme(theme: 'light' | 'dark'): Promise<ProfileSettings> {
  return updateSettings({ theme });
}

/**
 * Cambia el idioma
 */
export async function changeLanguage(language: 'es' | 'en'): Promise<ProfileSettings> {
  return updateSettings({ language });
}

/**
 * Cambia la zona horaria
 */
export async function changeTimezone(timezone: string): Promise<ProfileSettings> {
  return updateSettings({ timezone });
}

// ============================================================
// SECURITY
// ============================================================

/**
 * Cambia la contraseña del usuario
 */
export async function changePassword(
  request: ChangePasswordRequest
): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>('/profile/security/password', request);
}

/**
 * Habilita autenticación de dos factores
 */
export async function enable2FA(
  request: Enable2FARequest
): Promise<Enable2FAResponse> {
  return apiClient.post<Enable2FAResponse>('/profile/security/2fa/enable', request);
}

/**
 * Deshabilita autenticación de dos factores
 */
export async function disable2FA(
  code: string
): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>('/profile/security/2fa/disable', { code });
}

/**
 * Verifica código 2FA
 */
export async function verify2FACode(
  code: string
): Promise<{ valid: boolean }> {
  return apiClient.post<{ valid: boolean }>('/profile/security/2fa/verify', { code });
}

/**
 * Obtiene códigos de backup 2FA
 */
export async function get2FABackupCodes(): Promise<{ codes: string[] }> {
  return apiClient.get<{ codes: string[] }>('/profile/security/2fa/backup-codes');
}

// ============================================================
// DATA & PRIVACY
// ============================================================

/**
 * Obtiene datos del usuario para exportación
 */
export async function exportUserData(): Promise<Blob> {
  // Special case: returns binary data
  const response = await fetch(`${apiClient}profile/data/export`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export data');
  }

  return response.blob();
}

/**
 * Solicita eliminación de cuenta
 */
export async function requestAccountDeletion(
  reason?: string
): Promise<{ success: boolean; deletion_scheduled_at: string }> {
  return apiClient.post('/profile/delete', { reason });
}

/**
 * Cancela solicitud de eliminación de cuenta
 */
export async function cancelAccountDeletion(): Promise<{ success: boolean }> {
  return apiClient.delete('/profile/delete');
}

// ============================================================
// AVATAR UPLOAD
// ============================================================

/**
 * Sube un avatar (imagen)
 */
export async function uploadAvatar(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch(`${apiClient}/profile/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload avatar');
  }

  return response.json();
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Obtiene perfil y settings en una sola llamada
 */
export async function getProfileAndSettings(): Promise<{
  user: User;
  settings: ProfileSettings;
}> {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getSettings(),
  ]);

  return { user, settings };
}
