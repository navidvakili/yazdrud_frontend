// ============================================================
// TutsModule — Receipts (Bank Receipts Approval Workspace)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Filter, Info, X, Check, AlertTriangle, Search,
} from 'lucide-react';
import type { TutCourse, TutRegistrant } from './tuts-types';
import { toPersianDigits, toEnglishDigits, formatCurrency } from './tuts-utils';

interface TutsReceiptsProps {
    registrants: TutRegistrant[];
    courses: TutCourse[];
    selectedReceiptForReview: TutRegistrant | null;
    setSelectedReceiptForReview: (r: TutRegistrant | null) => void;
    receiptWorkspaceStatusFilter: string;
    setReceiptWorkspaceStatusFilter: (v: string) => void;
    receiptWorkspaceCourseFilter: string;
    setReceiptWorkspaceCourseFilter: (v: string) => void;
    receiptWorkspaceSearchCode: string;
    setReceiptWorkspaceSearchCode: (v: string) => void;
    showRejectBox: boolean;
    setShowRejectBox: (v: boolean) => void;
    rejectionInput: string;
    setRejectionInput: (v: string) => void;
    handleApproveReceipt: (id: string) => void;
    handleRejectReceipt: (id: string) => void;
}

export default function TutsReceipts(props: TutsReceiptsProps) {
    const {
        registrants, courses,
        selectedReceiptForReview, setSelectedReceiptForReview,
        receiptWorkspaceStatusFilter, setReceiptWorkspaceStatusFilter,
        receiptWorkspaceCourseFilter, setReceiptWorkspaceCourseFilter,
        receiptWorkspaceSearchCode, setReceiptWorkspaceSearchCode,
        showRejectBox, setShowRejectBox,
        rejectionInput, setRejectionInput,
        handleApproveReceipt, handleRejectReceipt,
    } = props;

    return (
        <div className="space-y-6">
            <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                    <span className="text-xs font-black text-teal-800 dark:text-teal-400 block">مرکز بررسی هویت، انطباق مالی و احراز صلاحیت فیش‌های واریزی شتاب</span>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                        مدیر آموزش محترم؛ در این کارتابل می‌توانید کلیه فیش‌های ارسالی دانشجویان برای ثبت‌نام در دوره‌ها را بازبینی و با تایید فیش، ظرفیت دوره را به صورت سیستمی نهایی فرمایید.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Receipts List Area */}
                <div className={`${selectedReceiptForReview ? 'lg:col-span-6 xl:col-span-5' : 'lg:col-span-12'} space-y-3`}>
                    {/* Filter panel */}
                    <div className="bg-gray-50/50 dark:bg-gray-950/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-850 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-black text-gray-800 dark:text-white justify-start">
                            <Filter className="w-4 h-4 text-teal-600" />
                            <span>جستجو و فیلترینگ پیشرفته کارتابل فیش‌ها</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-1">وضعیت تایید فیش</label>
                                <select
                                    value={receiptWorkspaceStatusFilter}
                                    onChange={(e) => setReceiptWorkspaceStatusFilter(e.target.value as any)}
                                    className="w-full text-xs p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-sans cursor-pointer"
                                >
                                    <option value="all">همه وضعیت‌ها</option>
                                    <option value="pending">در انتظار بررسی</option>
                                    <option value="verified">تایید شده</option>
                                    <option value="rejected">رد شده</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-1">فیلتر براساس دوره / کارگاه</label>
                                <select
                                    value={receiptWorkspaceCourseFilter}
                                    onChange={(e) => setReceiptWorkspaceCourseFilter(e.target.value)}
                                    className="w-full text-xs p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-sans cursor-pointer"
                                >
                                    <option value="all">همه دوره‌ها</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 mb-1">کد ملی یا دانشجویی فراگیر</label>
                                <input
                                    type="text"
                                    value={receiptWorkspaceSearchCode}
                                    onChange={(e) => setReceiptWorkspaceSearchCode(e.target.value)}
                                    placeholder="جستجوی کد ملی یا نام..."
                                    className="w-full text-xs p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-sans"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {(() => {
                            const filtered = registrants.filter(r => {
                                const matchesStatus = receiptWorkspaceStatusFilter === 'all' || r.status === receiptWorkspaceStatusFilter;
                                const matchesCourse = receiptWorkspaceCourseFilter === 'all' || r.courseId === receiptWorkspaceCourseFilter;
                                const trimmedSearch = toEnglishDigits(receiptWorkspaceSearchCode.trim());
                                const matchesCode = !trimmedSearch ||
                                    r.studentCode.toString().includes(trimmedSearch) ||
                                    r.nationalCode.toString().includes(trimmedSearch) ||
                                    r.name.includes(trimmedSearch);
                                return matchesStatus && matchesCourse && matchesCode;
                            });

                            if (filtered.length === 0) {
                                return (
                                    <div className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center text-gray-400 text-xs">
                                        هیچ فیش بانکی با معیارهای فیلتر انتخاب شده یافت نشد.
                                    </div>
                                );
                            }

                            return filtered.map((reg) => {
                                const isSelected = selectedReceiptForReview?.id === reg.id;
                                return (
                                    <div
                                        key={reg.id}
                                        onClick={() => {
                                            setSelectedReceiptForReview(reg);
                                            setShowRejectBox(false);
                                            setRejectionInput('');
                                        }}
                                        className={`p-4 bg-white dark:bg-gray-900 border rounded-2xl shadow-2xs hover:shadow-md cursor-pointer transition-all text-right ${isSelected
                                            ? 'border-teal-500 dark:border-teal-500/60 ring-1 ring-teal-500/10'
                                            : 'border-gray-100 dark:border-gray-800/80 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="font-extrabold text-xs text-gray-900 dark:text-white block">{reg.name}</span>
                                                <span className="text-[10px] text-gray-400 block mt-0.5">کد ملی / دانشجویی: {toPersianDigits(reg.studentCode)}</span>
                                            </div>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${reg.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                reg.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                                    'bg-amber-500/10 text-amber-600'}`}>
                                                {reg.status === 'verified' ? 'تایید شده' :
                                                    reg.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-1 mb-3.5">
                                            کارگاه: {reg.courseTitle}
                                        </div>
                                        <div className="flex justify-between items-center border-t border-gray-50 dark:border-gray-800/60 pt-2 text-[10px]">
                                            <span className="text-gray-400">{toPersianDigits(reg.date)}</span>
                                            <span className="font-black text-teal-600 dark:text-teal-400">{formatCurrency(reg.amount)}</span>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                {/* Receipt Review and Preview Slip Panel */}
                {selectedReceiptForReview && (
                    <div className="lg:col-span-6 xl:col-span-7">
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-xl space-y-6 sticky top-4">
                            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">بررسی تفصیلی پرونده مالی و پرداخت</h4>
                                    <p className="text-[10px] text-gray-400 mt-0.5">شناسه سند: {selectedReceiptForReview.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReceiptForReview(null)}
                                    className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Bank Receipt Image — تصویر فیش بانکی واریز شده */}
                            {selectedReceiptForReview.bankReceipt && (
                                <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 px-4 pt-3 pb-1 flex items-center gap-1.5">
                                        <Info className="w-3 h-3" />
                                        تصویر فیش بانکی واریز شده
                                    </div>
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => window.open(selectedReceiptForReview.bankReceipt, '_blank')}
                                    >
                                        <img
                                            src={selectedReceiptForReview.bankReceipt}
                                            alt="تصویر فیش بانکی"
                                            className="w-full h-auto max-h-[400px] object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* SIMULATED SLIP / RECEIPT CARD */}
                            <div className="border border-indigo-500/15 rounded-3xl bg-gradient-to-br from-indigo-50/25 to-white dark:from-indigo-950/10 dark:to-gray-950 p-5 shadow-xs relative overflow-hidden text-right select-none">
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center text-gray-200/25 dark:text-gray-800/15 text-5xl font-black rotate-12 uppercase">
                                    karante university
                                </div>

                                <div className="flex justify-between items-center border-b border-gray-200/40 pb-3 mb-4">
                                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">فیش دیجیتال شتاب</span>
                                    <span className="text-xs font-black text-gray-800 dark:text-gray-200">{selectedReceiptForReview.paymentMethod}</span>
                                </div>

                                <div className="space-y-2.5 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-sans">بابت ثبت‌نام کارگاه:</span>
                                        <span className="text-gray-900 dark:text-white font-sans font-bold text-left truncate max-w-[200px]">{selectedReceiptForReview.courseTitle}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-sans">نام کامل واریز کننده:</span>
                                        <span className="text-gray-900 dark:text-white font-sans font-black">{selectedReceiptForReview.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-sans">شماره ملی / دانشجویی:</span>
                                        <span className="text-gray-900 dark:text-white font-bold">{toPersianDigits(selectedReceiptForReview.studentCode)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-sans">کد رهگیری تراکنش (Ref):</span>
                                        <span className="text-gray-900 dark:text-white font-black text-indigo-600 dark:text-indigo-400">{toPersianDigits(selectedReceiptForReview.trackingCode)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 font-sans">تاریخ و زمان تراکنش:</span>
                                        <span className="text-gray-900 dark:text-white font-bold">{toPersianDigits(selectedReceiptForReview.date)}</span>
                                    </div>

                                    {/* Voucher info in slip */}
                                    {(selectedReceiptForReview as any).appliedVoucherCode && (
                                        <div className="bg-indigo-500/5 p-2 rounded-xl border border-indigo-500/10 space-y-1 mt-2 text-[11px]">
                                            <div className="flex justify-between">
                                                <span className="text-indigo-600 dark:text-indigo-400 font-sans">بن تخفیف استفاده شده:</span>
                                                <span className="font-bold text-indigo-700 dark:text-indigo-300">{(selectedReceiptForReview as any).appliedVoucherCode}</span>
                                            </div>
                                            {(selectedReceiptForReview as any).discountAmount && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400 font-sans">مبلغ تخفیف کسر شده:</span>
                                                    <span className="text-rose-500 font-bold">-{formatCurrency((selectedReceiptForReview as any).discountAmount)}</span>
                                                </div>
                                            )}
                                            {(selectedReceiptForReview as any).installmentsCount && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400 font-sans">نوع پرداخت:</span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">پرداخت اقساطی ({toPersianDigits((selectedReceiptForReview as any).installmentsCount)} قسطه)</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-3.5 border-t border-dashed border-gray-200/50 mt-4 text-sm">
                                        <span className="text-gray-400 font-sans font-bold">مبلغ نهایی پرداختی:</span>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatCurrency(selectedReceiptForReview.amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions buttons */}
                            {selectedReceiptForReview.status === 'pending' ? (
                                <div className="space-y-4">
                                    {!showRejectBox ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowRejectBox(true);
                                                    setRejectionInput('');
                                                }}
                                                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                            >
                                                <X className="w-4 h-4" />
                                                عدم تایید فیش
                                            </button>
                                            <button
                                                onClick={() => handleApproveReceipt(selectedReceiptForReview.id)}
                                                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Check className="w-4 h-4" />
                                                تایید نهایی و ثبت‌نام
                                            </button>
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3 bg-rose-500/5 border border-rose-500/10 p-4 rounded-2xl text-right"
                                        >
                                            <label className="block text-xs font-bold text-rose-800 dark:text-rose-400 mb-1.5">علت عدم تایید فیش واریز را بنویسید:</label>
                                            <textarea
                                                value={rejectionInput}
                                                onChange={(e) => setRejectionInput(e.target.value)}
                                                placeholder="مثال: مبلغ تراکنش کافی نیست یا کد رهگیری تکراری است..."
                                                rows={2}
                                                required
                                                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                                            ></textarea>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRejectBox(false)}
                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-xl text-[11px] text-gray-500 font-bold cursor-pointer"
                                                >
                                                    انصراف
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRejectReceipt(selectedReceiptForReview.id)}
                                                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold cursor-pointer"
                                                >
                                                    ثبت رد صلاحیت فیش
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                                    {selectedReceiptForReview.status === 'verified' ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 text-xs font-bold">
                                            <Check className="w-4 h-4" />
                                            این سند مالی با موفقیت تایید شده و دانشجو ثبت‌نام گردید.
                                        </span>
                                    ) : (
                                        <div>
                                            <span className="text-rose-500 flex items-center justify-center gap-1 mb-1">
                                                <AlertTriangle className="w-4 h-4" />
                                                این سند مالی قبلاً رد صلاحیت شده است.
                                            </span>
                                            <span className="text-[10px] text-gray-400">علت: {selectedReceiptForReview.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
