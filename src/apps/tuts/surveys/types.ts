// ============================================================
// Survey Types — انواع مربوط به نظرسنجی دوره‌ها
// ============================================================

export interface CourseSurvey {
  id: number;
  course_id: number;
  course_title?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone_number: string;
  rating: number;
  suggestions: string | null;
  comment: string | null;
  ip_address: string | null;
  browser_fingerprint: string | null;
  created_at: string;
}

export interface CourseSurveyStats {
  total_surveys: number;
  average_rating: number;
  surveys_by_course: { course_id: number; course_title: string; count: number; avg_rating: number }[];
  ratings_breakdown: { rating: number; count: number }[];
  recent_surveys: CourseSurvey[];
}
