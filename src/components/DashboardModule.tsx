// ============================================================
// DashboardModule — پیشخوان اصلی بر اساس نقش کاربر
// ============================================================

import { motion } from 'motion/react';
import {
  User,
  FileText,
  Users,
  DollarSign,
  BookMarked,
  Pin,
  type LucideIcon,
} from 'lucide-react';
import type { User as UserType, RoleInfo } from '@/src/types';
import { MAX_TABS } from '@/src/lib/constants';

interface MenuAction {
  id: string;
  title: string;
  icon: LucideIcon;
  desc: string;
  roles: readonly ('student' | 'professor' | 'admin')[];
}

interface DashboardModuleProps {
  user: UserType | null;
  userRoles?: RoleInfo[];
  onNavigate: (id: string, title: string, iconName: string) => void;
  openTabsCount: number;
  pinnedMenus?: string[];
  allMenuItems?: MenuAction[];
}

export default function DashboardModule({
  user,
  userRoles = [],
  onNavigate,
  openTabsCount,
  pinnedMenus = [],
  allMenuItems,
}: DashboardModuleProps) {
  if (!user) return null;

  /** Convert English digits to Persian */
  function toPersianDigits(str: string | number): string {
    if (str === null || str === undefined) return '';
    const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/[0-9]/g, function (w) {
      return id[+w];
    });
  }

  // Use dynamic menu items if provided, otherwise fall back to built-in list
  const quickActions: MenuAction[] = allMenuItems || [
    { id: 'profile', title: 'مشخصات پروفایل', icon: User, desc: 'ویرایش اطلاعات شخصی و مشاهده پرونده', roles: ['student', 'professor', 'admin'] as const },
    { id: 'students', title: 'مدیریت دانشجویان', icon: Users, desc: 'جستجو و مدیریت دانشجویان', roles: ['admin', 'professor'] as const },
    { id: 'courses', title: 'دروس و برنامه', icon: BookMarked, desc: 'برنامه هفتگی و دروس جاری', roles: ['student', 'professor', 'admin'] as const },
    { id: 'theses', title: 'پایان‌نامه‌ها', icon: FileText, desc: 'مدیریت پایان‌نامه و رساله', roles: ['student', 'professor', 'admin'] as const },
    { id: 'finance', title: 'امور مالی', icon: DollarSign, desc: 'مشاهده فاکتورها و تراکنش‌ها', roles: ['student', 'professor', 'admin'] as const },
  ];

  const filteredActions = quickActions.filter(a => a.roles.includes(user.role as any));

  const roleLabel = userRoles.find(r => r.active === 1)?.label
    || (user.role === 'admin' ? 'مدیر سیستم' : user.role === 'professor' ? 'استاد' : user.role === 'student' ? 'دانشجو' : user.role);
  const roleColor = user.role === 'admin' ? 'from-rose-500/10 to-amber-500/10' : user.role === 'professor' ? 'from-indigo-500/10 to-teal-500/10' : 'from-teal-500/10 to-indigo-500/10';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${roleColor} rounded-2xl p-6 border border-gray-100 dark:border-gray-800`}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              خوش آمدید، {user.fname} {user.lname}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              به پیشخوان کاربری خود خوش آمدید. نقش فعلی: <span className="font-bold text-teal-600 dark:text-teal-400">{roleLabel}</span>
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 text-center min-w-[80px] shadow-xs">
              <span className="block text-lg sm:text-xl font-black  leading-none text-gray-900 dark:text-white">{MAX_TABS}</span>
              <span className="text-[8px] text-gray-500 dark:text-gray-400 font-bold block mt-1">تب همزمان مجاز</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 text-center min-w-[80px] shadow-xs">
              <span className="block text-lg sm:text-xl font-black  leading-none text-teal-600 dark:text-teal-400">{openTabsCount}</span>
              <span className="text-[8px] text-gray-500 dark:text-gray-400 font-bold block mt-1">تب فعال فعلی</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pinned Quick Access — shown when user has pinned items */}
      {pinnedMenus.length > 0 && (
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Pin className="w-4 h-4 text-teal-500" />
            <span>میانبرهای منتخب شما</span>
            <span className="text-[10px] text-gray-400 font-bold  bg-gray-50 dark:bg-gray-850 px-2 py-0.5 rounded-full">
              {toPersianDigits(pinnedMenus.length)}
            </span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredActions
              .filter(a => pinnedMenus.includes(a.id))
              .map((action, idx) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  onClick={() => onNavigate(action.id, action.title, action.icon.name)}
                  className="flex items-start gap-3 p-4 bg-gradient-to-br from-teal-50/80 to-indigo-50/50 dark:from-teal-950/30 dark:to-indigo-950/20 rounded-xl border border-teal-200/60 dark:border-teal-800/40 hover:shadow-md hover:border-teal-500/40 transition-all text-right cursor-pointer group relative"
                >
                  <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
                    <action.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-gray-900 dark:text-white block truncate">{action.title}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block line-clamp-1">{action.desc}</span>
                  </div>
                </motion.button>
              ))}
          </div>
        </div>
      )}

    </div>
  );
}
