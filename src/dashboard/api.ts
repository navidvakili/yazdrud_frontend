// ============================================================
// Dashboard API — ارتباط با بک‌اند برای پیشخوان اصلی
// ============================================================

import { API } from '@/src/shared-utils';

export const dashboardApi = {
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
