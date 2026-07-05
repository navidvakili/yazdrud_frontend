// ============================================================
// useCourseCRUD — Course CRUD operations
// ============================================================

import { useState, useEffect } from 'react';
import api from '@/src/shared-api';
import type { TutCourse, TutRegistrant } from '../../shared/types';
import { mapCourse, toEnglishDigits } from '../../shared/utils';

export function useCourseCRUD(
  courses: TutCourse[],
  setCourses: React.Dispatch<React.SetStateAction<TutCourse[]>>,
  registrants: TutRegistrant[],
  setRegistrants: React.Dispatch<React.SetStateAction<TutRegistrant[]>>,
  categories: string[],
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
  // New course form
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseLecturer, setNewCourseLecturer] = useState('');
  const [newCourseDuration, setNewCourseDuration] = useState('');
  const [newCourseCost, setNewCourseCost] = useState('');
  const [newCourseCapacity, setNewCourseCapacity] = useState('30');
  const [newCourseStartDate, setNewCourseStartDate] = useState('۱۴۰۵/۰۵/۱۵');
  const [newCourseCategory, setNewCourseCategory] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');

  useEffect(() => {
    if (!newCourseCategory && categories.length > 0) {
      setNewCourseCategory(categories[0]);
    }
  }, [categories]);

  // Edit course form
  const [editingCourse, setEditingCourse] = useState<TutCourse | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState('');
  const [editCourseLecturer, setEditCourseLecturer] = useState('');
  const [editCourseDuration, setEditCourseDuration] = useState('');
  const [editCourseCost, setEditCourseCost] = useState('');
  const [editCourseCapacity, setEditCourseCapacity] = useState('');
  const [editCourseStartDate, setEditCourseStartDate] = useState('');
  const [editCourseCategory, setEditCourseCategory] = useState('');
  const [editCourseDescription, setEditCourseDescription] = useState('');

  // Delete confirmation
  const [courseToDelete, setCourseToDelete] = useState<TutCourse | null>(null);

  const handleCreateNewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle || !newCourseLecturer || !newCourseCost) {
      showToast('لطفاً فیلدهای ستاره‌دار و الزامی را پر کنید.', 'error');
      return;
    }
    const price = parseInt(newCourseCost.replace(/[^\d]/g, ''));
    if (isNaN(price)) { showToast('مبلغ شهریه نامعتبر است.', 'error'); return; }

    try {
      const startDate = toEnglishDigits(newCourseStartDate);
      const durationNum = parseInt(newCourseDuration.replace(/[^\d]/g, '')) || null;

      const courseData = {
        title: newCourseTitle,
        instructor: newCourseLecturer,
        amount: price,
        capacity: parseInt(newCourseCapacity) || 30,
        duration: durationNum,
        start_date: startDate || null,
        description: newCourseDescription || '',
        active: true,
      };

      const result = await api.createCourse(courseData);
      const newC = mapCourse(result);
      setCourses([newC, ...courses]);
      setIsNewCourseModalOpen(false);
      showToast(`دوره کارگاهی جدید "${newCourseTitle}" با موفقیت تعریف گردید.`);
      setNewCourseTitle('');
      setNewCourseLecturer('');
      setNewCourseCost('');
      setNewCourseDescription('');
    } catch (error: any) {
      const msg = error?.errors ? Object.values(error.errors).flat().join(' — ') : error.message;
      showToast(msg || 'خطا در ایجاد دوره جدید', 'error');
    }
  };

  const startEditing = (course: TutCourse) => {
    setEditingCourse(course);
    setEditCourseTitle(course.title);
    setEditCourseLecturer(course.lecturer);
    setEditCourseDuration(course.duration);
    setEditCourseCost(course.cost.toLocaleString('en-US'));
    setEditCourseCapacity(String(course.capacity));
    setEditCourseStartDate(course.startDate);
    setEditCourseCategory(course.category);
    setEditCourseDescription(course.description);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    if (!editCourseTitle || !editCourseLecturer || !editCourseCost) {
      showToast('لطفاً فیلدهای ستاره‌دار و الزامی را پر کنید.', 'error');
      return;
    }
    const price = parseInt(editCourseCost.toString().replace(/[^\d]/g, ''));
    if (isNaN(price)) { showToast('مبلغ شهریه نامعتبر است.', 'error'); return; }

    try {
      const startDate = toEnglishDigits(editCourseStartDate);
      const durationNum = parseInt(editCourseDuration.replace(/[^\d]/g, '')) || null;

      const courseData = {
        title: editCourseTitle,
        instructor: editCourseLecturer,
        amount: price,
        capacity: parseInt(editCourseCapacity) || 30,
        duration: durationNum,
        start_date: startDate || null,
        description: editCourseDescription || '',
      };

      const result = await api.updateCourse(parseInt(editingCourse.id), courseData);
      const updated = mapCourse(result);
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? updated : c));
      setEditingCourse(null);
      showToast(`دوره کارگاهی "${editCourseTitle}" با موفقیت بروزرسانی گردید.`);
    } catch (error: any) {
      const msg = error?.errors ? Object.values(error.errors).flat().join(' — ') : error.message;
      showToast(msg || 'خطا در بروزرسانی دوره', 'error');
    }
  };

  const handleToggleCourseStatus = async (id: string) => {
    try {
      const result = await api.toggleCourseActive(parseInt(id));
      const updated = mapCourse(result);
      setCourses(prev => prev.map(c => c.id === id ? updated : c));
      showToast(
        updated.status === 'active'
          ? `دوره "${updated.title}" مجدداً فعال گردید.`
          : `دوره "${updated.title}" غیرفعال (پایان‌یافته) گردید.`,
        'info',
      );
    } catch (error: any) {
      showToast(error.message || 'خطا در تغییر وضعیت دوره', 'error');
    }
  };

  const handleDeleteCourse = (id: string) => {
    const course = courses.find(c => c.id === id);
    if (!course) return;
    setCourseToDelete(course);
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await api.deleteCourse(parseInt(courseToDelete.id));
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      setRegistrants(prev => prev.filter(r => r.courseId !== courseToDelete.id));
      showToast(`دوره آموزشی "${courseToDelete.title}" با موفقیت حذف گردید.`, 'info');
      setCourseToDelete(null);
    } catch (error: any) {
      showToast(error.message || 'خطا در حذف دوره', 'error');
    }
  };

  const handleCopyCourseUrl = (course: TutCourse) => {
    const url = `https://terms.sau.ac.ir/course/${course.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('آدرس دوره کپی شد.', 'success');
    }).catch(() => {
      showToast('خطا در کپی آدرس.', 'error');
    });
  };

  const handleExportSingleCourseExcel = (course: TutCourse) => {
    const courseRegs = registrants.filter(r => r.courseId === course.id);
    if (courseRegs.length === 0) {
      showToast('هیچ ثبت‌نامی برای این دوره یافت نشد تا خروجی گرفته شود.', 'error');
      return;
    }
    let csvContent = '\uFEFF';
    csvContent += 'ردیف,کد ملی,نام و نام خانوادگی,شماره دانشجویی,موبایل,نوع کاربر,دوره آموزشی,مبلغ (ریال),نوع پرداخت,شماره پیگیری,تاریخ ثبت نام,تاریخ تایید,وضعیت\n';
    courseRegs.forEach((r, idx) => {
      const statusText = r.status === 'verified' ? 'تایید شده' : r.status === 'rejected' ? 'رد شده' : 'در انتظار تایید';
      const verifiedDate = r.verifiedAt ? r.verifiedAt.split(' ')[0].replace(/-/g, '/') : '';
      csvContent += `"${idx + 1}","${r.nationalCode}","${r.name}","${r.studentCode}","${r.mobile}","${r.typeText}","${r.courseTitle}",${r.amount},"${r.paymentMethod}","${r.trackingCode}","${r.date}","${verifiedDate}","${statusText}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `گزارش_ثبت_نام_${course.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`فایل اکسل (CSV) ثبت‌نامی‌های دوره "${course.title}" با موفقیت صادر و دانلود شد.`);
  };

  return {
    isNewCourseModalOpen, setIsNewCourseModalOpen,
    newCourseTitle, setNewCourseTitle,
    newCourseLecturer, setNewCourseLecturer,
    newCourseDuration, setNewCourseDuration,
    newCourseCost, setNewCourseCost,
    newCourseCapacity, setNewCourseCapacity,
    newCourseStartDate, setNewCourseStartDate,
    newCourseCategory, setNewCourseCategory,
    newCourseDescription, setNewCourseDescription,
    handleCreateNewCourse,
    editingCourse, setEditingCourse,
    editCourseTitle, setEditCourseTitle,
    editCourseLecturer, setEditCourseLecturer,
    editCourseDuration, setEditCourseDuration,
    editCourseCost, setEditCourseCost,
    editCourseCapacity, setEditCourseCapacity,
    editCourseStartDate, setEditCourseStartDate,
    editCourseCategory, setEditCourseCategory,
    editCourseDescription, setEditCourseDescription,
    startEditing, handleUpdateCourse,
    handleToggleCourseStatus,
    handleDeleteCourse, confirmDeleteCourse,
    courseToDelete, setCourseToDelete,
    handleCopyCourseUrl,
    handleExportSingleCourseExcel,
  };
}
