// ============================================================
// API Service — ارتباط با بک‌اند لاراول
// ============================================================

import type { AuthResponse, LoginCredentials, User, UserRole, NavResponse, UserRolesResponse, PermissionsResponse } from '@/src/types';

const API_BASE = 'http://localhost:8000/api';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('portal_token');
  }

  /**
   * Map backend user format to frontend User type.
   * Backend returns: { username, fname, lname, full_name, kodmeli, mobile, email, role, roles, sign, ... }
   * Frontend expects: { username, fname, lname, name, kodmeli, mobile, email, role, avatar, ... }
   */
  private mapBackendUser(backendUser: any): User {
    const name = backendUser.full_name || `${backendUser.fname || ''} ${backendUser.lname || ''}`.trim();
    // Build avatar URL: use backend sign if available, otherwise use local default avatar
    let avatar = '/default-avatar.svg';
    if (backendUser.sign) {
      avatar = `http://localhost:8000/storage/signs/${backendUser.sign}`;
    }

    return {
      username: backendUser.username || '',
      fname: backendUser.fname || '',
      lname: backendUser.lname || '',
      kodmeli: backendUser.kodmeli || '',
      mobile: backendUser.mobile || '',
      email: backendUser.email || '',
      role: (backendUser.role as UserRole) || 'student',
      sign: backendUser.sign || null,
      name,
      avatar,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized — but NOT for login (let LoginForm handle it gracefully)
    if (response.status === 401 && !endpoint.includes('/login')) {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
      window.location.reload();
      throw new Error('جلسه کاربری شما منقضی شده است. لطفاً دوباره وارد شوید.');
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || 'خطایی در ارتباط با سرور رخ داد';
      const error = new Error(errorMessage) as any;
      error.status = response.status;
      error.errors = data.errors;
      throw error;
    }

    return data;
  }

  // ========== Authentication ==========

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const data = await this.request<any>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Backend returns: { message: "...", data: { user: {...}, access_token: "...", token_type: "..." } }
    const responseData = data.data;
    const user = this.mapBackendUser(responseData.user);
    const token: string = responseData.access_token;
    // Store token and user
    localStorage.setItem('portal_token', token);
    localStorage.setItem('portal_user', JSON.stringify(user));
    return { token, user };
  }

  async logout(): Promise<void> {
    try {
      await this.request('/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('portal_token');
      localStorage.removeItem('portal_user');
    }
  }

  async getUser(): Promise<User> {
    const data = await this.request<any>('/user');
    // Backend returns: { data: { username, fname, ... } }
    return this.mapBackendUser(data.data);
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const data = await this.request<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return this.mapBackendUser(data.data);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const data = await this.request<any>('/user/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      }),
    });
    return data;
  }

  // ========== Restore session from localStorage ==========

  getStoredUser(): User | null {
    const stored = localStorage.getItem('portal_user');
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
    return localStorage.getItem('portal_token');
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
    const data = await this.request<NavResponse>('/navigation');
    return data.data;
  }

  /**
   * Fetch the current user's roles (primary + all roles from roles table).
   */
  async getUserRoles(): Promise<{ primary_role: string; all_roles: string[] }> {
    const data = await this.request<UserRolesResponse>('/user/roles');
    return data.data;
  }

  /**
   * Fetch all permission entries for the current user.
   */
  async getUserPermissions(): Promise<PermissionItem[]> {
    const data = await this.request<PermissionsResponse>('/user/permissions');
    return data.data;
  }
}

export const api = new ApiService(API_BASE);
export default api;
