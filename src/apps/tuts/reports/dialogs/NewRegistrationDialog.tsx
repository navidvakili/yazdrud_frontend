// ============================================================
// NewRegistrationDialog — ثبت‌نام دستی فراگیر در دوره
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UserPlus } from 'lucide-react';
import type { TutCourse } from '../../shared/types';

interface NewRegistrationDialogProps {
    open: boolean;
    courses: TutCourse[];
    onSave: (data: {
        course_id: number;
        fullname: string;
        kodmeli: string;
        mobile: string;
        type: string;
        id_edu?: string;
        skills?: string;
        motivation?: string;
    }) => Promise<void>;
    onClose: () => void;
}

interface NewRegistrationFormData {
    courseId: string;
    name: string;
    nationalCode: string;
    studentCode: string;
    mobile: string;
    universityRelation: string;
    skills: string;
    motivation: string;
}

const emptyForm: NewRegistrationFormData = {
    courseId: '',
    name: '',
    nationalCode: '',
    studentCode: '',
    mobile: '',
    universityRelation: 'student',
    skills: '',
    motivation: '',
};

export default function NewRegistrationDialog({
    open,
    courses,
    onSave,
    onClose,
}: NewRegistrationDialogProps) {
    const [form, setForm] = useState<NewRegistrationFormData>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof NewRegistrationFormData, string>>>({});
    const [saving, setSaving] = useState(false);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof NewRegistrationFormData, string>> = {};

        if (!form.courseId) {
            newErrors.courseId = 'انتخاب دوره الزامی است.';
        }
        if (!form.name.trim()) {
            newErrors.name = 'نام و نام خانوادگی الزامی است.';
        }
        if (!form.nationalCode.trim()) {
            newErrors.nationalCode = 'کد ملی الزامی است.';
        } else if (!/^\d{10}$/.test(form.nationalCode.trim())) {
            newErrors.nationalCode = 'کد ملی باید ۱۰ رقم باشد.';
        }
        if (!form.mobile.trim()) {
            newErrors.mobile = 'شماره موبایل الزامی است.';
        } else if (!/^09\d{9}$/.test(form.mobile.trim())) {
            newErrors.mobile = 'شماره موبایل باید با 09 شروع و ۱۱ رقم باشد.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            await onSave({
                course_id: Number(form.courseId),
                fullname: form.name.trim(),
                kodmeli: form.nationalCode.trim(),
                mobile: form.mobile.trim(),
                type: form.universityRelation === 'student' ? '1' : '2',
                id_edu: form.universityRelation === 'student' ? form.studentCode.trim() || undefined : undefined,
                skills: form.skills.trim() || undefined,
                motivation: form.motivation.trim() || undefined,
            });
            setForm(emptyForm);
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: keyof NewRegistrationFormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleClose = () => {
        if (saving) return;
        setForm(emptyForm);
        setErrors({});
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                                    <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white">ثبت‌نام دستی فراگیر</h4>
                                    <p className="text-[11px] text-gray-400 mt-0.5">اضافه کردن فراگیر جدید به یک دوره</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={saving}
                                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer disabled:opacity-40"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* ========== Course Selector ========== */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                    دوره آموزشی <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.courseId}
                                    onChange={e => updateField('courseId', e.target.value)}
                                    className={`w-full text-xs p-2.5 rounded-xl border ${
                                        errors.courseId
                                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                                    } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                >
                                    <option value="">— دوره را انتخاب کنید —</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                                {errors.courseId && <p className="text-[10px] text-red-500 mt-1">{errors.courseId}</p>}
                            </div>

                            {/* ========== Row: Full Name + National Code ========== */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                        نام و نام خانوادگی <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => updateField('name', e.target.value)}
                                        className={`w-full text-xs p-2.5 rounded-xl border ${
                                            errors.name
                                                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                                        } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                        placeholder="مثال: زهرا مرادی"
                                    />
                                    {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                        کد ملی <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.nationalCode}
                                        onChange={e => updateField('nationalCode', e.target.value)}
                                        maxLength={10}
                                        className={`w-full text-xs p-2.5 rounded-xl border ${
                                            errors.nationalCode
                                                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                                        } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                        placeholder="مثال: ۴۴۳۰۵۶۷۸۹۰"
                                        dir="ltr"
                                    />
                                    {errors.nationalCode && <p className="text-[10px] text-red-500 mt-1">{errors.nationalCode}</p>}
                                </div>
                            </div>

                            {/* ========== Mobile ========== */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                    شماره موبایل <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.mobile}
                                    onChange={e => updateField('mobile', e.target.value)}
                                    maxLength={11}
                                    className={`w-full text-xs p-2.5 rounded-xl border ${
                                        errors.mobile
                                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
                                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                                    } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                                    placeholder="مثال: 09131234567"
                                    dir="ltr"
                                />
                                {errors.mobile && <p className="text-[10px] text-red-500 mt-1">{errors.mobile}</p>}
                            </div>

                            {/* ========== University Relation + Student Code ========== */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                        رابطه با دانشگاه
                                    </label>
                                    <select
                                        value={form.universityRelation}
                                        onChange={e => updateField('universityRelation', e.target.value)}
                                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    >
                                        <option value="student">دانشجوی دانشگاه</option>
                                        <option value="alumni">دانش‌آموخته دانشگاه</option>
                                    </select>
                                </div>
                                {form.universityRelation === 'student' ? (
                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                            شماره دانشجویی
                                        </label>
                                        <input
                                            type="text"
                                            value={form.studentCode}
                                            onChange={e => updateField('studentCode', e.target.value)}
                                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="مثال: ۴۴۳۲۱۱۵۶۷۸"
                                            dir="ltr"
                                        />
                                    </div>
                                ) : (
                                    <div></div>
                                )}
                            </div>

                            {/* ========== Skills ========== */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                    مهارت‌ها و سوابق تجربی
                                </label>
                                <textarea
                                    value={form.skills}
                                    onChange={e => updateField('skills', e.target.value)}
                                    rows={3}
                                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                                    placeholder="مهارت‌ها و سوابق تجربی مرتبط در این حوزه"
                                />
                            </div>

                            {/* ========== Motivation ========== */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                    هدف از حضور در کارگاه
                                </label>
                                <textarea
                                    value={form.motivation}
                                    onChange={e => updateField('motivation', e.target.value)}
                                    rows={3}
                                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                                    placeholder="هدف از شرکت در این کارگاه"
                                />
                            </div>

                            {/* ========== Actions ========== */}
                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={saving}
                                    className="px-5 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            در حال ذخیره...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4" />
                                            ثبت‌نام فراگیر
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
