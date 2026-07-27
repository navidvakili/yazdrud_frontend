// ============================================================
// Shared Types — انواع و اینترفیس‌های سراسری پروژه
// ============================================================

export type UserRole = 'admin' | 'editor' | 'user' | 'support';

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
  /** Granular permissions from Spatie (e.g. ['dashboard.view', 'users.create']) */
  permissions?: string[];
  sign?: string | null;
  /** Derived full name from fname + lname */
  name: string;
  /** Avatar URL for display */
  avatar: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
