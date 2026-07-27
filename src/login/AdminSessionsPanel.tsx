// ============================================================
// AdminSessionsPanel — مدیریت نشست‌های فعال (مدیر سیستم)
// ============================================================

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Globe,
    Loader2,
    AlertCircle,
    Monitor,
    Smartphone,
    LogOut,
    Search,
    RefreshCw,
    User as UserIcon,
    Clock,
    CheckCircle2,
    ShieldAlert,
} from 'lucide-react';
import type { AdminSession } from '@/src/login/types';
import { loginApi } from '@/src/login';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';

export default function AdminSessionsPanel() {
    const { hasRole } = useAppPermissions();
    const [sessions, setSessions] = useState<AdminSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await loginApi.getAllActiveSessions();
            setSessions(data.data);
        } catch (err: any) {
            setError(err.message || 'خطا در دریافت اطلاعات نشست‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevoke = async (tokenId: string) => {
        setRevokingId(tokenId);
        setSuccessMessage(null);
        try {
            await loginApi.adminRevokeSession(tokenId);
            setSessions(prev => prev.filter(s => s.token_id !== tokenId));
            setSuccessMessage('نشست مورد نظر با موفقیت باطل شد');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            setError(err.message || 'خطا در باطل کردن نشست');
            setTimeout(() => setError(null), 3000);
        } finally {
            setRevokingId(null);
        }
    };

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

    const getDeviceIcon = (platform: string) => {
        const p = (platform || '').toLowerCase();
        if (p.includes('android') || p.includes('ios') || p.includes('iphone')) {
            return <Smartphone className="w-4 h-4" />;
        }
        return <Monitor className="w-4 h-4" />;
    };

    const filteredSessions = sessions.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (s.user_id && s.user_id.toLowerCase().includes(q)) ||
            (s.full_name && s.full_name.toLowerCase().includes(q)) ||
            (s.ip_address && s.ip_address.includes(q)) ||
            (s.browser && s.browser.toLowerCase().includes(q)) ||
            (s.platform && s.platform.toLowerCase().includes(q))
        );
    });

    // Permission gate — only admins should see this panel
    if (!hasRole('admin')) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShieldAlert className="w-16 h-16 text-red-400 dark:text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                    دسترسی غیرمجاز
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                    شما مجوز دسترسی به مدیریت نشست‌ها را ندارید. فقط مدیران سامانه می‌توانند از این بخش استفاده کنند.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-gray-900 dark:text-white">مدیریت نشست‌های فعال</h2>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                    مشاهده و مدیریت تمام نشست‌های فعال کاربران
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={fetchSessions}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            بروزرسانی
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative max-w-sm">
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="جستجو بر اساس نام کاربری، IP، مرورگر..."
                            className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                    </div>
                </div>

                {/* Success message */}
                {successMessage && (
                    <div className="mx-6 mt-4 p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        {successMessage}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : filteredSessions.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">
                                {searchQuery ? 'نشستی با مشخصات جستجو شده یافت نشد' : 'هیچ نشست فعالی وجود ندارد'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Table header - hidden on mobile */}
                            <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                <div className="col-span-2">کاربر</div>
                                <div className="col-span-2">مرورگر / سیستم</div>
                                <div className="col-span-2">آی‌پی</div>
                                <div className="col-span-2">تاریخ لاگین</div>
                                <div className="col-span-2">نقش</div>
                                <div className="col-span-2"></div>
                            </div>

                            {filteredSessions.map((session) => (
                                <div
                                    key={session.token_id}
                                    className={`p-4 rounded-xl border transition-all ${session.is_current
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
                                            : 'bg-gray-50 dark:bg-gray-850 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                                        }`}
                                >
                                    <div className="grid md:grid-cols-12 gap-3 items-center">
                                        {/* User info */}
                                        <div className="md:col-span-2">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                                <div>
                                                    <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                                                        {session.full_name || session.user_id}
                                                    </span>
                                                    <span className="block text-[10px] text-gray-400" dir="ltr">
                                                        {session.user_id}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Browser / Platform */}
                                        <div className="md:col-span-2">
                                            <div className="flex items-center gap-1.5">
                                                {getDeviceIcon(session.platform)}
                                                <div>
                                                    <span className="block text-xs text-gray-800 dark:text-gray-200">
                                                        {session.browser || '—'}
                                                    </span>
                                                    <span className="block text-[10px] text-gray-400">
                                                        {session.platform || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* IP */}
                                        <div className="md:col-span-2">
                                            <span className="text-xs text-gray-800 dark:text-gray-200 font-medium" dir="ltr">
                                                {session.ip_address || '—'}
                                            </span>
                                        </div>

                                        {/* Login date */}
                                        <div className="md:col-span-2">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="text-xs text-gray-800 dark:text-gray-200">
                                                    {formatDateTime(session.login_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Role */}
                                        <div className="md:col-span-2">
                                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${session.role === 'admin'
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                                    : session.role === 'editor'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {session.role === 'admin' ? 'مدیر' : session.role === 'editor' ? 'ویرایشگر' : 'کاربر'}
                                            </span>
                                            {session.is_current && (
                                                <span className="mr-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                                    فعلی
                                                </span>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="md:col-span-2 flex justify-end">
                                            <button
                                                onClick={() => handleRevoke(session.token_id)}
                                                disabled={revokingId === session.token_id || session.is_current}
                                                className={`p-2 rounded-lg transition-all disabled:opacity-50 cursor-pointer ${session.is_current
                                                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                        : 'text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                                    }`}
                                                title={session.is_current ? 'نشست فعلی شماست' : 'باطل کردن نشست'}
                                            >
                                                {revokingId === session.token_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <LogOut className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Summary */}
                            <div className="mt-4 px-4 py-3 bg-gray-50 dark:bg-gray-850 rounded-xl text-[11px] text-gray-500 dark:text-gray-400">
                                مجموع: <span className="font-bold text-gray-800 dark:text-gray-200">{sessions.length}</span> نشست فعال •
                                جستجو: <span className="font-bold text-gray-800 dark:text-gray-200">{filteredSessions.length}</span> مورد
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
