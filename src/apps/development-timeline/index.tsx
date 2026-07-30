// ============================================================
// DevelopmentTimelineManagement — مدیریت روند توسعه و تحول عمرانی
//
// CRUD کامل برای آیتم‌های تایم‌لاین توسعه عمران شهری و جاده‌ای
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Edit3, Trash2, Route, Building2, Globe,
  CheckCircle2, AlertCircle, Loader2, X, Save, Eye, EyeOff,
  GripVertical, Clock,
} from 'lucide-react';
import ToastNotification from '@/src/shared-components/ToastNotification';
import {
  fetchTimelineItems,
  createTimelineItem,
  updateTimelineItem,
  deleteTimelineItem,
  type DevelopmentTimelineItem,
} from './api';

interface DevelopmentTimelineManagementProps {
  user?: any;
  activeTabId?: string;
  moduleId?: string;
}

const typeLabels: Record<string, string> = {
  road: 'راه‌سازی',
  urban: 'عمران شهری',
  both: 'هر دو',
};

const typeIcons: Record<string, any> = {
  road: Route,
  urban: Building2,
  both: Globe,
};

const emptyForm = {
  title: '',
  description: '',
  year: '',
  icon: '',
  image_url: '',
  type: 'both' as 'road' | 'urban' | 'both',
  sort_order: 0,
  is_active: true,
};

export default function DevelopmentTimelineManagement(_props: DevelopmentTimelineManagementProps) {
  // ===== Data State =====
  const [items, setItems] = useState<DevelopmentTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ===== Search =====
  const [searchQuery, setSearchQuery] = useState('');

  // ===== Modal State =====
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState('');

  // ===== Delete Confirmation =====
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ===== Toast =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Fetch Data =====
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchTimelineItems();
      if (result.success) {
        setItems(result.data);
      }
    } catch (err: any) {
      console.error('Error loading timeline items:', err);
      showToast('خطا در دریافت اطلاعات', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // ===== Filtered List =====
  const filteredItems = items.filter((item) =>
    !searchQuery ||
    item.title.includes(searchQuery) ||
    item.year.includes(searchQuery) ||
    item.description?.includes(searchQuery)
  );

  // ===== Open Create Modal =====
  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm, sort_order: items.length + 1 });
    setFormError('');
    setShowModal(true);
  };

  // ===== Open Edit Modal =====
  const openEditModal = (item: DevelopmentTimelineItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || '',
      year: item.year,
      icon: item.icon || '',
      image_url: item.image_url || '',
      type: item.type,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setFormError('');
    setShowModal(true);
  };

  // ===== Form Validation =====
  const validateForm = () => {
    if (!form.title.trim()) {
      setFormError('عنوان الزامی است.');
      return false;
    }
    if (!form.year.trim()) {
      setFormError('سال یا بازه زمانی الزامی است.');
      return false;
    }
    setFormError('');
    return true;
  };

  // ===== Handle Save =====
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingId) {
        const result = await updateTimelineItem(editingId, form);
        if (result.success) {
          setItems((prev) =>
            prev.map((item) => (item.id === editingId ? { ...item, ...result.data } : item))
          );
          showToast('آیتم تایم‌لاین با موفقیت به‌روزرسانی شد.');
        }
      } else {
        const result = await createTimelineItem(form);
        if (result.success) {
          setItems((prev) => [...prev, result.data]);
          showToast('آیتم تایم‌لاین با موفقیت ایجاد شد.');
        }
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'خطا در ذخیره اطلاعات', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===== Handle Toggle Active =====
  const handleToggleActive = async (item: DevelopmentTimelineItem) => {
    try {
      const result = await updateTimelineItem(item.id, { is_active: !item.is_active });
      if (result.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
        );
        showToast(`آیتم ${item.is_active ? 'غیرفعال' : 'فعال'} شد.`);
      }
    } catch (err: any) {
      showToast('خطا در تغییر وضعیت', 'error');
    }
  };

  // ===== Handle Delete =====
  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      const result = await deleteTimelineItem(id);
      if (result.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        showToast('آیتم تایم‌لاین با موفقیت حذف شد.');
      }
    } catch (err: any) {
      showToast('خطا در حذف آیتم', 'error');
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  // ===== Reorder items =====
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // Update sort_order
    const updated = newItems.map((item, i) => ({ ...item, sort_order: i + 1 }));
    setItems(updated);

    // Persist the order change
    updated.forEach((item) => {
      updateTimelineItem(item.id, { sort_order: item.sort_order }).catch(() => {});
    });
  };

  // ===== Get Type Icon =====
  const TypeIcon = (type: string) => {
    const Icon = typeIcons[type] || Globe;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Toast */}
      <ToastNotification toast={toast} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">روند توسعه و تحول عمرانی</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            مدیریت آیتم‌های تایم‌لاین توسعه عمران شهری و جاده‌ای یزد
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>آیتم جدید</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در عناوین، سال‌ها و توضیحات..."
          className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        /* Table */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12">ترتیب</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">عنوان</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">سال</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">نوع</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">وضعیت</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-36">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <AnimatePresence mode="popLayout">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        {searchQuery ? 'نتیجه‌ای یافت نشد.' : 'هیچ آیتمی ثبت نشده است. برای شروع یک آیتم جدید ایجاد کنید.'}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => (
                      <motion.tr
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveItem(index, 'up')}
                              disabled={index === 0}
                              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                              title="انتقال به بالا"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <span className="text-xs text-gray-400 w-4 text-center">{item.sort_order}</span>
                            <button
                              onClick={() => moveItem(index, 'down')}
                              disabled={index === filteredItems.length - 1}
                              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                              title="انتقال به پایین"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.title}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{item.year}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {TypeIcon(item.type)}
                            {typeLabels[item.type]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              item.is_active
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            {item.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            {item.is_active ? 'فعال' : 'غیرفعال'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="ویرایش"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">حذف آیتم</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  آیا از حذف این آیتم تایم‌لاین اطمینان دارید؟ این عمل قابل بازگشت نیست.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmId)}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'حذف'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingId ? 'ویرایش آیتم تایم‌لاین' : 'آیتم تایم‌لاین جدید'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">عنوان *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="مثال: اجرای طرح توسعه بلوار امام"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">سال یا بازه زمانی *</label>
                  <input
                    type="text"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    placeholder="مثال: ۱۴۰۰-۱۴۰۲ یا ۱۳۹۸"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">توضیحات</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="توضیحات مربوط به این مرحله از توسعه..."
                    rows={3}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نوع</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as 'road' | 'urban' | 'both' })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="both">هر دو</option>
                    <option value="road">راه‌سازی</option>
                    <option value="urban">عمران شهری</option>
                  </select>
                </div>

                {/* Icon & Image URL Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آیکون (کلاس FontAwesome)</label>
                    <input
                      type="text"
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      placeholder="مثال: fa fa-road"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">آدرس تصویر</label>
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Sort Order & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ترتیب نمایش</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                      min={0}
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">وضعیت</label>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => setForm({ ...form, is_active: !form.is_active })}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          form.is_active ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            form.is_active ? 'translate-x-5' : ''
                          }`}
                        />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {form.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingId ? 'به‌روزرسانی' : 'ذخیره'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
