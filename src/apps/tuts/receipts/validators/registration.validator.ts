// ============================================================
// RegistrationValidator — Validation logic for receipt operations
// ============================================================

/** Validate receipt rejection reason */
export function validateRejectionReason(reason: string): string | null {
  if (!reason.trim()) {
    return 'لطفاً علت رد رسید را وارد کنید.';
  }
  return null;
}

/** Validate refund confirmation */
export function validateRefundConfirmation(input: string, expectedWord: string): string | null {
  if (input !== expectedWord) {
    return 'کد تأیید وارد شده صحیح نیست.';
  }
  return null;
}
