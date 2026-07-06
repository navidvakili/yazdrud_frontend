// ============================================================
// ModuleRenderer — رندر ماژول مناسب بر اساس tabId
//
// این کامپوننت جایگزین تابع renderModuleForTab در App.tsx شده
// و مسئولیت انتخاب و رندر کامپوننت صحیح برای هر تب را بر عهده دارد.
// ============================================================

import { Suspense } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { User as UserType, Tab, RoleInfo } from '@/src/shared-types';
import { USER_STRING } from '@/src/shared-constants';
import { AppModules, resolveApp, LoadingFallback } from '@/src/apps';
import DashboardModule from '@/src/dashboard';
import ThesisManagement from '@/src/apps/library/ThesisManagement';
import type { MenuCategory } from '@/src/layouts';

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
    roles: readonly ('student' | 'professor' | 'admin')[];
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

  // Special case: theses (not yet migrated to app system)
  if (moduleType === 'theses' || moduleType === 'theses-scientific' || moduleType === 'theses-permits') {
    return <ThesisManagement userRole={user?.role || 'student'} initialView={moduleType} />;
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

    // Library app needs the module label for display
    if (appName === 'library') {
      const activeSub = menuCategories
        .flatMap(cat => cat.submenus || [])
        .find(sub => sub.targetId === moduleType);
      appProps.moduleIdLabel = activeSub ? activeSub.label : 'خدمات الکترونیکی پورتال';
      appProps.moduleId = tabId || moduleType;
    }

    return user ? (
      <Suspense fallback={<LoadingFallback />}>
        <AppComponent {...appProps} />
      </Suspense>
    ) : null;
  }

  // Fallback: should never reach here since resolveApp always returns at least 'library'
  return null;
}
