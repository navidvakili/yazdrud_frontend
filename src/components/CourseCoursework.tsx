// ============================================================
// CourseCoursework — دوره‌های آموزشی (بازطراحی شده بر اساس دمو)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Search, Plus, X, User, Clock, Calendar,
  CheckCircle, AlertTriangle, DollarSign, Layers,
  Edit3, Trash2, Power, Eye, Users, FileText,
  BarChart3, ListCollapse, Ban, Sparkles,
  Filter, Info, Award, TrendingUp,
  UserCheck, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Course, CourseRegistration, CourseStats } from '@/src/types';
import api from '@/src/api';

// ============ Persian Helpers ============
function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, (w) => id[+w]);
}

function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseInt(amount.replace(/,/g, '')) : amount;
  if (isNaN(num)) return '۰ ریال';
  return toPersianDigits(num.toLocaleString('fa-IR')) + ' ریال';
}

// ============ Tab types ============
type ViewMode = 'courses' | 'registrations' | 'stats';

interface TabItem {
  id: ViewMode;
  label: string;
  icon: typeof BookOpen;
}

const TABS: TabItem[] = [
  { id: 'courses', label: 'دوره‌های آموزشی', icon: BookOpen },
  { id: 'registrations', label: 'ثبت‌نام‌ها', icon: Users },
  { id: 'stats', label: 'آمار و نمودارها', icon: BarChart3 },
];

export default function CourseCoursework() {
  // ========== User & Auth ==========
  const storedUser = api.getStoredUser();
  const isAdmin = storedUser?.role === 'admin' || storedUser?.roles?.includes('admin') || false;

  // ========== View State ==========
  const [viewMode, setViewMode] = useState<ViewMode>('courses');

  // ========== Data State ==========
  const [courses, setCourses] = useState<Course[]>([]);
  const [registrations, setRegistrations] = useState<CourseRegistration[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<CourseRegistration[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);

  // ========== Filters ==========
  const [searchQuery, setSearchQuery] = useState('');
  const [regFilterStatus, setRegFilterStatus] = useState('');

  // ========== Pagination ==========
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  // ========== Selected Course for Details ==========
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('');

  // ========== Edit Modal ==========
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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

  // ========== New Course Form ==========
  const [showNewModal, setShowNewModal] = useState(false);
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

  // ========== Reject Receipt ==========
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRegId, setRejectRegId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // ========== Toast ==========
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };
  const [formSubmitting, setFormSubmitting] = useState(false);

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
      showToast(err.message || 'خطا در دریافت لیست دوره‌ها', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchAllRegistrations = useCallback(async () => {
    try {
      const result = await api.getAllRegistrations({ status: regFilterStatus || undefined, per_page: 200 });
      setAllRegistrations(result.data);
    } catch { /* ignore */ }
  }, [regFilterStatus]);

  const fetchRegistrationsForCourse = useCallback(async (courseId: number) => {
    try {
      const data = await api.getCourseRegistrations(courseId);
      setRegistrations(data);
    } catch (err: any) {
      showToast(err.message || 'خطا در دریافت ثبت‌نام‌ها', 'error');
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getCourseStatistics();
      setStats(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (viewMode === 'courses') fetchCourses();
    if (viewMode === 'registrations') fetchAllRegistrations();
    if (viewMode === 'stats') fetchStats();
  }, [viewMode, fetchCourses, fetchAllRegistrations, fetchStats]);

  useEffect(() => {
    if (viewMode === 'courses') fetchCourses(1);
  }, [searchQuery, fetchCourses]);

  // ========== CRUD Handlers ==========
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) { showToast('عنوان دوره را وارد کنید', 'error'); return; }
    setFormSubmitting(true);
    try {
      await api.createCourse({
        title: newTitle, amount: newAmount, active: newActive,
        description: newDescription || undefined, syllabus: newSyllabus || undefined,
        duration: newDuration ? parseInt(newDuration) : undefined,
        instructor: newInstructor || undefined,
        start_date: newStartDate || undefined, end_date: newEndDate || undefined,
        capacity: newCapacity ? parseInt(newCapacity) : 0,
      });
      showToast(`دوره "${newTitle}" با موفقیت ایجاد شد`);
      setShowNewModal(false);
      resetNewForm();
      fetchCourses();
    } catch (err: any) { showToast(err.message || 'خطا در ایجاد دوره', 'error');
    } finally { setFormSubmitting(false); }
  };

  const resetNewForm = () => {
    setNewTitle(''); setNewAmount('0'); setNewActive('1');
    setNewDescription(''); setNewSyllabus(''); setNewDuration('');
    setNewInstructor(''); setNewStartDate(''); setNewEndDate(''); setNewCapacity('0');
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title); setEditAmount(course.amount);
    setEditActive(course.active ? '1' : '0');
    setEditDescription(course.description || ''); setEditSyllabus(course.syllabus || '');
    setEditDuration(course.duration?.toString() || ''); setEditInstructor(course.instructor || '');
    setEditStartDate(course.start_date || ''); setEditEndDate(course.end_date || '');
    setEditCapacity(course.capacity.toString());
    setShowEditModal(true);
  };

  const handleEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editTitle) return;
    setFormSubmitting(true);
    try {
      await api.updateCourse(editingCourse.id, {
        title: editTitle, amount: editAmount, active: editActive,
        description: editDescription || undefined, syllabus: editSyllabus || undefined,
        duration: editDuration ? parseInt(editDuration) : undefined,
        instructor: editInstructor || undefined,
        start_date: editStartDate || undefined, end_date: editEndDate || undefined,
        capacity: editCapacity ? parseInt(editCapacity) : 0,
      });
      showToast(`دوره "${editTitle}" با موفقیت به‌روزرسانی شد`);
      setShowEditModal(false); setEditingCourse(null);
      fetchCourses();
    } catch (err: any) { showToast(err.message || 'خطا در به‌روزرسانی', 'error');
    } finally { setFormSubmitting(false); }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`آیا از حذف دوره "${course.title}" اطمینان دارید؟`)) return;
    try {
      await api.deleteCourse(course.id);
      showToast(`دوره "${course.title}" با موفقیت حذف شد`, 'info');
      fetchCourses();
    } catch (err: any) { showToast(err.message || 'خطا در حذف دوره', 'error'); }
  };

  const handleToggleActive = async (course: Course) => {
    try {
      await api.toggleCourseActive(course.id);
      const newStatus = course.active ? 'غیرفعال' : 'فعال';
      showToast(`دوره "${course.title}" با موفقیت ${newStatus} شد`, 'info');
      fetchCourses();
    } catch (err: any) { showToast(err.message || 'خطا در تغییر وضعیت', 'error'); }
  };

  // ========== Registration Handlers ==========
  const openRegistrations = (course: Course) => {
    setSelectedCourseTitle(course.title);
    setSelectedCourse(course);
    setRegFilterStatus('');
    setViewMode('registrations');
    fetchRegistrationsForCourse(course.id);
  };

  const handleApproveReceipt = async (regId: number) => {
    if (!confirm('آیا از تایید این فیش بانکی اطمینان دارید؟')) return;
    try {
      await api.approveReceipt(regId);
      showToast('فیش بانکی با موفقیت تایید شد');
      if (selectedCourse) fetchRegistrationsForCourse(selectedCourse.id);
    } catch (err: any) { showToast(err.message || 'خطا در تایید فیش', 'error'); }
  };

  const openRejectModal = (regId: number) => {
    setRejectRegId(regId); setRejectReason(''); setShowRejectModal(true);
  };

  const handleRejectReceipt = async () => {
    if (rejectRegId === null) return;
    try {
      await api.rejectReceipt(rejectRegId, rejectReason || undefined);
      showToast('فیش بانکی رد شد', 'info');
      setShowRejectModal(false); setRejectRegId(null);
      if (selectedCourse) fetchRegistrationsForCourse(selectedCourse.id);
    } catch (err: any) { showToast(err.message || 'خطا در رد فیش', 'error'); }
  };

  const filteredRegistrations = selectedCourse
    ? registrations.filter(r => !regFilterStatus || r.status === regFilterStatus)
    : allRegistrations.filter(r => !regFilterStatus || r.status === regFilterStatus);

  // ========== Helpers ==========
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
      paid: 'پرداخت شده', approved: 'تایید شده',
      pending: 'در انتظار', rejected: 'رد شده',
    };
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // ========== Chart Data ==========
  const chartData = stats?.top_courses?.map((c) => ({
    name: c.title.length > 20 ? c.title.slice(0, 20) + '...' : c.title,
    ثبت‌نام: c.count,
  })) || [];

  // ========================================================================
  // RENDER: Tab Bar
  // ========================================================================
  const renderTabBar = () => (
    <div className="flex items-center gap-1.5 mb-6 p-1 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800/60 w-max">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = viewMode === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { setViewMode(tab.id); setSelectedCourse(null); }}
            className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-white dark:bg-gray-800 text-teal-700 dark:text-teal-400 shadow-sm border border-gray-100 dark:border-gray-700'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // ========================================================================
  // RENDER: Course List (Catalog)
  // ========================================================================
  const renderCourseList = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800/60">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>سامانه آموزش آزاد و مهارتی کارانت</span>
          </div>
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
          {isAdmin && (
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              ایجاد دوره جدید
            </button>
          )}
        </div>
      </div>

      {/* Search + Total */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="جستجوی دوره‌ها بر اساس عنوان یا استاد..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pr-10 pl-3.5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30"
          />
        </div>
        <div className="px-4 py-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/15 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 shrink-0">
          <Layers className="w-4 h-4" />
          {toPersianDigits(totalCourses)} دوره
        </div>
      </div>

      {/* Quick Stats Banner */}
      {courses.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-gray-400 block font-bold mb-1">دوره‌های فعال</span>
              <span className="text-lg font-black text-gray-900 dark:text-white">
                {toPersianDigits(courses.filter(c => c.active).length)} <span className="text-xs font-sans font-normal text-gray-400">عدد</span>
              </span>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-gray-400 block font-bold mb-1">ظرفیت کل</span>
              <span className="text-lg font-black font-mono text-gray-900 dark:text-white">
                {toPersianDigits(courses.reduce((s, c) => s + c.registered_count, 0))} / {toPersianDigits(courses.reduce((s, c) => s + c.capacity, 0))}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-gray-400 block font-bold mb-1">درآمد وصول شده</span>
              <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {toPersianDigits(courses.reduce((s, c) => s + (parseInt(c.amount) || 0), 0).toLocaleString('fa-IR'))} <span className="text-xs font-sans font-normal text-gray-400">ریال</span>
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-gray-400 block font-bold mb-1">ثبت‌نام‌های فعال</span>
              <span className="text-lg font-black font-mono text-amber-500">
                {toPersianDigits(courses.reduce((s, c) => s + c.registered_count, 0))} <span className="text-xs font-sans font-normal text-gray-400">نفر</span>
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

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
          {isAdmin && (
            <p className="text-[11px] mt-1">با استفاده از دکمه "ایجاد دوره جدید" اولین دوره را تعریف کنید.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const capacity = course.capacity || 1;
              const regPercent = Math.min(100, Math.round((course.registered_count / capacity) * 100));
              const isFull = course.registered_count >= capacity && capacity > 0;
              return (
                <div
                  key={course.id}
                  className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs hover:shadow-xl hover:border-teal-500/25 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header badges */}
                    <div className="flex items-center justify-between mb-3.5">
                      {statusBadge(course.active)}
                      <span className="font-mono text-xs font-extrabold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md">
                        {course.duration_text || '—'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors min-h-[40px] line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Details */}
                    <div className="mt-4 pt-3.5 border-t border-gray-50 dark:border-gray-800/40 space-y-2 text-xs text-gray-500 dark:text-gray-400">
                      {course.instructor && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            مدرس:
                          </span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">{course.instructor}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                          شهریه:
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300 font-mono text-[11px]">
                          {formatCurrency(course.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-500" />
                          ظرفیت:
                        </span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">
                          {course.capacity === 0 ? 'نامحدود' : `${toPersianDigits(course.registered_count)} / ${toPersianDigits(course.capacity)}`}
                        </span>
                      </div>
                      {course.start_date && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-purple-500" />
                            شروع:
                          </span>
                          <span className="font-bold text-gray-700 dark:text-gray-300">{course.start_date}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Capacity progress bar */}
                  {course.capacity > 0 && (
                    <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800/40">
                      <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 mb-2 font-mono">
                        <span>ظرفیت: {toPersianDigits(course.registered_count)} از {toPersianDigits(course.capacity)} صندلی</span>
                        <span>{toPersianDigits(regPercent)}٪ تکمیل</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden mb-4 relative">
                        <div
                          className={`absolute h-full rounded-full transition-all duration-500 ${
                            isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-500 to-indigo-500'
                          }`}
                          style={{ width: `${regPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openRegistrations(course)}
                      className="flex-1 py-2.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      ثبت‌نام‌ها
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(course)}
                          className="py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-[11px] transition-colors cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(course)}
                          className={`py-2.5 px-3 rounded-xl transition-colors cursor-pointer font-extrabold text-[11px] ${
                            course.active ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600'
                          }`}
                          title={course.active ? 'غیرفعال کردن' : 'فعال کردن'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-rose-500/20 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
                  {toPersianDigits(page)}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  // ========================================================================
  // RENDER: Registrations
  // ========================================================================
  const renderRegistrations = () => {
    const displayData = selectedCourse ? registrations : allRegistrations;
    const filtered = displayData.filter(r => !regFilterStatus || r.status === regFilterStatus);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setViewMode('courses'); setSelectedCourse(null); }}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <ListCollapse className="w-5 h-5" />
            </button>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                {selectedCourse ? `ثبت‌نام‌های دوره` : 'همه ثبت‌نام‌ها'}
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {selectedCourseTitle || 'لیست تمام ثبت‌نام‌های دوره‌های آموزشی'}
              </p>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
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

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">هیچ ثبت‌نامی یافت نشد</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800/80 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
                    <th className="text-right py-3.5 px-3 font-bold text-gray-500 dark:text-gray-400">نام</th>
                    <th className="text-right py-3.5 px-3 font-bold text-gray-500 dark:text-gray-400">کد ملی</th>
                    <th className="text-right py-3.5 px-3 font-bold text-gray-500 dark:text-gray-400">شماره همراه</th>
                    {!selectedCourse && (
                      <th className="text-right py-3.5 px-3 font-bold text-gray-500 dark:text-gray-400">دوره</th>
                    )}
                    <th className="text-right py-3.5 px-3 font-bold text-gray-500 dark:text-gray-400">نوع</th>
                    <th className="text-right py-3.5 px-3 font-bold text-gray-500 dark:text-gray-400">روش پرداخت</th>
                    <th className="text-right py-3.5 px-3 font-bold text-gray-500 dark:text-gray-400">وضعیت</th>
                    <th className="text-center py-3.5 px-3 font-bold text-gray-500 dark:text-gray-400">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-gray-800 dark:text-gray-200">{reg.fullname}</td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-mono">{reg.kodmeli}</td>
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-mono">{reg.mobile}</td>
                      {!selectedCourse && (
                        <td className="py-3 px-3 text-gray-500 dark:text-gray-400 max-w-[150px] truncate">{reg.course_title}</td>
                      )}
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{reg.type_text}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          reg.payment_method === 'online' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600' : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600'
                        }`}>
                          {reg.payment_method_text}
                        </span>
                      </td>
                      <td className="py-3 px-3">{regStatusBadge(reg.status)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1">
                          {reg.bank_receipt && (
                            <a
                              href={reg.bank_receipt} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-teal-600 transition-colors cursor-pointer inline-flex"
                              title="مشاهده فیش"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {reg.status === 'pending' && reg.payment_method === 'bank' && (
                            <>
                              <button
                                onClick={() => handleApproveReceipt(reg.id)}
                                className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                                title="تایید فیش"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openRejectModal(reg.id)}
                                className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
                                title="رد فیش"
                              >
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
          </div>
        )}
      </div>
    );
  };

  // ========================================================================
  // RENDER: Statistics
  // ========================================================================
  const renderStats = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('courses')}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
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
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-gray-500 font-bold">کل دوره‌ها</p>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{toPersianDigits(stats.total_courses)}</p>
              <p className="text-[10px] text-gray-400 mt-1">دوره آموزشی فعال در سیستم</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-gray-500 font-bold">دوره‌های فعال</p>
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">{toPersianDigits(stats.active_courses)}</p>
              <p className="text-[10px] text-gray-400 mt-1">دوره قابل ثبت‌نام</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-gray-500 font-bold">کل ثبت‌نام‌ها</p>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-600">{toPersianDigits(stats.total_registrations)}</p>
              <p className="text-[10px] text-gray-400 mt-1">ثبت‌نام در تمام دوره‌ها</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-gray-500 font-bold">فیش‌های در انتظار</p>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600">{toPersianDigits(stats.pending_receipts)}</p>
              <p className="text-[10px] text-gray-400 mt-1">نیازمند بررسی و تایید</p>
            </div>
          </div>

          {/* Top Courses Bar Chart */}
          {stats.top_courses && stats.top_courses.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800/80 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-black text-sm text-gray-900 dark:text-white">پرمخاطب‌ترین دوره‌ها</h3>
                <span className="text-[10px] text-gray-400 mr-auto">بر اساس تعداد ثبت‌نام</span>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ثبت‌نام"
                      stroke="#0d9488"
                      strokeWidth={2}
                      fill="url(#colorTeal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Top courses list */}
              <div className="mt-6 space-y-2">
                {stats.top_courses.map((c, idx) => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-400 w-5">{toPersianDigits(idx + 1)}.</span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{c.title}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-teal-600">{toPersianDigits(c.count)} ثبت‌نام</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gradient summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
              <Award className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-[10px] opacity-80 font-bold">تعداد دوره‌ها</p>
              <p className="text-2xl font-black">{toPersianDigits(stats.total_courses)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <Users className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-[10px] opacity-80 font-bold">مجموع ثبت‌نام‌ها</p>
              <p className="text-2xl font-black">{toPersianDigits(stats.total_registrations)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-lg">
              <FileText className="w-8 h-8 mb-2 opacity-80" />
              <p className="text-[10px] opacity-80 font-bold">فیش‌های در انتظار</p>
              <p className="text-2xl font-black">{toPersianDigits(stats.pending_receipts)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ========================================================================
  // MODAL: New Course
  // ========================================================================
  const renderNewCourseModal = () => (
    <AnimatePresence>
      {showNewModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowNewModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full shadow-xl border border-gray-100 dark:border-gray-800 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900 dark:text-white">ایجاد دوره آموزشی جدید</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">اطلاعات دوره را وارد کنید</p>
                </div>
              </div>
              <button onClick={() => setShowNewModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان دوره <span className="text-rose-500">*</span></label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="عنوان کامل دوره"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مبلغ شهریه (ریال)</label>
                  <input type="text" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="مثال: 5000000"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">وضعیت</label>
                  <select value={newActive} onChange={(e) => setNewActive(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30">
                    <option value="1">فعال</option>
                    <option value="0">غیرفعال</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام استاد</label>
                  <input type="text" value={newInstructor} onChange={(e) => setNewInstructor(e.target.value)}
                    placeholder="نام کامل مدرس دوره"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مدت زمان (ساعت)</label>
                  <input type="number" min="0" value={newDuration} onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="مثال: 24"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش</label>
                  <input type="number" min="0" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)}
                    placeholder="0 = نامحدود"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع</label>
                  <input type="text" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)}
                    placeholder="مثال: 1405/04/01"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ پایان</label>
                  <input type="text" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)}
                    placeholder="مثال: 1405/06/30"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات دوره</label>
                  <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3}
                    placeholder="توضیحات کامل درباره محتوای دوره..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">سرفصل‌ها</label>
                  <textarea value={newSyllabus} onChange={(e) => setNewSyllabus(e.target.value)} rows={3}
                    placeholder="سرفصل‌های آموزشی دوره..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowNewModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  انصراف
                </button>
                <button type="submit" disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer transition-colors">
                  {formSubmitting ? 'در حال ذخیره...' : 'ایجاد دوره'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ========================================================================
  // MODAL: Edit Course
  // ========================================================================
  const renderEditModal = () => (
    <AnimatePresence>
      {showEditModal && editingCourse && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-2xl w-full shadow-xl border border-gray-100 dark:border-gray-800 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                ویرایش دوره
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان دوره <span className="text-rose-500">*</span></label>
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مبلغ شهریه</label>
                  <input type="text" value={editAmount} onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">وضعیت</label>
                  <select value={editActive} onChange={(e) => setEditActive(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30">
                    <option value="1">فعال</option>
                    <option value="0">غیرفعال</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">استاد</label>
                  <input type="text" value={editInstructor} onChange={(e) => setEditInstructor(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">مدت زمان (ساعت)</label>
                  <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت</label>
                  <input type="number" value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع</label>
                  <input type="text" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ پایان</label>
                  <input type="text" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 font-mono" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">سرفصل‌ها</label>
                  <textarea value={editSyllabus} onChange={(e) => setEditSyllabus(e.target.value)} rows={3}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                </div>
              </div>
              <div className="pt-4 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                  انصراف
                </button>
                <button type="submit" disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer transition-colors">
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
  // MODAL: Reject Receipt
  // ========================================================================
  const renderRejectModal = () => (
    <AnimatePresence>
      {showRejectModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-black text-sm text-gray-900 dark:text-white mb-2">رد فیش بانکی</h3>
            <p className="text-xs text-gray-500 mb-4">دلیل رد فیش را وارد کنید (اختیاری):</p>
            <textarea
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3}
              placeholder="دلیل رد..."
              className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                انصراف
              </button>
              <button onClick={handleRejectReceipt}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors">
                تایید و رد فیش
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ========================================================================
  // Main Render
  // ========================================================================
  return (
    <div className="max-w-7xl mx-auto py-2.5 relative">
      {/* Global Toast */}
      <AnimatePresence>
        {toast && viewMode !== 'courses' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md ${
              toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-500/20 text-emerald-800 dark:text-emerald-300' :
              toast.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-500/20 text-rose-800 dark:text-rose-300' :
              'bg-blue-50 dark:bg-blue-950/90 border-blue-500/20 text-blue-800 dark:text-blue-300'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            <span className="text-xs font-bold leading-relaxed">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      {renderTabBar()}

      {/* View Content */}
      {viewMode === 'courses' && renderCourseList()}
      {viewMode === 'registrations' && renderRegistrations()}
      {viewMode === 'stats' && renderStats()}

      {/* Modals */}
      {renderNewCourseModal()}
      {renderEditModal()}
      {renderRejectModal()}
    </div>
  );
}
