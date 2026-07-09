// ============================================================
// DashboardModule — پیشخوان اصلی بر اساس نقش کاربر
// شامل ویجت‌های مدیریت لحظه‌ای برای مدیران دوره‌های آموزشی
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  FileText,
  Users,
  DollarSign,
  BookMarked,
  Pin,
  ClipboardList,
  Calendar,
  MessageSquare,
  Upload,
  Award,
  TrendingUp,
  ChevronLeft,
  Star,
  CreditCard,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import type { User as UserType } from '@/src/shared-types';
import type { RoleInfo } from '@/src/login/types';
import type { DashboardOverview } from '@/src/dashboard/types';
import { MAX_TABS } from '@/src/shared-constants';
import { dashboardApi } from '@/src/dashboard/api';

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

// ===== Module-level Helpers =====

/** Convert English digits to Persian */
function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

/** Status color classes for registration status badges */
function statusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    refunded: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return map[status] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
}

/** Payment method display text */
function paymentMethodText(method: string): string {
  return method === 'online' ? 'آنلاین' : 'فیش بانکی';
}

// ===== Sub-components =====

/** Quick stat mini-card */
function StatCard({ icon: Icon, label, value, color }: {
  icon: LucideIcon; label: string; value: string | number; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-bold block leading-relaxed">{label}</span>
          <span className="text-lg font-black text-gray-900 dark:text-white">{typeof value === 'number' ? toPersianDigits(value) : value}</span>
        </div>
      </div>
    </motion.div>
  );
}

/** Widget wrapper card with header and optional "view all" link */
function WidgetCard({ title, icon: Icon, iconColor, onViewAll, children }: {
  title: string; icon: LucideIcon; iconColor?: string; onViewAll?: () => void; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800/60">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${iconColor || 'bg-teal-500/10 text-teal-600 dark:text-teal-400'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
          >
            مشاهده همه
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="px-5 py-3 max-h-[280px] overflow-y-auto">
        {children}
      </div>
    </motion.div>
  );
}

/** Empty state placeholder for widgets */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-xs text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
}

/** Star rating display (1-5) */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}`}
        />
      ))}
    </div>
  );
}

/** Loading skeleton for widget content */
function WidgetSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-2.5 bg-gray-50 dark:bg-gray-850 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== Main Component =====

export default function DashboardModule({
  user,
  userRoles = [],
  onNavigate,
  openTabsCount,
  pinnedMenus = [],
  allMenuItems,
}: DashboardModuleProps) {
  // ===== Overview Data =====
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    dashboardApi.getOverview()
      .then(data => {
        if (!cancelled) setOverview(data);
      })
      .catch(() => {
        if (!cancelled) setError('خطا در دریافت اطلاعات پیشخوان');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (!user) return null;

  const isManagement = user.role !== 'student';

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
              <span className="block text-lg sm:text-xl font-black leading-none text-gray-900 dark:text-white">{toPersianDigits(MAX_TABS)}</span>
              <span className="text-[8px] text-gray-500 dark:text-gray-400 font-bold block mt-1">تب همزمان مجاز</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 text-center min-w-[80px] shadow-xs">
              <span className="block text-lg sm:text-xl font-black leading-none text-teal-600 dark:text-teal-400">{toPersianDigits(openTabsCount)}</span>
              <span className="text-[8px] text-gray-500 dark:text-gray-400 font-bold block mt-1">تب فعال فعلی</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== Pinned Quick Access (shortcuts) — بالای ویجت‌ها ===== */}
      {pinnedMenus.length > 0 && (
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Pin className="w-4 h-4 text-teal-500" />
            <span>میانبرهای منتخب شما</span>
            <span className="text-[10px] text-gray-400 font-bold bg-gray-50 dark:bg-gray-850 px-2 py-0.5 rounded-full">
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

      {/* ===== Management Dashboard Widgets (non-student only) ===== */}
      {isManagement && (
        <>
          {/* Quick Stats Row */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16" />
                      <div className="h-5 bg-gray-50 dark:bg-gray-850 rounded w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : overview && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={BookMarked}
                label="دوره‌های فعال"
                value={overview.quick_stats.active_courses}
                color="bg-gradient-to-br from-teal-500 to-emerald-600"
              />
              <StatCard
                icon={Users}
                label="ثبت‌نام‌های تأیید شده"
                value={overview.quick_stats.confirmed_registrations}
                color="bg-gradient-to-br from-indigo-500 to-violet-600"
              />
              <StatCard
                icon={Upload}
                label="فیش‌های تایید نشده"
                value={overview.quick_stats.unapproved_receipts_count}
                color="bg-gradient-to-br from-amber-500 to-orange-600"
              />
              <StatCard
                icon={Award}
                label="گواهی‌های در انتظار"
                value={overview.quick_stats.pending_certificates}
                color="bg-gradient-to-br from-rose-500 to-pink-600"
              />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="text-center py-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Main Widgets Grid — 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Latest Registrations */}
            <WidgetCard
              title="آخرین ثبت‌نام‌ها"
              icon={ClipboardList}
              iconColor="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              onViewAll={() => onNavigate('tuts-reports', 'گزارشات ثبت نام', 'FileText')}
            >
              {loading ? <WidgetSkeleton /> : !overview ? <EmptyState message="اطلاعاتی در دسترس نیست" /> : (
                overview.latest_registrations.length === 0 ? (
                  <EmptyState message="هیچ ثبت‌نامی یافت نشد" />
                ) : (
                  <ul className="divide-y divide-gray-50 dark:divide-gray-800/60 -mx-1">
                    {overview.latest_registrations.slice(0, 7).map(reg => (
                      <li key={reg.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                        <div className="flex-1 min-w-0 ml-3">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{reg.fullname}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{reg.course_title || 'بدون دوره'}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{reg.created_at}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeColor(reg.status)}`}>
                            {reg.status_text}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-500">{paymentMethodText(reg.payment_method)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </WidgetCard>

            {/* 2. This Week's Installments */}
            <WidgetCard
              title="اقساط جاری این هفته"
              icon={Calendar}
              iconColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              onViewAll={() => onNavigate('tuts-installments', 'مدیریت اقساط', 'CreditCard')}
            >
              {loading ? <WidgetSkeleton /> : !overview ? <EmptyState message="اطلاعاتی در دسترس نیست" /> : (
                <>
                  {overview.current_week_installments.count > 0 && (
                    <div className="text-center mb-3">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">
                        {toPersianDigits(overview.current_week_installments.count)} قسط در هفته جاری
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">
                        از {overview.current_week_installments.week_start} تا {overview.current_week_installments.week_end}
                      </span>
                    </div>
                  )}
                  {overview.current_week_installments.items.length === 0 ? (
                    <EmptyState message="قسطی برای این هفته وجود ندارد" />
                  ) : (
                    <ul className="divide-y divide-gray-50 dark:divide-gray-800/60 -mx-1">
                      {overview.current_week_installments.items.slice(0, 6).map(inst => (
                        <li key={inst.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                          <div className="flex-1 min-w-0 ml-3">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{inst.fullname || 'نامشخص'}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                              {inst.course_title || ''} — {inst.title}
                            </p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">سررسید: {inst.due_date}</p>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-sm font-black text-gray-900 dark:text-white">{inst.amount_formatted}</p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">در انتظار پرداخت</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </WidgetCard>

            {/* 3. Recent Surveys */}
            <WidgetCard
              title="نظرسنجی‌های جدید"
              icon={MessageSquare}
              iconColor="bg-sky-500/10 text-sky-600 dark:text-sky-400"
              onViewAll={() => onNavigate('tuts-surveys', 'مدیریت نظرسنجی‌ها', 'MessageSquare')}
            >
              {loading ? <WidgetSkeleton /> : !overview ? <EmptyState message="اطلاعاتی در دسترس نیست" /> : (
                overview.recent_surveys.length === 0 ? (
                  <EmptyState message="نظرسنجی جدیدی ثبت نشده است" />
                ) : (
                  <ul className="divide-y divide-gray-50 dark:divide-gray-800/60 -mx-1">
                    {overview.recent_surveys.slice(0, 6).map(survey => (
                      <li key={survey.id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{survey.fullname}</p>
                          <StarRating rating={survey.rating} />
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{survey.course_title || 'بدون دوره'}</p>
                        {survey.comment && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">"{survey.comment}"</p>
                        )}
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{survey.created_at}</p>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </WidgetCard>

            {/* 4. Unapproved Receipts */}
            <WidgetCard
              title="فیش‌های تایید نشده"
              icon={Upload}
              iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              onViewAll={() => onNavigate('tuts-receipts', 'مدیریت فیش‌های بانکی', 'Upload')}
            >
              {loading ? <WidgetSkeleton /> : !overview ? <EmptyState message="اطلاعاتی در دسترس نیست" /> : (
                <>
                  {overview.unapproved_receipts.count > 0 && (
                    <div className="text-center mb-3">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">
                        {toPersianDigits(overview.unapproved_receipts.count)} فیش نیاز به بررسی دارد
                      </span>
                    </div>
                  )}
                  {overview.unapproved_receipts.items.length === 0 ? (
                    <EmptyState message="هیچ فیش تایید نشده‌ای وجود ندارد" />
                  ) : (
                    <ul className="divide-y divide-gray-50 dark:divide-gray-800/60 -mx-1">
                      {overview.unapproved_receipts.items.map(receipt => (
                        <li key={receipt.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                          <div className="flex-1 min-w-0 ml-3">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{receipt.fullname}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{receipt.course_title || 'بدون دوره'}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{receipt.created_at}</p>
                          </div>
                          <div className="text-left shrink-0">
                            <p className="text-sm font-black text-gray-900 dark:text-white">{receipt.amount_formatted}</p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">در انتظار تایید</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </WidgetCard>
          </div>
        </>
      )}
    </div>
  );
}
