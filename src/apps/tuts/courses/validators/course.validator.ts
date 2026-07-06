// ============================================================
// CourseValidator — Validation logic for course forms
// ============================================================

/** Validate course creation/editing form fields */
export function validateCourseForm(data: {
  title: string;
  cost: string;
  instructor?: string;
}): string | null {
  if (!data.title?.trim()) {
    return 'لطفاً عنوان دوره را وارد کنید.';
  }
  if (!data.cost?.trim()) {
    return 'لطفاً مبلغ شهریه را وارد کنید.';
  }
  const price = parseInt(data.cost.replace(/[^\d]/g, ''));
  if (isNaN(price) || price <= 0) {
    return 'مبلغ شهریه نامعتبر است.';
  }
  return null; // valid
}

/** Validate course group form */
export function validateCategoryName(name: string, existing: string[]): string | null {
  if (!name.trim()) {
    return 'لطفاً عنوان گروه را وارد کنید.';
  }
  if (existing.includes(name.trim())) {
    return 'این گروه آموزشی از قبل تعریف شده است.';
  }
  return null;
}
