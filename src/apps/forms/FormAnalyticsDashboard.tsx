import React, { useMemo } from 'react';
import {
  BarChart2,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area
} from 'recharts';
import { FormDefinition, FormSubmission } from './types';

interface FormAnalyticsDashboardProps {
  form: FormDefinition;
  submissions: FormSubmission[];
}

export const FormAnalyticsDashboard: React.FC<FormAnalyticsDashboardProps> = ({
  form,
  submissions
}) => {
  const completionRate = Math.min(100, Math.round((submissions.length / (form.viewsCount || 1)) * 100));

  // روند واقعی ثبت پاسخ‌ها بر اساس submittedAt واقعیِ هر پاسخ — بازدید روزانه در بک‌اند
  // ذخیره نمی‌شود (فقط یک شمارندهٔ کلی views_count داریم)، پس این نمودار فقط پاسخ‌ها را نشان می‌دهد.
  const trendData = useMemo(() => {
    const counts: Record<string, number> = {};
    submissions.forEach(s => {
      if (!s.submittedAt) return;
      const d = new Date(s.submittedAt);
      if (isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts)
      .sort()
      .map(key => ({
        date: new Date(key).toLocaleDateString('fa-IR'),
        submissions: counts[key]
      }));
  }, [submissions]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              داشبورد هوشمند تحلیلی و آمار تجمیعی (Analytics)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تحلیل رفتار پاسخ‌دهندگان، نرخ تکمیل، زمان میانگین و تحلیل احساسات متون
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50 space-y-1">
          <div className="flex items-center justify-between text-teal-700 dark:text-teal-300 text-xs font-bold">
            <span>تعداد کل بازدیدها</span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-teal-900 dark:text-teal-100">
            {form.viewsCount.toLocaleString('fa-IR')}
          </div>
          <span className="text-[11px] text-teal-600 dark:text-teal-400">بازدید یکتا از لینک و iframe</span>
        </div>

        <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 space-y-1">
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <span>پاسخ‌های ثبت شده</span>
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-100">
            {submissions.length.toLocaleString('fa-IR')}
          </div>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400">تکمیل و ارسال نهایی</span>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <span>نرخ تبدیل (Completion)</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
            {completionRate}%
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">نسبت پاسخ‌های ثبت‌شده به بازدیدها</span>
        </div>

        <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 text-xs font-bold">
            <span>میانگین زمان پاسخ</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">
            {form.avgCompletionTimeSeconds} ثانیه
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400">میانگین زمان تکمیل بر اساس پاسخ‌های ثبت‌شده</span>
        </div>
      </div>

      {/* Submissions Trend Chart */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-600" /> روند زمانی ثبت پاسخ‌ها
        </h3>
        {trendData.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-400">
            هنوز پاسخی برای این فرم ثبت نشده تا روند زمانی آن نمایش داده شود.
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="submissions" name="پاسخ ثبت‌شده" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
