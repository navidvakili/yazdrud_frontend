// ============================================================
// DashboardModule — پیشخوان اصلی بر اساس نقش کاربر
// ============================================================

import { motion } from 'motion/react';
import {
  User,
  FileText,
  BookOpen,
  GraduationCap,
  Users,
  DollarSign,
  Calendar,
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  BookMarked,
  Pin,
  PinOff,
  type LucideIcon,
} from 'lucide-react';
import type { User as UserType } from '@/src/types';
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
  onNavigate: (id: string, title: string, iconName: string) => void;
  openTabsCount: number;
  pinnedMenus?: string[];
  allMenuItems?: MenuAction[];
  onPinMenu?: (menuId: string) => void;
  onUnpinMenu?: (menuId: string) => void;
}

export default function DashboardModule({
  user,
  onNavigate,
  openTabsCount,
  pinnedMenus = [],
  allMenuItems,
  onPinMenu,
  onUnpinMenu,
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

  const stats = {
    student: [
      { label: 'واحدهای ثبت‌شده', value: '۱۸ واحد', icon: BookOpen, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40' },
      { label: 'معدل کل', value: '۱۶.۷۵', icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
      { label: 'پایان‌نامه', value: 'در حال انجام', icon: FileText, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
      { label: 'شهریه پرداختی', value: '۳,۴۵۰,۰۰۰ تومان', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
    ],
    professor: [
      { label: 'دانشجویان راهنما', value: '۱۲ نفر', icon: Users, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40' },
      { label: 'دروس جاری', value: '۴ درس', icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
      { label: 'پایان‌نامه‌های جاری', value: '۵ پایان‌نامه', icon: FileText, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
      { label: 'ساعت حضور', value: '۲۴ ساعت/هفته', icon: Clock, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
    ],
    admin: [
      { label: 'کل دانشجویان', value: '۶,۲۴۱ نفر', icon: Users, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40' },
      { label: 'اساتید فعال', value: '۱۸۲ نفر', icon: GraduationCap, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40' },
      { label: 'درخواست‌های pending', value: '۲۳ مورد', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40' },
      { label: 'شهریه واریزی ماه', value: '۲۳۰,۰۰۰,۰۰۰ تومان', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' },
    ],
  };

  const currentStats = stats[user.role] || stats.student;

  // Use dynamic menu items if provided, otherwise fall back to built-in list
  const quickActions: MenuAction[] = allMenuItems || [
    { id: 'profile', title: 'مشخصات پروفایل', icon: User, desc: 'ویرایش اطلاعات شخصی و مشاهده پرونده', roles: ['student', 'professor', 'admin'] as const },
    { id: 'students', title: 'مدیریت دانشجویان', icon: Users, desc: 'جستجو و مدیریت دانشجویان', roles: ['admin', 'professor'] as const },
    { id: 'courses', title: 'دروس و برنامه', icon: BookMarked, desc: 'برنامه هفتگی و دروس جاری', roles: ['student', 'professor', 'admin'] as const },
    { id: 'theses', title: 'پایان‌نامه‌ها', icon: FileText, desc: 'مدیریت پایان‌نامه و رساله', roles: ['student', 'professor', 'admin'] as const },
    { id: 'finance', title: 'امور مالی', icon: DollarSign, desc: 'مشاهده فاکتورها و تراکنش‌ها', roles: ['student', 'professor', 'admin'] as const },
  ];

  const filteredActions = quickActions.filter(a => a.roles.includes(user.role as any));

  const roleLabel = user.role === 'admin' ? 'مدیر سیستم' : user.role === 'professor' ? 'استاد' : 'دانشجو';
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
              <span className="block text-lg sm:text-xl font-black font-mono leading-none text-gray-900 dark:text-white">{MAX_TABS}</span>
              <span className="text-[8px] text-gray-500 dark:text-gray-400 font-bold block mt-1">تب همزمان مجاز</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 text-center min-w-[80px] shadow-xs">
              <span className="block text-lg sm:text-xl font-black font-mono leading-none text-teal-600 dark:text-teal-400">{openTabsCount}</span>
              <span className="text-[8px] text-gray-500 dark:text-gray-400 font-bold block mt-1">تب فعال فعلی</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {currentStats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-lg font-black text-gray-900 dark:text-white">{stat.value}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Pinned Quick Access — shown when user has pinned items */}
      {pinnedMenus.length > 0 && (
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Pin className="w-4 h-4 text-teal-500" />
            <span>میانبرهای منتخب شما</span>
            <span className="text-[10px] text-gray-400 font-bold font-mono bg-gray-50 dark:bg-gray-850 px-2 py-0.5 rounded-full">
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
                  {onUnpinMenu && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onUnpinMenu(action.id); }}
                      className="absolute top-1.5 left-1.5 p-1 rounded-md text-gray-300 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="حذف از میانبرها"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.button>
              ))}
          </div>
        </div>
      )}

      {/* All Quick Actions */}
      <div>
        <h3 className="text-base font-black text-gray-900 dark:text-white mb-4">
          دسترسی‌های سریع
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredActions.map((action, idx) => {
            const isPinned = pinnedMenus.includes(action.id);
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                onClick={() => onNavigate(action.id, action.title, action.icon.name)}
                className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-teal-500/30 dark:hover:border-teal-500/20 transition-all text-right cursor-pointer group"
              >
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all">
                  <action.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-right">
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">{action.title}</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 block">{action.desc}</span>
                </div>
                {/* Pin toggle */}
                {onPinMenu && onUnpinMenu && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPinned) {
                        onUnpinMenu(action.id);
                      } else {
                        onPinMenu(action.id);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                      isPinned
                        ? 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400'
                        : 'text-gray-300 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-950/30 opacity-0 group-hover:opacity-100'
                    }`}
                    title={isPinned ? 'حذف از میانبرها' : 'افزودن به میانبرها'}
                  >
                    <Pin className={`w-4 h-4 ${isPinned ? 'fill-teal-500' : ''}`} />
                  </button>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Role-specific info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800"
      >
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-5 h-5 text-teal-500" />
          <h3 className="text-sm font-black text-gray-900 dark:text-white">اطلاعات حساب کاربری</h3>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">نام و نام خانوادگی</span>
            <span className="text-gray-900 dark:text-gray-100">{user.fname} {user.lname}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">ایمیل</span>
            <span className="text-gray-900 dark:text-gray-100" dir="ltr">{user.email}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">موبایل</span>
            <span className="text-gray-900 dark:text-gray-100" dir="ltr">{user.mobile}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">نقش</span>
            <span className="text-gray-900 dark:text-gray-100">{roleLabel}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">کد ملی</span>
            <span className="text-gray-900 dark:text-gray-100" dir="ltr">{user.kodmeli}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
