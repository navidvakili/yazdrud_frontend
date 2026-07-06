// ============================================================
// useVoucherOps — Voucher CRUD + Sandbox operations
// ============================================================

import { useState } from 'react';
import type { TutVoucher, TutCourse, TutRegistrant, SandboxResult } from '../../shared/types';
import { toPersianDigits, formatCurrency } from '../../shared/utils';
import { runSandboxChecks, calculateFinalPrice } from '../validators/voucher.validator';

export function useVoucherOps(
  vouchers: TutVoucher[],
  setVouchers: React.Dispatch<React.SetStateAction<TutVoucher[]>>,
  courses: TutCourse[],
  registrants: TutRegistrant[],
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
  const [voucherActiveTab, setVoucherActiveTab] = useState<'list' | 'create'>('list');

  // Creation form state
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherTitle, setNewVoucherTitle] = useState('');
  const [newVoucherValidFrom, setNewVoucherValidFrom] = useState('1405/01/01');
  const [newVoucherValidTo, setNewVoucherValidTo] = useState('1405/12/29');
  const [newVoucherAllowedHours, setNewVoucherAllowedHours] = useState('all');
  const [newVoucherOccasion, setNewVoucherOccasion] = useState('');
  const [newVoucherCourseId, setNewVoucherCourseId] = useState('all');
  const [newVoucherCategory, setNewVoucherCategory] = useState('all');
  const [newVoucherCourseLevel, setNewVoucherCourseLevel] = useState<'all' | 'elementary' | 'advanced'>('all');
  const [newVoucherDeliveryType, setNewVoucherDeliveryType] = useState<'all' | 'online' | 'in-person'>('all');
  const [newVoucherMinCoursePrice, setNewVoucherMinCoursePrice] = useState('0');
  const [newVoucherGlobalCap, setNewVoucherGlobalCap] = useState('100');
  const [newVoucherBudgetLimit, setNewVoucherBudgetLimit] = useState('50000000');
  const [newVoucherPerEmailLimit, setNewVoucherPerEmailLimit] = useState('1');
  const [newVoucherAllowedProvince, setNewVoucherAllowedProvince] = useState('all');
  const [newVoucherAllowedDevice, setNewVoucherAllowedDevice] = useState('all');
  const [newVoucherAllowedReferrer, setNewVoucherAllowedReferrer] = useState('all');
  const [newVoucherFirstPurchaseOnly, setNewVoucherFirstPurchaseOnly] = useState(false);
  const [newVoucherDiscountType, setNewVoucherDiscountType] = useState<'percent' | 'amount'>('percent');
  const [newVoucherDiscountValue, setNewVoucherDiscountValue] = useState('20');
  const [newVoucherAllowInstallments, setNewVoucherAllowInstallments] = useState(false);
  const [newVoucherInstallmentCount, setNewVoucherInstallmentCount] = useState('2');

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newVoucherCode.trim().toUpperCase();
    const title = newVoucherTitle.trim();
    if (!code || !title) {
      showToast('لطفاً کد بن و عنوان آن را وارد کنید.', 'error');
      return;
    }
    if (vouchers.some(v => v.code === code)) {
      showToast('این کد بن خرید از قبل تعریف شده است.', 'error');
      return;
    }

    const created: TutVoucher = {
      id: `vouch-${Date.now()}`,
      code, title,
      validFrom: newVoucherValidFrom || undefined,
      validTo: newVoucherValidTo || undefined,
      allowedHours: newVoucherAllowedHours !== 'all' ? newVoucherAllowedHours : undefined,
      occasion: newVoucherOccasion || undefined,
      courseId: newVoucherCourseId !== 'all' ? newVoucherCourseId : undefined,
      category: newVoucherCategory !== 'all' ? newVoucherCategory : undefined,
      courseLevel: newVoucherCourseLevel !== 'all' ? newVoucherCourseLevel as 'elementary' | 'advanced' : undefined,
      deliveryType: newVoucherDeliveryType !== 'all' ? newVoucherDeliveryType as 'online' | 'in-person' : undefined,
      minCoursePrice: Number(newVoucherMinCoursePrice) > 0 ? Number(newVoucherMinCoursePrice) : undefined,
      globalCap: Number(newVoucherGlobalCap) > 0 ? Number(newVoucherGlobalCap) : undefined,
      totalUsed: 0,
      budgetLimit: Number(newVoucherBudgetLimit) > 0 ? Number(newVoucherBudgetLimit) : undefined,
      budgetUsed: 0,
      perEmailLimit: Number(newVoucherPerEmailLimit) > 0 ? Number(newVoucherPerEmailLimit) : undefined,
      allowedProvince: newVoucherAllowedProvince !== 'all' ? newVoucherAllowedProvince : undefined,
      allowedDevice: newVoucherAllowedDevice !== 'all' ? newVoucherAllowedDevice as 'mobile' | 'desktop' : undefined,
      allowedReferrer: newVoucherAllowedReferrer !== 'all' ? newVoucherAllowedReferrer : undefined,
      firstPurchaseOnly: newVoucherFirstPurchaseOnly,
      discountPercent: newVoucherDiscountType === 'percent' ? Number(newVoucherDiscountValue) : undefined,
      discountAmount: newVoucherDiscountType === 'amount' ? Number(newVoucherDiscountValue) : undefined,
      allowInstallments: newVoucherAllowInstallments,
      installmentCount: newVoucherAllowInstallments ? Number(newVoucherInstallmentCount) : undefined,
    };

    setVouchers([created, ...vouchers]);
    showToast(`بن خرید جدید "${title}" با کد "${code}" با موفقیت ایجاد گردید.`);
    setNewVoucherCode('');
    setNewVoucherTitle('');
    setNewVoucherOccasion('');
    setNewVoucherDiscountValue('20');
  };

  // Sandbox Simulator
  const [sandboxCode, setSandboxCode] = useState('WELCOME_ONLINE');
  const [sandboxCourseId, setSandboxCourseId] = useState('');
  const [sandboxEmail, setSandboxEmail] = useState('student@example.com');
  const [sandboxPhone, setSandboxPhone] = useState('۰۹۱۲۳۴۵۶۷۸۹');
  const [sandboxProvince, setSandboxProvince] = useState('تهران');
  const [sandboxDevice, setSandboxDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [sandboxReferrer, setSandboxReferrer] = useState('');
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);

  const handleRunSandboxTest = () => {
    const code = sandboxCode.trim().toUpperCase();
    const course = courses.find(c => c.id === sandboxCourseId);
    if (!course) {
      showToast('لطفاً کارگاه معتبری را انتخاب کنید.', 'error');
      return;
    }

    const result = runSandboxChecks({
      code,
      course,
      vouchers,
      userNationalCode: sandboxEmail,
      province: sandboxProvince,
      device: sandboxDevice,
      referrer: sandboxReferrer,
    });

    const finalPrice = calculateFinalPrice(course.cost, result.discount);
    const vouch = vouchers.find(v => v.code.toUpperCase() === code);

    setSandboxResult({
      isValid: result.isValid,
      error: result.isValid ? undefined : result.failReason,
      voucher: vouch,
      discountAmount: result.discount,
      finalPrice,
      originalPrice: course.cost,
      allowInstallments: false,
      checks: result.checks,
    });

    if (result.isValid) showToast('شبیه‌سازی با موفقیت انجام شد: بن خرید معتبر است.', 'success');
    else showToast(`شبیه‌سازی انجام شد: بن غیرمعتبر است. علت: ${result.failReason}`, 'error');
  };

  return {
    voucherActiveTab, setVoucherActiveTab,
    newVoucherCode, setNewVoucherCode,
    newVoucherTitle, setNewVoucherTitle,
    newVoucherValidFrom, setNewVoucherValidFrom,
    newVoucherValidTo, setNewVoucherValidTo,
    newVoucherAllowedHours, setNewVoucherAllowedHours,
    newVoucherOccasion, setNewVoucherOccasion,
    newVoucherCourseId, setNewVoucherCourseId,
    newVoucherCategory, setNewVoucherCategory,
    newVoucherCourseLevel, setNewVoucherCourseLevel,
    newVoucherDeliveryType, setNewVoucherDeliveryType,
    newVoucherMinCoursePrice, setNewVoucherMinCoursePrice,
    newVoucherGlobalCap, setNewVoucherGlobalCap,
    newVoucherBudgetLimit, setNewVoucherBudgetLimit,
    newVoucherPerEmailLimit, setNewVoucherPerEmailLimit,
    newVoucherAllowedProvince, setNewVoucherAllowedProvince,
    newVoucherAllowedDevice, setNewVoucherAllowedDevice,
    newVoucherAllowedReferrer, setNewVoucherAllowedReferrer,
    newVoucherFirstPurchaseOnly, setNewVoucherFirstPurchaseOnly,
    newVoucherDiscountType, setNewVoucherDiscountType,
    newVoucherDiscountValue, setNewVoucherDiscountValue,
    newVoucherAllowInstallments, setNewVoucherAllowInstallments,
    newVoucherInstallmentCount, setNewVoucherInstallmentCount,
    handleCreateVoucher,
    sandboxCode, setSandboxCode,
    sandboxCourseId, setSandboxCourseId,
    sandboxEmail, setSandboxEmail,
    sandboxPhone, setSandboxPhone,
    sandboxProvince, setSandboxProvince,
    sandboxDevice, setSandboxDevice,
    sandboxReferrer, setSandboxReferrer,
    sandboxResult, setSandboxResult,
    handleRunSandboxTest,
  };
}
