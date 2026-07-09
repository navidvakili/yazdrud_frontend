// ============================================================
// VoucherValidator — Validation logic for vouchers (sandbox)
// ============================================================

import type { TutVoucher, TutCourse, SandboxResult } from '../../shared/types';
import { getTodayJalali } from '../../shared/utils';

export interface SandboxTestInput {
  code: string;
  course: TutCourse;
  vouchers: TutVoucher[];
  userNationalCode?: string;
  province?: string;
  device?: 'desktop' | 'mobile';
  referrer?: string;
  todayStr?: string;
}

export interface CheckResult {
  title: string;
  passed: boolean;
  desc: string;
}

/** Run all sandbox validation checks for a voucher */
export function runSandboxChecks(input: SandboxTestInput): {
  isValid: boolean;
  failReason: string;
  checks: CheckResult[];
  discount: number;
} {
  const { code, course, vouchers, userNationalCode, province, device, referrer } = input;
  const todayStr = input.todayStr || getTodayJalali();

  const checks: CheckResult[] = [];
  let isValid = true;
  let failReason = '';

  const vouch = vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());

  // Check existence
  if (!vouch) {
    return {
      isValid: false,
      failReason: 'کد بن تخفیف یافت نشد.',
      checks: [{ title: 'وجود بن در سیستم', passed: false, desc: 'بن تخفیفی با این کد وجود ندارد.' }],
      discount: 0,
    };
  }

  // Check 1: Validity Dates
  let datePassed = true;
  let dateDesc = 'بازه زمانی آزاد است.';
  if (vouch.validFrom && todayStr < vouch.validFrom) {
    datePassed = false; isValid = false;
    failReason = `تاریخ فعلی پیش از شروع اعتبار است.`;
    dateDesc = `غیرمعتبر (قبل از شروع طرح)`;
  } else if (vouch.validTo && todayStr > vouch.validTo) {
    datePassed = false; isValid = false;
    failReason = `تاریخ فعلی پس از مهلت استفاده است.`;
    dateDesc = `غیرمعتبر (منقضی شده)`;
  } else if (vouch.validFrom || vouch.validTo) {
    dateDesc = `معتبر`;
  }
  checks.push({ title: 'محدودیت زمانی و تقویم', passed: datePassed, desc: dateDesc });

  // Check 2: Product Match
  let productPassed = true;
  let productDesc = 'برای تمامی کارگاه‌ها مجاز است.';
  if (vouch.courseId && vouch.courseId !== 'all') {
    if (vouch.courseId !== course.id) {
      productPassed = false; isValid = false;
      failReason = 'این بن تخفیف فقط برای دوره خاصی صادر شده است.';
      productDesc = `غیرمجاز (فقط مخصوص دوره با شناسه ${vouch.courseId})`;
    } else { productDesc = 'مجاز (مخصوص همین دوره)'; }
  }
  checks.push({ title: 'انطباق دوره و محصول', passed: productPassed, desc: productDesc });

  // Check 3: Group Restriction
  let groupPassed = true;
  let groupDesc = 'برای تمامی گروه‌ها مجاز است.';
  if (vouch.group_id) {
    if (Number(vouch.group_id) !== course.group_id) {
      groupPassed = false; isValid = false;
      failReason = 'این بن تخفیف فقط برای گروه دوره خاصی معتبر است.';
      groupDesc = `غیرمجاز (مختص گروه ${vouch.group_title || vouch.group_id})`;
    } else { groupDesc = 'مجاز (هم‌گروه با این دوره)'; }
  }
  checks.push({ title: 'گروه دوره', passed: groupPassed, desc: groupDesc });

  // Check 4: Max Discount Cap
  let maxDiscPassed = true;
  let maxDiscDesc = 'بدون سقف تخفیف.';
  if (vouch.maxDiscount && vouch.maxDiscount > 0) {
    let calculatedDiscount = 0;
    if (vouch.discountPercent) calculatedDiscount = Math.round((course.cost * vouch.discountPercent) / 100);
    else if (vouch.discountAmount) calculatedDiscount = Math.min(course.cost, vouch.discountAmount);
    if (calculatedDiscount > vouch.maxDiscount) {
      maxDiscPassed = false; isValid = false;
      failReason = `تخفیف محاسبه شده از سقف مجاز بیشتر است.`;
      maxDiscDesc = `غیرمجاز`;
    } else { maxDiscDesc = `مجاز`; }
  }
  checks.push({ title: 'سقف تخفیف (Max Discount)', passed: maxDiscPassed, desc: maxDiscDesc });

  // Check 5: Global Usage Cap
  let capPassed = true;
  let capDesc = 'سقف تعداد استفاده ندارد.';
  if (vouch.globalCap) {
    if (vouch.totalUsed >= vouch.globalCap) {
      capPassed = false; isValid = false;
      failReason = 'تعداد مجاز استفاده از این بن به پایان رسیده است.';
      capDesc = `تکمیل ظرفیت`;
    } else {
      capDesc = `مجاز (ظرفیت باقی‌مانده)`;
    }
  }
  checks.push({ title: 'ظرفیت کل بن (Usage Cap)', passed: capPassed, desc: capDesc });

  // Check 6: National Code Restriction
  let ncPassed = true;
  let ncDesc = 'برای همه کاربران مجاز است.';
  if (vouch.nationalCodes?.length) {
    if (!userNationalCode) {
      ncPassed = false; isValid = false;
      failReason = 'لطفاً کد ملی خود را وارد کنید.';
      ncDesc = 'غیرمجاز (کد ملی وارد نشده)';
    } else if (!vouch.nationalCodes.includes(userNationalCode)) {
      ncPassed = false; isValid = false;
      failReason = 'این بن تخفیف فقط برای کد ملی مشخص‌شده قابل استفاده است.';
      ncDesc = 'غیرمجاز (کد ملی مجاز نیست)';
    } else {
      ncDesc = `مجاز`;
    }
  }
  checks.push({ title: 'محدودیت کد ملی', passed: ncPassed, desc: ncDesc });

  // Final calculation
  let discount = 0;
  if (isValid) {
    if (vouch.discountPercent) discount = Math.round((course.cost * vouch.discountPercent) / 100);
    else if (vouch.discountAmount) discount = Math.min(course.cost, vouch.discountAmount);
    if (vouch.maxDiscount && vouch.maxDiscount > 0 && discount > vouch.maxDiscount) {
      discount = vouch.maxDiscount;
    }
  }

  return { isValid, failReason, checks, discount };
}

/** Calculate final price after discount */
export function calculateFinalPrice(originalPrice: number, discount: number): number {
  return Math.max(0, originalPrice - discount);
}
