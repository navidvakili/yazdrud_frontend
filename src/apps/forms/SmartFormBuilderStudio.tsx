import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Plus,
  Sparkles,
  Search,
  CheckCircle,
  Copy,
  Trash2,
  Edit,
  Inbox,
  BarChart2,
  Wand2,
  Filter,
  Layers,
  Settings2,
  GitBranch,
  Eye,
  ArrowLeft,
  Clock,
  Save,
  Tag,
  HelpCircle,
  MessageSquare,
  Play,
  Grid,
  Type,
  AlignLeft,
  CheckSquare,
  Star,
  Table,
  Upload,
  Calendar,
  PenTool,
  CheckCircle2,
  Hash,
  Mail,
  Phone,
  ListFilter,
  CircleDot,
  SlidersHorizontal,
  LayoutGrid,
  Users,
  Activity,
  Sliders,
  Languages,
  Globe,
  Loader2
} from 'lucide-react';
import { FormDefinition, FormField, FormSubmission, FormStatus, FormType, FieldType } from './types';

const FORM_STATUS_BADGES: Record<FormStatus, { label: string; className: string }> = {
  published: {
    label: 'منتشر شده',
    className: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
  },
  page_builder_only: {
    label: 'انتشار در صفحه‌ساز',
    className: 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
  },
  draft: {
    label: 'پیش‌نویس',
    className: 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
  },
  paused: {
    label: 'غیرفعال',
    className: 'bg-slate-100 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40'
  },
  archived: {
    label: 'بایگانی‌شده',
    className: 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
  }
};
import { sampleForms, formTemplates, defaultTheme } from './mockData';
import { FormBuilderCanvas } from './FormBuilderCanvas';
import { FormLogicEditor } from './FormLogicEditor';
import { FormMessagesEditor } from './FormMessagesEditor';
import { SubmissionsManager } from './SubmissionsManager';
import { FormAnalyticsDashboard } from './FormAnalyticsDashboard';
import { FormSettingsModal } from './FormSettingsModal';
import { AiFormAssistantModal } from './AiFormAssistantModal';
import FormTemplateLibraryModal from './FormTemplateLibraryModal';
import { FormRespondentView } from './FormRespondentView';
import { createForm, deleteForm, fetchForms, fetchSubmissions, submitForm, updateForm, updateFormStatus, cloneForm as cloneFormApi, duplicateForm as duplicateFormApi, slugifyFormTitle } from './api';
import { ConfirmDialog } from '@/src/shared-components/ConfirmDialog';
import ToastNotification from '@/src/shared-components/ToastNotification';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface SmartFormBuilderStudioProps {
  onOpenTab?: (tabId: string, title?: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export const SmartFormBuilderStudio: React.FC<SmartFormBuilderStudioProps> = ({ onDirtyChange }) => {
  const { currentLang, languages } = useLanguage();
  const [forms, setForms] = useState<FormDefinition[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const [scrollToFieldId, setScrollToFieldId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'logic' | 'messages' | 'submissions' | 'analytics'>('builder');

  // Breakpoints / Viewport width
  const [activeBreakpoint, setActiveBreakpoint] = useState<'1240' | '1024' | '768' | '380'>('1240');

  // Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Filters for forms manager list
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | FormType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | FormStatus>('all');
  const [unsavedFormIds, setUnsavedFormIds] = useState<Record<string, boolean>>({});
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // ===== Toast state =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [pendingLeaveAction, setPendingLeaveAction] = useState<{ action: () => void; exitsForm: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingForms(true);
    fetchForms({ per_page: 500, lang: currentLang })
      .then(result => {
        if (!cancelled) setForms(result.data);
      })
      .catch(error => {
        console.error('Failed to load forms:', error);
        if (!cancelled) setForms(sampleForms);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingForms(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentLang]);

  useEffect(() => {
    // فرم‌های تازه‌ساخته‌شده که هنوز ذخیره نشده‌اند شناسه‌ی موقت سمت کلاینت دارند
    // (form_...) و در بک‌اند وجود ندارند — درخواست پاسخ‌ها برایشان بی‌معناست.
    if (!activeFormId || activeFormId.startsWith('form_')) {
      setSubmissions([]);
      return;
    }

    let cancelled = false;
    fetchSubmissions(activeFormId, { per_page: 500 })
      .then(result => {
        if (!cancelled) setSubmissions(result.data);
      })
      .catch(error => {
        console.error('Failed to load form submissions:', error);
        if (!cancelled) setSubmissions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [activeFormId]);

  const activeForm = forms.find(f => f.id === activeFormId) || null;

  useEffect(() => {
    // onDirtyChange عمداً در dependency array نیست: ModuleRenderer آن را به‌صورت
    // یک closure تازه در هر رندر می‌سازد، پس اگر اینجا هم باشد، افکت در هر رندر
    // دوباره اجرا و state بالادستی را عوض می‌کند و به یک حلقهٔ بی‌نهایت
    // (Maximum update depth exceeded) می‌انجامد.
    onDirtyChange?.(activeFormId ? !!unsavedFormIds[activeFormId] : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFormId, unsavedFormIds]);

  // Handle Form Update
  const handleUpdateActiveForm = (updatedForm: FormDefinition) => {
    setForms(prev => prev.map(f => (f.id === updatedForm.id ? updatedForm : f)));
    setUnsavedFormIds(prev => ({ ...prev, [updatedForm.id]: true }));
  };

  // فرم‌های تازه‌ساخته‌شده که هنوز هرگز ذخیره نشده‌اند، شناسه‌ی موقت سمت کلاینت دارند
  // (همان الگوی `form_${Date.now()}` که در handleCreateNewForm ساخته می‌شود)
  const isUnpersistedForm = (form: FormDefinition) => form.id.startsWith('form_');

  const handleSaveActiveForm = async () => {
    if (!activeForm || !unsavedFormIds[activeForm.id]) return;
    const wasUnpersisted = isUnpersistedForm(activeForm);
    setIsSavingForm(true);
    try {
      const savedForm = wasUnpersisted
        ? await createForm(activeForm, currentLang)
        : await updateForm(activeForm.id, activeForm);
      setForms(prev => prev.map(f => (f.id === activeForm.id ? savedForm : f)));
      setUnsavedFormIds(prev => {
        const next = { ...prev };
        delete next[activeForm.id];
        next[savedForm.id] = false;
        return next;
      });
      if (wasUnpersisted) setActiveFormId(savedForm.id);
      showToast(wasUnpersisted ? 'فرم با موفقیت ایجاد شد.' : 'فرم با موفقیت ذخیره شد.', 'success');
    } catch (error: any) {
      console.error('Failed to save form:', error);
      showToast(error?.message || 'خطا در ذخیره فرم', 'error');
    } finally {
      setIsSavingForm(false);
    }
  };

  // Change the active form's status (draft / published / paused / archived)
  const handleChangeStatus = async (nextStatus: FormStatus) => {
    if (!activeForm || nextStatus === activeForm.status) return;
    setIsPublishing(true);
    try {
      const savedForm = await updateFormStatus(activeForm.id, nextStatus);
      setForms(prev => prev.map(f => (f.id === savedForm.id ? savedForm : f)));
      const messages: Record<FormStatus, string> = {
        published: 'فرم با موفقیت منتشر شد.',
        page_builder_only: 'فرم فقط برای جاسازی در صفحه‌ساز هوشمند منتشر شد.',
        draft: 'فرم به پیش‌نویس تبدیل شد.',
        paused: 'فرم غیرفعال شد.',
        archived: 'فرم بایگانی شد.'
      };
      showToast(messages[nextStatus], 'success');
    } catch (error: any) {
      console.error('Failed to update form status:', error);
      showToast(error?.message || 'خطا در تغییر وضعیت فرم', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const requestLeaveFormEditor = (action: () => void, exitsForm: boolean = false) => {
    if (!activeFormId || !unsavedFormIds[activeFormId]) {
      action();
      return;
    }
    setPendingLeaveAction({ action, exitsForm });
  };

  const handleWorkspaceTabChange = (tab: 'builder' | 'logic' | 'messages' | 'submissions' | 'analytics') => {
    if (activeTab === 'builder' && tab !== 'builder') {
      requestLeaveFormEditor(() => setActiveTab(tab));
      return;
    }
    setActiveTab(tab);
  };

  // Create new blank form — فقط در state محلی؛ تا وقتی کاربر «ذخیره فرم» را نزند
  // هیچ درخواستی به وب‌سرویس ارسال نمی‌شود و چیزی در بک‌اند ساخته نمی‌شود
  const handleCreateNewForm = (type: FormType = 'form') => {
    const title = type === 'quiz' ? 'آزمون آنلاین جدید' : type === 'survey' ? 'پرسشنامه جدید' : 'فرم داده‌آمای جدید';
    const newForm: FormDefinition = {
      id: `form_${Date.now()}`,
      slug: slugifyFormTitle(title),
      title,
      description: 'لطفاً توضیحات و راهنمای تکمیل فرم را اینجا وارد کنید...',
      type,
      status: 'draft',
      category: 'عمومی',
      tags: ['جدید'],
      ownerName: 'مدیر سامانه',
      version: 1,
      createdAt: '۱۴۰۵/۰۵/۱۰',
      updatedAt: '۱۴۰۵/۰۵/۱۰',
      steps: [{ id: 's1', title: 'گام نخست', order: 1 }],
      fields: [],
      layoutBlocks: [],
      logicRules: [],
      quizConfig: {
        isQuiz: type === 'quiz',
        showInstantResult: type === 'quiz',
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
      auditLogs: [{ id: `al_${Date.now()}`, userName: 'کاربر سیستم', action: 'ایجاد اولیه فرم', timestamp: 'هم‌اکنون' }],
      viewsCount: 0,
      submissionsCount: 0,
      avgCompletionTimeSeconds: 0
    };

    setForms(prev => [newForm, ...prev]);
    setActiveFormId(newForm.id);
    setUnsavedFormIds(prev => ({ ...prev, [newForm.id]: true }));
    setActiveTab('builder');
  };

  // Quick Insert Field from Subtoolbar
  const handleQuickInsertField = (type: FieldType, label: string) => {
    if (!activeForm) return;
    const activeStep = activeForm.steps[0]?.id || 's1';
    const newField: FormField = {
      id: `f_${Date.now()}`,
      type,
      label: `سوال جدید ${activeForm.fields.length + 1}: ${label}`,
      placeholder: 'متن راهنما را وارد کنید...',
      stepId: activeStep,
      columnWidth: '100%',
      validation: { required: false },
      options: ['گزینه ۱', 'گزینه ۲', 'گزینه ۳'].map((lbl, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        label: lbl,
        value: `val_${idx + 1}`
      }))
    };

    handleUpdateActiveForm({
      ...activeForm,
      fields: [...activeForm.fields, newField]
    });
    setScrollToFieldId(newField.id);
    setActiveTab('builder');
  };

  // Clone Form
  const handleCloneForm = async (formToClone: FormDefinition) => {
    try {
      const cloned = await cloneFormApi(formToClone.id);
      setForms(prev => [cloned, ...prev]);
      showToast('فرم با موفقیت کپی شد.', 'success');
    } catch (error: any) {
      console.error('Failed to clone form:', error);
      showToast(error?.message || 'خطا در کپی فرم', 'error');
    }
  };

  // Duplicate Form into another language (translation starting point)
  const [duplicatingFormId, setDuplicatingFormId] = useState<string | null>(null);
  const [openLangMenuId, setOpenLangMenuId] = useState<string | null>(null);
  const handleDuplicateForm = async (formToDuplicate: FormDefinition, targetLang: string) => {
    setOpenLangMenuId(null);
    setDuplicatingFormId(formToDuplicate.id);
    try {
      const duplicated = await duplicateFormApi(formToDuplicate.id, targetLang);
      // فقط اگر نسخهٔ تازه هم‌زبان فهرست فعلی باشد، به لیست اضافه می‌شود
      if (targetLang === currentLang) setForms(prev => [duplicated, ...prev]);
      showToast('نسخهٔ فرم در زبان مقصد ایجاد شد.', 'success');
    } catch (error: any) {
      console.error('Failed to duplicate form:', error);
      showToast(error?.message || 'خطا در ایجاد نسخهٔ زبان دیگر', 'error');
    } finally {
      setDuplicatingFormId(null);
    }
  };

  // Delete Form
  const handleDeleteForm = async (formId: string) => {
    try {
      await deleteForm(formId);
      setForms(prev => prev.filter(f => f.id !== formId));
      if (activeFormId === formId) {
        setActiveFormId(null);
      }
      showToast('فرم با موفقیت حذف شد.', 'success');
    } catch (error: any) {
      console.error('Failed to delete form:', error);
      showToast(error?.message || 'خطا در حذف فرم', 'error');
    }
  };


  // Filtered forms list
  const filteredForms = forms.filter(f => {
    const matchesSearch =
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden select-none rtl text-right transition-colors">
      {/* 1. TOP STUDIO HEADER TOOLBAR */}
      <div className="h-14 border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 flex items-center justify-between px-4 z-20 shadow-xs shrink-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          {activeForm && (
            <button
              onClick={() => {
                requestLeaveFormEditor(() => setActiveFormId(null), true);
              }}
              className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 transition-colors cursor-pointer"
              title="بازگشت به فهرست فرم‌ها"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          )}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-indigo-500 flex items-center justify-center font-black text-lg text-white shadow-md shadow-teal-500/20">
            F
          </div>
          <div>
            {activeForm ? (
              <>
                <input
                  type="text"
                  value={activeForm.title}
                  onChange={e => handleUpdateActiveForm({ ...activeForm, title: e.target.value })}
                  className="w-64 md:w-96 text-xs font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-slate-700 focus:border-teal-500 focus:outline-none px-0.5 -mx-0.5"
                />
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] border border-teal-200 dark:border-teal-500/30 font-bold">
                    v2.4 Pro
                  </span>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>سیستم هوشمند فرم‌ساز و پرسشنامه‌ساز دیداری</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] border border-teal-200 dark:border-teal-500/30 font-bold">
                    v2.4 Pro
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Visual Form & Survey Intelligence Engine
                </p>
              </>
            )}
          </div>
        </div>

        {/* Center Breakpoint & Design Mode Badge */}
        {activeForm && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
              {(['1240', '1024', '768', '380'] as const).map(bp => (
                <button
                  key={bp}
                  onClick={() => setActiveBreakpoint(bp)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    activeBreakpoint === bp
                      ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {bp}px
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {activeForm && (
            <button
              onClick={() => void handleSaveActiveForm()}
              disabled={!unsavedFormIds[activeForm.id] || isSavingForm}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              title="ذخیره تغییرات فرم"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingForm ? 'در حال ذخیره...' : 'ذخیره فرم'}</span>
            </button>
          )}

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-amber-500" />
            <span>دستیار هوش مصنوعی</span>
          </button>

          {activeForm && (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>تنظیمات</span>
            </button>
          )}

          {activeForm && (
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-black text-xs transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>پیش‌نمایش زنده</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUB-TOOLBAR FOR PALETTE SHORTCUTS & STUDIO WORKSPACE TABS */}
      <div className="h-11 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 flex items-center justify-between text-xs z-10 shrink-0">
        {/* Left Quick Add Elements Menu */}
        {activeForm ? (
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-slate-500 font-bold text-[11px] ml-2 shrink-0">افزودن سریع:</span>
            <button
              onClick={() => handleQuickInsertField('text', 'متن کوتاه')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <Type className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>متن</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('textarea', 'توضیحات')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <AlignLeft className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>توضیحات</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('select', 'منوی کشویی')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <ListFilter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>کشویی</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('rating', 'رتبه‌بندی ستاره‌ای')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>امتیاز</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('matrix', 'جدول ماتریسی')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <Table className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>ماتریس</span>
            </button>
            <button
              onClick={() => handleQuickInsertField('file', 'بارگذاری فایل')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-orange-500" />
              <span>فایل</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold text-[11px]">فهرست تمام فرم‌ها و پرسشنامه‌های فعال</span>
          </div>
        )}

        {/* Right Form Tabs / Switcher */}
        {activeForm ? (
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'builder', label: 'طراح دیداری', icon: FileText },
              { id: 'logic', label: 'منطق شرطی', icon: GitBranch },
              { id: 'messages', label: 'پیام خوش‌آمد و پایان', icon: MessageSquare },
              { id: 'submissions', label: `پاسخ‌ها (${submissions.filter(s => s.formId === activeForm.id).length})`, icon: Inbox },
              { id: 'analytics', label: 'آمار', icon: BarChart2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleWorkspaceTabChange(tab.id as any)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px] shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-slate-800'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>کتابخانه قالب‌ها</span>
            </button>
            <button
              onClick={() => handleCreateNewForm('survey')}
              className="px-3 py-1 rounded-xl bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black text-xs flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ساخت پرسشنامه جدید</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. MAIN WORKSPACE / TAB CONTENT */}
      {activeForm ? (
        <div className="flex-1 flex overflow-hidden relative">
          {activeTab === 'builder' && (
            <FormBuilderCanvas
              form={activeForm}
              onChange={handleUpdateActiveForm}
              activeBreakpoint={activeBreakpoint}
              scrollToFieldId={scrollToFieldId}
            />
          )}

          {activeTab === 'logic' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <FormLogicEditor form={activeForm} onChange={handleUpdateActiveForm} />
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <FormMessagesEditor form={activeForm} onChange={handleUpdateActiveForm} />
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <SubmissionsManager
                form={activeForm}
                submissions={submissions.filter(s => s.formId === activeForm.id)}
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
              <FormAnalyticsDashboard
                form={activeForm}
                submissions={submissions.filter(s => s.formId === activeForm.id)}
              />
            </div>
          )}

        </div>
      ) : (
        /* FORM MANAGER / DASHBOARD LIST VIEW */
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-6">
          {/* Top Banner Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">کل فرم‌های فعال</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{forms.length}</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">کل پاسخ‌های ثبت‌شده</span>
                <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                  {forms.reduce((acc, f) => acc + f.submissionsCount, 0)}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Inbox className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">کل بازدیدهای یکتا</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {forms.reduce((acc, f) => acc + f.viewsCount, 0)}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">نرخ تکمیل میانگین</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {(() => {
                    const totalViews = forms.reduce((acc, f) => acc + f.viewsCount, 0);
                    const totalSubmissions = forms.reduce((acc, f) => acc + f.submissionsCount, 0);
                    const rate = totalViews > 0 ? Math.min(100, Math.round((totalSubmissions / totalViews) * 100)) : 0;
                    return `${rate.toLocaleString('fa-IR')}٪`;
                  })()}
                </span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="جستجو در نام فرم، دسته‌بندی و برچسب‌ها..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">نوع:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 font-bold"
              >
                <option value="all">همه انواع فرم‌ها</option>
                <option value="survey">پرسشنامه / نظرسنجی</option>
                <option value="quiz">آزمون آنلاین نمره‌دار</option>
                <option value="registration">فرم ثبت‌نام رویداد</option>
                <option value="form">فرم عمومی و تماس</option>
              </select>

              <span className="text-slate-500 font-bold mr-2">وضعیت:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 font-bold"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="published">منتشر شده</option>
                <option value="page_builder_only">انتشار در صفحه‌ساز</option>
                <option value="draft">پیش‌نویس</option>
                <option value="paused">غیرفعال</option>
                <option value="archived">بایگانی‌شده</option>
              </select>
            </div>
          </div>

          {/* Forms Grid */}
          {isLoadingForms ? (
            <div className="py-16 text-center text-sm font-bold text-slate-500">در حال دریافت فرم‌ها...</div>
          ) : filteredForms.length === 0 ? (
            <div className="py-16 text-center text-sm font-bold text-slate-500">فرمی برای نمایش یافت نشد.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredForms.map(formItem => (
              <div
                key={formItem.id}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 hover:border-teal-500 dark:hover:border-teal-500 transition-all hover:shadow-xl flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${FORM_STATUS_BADGES[formItem.status].className}`}
                    >
                      {FORM_STATUS_BADGES[formItem.status].label}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      v{formItem.version} • {new Date(formItem.updatedAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      {formItem.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {formItem.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-800/80">
                    <span className="font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      {formItem.fields.length} سوال
                    </span>
                    <span>•</span>
                    <span className="font-bold flex items-center gap-1">
                      <Inbox className="w-3.5 h-3.5 text-indigo-600" />
                      {formItem.submissionsCount} پاسخ
                    </span>
                    <span>•</span>
                    <span className="font-bold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      {formItem.viewsCount} بازدید
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCloneForm(formItem)}
                      className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      title="کپی فرم"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {(() => {
                      const otherLanguages = languages.filter(l => l.code !== currentLang);
                      if (otherLanguages.length === 0) return null;
                      const isDuplicating = duplicatingFormId === formItem.id;
                      const menuOpen = openLangMenuId === formItem.id;
                      return (
                        <div className="relative">
                          <button
                            onClick={() => setOpenLangMenuId(menuOpen ? null : formItem.id)}
                            disabled={isDuplicating}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            title="کپی این فرم به زبان دیگر"
                          >
                            {isDuplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                          </button>
                          {menuOpen && (
                            <div
                              onClick={e => e.stopPropagation()}
                              className="absolute top-full mt-1 right-0 z-10 w-40 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-xl overflow-hidden"
                            >
                              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-gray-100 dark:border-slate-800">
                                کپی به زبان...
                              </div>
                              {otherLanguages.map(l => (
                                <button
                                  key={l.code}
                                  onClick={() => handleDuplicateForm(formItem, l.code)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-right"
                                >
                                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                                  {l.name} <span className="text-slate-400 uppercase" dir="ltr">({l.code})</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <button
                      onClick={() => handleDeleteForm(formItem.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
                      title="حذف فرم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setActiveFormId(formItem.id);
                      setActiveTab('builder');
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>ویرایش در بوم استودیو</span>
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. MODALS */}
      {/* Template Library Modal */}
      <FormTemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectForm={async f => {
          try {
            const savedForm = await createForm(f, currentLang);
            setForms(prev => [savedForm, ...prev]);
            setActiveFormId(savedForm.id);
            setActiveTab('builder');
          } catch (error: any) {
            console.error('Failed to create form from template:', error);
            showToast(error?.message || 'خطا در ایجاد فرم از قالب', 'error');
          }
        }}
        currentForm={activeForm}
      />

      {/* AI Assistant Modal */}
      <AiFormAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onFormGenerated={async newAiForm => {
          const generatedForm: FormDefinition = {
            ...sampleForms[0],
            ...newAiForm,
            id: `form_${Date.now()}`,
            createdAt: '۱۴۰۵/۰۵/۱۰',
            updatedAt: '۱۴۰۵/۰۵/۱۰',
            fields: newAiForm.fields || [],
            steps: newAiForm.steps || [{ id: 's_ai', title: 'گام اصلی فرم', order: 1 }],
            auditLogs: [],
            viewsCount: 0,
            submissionsCount: 0,
            avgCompletionTimeSeconds: 0
          };
          try {
            const savedForm = await createForm(generatedForm, currentLang);
            setForms(prev => [savedForm, ...prev]);
            setActiveFormId(savedForm.id);
            setActiveTab('builder');
          } catch (error: any) {
            console.error('Failed to save AI-generated form:', error);
            showToast(error?.message || 'خطا در ذخیره فرم تولیدشده توسط هوش مصنوعی', 'error');
          }
        }}
      />

      {/* Settings Modal (general info, theme, sharing & publishing) */}
      {activeForm && (
        <FormSettingsModal
          form={activeForm}
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onChange={handleUpdateActiveForm}
          onChangeStatus={handleChangeStatus}
          isChangingStatus={isPublishing}
          onSave={handleSaveActiveForm}
          isSaving={isSavingForm}
          hasUnsavedChanges={!!unsavedFormIds[activeForm.id]}
        />
      )}

      {/* Interactive Live Preview Modal (Matching SliderStudio InteractivePreviewModal) */}
      {activeForm && isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 animate-in fade-in select-none rtl text-right">
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between py-2 px-4 bg-slate-900 border border-slate-800 rounded-2xl mb-4 text-white">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-black">پیش‌نمایش زنده و آزمایشی فرم کاربر</span>
            </div>
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl text-slate-300 hover:text-white"
            >
              بستن پیش‌نمایش
            </button>
          </div>

          <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto pb-12">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-slate-800 shadow-2xl">
              <FormRespondentView
                form={activeForm}
                onSubmitted={async answers => {
                  if (activeForm.status !== 'published') return;
                  try {
                    // فیلدهای امنیتی (کپچا/تلهٔ ضدربات) جدا از answers ارسال می‌شوند — این‌ها
                    // فقط برای بررسی ضدربات لازم‌اند و نباید در پاسخ ذخیره‌شده بمانند
                    const submissionAnswers: Record<string, any> = {};
                    const securityChallenges: Record<string, any> = {};
                    activeForm.fields.forEach(f => {
                      if (!(f.id in answers)) return;
                      if (f.type === 'security') securityChallenges[f.id] = answers[f.id];
                      else submissionAnswers[f.id] = answers[f.id];
                    });
                    const submission = await submitForm(activeForm.id, { answers: submissionAnswers, security_challenges: securityChallenges });
                    const result = await fetchSubmissions(activeForm.id, { per_page: 500 });
                    setSubmissions(result.data);
                    return {
                      trackingCode: submission.tracking_code,
                      scoreTotal: submission.score_total,
                      gradeLabel: submission.grade_label
                    };
                  } catch (error) {
                    console.error('Failed to submit form response:', error);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingLeaveAction}
        title="تغییرات ذخیره نشده"
        message="تغییراتی در فرم انجام شده است که هنوز ذخیره نشده‌اند. آیا می‌خواهید بدون ذخیره از محیط طراحی خارج شوید؟"
        confirmLabel="خروج بدون ذخیره"
        cancelLabel="ادامه ویرایش"
        danger={false}
        onConfirm={() => {
          // فقط وقتی این «خروج بدون ذخیره» واقعاً از محیط فرم خارج می‌شود (نه صرفاً
          // جابه‌جایی بین تب‌های همین فرم) و فرم فعال هرگز ذخیره نشده (شناسه‌ی موقت
          // سمت کلاینت دارد)، باید کاملاً از state هم حذف شود — وگرنه یک فرم شبح‌وار
          // (که هیچ‌وقت در بک‌اند ساخته نشده) در فهرست باقی می‌ماند.
          if (pendingLeaveAction?.exitsForm && activeForm && isUnpersistedForm(activeForm)) {
            const discardedId = activeForm.id;
            setForms(prev => prev.filter(f => f.id !== discardedId));
            setUnsavedFormIds(prev => {
              const next = { ...prev };
              delete next[discardedId];
              return next;
            });
          }
          pendingLeaveAction?.action();
          setPendingLeaveAction(null);
        }}
        onCancel={() => setPendingLeaveAction(null)}
      />

      <ToastNotification toast={toast} />
    </div>
  );
};
