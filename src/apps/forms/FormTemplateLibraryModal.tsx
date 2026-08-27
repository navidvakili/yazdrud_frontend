import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Download,
  Upload,
  Layers,
  Copy,
  Check,
  Grid,
  FileCode,
  FolderPlus,
  Search,
  MessageSquare,
  Award,
  UserPlus,
  HelpCircle,
  BarChart2,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { FormDefinition } from './types';
import { sampleForms, formTemplates, defaultTheme } from './mockData';

interface FormTemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectForm: (form: FormDefinition) => void;
  currentForm: FormDefinition | null;
}

export default function FormTemplateLibraryModal({
  isOpen,
  onClose,
  onSelectForm,
  currentForm
}: FormTemplateLibraryModalProps) {
  const [copied, setCopied] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [activeTab, setActiveTab] = useState<'presets' | 'export' | 'import'>('presets');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  if (!isOpen) return null;

  // Handle Export JSON
  const handleCopyJson = () => {
    if (!currentForm) return;
    navigator.clipboard.writeText(JSON.stringify(currentForm, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!currentForm) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentForm, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `form-template-${currentForm.id}.json`);
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
      if (!parsed.fields || !Array.isArray(parsed.fields)) {
        throw new Error('فرمت JSON معتبر نیست. آرایه fields یافت نشد.');
      }
      onSelectForm({
        ...parsed,
        id: `form_${Date.now()}`,
        title: `${parsed.title || 'فرم وارد شده'} (جدید)`,
        createdAt: '۱۴۰۵/۰۵/۱۰',
        updatedAt: '۱۴۰۵/۰۵/۱۰'
      });
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'خطا در بارگذاری ساختار JSON فرم.');
    }
  };

  // Convert template to FormDefinition
  const handleLoadTemplate = (tplId: string) => {
    const existing = sampleForms.find(f => f.id.includes(tplId) || tplId.includes(f.type));
    if (existing) {
      onSelectForm({
        ...existing,
        id: `form_${Date.now()}`,
        title: `${existing.title} (الگو)`,
        createdAt: '۱۴۰۵/۰۵/۱۰',
        updatedAt: '۱۴۰۵/۰۵/۱۰',
        viewsCount: 0,
        submissionsCount: 0
      });
      onClose();
      return;
    }

    // Generate fallback template
    const newForm: FormDefinition = {
      id: `form_${Date.now()}`,
      slug: `form-${Date.now()}`,
      title: formTemplates.find(t => t.id === tplId)?.title || 'فرم الگوی جدید',
      description: formTemplates.find(t => t.id === tplId)?.description || '',
      type: tplId.includes('quiz') ? 'quiz' : tplId.includes('eval') ? 'survey' : 'form',
      status: 'draft',
      category: 'عمومی',
      tags: ['قالب آماده'],
      ownerName: 'مدیر سامانه',
      version: 1,
      createdAt: '۱۴۰۵/۰۵/۱۰',
      updatedAt: '۱۴۰۵/۰۵/۱۰',
      steps: [{ id: 's1', title: 'بخش اول', order: 1 }],
      fields: [
        {
          id: `f_${Date.now()}_1`,
          type: 'text',
          label: 'نام و نام خانوادگی',
          placeholder: 'مثال: علی رضایی',
          stepId: 's1',
          columnWidth: '50%',
          validation: { required: true }
        },
        {
          id: `f_${Date.now()}_2`,
          type: 'email',
          label: 'پست الکترونیکی',
          placeholder: 'name@domain.com',
          stepId: 's1',
          columnWidth: '50%',
          validation: { required: true }
        },
        {
          id: `f_${Date.now()}_3`,
          type: 'rating',
          label: 'میزان رضایت کلی شما',
          stepId: 's1',
          columnWidth: '100%',
          validation: { required: true }
        }
      ],
      layoutBlocks: [],
      logicRules: [],
      quizConfig: {
        isQuiz: tplId.includes('quiz'),
        showInstantResult: true,
        allowNegativeScore: false,
        randomizeQuestions: false,
        gradeThresholds: []
      },
      theme: defaultTheme,
      settings: {
        allowAnonymous: true,
        limitOnePerUser: false,
        requireAuth: false,
        enableCaptcha: true,
        enableAutoSave: true,
        showProgressBar: true,
        showWelcomeScreen: false,
        customSuccessMessage: 'اطلاعات شما با موفقیت ثبت شد.',
        generateTrackingCode: true,
        trackingCodePrefix: 'FRM-2026',
        sendEmailNotification: false,
        sendSmsNotification: false
      },
      auditLogs: [],
      viewsCount: 0,
      submissionsCount: 0,
      avgCompletionTimeSeconds: 0
    };

    onSelectForm(newForm);
    onClose();
  };

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return MessageSquare;
      case 'Award': return Award;
      case 'UserPlus': return UserPlus;
      case 'HelpCircle': return HelpCircle;
      case 'BarChart2': return BarChart2;
      default: return FileText;
    }
  };

  const filteredTemplates = formTemplates.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'all' || t.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none rtl text-right">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="h-16 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center font-bold">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>کتابخانه الگوها و مدیریت فایل ساختار فرم</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold">
                  v2.4 Pro
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                قالب‌های از پیش آماده استاندارد دانشگاهی، ورود و خروجی ساختار JSON
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>قالب‌های پیش‌فرض سامانه ({formTemplates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>خروجی گرفتن ساختار فرم (Export JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>واردسازی قالب دلخواه (Import JSON)</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40">
          {/* TAB 1: PRESET TEMPLATES */}
          {activeTab === 'presets' && (
            <div className="space-y-5">
              {/* Search & Category Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="جستجو در بین الگوها..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pr-9 pl-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {['all', 'عمومی و ارتباطی', 'آموزشی', 'رویدادها', 'ارزیابی', 'پژوهش'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      {cat === 'all' ? 'همه دسته‌ها' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Templates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(tpl => {
                  const IconComp = getTemplateIcon(tpl.icon);
                  return (
                    <div
                      key={tpl.id}
                      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 hover:border-teal-500 dark:hover:border-teal-500 transition-all hover:shadow-lg flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                            <IconComp className="w-5 h-5" />
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-gray-200 dark:border-slate-700">
                            {tpl.category}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                            {tpl.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {tpl.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> آماده بارگذاری
                        </span>
                        <button
                          onClick={() => handleLoadTemplate(tpl.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>انتخاب و بارگذاری</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: EXPORT JSON */}
          {activeTab === 'export' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-2xl flex items-center gap-3">
                <FileCode className="w-6 h-6 text-teal-600 dark:text-teal-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-black text-slate-900 dark:text-white block">خروجی کامل ساختار فرم و فیلدها</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    می‌توانید ساختار این فرم را کپی کرده یا به صورت فایل JSON ذخیره و در سامانه‌های دیگر بارگذاری نمایید.
                  </span>
                </div>
              </div>

              {currentForm ? (
                <div className="space-y-3">
                  <div className="relative">
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs max-h-72 overflow-y-auto dir-ltr text-left border border-slate-800">
                      {JSON.stringify(currentForm, null, 2)}
                    </pre>
                  </div>

                  <div className="flex items-center gap-3 justify-end pt-2">
                    <button
                      onClick={handleCopyJson}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'کپی شد!' : 'کپی در کلیپ‌بورد'}</span>
                    </button>

                    <button
                      onClick={handleDownloadJson}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-teal-500/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>دانلود فایل JSON</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">
                  در حال حاضر هیچ فرم فعالی برای خروجی گرفتن انتخاب نشده است.
                </p>
              )}
            </div>
          )}

          {/* TAB 3: IMPORT JSON */}
          {activeTab === 'import' && (
            <form onSubmit={handleImportSubmit} className="space-y-4 max-w-2xl mx-auto">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl flex items-center gap-3">
                <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-black text-slate-900 dark:text-white block">بارگذاری ساختار فرم از فایل JSON</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    کد ساختار JSON فرم را در کادر زیر جای‌گذاری کنید تا فوراً در بوم ویرایشگر باز شود.
                  </span>
                </div>
              </div>

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {importError}
                </div>
              )}

              <div>
                <textarea
                  rows={8}
                  value={importJsonText}
                  onChange={e => setImportJsonText(e.target.value)}
                  placeholder="محتوای JSON فرم را اینجا الصاق کنید..."
                  className="w-full p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs dir-ltr text-left focus:outline-none focus:border-teal-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={!importJsonText.trim()}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-teal-500/20"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>بارگذاری و باز کردن در استودیو</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
