// ============================================================
// TutsModule — Surveys (Survey List, Filters & Detail Modal)
// ============================================================

import { MessageSquare, Eye, Phone, BarChart2, Download, Clock, Star, X, Search, Filter } from 'lucide-react';
import type { TutCourse, TutSurvey } from './tuts-types';
import { toPersianDigits } from './tuts-utils';

interface TutsSurveysProps {
    currentUserRole: string;
    individualSurveys: TutSurvey[];
    loadingSurveys: boolean;
    surveySearch: string;
    setSurveySearch: (v: string) => void;
    surveyFromDate: string;
    setSurveyFromDate: (v: string) => void;
    surveyToDate: string;
    setSurveyToDate: (v: string) => void;
    surveyPage: number;
    setSurveyPage: (v: number) => void;
    selectedSurveyDetails: TutSurvey | null;
    setSelectedSurveyDetails: (v: TutSurvey | null) => void;
    onOpenTab: (moduleId: string) => void;
    courses: TutCourse[];
}

export default function TutsSurveys(props: TutsSurveysProps) {
    const {
        currentUserRole, individualSurveys, loadingSurveys,
        surveySearch, setSurveySearch,
        surveyFromDate, setSurveyFromDate,
        surveyToDate, setSurveyToDate,
        surveyPage, setSurveyPage,
        selectedSurveyDetails, setSelectedSurveyDetails,
        onOpenTab, courses,
    } = props;

    const surveysPerPage = 10;
    const totalSurveyCount = individualSurveys.length;

    const filteredSurveys = individualSurveys.filter(s => {
        const matchesSearch = !surveySearch.trim() ||
            s.userName.includes(surveySearch.trim()) ||
            s.courseTitle.includes(surveySearch.trim()) ||
            s.userPhone.includes(surveySearch.trim());
        const matchesFromDate = !surveyFromDate || s.date >= surveyFromDate;
        const matchesToDate = !surveyToDate || s.date <= surveyToDate;
        return matchesSearch && matchesFromDate && matchesToDate;
    });

    const totalPages = Math.max(1, Math.ceil(filteredSurveys.length / surveysPerPage));
    const paginatedSurveys = filteredSurveys.slice((surveyPage - 1) * surveysPerPage, surveyPage * surveysPerPage);

    const avgRating = individualSurveys.length > 0
        ? (individualSurveys.reduce((sum, s) => sum + s.rating, 0) / individualSurveys.length)
        : 0;

    const ratingLabel = avgRating >= 4.5 ? 'عالی' : avgRating >= 3.5 ? 'خوب' : avgRating >= 2.5 ? 'متوسط' : 'ضعیف';
    const ratingColor = avgRating >= 4.5 ? 'text-emerald-500' : avgRating >= 3.5 ? 'text-blue-500' : avgRating >= 2.5 ? 'text-amber-500' : 'text-rose-500';

    return (
        <div className="space-y-6">
            {/* Survey Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/15 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <span className="text-[10px] font-black text-pink-500 block">کل نظرات ثبت شده</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">{toPersianDigits(totalSurveyCount)} نظر</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl"><MessageSquare className="w-5 h-5 text-pink-500" /></div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/15 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <span className="text-[10px] font-black text-purple-500 block">میانگین امتیاز کلی</span>
                        <span className={`text-xl font-black ${ratingColor} mt-1 block`}>{toPersianDigits(avgRating.toFixed(1))} — {ratingLabel}</span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl"><Star className={`w-5 h-5 ${ratingColor} fill-current`} /></div>
                </div>
                <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/15 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <span className="text-[10px] font-black text-indigo-500 block">دوره با بیشترین نظر</span>
                        <span className="text-xs font-black text-gray-900 dark:text-white mt-1 block max-w-[120px] truncate">
                            {(() => { const best = [...individualSurveys].sort((a, b) => b.rating - a.rating)?.[0]; return best?.courseTitle || '---'; })()}
                        </span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl"><BarChart2 className="w-5 h-5 text-indigo-500" /></div>
                </div>
                <div className="p-4 bg-gradient-to-br from-teal-500/10 to-teal-500/5 border border-teal-500/15 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                        <span className="text-[10px] font-black text-teal-500 block">نظرات نیازمند رسیدگی</span>
                        <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">
                            {toPersianDigits(individualSurveys.filter(s => s.rating <= 2).length)} نظر
                        </span>
                    </div>
                    <div className="p-2.5 bg-white dark:bg-gray-900 rounded-xl"><Phone className="w-5 h-5 text-teal-500" /></div>
                </div>
            </div>

            {/* Filter Card */}
            <div className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-800 dark:text-white">
                    <Filter className="w-4 h-4 text-teal-600" />
                    جستجو و فیلتر نظرات
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input type="text" value={surveySearch} onChange={(e) => { setSurveySearch(e.target.value); setSurveyPage(1); }}
                            placeholder="جستجوی نام کاربر، دوره یا تلفن..."
                            className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500/30" />
                    </div>
                    <div>
                        <input type="date" value={surveyFromDate} onChange={(e) => { setSurveyFromDate(e.target.value); setSurveyPage(1); }}
                            className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 dark:text-white focus:outline-none" />
                    </div>
                    <div>
                        <input type="date" value={surveyToDate} onChange={(e) => { setSurveyToDate(e.target.value); setSurveyPage(1); }}
                            className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 dark:text-white focus:outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setSurveySearch(''); setSurveyFromDate(''); setSurveyToDate(''); setSurveyPage(1); }}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 rounded-xl text-[11px] text-gray-500 font-bold cursor-pointer">
                            بازنشانی فیلتر
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs overflow-hidden">
                {loadingSurveys ? (
                    <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">در حال بارگذاری نظرات...</div>
                ) : paginatedSurveys.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500">هیچ نظری با معیارهای جستجو یافت نشد.</div>
                ) : (
                    <table className="w-full text-right text-xs">
                        <thead>
                            <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-850 text-gray-400 dark:text-gray-500 font-extrabold">
                                <th className="p-3.5">کاربر / مدرس</th>
                                <th className="p-3.5">دوره / کارگاه</th>
                                <th className="p-3.5 text-center">امتیاز</th>
                                <th className="p-3.5 text-center">تاریخ ثبت نظر</th>
                                <th className="p-3.5 text-center">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                            {paginatedSurveys.map(s => (
                                <tr key={s.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-950/40 transition-colors">
                                    <td className="p-3.5">
                                        <span className="font-bold text-gray-800 dark:text-gray-200 block">{s.userName}</span>
                                        <span className="text-[10px] text-gray-400 block mt-0.5" dir="ltr">{toPersianDigits(s.userPhone)}</span>
                                    </td>
                                    <td className="p-3.5">
                                        <span className="text-gray-700 dark:text-gray-300">{s.courseTitle}</span>
                                    </td>
                                    <td className="p-3.5 text-center">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${s.rating >= 4 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                                            s.rating >= 3 ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                                                'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'}`}>
                                            {toPersianDigits(s.rating)}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-center text-gray-500">
                                        <span className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" />{toPersianDigits(s.date)}</span>
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
                {!loadingSurveys && filteredSurveys.length > surveysPerPage && (
                    <div className="flex justify-between items-center p-3.5 border-t border-gray-100 dark:border-gray-850 bg-gray-55/50 dark:bg-gray-950/50">
                        <span className="text-[10px] text-gray-400">{toPersianDigits(filteredSurveys.length)} نظر یافت شد.</span>
                        <div className="flex items-center gap-1">
                            <button disabled={surveyPage <= 1} onClick={() => setSurveyPage(surveyPage - 1)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${surveyPage <= 1 ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                                قبلی
                            </button>
                            <span className="text-[10px] text-gray-500 px-2">{toPersianDigits(surveyPage)} از {toPersianDigits(totalPages)}</span>
                            <button disabled={surveyPage >= totalPages} onClick={() => setSurveyPage(surveyPage + 1)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${surveyPage >= totalPages ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}>
                                بعدی
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Survey Detail Modal */}
            {selectedSurveyDetails && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedSurveyDetails(null)}>
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 p-6 rounded-3xl shadow-2xl max-w-md w-full max-h-[70vh] space-y-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <h4 className="text-sm font-black text-gray-900 dark:text-white">جزئیات نظر</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">شناسه نظر: {selectedSurveyDetails.id}</p>
                            </div>
                            <button onClick={() => setSelectedSurveyDetails(null)}
                                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'کاربر', value: selectedSurveyDetails.userName },
                                { label: 'دوره', value: selectedSurveyDetails.courseTitle },
                                { label: 'ارزیابی کلی', value: `${selectedSurveyDetails.rating} از ۵` },
                                { label: 'متن دیدگاه', value: selectedSurveyDetails.comment || 'بدون دیدگاه' },
                            ].map((f, i) => (
                                <div key={i} className="text-xs">
                                    <span className="text-gray-400 font-bold block mb-0.5">{f.label}</span>
                                    <span className="text-gray-900 dark:text-gray-200 font-bold block">{f.value}</span>
                                </div>
                            ))}
                        </div>
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
