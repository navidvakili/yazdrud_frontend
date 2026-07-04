// ============================================================
// TutsModule — Reports (Registrants Report List with Filters)
// ============================================================

import { useMemo } from 'react';
import { Search, FileText, RotateCcw, CheckCircle2, CreditCard, Landmark, PiggyBank } from 'lucide-react';
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
    reportYear: string;
    setReportYear: (v: string) => void;
    reportRefundedFilter: 'show' | 'hide' | 'only';
    setReportRefundedFilter: (v: 'show' | 'hide' | 'only') => void;
    reportPage: number;
    setReportPage: (p: number) => void;
    reportPerPage: number;
    reportTotal?: number;
    reportStats: { total_confirmed: number; online_paid: number; bank_verified: number; total_amount: number } | null;
    filteredRegistrants: TutRegistrant[];
    handleExportExcel: () => void;
    onRefundRequest: (reg: TutRegistrant) => void;
    onUndoRefund: (reg: TutRegistrant) => void;
}

export default function TutsReports(props: TutsReportsProps) {
    const {
        courses, loadingRegistrants,
        reportSearch, setReportSearch,
        reportCourseFilter, setReportCourseFilter,
        reportYear, setReportYear,
        reportRefundedFilter, setReportRefundedFilter,
        reportPage, setReportPage, reportPerPage, reportTotal = 0,
        reportStats,
        filteredRegistrants,
        handleExportExcel, onRefundRequest, onUndoRefund,
    } = props;

    // Generate year options dynamically: from 1400 to current Jalali year
    const currentJalaliYear = new Date().getFullYear() - 621;
    const yearOptions = useMemo(() => {
        const years: string[] = [];
        for (let y = 1400; y <= currentJalaliYear; y++) {
            years.push(String(y));
        }
        return years;
    }, []);

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
                        value={reportYear}
                        onChange={(e) => { setReportYear(e.target.value); setReportPage(1); }}
                        className="w-full text-xs px-3.5 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none"
                    >
                        <option value="">همه سال‌ها</option>
                        {yearOptions.map(y => (
                            <option key={y} value={y}>{toPersianDigits(y)}</option>
                        ))}
                    </select>

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

                    {/* Refunded filter toggle */}
                    <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shrink-0">
                        <button
                            onClick={() => { setReportRefundedFilter('show'); setReportPage(1); }}
                            className={`px-3 py-3 text-[11px] font-extrabold transition-all cursor-pointer ${
                                reportRefundedFilter === 'show'
                                    ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            همه
                        </button>
                        <button
                            onClick={() => { setReportRefundedFilter('hide'); setReportPage(1); }}
                            className={`px-3 py-3 text-[11px] font-extrabold transition-all cursor-pointer ${
                                reportRefundedFilter === 'hide'
                                    ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            مستردد نشده
                        </button>
                        <button
                            onClick={() => { setReportRefundedFilter('only'); setReportPage(1); }}
                            className={`px-3 py-3 text-[11px] font-extrabold transition-all cursor-pointer ${
                                reportRefundedFilter === 'only'
                                    ? 'bg-rose-700 dark:bg-rose-400 text-white'
                                    : 'bg-white dark:bg-gray-900 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            }`}
                        >
                            مستردد شده
                        </button>
                    </div>

                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 border border-indigo-500/15 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer w-full sm:w-auto"
                    >
                        <FileText className="w-4 h-4" />
                        خروجی اکسل
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {reportStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-500/70 uppercase tracking-wider">تایید شده</p>
                            <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{toPersianDigits(reportStats.total_confirmed)}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-600/70 dark:text-blue-500/70 uppercase tracking-wider">پرداخت آنلاین</p>
                            <p className="text-lg font-extrabold text-blue-700 dark:text-blue-300">{toPersianDigits(reportStats.online_paid)}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                            <Landmark className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider">فیش بانکی</p>
                            <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300">{toPersianDigits(reportStats.bank_verified)}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200/60 dark:border-purple-800/40 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                            <PiggyBank className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-purple-600/70 dark:text-purple-500/70 uppercase tracking-wider">مجموع مبلغ</p>
                            <p className="text-sm font-extrabold text-purple-700 dark:text-purple-300">{formatCurrency(reportStats.total_amount)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Table Container */}
            {loadingRegistrants ? (
                <LoadingSpinner text="در حال دریافت گزارش ثبت‌نام‌ها..." />
            ) : (
                <>
                    {(() => {
                        // Server-side pagination (reportTotal > 0): data is already one page
                        // Client-side pagination (reportTotal === 0): slice the full array
                        const isServerPaginated = reportTotal > 0;
                        const totalPages = isServerPaginated
                            ? Math.max(1, Math.ceil(reportTotal / reportPerPage))
                            : Math.max(1, Math.ceil(filteredRegistrants.length / reportPerPage));
                        const safePage = Math.min(reportPage, totalPages);
                        const displayData = isServerPaginated
                            ? filteredRegistrants
                            : filteredRegistrants.slice(
                                (safePage - 1) * reportPerPage,
                                safePage * reportPerPage
                            );
                        return (
                            <div className="overflow-x-auto rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
                                <table className="w-full text-right text-xs">
                                    <thead>
                                        <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-400 dark:text-gray-500 font-extrabold">
                                            <th className="p-2 text-center w-10">ردیف</th>
                                            <th className="p-2">کد فراگیر</th>
                                            <th className="p-2">کد ملی</th>
                                            <th className="p-2">نام و نام خانوادگی</th>
                                            <th className="p-2">شماره دانشجویی</th>
                                            <th className="p-2">موبایل</th>
                                            <th className="p-2">دوره آموزشی</th>
                                            <th className="p-2 text-left">مبلغ (ریال)</th>
                                            <th className="p-2">شماره پیگیری</th>
                                            <th className="p-2">تاریخ ثبت نام</th>
                                            <th className="p-2 text-center w-20">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
                                        {displayData.length === 0 ? (
                                            <tr>
                                                <td colSpan={11} className="p-12 text-center text-gray-400">
                                                    هیچ پرونده ثبتی یا آماری مطابق با فیلتر شما ثبت نشده است.
                                                </td>
                                            </tr>
                                        ) : (
                                            displayData.map((reg, idx) => {
                                                const globalIdx = (safePage - 1) * reportPerPage + idx + 1;
                                                return (
                                                    <tr key={reg.id} className={`hover:bg-gray-55/40 dark:hover:bg-gray-850/10 transition-colors ${reg.status === 'refunded' ? 'line-through opacity-60' : ''}`}>
                                                        <td className="p-2 text-center font-bold text-gray-400 w-10">{toPersianDigits(globalIdx)}</td>
                                                        <td className="p-2 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap" dir="ltr">{reg.enrollmentCode ? toPersianDigits(reg.enrollmentCode) : '—'}</td>
                                                        <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{toPersianDigits(reg.nationalCode)}</td>
                                                        <td className="p-2 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">{reg.name}</td>
                                                        <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{toPersianDigits(reg.studentCode)}</td>
                                                        <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap" dir="ltr">{toPersianDigits(reg.mobile)}</td>
                                                        <td className="p-2 text-gray-700 dark:text-gray-300 font-medium max-w-[180px] truncate" title={reg.courseTitle}>{reg.courseTitle}</td>
                                                        <td className="p-2 font-bold text-emerald-600 dark:text-emerald-400 text-left whitespace-nowrap">{formatCurrency(reg.amount)}</td>
                                                        <td className="p-2 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap" dir="ltr">{reg.trackingCode ? toPersianDigits(reg.trackingCode) : '—'}</td>
                                                        <td className="p-2 text-gray-500 whitespace-nowrap text-center">
                                                            {(() => {
                                                                const parts = reg.date.split(' ');
                                                                return <>
                                                                    <span className="block">{toPersianDigits(parts[0] || '')}</span>
                                                                    {parts[1] && <span className="block text-[10px] text-gray-400 mt-0.5">{toPersianDigits(parts[1])}</span>}
                                                                </>;
                                                            })()}
                                                        </td>
                                                        <td className="p-2 text-center whitespace-nowrap">
                                                            {reg.status === 'verified' && (
                                                                <button
                                                                    onClick={() => onRefundRequest(reg)}
                                                                    className="px-2 py-1 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 border border-orange-300/30 text-orange-600 dark:text-orange-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                                                >
                                                                    <RotateCcw className="w-3 h-3" />
                                                                    مستردد
                                                                </button>
                                                            )}
                                                            {reg.status === 'refunded' && (
                                                                <button
                                                                    onClick={() => onUndoRefund(reg)}
                                                                    className="px-2 py-1 bg-teal-50 dark:bg-teal-950/30 hover:bg-teal-100/50 dark:hover:bg-teal-900/30 border border-teal-300/30 text-teal-600 dark:text-teal-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                                                >
                                                                    <RotateCcw className="w-3 h-3" />
                                                                    لغو مستردد
                                                                </button>
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

                    {(reportTotal > 0 ? reportTotal : filteredRegistrants.length) > reportPerPage && (
                        <Pagination
                            currentPage={reportPage}
                            totalItems={reportTotal > 0 ? reportTotal : filteredRegistrants.length}
                            perPage={reportPerPage}
                            onPageChange={setReportPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}
