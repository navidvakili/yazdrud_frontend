// ============================================================
// TutsModule — Course Card Component (Grid & List Views)
// ============================================================

import { User, Clock, Calendar, Copy, Edit2, BarChart2, Power, Download, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { TutCourse, TutRegistrant } from '../shared/types';
import { toPersianDigits, formatCurrency } from '../shared/utils';

interface CourseCardProps {
    course: TutCourse;
    viewMode: 'grid' | 'list';
    registrants: TutRegistrant[];
    currentUserRole: string;
    onDetail: (course: TutCourse) => void;
    onCopyUrl: (course: TutCourse) => void;
    onEdit: (course: TutCourse) => void;
    onReport: (course: TutCourse) => void;
    onToggleStatus: (courseId: string) => void;
    onExportExcel: (course: TutCourse) => void;
    onDelete: (courseId: string) => void;
}

export default function CourseCard({
    course, viewMode, registrants, currentUserRole,
    onDetail, onCopyUrl, onEdit, onReport,
    onToggleStatus, onExportExcel, onDelete,
}: CourseCardProps) {
    const isFull = course.enrolled >= course.capacity;
    const regPercent = (course.enrolled / course.capacity) * 100;

    return (
        <div
            className={`${viewMode === 'list'
                ? 'p-4 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs hover:shadow-lg hover:border-teal-500/25 transition-all duration-300 group'
                : 'p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs hover:shadow-xl hover:border-teal-500/25 transition-all duration-300 flex flex-col justify-between group'
                }`}
        >
            {viewMode === 'list' ? (
                /* List view: horizontal layout */
                <>
                    <div className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 shrink-0">
                                    {course.category}
                                </span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                    course.status === 'completed' ? 'bg-amber-500/10 text-amber-600' :
                                        'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                    }`}>
                                    {course.status === 'active' ? 'ثبت‌نام فعال' :
                                        course.status === 'completed' ? 'تکمیل ظرفیت' : 'برگزار شده'}
                                </span>
                            </div>
                            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all truncate">
                                {course.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {course.lecturer}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {toPersianDigits(course.duration)} ساعت - {toPersianDigits(course.startDate)}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="text-left">
                                <span className="text-[9px] text-gray-400 block font-bold">شهریه</span>
                                <span className="text-sm font-black text-teal-600 dark:text-teal-400 whitespace-nowrap">
                                    {formatCurrency(course.cost)}
                                </span>
                            </div>
                            <div className="flex flex-col items-center min-w-[80px]">
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-1">
                                    <span>{toPersianDigits(Math.round(regPercent))}٪</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden relative">
                                    <div
                                        className={`absolute h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-500 to-indigo-500'}`}
                                        style={{ width: `${Math.min(100, regPercent)}%` }}
                                    ></div>
                                </div>
                                <span className="text-[9px] text-gray-400 mt-0.5">
                                    {toPersianDigits(course.enrolled)}/{toPersianDigits(course.capacity)}
                                </span>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => onDetail(course)}
                                    className="px-3 py-1.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer whitespace-nowrap">
                                    جزئیات
                                </button>
                                <button onClick={() => onCopyUrl(course)}
                                    className="p-1.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer">
                                    <Copy className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Admin Controls for List View */}
                    {currentUserRole === 'admin' && (
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-950/40 p-2 rounded-2xl">
                            <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">عملیات:</span>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => onEdit(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                                    title="ویرایش دوره">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onReport(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                    title="گزارش ثبت‌نام‌ها">
                                    <BarChart2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onToggleStatus(course.id)}
                                    className={`p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg transition-all cursor-pointer ${course.status === 'ended'
                                        ? 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                        : 'text-emerald-600 hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'
                                        }`}
                                    title={course.status === 'ended' ? 'فعال کردن دوره' : 'غیرفعال (پایان دوره)'}>
                                    <Power className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onExportExcel(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all cursor-pointer"
                                    title="خروجی اکسل (CSV)">
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onCopyUrl(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                    title="کپی آدرس دوره">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(course.id)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                                    title="حذف دوره">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Grid view: original vertical layout */
                <>
                    <div>
                        <div className="flex items-center justify-between mb-3.5">
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                {course.category}
                            </span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                course.status === 'completed' ? 'bg-amber-500/10 text-amber-600' :
                                    'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                }`}>
                                {course.status === 'active' ? 'ثبت‌نام فعال' :
                                    course.status === 'completed' ? 'تکمیل ظرفیت' : 'برگزار شده'}
                            </span>
                        </div>

                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-all mb-3 line-clamp-2 min-h-[40px]">
                            {course.title}
                        </h3>

                        <div className="space-y-2 mt-4 pt-3.5 border-t border-gray-50 dark:border-gray-800/40 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                    مدرس دوره:
                                </span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{course.lecturer}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 font-sans">
                                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                                    طول دوره:
                                </span>
                                <span>{toPersianDigits(course.duration)} ساعت</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 font-sans">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    تاریخ شروع:
                                </span>
                                <span>{toPersianDigits(course.startDate)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-50 dark:border-gray-800/40">
                        <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-500 mb-2">
                            <span>ظرفیت: {toPersianDigits(course.enrolled)} از {toPersianDigits(course.capacity)} صندلی</span>
                            <span>{toPersianDigits(Math.round(regPercent))}٪ تکمیل</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden mb-4 relative">
                            <div
                                className={`absolute h-full rounded-full transition-all duration-500 ${isFull ? 'bg-amber-500' : 'bg-gradient-to-r from-teal-500 to-indigo-500'}`}
                                style={{ width: `${Math.min(100, regPercent)}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <div className="text-right">
                                <span className="text-[9px] text-gray-400 block font-bold">شهریه ثبت‌نام:</span>
                                <span className="text-sm font-black text-teal-600 dark:text-teal-400">
                                    {formatCurrency(course.cost)}
                                </span>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => onDetail(course)}
                                    className="px-4 py-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
                                    جزئیات سرفصل
                                </button>
                                <button onClick={() => onCopyUrl(course)}
                                    className="p-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                    title="کپی آدرس دوره">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Admin Controls for Grid View */}
                    {currentUserRole === 'admin' && (
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-950/40 p-2 rounded-2xl">
                            <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">عملیات:</span>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => onEdit(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                                    title="ویرایش دوره">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onReport(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                    title="گزارش ثبت‌نام‌ها">
                                    <BarChart2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onToggleStatus(course.id)}
                                    className={`p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg transition-all cursor-pointer ${course.status === 'ended'
                                        ? 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                        : 'text-emerald-600 hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'
                                        }`}
                                    title={course.status === 'ended' ? 'فعال کردن دوره' : 'غیرفعال (پایان دوره)'}>
                                    <Power className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onExportExcel(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all cursor-pointer"
                                    title="خروجی اکسل (CSV)">
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onCopyUrl(course)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                    title="کپی آدرس دوره">
                                    <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => onDelete(course.id)}
                                    className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                                    title="حذف دوره">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}