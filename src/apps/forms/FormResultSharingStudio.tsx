import React, { useState } from 'react';
import {
  Share2,
  ShieldCheck,
  UserCheck,
  Globe,
  Code2,
  Download,
  QrCode,
  Copy,
  Plus,
  Trash2,
  Check,
  AlertTriangle
} from 'lucide-react';
import {
  FormDefinition,
  UserAccessRule,
  FormAccessPermission,
  FormStatus
} from './types';
import { PUBLIC_SITE_URL } from '@/src/shared-constants';

interface FormResultSharingStudioProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
  onChangeStatus: (status: FormStatus) => void | Promise<void>;
  isChangingStatus: boolean;
}

const STATUS_OPTIONS: { value: FormStatus; label: string; className: string }[] = [
  { value: 'draft', label: 'پیش‌نویس', className: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  { value: 'published', label: 'منتشرشده', className: 'bg-teal-600 text-white' },
  { value: 'page_builder_only', label: 'انتشار فقط در صفحه‌ساز', className: 'bg-indigo-600 text-white' },
  { value: 'paused', label: 'غیرفعال (متوقف)', className: 'bg-amber-500 text-white' },
  { value: 'archived', label: 'بایگانی‌شده', className: 'bg-rose-600 text-white' }
];

const ALL_PERMISSIONS: { id: FormAccessPermission; label: string; group: string }[] = [
  { id: 'view_stats', label: 'مشاهده آمار تجمیعی', group: 'آمار و نمودار' },
  { id: 'view_charts', label: 'مشاهده نمودارها', group: 'آمار و نمودار' },
  { id: 'export_excel', label: 'دریافت خروجی Excel', group: 'دریافت خروجی' },
  { id: 'export_csv', label: 'دریافت خروجی CSV', group: 'دریافت خروجی' },
  { id: 'export_pdf', label: 'دریافت خروجی PDF', group: 'دریافت خروجی' },
  { id: 'view_raw_answers', label: 'مشاهده پاسخ‌های خام', group: 'داده‌ها' },
  { id: 'view_filtered', label: 'مشاهده پاسخ‌های فیلترشده', group: 'داده‌ها' },
  { id: 'create_report', label: 'ایجاد گزارش جدید', group: 'گزارش‌گیری' },
  { id: 'print_report', label: 'چاپ گزارش', group: 'گزارش‌گیری' },
  { id: 'view_respondent_identity', label: 'مشاهده اطلاعات هویتی پاسخ‌دهندگان', group: 'محرمانه' },
  { id: 'edit_survey', label: 'ویرایش ساختار پرسشنامه', group: 'مدیریت (معمولاً لغو)' },
  { id: 'delete_survey', label: 'حذف پرسشنامه', group: 'مدیریت (معمولاً لغو)' }
];

export const FormResultSharingStudio: React.FC<FormResultSharingStudioProps> = ({
  form,
  onChange,
  onChangeStatus,
  isChangingStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'user_access' | 'public_link'>('public_link');

  // Local state for user access rule form
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<FormAccessPermission[]>([
    'view_stats',
    'view_charts',
    'export_excel',
    'export_pdf',
    'create_report'
  ]);

  const [copiedField, setCopiedField] = useState<'link' | 'iframe' | null>(null);
  const [qrSaveSuccess, setQrSaveSuccess] = useState(false);

  // فرم‌های تازه‌ساخته‌شده که هنوز ذخیره نشده‌اند شناسه‌ی موقت سمت کلاینت دارند
  // (form_...) و در بک‌اند وجود ندارند — لینک و کد جاسازی برایشان بی‌معناست چون
  // به id عددی واقعی فرم (برای شورت‌کد) نیاز دارند.
  const formIsUnpersisted = form.id.startsWith('form_');
  const isPublished = form.status === 'published';

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    onChange({ ...form, slug: sanitized });
  };

  const directUrl = `${PUBLIC_SITE_URL}/forms/${form.slug}`;
  const iframeCode = `<iframe src="${directUrl}" width="100%" height="600" frameborder="0" style="border:0; border-radius: 16px;"></iframe>`;

  const handleCopy = (text: string, field: 'link' | 'iframe') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(directUrl)}`;
  const handleSaveQrCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      if (!response.ok) throw new Error('QR request failed');
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${form.slug}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setQrSaveSuccess(true);
      setTimeout(() => setQrSaveSuccess(false), 2500);
    } catch {
      window.open(qrCodeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Add User Access Rule
  const handleAddUserRule = () => {
    if (!newUserName.trim() || !newUserRole.trim()) return;

    const newRule: UserAccessRule = {
      id: `uar_${Date.now()}`,
      userName: newUserName,
      userEmail: newUserEmail,
      userRole: newUserRole,
      department: newUserDept || 'سازمانی',
      permissions: selectedPerms,
      assignedAt: '۱۴۰۵/۰۵/۱۰',
      status: 'active'
    };

    const currentRules = form.userAccessRules || [];
    const updatedRules = [...currentRules, newRule];

    onChange({
      ...form,
      userAccessRules: updatedRules
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('');
    setNewUserDept('');
    setIsAddingUser(false);
  };

  // Remove Rule
  const handleRemoveRule = (ruleId: string) => {
    const updated = (form.userAccessRules || []).filter(r => r.id !== ruleId);
    onChange({
      ...form,
      userAccessRules: updated
    });
  };

  // Toggle permission in new user modal
  const togglePermission = (perm: FormAccessPermission) => {
    if (selectedPerms.includes(perm)) {
      setSelectedPerms(selectedPerms.filter(p => p !== perm));
    } else {
      setSelectedPerms([...selectedPerms, perm]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                سیستم مدیریت دسترسی و انتشار نتایج (Report & Result Sharing)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                تفکیک کامل دسترسی CMS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تعیین سطح دسترسی اختصاصی کاربران بدون ورود به پنل مدیریت + انتشار صفحه عمومی نتایج با کنترل‌های امنیتی و محرمانه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Form Status */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">وضعیت فرم:</label>
            {formIsUnpersisted ? (
              <div
                className="relative flex items-center rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3.5 py-2 cursor-not-allowed"
                title="ابتدا فرم را از دکمه‌ی «ذخیره فرم» ذخیره کنید تا بتوانید وضعیت آن را تغییر دهید."
              >
                {STATUS_OPTIONS.find(s => s.value === form.status)?.label}
              </div>
            ) : (
              <div
                className={`relative flex items-center rounded-xl font-bold text-xs ${
                  isChangingStatus ? 'opacity-60' : ''
                } ${STATUS_OPTIONS.find(s => s.value === form.status)?.className}`}
              >
                <select
                  value={form.status}
                  onChange={e => void onChangeStatus(e.target.value as FormStatus)}
                  disabled={isChangingStatus}
                  title="وضعیت فرم"
                  className="appearance-none bg-transparent pl-3.5 pr-3.5 py-2 cursor-pointer disabled:cursor-not-allowed border-0 outline-none"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Tab 1: User & Role Granular Access Rules */}
      {activeSubTab === 'user_access' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                تعیین دسترسی اختصاصی به شخص، کاربر یا نقش سازمانی
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                کاربران تعیین‌شده فقط به آمار و نتایج **همین یک پرسشنامه** دسترسی دارند و به هیچ بخش دیگری از CMS یا سایر فرم‌ها دسترسی نخواهند داشت.
              </p>
            </div>

            <button
              onClick={() => setIsAddingUser(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> تخصیص دسترسی جدید
            </button>
          </div>

          {/* Add User Modal / Panel */}
          {isAddingUser && (
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-teal-200 dark:border-teal-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  افزودن کاربر یا نقش سازمانی برای دریافت نتایج
                </h4>
                <button
                  onClick={() => setIsAddingUser(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  انصراف ✖
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی مسئول *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: جناب آقای حسینی (مسئول فرهنگی)"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نقش سازمانی *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: مسئول فرهنگی / مدیر گروه آموزشی"
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    پست الکترونیکی (جهت ورود یا ارسال لینک)
                  </label>
                  <input
                    type="email"
                    placeholder="cultural@university.ac.ir"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    دپارتمان / معاونت
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: معاونت فرهنگی و دانشجویی"
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  تعیین دقیق سطح دسترسی اختصاصی (Granular Permissions):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {ALL_PERMISSIONS.map(perm => {
                    const isChecked = selectedPerms.includes(perm.id);
                    const isForbidden = perm.id === 'edit_survey' || perm.id === 'delete_survey';

                    return (
                      <label
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer border text-xs transition-all ${
                          isChecked
                            ? isForbidden
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border-teal-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-semibold">{isChecked ? '✓' : '✗'}</span>
                        <span className="flex-1">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  onClick={handleAddUserRule}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  ذخیره و اعطای دسترسی
                </button>
              </div>
            </div>
          )}

          {/* User Access Rules Table */}
          <div className="space-y-3">
            {(form.userAccessRules || []).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  هنوز دسترسی اختصاصی منفردی برای این پرسشنامه ثبت نشده است.
                </p>
                <p className="text-[11px] text-slate-400">
                  می‌توانید برای مسئول یا مدیر گروه، فقط دسترسی به آمار و گزارش‌های همین پرسشنامه را تعریف کنید.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3">کاربر / شخص</th>
                      <th className="p-3">نقش و دپارتمان</th>
                      <th className="p-3">سطوح دسترسی مجاز</th>
                      <th className="p-3">وضعیت</th>
                      <th className="p-3">تاریخ اعطا</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(form.userAccessRules || []).map(rule => (
                      <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          <div>{rule.userName}</div>
                          {rule.userEmail && <div className="text-[10px] text-slate-400 font-normal">{rule.userEmail}</div>}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">{rule.userRole}</span>
                          <div className="text-[10px] text-slate-400">{rule.department}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {rule.permissions.map(p => {
                              const permObj = ALL_PERMISSIONS.find(ap => ap.id === p);
                              return (
                                <span
                                  key={p}
                                  className="px-2 py-0.5 rounded text-[10px] bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                >
                                  ✓ {permObj ? permObj.label : p}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            فعال
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{rule.assignedAt}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="لغو دسترسی"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Direct link, embed code & QR for the form itself */}
      {activeSubTab === 'public_link' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-600" />
              لینک مستقیم و کد جاسازی فرم
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              آدرس مستقیم و کد iframe برای انتشار همین فرم در وب‌سایت
            </p>
          </div>

          {formIsUnpersisted ? (
            <div className="py-10 text-center text-xs font-bold text-slate-500">
              برای دریافت لینک و کد جاسازی، ابتدا فرم را از دکمه‌ی «ذخیره فرم» ذخیره کنید.
            </div>
          ) : form.status === 'page_builder_only' ? (
            <div className="py-10 text-center text-xs font-bold text-slate-500 space-y-1.5">
              <p>این فرم با وضعیت «انتشار فقط در صفحه‌ساز» تنظیم شده و لینک عمومی مستقلی ندارد.</p>
              <p className="text-slate-400 font-normal">
                برای استفاده از آن، از بخش «صفحه‌ساز هوشمند» این فرم را به‌عنوان یک ویجت به صفحه‌ی دلخواه اضافه کنید.
              </p>
            </div>
          ) : (
            <>
              {!isPublished && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                    این فرم هنوز منتشر نشده است؛ لینک، کدها و QR زیر تا انتشار فرم غیرفعال هستند. شناسه‌ی slug را می‌توانید همین حالا تنظیم کنید.
                  </p>
                </div>
              )}

              {/* Direct Link + Slug (right column) and QR Code (left column) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 space-y-3">
                  <div className={`flex items-center justify-between transition-opacity ${!isPublished ? 'opacity-50' : ''}`}>
                    <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      لینک مستقیم اشتراک‌گذاری (Direct Link):
                    </span>
                    <button
                      onClick={() => handleCopy(directUrl, 'link')}
                      disabled={!isPublished}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-teal-300 dark:border-teal-700 shadow-sm disabled:cursor-not-allowed"
                    >
                      {copiedField === 'link' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedField === 'link' ? 'کپی شد! ✓' : 'کپی لینک'}
                    </button>
                  </div>

                  <div
                    className={`flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-teal-800 dark:text-teal-300 dir-ltr text-left transition-opacity ${
                      !isPublished ? 'opacity-50' : ''
                    }`}
                  >
                    <span>{directUrl}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 shrink-0">
                      بخش انتهایی آدرس (Slug):
                    </span>
                    <input
                      type="text"
                      value={form.slug}
                      onChange={e => handleSlugChange(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs dir-ltr text-left"
                    />
                  </div>
                </div>

                {/* QR Code */}
                <div
                  className={`lg:col-span-1 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3 text-center transition-opacity ${
                    !isPublished ? 'opacity-50' : ''
                  }`}
                >
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-teal-600" /> کد QR لینک فرم
                  </h3>
                  {isPublished ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-32 h-32 object-contain p-2 bg-white rounded-2xl border border-slate-200 shadow-md"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-bold text-center p-3">
                      پس از انتشار فرم نمایش داده می‌شود
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500">اسکن برای دسترسی سریع موبایلی به فرم</p>
                  <button
                    onClick={handleSaveQrCode}
                    disabled={!isPublished}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {qrSaveSuccess ? 'ذخیره شد!' : 'ذخیره تصویر QR'}
                  </button>
                </div>
              </div>

              {/* Iframe */}
              <div
                className={`p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 transition-opacity ${
                  !isPublished ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-600" /> کد جاگذاری HTML (Iframe Embed Code):
                  </span>
                  <button
                    onClick={() => handleCopy(iframeCode, 'iframe')}
                    disabled={!isPublished}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 shadow-sm disabled:cursor-not-allowed"
                  >
                    {copiedField === 'iframe' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'iframe' ? 'کپی شد! ✓' : 'کپی کد'}
                  </button>
                </div>
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 dir-ltr text-left break-all">
                  {iframeCode}
                </div>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
};
