// ============================================================
// TutsModule — Toast Notification Component
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastMessage {
    text: string;
    type: 'success' | 'error' | 'info';
}

interface ToastNotificationProps {
    toast: ToastMessage | null;
}

export default function ToastNotification({ toast }: ToastNotificationProps) {
    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[60] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md ${toast.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                        : toast.type === 'error'
                            ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-500/20 text-rose-800 dark:text-rose-300'
                            : 'bg-blue-50 dark:bg-blue-950/90 border-blue-500/20 text-blue-800 dark:text-blue-300'
                        }`}
                >
                    {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
                    {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
                    <span className="text-xs font-bold leading-relaxed">{toast.text}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
