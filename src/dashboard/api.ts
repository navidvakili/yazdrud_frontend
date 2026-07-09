// ============================================================
// Dashboard API — ارتباط با بک‌اند برای پیشخوان اصلی
// ============================================================

import { API } from '@/src/shared-utils';
import type { DashboardOverview } from '@/src/dashboard/types';

export const dashboardApi = {
  // ========== Dashboard Overview Widgets ==========

  /**
   * Fetch dashboard overview data including latest registrations,
   * current week installments, recent surveys, unapproved receipts, etc.
   */
  async getOverview(): Promise<DashboardOverview> {
    const data = await API<DashboardOverview>('dashboard/overview');
    return data;
  },

  // ========== Dashboard / Quick Access (Pinned Menus) ==========

  /**
   * Fetch the dashboard data including pinned menus.
   */
  async getDashboard(): Promise<{ pinned_menus: string[] }> {
    const data = await API<any>('dashboard');
    return data.data;
  },

  /**
   * Pin a menu item (by targetId) so it appears on the dashboard quick-access section.
   */
  async pinMenu(menuId: string): Promise<void> {
    await API('dashboard/pin', { menu_id: menuId }, 'POST');
  },

  /**
   * Unpin a menu item (by targetId) from the dashboard.
   */
  async unpinMenu(menuId: string): Promise<void> {
    await API('dashboard/unpin', { menu_id: menuId }, 'POST');
  },

  /**
   * Get the list of pinned menus for the current user.
   */
  async getPinnedMenus(): Promise<string[]> {
    const data = await API<any>('dashboard/pinned-menus');
    return data.data;
  },
};
