// ============================================================
// StandbyModal — مودال قفل خودکار پس از عدم فعالیت کاربر
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, LogIn } from 'lucide-react';
import type { User as UserType } from '@/src/shared-types';
import { COMPANY_NAME } from '@/src/shared-constants';

interface StandbyModalProps {
    isStandby: boolean;
    user: UserType | null;
    onUnlock: (password: string) => Promise<boolean>;
}

export default function StandbyModal({ isStandby, user, onUnlock }: StandbyModalProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!password.trim()) {
            setError('لطفاً گذرواژه خود را وارد کنید.');
            return;
        }

        setIsLoading(true);
        try {
            const ok = await onUnlock(password);
            if (!ok) {
                setError('گذرواژه نادرست است.');
                setPassword('');
            }
            // If ok, the parent handles hiding this modal
        } catch {
            setError('خطا در ارتباط با سرور.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isStandby && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 bg-gray-50/95 dark:bg-gray-950/98 backdrop-blur-xl z-[100] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="w-full max-w-sm"
                    >
                        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 sm:p-10 text-center">
                            {/* Logo */}
                            <div className="flex justify-center mb-4">
                                <img src="/logo_nika.png" alt="نیکا" className="h-14 w-auto" />
                            </div>

                            {/* Title */}
                            <h1 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                                {COMPANY_NAME}
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                                دستگاه شما به دلیل عدم فعالیت قفل شده است
                            </p>

                            {/* User info */}
                            {user && (
                                <div className="flex items-center justify-center gap-2 mb-6 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                    <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 font-black text-sm">
                                        {user.fname?.charAt(0) || user.username?.charAt(0) || '?'}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {user.name || user.username}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {user.fname} {user.lname}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Lock icon */}
                            <div className="inline-flex p-2.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 mb-5">
                                <Lock className="w-6 h-6" />
                            </div>

                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-4 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2"
                                    >
                                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                                            {error}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Password form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="گذرواژه خود را وارد کنید"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                        autoFocus
                                        className="w-full bg-gray-50 dark:bg-gray-800 text-right pr-10 pl-9 py-2.5 text-sm rounded-xl border border-gray-150 dark:border-gray-700/80 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans transition-all disabled:opacity-50"
                                    />
                                    <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-black transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <LogIn className="w-4 h-4" />
                                    )}
                                    {isLoading ? 'در حال بررسی...' : 'رفع قفل'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
