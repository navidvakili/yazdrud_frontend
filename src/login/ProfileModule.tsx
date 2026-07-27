// ============================================================
// ProfileModule — مشخصات پروفایل کاربر
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Phone,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  LogOut,
  Trash2,
} from 'lucide-react';
import type { User as UserType } from '@/src/shared-types';
import type { ActiveSession, RoleInfo } from '@/src/login/types';
import { loginApi } from '@/src/login';

interface ProfileModuleProps {
  user: UserType;
  userRoles: RoleInfo[];
  onUpdateUser: (user: UserType) => void;
}

export default function ProfileModule({ user, userRoles, onUpdateUser }: ProfileModuleProps) {
  const [fname, setFname] = useState(user.fname);
  const [lname, setLname] = useState(user.lname);
  const [mobile, setMobile] = useState(user.mobile);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Sessions state
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);
  const [otherSessions, setOtherSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await loginApi.getActiveSessions();
      setCurrentSession(data.data.current_session);
      setOtherSessions(data.data.other_sessions);
    } catch (err: any) {
      setSessionsError(err.message || 'خطا در دریافت اطلاعات نشست‌ها');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (tokenId: string) => {
    setRevokingId(tokenId);
    try {
      await loginApi.revokeSession(tokenId);
      // Remove from list
      setOtherSessions(prev => prev.filter(s => s.token_id !== tokenId));
    } catch (err: any) {
      setSessionsError(err.message || 'خطا در باطل کردن نشست');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    setRevokingId('all');
    try {
      const tokens = otherSessions.map(s => s.token_id);
      for (const tokenId of tokens) {
        await loginApi.revokeSession(tokenId);
      }
      setOtherSessions([]);
    } catch (err: any) {
      setSessionsError(err.message || 'خطا در باطل کردن نشست‌ها');
    } finally {
      setRevokingId(null);
    }
  };

  const handleSave = async () => {
    setMessage(null);
    setIsSaving(true);
    try {
      const updated = await loginApi.updateProfile({ fname, lname, mobile });
      onUpdateUser(updated);
      setMessage({ type: 'success', text: 'پروفایل با موفقیت به‌روزرسانی شد.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'خطا در به‌روزرسانی پروفایل.' });
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel = userRoles.find(r => r.active === 1)?.label
    || (user.roles?.includes('admin') ? 'مدیر سامانه' : user.roles?.includes('editor') ? 'ویرایشگر محتوا' : 'کاربر');

  const formatDateTime = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getDeviceIcon = (session: ActiveSession) => {
    const platform = (session.platform || '').toLowerCase();
    const browser = (session.browser || '').toLowerCase();
    if (platform.includes('android') || platform.includes('ios') || platform.includes('iphone')) {
      return <Smartphone className="w-4 h-4" />;
    }
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ========== Profile Card ========== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">مشخصات پروفایل</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">ویرایش اطلاعات حساب کاربری خود</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-avatar.svg'; }}
              className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
            <div>
              <span className="block text-sm font-bold text-gray-900 dark:text-white">{user.fname} {user.lname}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{roleLabel}</span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {message.text}
            </div>
          )}

          {/* Form fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام</label>
              <input
                type="text"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام خانوادگی</label>
              <input
                type="text"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">موبایل</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Static Info */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-xl">
            <div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">کد ملی</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{user.kodmeli}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">نام کاربری</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{user.username}</span>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> ذخیره...</>
              ) : (
                <><Save className="w-4 h-4" /> ذخیره تغییرات</>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ========== Active Sessions Card ========== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white">نشست‌های فعال</h2>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">مدیریت دستگاه‌های متصل به حساب شما</p>
              </div>
            </div>
            <button
              onClick={fetchSessions}
              disabled={sessionsLoading}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 cursor-pointer"
            >
              {sessionsLoading ? 'در حال بارگذاری...' : 'بروزرسانی'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {sessionsError && (
            <div className="mb-4 p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {sessionsError}
            </div>
          )}

          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Current session */}
              {currentSession && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(currentSession)}
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-200 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                        نشست فعلی
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block">مرورگر</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{currentSession.browser || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block">سیستم عامل</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{currentSession.platform || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block">آی‌پی</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium" dir="ltr">{currentSession.ip_address || '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 dark:text-gray-500 block">تاریخ لاگین</span>
                      <span className="text-gray-800 dark:text-gray-200 font-medium">{formatDateTime(currentSession.login_at)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Other sessions */}
              {otherSessions.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      سایر نشست‌ها ({otherSessions.length})
                    </span>
                    <button
                      onClick={handleRevokeAllOthers}
                      disabled={revokingId === 'all'}
                      className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      {revokingId === 'all' ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> در حال...</>
                      ) : (
                        <><Trash2 className="w-3 h-3" /> خروج از همه</>
                      )}
                    </button>
                  </div>

                  {otherSessions.map((session) => (
                    <div
                      key={session.token_id}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-gray-400 dark:text-gray-500 block">مرورگر</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium flex items-center gap-1">
                              {getDeviceIcon(session)} {session.browser || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 dark:text-gray-500 block">سیستم عامل</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">{session.platform || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 dark:text-gray-500 block">آی‌پی</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium" dir="ltr">{session.ip_address || '—'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 dark:text-gray-500 block">تاریخ لاگین</span>
                            <span className="text-gray-800 dark:text-gray-200 font-medium">{formatDateTime(session.login_at)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRevokeSession(session.token_id)}
                          disabled={revokingId === session.token_id}
                          className="shrink-0 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-all disabled:opacity-50 cursor-pointer"
                          title="خروج از نشست"
                        >
                          {revokingId === session.token_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOut className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* No sessions message */}
              {!sessionsLoading && !currentSession && otherSessions.length === 0 && (
                <div className="text-center py-8">
                  <Globe className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-400 dark:text-gray-500">هیچ نشست فعالی یافت نشد</p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
