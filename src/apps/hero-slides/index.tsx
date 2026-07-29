// ============================================================
// HeroSlidesManagement — مدیریت اسلایدر صفحه اصلی
//
// امکان ایجاد، ویرایش، حذف و مرتب‌سازی اسلایدهای
// hero/slider صفحه اصلی وب‌سایت عمومی.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image, Plus, Save, Trash2, Loader2, AlertCircle,
  CheckCircle2, X, GripVertical, Eye, EyeOff, ArrowUp, ArrowDown,
} from 'lucide-react';
import type { HeroSlide } from '@/src/shared-types';
import { fetchSlides, createSlide, updateSlide, deleteSlide, reorderSlides } from './api';
import ToastNotification from '@/src/shared-components/ToastNotification';

// ===== Constants =====

const NAV_TARGETS: { value: string; label: string }[] = [
  { value: 'home', label: 'خانه' },
  { value: 'services', label: 'خدمات' },
  { value: 'news', label: 'اخبار' },
  { value: 'interactive-map', label: 'نقشه تعاملی' },
  { value: 'land-allocation', label: 'واگذاری اراضی' },
  { value: 'urban-planning', label: 'شهرسازی' },
  { value: 'roads-transport', label: 'راه‌سازی' },
];

// ===== Sub-Components =====

function SlideForm({ slide, onSave, onCancel, saving }: {
  slide: Partial<HeroSlide>;
  onSave: (data: Partial<HeroSlide>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<HeroSlide>>({
    tag: '',
    title: '',
    subtitle: '',
    badge: '',
    badge_icon: 'fa-house-chimney',
    bg_image: '',
    primary_cta_text: '',
    primary_cta_target: 'services',
    secondary_cta_text: '',
    secondary_cta_target: 'news',
    is_active: true,
    ...slide,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.tag?.trim()) errs.tag = 'برچسب الزامی است';
    if (!form.title?.trim()) errs.title = 'عنوان الزامی است';
    if (!form.subtitle?.trim()) errs.subtitle = 'توضیحات الزامی است';
    if (!form.badge?.trim()) errs.badge = 'متن نشان الزامی است';
    if (!form.badge_icon?.trim()) errs.badge_icon = 'آیکون نشان الزامی است';
    if (!form.primary_cta_text?.trim()) errs.primary_cta_text = 'متن دکمه اصلی الزامی است';
    if (!form.secondary_cta_text?.trim()) errs.secondary_cta_text = 'متن دکمه فرعی الزامی است';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const set = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const inputClass = (field: string) =>
    `w-full px-3 py-2 rounded-xl border text-sm font-medium transition-all bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${
      errors[field]
        ? 'border-rose-400 dark:border-rose-600 focus:ring-rose-500'
        : 'border-gray-200 dark:border-gray-700 focus:ring-teal-500'
    } focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tag */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">برچسب دسته‌بندی</label>
          <input className={inputClass('tag')} value={form.tag || ''} onChange={e => set('tag', e.target.value)} placeholder="مثال: پروژه پیشران مسکن" />
          {errors.tag && <p className="text-xs text-rose-500 mt-1">{errors.tag}</p>}
        </div>

        {/* Badge */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">متن نشان / آمار</label>
          <input className={inputClass('badge')} value={form.badge || ''} onChange={e => set('badge', e.target.value)} placeholder="مثال: ۱۴۰ پروژه مسکونی فعال" />
          {errors.badge && <p className="text-xs text-rose-500 mt-1">{errors.badge}</p>}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">عنوان اصلی اسلاید</label>
        <input className={inputClass('title')} value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="عنوان بزرگ اسلاید" />
        {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">توضیحات اسلاید</label>
        <textarea className={`${inputClass('subtitle')} min-h-[80px]`} value={form.subtitle || ''} onChange={e => set('subtitle', e.target.value)} placeholder="توضیحات کامل اسلاید..." />
        {errors.subtitle && <p className="text-xs text-rose-500 mt-1">{errors.subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Badge Icon */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">آیکون نشان (FontAwesome)</label>
          <input className={inputClass('badge_icon')} value={form.badge_icon || ''} onChange={e => set('badge_icon', e.target.value)} placeholder="مثال: fa-house-chimney" />
          <p className="text-xs text-gray-400 mt-1">کلاس FontAwesome بدون پیشوند fa-solid</p>
          {errors.badge_icon && <p className="text-xs text-rose-500 mt-1">{errors.badge_icon}</p>}
        </div>

        {/* Background Image */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">تصویر پس‌زمینه (URL)</label>
          <input className={inputClass('bg_image')} value={form.bg_image || ''} onChange={e => set('bg_image', e.target.value)} placeholder="آدرس تصویر یا خالی بماند" />
          <p className="text-xs text-gray-400 mt-1">از بخش مدیریت رسانه آپلود کنید و آدرس را قرار دهید</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary CTA Text */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">متن دکمه اصلی</label>
          <input className={inputClass('primary_cta_text')} value={form.primary_cta_text || ''} onChange={e => set('primary_cta_text', e.target.value)} placeholder="مثال: ورود به سامانه نهضت مسکن" />
          {errors.primary_cta_text && <p className="text-xs text-rose-500 mt-1">{errors.primary_cta_text}</p>}
        </div>

        {/* Primary CTA Target */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">هدف دکمه اصلی</label>
          <select className={inputClass('primary_cta_target')} value={form.primary_cta_target || 'services'} onChange={e => set('primary_cta_target', e.target.value)}>
            {NAV_TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Secondary CTA Text */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">متن دکمه فرعی</label>
          <input className={inputClass('secondary_cta_text')} value={form.secondary_cta_text || ''} onChange={e => set('secondary_cta_text', e.target.value)} placeholder="مثال: استعلام وضعیت فرم ج" />
          {errors.secondary_cta_text && <p className="text-xs text-rose-500 mt-1">{errors.secondary_cta_text}</p>}
        </div>

        {/* Secondary CTA Target */}
        <div>
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">هدف دکمه فرعی</label>
          <select className={inputClass('secondary_cta_target')} value={form.secondary_cta_target || 'news'} onChange={e => set('secondary_cta_target', e.target.value)}>
            {NAV_TARGETS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={!!form.is_active} onChange={e => set('is_active', e.target.checked)} />
          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
        </label>
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">اسلاید فعال</span>
      </div>

      {/* Preview */}
      {form.bg_image && (
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <img src={form.bg_image} alt="preview" className="w-full h-32 object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {slide.id ? 'به‌روزرسانی' : 'ایجاد اسلاید'}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-bold transition-all">
          انصراف
        </button>
      </div>
    </form>
  );
}

// ===== Main Component =====

export default function HeroSlidesManagement() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSlides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSlides({ per_page: 50 });
      setSlides(res.data);
    } catch (err: any) {
      showToast(err.message || 'خطا در دریافت اسلایدها', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSlides(); }, [loadSlides]);

  const handleSave = async (data: Partial<HeroSlide>) => {
    setSaving(true);
    try {
      if (editingSlide?.id) {
        await updateSlide(editingSlide.id, data);
        showToast('اسلاید با موفقیت به‌روزرسانی شد.');
      } else {
        await createSlide(data);
        showToast('اسلاید با موفقیت ایجاد شد.');
      }
      setEditingSlide(null);
      loadSlides();
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره اسلاید', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      await deleteSlide(id);
      showToast('اسلاید با موفقیت حذف شد.');
      loadSlides();
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف اسلاید', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      await updateSlide(slide.id, { is_active: !slide.is_active });
      showToast(slide.is_active ? 'اسلاید غیرفعال شد.' : 'اسلاید فعال شد.');
      loadSlides();
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت', 'error');
    }
  };

  const moveSlide = async (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    const reorderData = newSlides.map((s, i) => ({ id: s.id, sort_order: i + 1 }));

    try {
      await reorderSlides(reorderData);
      setSlides(newSlides);
      showToast('ترتیب اسلایدها به‌روزرسانی شد.');
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر ترتیب', 'error');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <ToastNotification toast={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
            <Image className="w-7 h-7 text-teal-500" />
            <span>مدیریت اسلایدر صفحه اصلی</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            اسلایدهای hero/slider وب‌سایت عمومی را مدیریت کنید
          </p>
        </div>
        <button
          onClick={() => setEditingSlide({})}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
          اسلاید جدید
        </button>
      </div>

      {/* Edit/Create Form Modal */}
      <AnimatePresence>
        {editingSlide !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 px-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setEditingSlide(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-black text-gray-800 dark:text-white">
                  {editingSlide.id ? 'ویرایش اسلاید' : 'اسلاید جدید'}
                </h2>
                <button onClick={() => setEditingSlide(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SlideForm slide={editingSlide} onSave={handleSave} onCancel={() => setEditingSlide(null)} saving={saving} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && slides.length === 0 && (
        <div className="text-center py-20">
          <Image className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">هیچ اسلایدی یافت نشد</p>
          <button onClick={() => setEditingSlide({})} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold">
            <Plus className="w-4 h-4" />
            اولین اسلاید را ایجاد کنید
          </button>
        </div>
      )}

      {/* Slides List */}
      {!loading && slides.length > 0 && (
        <div className="space-y-3">
          {slides.map((slide, index) => (
            <motion.div
              key={slide.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 p-4">
                {/* Drag Handle / Order */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  <span className="text-xs font-mono font-bold text-gray-400 dark:text-gray-500">{slide.sort_order}</span>
                </div>

                {/* Image */}
                <div className="w-24 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {slide.bg_image ? (
                    <img src={slide.bg_image} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400">
                      {slide.tag}
                    </span>
                    {!slide.is_active && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                        غیرفعال
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{slide.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{slide.subtitle}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
                    <span>دکمه اصلی: {slide.primary_cta_text}</span>
                    <span>|</span>
                    <span>هدف: {slide.primary_cta_target}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveSlide(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="حرکت به بالا"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSlide(index, 'down')}
                    disabled={index === slides.length - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="حرکت به پایین"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(slide)}
                    className={`p-1.5 rounded-lg transition-all ${
                      slide.is_active
                        ? 'text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                    title={slide.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                  >
                    {slide.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setEditingSlide(slide)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 hover:text-blue-600 transition-all"
                    title="ویرایش"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(slide.id)}
                    disabled={deleting === slide.id}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 hover:text-rose-600 transition-all disabled:opacity-50"
                    title="حذف"
                  >
                    {deleting === slide.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
