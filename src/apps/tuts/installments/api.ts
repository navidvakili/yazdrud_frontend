// ============================================================
// Installment Management API — مدیریت اقساط بن خرید
// ============================================================

import { API } from '@/src/shared-utils';
import type { InstallmentStats, InstallmentRegistrationDetail, VerifyInstallmentData } from './types';

export const installmentsApi = {
  /** Get dashboard stats */
  getStats: () =>
    API<InstallmentStats>('installments/stats'),

  /** Get paginated registrations with installment plans */
  getRegistrations: (params?: Record<string, string | number | boolean>) => {
    const query = params ? '?' + new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return API<any>(`installments/registrations${query}`);
  },

  /** Get detailed registration with installments */
  getRegistrationDetail: (registerId: number) =>
    API<InstallmentRegistrationDetail>(`installments/registrations/${registerId}`),

  /** Verify an installment as paid */
  verifyInstallment: (installmentId: number, data: VerifyInstallmentData) =>
    API<any>(`installments/${installmentId}/verify`, data, 'POST'),

  /** Revert a paid installment back to pending */
  revertPayment: (installmentId: number) =>
    API<any>(`installments/${installmentId}/revert`, {}, 'POST'),

  /** Update installment (notes, due_date) */
  updateInstallment: (installmentId: number, data: { notes?: string; due_date?: string }) =>
    API<any>(`installments/${installmentId}`, data, 'PUT'),

  /** Bulk update installment due dates */
  bulkUpdateDates: (installments: { id: number; due_date: string }[]) =>
    API<any>('installments/bulk-update-dates', { installments }, 'POST'),
};
