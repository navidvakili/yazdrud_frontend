// ============================================================
// useReceiptOps — Receipt review operations
// ============================================================

import { useState } from 'react';
import type { TutRegistrant, ReceiptReviewData } from '../../shared/types';

export function useReceiptOps(
  registrants: TutRegistrant[],
  setRegistrants: React.Dispatch<React.SetStateAction<TutRegistrant[]>>,
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
) {
  const [reviewReceipt, setReviewReceipt] = useState<ReceiptReviewData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApproveReceipt = (registrantId: string) => {
    setRegistrants(prev =>
      prev.map(r => (r.id === registrantId ? { ...r, status: 'verified' as const, verifiedAt: '۱۴۰۵/۰۳/۲۳' } : r)),
    );
    setReviewReceipt(null);
    showToast('رسید بانکی با موفقیت تایید شد.', 'success');
  };

  const handleRejectReceipt = (registrantId: string) => {
    if (!rejectionReason.trim()) {
      showToast('لطفاً علت رد رسید را وارد کنید.', 'error');
      return;
    }
    setRegistrants(prev =>
      prev.map(r =>
        r.id === registrantId ? { ...r, status: 'rejected' as const, rejectionReason: rejectionReason.trim() } : r,
      ),
    );
    setReviewReceipt(null);
    setRejectionReason('');
    showToast('رسید بانکی رد شد.', 'info');
  };

  return {
    reviewReceipt, setReviewReceipt,
    rejectionReason, setRejectionReason,
    handleApproveReceipt,
    handleRejectReceipt,
  };
}
