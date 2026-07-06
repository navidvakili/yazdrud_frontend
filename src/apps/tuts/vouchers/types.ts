// ============================================================
// Voucher Types — انواع مربوط به بن تخفیف و کوپن
// ============================================================

export interface CourseCoupon {
  id: number;
  title: string;
  code: string;
  type: 'discount' | 'installment';
  type_discount: 'percent' | 'money';
  value: number;
  value_formatted?: string;
  course_id: number | null;
  course_title?: string;
  group_id: number | null;
  group_title?: string;
  capacity: number;
  used_count: number;
  remaining: number;
  start_date: string;
  finish_date: string;
  is_active: boolean;
  max_discount: number | null;
  national_code: string | null;
  created_at: string;
  updated_at: string;
}
