import React from 'react';
import { MessageSquare, PlayCircle, CheckCircle2 } from 'lucide-react';
import { FormDefinition, FormSettings } from './types';

interface FormMessagesEditorProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
}

export const FormMessagesEditor: React.FC<FormMessagesEditorProps> = ({ form, onChange }) => {
  const settings = form.settings;

  const handleUpdateSettings = (key: keyof FormSettings, value: any) => {
    onChange({
      ...form,
      settings: {
        ...settings,
        [key]: value
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">پیام خوش‌آمد و پایان فرم</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تنظیم صفحه‌ی معرفی قبل از شروع پاسخ‌دهی و پیامی که بعد از ارسال موفق فرم به کاربر نمایش داده می‌شود
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Screen */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-teal-600" /> صفحه‌ی خوش‌آمدگویی
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showWelcomeScreen}
              onChange={e => handleUpdateSettings('showWelcomeScreen', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          اگر فعال باشد، قبل از نمایش سؤال اول، یک صفحه‌ی معرفی با عنوان و توضیحات دلخواه شما نشان داده می‌شود.
        </p>

        {settings.showWelcomeScreen && (
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان صفحه‌ی خوش‌آمدگویی
              </label>
              <input
                type="text"
                value={settings.welcomeTitle || ''}
                onChange={e => handleUpdateSettings('welcomeTitle', e.target.value)}
                placeholder={form.title || 'به این پرسشنامه خوش آمدید'}
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات و راهنمای شروع
              </label>
              <textarea
                rows={3}
                value={settings.welcomeDescription || ''}
                onChange={e => handleUpdateSettings('welcomeDescription', e.target.value)}
                placeholder="توضیح مختصری درباره‌ی هدف این فرم و راهنمای تکمیل آن بنویسید..."
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                متن دکمه‌ی شروع
              </label>
              <input
                type="text"
                value={settings.welcomeButtonText || ''}
                onChange={e => handleUpdateSettings('welcomeButtonText', e.target.value)}
                placeholder="شروع کنید"
                className="w-full max-w-xs px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Completion Message */}
      <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> پیام پایان تکمیل فرم
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          این پیام بلافاصله بعد از ارسال موفق پاسخ، به‌همراه کد پیگیری، به کاربر نمایش داده می‌شود.
        </p>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            عنوان پیام پایان
          </label>
          <input
            type="text"
            value={settings.customSuccessMessage}
            onChange={e => handleUpdateSettings('customSuccessMessage', e.target.value)}
            placeholder="ثبت با موفقیت انجام گردید!"
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            توضیحات تکمیلی
          </label>
          <textarea
            rows={3}
            value={settings.completionDescription || ''}
            onChange={e => handleUpdateSettings('completionDescription', e.target.value)}
            placeholder="اطلاعات شما در پایگاه داده سامانه ثبت شد و کد پیگیری زیر صادر گردید."
            className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs resize-none"
          />
        </div>
      </div>
    </div>
  );
};
