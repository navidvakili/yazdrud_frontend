import React, { useState } from 'react';
import ExcelJS from 'exceljs';
import {
  Inbox,
  Search,
  Filter,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Printer,
  UserCheck,
  MessageSquare,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { FormDefinition, FormSubmission } from './types';

interface SubmissionsManagerProps {
  form: FormDefinition;
  submissions: FormSubmission[];
}

/** تبدیل تاریخ ثبت (ISO از بک‌اند) به تاریخ و ساعت شمسی، هم‌الگو با toLocaleDateString('fa-IR') رایج در این پروژه */
const formatJalaliDateTime = (iso: string): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString('fa-IR')} - ${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;
};

/** پارسر سبک User-Agent — بدون وابستگی جدید؛ فقط مرورگر و سیستم‌عامل‌های رایج را تشخیص می‌دهد */
const parseUserAgent = (ua?: string): { browser: string; os: string } => {
  if (!ua) return { browser: 'نامشخص', os: 'نامشخص' };

  let browser = 'نامشخص';
  if (/Edg\//.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/CriOS\//.test(ua)) browser = 'Chrome (iOS)';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && /Version\//.test(ua)) browser = 'Safari';

  let os = 'نامشخص';
  if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  return { browser, os };
};

/** تبدیل مقدار یک پاسخ به رشتهٔ قابل‌نمایش برای خروجی اکسل */
const formatAnswerForExcel = (value: any): string => {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) return value.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('، ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export const SubmissionsManager: React.FC<SubmissionsManagerProps> = ({
  form,
  submissions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch =
      sub.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.respondentName && sub.respondentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sub.respondentEmail && sub.respondentEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  const handleExportExcel = async () => {
    const includeScore = form.quizConfig.isQuiz;
    const columns: { header: string; key: string; width: number }[] = [
      { header: 'کد پیگیری', key: 'trackingCode', width: 24 },
      { header: 'نام پاسخ‌دهنده', key: 'respondentName', width: 24 },
      { header: 'نقش', key: 'respondentRole', width: 18 },
      { header: 'تاریخ ثبت', key: 'submittedAt', width: 22 },
      ...(includeScore ? [{ header: 'نمره آزمون', key: 'scoreTotal', width: 14 }] : []),
      ...form.fields.map(field => ({
        header: field.label,
        key: `field_${field.id}`,
        width: field.type === 'textarea' || field.type === 'matrix' ? 34 : 22
      }))
    ];
    const colCount = columns.length;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'سامانه نیما';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('پاسخ‌ها', {
      views: [{ rightToLeft: true, state: 'frozen', ySplit: 3 }]
    });
    sheet.columns = columns.map(c => ({ key: c.key, width: c.width }));

    const thinBorder: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFD1D5DB' } };

    // ردیف عنوان
    sheet.mergeCells(1, 1, 1, colCount);
    const titleCell = sheet.getCell(1, 1);
    titleCell.value = `پاسخ‌های ثبت‌شده — ${form.title}`;
    titleCell.font = { name: 'Tahoma', size: 14, bold: true, color: { argb: 'FF0F766E' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
    sheet.getRow(1).height = 30;

    // ردیف زیرعنوان
    sheet.mergeCells(2, 1, 2, colCount);
    const subtitleCell = sheet.getCell(2, 1);
    subtitleCell.value = `تعداد کل: ${filteredSubmissions.length} پاسخ   •   تاریخ خروجی: ${new Date().toLocaleDateString('fa-IR')}`;
    subtitleCell.font = { name: 'Tahoma', size: 10, color: { argb: 'FF475569' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDFA' } };
    sheet.getRow(2).height = 22;

    // ردیف سرستون‌ها
    const headerRow = sheet.getRow(3);
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Tahoma', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
      cell.border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
    });
    headerRow.height = 24;

    // ردیف‌های داده
    filteredSubmissions.forEach((s, idx) => {
      const fieldValues: Record<string, string> = {};
      form.fields.forEach(field => {
        fieldValues[`field_${field.id}`] = formatAnswerForExcel(s.answers[field.id]);
      });
      const row = sheet.addRow({
        trackingCode: s.trackingCode,
        respondentName: s.respondentName || 'ناشناس',
        respondentRole: s.respondentRole || 'کاربر',
        submittedAt: formatJalaliDateTime(s.submittedAt),
        scoreTotal: includeScore ? s.scoreTotal ?? '-' : undefined,
        ...fieldValues
      });
      const isEven = idx % 2 === 1;
      row.eachCell({ includeEmpty: true }, cell => {
        cell.font = { name: 'Tahoma', size: 10.5, color: { argb: 'FF334155' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' };
        cell.border = { top: thinBorder, left: thinBorder, bottom: thinBorder, right: thinBorder };
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
      });
      row.height = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Submissions_${form.id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              مدیریت و ارزیابی پاسخ‌های دریافتی ({submissions.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مشاهده پاسخ‌های دریافتی و خروجی اکسل
            </p>
          </div>
        </div>

        <button
          onClick={() => void handleExportExcel()}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow hover:shadow-emerald-500/20 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" /> دریافت خروجی Excel
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="جستجو بر اساس کد پیگیری، نام یا ایمیل..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Submissions Table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
        <table className="w-full text-xs text-right">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
            <tr>
              <th className="p-4">کد پیگیری</th>
              <th className="p-4">پاسخ‌دهنده</th>
              <th className="p-4">تاریخ و زمان ثبت</th>
              <th className="p-4">مدت زمان پاسخ</th>
              {form.quizConfig.isQuiz && <th className="p-4">نمره آزمون</th>}
              <th className="p-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSubmissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  هیچ پاسخی با مشخصات جستجو شده یافت نشد.
                </td>
              </tr>
            ) : (
              filteredSubmissions.map(sub => (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="p-4 font-bold text-teal-700 dark:text-teal-400">
                    {sub.trackingCode}
                  </td>
                  <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                    {sub.respondentName || 'ناشناس'}
                    {sub.respondentRole && (
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {sub.respondentRole}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-500">{formatJalaliDateTime(sub.submittedAt)}</td>
                  <td className="p-4 text-slate-500">{sub.completionTimeSeconds} ثانیه</td>
                  {form.quizConfig.isQuiz && (
                    <td className="p-4 font-extrabold text-indigo-600 dark:text-indigo-400">
                      {sub.scoreTotal !== undefined ? `${sub.scoreTotal} از ۱۰۰` : '-'}
                    </td>
                  )}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setSelectedSubmission(sub)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 dark:bg-slate-800 dark:hover:bg-teal-950/50 text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300 rounded-xl font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> مشاهده جزئیات
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submission Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  جزئیات کامل پاسخ کد: {selectedSubmission.trackingCode}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ثبت شده توسط {selectedSubmission.respondentName || 'کاربر'} در تاریخ {formatJalaliDateTime(selectedSubmission.submittedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  مشخصات ثبت‌کننده:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 mb-0.5">نام</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedSubmission.respondentName || 'ناشناس'}
                    </span>
                  </div>
                  {selectedSubmission.respondentEmail && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 mb-0.5">ایمیل</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                        {selectedSubmission.respondentEmail}
                      </span>
                    </div>
                  )}
                  {selectedSubmission.respondentRole && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400 mb-0.5">نقش</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedSubmission.respondentRole}
                      </span>
                    </div>
                  )}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 mb-0.5">آدرس IP</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                      {selectedSubmission.ipAddress || '-'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 mb-0.5">مرورگر</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {parseUserAgent(selectedSubmission.userAgent).browser}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 mb-0.5">سیستم‌عامل</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {parseUserAgent(selectedSubmission.userAgent).os}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                  پاسخ‌های ثبت‌شده:
                </h4>

                {Object.entries(selectedSubmission.answers).map(([fId, val], idx) => {
                  const field = form.fields.find(f => f.id === fId);
                  const isMultiline = field?.type === 'textarea';
                  const displayValue = typeof val === 'object' ? JSON.stringify(val) : String(val);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {field ? field.label : fId}:
                      </span>
                      {isMultiline ? (
                        <p className="text-teal-700 dark:text-teal-300 font-semibold whitespace-pre-wrap">
                          {displayValue}
                        </p>
                      ) : (
                        <span className="text-teal-700 dark:text-teal-300 font-semibold block">
                          {displayValue}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
