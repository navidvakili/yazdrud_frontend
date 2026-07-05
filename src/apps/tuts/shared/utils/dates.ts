// ============================================================
// Dates — Jalali/Persian date utilities
// ============================================================

import PersianDate from 'persian-date';

/**
 * Convert a Gregorian date string ("Y/m/d H:i") to Shamsi (Jalali) with Western digits.
 * Example: "2026/07/01 09:21" → "1405/04/10 09:21"
 */
export function toPersianDateString(gregorianDate: string): string {
  if (!gregorianDate) return '';
  try {
    const [datePart, timePart] = gregorianDate.split(' ');
    const [y, m, d] = datePart.split('/').map(Number);
    const [h, min] = timePart ? timePart.split(':').map(Number) : [0, 0];
    const jsDate = new Date(y, m - 1, d, h, min);
    return new PersianDate(jsDate).toLocale('en').format('YYYY/MM/DD HH:mm');
  } catch {
    return gregorianDate;
  }
}

/**
 * Convert a Gregorian date string (e.g. "2026/07/01" or "2026/07/01 09:21")
 * to Jalali year and month strings.
 * Returns { year: "1405", month: "04" } or null if parsing fails.
 */
export function toJalaliYearMonth(gregorianDate: string): { year: string; month: string } | null {
  if (!gregorianDate) return null;
  try {
    const [datePart] = gregorianDate.split(' ');
    const [y, m, d] = datePart.split('/').map(Number);
    if (!y || !m || !d) return null;
    const jsDate = new Date(y, m - 1, d);
    const pd = new PersianDate(jsDate).toLocale('en');
    const year = pd.format('YYYY');
    const month = pd.format('MM');
    return { year, month };
  } catch {
    return null;
  }
}

/** Get today's date as a Jalali string (e.g., "1405/04/10") */
export function getTodayJalali(): string {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d).replace(/\u200f/g, '').replace(/[/\\]/g, '/');
}

/** Get current hour and minute for sandbox time simulation */
export function getCurrentTime(): { hour: number; minute: number } {
  const now = new Date();
  return { hour: now.getHours(), minute: now.getMinutes() };
}

/** Get current Jalali year string */
export function getCurrentJalaliYear(): string {
  return String(new Date().getFullYear() - 621);
}
