// ============================================================
// API Service — ارتباط با بک‌اند لاراول
// ============================================================

import { API, APISendFiles, getAvatarUrl, getBrowserFingerprint } from '@/src/shared-utils';
import { API_BASE_URL, TOKEN_STRING, USER_STRING } from '@/src/shared-constants';
import type { AuthResponse, LoginCredentials, User, UserRole, NavItem, NavResponse, UserRolesResponse, PermissionsResponse, RoleInfo, PermissionItem, Course, CourseGroup, CourseRegistration, CourseStats, DetailedCourseStats, CourseSurvey, CourseSurveyStats, CourseCoupon, Instructor, ActiveSession, AdminSession, UserSessionsResponse, AdminSessionsResponse } from '@/src/shared-types';

class ApiService {
  /**
   * Map backend user format to frontend User type.
   * Backend returns: { username, fname, lname, full_name, kodmeli, mobile, email, role, roles, sign, ... }
   * Frontend expects: { username, fname, lname, name, kodmeli, mobile, email, role, avatar, ... }
   */
  private mapBackendUser(backendUser: any): User {
    const name = backendUser.full_name || `${backendUser.fname || ''} ${backendUser.lname || ''}`.trim();
    // Build avatar URL: use backend sign if available, otherwise use local default avatar
    const avatar = getAvatarUrl(backendUser.sign);

    return {
      username: backendUser.username || '',
      fname: backendUser.fname || '',
      lname: backendUser.lname || '',
      kodmeli: backendUser.kodmeli || '',
      mobile: backendUser.mobile || '',
      email: backendUser.email || '',
      role: (backendUser.role as UserRole) || 'student',
      roles: backendUser.roles || [],
      sign: backendUser.sign || null,
      name,
      avatar,
    };
  }

  // ========== Authentication ==========

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Remove force from payload, pass as separate flag if needed
    const { force, ...payload } = credentials;
    // Collect browser fingerprint and send to backend
    const fingerprint = getBrowserFingerprint();
    // Backend expects force as a form param
    const data = await API<any>('login', { ...payload, force, browser_fingerprint: fingerprint }, 'POST');
    // Backend returns: { message: "...", data: { user: {...}, access_token: "...", token_type: "..." } }
    const responseData = data.data;
    const user = this.mapBackendUser(responseData.user);
    const token: string = responseData.access_token;
    // Store token and user
    localStorage.setItem(TOKEN_STRING, token);
    localStorage.setItem(USER_STRING, JSON.stringify(user));
    return { token, user };
  }

  async logout(): Promise<void> {
    try {
      await API('logout', {}, 'POST');
    } finally {
      localStorage.removeItem(TOKEN_STRING);
      localStorage.removeItem(USER_STRING);
    }
  }

  async getUser(): Promise<User> {
    const data = await API<any>('user');
    // Backend returns: { data: { username, fname, ... } }
    return this.mapBackendUser(data.data);
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const data = await API<any>('user/profile', profileData, 'PUT');
    return this.mapBackendUser(data.data);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const data = await API<any>('user/password', {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: newPassword,
    }, 'PUT');
    return data;
  }

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
  }

  // ========== Restore session from localStorage ==========

  getStoredUser(): User | null {
    const stored = localStorage.getItem(USER_STRING);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  getStoredToken(): string | null {
    return localStorage.getItem(TOKEN_STRING);
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken() && !!this.getStoredUser();
  }

  // ========== Navigation & Permissions ==========

  /**
   * Fetch the hierarchical navigation menu for the current user.
   * The backend filters menu items based on user roles automatically.
   */
  async getNavigation(): Promise<NavItem[]> {
    const data = await API<NavResponse>('navigation');
    return data.data;
  }

  /**
   * Fetch the current user's roles (primary + all roles from roles table).
   */
  async getUserRoles(): Promise<{ primary_role: string; all_roles: RoleInfo[] }> {
    const data = await API<UserRolesResponse>('user/roles');
    return data.data;
  }

  /**
   * Fetch all permission entries for the current user.
   */
  async getUserPermissions(): Promise<PermissionItem[]> {
    const data = await API<PermissionsResponse>('user/permissions');
    return data.data;
  }

  /**
   * Switch the user's active (primary) role.
   * The role must exist in the user's roles table.
   */
  async switchRole(role: string): Promise<User> {
    const data = await API<any>('user/switch-role', { role }, 'PUT');
    // data.data contains the updated user from formatUser
    const updatedUser = this.mapBackendUser(data.data);
    // Update localStorage with new user info
    localStorage.setItem(USER_STRING, JSON.stringify(updatedUser));
    return updatedUser;
  }

  // ========== User Theme Preference ==========

  /**
   * Save the user's theme preference to the backend.
   */
  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    await API('user/theme', { theme }, 'PUT');
  }

  // ========== Session Warnings (Concurrent Login) ==========

  /**
   * Create a session warning for concurrent login attempt (unauthenticated).
   * Returns warning_id and poll_token. Sends browser fingerprint data.
   */
  async createSessionWarning(username: string, password: string, browserFingerprint?: string): Promise<{ warning_id: number; poll_token: string }> {
    const data = await API<any>('session-warnings', { username, password, browser_fingerprint: browserFingerprint }, 'POST');
    return data.data;
  }

  /**
   * Check the status of a session warning (unauthenticated, uses poll_token as query param).
   */
  async checkSessionWarningStatus(warningId: number, pollToken: string): Promise<{ status: string }> {
    const data = await API<any>(`session-warnings/${warningId}/status?poll_token=${encodeURIComponent(pollToken)}`, {}, 'GET');
    return data.data;
  }

  /**
   * Get pending warnings for the current user (authenticated, old session polling).
   * Each warning includes device info about the new login attempt.
   */
  async getPendingWarnings(): Promise<{
    id: number;
    created_at: string;
    ip_address: string | null;
    user_agent: string | null;
    browser_fingerprint: string | null;
  }[]> {
    const data = await API<any>('session-warnings/pending');
    return data.data;
  }

  /**
   * Respond to a session warning (accept or reject) - authenticated.
   */
  async respondToWarning(warningId: number, status: 'accepted' | 'rejected'): Promise<void> {
    await API(`session-warnings/${warningId}/respond`, { status }, 'POST');
  }

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
    const user = this.mapBackendUser(responseData.user);
    const token: string = responseData.access_token;
    localStorage.setItem(TOKEN_STRING, token);
    localStorage.setItem(USER_STRING, JSON.stringify(user));
    return { token, user };
  }

  // ========== Active Sessions Management ==========

  /**
   * Get current user's active sessions.
   */
  async getActiveSessions(): Promise<UserSessionsResponse> {
    const data = await API<any>('user/sessions');
    return data;
  }

  /**
   * Revoke a specific session (token) for the current user.
   */
  async revokeSession(tokenId: string): Promise<{ message: string }> {
    const data = await API<any>(`user/sessions/${tokenId}/revoke`, {}, 'POST');
    return data;
  }

  /**
   * Admin: Get all active sessions across all users.
   */
  async getAllActiveSessions(): Promise<AdminSessionsResponse> {
    const data = await API<any>('admin/sessions');
    return data;
  }

  /**
   * Admin: Revoke any user's session.
   */
  async adminRevokeSession(tokenId: string): Promise<{ message: string }> {
    const data = await API<any>(`admin/sessions/${tokenId}/revoke`, {}, 'POST');
    return data;
  }
}

export const api = new ApiService();
export default api;
