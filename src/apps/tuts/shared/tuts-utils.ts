// ============================================================
// TutsModule — Backward-compatible re-exports
// All utilities have been moved to ./utils/ for modularity.
// ============================================================

export {
  toPersianDigits,
  toEnglishDigits,
  normalizePersian,
  formatNumberWithCommas,
  formatCurrency,
  formatCostInput,
} from './utils/formatters';

export {
  mapCourse,
  mapVoucher,
  mapRegistrant,
} from './utils/mappers';

export {
  toPersianDateString,
  toJalaliYearMonth,
  getTodayJalali,
  getCurrentTime,
} from './utils/dates';
