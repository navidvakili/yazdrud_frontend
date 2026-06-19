// ============================================================
// LoginForm — فرم ورود با اتصال به API واقعی
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import api from '@/src/api';
import type { User as UserType } from '@/src/types';

interface LoginFormProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('لطفاً نام کاربری خود را وارد کنید.');
      return;
    }
    if (!password.trim()) {
      setError('لطفاً گذرواژه خود را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({ username: username.trim(), password });
      onLoginSuccess(response.user);
    } catch (err: any) {
      if (err.status === 422 && err.errors) {
        // Validation errors
        const firstError = Object.values(err.errors).flat()[0];
        setError(firstError || 'اطلاعات وارد شده معتبر نیست.');
      } else if (err.status === 401) {
        setError('نام کاربری یا گذرواژه اشتباه است.');
      } else {
        setError(err.message || 'خطا در ارتباط با سرور. لطفاً بعداً تلاش کنید.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-teal-500/5 dark:shadow-black/20 border border-gray-100 dark:border-gray-800 p-8 sm:p-10 transition-all">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3.5 rounded-2xl bg-teal-600 text-white shadow-lg shadow-teal-600/20 mb-5">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              ورود به پنل کاربری
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              پرتال جامع دانشگاهی کارانت | دانشگاه علم و هنر
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                  {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 pr-1">
                نام کاربری 
              </label>
              <div className="relative">
                <User className="w-4.5 h-4.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="نام کاربری خود را وارد کنید"
                  className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  autoComplete="username"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 pr-1">
                گذرواژه
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="گذرواژه خود را وارد کنید"
                  className="w-full pr-10 pl-10 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-teal-600 focus:ring-teal-500/20"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">مرا به خاطر بسپار</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-sm transition-all duration-300 shadow-lg shadow-teal-600/20 hover:shadow-teal-600/40 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  در حال ورود...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  ورود به سامانه
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
              سامانه جامع آموزش، امور مالی و پژوهشی دانشگاه علم و هنر
            </p>
            <p className="text-[9px] text-gray-300 dark:text-gray-600 mt-1 font-mono">
              Karant University Portal v2.0
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
