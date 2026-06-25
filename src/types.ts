// ============================================================
// پورتال جامع دانشگاهی کارانت — Types & Interfaces
// ============================================================

export type UserRole = 'student' | 'professor' | 'admin';

export interface User {
  username: string;
  fname: string;
  lname: string;
  kodmeli: string;
  mobile: string;
  email: string;
  role: UserRole;
  /** All roles from the roles table (array of role names) */
  roles?: string[];
  sign?: string | null;
  /** Derived full name from fname + lname */
  name: string;
  /** Avatar URL for display */
  avatar: string;
}

export interface Tab {
  id: string;
  title: string;
  iconName: string;
  moduleType?: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

// ============================================================
// Navigation & Permission Types (از API بک‌اند)
// ============================================================

export interface NavChild {
  title: string;
  url: string;
  icon: string;
}

export interface NavItem {
  id: number;
  title: string;
  url: string;
  icon: string;
  ordering: number;
  children: NavChild[];
}

export interface NavResponse {
  data: NavItem[];
}

export interface RoleInfo {
  id: number;
  role: string;
  label: string;
  active: number; // 1=active (current primary), 0=not active
}

export interface UserRolesResponse {
  data: {
    primary_role: string;
    all_roles: RoleInfo[];
  };
}

export interface PermissionItem {
  id: number;
  parent: string | number;
  title: string;
  url: string;
  icon: string;
  roles: string;
  ordering: number;
  active: number;
}

export interface PermissionsResponse {
  data: PermissionItem[];
}

// ============================================================

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  nationalCode: string;
  major: string;
  entryYear: number;
  status: 'active' | 'graduated' | 'suspended' | 'dropped';
  gpa?: number;
  supervisor?: string;
}

export interface Professor {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  degree: string;
  specialization: string;
  status: 'active' | 'inactive' | 'retired';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================
// Course (دوره‌های آموزشی)
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
}

export interface CourseStats {
  active_courses: number;
  total_registrations: number;
  verified_count: number;
  top_courses: { id: number; title: string; count: number }[];
}

// ============================================================
// Detailed Course Statistics (Analytics page — monthly, seasonal, chart)
// ============================================================

export interface DetailedMonthlyStat {
  month_id: number;
  month_name: string;
  registered_count: number;
  total_amount: number;
  online_payments: number;
  bank_payments: number;
}

export interface DetailedSeasonalStat {
  season_id: number;
  name: string;
  registered_count: number;
  total_amount: number;
}

export interface DetailedYearlyStat {
  year: number;
  registered_count: number;
  total_amount: number;
}

export interface DetailedCourseStats {
  year: string;
  course_id: string | null;
  total_stats: {
    total_registered: number;
    total_amount: number;
    online_payments: number;
    bank_payments: number;
    avg_monthly: number;
    peek_month: string;
  };
  monthly: DetailedMonthlyStat[];
  seasonal: DetailedSeasonalStat[];
  yearly: DetailedYearlyStat[];
  chart_data: {
    months: string[];
    registrations: number[];
  };
}

// ============================================================
// Course Survey (نظرسنجی دوره‌های آموزشی)
// ============================================================

export interface CourseSurvey {
  id: number;
  course_id: number;
  course_title?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone_number: string;
  rating: number;
  suggestions: string | null;
  comment: string | null;
  ip_address: string | null;
  browser_fingerprint: string | null;
  created_at: string;
}

export interface CourseSurveyStats {
  total_surveys: number;
  average_rating: number;
  surveys_by_course: { course_id: number; course_title: string; count: number; avg_rating: number }[];
  ratings_breakdown: { rating: number; count: number }[];
  recent_surveys: CourseSurvey[];
}

// ============================================================
// Course Coupon / Voucher (بن تخفیف و کوپن)
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
  capacity: number;
  used_count: number;
  remaining: number;
  start_date: string;
  finish_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Bank receipt verification types
// ============================================================

export interface ReceiptReview {
  registration_id: number;
  registrant_name: string;
  course_title: string;
  amount: number;
  bank_receipt: string | null;
  status: string;
  rejection_reason?: string;
}
