// ============================================================
// Layouts API — منو و نقش‌های کاربری
// ============================================================

import { API } from '@/src/shared-utils';
import type { NavItem, NavResponse, UserRolesResponse, PermissionsResponse, RoleInfo, PermissionItem } from '@/src/shared-types';

export const layoutsApi = {
  // ========== Navigation & Permissions ==========

  /**
   * Fetch the hierarchical navigation menu for the current user.
   * The backend filters menu items based on user roles automatically.
   */
  async getNavigation(): Promise<NavItem[]> {
    const data = await API<NavResponse>('navigation');
    return data.data;
  },

  /**
   * Fetch the current user's roles (primary + all roles from roles table).
   */
  async getUserRoles(): Promise<{ primary_role: string; all_roles: RoleInfo[] }> {
    const data = await API<UserRolesResponse>('user/roles');
    return data.data;
  },

  /**
   * Fetch all permission entries for the current user.
   */
  async getUserPermissions(): Promise<PermissionItem[]> {
    const data = await API<PermissionsResponse>('user/permissions');
    return data.data;
  },
};
