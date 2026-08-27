import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Settings2, Save, Loader2, Globe } from 'lucide-react';
import type { SmartPageDto } from './api';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface PageSettingsModalProps {
  page: SmartPageDto | null;
  /** زبان محتوای این صفحه — برای صفحهٔ جدید، زبان فعلی انتخاب‌شده در پنل است.
   *  هر زبان یک صفحهٔ مستقل است؛ زبان یک صفحهٔ موجود از اینجا قابل تغییر نیست
   *  (برای ساخت نسخهٔ همان صفحه در زبان دیگر از «کپی به زبان دیگر» در فهرست صفحات استفاده کنید). */
  language?: string;
  /** همهٔ صفحات برای انتخاب والد — خودِ صفحه از فهرست حذف می‌شود */
  pages?: SmartPageDto[];
  isSaving?: boolean;
  onSave: (data: {
    title: string;
    slug: string;
    parent_id?: number | null;
    status: 'published' | 'draft';
    seo: { title?: string; description?: string; keywords?: string; og_image?: string };
  }) => void;
  onClose: () => void;
}

export const PageSettingsModal: React.FC<PageSettingsModalProps> = ({
  page,
  language,
  pages,
  isSaving,
  onSave,
  onClose
}) => {
  const { getLanguage } = useLanguage();
  const languageInfo = language ? getLanguage(language) : undefined;
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState<number | ''>('');
  const [status, setStatus] = useState<'published' | 'draft'>('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoOgImage, setSeoOgImage] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);

  // فهرست والدهای مجاز: خودِ صفحه + همهٔ نوادگان آن حذف می‌شوند تا چرخه پیش نیاید
  const parentOptions = React.useMemo(() => {
    if (!pages) return [];
    const currentId = page?.id;
    const excluded = new Set<number>();
    if (currentId) {
      excluded.add(currentId);
      // جمع‌آوری همهٔ نوادگان غیرمستقیم
      let changed = true;
      while (changed) {
        changed = false;
        for (const p of pages) {
          if (p.parent_id && excluded.has(p.parent_id) && !excluded.has(p.id!)) {
            excluded.add(p.id!);
            changed = true;
          }
        }
      }
    }
    const byId = new Map(pages.filter((p) => p.id != null).map((p) => [p.id!, p]));
    return pages
      .filter((p) => p.id != null && !excluded.has(p.id))
      .map((p) => ({ ...p, depth: 0 }))
      .sort((a, b) => {
        // والدها قبل از فرزندان، و هر گروه بر اساس عنوان
        const aParent = byId.get(a.parent_id ?? -1);
        const bParent = byId.get(b.parent_id ?? -1);
        const aRoot = aParent ? aParent.parent_id ?? aParent.id : a.id;
        const bRoot = bParent ? bParent.parent_id ?? bParent.id : b.id;
        if (aRoot !== bRoot) return (aRoot ?? 0) - (bRoot ?? 0);
        if (!!a.parent_id !== !!b.parent_id) return a.parent_id ? 1 : -1;
        return a.title.localeCompare(b.title, 'fa');
      });
  }, [pages, page]);

  // Sync local state whenever the target page changes
  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setSlug(page.slug || '');
      setParentId(page.parent_id ?? '');
      setStatus(page.status || 'draft');
      setSeoTitle(page.seo?.title ?? '');
      setSeoDescription(page.seo?.description ?? '');
      setSeoKeywords(page.seo?.keywords ?? '');
      setSeoOgImage(page.seo?.og_image ?? '');
    }
  }, [page]);

  const handleSlugChange = (value: string) => {
    const normalized = value
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    setSlug(normalized);
    setSlugError(normalized ? null : 'Slug نباید خالی باشد و فقط حروف انگلیسی، عدد و خط تیره مجاز است.');
  };

  const handleSave = () => {
    if (!title.trim()) {
      setSlugError('عنوان صفحه الزامی است.');
      return;
    }
    if (!slug.trim()) {
      setSlugError('Slug صفحه الزامی است.');
      return;
    }
    onSave({
      title: title.trim(),
      slug: slug,
      parent_id: parentId === '' ? null : Number(parentId),
      status,
      seo: {
        title: seoTitle.trim(),
        description: seoDescription.trim(),
        keywords: seoKeywords.trim(),
        og_image: seoOgImage.trim(),
      },
    });
  };

  const inputCls =
    'w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 focus:border-teal-500 focus:outline-none text-sm text-slate-900 dark:text-white transition-colors';
  const labelCls = 'block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md rtl text-right transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-slate-900 dark:text-white flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                مشخصات صفحه و سئو
                {language && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[10px] font-black font-sans uppercase"
                    title="این صفحه یک نسخهٔ مستقل برای این زبان است — برای زبان دیگر از «کپی به زبان دیگر» در فهرست صفحات استفاده کنید"
                  >
                    <Globe className="w-3 h-3" />
                    {language}{languageInfo ? ` • ${languageInfo.name}` : ''}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                عنوان، لینک (Slug)، وضعیت انتشار و متادیتای سئو
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>عنوان صفحه *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: صفحه اصلی پرتال"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>لینک (Slug) *</label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-400 shrink-0">/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="home-portal"
                  className={inputCls}
                  dir="ltr"
                />
              </div>
              {slugError && <p className="text-[11px] text-rose-500 mt-1">{slugError}</p>}
            </div>
          </div>

          {/* Parent page — صفحهٔ والد (زیرصفحه بودن اختیاری است) */}
          <div>
            <label className={labelCls}>صفحهٔ والد (اختیاری)</label>
            <select
              value={parentId}
              onChange={(e) =>
                setParentId(e.target.value === '' ? '' : Number(e.target.value))
              }
              className={inputCls}
            >
              <option value="">بدون والد — صفحهٔ مستقل</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.parent_slug || p.parent_id ? ' (زیرصفحه)' : ''} — /page/{p.slug}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              با انتخاب والد، این صفحه به‌صورت زیرصفحه در آدرس{' '}
              <span dir="ltr" className="font-mono">/page/والد/این‌صفحه</span> نمایش داده می‌شود.
            </p>
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>وضعیت انتشار</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatus('draft')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  status === 'draft'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border-gray-200 dark:border-slate-800'
                }`}
              >
                پیش‌نویس
              </button>
              <button
                onClick={() => setStatus('published')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  status === 'published'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-500 border-gray-200 dark:border-slate-800'
                }`}
              >
                منتشر شده
              </button>
            </div>
          </div>

          {/* SEO */}
          <div className="border border-gray-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50 dark:bg-slate-950/40">
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-3">متادیتای سئو (SEO)</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className={labelCls}>عنوان سئو (Meta Title)</label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="عنوان نمایشی در نتایج موتور جستجو"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>توضیحات سئو (Meta Description)</label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="توضیح کوتاه برای موتورهای جستجو"
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              <div>
                <label className={labelCls}>کلمات کلیدی (Meta Keywords)</label>
                <input
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="با کاما جدا کنید: دانشگاه، پرتال، اخبار"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>تصویر اشتراک‌گذاری (OG Image URL)</label>
                <input
                  type="text"
                  value={seoOgImage}
                  onChange={(e) => setSeoOgImage(e.target.value)}
                  placeholder="https://..."
                  className={inputCls}
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold cursor-pointer transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 text-sm font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>ذخیره مشخصات</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
