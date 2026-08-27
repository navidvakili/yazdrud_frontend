export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export type UserRoleCondition = 'all' | 'student' | 'professor' | 'admin' | 'guest' | 'authenticated';

export interface ResponsiveValue<T> {
  desktop: T;
  tablet?: T;
  mobile?: T;
}

export interface ConditionalDisplayRule {
  enabled: boolean;
  userRole?: UserRoleCondition;
  urlParamKey?: string;
  urlParamValue?: string;
}

export type WidgetCategory = 'static' | 'dynamic' | 'layout';

export type StaticWidgetType =
  | 'heading'
  | 'text'
  | 'richtext' // بلاک متن WYSIWYG (HTML)
  | 'image'
  | 'button'
  | 'video'
  | 'icon'
  | 'icon-box'
  | 'divider'
  | 'spacer'
  | 'stat-card'
  | 'counter'
  | 'accordion'
  | 'callout'
  | 'vertical-container'
  | 'horizontal-container'
  | 'image-slider'
  | 'navigator'
  | 'nav-menu'
  | 'child-pages' // لیست زیرصفحه‌های صفحهٔ فعلی
  | 'map'
  | 'contact-info'
  | 'custom-html'
  | 'social-links'
  | 'share-buttons'
  | 'pricing-table'
  | 'testimonial'
  | 'tabs'
  | 'interactive-map'
  | 'excel-table';

export type SmartWidgetType =
  | 'announcements-feed'
  | 'news-feed'
  | 'image-gallery'
  | 'achievements-timeline'
  | 'staff-directory'
  | 'file-manager'
  | 'form';

/** بلوک‌های متصل به یک صفحهٔ اختصاصی مشخص (انجمن علمی/کانون/تشکل/نشریه) — انتخاب صفحه در binding.dedicatedPageId */
export type DedicatedPageWidgetType =
  | 'dp-news'
  | 'dp-announcements'
  | 'dp-journal-issues'
  | 'dp-articles'
  | 'dp-gallery'
  | 'dp-events'
  | 'dp-members';

export type WidgetType = StaticWidgetType | SmartWidgetType | DedicatedPageWidgetType;

/** برچسب فارسی نوع ویجت — برای نمایش روی بوم و پنل تنظیمات تا نوع هر ویجت قابل‌تشخیص باشد */
export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  // ویجت‌های عمومی
  heading: 'عنوان',
  text: 'متن',
  richtext: 'متن غنی',
  image: 'تصویر',
  button: 'دکمه',
  video: 'ویدیو',
  icon: 'آیکون',
  'icon-box': 'کارت اطلاعاتی',
  divider: 'خط جداکننده',
  spacer: 'فاصله‌گذار',
  'stat-card': 'کارت آمار',
  counter: 'شمارنده',
  accordion: 'آکاردئون',
  callout: 'یادآوری / هشدار',
  'vertical-container': 'دربرگیرنده عمودی',
  'horizontal-container': 'دربرگیرنده افقی',
  'image-slider': 'اسلایدر تصویر',
  navigator: 'پیمایشگر محتوا',
  'nav-menu': 'نوار راهبری',
  'child-pages': 'لیست زیرصفحه‌ها',
  map: 'نقشه',
  'contact-info': 'اطلاعات تماس',
  'custom-html': 'HTML دلخواه',
  'social-links': 'لینک‌های اجتماعی',
  'share-buttons': 'دکمه‌های اشتراک',
  'pricing-table': 'جدول قیمت',
  testimonial: 'نظر کاربر',
  tabs: 'تب‌ها',
  'interactive-map': 'نقشه تعاملی',
  'excel-table': 'جدول اکسل',
  // ویجت‌های هوشمند (ماژول‌ها)
  'announcements-feed': 'خوراک اطلاعیه‌ها',
  'news-feed': 'خوراک اخبار',
  'image-gallery': 'آلبوم گالری',
  'achievements-timeline': 'تایم‌لاین افتخارات',
  'staff-directory': 'کادر علمی و اساتید',
  'file-manager': 'مخزن اسناد',
  form: 'جاسازی فرم (فرم‌ساز)',
  // بلوک‌های صفحات اختصاصی
  'dp-news': 'خبرهای صفحهٔ اختصاصی',
  'dp-announcements': 'اطلاعیه‌های صفحهٔ اختصاصی',
  'dp-journal-issues': 'نسخه‌های نشریه',
  'dp-articles': 'فهرست مقالات صفحهٔ اختصاصی',
  'dp-gallery': 'گالری تصاویر صفحهٔ اختصاصی',
  'dp-events': 'رویدادهای صفحهٔ اختصاصی',
  'dp-members': 'اعضای شورا و کادر اجرایی'
};

/** برچسب فارسی نوع ویجت با فالبک به خودِ type */
export const getWidgetTypeLabel = (type: WidgetType): string => WIDGET_TYPE_LABELS[type] ?? type;

export interface WidgetStyle {
  textColor?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  fontFamily?: string;
  fontSize?: string; // e.g., '18px', '1.25rem'
  fontWeight?: string;
  textAlign?: 'right' | 'center' | 'left' | 'justify';
  lineHeight?: string | number;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  // Legacy single radius (all corners) — newer builds use per-corner fields below
  borderRadius?: number;
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  // 'none' | 'sm' | 'md' | 'lg' | 'xl' presets OR raw CSS box-shadow string
  shadow?: string;
  opacity?: number;
  backgroundOpacity?: number; // 0-100
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** کادر تصویر — خودکار/مستطیل | مربع | دایره */
  imageFrame?: 'rounded' | 'square' | 'circle';
  /** انیمیشن زوم هنگام هاور روی تصویر — پیش‌فرض روشن */
  imageHoverZoom?: boolean;
  maxWidth?: number; // px — caps widget width
  fullWidth?: boolean; // button stretches to full column width
  /** 'full' (default) | 'auto' (fit-content) | 'center'/'left'/'right' (fit-content + aligned) */
  widthMode?: 'full' | 'auto' | 'center' | 'left' | 'right';
  alignVertical?: 'top' | 'center' | 'bottom'; // vertical alignment inside the widget box
  // Video layer settings (slider-studio parity)
  videoAutoplay?: boolean;
  videoLoop?: boolean;
  videoMuted?: boolean;
  videoControls?: boolean;
  videoPoster?: string;
  aspectRatio?: '16 / 9' | '4 / 3' | '1 / 1' | 'auto';
  customCss?: string;
}

export interface WidgetDataBinding {
  dataSource: 'announcements' | 'news' | 'gallery' | 'awards' | 'staff' | 'files' | 'dedicated-page' | 'form' | 'none';
  /** شناسه و اسلاگ فرمِ منتخب از فرم‌ساز — فقط برای widget نوع 'form' */
  formId?: string;
  formSlug?: string;
  categoryFilter?: string;
  priorityFilter?: 'all' | 'urgent' | 'standard';
  departmentFilter?: string;
  yearFilter?: string;
  folderFilter?: string;
  limit?: number;
  sortBy?: 'date_desc' | 'date_asc' | 'views' | 'priority' | 'title';
  displayMode?:
    | 'grid'
    | 'list'
    | 'carousel'
    | 'masonry'
    | 'timeline'
    | 'marquee'
    | 'table'
    | 'boxes'
    | 'grid-overlay'
    | 'featured'
    | 'numbered-list'
    | 'horizontal-list'
    | 'date-based'
    | 'ticker'
    | 'tabbed'
    | 'accordion'
    | 'load-more'
    | 'infinite-scroll'
    | 'mixed'
    | 'multi-section'
    | 'combined'
    | 'date-badge'
    | 'magazine'
    | 'full-width-slider'
    | 'featured-list';
  columnsCount?: number;
  /** نمایش تصویر بندانگشتی در نمای لیستی اخبار */
  newsListImage?: boolean;
  /** نوع فایل نمایش‌داده‌شده در ویجت مخزن اسناد / گالری رسانه */
  fileType?: 'all' | 'image' | 'video' | 'audio' | 'document';
  /** نحوه باز شدن اطلاعیه هنگام کلیک — صفحه جاری / صفحه جدید / پنجره modal */
  openMode?: 'self' | 'new' | 'modal';
  /**
   * موقعیت تصویر نسبت به جزئیات در بلوک اعضای صفحهٔ اختصاصی — این فیلد خودش
   * تعیین‌کنندهٔ چیدمان است، مستقل از displayMode:
   * 'top' = کارتی/شبکه‌ای، تصویر بالا (پیش‌فرض) | 'card-right'/'card-left' = کارتی/شبکه‌ای، تصویر کنار جزئیات
   * 'right'/'left' = ردیفی تک‌ستونه، تصویر کنار جزئیات
   */
  avatarPosition?: 'top' | 'right' | 'left' | 'card-right' | 'card-left';
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  title: string;
  content: string; // HTML or plain text or primary value
  imageUrl?: string;
  videoUrl?: string;
  buttonUrl?: string;
  buttonText?: string;
  /** نحوه باز شدن لینک دکمه — همان صفحه (پیش‌فرض) یا تب/پنجرهٔ جدید */
  buttonTarget?: 'self' | 'new';
  iconName?: string;
  settings: {
    style: WidgetStyle;
    binding: WidgetDataBinding;
    visibility: {
      desktop: boolean;
      tablet: boolean;
      mobile: boolean;
    };
    conditionalDisplay: ConditionalDisplayRule;
    customProps?: Record<string, any>;
  };
}

export interface ColumnResponsiveWidths {
  desktop: number;
  tablet?: number;
  mobile?: number;
}

/** یک بلوک داخل ستون — یا ویجت یا زیربلوک (سکشن تو در تو). ترتیب یکپارچهٔ بلوک‌ها را نگه می‌دارد */
export type ColumnBlock =
  | { kind: 'widget'; widget: WidgetInstance }
  | { kind: 'section'; section: SectionInstance };

export interface ColumnInstance {
  id: string;
  width: number; // 1 to 12 in a 12-column grid (fallback / desktop)
  widths?: ColumnResponsiveWidths; // per-device widths (mobile defaults to 12 = single column)
  widgets: WidgetInstance[];
  /** بلوک‌های زیرمجموعه (زیربلوک) داخل این ستون — سکشن‌های تو در تو */
  subSections?: SectionInstance[];
  /** لیست یکپارچهٔ بلوک‌های ستون به ترتیب نمایش — اگر موجود باشد ملاک رندر و جابه‌جایی است،
   *  در غیر این صورت از widgets + subSections (ویجت‌ها اول، بعد زیربلوک‌ها) ساخته می‌شود */
  blocks?: ColumnBlock[];
  style?: {
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
  };
  /** موقعیت این ستون در صفحه — برای سایدبار چسبان/ثابت کنار محتوای اصلی
   *  (برخلاف position سکشن که کل ردیف را می‌چسباند، این فقط همین ستون را می‌چسباند) */
  position?: 'static' | 'relative' | 'sticky' | 'fixed';
  /** فاصله از بالای صفحه هنگام چسبیدن/ثابت‌شدن (پیکسل) — مثلاً برای قرارگرفتن زیر هدر چسبان سایت */
  offsetTop?: number;
  /** لایهٔ ستون (z-index) */
  zIndex?: number;
}

/** بلوک‌های یک ستون به ترتیب — اگر blocks ذخیره شده باشد همان، وگرنه ویجت‌ها اول بعد زیربلوک‌ها */
export const getColumnBlocks = (col: ColumnInstance): ColumnBlock[] => {
  if (Array.isArray(col.blocks) && col.blocks.length > 0) return col.blocks;
  return [
    ...(col.widgets ?? []).map((widget) => ({ kind: 'widget' as const, widget })),
    ...(col.subSections ?? []).map((section) => ({ kind: 'section' as const, section }))
  ];
};

/** ستون جدید با blocks دلخواه — آرایه‌های legacy (widgets/subSections) هم همگام می‌شوند */
export const setColumnBlocks = (col: ColumnInstance, blocks: ColumnBlock[]): ColumnInstance => ({
  ...col,
  blocks,
  widgets: blocks.filter((b) => b.kind === 'widget').map((b) => b.widget),
  subSections: blocks.filter((b) => b.kind === 'section').map((b) => b.section)
});

/** عرض ستون در یک دستگاه خاص — پیش‌فرض: موبایل تک‌ستونه، تبلت/دسکتاپ = width */
export const getColumnWidth = (col: ColumnInstance, bp: Breakpoint): number => {
  const w = col.widths?.[bp];
  if (w && w >= 1 && w <= 12) return w;
  if (bp === 'mobile') return 12;
  return col.width || 12;
};

/** سایه‌های آمادهٔ بلوک (سکشن/ویجت) — یا رشتهٔ CSS سفارشی */
export const SHADOW_PRESETS: Record<string, string> = {
  sm: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
};

/** تبدیل مقدار سایه به CSS — پریست (sm/md/lg/xl) یا رشتهٔ خام */
export const resolveBoxShadow = (shadow?: string): string | undefined => {
  if (!shadow || shadow === 'none') return undefined;
  if (shadow in SHADOW_PRESETS) return SHADOW_PRESETS[shadow];
  return shadow;
};

export interface SectionInstance {
  id: string;
  name: string;
  layout: 'full-width' | 'boxed';
  /** موقعیت سکشن در صفحه — مانند فتوشاپ: ثابت (fixed)، چسبان (sticky)، نسبی (relative) یا معمولی */
  position?: 'static' | 'relative' | 'sticky' | 'fixed';
  /** لایهٔ سکشن (z-index) — برای قرارگیری روی سایر سکشن‌ها */
  zIndex?: number;
  backgroundColor?: string;
  backgroundGradient?: string;
  /** شفافیت پس‌زمینه سکشن (رنگ یا گرادیان) — 0 تا 100 */
  backgroundOpacity?: number;
  /** تصویر پس‌زمینه سکشن (به همراه موقعیت/اندازه/تکرار) */
  backgroundImage?: string;
  backgroundPosition?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
  /** نشانک (Bookmark) — شناسه دلخواه برای لینک‌های #anchor */
  bookmark?: string;
  paddingTop: number;
  paddingBottom: number;
  /** فاصلهٔ داخلی راست/چپ سکشن (پیکسل) */
  paddingLeft?: number;
  paddingRight?: number;
  /** فاصلهٔ خارجی سکشن (می‌تواند منفی باشد تا بلوک روی بلوک قبلی قرار بگیرد) */
  marginTop?: number;
  marginBottom?: number;
  /** سایهٔ بلوک — 'none' | 'sm' | 'md' | 'lg' | 'xl' پریست یا رشتهٔ CSS سفارشی */
  boxShadow?: string;
  /** شعاع گوشه‌ها به‌صورت جداگانه (مانند فتوشاپ) — TL/TR/BL/BR */
  borderRadius?: {
    topLeft?: number;
    topRight?: number;
    bottomLeft?: number;
    bottomRight?: number;
  };
  columns: ColumnInstance[];
  visibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  conditionalDisplay: ConditionalDisplayRule;
}

export interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  containerMaxWidth: number; // e.g. 1200
  baseRadius: number;
  /** نمایش منوی اصلی (هدر سراسری) وب‌سایت هنگام نمایش این صفحه — پیش‌فرض true (بدون تغییر نسبت به قبل) */
  showSiteNav?: boolean;
}

/** فال‌بک وقتی شمای صفحه فاقد globalStyles است (مثلاً یک صفحهٔ لایوت تازه‌ساز یا داده‌های ناقص) */
export const DEFAULT_GLOBAL_STYLES: GlobalStyles = {
  primaryColor: '#0d9488',
  secondaryColor: '#4f46e5',
  accentColor: '#f59e0b',
  backgroundColor: '#ffffff',
  textColor: '#1e293b',
  fontFamily: 'Vazirmatn, sans-serif',
  containerMaxWidth: 1240,
  baseRadius: 16,
  showSiteNav: true
};

export interface PageVersion {
  id: string;
  timestamp: string;
  title: string;
  note: string;
  schemaSnapshot: SmartPageSchema;
}

export interface SmartPageSeo {
  title?: string;
  description?: string;
  keywords?: string;
  og_image?: string;
}

export interface SmartPageSchema {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  seo?: SmartPageSeo;
  createdAt: string;
  updatedAt: string;
  version: number;
  globalStyles: GlobalStyles;
  sections: SectionInstance[];
  versionHistory: PageVersion[];
}

export interface PageTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  schema: SmartPageSchema;
}

export interface SectionTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  section: SectionInstance;
}
