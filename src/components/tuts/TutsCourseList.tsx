// ============================================================
// TutsModule — Course List (Pre-Registration Catalog)
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Search, Filter, Layers, Plus, User, Clock, Calendar, Copy,
    Edit2, BarChart2, Power, Download, Trash2, X, FileText, Upload,
    Check, FileText as FileTextIcon,
} from 'lucide-react';
import type { TutCourse, TutVoucher, TutRegistrant, ToastMessage } from './tuts-types';
import { toPersianDigits, formatCurrency, formatCostInput } from './tuts-utils';
import { LoadingSpinner } from './tuts-components';
import Pagination from '../Pagination';
import { JalaliDatepicker } from './JalaliDatepicker';

interface TutsCourseListProps {
    // User & Role
    currentUserRole: string;
    // Data
    courses: TutCourse[];
    registrants: TutRegistrant[];
    vouchers: TutVoucher[];
    categories: string[];
    loadingCourses: boolean;
    // Toast
    toast: ToastMessage | null;
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
    // Categories
    setIsCategoryModalOpen: (open: boolean) => void;
    // Course CRUD (from useCourseCRUD)
    isNewCourseModalOpen: boolean;
    setIsNewCourseModalOpen: (open: boolean) => void;
    newCourseTitle: string;
    setNewCourseTitle: (v: string) => void;
    newCourseLecturer: string;
    setNewCourseLecturer: (v: string) => void;
    newCourseDuration: string;
    setNewCourseDuration: (v: string) => void;
    newCourseCost: string;
    setNewCourseCost: (v: string) => void;
    newCourseCapacity: string;
    setNewCourseCapacity: (v: string) => void;
    newCourseStartDate: string;
    setNewCourseStartDate: (v: string) => void;
    newCourseCategory: string;
    setNewCourseCategory: (v: string) => void;
    newCourseDescription: string;
    setNewCourseDescription: (v: string) => void;
    handleCreateNewCourse: (e: React.FormEvent) => void;
    editingCourse: TutCourse | null;
    setEditingCourse: (c: TutCourse | null) => void;
    editCourseTitle: string;
    setEditCourseTitle: (v: string) => void;
    editCourseLecturer: string;
    setEditCourseLecturer: (v: string) => void;
    editCourseDuration: string;
    setEditCourseDuration: (v: string) => void;
    editCourseCost: string;
    setEditCourseCost: (v: string) => void;
    editCourseCapacity: string;
    setEditCourseCapacity: (v: string) => void;
    editCourseStartDate: string;
    setEditCourseStartDate: (v: string) => void;
    editCourseCategory: string;
    setEditCourseCategory: (v: string) => void;
    editCourseDescription: string;
    setEditCourseDescription: (v: string) => void;
    handleUpdateCourse: (e: React.FormEvent) => void;
    handleToggleCourseStatus: (id: string) => void;
    handleDeleteCourse: (id: string) => void;
    handleCopyCourseUrl: (course: TutCourse) => void;
    handleExportSingleCourseExcel: (course: TutCourse) => void;
    // Pre-Registration (from usePreRegistration)
    registeringCourse: TutCourse | null;
    setRegisteringCourse: (c: TutCourse | null) => void;
    studentName: string;
    setStudentName: (v: string) => void;
    studentIdNum: string;
    setStudentIdNum: (v: string) => void;
    studentEmail: string;
    setStudentEmail: (v: string) => void;
    studentPhone: string;
    setStudentPhone: (v: string) => void;
    studentProvince: string;
    setStudentProvince: (v: string) => void;
    studentVoucherCode: string;
    setStudentVoucherCode: (v: string) => void;
    appliedVoucher: TutVoucher | null;
    voucherError: string | null;
    voucherDiscountAmount: number;
    selectedInstallments: number;
    setSelectedInstallments: (v: number) => void;
    simulatedDevice: 'desktop' | 'mobile';
    setSimulatedDevice: (v: 'desktop' | 'mobile') => void;
    simulatedReferrer: string;
    setSimulatedReferrer: (v: string) => void;
    selectedBank: string;
    setSelectedBank: (v: string) => void;
    refCodeInput: string;
    setRefCodeInput: (v: string) => void;
    uploadProgress: number;
    uploadFileName: string;
    isUploading: boolean;
    handleValidateVoucherCode: (code?: string, courseOverride?: TutCourse) => void;
    handleSimulateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmitPreRegister: (e: React.FormEvent) => void;
    cancelPreRegister: () => void;
    // Stats for banner
    totalEnrolledAllWorkshops: number;
    totalCapacityAllWorkshops: number;
    totalEstimatedRevenue: number;
    pendingReceiptCount: number;
    // Module title
    currentModuleTitle: () => string;
    // Search & filter
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    selectedCategory: string;
    setSelectedCategory: (v: string) => void;
    selectedCourseForDetail: TutCourse | null;
    setSelectedCourseForDetail: (c: TutCourse | null) => void;
    filteredCoursesForListing: TutCourse[];
    listPage: number;
    setListPage: (p: number) => void;
    listPerPage: number;
    // Course report
    selectedCourseReport: TutCourse | null;
    setSelectedCourseReport: (c: TutCourse | null) => void;
}

export default function TutsCourseList(props: TutsCourseListProps) {
    const {
        currentUserRole, courses, registrants, vouchers, categories, loadingCourses,
        toast, showToast,
        setIsCategoryModalOpen,
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
        handleUpdateCourse,
        handleToggleCourseStatus, handleDeleteCourse, handleCopyCourseUrl, handleExportSingleCourseExcel,
        registeringCourse, setRegisteringCourse,
        studentName, setStudentName, studentIdNum, setStudentIdNum,
        studentEmail, setStudentEmail, studentPhone, setStudentPhone,
        studentProvince, setStudentProvince,
        studentVoucherCode, setStudentVoucherCode,
        appliedVoucher, voucherError, voucherDiscountAmount,
        selectedInstallments, setSelectedInstallments,
        simulatedDevice, setSimulatedDevice,
        simulatedReferrer, setSimulatedReferrer,
        selectedBank, setSelectedBank,
        refCodeInput, setRefCodeInput,
        uploadProgress, uploadFileName, isUploading,
        handleValidateVoucherCode, handleSimulateUpload, handleSubmitPreRegister, cancelPreRegister,
        totalEnrolledAllWorkshops, totalCapacityAllWorkshops,
        totalEstimatedRevenue, pendingReceiptCount,
        currentModuleTitle,
        searchQuery, setSearchQuery, selectedCategory, setSelectedCategory,
        selectedCourseForDetail, setSelectedCourseForDetail,
        filteredCoursesForListing, listPage, setListPage, listPerPage,
        selectedCourseReport, setSelectedCourseReport,
    } = props;

    return (
        <div className="space-y-6">
            {/* Top filter utility block */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 dark:text-gray-500">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="جستجوی عنوان کارگاه مهارتی، نام مدرس یا سرفصل آموزشی..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setListPage(1); }}
                        className="w-full text-xs pr-10 pl-3.5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                    />
                </div>

                <div className="relative min-w-[220px]">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
                        <Filter className="w-4 h-4" />
                    </span>
                    <select
                        value={selectedCategory}
                        onChange={(e) => { setSelectedCategory(e.target.value); setListPage(1); }}
                        className="w-full text-xs pr-10 pl-3.5 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30 appearance-none font-sans"
                    >
                        <option value="">دپارتمان و گروه‌های درسی (همه)</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {currentUserRole === 'admin' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="px-5 py-3.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                            title="مدیریت گروه‌ها و دپارتمان‌ها"
                        >
                            <Layers className="w-4 h-4 text-teal-600" />
                            تعریف گروه‌ها
                        </button>
                        <button
                            onClick={() => setIsNewCourseModalOpen(true)}
                            className="px-5 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            تعریف کارگاه جدید
                        </button>
                    </div>
                )}
            </div>

            {/* Courses grid */}
            {loadingCourses ? (
                <LoadingSpinner text="در حال دریافت لیست دوره‌ها..." />
            ) : (
                <>
                    {(() => {
                        const totalPages = Math.max(1, Math.ceil(filteredCoursesForListing.length / listPerPage));
                        const safePage = Math.min(listPage, totalPages);
                        const paginatedCourses = filteredCoursesForListing.slice(
                            (safePage - 1) * listPerPage,
                            safePage * listPerPage
                        );
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedCourses.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-gray-400">
                                        هیچ کارگاه یا دوره آموزشی منطبق با فیلتر شما پیدا نشد.
                                    </div>
                                ) : (
                                    paginatedCourses.map((course) => {
                                        const isFull = course.enrolled >= course.capacity;
                                        const regPercent = (course.enrolled / course.capacity) * 100;
                                        return (
                                            <div
                                                key={course.id}
                                                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs hover:shadow-xl hover:border-teal-500/25 transition-all duration-300 flex flex-col justify-between group"
                                            >
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
                                                            <span>{toPersianDigits(course.duration)}</span>
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
                                                            <button
                                                                onClick={() => setSelectedCourseForDetail(course)}
                                                                className="px-4 py-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                                                            >
                                                                جزئیات سرفصل
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopyCourseUrl(course)}
                                                                className="p-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                                                title="کپی آدرس دوره"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Admin Controls Section */}
                                                {currentUserRole === 'admin' && (
                                                    <div className="mt-4 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 bg-gray-50/50 dark:bg-gray-950/40 p-2 rounded-2xl">
                                                        <span className="text-[10px] font-black text-teal-600 dark:text-teal-400">عملیات:</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCourse(course);
                                                                    setEditCourseTitle(course.title);
                                                                    setEditCourseLecturer(course.lecturer);
                                                                    setEditCourseDuration(course.duration);
                                                                    setEditCourseCost(course.cost.toString());
                                                                    setEditCourseCapacity(course.capacity.toString());
                                                                    setEditCourseStartDate(course.startDate);
                                                                    setEditCourseCategory(course.category);
                                                                    setEditCourseDescription(course.description);
                                                                }}
                                                                className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                                                                title="ویرایش دوره"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedCourseReport(course)}
                                                                className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                                                title="گزارش ثبت‌نام‌ها"
                                                            >
                                                                <BarChart2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleCourseStatus(course.id)}
                                                                className={`p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg transition-all cursor-pointer ${course.status === 'ended'
                                                                    ? 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                                                    : 'text-emerald-600 hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-950'
                                                                    }`}
                                                                title={course.status === 'ended' ? 'فعال کردن دوره' : 'غیرفعال (پایان دوره)'}
                                                            >
                                                                <Power className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleExportSingleCourseExcel(course)}
                                                                className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all cursor-pointer"
                                                                title="خروجی اکسل (CSV)"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleCopyCourseUrl(course)}
                                                                className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all cursor-pointer"
                                                                title="کپی آدرس دوره"
                                                            >
                                                                <Copy className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCourse(course.id)}
                                                                className="p-1.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                                                                title="حذف دوره"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        );
                    })()}

                    {/* Pagination Controls for Courses */}
                    {filteredCoursesForListing.length > listPerPage && (
                        <Pagination
                            currentPage={listPage}
                            totalItems={filteredCoursesForListing.length}
                            perPage={listPerPage}
                            onPageChange={setListPage}
                        />
                    )}
                </>
            )}

            {/* ===== Course Detail Drawer ===== */}
            <AnimatePresence>
                {selectedCourseForDetail && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setSelectedCourseForDetail(null)}
                                className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 block w-max mb-3">
                                {selectedCourseForDetail.category}
                            </span>
                            <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug mb-4">
                                {selectedCourseForDetail.title}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed text-justify mb-5 bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
                                {selectedCourseForDetail.description}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
                                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">مدرس و ارائه‌دهنده:</span>
                                    <span className="font-sans font-bold text-gray-800 dark:text-gray-200">{selectedCourseForDetail.lecturer}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">شهریه و ضریب مالی:</span>
                                    <span className="font-bold text-teal-600 dark:text-teal-400">{formatCurrency(selectedCourseForDetail.cost)}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">مدت زمان آموزش:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(selectedCourseForDetail.duration)}</span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-850">
                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-sans block mb-1">تاریخ شروع کلاسی:</span>
                                    <span className="font-bold text-gray-800 dark:text-gray-200">{toPersianDigits(selectedCourseForDetail.startDate)}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const course = selectedCourseForDetail;
                                    setSelectedCourseForDetail(null);
                                    setEditingCourse(course);
                                    setEditCourseTitle(course.title);
                                    setEditCourseLecturer(course.lecturer);
                                    setEditCourseDuration(course.duration);
                                    setEditCourseCost(course.cost.toString());
                                    setEditCourseCapacity(course.capacity.toString());
                                    setEditCourseStartDate(course.startDate);
                                    setEditCourseCategory(course.category);
                                    setEditCourseDescription(course.description);
                                }}
                                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer shadow-sm shadow-teal-600/15 flex items-center justify-center gap-1.5"
                            >
                                <Edit2 className="w-4 h-4" />
                                ویرایش مشخصات دوره
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== Pre-Registration Modal ===== */}
            <AnimatePresence>
                {registeringCourse && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                        >
                            <button
                                onClick={() => setRegisteringCourse(null)}
                                className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs mb-3">
                                <FileTextIcon className="w-4 h-4" />
                                <span>تکمیل فرآیند پیش‌ثبت‌نام و ارسال سند مالی</span>
                            </div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4">
                                ثبت‌نام در: {registeringCourse.title}
                            </h3>
                            <div className="mb-5 p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10 text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-justify">
                                جهت تایید نهایی پذیرش در این کارگاه آزاد، مقتضی است مبلغ <strong className="text-teal-600 font-black">{formatCurrency(registeringCourse.cost)}</strong> را به حساب شماره <strong className="font-black">{toPersianDigits('۰۱۱۲۳۴۵۶۷۸۹')}</strong> بانک ملی ایران به نام دانشگاه علم و هنر واریز نموده و مشخصات فیش شتابی را در زیر آپلود فرمایید.
                            </div>
                            <form onSubmit={handleSubmitPreRegister} className="space-y-4 text-right">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام و نام خانوادگی دانشجو</label>
                                        <input type="text" required value={studentName} onChange={(e) => setStudentName(e.target.value)}
                                            placeholder="مثال: مارال سالمی"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد ملی / دانشجویی</label>
                                        <input type="text" required value={studentIdNum} onChange={(e) => setStudentIdNum(e.target.value)}
                                            placeholder="مثال: ۴۰۲۱۵۱۴۰۱۵"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">آدرس ایمیل</label>
                                        <input type="email" required value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)}
                                            placeholder="student@example.com"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none text-left" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شماره موبایل</label>
                                        <input type="tel" required value={studentPhone} onChange={(e) => setStudentPhone(e.target.value)}
                                            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none text-left" />
                                    </div>
                                </div>

                                {/* Simulator fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">استان سکونت (تست Geo)</label>
                                        <select value={studentProvince} onChange={(e) => setStudentProvince(e.target.value)}
                                            className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none">
                                            <option value="تهران">تهران</option>
                                            <option value="خراسان رضوی">خراسان رضوی</option>
                                            <option value="یزد">یزد</option>
                                            <option value="فارس">فارس</option>
                                            <option value="اصفهان">اصفهان</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">دستگاه (تست فنی)</label>
                                        <select value={simulatedDevice} onChange={(e) => setSimulatedDevice(e.target.value as 'desktop' | 'mobile')}
                                            className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none">
                                            <option value="desktop">مرورگر دسکتاپ</option>
                                            <option value="mobile">اپلیکیشن موبایل</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-1">منبع ارجاع (UTM)</label>
                                        <select value={simulatedReferrer} onChange={(e) => setSimulatedReferrer(e.target.value)}
                                            className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none">
                                            <option value="">پیش‌فرض پورتال</option>
                                            <option value="blog">وبلاگ دانشگاه</option>
                                            <option value="instagram">اینستاگرام</option>
                                        </select>
                                    </div>
                                </div>

                                {/* VOUCHER FIELD */}
                                <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-500/15 rounded-2xl space-y-2.5">
                                    <label className="block text-xs font-extrabold text-indigo-900 dark:text-indigo-400">کد بن خرید یا تخفیف مهارتی</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={studentVoucherCode} onChange={(e) => setStudentVoucherCode(e.target.value)}
                                            placeholder="مثال: WELCOME_ONLINE یا YALDA1405"
                                            className="flex-1 text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none uppercase" />
                                        <button type="button" onClick={() => handleValidateVoucherCode()}
                                            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all">
                                            اعمال بن
                                        </button>
                                    </div>
                                    {voucherError && (
                                        <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-[10.5px] border border-rose-500/10 font-medium">
                                            ⚠ {voucherError}
                                        </div>
                                    )}
                                    {appliedVoucher && (
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-xl space-y-1">
                                            <div className="flex justify-between items-center text-[10.5px]">
                                                <span className="font-extrabold">✓ بن تخفیف با موفقیت اعمال شد:</span>
                                                <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-[9.5px] font-black">{appliedVoucher.code}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{appliedVoucher.title}</p>
                                            <div className="flex justify-between items-center text-xs font-black mt-2 pt-1.5 border-t border-emerald-500/10">
                                                <span>کاهش شهریه:</span>
                                                <span>-{formatCurrency(voucherDiscountAmount)}</span>
                                            </div>
                                            {appliedVoucher.allowInstallments && appliedVoucher.installmentCount && (
                                                <div className="mt-2.5 pt-2 border-t border-emerald-500/10 space-y-1 text-right">
                                                    <label className="block text-[10px] font-bold text-gray-400">گزینه پرداخت چندقسطی فعال شد:</label>
                                                    <select value={selectedInstallments} onChange={(e) => setSelectedInstallments(parseInt(e.target.value))}
                                                        className="w-full text-[10.5px] p-2 rounded-lg border border-emerald-500/20 bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-400 font-sans focus:outline-none appearance-none">
                                                        <option value={1}>پرداخت یکجا (نقدی)</option>
                                                        <option value={appliedVoucher.installmentCount}>
                                                            پرداخت اقساطی ({toPersianDigits(appliedVoucher.installmentCount)} قسطه - هر قسط {formatCurrency(Math.round((registeringCourse.cost - voucherDiscountAmount) / appliedVoucher.installmentCount))})
                                                        </option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!appliedVoucher && (
                                        <p className="text-[9.5px] text-gray-400">کدهای پیش‌فرض جهت تست: <code className="text-indigo-500 font-bold">WELCOME_ONLINE</code> (۳۰٪ تخفیف + اقساط) یا <code className="text-indigo-500 font-bold">YALDA1405</code> (۲۰٪ تخفیف) یا <code className="text-indigo-500 font-bold">FIRST_BUYER</code> (اولین خرید)</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد پیگیری شتابی (فیش)</label>
                                        <input type="text" required value={refCodeInput} onChange={(e) => setRefCodeInput(e.target.value)}
                                            placeholder="کد پیگیری ۶ الی ۱۰ رقمی"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">بانک مبدأ پرداخت</label>
                                        <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none">
                                            <option value="بانک ملی ایران">بانک ملی ایران</option>
                                            <option value="بانک ملت">بانک ملت</option>
                                            <option value="بانک سامان">بانک سامان</option>
                                            <option value="بانک تجارت">بانک تجارت</option>
                                            <option value="بانک قرض‌الحسنه رسالت">بانک قرض‌الحسنه رسالت</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">بارگذاری عکس یا PDF فیش پرداخت</label>
                                    <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-950/50 text-center relative hover:bg-gray-100/30 transition-all">
                                        <input type="file" accept="image/*,.pdf" onChange={handleSimulateUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <Upload className="w-6 h-6 mx-auto text-teal-600 dark:text-teal-400 mb-1.5" />
                                        <span className="text-[10.5px] text-gray-500 block">فایل فیش واریزی خود را به اینجا بکشید یا کلیک کنید</span>
                                        <span className="text-[8.5px] text-gray-400 block mt-0.5">فرمت‌های مجاز: JPG, PNG, PDF | حداکثر ۵ مگابایت</span>
                                        {isUploading && (
                                            <div className="mt-3">
                                                <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                                                    <div className="bg-teal-500 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                                                </div>
                                                <span className="text-[9px] text-teal-600 font-bold block mt-1">در حال بارگذاری فایل... {toPersianDigits(uploadProgress)}٪</span>
                                            </div>
                                        )}
                                        {!isUploading && uploadFileName && (
                                            <div className="mt-2 p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-[9.5px] flex items-center justify-center gap-1">
                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                <span>فایل بارگذاری شد: {uploadFileName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end gap-2.5">
                                    <button type="button" onClick={cancelPreRegister}
                                        className="px-4 py-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
                                        انصراف
                                    </button>
                                    <button type="submit"
                                        className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm">
                                        ثبت نهایی و ارسال فیش واریز (پرداخت {formatCurrency(Math.max(0, registeringCourse.cost - voucherDiscountAmount))})
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== New Course Creation Modal ===== */}
            <AnimatePresence>
                {isNewCourseModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                        >
                            <button onClick={() => setIsNewCourseModalOpen(false)}
                                className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4 flex items-center gap-1.5">
                                <Plus className="w-5 h-5 text-teal-600" />
                                تعریف و انتشار دوره آموزشی مهارتی جدید
                            </h3>
                            <form onSubmit={handleCreateNewCourse} className="space-y-4 text-right">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان کامل کارگاه آموزشی *</label>
                                    <input type="text" required value={newCourseTitle} onChange={(e) => setNewCourseTitle(e.target.value)}
                                        placeholder="مثال: کارگاه تخصصی پایتون در پردازش تصویر"
                                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">استاد / مدرس دوره *</label>
                                        <input type="text" required value={newCourseLecturer} onChange={(e) => setNewCourseLecturer(e.target.value)}
                                            placeholder="مثال: دکتر علیرضا صدقی"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">دپارتمان یا حوزه علمی</label>
                                        <select value={newCourseCategory} onChange={(e) => setNewCourseCategory(e.target.value)}
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none font-sans">
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">طول دوره (ساعت)</label>
                                        <input type="text" value={newCourseDuration} onChange={(e) => setNewCourseDuration(e.target.value)}
                                            placeholder="مثال: ۲۴ ساعت"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شهریه ثبت‌نام (ریال) *</label>
                                        <input type="text" required value={newCourseCost} onChange={(e) => setNewCourseCost(formatCostInput(e.target.value))}
                                            placeholder="مثال: ۴,۵۰۰,۰۰۰"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش (نفر)</label>
                                        <input type="number" value={newCourseCapacity} onChange={(e) => setNewCourseCapacity(e.target.value)}
                                            placeholder="مثال: ۳۰"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع دوره</label>
                                        <JalaliDatepicker value={newCourseStartDate} onChange={setNewCourseStartDate} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات و سرفصل تفصیلی</label>
                                    <textarea value={newCourseDescription} onChange={(e) => setNewCourseDescription(e.target.value)}
                                        placeholder="سرفصل‌های آموزشی، پیشنیازها و اهداف دوره..." rows={3}
                                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none resize-none font-sans"></textarea>
                                </div>
                                <div className="pt-4 flex justify-end gap-2.5">
                                    <button type="button" onClick={() => setIsNewCourseModalOpen(false)}
                                        className="px-4 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
                                        انصراف
                                    </button>
                                    <button type="submit"
                                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm">
                                        تعریف و انتشار رسمی دوره
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== Edit Course Modal ===== */}
            <AnimatePresence>
                {editingCourse && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                        >
                            <button onClick={() => setEditingCourse(null)}
                                className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4 flex items-center gap-1.5">
                                <Edit2 className="w-5 h-5 text-teal-600" />
                                ویرایش مشخصات دوره کارگاهی / آموزشی
                            </h3>
                            <form onSubmit={handleUpdateCourse} className="space-y-4 text-right">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">عنوان کامل کارگاه آموزشی *</label>
                                    <input type="text" required value={editCourseTitle} onChange={(e) => setEditCourseTitle(e.target.value)}
                                        placeholder="مثال: کارگاه تخصصی پایتون در پردازش تصویر"
                                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">استاد / مدرس دوره *</label>
                                        <input type="text" required value={editCourseLecturer} onChange={(e) => setEditCourseLecturer(e.target.value)}
                                            placeholder="مثال: دکتر علیرضا صدقی"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">دپارتمان یا حوزه علمی</label>
                                        <select value={editCourseCategory} onChange={(e) => setEditCourseCategory(e.target.value)}
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none font-sans">
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">طول دوره (ساعت)</label>
                                        <input type="text" value={editCourseDuration} onChange={(e) => setEditCourseDuration(e.target.value)}
                                            placeholder="مثال: ۲۴ ساعت"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شهریه ثبت‌نام (ریال) *</label>
                                        <input type="text" required value={editCourseCost} onChange={(e) => setEditCourseCost(formatCostInput(e.target.value))}
                                            placeholder="مثال: ۴,۵۰۰,۰۰۰"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">ظرفیت پذیرش (نفر)</label>
                                        <input type="number" value={editCourseCapacity} onChange={(e) => setEditCourseCapacity(e.target.value)}
                                            placeholder="مثال: ۳۰"
                                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">تاریخ شروع دوره</label>
                                        <JalaliDatepicker value={editCourseStartDate} onChange={setEditCourseStartDate} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">توضیحات و سرفصل تفصیلی</label>
                                    <textarea value={editCourseDescription} onChange={(e) => setEditCourseDescription(e.target.value)}
                                        placeholder="سرفصل‌های آموزشی، پیشنیازها و اهداف دوره..." rows={3}
                                        className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none resize-none font-sans"></textarea>
                                </div>
                                <div className="pt-4 flex justify-end gap-2.5">
                                    <button type="button" onClick={() => setEditingCourse(null)}
                                        className="px-4 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
                                        انصراف
                                    </button>
                                    <button type="submit"
                                        className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm">
                                        ذخیره و بروزرسانی دوره
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== Course Report Modal ===== */}
            <AnimatePresence>
                {selectedCourseReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 15 }}
                            className="w-full max-w-4xl p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
                        >
                            <button onClick={() => setSelectedCourseReport(null)}
                                className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug mb-2 flex items-center gap-1.5">
                                <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                آمار و جزئیات پیش‌ثبت‌نام دوره: {selectedCourseReport.title}
                            </h3>
                            <p className="text-xs text-gray-400 mb-6">مدرس: {selectedCourseReport.lecturer} | دپارتمان: {selectedCourseReport.category}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                                    <span className="text-[10px] text-gray-400 block font-bold mb-1">کل پیش‌ثبت‌نام‌ها</span>
                                    <span className="text-base font-black text-gray-900 dark:text-white">
                                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id).length)} نفر
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                                    <span className="text-[10px] text-gray-400 block font-bold mb-1">تایید شده نهایی</span>
                                    <span className="text-base font-black text-emerald-600">
                                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified').length)} نفر
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                                    <span className="text-[10px] text-gray-400 block font-bold mb-1">در انتظار بررسی</span>
                                    <span className="text-base font-black text-amber-500">
                                        {toPersianDigits(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'pending').length)} نفر
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                                    <span className="text-[10px] text-gray-400 block font-bold mb-1">درآمد کل دوره (تایید شده)</span>
                                    <span className="text-base font-black text-teal-600 dark:text-teal-400">
                                        {formatCurrency(registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified').reduce((sum, r) => sum + r.amount, 0))}
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-950 mb-6">
                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                    <table className="w-full text-right text-xs">
                                        <thead className="sticky top-0 z-10">
                                            <tr className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 font-bold border-b border-gray-150 dark:border-gray-850">
                                                <th className="p-2 text-center w-10">ردیف</th>
                                                <th className="p-2 whitespace-nowrap">کد ملی</th>
                                                <th className="p-2 whitespace-nowrap">نام و نام خانوادگی</th>
                                                <th className="p-2 whitespace-nowrap">شماره دانشجویی</th>
                                                <th className="p-2 whitespace-nowrap">موبایل</th>
                                                <th className="p-2 whitespace-nowrap">نوع کاربر</th>
                                                <th className="p-2 whitespace-nowrap">تاریخ ثبت نام</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                                            {(() => {
                                                const courseRegs = registrants.filter(r => r.courseId === selectedCourseReport.id && r.status === 'verified');
                                                return courseRegs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={7} className="p-8 text-center text-gray-400">
                                                            تاکنون هیچ سندی برای پیش‌ثبت‌نام این کارگاه مهارتی آپلود نگردیده است.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    courseRegs.map((reg, idx) => (
                                                        <tr key={reg.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-all">
                                                            <td className="p-2 text-center font-bold text-gray-400 w-10">{toPersianDigits(idx + 1)}</td>
                                                            <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{toPersianDigits(reg.nationalCode)}</td>
                                                            <td className="p-2 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">{reg.name}</td>
                                                            <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{toPersianDigits(reg.studentCode)}</td>
                                                            <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap" dir="ltr">{toPersianDigits(reg.mobile)}</td>
                                                            <td className="p-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{reg.typeText}</td>
                                                            <td className="p-2 text-gray-500 whitespace-nowrap">{toPersianDigits(reg.date)}</td>
                                                        </tr>
                                                    ))
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button onClick={() => handleExportSingleCourseExcel(selectedCourseReport)}
                                    disabled={registrants.filter(r => r.courseId === selectedCourseReport.id).length === 0}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                                    <Download className="w-4 h-4" />
                                    خروجی اکسل پیش‌ثبت‌نام‌ها
                                </button>
                                <button type="button" onClick={() => setSelectedCourseReport(null)}
                                    className="px-5 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer">
                                    بستن گزارش
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
