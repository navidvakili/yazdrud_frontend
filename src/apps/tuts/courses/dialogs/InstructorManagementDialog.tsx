// ============================================================
// InstructorManagementDialog — مدیریت اساتید (Modal)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, User, Edit2, Trash2, Upload } from 'lucide-react';
import { coursesApi } from '../api';
import type { Instructor } from '../../shared/types';

interface InstructorManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  instructors: Instructor[];
  setInstructors: React.Dispatch<React.SetStateAction<Instructor[]>>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function InstructorManagementDialog({
  isOpen,
  onClose,
  instructors,
  setInstructors,
  showToast,
}: InstructorManagementDialogProps) {
  // Internal form state
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState<string | null>(null);
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormMode('create');
    setEditingId(null);
    setFormName('');
    setFormSpecialty('');
    setFormBio('');
    setFormPhoto(null);
    setFormPhotoPreview(null);
    setFormActive(true);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleStartAdd = () => {
    setFormMode('edit');
    setEditingId(null);
    setFormName('');
    setFormSpecialty('');
    setFormBio('');
    setFormPhoto(null);
    setFormPhotoPreview(null);
    setFormActive(true);
  };

  const handleEdit = async (id: number) => {
    try {
      const instructor = await coursesApi.getInstructor(id);
      setEditingId(id);
      setFormName(instructor.name);
      setFormSpecialty(instructor.specialty || '');
      setFormBio(instructor.bio || '');
      setFormPhoto(null);
      setFormPhotoPreview(instructor.photo_url || null);
      setFormActive(instructor.active);
      setFormMode('edit');
    } catch {
      showToast('خطا در دریافت اطلاعات استاد', 'error');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`آیا از حذف استاد "${name}" اطمینان دارید؟`)) return;
    try {
      await coursesApi.deleteInstructor(id);
      setInstructors((prev) => prev.filter((i) => i.id !== id));
      showToast(`استاد "${name}" حذف شد.`);
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف استاد', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      showToast('نام استاد الزامی است.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('specialty', formSpecialty);
      formData.append('bio', formBio);
      formData.append('active', formActive ? '1' : '0');
      if (formPhoto) {
        formData.append('photo', formPhoto);
      }

      if (editingId) {
        formData.append('_method', 'PUT');
        const updated = await coursesApi.updateInstructor(editingId, formData);
        setInstructors((prev) =>
          prev.map((i) =>
            i.id === editingId
              ? { id: i.id, name: updated.name, specialty: updated.specialty || null }
              : i,
          ),
        );
        showToast(`استاد "${updated.name}" بروزرسانی شد.`);
      } else {
        const created = await coursesApi.createInstructor(formData);
        setInstructors((prev) => [
          ...prev,
          { id: created.id, name: created.name, specialty: created.specialty || null },
        ]);
        showToast(`استاد "${created.name}" ثبت شد.`);
      }

      resetForm();
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره اطلاعات استاد', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-2xl p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4 flex items-center gap-1.5">
              <User className="w-5 h-5 text-teal-600" />
              مدیریت اساتید
            </h3>

            {/* Instructors List */}
            {formMode === 'create' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleStartAdd}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ثبت استاد جدید
                  </button>
                </div>

                {instructors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    هیچ استادی ثبت نشده است. برای ثبت اولین استاد کلیک کنید.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {instructors.map((inst) => (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-sm">
                            {inst.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                              {inst.name}
                            </div>
                            {inst.specialty && (
                              <div className="text-[10px] text-gray-400">{inst.specialty}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(inst.id)}
                            className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(inst.id, inst.name)}
                            className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-all cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Instructor Add/Edit Form */}
            {formMode === 'edit' && (
              <form onSubmit={handleSubmit} className="space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    نام کامل استاد *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: دکتر علیرضا صدقی"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    تخصص
                  </label>
                  <input
                    type="text"
                    value={formSpecialty}
                    onChange={(e) => setFormSpecialty(e.target.value)}
                    placeholder="مثال: هوش مصنوعی و یادگیری ماشین"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    بیوگرافی / توضیحات
                  </label>
                  <textarea
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="درباره استاد..."
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    عکس استاد
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-950 hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormPhoto(file);
                            setFormPhotoPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                      <div className="text-center">
                        <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                        <span className="text-xs text-gray-400">برای آپلود کلیک کنید</span>
                      </div>
                    </label>
                    {formPhotoPreview && (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                        <img
                          src={formPhotoPreview}
                          alt="پیش نمایش"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormPhoto(null);
                            setFormPhotoPreview(null);
                          }}
                          className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    وضعیت:
                  </label>
                  <button
                    type="button"
                    dir="ltr"
                    onClick={() => setFormActive(!formActive)}
                    className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${formActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${formActive ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                  <span
                    className={`text-xs font-bold ${formActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}
                  >
                    {formActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </div>

                <div className="pt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? 'در حال ذخیره...'
                      : editingId
                        ? 'بروزرسانی استاد'
                        : 'ثبت استاد'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
