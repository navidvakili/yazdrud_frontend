// ============================================================
// Stats Types — انواع مربوط به آمار و تحلیل دوره‌ها
// ============================================================

export interface DetailedMonthlyStat {
  month_id: number;
  month_name: string;
  registered_count: number;
  total_amount: number;
  online_payments: number;
  bank_payments: number;
}

export interface DetailedSeasonalStat {
  season_id: number;
  name: string;
  registered_count: number;
  total_amount: number;
}

export interface DetailedYearlyStat {
  year: number;
  registered_count: number;
  total_amount: number;
}

export interface DetailedCourseStats {
  year: string;
  course_id: string | null;
  total_stats: {
    total_registered: number;
    total_amount: number;
    online_payments: number;
    bank_payments: number;
    avg_monthly: number;
    peek_month: string;
  };
  monthly: DetailedMonthlyStat[];
  seasonal: DetailedSeasonalStat[];
  yearly: DetailedYearlyStat[];
  chart_data: {
    months: string[];
    registrations: number[];
  };
}
