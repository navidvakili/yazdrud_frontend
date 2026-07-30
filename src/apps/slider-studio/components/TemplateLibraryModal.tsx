import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Sparkles,
  Download,
  Upload,
  Layers,
  Copy,
  Check,
  Play,
  Grid,
  FileCode,
  FolderPlus
} from 'lucide-react';
import type { SliderProject } from '@/src/shared-types/slider-studio';
import { INITIAL_SLIDER_PROJECTS } from '../data/presetTemplates';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (proj: SliderProject) => void;
  onAddTemplateSlides: (proj: SliderProject) => void;
  currentProject: SliderProject;
}

export default function TemplateLibraryModal({
  isOpen,
  onClose,
  onSelectProject,
  onAddTemplateSlides,
  currentProject
}: TemplateLibraryModalProps) {
  const [copied, setCopied] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'export' | 'import'>('presets');

  if (!isOpen) return null;

  // Handle Export JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentProject, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentProject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `slider-project-${currentProject.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle Import JSON
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.slides || !Array.isArray(parsed.slides)) {
        throw new Error('فرمت JSON معتبر نیست. آرایه slides یافت نشد.');
      }
      onSelectProject(parsed);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'خطا در بارگذاری فایل JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md rtl text-right transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">کتابخانه قالب‌ها و سیستم خروجی JSON</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">انتخاب پروژه‌های پیش‌فرض، واردات و صادرات قالب‌های آماده</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Bar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>قالب‌های آماده پیش‌فرض ({INITIAL_SLIDER_PROJECTS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>صادرات پروژه (Export JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md shadow-teal-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>واردات پروژه (Import JSON)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PRESET TEMPLATES */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {INITIAL_SLIDER_PROJECTS.map(proj => {
                const firstSlide = proj.slides[0];
                return (
                  <div
                    key={proj.id}
                    className="group bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 hover:border-teal-500/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                        {firstSlide.background.imageUrl ? (
                          <img
                            src={firstSlide.background.imageUrl}
                            alt={proj.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 dark:opacity-80"
                          />
                        ) : (
                          <div
                            className="w-full h-full"
                            style={{ background: firstSlide.background.gradient }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 dark:from-slate-950 via-transparent to-transparent" />
                        <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-[11px] text-teal-700 dark:text-teal-300 font-bold bg-white/90 dark:bg-slate-900/80 p-2 rounded-xl border border-gray-200 dark:border-slate-700/50 backdrop-blur-md">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {proj.slides.length} اسلاید
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">
                            {proj.width}x{proj.height}px
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{proj.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        onAddTemplateSlides(proj);
                        onClose();
                      }}
                      className="w-full py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FolderPlus className="w-4 h-4" />
                      <span>افزودن به پروژه فعلی</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: EXPORT JSON */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-800 dark:text-teal-300 text-xs leading-relaxed">
                کد زیر شامل کلیه تنظیمات لایه‌ها، کلید‌فریم‌ها، انیمیشن‌ها و ویژگی‌های پاسخگویی پروژه کنونی می‌باشد.
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={12}
                  value={JSON.stringify(currentProject, null, 2)}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-teal-700 dark:text-teal-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={handleCopyJson}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'کپی شد!' : 'کپی متن کد'}</span>
                </button>

                <button
                  onClick={handleDownloadJson}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT JSON */}
          {activeTab === 'import' && (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs leading-relaxed">
                متن JSON ساختار پروژه اسلایدر را در کادر زیر وارد کنید تا مستقیماً جایگزین پروژه جاری شود.
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                  {importError}
                </div>
              )}

              <textarea
                rows={12}
                value={importJsonText}
                onChange={e => setImportJsonText(e.target.value)}
                placeholder='{"id": "custom-proj", "title": "My Slider", "slides": [...]}'
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>بارگذاری و اعمال پروژه</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
