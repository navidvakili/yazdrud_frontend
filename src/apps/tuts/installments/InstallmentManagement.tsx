// ============================================================
// Installment Management Panel — مدیریت اقساط بن خرید
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    CreditCard, List, BarChart3, Search, Check, X, Clock,
    DollarSign, FileText, Users, AlertTriangle, ExternalLink,
    RefreshCw, Edit3, Filter,
} from 'lucide-react';
import { installmentsApi } from './api';
import type {
    InstallmentStats, InstallmentRegistration,
    RegistrationInstallment, InstallmentRegistrationDetail,
    VerifyInstallmentData,
} from './types';
import { toPersianDigits, formatCurrency, formatNumberWithCommas } from '@/src/shared-utils';

// ===== Utility formatters =====
const statusBadge = (status: string) => {
    switch (status) {
        case 'paid':
            return <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">پرداخت شده</span>;
        case 'pending':
            return <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/15">در انتظار</span>;
        case 'overdue':
            return <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/15">سررسید گذشته</span>;
        default:
            return <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-gray-100 dark:bg-gray-800 text-gray-500">{status}</span>;
    }
};

export default function InstallmentManagement() {
    const [activeTab, setActiveTab] = useState<'stats' | 'registrations'>('stats');
    const [stats, setStats] = useState<InstallmentStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // === Registration list state ===
    const [registrations, setRegistrations] = useState<InstallmentRegistration[]>([]);
    const [regLoading, setRegLoading] = useState(false);
    const [regPage, setRegPage] = useState(1);
    const [regTotalPages, setRegTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // === Detail modal state ===
    const [selectedRegId, setSelectedRegId] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<InstallmentRegistrationDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // === Verify modal state ===
    const [verifyInstallmentId, setVerifyInstallmentId] = useState<number | null>(null);
    const [verifyData, setVerifyData] = useState<VerifyInstallmentData>({});
    const [verifySaving, setVerifySaving] = useState(false);

    // === Toast ===
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Fetch stats
    useEffect(() => {
        if (activeTab === 'stats') {
            setLoading(true);
            installmentsApi.getStats()
                .then(setStats)
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [activeTab]);

    // Fetch registrations
    useEffect(() => {
        if (activeTab === 'registrations') {
            setRegLoading(true);
            const params: Record<string, string | number | boolean> = { per_page: 15, page: regPage };
            if (searchQuery) params.fullname = searchQuery;
            if (statusFilter) params.installment_status = statusFilter;
            installmentsApi.getRegistrations(params)
                .then((data: any) => {
                    if (data.data) {
                        setRegistrations(data.data);
                        setRegTotalPages(Math.max(1, Math.ceil(data.total / data.per_page)));
                    } else if (Array.isArray(data)) {
                        setRegistrations(data);
                        setRegTotalPages(1);
                    } else {
                        setRegistrations([]);
                        setRegTotalPages(1);
                    }
                })
                .catch(err => showToast(err.message, 'error'))
                .finally(() => setRegLoading(false));
        }
    }, [activeTab, regPage, searchQuery, statusFilter, showToast]);

    // Open detail modal
    const openDetail = async (registerId: number) => {
        setSelectedRegId(registerId);
        setDetailLoading(true);
        setDetailData(null);
        try {
            const data = await installmentsApi.getRegistrationDetail(registerId);
            setDetailData(data);
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setDetailLoading(false);
        }
    };

    // Open verify modal
    const openVerify = (installmentId: number) => {
        setVerifyInstallmentId(installmentId);
        setVerifyData({});
    };

    // Submit verification
    const handleVerify = async () => {
        if (verifyInstallmentId === null) return;
        setVerifySaving(true);
        try {
            await installmentsApi.verifyInstallment(verifyInstallmentId, verifyData);
            showToast('قسط با موفقیت تأیید شد.');
            setVerifyInstallmentId(null);
            setVerifyData({});
            // Refresh detail if open
            if (selectedRegId) openDetail(selectedRegId);
            // Refresh list
            setRegPage(1);
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setVerifySaving(false);
        }
    };

    // Revert payment
    const handleRevert = async (installmentId: number) => {
        if (!confirm('آیا از لغو تأیید این قسط اطمینان دارید؟')) return;
        try {
            await installmentsApi.revertPayment(installmentId);
            showToast('تأیید قسط لغو شد.');
            if (selectedRegId) openDetail(selectedRegId);
            setRegPage(1);
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                        <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 dark:text-white">مدیریت اقساط بن خرید</h2>
                        <p className="text-[10px] text-gray-400">مشاهده و مدیریت اقساط بن‌های خرید</p>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-gray-100/50 dark:bg-gray-950/20 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-850 w-fit">
                {[
                    { id: 'stats' as const, label: 'آمار و خلاصه', icon: BarChart3 },
                    { id: 'registrations' as const, label: 'لیست ثبت نام‌ها', icon: List },
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTab === tab.id
                            ? 'bg-white dark:bg-gray-800 shadow-xs text-indigo-600 dark:text-indigo-400'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ===== STATS TAB ===== */}
            {activeTab === 'stats' && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="p-8 text-center text-xs text-gray-400">در حال بارگذاری آمار...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-xs text-rose-500">{error}</div>
                    ) : stats ? (
                        <>
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'مجموع بن‌های اقساطی', value: `${toPersianDigits(stats.total_vouchers)} عدد`, icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                                    { label: 'مجموع ثبت نام‌ها', value: `${toPersianDigits(stats.total_registrations)} نفر`, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'مجموع اقساط', value: `${toPersianDigits(stats.total_installments)} عدد`, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'درصد وصول', value: `${toPersianDigits(stats.collection_percentage)}%`, icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                ].map((kpi, i) => (
                                    <div key={i} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl flex items-center justify-between shadow-xs">
                                        <div>
                                            <span className="text-[10px] text-gray-400 block font-bold mb-1">{kpi.label}</span>
                                            <span className="text-xl font-black text-gray-900 dark:text-white">{kpi.value}</span>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                                            <kpi.icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Installment Status Breakdown */}
                            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs">
                                <h5 className="text-xs font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
                                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                                    وضعیت اقساط
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/50">
                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">پرداخت شده</span>
                                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                                            {toPersianDigits(stats.paid_installments)}
                                        </div>
                                        <div className="text-[10px] text-emerald-500 mt-1">
                                            {formatCurrency(stats.total_collected)} ریال
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/50 dark:border-amber-900/50">
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">در انتظار پرداخت</span>
                                        <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                                            {toPersianDigits(stats.pending_installments)}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/50">
                                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">سررسید گذشته</span>
                                        <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                                            {toPersianDigits(stats.overdue_installments)}
                                        </div>
                                        <div className="text-[10px] text-rose-500 mt-1">
                                            از {formatCurrency(stats.total_expected)} ریال کل
                                        </div>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                                        <span>درصد وصول</span>
                                        <span>{toPersianDigits(stats.collection_percentage)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-l from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                                            style={{ width: `${Math.min(stats.collection_percentage, 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            )}

            {/* ===== REGISTRATIONS TAB ===== */}
            {activeTab === 'registrations' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setRegPage(1); }}
                                placeholder="جستجو بر اساس نام..."
                                className="w-full text-xs pr-10 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                        </div>
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setRegPage(1); }}
                            className="text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                            <option value="">همه وضعیت‌ها</option>
                            <option value="paid">پرداخت شده</option>
                            <option value="pending">در انتظار</option>
                            <option value="overdue">سررسید گذشته</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs overflow-hidden">
                        {regLoading ? (
                            <div className="p-8 text-center text-xs text-gray-400">در حال بارگذاری...</div>
                        ) : registrations.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-400">هیچ ثبت نام اقساطی یافت نشد.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-850 bg-gray-55/50 dark:bg-gray-950/50">
                                            <th className="text-right px-4 py-3 font-bold text-gray-500">نام</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-500">کد ملی</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-500">دوره</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-500">کد بن</th>
                                            <th className="text-right px-4 py-3 font-bold text-gray-500">وضعیت ثبت نام</th>
                                            <th className="text-center px-4 py-3 font-bold text-gray-500">قسط‌ها</th>
                                            <th className="text-left px-4 py-3 font-bold text-gray-500">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                        {registrations.map(reg => (
                                            <tr key={reg.id} className="hover:bg-gray-55/30 dark:hover:bg-gray-950/30 transition-colors">
                                                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{reg.fullname}</td>
                                                <td className="px-4 py-3 text-gray-500">{toPersianDigits(reg.kodmeli)}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[150px] truncate">{reg.course_title}</td>
                                                <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{reg.coupon_code}</td>
                                                <td className="px-4 py-3">{statusBadge(reg.registration_status)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <span className="text-emerald-600 font-bold">{toPersianDigits(reg.total_paid)}</span>
                                                        <span className="text-gray-300">/</span>
                                                        <span className="text-amber-600 font-bold">{toPersianDigits(reg.total_pending)}</span>
                                                        <span className="text-gray-300">/</span>
                                                        <span className="text-rose-600 font-bold">{toPersianDigits(reg.total_overdue)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-left">
                                                    <button onClick={() => openDetail(reg.id)}
                                                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1">
                                                        <ExternalLink className="w-3 h-3" />
                                                        جزئیات
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {!regLoading && regTotalPages > 1 && (
                            <div className="flex justify-between items-center p-3.5 border-t border-gray-100 dark:border-gray-850 bg-gray-55/50 dark:bg-gray-950/50">
                                <span className="text-[10px] text-gray-400">{toPersianDigits(registrations.length)} ثبت نام</span>
                                <div className="flex items-center gap-1">
                                    <button disabled={regPage <= 1} onClick={() => setRegPage(p => p - 1)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${regPage <= 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                                        قبلی
                                    </button>
                                    <span className="text-[10px] text-gray-500 px-2">{toPersianDigits(regPage)} از {toPersianDigits(regTotalPages)}</span>
                                    <button disabled={regPage >= regTotalPages} onClick={() => setRegPage(p => p + 1)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${regPage >= regTotalPages ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                                        بعدی
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== DETAIL MODAL ===== */}
            <AnimatePresence>
                {selectedRegId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => { setSelectedRegId(null); setDetailData(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-850 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                        >
                            {detailLoading ? (
                                <div className="p-8 text-center text-xs text-gray-400">در حال بارگذاری جزئیات...</div>
                            ) : detailData ? (
                                <>
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                            <CreditCard className="w-5 h-5 text-indigo-500" />
                                            جزئیات اقساط
                                        </h3>
                                        <button onClick={() => { setSelectedRegId(null); setDetailData(null); }}
                                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Learner Info */}
                                    <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 mb-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div>
                                                <span className="text-[9px] text-gray-400 block font-bold">نام</span>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{detailData.fullname}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-gray-400 block font-bold">کد ملی</span>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white" dir="ltr">{toPersianDigits(detailData.kodmeli)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-gray-400 block font-bold">موبایل</span>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white" dir="ltr">{toPersianDigits(detailData.mobile)}</span>
                                            </div>
                                            <div>
                                                <span className="text-[9px] text-gray-400 block font-bold">دوره</span>
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{detailData.course_title}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                <div>
                                                    <span className="text-[9px] text-gray-400 block font-bold">کد بن</span>
                                                    <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{detailData.coupon_code}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-gray-400 block font-bold">پیش پرداخت</span>
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {detailData.prepayment_amount ? formatCurrency(detailData.prepayment_amount) : 'ندارد'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-gray-400 block font-bold">تخفیف</span>
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                                                        {detailData.discount_amount ? formatCurrency(detailData.discount_amount) : 'ندارد'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Installment Template */}
                                    {detailData.installment_items && detailData.installment_items.length > 0 && (
                                        <div className="mb-4">
                                            <h6 className="text-[10px] font-black text-gray-400 mb-2">طرح اقساط</h6>
                                            <div className="flex flex-wrap gap-2">
                                                {detailData.installment_items.map((item, i) => (
                                                    <div key={item.id} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100/50 dark:border-indigo-900/50">
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">{item.title}</span>
                                                        <span className="text-xs font-black text-gray-900 dark:text-white">{formatCurrency(item.amount)}</span>
                                                        <span className="text-[9px] text-gray-400 block">سررسید: {item.due_date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Installments List */}
                                    <h6 className="text-[10px] font-black text-gray-400 mb-2">وضعیت پرداخت اقساط</h6>
                                    <div className="space-y-2">
                                        {detailData.installments && detailData.installments.length > 0 ? (
                                            detailData.installments.map((inst: RegistrationInstallment) => (
                                                <div key={inst.id}
                                                    className={`p-3 rounded-xl border ${inst.status === 'paid'
                                                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/50'
                                                        : inst.status === 'overdue'
                                                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100/50 dark:border-rose-900/50'
                                                            : 'bg-gray-55/50 dark:bg-gray-950/30 border-gray-100/50 dark:border-gray-850'}`}>
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-gray-900 dark:text-white">{inst.title}</span>
                                                                {statusBadge(inst.status)}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                                                                <span>مبلغ: {formatCurrency(inst.amount)}</span>
                                                                <span>سررسید: {inst.due_date}</span>
                                                                {inst.payment_method && (
                                                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${inst.payment_method === 'online' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                                        {inst.payment_method === 'online' ? 'آنلاین' : 'آفلاین'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {inst.paid_at && (
                                                                <div className="text-[9px] text-emerald-600 mt-1">
                                                                    پرداخت شده در {new Date(inst.paid_at).toLocaleDateString('fa-IR')}
                                                                    {inst.tracking_number && ` - کد رهگیری: ${inst.tracking_number}`}
                                                                </div>
                                                            )}
                                                            {inst.notes && (
                                                                <div className="text-[9px] text-gray-400 mt-0.5">یادداشت: {inst.notes}</div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            {inst.status === 'pending' && (
                                                                <button onClick={() => openVerify(inst.id)}
                                                                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1">
                                                                    <Check className="w-3 h-3" />
                                                                    تأیید
                                                                </button>
                                                            )}
                                                            {inst.status === 'paid' && (
                                                                <button onClick={() => handleRevert(inst.id)}
                                                                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1">
                                                                    <RefreshCw className="w-3 h-3" />
                                                                    لغو
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-[10px] text-gray-400">قسطی ثبت نشده است.</div>
                                        )}
                                    </div>

                                    {/* Summary */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500 font-bold">جمع پرداخت شده:</span>
                                            <span className="text-emerald-600 font-black">{formatCurrency(detailData.total_paid)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs mt-1">
                                            <span className="text-gray-500 font-bold">در انتظار:</span>
                                            <span className="text-amber-600 font-black">{formatCurrency(detailData.total_pending)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs mt-1">
                                            <span className="text-gray-500 font-bold">سررسید گذشته:</span>
                                            <span className="text-rose-600 font-black">{formatCurrency(detailData.total_overdue)}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 text-center text-xs text-gray-400">داده‌ای یافت نشد.</div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== VERIFY MODAL ===== */}
            <AnimatePresence>
                {verifyInstallmentId !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => { setVerifyInstallmentId(null); setVerifyData({}); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-850 w-full max-w-md p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                    تأیید پرداخت قسط
                                </h3>
                                <button onClick={() => { setVerifyInstallmentId(null); setVerifyData({}); }}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4 text-right">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 block">مبلغ پرداخت شده (ریال)</label>
                                    <input type="text" inputMode="numeric"
                                        value={verifyData.paid_amount ? formatNumberWithCommas(verifyData.paid_amount) : ''}
                                        onChange={e => {
                                            const raw = e.target.value.replace(/[^\d]/g, '');
                                            const num = raw ? parseInt(raw, 10) : 0;
                                            setVerifyData(f => ({ ...f, paid_amount: num }));
                                        }}
                                        placeholder="مبلغ را وارد کنید"
                                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 block">شماره رهگیری</label>
                                    <input type="text" value={verifyData.tracking_number || ''}
                                        onChange={e => setVerifyData(f => ({ ...f, tracking_number: e.target.value }))}
                                        placeholder="شماره رهگیری پرداخت"
                                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 block">یادداشت</label>
                                    <textarea value={verifyData.notes || ''}
                                        onChange={e => setVerifyData(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="یادداشت (اختیاری)"
                                        rows={3}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none resize-none" />
                                </div>
                                <button onClick={handleVerify} disabled={verifySaving}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5">
                                    {verifySaving ? 'در حال ذخیره...' : 'تأیید پرداخت'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200]">
                    <div className={`px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xl border backdrop-blur-md ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300' :
                        toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200/50 dark:border-rose-800/50 text-rose-700 dark:text-rose-300' :
                            'bg-blue-50 dark:bg-blue-950/80 border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300'}`}>
                        {toast.text}
                    </div>
                </div>
            )}
        </div>
    );
}
