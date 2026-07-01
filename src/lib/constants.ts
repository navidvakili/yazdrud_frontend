// ============================================================
// Constants — مقادیر ثابت برنامه 
// ============================================================

/** آدرس سرور بک‌اند لاراول (بر اساس محیط) */
export const BACKEND_API_URL = import.meta.env.DEV
    ? 'http://127.0.0.1:8000'
    : 'https://portaldb.sau.ac.ir';

/** پیشوند API (BACKEND_API_URL + /api) */
export const API_BASE_URL = `${BACKEND_API_URL}/api`;

/** کلید ذخیره‌سازی توکن در localStorage */
export const TOKEN_STRING = 'portal_token';

/** کلید ذخیره‌سازی اطلاعات کاربر در localStorage */
export const USER_STRING = 'portal_user';

/** کلید ذخیره‌سازی تم در localStorage */
export const THEME_STRING = 'portal_theme';

/** نام شرکت / دانشگاه */
export const COMPANY_NAME = 'نرم‌افزار یکپارچهٔ آموزشی نیکا';

/** مسیر ذخیره‌سازی امضاها (برای آواتار) */
export const SIGNS_STORAGE_PATH = `${BACKEND_API_URL}/storage/signs`;

/** حداکثر تعداد تب‌های همزمان مجاز */
export const MAX_TABS = 6;

/** مدت زمان غیرفعال بودن کاربر (بر حسب میلی‌ثانیه) قبل از فعال شدن حالت standby */
export const STANDBY_TIMEOUT = 10 * 60 * 1000; // 10 دقیقه
