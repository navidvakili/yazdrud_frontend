// ============================================================
// App — کامپوننت اصلی برنامه
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Search,
  X,
  User,
  LogOut,
  Check,
  ChevronLeft,
  Plus,
  LayoutDashboard,
  Bell,
  HelpCircle,
  MessageSquare,
  Home,
  Lock,
  Award,
  Users,
  BookOpen,
  Briefcase,
  Coins,
  CheckCircle,
  Calendar,
  DollarSign,
  FileText,
  Smile,
  MessageSquare as MessageSquareIcon,
  Sparkles,
  Heart,
  CreditCard,
  Building,
  Folder,
  ShieldCheck,
  Layers,
  Upload,
  Settings,
  Clock,
  AlertCircle,
  AlertTriangle,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import type { User as UserType, Tab, PortalNotification, NavItem, RoleInfo } from '@/src/types';
import api from '@/src/api';
import { THEME_STRING, USER_STRING, MAX_TABS } from '@/src/lib/constants';
import LoginForm from '@/src/components/LoginForm';
import DashboardModule from '@/src/components/DashboardModule';
import ProfileModule from '@/src/components/ProfileModule';
import ChangePasswordModule from '@/src/components/ChangePasswordModule';
import StudentManagement from '@/src/components/StudentManagement';
import ProfessorManagement from '@/src/components/ProfessorManagement';
import CourseCoursework from '@/src/components/CourseCoursework';
import FinancialManagement from '@/src/components/FinancialManagement';
import ThesisManagement from '@/src/components/ThesisManagement';
import LegacyModules from '@/src/components/LegacyModules';
import TutsModule from '@/src/components/TutsModule';
import ThemeToggle from '@/src/components/ThemeToggle';
import FloatingPanels from '@/src/components/FloatingPanels';

// ========== Menu Category Definitions ==========

interface SubmenuItem {
  label: string;
  targetId: string;
  title: string;
  iconName: string;
}

interface MenuCategory {
  key: string;
  title: string;
  icon: LucideIcon;
  submenus: SubmenuItem[];
  /** For categories without submenus — targetId to directly open a tab */
  targetId?: string;
  iconName?: string;
}

// ========== FontAwesome → Lucide icon name mapping ==========
const faToLucideName: Record<string, string> = {
  'fa fa-user': 'User',
  'fa fa-users': 'Users',
  'fa fa-lock': 'Lock',
  'fa fa-book': 'BookOpen',
  'fa fa-graduation-cap': 'GraduationCap',
  'fa fa-dollar': 'DollarSign',
  'fa fa-money': 'DollarSign',
  'fa fa-file-text': 'FileText',
  'fa fa-calendar': 'Calendar',
  'fa fa-home': 'Home',
  'fa fa-building': 'Building',
  'fa fa-heart': 'Heart',
  'fa fa-credit-card': 'CreditCard',
  'fa fa-bell': 'Bell',
  'fa fa-cog': 'Settings',
  'fa fa-gear': 'Settings',
  'fa fa-search': 'Search',
  'fa fa-plus': 'Plus',
  'fa fa-check': 'Check',
  'fa fa-times': 'X',
  'fa fa-close': 'X',
  'fa fa-info-circle': 'HelpCircle',
  'fa fa-question-circle': 'HelpCircle',
  'fa fa-exclamation-triangle': 'AlertCircle',
  'fa fa-envelope': 'MessageSquare',
  'fa fa-comment': 'MessageSquare',
  'fa fa-comments': 'MessageSquare',
  'fa fa-folder': 'Folder',
  'fa fa-folder-open': 'Folder',
  'fa fa-upload': 'Upload',
  'fa fa-download': 'Upload',
  'fa fa-shield': 'ShieldCheck',
  'fa fa-layers': 'Layers',
  'fa fa-clock': 'Clock',
  'fa fa-award': 'Award',
  'fa fa-briefcase': 'Briefcase',
  'fa fa-check-circle': 'CheckCircle',
  'fa fa-smile': 'Smile',
  'fa fa-sparkles': 'Sparkles',
  'fa fa-flag': 'Folder',
};

/** Extract a module targetId from a URL path.
 *  e.g. "/thesis/mali" → "thesis-mali",  "#" → fallback slug from title */
function urlToTargetId(url: string, titleFallback?: string): string {
  const path = url.split('?')[0].replace(/^\//, '');
  if (path) return path;
  // For "#" URLs, generate a slug from the title
  if (titleFallback) {
    return titleFallback
      .replace(/[^آ-یa-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
  }
  return 'home';
}

// Notification templates
const defaultNotifications: PortalNotification[] = [
  { id: 'nt-1', title: 'تمدید مهلت انتخاب واحد نیمسال جاری', body: 'بر اساس مجوز دپارتمان آموزش کل، فرصت انتخاب واحد تا فردا ساعت ۲۴ تمدید شد.', date: '۱۴۰۵/۰۳/۱۹', read: false, type: 'info' },
  { id: 'nt-2', title: 'ثبت نهایی سوابق و نمرات کارنامه', body: 'نمرات نهایی دروس در پرونده الکترونیک دانشجو ثبت قطعی گردید.', date: '۱۴۰۵/۰۳/۱۷', read: false, type: 'success' },
  { id: 'nt-3', title: 'اطلاعیه پرداخت مابقی اقساط شهریه', body: 'دانشجویان محترم جهت نهایی‌سازی گواهی اخذ امتحان، نسبت به پرداخت مابقی بدهی اقدام نمایند.', date: '۱۴۰۵/۰۳/۱۵', read: true, type: 'warning' },
];

// Icon resolver
function resolveIcon(name: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    User, Lock, Award, Users, BookOpen, Briefcase, Coins, CheckCircle,
    Calendar, DollarSign, FileText, Smile, MessageSquare: MessageSquareIcon,
    Sparkles, Heart, CreditCard, Building, Folder, ShieldCheck, Layers,
    Upload, Settings, Clock, Home, GraduationCap, Bell, HelpCircle,
    Search, X, LogOut, Plus, LayoutDashboard, ChevronLeft,
  };
  return iconMap[name] || Folder;
}

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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [drawerSubmenuFilter, setDrawerSubmenuFilter] = useState('');
  const [showLimitAlert, setShowLimitAlert] = useState(false);
  const [confirmClearActive, setConfirmClearActive] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Navigation state — fetched dynamically from API
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [userRoles, setUserRoles] = useState<RoleInfo[]>([]);
  const [navLoading, setNavLoading] = useState(false);

  // ========== Effects ==========
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STRING, theme);
  }, [theme]);

  // Restore session on cold start — default to dashboard (no tab)
  useEffect(() => {
    const storedUser = api.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setViewState('authenticated');
    }
  }, []);

  // Fetch navigation and roles when user is authenticated
  const fetchNavigation = useCallback(async () => {
    if (!api.isAuthenticated()) return;
    setNavLoading(true);
    try {
      const [navData, rolesData] = await Promise.all([
        api.getNavigation(),
        api.getUserRoles(),
      ]);
      setNavItems(navData);
      setUserRoles(rolesData.all_roles);
    } catch (err) {
      console.warn('Failed to load navigation from API:', err);
    } finally {
      setNavLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewState === 'authenticated') {
      fetchNavigation();
    }
  }, [viewState, fetchNavigation]);

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
      await api.logout();
    } catch { /* ignore */ }
    setUser(null);
    setTabs([]);
    setActiveTabId(null);
    setViewState('login');
    setActivePanel(null);
    setSelectedMainCat(null);
    setShowLogoutModal(false);
  };

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleChangeRole = async (newRole: string) => {
    if (!user) return;
    try {
      const updatedUser = await api.switchRole(newRole);
      setUser(updatedUser);
      // Clear all tabs so the new role's navigation is shown without stale tabs
      setTabs([]);
      setActiveTabId(null);
      setSelectedMainCat(null);
      // Re-fetch navigation for the new role context
      fetchNavigation();
    } catch (err) {
      console.warn('Failed to switch role:', err);
    }
  };

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
  }, [tabs, setTabs, setActiveTabId]);

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
  const renderActiveTabContent = () => {
    if (!activeTabId) {
      return (
        <DashboardModule
          user={user}
          onNavigate={handleOpenTab}
          openTabsCount={tabs.length}
        />
      );
    }
    const activeTab = tabs.find(t => t.id === activeTabId);
    const moduleType = activeTab?.moduleType || activeTabId;

    switch (moduleType) {
      case 'profile':
        return user ? (
          <ProfileModule
            user={user}
            onUpdateUser={(updated) => {
              setUser(updated);
              localStorage.setItem(USER_STRING, JSON.stringify(updated));
            }}
          />
        ) : null;
      case 'change-password':
        return <ChangePasswordModule />;
      case 'students':
        return <StudentManagement />;
      case 'professors':
        return <ProfessorManagement />;
      case 'courses':
        return <CourseCoursework />;
      // ===== TutsModule (دوره‌های آموزشی) — from database menu URLs =====
      case 'tuts':
      case 'tuts-list':
      case 'tuts-reports':
      case 'tuts-receipts':
      case 'tuts-stats':
      case 'tuts-surveys':
      case 'tuts-surveys-stats':
      case 'tuts-vouchers':
      // Map actual DB menu URLs to TutsModule sub-views
      case 'tuts/reports':
      case 'tuts/bank-receipts':
      case 'tuts/statistics':
      case 'course-surveys':
      case 'course-surveys/statistics':
        return user ? (
          <TutsModule
            user={user}
            activeTabId={activeTabId}
            moduleId={moduleType === 'tuts' || moduleType === 'tuts-list' ? 'tuts-list'
              : moduleType === 'tuts/reports' ? 'tuts-reports'
              : moduleType === 'tuts/bank-receipts' ? 'tuts-receipts'
              : moduleType === 'tuts/statistics' ? 'tuts-stats'
              : moduleType === 'course-surveys' ? 'tuts-surveys'
              : moduleType === 'course-surveys/statistics' ? 'tuts-surveys-stats'
              : moduleType}
            onOpenTab={handleOpenTab}
          />
        ) : null;
      case 'finance':
        return <FinancialManagement />;
      case 'theses':
      case 'theses-scientific':
      case 'theses-permits':
        return <ThesisManagement userRole={user?.role || 'student'} initialView={moduleType} />;
      default:
        if (activeTabId) {
          const activeSub = menuCategories
            .flatMap(cat => cat.submenus || [])
            .find(sub => sub.targetId === moduleType);
          const label = activeSub ? activeSub.label : 'خدمات الکترونیکی پورتال';
          return <LegacyModules moduleId={activeTabId} moduleIdLabel={label} />;
        }
        return <div className="text-center p-12 text-gray-400">ماژول در حال بارگذاری...</div>;
    }
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
      <header className="p-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500 dark:text-teal-400 border border-teal-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-sm text-gray-900 dark:text-white">پرتال جامع دانشگاهی کارانت</h1>
            <p className="text-[10px] text-gray-400 animate-pulse">پنل یکپارچه مدیریت امور آموزش عالی</p>
          </div>
        </div>

        {/* Global Search */}
        <div className="hidden md:flex items-center relative max-w-sm lg:max-w-md w-full mx-6">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="جستجوی فوق‌سریع در منوها و زیرمنوها..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-850 text-right pr-9 pl-8 py-2 text-xs rounded-xl border border-gray-150 dark:border-gray-800/80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
            {menuSearchQuery && (
              <button onClick={() => setMenuSearchQuery('')} className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Search results overlay */}
            {menuSearchQuery && (
              <div className="absolute top-full right-0 left-0 mt-2 bg-white dark:bg-[#161618] border border-gray-150 dark:border-white/10 rounded-2xl shadow-xl z-55 max-h-80 overflow-y-auto p-2 text-right">
                <span className="block text-[10px] text-gray-400 font-extrabold px-3 py-1.5 border-b border-gray-50 dark:border-white/5">
                  نتایج جستجو برای "{menuSearchQuery}":
                </span>
                {(() => {
                  const query = menuSearchQuery.toLowerCase().trim();
                  const matched: Array<{ category: string; categoryKey: string; submenu: SubmenuItem }> = [];
                  for (const cat of menuCategories) {
                    const catMatches = cat.title.toLowerCase().includes(query);
                    for (const sub of cat.submenus) {
                      if (catMatches || sub.label.toLowerCase().includes(query) || sub.title.toLowerCase().includes(query)) {
                        matched.push({ category: cat.title, categoryKey: cat.key, submenu: sub });
                      }
                    }
                  }
                  if (matched.length === 0) {
                    return <div className="px-3 py-4 text-center text-[10px] text-gray-400 font-sans">موردی یافت نشد.</div>;
                  }
                  return (
                    <div className="flex flex-col gap-0.5 mt-1">
                      {matched.map((item, idx) => {
                        const isTabOpen = tabs.some(t => t.id === item.submenu.targetId || t.moduleType === item.submenu.targetId);
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              handleOpenTab(item.submenu.targetId, item.submenu.title, item.submenu.iconName);
                              setSelectedMainCat(item.categoryKey);
                              setMenuSearchQuery('');
                            }}
                            className="px-3 py-2 text-right text-[11px] hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer w-full group transition-colors duration-150"
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-sans font-medium text-gray-800 dark:text-gray-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                {item.submenu.label}
                              </span>
                              {isTabOpen && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-sans bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">تب باز</span>
                              )}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-850 text-gray-400 border border-gray-100 dark:border-gray-800">
                              {item.category}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Theme toggle */}
        <div className="flex items-center">
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
        </div>

        {/* User capsule */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-white/5 p-1.5 rounded-xl transition-all cursor-pointer outline-none select-none text-right"
            >
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  {user.fname} {user.lname}
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold font-sans">
                    {userRoles.find(r => r.active === 1)?.label || user.role}
                  </span>
                </span>
                <span className="text-[9px] text-gray-500 font-mono mt-0.5">{user.email}</span>
              </div>
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
                className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-750 shadow-xs"
              />
            </button>

            <AnimatePresence>
              {showUserDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-56 bg-white dark:bg-[#161618] border border-gray-150 dark:border-white/10 rounded-2xl shadow-xl z-50 py-2.5 text-right flex flex-col gap-1 overflow-hidden"
                  >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 text-right">
                      <span className="block text-[11px] font-black text-gray-900 dark:text-white">{user.fname} {user.lname}</span>
                      <span className="block text-[8px] text-gray-400 font-mono mt-0.5">{user.email}</span>
                    </div>
                    <button
                      onClick={() => { handleOpenTab('profile', 'مشخصات پروفایل', 'User'); setShowUserDropdown(false); }}
                      className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between w-full text-right cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-teal-500" />
                        <span>پروفایل من</span>
                      </span>
                    </button>

                    {/* Role switching — only show when user has more than 1 role (مطابق Enums::getMyRoles) */}
                    {userRoles.length > 1 && (
                      <div className="border-t border-b border-gray-100 dark:border-white/5 py-2 px-3 bg-gray-50/50 dark:bg-white/[0.02]">
                        <span className="block text-[9px] text-gray-400 font-extrabold mb-1.5 pr-1">تغییر نقش کاربری:</span>
                        <div className="flex flex-col gap-1">
                          {userRoles.map((r: RoleInfo) => {
                            const isActive = user.role === r.role;
                            return (
                              <button
                                key={r.id}
                                onClick={() => { handleChangeRole(r.role); setShowUserDropdown(false); }}
                                className={`px-2 py-1 text-[10px] rounded-lg flex items-center justify-between w-full text-right transition-colors cursor-pointer ${
                                  isActive ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                              >
                                <span>{r.label}</span>
                                {isActive && <Check className="w-3.5 h-3.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => { setShowUserDropdown(false); setShowLogoutModal(true); }}
                      className="px-4 py-2 text-[11px] text-rose-500 hover:bg-rose-500/10 flex items-center justify-between w-full text-right cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        <span>خروج از حساب</span>
                      </span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </header>

      {/* ===== 2. Three-Column Layout ===== */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ===== Column A: Sidebar Menu ===== */}
        <div className="border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 flex h-full z-45">
          {/* Narrow bar */}
          <div className="w-24 flex flex-col justify-between items-center py-4 border-l border-gray-50 dark:border-gray-850 shrink-0 select-none h-full overflow-y-auto custom-scrollbar">
            <div className="w-full px-1 flex flex-col items-center">
              {navLoading && filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center gap-2 pt-6">
                  <div className="w-5 h-5 border-2 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
                  <span className="text-[9px] text-gray-400">بارگذاری...</span>
                </div>
              ) : filteredCategories.length === 0 ? (
                <span className="text-[9px] text-gray-400 pt-6 text-center px-1">منویی یافت نشد</span>
              ) : (
                filteredCategories.map((cat) => {
                const isSelected = selectedMainCat === cat.key;
                const CatIcon = cat.icon;
                const hasSubmenus = cat.submenus.length > 0;
                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      if (hasSubmenus) {
                        setSelectedMainCat(isSelected ? null : cat.key);
                      } else if (cat.targetId) {
                        setSelectedMainCat(null);
                        handleOpenTab(cat.targetId, cat.title, cat.iconName || 'Folder');
                      }
                    }}
                    className={`w-20 h-18 rounded-xl transition-all duration-300 hover:scale-105 flex flex-col gap-1.5 items-center justify-center cursor-pointer p-1.5 ${
                      isSelected
                        ? 'bg-teal-500 text-white shadow-md shadow-teal-500/10'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850'
                    }`}
                  >
                    <CatIcon className="w-5 h-5 shrink-0" />
                    <span className="text-[9px] font-black leading-none text-center block whitespace-normal break-words max-w-[72px]">
                      {cat.title}
                    </span>
                  </button>
                );
              }))}
            </div>
          </div>

          {/* Submenu drawer — only shown when selected category has submenus */}
            {selectedMainCat && (() => {
              const selectedCat = filteredCategories.find(c => c.key === selectedMainCat);
              if (!selectedCat || selectedCat.submenus.length === 0) return null;
              return (
              <div className="overflow-hidden h-full flex flex-col bg-gray-50/50 dark:bg-gray-950/20 w-[210px]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between whitespace-nowrap">
                  <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                    {filteredCategories.find(c => c.key === selectedMainCat)?.title}
                  </span>
                  <button onClick={() => setSelectedMainCat(null)} className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-2.5 border-b border-gray-150/40 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="فیلتر گزینه‌های منو..."
                      value={drawerSubmenuFilter}
                      onChange={(e) => setDrawerSubmenuFilter(e.target.value)}
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-right pr-8 pl-3 py-1.5 text-[10px] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 font-sans"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5" />
                  </div>
                </div>
                <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                  {(() => {
                    const matchedSubs = (filteredCategories.find(c => c.key === selectedMainCat)?.submenus || [])
                      .filter(sub => !drawerSubmenuFilter || sub.label.includes(drawerSubmenuFilter) || sub.title.includes(drawerSubmenuFilter));
                    if (matchedSubs.length === 0) {
                      return <div className="text-center py-6 text-[10px] text-gray-400 font-sans">موردی پیدا نشد</div>;
                    }
                    return matchedSubs.map((sub, sidx) => {
                      const isTabOpen = tabs.some(t => t.id === sub.targetId || t.moduleType === sub.targetId);
                      const isTabActive = activeTabId === sub.targetId || (tabs.find(t => t.id === activeTabId)?.moduleType === sub.targetId);
                      return (
                        <div key={sidx} className="group/item flex items-center justify-between w-full hover:bg-gray-200/50 dark:hover:bg-gray-850/50 rounded-lg pr-2 pl-1 select-none transition-all duration-150">
                          <button
                            onClick={() => handleOpenTab(sub.targetId, sub.title, sub.iconName)}
                            className={`flex-1 text-right py-2 rounded text-[11px] leading-relaxed transition-all whitespace-normal cursor-pointer ${
                              isTabActive ? 'text-teal-700 dark:text-teal-400 font-black' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-250'
                            }`}
                          >
                            <span>{sub.label}</span>
                            {isTabOpen && <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500 mr-2 align-middle" title="دارای تب باز"></span>}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenTab(sub.targetId, sub.title, sub.iconName, true); }}
                            title="باز کردن یک تب مجزای جدید"
                            className="p-1 rounded bg-teal-500/10 hover:bg-teal-500 hover:text-white text-teal-600 dark:text-teal-400 opacity-0 group-hover/item:opacity-100 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0 w-5 h-5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
            })()}
        </div>

        {/* ===== Column B: Main Workspace ===== */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs bar */}
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 select-none flex items-center gap-1.5 overflow-x-auto min-h-[46px]">
            <button
              onClick={() => setActiveTabId(null)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-black cursor-pointer transition-all duration-205 flex items-center gap-1.5 shrink-0 ${
                activeTabId === null
                  ? 'bg-teal-500 hover:bg-teal-700 text-white border-teal-500 shadow-sm font-black'
                  : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border-gray-200/60 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>پیشخوان اصلی</span>
            </button>

            {tabs.length > 0 && (
              <div className="h-5 w-[1px] bg-gray-200 dark:bg-gray-750 shrink-0 mx-1.5"></div>
            )}

            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20'
                      : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-850 dark:hover:bg-gray-800 border-gray-200/60 dark:border-gray-700 text-gray-650 dark:text-gray-400'
                  }`}
                >
                  <span>{tab.title}</span>
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className={`p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer ${
                      isActive ? 'text-teal-700 dark:text-teal-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Canvas */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 custom-scrollbar">
            {renderActiveTabContent()}
          </main>
        </div>

        {/* ===== Column C: Auxiliary Tools ===== */}
        <div className="border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 flex flex-col justify-between items-center py-4 z-45">
          <div className="space-y-4 px-2">
            <button
              onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')}
              className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${
                activePanel === 'chat' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
              }`}
              title="چت پشتیبانی"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
            </button>
            <button
              onClick={() => setActivePanel(activePanel === 'notifications' ? null : 'notifications')}
              className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${
                activePanel === 'notifications' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
              }`}
              title="اعلان‌های سیستم"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -left-1 font-mono font-bold bg-rose-500 text-white text-[9px] h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center">
                  {unreadNotifCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActivePanel(activePanel === 'help' ? null : 'help')}
              className={`w-11 h-11 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center cursor-pointer relative ${
                activePanel === 'help' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850'
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
      <footer className="h-7 bg-[#fcfcfd] dark:bg-[#111113] border-t border-gray-100 dark:border-white/5 flex items-center justify-between px-6 shrink-0 select-none transition-colors">
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold flex items-center gap-1.5 transition-colors">
            <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse"></span>
            وضعیت شبکه: فعال و بهینه (Online)
          </span>
          <span className="text-[9px] text-gray-300 dark:text-slate-600 font-mono">Karant Portal v2.0</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-gray-300 dark:text-slate-600 font-mono">API: Connected</span>
          {user && (
            <span className="text-[9px] text-gray-300 dark:text-slate-600 flex items-center gap-1">
              <User className="w-3 h-3" />
              {user.fname} {user.lname}
            </span>
          )}
        </div>
      </footer>

      {/* Logout confirmation modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="p-6 max-w-sm w-full bg-white dark:bg-gray-900 border border-red-500/15 rounded-3xl text-center space-y-4"
            >
              <div className="inline-flex p-3 rounded-full bg-red-100 text-rose-600 dark:bg-rose-950/20">
                <LogOut className="w-10 h-10" />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white">
                خروج از حساب کاربری
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans font-medium">
                آیا مایل به خروج از حساب کاربری پرتال جامع دانشگاهی کارانت هستید؟
              </p>

              <div className="pt-3 border-t border-red-500/10 dark:border-red-500/5 space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[11px] font-black transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 inline-block ml-1 -mt-0.5" />
                  بله، خارج شو
                </button>
              </div>

              <button
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs cursor-pointer"
              >
                انصراف (بازگشت)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tab limit alert — modal */}
      <AnimatePresence>
        {showLimitAlert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="p-6 max-w-sm w-full bg-white dark:bg-gray-900 border border-red-500/15 rounded-3xl text-center space-y-4"
            >
              <div className="inline-flex p-3 rounded-full bg-red-100 text-rose-600 dark:bg-rose-950/20">
                <AlertTriangle className="w-10 h-10 animate-bounce" />
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white">
                ظرفیت تب‌های مرکز کار پر شده است!
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-sans font-medium">
                پرتال جامع دانشگاهی کارانت (ویژه دانشگاه علم و هنر) حداکثر مجهز به <strong>{MAX_TABS} تب باز همزمان</strong> را مجاز می‌شناسد. لطفاً جهت باز کردن بخش جدید علمی، ابتدا یکی از تب‌های غیرضروری را به کمک کلید ضربدر ببندید.
              </p>

              <div className="pt-3 border-t border-red-500/10 dark:border-red-500/5 space-y-2">
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                  ⚠️ هشدار: در صورت نیاز به بازنشانی کلِ فضای کار، می‌توانید تمامی تب‌های باز خود را فِرِش و تصفیه نمایید.
                </p>
                <button
                  onClick={handleClearAllTabs}
                  className={`w-full py-2.5 px-3 rounded-xl border text-[11px] font-black transition-all cursor-pointer ${
                    confirmClearActive
                      ? 'bg-red-600 border-red-600 text-white animate-pulse'
                      : 'border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 inline-block ml-1 -mt-0.5" />
                  {confirmClearActive ? 'بله، تایید نهایی و پاک‌سازی کامل' : 'بستن و پاکسازی کل تب‌های فعال'}
                </button>
                {confirmClearActive && (
                  <p className="text-[9px] text-rose-500 dark:text-rose-400 font-bold animate-pulse">
                    با کلیک مجدد، کل تب‌های جاری شما بسته خواهند شد!
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setShowLimitAlert(false);
                  setConfirmClearActive(false);
                }}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
              >
                متوجه شدم (بازگشت)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
