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
