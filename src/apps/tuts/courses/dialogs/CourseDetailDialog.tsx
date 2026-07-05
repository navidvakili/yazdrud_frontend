// ============================================================
// CourseDetailDialog — نمایش جزئیات کامل دوره با قابلیت ویرایش
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { X, Edit2 } from 'lucide-react';
import type { TutCourse } from '../../shared/types';

interface CourseDetailDialogProps {
  course: TutCourse | null;
  onClose: () => void;
  onEdit: (course: TutCourse) => void;
  formatCurrency: (amount: number) => string;
  toPersianDigits: (str: string) => string;
}

export default function CourseDetailDialog({
  course,
  onClose,
  onEdit,
  formatCurrency,
  toPersianDigits,
}: CourseDetailDialogProps) {
  return (
    <AnimatePresence>
      {course && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 block w-max mb-3">
              {course.category}
            </span>

            <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug mb-4">
              {course.title}
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed text-justify mb-5 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
              {course.description}
            </p>

            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">مدرس و ارائه‌دهنده:</span>
                <span className="font-sans font-bold text-gray-800 dark:text-gray-200">{course.lecturer}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">شهریه و ضریب مالی:</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">{formatCurrency(course.cost)}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">مدت زمان آموزش:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(course.duration)} ساعت</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(course.startDate)}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">تاریخ پایان دوره:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{course.endDate ? toPersianDigits(course.endDate) : '---'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">ساعت برگزاری:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{course.courseTime || '---'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">مکان برگزاری:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{course.location || '---'}</span>
              </div>
            </div>

            {(course.prerequisites || (course.daysOfWeek?.length ?? 0) > 0) && (
              <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                {course.prerequisites && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850 col-span-2">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">پیشنیازها:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{course.prerequisites}</span>
                  </div>
                )}
                {(course.daysOfWeek?.length ?? 0) > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850 col-span-2">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">روزهای برگزاری:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{course.daysOfWeek.join(' - ')}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => onEdit(course)}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-sm shadow-teal-600/15 flex items-center justify-center gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              ویرایش مشخصات دوره
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}