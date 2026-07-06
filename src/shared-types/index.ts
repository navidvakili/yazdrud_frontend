// ============================================================
// Shared Types — انواع و اینترفیس‌های سراسری پروژه
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
  force?: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================
// Active Sessions Management
// ============================================================

export interface ActiveSession {
  token_id: string;
  ip_address: string | null;
  user_agent: string | null;
  browser_fingerprint: string | null;
  browser: string;
  platform: string;
  login_at: string;
  updated_at: string;
  expires_at: string | null;
  is_current: boolean;
}

export interface AdminSession extends ActiveSession {
  user_id: string;
  full_name: string;
  role: string;
}

export interface UserSessionsResponse {
  data: {
    current_session: ActiveSession | null;
    other_sessions: ActiveSession[];
  };
}

export interface AdminSessionsResponse {
  data: AdminSession[];
}
