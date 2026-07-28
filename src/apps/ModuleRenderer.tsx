// ============================================================
// ModuleRenderer — رندر ماژول مناسب بر اساس tabId
//
// این کامپوننت جایگزین تابع renderModuleForTab در App.tsx شده
// و مسئولیت انتخاب و رندر کامپوننت صحیح برای هر تب را بر عهده دارد.
// ============================================================

import { Suspense } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { User as UserType } from '@/src/shared-types';
import type { Tab } from '@/src/layouts/types';
import type { RoleInfo } from '@/src/login/types';
import { USER_STRING } from '@/src/shared-constants';
import { AppModules, resolveApp, LoadingFallback } from '@/src/apps';
import DashboardModule from '@/src/dashboard';
import type { MenuCategory } from '@/src/layouts';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import { MODULE_PERMISSIONS } from '@/src/shared-utils/permissions';

interface ModuleRendererProps {
  tabId: string | null;
  tabs: Tab[];
  user: UserType | null;
  userRoles: RoleInfo[];
  menuCategories: MenuCategory[];
  pinnedMenus: string[];
  allMenuItems: Array<{
    id: string;
    title: string;
    icon: LucideIcon;
    desc: string;
    roles: readonly ('admin' | 'editor' | 'user')[];
  }>;
  onOpenTab: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
  openTabsCount: number;
  onUpdateUser: (user: UserType) => void;
}

export default function ModuleRenderer({
  tabId,
  tabs,
  user,
  userRoles,
  menuCategories,
  pinnedMenus,
  allMenuItems,
  onOpenTab,
  openTabsCount,
  onUpdateUser,
}: ModuleRendererProps) {
  const { can } = useAppPermissions();

  // Dashboard — when no active tab
  if (!tabId) {
    return (
      <DashboardModule
        user={user}
        userRoles={userRoles}
        onNavigate={onOpenTab}
        openTabsCount={openTabsCount}
        pinnedMenus={pinnedMenus}
        allMenuItems={allMenuItems}
      />
    );
  }

  const tab = tabs.find(t => t.id === tabId);
  const moduleType = tab?.moduleType || tabId;

  // Permission gating — check if user has view permission for this module
  const modPerms = MODULE_PERMISSIONS[moduleType];
  if (modPerms) {
    // Special case: users module also accessible with roles.view
    // (PermissionsPanel/role management lives inside the Users module)
    const hasAccess = moduleType === 'users'
      ? can(modPerms.view) || can('roles.view')
      : can(modPerms.view);
    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShieldAlert className="w-16 h-16 text-red-400 dark:text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
            دسترسی غیرمجاز
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          شما مجوز دسترسی به این بخش را ندارید. لطفاً با مدیر سامانه تماس بگیرید.
        </p>
      </div>
      );
    }
  }

  // Dynamic app resolution via moduleToAppMap
  const appName = resolveApp(moduleType);
  const AppComponent = AppModules[appName];

  if (AppComponent) {
    // Build common props — each app ignores what it doesn't need
    const appProps: Record<string, any> = {
      user,
      activeTabId: tabId,
      moduleId: moduleType,
      onOpenTab,
      userRoles,
      onUpdateUser,
    };

    return user ? (
      <Suspense fallback={<LoadingFallback />}>
        <AppComponent {...appProps} />
      </Suspense>
    ) : null;
  }

  return null;
}
