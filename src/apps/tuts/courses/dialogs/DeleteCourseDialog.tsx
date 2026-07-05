// ============================================================
// DeleteCourseDialog — تأیید حذف دوره (Modal)
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2 } from 'lucide-react';

// Random 4-digit number for delete confirmation
function getRandomNumber(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
}

interface DeleteCourseDialogProps {
    course: { id: string; title: string } | null;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteCourseDialog({
    course,
    onClose,
    onConfirm,
}: DeleteCourseDialogProps) {
    const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
    const [confirmInput, setConfirmInput] = useState('');

    // Generate a new random word when the modal opens
    useEffect(() => {
        if (course) {
            setDeleteConfirmWord(getRandomNumber());
            setConfirmInput('');
        }
    }, [course]);

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <AnimatePresence>
            {course && (
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
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-5"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto">
                            <Trash2 className="w-7 h-7 text-rose-500" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">حذف دوره</h4>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                آیا از حذف دوره <span className="font-black text-gray-700 dark:text-gray-300">«{course.title}»</span> اطمینان دارید؟<br />
                                این عملیات غیرقابل بازگشت است.
                            </p>
                        </div>
                        {/* Confirmation word input */}
                        <div className="text-right">
                            <label className="text-[11px] text-gray-500 font-sans block mb-1.5">
                                برای تأیید، عدد <span className="font-black text-teal-600 dark:text-teal-400 text-sm mx-1 select-all" dir="ltr">{deleteConfirmWord}</span> را وارد کنید:
                            </label>
                            <input
                                type="text"
                                value={confirmInput}
                                onChange={e => setConfirmInput(e.target.value)}
                                placeholder={deleteConfirmWord}
                                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 text-center"
                                autoComplete="off"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer transition-all"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={confirmInput !== deleteConfirmWord}
                                className={`flex-1 py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all shadow-xs ${
                                    confirmInput === deleteConfirmWord
                                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                        : 'bg-rose-300 dark:bg-rose-950/40 text-rose-200 dark:text-rose-800 cursor-not-allowed'
                                }`}
                            >
                                حذف دوره
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
