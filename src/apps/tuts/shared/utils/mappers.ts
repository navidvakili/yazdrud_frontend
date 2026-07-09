// ============================================================
// Mappers — API response to Tut type mappers
// ============================================================

import type { TutCourse, TutRegistrant, TutVoucher } from '../types';

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
      ? c.start_date.includes('/') ? c.start_date : c.start_date.replace(/-/g, '/')
      : '۱۴۰۵/۰۱/۰۱',
    endDate: c.end_date
      ? c.end_date.includes('/') ? c.end_date : c.end_date.replace(/-/g, '/')
      : '',
    registrationStartDate: c.registration_start_date
      ? c.registration_start_date.includes('/') ? c.registration_start_date : c.registration_start_date.replace(/-/g, '/')
      : '',
    registrationEndDate: c.registration_end_date
      ? c.registration_end_date.includes('/') ? c.registration_end_date : c.registration_end_date.replace(/-/g, '/')
      : '',
    status: c.active ? 'active' : 'ended',
    category: c.group_title || c.category || 'عمومی',
    description: c.description || 'توضیحات دوره به زودی منتشر خواهد شد.',
    sections: Array.isArray(c.sections) ? c.sections : ['normal'],
    image: c.image || null,
    instructor_id: c.instructor_id || null,
    instructor_name: c.instructor_name || null,
    group_id: c.group_id || null,
    daysOfWeek: c.days_of_week || [],
    courseTime: c.course_time || '',
    location: c.location || '',
    prerequisites: c.prerequisites || '',
  };
}

/** Map API voucher object to TutVoucher */
export function mapVoucher(c: any): TutVoucher {
  const cap = c.capacity || 0;
  const used = c.used_count || 0;
  const remaining = Math.max(0, cap - used);
  let status: 'active' | 'used' | 'expired' = 'active';
  if (used >= cap && cap > 0) { status = 'used'; }
  else if (c.is_active === false) { status = 'expired'; }

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
    nationalCodes: c.national_code ? String(c.national_code).split(',').map(s => s.trim()).filter(Boolean) : undefined,
    isActive: c.is_active ?? true,
    enableInstallment: c.enable_installment ?? false,
    prepaymentAmount: c.prepayment_amount ?? null,
    paymentMethod: c.payment_method ?? null,
    installmentItems: Array.isArray(c.installment_items)
      ? c.installment_items.map((item: any) => ({
          id: item.id,
          title: item.title,
          amount: item.amount,
          due_date: item.due_date,
          sort_order: item.sort_order,
        }))
      : undefined,
  };
}

/** Map API registration object to TutRegistrant */
export function mapRegistrant(r: any): TutRegistrant {
  return {
    id: String(r.id),
    name: r.fullname || r.full_name || '',
    nationalCode: r.kodmeli || '',
    studentCode: r.id_edu || '',
    mobile: r.mobile || '',
    type: r.type || '',
    typeText: r.type_text || '',
    courseId: String(r.course_id),
    courseTitle: r.course_title || '',
    date: r.created_at ? r.created_at.replace(/-/g, '/') : '',
    verifiedAt: r.verified_at || '',
    amount: parseInt(String(r.amount)) || 0,
    enrollmentCode: r.enrollment_code || '',
    paymentMethod: r.payment_method_text || '',
    paymentMethodRaw: r.payment_method || '',
    trackingCode: r.tracking_code || r.bank_receipt_filename || '',
    bankReceipt: r.bank_receipt || '',
    status:
      r.status === 'approved' || r.status === 'paid' || r.status === 'verified'
        ? 'verified'
        : r.status === 'refunded' ? 'refunded'
        : r.status === 'rejected' ? 'rejected'
        : 'pending',
    rejectionReason: r.rejection_reason || undefined,
    verifiedReceipt: r.verified_receipt ?? false,
    rejectedReceipt: r.rejected_receipt ?? false,
    certificateApproved: r.certificate_approved ?? false,
    certificateNumber: r.certificate?.certificate_number || undefined,
    certificateIssuedAt: r.certificate?.issued_at || undefined,
    hasCertificate: !!r.certificate,
  };
}
