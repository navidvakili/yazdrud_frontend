// ============================================================
// SandboxDialog — سندباکس شبیه‌ساز بن تخفیف (Modal)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Beaker, X, Flame, AlertTriangle, Info,
} from 'lucide-react';
import { formatCurrency } from '../../shared/utils';
import type { TutCourse, SandboxResult } from '../../shared/types';

interface SandboxDialogProps {
    courses: TutCourse[];
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
    handleRunSandboxTest: () => void;
}

export default function SandboxDialog({
    courses,
    sandboxCode, setSandboxCode,
    sandboxCourseId, setSandboxCourseId,
    sandboxUserId, setSandboxUserId,
    sandboxEmail, setSandboxEmail,
    sandboxPhone, setSandboxPhone,
    sandboxResult, setSandboxResult,
    handleRunSandboxTest,
}: SandboxDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleClose = () => {
        setIsOpen(false);
        setSandboxResult(null);
    };

    return (
        <>
            <button onClick={() => { setIsOpen(true); setSandboxResult(null); }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
                <Beaker className="w-3.5 h-3.5" />
                سندباکس
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={handleClose}
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
                                <button onClick={handleClose}
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
                            <button onClick={handleClose}
                                className="w-full mt-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer">
                                بستن
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
