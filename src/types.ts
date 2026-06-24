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

export interface Course {
  id: number;
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
  total_courses: number;
  active_courses: number;
  total_registrations: number;
  pending_receipts: number;
  top_courses: { id: number; title: string; count: number }[];
}
