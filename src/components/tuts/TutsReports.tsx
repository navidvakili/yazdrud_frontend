// ============================================================
// TutsModule — Reports (Registrants Report List with Filters)
// ============================================================

import { Search, FileText } from 'lucide-react';
import type { TutCourse, TutRegistrant } from './tuts-types';
import { toPersianDigits, formatCurrency } from './tuts-utils';
import { LoadingSpinner } from './tuts-components';
import Pagination from '../Pagination';

interface TutsReportsProps {
    courses: TutCourse[];
    loadingRegistrants: boolean;
    reportSearch: string;
    setReportSearch: (v: string) => void;
    reportCourseFilter: string;
    setReportCourseFilter: (v: string) => void;
    reportStatusFilter: string;
    setReportStatusFilter: (v: string) => void;
    reportPage: number;
    setReportPage: (p: number) => void;
    reportPerPage: number;
    filteredRegistrants: TutRegistrant[];
    handleExportSimulate: () => void;
}

export default function TutsReports(props: TutsReportsProps) {
    const {
        courses, loadingRegistrants,
        reportSearch, setReportSearch,
        reportCourseFilter, setReportCourseFilter,
        reportStatusFilter, setReportStatusFilter,
        reportPage, setReportPage, reportPerPage,
        filteredRegistrants,
        handleExportSimulate,
    } = props;

    return (
        <div className="space-y-5">
            {/* Filters Area */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80">
                <div className="relative flex-1 w-full">
                    <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="جستجو با نام، کد ملی، موبایل، شماره دانشجویی، کد پیگیری..."
                        value={reportSearch}
                        onChange={(e) => { setReportSearch(e.target.value); setReportPage(1); }}
                        className="w-full text-xs pr-10 pl-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                    />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full xl:w-auto">
                    <select
                        value={reportCourseFilter}
                        onChange={(e) => { setReportCourseFilter(e.target.value); setReportPage(1); }}
                        className="w-full text-xs px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                    >
                        <option value="">فیلتر کارگاه‌های مهارتی</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>

                    <select
                        value={reportStatusFilter}
                        onChange={(e) => { setReportStatusFilter(e.target.value); setReportPage(1); }}
                        className="w-full text-xs px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                    >
                        <option value="">فیلتر وضعیت سند مالی</option>
                        <option value="pending">در انتظار تایید</option>
                        <option value="verified">تایید نهایی شده</option>
                        <option value="rejected">رد شده</option>
                    </select>

                    <button
                        onClick={handleExportSimulate}
                        className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 border border-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer w-full sm:w-auto"
                    >
                        <FileText className="w-4 h-4" />
                        خروجی اکسل
                    </button>
                </div>
            </div>

            {/* Table Container */}
            {loadingRegistrants ? (
                <LoadingSpinner text="در حال دریافت گزارش ثبت‌نام‌ها..." />
            ) : (
                <>
                    {(() => {
                        const totalPages = Math.max(1, Math.ceil(filteredRegistrants.length / reportPerPage));
                        const safePage = Math.min(reportPage, totalPages);
                        const paginatedRegistrants = filteredRegistrants.slice(
                            (safePage - 1) * reportPerPage,
                            safePage * reportPerPage
                        );
                        return (
                            <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
                                <table className="w-full text-right text-xs">
                                    <thead>
                                        <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 font-extrabold">
                                            <th className="p-2 text-center w-10">ردیف</th>
                                            <th className="p-2">کد ملی</th>
                                            <th className="p-2">نام و نام خانوادگی</th>
                                            <th className="p-2">شماره دانشجویی</th>
                                            <th className="p-2">موبایل</th>
                                            <th className="p-2">نوع کاربر</th>
                                            <th className="p-2">دوره آموزشی</th>
                                            <th className="p-2 text-left">مبلغ (ریال)</th>
                                            <th className="p-2">نوع پرداخت</th>
                                            <th className="p-2">شماره پیگیری</th>
                                            <th className="p-2">تاریخ ثبت نام</th>
                                            <th className="p-2">تاریخ تایید</th>
                                            <th className="p-2 text-center">وضعیت</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                                        {paginatedRegistrants.length === 0 ? (
                                            <tr>
                                                <td colSpan={13} className="p-12 text-center text-gray-400">
                                                    هیچ پرونده ثبتی یا آماری مطابق با فیلتر شما ثبت نشده است.
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedRegistrants.map((reg, idx) => {
                                                const globalIdx = (safePage - 1) * reportPerPage + idx + 1;
                                                const isVerified = reg.status === 'verified';
                                                return (
                                                    <tr key={reg.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-850/10 transition-colors">
                                                        <td className="p-2 text-center font-bold text-gray-400 w-10">{toPersianDigits(globalIdx)}</td>
                                                        <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{toPersianDigits(reg.nationalCode)}</td>
                                                        <td className="p-2 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">{reg.name}</td>
                                                        <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{toPersianDigits(reg.studentCode)}</td>
                                                        <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap" dir="ltr">{toPersianDigits(reg.mobile)}</td>
                                                        <td className="p-2 text-gray-700 dark:text-gray-300">{reg.typeText}</td>
                                                        <td className="p-2 text-gray-700 dark:text-gray-300 font-medium max-w-[180px] truncate" title={reg.courseTitle}>{reg.courseTitle}</td>
                                                        <td className="p-2 font-bold text-emerald-600 dark:text-emerald-400 text-left whitespace-nowrap">{formatCurrency(reg.amount)}</td>
                                                        <td className="p-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{reg.paymentMethod}</td>
                                                        <td className="p-2 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap" dir="ltr">{reg.trackingCode ? toPersianDigits(reg.trackingCode) : '—'}</td>
                                                        <td className="p-2 text-gray-500 whitespace-nowrap">{toPersianDigits(reg.date)}</td>
                                                        <td className="p-2 text-gray-500 whitespace-nowrap">{reg.verifiedAt ? toPersianDigits(reg.verifiedAt.split(' ')[0].replace(/-/g, '/')) : '—'}</td>
                                                        <td className="p-2 text-center whitespace-nowrap">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${reg.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                                reg.status === 'rejected' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                                                    'bg-amber-500/10 text-amber-600'}`}>
                                                                {reg.status === 'verified' ? 'تایید نهایی شده' :
                                                                    reg.status === 'rejected' ? 'فیش رد شده' : 'در انتظار بررسی'}
                                                            </span>
                                                            {reg.status === 'rejected' && reg.rejectionReason && (
                                                                <div className="text-[9px] text-rose-500 mt-1 max-w-[150px] mx-auto truncate" title={reg.rejectionReason}>
                                                                    علت: {reg.rejectionReason}
                                                                </div>
                                                            )}
                                                        </td>

                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}

                    {filteredRegistrants.length > reportPerPage && (
                        <Pagination
                            currentPage={reportPage}
                            totalItems={filteredRegistrants.length}
                            perPage={reportPerPage}
                            onPageChange={setReportPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}
