// ============================================================
// PreRegistrationValidator — Validation for pre-registration forms
// ============================================================

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
