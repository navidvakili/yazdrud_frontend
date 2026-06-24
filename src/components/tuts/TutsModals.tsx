// ============================================================
// TutsModule — Shared Modals (Category Manager + Delete Confirm)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Layers } from 'lucide-react';
import type { TutCategory } from './tuts-types';
import { toPersianDigits } from './tuts-utils';

interface TutsModalsProps {
    // Category Manager
    isCategoryModalOpen: boolean;
    setIsCategoryModalOpen: (v: boolean) => void;
    newCategoryName: string;
    setNewCategoryName: (v: string) => void;
    categories: TutCategory[];
    handleAddCategory: () => void;
    handleDeleteCategory: (id: string) => void;
    // Delete Confirmation
    courseToDelete: { id: string; title: string } | null;
    setCourseToDelete: (v: { id: string; title: string } | null) => void;
    confirmDeleteCourse: () => void;
}

export default function TutsModals(props: TutsModalsProps) {
    const {
        isCategoryModalOpen, setIsCategoryModalOpen,
        newCategoryName, setNewCategoryName,
        categories, handleAddCategory, handleDeleteCategory,
        courseToDelete, setCourseToDelete, confirmDeleteCourse,
    } = props;

    return (
        <>
            {/* ===== CATEGORY MANAGER MODAL ===== */}
            <AnimatePresence>
                {isCategoryModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => { setIsCategoryModalOpen(false); setNewCategoryName(''); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-5 rounded-3xl shadow-2xl max-w-md w-full space-y-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-800">
                                <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <Layers className="w-4 h-4 text-teal-600" />
                                    مدیریت گروه‌های علمی
                                </h4>
                                <button onClick={() => { setIsCategoryModalOpen(false); setNewCategoryName(''); }}
                                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[250px] overflow-y-auto">
                                {categories.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-6">هیچ گروه علمی تعریف نشده است.</p>
                                ) : (
                                    categories.map((cat: string, idx: number) => (
                                        <div key={idx}
                                            className="flex items-center justify-between p-3 bg-gray-55/50 dark:bg-gray-950/50 rounded-2xl border border-gray-100/50 dark:border-gray-850">
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{cat}</span>
                                            <button onClick={() => handleDeleteCategory(cat)}
                                                className="p-1 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && newCategoryName.trim()) { handleAddCategory(); } }}
                                    placeholder="نام گروه جدید را وارد کنید..."
                                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                                />
                                <button
                                    onClick={handleAddCategory}
                                    disabled={!newCategoryName.trim()}
                                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                    <Plus className="w-4 h-4" />
                                    افزودن
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            <AnimatePresence>
                {courseToDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setCourseToDelete(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-5"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto">
                                <Trash2 className="w-7 h-7 text-rose-500" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">حذف دوره</h4>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    آیا از حذف دوره <span className="font-black text-gray-700 dark:text-gray-300">«{courseToDelete.title}»</span> اطمینان دارید؟<br />
                                    این عملیات غیرقابل بازگشت است.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCourseToDelete(null)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer transition-all"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={() => { confirmDeleteCourse(); setCourseToDelete(null); }}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black cursor-pointer transition-all shadow-xs"
                                >
                                    حذف دوره
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
