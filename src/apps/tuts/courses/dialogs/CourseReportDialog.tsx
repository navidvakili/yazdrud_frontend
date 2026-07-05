// ============================================================
// CourseReportDialog — نمایش آمار و جزئیات پیش‌ثبت‌نام دوره
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import {
  X, BarChart2, Award, CheckCircle, Download, Eye, XCircle,
} from 'lucide-react';
import type { TutCourse, TutRegistrant } from '../../shared/types';

interface CourseReportDialogProps {
  course: TutCourse | null;
  registrants: TutRegistrant[];
  currentUserRole: 'admin' | 'student';
  toPersianDigits: (str: string) => string;
  formatCurrency: (amount: number) => string;
  onClose: () => void;
  onApproveAllCertificates: () => void;
  onDownloadAllCertificates: () => void;
  onApproveCertificate: (regId: string) => void;
  onRejectCertificate: (regId: string) => void;
  onPreviewCertificate: (regId: string) => void;
  onExportSingleCourseExcel: (course: TutCourse) => void;
}

export default function CourseReportDialog({
  course,
  registrants,
  currentUserRole,
  toPersianDigits,
  formatCurrency,
  onClose,
  onApproveAllCertificates,
  onDownloadAllCertificates,
  onApproveCertificate,
  onRejectCertificate,
  onPreviewCertificate,
  onExportSingleCourseExcel,
}: CourseReportDialogProps) {
  if (!course) return null;

  const courseRegistrants = registrants.filter(r => r.courseId === course.id);
  const verifiedRegistrants = courseRegistrants.filter(r => r.status === 'verified');
  const pendingRegistrants = courseRegistrants.filter(r => r.status === 'pending');
  const totalRevenue = verifiedRegistrants.reduce((sum, r) => sum + r.amount, 0);

  return (
    <AnimatePresence>
      {course && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-4xl p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative my-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-gray-900 dark:text-white leading-snug mb-2 flex items-center gap-1.5">
              <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              آمار و جزئیات پیش‌ثبت‌نام دوره: {course.title}
            </h3>
            <p className="text-xs text-gray-400 mb-6">مدرس: {course.lecturer} | دپارتمان: {course.category}</p>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 block font-bold mb-1">کل پیش‌ثبت‌نام‌ها</span>
                <span className="text-base font-black text-gray-900 dark:text-white">
                  {toPersianDigits(String(courseRegistrants.length))} نفر
                </span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 block font-bold mb-1">تایید شده نهایی</span>
                <span className="text-base font-black text-emerald-600">
                  {toPersianDigits(String(verifiedRegistrants.length))} نفر
                </span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 block font-bold mb-1">در انتظار بررسی</span>
                <span className="text-base font-black text-amber-500">
                  {toPersianDigits(String(pendingRegistrants.length))} نفر
                </span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                <span className="text-[10px] text-gray-400 block font-bold mb-1">درآمد کل دوره (تایید شده)</span>
                <span className="text-base font-black text-teal-600 dark:text-teal-400">
                  {formatCurrency(totalRevenue)}
                </span>
              </div>
            </div>

            {/* Certificate Management Bar - for admin */}
            {currentUserRole === 'admin' && (
              <div className="flex flex-wrap gap-3 items-center bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/40 mb-6">
                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">مدیریت صدور گواهی:</span>
                <button
                  onClick={onApproveAllCertificates}
                  disabled={verifiedRegistrants.length === 0}
                  className={`px-3 py-2 text-[10px] font-extrabold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${verifiedRegistrants.length > 0
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  تایید همه برای صدور گواهی
                </button>
                <button
                  onClick={onDownloadAllCertificates}
                  className="px-3 py-2 text-[10px] font-extrabold rounded-xl flex items-center gap-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  دانلود همه گواهی‌ها
                </button>
              </div>
            )}

            {/* Registrants Table — full columns with independent scroll */}
            <div className="rounded-2xl border border-gray-150 dark:border-gray-850 bg-white dark:bg-gray-950 mb-6">
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 font-bold border-b border-gray-150 dark:border-gray-850">
                      <th className="p-2 text-center w-10">ردیف</th>
                      <th className="p-2 whitespace-nowrap">کد ملی</th>
                      <th className="p-2 whitespace-nowrap">نام و نام خانوادگی</th>
                      <th className="p-2 whitespace-nowrap">شماره دانشجویی</th>
                      <th className="p-2 whitespace-nowrap">موبایل</th>
                      <th className="p-2 whitespace-nowrap">نوع کاربر</th>
                      <th className="p-2 whitespace-nowrap">تاریخ ثبت نام</th>
                      {currentUserRole === 'admin' && <th className="p-2 text-center whitespace-nowrap">عملیات گواهی</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                    {verifiedRegistrants.length === 0 ? (
                      <tr>
                        <td colSpan={currentUserRole === 'admin' ? 8 : 7} className="p-8 text-center text-gray-400">
                          تاکنون هیچ سندی برای پیش‌ثبت‌نام این کارگاه مهارتی آپلود نگردیده است.
                        </td>
                      </tr>
                    ) : (
                      verifiedRegistrants.map((reg, idx) => (
                        <tr key={reg.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-all">
                          <td className="p-2 text-center font-bold text-gray-400 w-10">
                            {toPersianDigits(String(idx + 1))}
                          </td>
                          <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {toPersianDigits(reg.nationalCode)}
                          </td>
                          <td className="p-2 font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                            {reg.name}
                          </td>
                          <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {toPersianDigits(reg.studentCode)}
                          </td>
                          <td className="p-2 font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap" dir="ltr">
                            {toPersianDigits(reg.mobile)}
                          </td>
                          <td className="p-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {reg.typeText}
                          </td>
                          <td className="p-2 text-gray-500 whitespace-nowrap">
                            {toPersianDigits(reg.date)}
                          </td>
                          {/* Certificate Actions Column */}
                          {currentUserRole === 'admin' && (
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {reg.status === 'verified' && (
                                  <>
                                    {!reg.certificateApproved ? (
                                      <button
                                        onClick={() => onApproveCertificate(reg.id)}
                                        className="px-2 py-1 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg font-bold hover:bg-emerald-500/20 transition-all cursor-pointer"
                                        title="تایید برای صدور گواهی"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5 inline ml-0.5" />
                                        تایید گواهی
                                      </button>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => onRejectCertificate(reg.id)}
                                          className="px-2 py-1 text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg font-bold hover:bg-rose-500/20 transition-all cursor-pointer"
                                          title="لغو تایید گواهی"
                                        >
                                          <XCircle className="w-3.5 h-3.5 inline ml-0.5" />
                                          لغو
                                        </button>
                                        {!reg.hasCertificate ? (
                                          <button
                                            onClick={() => onPreviewCertificate(reg.id)}
                                            className="px-2 py-1 text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold hover:bg-indigo-500/20 transition-all cursor-pointer"
                                            title="پیش‌نمایش گواهی"
                                          >
                                            <Eye className="w-3.5 h-3.5 inline ml-0.5" />
                                            پیش نمایش مدرک
                                          </button>
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => onPreviewCertificate(reg.id)}
                                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-500/10 transition-all cursor-pointer"
                                              title="پیش‌نمایش گواهی"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => onPreviewCertificate(reg.id)}
                                              className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer"
                                              title="دانلود گواهی"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                            </button>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => onExportSingleCourseExcel(course)}
                disabled={courseRegistrants.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                خروجی اکسل پیش‌ثبت‌نام‌ها
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                بستن گزارش
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
