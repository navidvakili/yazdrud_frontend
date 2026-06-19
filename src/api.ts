// ============================================================
// API Service — ارتباط با بک‌اند لاراول
// ============================================================

import { API } from '@/src/lib/functions';
import { TOKEN_STRING, USER_STRING } from '@/src/lib/constants';
import type { AuthResponse, LoginCredentials, User, UserRole, NavResponse, UserRolesResponse, PermissionsResponse, RoleInfo } from '@/src/types';
import { getAvatarUrl } from '@/src/lib/functions';

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
    const data = await API<any>('login', credentials, 'POST');
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
}

export const api = new ApiService();
export default api;
