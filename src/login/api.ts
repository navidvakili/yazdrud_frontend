// ============================================================
// Login API — توابع API مربوط به احراز هویت
// ============================================================

import { API, getAvatarUrl, getBrowserFingerprint } from '@/src/shared-utils';
import { TOKEN_STRING, USER_STRING } from '@/src/shared-constants';
import type { ActiveSession, AdminSession, UserSessionsResponse, AdminSessionsResponse } from '@/src/shared-types';
import type { User, LoginCredentials, AuthResponse, CreateWarningResponse, WarningStatusResponse, WarningInfo } from './types';

/**
 * Map backend user format to frontend User type.
 * Backend returns: { username, fname, lname, full_name, kodmeli, mobile, email, role, roles, sign, ... }
 * Frontend expects: { username, fname, lname, name, kodmeli, mobile, email, role, avatar, ... }
 */
function mapBackendUser(backendUser: any): User {
  const name = backendUser.full_name || `${backendUser.fname || ''} ${backendUser.lname || ''}`.trim();
  const avatar = getAvatarUrl(backendUser.sign);

  return {
    username: backendUser.username || '',
    fname: backendUser.fname || '',
    lname: backendUser.lname || '',
    kodmeli: backendUser.kodmeli || '',
    mobile: backendUser.mobile || '',
    email: backendUser.email || '',
    role: backendUser.role || 'student',
    roles: backendUser.roles || [],
    sign: backendUser.sign || null,
    name,
    avatar,
  } as User;
}

export const loginApi = {
  // ========== Authentication ==========

  /**
   * Login with username and password.
   * Stores token and user in localStorage on success.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { force, ...payload } = credentials;
    const fingerprint = getBrowserFingerprint();
    const data = await API<any>('login', { ...payload, force, browser_fingerprint: fingerprint }, 'POST');
    const responseData = data.data;
    const user = mapBackendUser(responseData.user);
    const token: string = responseData.access_token;
    localStorage.setItem(TOKEN_STRING, token);
    localStorage.setItem(USER_STRING, JSON.stringify(user));
    return { token, user } as AuthResponse;
  },

  /**
   * Logout and clear stored credentials.
   */
  async logout(): Promise<void> {
    try {
      await API('logout', {}, 'POST');
    } finally {
      localStorage.removeItem(TOKEN_STRING);
      localStorage.removeItem(USER_STRING);
    }
  },

  /**
   * Fetch the current user's profile from the backend.
   */
  async getUser(): Promise<User> {
    const data = await API<any>('user');
    return mapBackendUser(data.data);
  },

  /**
   * Update the user's profile.
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    const data = await API<any>('user/profile', profileData, 'PUT');
    return mapBackendUser(data.data);
  },

  /**
   * Change the user's password.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const data = await API<any>('user/password', {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword,
    }, 'PUT');
    return data;
  },

  /**
   * Verify user's current password (for standby unlock).
   * Returns true if password is correct, false otherwise.
   */
  async verifyPassword(password: string): Promise<boolean> {
    try {
      await API<any>('user/verify-password', { password }, 'POST');
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Switch the user's active (primary) role.
   */
  async switchRole(role: string): Promise<User> {
    const data = await API<any>('user/switch-role', { role }, 'PUT');
    const updatedUser = mapBackendUser(data.data);
    localStorage.setItem(USER_STRING, JSON.stringify(updatedUser));
    return updatedUser;
  },

  /**
   * Save the user's theme preference to the backend.
   */
  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    await API('user/theme', { theme }, 'PUT');
  },

  // ========== Session Management (localStorage) ==========

  getStoredUser(): User | null {
    const stored = localStorage.getItem(USER_STRING);
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }
    return null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STRING);
  },

  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredUser();
  },

  // ========== Active Sessions Management ==========

  /**
   * Get current user's active sessions.
   */
  async getActiveSessions(): Promise<UserSessionsResponse> {
    const data = await API<any>('user/sessions');
    return data;
  },

  /**
   * Revoke a specific session (token) for the current user.
   */
  async revokeSession(tokenId: string): Promise<{ message: string }> {
    const data = await API<any>(`user/sessions/${tokenId}/revoke`, {}, 'POST');
    return data;
  },

  /**
   * Admin: Get all active sessions across all users.
   */
  async getAllActiveSessions(): Promise<AdminSessionsResponse> {
    const data = await API<any>('admin/sessions');
    return data;
  },

  /**
   * Admin: Revoke any user's session.
   */
  async adminRevokeSession(tokenId: string): Promise<{ message: string }> {
    const data = await API<any>(`admin/sessions/${tokenId}/revoke`, {}, 'POST');
    return data;
  },

  // ========== Session Warnings (Concurrent Login) ==========

  /**
   * Create a session warning for concurrent login attempt (unauthenticated).
   * Returns warning_id and poll_token. Sends browser fingerprint data.
   */
  async createSessionWarning(username: string, password: string, browserFingerprint?: string): Promise<CreateWarningResponse> {
    const data = await API<any>('session-warnings', { username, password, browser_fingerprint: browserFingerprint }, 'POST');
    return data.data as CreateWarningResponse;
  },

  /**
   * Check the status of a session warning (unauthenticated, uses poll_token as query param).
   */
  async checkSessionWarningStatus(warningId: number, pollToken: string): Promise<WarningStatusResponse> {
    const data = await API<any>(`session-warnings/${warningId}/status?poll_token=${encodeURIComponent(pollToken)}`, {}, 'GET');
    return data.data as WarningStatusResponse;
  },

  /**
   * Get pending warnings for the current user (authenticated, old session polling).
   */
  async getPendingWarnings(): Promise<WarningInfo[]> {
    const data = await API<any>('session-warnings/pending');
    return data.data as WarningInfo[];
  },

  /**
   * Respond to a session warning (accept or reject) - authenticated.
   */
  async respondToWarning(warningId: number, status: 'accepted' | 'rejected'): Promise<void> {
    await API(`session-warnings/${warningId}/respond`, { status }, 'POST');
  },

  /**
   * Login after warning accepted — creates a new token without revoking old ones.
   * Called by Browser 2 after Browser 1 has accepted the parallel session warning.
   */
  async sessionWarningLogin(warningId: number, pollToken: string, browserFingerprint?: string): Promise<AuthResponse> {
    const data = await API<any>('session-warnings/login', {
      warning_id: warningId,
      poll_token: pollToken,
      browser_fingerprint: browserFingerprint,
    }, 'POST');
    const responseData = data.data;
    const user = mapBackendUser(responseData.user);
    const token: string = responseData.access_token;
    localStorage.setItem(TOKEN_STRING, token);
    localStorage.setItem(USER_STRING, JSON.stringify(user));
    return { token, user } as AuthResponse;
  },
};
