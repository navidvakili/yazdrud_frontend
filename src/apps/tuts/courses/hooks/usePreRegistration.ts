// ============================================================
// usePreRegistration — Pre-registration flow
// ============================================================

import { useState } from 'react';
import type { TutCourse, TutVoucher, TutRegistrant } from '../../shared/types';
import { toPersianDigits, formatCurrency } from '../../shared/utils';

export function usePreRegistration(
  courses: TutCourse[],
  vouchers: TutVoucher[],
  registrants: TutRegistrant[],
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
  const [registeringCourse, setRegisteringCourse] = useState<TutCourse | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentIdNum, setStudentIdNum] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentProvince, setStudentProvince] = useState('تهران');
  const [studentVoucherCode, setStudentVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<TutVoucher | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [voucherDiscountAmount, setVoucherDiscountAmount] = useState(0);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [simulatedDevice, setSimulatedDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [simulatedReferrer, setSimulatedReferrer] = useState('');
  const [selectedBank, setSelectedBank] = useState('بانک ملی ایران');
  const [refCodeInput, setRefCodeInput] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleValidateVoucherCode = (codeToTest?: string, targetCourseOverride?: TutCourse) => {
    const code = (codeToTest || studentVoucherCode).trim().toUpperCase();
    const course = targetCourseOverride || registeringCourse;
    if (!code) {
      setVoucherError('لطفاً کد بن تخفیف را وارد کنید.');
      setAppliedVoucher(null); setVoucherDiscountAmount(0);
      return;
    }
    if (!course) {
      setVoucherError('کارگاهی برای بررسی یافت نشد.');
      setAppliedVoucher(null); setVoucherDiscountAmount(0);
      return;
    }

    const foundVoucher = vouchers.find(v => v.code.toUpperCase() === code);
    if (!foundVoucher) {
      setVoucherError('کد تخفیف معتبر نمی‌باشد یا منقضی شده است.');
      setAppliedVoucher(null); setVoucherDiscountAmount(0);
      return;
    }

    const todayStr = '1405/03/23';
    if (foundVoucher.validFrom && todayStr < foundVoucher.validFrom) {
      setVoucherError(`این بن هنوز فعال نشده است. شروع اعتبار از ${foundVoucher.validFrom}`);
      setAppliedVoucher(null); return;
    }
    if (foundVoucher.validTo && todayStr > foundVoucher.validTo) {
      setVoucherError(`این بن منقضی شده است. مهلت استفاده تا ${foundVoucher.validTo} بوده است.`);
      setAppliedVoucher(null); return;
    }
    if (foundVoucher.allowedHours && foundVoucher.allowedHours !== 'all') {
      const currentHour = 10, currentMinute = 5;
      const [start, end] = foundVoucher.allowedHours.split('-');
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      const totalCur = currentHour * 60 + currentMinute;
      const totalStart = sh * 60 + sm;
      const totalEnd = eh * 60 + em;
      if (totalCur < totalStart || totalCur > totalEnd) {
        setVoucherError(`این بن تخفیف فقط در ساعات خاصی از شبانه‌روز قابل استفاده است.`);
        setAppliedVoucher(null); return;
      }
    }
    if (foundVoucher.courseId && foundVoucher.courseId !== 'all' && foundVoucher.courseId !== course.id) {
      const matchCourse = courses.find(c => c.id === foundVoucher.courseId);
      setVoucherError(`این بن فقط برای دوره اختصاصی «${matchCourse?.title || foundVoucher.courseId}» معتبر است.`);
      setAppliedVoucher(null); return;
    }
    if (foundVoucher.category && foundVoucher.category !== 'all' && foundVoucher.category !== course.category) {
      setVoucherError(`این بن فقط برای کارگاه‌های دپارتمان «${foundVoucher.category}» معتبر است.`);
      setAppliedVoucher(null); return;
    }
    if (foundVoucher.minCoursePrice && course.cost < foundVoucher.minCoursePrice) {
      setVoucherError(`حداقل قیمت کارگاه برای استفاده از این بن باید بیشتر از ${formatCurrency(foundVoucher.minCoursePrice)} باشد.`);
      setAppliedVoucher(null); return;
    }

    let discount = 0;
    if (foundVoucher.discountPercent) discount = Math.round((course.cost * foundVoucher.discountPercent) / 100);
    else if (foundVoucher.discountAmount) discount = Math.min(course.cost, foundVoucher.discountAmount);

    setAppliedVoucher(foundVoucher);
    setVoucherError(null);
    setVoucherDiscountAmount(discount);
    showToast(`کد تخفیف "${foundVoucher.code}" با موفقیت اعمال شد.`, 'success');
  };

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadFileName(file.name);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsUploading(false); return 100; }
        return prev + 25;
      });
    }, 200);
  };

  const resetPreRegForm = () => {
    setStudentName(''); setStudentIdNum(''); setStudentEmail(''); setStudentPhone('');
    setStudentProvince('تهران'); setStudentVoucherCode('');
    setAppliedVoucher(null); setVoucherError(null); setVoucherDiscountAmount(0);
    setSelectedInstallments(1); setSimulatedDevice('desktop'); setSimulatedReferrer('');
    setSelectedBank('بانک ملی ایران'); setRefCodeInput('');
    setUploadProgress(0); setUploadFileName(''); setIsUploading(false);
  };

  return {
    registeringCourse, setRegisteringCourse,
    studentName, setStudentName,
    studentIdNum, setStudentIdNum,
    studentEmail, setStudentEmail,
    studentPhone, setStudentPhone,
    studentProvince, setStudentProvince,
    studentVoucherCode, setStudentVoucherCode,
    appliedVoucher, setAppliedVoucher,
    voucherError, setVoucherError,
    voucherDiscountAmount, setVoucherDiscountAmount,
    selectedInstallments, setSelectedInstallments,
    simulatedDevice, setSimulatedDevice,
    simulatedReferrer, setSimulatedReferrer,
    selectedBank, setSelectedBank,
    refCodeInput, setRefCodeInput,
    uploadProgress, setUploadProgress,
    uploadFileName, setUploadFileName,
    isUploading, setIsUploading,
    handleValidateVoucherCode,
    handleSimulateUpload,
    resetPreRegForm,
  };
}
