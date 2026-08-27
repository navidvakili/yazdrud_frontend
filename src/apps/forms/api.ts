// ============================================================
// Forms API — ارتباط ماژول فرم‌ساز با وب‌سرویس واقعی
// نگاشت بین شکل backend (snake_case، id عددی) و FormDefinition/FormSubmission
// همان الگوی SmartPageDto در page-builder/api.ts که جدا از نوع دامنه نگه داشته می‌شود.
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { FormDefinition, FormSubmission, FormStatus, FormType } from './types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

/** شکل خام یک فرم همان‌طور که از سرور برمی‌گردد (snake_case) */
interface FormRowDto {
  id: number;
  language: string;
  title: string;
  slug: string;
  description: string | null;
  type: FormType;
  status: FormStatus;
  category: string | null;
  owner_username: string | null;
  version: number;
  published_at: string | null;
  tags: string[] | null;
  steps: FormDefinition['steps'] | null;
  fields: FormDefinition['fields'] | null;
  layout_blocks: FormDefinition['layoutBlocks'] | null;
  logic_rules: FormDefinition['logicRules'] | null;
  quiz_config: FormDefinition['quizConfig'] | null;
  theme: FormDefinition['theme'] | null;
  settings: FormDefinition['settings'] | null;
  views_count: number;
  submissions_count: number;
  avg_completion_time_seconds: number | null;
  created_at: string;
  updated_at: string;
}

interface SubmissionRowDto {
  id: number;
  form_id: number;
  tracking_code: string;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_role: string | null;
  status: FormSubmission['status'];
  answers: Record<string, any>;
  score_total: number | null;
  grade_label: string | null;
  ip_address: string | null;
  user_agent: string | null;
  completion_time_seconds: number | null;
  internal_notes: string | null;
  expert_assigned: string | null;
  submitted_at: string | null;
}

/** نگاشت ردیف خام سرور به FormDefinition — فیلدهای فاز ۴/۵ (دسترسی گزارش، نتایج عمومی، ...) هنوز در backend ذخیره نمی‌شوند و آرایهٔ خالی برمی‌گردند */
const toFormDefinition = (row: FormRowDto): FormDefinition => ({
  id: String(row.id),
  slug: row.slug,
  title: row.title,
  description: row.description || '',
  type: row.type,
  status: row.status,
  category: row.category || '',
  tags: row.tags || [],
  ownerName: row.owner_username || '',
  version: row.version,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  publishedAt: row.published_at || undefined,
  steps: row.steps || [],
  fields: row.fields || [],
  layoutBlocks: row.layout_blocks || [],
  logicRules: row.logic_rules || [],
  quizConfig: row.quiz_config || {
    isQuiz: row.type === 'quiz',
    showInstantResult: row.type === 'quiz',
    allowNegativeScore: false,
    randomizeQuestions: false,
    gradeThresholds: []
  },
  theme: row.theme || {
    primaryColor: '#0d9488',
    backgroundColor: '#f8fafc',
    cardColor: '#ffffff',
    textColor: '#0f172a',
    borderRadius: 'lg',
    fontFamily: 'Vazirmatn',
    showLogo: false
  },
  settings: row.settings || {
    allowAnonymous: true,
    limitOnePerUser: false,
    requireAuth: false,
    enableCaptcha: false,
    enableAutoSave: true,
    showProgressBar: true,
    showWelcomeScreen: false,
    customSuccessMessage: 'اطلاعات شما با موفقیت ثبت شد.',
    generateTrackingCode: true,
    trackingCodePrefix: 'FRM',
    sendEmailNotification: false,
    sendSmsNotification: false
  },
  userAccessRules: [],
  publicResultConfig: undefined,
  reportViews: [],
  reportAuditLogs: [],
  auditLogs: [],
  viewsCount: row.views_count,
  submissionsCount: row.submissions_count,
  avgCompletionTimeSeconds: row.avg_completion_time_seconds || 0,
});

const toFormSubmission = (row: SubmissionRowDto): FormSubmission => ({
  id: String(row.id),
  formId: String(row.form_id),
  trackingCode: row.tracking_code,
  respondentName: row.respondent_name || undefined,
  respondentEmail: row.respondent_email || undefined,
  respondentRole: row.respondent_role || undefined,
  submittedAt: row.submitted_at || '',
  status: row.status,
  answers: row.answers || {},
  scoreTotal: row.score_total ?? undefined,
  gradeLabel: row.grade_label || undefined,
  ipAddress: row.ip_address || '',
  userAgent: row.user_agent || undefined,
  completionTimeSeconds: row.completion_time_seconds || 0,
  internalNotes: row.internal_notes || undefined,
  expertAssigned: row.expert_assigned || undefined,
});

/** بدنهٔ درخواست ایجاد/به‌روزرسانی — همان بخش‌هایی از FormDefinition که واقعاً در backend ذخیره می‌شوند */
const toPayload = (form: Partial<FormDefinition>): Record<string, any> => {
  const payload: Record<string, any> = {};
  if (form.title !== undefined) payload.title = form.title;
  if ((form as any).slug !== undefined) payload.slug = (form as any).slug;
  if (form.description !== undefined) payload.description = form.description;
  if (form.type !== undefined) payload.type = form.type;
  if (form.status !== undefined) payload.status = form.status;
  if (form.category !== undefined) payload.category = form.category;
  if (form.tags !== undefined) payload.tags = form.tags;
  if (form.steps !== undefined) payload.steps = form.steps;
  if (form.fields !== undefined) payload.fields = form.fields;
  if (form.layoutBlocks !== undefined) payload.layout_blocks = form.layoutBlocks;
  if (form.logicRules !== undefined) payload.logic_rules = form.logicRules;
  if (form.quizConfig !== undefined) payload.quiz_config = form.quizConfig;
  if (form.theme !== undefined) payload.theme = form.theme;
  if (form.settings !== undefined) payload.settings = form.settings;
  return payload;
};

/**
 * اسلاگ از عنوان — backend فقط a-z0-9- را می‌پذیرد (regex:/^[a-z0-9\-]+$/، همان محدودیت smart_pages.slug)
 * و عنوان‌ها اینجا تقریباً همیشه فارسی هستند، پس تلاشی برای ترجمه/تلفظ لاتین نمی‌کنیم — فقط بخش
 * لاتین/عددیِ واقعیِ عنوان (اگر باشد) نگه داشته می‌شود و timestamp یکتایی را تضمین می‌کند،
 * دقیقاً همان الگوی «page-{timestamp}» که در smart_pages برای عنوان‌های فارسی استفاده می‌شود.
 */
export const slugifyFormTitle = (title: string): string => {
  const latinPart = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return latinPart ? `${latinPart}-${Date.now()}` : `form-${Date.now()}`;
};

// ===== Forms CRUD =====

export const fetchForms = async (params: { page?: number; per_page?: number; search?: string; status?: string; type?: string; lang?: string } = {}): Promise<{
  data: FormDefinition[];
  total: number;
}> => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.type) qs.set('type', params.type);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await API<PaginatedResponse<FormRowDto>>(`forms${suffix}`);
  return { data: res.data.map(toFormDefinition), total: res.total };
};

export const fetchForm = async (id: string | number): Promise<FormDefinition> => {
  const res = await API<{ data: FormRowDto }>(`forms/${id}`);
  return toFormDefinition(res.data);
};

export const createForm = async (
  form: Partial<FormDefinition> & { title: string; slug?: string },
  lang?: string
): Promise<FormDefinition> => {
  const payload = toPayload(form);
  if (!payload.slug) payload.slug = slugifyFormTitle(form.title);
  if (lang) payload.lang = lang;
  const res = await API<{ message: string; data: FormRowDto }>('forms', payload, 'POST');
  return toFormDefinition(res.data);
};

export const updateForm = async (id: string | number, form: Partial<FormDefinition>): Promise<FormDefinition> => {
  const res = await API<{ message: string; data: FormRowDto }>(`forms/${id}`, toPayload(form), 'PUT');
  return toFormDefinition(res.data);
};

export const updateFormStatus = async (id: string | number, status: FormStatus): Promise<FormDefinition> => {
  const res = await API<{ message: string; data: FormRowDto }>(`forms/${id}/status`, { status }, 'PATCH');
  return toFormDefinition(res.data);
};

export const cloneForm = async (id: string | number): Promise<FormDefinition> => {
  const res = await API<{ message: string; data: FormRowDto }>(`forms/${id}/clone`, {}, 'POST');
  return toFormDefinition(res.data);
};

/** Duplicate a form into another language (copies its content as a translation starting point) */
export const duplicateForm = async (id: string | number, lang: string): Promise<FormDefinition> => {
  const res = await API<{ message: string; data: FormRowDto }>(`forms/${id}/duplicate`, { lang }, 'POST');
  return toFormDefinition(res.data);
};

export const deleteForm = async (id: string | number): Promise<{ message: string }> => {
  return API(`forms/${id}`, {}, 'DELETE');
};

// ===== Submissions (staff) =====

export const fetchSubmissions = async (
  formId: string | number,
  params: { page?: number; per_page?: number; status?: string } = {}
): Promise<{ data: FormSubmission[]; total: number }> => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.status) qs.set('status', params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await API<PaginatedResponse<SubmissionRowDto>>(`forms/${formId}/submissions${suffix}`);
  return { data: res.data.map(toFormSubmission), total: res.total };
};

export const submitForm = async (
  formId: string | number,
  data: {
    answers: Record<string, any>;
    // پاسخ فیلدهای امنیتی (توکن/مقدار کپچا، مقدار تلهٔ ضدربات) — جدا از answers، چون
    // این‌ها صرفاً برای بررسی ضدربات مصرف می‌شوند و در پاسخ ذخیره‌شده نگه‌داشته نمی‌شوند
    security_challenges?: Record<string, any>;
    respondent_name?: string;
    respondent_email?: string;
    respondent_role?: string;
    completion_time_seconds?: number;
  }
): Promise<{ tracking_code: string; score_total?: number; grade_label?: string }> => {
  const res = await API<{ message: string; data: { tracking_code: string; score_total?: number; grade_label?: string } }>(
    `forms/${formId}/submit`,
    data,
    'POST'
  );
  return res.data;
};
