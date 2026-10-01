import React, { useEffect, useRef, useState } from 'react';
import ExcelJS from 'exceljs';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Inbox,
  Search,
  Filter,
  Clock,
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  Printer,
  UserCheck,
  MessageSquare,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { FormDefinition, FormField, FormSubmission } from './types';

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

/**
 * برچسب گزینه بر اساس مقدار ذخیره‌شده — فیلدهای select/radio/multiselect
 * مقدار (value) گزینه را در پاسخ ذخیره می‌کنند نه برچسب (label) قابل‌نمایش آن را؛
 * yesno هم گزینه‌هایش را در field.options ندارد و اینجا جداگانه مپ می‌شود.
 */
const resolveOptionLabel = (field: FormField | undefined, rawValue: any): string => {
  if (!field) return String(rawValue);
  const options = field.type === 'yesno'
    ? [{ value: 'yes', label: 'بله' }, { value: 'no', label: 'خیر' }]
    : field.options;
  if (!options || options.length === 0) return String(rawValue);
  const match = options.find(o => o.value === rawValue);
  return match ? match.label : String(rawValue);
};

/** پاسخ فیلدهای address/location یک آبجکت است: { full, province, city, postalCode, lat, lng } */
const isAddressAnswer = (field: FormField | undefined, value: any): boolean =>
  (field?.type === 'address' || field?.type === 'location') && value && typeof value === 'object';

/** نسخهٔ متنیِ خوانا از پاسخ آدرس — برای خروجی اکسل که نمی‌تواند نقشه نمایش دهد */
const formatAddressAsText = (value: any): string => {
  const parts: string[] = [];
  if (value.full) parts.push(String(value.full));
  if (value.province) parts.push(`استان: ${value.province}`);
  if (value.city) parts.push(`شهر: ${value.city}`);
  if (value.postalCode) parts.push(`کدپستی: ${value.postalCode}`);
  if (value.lat && value.lng) parts.push(`مختصات: ${value.lat}, ${value.lng}`);
  return parts.length > 0 ? parts.join(' — ') : '-';
};

/** پسوند واحد فیلدهای عددی/اسلایدر/ارزی/درصدی — همان چیزی که در خروجی فرم کنار مقدار نشان داده می‌شود */
const unitSuffixFor = (field: FormField | undefined): string | null => {
  if (!field) return null;
  if (field.type === 'percentage') return '٪';
  if (field.type === 'currency') return field.currencyUnit || 'تومان';
  if (field.type === 'number' || field.type === 'slider') return field.numberUnit || null;
  return null;
};

/** تبدیل مقدار یک پاسخ به رشتهٔ قابل‌نمایش — برای فیلدهای چند‌انتخابی، برچسب گزینه نمایش داده می‌شود نه مقدار خام آن */
const formatAnswerValue = (field: FormField | undefined, value: any): string => {
  if (value === undefined || value === null || value === '') return '-';
  if (isAddressAnswer(field, value)) return formatAddressAsText(value);
  if (isFileAnswer(field, value)) {
    // data: URLهای امضای ترسیمی می‌توانند چندهزار کاراکتر باشند — در خروجی اکسل به‌جای
    // آن متن حجیم، فقط یک برچسب کوتاه نوشته می‌شود؛ برای فایل/تصویر آپلودشده همان لینک
    // واقعی نوشته می‌شود که اکسل آن را خودکار قابل‌کلیک می‌کند
    return value.startsWith('data:') ? 'فایل پیوست (امضای ترسیمی)' : value;
  }
  if (Array.isArray(value)) {
    return value.map(v => (typeof v === 'object' ? JSON.stringify(v) : resolveOptionLabel(field, v))).join('، ');
  }
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'number') {
    const unit = unitSuffixFor(field);
    return unit ? `${value} ${unit}` : String(value);
  }
  return resolveOptionLabel(field, value);
};

/**
 * نمایش فقط‌خواندنیِ یک نقطه روی نقشهٔ ماهواره‌ای (Esri World Imagery) — بدون امکان
 * کلیک/جابه‌جایی، صرفاً برای دیدن مکان ثبت‌شده در یک پاسخ. leaflet با import پویا
 * بارگذاری می‌شود تا فقط وقتی واقعاً یک پاسخ دارای مختصات باز می‌شود، دانلود شود.
 */
const ReadOnlyMapView: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('leaflet').then(L => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 15,
        dragging: true,
        scrollWheelZoom: false,
      });
      mapRef.current = map;
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }).addTo(map);
      const pinIcon = L.divIcon({
        html: `<i class="fa-solid fa-location-dot" style="font-size:26px;color:#0d9488;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))"></i>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 26],
      });
      L.marker([lat, lng], { icon: pinIcon, interactive: false }).addTo(map);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return <div ref={containerRef} className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800" />;
};

/** نمایش ساختاریافتهٔ پاسخ فیلد آدرس/لوکیشن در مودال جزئیات — به‌جای dump خام JSON */
const AddressAnswerCard: React.FC<{ value: any }> = ({ value }) => {
  const rows: { label: string; text: string }[] = [];
  if (value.full) rows.push({ label: 'آدرس کامل', text: value.full });
  if (value.province) rows.push({ label: 'استان', text: value.province });
  if (value.city) rows.push({ label: 'شهر', text: value.city });
  if (value.postalCode) rows.push({ label: 'کد پستی', text: value.postalCode });

  return (
    <div className="space-y-2">
      {rows.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {rows.map(r => (
            <div key={r.label} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="block text-[10px] text-slate-400">{r.label}</span>
              <span className="text-teal-700 dark:text-teal-300 font-semibold">{r.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-slate-400">-</span>
      )}
      {value.lat && value.lng && (
        <>
          <ReadOnlyMapView lat={value.lat} lng={value.lng} />
          <span className="block text-[10px] text-slate-400 font-mono" dir="ltr">
            {value.lat}, {value.lng}
          </span>
        </>
      )}
    </div>
  );
};

/**
 * پاسخ فیلدهای file/image و امضای ترسیمی/آپلودی یک URL (یا data: URL برای امضای ترسیمی) است —
 * نه یک آبجکت مثل آدرس. امضای تایپی («type») فقط متن ساده است، نه فایل.
 */
const isFileAnswer = (field: FormField | undefined, value: any): boolean => {
  if (!field || typeof value !== 'string' || !value) return false;
  if (field.type === 'file' || field.type === 'image') return true;
  if (field.type === 'signature') return field.signaturePadType !== 'type';
  return false;
};

const IMAGE_EXT_PATTERN = /\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i;
const isImageLikeUrl = (value: string): boolean => value.startsWith('data:image') || IMAGE_EXT_PATTERN.test(value);

const fileNameFromUrl = (value: string): string => {
  if (value.startsWith('data:')) return 'امضا.png';
  try {
    const path = new URL(value).pathname;
    return decodeURIComponent(path.split('/').pop() || value);
  } catch {
    return value.split('/').pop() || value;
  }
};

/** نمایش پاسخ فایل/تصویر/امضا در مودال جزئیات — پیش‌نمایش تصویر (در صورت وجود) + دکمهٔ دانلود، به‌جای چاپ خام URL */
const FileAnswerCard: React.FC<{ value: string }> = ({ value }) => {
  const isImage = isImageLikeUrl(value);
  const name = fileNameFromUrl(value);
  return (
    <div className="flex items-center gap-3">
      {isImage ? (
        <a href={value} target="_blank" rel="noreferrer">
          <img src={value} alt={name} className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-800" />
        </a>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-slate-400" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={name}>{name}</p>
        <a
          href={value}
          download={name}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 mt-0.5"
        >
          <Download className="w-3 h-3" /> دانلود فایل
        </a>
      </div>
    </div>
  );
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
      { header: 'تاریخ ثبت', key: 'submittedAt', width: 22 },
      ...(includeScore ? [{ header: 'نمره آزمون', key: 'scoreTotal', width: 14 }] : []),
      ...form.fields.map((field, idx) => ({
        // برخی فیلدها (مثلاً hidden یا فیلدهای سیستمی) ممکن است label خالی داشته باشند —
        // بدون این fallback، عنوان ستون در اکسل کاملاً خالی می‌ماند
        header: field.label?.trim() || field.placeholder?.trim() || `فیلد ${idx + 1}`,
        key: `field_${field.id}`,
        width: field.type === 'textarea' ? 34 : 22
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
        fieldValues[`field_${field.id}`] = formatAnswerValue(field, s.answers[field.id]);
      });
      const row = sheet.addRow({
        trackingCode: s.trackingCode,
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
                  const isAddress = isAddressAnswer(field, val);
                  const isFile = isFileAnswer(field, val);
                  const displayValue = formatAnswerValue(field, val);
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1"
                    >
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {field ? field.label : fId}:
                      </span>
                      {isAddress ? (
                        <AddressAnswerCard value={val} />
                      ) : isFile ? (
                        <FileAnswerCard value={val} />
                      ) : isMultiline ? (
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
