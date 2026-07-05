// ============================================================
// Dialogs barrel export
//
// Dialogs specific to courses/vouchers tabs have been moved there.
// This barrel re-exports them from their new locations.
// ============================================================

export { default as CertificatePreviewDialog } from './CertificatePreviewDialog';
export { default as RefundConfirmDialog } from './RefundConfirmDialog';
export { default as UndoRefundConfirmDialog } from './UndoRefundConfirmDialog';

// Course dialogs — re-exported from courses/tab
export { default as CourseDetailDialog } from '../../courses/dialogs/CourseDetailDialog';
export { default as CourseReportDialog } from '../../courses/dialogs/CourseReportDialog';
export { default as PreRegistrationDialog } from '../../courses/dialogs/PreRegistrationDialog';
export { default as NewCourseDialog } from '../../courses/dialogs/NewCourseDialog';
export { default as EditCourseDialog } from '../../courses/dialogs/EditCourseDialog';
export { default as InstructorManagementDialog } from '../../courses/dialogs/InstructorManagementDialog';
export { default as CategoryManagerDialog } from '../../courses/dialogs/CategoryManagerDialog';
export { default as DeleteCourseDialog } from '../../courses/dialogs/DeleteCourseDialog';

// Voucher dialogs — re-exported from vouchers/tab
export { default as SandboxDialog } from '../../vouchers/dialogs/SandboxDialog';
export { default as DeleteVoucherDialog } from '../../vouchers/dialogs/DeleteVoucherDialog';
