// ============================================================
// App — کامپوننت اصلی برنامه
// ============================================================

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Bell, HelpCircle, MessageSquare, LogOut,
  type LucideIcon,
} from 'lucide-react';
import type { User as UserType, Tab, PortalNotification, NavItem, RoleInfo } from '@/src/shared-types';
import { layoutsApi } from '@/src/layouts';
import { THEME_STRING, USER_STRING, MAX_TABS, STANDBY_TIMEOUT } from '@/src/shared-constants';
import { AppModules, resolveApp, LoadingFallback } from '@/src/apps';
import { loginApi, LoginForm, SessionWarningModal, useSessionWarning } from '@/src/login';
import DashboardModule from '@/src/dashboard';
import ThesisManagement from '@/src/components/ThesisManagement';
import FloatingPanels from '@/src/components/FloatingPanels';
import { Header, Sidebar, TabsBar, Footer, NetworkStatus, defaultNotifications, urlToTargetId, resolveIcon, faToLucideName } from '@/src/layouts';
import type { MenuCategory } from '@/src/layouts';
import { dashboardApi } from '@/src/dashboard';
import { LogoutModal, StandbyModal, TabLimitAlert } from '@/src/shared-components';

export default function App() {
  // ========== Core State ==========
  const [viewState, setViewState] = useState<'login' | 'authenticated'>('login');
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(THEME_STRING) as 'light' | 'dark') || 'light'
  );
  const [user, setUser] = useState<UserType | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<PortalNotification[]>(defaultNotifications);

  // UI State
  const [selectedMainCat, setSelectedMainCat] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [confirmClearActive, setConfirmClearActive] = useState(false);
  const [tabRefreshKeys, setTabRefreshKeys] = useState<Record<string, number>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Standby (auto-lock) state
  const [isStandby, setIsStandby] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const standbyCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Navigation state — fetched dynamically from API
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [userRoles, setUserRoles] = useState<RoleInfo[]>([]);
  const [navLoading, setNavLoading] = useState(false);

  // Pinned menus for dashboard quick access
  const [pinnedMenus, setPinnedMenus] = useState<string[]>([]);

  // Mobile sidebar state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Session warning (concurrent login) state
  const {
    pendingWarning,
    setPendingWarning,
    isLoading: warningRespondLoading,
    respondToWarning: handleWarningRespond,
  } = useSessionWarning(viewState === 'authenticated');

  // ========== Effects ==========

  // Apply theme to DOM + persist to localStorage + save to backend profile
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STRING, theme);
    // Persist theme to backend profile (silently, only when authenticated)
    if (viewState === 'authenticated') {
      loginApi.updateTheme(theme).catch(() => { /* ignore */ });
    }
  }, [theme, viewState]);

  // Restore session on cold start — default to dashboard (no tab)
  useEffect(() => {
    const storedUser = loginApi.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setViewState('authenticated');
      // Attempt to fetch the user's saved theme from backend (silent)
      loginApi.getUser().then(profile => {
        // If backend returns a theme field, apply it
        if ((profile as any).theme) {
          setTheme((profile as any).theme as 'light' | 'dark');
        }
      }).catch(() => { /* ignore */ });
      // Fetch pinned menus
      fetchPinnedMenus();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ========== Standby (Auto-Lock) — track activity, lock after timeout ==========
  useEffect(() => {
    if (viewState !== 'authenticated') {
      // Not logged in — no standby tracking
      setIsStandby(false);
      return;
    }

    // Reset activity timestamp on any user interaction
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      // If was in standby, do NOT auto-exit — must use password
    };

    // Also reset activity when we start tracking (fresh login)
    lastActivityRef.current = Date.now();
    setIsStandby(false);

    // Periodic check: if inactive beyond timeout → enter standby
    standbyCheckIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= STANDBY_TIMEOUT && !isStandby) {
        setIsStandby(true);
      }
    }, 5000); // Check every 5 seconds

    // Bind activity events
    const events = ['mousedown', 'mousemove', 'keydown', 'click', 'touchstart', 'scroll', 'wheel'];
    events.forEach(ev => window.addEventListener(ev, updateActivity, { passive: true }));

    return () => {
      if (standbyCheckIntervalRef.current) {
        clearInterval(standbyCheckIntervalRef.current);
        standbyCheckIntervalRef.current = null;
      }
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
    };
  }, [viewState]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch navigation and roles when user is authenticated
  const fetchNavigation = useCallback(async () => {
    if (!loginApi.isAuthenticated()) return;
    setNavLoading(true);
    try {
      const [navData, rolesData] = await Promise.all([
        layoutsApi.getNavigation(),
        layoutsApi.getUserRoles(),
      ]);
      setNavItems(navData);
      setUserRoles(rolesData.all_roles);
    } catch (err) {
      console.warn('Failed to load navigation from API:', err);
    } finally {
      setNavLoading(false);
    }
  }, []);

  // Fetch pinned menus from backend
  const fetchPinnedMenus = useCallback(async () => {
    try {
      const menus = await dashboardApi.getPinnedMenus();
      setPinnedMenus(Array.isArray(menus) ? menus : []);
    } catch {
      // ignore
    }
  }, []);

  // Pin/unpin handlers
  const handlePinMenu = useCallback(async (menuId: string) => {
    setPinnedMenus(prev => prev.includes(menuId) ? prev : [...prev, menuId]);
    try {
      await dashboardApi.pinMenu(menuId);
    } catch {
      // Rollback on error
      setPinnedMenus(prev => prev.filter(id => id !== menuId));
    }
  }, []);

  const handleUnpinMenu = useCallback(async (menuId: string) => {
    setPinnedMenus(prev => prev.filter(id => id !== menuId));
    try {
      await dashboardApi.unpinMenu(menuId);
    } catch {
      // Rollback — re-add
      setPinnedMenus(prev => prev.includes(menuId) ? prev : [...prev, menuId]);
    }
  }, []);

  useEffect(() => {
    if (viewState === 'authenticated') {
      fetchNavigation();
      fetchPinnedMenus();
    }
  }, [viewState, fetchNavigation, fetchPinnedMenus]);

  // Derive MenuCategory[] from NavItem[] (dynamic API data)
  const menuCategories = useMemo<MenuCategory[]>(() => {
    return navItems.map(item => ({
      key: String(item.id),
      title: item.title,
      icon: resolveIcon(faToLucideName[item.icon] || 'Folder'),
      submenus: item.children.map(child => ({
        label: child.title,
        targetId: urlToTargetId(child.url, child.title),
        title: child.title,
        iconName: faToLucideName[child.icon] || 'Folder',
      })),
      // Categories without children → direct tab opening
      targetId: item.children.length === 0 ? urlToTargetId(item.url, item.title) : undefined,
      iconName: item.children.length === 0 ? faToLucideName[item.icon] || 'Folder' : undefined,
    }));
  }, [navItems]);

  // Flat list of all menu items for dashboard quick access (derived from API categories)
  const allMenuItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      icon: LucideIcon;
      desc: string;
      roles: readonly ('student' | 'professor' | 'admin')[];
    }> = [];

    menuCategories.forEach(cat => {
      // Include submenu items (children)
      cat.submenus.forEach(sub => {
        items.push({
          id: sub.targetId,
          title: sub.title,
          icon: resolveIcon(sub.iconName),
          desc: cat.title,
          roles: ['student', 'professor', 'admin'] as const,
        });
      });

      // Include direct/top-level items (categories without children)
      if (cat.targetId && cat.submenus.length === 0) {
        items.push({
          id: cat.targetId,
          title: cat.title,
          icon: cat.icon,
          desc: cat.title,
          roles: ['student', 'professor', 'admin'] as const,
        });
      }
    });

    return items;
  }, [menuCategories]);

  // ========== Handlers ==========
  const handleLoginSuccess = (userProfile: UserType) => {
    setUser(userProfile);
    // Convert roles from login response (string[]) to RoleInfo[] format
    // fetchNavigation() will later replace with proper labeled data from API
    if (userProfile.roles && userProfile.roles.length > 0) {
      setUserRoles(userProfile.roles.map((r, i) => ({
        id: i,
        role: r,
        label: r,
        active: r === userProfile.role ? 1 : 0,
      })));
    }
    setViewState('authenticated');
  };

  const handleLogout = async () => {
    try {
      await loginApi.logout();
    } catch { /* ignore */ }
    setUser(null);
    setTabs([]);
    setActiveTabId(null);
    setViewState('login');
    setActivePanel(null);
    setSelectedMainCat(null);
    setShowLogoutModal(false);
    setPinnedMenus([]);
  };

  /** Verify password and exit standby mode */
  const handleUnlock = async (password: string): Promise<boolean> => {
    const ok = await loginApi.verifyPassword(password);
    if (ok) {
      setIsStandby(false);
      lastActivityRef.current = Date.now();
    }
    return ok;
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleChangeRole = async (newRole: string) => {
    if (!user) return;
    try {
      const updatedUser = await loginApi.switchRole(newRole);
      setUser(updatedUser);
      // Clear all tabs so the new role's navigation is shown without stale tabs
      setTabs([]);
      setActiveTabId(null);
      setSelectedMainCat(null);
      // Re-fetch navigation and pinned menus for the new role context
      fetchNavigation();
      fetchPinnedMenus();
    } catch (err) {
      console.warn('Failed to switch role:', err);
    }
  };

  // Refresh only the currently focused tab
  const handleRefreshTab = useCallback(() => {
    if (activeTabId) {
      setTabRefreshKeys(prev => ({
        ...prev,
        [activeTabId]: (prev[activeTabId] || 0) + 1,
      }));
    }
  }, [activeTabId]);

  // Sync sidebar category selection when active tab changes
  useEffect(() => {
    if (!activeTabId) {
      setSelectedMainCat(null);
      return;
    }
    const tab = tabs.find(t => t.id === activeTabId);
    const moduleType = tab?.moduleType || activeTabId;
    for (const cat of menuCategories) {
      const match = cat.submenus.some(sub => sub.targetId === moduleType) || cat.targetId === moduleType;
      if (match) {
        setSelectedMainCat(cat.key);
        return;
      }
    }
    // Tab not in any menu category (e.g., profile, change-password) → close drawer
    setSelectedMainCat(null);
  }, [activeTabId, tabs, menuCategories]);

  // Tab management
  const handleOpenTab = useCallback((id: string, title: string, iconName: string, forceNewInstance: boolean = false) => {
    if (!forceNewInstance && tabs.some(t => t.id === id)) {
      setActiveTabId(id);
      return;
    }
    if (tabs.length >= MAX_TABS) {
      setShowLimitAlert(true);
      return;
    }
    const uniqueId = forceNewInstance ? `${id}_${Date.now()}` : id;
    const baseTabsCount = tabs.filter(t => t.id === id || t.moduleType === id).length;
    const finalTitle = forceNewInstance ? `${title} (نمونه ${baseTabsCount + 1})` : title;
    setTabs(prev => [...prev, { id: uniqueId, title: finalTitle, iconName, moduleType: id }]);
    setActiveTabId(uniqueId);
  }, [tabs]);

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tabs.filter(t => t.id !== id);
    setTabs(updated);
    if (activeTabId === id && updated.length > 0) {
      setActiveTabId(updated[updated.length - 1].id);
    } else if (updated.length === 0) {
      setActiveTabId(null);
    }
  };

  const handleClearAllTabs = () => {
    if (!confirmClearActive) {
      setConfirmClearActive(true);
    } else {
      setTabs([]);
      setActiveTabId(null);
      setConfirmClearActive(false);
      setShowLimitAlert(false);
    }
  };

  // Notifications
  const handleMarkNotifRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const handleClearNotifications = () => setNotifications([]);
  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // ========== Module Renderer ==========

  /**
   * Render content for a specific tab (or dashboard if tabId is null).
   * Extracted so each tab's content can be kept alive when switching.
   */
  const renderModuleForTab = (tabId: string | null) => {
    if (!tabId) {
      return (
        <DashboardModule
          user={user}
          userRoles={userRoles}
          onNavigate={handleOpenTab}
          openTabsCount={tabs.length}
          pinnedMenus={pinnedMenus}
          allMenuItems={allMenuItems}
        />
      );
    }
    const tab = tabs.find(t => t.id === tabId);
    const moduleType = tab?.moduleType || tabId;

    // Dynamic app resolution via moduleToAppMap
    const appName = resolveApp(moduleType);
    const AppComponent = AppModules[appName];

    // Special case: theses (not yet migrated to app system)
    if (moduleType === 'theses' || moduleType === 'theses-scientific' || moduleType === 'theses-permits') {
      return <ThesisManagement userRole={user?.role || 'student'} initialView={moduleType} />;
    }

    if (AppComponent) {
      // Build common props — each app ignores what it doesn't need
      const appProps: Record<string, any> = {
        user,
        activeTabId: tabId,
        moduleId: moduleType,
        onOpenTab: handleOpenTab,
        userRoles,
        onUpdateUser: (updated: UserType) => {
          setUser(updated);
          localStorage.setItem(USER_STRING, JSON.stringify(updated));
        },
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
  };

  // ========== View Routing ==========
  if (viewState === 'login') {
    return (
      <div className={theme}>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // ========== Authenticated Layout ==========

  // Menu categories — already filtered by role from the API
  const filteredCategories = menuCategories;

  return (
    <div className={`${theme} h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex flex-col transition-colors duration-300`}>

      {/* ===== 1. Header Bar ===== */}
      <Header
        user={user}
        userRoles={userRoles}
        menuCategories={menuCategories}
        tabs={tabs}
        theme={theme}
        handleOpenTab={handleOpenTab}
        setSelectedMainCat={setSelectedMainCat}
        handleToggleTheme={handleToggleTheme}
        handleChangeRole={handleChangeRole}
        setShowLogoutModal={setShowLogoutModal}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* ===== 2. Three-Column Layout ===== */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ===== Column A: Sidebar Menu ===== */}
        <Sidebar
          menuCategories={menuCategories}
          selectedMainCat={selectedMainCat}
          setSelectedMainCat={setSelectedMainCat}
          navLoading={navLoading}
          handleOpenTab={handleOpenTab}
          tabs={tabs}
          activeTabId={activeTabId}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* ===== Column B: Main Workspace ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs bar */}
          <TabsBar
            tabs={tabs}
            activeTabId={activeTabId}
            setActiveTabId={setActiveTabId}
            handleRefreshTab={handleRefreshTab}
            handleCloseTab={handleCloseTab}
            pinnedMenus={pinnedMenus}
            handlePinMenu={handlePinMenu}
            handleUnpinMenu={handleUnpinMenu}
          />

          {/* Canvas — all tabs kept alive, only active one visible */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 custom-scrollbar">
            <div>
              {/* Dashboard — only when no active tab */}
              {activeTabId === null && renderModuleForTab(null)}

              {/* All opened tabs kept alive to preserve state on switch */}
              {tabs.map(tab => (
                <div
                  key={`${tab.id}_${tabRefreshKeys[tab.id] || 0}`}
                  className={activeTabId === tab.id ? '' : 'hidden'}
                >
                  {renderModuleForTab(tab.id)}
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* ===== Column C: Auxiliary Tools ===== */}
        <div className="hidden lg:flex border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 flex-col justify-between items-center py-4 z-45">
          <div className="space-y-4 px-2">
            <button
              onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
              className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${activePanel === 'chat' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
                }`}
              title="چت پشتیبانی"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
            </button>
            <button
              onClick={() => setActivePanel(activePanel === 'notifications' ? null : 'notifications')}
              className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${activePanel === 'notifications' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
                }`}
              title="اعلان‌های سیستم"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -left-1  font-bold bg-rose-500 text-white text-[9px] h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePanel(activePanel === 'help' ? null : 'help')}
              className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${activePanel === 'help' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
                }`}
              title="راهنمای کاربر"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="px-2">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-11 h-11 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-center cursor-pointer"
              title="خروج از حساب"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===== Floating Panels ===== */}
        <AnimatePresence>
          {activePanel && (
            <FloatingPanels
              activePanel={activePanel}
              onClose={() => setActivePanel(null)}
              notifications={notifications}
              onMarkNotificationRead={handleMarkNotifRead}
              onClearNotifications={handleClearNotifications}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ===== Footer ===== */}
      <Footer user={user} />

      {/* Network status bar — fixed at bottom */}
      <NetworkStatus />

      {/* Logout confirmation modal */}
      <LogoutModal
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
        handleLogout={handleLogout}
      />

      {/* Tab limit alert — modal */}
      <TabLimitAlert
        showLimitAlert={showLimitAlert}
        setShowLimitAlert={setShowLimitAlert}
        handleClearAllTabs={handleClearAllTabs}
        confirmClearActive={confirmClearActive}
        setConfirmClearActive={setConfirmClearActive}
      />

      {/* Standby (auto-lock) overlay */}
      <StandbyModal
        isStandby={isStandby}
        user={user}
        onUnlock={handleUnlock}
      />

      {/* Session Warning Modal (concurrent login detection) */}
      <SessionWarningModal
        warning={pendingWarning}
        onRespond={handleWarningRespond}
        isLoading={warningRespondLoading}
      />
    </div>
  );
}