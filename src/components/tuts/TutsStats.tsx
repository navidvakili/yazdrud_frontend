// ============================================================
// TutsModule — Stats (Analytics, Charts & KPIs)
// ============================================================

import {
    Filter, Calendar, Users, DollarSign, CheckCircle, FileText,
    TrendingUp, Layers, Sparkles, Download, BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { TutCourse } from './tuts-types';
import { toPersianDigits, formatCurrency } from './tuts-utils';

interface MonthlyData {
    month: string; count: number; amount: number; online: number; bankSlip: number; percentage: number;
}
interface SeasonsData {
    spring: { count: number; amount: number };
    summer: { count: number; amount: number };
    autumn: { count: number; amount: number };
    winter: { count: number; amount: number };
}
interface StatsData {
    totalApproved: number; totalAmount: number; onlinePayment: number; bankSlips: number;
    months: MonthlyData[]; seasons: SeasonsData; avgMonthly: number; peekMonth: string;
}

interface TutsStatsProps {
    courses: TutCourse[];
    categories: string[];
    totalEnrolledAllWorkshops: number;
    totalCapacityAllWorkshops: number;
    statSelectedYear: string;
    setStatSelectedYear: (v: string) => void;
    statSelectedCourse: string;
    setStatSelectedCourse: (v: string) => void;
    statAppliedYear: string;
    statAppliedCourse: string;
    setStatAppliedYear: (v: string) => void;
    setStatAppliedCourse: (v: string) => void;
    showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export default function TutsStats(props: TutsStatsProps) {
    const {
        courses, categories, totalEnrolledAllWorkshops, totalCapacityAllWorkshops,
        statSelectedYear, setStatSelectedYear,
        statSelectedCourse, setStatSelectedCourse,
        statAppliedYear, statAppliedCourse,
        setStatAppliedYear, setStatAppliedCourse,
        showToast,
    } = props;

    // Data computation IIFE (extracted from original inline)
    const getStatsData = (): StatsData => {
        if (statAppliedCourse === 'all') {
            return {
                totalApproved: 524, totalAmount: 1582310000,
                onlinePayment: 240, bankSlips: 284,
                months: [
                    { month: 'فروردین', count: 2, amount: 1500000, online: 2, bankSlip: 0, percentage: 0.38 },
                    { month: 'اردیبهشت', count: 427, amount: 1115960000, online: 143, bankSlip: 284, percentage: 81.49 },
                    { month: 'خرداد', count: 95, amount: 464850000, online: 95, bankSlip: 0, percentage: 18.13 },
                    { month: 'تیر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                    { month: 'مرداد', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                    { month: 'شهریور', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                    { month: 'مهر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                    { month: 'آبان', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                    { month: 'آذر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                    { month: 'دی', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                    { month: 'بهمن', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                    { month: 'اسفند', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                ],
                seasons: { spring: { count: 524, amount: 1582310000 }, summer: { count: 0, amount: 0 }, autumn: { count: 0, amount: 0 }, winter: { count: 0, amount: 0 } },
                avgMonthly: 44, peekMonth: 'اردیبهشت با ۴۲۷ نفر'
            };
        }
        const course = courses.find(c => c.id === statAppliedCourse);
        if (!course) return {
            totalApproved: 0, totalAmount: 0, onlinePayment: 0, bankSlips: 0, months: [],
            seasons: { spring: { count: 0, amount: 0 }, summer: { count: 0, amount: 0 }, autumn: { count: 0, amount: 0 }, winter: { count: 0, amount: 0 } },
            avgMonthly: 0, peekMonth: 'ندارد'
        };
        const total = course.enrolled;
        const countFar = Math.round(total * 0.1), countOrd = Math.round(total * 0.7), countKhor = total - countFar - countOrd;
        const amtFar = countFar * course.cost, amtOrd = countOrd * course.cost, amtKhor = countKhor * course.cost;
        let onlineRatio = 1.0;
        if (course.id === 'tut-1') onlineRatio = 0.47;
        if (course.id === 'tut-2') onlineRatio = 0.41;
        const totalOnline = Math.round(total * onlineRatio), totalBank = total - totalOnline;
        const onlineFar = Math.round(countFar * onlineRatio), bankFar = countFar - onlineFar;
        const onlineOrd = Math.round(countOrd * onlineRatio), bankOrd = countOrd - onlineOrd;
        const onlineKhor = totalOnline - onlineFar - onlineOrd, bankKhor = totalBank - bankFar - bankOrd;
        return {
            totalApproved: total, totalAmount: total * course.cost,
            onlinePayment: totalOnline, bankSlips: totalBank,
            months: [
                { month: 'فروردین', count: countFar, amount: amtFar, online: onlineFar, bankSlip: bankFar, percentage: total > 0 ? Number(((countFar / total) * 100).toFixed(2)) : 0 },
                { month: 'اردیبهشت', count: countOrd, amount: amtOrd, online: onlineOrd, bankSlip: bankOrd, percentage: total > 0 ? Number(((countOrd / total) * 100).toFixed(2)) : 0 },
                { month: 'خرداد', count: countKhor, amount: amtKhor, online: onlineKhor, bankSlip: bankKhor, percentage: total > 0 ? Number(((countKhor / total) * 100).toFixed(2)) : 0 },
                { month: 'تیر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'مرداد', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'شهریور', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'مهر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'آبان', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'آذر', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'دی', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'بهمن', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
                { month: 'اسفند', count: 0, amount: 0, online: 0, bankSlip: 0, percentage: 0 },
            ],
            seasons: { spring: { count: total, amount: total * course.cost }, summer: { count: 0, amount: 0 }, autumn: { count: 0, amount: 0 }, winter: { count: 0, amount: 0 } },
            avgMonthly: Math.round(total / 12),
            peekMonth: `اردیبهشت با ${toPersianDigits(countOrd)} نفر`
        };
    };

    const currentData = getStatsData();
    const totalGrossRevenue = courses.reduce((sum, c) => sum + (c.enrolled * c.cost), 0);

    return (
        <div className="space-y-6">
            {/* ===== First Block: Analytics Filters + Recharts + Monthly Stats ===== */}
            <div className="space-y-6 text-right">
                {/* Filter Section */}
                <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs space-y-4">
                    <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-800/80 pb-3">
                        <Filter className="w-4 h-4 text-teal-600" />
                        فیلترهای گزارشات آماری دوره‌ها
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 block">انتخاب سال مالی</label>
                            <select value={statSelectedYear} onChange={(e) => setStatSelectedYear(e.target.value)}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none">
                                <option value="۱۴۰۵">۱۴۰۵</option>
                                <option value="۱۴۰۴">۱۴۰۴</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 block">دوره آموزشی</label>
                            <select value={statSelectedCourse} onChange={(e) => setStatSelectedCourse(e.target.value)}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-850 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none">
                                <option value="all">همه دوره‌ها</option>
                                {courses.map(c => (<option key={c.id} value={c.id}>{c.title}</option>))}
                            </select>
                        </div>
                        <button onClick={() => { setStatAppliedYear(statSelectedYear); setStatAppliedCourse(statSelectedCourse); showToast('فیلتر گزارش با موفقیت اعمال شد.', 'success'); }}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5">
                            اعمال فیلتر
                        </button>
                    </div>
                </div>

                {/* Selected Year Bar */}
                <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl text-xs font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>سال انتخاب شده: {toPersianDigits(statAppliedYear)}</span>
                    {statAppliedCourse !== 'all' && (<><span className="mx-1">•</span><span>دوره: {courses.find(c => c.id === statAppliedCourse)?.title}</span></>)}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'کل ثبت‌نام‌های تایید شده', value: `${toPersianDigits(currentData.totalApproved)} نفر`, icon: Users, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                        { label: 'کل مبلغ دریافتی (ریال)', value: toPersianDigits(currentData.totalAmount.toLocaleString('fa-IR')), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                        { label: 'پرداخت آنلاین', value: `${toPersianDigits(currentData.onlinePayment)} تراکنش`, icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'فیش بانکی تایید شده', value: `${toPersianDigits(currentData.bankSlips)} فیش`, icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    ].map((kpi, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl flex items-center justify-between shadow-xs">
                            <div>
                                <span className="text-[10px] text-gray-400 block font-bold mb-1">{kpi.label}</span>
                                <span className="text-xl font-black text-gray-900 dark:text-white">{kpi.value}</span>
                            </div>
                            <div className={`w-10 h-10 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recharts Area Chart */}
                <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
                    <h5 className="text-xs font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-teal-600" />
                        روند ثبت‌نام در ۱۲ ماه اخیر (سال {toPersianDigits(statAppliedYear)})
                    </h5>
                    <div className="h-72 w-full text-xs" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={currentData.months} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                                <XAxis dataKey="month" className="fill-gray-400 dark:fill-gray-500" tickLine={false} axisLine={false} />
                                <YAxis className="fill-gray-400 dark:fill-gray-500" tickLine={false} axisLine={false} tickFormatter={(v) => toPersianDigits(v)} />
                                <Tooltip formatter={(value: any) => [toPersianDigits(value) + ' نفر', 'تعداد ثبت‌نام']} labelFormatter={(label) => `ماه: ${label}`}
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', textAlign: 'right' }} />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Stats Table + Seasonal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs lg:col-span-2 space-y-4">
                        <h5 className="text-xs font-black text-gray-900 dark:text-white">آمار ماهانه - سال {toPersianDigits(statAppliedYear)}</h5>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead>
                                    <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-850 text-gray-400 dark:text-gray-500 font-extrabold">
                                        <th className="p-2.5">ماه</th>
                                        <th className="p-2.5 text-center">تعداد ثبت‌نام</th>
                                        <th className="p-2.5 text-left">مبلغ دریافتی (ریال)</th>
                                        <th className="p-2.5 text-center">پرداخت آنلاین</th>
                                        <th className="p-2.5 text-center">فیش بانکی</th>
                                        <th className="p-2.5 text-left">درصد</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                    {currentData.months.map(m => (
                                        <tr key={m.month} className="hover:bg-gray-55/40 dark:hover:bg-gray-950/40 transition-colors">
                                            <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200">{m.month}</td>
                                            <td className="p-2.5 text-center font-bold">{toPersianDigits(m.count)}</td>
                                            <td className="p-2.5 text-left text-emerald-600 dark:text-emerald-400 font-bold">{toPersianDigits(m.amount.toLocaleString('fa-IR'))}</td>
                                            <td className="p-2.5 text-center text-gray-500">{toPersianDigits(m.online)}</td>
                                            <td className="p-2.5 text-center text-gray-500">{toPersianDigits(m.bankSlip)}</td>
                                            <td className="p-2.5 text-left">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <span className="text-gray-400 text-[10px]">{toPersianDigits(m.percentage)}٪</span>
                                                    <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-850 rounded-full overflow-hidden inline-block relative">
                                                        <div className="absolute right-0 top-0 h-full bg-blue-600 rounded-full" style={{ width: `${m.percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 dark:bg-gray-950 font-black border-t-2 border-gray-200 dark:border-gray-800">
                                        <td className="p-3">جمع کل</td>
                                        <td className="p-3 text-center">{toPersianDigits(currentData.totalApproved)}</td>
                                        <td className="p-3 text-left text-emerald-600 dark:text-emerald-400">{toPersianDigits(currentData.totalAmount.toLocaleString('fa-IR'))}</td>
                                        <td className="p-3 text-center">{toPersianDigits(currentData.onlinePayment)}</td>
                                        <td className="p-3 text-center">{toPersianDigits(currentData.bankSlips)}</td>
                                        <td className="p-3 text-left">۱۰۰٪</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Seasonal breakdown */}
                        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs space-y-4">
                            <h5 className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Layers className="w-4 h-4 text-indigo-500" />
                                آمار فصلی - سال {toPersianDigits(statAppliedYear)}
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { season: 'بهار', data: currentData.seasons.spring, color: 'rose' },
                                    { season: 'تابستان', data: currentData.seasons.summer, color: 'amber' },
                                    { season: 'پاییز', data: currentData.seasons.autumn, color: 'emerald' },
                                    { season: 'زمستان', data: currentData.seasons.winter, color: 'indigo' },
                                ].map(({ season, data, color }) => (
                                    <div key={season} className={`p-3 bg-${color}-50/40 dark:bg-${color}-950/10 border border-${color}-500/10 rounded-2xl text-center`}>
                                        <span className={`text-[10px] text-${color}-500 block font-bold mb-1`}>{season}</span>
                                        <span className={`text-sm font-black text-${color}-600 dark:text-${color}-400 block`}>{toPersianDigits(data.count)} نفر</span>
                                        <span className="text-[9px] text-gray-400">{toPersianDigits(data.amount.toLocaleString('fa-IR'))} ریال</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Report summary card */}
                        <div className="p-5 rounded-3xl bg-teal-500/5 border border-teal-500/15 shadow-xs space-y-4">
                            <h5 className="text-xs font-black text-teal-800 dark:text-teal-400 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-teal-600" />
                                خلاصه گزارش دوره‌ها
                            </h5>
                            <div className="space-y-2.5 text-xs">
                                {[
                                    { label: 'میانگین ماهانه ثبت نام:', value: `${toPersianDigits(currentData.avgMonthly)} نفر`, color: 'bg-teal-500' },
                                    { label: 'پربازدیدترین ماه سال:', value: toPersianDigits(currentData.peekMonth), color: 'bg-blue-500' },
                                    { label: 'مجموع پذیرش دانشجو:', value: `${toPersianDigits(currentData.totalApproved)} نفر`, color: 'bg-pink-500' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-teal-500/10">
                                        <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                                        <span className="text-gray-400 font-bold text-[10px]">{item.label}</span>
                                        <span className="font-black text-gray-800 dark:text-gray-200 mr-auto">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Second Block: Course KPIs, Progress Bars, Breakdown Table ===== */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div>
                        <h4 className="text-sm font-black text-gray-950 dark:text-white mb-1">گزارش کلی و عملکرد مالی دوره‌های آموزشی</h4>
                        <p className="text-xs text-gray-400">تحلیل آماری ثبت‌نام، ظرفیت کلاس‌ها و سود خالص ناخالص کارگاه‌های مهارتی</p>
                    </div>
                    <button onClick={() => { showToast('در حال آماده‌سازی گزارش تجمیعی PDF دوره‌ها...', 'info'); setTimeout(() => showToast('خروجی PDF گزارشات با موفقیت دانلود شد.', 'success'), 1200); }}
                        className="px-4 py-2 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-500/15 text-teal-700 dark:text-teal-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer">
                        <Download className="w-4 h-4" />
                        دریافت گزارش تجمیعی کارگاه‌ها
                    </button>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'تعداد کل کارگاه‌ها', value: `${toPersianDigits(courses.length)} دوره فعال`, cls: '' },
                        { label: 'میانگین ثبت‌نامی‌ها', value: `${toPersianDigits(Math.round(totalEnrolledAllWorkshops / courses.length))} دانشجو در کلاس`, cls: 'text-teal-600 dark:text-teal-400' },
                        { label: 'درصد پوشش کل ظرفیت', value: `${toPersianDigits(Math.round((totalEnrolledAllWorkshops / totalCapacityAllWorkshops) * 100))}٪`, cls: 'text-indigo-500' },
                        { label: 'مجموع گردش ناخالص', value: `${toPersianDigits((totalGrossRevenue / 10).toLocaleString('fa-IR'))} تومان`, cls: 'text-emerald-600 dark:text-emerald-400' },
                    ].map((kpi, i) => (
                        <div key={i} className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-850 rounded-2xl">
                            <span className="text-[10px] text-gray-400 block font-bold mb-1">{kpi.label}</span>
                            <span className={`text-xl font-black text-gray-900 dark:text-white ${kpi.cls}`}>{kpi.value}</span>
                        </div>
                    ))}
                </div>

                {/* Progress bars + Category distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs lg:col-span-2">
                        <h5 className="text-xs font-black text-gray-900 dark:text-white mb-6 flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-teal-600" />
                            توزیع آمار کل ثبت‌نامی‌ها نسبت به ظرفیت کلاس‌ها
                        </h5>
                        <div className="space-y-4">
                            {courses.map(c => {
                                const percent = (c.enrolled / c.capacity) * 100;
                                return (
                                    <div key={c.id} className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[10.5px]">
                                            <span className="font-bold text-gray-700 dark:text-gray-300 truncate max-w-[280px]">{c.title}</span>
                                            <span className="text-gray-400">{toPersianDigits(c.enrolled)} از {toPersianDigits(c.capacity)} نفر ({toPersianDigits(Math.round(percent))}٪)</span>
                                        </div>
                                        <div className="w-full h-3 rounded-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, percent)}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                className={`absolute h-full rounded-full ${percent >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                                    percent >= 75 ? 'bg-gradient-to-r from-teal-500 to-indigo-500' :
                                                        'bg-gradient-to-r from-indigo-500 to-purple-500'}`}>
                                            </motion.div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
                        <h5 className="text-xs font-black text-gray-900 dark:text-white mb-6 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-indigo-500" />
                            سهم گروه‌های درسی از کل جذب دانشجو
                        </h5>
                        <div className="space-y-4">
                            {categories.map((cat, idx) => {
                                const catCourses = courses.filter(c => c.category === cat);
                                const catEnrolled = catCourses.reduce((sum, c) => sum + c.enrolled, 0);
                                const sharePercent = totalEnrolledAllWorkshops > 0 ? Math.round((catEnrolled / totalEnrolledAllWorkshops) * 100) : 0;
                                const colors = ['bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-purple-500'];
                                return (
                                    <div key={cat} className="p-3 bg-gray-55 dark:bg-gray-950 rounded-2xl border border-gray-100/50 dark:border-gray-850 space-y-2">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{cat}</span>
                                            <span className="text-gray-500 font-extrabold">{toPersianDigits(catEnrolled)} نفر ({toPersianDigits(sharePercent)}٪)</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${colors[idx % colors.length]} rounded-full`} style={{ width: `${sharePercent}%` }}></div>
                                        </div>
                                        <span className="text-[9px] text-gray-400 block">{toPersianDigits(catCourses.length)} دوره تعریف شده در این حوزه</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Course breakdown table */}
                <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 shadow-xs">
                    <h5 className="text-xs font-black text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        جدول جامع موازنه‌های آماری و درآمدی کارگاه‌ها
                    </h5>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                            <thead>
                                <tr className="bg-gray-55 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-850 text-gray-400 dark:text-gray-500 font-extrabold">
                                    <th className="p-3">عنوان کارگاه / مدرس</th>
                                    <th className="p-3 text-center">گروه علمی</th>
                                    <th className="p-3 text-center">ظرفیت / ثبت‌نامی</th>
                                    <th className="p-3 text-left">هزینه دوره</th>
                                    <th className="p-3 text-left">مجموع ناخالص تولید شده</th>
                                    <th className="p-3 text-center">وضعیت برگزاری</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                                {courses.map(c => {
                                    const rev = c.enrolled * c.cost;
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-55/40 dark:hover:bg-gray-950/40 transition-colors">
                                            <td className="p-3">
                                                <span className="font-black text-gray-900 dark:text-white block">{c.title}</span>
                                                <span className="text-[10px] text-gray-400 block mt-0.5">مدرس: {c.lecturer}</span>
                                            </td>
                                            <td className="p-3 text-center text-[10.5px] text-gray-500 font-medium">{c.category}</td>
                                            <td className="p-3 text-center">
                                                <span className="font-bold text-gray-800 dark:text-gray-200 block">{toPersianDigits(c.enrolled)} از {toPersianDigits(c.capacity)}</span>
                                                <span className="text-[10px] text-gray-400">({toPersianDigits(Math.round((c.enrolled / c.capacity) * 100))}٪)</span>
                                            </td>
                                            <td className="p-3 text-left font-bold text-gray-700 dark:text-gray-300">
                                                {toPersianDigits((c.cost / 10).toLocaleString('fa-IR'))} <span className="text-[10px] font-sans text-gray-400">تومان</span>
                                            </td>
                                            <td className="p-3 text-left font-black text-emerald-600 dark:text-emerald-400">
                                                {toPersianDigits((rev / 10).toLocaleString('fa-IR'))} <span className="text-[10px] font-sans font-normal text-gray-400">تومان</span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold ${c.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10' :
                                                    c.status === 'completed' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-500/10' :
                                                        'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                                    {c.status === 'active' ? 'در حال ثبت‌نام' : c.status === 'completed' ? 'پایان کلاس مهارتی' : 'پایان یافته و بسته شده'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
