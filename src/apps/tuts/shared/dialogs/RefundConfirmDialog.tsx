// ============================================================
// RefundConfirmDialog — Confirmation modal for refunding
// registrations with a random-number challenge
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw } from 'lucide-react';

interface RefundConfirmDialogProps {
  /** The registrant to refund, or null to hide the dialog */
  target: { name: string; courseTitle: string } | null;
  /** Random confirmation word the user must type */
  confirmWord: string;
  /** Current input value */
  confirmInput: string;
  /** Called when input changes */
  onInputChange: (value: string) => void;
  /** Called when the user confirms the refund */
  onConfirm: () => void;
  /** Called when the user cancels or clicks outside */
  onClose: () => void;
}

export default function RefundConfirmDialog({
  target,
  confirmWord,
  confirmInput,
  onInputChange,
  onConfirm,
  onClose,
}: RefundConfirmDialogProps) {
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
            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center mx-auto">
              <RotateCcw className="w-7 h-7 text-orange-500" />
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">مستردد کردن ثبت‌نام</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                آیا از مستردد کردن ثبت‌نام <span className="font-black text-gray-700 dark:text-gray-300">«{target.name}»</span><br />
                در دوره <span className="font-black text-gray-700 dark:text-gray-300">«{target.courseTitle}»</span> اطمینان دارید؟<br />
                این عملیات غیرقابل بازگشت است.
              </p>
            </div>
            {/* Confirmation word input */}
            <div className="text-right">
              <label className="text-[11px] text-gray-500 font-sans block mb-1.5">
                برای تأیید، عدد <span className="font-black text-teal-600 dark:text-teal-400 text-sm mx-1 select-all" dir="ltr">{confirmWord}</span> را وارد کنید:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={e => onInputChange(e.target.value)}
                placeholder={confirmWord}
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
                onClick={onConfirm}
                disabled={confirmInput !== confirmWord}
                className={`flex-1 py-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all shadow-xs ${
                  confirmInput === confirmWord
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-300 dark:bg-orange-950/40 text-orange-200 dark:text-orange-800 cursor-not-allowed'
                }`}
              >
                مستردد
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
