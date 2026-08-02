// ============================================================
// Header — نوار بالای پورتال
// ============================================================

import { useState } from 'react';
import {
  Search, X, Lock, Check, LogOut, Menu, Globe, Settings2, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { User as UserType } from '@/src/shared-types';
import type { Tab } from '@/src/layouts/types';
import type { RoleInfo } from '@/src/login/types';
import type { MenuCategory, SubmenuItem } from './menuConfig';
import ThemeToggle from './ThemeToggle';
import { useLanguage } from '@/src/shared-utils/LanguageContext';
import LanguageManagerModal from '@/src/shared-components/LanguageManagerModal';

interface HeaderProps {
  user: UserType | null;
  userRoles: RoleInfo[];
  menuCategories: MenuCategory[];
  tabs: Tab[];
  theme: 'light' | 'dark';
  handleOpenTab: (id: string, title: string, iconName: string, forceNewInstance?: boolean) => void;
  setSelectedMainCat: (key: string | null) => void;
  handleToggleTheme: () => void;
  handleChangeRole: (role: string) => void;
  setShowLogoutModal: (show: boolean) => void;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function Header({
  user, userRoles, menuCategories, tabs, theme,
  handleOpenTab, setSelectedMainCat,
  handleToggleTheme, handleChangeRole, setShowLogoutModal, setIsMobileMenuOpen,
}: HeaderProps) {
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showLangManager, setShowLangManager] = useState(false);
  const { languages, currentLang, setCurrentLang, getLanguage } = useLanguage();
  // Only the user with username "support" can manage languages.
  // NOTE: hasRole() is NOT used here because admin/support bypass all role
  // checks (super-user), and the requirement is ONLY the support username.
  const canManageLanguages = user?.username === 'support';
  const currentLanguage = getLanguage(currentLang);

  return (
    <header className="p-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        {/* Hamburger button — visible on mobile only */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
          title="منوی اصلی"
        >
          <Menu className="w-5 h-5" />
        </button>
        <img src="/logo_nima.png" alt="نیما" className="h-9 w-auto" />
        <div>
          <h1 className="font-black text-sm text-gray-900 dark:text-white">
            نرم‌افزار یکپارچه مدیریت محتوای <span className="text-teal-600 dark:text-teal-400">نیما</span>
          </h1>
          <p className="text-[10px] text-gray-400 animate-pulse">سامانه یکپارچه مدیریت محتوا</p>
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

      {/* Language selector */}
      {user && (
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 p-1.5 pr-3 rounded-xl transition-all cursor-pointer outline-none select-none"
            title="زبان محتوا"
          >
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-teal-500" />
              <span className="hidden lg:flex flex-col items-start">
                <span className="text-[9px] text-gray-400 font-bold">زبان محتوا</span>
                <span className="text-[11px] font-black text-gray-900 dark:text-white font-sans uppercase leading-3">
                  {currentLanguage?.code || currentLang || 'fa'}
                  <span className="text-[9px] font-bold text-gray-400 mr-1">
                    {currentLanguage?.name || ''}
                  </span>
                </span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
            </span>
          </button>

          <AnimatePresence>
            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangDropdown(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#161618] border border-gray-150 dark:border-white/10 rounded-2xl shadow-xl z-50 py-2.5 text-right flex flex-col gap-0.5 overflow-hidden"
                >
                  <span className="px-4 pb-1.5 text-[9px] text-gray-400 font-extrabold border-b border-gray-100 dark:border-white/5 mb-1">
                    زبان محتوای در حال نمایش — هر زبان محتوای جداگانه دارد
                  </span>
                  <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto px-1.5">
                    {languages.length === 0 && (
                      <span className="px-3 py-3 text-[10px] text-gray-400 text-center">
                        در حال بارگذاری زبان‌ها...
                      </span>
                    )}
                    {languages.map((lng) => (
                      <button
                        key={lng.id}
                        onClick={() => {
                          setCurrentLang(lng.code);
                          setShowLangDropdown(false);
                        }}
                        className={`px-3 py-2 text-[11px] rounded-lg flex items-center justify-between w-full text-right cursor-pointer transition-colors ${currentLang === lng.code ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-850 text-[9px] font-black flex items-center justify-center font-sans uppercase">
                            {lng.code}
                          </span>
                          <span>{lng.name}</span>
                          {lng.is_default && (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                              پیش‌فرض
                            </span>
                          )}
                        </span>
                        {currentLang === lng.code && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                  {canManageLanguages && (
                    <button
                      onClick={() => { setShowLangDropdown(false); setShowLangManager(true); }}
                      className="mx-1.5 mt-1.5 px-3 py-2 text-[11px] text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 flex items-center justify-between w-[calc(100%-12px)] text-right cursor-pointer rounded-lg transition-colors border-t border-gray-100 dark:border-white/5"
                    >
                      <span className="flex items-center gap-2">
                        <Settings2 className="w-3.5 h-3.5" />
                        مدیریت زبان‌ها
                      </span>
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

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
                  {userRoles.find(r => r.active === 1)?.label || ((Array.isArray(user.roles) && user.roles.includes('support')) ? 'پشتیبان' : (Array.isArray(user.roles) && user.roles.includes('admin')) ? 'مدیر سامانه' : (Array.isArray(user.roles) && user.roles.includes('editor')) ? 'ویرایشگر محتوا' : 'کاربر')}
                </span>
              </span>
              <span className="text-[9px] text-gray-500  mt-0.5">{user.email}</span>
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
                    <span className="block text-[8px] text-gray-400  mt-0.5">{user.email}</span>
                  </div>
                  <button
                    onClick={() => { handleOpenTab('change-password', 'تغییر کلمه عبور', 'Lock'); setShowUserDropdown(false); }}
                    className="px-4 py-2 text-[11px] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between w-full text-right cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-teal-500" />
                      <span>تغییر کلمه عبور</span>
                    </span>
                  </button>

                  {/* Theme toggle */}
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-700 dark:text-gray-200">تغییر تم</span>
                      <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
                    </div>
                  </div>

                  {/* Role switching */}
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
                              className={`px-2 py-1 text-[10px] rounded-lg flex items-center justify-between w-full text-right transition-colors cursor-pointer ${isActive ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
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

      {/* Language manager modal */}
      <LanguageManagerModal open={showLangManager} onClose={() => setShowLangManager(false)} />
    </header>
  );
}
