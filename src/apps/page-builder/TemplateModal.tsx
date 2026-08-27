import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SmartPageSchema, PageTemplate } from './builderTypes';
import { PRESET_PAGE_TEMPLATES } from './mockData';
import { X, FolderPlus, Download, Upload, Copy, Check, Sparkles, Layers } from 'lucide-react';

interface TemplateModalProps {
  currentSchema: SmartPageSchema;
  onSelectTemplate: (template: PageTemplate) => void;
  onImportJson: (importedSchema: SmartPageSchema) => void;
  onClose: () => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  currentSchema,
  onSelectTemplate,
  onImportJson,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'import' | 'export'>('presets');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentSchema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentSchema, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentSchema.slug || 'smart-page'}-schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('ساختار JSON نامعتبر است. آرایه sections یافت نشد.');
      }
      onImportJson(parsed);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'خطا در خواندن فایل یا متن JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md rtl text-right transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">کتابخانه قالب‌ها و واردات/صادرات JSON</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">انتخاب قالب‌های اماده، دریافت خروجی JSON و واردات چیدمان</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Nav Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer ${
              activeTab === 'presets' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>قالب‌های پیش‌فرض آماده</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer ${
              activeTab === 'export' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>صادرات ساختار JSON</span>
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer ${
              activeTab === 'import' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>واردات از JSON</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRESET_PAGE_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="group bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col justify-between space-y-3 hover:border-teal-500 transition-all"
                >
                  <div className="space-y-2">
                    <div className="h-36 rounded-2xl overflow-hidden relative border border-gray-200 dark:border-slate-800">
                      <img src={tmpl.thumbnail} alt={tmpl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold">
                        {tmpl.category}
                      </div>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                      {tmpl.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{tmpl.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTemplate(tmpl);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>بارگذاری این قالب روی بوم</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 text-teal-800 dark:text-teal-300 text-xs leading-relaxed">
                کد JSON زیر شامل تمام ساختار سکشن‌ها، ستون‌ها، ویجت‌ها، تنظیمات اتصال داده (Data Binding) و استایل‌های سراسری صفحه می‌باشد.
              </div>

              <textarea
                readOnly
                rows={12}
                value={JSON.stringify(currentSchema, null, 2)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-teal-700 dark:text-teal-400 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={handleCopyJson}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'کپی شد!' : 'کپی متن JSON'}</span>
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود فایل schema.json</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs leading-relaxed">
                متن JSON ساختار صفحه هوشمند را در کادر زیر وارد کنید تا جایگزین بوم جاری گردد.
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
                  {importError}
                </div>
              )}

              <textarea
                rows={10}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"id": "custom-page", "title": "My Page", "sections": [...]}'
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500"
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  <span>بارگذاری و جایگزینی صفحه</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
