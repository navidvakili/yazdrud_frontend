// ============================================================
// TutsModule — Shared Utility Functions & Mappers
// ============================================================

import type { TutCourse, TutRegistrant, TutVoucher } from './tuts-types';
import PersianDate from 'persian-date';

/** Convert Western digits (0-9) to Persian (۰-۹) */
export function toPersianDigits(str: string | number): string {
    if (str === null || str === undefined) return '';
    const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/[0-9]/g, function (w) {
        return id[+w];
    });
}

/** Convert Persian digits (۰-۹) to Western digits (0-9) */
export function toEnglishDigits(str: string): string {
    if (!str) return '';
    return str.toString().replace(/[٠-۹]/g, function (d) {
        const allDigits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
        const idx = allDigits.indexOf(d);
        return idx >= 0 ? String(idx % 10) : d;
    });
}

/**
 * Normalize a Persian/Arabic string for search/comparison:
 * - Arabic ي → Persian ی
 * - Arabic ك → Persian ک
 * - Arabic/Persian digits → Latin digits (0-9)
 * - Lowercase
 */
export function normalizePersian(str: string): string {
    if (!str) return '';
    let s = str.toLowerCase();
    s = s.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
    s = s.replace(/[٠-۹]/g, function (d) {
        const allDigits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
        const idx = allDigits.indexOf(d);
        return idx >= 0 ? String(idx % 10) : d;
    });
    return s;
}

/** Format a number as currency in Rials with Persian digits */
/** Format a number with commas (e.g., 1500000 → "1,500,000") */
export function formatNumberWithCommas(num: number | null | undefined): string {
    if (num === null || num === undefined) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Convert a Gregorian date string ("Y/m/d H:i") to Shamsi (Jalali) with Western digits.
 * Example: "2026/07/01 09:21" → "1405/04/10 09:21"
 */
export function toPersianDateString(gregorianDate: string): string {
    if (!gregorianDate) return '';
    try {
        const [datePart, timePart] = gregorianDate.split(' ');
        const [y, m, d] = datePart.split('/').map(Number);
        const [h, min] = timePart ? timePart.split(':').map(Number) : [0, 0];
        const jsDate = new Date(y, m - 1, d, h, min);
        return new PersianDate(jsDate).toLocale('en').format('YYYY/MM/DD HH:mm');
    } catch {
        return gregorianDate;
    }
}

/** Format a number as currency in Rials with Persian digits */
export function formatCurrency(amount: number): string {
    return toPersianDigits(amount.toLocaleString('fa-IR')) + ' ریال';
}

/** Get today's date as a Jalali string (e.g., "1405/04/10") */
export function getTodayJalali(): string {
    const d = new Date();
    // Simple leap-year-aware Jalali conversion using Intl
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(d).replace(/\u200f/g, '').replace(/[/\\]/g, '/');
}

/** Get current hour and minute for sandbox time simulation */
export function getCurrentTime(): { hour: number; minute: number } {
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
}

/** Format a numeric input value with comma separators (e.g., "4500000" → "4,500,000") */
export function formatCostInput(value: string): string {
    const cleaned = value.replace(/[^\d]/g, '');
    if (!cleaned) return '';
    return parseInt(cleaned, 10).toLocaleString('en-US');
}

/** Map API course object to TutCourse */
export function mapCourse(c: any): TutCourse {
    return {
        id: String(c.id),
        title: c.title,
        lecturer: c.instructor || 'مربی دوره',
        duration: c.duration ? String(c.duration) : '12',
        cost: parseInt(String(c.amount)) || 0,
        enrolled: (c.confirmed_count ?? c.registered_count) || 0,
        capacity: c.capacity || 30,
        startDate: c.start_date
            ? c.start_date.includes('/')
                ? c.start_date
                : c.start_date.replace(/-/g, '/')
            : '۱۴۰۵/۰۱/۰۱',
        endDate: c.end_date
            ? c.end_date.includes('/')
                ? c.end_date
                : c.end_date.replace(/-/g, '/')
            : '',
        registrationStartDate: c.registration_start_date
            ? c.registration_start_date.includes('/')
                ? c.registration_start_date
                : c.registration_start_date.replace(/-/g, '/')
            : '',
        registrationEndDate: c.registration_end_date
            ? c.registration_end_date.includes('/')
                ? c.registration_end_date
                : c.registration_end_date.replace(/-/g, '/')
            : '',
        status: c.active ? 'active' : 'ended',
        category: c.group_title || c.category || 'عمومی',
        description: c.description || 'توضیحات دوره به زودی منتشر خواهد شد.',
        section: Array.isArray(c.section) ? c.section : ['normal'],
        image: c.image || null,
        instructor_id: c.instructor_id || null,
        instructor_name: c.instructor_name || null,
        group_id: c.group_id || null,
    };
}

/** Map API voucher object to TutVoucher */
export function mapVoucher(c: any): TutVoucher {
    const cap = c.capacity || 0;
    const used = c.used_count || 0;
    const remaining = Math.max(0, cap - used);
    let status: 'active' | 'used' | 'expired' = 'active';
    if (used >= cap && cap > 0) {
        status = 'used';
    } else if (c.is_active === false) {
        status = 'expired';
    }

    return {
        id: String(c.id),
        code: c.code || '',
        title: c.title || '',
        discountType: c.type_discount === 'percent' ? 'percentage' : 'fixed',
        discountValue: Number(c.value) || 0,
        validFrom: c.start_date || '1405/01/01',
        validTo: c.finish_date || '1405/12/29',
        courseId: c.course_id ? String(c.course_id) : 'all',
        courseTitle: c.course_title || '',
        group_id: c.group_id ? Number(c.group_id) : null,
        group_title: c.group_title || '',
        globalCap: cap,
        totalUsed: used,
        maxUses: cap,
        remainingUses: remaining,
        status,
        budgetUsed: 0,
        budgetLimit: 0,
        discountPercent: c.type_discount === 'percent' ? Number(c.value) : undefined,
        discountAmount: c.type_discount === 'money' ? Number(c.value) : undefined,
        allowInstallments: c.type === 'installment',
        maxDiscount: c.max_discount ? Number(c.max_discount) : undefined,
        nationalCodes: c.national_codes ? String(c.national_codes).split(',').map(s => s.trim()).filter(Boolean) : undefined,
        isActive: c.is_active ?? true,
    };
}

/** Map API registration object to TutRegistrant */
export function mapRegistrant(r: any): TutRegistrant {
    return {
        id: String(r.id),
        name: r.fullname || r.full_name || '',
        nationalCode: r.kodmeli || '',
        studentCode: r.id_edu || r.kodmeli || '',
        mobile: r.mobile || '',
        typeText: r.type_text || '',
        courseId: String(r.course_id),
        courseTitle: r.course_title || '',
        date: r.created_at ? r.created_at.split(' ')[0].replace(/-/g, '/') : '',
        verifiedAt: r.verified_at || '',
        amount: parseInt(String(r.amount)) || 0,
        paymentMethod: r.payment_method_text || '',
        trackingCode: r.tracking_code || r.bank_receipt_filename || '',
        bankReceipt: r.bank_receipt || '',
        status:
            r.status === 'approved' || r.status === 'paid' || r.status === 'verified'
                ? 'verified'
                : r.status === 'refunded'
                    ? 'refunded'
                    : r.status === 'rejected'
                        ? 'rejected'
                        : 'pending',
        rejectionReason: r.rejection_reason || undefined,
        // Certificate fields
        certificateApproved: r.certificate_approved ?? false,
        certificateNumber: r.certificate?.certificate_number || undefined,
        certificateIssuedAt: r.certificate?.issued_at || undefined,
        hasCertificate: !!r.certificate,
    };
}
