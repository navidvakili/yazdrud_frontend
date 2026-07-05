// ============================================================
// PreRegistrationDialog — فرم پیش‌ثبت‌نام کارگاه مهارتی با آپلود فیش
// ============================================================

import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Upload, Check } from 'lucide-react';
import type { TutCourse, TutVoucher } from '../../shared/types';

interface PreRegistrationDialogProps {
  course: TutCourse | null;
  studentName: string;
  setStudentName: (v: string) => void;
  studentIdNum: string;
  setStudentIdNum: (v: string) => void;
  studentEmail: string;
  setStudentEmail: (v: string) => void;
  studentPhone: string;
  setStudentPhone: (v: string) => void;
  studentProvince: string;
  setStudentProvince: (v: string) => void;
  simulatedDevice: string;
  setSimulatedDevice: (v: 'desktop' | 'mobile') => void;
  simulatedReferrer: string;
  setSimulatedReferrer: (v: string) => void;
  studentVoucherCode: string;
  setStudentVoucherCode: (v: string) => void;
  appliedVoucher: TutVoucher | null;
  voucherError: string | null;
  voucherDiscountAmount: number;
  selectedInstallments: number;
  setSelectedInstallments: (v: number) => void;
  refCodeInput: string;
  setRefCodeInput: (v: string) => void;
  selectedBank: string;
  setSelectedBank: (v: string) => void;
  uploadProgress: number;
  uploadFileName: string;
  isUploading: boolean;
  formatCurrency: (amount: number) => string;
  toPersianDigits: (str: string) => string;
  onSubmit: (e: React.FormEvent) => void;
  onValidateVoucher: () => void;
  onSimulateUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export default function PreRegistrationDialog({
  course,
  studentName, setStudentName,
  studentIdNum, setStudentIdNum,
  studentEmail, setStudentEmail,
  studentPhone, setStudentPhone,
  studentProvince, setStudentProvince,
  simulatedDevice, setSimulatedDevice,
  simulatedReferrer, setSimulatedReferrer,
  studentVoucherCode, setStudentVoucherCode,
  appliedVoucher,
  voucherError,
  voucherDiscountAmount,
  selectedInstallments, setSelectedInstallments,
  refCodeInput, setRefCodeInput,
  selectedBank, setSelectedBank,
  uploadProgress,
  uploadFileName,
  isUploading,
  formatCurrency,
  toPersianDigits,
  onSubmit,
  onValidateVoucher,
  onSimulateUpload,
  onClose,
}: PreRegistrationDialogProps) {
  if (!course) return null;

  return (
    <AnimatePresence>
      {course && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs mb-3">
              <FileText className="w-4 h-4" />
              <span>تکمیل فرآیند پیش‌ثبت‌نام و ارسال سند مالی</span>
            </div>

            <h3 className="text-sm font-black text-gray-900 dark:text-white leading-snug mb-4">
              ثبت‌نام در: {course.title}
            </h3>

            <div className="mb-5 p-4 bg-teal-500/5 rounded-2xl border border-teal-500/10 text-xs text-gray-600 dark:text-gray-400 leading-relaxed text-justify">
              جهت تایید نهایی پذیرش در این کارگاه آزاد، مقتضی است مبلغ <strong className="text-teal-600 font-black">{formatCurrency(course.cost)}</strong> را به حساب شماره <strong className="font-black">{toPersianDigits('۰۱۱۲۳۴۵۶۷۸۹')}</strong> بانک ملی ایران به نام دانشگاه علم و هنر واریز نموده و مشخصات فیش شتابی را در زیر آپلود فرمایید.
            </div>

            <form onSubmit={onSubmit} className="space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">نام و نام خانوادگی دانشجو</label>
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: مارال سالمی"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد ملی / دانشجویی</label>
                  <input
                    type="text"
                    required
                    value={studentIdNum}
                    onChange={(e) => setStudentIdNum(e.target.value)}
                    placeholder="مثال: ۴۰۲۱۵۱۴۰۱۵"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">آدرس ایمیل</label>
                  <input
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none text-left"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">شماره موبایل</label>
                  <input
                    type="tel"
                    required
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none text-left"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-850">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">استان سکونت (تست Geo)</label>
                  <select
                    value={studentProvince}
                    onChange={(e) => setStudentProvince(e.target.value)}
                    className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none"
                  >
                    <option value="تهران">تهران</option>
                    <option value="خراسان رضوی">خراسان رضوی</option>
                    <option value="یزد">یزد</option>
                    <option value="فارس">فارس</option>
                    <option value="اصفهان">اصفهان</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">دستگاه (تست فنی)</label>
                  <select
                    value={simulatedDevice}
                    onChange={(e) => setSimulatedDevice(e.target.value as 'desktop' | 'mobile')}
                    className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none"
                  >
                    <option value="desktop">مرورگر دسکتاپ</option>
                    <option value="mobile">اپلیکیشن موبایل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">منبع ارجاع (UTM)</label>
                  <select
                    value={simulatedReferrer}
                    onChange={(e) => setSimulatedReferrer(e.target.value)}
                    className="w-full text-[11px] p-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none appearance-none"
                  >
                    <option value="">پیش‌فرض پورتال</option>
                    <option value="blog">وبلاگ دانشگاه</option>
                    <option value="instagram">اینستاگرام</option>
                  </select>
                </div>
              </div>

              {/* VOUCHER APPLICATION FIELD */}
              <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-500/15 rounded-2xl space-y-2.5">
                <label className="block text-xs font-extrabold text-indigo-900 dark:text-indigo-400">کد بن خرید یا تخفیف مهارتی</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={studentVoucherCode}
                    onChange={(e) => setStudentVoucherCode(e.target.value)}
                    placeholder="مثال: WELCOME_ONLINE یا YALDA1405"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white focus:outline-none uppercase"
                  />
                  <button
                    type="button"
                    onClick={onValidateVoucher}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    اعمال بن
                  </button>
                </div>

                {voucherError && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl text-[10.5px] border border-rose-500/10 font-medium">
                    ⚠ {voucherError}
                  </div>
                )}

                {appliedVoucher && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-extrabold">✓ بن تخفیف با موفقیت اعمال شد:</span>
                      <span className="bg-emerald-500/10 px-2 py-0.5 rounded text-[9.5px] font-black">{appliedVoucher.code}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{appliedVoucher.title}</p>
                    <div className="flex justify-between items-center text-xs font-black mt-2 pt-1.5 border-t border-emerald-500/10">
                      <span>کاهش شهریه:</span>
                      <span>-{formatCurrency(voucherDiscountAmount)}</span>
                    </div>

                    {appliedVoucher.allowInstallments && appliedVoucher.installmentCount && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/10 space-y-1 text-right">
                        <label className="block text-[10px] font-bold text-gray-400">گزینه پرداخت چندقسطی فعال شد:</label>
                        <select
                          value={selectedInstallments}
                          onChange={(e) => setSelectedInstallments(parseInt(e.target.value))}
                          className="w-full text-[10.5px] p-2 rounded-lg border border-emerald-500/20 bg-white dark:bg-gray-900 text-emerald-700 dark:text-emerald-400 font-sans focus:outline-none appearance-none"
                        >
                          <option value={1}>پرداخت یکجا (نقدی)</option>
                          <option value={appliedVoucher.installmentCount}>
                            پرداخت اقساطی ({toPersianDigits(String(appliedVoucher.installmentCount))} قسطه - هر قسط {formatCurrency(Math.round((course.cost - voucherDiscountAmount) / appliedVoucher.installmentCount))})
                          </option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {!appliedVoucher && (
                  <p className="text-[9.5px] text-gray-400">کدهای پیش‌فرض جهت تست: <code className="text-indigo-500 font-bold">WELCOME_ONLINE</code> (۳۰٪ تخفیف + اقساط) یا <code className="text-indigo-500 font-bold">YALDA1405</code> (۲۰٪ تخفیف) یا <code className="text-indigo-500 font-bold">FIRST_BUYER</code> (اولین خرید)</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">کد پیگیری شتابی (فیش)</label>
                  <input
                    type="text"
                    required
                    value={refCodeInput}
                    onChange={(e) => setRefCodeInput(e.target.value)}
                    placeholder="کد پیگیری ۶ الی ۱۰ رقمی"
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">بانک مبدأ پرداخت</label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-950 dark:text-white focus:outline-none appearance-none"
                  >
                    <option value="بانک ملی ایران">بانک ملی ایران</option>
                    <option value="بانک ملت">بانک ملت</option>
                    <option value="بانک سامان">بانک سامان</option>
                    <option value="بانک تجارت">بانک تجارت</option>
                    <option value="بانک قرض‌الحسنه رسالت">بانک قرض‌الحسنه رسالت</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">بارگذاری عکس یا PDF فیش پرداخت</label>
                <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-950/50 text-center relative hover:bg-gray-100/30 transition-all">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onSimulateUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 mx-auto text-teal-600 dark:text-teal-400 mb-1.5" />
                  <span className="text-[10.5px] text-gray-500 block">فایل فیش واریزی خود را به اینجا بکشید یا کلیک کنید</span>
                  <span className="text-[8.5px] text-gray-400 block mt-0.5">فرمت‌های مجاز: JPG, PNG, PDF | حداکثر ۵ مگابایت</span>

                  {isUploading && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <span className="text-[9px] text-teal-600 font-bold block mt-1">در حال بارگذاری فایل... {toPersianDigits(String(uploadProgress))}٪</span>
                    </div>
                  )}

                  {!isUploading && uploadFileName && (
                    <div className="mt-2 p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-[9.5px] flex items-center justify-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>فایل بارگذاری شد: {uploadFileName}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  ثبت نهایی و ارسال فیش واریز (پرداخت {formatCurrency(Math.max(0, course.cost - voucherDiscountAmount))})
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}