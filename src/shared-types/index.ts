// ============================================================
// Shared Types — انواع و اینترفیس‌های سراسری پروژه
// ============================================================

export type UserRole = 'admin' | 'editor' | 'user' | 'support';

export interface User {
  username: string;
  fname: string;
  lname: string;
  kodmeli: string;
  mobile: string;
  email: string;
  role: UserRole;
  /** All roles from the roles table (array of role names) */
  roles?: string[];
  /** Granular permissions from Spatie (e.g. ['dashboard.view', 'users.create']) */
  permissions?: string[];
  sign?: string | null;
  /** Derived full name from fname + lname */
  name: string;
  /** Avatar URL for display */
  avatar: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================
// Language Types — انواع مربوط به زبان‌ها
// ============================================================

export interface Language {
  id: number;
  code: string;
  name: string;
  name_en: string | null;
  dir: 'rtl' | 'ltr';
  is_active: boolean;
  is_default: boolean;
  ordering: number;
  created_at?: string;
  updated_at?: string;
}

export interface LanguagePayload {
  code: string;
  name: string;
  name_en?: string | null;
  dir?: 'rtl' | 'ltr';
  is_active?: boolean;
  is_default?: boolean;
  ordering?: number;
}

// ============================================================
// News Types — انواع مربوط به ماژول اخبار
// ============================================================

export interface NewsAttachment {
  name: string;
  size: string;
  url: string;
}

export interface PhotoReportImage {
  url: string;
  title?: string | null;
}

export interface NewsComment {
  id: number;
  news_id?: number;
  news_title?: string;
  author_name: string;
  content: string;
  is_approved: boolean;
  approved_at?: string | null;
  approved_by_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  author_username: string;
  author_name: string | null;
  author_role?: string | null;
  image_url: string | null;
  views_count: number;
  likes_count: number;
  is_pinned: boolean;
  comments_enabled: boolean;
  is_photo_report: boolean;
  photo_report_images: PhotoReportImage[];
  comments_count: number;
  comments?: NewsComment[];
  status: 'published' | 'draft' | 'archived';
  target_audience: 'all' | 'students' | 'professors' | 'staff';
  tags: string[];
  attachments: NewsAttachment[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  is_active: boolean;
  count?: number;
}

export interface NewsAnalytics {
  total_news: number;
  published_news: number;
  draft_news: number;
  archived_news: number;
  pinned_news: number;
  total_views: number;
  total_likes: number;
  top_viewed: Array<{
    id: number;
    title: string;
    category_id: number | null;
    views_count: number;
    likes_count: number;
  }>;
  top_liked: Array<{
    id: number;
    title: string;
    category_id: number | null;
    views_count: number;
    likes_count: number;
  }>;
  category_distribution: Array<{
    id: number;
    name: string;
    color: string;
    count: number;
    percentage: number;
  }>;
  uncategorized_count: number;
}

// ============================================================
// County Project Types — انواع مربوط به نقشه پروژه‌های عمرانی
// ============================================================

export interface CountyProject {
  id: number;
  county_id: string;
  county_name: string;
  road_projects_count: number;
  housing_units_count: number;
  urban_plans_count: number;
  road_progress: number;
  housing_progress: number;
  urban_progress: number;
  has_active_road_project: boolean;
  has_housing_workshop: boolean;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Hero Slide Types — انواع مربوط به اسلایدر صفحه اصلی
// ============================================================

export interface HeroSlide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  badge: string;
  badge_icon: string;
  bg_image: string | null;
  primary_cta_text: string;
  primary_cta_target: string;
  secondary_cta_text: string;
  secondary_cta_target: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
