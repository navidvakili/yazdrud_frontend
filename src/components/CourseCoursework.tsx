// ============================================================
// CourseCoursework — دوره‌های آموزشی
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Search, Plus, X, User, Clock, Calendar,
  CheckCircle, AlertTriangle, DollarSign, Layers, Image,
  Edit3, Trash2, Power, Eye, Users, FileText,
  BarChart3, ListCollapse, Ban,
} from 'lucide-react';
import type { Course, CourseRegistration, CourseStats } from '@/src/types';
import api from '@/src/api';

type ViewMode = 'list' | 'add' | 'registrations' | 'stats';

export default function CourseCoursework() {
  // ========== State ==========
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Statistics
  const [stats, setStats] = useState<CourseStats | null>(null);

  // Registration management
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('');
  const [regFilterStatus, setRegFilterStatus] = useState('');

  // Edit modal
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // New course form
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('0');
  const [newActive, setNewActive] = useState('1');
  const [newDescription, setNewDescription] = useState('');
  const [newSyllabus, setNewSyllabus] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newInstructor, setNewInstructor] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newCapacity, setNewCapacity] = useState('0');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Edit form
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('0');
  const [editActive, setEditActive] = useState('1');
  const [editDescription, setEditDescription] = useState('');
  const [editSyllabus, setEditSyllabus] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editInstructor, setEditInstructor] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editCapacity, setEditCapacity] = useState('0');
  const [editImage, setEditImage] = useState<File | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  // Rejection
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRegId, setRejectRegId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ========== Helpers ==========
  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError = (msg: string) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 4000); };

  // ========== Data Fetching ==========
  const fetchCourses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const result = await api.getCourses({ search: searchQuery || undefined, page, per_page: 12 });
      setCourses(result.data);
      if (result.meta) {
        setCurrentPage(result.meta.current_page);
        setLastPage(result.meta.last_page);
        setTotalCourses(result.meta.total);
      }
    } catch (err: any) {
      showError(err.message || 'خطا در دریافت لیست دوره‌ها');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getCourseStatistics();
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  const fetchRegistrations = useCallback(async (courseId: number) => {
    try {
      const data = await api.getCourseRegistrations(courseId);
      setRegistrations(data);
    } catch (err: any) {
      showError(err.message || 'خطا در دریافت لیست ثبت‌نام‌ها');
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'list') fetchCourses();
    if (viewMode === 'stats') fetchStats();
  }, [viewMode, fetchCourses, fetchStats]);

  useEffect(() => {
    if (viewMode === 'list') fetchCourses(1);
  }, [searchQuery, fetchCourses]);

  // ========== CRUD Operations ==========
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) {
      showError('عنوان دوره را وارد کنید');
      return;
    }
    setFormSubmitting(true);
    try {
      await api.createCourse({
        title: newTitle,
        amount: newAmount,
        active: newActive,
        description: newDescription || undefined,
        syllabus: newSyllabus || undefined,
        duration: newDuration ? parseInt(newDuration) : undefined,
        instructor: newInstructor || undefined,
        start_date: newStartDate || undefined,
        end_date: newEndDate || undefined,
        capacity: newCapacity ? parseInt(newCapacity) : 0,
      });
      showSuccess(`دوره "${newTitle}" با موفقیت ایجاد شد`);
      // Reset form
      setNewTitle('');
      setNewAmount('0');
      setNewActive('1');
      setNewDescription('');
      setNewSyllabus('');
      setNewDuration('');
      setNewInstructor('');
      setNewStartDate('');
      setNewEndDate('');
      setNewCapacity('0');
      setNewImage(null);
      setViewMode('list');
      fetchCourses();
    } catch (err: any) {
      showError(err.message || 'خطا در ایجاد دوره');
    } finally {
      setFormSubmitting(false);
    }
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditAmount(course.amount);
    setEditActive(course.active ? '1' : '0');
    setEditDescription(course.description || '');
    setEditSyllabus(course.syllabus || '');
    setEditDuration(course.duration?.toString() || '');
    setEditInstructor(course.instructor || '');
    setEditStartDate(course.start_date || '');
    setEditEndDate(course.end_date || '');
    setEditCapacity(course.capacity.toString());
    setEditImage(null);
    setShowEditModal(true);
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editTitle) return;
    setFormSubmitting(true);
    try {
      await api.updateCourse(editingCourse.id, {
        title: editTitle,
        amount: editAmount,
        active: editActive,
        description: editDescription || undefined,
        syllabus: editSyllabus || undefined,
        duration: editDuration ? parseInt(editDuration) : undefined,
        instructor: editInstructor || undefined,
        start_date: editStartDate || undefined,
        end_date: editEndDate || undefined,
        capacity: editCapacity ? parseInt(editCapacity) : 0,
      });
      showSuccess(`دوره "${editTitle}" با موفقیت به‌روزرسانی شد`);
      setShowEditModal(false);
      setEditingCourse(null);
      fetchCourses();
    } catch (err: any) {
      showError(err.message || 'خطا در به‌روزرسانی دوره');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`آیا از حذف دوره "${course.title}" اطمینان دارید؟`)) return;
    try {
      await api.deleteCourse(course.id);
      showSuccess(`دوره "${course.title}" با موفقیت حذف شد`);
      fetchCourses();
    } catch (err: any) {
      showError(err.message || 'خطا در حذف دوره');
    }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      await api.toggleCourseActive(course.id);
      const newStatus = course.active ? 'غیرفعال' : 'فعال';
      showSuccess(`دوره "${course.title}" با موفقیت ${newStatus} شد`);
      fetchCourses();
    } catch (err: any) {
      showError(err.message || 'خطا در تغییر وضعیت دوره');
    }
  };

  // ========== Registration Management ==========
  const openRegistrations = (course: Course) => {
    setSelectedCourseId(course.id);
    setSelectedCourseTitle(course.title);
    setRegFilterStatus('');
    setViewMode('registrations');
    fetchRegistrations(course.id);
  };

  const handleApproveReceipt = async (regId: number) => {
    if (!confirm('آیا از تایید این فیش بانکی اطمینان دارید؟')) return;
    try {
      await api.approveReceipt(regId);
      showSuccess('فیش بانکی با موفقیت تایید شد');
      if (selectedCourseId) fetchRegistrations(selectedCourseId);
    } catch (err: any) {
      showError(err.message || 'خطا در تایید فیش');
    }
  };

  const openRejectModal = (regId: number) => {
    setRejectRegId(regId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectReceipt = async () => {
    if (rejectRegId === null) return;
    try {
      await api.rejectReceipt(rejectRegId, rejectReason || undefined);
      showSuccess('فیش بانکی رد شد');
      setShowRejectModal(false);
      setRejectRegId(null);
      if (selectedCourseId) fetchRegistrations(selectedCourseId);
    } catch (err: any) {
      showError(err.message || 'خطا در رد فیش');
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    if (!regFilterStatus) return true;
    return r.status === regFilterStatus;
  });

  // ========== Render Helpers ==========
  const formatPrice = (amount: string) => {
    const num = parseInt(amount.replace(/,/g, ''));
    if (isNaN(num)) return '0';
    return num.toLocaleString('fa-IR');
  };

  const statusBadge = (active: boolean) => (
    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
      active ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400'
    }`}>
      {active ? 'فعال' : 'غیرفعال'}
    </span>
  );

  const regStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      approved: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
      pending: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      rejected: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    };
    const labels: Record<string, string> = {
      paid: 'پرداخت شده',
      approved: 'تایید شده',
      pending: 'در انتظار',
      rejected: 'رد شده',
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // ========================================================================
  // RENDER: Course List (View)
  // ========================================================================
  const renderCourseList = () => (
    <div id="coursework-module" className="py-2.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            مدیریت دوره‌های آموزشی
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            تعریف، ویرایش و پایش وضعیت دوره‌های آموزشی دانشگاه
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('stats')}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 font-bold text-xs hover:bg-gray-50 transition duration-150 cursor-pointer flex items-center gap-1.5"
          >
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            آمار
          </button>
          <button
            onClick={() => setViewMode('add')}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            ایجاد دوره جدید
          </button>
        </div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-bold text-xs flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mb-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 text-rose-800 dark:text-rose-400 text-xs flex items-center gap-2 font-bold"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Stats Summary */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-gray-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="جستجوی دوره‌ها بر اساس عنوان یا استاد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pr-10 pl-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
          />
        </div>
        <div className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/15 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          تعداد کل: {totalCourses} دوره
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40 animate-pulse" />
          <p className="text-sm font-medium">در حال بارگذاری...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">هیچ دوره آموزشی یافت نشد</p>
          <p className="text-[11px] mt-1">با استفاده از دکمه "ایجاد دوره جدید" اولین دوره را تعریف کنید.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-3">
                    {statusBadge(course.active)}
                    <span className="font-mono text-xs font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md">
                      {course.duration_text || '—'}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {course.title}
                  </h3>

                  {/* Details */}
                  <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800/40 text-xs text-gray-500 dark:text-gray-400 space-y-2">
                    {course.instructor && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                        <span>مدرس: <span className="font-bold text-gray-700 dark:text-gray-300">{course.instructor}</span></span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>شهریه: <span className="font-bold text-gray-700 dark:text-gray-300">{formatPrice(course.amount)} ریال</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>ظرفیت: <span className="font-bold text-gray-700 dark:text-gray-300">{course.capacity === 0 ? 'نامحدود' : `${course.registered_count} / ${course.capacity} نفر`}</span></span>
                    </div>
                    {course.start_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>شروع: {course.start_date}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800/40">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openRegistrations(course)}
                      className="flex-1 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      ثبت‌نام‌ها
                    </button>
                    <button
                      onClick={() => openEditModal(course)}
                      className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-[11px] transition-colors cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(course)}
                      className={`py-2 px-3 rounded-xl transition-colors cursor-pointer font-extrabold text-[11px] ${
                        course.active ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600'
                      }`}
                      title={course.active ? 'غیرفعال کردن' : 'فعال کردن'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCourse(course)}
                      className="py-2 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-rose-500/20 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: lastPage }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchCourses(page)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    currentPage === page
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  // ========================================================================
  // RENDER: Add Course Form
  // ========================================================================
  const renderAddCourse = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">ایجاد دوره آموزشی جدید</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">اطلاعات دوره را وارد کنید</p>
            </div>
          </div>
          <button onClick={() => setViewMode('list')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAddCourse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان دوره <span className="text-rose-500">*</span></label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                placeholder="عنوان کامل دوره"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مبلغ شهریه (ریال)</label>
              <input type="text" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                placeholder="مثال: 5000000"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">وضعیت</label>
              <select value={newActive} onChange={(e) => setNewActive(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none">
                <option value="1">فعال</option>
                <option value="0">غیرفعال</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام استاد</label>
              <input type="text" value={newInstructor} onChange={(e) => setNewInstructor(e.target.value)}
                placeholder="نام کامل مدرس دوره"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مدت زمان (ساعت)</label>
              <input type="number" min="0" value={newDuration} onChange={(e) => setNewDuration(e.target.value)}
                placeholder="مثال: 24"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش</label>
              <input type="number" min="0" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)}
                placeholder="0 = نامحدود"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع</label>
              <input type="text" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)}
                placeholder="مثال: 1405/04/01"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ پایان</label>
              <input type="text" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)}
                placeholder="مثال: 1405/06/30"
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات دوره</label>
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3}
                placeholder="توضیحات کامل درباره محتوای دوره..."
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">سرفصل‌ها</label>
              <textarea value={newSyllabus} onChange={(e) => setNewSyllabus(e.target.value)} rows={3}
                placeholder="سرفصل‌های آموزشی دوره..."
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button type="button" onClick={() => setViewMode('list')}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              انصراف
            </button>
            <button type="submit" disabled={formSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer transition-colors">
              {formSubmitting ? 'در حال ذخیره...' : 'ایجاد دوره'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );

  // ========================================================================
  // RENDER: Registrations
  // ========================================================================
  const renderRegistrations = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setViewMode('list'); setSelectedCourseId(null); }}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
              <ListCollapse className="w-5 h-5" />
            </button>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">ثبت‌نام‌های دوره</h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">{selectedCourseTitle}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {['', 'pending', 'approved', 'paid', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setRegFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                  regFilterStatus === status
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {status ? (
                  status === 'pending' ? 'در انتظار' :
                  status === 'approved' ? 'تایید شده' :
                  status === 'paid' ? 'پرداخت شده' :
                  status === 'rejected' ? 'رد شده' : status
                ) : 'همه'}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-bold text-xs">
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">هیچ ثبت‌نامی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-right py-3 px-2 font-bold text-gray-500 dark:text-gray-400">نام</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-500 dark:text-gray-400">کد ملی</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-500 dark:text-gray-400">شماره همراه</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-500 dark:text-gray-400">نوع</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-500 dark:text-gray-400">روش پرداخت</th>
                  <th className="text-right py-3 px-2 font-bold text-gray-500 dark:text-gray-400">وضعیت</th>
                  <th className="text-center py-3 px-2 font-bold text-gray-500 dark:text-gray-400">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td className="py-3 px-2 font-bold text-gray-800 dark:text-gray-200">{reg.fullname}</td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400 font-mono">{reg.kodmeli}</td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400 font-mono">{reg.mobile}</td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">{reg.type_text}</td>
                    <td className="py-3 px-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                        reg.payment_method === 'online' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600' : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600'
                      }`}>
                        {reg.payment_method_text}
                      </span>
                    </td>
                    <td className="py-3 px-2">{regStatusBadge(reg.status)}</td>
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {reg.bank_receipt && (
                          <a href={reg.bank_receipt} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-teal-600 cursor-pointer" title="مشاهده فیش">
                            <Image className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {reg.status === 'pending' && reg.payment_method === 'bank' && (
                          <>
                            <button onClick={() => handleApproveReceipt(reg.id)}
                              className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-200 cursor-pointer" title="تایید فیش">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => openRejectModal(reg.id)}
                              className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-200 cursor-pointer" title="رد فیش">
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-black text-sm text-gray-900 dark:text-white mb-4">رد فیش بانکی</h3>
              <p className="text-xs text-gray-500 mb-3">دلیل رد فیش را وارد کنید (اختیاری):</p>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
                placeholder="دلیل رد..."
                className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none mb-4"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 cursor-pointer">
                  انصراف
                </button>
                <button onClick={handleRejectReceipt}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer">
                  تایید و رد فیش
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // ========================================================================
  // RENDER: Statistics
  // ========================================================================
  const renderStats = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode('list')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
            <ListCollapse className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white">آمار دوره‌های آموزشی</h2>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">نمای کلی از وضعیت دوره‌ها و ثبت‌نام‌ها</p>
          </div>
        </div>
      </div>

      {!stats ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40 animate-pulse" />
          <p className="text-sm font-medium">در حال بارگذاری...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <p className="text-[11px] text-gray-500 font-bold mb-1">کل دوره‌ها</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total_courses}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <p className="text-[11px] text-gray-500 font-bold mb-1">دوره‌های فعال</p>
            <p className="text-2xl font-black text-emerald-600">{stats.active_courses}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <p className="text-[11px] text-gray-500 font-bold mb-1">کل ثبت‌نام‌ها</p>
            <p className="text-2xl font-black text-indigo-600">{stats.total_registrations}</p>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <p className="text-[11px] text-gray-500 font-bold mb-1">فیش‌های در انتظار</p>
            <p className="text-2xl font-black text-amber-600">{stats.pending_receipts}</p>
          </div>
        </div>
      )}

      {stats && stats.top_courses.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="font-black text-sm text-gray-900 dark:text-white mb-4">پرمخاطب‌ترین دوره‌ها</h3>
          <div className="space-y-3">
            {stats.top_courses.map((c, idx) => (
              <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 w-5">{idx + 1}.</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{c.title}</span>
                </div>
                <span className="text-xs font-mono font-bold text-teal-600">{c.count} ثبت‌نام</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  // ========================================================================
  // RENDER: Edit Modal
  // ========================================================================
  const renderEditModal = () => (
    <AnimatePresence>
      {showEditModal && editingCourse && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full shadow-xl border border-gray-100 dark:border-gray-800 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                ویرایش دوره
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان دوره <span className="text-rose-500">*</span></label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مبلغ شهریه</label>
                  <input type="text" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">وضعیت</label>
                  <select value={editActive} onChange={(e) => setEditActive(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none">
                    <option value="1">فعال</option>
                    <option value="0">غیرفعال</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">استاد</label>
                  <input type="text" value={editInstructor} onChange={(e) => setEditInstructor(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مدت زمان (ساعت)</label>
                  <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت</label>
                  <input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع</label>
                  <input type="text" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ پایان</label>
                  <input type="text" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">سرفصل‌ها</label>
                  <textarea value={editSyllabus} onChange={(e) => setEditSyllabus(e.target.value)} rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 cursor-pointer">
                  انصراف
                </button>
                <button type="submit" disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer">
                  {formSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ========================================================================
  // Main Render
  // ========================================================================
  return (
    <div className="max-w-6xl mx-auto">
      {viewMode === 'list' && renderCourseList()}
      {viewMode === 'add' && renderAddCourse()}
      {viewMode === 'registrations' && renderRegistrations()}
      {viewMode === 'stats' && renderStats()}
      {renderEditModal()}
    </div>
  );
}
