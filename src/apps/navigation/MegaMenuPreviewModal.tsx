import React, { useState } from 'react';
import { X, Eye, Sun, Moon, ChevronDown } from 'lucide-react';
import { NavigationItem, MegaMenuConfig } from './types';

interface MegaMenuPreviewModalProps {
  item: NavigationItem;
  onClose: () => void;
}

export const MegaMenuPreviewModal: React.FC<MegaMenuPreviewModalProps> = ({
  item,
  onClose
}) => {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const config = item.megaMenuConfig as MegaMenuConfig | undefined;

  if (!config) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shadow-inner">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                پیش‌نمایش مگا منو: <span className="text-teal-600 dark:text-teal-400">{item.title}</span>
              </h3>
              <p className="text-xs text-slate-500">
                نمایش دقیق خروجی وب‌سایت
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Theme Controls */}
          <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                پیش‌نمایش خروجی وب‌سایت
              </h4>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setPreviewTheme('light')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  previewTheme === 'light'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> روشن
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme('dark')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                  previewTheme === 'dark'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> تاریک
              </button>
            </div>
          </div>

          {/* Simulated Website Frame */}
          <div className={`rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${
            previewTheme === 'dark'
              ? 'bg-slate-950 border-slate-800 text-slate-100'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            {/* Simulated Browser Address Bar */}
            <div className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-mono ${
              previewTheme === 'dark'
                ? 'bg-slate-900 border-slate-800 text-slate-400'
                : 'bg-slate-200/70 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                </div>
                <span className="dir-ltr text-[10px] font-sans">https://portal.university.edu</span>
              </div>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                پیش‌نمایش زنده
              </span>
            </div>

            {/* Simulated Website Header Navbar */}
            <div className={`px-6 py-4 border-b relative z-10 flex items-center justify-between ${
              previewTheme === 'dark'
                ? 'bg-slate-900/90 border-slate-800'
                : 'bg-white border-slate-200'
            }`}>
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-md text-xs">
                  CMS
                </div>
                <div>
                  <span className="font-black text-xs block">دانشگاه</span>
                  <span className="text-[9px] text-slate-400 block">Portal</span>
                </div>
              </div>

              {/* Navbar Items Simulation */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                  صفحه اصلی
                </span>

                {/* Active Item with Chevron */}
                <div className="relative">
                  <span className="px-3.5 py-2 rounded-xl text-xs font-black bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5 shadow-sm">
                    <span>{item.title}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  </span>
                </div>

                <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                  خدمات
                </span>
              </div>
            </div>

            {/* MEGA MENU DROPDOWN PANEL (READ-ONLY) */}
            <div className="p-6 md:p-8">
              <div className={`rounded-3xl p-6 shadow-2xl border transition-all ${
                previewTheme === 'dark'
                  ? 'bg-slate-900 border-slate-700 text-slate-100'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                  {config.columns.map(col => (
                    <div key={col.id} className="space-y-3">
                      {/* Header Title */}
                      <h4 className="font-extrabold text-xs text-teal-700 dark:text-teal-400 border-b pb-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span>{col.title}</span>
                      </h4>

                      {/* Render Links Group */}
                      {col.type === 'links' && (
                        <div className="space-y-1.5">
                          {(col.links || []).map(link => (
                            <a
                              key={link.id}
                              href={link.url}
                              onClick={e => e.preventDefault()}
                              className={`block p-2.5 rounded-xl transition-all group border ${
                                previewTheme === 'dark'
                                  ? 'border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                                  : 'border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                              }`}
                            >
                              <div className="font-bold text-[11px] flex items-center justify-between text-slate-800 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-300">
                                <span>{link.title}</span>
                                {link.badge && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-red-500 text-white">
                                    {link.badge}
                                  </span>
                                )}
                              </div>
                              {link.description && (
                                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                                  {link.description}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Render Featured Image */}
                      {col.type === 'image' && col.imageUrl && (
                        <div className="space-y-2">
                          <div className="h-32 rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 relative group">
                            <img
                              src={col.imageUrl}
                              alt={col.imageAlt || 'Banner'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          {col.imageCaption && (
                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-snug">
                              {col.imageCaption}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
