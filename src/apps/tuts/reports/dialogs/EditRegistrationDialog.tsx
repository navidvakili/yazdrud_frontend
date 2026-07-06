// ============================================================
// EditRegistrationDialog — ویرایش اطلاعات ثبت‌نامی
// بر اساس فیلدهای فرم ثبت‌نام terms_frontend
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import type { TutRegistrant } from '../../shared/types';

interface EditRegistrationDialogProps {
    target: TutRegistrant | null;
    onSave: (id: string, data: Record<string, string>) => void;
    onClose: () => void;
}

export interface EditRegistrationFormData {
    name: string;           // fullname
    nationalCode: string;   // kodmeli
    studentCode: string;    // id_edu
    mobile: string;         // mobile
    universityRelation: string; // type: "student" | "alumni"
    skills: string;         // skills
    motivation: string;     // motivation
}

const emptyForm: EditRegistrationFormData = {
    name: '',
    nationalCode: '',
    studentCode: '',
    mobile: '',
    universityRelation: 'alumni',
    skills: '',
    motivation: '',
};

export default function EditRegistrationDialog({
    target,
    onSave,
    onClose,
}: EditRegistrationDialogProps) {
    const [form, setForm] = useState<EditRegistrationFormData>(emptyForm);
    const [errors, setErrors] = useState<Partial<Record<keyof EditRegistrationFormData, string>>>({});

    // Populate form when target changes
    useEffect(() => {
        if (target) {
            setForm({
                name: target.name || '',
                nationalCode: target.nationalCode || '',
                studentCode: target.studentCode || '',
                mobile: target.mobile || '',
                universityRelation: target.type === '1' ? 'student' : 'alumni',
                skills: '',
                motivation: '',
            });
            setErrors({});
        }
    }, [target]);

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof EditRegistrationFormData, string>> = {};

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!target || !validate()) return;
        onSave(target.id, form as unknown as Record<string, string>);
    };

    const updateField = (field: keyof EditRegistrationFormData, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <AnimatePresence>
            {target && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={onClose}
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
                                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
                                    <Save className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white">ویرایش اطلاعات ثبت‌نام</h4>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                        {target.name} — {target.courseTitle}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* ========== Row 1: Full Name + National Code ========== */}
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
                                        } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50`}
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
                                        } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50`}
                                        placeholder="مثال: ۴۴۳۰۵۶۷۸۹۰"
                                        dir="ltr"
                                    />
                                    {errors.nationalCode && <p className="text-[10px] text-red-500 mt-1">{errors.nationalCode}</p>}
                                </div>
                            </div>

                            {/* ========== Row 2: Mobile ========== */}
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
                                    } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50`}
                                    placeholder="مثال: 09131234567"
                                    dir="ltr"
                                />
                                {errors.mobile && <p className="text-[10px] text-red-500 mt-1">{errors.mobile}</p>}
                            </div>

                            {/* ========== Row 3: University Relation + Student Code ========== */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                        رابطه با دانشگاه
                                    </label>
                                    <select
                                        value={form.universityRelation}
                                        onChange={e => updateField('universityRelation', e.target.value)}
                                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
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
                                            className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                                            placeholder="مثال: ۴۴۳۲۱۱۵۶۷۸"
                                            dir="ltr"
                                        />
                                    </div>
                                ) : (
                                    <div></div>
                                )}
                            </div>

                            {/* ========== Row 5: Skills ========== */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                    مهارت‌ها و سوابق تجربی
                                </label>
                                <textarea
                                    value={form.skills}
                                    onChange={e => updateField('skills', e.target.value)}
                                    rows={3}
                                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                                    placeholder="مهارت‌ها و سوابق تجربی مرتبط در این حوزه"
                                />
                            </div>

                            {/* ========== Row 6: Motivation ========== */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                                    هدف از حضور در کارگاه
                                </label>
                                <textarea
                                    value={form.motivation}
                                    onChange={e => updateField('motivation', e.target.value)}
                                    rows={3}
                                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none"
                                    placeholder="هدف شما از حضور در این کارگاه چیست؟"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer transition-all"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    ذخیره تغییرات
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
