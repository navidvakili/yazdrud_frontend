// ============================================================
// TutsModule — Surveys Stats (Ratings, Form & Comments Wall)
// ============================================================

import { Star, MessageSquare, BarChart3 } from 'lucide-react';
import type { TutCourse, TutSurvey } from './tuts-types';
import { toPersianDigits } from './tuts-utils';

interface TutsSurveysStatsProps {
    surveys: TutSurvey[];
    courses: TutCourse[];
    selectedStatCourse: string;
    setSelectedStatCourse: (v: string) => void;
    surveyFormCourseId: string;
    setSurveyFormCourseId: (v: string) => void;
    surveyFormUser: string;
    setSurveyFormUser: (v: string) => void;
    surveyFormRating: number;
    setSurveyFormRating: (v: number) => void;
    surveyFormContent: number;
    setSurveyFormContent: (v: number) => void;
    surveyFormLecturer: number;
    setSurveyFormLecturer: (v: number) => void;
    surveyFormOrg: number;
    setSurveyFormOrg: (v: number) => void;
    surveyFormFacilities: number;
    setSurveyFormFacilities: (v: number) => void;
    surveyFormComment: string;
    setSurveyFormComment: (v: string) => void;
    handleSubmitSurvey: () => void;
}

export default function TutsSurveysStats(props: TutsSurveysStatsProps) {
    const {
        surveys, courses, selectedStatCourse, setSelectedStatCourse,
        surveyFormCourseId, setSurveyFormCourseId,
        surveyFormUser, setSurveyFormUser,
        surveyFormRating, setSurveyFormRating,
        surveyFormContent, setSurveyFormContent,
        surveyFormLecturer, setSurveyFormLecturer,
        surveyFormOrg, setSurveyFormOrg,
        surveyFormFacilities, setSurveyFormFacilities,
        surveyFormComment, setSurveyFormComment,
        handleSubmitSurvey,
    } = props;

    // Filter surveys by selected course
    const filteredSurveys = selectedStatCourse === 'all'
        ? surveys
        : surveys.filter(s => s.courseId === selectedStatCourse);

    // Average ratings
    const avgRating = filteredSurveys.length > 0
        ? filteredSurveys.reduce((sum, s) => sum + s.rating, 0) / filteredSurveys.length
        : 0;
    const avgContent = filteredSurveys.length > 0
        ? filteredSurveys.reduce((sum, s) => sum + (s.contentRating ?? s.rating), 0) / filteredSurveys.length
        : 0;
    const avgLecturer = filteredSurveys.length > 0
        ? filteredSurveys.reduce((sum, s) => sum + (s.lecturerRating ?? s.rating), 0) / filteredSurveys.length
        : 0;
    const avgOrg = filteredSurveys.length > 0
        ? filteredSurveys.reduce((sum, s) => sum + (s.organizationRating ?? s.rating), 0) / filteredSurveys.length
        : 0;
    const avgFacilities = filteredSurveys.length > 0
        ? filteredSurveys.reduce((sum, s) => sum + (s.facilitiesRating ?? s.rating), 0) / filteredSurveys.length
        : 0;

    const renderStars = (rating: number) => {
        const full = Math.floor(rating);
        const fraction = rating - full;
        return (
            <span className="inline-flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i}
                        className={`w-3.5 h-3.5 ${i <= full ? 'text-amber-400 fill-amber-400' :
                            i === full + 1 && fraction >= 0.25 ? 'text-amber-400 fill-amber-400/50' :
                                'text-gray-200 dark:text-gray-700'}`}
                    />
                ))}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Course Filter */}
            <div className="flex items-center gap-3 text-right">
                <label className="text-xs font-black text-gray-500">انتخاب دوره:</label>
                <select value={selectedStatCourse} onChange={(e) => setSelectedStatCourse(e.target.value)}
                    className="text-xs px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                    <option value="all">همه دوره‌ها</option>
                    {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                </select>
                <span className="text-xs text-gray-400">{toPersianDigits(filteredSurveys.length)} نظر</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Star Ratings + Dimension Breakdown */}
                <div className="space-y-6">
                    {/* Average rating card */}
                    <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs text-center">
                        <h5 className="text-xs font-black text-gray-900 dark:text-white mb-4">میانگین امتیازات</h5>
                        <div className="text-5xl font-black text-gray-900 dark:text-white mb-2">{avgRating > 0 ? toPersianDigits(avgRating.toFixed(1)) : '—'}</div>
                        <div className="flex justify-center mb-3">{renderStars(avgRating)}</div>
                        <span className="text-xs text-gray-400">{toPersianDigits(filteredSurveys.length)} نظر ثبت شده</span>
                    </div>

                    {/* 4-dimension breakdown */}
                    <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs space-y-4">
                        <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4 text-indigo-500" />
                            تفکیک ابعاد کیفیت
                        </h5>
                        {[
                            { label: 'محتوا و سرفصل‌ها', value: avgContent, color: 'bg-blue-500' },
                            { label: 'مدرس و تدریس', value: avgLecturer, color: 'bg-emerald-500' },
                            { label: 'مدیریت و سازماندهی', value: avgOrg, color: 'bg-amber-500' },
                            { label: 'امکانات و تجهیزات', value: avgFacilities, color: 'bg-purple-500' },
                        ].map((d, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-700 dark:text-gray-300 font-bold">{d.label}</span>
                                    <span className="text-gray-500 font-black">{d.value > 0 ? `${toPersianDigits(d.value.toFixed(1))} / ۵` : '—'}</span>
                                </div>
                                <div className="w-full h-2 bg-gray-50 dark:bg-gray-950 rounded-full overflow-hidden">
                                    <div className={`h-full ${d.color} rounded-full transition-all duration-700`}
                                        style={{ width: `${(d.value / 5) * 100}%` }}></div>
                                </div>
                                <div className="flex">{renderStars(d.value)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Comments Wall */}
                    <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs space-y-4">
                        <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                            <MessageSquare className="w-4 h-4 text-teal-500" />
                            دیوار نظرات کاربران
                        </h5>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {filteredSurveys.filter(s => s.comment).length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-6">هنوز دیدگاهی ثبت نشده است.</p>
                            ) : (
                                filteredSurveys.filter(s => s.comment).map(s => (
                                    <div key={s.id} className="p-3 bg-gray-55 dark:bg-gray-950 rounded-2xl border border-gray-100/50 dark:border-gray-850">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-[10px] font-black text-gray-800 dark:text-gray-200">{s.userName}</span>
                                            <div className="flex items-center gap-1">{renderStars(s.rating)}</div>
                                        </div>
                                        <p className="text-[11px] text-gray-500 leading-relaxed">{s.comment}</p>
                                        <span className="text-[9px] text-gray-400 block mt-1.5">{toPersianDigits(s.date)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Survey Form */}
                <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-3xl shadow-xs space-y-5">
                    <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500" />
                        فرم ارسال نظر جدید
                    </h5>

                    <div className="space-y-4 text-right">
                        {/* Course selection */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-500 block">دوره / کارگاه مورد نظر</label>
                            <select value={surveyFormCourseId} onChange={(e) => setSurveyFormCourseId(e.target.value)}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none cursor-pointer">
                                <option value="">انتخاب کنید...</option>
                                {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                            </select>
                        </div>

                        {/* User info */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-500 block">نام و نام خانوادگی</label>
                            <input type="text" value={surveyFormUser} onChange={(e) => setSurveyFormUser(e.target.value)}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none" />
                        </div>

                        {/* Star ratings */}
                        {[
                            { key: 'rating', label: 'امتیاز کلی دوره', value: surveyFormRating, setter: setSurveyFormRating },
                            { key: 'content', label: 'محتوا و سرفصل‌ها', value: surveyFormContent, setter: setSurveyFormContent },
                            { key: 'lecturer', label: 'مدرس و تدریس', value: surveyFormLecturer, setter: setSurveyFormLecturer },
                            { key: 'org', label: 'مدیریت و سازماندهی', value: surveyFormOrg, setter: setSurveyFormOrg },
                            { key: 'facilities', label: 'امکانات و تجهیزات', value: surveyFormFacilities, setter: setSurveyFormFacilities },
                        ].map(dim => (
                            <div key={dim.key} className="space-y-1.5">
                                <div className="flex justify-between text-[11px]">
                                    <label className="text-gray-600 dark:text-gray-400 font-bold">{dim.label}</label>
                                    <span className="text-gray-500">{toPersianDigits(dim.value)} از ۵</span>
                                </div>
                                <input type="range" min="1" max="5" step="1" value={dim.value}
                                    onChange={(e) => dim.setter(Number(e.target.value))}
                                    className="w-full accent-amber-500 cursor-pointer" />
                                <div className="flex justify-between text-[9px] text-gray-300">
                                    <span>۱</span><span>۲</span><span>۳</span><span>۴</span><span>۵</span>
                                </div>
                            </div>
                        ))}

                        {/* Comment */}
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-500 block">متن دیدگاه (اختیاری)</label>
                            <textarea value={surveyFormComment} onChange={(e) => setSurveyFormComment(e.target.value)}
                                rows={3} placeholder="نظر خود را درباره این دوره بنویسید..."
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50/50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"></textarea>
                        </div>

                        {/* Submit button */}
                        <button onClick={handleSubmitSurvey}
                            disabled={!surveyFormCourseId || !surveyFormUser}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black transition-all cursor-pointer shadow-xs">
                            ثبت نظر و امتیاز
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
