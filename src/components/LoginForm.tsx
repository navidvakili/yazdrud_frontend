// ============================================================
// LoginForm — فرم ورود با اتصال به API واقعی
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  GraduationCap,
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
        const firstError = (Object.values(err.errors).flat()[0] as string) || 'اطلاعات وارد شده معتبر نیست.';
        setError(firstError);
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
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)',
      }}
    >
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Abstract SVG shapes like demo Hero */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.04] pointer-events-none">
          <svg viewBox="0 0 100 100" className="h-full w-full fill-white">
            <circle cx="80" cy="20" r="40" />
            <rect x="10" y="60" width="30" height="30" />
          </svg>
        </div>
        {/* Glowing orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Card with glass-morphism effect like demo */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10 transition-all">

          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo_nika.png" alt="نیکا" className="h-16 w-auto brightness-0 invert" />
            </div>
            <h1 className="text-2xl font-black text-white">
              ورود به پنل کاربری
            </h1>
            <p className="text-sm text-blue-100/80 mt-2">
              نرم‌افزار یکپارچهٔ آموزشی <span className="text-orange-400 font-bold">نیکا</span> | دانشگاه علم و هنر
            </p>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-3 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-rose-100">
                  {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-blue-100 mb-1.5 pr-1">
                نام کاربری
              </label>
              <div className="relative">
                <User className="w-4.5 h-4.5 text-blue-300/70 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="نام کاربری خود را وارد کنید"
                  className="w-full pr-10 pl-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 transition-all backdrop-blur-sm"
                  autoComplete="username"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-blue-100 mb-1.5 pr-1">
                گذرواژه
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 text-blue-300/70 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="گذرواژه خود را وارد کنید"
                  className="w-full pr-10 pl-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-blue-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 transition-all backdrop-blur-sm"
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/70 hover:text-white transition-colors cursor-pointer"
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
                  className="w-4 h-4 rounded border-white/30 bg-white/10 text-orange-500 focus:ring-orange-500/30"
                />
                <span className="text-xs text-blue-100/70">مرا به خاطر بسپار</span>
              </label>
            </div>

            {/* Submit Button — matches demo gold/orange CTA style */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#f97316',
                color: 'white',
                boxShadow: '0 8px 24px -4px rgba(249, 115, 22, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ea580c';
                e.currentTarget.style.boxShadow = '0 10px 30px -4px rgba(249, 115, 22, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f97316';
                e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(249, 115, 22, 0.25)';
              }}
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
            <p className="text-[10px] text-blue-200/60 leading-relaxed">
              سامانه جامع آموزش، امور مالی و پژوهشی دانشگاه علم و هنر
            </p>
            <a
              href="https://karanet.info"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] text-blue-300/40 hover:text-orange-400 transition-colors mt-1 inline-block"
            >
              برنامه نویس و توسعه دهنده توسط شرکت فناوری اطلاعات
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
