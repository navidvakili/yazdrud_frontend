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
  AlertTriangle,
  X,
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
  const [concurrentSession, setConcurrentSession] = useState<{ username: string; password: string } | null>(null);

  const handleForceLogin = async () => {
    if (!concurrentSession) return;
    setIsLoading(true);
    setConcurrentSession(null);
    try {
      const response = await api.login({ username: concurrentSession.username, password: concurrentSession.password, force: true });
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

  const cancelConcurrentSession = () => {
    setConcurrentSession(null);
  };

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
      // Concurrent session detection — user already logged in elsewhere
      if (err.status === 409 && err.errors?.session) {
        setConcurrentSession({ username: username.trim(), password });
        return;
      }
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
    <div className="min-h-screen flex relative overflow-hidden bg-white">
      {/* =====================================================================
          TWO-PANEL LAYOUT: Branding (right, RTL — سبز) | Login Form (left — سفید)
          ===================================================================== */}
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">

        {/* ===== RIGHT PANEL: Branding & University Info (6 cols) — سبز ===== */}
        <div
          className="lg:col-span-6 flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-10 order-2 lg:order-1"
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #115e59 50%, #134e4a 100%)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-xl"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/30 text-teal-100 text-xs font-bold mb-5 backdrop-blur-md">
              <GraduationCap className="w-4 h-4 shrink-0 text-teal-300" />
              <span>نرم‌افزار یکپارچهٔ مدیریت دانشگاهی</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight sm:leading-snug mb-4">
              سامانه جامع آموزش،
              <br />
              پژوهش و امور مالی
            </h1>

            <p className="text-teal-50/70 text-sm sm:text-base leading-7 sm:leading-8 mb-8 text-justify">
              پرتال یکپارچه دانشگاه علم و هنر، بستری امن و هوشمند برای مدیریت تمامی فرآیندهای آموزشی، پژوهشی و مالی دانشگاه.
              با استفاده از این سامانه، اساتید، دانشجویان و کارکنان می‌توانند به سادگی به خدمات مورد نیاز خود دسترسی داشته باشند.
            </p>

            {/* Feature items */}
            <div className="flex flex-col gap-4 mb-10">
              {[
                { title: 'مدیریت دوره‌های آموزشی', desc: 'ثبت‌نام، برنامه‌ریزی و پایش پیشرفت تحصیلی' },
                { title: 'پروفایل یکپارچه', desc: 'مدیریت اطلاعات فردی، تحصیلی و اداری در یک جا' },
                { title: 'گزارش‌های هوشمند', desc: 'داشبوردهای تحلیلی برای تصمیم‌گیری بهتر' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 text-right">
                  <div className="w-6 h-6 rounded-full bg-teal-400/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-teal-300" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold mb-0.5">{item.title}</h4>
                    <p className="text-teal-100/60 text-xs leading-5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* University footer link */}
            <div className="flex items-center gap-4 border-t border-white/10 pt-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-300 font-black text-sm">
                SAU
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white font-bold">دانشگاه علم و هنر یزد</span>
                <span className="text-[10px] text-teal-200/50">دانشگاه علم و هنر</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ===== LEFT PANEL: Login Form (6 cols) — سفید ===== */}
        <div className="lg:col-span-6 flex items-center justify-center px-6 sm:px-10 py-10 order-1 lg:order-2 bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* White card with shadow */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 transition-all">

              {/* Logo & Header */}
              <div className="text-center mb-7">
                <div className="flex justify-center mb-4">
                  <img src="/logo_nika.png" alt="نیکا" className="h-14 w-auto" />
                </div>
                <h2 className="text-xl font-black text-gray-900">
                  ورود به سامانه
                </h2>
                <p className="text-xs text-gray-500 mt-1.5">
                  نرم‌افزار یکپارچهٔ آموزشی <span className="text-teal-600 font-bold">نیکا</span>
                </p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-medium text-rose-700">
                      {error}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 pr-1">
                    نام کاربری
                  </label>
                  <div className="relative">
                    <User className="w-4.5 h-4.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="نام کاربری خود را وارد کنید"
                      className="w-full pr-10 pl-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                      autoComplete="username"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 pr-1">
                    گذرواژه
                  </label>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="گذرواژه خود را وارد کنید"
                      className="w-full pr-10 pl-10 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                      autoComplete="current-password"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
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
                      className="w-4 h-4 rounded border-gray-300 bg-white text-teal-600 focus:ring-teal-500/30"
                    />
                    <span className="text-xs text-gray-600">مرا به خاطر بسپار</span>
                  </label>
                </div>

                {/* Submit Button — Teal brand */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#0d9488',
                    color: 'white',
                    boxShadow: '0 8px 24px -4px rgba(13, 148, 136, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0f766e';
                    e.currentTarget.style.boxShadow = '0 10px 30px -4px rgba(13, 148, 136, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d9488';
                    e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(13, 148, 136, 0.25)';
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
              <div className="mt-6 text-center">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  سامانه جامع آموزش، امور مالی و پژوهشی دانشگاه علم و هنر
                </p>
                <a
                  href="https://karanet.info"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-gray-300 hover:text-teal-600 transition-colors mt-1 inline-block"
                >
                  برنامه نویس و توسعه دهنده توسط شرکت فناوری اطلاعات کارانت
                </a>
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* ===== Concurrent Session Warning Modal ===== */}
      <AnimatePresence>
        {concurrentSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={cancelConcurrentSession}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                نشست فعال قبلی
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                این کاربر در حال حاضر در دستگاه دیگری وارد سیستم شده است.
                اگر ادامه دهید، نشست (session) قبلی باطل خواهد شد.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelConcurrentSession}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleForceLogin}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-all shadow-lg cursor-pointer"
                >
                  ادامه و باطل کردن نشست قبلی
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
