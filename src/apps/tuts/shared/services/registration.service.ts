// ============================================================
// RegistrationService — API calls for registrations & receipts
// ============================================================

import api from '@/src/shared-api';
import type { TutRegistrant, ReportStats } from '../types';
import { mapRegistrant } from '../utils';

export interface RegistrationFilters {
  course_id?: number;
  status?: string;
  page?: number;
  per_page?: number;
  payment_method?: string;
  search?: string;
  year?: string;
  refunded?: string;
}

export interface RegistrationResult {
  data: TutRegistrant[];
  meta: any;
  stats?: ReportStats;
}

export const RegistrationService = {
  /** Fetch all registrations with optional filters */
  async getAllRegistrations(params?: RegistrationFilters): Promise<RegistrationResult> {
    const res = await api.getAllRegistrations(params);
    return {
      data: (res.data || []).map(mapRegistrant),
      meta: res.meta,
      stats: res.stats as ReportStats | undefined,
    };
  },

  /** Fetch registrations for a specific course */
  async getCourseRegistrations(courseId: number): Promise<TutRegistrant[]> {
    const data = await api.getCourseRegistrations(courseId);
    return (data || []).map(mapRegistrant);
  },

  /** Approve a bank receipt */
  async approveReceipt(registrationId: number): Promise<void> {
    await api.approveReceipt(registrationId);
  },

  /** Reject a bank receipt */
  async rejectReceipt(registrationId: number, rejectionReason?: string): Promise<void> {
    await api.rejectReceipt(registrationId, rejectionReason);
  },

  /** Mark registration as refunded */
  async refundRegistration(encryptedId: string): Promise<void> {
    await api.refundRegistration(encryptedId);
  },

  /** Undo a refund */
  async undoRefundRegistration(encryptedId: string): Promise<void> {
    await api.undoRefundRegistration(encryptedId);
  },

  /** Export registrations as XLSX */
  async exportRegistrations(params?: any): Promise<void> {
    await api.exportRegistrations(params);
  },
};
