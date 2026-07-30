// ============================================================
// Slider Studio API — ارتباط با بک‌اند برای ذخیره و بارگذاری پروژه‌ها
// ============================================================

/**
 * دریافت توکن احراز هویت از localStorage
 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
  return token
    ? {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    : {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
}

/**
 * آدرس پایه API بک‌اند
 */
const API_BASE = import.meta.env.DEV
  ? 'http://127.0.0.1:8000/api'
  : '/api';

/**
 * دریافت پروژه اسلایدر جاری (تکی)
 * اگر پروژه‌ای وجود نداشته باشد، در بک‌اند به صورت خودکار ساخته می‌شود
 */
export async function fetchCurrentProject() {
  const res = await fetch(`${API_BASE}/admin/slider-studio/current`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('خطا در دریافت پروژه جاری');
  return res.json();
}

/**
 * دریافت لیست پروژه‌های اسلایدر
 */
export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/admin/slider-studio`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('خطا در دریافت پروژه‌ها');
  return res.json();
}

/**
 * دریافت یک پروژه با شناسه
 */
export async function fetchProject(id: number) {
  const res = await fetch(`${API_BASE}/admin/slider-studio/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('خطا در دریافت پروژه');
  return res.json();
}

/**
 * ذخیره پروژه جدید
 */
export async function createProject(data: {
  title: string;
  description?: string;
  project_data: string; // JSON string
  is_active?: boolean;
}) {
  const res = await fetch(`${API_BASE}/admin/slider-studio`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'خطا در ایجاد پروژه');
  }
  return res.json();
}

/**
 * به‌روزرسانی پروژه
 */
export async function updateProject(
  id: number,
  data: {
    title?: string;
    description?: string;
    project_data?: string; // JSON string
    is_active?: boolean;
  }
) {
  const res = await fetch(`${API_BASE}/admin/slider-studio/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'خطا در به‌روزرسانی پروژه');
  }
  return res.json();
}

/**
 * حذف پروژه
 */
export async function deleteProject(id: number) {
  const res = await fetch(`${API_BASE}/admin/slider-studio/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('خطا در حذف پروژه');
  return res.json();
}

/**
 * فعال/غیرفعال کردن پروژه (فقط یک پروژه می‌تواند فعال باشد)
 */
export async function toggleProjectActive(id: number) {
  const res = await fetch(`${API_BASE}/admin/slider-studio/${id}/toggle-active`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('خطا در تغییر وضعیت پروژه');
  return res.json();
}
