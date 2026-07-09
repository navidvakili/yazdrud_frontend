// ============================================================
// Course Types — انواع مربوط به دوره‌های آموزشی
// ============================================================

export interface CourseGroup {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  group_id: number | null;
  group_title: string | null;
  title: string;
  amount: string;
  amount_formatted: string;
  active: boolean;
  image: string | null;
  sections: string[];
  instructor_id: number | null;
  instructor_name: string | null;
  description: string | null;
  syllabus: string | null;
  duration: number | null;
  duration_text: string | null;
  instructor: string | null;
  start_date: string | null;
  end_date: string | null;
  capacity: number;
  registered_count: number;
  remaining: number | string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Instructor {
  id: number;
  name: string;
  specialty: string | null;
  bio: string | null;
  photo: string | null;
  photo_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseRegistration {
  id: number;
  kodmeli: string;
  course_id: number;
  course_title: string;
  type: string;
  type_text: string;
  fullname: string;
  id_edu: string | null;
  mobile: string;
  email: string | null;
  payment_method: string;
  payment_method_text: string;
  bank_receipt: string | null;
  status: string;
  status_text: string;
  verified_receipt: boolean;
  rejected_receipt: boolean;
  rejection_reason: string | null;
  certificate_approved: boolean;
  created_at: string;
  coupon_code?: string | null;
  coupon_title?: string | null;
  discount_amount?: number | null;
  prepayment_amount?: number | null;
  has_installment?: boolean;
  installment_total_count?: number;
  installment_paid_count?: number;
  installment_total_amount?: number;
  installment_paid_amount?: number;
}

export interface CourseStats {
  active_courses: number;
  total_registrations: number;
  verified_count: number;
  top_courses: { id: number; title: string; count: number }[];
}
