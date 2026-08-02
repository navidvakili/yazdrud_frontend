// ============================================================
// LanguageManagerModal — مدیریت زبان‌های محتوا (افزودن/ویرایش/حذف)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Loader2, Trash2, Edit3, Check, Star, Save, Globe, FileCode2 } from 'lucide-react';
import type { Language, LanguagePayload } from '@/src/shared-types';
import {
  fetchLanguages, createLanguage, updateLanguage, deleteLanguage, fetchLocale, saveLocale,
} from '@/src/shared-api/languages';
import { useLanguage } from '@/src/shared-utils/LanguageContext';
import ToastNotification from '@/src/shared-components/ToastNotification';

interface LanguageManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LanguageManagerModal({ open, onClose }: LanguageManagerModalProps) {
  const { reloadLanguages } = useLanguage();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formDir, setFormDir] = useState<'rtl' | 'ltr'>('rtl');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formOrdering, setFormOrdering] = useState(0);
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Locale editor (translations file of the public site)
  const [localeEditLang, setLocaleEditLang] = useState<Language | null>(null);
  const [localeContent, setLocaleContent] = useState('');
  const [localeLoading, setLocaleLoading] = useState(false);
  const [localeSaving, setLocaleSaving] = useState(false);
  const [localeMessage, setLocaleMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openLocaleEditor = async (lang: Language) => {
    setLocaleEditLang(lang);
    setLocaleContent('');
    setLocaleMessage(null);
    setLocaleLoading(true);
    try {
      const data = await fetchLocale(lang.code);
      setLocaleContent(data.data?.content || '');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'خطا در دریافت فایل ترجمه.';
      setLocaleMessage({ text: msg, type: 'error' });
    } finally {
      setLocaleLoading(false);
    }
  };

  const closeLocaleEditor = () => {
    setLocaleEditLang(null);
    setLocaleContent('');
    setLocaleMessage(null);
  };

  const handleSaveLocale = async () => {
    if (!localeEditLang) return;
    setLocaleSaving(true);
    setLocaleMessage(null);
    try {
      await saveLocale(localeEditLang.code, localeContent);
      showToast(`ترجمه‌های زبان ${localeEditLang.name} ذخیره شد.`);
      closeLocaleEditor();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'خطا در ذخیره فایل ترجمه.';
      setLocaleMessage({ text: msg, type: 'error' });
    } finally {
      setLocaleSaving(false);
    }
  };

  const loadLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLanguages({ per_page: 100 });
      setLanguages(data.data || []);
    } catch (err) {
      console.error('Error loading languages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadLanguages();
      resetForm();
    }
  }, [open, loadLanguages]);

  const resetForm = () => {
    setEditingId(null);
    setFormCode('');
    setFormName('');
    setFormNameEn('');
    setFormDir('rtl');
    setFormIsActive(true);
    setFormIsDefault(false);
    setFormOrdering(languages.length + 1);
    setFormMessage(null);
  };

  const handleEdit = (lang: Language) => {
    setEditingId(lang.id);
    setFormCode(lang.code);
    setFormName(lang.name);
    setFormNameEn(lang.name_en || '');
    setFormDir(lang.dir);
    setFormIsActive(lang.is_active);
    setFormIsDefault(lang.is_default);
    setFormOrdering(lang.ordering);
    setFormMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      setFormMessage({ text: 'کد و نام زبان الزامی است.', type: 'error' });
      return;
    }
    setFormLoading(true);
    setFormMessage(null);
    try {
      const payload: LanguagePayload = {
        code: formCode.trim().toLowerCase(),
        name: formName.trim(),
        name_en: formNameEn.trim() || null,
        dir: formDir,
        is_active: formIsActive,
        is_default: formIsDefault,
        ordering: formOrdering,
      };
      if (editingId) {
        await updateLanguage(editingId, payload);
        showToast('زبان با موفقیت ویرایش شد.');
      } else {
        await createLanguage(payload);
        showToast('زبان با موفقیت افزوده شد.');
      }
      resetForm();
      await loadLanguages();
      await reloadLanguages();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'خطا در ذخیره زبان.';
      setFormMessage({ text: msg, type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await deleteLanguage(deleteId);
      showToast('زبان حذف شد.');
      setDeleteId(null);
      await loadLanguages();
      await reloadLanguages();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'خطا در حذف زبان.';
      showToast(msg, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[95] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-[#161618] border border-gray-150 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center">
                    <Globe className="w-4.5 h-4.5 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">مدیریت زبان‌ها</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">زبان‌های محتوای سایت — هر زبان محتوای جداگانه دارد</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                      {editingId ? (
                        <>
                          <Edit3 className="w-3.5 h-3.5 text-teal-500" /> ویرایش زبان
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-teal-500" /> افزودن زبان جدید
                        </>
                      )}
                    </span>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        انصراف از ویرایش
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">کد زبان *</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="مثلاً fa, en, ar, fr"
                        className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans ltr:text-left"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">نام زبان (فارسی) *</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="مثلاً فارسی، انگلیسی، عربی"
                        className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">نام زبان (لاتین)</label>
                      <input
                        type="text"
                        value={formNameEn}
                        onChange={(e) => setFormNameEn(e.target.value)}
                        placeholder="مثلاً Persian, English"
                        className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans ltr:text-left"
                        dir="ltr"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">جهت نوشتار</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormDir('rtl')}
                          className={`px-2 py-2 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${formDir === 'rtl' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/40' : 'bg-white dark:bg-gray-850 text-gray-500 border-gray-150 dark:border-gray-800'}`}
                        >
                          راست‌به‌چپ (RTL)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDir('ltr')}
                          className={`px-2 py-2 rounded-lg text-[11px] font-bold cursor-pointer border transition-colors ${formDir === 'ltr' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/40' : 'bg-white dark:bg-gray-850 text-gray-500 border-gray-150 dark:border-gray-800'}`}
                        >
                          چپ‌به‌راست (LTR)
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500">ترتیب نمایش</label>
                      <input
                        type="number"
                        value={formOrdering}
                        onChange={(e) => setFormOrdering(Number(e.target.value))}
                        className="bg-white dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-sans"
                      />
                    </div>
                    <div className="flex items-end gap-3 pb-0.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsActive}
                          onChange={(e) => setFormIsActive(e.target.checked)}
                          className="w-4 h-4 accent-teal-500"
                        />
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">فعال</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formIsDefault}
                          onChange={(e) => setFormIsDefault(e.target.checked)}
                          className="w-4 h-4 accent-amber-500"
                        />
                        <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" /> زبان پیش‌فرض
                        </span>
                      </label>
                    </div>
                  </div>

                  {formMessage && (
                    <span className={`text-[11px] font-bold ${formMessage.type === 'error' ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400'}`}>
                      {formMessage.text}
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={formLoading}
                    className="self-end flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    {formLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {editingId ? 'ذخیره تغییرات' : 'افزودن زبان'}
                  </button>
                </form>

                {/* List */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-teal-500" /> زبان‌های تعریف‌شده ({languages.length})
                  </span>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                      {languages.map((lang) => (
                        <div
                          key={lang.id}
                          className="flex items-center justify-between bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl px-3.5 py-2.5"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black flex items-center justify-center font-sans uppercase">
                              {lang.code}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                                {lang.name}
                                {lang.is_default && (
                                  <span className="flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                                    <Star className="w-2.5 h-2.5" /> پیش‌فرض
                                  </span>
                                )}
                                {!lang.is_active && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 font-bold">
                                    غیرفعال
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] text-gray-400 font-sans flex items-center gap-1.5">
                                {lang.name_en} • {lang.dir === 'rtl' ? 'RTL' : 'LTR'} • ترتیب: {lang.ordering}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openLocaleEditor(lang)}
                              className="p-2 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/10 cursor-pointer transition-colors"
                              title="ویرایش ترجمه‌ها (فایل سایت عمومی)"
                            >
                              <FileCode2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleEdit(lang)}
                              className="p-2 rounded-lg text-gray-400 hover:text-teal-500 hover:bg-teal-500/10 cursor-pointer transition-colors"
                              title="ویرایش"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(lang.id)}
                              disabled={lang.is_default}
                              className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={lang.is_default ? 'زبان پیش‌فرض قابل حذف نیست' : 'حذف'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Locale editor (translations file) */}
          <AnimatePresence>
            {localeEditLang && (
              <>
                <div className="fixed inset-0 bg-black/40 z-[100]" onClick={closeLocaleEditor} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[105] flex items-center justify-center p-4 pointer-events-none"
                >
                  <div className="bg-white dark:bg-[#161618] border border-gray-150 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col pointer-events-auto overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <FileCode2 className="w-4.5 h-4.5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-gray-900 dark:text-white">
                            ویرایش ترجمه‌ها — {localeEditLang.name}
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 font-sans uppercase align-middle">
                              {localeEditLang.code}
                            </span>
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            فایل ترجمه سایت عمومی (src/locales/{localeEditLang.code}.ts) — پس از ذخیره، با رفرش سایت عمومی اعمال می‌شود.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={closeLocaleEditor}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                      {localeLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={localeContent}
                            onChange={(e) => setLocaleContent(e.target.value)}
                            spellCheck={false}
                            dir="ltr"
                            className="flex-1 min-h-[45vh] bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-4 text-[11px] leading-6 font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none text-left"
                          />
                          {localeMessage && (
                            <span className={`text-[11px] font-bold ${localeMessage.type === 'error' ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400'}`}>
                              {localeMessage.text}
                            </span>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">
                              هر کلید باید معادل فارسی داشته باشد؛ زبان فارسی به عنوان مرجع استفاده می‌شود.
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={closeLocaleEditor}
                                className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                انصراف
                              </button>
                              <button
                                onClick={handleSaveLocale}
                                disabled={localeSaving}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                {localeSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <Save className="w-3.5 h-3.5" /> ذخیره ترجمه‌ها
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Delete confirmation */}
          <AnimatePresence>
            {deleteId && (
              <>
                <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setDeleteId(null)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 z-[105] flex items-center justify-center p-4 pointer-events-none"
                >
                  <div className="bg-white dark:bg-[#161618] border border-gray-150 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-sm p-5 pointer-events-auto">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2">حذف زبان</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-6">
                      آیا از حذف این زبان مطمئن هستید؟ محتوای مرتبط با این زبان در سایت عمومی نمایش داده نخواهد شد.
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </button>
                      <button
                        onClick={() => setDeleteId(null)}
                        className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {toast && <ToastNotification toast={toast} />}
        </>
      )}
    </AnimatePresence>
  );
}
