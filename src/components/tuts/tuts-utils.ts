// ============================================================
// TutsModule — Shared Utility Functions & Mappers
// ============================================================

import type { TutCourse, TutRegistrant, TutVoucher } from './tuts-types';

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
    return str.toString().replace(/[۰-۹]/g, function (d) {
        return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
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
export function formatCurrency(amount: number): string {
    return toPersianDigits(amount.toLocaleString('fa-IR')) + ' ریال';
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
        duration: c.duration_text || '۱۲ ساعت',
        cost: parseInt(String(c.amount)) || 0,
        enrolled: (c.confirmed_count ?? c.registered_count) || 0,
        capacity: c.capacity || 30,
        startDate: c.start_date
            ? c.start_date.includes('/')
                ? c.start_date
                : c.start_date.replace(/-/g, '/')
            : '۱۴۰۵/۰۱/۰۱',
        status: c.active ? 'active' : 'ended',
        category: c.group_title || c.category || 'عمومی',
        description: c.description || 'توضیحات دوره به زودی منتشر خواهد شد.',
    };
}

/** Map API voucher object to TutVoucher */
export function mapVoucher(c: any): TutVoucher {
    return {
        id: String(c.id),
        code: c.code || '',
        title: c.title || '',
        validFrom: c.start_date || '1405/01/01',
        validTo: c.finish_date || '1405/12/29',
        courseId: c.course_id ? String(c.course_id) : 'all',
        globalCap: c.capacity || 0,
        totalUsed: c.used_count || 0,
        budgetUsed: 0,
        budgetLimit: 0,
        discountPercent: c.type_discount === 'percent' ? Number(c.value) : undefined,
        discountAmount: c.type_discount === 'money' ? Number(c.value) : undefined,
        allowInstallments: c.type === 'installment',
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
                : r.status === 'rejected'
                    ? 'rejected'
                    : 'pending',
        rejectionReason: r.rejection_reason || undefined,
    };
}
