// ============================================================
// Receipt Types — انواع مربوط به بررسی فیش‌های بانکی
// ============================================================

export interface ReceiptReview {
  registration_id: number;
  registrant_name: string;
  course_title: string;
  amount: number;
  bank_receipt: string | null;
  status: string;
  rejection_reason?: string;
}
