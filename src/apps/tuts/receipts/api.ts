// ============================================================
// Receipts API — ارتباط با بک‌اند برای رسیدهای بانکی
// ============================================================

import { API } from '@/src/shared-utils';
import type { CourseRegistration } from '../courses/types';

export const receiptsApi = {
  async refundRegistration(encryptedId: string): Promise<CourseRegistration> {
    const data = await API<any>(`courses/registrations/${encryptedId}/refund`, {}, 'POST');
    return data.data;
  },

  async undoRefundRegistration(encryptedId: string): Promise<CourseRegistration> {
    const data = await API<any>(`courses/registrations/${encryptedId}/undo-refund`, {}, 'POST');
    return data.data;
  },
};
