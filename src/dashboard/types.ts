// ============================================================
// Dashboard Types — انواع مربوط به ویجت‌های پیشخوان
// ============================================================

export interface DashboardRegistration {
  id: number;
  fullname: string;
  course_title: string | null;
  mobile: string;
  payment_method: string;
  status: string;
  status_text: string;
  created_at: string;
}

export interface DashboardInstallment {
  id: number;
  title: string;
  amount: number;
  amount_formatted: string;
  due_date: string;
  fullname: string | null;
  course_title: string | null;
  mobile: string | null;
}

export interface DashboardSurvey {
  id: number;
  fullname: string;
  course_title: string | null;
  rating: number;
  phone_number: string | null;
  comment: string | null;
  created_at: string;
}

export interface DashboardReceipt {
  id: number;
  fullname: string;
  course_title: string | null;
  mobile: string;
  amount: number;
  amount_formatted: string;
  created_at: string;
}

export interface DashboardOverview {
  latest_registrations: DashboardRegistration[];
  current_week_installments: {
    count: number;
    items: DashboardInstallment[];
    week_start: string;
    week_end: string;
  };
  recent_surveys: DashboardSurvey[];
  unapproved_receipts: {
    count: number;
    items: DashboardReceipt[];
  };
  pending_certificates: number;
  quick_stats: {
    active_courses: number;
    confirmed_registrations: number;
    unapproved_receipts_count: number;
    pending_certificates: number;
  };
}
