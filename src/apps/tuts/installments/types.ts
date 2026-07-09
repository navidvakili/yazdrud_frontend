// ============================================================
// Installment Management Types — انواع مدیریت اقساط
// ============================================================

/** Installment item template (defined in voucher) */
export interface InstallmentItem {
  id: number;
  title: string;
  amount: number;
  due_date: string;
  sort_order?: number;
}

/** Voucher with installment plan (from index endpoint) */
export interface InstallmentVoucher {
  id: number;
  title: string;
  code: string;
  type_discount: 'percent' | 'money';
  value: number;
  prepayment_amount: number | null;
  payment_method: 'online' | 'offline' | null;
  is_active: boolean;
  total_installment_amount: number;
  installment_items: InstallmentItem[];
  registrations_count: number;
  total_paid_installments: number;
  total_overdue_installments: number;
  created_at: string;
}

/** Per-registration installment record */
export interface RegistrationInstallment {
  id: number;
  voucher_installment_item_id?: number | null;
  title: string;
  amount: number;
  due_date: string;
  payment_method: 'online' | 'offline' | null;
  status: 'pending' | 'paid' | 'overdue';
  paid_at: string | null;
  paid_amount: number | null;
  tracking_number: string | null;
  verified_by?: string | null;
  notes: string | null;
}

/** Registration with installment details */
export interface InstallmentRegistration {
  id: number;
  fullname: string;
  kodmeli: string;
  mobile: string;
  course_title: string;
  course_id: number;
  coupon_id: number;
  coupon_code: string;
  coupon_title: string;
  prepayment_amount: number | null;
  discount_amount: number | null;
  registration_status: string;
  installments: RegistrationInstallment[];
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  created_at: string;
}

/** Detailed registration with installments and template items */
export interface InstallmentRegistrationDetail extends InstallmentRegistration {
  email: string | null;
  coupon_code: string;
  coupon_title: string;
  installment_items: InstallmentItem[] | null;
}

/** Dashboard stats */
export interface InstallmentStats {
  total_vouchers: number;
  active_vouchers: number;
  total_registrations: number;
  total_installments: number;
  paid_installments: number;
  pending_installments: number;
  overdue_installments: number;
  total_collected: number;
  total_expected: number;
  collection_percentage: number;
}

/** Installment form data for verification */
export interface VerifyInstallmentData {
  tracking_number?: string;
  paid_amount?: number;
  notes?: string;
}
