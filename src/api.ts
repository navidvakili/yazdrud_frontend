// ============================================================
// API Service — ارتباط با بک‌اند لاراول
// ============================================================

import { API, APISendFiles } from '@/src/lib/functions';
import { API_BASE_URL, TOKEN_STRING, USER_STRING } from '@/src/lib/constants';
import type { AuthResponse, LoginCredentials, User, UserRole, NavItem, NavResponse, UserRolesResponse, PermissionsResponse, RoleInfo, PermissionItem, Course, CourseGroup, CourseRegistration, CourseStats, DetailedCourseStats, CourseSurvey, CourseSurveyStats, CourseCoupon, Instructor, ActiveSession, AdminSession, UserSessionsResponse, AdminSessionsResponse } from '@/src/types';
import { getAvatarUrl, getBrowserFingerprint } from '@/src/lib/functions';

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
    // Use APISendFiles for FormData (file upload), API for JSON
    const data = courseData instanceof FormData
      ? await APISendFiles<any>('courses', courseData)
      : await API<any>('courses', courseData, 'POST');
    return data.data;
  }

  /**
   * Update an existing course.
   */
  async updateCourse(id: number, courseData: any): Promise<Course> {
    // Use APISendFiles for FormData (file upload), API for JSON
    const data = courseData instanceof FormData
      ? await APISendFiles<any>(`courses/${id}`, courseData)
      : await API<any>(`courses/${id}`, courseData, 'PUT');
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
  async getAllRegistrations(params?: { course_id?: number; status?: string; page?: number; per_page?: number; payment_method?: string; search?: string; year?: string; refunded?: string }): Promise<{ data: CourseRegistration[]; meta: any; stats?: { total_confirmed: number; online_paid: number; bank_verified: number; total_amount: number } }> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.payment_method) query.set('payment_method', params.payment_method);
    if (params?.search) query.set('search', params.search);
    if (params?.year) query.set('year', params.year);
    if (params?.refunded) query.set('refunded', params.refunded);
    const qs = query.toString();
    const url = qs ? `courses/registrations?${qs}` : 'courses/registrations';
    return API<any>(url);
  }

  /**
   * Export registrations as XLSX based on current filters.
   */
  async exportRegistrations(params?: { course_id?: string; search?: string; year?: string; status?: string; payment_method?: string; refunded?: string }): Promise<void> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', params.course_id);
    if (params?.search) query.set('search', params.search);
    if (params?.year) query.set('year', params.year);
    if (params?.status) query.set('status', params.status);
    if (params?.payment_method) query.set('payment_method', params.payment_method);
    if (params?.refunded) query.set('refunded', params.refunded);
    const qs = query.toString();
    const url = qs ? `courses/registrations/export?${qs}` : 'courses/registrations/export';
    const token = localStorage.getItem(TOKEN_STRING);
    const fullUrl = `${API_BASE_URL}/${url}`;
    // Use fetch to get blob and trigger download
    const response = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'registrations-report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
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
   * Mark a registration as refunded.
   */
  async refundRegistration(encryptedId: string): Promise<CourseRegistration> {
    const data = await API<any>(`courses/registrations/${encryptedId}/refund`, {}, 'POST');
    return data.data;
  }

  /**
   * Undo a refund (لغو مستردد).
   */
  async undoRefundRegistration(encryptedId: string): Promise<CourseRegistration> {
    const data = await API<any>(`courses/registrations/${encryptedId}/undo-refund`, {}, 'POST');
    return data.data;
  }

  /**
   * Get course statistics (aggregate).
   */
  async getCourseStatistics(): Promise<CourseStats> {
    const data = await API<any>('courses/statistics');
    return data.data;
  }

  /**
   * Get detailed course statistics (monthly, seasonal, yearly, chart data) with filters.
   */
  async getDetailedCourseStatistics(params?: { year?: string; course_id?: string }): Promise<DetailedCourseStats> {
    let url = 'courses/statistics/detailed';
    if (params?.year || params?.course_id) {
      const qs = new URLSearchParams();
      if (params.year) qs.set('year', params.year);
      if (params.course_id) qs.set('course_id', params.course_id);
      url += '?' + qs.toString();
    }
    const data = await API<any>(url);
    return data.data;
  }

  // ========== Surveys (نظرسنجی دوره‌ها) ==========

  /**
   * Get paginated list of course surveys.
   */
  async getSurveys(params?: { course_id?: number; search?: string; page?: number; per_page?: number }): Promise<{ data: CourseSurvey[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `surveys?${qs}` : 'surveys';
    return API<any>(url);
  }

  /**
   * Get survey statistics.
   */
  async getSurveyStatistics(): Promise<CourseSurveyStats> {
    const data = await API<any>('surveys/statistics');
    return data.data;
  }

  /**
   * Delete a survey.
   */
  async deleteSurvey(id: number): Promise<void> {
    await API(`surveys/${id}`, {}, 'DELETE');
  }

  /**
   * Export surveys as Excel file based on current filters.
   */
  async exportSurveys(params?: { course_id?: string; search?: string; from_date?: string; to_date?: string }): Promise<void> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', params.course_id);
    if (params?.search) query.set('search', params.search);
    if (params?.from_date) query.set('from_date', params.from_date);
    if (params?.to_date) query.set('to_date', params.to_date);
    const qs = query.toString();
    const url = qs ? `surveys/export?${qs}` : 'surveys/export';
    const token = localStorage.getItem(TOKEN_STRING);
    const fullUrl = `${API_BASE_URL}/${url}`;
    const response = await fetch(fullUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'survey-report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // ========== Coupons / Vouchers (بن‌های تخفیف) ==========

  /**
   * Get paginated list of coupons.
   */
  async getCoupons(params?: { page?: number; per_page?: number; is_active?: boolean }): Promise<{ data: CourseCoupon[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.is_active !== undefined) query.set('is_active', String(params.is_active));
    const qs = query.toString();
    const url = qs ? `coupons?${qs}` : 'coupons';
    return API<any>(url);
  }

  /**
   * Get a single coupon by ID.
   */
  async getCoupon(id: number): Promise<CourseCoupon> {
    const data = await API<any>(`coupons/${id}`);
    return data.data;
  }

  /**
   * Create a new coupon.
   */
  async createCoupon(couponData: any): Promise<CourseCoupon> {
    const data = await API<any>('coupons', couponData, 'POST');
    return data.data;
  }

  /**
   * Update an existing coupon.
   */
  async updateCoupon(id: number, couponData: any): Promise<CourseCoupon> {
    const data = await API<any>(`coupons/${id}`, couponData, 'PUT');
    return data.data;
  }

  /**
   * Delete a coupon.
   */
  async deleteCoupon(id: number): Promise<void> {
    await API(`coupons/${id}`, {}, 'DELETE');
  }

  /**
   * Generate a unique random coupon code.
   */
  async generateCouponCode(params?: { length?: number; prefix?: string }): Promise<{ code: string }> {
    const query = new URLSearchParams();
    if (params?.length) query.set('length', String(params.length));
    if (params?.prefix) query.set('prefix', params.prefix);
    const qs = query.toString();
    const url = qs ? `coupons/generate-code?${qs}` : 'coupons/generate-code';
    const data = await API<any>(url);
    return data.data;
  }

  /**
   * Validate a coupon code for a given course.
   */
  async validateCoupon(code: string, courseId: number): Promise<{ valid: boolean; discount?: number; message?: string }> {
    const data = await API<any>('coupons/validate', { code, course_id: courseId }, 'POST');
    return data.data;
  }

  /**
   * Generate and create a coupon with auto-generated code.
   */
  async generateCoupon(couponData: any): Promise<CourseCoupon> {
    const data = await API<any>('coupons/generate', couponData, 'POST');
    return data.data;
  }

  /**
   * Get courses list for autocomplete (lightweight, for coupon form).
   */
  async getCouponCourses(params?: { search?: string; limit?: number }): Promise<{ id: number; title: string }[]> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const url = qs ? `coupons/courses?${qs}` : 'coupons/courses';
    const data = await API<any>(url);
    return data.data;
  }

  // ========== User Theme Preference ==========

  /**
   * Save the user's theme preference to the backend.
   */
  async updateTheme(theme: 'light' | 'dark'): Promise<void> {
    await API('user/theme', { theme }, 'PUT');
  }

  // ========== Dashboard / Quick Access (Pinned Menus) ==========

  /**
   * Fetch the dashboard data including pinned menus.
   */
  async getDashboard(): Promise<{ pinned_menus: string[] }> {
    const data = await API<any>('dashboard');
    return data.data;
  }

  /**
   * Pin a menu item (by targetId) so it appears on the dashboard quick-access section.
   */
  async pinMenu(menuId: string): Promise<void> {
    await API('dashboard/pin', { menu_id: menuId }, 'POST');
  }

  /**
   * Unpin a menu item (by targetId) from the dashboard.
   */
  async unpinMenu(menuId: string): Promise<void> {
    await API('dashboard/unpin', { menu_id: menuId }, 'POST');
  }

  /**
   * Get the list of pinned menus for the current user.
   */
  async getPinnedMenus(): Promise<string[]> {
    const data = await API<any>('dashboard/pinned-menus');
    return data.data;
  }

  // ========== Course Groups (گروه‌های آموزشی و کارگاهی) ==========

  /**
   * Get all course groups.
   */
  async getCourseGroups(): Promise<CourseGroup[]> {
    const data = await API<any>('course-groups');
    return data.data;
  }

  /**
   * Create a new course group.
   */
  async createCourseGroup(title: string): Promise<CourseGroup> {
    const data = await API<any>('course-groups', { title }, 'POST');
    return data.data;
  }

  /**
   * Update a course group.
   */
  async updateCourseGroup(id: number, title: string): Promise<CourseGroup> {
    const data = await API<any>(`course-groups/${id}`, { title }, 'PUT');
    return data.data;
  }

  /**
   * Delete a course group.
   */
  async deleteCourseGroup(id: number): Promise<void> {
    await API(`course-groups/${id}`, {}, 'DELETE');
  }

  // ========== Certificates (صدور گواهی دوره‌ها) ==========

  /**
   * Get registrations for certificate management with optional filters.
   */
  async getCertificateRegistrations(params?: {
    course_id?: number;
    certificate_status?: string;
    has_certificate?: boolean;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: any[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.certificate_status) query.set('certificate_status', params.certificate_status);
    if (params?.has_certificate !== undefined) query.set('has_certificate', String(params.has_certificate));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `certificates?${qs}` : 'certificates';
    return API<any>(url);
  }

  /**
   * Approve a registration for certificate issuance.
   */
  async approveCertificate(registerId: string): Promise<any> {
    const data = await API<any>(`certificates/approve/${registerId}`, {}, 'POST');
    return data;
  }

  /**
   * Remove certificate approval from a registration.
   */
  async rejectCertificate(registerId: string): Promise<any> {
    const data = await API<any>(`certificates/reject/${registerId}`, {}, 'POST');
    return data;
  }

  /**
   * Approve all registrations of a course for certificate issuance.
   */
  async approveAllCertificates(courseId: number): Promise<any> {
    const data = await API<any>('certificates/approve-all', { course_id: courseId }, 'POST');
    return data;
  }

  /**
   * Download all certificates as a ZIP file.
   */
  async downloadAllCertificates(courseId?: number): Promise<Blob> {
    const token = localStorage.getItem(TOKEN_STRING);
    const params = courseId ? `?course_id=${courseId}` : '';
    const response = await fetch(`${API_BASE_URL}/certificates/download-all${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در دریافت فایل فشرده');
    }
    return response.blob();
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

  // ========== Instructors (اساتید دوره‌ها) ==========

  /**
   * Get paginated list of instructors.
   */
  async getInstructors(params?: { active?: boolean; search?: string; page?: number; per_page?: number }): Promise<{ data: Instructor[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.active !== undefined) query.set('active', String(params.active));
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    const url = qs ? `instructors?${qs}` : 'instructors';
    return API<any>(url);
  }

  /**
   * Get a single instructor by ID.
   */
  async getInstructor(id: number): Promise<Instructor> {
    const data = await API<any>(`instructors/${id}`);
    return data.data;
  }

  /**
   * Create a new instructor.
   */
  async createInstructor(instructorData: FormData | any): Promise<Instructor> {
    const data = instructorData instanceof FormData
      ? await APISendFiles<any>('instructors', instructorData)
      : await API<any>('instructors', instructorData, 'POST');
    return data.data;
  }

  /**
   * Update an existing instructor.
   */
  async updateInstructor(id: number, instructorData: FormData | any): Promise<Instructor> {
    const data = instructorData instanceof FormData
      ? await APISendFiles<any>(`instructors/${id}`, instructorData)
      : await API<any>(`instructors/${id}`, instructorData, 'PUT');
    return data.data;
  }

  /**
   * Delete an instructor.
   */
  async deleteInstructor(id: number): Promise<void> {
    await API(`instructors/${id}`, {}, 'DELETE');
  }
}

export const api = new ApiService();
export default api;
