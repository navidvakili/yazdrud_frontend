export type FormType = 'form' | 'survey' | 'quiz' | 'registration';

export type FormStatus = 'draft' | 'published' | 'paused' | 'archived' | 'page_builder_only';

export type FieldCategory = 'basic' | 'advanced' | 'survey' | 'special';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'password'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'multiselect'
  | 'switch'
  | 'file'
  | 'image'
  | 'richtext'
  | 'slider'
  | 'rating'
  | 'matrix'
  | 'likert'
  | 'ranking'
  | 'yesno'
  | 'color'
  | 'location'
  | 'address'
  | 'currency'
  | 'percentage'
  | 'cascading'
  | 'signature'
  | 'captcha'
  | 'security'
  | 'qrcode'
  | 'hidden'
  | 'calculated';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  score?: number; // Score points for quiz
}

export interface MatrixRow {
  id: string;
  label: string;
}

export interface MatrixColumn {
  id: string;
  label: string;
  score?: number;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  regexPattern?: string;
  allowedExtensions?: string[]; // e.g. ['.pdf', '.jpg', '.docx']
  maxFileSizeMb?: number;
  maxFilesCount?: number;
  allowedImageFormats?: string[]; // e.g. ['jpg', 'png', 'webp']
  maxDimensions?: { maxWidth: number; maxHeight: number };
  customErrorMessage?: string;
  allowedDomains?: string[]; // e.g. ['ut.ac.ir', 'university.ac.ir']
  blockFreeEmailProviders?: boolean;
  phoneFormat?: 'iran_mobile' | 'iran_landline' | 'international' | 'custom';
  passwordRules?: {
    minLength: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    requireConfirmPassword?: boolean;
  };
  disallowPastDates?: boolean;
  disallowFutureDates?: boolean;
  minDate?: string;
  maxDate?: string;
  minTime?: string;
  maxTime?: string;
  minSelected?: number;
  maxSelected?: number;
  minAmount?: number;
  maxAmount?: number;
  minPercentage?: number;
  maxPercentage?: number;
}

export interface FieldStyling {
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  customClass?: string;
  columnWidth?: '100%' | '50%' | '33%' | '25%';
}

export interface FieldDatabaseConfig {
  dbColumnName?: string;
  dbDataType?: 'VARCHAR' | 'INTEGER' | 'DECIMAL' | 'TEXT' | 'JSON' | 'BOOLEAN' | 'TIMESTAMP';
  isIndexed?: boolean;
  isEncrypted?: boolean;
  maskInUi?: boolean;
}

export interface FieldApiConfig {
  enabled?: boolean;
  endpointUrl?: string;
  method?: 'GET' | 'POST';
  labelKey?: string;
  valueKey?: string;
  headers?: Record<string, string>;
}

export interface FieldVisibilityConfig {
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
  showOnPrint?: boolean;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  systemKey?: string; // e.g. 'student_national_code', 'user_mobile'
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: FieldOption[];
  matrixRows?: MatrixRow[];
  matrixCols?: MatrixColumn[];
  validation?: FieldValidation;
  columnWidth?: '100%' | '50%' | '33%' | '25%'; // Responsive width
  stepId?: string; // Step page assignment
  sectionTitle?: string;
  order?: number;
  layoutBlockId?: string; // اگر ست شده باشد، فیلد داخل یک بلوک ستونی قرار دارد
  layoutColumnId?: string; // ستون این بلوک که فیلد در آن است

  // General State Flags
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  accessRoles?: string[]; // e.g. ['admin', 'manager', 'student', 'all']

  // Specific Type Configurations
  // Text & Textarea
  textMode?: 'single' | 'multiline';
  charTypeAllowed?: 'any' | 'persian_letters' | 'english_letters' | 'numeric' | 'alphanumeric';
  rowsCount?: number;
  allowTextareaResize?: boolean;

  // Number, Currency & Percentage
  numberUnit?: string; // e.g. 'کیلوگرم', 'نفر', 'ساعت'
  decimalPlaces?: number;
  useThousandSeparator?: boolean;
  currencyUnit?: 'تومان' | 'ریال' | 'دلار' | 'یورو';
  showPercentageIcon?: boolean;

  // Date & Time
  calendarType?: 'jalali' | 'gregorian';
  dateFormat?: 'YYYY/MM/DD' | 'YYYY-MM-DD' | 'DD/MM/YYYY';
  timeFormat?: '24h' | '12h';
  timezone?: string;
  defaultDateOption?: 'none' | 'today' | 'custom';

  // Choice, Dropdown & Radio
  allowSearchOptions?: boolean; // Combobox search
  isMultiSelect?: boolean;
  allowCreateCustomOption?: boolean;
  choiceLayout?: 'vertical' | 'horizontal' | 'grid_2_col';
  defaultSelectedOptionId?: string;

  // File & Image & Signature
  allowMultipleUploads?: boolean;
  showImagePreview?: boolean;
  signaturePadType?: 'draw' | 'type' | 'upload';
  signatureCanvasHeight?: number;

  // Location & Address
  includeProvince?: boolean;
  includeCity?: boolean;
  includePostalCode?: boolean;
  includeGeoCoordinates?: boolean;
  defaultLocation?: { lat: number; lng: number };
  mapZoomLevel?: number;

  // Scale & Rating
  minRating?: number;
  maxRating?: number;
  ratingStep?: number;
  startRatingLabel?: string;
  endRatingLabel?: string;
  ratingIconType?: 'star' | 'heart' | 'emoji' | 'number';
  // رنگ اختصاصی آیکون فیلد — برای هر فیلدی که آیکون نمایش می‌دهد (امتیاز، آپلود فایل/تصویر،
  // امضای دیجیتال، تاریخ/زمان). خالی یعنی رنگ پیش‌فرض همان نوع فیلد استفاده شود
  iconColor?: string;

  // Color & URL
  colorFormat?: 'HEX' | 'RGB' | 'HSL';
  allowedUrlProtocols?: ('https' | 'http')[];

  // Advanced & Calculation
  points?: number; // Base points for correct answer in quiz
  correctAnswer?: string | string[]; // For quizzes
  formula?: string; // For calculated fields, e.g. "field_1 * 0.15 + field_2"
  autoCalculationEnabled?: boolean;
  prefillSource?: 'none' | 'user_fullname' | 'user_email' | 'user_phone' | 'user_national_id' | 'user_role' | 'query_param';
  prefillQueryParam?: string;

  // External API & Dynamic Data
  apiConfig?: FieldApiConfig;

  // Database & Security
  databaseConfig?: FieldDatabaseConfig;
  styling?: FieldStyling;
  visibility?: FieldVisibilityConfig;
  auditTrailEnabled?: boolean;

  // Security / Anti-bot (CAPTCHA family)
  securityType?: 'image_captcha' | 'numeric_code' | 'image_challenge' | 'honeypot';
  securityStyle?: 'boxed' | 'card' | 'minimal';
  securitySize?: 'sm' | 'md' | 'lg';
  securityColor?: string;
  securityButtonText?: string;
  securityMaxAttempts?: number;
  securityExpirySeconds?: number;
  securityCodeLength?: number;
  securityCaseSensitive?: boolean;

  // Dependencies & Cascading
  cascadingParentId?: string;
  cascadingData?: Record<string, string[]>; // e.g. {"تهران": ["تهران", "ری"], "اصفهان": ["اصفهان", "کاشان"]}
  className?: string;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  order: number;
  presentation?: {
    mode: 'all' | 'pagination';
    fieldsPerPage?: number;
  };
}

/** ستون یک بلوک چیدمانی — فهرست شناسهٔ فیلدهای داخل آن به ترتیب نمایش */
export interface FormLayoutColumn {
  id: string;
  fieldIds: string[];
}

/** بلوک چیدمانی تک/دو/سه‌ستونهٔ مساوی — دقیقاً مثل ColumnInstance در صفحه‌ساز هوشمند اما بدون عرض متغیر */
export interface FormLayoutBlock {
  id: string;
  stepId: string;
  columns: FormLayoutColumn[]; // طول ۱، ۲ یا ۳
  /**
   * فقط وقتی بلوک هنوز هیچ فیلدی ندارد استفاده می‌شود: شناسهٔ فیلدی که این بلوک بلافاصله
   * بعد از آن قرار دارد (یا null برای ابتدای گام) — چون موقعیت بلوک معمولاً از روی اولین
   * فیلد عضوش تعیین می‌شود و بلوک خالی چنین فیلدی ندارد تا لنگر بگیرد.
   */
  afterFieldId?: string | null;
}

export type LogicOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';

export type LogicAction = 'show_field' | 'hide_field' | 'skip_to_step' | 'end_survey' | 'set_value' | 'set_score';

export interface LogicRule {
  id: string;
  fieldId: string;
  operator: LogicOperator;
  value: any;
  action: LogicAction;
  targetId?: string; // Field ID or Step ID
  actionValue?: any;
}

export interface GradeThreshold {
  id: string;
  minScore: number;
  maxScore: number;
  gradeLabel: string; // e.g., 'عالی', 'خوب', 'متوسط', 'ضعیف'
  feedbackText: string;
  color: string;
}

export interface FormQuizConfig {
  isQuiz: boolean;
  showInstantResult: boolean;
  timeLimitMinutes?: number;
  allowNegativeScore: boolean;
  randomizeQuestions: boolean;
  passScore?: number;
  gradeThresholds: GradeThreshold[];
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fontFamily: string;
  showLogo: boolean;
  logoUrl?: string;
}

export interface FormSettings {
  allowAnonymous: boolean;
  limitOnePerUser: boolean;
  requireAuth: boolean;
  enableCaptcha: boolean;
  enableAutoSave: boolean;
  showProgressBar: boolean;
  /** نمایش صفحه‌ی خوش‌آمدگویی قبل از سؤال اول */
  showWelcomeScreen: boolean;
  welcomeTitle?: string;
  welcomeDescription?: string;
  welcomeButtonText?: string;
  customSuccessMessage: string;
  /** توضیحات تکمیلی زیر پیام پایان (جایگزین متن پیش‌فرض هاردکد) */
  completionDescription?: string;
  redirectUrl?: string;
  generateTrackingCode: boolean;
  trackingCodePrefix: string;
  expirationDate?: string;
  maxSubmissions?: number;
  sendEmailNotification: boolean;
  notificationEmail?: string;
  sendSmsNotification: boolean;
  notificationPhone?: string;
}

export type FormAccessPermission =
  | 'view_stats'
  | 'view_charts'
  | 'export_excel'
  | 'export_csv'
  | 'export_pdf'
  | 'view_raw_answers'
  | 'view_filtered'
  | 'create_report'
  | 'print_report'
  | 'edit_survey'
  | 'delete_survey'
  | 'view_respondent_identity';

export interface UserAccessRule {
  id: string;
  userName: string;
  userEmail?: string;
  userRole: string; // e.g. 'مسئول فرهنگی', 'استاد درس'
  department?: string;
  permissions: FormAccessPermission[];
  assignedAt: string;
  expiresAt?: string;
  status: 'active' | 'suspended';
  notes?: string;
}

export interface PublicResultConfig {
  enabled: boolean;
  customSlug: string; // e.g., 'student-cultural-satisfaction'
  title: string;
  description: string;
  universityBrand: string;
  showLogo: boolean;
  logoUrl?: string;
  passwordProtected: boolean;
  password?: string;
  expirationDate?: string;
  startDate?: string;
  endDate?: string;
  ipRestrictionsEnabled: boolean;
  allowedIps: string[]; // e.g. ['192.168.1.*', '10.0.0.*']
  anonymizeRespondents: boolean;
  allowedQuestionIds: string[]; // Selected questions visible to public
  allowedExportTypes: ('pdf' | 'excel' | 'csv')[];
  chartTypes: ('bar' | 'pie' | 'line' | 'summary')[];
  autoRefresh: boolean;
  refreshIntervalSeconds: number;
  readOnly: boolean;
  allowEmbed: boolean;
  viewsCount: number;
  qrCodeUrl?: string;
}

export interface FormReportView {
  id: string;
  title: string; // e.g., 'گزارش مدیریتی هیئت رئیسه', 'گزارش تفکیکی دانشکده‌ها'
  slug: string;
  description?: string;
  selectedQuestionIds: string[];
  filterCriteria?: {
    faculty?: string;
    role?: string;
  };
  displayType: 'dashboard' | 'charts_only' | 'table_summary';
  createdAt: string;
  isPublic: boolean;
}

export interface ReportAccessAuditLog {
  id: string;
  accessorName: string;
  accessorRoleOrIp: string;
  action: 'view_dashboard' | 'export_pdf' | 'export_excel' | 'export_csv' | 'print' | 'login_attempt';
  timestamp: string;
  success: boolean;
  details?: string;
}

export interface AuditLogItem {
  id: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface FormDefinition {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: FormType;
  status: FormStatus;
  category: string;
  tags: string[];
  ownerName: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  steps: FormStep[];
  fields: FormField[];
  layoutBlocks: FormLayoutBlock[];
  logicRules: LogicRule[];
  quizConfig: FormQuizConfig;
  theme: FormTheme;
  settings: FormSettings;
  userAccessRules?: UserAccessRule[];
  publicResultConfig?: PublicResultConfig;
  reportViews?: FormReportView[];
  reportAuditLogs?: ReportAccessAuditLog[];
  auditLogs: AuditLogItem[];
  viewsCount: number;
  submissionsCount: number;
  avgCompletionTimeSeconds: number;
}

export interface FormSubmission {
  id: string;
  formId: string;
  trackingCode: string;
  respondentName?: string;
  respondentEmail?: string;
  respondentRole?: string;
  submittedAt: string;
  status: 'new' | 'under_review' | 'approved' | 'rejected';
  answers: Record<string, any>;
  scoreTotal?: number;
  gradeLabel?: string;
  ipAddress: string;
  userAgent?: string;
  completionTimeSeconds: number;
  internalNotes?: string;
  expertAssigned?: string;
  sentimentAnalysis?: 'positive' | 'neutral' | 'negative';
}
