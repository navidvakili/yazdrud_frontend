// ============================================================
// ConfirmDialog — دیالوگ تأیید عملیات (به‌جای window.confirm)
// کامپوننت مشترک برای تمام ماژول‌ها
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true (پیش‌فرض) = عملیات مخرب/حذف (قرمز) — false = عملیات خنثی (کهربایی) */
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'حذف',
  cancelLabel = 'انصراف',
  danger = true,
  busy = false,
  onConfirm,
  onCancel
}) => (
  <AnimatePresence>
    {open && (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md rtl"
        onClick={busy ? undefined : onCancel}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4 border border-gray-200 dark:border-slate-800 shadow-2xl text-right"
        >
          <div className="flex items-start justify-between gap-3">
            <div
              className={`p-3 rounded-2xl ${
                danger
                  ? 'bg-red-500/10 text-red-500 dark:text-red-400'
                  : 'bg-amber-500/10 text-amber-500'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onCancel}
              disabled={busy}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
            <div className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-line">
              {message}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onCancel}
              disabled={busy}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={`px-4 py-2 rounded-xl text-xs font-black text-white transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5 ${
                danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
              }`}
            >
              {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;
