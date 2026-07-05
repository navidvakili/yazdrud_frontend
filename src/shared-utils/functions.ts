// ============================================================
// API Functions — توابع ارتباط با بک‌اند (مطابق الگوی sau_public)
// ============================================================

import { API_BASE_URL, BACKEND_API_URL, TOKEN_STRING, USER_STRING, SIGNS_STORAGE_PATH } from '../shared-constants';
import { networkStatus } from './networkStatus';

// ========== Core API Function ==========

/**
 * تابع اصلی درخواست‌های API
 * @param URL - مسند نقطه پایانی (بدون /api/)
 * @param params - داده‌های بدنه درخواست
 * @param method - متد HTTP (GET, POST, PUT, DELETE)
 * @returns Promise با داده‌های پاسخ
 */
export const API = async <T = any>(URL: string, params: any = {}, method: string = 'GET'): Promise<T> => {
  const url = `${API_BASE_URL}/${URL}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STRING) : null;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (method !== 'GET' && params) {
    options.body = JSON.stringify(params);
  }

  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    networkStatus.reportApiFailure();
    throw error;
  }
  // Only report success for actual network success — 4xx/5xx are not network failures
  if (response.status >= 200 && response.status < 300) {
    networkStatus.reportApiSuccess();
  }

  // Handle 401 Unauthorized — اما نه برای لاگین (اجازه بده LoginForm مدیریت کند)
  if (response.status === 401 && !url.includes('/login')) {
    localStorage.removeItem(TOKEN_STRING);
    localStorage.removeItem(USER_STRING);
    window.location.reload();
    throw new Error('جلسه کاربری شما منقضی شده است. لطفاً دوباره وارد شوید.');
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.message || 'خطایی در ارتباط با سرور رخ داد';
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data as T;
};

// ========== File Upload ==========

/**
 * ارسال فایل با multipart/form-data
 * @param URL - مسند نقطه پایانی (بدون /api/)
 * @param formData - شیء FormData شامل فایل‌ها
 * @returns Promise با داده‌های پاسخ
 */
export const APISendFiles = async <T = any>(URL: string, formData: FormData): Promise<T> => {
  const url = `${API_BASE_URL}/${URL}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STRING) : null;

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (error) {
    networkStatus.reportApiFailure();
    throw error;
  }
  networkStatus.reportApiSuccess();

  if (!response.ok) {
    let errorBody: any;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { message: `HTTP error! status: ${response.status}` };
    }
    const error = new Error(errorBody?.message || `HTTP error! status: ${response.status}`);
    (error as any).response = { data: errorBody, status: response.status };
    throw error;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return data as T;
  }

  return (await response.text()) as unknown as T;
};

// ========== File Download ==========

/**
 * دانلود فایل از سرور
 * @param URL - مسند نقطه پایانی (بدون /api/)
 * @param filename - نام فایل برای دانلود (اختیاری)
 */
export const downloadFile = async (URL: string, filename: string | null = null): Promise<void> => {
  const url = `${API_BASE_URL}/${URL}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STRING) : null;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { method: 'GET', headers });
  } catch (error) {
    networkStatus.reportApiFailure();
    throw error;
  }
  networkStatus.reportApiSuccess();

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition');

  let downloadFilename = filename || 'file_download';
  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
    if (matches && matches[1]) {
      downloadFilename = matches[1].replace(/['"]/g, '');
    }
  }

  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = downloadFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

// ========== File Viewer ==========

/**
 * دریافت URL برای نمایش فایل (تصویر یا PDF)
 * @param URL - مسند فایل
 * @returns شیء شامل blob URL و نوع محتوا
 */
export const getFileViewUrl = async (URL: string): Promise<{ url: string; contentType: string }> => {
  const url = `${API_BASE_URL}/${URL}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STRING) : null;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { method: 'GET', headers });

  if (!response.ok) {
    throw new Error('Failed to get file');
  }

  const blob = await response.blob();
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const blobUrl = window.URL.createObjectURL(blob);

  return { url: blobUrl, contentType };
};

// ========== Utility Functions ==========

/**
 * نرمال‌سازی متن فارسی/عربی
 * تبدیل حروف عربی به فارسی برای جستجوی بهتر
 */
export const normalizePersianText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/ي/g, 'ی')  // Arabic ya -> Persian ya
    .replace(/ك/g, 'ک'); // Arabic kaf -> Persian kaf
};

/**
 * ساخت آدرس کامل آواتار کاربر از روی فایل امضا
 */
export const getAvatarUrl = (sign: string | null | undefined): string => {
  if (sign) {
    return `${SIGNS_STORAGE_PATH}/${sign}`;
  }
  return '/default-avatar.svg';
};

/**
 * Collect browser fingerprint data to identify the current device/browser.
 * Returns a JSON string with device and browser characteristics.
 */
export const getBrowserFingerprint = (): string => {
  if (typeof window === 'undefined') return '{}';

  const data: Record<string, any> = {
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    colorDepth: window.screen?.colorDepth,
    pixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat?.().resolvedOptions?.().timeZone,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    maxTouchPoints: navigator.maxTouchPoints,
    vendor: navigator.vendor,
    productSub: navigator.productSub,
  };

  return JSON.stringify(data);
};
