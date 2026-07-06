// ============================================================
// Login Types — انواع و اینترفیس�های مربوط به احراز هویت
// ============================================================

import type { User as BaseUser, LoginCredentials as BaseLoginCredentials, AuthResponse as BaseAuthResponse } from '@/src/shared-types';

// Re-export types shared with other modules
export type { BaseUser as User, BaseLoginCredentials as LoginCredentials, BaseAuthResponse as AuthResponse };

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
