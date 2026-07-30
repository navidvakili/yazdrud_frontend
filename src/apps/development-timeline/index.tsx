// ============================================================
// DevelopmentTimelineManagement — مدیریت روند توسعه و تحول عمرانی
//
// CRUD کامل برای آیتم‌های تایم‌لاین توسعه عمران شهری و جاده‌ای
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Edit3, Trash2,
  CheckCircle2, AlertCircle, Loader2, X, Save, Eye, EyeOff,
  GripVertical, ChevronDown,
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

// ── Icon picker popover state ──────────────────────────────
const ICON_PICKER_ID = 'dev-timeline-icon-picker';

// ── Predefined FontAwesome Icons ──────────────────────────
const PREDEFINED_ICONS = [
  { fa: 'fa-solid fa-road',        label: 'جاده',          color: '#B76E4C' },
  { fa: 'fa-solid fa-city',        label: 'شهر',           color: '#1F3A5F' },
  { fa: 'fa-solid fa-building',    label: 'ساختمان',       color: '#2A9D8F' },
  { fa: 'fa-solid fa-home',        label: 'مسکن',          color: '#C98A5A' },
  { fa: 'fa-solid fa-train',       label: 'قطار',          color: '#4A6FA5' },
  { fa: 'fa-solid fa-bus',         label: 'اتوبوس',        color: '#E76F51' },
  { fa: 'fa-solid fa-car',         label: 'خودرو',         color: '#6C757D' },
  { fa: 'fa-solid fa-tree',        label: 'فضای سبز',      color: '#2D936C' },
  { fa: 'fa-solid fa-water',       label: 'آب',            color: '#00B4D8' },
  { fa: 'fa-solid fa-bolt',        label: 'برق',           color: '#FFD166' },
  { fa: 'fa-solid fa-cogs',        label: 'تجهیزات',       color: '#6C5CE7' },
  { fa: 'fa-solid fa-hard-hat',    label: 'ساخت‌وساز',     color: '#F4A261' },
  { fa: 'fa-solid fa-map-marked-alt', label: 'نقشه',       color: '#264653' },
  { fa: 'fa-solid fa-industry',    label: 'صنعت',          color: '#A8DADC' },
  { fa: 'fa-solid fa-hospital',    label: 'بیمارستان',     color: '#E63946' },
  { fa: 'fa-solid fa-school',      label: 'مدرسه',         color: '#7B2D8E' },
  { fa: 'fa-solid fa-university',  label: 'دانشگاه',       color: '#3D5A80' },
  { fa: 'fa-solid fa-bridge',      label: 'پل',            color: '#8D6E63' },
  { fa: 'fa-solid fa-rocket',      label: 'پیشرفت',        color: '#E07A5F' },
  { fa: 'fa-solid fa-flag',        label: 'افتتاح',        color: '#D62828' },
];

const emptyForm = {
  title: '',
  icon: '',
  value: '',
  value_index: '',
  is_active: true,
};

// ── IconPicker Popover Component ───────────────────────────
function IconPicker({
  selected,
  onSelect,
  onClear,
  faToColor,
  faToLabel,
}: {
  selected: string;
  onSelect: (fa: string) => void;
  onClear: () => void;
  faToColor: (fa: string) => string;
  faToLabel: (fa: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Calculate fixed position when opening
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const w = Math.max(rect.width, 360);
      // Ensure popover stays within viewport
      const left = Math.min(rect.left, window.innerWidth - w - 8);
      setCoords({ top: rect.bottom + 4, left: Math.max(left, 8), width: w });
    }
  }, [open]);

  const selectedMeta = PREDEFINED_ICONS.find((i) => i.fa === selected);

  return (
    <div ref={triggerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm hover:border-gray-300 dark:hover:border-gray-500 transition-colors text-right"
      >
        {selected && selectedMeta ? (
          <>
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs shadow-sm"
              style={{ backgroundColor: selectedMeta.color }}
            >
              <i className={selected}></i>
            </span>
            <span className="text-gray-700 dark:text-gray-300">{selectedMeta.label}</span>
          </>
        ) : (
          <span className="text-gray-400">انتخاب آیکون...</span>
        )}
        <ChevronDown className={`w-4 h-4 mr-auto text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover panel — fixed position to break out of modal */}
      {open && (
        <div
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 9999,
          }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 max-h-80 overflow-y-auto"
        >
          <div className="grid grid-cols-4 gap-2">
            {PREDEFINED_ICONS.map((icon) => (
              <button
                key={icon.fa}
                type="button"
                onClick={() => {
                  onSelect(icon.fa);
                  setOpen(false);
                }}
                className={`
                  relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-all
                  ${selected === icon.fa
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md'
                    : 'border-transparent bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
                title={icon.label}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm"
                  style={{ backgroundColor: icon.color }}
                >
                  <i className={icon.fa}></i>
                </span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center">{icon.label}</span>
                {selected === icon.fa && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </button>
            ))}
          </div>
          {selected && (
            <button
              type="button"
              onClick={() => { onClear(); setOpen(false); }}
              className="mt-2 w-full text-xs text-red-500 hover:text-red-700 py-1.5 border-t border-gray-200 dark:border-gray-700"
            >
              پاک کردن آیکون
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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
    item.value?.includes(searchQuery) ||
    item.value_index?.includes(searchQuery)
  );

  // ===== Open Create Modal =====
  const openCreateModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setFormError('');
    setShowModal(true);
  };

  // ===== Open Edit Modal =====
  const openEditModal = (item: DevelopmentTimelineItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      icon: item.icon || '',
      value: item.value || '',
      value_index: item.value_index || '',
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

  // ===== Drag-and-Drop Handlers =====
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
    dragOverIndex.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  };

  const handleDrop = () => {
    if (dragIndex === null || dragOverIndex.current === null) return;
    if (dragIndex === dragOverIndex.current) {
      setDragIndex(null);
      dragOverIndex.current = null;
      return;
    }

    const newItems = [...items];
    const [movedItem] = newItems.splice(dragIndex, 1);
    newItems.splice(dragOverIndex.current, 0, movedItem);

    // Calculate new sort_order
    const updated = newItems.map((item, i) => ({ ...item, sort_order: i + 1 }));
    setItems(updated);

    // Persist the order change
    updated.forEach((item) => {
      updateTimelineItem(item.id, { sort_order: item.sort_order }).catch(() => {});
    });

    setDragIndex(null);
    dragOverIndex.current = null;
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    dragOverIndex.current = null;
  };

  // ===== Helpers for icon display =====
  /** Ensure FontAwesome 6 has the style prefix (for backward compat with old DB data) */
  const normalizeIconClass = (iconClass: string): string => {
    if (!iconClass) return '';
    if (iconClass.includes(' ') || iconClass.startsWith('fa-brands')) return iconClass;
    return `fa-solid ${iconClass}`;
  };

  const faToColor = (faClass: string): string => {
    const normalized = normalizeIconClass(faClass);
    const found = PREDEFINED_ICONS.find((i) => i.fa === normalized);
    return found?.color || '#6B7280';
  };

  const faToLabel = (faClass: string): string => {
    const normalized = normalizeIconClass(faClass);
    const found = PREDEFINED_ICONS.find((i) => i.fa === normalized);
    return found?.label || '';
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
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-12">
                    <GripVertical className="w-3.5 h-3.5 mx-auto" />
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">عنوان</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">مقدار</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">اندیس مقدار</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">وضعیت</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-36">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                        {searchQuery ? 'نتیجه‌ای یافت نشد.' : 'هیچ آیتمی ثبت نشده است. برای شروع یک آیتم جدید ایجاد کنید.'}
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, index) => {
                      const isDragging = dragIndex === index;
                      const iconMeta = PREDEFINED_ICONS.find((i) => i.fa === normalizeIconClass(item.icon || ''));
                      return (
                        <tr
                          key={item.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnter={(e) => handleDragEnter(e, index)}
                          onDrop={handleDrop}
                          onDragEnd={handleDragEnd}
                          className={`
                            transition-all duration-200 cursor-grab active:cursor-grabbing
                            ${isDragging ? 'opacity-50 scale-[1.02] shadow-lg bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}
                            ${iconMeta ? '' : ''}
                          `}
                        >
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                              <GripVertical className="w-4 h-4" />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {item.icon && (
                                <span
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                  style={{ backgroundColor: faToColor(item.icon) }}
                                  title={faToLabel(item.icon)}
                                >
                                  <i className={normalizeIconClass(item.icon)}></i>
                                </span>
                              )}
                              <div>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.title}</span>
                              </div>
                            </div>
                          </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.value || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.value_index || '—'}</span>
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
                      </tr>
                    );
                  })
                  )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-400 flex items-center gap-2">
            <GripVertical className="w-3 h-3" />
            <span>برای تغییر ترتیب، ردیف‌ها را بکشید و رها کنید</span>
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

                {/* Icon — Popover Picker */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">آیکون</label>
                  <IconPicker
                    selected={form.icon}
                    onSelect={(fa) => setForm({ ...form, icon: form.icon === fa ? '' : fa })}
                    onClear={() => setForm({ ...form, icon: '' })}
                    faToColor={faToColor}
                    faToLabel={faToLabel}
                  />
                </div>

                {/* Value & Value Index */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">مقدار</label>
                    <input
                      type="text"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      placeholder="مثال: ۱۵ کیلومتر"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اندیس مقدار</label>
                    <input
                      type="text"
                      value={form.value_index}
                      onChange={(e) => setForm({ ...form, value_index: e.target.value })}
                      placeholder="مثال: km-roads"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Active Toggle */}
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
