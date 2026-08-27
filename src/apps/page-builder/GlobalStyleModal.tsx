import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GlobalStyles } from './builderTypes';
import { X, Palette, Check, Copy, Code, Menu as MenuIcon } from 'lucide-react';

interface GlobalStyleModalProps {
  globalStyles: GlobalStyles;
  onSave: (updated: GlobalStyles) => void;
  onClose: () => void;
}

export const GlobalStyleModal: React.FC<GlobalStyleModalProps> = ({
  globalStyles,
  onSave,
  onClose
}) => {
  const [styles, setStyles] = useState<GlobalStyles>({ ...globalStyles });
  const [activeTab, setActiveTab] = useState<'palette' | 'css'>('palette');
  const [copied, setCopied] = useState(false);

  const generateCssVariables = () => {
    return `:root {
  --pb-primary-color: ${styles.primaryColor};
  --pb-secondary-color: ${styles.secondaryColor};
  --pb-accent-color: ${styles.accentColor};
  --pb-bg-color: ${styles.backgroundColor};
  --pb-text-color: ${styles.textColor};
  --pb-font-family: ${styles.fontFamily};
  --pb-container-width: ${styles.containerMaxWidth}px;
  --pb-base-radius: ${styles.baseRadius}px;
}`;
  };

  const handleCopyCss = () => {
    navigator.clipboard.writeText(generateCssVariables());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md rtl text-right transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-900 dark:text-white flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">مدیریت استایل‌های سراسری (Global Style Engine)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">تنظیم پالت رنگ‌ها، فونت پایه و متغیرهای CSS سراسری</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 text-xs">
          <button
            onClick={() => setActiveTab('palette')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer ${
              activeTab === 'palette' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950' : 'text-slate-500'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>پالت رنگ و تایپوگرافی</span>
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer ${
              activeTab === 'css' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950' : 'text-slate-500'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>متغیرهای CSS (Variables)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'palette' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رنگ اصلی (Primary)</label>
                  <input
                    type="color"
                    value={styles.primaryColor}
                    onChange={(e) => setStyles({ ...styles, primaryColor: e.target.value })}
                    className="w-full h-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رنگ ثانویه (Secondary)</label>
                  <input
                    type="color"
                    value={styles.secondaryColor}
                    onChange={(e) => setStyles({ ...styles, secondaryColor: e.target.value })}
                    className="w-full h-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رنگ شاخص (Accent)</label>
                  <input
                    type="color"
                    value={styles.accentColor}
                    onChange={(e) => setStyles({ ...styles, accentColor: e.target.value })}
                    className="w-full h-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رنگ پس‌زمینه اصلی صفحه</label>
                  <input
                    type="color"
                    value={styles.backgroundColor}
                    onChange={(e) => setStyles({ ...styles, backgroundColor: e.target.value })}
                    className="w-full h-10 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">فونت پایه سیستم</label>
                  <select
                    value={styles.fontFamily}
                    onChange={(e) => setStyles({ ...styles, fontFamily: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="Vazirmatn, sans-serif">وزیرمتن (Vazirmatn)</option>
                    <option value="IRANSans, sans-serif">ایران‌سنس (IRANSans)</option>
                    <option value="Yekan, sans-serif">یکان (Yekan)</option>
                    <option value="system-ui, sans-serif">فونت پیش‌فرض سیستم</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">حداکثر عرض کانتینر (px)</label>
                  <input
                    type="number"
                    value={styles.containerMaxWidth}
                    onChange={(e) => setStyles({ ...styles, containerMaxWidth: parseInt(e.target.value) || 1200 })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setStyles({ ...styles, showSiteNav: styles.showSiteNav === false ? true : false })}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <MenuIcon className="w-4 h-4 text-slate-400" />
                    نمایش منوی اصلی وب‌سایت هنگام مشاهدهٔ این صفحه
                  </span>
                  <span
                    className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${
                      styles.showSiteNav === false ? 'bg-slate-300 dark:bg-slate-700' : 'bg-teal-500'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                        styles.showSiteNav === false ? 'left-0.5' : 'left-5'
                      }`}
                    />
                  </span>
                </button>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  در صورت خاموش بودن، هدر و منوی اصلی سایت (نه ویجت‌های داخل خود صفحه) در نمایش عمومی این صفحه پنهان می‌شود — مناسب صفحات فرودی تمام‌صفحه.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                readOnly
                rows={8}
                value={generateCssVariables()}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-teal-600 dark:text-teal-400 focus:outline-none"
              />
              <button
                onClick={handleCopyCss}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'کپی شد!' : 'کپی کدهای CSS'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs">
            انصراف
          </button>
          <button
            onClick={() => {
              onSave(styles);
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>ذخیره و اعمال استایل‌ها</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
