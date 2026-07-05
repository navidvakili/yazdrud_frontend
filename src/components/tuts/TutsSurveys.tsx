// ============================================================
// TutsModule — Surveys (Survey List, Filters & Detail Modal)
// ============================================================
// Rewritten based on old portal (E:\wamp64\www\portal) course survey
// web services: GET /api/surveys, GET /api/surveys/{id}, DELETE /api/surveys/{id}
// Database fields: first_name, last_name, phone_number, rating,
//   suggestions (دوره‌های پیشنهادی), comment (توضیحات), course_id, course_title
// ============================================================

import { useState, useMemo } from 'react';
import { Eye, Phone, Clock, Star, X, MessageCircle, Lightbulb, Globe, MessageSquare, Calendar } from 'lucide-react';
import { toPersianDigits, toPersianDateString, toJalaliYearMonth } from './tuts-utils';

// --- Local interface matching the mapped survey data from TutsModule ---
interface SurveyItem {
    id: number;
    firstName: string;
    lastName: string;
    userName: string;
    userPhone: string;
    ipAddress: string;
    date: string;
    courseTitle: string;
    rating: number;
    comment: string;
    suggestions: string;
}

interface TutsSurveysProps {
    currentUserRole: string;
    individualSurveys: SurveyItem[];
    loadingSurveys: boolean;
    selectedSurveyDetails: SurveyItem | null;
    setSelectedSurveyDetails: (v: SurveyItem | null) => void;
}

export default function TutsSurveys(props: TutsSurveysProps) {
    const {
        currentUserRole, individualSurveys, loadingSurveys,
        selectedSurveyDetails, setSelectedSurveyDetails,
    } = props;

    // Sort by date descending (newest first)
    const sortedSurveys = [...individualSurveys].sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return b.date.localeCompare(a.date);
    });

    // Compute survey statistics from Jalali dates
    const stats = useMemo(() => {
        const total = individualSurveys.length;
        const byYear: Record<string, number> = {};
        const byMonth: Record<string, number> = {};

        individualSurveys.forEach(s => {
            const jalali = toJalaliYearMonth(s.date);
            if (jalali) {
                const yearMonth = `${jalali.year}/${jalali.month}`;
                byYear[jalali.year] = (byYear[jalali.year] || 0) + 1;
                byMonth[yearMonth] = (byMonth[yearMonth] || 0) + 1;
            }
        });

        // Sort years descending, limit to last 5
        const sortedYears = Object.entries(byYear)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 5)
            .map(([year, count]) => ({ year, count }));

        // Sort months descending, limit to last 6
        const sortedMonths = Object.entries(byMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 6)
            .map(([ym, count]) => {
                const [y, m] = ym.split('/');
                return { year: y, month: m, label: `${y}/${m}`, count };
            });

        return { total, sortedYears, sortedMonths };
    }, [individualSurveys]);

    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(sortedSurveys.length / itemsPerPage));
    const [page, setPage] = useState(1);
    const paginatedSurveys = sortedSurveys.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {!loadingSurveys && stats.total > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total surveys */}
                    <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/15 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-[10px] font-black text-pink-500 block">کل نظرات ثبت شده</span>
                            <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">{toPersianDigits(stats.total)} نظر</span>
                        </div>
                        <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl"><MessageSquare className="w-5 h-5 text-pink-500" /></div>
                    </div>

                    {/* Last 6 months — show the most recent month first */}
                    {stats.sortedMonths.slice(0, 3).map(m => (
                        <div key={m.label} className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/15 rounded-2xl flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-[10px] font-black text-purple-500 block">{toPersianDigits(m.label)}</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">{toPersianDigits(m.count)} نظر</span>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl"><Calendar className="w-5 h-5 text-purple-500" /></div>
                        </div>
                    ))}

                    {/* Yearly — show the most recent year first */}
                    {stats.sortedYears.slice(0, 1).map(y => (
                        <div key={y.year} className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/15 rounded-2xl flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-[10px] font-black text-indigo-500 block">سال {toPersianDigits(y.year)}</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">{toPersianDigits(y.count)} نظر</span>
                            </div>
                            <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl"><Calendar className="w-5 h-5 text-indigo-500" /></div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs overflow-hidden">
                {loadingSurveys ? (
                    <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری نظرات...</div>
                ) : paginatedSurveys.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">هیچ نظری یافت نشد.</div>
                ) : (
                    <table className="w-full text-right text-xs">
                        <thead>
                            <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-850 text-gray-400 dark:text-gray-500 font-extrabold">
                                <th className="p-3.5">نام و نام خانوادگی</th>
                                <th className="p-3.5 text-right">شماره همراه</th>
                                <th className="p-3.5 text-center">تاریخ ثبت</th>
                                <th className="p-3.5 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                            {paginatedSurveys.map(s => (
                                <tr key={s.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-950/40 transition-colors">
                                    <td className="p-3.5">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 block">{s.userName}</span>
                                    </td>
                                    <td className="p-3.5">
                                        <span className="text-[10px] text-gray-400 font-bold" dir="ltr">{toPersianDigits(s.userPhone)}</span>
                                    </td>
                                    <td className="p-3.5 text-center text-gray-500">
                                        <span className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" />{toPersianDigits(toPersianDateString(s.date))}</span>
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <button onClick={() => setSelectedSurveyDetails(s)}
                                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer mx-auto">
                                            <Eye className="w-3 h-3" />مشاهده
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loadingSurveys && sortedSurveys.length > itemsPerPage && (
                    <div className="flex justify-between items-center p-3.5 border-t border-gray-100 dark:border-gray-850 bg-gray-55/50 dark:bg-gray-950/50">
                        <span className="text-[10px] text-gray-400">{toPersianDigits(sortedSurveys.length)} نظر یافت شد.</span>
                        <div className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${page <= 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                                قبلی
                            </button>
                            <span className="text-[10px] text-gray-500 px-2">{toPersianDigits(page)} از {toPersianDigits(totalPages)}</span>
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${page >= totalPages ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                                بعدی
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Survey Detail Modal — styled like receipt card (old portal elements) */}
            {selectedSurveyDetails && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedSurveyDetails(null)}>
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] space-y-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white">جزئیات نظرسنجی</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">شناسه نظر: {toPersianDigits(selectedSurveyDetails.id)}</p>
                            </div>
                            <button onClick={() => setSelectedSurveyDetails(null)}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Receipt-style info card */}
                        <div className="border border-indigo-500/15 rounded-3xl bg-gradient-to-br from-indigo-50/25 to-white dark:from-indigo-950/10 dark:to-gray-950 p-5 shadow-xs space-y-3">
                            {/* First name + Last name (grid) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 block mb-1">نام</span>
                                    <span className="text-xs font-black text-gray-900 dark:text-white">{selectedSurveyDetails.firstName || '---'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 block mb-1">نام خانوادگی</span>
                                    <span className="text-xs font-black text-gray-900 dark:text-white">{selectedSurveyDetails.lastName || '---'}</span>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-800" />

                            {/* Phone — tel link */}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" /> شماره همراه</span>
                                <a href={`tel:${selectedSurveyDetails.userPhone}`}
                                    className="text-xs font-black text-blue-600 dark:text-blue-400 underline underline-offset-2" dir="ltr">
                                    {toPersianDigits(selectedSurveyDetails.userPhone)}
                                </a>
                            </div>

                            {/* Date */}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> تاریخ ثبت</span>
                                <span className="text-xs font-black text-gray-900 dark:text-white">{toPersianDigits(toPersianDateString(selectedSurveyDetails.date))}</span>
                            </div>

                            {/* IP Address */}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1"><Globe className="w-3 h-3" /> آدرس IP</span>
                                <code className="text-[11px] font-black text-gray-900 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                    {selectedSurveyDetails.ipAddress || '---'}
                                </code>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-gray-800" />

                            {/* Course */}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400">دوره / کارگاه</span>
                                <span className="text-xs font-black text-gray-900 dark:text-white">{selectedSurveyDetails.courseTitle}</span>
                            </div>

                            {/* Rating */}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400"><Star className="w-3 h-3 inline -mt-0.5" /> امتیاز</span>
                                <span className={`text-xs font-black ${selectedSurveyDetails.rating >= 4 ? 'text-emerald-600 dark:text-emerald-400' :
                                    selectedSurveyDetails.rating >= 3 ? 'text-amber-600 dark:text-amber-400' :
                                        'text-rose-600 dark:text-rose-400'}`}>
                                    {toPersianDigits(selectedSurveyDetails.rating)} از ۵
                                </span>
                            </div>
                        </div>

                        {/* Suggestions box (amber/warning) — like old portal */}
                        {selectedSurveyDetails.suggestions && (
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl">
                                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 mb-2">
                                    <Lightbulb className="w-3.5 h-3.5" /> پیشنهادات و نظرات
                                </span>
                                <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed whitespace-pre-line">{selectedSurveyDetails.suggestions}</p>
                            </div>
                        )}

                        {/* Comment box (blue/info) — like old portal */}
                        {selectedSurveyDetails.comment && (
                            <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 p-4 rounded-2xl">
                                <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 flex items-center gap-1 mb-2">
                                    <MessageCircle className="w-3.5 h-3.5" /> توضیحات اضافی
                                </span>
                                <p className="text-xs font-medium text-sky-800 dark:text-sky-300 leading-relaxed whitespace-pre-line">{selectedSurveyDetails.comment}</p>
                            </div>
                        )}

                        {/* Close button */}
                        <button onClick={() => setSelectedSurveyDetails(null)}
                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 rounded-2xl text-xs font-bold text-gray-500 cursor-pointer">
                            بستن
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
