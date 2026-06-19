// ============================================================
// ProfileModule — مشخصات پروفایل کاربر
// ============================================================

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { User as UserType } from '@/src/types';
import api from '@/src/api';

interface ProfileModuleProps {
  user: UserType;
  onUpdateUser: (user: UserType) => void;
}

export default function ProfileModule({ user, onUpdateUser }: ProfileModuleProps) {
  const [fname, setFname] = useState(user.fname);
  const [lname, setLname] = useState(user.lname);
  const [email, setEmail] = useState(user.email);
  const [mobile, setMobile] = useState(user.mobile);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async () => {
    setMessage(null);
    setIsSaving(true);
    try {
      const updated = await api.updateProfile({ fname, lname, email, mobile });
      onUpdateUser(updated);
      setMessage({ type: 'success', text: 'پروفایل با موفقیت به‌روزرسانی شد.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'خطا در به‌روزرسانی پروفایل.' });
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel = user.role === 'admin' ? 'مدیر سیستم' : user.role === 'professor' ? 'استاد' : 'دانشجو';

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">مشخصات پروفایل</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">ویرایش اطلاعات حساب کاربری خود</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Avatar preview */}
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
            <div>
              <span className="block text-sm font-bold text-gray-900 dark:text-white">{user.fname} {user.lname}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">{roleLabel}</span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {message.text}
            </div>
          )}

          {/* Form fields */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام</label>
              <input
                type="text"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام خانوادگی</label>
              <input
                type="text"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">ایمیل</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">موبایل</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Static Info */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-xl">
            <div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">کد ملی</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{user.kodmeli}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block font-bold">نام کاربری</span>
              <span className="text-sm text-gray-900 dark:text-gray-100">{user.username}</span>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-bold transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> ذخیره...</>
              ) : (
                <><Save className="w-4 h-4" /> ذخیره تغییرات</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
