// ============================================================
// Constants — مقادیر ثابت برنامه (مطابق الگوی sau_public)
// ============================================================

/** آدرس سرور بک‌اند لاراول */
export const BACKEND_API_URL = 'http://localhost:8000';

/** پیشوند API (BACKEND_API_URL + /api) */
export const API_BASE_URL = `${BACKEND_API_URL}/api`;

/** کلید ذخیره‌سازی توکن در localStorage */
export const TOKEN_STRING = 'portal_token';

/** کلید ذخیره‌سازی اطلاعات کاربر در localStorage */
export const USER_STRING = 'portal_user';

/** کلید ذخیره‌سازی تم در localStorage */
export const THEME_STRING = 'portal_theme';

/** نام شرکت / دانشگاه */
export const COMPANY_NAME = 'پرتال جامع دانشگاهی کارانت';

/** مسیر ذخیره‌سازی امضاها (برای آواتار) */
export const SIGNS_STORAGE_PATH = `${BACKEND_API_URL}/storage/signs`;

// ============================================================
// Role Accent Colors — هر نقش یک رنگ متمایز برای تب‌ها و منو
// ============================================================

/** نام‌های رنگ‌های موجود */
export type AccentName = 'teal' | 'violet' | 'blue' | 'amber' | 'rose' | 'cyan' | 'emerald' | 'orange' | 'indigo' | 'pink' | 'slate';

/** رنگ‌های هر اکسنت (مقادیر HSL برای استفاده در CSS variables) */
export const ACCENT_COLORS: Record<AccentName, { hue: number; sat: number; light: number }> = {
  teal:    { hue: 173, sat: 80,  light: 40 },
  violet:  { hue: 262, sat: 83,  light: 58 },
  blue:    { hue: 221, sat: 83,  light: 53 },
  amber:   { hue: 38,  sat: 92,  light: 50 },
  rose:    { hue: 348, sat: 83,  light: 47 },
  cyan:    { hue: 187, sat: 85,  light: 39 },
  emerald: { hue: 160, sat: 84,  light: 39 },
  orange:  { hue: 24,  sat: 95,  light: 50 },
  indigo:  { hue: 239, sat: 84,  light: 58 },
  pink:    { hue: 330, sat: 81,  light: 60 },
  slate:   { hue: 215, sat: 16,  light: 47 },
};

/** نگاشت نقش کاربر → نام اکسنت */
export const ROLE_ACCENT_MAP: Record<string, AccentName> = {
  // مدیریت سیستم
  admin: 'violet',

  // دانشجو
  student: 'teal',
  newstudent: 'teal',
  phduser: 'teal',
  phduser4001: 'teal',
  phduser401: 'teal',
  phduser403: 'teal',
  phduser404: 'teal',

  // اساتید و آموزش
  teacher: 'blue',
  amouzesh: 'blue',
  amouzesh_karshanes: 'blue',
  amouzeshkol: 'blue',
  service: 'blue',
  pajouheshi: 'blue',
  pajouheshik: 'blue',
  pajouheshikol: 'blue',

  // گروه‌ها
  headgroup: 'amber',
  group: 'amber',

  // دانشکده و مالی
  college: 'rose',
  mali: 'rose',
  shahrie_admin: 'rose',
  shahrie: 'rose',

  // فرهنگی و فناوری
  farhangi: 'cyan',
  farhangik: 'cyan',
  farhangik2: 'cyan',
  itman: 'cyan',
  library: 'cyan',
  arshad: 'cyan',
  uni: 'cyan',

  // پژوهشی دکتری
  pajouheshiphd: 'indigo',

  // روابط عمومی و نمایشگاه
  pr: 'orange',
  pr2: 'orange',
  exhibition: 'orange',
  khabgah: 'orange',

  // رفاهی و نظارت
  resalat: 'emerald',
  refah: 'emerald',
  refahi: 'emerald',
  nezarat: 'emerald',
  moavenp: 'emerald',
  moshavere: 'emerald',
  editor_thesis: 'emerald',

  // ویژه
  specific: 'pink',
};

/** اکسنت پیش‌فرض */
export const DEFAULT_ACCENT: AccentName = 'teal';

/**
 * دریافت نام اکسنت براساس نقش کاربر
 */
export function getRoleAccentName(role: string): AccentName {
  return ROLE_ACCENT_MAP[role] || DEFAULT_ACCENT;
}
