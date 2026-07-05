// ============================================================
// RegistrationValidator — Validation logic for registrations
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

/** Validate pre-registration form */
export function validatePreRegistrationForm(data: {
  name: string;
  phone: string;
}): string | null {
  if (!data.name.trim()) {
    return 'لطفاً نام و نام خانوادگی را وارد کنید.';
  }
  if (!data.phone.trim()) {
    return 'لطفاً شماره تماس را وارد کنید.';
  }
  return null;
}
