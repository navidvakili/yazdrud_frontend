// ============================================================
// API Service — ارتباط با بک‌اند لاراول (لایه سازگاری)
// ============================================================
// این فایل یک لایه سازگاری (compatibility) است که تمام متدهای API
// را از ماژول‌های تخصصی import کرده و به صورت یک شیء واحد ارائه می‌دهد.
// مصرف‌کنندگان جدید باید مستقیماً از ماژول‌های تخصصی import کنند:
//   import { loginApi } from '@/src/login';
//   import { layoutsApi } from '@/src/layouts';

import { loginApi } from '@/src/login';
import { layoutsApi } from '@/src/layouts';

/**
 * شیء یکپارچه API برای سازگاری با کدهای موجود
 * @deprecated به جای آن از ماژول‌های تخصصی استفاده کنید
 */
export const api = {
  // ========== Authentication (از loginApi) ==========
  login: loginApi.login.bind(loginApi),
  logout: loginApi.logout.bind(loginApi),
  getUser: loginApi.getUser.bind(loginApi),
  updateProfile: loginApi.updateProfile.bind(loginApi),
  changePassword: loginApi.changePassword.bind(loginApi),
  verifyPassword: loginApi.verifyPassword.bind(loginApi),
  switchRole: loginApi.switchRole.bind(loginApi),
  updateTheme: loginApi.updateTheme.bind(loginApi),

  // ========== Session Management (از loginApi) ==========
  getStoredUser: loginApi.getStoredUser.bind(loginApi),
  getStoredToken: loginApi.getStoredToken.bind(loginApi),
  isAuthenticated: loginApi.isAuthenticated.bind(loginApi),

  // ========== Active Sessions (از loginApi) ==========
  getActiveSessions: loginApi.getActiveSessions.bind(loginApi),
  revokeSession: loginApi.revokeSession.bind(loginApi),
  getAllActiveSessions: loginApi.getAllActiveSessions.bind(loginApi),
  adminRevokeSession: loginApi.adminRevokeSession.bind(loginApi),

  // ========== Session Warnings (از loginApi) ==========
  createSessionWarning: loginApi.createSessionWarning.bind(loginApi),
  checkSessionWarningStatus: loginApi.checkSessionWarningStatus.bind(loginApi),
  getPendingWarnings: loginApi.getPendingWarnings.bind(loginApi),
  respondToWarning: loginApi.respondToWarning.bind(loginApi),
  sessionWarningLogin: loginApi.sessionWarningLogin.bind(loginApi),

  // ========== Navigation & Permissions (از layoutsApi) ==========
  getNavigation: layoutsApi.getNavigation.bind(layoutsApi),
  getUserRoles: layoutsApi.getUserRoles.bind(layoutsApi),
  getUserPermissions: layoutsApi.getUserPermissions.bind(layoutsApi),
};

export default api;
