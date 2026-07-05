// ============================================================
// Hooks barrel export
//
// Hooks that are specific to a tab have been moved there.
// This barrel re-exports them from their new locations.
// ============================================================

export { useToast } from './useToast';
export { usePagination } from './usePagination';

// Tab-specific hooks — re-exported from their new tab directories
export { usePreRegistration } from '../../courses/hooks/usePreRegistration';
export { useReceiptOps } from '../../receipts/hooks/useReceiptOps';
export { useVoucherOps } from '../../vouchers/hooks/useVoucherOps';
export { useSurveyOps } from '../../surveys/hooks/useSurveyOps';
export { useStatsFilter } from '../../stats/hooks/useStatsFilter';
