// ============================================================
// Formatters — Global text/number formatting utilities
// ============================================================

/** Convert Western digits (0-9) to Persian (۰-۹) */
export function toPersianDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, function (w) {
    return id[+w];
  });
}

/** Convert Persian digits (۰-۹) to Western digits (0-9) */
export function toEnglishDigits(str: string): string {
  if (!str) return '';
  return str.toString().replace(/[٠-۹]/g, function (d) {
    const allDigits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
    const idx = allDigits.indexOf(d);
    return idx >= 0 ? String(idx % 10) : d;
  });
}

/**
 * Normalize a Persian/Arabic string for search/comparison:
 * - Arabic ي → Persian ی, Arabic ك → Persian ک
 * - Persian/Arabic digits → Latin digits (0-9)
 * - Lowercase
 */
export function normalizePersian(str: string): string {
  if (!str) return '';
  let s = str.toLowerCase();
  s = s.replace(/ي/g, 'ی').replace(/ك/g, 'ک');
  s = s.replace(/[٠-۹]/g, function (d) {
    const allDigits = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
    const idx = allDigits.indexOf(d);
    return idx >= 0 ? String(idx % 10) : d;
  });
  return s;
}

/** Format a number with commas (e.g., 1500000 → "1,500,000") */
export function formatNumberWithCommas(num: number | null | undefined): string {
  if (num === null || num === undefined) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Format a number as currency in Rials with Persian digits */
export function formatCurrency(amount: number): string {
  return toPersianDigits(amount.toLocaleString('fa-IR')) + ' ریال';
}

/** Format a numeric input value with comma separators (e.g., "4500000" → "4,500,000") */
export function formatCostInput(value: string): string {
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) return '';
  return parseInt(cleaned, 10).toLocaleString('en-US');
}
