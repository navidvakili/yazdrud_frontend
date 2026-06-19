// ============================================================
// API Service — ارتباط با بک‌اند لاراول
// ============================================================

import type { AuthResponse, LoginCredentials, User } from '@/src/types';

const API_BASE = 'http://localhost:8000/api';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    return localStorage.getItem('portal_token');
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

    // Handle 401 Unauthorized
    if (response.status === 401) {
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
    const data = await this.request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    // Store token and user
    localStorage.setItem('portal_token', data.token);
    localStorage.setItem('portal_user', JSON.stringify(data.user));
    return data;
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
    return this.request<User>('/user');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: newPassword,
      }),
    });
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
}

export const api = new ApiService(API_BASE);
export default api;
