// ============================================================
// DeleteVoucherDialog — تأیید حذف بن تخفیف (Modal)
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import type { TutVoucher } from '../../shared/types';

interface DeleteVoucherDialogProps {
    voucher: TutVoucher | null;
    isOpen: boolean;
    onClose: () => void;
    deleteConfirmWord: string;
    deleteInput: string;
    setDeleteInput: (v: string) => void;
    handleDeleteVoucher: (id: string) => Promise<void>;
}

export default function DeleteVoucherDialog({
    voucher,
    isOpen,
    onClose,
    deleteConfirmWord,
    deleteInput,
    setDeleteInput,
    handleDeleteVoucher,
}: DeleteVoucherDialogProps) {
    const handleClose = () => {
        onClose();
        setDeleteInput('');
    };

    return (
        <AnimatePresence>
            {isOpen && voucher && (
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
                                آیا از حذف بن <span className="font-bold text-gray-700 dark:text-gray-300">{voucher.code}</span> اطمینان دارید؟<br />
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
                            <button onClick={handleClose}
                                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors cursor-pointer">
                                انصراف
                            </button>
                            <button onClick={() => handleDeleteVoucher(voucher.id)}
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
    );
}
