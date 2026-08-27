// ============================================================
// Login Types — انواع و اینترفیس‌های مربوط به احراز هویت
// ============================================================

import type { User as BaseUser } from '@/src/shared-types';

// Re-export User for convenience
export type User = BaseUser;

// ============================================================
// Auth Credentials & Response
// ============================================================

export interface LoginCredentials {
  username: string;
  password: string;
  force?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================
// Role Types
// ============================================================

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
  /** آخرین باری که این نشست واقعاً یک درخواست API معتبر زده (throttled) — معیار Idle Timeout */
  last_used_at: string | null;
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

// ============================================================
// Session Warning Types
// ============================================================

export interface WarningInfo {
  id: number;
  ip_address: string | null;
  user_agent: string | null;
  browser_fingerprint: string | null;
  created_at?: string;
}

export interface WarningDeviceInfo {
  ip_address: string | null;
  user_agent: string | null;
  browser_fingerprint: string | null;
}

export interface CreateWarningResponse {
  warning_id: number;
  poll_token: string;
}

export interface WarningStatusResponse {
  status: 'pending' | 'accepted' | 'rejected';
}
