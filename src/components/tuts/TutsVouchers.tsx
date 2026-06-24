// ============================================================
// TutsModule — Vouchers (Discount Code Manager + Sandbox)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Tag, Plus, List, Copy, Check, Trash2, Zap, Clock,
    MapPin, Smartphone, Gift, CreditCard, DollarSign,
    Beaker, AlertTriangle, Info, X, Flame,
} from 'lucide-react';
import type {
    TutCourse, TutCategory, TutVoucher,
    VoucherFormData, SandboxResult,
} from './tuts-types';
import { toPersianDigits, formatCurrency } from './tuts-utils';

interface TutsVouchersProps {
    vouchers: TutVoucher[];
    courses: TutCourse[];
    categories: TutCategory[];
    loadingVouchers: boolean;
    voucherActiveTab: 'list' | 'create';
    setVoucherActiveTab: (t: 'list' | 'create') => void;
    newVoucher: VoucherFormData;
    setNewVoucher: React.Dispatch<React.SetStateAction<VoucherFormData>>;
    sandboxCode: string;
    setSandboxCode: (v: string) => void;
    sandboxCourseId: string;
    setSandboxCourseId: (v: string) => void;
    sandboxUserId: string;
    setSandboxUserId: (v: string) => void;
    sandboxDevice: 'desktop' | 'mobile';
    setSandboxDevice: (v: 'desktop' | 'mobile') => void;
    sandboxResult: SandboxResult | null;
    setSandboxResult: (v: SandboxResult | null) => void;
    voucherPage: number;
    setVoucherPage: (v: number) => void;
    voucherPerPage: number;
    handleCreateVoucher: () => void;
    handleRunSandboxTest: () => void;
}

const VOUCHER_CONDITIONS = [
    { key: 'timeLimit', icon: Clock, label: 'محدودیت زمانی' },
    { key: 'geoLimit', icon: MapPin, label: 'محدودیت جغرافیایی' },
    { key: 'deviceLimit', icon: Smartphone, label: 'محدودیت دستگاه' },
    { key: 'firstPurchaseOnly', icon: Gift, label: 'اولین خرید' },
    { key: 'installmentsAllowed', icon: CreditCard, label: 'قسط‌بندی' },
    { key: 'budgetCap', icon: DollarSign, label: 'سقف بودجه' },
];

export default function TutsVouchers(props: TutsVouchersProps) {
    const {
        vouchers, courses, categories, loadingVouchers,
        voucherActiveTab, setVoucherActiveTab,
        newVoucher, setNewVoucher,
        sandboxCode, setSandboxCode, sandboxCourseId, setSandboxCourseId,
        sandboxUserId, setSandboxUserId, sandboxDevice, setSandboxDevice,
        sandboxResult, setSandboxResult,
        voucherPage, setVoucherPage, voucherPerPage,
        handleCreateVoucher, handleRunSandboxTest,
    } = props;

    const totalVoucherPages = Math.max(1, Math.ceil(vouchers.length / voucherPerPage));
    const paginatedVouchers = vouchers.slice((voucherPage - 1) * voucherPerPage, voucherPage * voucherPerPage);

    const handleCopyCode = async (code: string) => {
        try { await navigator.clipboard.writeText(code); } catch { /* ignore */ }
    };

    return (
        <div className="space-y-6">
            {/* Tab Switcher */}
            <div className="flex gap-2 bg-gray-100/50 dark:bg-gray-950/20 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-850 w-fit">
                {[
                    { id: 'list' as const, label: 'لیست بن‌های تخفیف', icon: List },
                    { id: 'create' as const, label: 'ایجاد بن جدید', icon: Plus },
                ].map(tab => (
                    <button key={tab.id} onClick={() => { setVoucherActiveTab(tab.id); setSandboxResult(null); }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${voucherActiveTab === tab.id
                            ? 'bg-white dark:bg-gray-800 shadow-xs text-teal-600 dark:text-teal-400'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {voucherActiveTab === 'list' ? (
                /* ===== LIST TAB ===== */
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'مجموع بن‌ها', value: `${toPersianDigits(vouchers.length)} عدد`, icon: Tag, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                            { label: 'بن‌های فعال', value: `${toPersianDigits(vouchers.filter(v => v.status === 'active').length)} عدد`, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'بن‌های مصرف شده', value: `${toPersianDigits(vouchers.filter(v => v.status === 'used').length)} عدد`, icon: Check, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'بن‌های منقضی', value: `${toPersianDigits(vouchers.filter(v => v.status === 'expired').length)} عدد`, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
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

                    {/* Voucher List */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs overflow-hidden">
                        {loadingVouchers ? (
                            <div className="p-8 text-center text-xs text-gray-400">در حال بارگذاری بن‌های تخفیف...</div>
                        ) : paginatedVouchers.length === 0 ? (
                            <div className="p-8 text-center text-xs text-gray-400">هیچ بن تخفیفی یافت نشد.</div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-850">
                                {paginatedVouchers.map(v => (
                                    <div key={v.id} className="p-4 hover:bg-gray-55/50 dark:hover:bg-gray-950/30 transition-colors">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl ${v.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' :
                                                    v.status === 'used' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-500' :
                                                        'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    <Tag className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-gray-900 dark:text-white text-sm">{v.code}</span>
                                                        <button onClick={() => handleCopyCode(v.code)}
                                                            className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                                            <Copy className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 block mt-0.5">
                                                        {v.discountType === 'percentage' ? `٪${toPersianDigits(v.discountValue)} تخفیف` : `${formatCurrency(v.discountValue)} تخفیف`}
                                                        {' · '}ظرفیت: {toPersianDigits(v.remainingUses)} از {toPersianDigits(v.maxUses)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${v.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15' :
                                                    v.status === 'used' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/15' :
                                                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                                    {v.status === 'active' ? 'فعال' : v.status === 'used' ? 'مصرف شده' : 'منقضی'}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Condition Tags */}
                                        <div className="flex flex-wrap gap-1.5 mt-2.5 mr-12">
                                            {VOUCHER_CONDITIONS.filter(c => (v as any)[c.key]).map(c => (
                                                <span key={c.key} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-bold flex items-center gap-1">
                                                    <c.icon className="w-2.5 h-2.5" />
                                                    {c.label}
                                                </span>
                                            ))}
                                            <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-950 text-gray-400 rounded-full text-[9px]">
                                                {v.applicableProductIds?.length || v.applicableCategoryIds?.length
                                                    ? `${toPersianDigits((v.applicableProductIds?.length || 0) + (v.applicableCategoryIds?.length || 0))} محدودیت`
                                                    : 'همه محصولات'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loadingVouchers && vouchers.length > voucherPerPage && (
                            <div className="flex justify-between items-center p-3.5 border-t border-gray-100 dark:border-gray-850 bg-gray-55/50 dark:bg-gray-950/50">
                                <span className="text-[10px] text-gray-400">{toPersianDigits(vouchers.length)} بن تخفیف</span>
                                <div className="flex items-center gap-1">
                                    <button disabled={voucherPage <= 1} onClick={() => setVoucherPage(voucherPage - 1)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${voucherPage <= 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                                        قبلی
                                    </button>
                                    <span className="text-[10px] text-gray-500 px-2">{toPersianDigits(voucherPage)} از {toPersianDigits(totalVoucherPages)}</span>
                                    <button disabled={voucherPage >= totalVoucherPages} onClick={() => setVoucherPage(voucherPage + 1)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${voucherPage >= totalVoucherPages ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                                        بعدی
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* ===== CREATE TAB ===== */
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Creation Form */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs space-y-5">
                            <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Plus className="w-4 h-4 text-teal-600" />
                                فرم ساخت بن تخفیف هوشمند
                            </h5>

                            <div className="space-y-4 text-right">
                                {/* Section 1: Basic Info */}
                                <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-3">
                                    <h6 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5">اطلاعات پایه بن</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">کد بن تخفیف</label>
                                            <input type="text" value={newVoucher.code} onChange={(e) => setNewVoucher(f => ({ ...f, code: e.target.value }))}
                                                placeholder="مثال: WELCOME10"
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">نوع تخفیف</label>
                                            <select value={newVoucher.discountType} onChange={(e) => setNewVoucher(f => ({ ...f, discountType: e.target.value as any }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                                                <option value="percentage">درصدی (٪)</option>
                                                <option value="fixed">مبلغ ثابت (ریال)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">مقدار تخفیف</label>
                                            <input type="number" value={newVoucher.discountValue || ''} onChange={(e) => setNewVoucher(f => ({ ...f, discountValue: Number(e.target.value) }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">تعداد دفعات استفاده</label>
                                            <input type="number" value={newVoucher.maxUses || ''} onChange={(e) => setNewVoucher(f => ({ ...f, maxUses: Number(e.target.value) }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Time Limits */}
                                <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-3">
                                    <h6 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5"><Clock className="w-3 h-3" />محدودیت زمانی</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">فعال از تاریخ</label>
                                            <input type="date" value={newVoucher.validFrom || ''} onChange={(e) => setNewVoucher(f => ({ ...f, validFrom: e.target.value }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">فعال تا تاریخ</label>
                                            <input type="date" value={newVoucher.validUntil || ''} onChange={(e) => setNewVoucher(f => ({ ...f, validUntil: e.target.value }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 dark:text-white focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Product / Category */}
                                <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-3">
                                    <h6 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5"><Tag className="w-3 h-3" />محصول و دسته‌بندی</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">دوره‌های مجاز</label>
                                            <select value={newVoucher.applicableProductIds?.[0] || ''} onChange={(e) => setNewVoucher(f => ({ ...f, applicableProductIds: e.target.value ? [e.target.value] : [] }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                                                <option value="">همه دوره‌ها</option>
                                                {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">دسته‌بندی مجاز</label>
                                            <select value={newVoucher.applicableCategoryIds?.[0] || ''} onChange={(e) => setNewVoucher(f => ({ ...f, applicableCategoryIds: e.target.value ? [e.target.value] : [] }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                                                <option value="">همه دسته‌ها</option>
                                                {categories.map((cat: any) => (<option key={cat.id || cat} value={cat.id || cat}>{cat.name || cat}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Budget / Installments */}
                                <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-3">
                                    <h6 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5"><CreditCard className="w-3 h-3" />بودجه و اقساط</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">سقف بودجه (ریال)</label>
                                            <input type="number" value={newVoucher.budgetCap || ''} onChange={(e) => setNewVoucher(f => ({ ...f, budgetCap: Number(e.target.value) }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">حداقل قسط</label>
                                            <input type="number" value={newVoucher.minInstallment || ''} onChange={(e) => setNewVoucher(f => ({ ...f, minInstallment: Number(e.target.value) }))}
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-1 flex items-end pb-1">
                                            <label className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 cursor-pointer">
                                                <input type="checkbox" checked={newVoucher.installmentsAllowed || false} onChange={(e) => setNewVoucher(f => ({ ...f, installmentsAllowed: e.target.checked }))}
                                                    className="rounded accent-teal-600" />
                                                قسط‌بندی مجاز باشد
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Section 5: Contextual */}
                                <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-3">
                                    <h6 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5"><Smartphone className="w-3 h-3" />محدودیت‌های متنی</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">محدودیت جغرافیایی</label>
                                            <input type="text" value={newVoucher.geoLimit || ''} onChange={(e) => setNewVoucher(f => ({ ...f, geoLimit: e.target.value }))}
                                                placeholder="مثال: تهران، اصفهان"
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">محدودیت دستگاه</label>
                                            <input type="text" value={newVoucher.deviceLimit || ''} onChange={(e) => setNewVoucher(f => ({ ...f, deviceLimit: e.target.value }))}
                                                placeholder="مثال: mobile, desktop"
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-1 flex items-end pb-1">
                                            <label className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 cursor-pointer">
                                                <input type="checkbox" checked={newVoucher.firstPurchaseOnly || false} onChange={(e) => setNewVoucher(f => ({ ...f, firstPurchaseOnly: e.target.checked }))}
                                                    className="rounded accent-teal-600" />
                                                فقط اولین خرید
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <button onClick={handleCreateVoucher}
                                    disabled={!newVoucher.code || !newVoucher.discountValue || !newVoucher.maxUses}
                                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5">
                                    <Zap className="w-4 h-4" />
                                    ایجاد بن تخفیف
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sandbox (Right Panel) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs space-y-5">
                            <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Beaker className="w-4 h-4 text-purple-500" />
                                سندباکس شبیه‌ساز بن تخفیف (۱۱ تست اعتبارسنجی)
                            </h5>

                            <div className="space-y-3 text-right">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 block">کد بن</label>
                                    <input type="text" value={sandboxCode} onChange={(e) => setSandboxCode(e.target.value)}
                                        placeholder="بن تخفیف را وارد کنید..."
                                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 block">شناسه دوره</label>
                                    <select value={sandboxCourseId} onChange={(e) => setSandboxCourseId(e.target.value)}
                                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                                        <option value="">انتخاب کنید...</option>
                                        {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 block">شناسه کاربر</label>
                                        <input type="text" value={sandboxUserId} onChange={(e) => setSandboxUserId(e.target.value)}
                                            placeholder="کد ملی یا دانشجویی"
                                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 block">نوع دستگاه</label>
                                        <select value={sandboxDevice} onChange={(e) => setSandboxDevice(e.target.value as 'desktop' | 'mobile')}
                                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                                            <option value="web">وب</option>
                                            <option value="mobile">موبایل</option>
                                            <option value="tablet">تبلت</option>
                                        </select>
                                    </div>
                                </div>

                                <button onClick={handleRunSandboxTest}
                                    disabled={!sandboxCode || !sandboxCourseId}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5">
                                    <Flame className="w-4 h-4" />
                                    اجرای ۱۱ تست اعتبارسنجی
                                </button>
                            </div>
                        </div>

                        {/* Sandbox Result */}
                        {sandboxResult && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs space-y-4">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                        <Beaker className="w-4 h-4 text-purple-500" />
                                        نتیجه سندباکس
                                    </h5>
                                    {sandboxResult.isValid ? (
                                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/15">
                                            ✅ معتبر
                                        </span>
                                    ) : (
                                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold border border-rose-500/15">
                                            ❌ نامعتبر
                                        </span>
                                    )}
                                </div>

                                {/* Discount info */}
                                {sandboxResult.isValid && sandboxResult.discountAmount && (
                                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-500/10 text-center">
                                        <span className="text-xs text-gray-500 font-bold block mb-1">مبلغ تخفیف اعمال شده</span>
                                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(sandboxResult.discountAmount)}
                                        </span>
                                    </div>
                                )}

                                {/* Error message */}
                                {sandboxResult.error && (
                                    <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-500/10 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <span className="text-[11px] text-rose-700 dark:text-rose-400">{sandboxResult.error}</span>
                                    </div>
                                )}

                                {/* Trace logs */}
                                <div className="space-y-1.5">
                                    <span className="text-[10px] font-black text-gray-400 flex items-center gap-1"><Info className="w-3 h-3" />گزارش تراکنش (Trace Logs)</span>
                                    {sandboxResult.checks?.map((log, i) => (
                                        <div key={i} className={`p-2 rounded-lg text-[10px] font-mono border ${log.passed
                                            ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                                            <div className="flex items-center gap-1.5">
                                                <span>{log.passed ? '✅' : '❌'}</span>
                                                <span className="font-bold">{log.title}</span>
                                            </div>
                                            <span className="block mr-4 text-gray-500">{log.desc}</span>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => setSandboxResult(null)}
                                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-xl text-[11px] text-gray-500 font-bold cursor-pointer">
                                    پاک کردن نتیجه
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
