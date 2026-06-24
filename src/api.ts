// ============================================================
// API Service — ارتباط با بک‌اند لاراول
// ============================================================

import { API } from '@/src/lib/functions';
import { TOKEN_STRING, USER_STRING } from '@/src/lib/constants';
import type { AuthResponse, LoginCredentials, User, UserRole, NavItem, NavResponse, UserRolesResponse, PermissionsResponse, RoleInfo, PermissionItem, Course, CourseRegistration, CourseStats } from '@/src/types';
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

  // ========== Courses (دوره‌های آموزشی) ==========

  /**
   * Get paginated list of courses.
   */
  async getCourses(params?: { active?: boolean; search?: string; page?: number; per_page?: number }): Promise<{ data: Course[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.set('active', String(params.active));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `courses?${qs}` : 'courses';
    return API<any>(url);
  }

  /**
   * Get a single course by ID.
   */
  async getCourse(id: number): Promise<Course> {
    const data = await API<any>(`courses/${id}`);
    return data.data;
  }

  /**
   * Create a new course.
   */
  async createCourse(courseData: any): Promise<Course> {
    const data = await API<any>('courses', courseData, 'POST');
    return data.data;
  }

  /**
   * Update an existing course.
   */
  async updateCourse(id: number, courseData: any): Promise<Course> {
    const data = await API<any>(`courses/${id}`, courseData, 'PUT');
    return data.data;
  }

  /**
   * Delete a course.
   */
  async deleteCourse(id: number): Promise<void> {
    await API(`courses/${id}`, {}, 'DELETE');
  }

  /**
   * Toggle course active status.
   */
  async toggleCourseActive(id: number): Promise<Course> {
    const data = await API<any>(`courses/${id}/toggle-active`, {}, 'PUT');
    return data.data;
  }

  /**
   * Get registrations for a specific course.
   */
  async getCourseRegistrations(courseId: number): Promise<CourseRegistration[]> {
    const data = await API<any>(`courses/${courseId}/registrations`);
    return data.data;
  }

  /**
   * Get all registrations (with optional filters).
   */
  async getAllRegistrations(params?: { course_id?: number; status?: string; page?: number; per_page?: number }): Promise<{ data: CourseRegistration[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `courses/registrations?${qs}` : 'courses/registrations';
    return API<any>(url);
  }

  /**
   * Approve a bank receipt for a registration.
   */
  async approveReceipt(registrationId: number): Promise<CourseRegistration> {
    const data = await API<any>(`courses/registrations/${registrationId}/approve-receipt`, {}, 'POST');
    return data.data;
  }

  /**
   * Reject a bank receipt for a registration.
   */
  async rejectReceipt(registrationId: number, rejectionReason?: string): Promise<CourseRegistration> {
    const data = await API<any>(`courses/registrations/${registrationId}/reject-receipt`, { rejection_reason: rejectionReason }, 'POST');
    return data.data;
  }

  /**
   * Get course statistics.
   */
  async getCourseStatistics(): Promise<CourseStats> {
    const data = await API<any>('courses/statistics');
    return data.data;
  }
}

export const api = new ApiService();
export default api;
