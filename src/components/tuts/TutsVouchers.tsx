// ============================================================
// TutsModule — Vouchers (Discount Code Manager + Sandbox)
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Tag, Plus, List, Copy, Check, Trash2, Zap, Clock,
    MapPin, Smartphone, Gift, CreditCard, DollarSign,
    Beaker, AlertTriangle, Info, X, Flame, Search, Sparkles,
} from 'lucide-react';
import type {
    TutCourse, TutCategory, TutVoucher,
    VoucherFormData, SandboxResult,
} from './tuts-types';
import { toPersianDigits, formatCurrency, toEnglishDigits } from './tuts-utils';
import { JalaliDatepicker } from './JalaliDatepicker';
import api from '../../api';
import { mapVoucher, mapCourse } from './tuts-utils';
import ToastNotification from './ToastNotification';

interface TutsVouchersProps {
    vouchers: TutVoucher[];
    courses: TutCourse[];
    categories: TutCategory[];
    courseGroups: { id: number; title: string }[];
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
    sandboxEmail: string;
    setSandboxEmail: (v: string) => void;
    sandboxPhone: string;
    setSandboxPhone: (v: string) => void;
    sandboxResult: SandboxResult | null;
    setSandboxResult: (v: SandboxResult | null) => void;
    voucherPage: number;
    setVoucherPage: (v: number) => void;
    voucherPerPage: number;
    handleCreateVoucher: () => void;
    handleRunSandboxTest: () => void;
    // Edit/Delete
    editingVoucher: TutVoucher | null;
    setEditingVoucher: (v: TutVoucher | null) => void;
    showEditModal: boolean;
    setShowEditModal: (v: boolean) => void;
    showDeleteModal: boolean;
    setShowDeleteModal: (v: boolean) => void;
    deletingVoucher: TutVoucher | null;
    setDeletingVoucher: (v: TutVoucher | null) => void;
    deleteConfirmWord: string;
    deleteInput: string;
    setDeleteInput: (v: string) => void;
    handleUpdateVoucher: (id: string, data: Partial<TutVoucher>) => Promise<void>;
    handleDeleteVoucher: (id: string) => Promise<void>;
    openDeleteConfirm: (v: TutVoucher) => void;
}

const VOUCHER_CONDITIONS = [
    { key: 'timeLimit', icon: Clock, label: 'محدودیت زمانی', check: (v: TutVoucher) => !!v.validFrom || !!v.validTo },
    { key: 'courseLimit', icon: Tag, label: 'محدودیت دوره', check: (v: TutVoucher) => !!v.courseId && v.courseId !== 'all' },
    { key: 'groupLimit', icon: MapPin, label: 'محدودیت گروه', check: (v: TutVoucher) => !!v.group_id },
    { key: 'nationalCodeLimit', icon: Gift, label: 'محدودیت کد ملی', check: (v: TutVoucher) => !!(v.nationalCodes?.length) },
    { key: 'maxDiscountCap', icon: DollarSign, label: 'سقف تخفیف', check: (v: TutVoucher) => !!v.maxDiscount && v.maxDiscount > 0 },
];

export default function TutsVouchers(props: TutsVouchersProps) {
    const {
        vouchers, courses, categories, courseGroups, loadingVouchers,
        voucherActiveTab, setVoucherActiveTab,
        newVoucher, setNewVoucher,
        sandboxCode, setSandboxCode, sandboxCourseId, setSandboxCourseId,
        sandboxUserId, setSandboxUserId,
        sandboxEmail, setSandboxEmail, sandboxPhone, setSandboxPhone,
        sandboxResult, setSandboxResult,
        voucherPage, setVoucherPage, voucherPerPage,
        handleCreateVoucher, handleRunSandboxTest,
        editingVoucher, setEditingVoucher,
        showEditModal, setShowEditModal,
        showDeleteModal, setShowDeleteModal,
        deletingVoucher, setDeletingVoucher,
        deleteConfirmWord, deleteInput, setDeleteInput,
        handleUpdateVoucher, handleDeleteVoucher, openDeleteConfirm,
    } = props;

    // ===== Local Toast =====
    const [localToast, setLocalToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showLocalToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
        setLocalToast({ text, type });
        setTimeout(() => setLocalToast(null), 4000);
    }, []);

    const totalVoucherPages = Math.max(1, Math.ceil(vouchers.length / voucherPerPage));
    const paginatedVouchers = vouchers.slice((voucherPage - 1) * voucherPerPage, voucherPage * voucherPerPage);

    const handleCopyCode = async (code: string) => {
        try { await navigator.clipboard.writeText(code); showLocalToast(`کد "${code}" کپی شد.`); } catch { showLocalToast('خطا در کپی کد', 'error'); }
    };

    // --- Auto-generate code (frontend) ---
    const handleGenerateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        setNewVoucher(f => ({ ...f, code }));
    };

    // --- Course autocomplete ---
    const [courseSearch, setCourseSearch] = useState('');
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
    const courseRef = useRef<HTMLDivElement>(null);

    // --- Group autocomplete (Create form) ---
    const [sandboxOpen, setSandboxOpen] = useState(false);
    const [nationalCodeInput, setNationalCodeInput] = useState('');

    const [newGroupSearch, setNewGroupSearch] = useState('');
    const [newGroupTitle, setNewGroupTitle] = useState('');
    const [newGroupDropdownOpen, setNewGroupDropdownOpen] = useState(false);
    const newGroupRef = useRef<HTMLDivElement>(null);
    const newGroupId = newVoucher.groupId;

    const filteredCourses = courses.filter(c => {
        // If a group is selected, only show courses belonging to that group
        if (newGroupId) {
            const gId = typeof newGroupId === 'string' ? parseInt(newGroupId) : newGroupId;
            if (c.group_id !== gId) return false;
        }
        return c.title.toLowerCase().includes(courseSearch.toLowerCase());
    });

    const newFilteredGroups = courseGroups.filter(g =>
        g.title.toLowerCase().includes(newGroupSearch.toLowerCase())
    );

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (courseRef.current && !courseRef.current.contains(e.target as Node)) {
                setCourseDropdownOpen(false);
            }
            if (newGroupRef.current && !newGroupRef.current.contains(e.target as Node)) {
                setNewGroupDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className="space-y-6">
            {/* Tab Switcher + Sandbox Button */}
            <div className="flex gap-2 bg-gray-100/50 dark:bg-gray-950/20 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-850 w-fit items-center">
                {[
                    { id: 'list' as const, label: 'لیست بن‌های تخفیف', icon: List },
                    { id: 'create' as const, label: 'ایجاد بن جدید', icon: Plus },
                ].map(tab => (
                    <button key={tab.id} onClick={() => {
                        setVoucherActiveTab(tab.id);
                        setSandboxResult(null);
                        if (tab.id === 'create') {
                            setNewVoucher({
                                code: '', title: '', discountType: 'percentage', discountValue: 0, maxUses: 100,
                                validFrom: '', validUntil: '', applicableProductIds: [], applicableCategoryIds: [],
                                budgetCap: 0, minInstallment: 0, installmentsAllowed: false, geoLimit: '',
                                deviceLimit: '', firstPurchaseOnly: false, groupId: null, isActive: true,
                                maxDiscount: 0, nationalCodes: [],
                            });
                        }
                    }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${voucherActiveTab === tab.id
                            ? 'bg-white dark:bg-gray-800 shadow-xs text-teal-600 dark:text-teal-400'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button onClick={() => { setSandboxOpen(true); setSandboxResult(null); }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30">
                    <Beaker className="w-4 h-4" />
                    سندباکس
                </button>
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
                                                        {' · '}باقی‌مانده: {toPersianDigits(v.remainingUses)} از {toPersianDigits(v.maxUses)} ({toPersianDigits(v.totalUsed)} مصرف شده)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${v.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15' :
                                                    v.status === 'used' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/15' :
                                                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                                    {v.status === 'active' ? 'فعال' : v.status === 'used' ? 'مصرف شده' : 'منقضی'}
                                                </span>
                                                {/* Edit button */}
                                                <button
                                                    onClick={() => { setEditingVoucher(v); setShowEditModal(true); }}
                                                    className="p-1.5 rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer"
                                                    title="ویرایش بن">
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                                        <path d="m15 5 4 4"/>
                                                    </svg>
                                                </button>
                                                {/* Delete button */}
                                                <button
                                                    onClick={() => openDeleteConfirm(v)}
                                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${v.totalUsed > 0
                                                        ? 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                                                        : 'text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20'}`}
                                                    title={v.totalUsed > 0 ? 'این بن قبلاً استفاده شده است و قابل حذف نمی‌باشد' : 'حذف بن'}
                                                    disabled={v.totalUsed > 0}>
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18"/>
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                        <line x1="10" x2="10" y1="11" y2="17"/>
                                                        <line x1="14" x2="14" y1="11" y2="17"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        {/* Condition Tags */}
                                        <div className="flex flex-wrap gap-1.5 mt-2.5 mr-12">
                                            {VOUCHER_CONDITIONS.filter(c => c.check(v)).map(c => (
                                                <span key={c.key} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full text-[9px] font-bold flex items-center gap-1">
                                                    <c.icon className="w-2.5 h-2.5" />
                                                    {c.label}
                                                </span>
                                            ))}
                                            <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-950 text-gray-400 rounded-full text-[9px]">
                                                {v.courseId && v.courseId !== 'all'
                                                    ? 'محدود به دوره'
                                                    : v.group_id
                                                        ? 'محدود به گروه'
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
                <div className="space-y-6">
                    {/* Creation Form */}
                    <div className="space-y-6">
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
                                        <div className="space-y-1 sm:col-span-2">
                                            <label className="text-[10px] font-bold text-gray-500 block">عنوان بن</label>
                                            <input type="text" value={newVoucher.title || ''} onChange={(e) => setNewVoucher(f => ({ ...f, title: e.target.value }))}
                                                placeholder="مثال: بن تخفیف نوروزی"
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">کد بن تخفیف</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={newVoucher.code} onChange={(e) => setNewVoucher(f => ({ ...f, code: e.target.value }))}
                                                    placeholder="مثال: WELCOME10"
                                                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono" />
                                                <button type="button" onClick={handleGenerateCode}
                                                    className="px-3 py-2.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border border-indigo-200/50 dark:border-indigo-800/50"
                                                    title="کد اتوماتیک">
                                                    <Sparkles className="w-4 h-4" />
                                                    تولید کد
                                                </button>
                                            </div>
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
                                            <JalaliDatepicker
                                                value={newVoucher.validFrom}
                                                onChange={(v) => setNewVoucher(f => ({ ...f, validFrom: v }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">فعال تا تاریخ</label>
                                            <JalaliDatepicker
                                                value={newVoucher.validUntil}
                                                onChange={(v) => setNewVoucher(f => ({ ...f, validUntil: v }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Product / Category */}
                                <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-3">
                                    <h6 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5"><Tag className="w-3 h-3" />محصول و دسته‌بندی</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div ref={newGroupRef} className="space-y-1 relative">
                                            <label className="text-[10px] font-bold text-gray-500 block">دسته‌بندی مجاز</label>
                                            <div className="relative">
                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                <input type="text" value={newGroupSearch || newGroupTitle}
                                                    onFocus={() => { setNewGroupSearch(''); setNewGroupDropdownOpen(true); }}
                                                    onChange={(e) => { setNewGroupSearch(e.target.value); setNewGroupDropdownOpen(true); }}
                                                    placeholder="همه گروه‌ها"
                                                    className="w-full text-xs px-3.5 py-2.5 pr-9 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                            </div>
                                            {newGroupDropdownOpen && (
                                                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                    <button type="button" onClick={() => { setNewVoucher(f => ({ ...f, groupId: null })); setNewGroupTitle(''); setNewGroupSearch(''); setCourseSearch(''); setNewGroupDropdownOpen(false); }}
                                                        className={`w-full text-right px-3.5 py-2 text-[11px] font-bold transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!newGroupId ? 'text-teal-600 bg-teal-50/50 dark:bg-teal-950/20' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        همه گروه‌ها
                                                    </button>
                                                    {newFilteredGroups.map(g => (
                                                        <button key={g.id} type="button" onClick={() => { setNewVoucher(f => ({ ...f, groupId: g.id })); setNewGroupTitle(g.title); setNewGroupSearch(g.title); setCourseSearch(''); setNewGroupDropdownOpen(false); }}
                                                            className={`w-full text-right px-3.5 py-2 text-[11px] font-bold transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${newGroupId === g.id ? 'text-teal-600 bg-teal-50/50 dark:bg-teal-950/20' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {g.title}
                                                        </button>
                                                    ))}
                                                    {newFilteredGroups.length === 0 && (
                                                        <div className="px-3.5 py-3 text-[10px] text-gray-400 text-center">گروهی یافت نشد</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1 relative" ref={courseRef}>
                                            <label className="text-[10px] font-bold text-gray-500 block">دوره‌های مجاز</label>
                                            <div className="relative">
                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                <input type="text" value={courseSearch}
                                                    onFocus={() => { setCourseSearch(''); setCourseDropdownOpen(true); }}
                                                    onChange={(e) => { setCourseSearch(e.target.value); setCourseDropdownOpen(true); }}
                                                    placeholder="جستجوی دوره..."
                                                    className="w-full text-xs px-3.5 py-2.5 pr-9 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                            </div>
                                            {courseDropdownOpen && (
                                                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                    <button onClick={() => { setNewVoucher(f => ({ ...f, applicableProductIds: [] })); setCourseSearch(''); setCourseDropdownOpen(false); }}
                                                        className={`w-full text-right px-3.5 py-2 text-[11px] font-bold transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!newVoucher.applicableProductIds?.length ? 'text-teal-600 bg-teal-50/50 dark:bg-teal-950/20' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        همه دوره‌ها
                                                    </button>
                                                    {filteredCourses.map(c => (
                                                        <button key={c.id} onClick={() => { setNewVoucher(f => ({ ...f, applicableProductIds: [c.id] })); setCourseSearch(c.title); setCourseDropdownOpen(false); }}
                                                            className={`w-full text-right px-3.5 py-2 text-[11px] font-bold transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${newVoucher.applicableProductIds?.[0] === c.id ? 'text-teal-600 bg-teal-50/50 dark:bg-teal-950/20' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {c.title}
                                                        </button>
                                                    ))}
                                                    {filteredCourses.length === 0 && (
                                                        <div className="px-3.5 py-3 text-[10px] text-gray-400 text-center">دوره‌ای یافت نشد</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 4: Advanced Settings (Max Discount + National Codes) */}
                                <div className="p-4 bg-gray-55/50 dark:bg-gray-950/30 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-3">
                                    <h6 className="text-[10px] font-black text-gray-400 flex items-center gap-1.5"><DollarSign className="w-3 h-3" />تنظیمات پیشرفته</h6>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">حداکثر مبلغ تخفیف (سقف)</label>
                                            <input type="text" value={newVoucher.maxDiscount > 0 ? newVoucher.maxDiscount.toLocaleString('en-US') : ''} onChange={(e) => {
                                                const raw = e.target.value.replace(/[^\d]/g, '');
                                                setNewVoucher(f => ({ ...f, maxDiscount: raw ? Number(raw) : 0 }));
                                            }}
                                                placeholder="مثال: 1,000,000"
                                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none ltr text-left" />
                                            <span className="text-[9px] text-gray-400 block mt-0.5">در صورت درصدی بودن تخفیف، مبلغ نهایی از این مقدار بیشتر نخواهد شد</span>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-gray-500 block">کد ملی مجاز</label>
                                            <div className="flex gap-2">
                                                <input type="text" value={nationalCodeInput} onChange={(e) => setNationalCodeInput(e.target.value)}
                                                    placeholder="کد ملی"
                                                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none ltr text-left" />
                                                <button type="button" onClick={() => {
                                                    const code = nationalCodeInput.trim();
                                                    if (code && !newVoucher.nationalCodes.includes(code)) {
                                                        setNewVoucher(f => ({ ...f, nationalCodes: [...f.nationalCodes, code] }));
                                                        setNationalCodeInput('');
                                                    }
                                                }}
                                                    className="px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                                                    ثبت
                                                </button>
                                            </div>
                                            {(newVoucher.nationalCodes?.length || 0) > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {newVoucher.nationalCodes.map((code, i) => (
                                                        <span key={i} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-indigo-200/50 dark:border-indigo-800/50">
                                                            {code}
                                                            <button type="button" onClick={() => setNewVoucher(f => ({ ...f, nationalCodes: f.nationalCodes.filter((_, j) => j !== i) }))}
                                                                className="hover:text-red-500 cursor-pointer">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <span className="text-[9px] text-gray-400 block mt-0.5">فقط کاربران با این کدهای ملی می‌توانند از بن استفاده کنند</span>
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
                </div>
            )}

            {/* ===== SANDBOX MODAL ===== */}
            <AnimatePresence>
                {sandboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => { setSandboxOpen(false); setSandboxResult(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-850 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <Beaker className="w-5 h-5 text-purple-500" />
                                    سندباکس شبیه‌ساز بن تخفیف
                                    <span className="text-[10px] font-bold text-gray-400 mr-2">(۶ تست اعتبارسنجی)</span>
                                </h3>
                                <button onClick={() => { setSandboxOpen(false); setSandboxResult(null); }}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 block">کد بن</label>
                                        <input type="text" value={sandboxCode} onChange={(e) => setSandboxCode(e.target.value)}
                                            placeholder="مثال: WELCOME10"
                                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 block">دوره</label>
                                        <select value={sandboxCourseId} onChange={(e) => setSandboxCourseId(e.target.value)}
                                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                                            <option value="">انتخاب کنید...</option>
                                            {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 block">شناسه کاربر (کد ملی/دانشجویی)</label>
                                        <input type="text" value={sandboxUserId} onChange={(e) => setSandboxUserId(e.target.value)}
                                            placeholder="کد ملی یا دانشجویی"
                                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 block">موبایل (بررسی خرید اول)</label>
                                        <input type="text" value={sandboxPhone} onChange={(e) => setSandboxPhone(e.target.value)}
                                            placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 block">ایمیل (بررسی خرید اول)</label>
                                        <input type="text" value={sandboxEmail} onChange={(e) => setSandboxEmail(e.target.value)}
                                            placeholder="مثال: student@example.com"
                                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button onClick={handleRunSandboxTest}
                                        disabled={!sandboxCode || !sandboxCourseId}
                                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5">
                                        <Flame className="w-4 h-4" />
                                        اجرای ۶ تست اعتبارسنجی
                                    </button>
                                    {sandboxResult && (
                                        <button onClick={() => setSandboxResult(null)}
                                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-2xl text-[11px] text-gray-500 font-bold cursor-pointer">
                                            پاک کردن نتیجه
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sandbox Result */}
                            {sandboxResult && (
                                <div className="mt-5 border-t border-gray-100 dark:border-gray-850 pt-5 space-y-4">
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
                                    {sandboxResult.isValid && sandboxResult.discountAmount ? (
                                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-500/10 text-center">
                                            <span className="text-xs text-gray-500 font-bold block mb-1">مبلغ تخفیف اعمال شده</span>
                                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                {formatCurrency(sandboxResult.discountAmount)}
                                            </span>
                                        </div>
                                    ) : null}

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
                                </div>
                            )}

                            {/* Close button */}
                            <button onClick={() => { setSandboxOpen(false); setSandboxResult(null); }}
                                className="w-full mt-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer">
                                بستن
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== EDIT MODAL ===== */}
            <AnimatePresence>
                {showEditModal && editingVoucher && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => { setShowEditModal(false); setEditingVoucher(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-850 w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                        <path d="m15 5 4 4"/>
                                    </svg>
                                    ویرایش بن تخفیف
                                </h3>
                                <button onClick={() => { setShowEditModal(false); setEditingVoucher(null); }}
                                    className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <EditForm
                                key={editingVoucher.id}
                                voucher={editingVoucher}
                                courses={courses}
                                courseGroups={courseGroups}
                                onSave={(data) => handleUpdateVoucher(editingVoucher.id, data)}
                                onCancel={() => { setShowEditModal(false); setEditingVoucher(null); }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== DELETE CONFIRM MODAL ===== */}
            <AnimatePresence>
                {showDeleteModal && deletingVoucher && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => { setShowDeleteModal(false); setDeletingVoucher(null); setDeleteInput(''); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-850 w-full max-w-md p-6"
                        >
                            <div className="text-center mb-5">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                                    <svg className="w-7 h-7 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"/>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                    </svg>
                                </div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-white">حذف بن تخفیف</h3>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    آیا از حذف بن <span className="font-bold text-gray-700 dark:text-gray-300">{deletingVoucher.code}</span> اطمینان دارید؟<br />
                                    این عملیات قابل بازگشت نیست.
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-950/50 rounded-2xl p-4 mb-4">
                                <p className="text-[10px] text-gray-500 font-bold mb-2 text-center">
                                    برای تأیید، کد زیر را وارد کنید:
                                </p>
                                <p className="text-lg font-black text-center text-gray-900 dark:text-white mb-3 tracking-widest">
                                    {deleteConfirmWord}
                                </p>
                                <input
                                    type="text"
                                    value={deleteInput}
                                    onChange={(e) => setDeleteInput(e.target.value)}
                                    placeholder="کد تأیید را وارد کنید..."
                                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none text-center font-mono tracking-wider"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => { setShowDeleteModal(false); setDeletingVoucher(null); setDeleteInput(''); }}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer">
                                    انصراف
                                </button>
                                <button onClick={() => handleDeleteVoucher(deletingVoucher.id)}
                                    disabled={deleteInput !== deleteConfirmWord}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18"/>
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                    </svg>
                                    تأیید و حذف
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ToastNotification toast={localToast} />
        </div>
    );
}

// ===== Edit Form Sub-Component =====
function EditForm({ voucher, courses, courseGroups, onSave, onCancel }: {
    voucher: TutVoucher;
    courses: TutCourse[];
    courseGroups: { id: number; title: string }[];
    onSave: (data: Partial<TutVoucher>) => Promise<void>;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState(voucher.title || '');
    const [code, setCode] = useState(voucher.code || '');
    const [discountType, setDiscountType] = useState(voucher.discountType || 'percentage');
    const [discountValue, setDiscountValue] = useState(voucher.discountValue || 0);
    const [maxUses, setMaxUses] = useState(voucher.maxUses || 100);
    const [validFrom, setValidFrom] = useState(voucher.validFrom || '');
    const [validTo, setValidTo] = useState(voucher.validTo || '');
    const [maxDiscount, setMaxDiscount] = useState(voucher.maxDiscount || 0);
    const [nationalCodesList, setNationalCodesList] = useState<string[]>(voucher.nationalCodes || []);
    const [nationalCodeInput, setNationalCodeInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [validationError, setValidationError] = useState('');

    // --- Course autocomplete ---
    const [courseId, setCourseId] = useState(voucher.courseId && voucher.courseId !== 'all' ? voucher.courseId : '');
    const [courseTitle, setCourseTitle] = useState(voucher.courseTitle || '');
    const [courseSearch, setCourseSearch] = useState('');
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
    const courseRef = useRef<HTMLDivElement>(null);

    // --- Group autocomplete ---
    const [groupId, setGroupId] = useState<number | string | null>(voucher.group_id || null);
    const [groupTitle, setGroupTitle] = useState(voucher.group_title || '');
    const [groupSearch, setGroupSearch] = useState('');
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
    const groupRef = useRef<HTMLDivElement>(null);

    const filteredCourses = courses.filter(c => {
        // If a group is selected, only show courses belonging to that group
        if (groupId) {
            const gId = typeof groupId === 'string' ? parseInt(groupId) : groupId;
            if (c.group_id !== gId) return false;
        }
        return c.title.toLowerCase().includes(courseSearch.toLowerCase());
    });

    const filteredGroups = courseGroups.filter(g =>
        g.title.toLowerCase().includes(groupSearch.toLowerCase())
    );

    const isUsed = voucher.totalUsed > 0;

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (courseRef.current && !courseRef.current.contains(e.target as Node)) {
                setCourseDropdownOpen(false);
            }
            if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
                setGroupDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');

        // Validate: capacity cannot be less than current used count
        if (maxUses < (voucher.totalUsed || 0)) {
            setValidationError(`ظرفیت نمی‌تواند کمتر از ${toPersianDigits(voucher.totalUsed || 0)} (تعداد مصرف شده) باشد.`);
            setSaving(false);
            return;
        }

        setSaving(true);
        try {
            await onSave({
                title: title.trim(),
                code: code.trim().toUpperCase(),
                discountType,
                discountValue,
                maxUses,
                validFrom,
                validTo,
                courseId: courseId || 'all',
                group_id: groupId || null,
                maxDiscount,
                nationalCodes: nationalCodesList,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 block">عنوان بن</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: بن تخفیف نوروزی"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                    required />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 block">کد بن تخفیف</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                    placeholder="مثال: WELCOME10"
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none font-mono ${isUsed ? 'opacity-60 cursor-not-allowed' : ''}`}
                    readOnly={isUsed}
                    required
                    dir="ltr" />
                {isUsed && (
                    <p className="text-[9px] text-amber-500 font-bold mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        این بن قبلاً استفاده شده است و کد آن قابل تغییر نیست
                    </p>
                )}
            </div>
            {/* ===== Row 1: نوع تخفیف | مقدار تخفیف | ظرفیت استفاده ===== */}
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">نوع تخفیف</label>
                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                        <option value="percentage">درصدی (٪)</option>
                        <option value="fixed">مبلغ ثابت (ریال)</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">مقدار تخفیف</label>
                    <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                        required />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">ظرفیت استفاده</label>
                    <input type="number" value={maxUses}
                        onChange={(e) => { setMaxUses(Number(e.target.value)); setValidationError(''); }}
                        min={voucher.totalUsed || 0}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                        required />
                    <span className="text-[9px] text-gray-400 block mt-0.5">
                        {toPersianDigits(voucher.totalUsed || 0)} عدد مصرف شده — حداقل مقدار مجاز: {toPersianDigits(voucher.totalUsed || 0)}
                    </span>
                    {validationError && (
                        <p className="text-[9px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            {validationError}
                        </p>
                    )}
                </div>
            </div>
            {/* ===== Row 2: گروه دوره | دوره مجاز ===== */}
            <div className="grid grid-cols-2 gap-3">
                <div ref={groupRef} className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-gray-500 block">گروه دوره (اختیاری)</label>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input type="text" value={groupSearch || groupTitle}
                            onFocus={() => { setGroupSearch(''); setGroupDropdownOpen(true); }}
                            onChange={(e) => { setGroupSearch(e.target.value); setGroupDropdownOpen(true); }}
                            placeholder="همه گروه‌ها"
                            className="w-full text-xs px-3.5 py-2.5 pr-9 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                    </div>
                    {groupDropdownOpen && (
                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            <button type="button" onClick={() => { setGroupId(null); setGroupTitle(''); setGroupSearch(''); setCourseId(''); setCourseTitle(''); setGroupDropdownOpen(false); }}
                                className={`w-full text-right px-3.5 py-2 text-[11px] font-bold transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!groupId ? 'text-teal-600 bg-teal-50/50 dark:bg-teal-950/20' : 'text-gray-600 dark:text-gray-400'}`}>
                                همه گروه‌ها
                            </button>
                            {filteredGroups.map(g => (
                                <button key={g.id} type="button" onClick={() => { setGroupId(g.id); setGroupTitle(g.title); setGroupSearch(g.title); setCourseId(''); setCourseTitle(''); setGroupDropdownOpen(false); }}
                                    className={`w-full text-right px-3.5 py-2 text-[11px] font-bold transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${groupId === g.id ? 'text-teal-600 bg-teal-50/50 dark:bg-teal-950/20' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {g.title}
                                </button>
                            ))}
                            {filteredGroups.length === 0 && (
                                <div className="px-3.5 py-3 text-[10px] text-gray-400 text-center">گروهی یافت نشد</div>
                            )}
                        </div>
                    )}
                </div>
                <div ref={courseRef} className="space-y-1 relative">
                    <label className="text-[10px] font-bold text-gray-500 block">دوره مجاز (اختیاری)</label>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input type="text" value={courseSearch || courseTitle}
                            onFocus={() => { setCourseSearch(''); setCourseDropdownOpen(true); }}
                            onChange={(e) => { setCourseSearch(e.target.value); setCourseDropdownOpen(true); }}
                            placeholder="همه دوره‌ها"
                            className="w-full text-xs px-3.5 py-2.5 pr-9 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none" />
                    </div>
                    {courseDropdownOpen && (
                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                            <button type="button" onClick={() => { setCourseId(''); setCourseTitle(''); setCourseSearch(''); setCourseDropdownOpen(false); }}
                                className={`w-full text-right px-3.5 py-2 text-[11px] font-bold transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${!courseId ? 'text-teal-600 bg-teal-50/50 dark:bg-teal-950/20' : 'text-gray-600 dark:text-gray-400'}`}>
                                همه دوره‌ها
                            </button>
                            {filteredCourses.map(c => (
                                <button key={c.id} type="button" onClick={() => { setCourseId(c.id); setCourseTitle(c.title); setCourseSearch(c.title); setCourseDropdownOpen(false); }}
                                    className={`w-full text-right px-3.5 py-2 text-[11px] font-bold transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${courseId === c.id ? 'text-teal-600 bg-teal-50/50 dark:bg-teal-950/20' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {c.title}
                                </button>
                            ))}
                            {filteredCourses.length === 0 && (
                                <div className="px-3.5 py-3 text-[10px] text-gray-400 text-center">دوره‌ای یافت نشد</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {/* ===== Row 3: تاریخ‌ها ===== */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">فعال از تاریخ</label>
                    <JalaliDatepicker value={validFrom} onChange={setValidFrom} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">فعال تا تاریخ</label>
                    <JalaliDatepicker value={validTo} onChange={setValidTo} />
                </div>
            </div>
            {/* ===== Row 4: Advanced Settings ===== */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">حداکثر مبلغ تخفیف (سقف)</label>
                    <input type="text" value={maxDiscount > 0 ? maxDiscount.toLocaleString('en-US') : ''} onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setMaxDiscount(raw ? Number(raw) : 0);
                    }}
                        placeholder="مثال: 1,000,000"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none ltr text-left" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 block">کد ملی مجاز</label>
                    <div className="flex gap-2">
                        <input type="text" value={nationalCodeInput} onChange={(e) => setNationalCodeInput(e.target.value)}
                            placeholder="کد ملی"
                            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none ltr text-left" />
                        <button type="button" onClick={() => {
                            const code = nationalCodeInput.trim();
                            if (code && !nationalCodesList.includes(code)) {
                                setNationalCodesList([...nationalCodesList, code]);
                                setNationalCodeInput('');
                            }
                        }}
                            className="px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                            ثبت
                        </button>
                    </div>
                    {nationalCodesList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {nationalCodesList.map((code, i) => (
                                <span key={i} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-indigo-200/50 dark:border-indigo-800/50">
                                    {code}
                                    <button type="button" onClick={() => setNationalCodesList(nationalCodesList.filter((_, j) => j !== i))}
                                        className="hover:text-red-500 cursor-pointer">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <button type="button" onClick={onCancel}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer">
                    انصراف
                </button>
                <button type="submit" disabled={saving || !title.trim() || !code.trim()}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                    {saving ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                        </svg>
                    )}
                    {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
            </div>
        </form>
    );
}

// ============================================================
// StandaloneTutsVouchers — Self-contained version for use
// outside of TutsModule (e.g. FinancialManagement)
// ============================================================
export function StandaloneTutsVouchers() {
    // ===== Toast =====
    const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
    const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ text, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // ===== Data Fetching =====
    const [vouchers, setVouchers] = useState<TutVoucher[]>([]);
    const [courses, setCourses] = useState<TutCourse[]>([]);
    const [courseGroups, setCourseGroups] = useState<{ id: number; title: string }[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loadingVouchers, setLoadingVouchers] = useState(false);
    const fetchedRef = useRef({ vouchers: false, courses: false, groups: false });

    useEffect(() => {
        if (!fetchedRef.current.vouchers) {
            fetchedRef.current.vouchers = true;
            setLoadingVouchers(true);
            api.getCoupons({ per_page: 1000 })
                .then(res => setVouchers((res.data || []).map(mapVoucher)))
                .catch(err => { console.error('Error fetching coupons:', err); fetchedRef.current.vouchers = false; })
                .finally(() => setLoadingVouchers(false));
        }
        if (!fetchedRef.current.courses) {
            fetchedRef.current.courses = true;
            api.getCourses({ per_page: 1000 })
                .then(res => setCourses((res.data || []).map(mapCourse)))
                .catch(err => { console.error('Error fetching courses:', err); fetchedRef.current.courses = false; });
        }
        if (!fetchedRef.current.groups) {
            fetchedRef.current.groups = true;
            api.getCourseGroups()
                .then(groups => {
                    setCourseGroups(groups);
                    const groupTitles = groups.map((g: any) => g.title);
                    setCategories(groupTitles.includes('عمومی') ? groupTitles : ['عمومی', ...groupTitles]);
                })
                .catch(err => { console.error('Error fetching course groups:', err); fetchedRef.current.groups = false; });
        }
    }, []);

    // ===== VoucherFormData for the TutsVouchers component =====
    const [newVoucher, setNewVoucher] = useState<VoucherFormData>({
        code: '',
        title: '',
        discountType: 'percentage',
        discountValue: 0,
        maxUses: 100,
        validFrom: '',
        validUntil: '',
        applicableProductIds: [],
        applicableCategoryIds: [],
        budgetCap: 0,
        minInstallment: 0,
        installmentsAllowed: false,
        geoLimit: '',
        deviceLimit: '',
        firstPurchaseOnly: false,
        groupId: null,
        isActive: true,
        maxDiscount: 0,
        nationalCodes: [],
    });

    // ===== Tab State =====
    const [voucherActiveTab, setVoucherActiveTab] = useState<'list' | 'create'>('list');

    // ===== Sandbox Simulator State =====
    const [sandboxCode, setSandboxCode] = useState('WELCOME_ONLINE');
    const [sandboxCourseId, setSandboxCourseId] = useState('');
    const [sandboxUserId, setSandboxUserId] = useState('');
    const [sandboxEmail, setSandboxEmail] = useState('student@example.com');
    const [sandboxPhone, setSandboxPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
    const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);

    // ===== Pagination =====
    const [voucherPage, setVoucherPage] = useState(1);
    const voucherPerPage = 10;

    // ===== Edit / Delete Modal State =====
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<TutVoucher | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingVoucher, setDeletingVoucher] = useState<TutVoucher | null>(null);
    const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
    const [deleteInput, setDeleteInput] = useState('');

    // ===== Handlers =====

    const handleCreateVoucher = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const code = newVoucher.code.trim().toUpperCase();
        const title = newVoucher.title?.trim() || '';
        if (!code || !title) {
            showToast('لطفاً کد بن و عنوان آن را وارد کنید.', 'error');
            return;
        }
        if (vouchers.some(v => v.code === code)) {
            showToast('این کد بن خرید از قبل تعریف شده است.', 'error');
            return;
        }
        try {
            const payload: any = {
                title, code,
                type: 'discount',
                type_discount: newVoucher.discountType === 'percentage' ? 'percent' : 'money',
                value: newVoucher.discountValue,
                capacity: newVoucher.maxUses > 0 ? newVoucher.maxUses : 100,
                course_id: newVoucher.applicableProductIds?.[0] || null,
                group_id: newVoucher.groupId || null,
                start_date: newVoucher.validFrom || '',
                finish_date: newVoucher.validUntil || '',
                is_active: true,
                max_discount: newVoucher.maxDiscount > 0 ? newVoucher.maxDiscount : null,
                national_code: newVoucher.nationalCodes?.length ? newVoucher.nationalCodes.join(',') : null,
            };
            const res = await api.createCoupon(payload);
            const created = mapVoucher(res);
            setVouchers([created, ...vouchers]);
            showToast(`بن خرید جدید "${title}" با کد "${code}" با موفقیت ایجاد گردید.`);
        } catch (err: any) {
            const msg = err?.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join('، ')
                : (err?.response?.data?.message || 'خطا در ایجاد بن تخفیف.');
            showToast(msg, 'error');
            return;
        }
        setNewVoucher({
            code: '', title: '', discountType: 'percentage', discountValue: 0, maxUses: 100,
            validFrom: '', validUntil: '', applicableProductIds: [], applicableCategoryIds: [],
            budgetCap: 0, minInstallment: 0, installmentsAllowed: false, geoLimit: '',
            deviceLimit: '', firstPurchaseOnly: false, groupId: null, isActive: true,
            maxDiscount: 0, nationalCodes: [],
        });
        setVoucherActiveTab('list');
    };

    const handleUpdateVoucher = async (id: string, data: Partial<TutVoucher>) => {
        try {
            const payload: any = {};
            if (data.title !== undefined) payload.title = data.title;
            if (data.code !== undefined) payload.code = data.code;
            if (data.discountValue !== undefined) {
                payload.value = data.discountValue;
                payload.type_discount = data.discountType === 'percentage' ? 'percent' : 'money';
            }
            if (data.maxUses !== undefined) payload.capacity = data.maxUses;
            if (data.validFrom !== undefined) payload.start_date = data.validFrom;
            if (data.validTo !== undefined) payload.finish_date = data.validTo;
            if (data.discountType !== undefined) {
                payload.type_discount = data.discountType === 'percentage' ? 'percent' : 'money';
            }
            if (data.courseId !== undefined) payload.course_id = data.courseId === 'all' ? null : Number(data.courseId);
            if (data.group_id !== undefined) payload.group_id = data.group_id ? Number(data.group_id) : null;
            if (data.maxDiscount !== undefined) payload.max_discount = data.maxDiscount > 0 ? data.maxDiscount : null;
            if (data.nationalCodes !== undefined) payload.national_code = data.nationalCodes.length > 0 ? data.nationalCodes.join(',') : null;

            await api.updateCoupon(Number(id), payload);
            setVouchers(prev => prev.map(v => {
                if (v.id !== id) return v;
                const updated = { ...v, ...data };
                const cap = updated.maxUses ?? updated.globalCap ?? 0;
                const used = updated.totalUsed ?? 0;
                updated.remainingUses = Math.max(0, cap - used);
                if (used >= cap && cap > 0) updated.status = 'used' as const;
                else if (cap > used) updated.status = 'active' as const;
                return updated;
            }));
            setShowEditModal(false);
            setEditingVoucher(null);
            showToast(`بن تخفیف "${data.title || ''}" با موفقیت به‌روزرسانی شد.`);
        } catch (err: any) {
            const msg = err?.errors?.code?.[0] || err?.message || 'خطا در به‌روزرسانی بن تخفیف';
            showToast(msg, 'error');
        }
    };

    const handleDeleteVoucher = async (id: string) => {
        try {
            await api.deleteCoupon(Number(id));
            setVouchers(prev => prev.filter(v => v.id !== id));
            setShowDeleteModal(false);
            setDeletingVoucher(null);
            setDeleteInput('');
            showToast('بن تخفیف با موفقیت حذف شد.');
        } catch (err: any) {
            const msg = err?.message || 'خطا در حذف بن تخفیف';
            showToast(msg, 'error');
            setShowDeleteModal(false);
        }
    };

    const openDeleteConfirm = (v: TutVoucher) => {
        setDeletingVoucher(v);
        setDeleteConfirmWord(String(Math.floor(1000 + Math.random() * 9000)));
        setDeleteInput('');
        setShowDeleteModal(true);
    };

    const handleRunSandboxTest = () => {
        const code = sandboxCode.trim().toUpperCase();
        const course = courses.find(c => c.id === sandboxCourseId);
        if (!course) {
            showToast('لطفاً کارگاه معتبری را انتخاب کنید.', 'error');
            return;
        }
        const vouch = vouchers.find(v => v.code.toUpperCase() === code);
        if (!vouch) {
            setSandboxResult({
                isValid: false, error: 'کد بن تخفیف یافت نشد.',
                discountAmount: 0, finalPrice: course.cost, originalPrice: course.cost,
                allowInstallments: false,
                checks: [{ title: 'وجود بن در سیستم', passed: false, desc: 'بن تخفیفی با این کد در لیست دیتابیس وجود ندارد.' }],
                breakdown: { basePrice: course.cost, discountAmount: 0, earlyBirdDiscount: 0, groupDiscount: 0, totalDiscount: 0 },
            });
            return;
        }
        const checks: { title: string; passed: boolean; desc: string }[] = [];
        let isValid = true;
        let failReason = '';
        const todayStr = '1405/03/23';

        // Check 1: Validity Dates
        let datePassed = true;
        let dateDesc = 'بازه زمانی آزاد است.';
        if (vouch.validFrom && todayStr < vouch.validFrom) {
            datePassed = false; isValid = false;
            failReason = `تاریخ فعلی (${toPersianDigits(todayStr)}) پیش از شروع اعتبار (${toPersianDigits(vouch.validFrom)}) است.`;
            dateDesc = `غیرمعتبر (قبل از شروع طرح: ${toPersianDigits(vouch.validFrom)})`;
        } else if (vouch.validTo && todayStr > vouch.validTo) {
            datePassed = false; isValid = false;
            failReason = `تاریخ فعلی (${toPersianDigits(todayStr)}) پس از مهلت استفاده (${toPersianDigits(vouch.validTo)}) است.`;
            dateDesc = `غیرمعتبر (منقضی شده در: ${toPersianDigits(vouch.validTo)})`;
        } else {
            if (vouch.validFrom || vouch.validTo) {
                dateDesc = `معتبر (بازه ${toPersianDigits(vouch.validFrom || '')} الی ${toPersianDigits(vouch.validTo || '')})`;
            }
        }
        checks.push({ title: 'محدودیت زمانی و تقویم', passed: datePassed, desc: dateDesc });

        // Check 2: Product Match
        let productPassed = true;
        let productDesc = 'برای تمامی کارگاه‌ها مجاز است.';
        if (vouch.courseId && vouch.courseId !== 'all') {
            if (vouch.courseId !== course.id) {
                productPassed = false; isValid = false;
                failReason = 'این بن تخفیف فقط برای دوره خاصی صادر شده است.';
                productDesc = `غیرمجاز (فقط مخصوص دوره با شناسه ${vouch.courseId})`;
            } else { productDesc = 'مجاز (مخصوص همین دوره)'; }
        }
        checks.push({ title: 'انطباق دوره و محصول', passed: productPassed, desc: productDesc });

        // Check 3: Category/Department Match
        let catPassed = true;
        let catDesc = 'برای تمامی دپارتمان‌ها مجاز است.';
        if (vouch.category && vouch.category !== 'all') {
            if (vouch.category !== course.category) {
                catPassed = false; isValid = false;
                failReason = `این بن فقط برای کارگاه‌های دپارتمان ${vouch.category} معتبر است.`;
                catDesc = `غیرمجاز (دپارتمان این دوره "${course.category}" است)`;
            } else { catDesc = 'مجاز (دپارتمان منطبق)'; }
        }
        checks.push({ title: 'دپارتمان آموزشی', passed: catPassed, desc: catDesc });

        // Check 4: Minimum Base Price
        let pricePassed = true;
        let priceDesc = 'حداقل مبلغ شهریه ندارد.';
        if (vouch.minCoursePrice && course.cost < vouch.minCoursePrice) {
            pricePassed = false; isValid = false;
            failReason = 'شهریه دوره از حداقل مبلغ مجاز بن کمتر است.';
            priceDesc = `غیرمجاز (شهریه دوره ${formatCurrency(course.cost)} کمتر از حداقل مجاز ${formatCurrency(vouch.minCoursePrice)})`;
        } else if (vouch.minCoursePrice) {
            priceDesc = `مجاز (بیشتر از حداقل ${formatCurrency(vouch.minCoursePrice)})`;
        }
        checks.push({ title: 'حداقل مبلغ شهریه دوره', passed: pricePassed, desc: priceDesc });

        // Check 5: Global Usage Cap
        let capPassed = true;
        let capDesc = 'سقف تعداد استفاده ندارد.';
        if (vouch.globalCap) {
            if (vouch.totalUsed >= vouch.globalCap) {
                capPassed = false; isValid = false;
                failReason = 'تعداد مجاز استفاده از این بن به پایان رسیده است.';
                capDesc = `تکمیل ظرفیت (${toPersianDigits(vouch.totalUsed)} استفاده از ${toPersianDigits(vouch.globalCap)})`;
            } else {
                capDesc = `مجاز (ظرفیت باقی‌مانده: ${toPersianDigits(vouch.globalCap - vouch.totalUsed)} از ${toPersianDigits(vouch.globalCap)})`;
            }
        }
        checks.push({ title: 'ظرفیت کل بن (Usage Cap)', passed: capPassed, desc: capDesc });

        // Final calculation
        let discount = 0;
        if (isValid) {
            if (vouch.discountPercent) discount = Math.round((course.cost * vouch.discountPercent) / 100);
            else if (vouch.discountAmount) discount = Math.min(course.cost, vouch.discountAmount);
        }
        const finalPrice = Math.max(0, course.cost - discount);
        setSandboxResult({
            isValid, error: isValid ? undefined : failReason, voucher: vouch,
            discountAmount: discount, finalPrice, originalPrice: course.cost,
            allowInstallments: vouch.allowInstallments ?? false,
            installmentCount: (vouch.installmentCount && vouch.installmentCount > 1) ? vouch.installmentCount : undefined,
            installmentValue: (vouch.installmentCount && vouch.installmentCount > 1) ? Math.round(finalPrice / vouch.installmentCount) : undefined,
            checks,
            breakdown: { basePrice: course.cost, discountAmount: discount, earlyBirdDiscount: 0, groupDiscount: 0, totalDiscount: discount },
        });
        if (isValid) showToast('شبیه‌سازی با موفقیت انجام شد: بن خرید معتبر است.', 'success');
        else showToast(`شبیه‌سازی انجام شد: بن غیرمعتبر است. علت: ${failReason}`, 'error');
    };

    return (
        <div>
            <TutsVouchers
                vouchers={vouchers}
                courses={courses}
                categories={categories}
                courseGroups={courseGroups}
                loadingVouchers={loadingVouchers}
                voucherActiveTab={voucherActiveTab}
                setVoucherActiveTab={setVoucherActiveTab}
                newVoucher={newVoucher}
                setNewVoucher={setNewVoucher}
                sandboxCode={sandboxCode}
                setSandboxCode={setSandboxCode}
                sandboxCourseId={sandboxCourseId}
                setSandboxCourseId={setSandboxCourseId}
                sandboxUserId={sandboxUserId}
                setSandboxUserId={setSandboxUserId}
                sandboxEmail={sandboxEmail}
                setSandboxEmail={setSandboxEmail}
                sandboxPhone={sandboxPhone}
                setSandboxPhone={setSandboxPhone}
                sandboxResult={sandboxResult}
                setSandboxResult={setSandboxResult}
                voucherPage={voucherPage}
                setVoucherPage={setVoucherPage}
                voucherPerPage={voucherPerPage}
                handleCreateVoucher={handleCreateVoucher}
                handleRunSandboxTest={handleRunSandboxTest}
                editingVoucher={editingVoucher}
                setEditingVoucher={setEditingVoucher}
                showEditModal={showEditModal}
                setShowEditModal={setShowEditModal}
                showDeleteModal={showDeleteModal}
                setShowDeleteModal={setShowDeleteModal}
                deletingVoucher={deletingVoucher}
                setDeletingVoucher={setDeletingVoucher}
                deleteConfirmWord={deleteConfirmWord}
                deleteInput={deleteInput}
                setDeleteInput={setDeleteInput}
                handleUpdateVoucher={handleUpdateVoucher}
                handleDeleteVoucher={handleDeleteVoucher}
                openDeleteConfirm={openDeleteConfirm}
            />
            <ToastNotification toast={toast} />
        </div>
    );
}
