import React, { useState, useEffect, useRef, cloneElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  WidgetInstance,
  WidgetStyle,
  UserRoleCondition,
  WidgetDataBinding,
  SectionInstance,
  getColumnBlocks
} from './builderTypes';
import {
  fetchDataSourceNews,
  fetchDataSourceMedia,
  fetchSmartPageChildrenTree,
  fetchDedicatedPageContentsForWidget,
  fetchDedicatedPageMembersForWidget
} from './api';
import type { SmartPageTreeNode, DedicatedPageContentItem, DedicatedPageMemberItem } from './api';
import type { NewsItem } from '@/src/shared-types';
import type { MediaFile } from '../gallery/types';
import { fetchForm } from '../forms/api';
import type { FormDefinition } from '../forms/types';
import { FormRespondentView } from '../forms/FormRespondentView';
import {
  FileText,
  Download,
  Calendar,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  MapPin,
  Phone,
  Mail,
  Share2,
  MessageCircle,
  Link2,
  Type,
  Columns,
  Rows,
  Images,
  Gauge,
  Compass,
  Code2,
  Quote,
  Info,
  Send,
  Globe,
  Hash,
  Heart,
  CheckCircle2,
  ArrowLeft,
  User,
  Users,
  UsersRound,
  BadgeDollarSign,
  BookOpen,
  Award,
  LockOpen,
  Lock,
  GraduationCap,
  ChartNoAxesColumn,
  Monitor,
  FileCheck,
  BookmarkCheck,
  Box,
  ShieldCheck,
  UserCheck,
  CircleHelp,
  Linkedin,
  Instagram,
  Youtube,
  X,
  CalendarDays,
  Megaphone,
  Plus,
  Loader2,
  Building2,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react';
import {
  EitaaIcon,
  BaleIcon,
  CafeBazaarIcon,
  EnamadIcon,
  GapIcon,
  SappIcon,
  ShetabIcon,
  AdobeAcrobatReaderIcon,
  AdobeAfterEffectsIcon,
  AdobeAuditionIcon,
  AdobeIcon,
  AparatIcon,
} from './components/BrandIcons';

interface WidgetRendererProps {
  widget: WidgetInstance;
  currentUserRole?: UserRoleCondition;
  isEditorPreview?: boolean;
  /** عمق تو در تویی رندر (برای دربرگیرنده‌ها) — جلوگیری از حلقه بی‌نهایت */
  depth?: number;
  /** شناسه و slug صفحهٔ در حال ویرایش — برای ویجت child-pages (لیست زیرصفحه‌ها) */
  pageId?: number | null;
  pageSlug?: string | null;
  /** مقدار متغیرهای صفحهٔ اختصاصی — وقتی این صفحه به یک صفحهٔ اختصاصی متصل است (برای توکن‌های {{key}} در متن) */
  variables?: Record<string, string>;
  /** شناسهٔ نمونهٔ صفحهٔ اختصاصیِ در حال پیش‌نمایش — برای بلوک‌های dp-* (وقتی این لایوت به یک نوع صفحهٔ اختصاصی متصل است) */
  dedicatedPageId?: number | null;
}

/** تبدیل تاریخ ISO به تاریخ شمسی کوتاه */
const formatFaDate = (iso?: string | null): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fa-IR');
  } catch {
    return '';
  }
};

// ── لایه‌سازی (هم‌سطح slider-studio): شعاع گوشه، سایه، پس‌زمینه با شفافیت ──

/** سایه‌های آماده — یا رشتهٔ CSS سفارشی */
const SHADOW_PRESETS: Record<string, string> = {
  sm: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
};

/** تبدیل فیلد shadow به مقدار CSS (پریست یا رشتهٔ خام) */
const resolveBoxShadow = (shadow?: string): string | undefined => {
  if (!shadow || shadow === 'none') return undefined;
  if (shadow in SHADOW_PRESETS) return SHADOW_PRESETS[shadow];
  return shadow;
};

/** شعاع گوشه‌ها — اولویت با گوشه‌های جداگانه (مانند فتوشاپ)، وگرنه مقدار قدیمی واحد */
const resolveBorderRadius = (s: WidgetStyle): string | undefined => {
  const tl = s.borderRadiusTopLeft;
  const tr = s.borderRadiusTopRight;
  const br = s.borderRadiusBottomLeft;
  const bl = s.borderRadiusBottomRight;
  if (tl !== undefined || tr !== undefined || br !== undefined || bl !== undefined) {
    return [tl ?? 0, tr ?? 0, br ?? 0, bl ?? 0].map((v) => `${v}px`).join(' ');
  }
  return s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined;
};

/** رنگ پس‌زمینهٔ ساده با اعمال شفافیت (backgroundOpacity) — فقط برای رنگ ثابت */
const resolveBackgroundColor = (s: WidgetStyle): string | undefined => {
  if (!s.backgroundColor) return undefined;
  const opacity = s.backgroundOpacity;
  if (opacity === undefined || opacity >= 100) return s.backgroundColor;
  const hex = s.backgroundColor.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacity)) / 100})`;
  }
  return s.backgroundColor;
};

/** اعمال شفافیت روی هر مقدار CSS پس‌زمینه (رنگ ثابت یا گرادیان) — رنگ‌های hex و rgb/rgba داخل گرادیان
 * هم پشتیبانی می‌شوند. مقدار opacity آلفای موجود را ضرب می‌کند (نه جایگزین) — دقیقاً مثل رفتار CSS
 * opacity در پیش‌نمایش خودِ انتخابگر گرادیان — تا اختلاف عمدی آلفای هر نقطهٔ گرادیان (مثلاً یک سمت
 * کاملاً شفاف rgba(...,0) برای افکت محوشدگی) حفظ شود؛ فقط با اسلایدر شفافیت کمرنگ‌تر می‌شود، نه یکسان. */
export const applyBackgroundOpacity = (value?: string, opacity?: number): string | undefined => {
  if (!value) return undefined;
  if (opacity === undefined || opacity >= 100) return value;
  const factor = Math.max(0, Math.min(100, opacity)) / 100;
  const scaleAlpha = (existing: number) => Math.round(Math.max(0, Math.min(1, existing * factor)) * 1000) / 1000;
  const hexToRgba = (hex: string): string => {
    const h = hex.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(h)) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${scaleAlpha(1)})`;
    }
    return hex;
  };
  const replaceColors = (input: string): string =>
    input
      .replace(/#[0-9a-fA-F]{3,8}\b/g, hexToRgba)
      .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/gi, (_m, r, g, b, a) =>
        `rgba(${r}, ${g}, ${b}, ${scaleAlpha(a !== undefined ? parseFloat(a) : 1)})`
      );
  // گرادیان → همهٔ رنگ‌های hex یا rgb/rgba داخل را شفاف کن (بقیهٔ ساختار دست‌نخورده می‌ماند)
  if (/gradient\(/i.test(value)) {
    return replaceColors(value);
  }
  // رنگ ثابت (hex یا rgb/rgba)
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return hexToRgba(trimmed);
  if (/^rgba?\(/i.test(trimmed)) return replaceColors(trimmed);
  return value;
};

/** آیا URL ویدیو مستقیم است (فایل رسانه) یا جاساز (iframe)؟ */
const isDirectVideo = (url?: string): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test(url);
};

/** فرمت حجم فایل (بایت → KB/MB) */
const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** هوک عمومی دریافت داده از وب‌سرویس با حالت بارگذاری/خطا */
function useSmartData<T>(
  fetcher: () => Promise<T[]>,
  deps: React.DependencyList
) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'خطا در دریافت داده از وب‌سرویس');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, retryKey]);

  return { data, error, retry: () => setRetryKey((k) => k + 1) };
}

/** حالت خطا / داده خالی ویجت هوشمند — فقط در صورت خطا نمایش داده می‌شود */
const SmartEmpty: React.FC<{ error?: string | null; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="py-6 text-center space-y-2">
    <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-500">
      <AlertTriangle className="w-4 h-4" />
      <span>{error || 'داده‌ای برای نمایش یافت نشد'}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1.5 mx-auto cursor-pointer"
      >
        <RefreshCw className="w-3 h-3" />
        <span>تلاش مجدد</span>
      </button>
    )}
  </div>
);

/** اسکلت‌تون (Skeleton) ویجت‌های هوشمند — هنگام دریافت داده از وب‌سرویس نمایش داده می‌شود */
const SmartSkeleton: React.FC<{
  variant?: 'cards' | 'list' | 'table' | 'gallery' | 'rows';
  count?: number;
}> = ({ variant = 'list', count = 3 }) => {
  const shimmer = 'bg-slate-200/80 dark:bg-slate-800 animate-pulse';

  if (variant === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden"
          >
            <div className={`h-24 ${shimmer}`} />
            <div className="p-3 space-y-2">
              <div className={`h-2.5 rounded w-3/4 ${shimmer}`} />
              <div className={`h-2 rounded w-full ${shimmer}`} />
              <div className={`h-2 rounded w-5/6 ${shimmer}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'gallery') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`h-20 rounded-lg ${shimmer}`} />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 dark:border-slate-800 last:border-0"
          >
            <div className={`w-6 h-6 rounded-md shrink-0 ${shimmer}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-2.5 rounded w-2/5 ${shimmer}`} />
              <div className={`h-2 rounded w-1/3 ${shimmer}`} />
            </div>
            <div className={`w-14 h-2.5 rounded ${shimmer}`} />
          </div>
        ))}
      </div>
    );
  }

  // list / rows
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-2.5"
        >
          <div className={`w-7 h-7 rounded-lg shrink-0 ${shimmer}`} />
          <div className="flex-1 space-y-1.5">
            <div className={`h-2.5 rounded w-2/3 ${shimmer}`} />
            <div className={`h-2 rounded w-1/2 ${shimmer}`} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ==============================================================
// SMART WIDGETS — اتصال به وب‌سرویس‌های واقعی
// ==============================================================

/**
 * حالت ویرایش: هیچ نمایشی رندر نمی‌شود (بدون دریافت داده از وب‌سرویس).
 * داده‌های واقعی فقط در پیش‌نمایش زنده (isEditorPreview=false) دریافت و نمایش داده می‌شوند.
 */

/** ویجت خوراک اخبار — اتصال به وب‌سرویس اخبار + فیلتر دسته‌بندی */
const NewsFeedWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const categoryId =
    binding.categoryFilter && binding.categoryFilter !== 'all'
      ? Number(binding.categoryFilter) || null
      : null;

  const { data, error, retry } = useSmartData<NewsItem>(() =>
    fetchDataSourceNews({
      per_page: binding.limit || 4,
      category_id: categoryId,
      status: 'published'
    }).then((res) => res.data),
    [binding.limit, categoryId]
  );

  const newsList = data || [];
  const displayMode = binding.displayMode || 'grid';
  const cols = binding.columnsCount || 2;
  const gridClass =
    cols === 3
      ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
      : cols === 1
        ? 'grid grid-cols-1 gap-4'
        : 'grid grid-cols-1 md:grid-cols-2 gap-4';

  const fallbackImg =
    '/placeholder-news.svg';
  const newsImg = (n: NewsItem) => n.image_url || fallbackImg;

  // ── حالتهای تعاملی: بارگذاری بیشتر / اسکرول بینهایت / زبانه / آکاردئون ──
  const [page, setPage] = useState(1);
  const [extraItems, setExtraItems] = useState<NewsItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // با تغییر دسته/تعداد، صفحهبندی و حالتها بازنشانی شوند
  useEffect(() => {
    setPage(1);
    setExtraItems([]);
    setHasMore(true);
    setLoadingMore(false);
    setActiveTab('all');
    setOpenIndex(null);
    setSliderIndex(0);
  }, [binding.limit, categoryId]);

  // چرخش خودکار اسلایدشو تمام عرض
  useEffect(() => {
    if (displayMode !== 'full-width-slider' || newsList.length <= 1) return;
    const t = setInterval(() => setSliderIndex((i) => (i + 1) % newsList.length), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode, newsList.length]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchDataSourceNews({
        page: page + 1,
        per_page: binding.limit || 4,
        category_id: categoryId,
        status: 'published'
      });
      setExtraItems((prev) => [...prev, ...res.data]);
      setHasMore(page + 1 < res.last_page);
      setPage((p) => p + 1);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // اسکرول بینهایت — مشاهدهگر تلاقی برای بارگذاری خودکار صفحه بعد
  useEffect(() => {
    if (displayMode !== 'infinite-scroll') return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode, hasMore, loadingMore]);

  if (error) {
    return (
      <div style={containerStyle} className="space-y-4">
        <SmartEmpty error={error} onRetry={retry} />
      </div>
    );
  }
  if (!data) {
    return (
      <div style={containerStyle} className="space-y-4">
        <SmartSkeleton
          variant={
            [
              'list',
              'timeline',
              'numbered-list',
              'date-based',
              'accordion',
              'ticker',
              'multi-section',
              'date-badge',
              'combined',
              'featured-list'
            ].includes(displayMode)
              ? 'list'
              : displayMode === 'carousel' || displayMode === 'full-width-slider'
                ? 'table'
                : 'cards'
          }
          count={binding.limit || 4}
        />
      </div>
    );
  }
  if (newsList.length === 0) return null;

  const metaRow = (n: NewsItem, cls = 'text-[10px] text-slate-400') => (
    <div className={`flex items-center justify-between ${cls}`}>
      <span className="flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {formatFaDate(n.published_at || n.created_at)}
      </span>
      <span className="flex items-center gap-1">
        <Eye className="w-3 h-3" />
        {n.views_count}
      </span>
    </div>
  );

  const categoryBadge = (n: NewsItem, cls = 'bg-slate-900/80 text-white') => (
    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg backdrop-blur-md text-[10px] font-bold ${cls}`}>
      {n.category_name || 'بدون دسته'}
    </span>
  );

  // ── نمایش لیستی (List) ──
  if (displayMode === 'list') {
    const withThumb = !!binding.newsListImage;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2.5">
          {newsList.map((news) => (
            <div
              key={news.id}
              className={`group p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all ${
                withThumb ? 'flex items-center gap-3' : ''
              }`}
            >
              {withThumb && (
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-20 h-16 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                {!withThumb && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-0.5">
                    {news.summary}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── نمایش شبکه‌ای / کارتی (Grid) — پیش‌فرض ──
  if (displayMode === 'grid') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className={gridClass}>
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all flex flex-col"
            >
              <div className="h-36 overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(news)}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {news.summary}
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(news)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── کارت با عنوان روی تصویر (Grid Overlay) ──
  if (displayMode === 'grid-overlay') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className={gridClass}>
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group relative rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all h-52"
            >
              <img
                src={newsImg(news)}
                alt={news.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              {categoryBadge(news)}
              <div className="absolute bottom-0 inset-x-0 p-4 space-y-1.5">
                <h4 className="text-xs font-black text-white line-clamp-2 leading-snug drop-shadow">
                  {news.title}
                </h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatFaDate(news.published_at || news.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {news.views_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── نمایش برجسته / ویژه (Featured Hero) ──
  if (displayMode === 'featured') {
    const [hero, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        {hero && (
          <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-64 md:h-80">
            <img
              src={newsImg(hero)}
              alt={hero.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
            {categoryBadge(hero)}
            <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
              <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
                {hero.title}
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
                {hero.summary}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatFaDate(hero.published_at || hero.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {hero.views_count}
                </span>
              </div>
            </div>
          </div>
        )}
        {rest.length > 0 && (
          <div className={gridClass}>
            {rest.map((news) => (
              <div
                key={news.id}
                className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
              >
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-20 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {news.title}
                  </h4>
                  <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {formatFaDate(news.published_at || news.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── کاروسل خبرهای ویژه (Carousel) ──
  if (displayMode === 'carousel') {
    return <NewsCarousel newsList={newsList} formatDate={formatFaDate} />;
  }

  // ── خط زمانی اخبار (News Timeline) ──
  if (displayMode === 'timeline') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="relative pr-6">
          <span className="absolute top-1 bottom-1 right-2 w-px bg-gradient-to-b from-indigo-500/60 via-slate-300 dark:via-slate-700 to-transparent" />
          <div className="space-y-4">
            {newsList.map((news, i) => (
              <div key={news.id} className="relative">
                <span
                  className={`absolute -right-1.5 top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    i === 0 ? 'bg-indigo-500' : 'bg-teal-500'
                  }`}
                />
                <div className="group p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatFaDate(news.published_at || news.created_at)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                      {news.category_name || 'بدون دسته'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {news.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1">
                    {news.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── لیست شماره‌دار (Numbered News List) ──
  if (displayMode === 'numbered-list') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2.5">
          {newsList.map((news, i) => (
            <div
              key={news.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <span className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white text-xs font-black tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-0.5">
                  {news.summary}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── لیست افقی (Horizontal List) ──
  if (displayMode === 'horizontal-list') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group min-w-[240px] md:min-w-[260px] snap-start rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all shrink-0 flex flex-col"
            >
              <div className="h-32 overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(news)}
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(news)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── چیدمان موزاییکی (Masonry Style) ──
  if (displayMode === 'masonry') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="columns-2 md:columns-3 gap-4">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group break-inside-avoid mb-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <div className="overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(news)}
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {news.summary}
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(news)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── گروه‌بندی بر اساس تاریخ (Date-based News) ──
  if (displayMode === 'date-based') {
    const grouped = new Map<string, NewsItem[]>();
    newsList.forEach((n) => {
      const d = formatFaDate(n.published_at || n.created_at) || 'بدون تاریخ';
      if (!grouped.has(d)) grouped.set(d, []);
      grouped.get(d)!.push(n);
    });
    return (
      <div style={containerStyle} className="space-y-5">
        {[...grouped.entries()].map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {date}
              </span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-2.5">
              {items.map((news) => (
                <div
                  key={news.id}
                  className="group p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
                >
                  <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {news.title}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                      {news.category_name || 'بدون دسته'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {news.views_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── تیک خبر فوری (Breaking News / Ticker) ──
  if (displayMode === 'ticker') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="flex items-stretch rounded-xl overflow-hidden border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 shadow-xs">
          <span className="shrink-0 flex items-center gap-1.5 px-3.5 bg-rose-600 text-white text-[11px] font-black">
            <Megaphone className="w-3.5 h-3.5" />
            خبر فوری
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="ticker-track absolute inset-0 flex items-center whitespace-nowrap">
              {[...newsList, ...newsList].map((news, i) => (
                <span
                  key={`${news.id}-${i}`}
                  className="inline-flex items-center gap-2 px-5 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {news.title}
                </span>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          .ticker-track { animation: ticker-scroll 30s linear infinite; }
          .ticker-track:hover { animation-play-state: paused; }
          @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        `}</style>
      </div>
    );
  }

  // ── خبرهای زبانه‌دار (Tabbed News) ──
  if (displayMode === 'tabbed') {
    const cats = Array.from(new Set(newsList.map((n) => n.category_name || 'بدون دسته')));
    const tabs = cats.length > 1 ? ['all', ...cats] : cats;
    const active = activeTab === 'all' && !tabs.includes('all') ? tabs[0] : activeTab;
    const filtered =
      active === 'all' ? newsList : newsList.filter((n) => (n.category_name || 'بدون دسته') === active);
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                active === t
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t === 'all' ? 'همه' : t}
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          {filtered.map((news) => (
            <div
              key={news.id}
              className="group p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all flex items-center gap-3"
            >
              <img
                src={newsImg(news)}
                alt={news.title}
                loading="lazy"
                className="w-20 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── اخبار آکاردئونی (Accordion News) ──
  if (displayMode === 'accordion') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2">
          {newsList.map((news, i) => {
            const open = openIndex === i;
            return (
              <div
                key={news.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  open
                    ? 'border-indigo-500/50 bg-white dark:bg-slate-900 shadow-md'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-3.5 cursor-pointer"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-white text-[10px] font-black ${
                        open ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug">
                      {news.title}
                    </h4>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-3.5 pb-3.5">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {news.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                        {news.category_name || 'بدون دسته'}
                      </span>
                      {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── نمایش بیشتر (Load More) ──
  if (displayMode === 'load-more') {
    const all = [...newsList, ...extraItems];
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2.5">
          {all.map((news) => (
            <div
              key={news.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <img
                src={newsImg(news)}
                alt={news.title}
                loading="lazy"
                className="w-20 h-16 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                </div>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/40 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-indigo-500/5 transition-all cursor-pointer disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loadingMore ? 'در حال بارگذاری…' : 'نمایش بیشتر'}
          </button>
        )}
      </div>
    );
  }

  // ── اسکرول بی‌نهایت (Infinite Scroll) ──
  if (displayMode === 'infinite-scroll') {
    const all = [...newsList, ...extraItems];
    return (
      <div style={containerStyle} className="space-y-4">
        <div className={gridClass}>
          {all.map((news) => (
            <div
              key={news.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all flex flex-col"
            >
              <div className="h-36 overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(news)}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(news)}
                </div>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <div
            ref={sentinelRef}
            className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-400"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                در حال بارگذاری…
              </>
            ) : (
              'برای نمایش اخبار بیشتر اسکرول کنید'
            )}
          </div>
        )}
      </div>
    );
  }

  // ── چیدمان کنار هم (Sidebar / Mixed Layout) ──
  if (displayMode === 'mixed') {
    const [main, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {main && (
            <div className="lg:col-span-2 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-56 md:h-72">
              <img
                src={newsImg(main)}
                alt={main.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              {categoryBadge(main)}
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
                  {main.title}
                </h3>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
                  {main.summary}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatFaDate(main.published_at || main.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {main.views_count}
                  </span>
                </div>
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div className="space-y-2.5">
              {rest.map((news) => (
                <div
                  key={news.id}
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
                >
                  <img
                    src={newsImg(news)}
                    alt={news.title}
                    loading="lazy"
                    className="w-16 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {news.title}
                    </h4>
                    <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {formatFaDate(news.published_at || news.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── اخبار چندبخشی (Multi-Section News): دسته‌بندی بر اساس گروه خبری ──
  if (displayMode === 'multi-section') {
    const cats = Array.from(new Set(newsList.map((n) => n.category_name || 'بدون دسته')));
    let sections: { title: string; items: NewsItem[] }[];
    if (cats.length >= 2) {
      sections = cats
        .slice(0, 3)
        .map((c) => ({
          title: c,
          items: newsList.filter((n) => (n.category_name || 'بدون دسته') === c)
        }))
        .filter((s) => s.items.length > 0);
    } else {
      const half = Math.ceil(newsList.length / 2);
      sections = [
        { title: 'بخش اول', items: newsList.slice(0, half) },
        { title: 'بخش دوم', items: newsList.slice(half) }
      ].filter((s) => s.items.length > 0);
    }
    const secColors = ['bg-indigo-600', 'bg-teal-600', 'bg-rose-500'];
    return (
      <div style={containerStyle} className="space-y-4">
        <div
          className={`grid gap-4 md:grid-cols-2 ${sections.length === 3 ? 'lg:grid-cols-3' : ''}`}
        >
          {sections.map((sec, si) => (
            <div
              key={si}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              <div
                className={`flex items-center gap-2 px-4 py-2.5 text-white text-xs font-black ${secColors[si % secColors.length]}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                {sec.title}
              </div>
              <div className="p-3 space-y-2.5">
                {sec.items.map((news) => (
                  <div key={news.id} className="group flex items-center gap-2.5">
                    <img
                      src={newsImg(news)}
                      alt={news.title}
                      loading="lazy"
                      className="w-14 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {news.title}
                      </h4>
                      <p className="mt-0.5 text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatFaDate(news.published_at || news.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── اخبار ترکیبی (Combined News): خبر شاخص + نوار کارت‌های کوچک ──
  if (displayMode === 'combined') {
    const [main, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        {main && (
          <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-56 md:h-72">
            <img
              src={newsImg(main)}
              alt={main.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
            {categoryBadge(main)}
            <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
              <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
                {main.title}
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
                {main.summary}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatFaDate(main.published_at || main.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {main.views_count}
                </span>
              </div>
            </div>
          </div>
        )}
        {rest.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {rest.map((news) => (
              <div
                key={news.id}
                className="group rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all"
              >
                <div className="h-20 overflow-hidden relative">
                  <img
                    src={newsImg(news)}
                    alt={news.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-2.5">
                  <h4 className="text-[10px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {news.title}
                  </h4>
                  <p className="mt-1 text-[9px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {formatFaDate(news.published_at || news.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── اخبار با تاریخ برجسته (Prominent Date Badge) ──
  if (displayMode === 'date-badge') {
    const dayOf = (n: NewsItem) => {
      const d = new Date(n.published_at || n.created_at || '');
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('fa-IR', { day: 'numeric' });
    };
    const monthOf = (n: NewsItem) => {
      const d = new Date(n.published_at || n.created_at || '');
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('fa-IR', { month: 'short' });
    };
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2.5">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <div className="w-14 shrink-0 rounded-xl bg-gradient-to-b from-indigo-500/10 to-teal-500/10 border border-indigo-500/20 py-2 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                  {dayOf(news)}
                </span>
                <span className="mt-1 text-[9px] font-bold text-slate-400">{monthOf(news)}</span>
              </div>
              <img
                src={newsImg(news)}
                alt={news.title}
                loading="lazy"
                className="w-16 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-0.5">
                  {news.summary}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {news.views_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── نمایش مجله‌ای (Magazine Layout): شبکه‌ی نامتقارن مانند صفحه‌ی روزنامه ──
  if (displayMode === 'magazine') {
    const [lead, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
          {lead && (
            <div className="col-span-2 row-span-2 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-64 md:h-full">
              <img
                src={newsImg(lead)}
                alt={lead.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              {categoryBadge(lead)}
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
                  {lead.title}
                </h3>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
                  {lead.summary}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatFaDate(lead.published_at || lead.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {lead.views_count}
                  </span>
                </div>
              </div>
            </div>
          )}
          {rest.map((news) => (
            <div
              key={news.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <div className="h-24 overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatFaDate(news.published_at || news.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── اسلایدشو تمام عرض (Full-Width Slider): چرخش خودکار با فلش و نقطه ──
  if (displayMode === 'full-width-slider') {
    const total = newsList.length;
    const current = newsList[sliderIndex % total] || newsList[0];
    if (!current) return null;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden shadow-sm h-64 md:h-96">
          <img
            src={newsImg(current)}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
          {categoryBadge(current)}
          <div className="absolute bottom-0 inset-x-0 p-6 space-y-2.5">
            <h3 className="text-base md:text-2xl font-black text-white line-clamp-2 leading-snug drop-shadow">
              {current.title}
            </h3>
            <p className="text-[11px] md:text-xs text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
              {current.summary}
            </p>
            <div className="flex items-center gap-3 text-[10px] md:text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatFaDate(current.published_at || current.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {current.views_count}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSliderIndex((sliderIndex - 1 + total) % total)}
            className="absolute top-1/2 right-4 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer"
            title="قبلی"
          >
            <ChevronUp className="w-5 h-5 rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => setSliderIndex((sliderIndex + 1) % total)}
            className="absolute top-1/2 left-4 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer"
            title="بعدی"
          >
            <ChevronUp className="w-5 h-5 -rotate-90" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {newsList.map((n, i) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSliderIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === sliderIndex % total ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                title={n.title}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── خبر اصلی + اخبار فرعی (Featured + Sub News List) ──
  if (displayMode === 'featured-list') {
    const [main, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {main && (
            <div className="lg:col-span-3 group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all">
              <div className="h-44 md:h-56 overflow-hidden relative">
                <img
                  src={newsImg(main)}
                  alt={main.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(main)}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {main.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {main.summary}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(main)}
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    ادامه مطلب
                    <ArrowLeft className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div className="lg:col-span-2 space-y-2.5">
              {rest.map((news, i) => (
                <div
                  key={news.id}
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
                >
                  <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">
                    {i + 1}
                  </span>
                  <img
                    src={newsImg(news)}
                    alt={news.title}
                    loading="lazy"
                    className="w-14 h-11 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {news.title}
                    </h4>
                    <p className="mt-0.5 text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatFaDate(news.published_at || news.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

/** کاروسل اخبار — چرخش خودکار با فلش و نقطه‌های ناوبری */
const NewsCarousel: React.FC<{
  newsList: NewsItem[];
  formatDate: (d?: string) => string;
}> = ({ newsList, formatDate }) => {
  const [index, setIndex] = useState(0);
  const total = newsList.length;
  const current = newsList[index % total] || newsList[0];
  useEffect(() => {
    if (total === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);
  const fallbackImg =
    '/placeholder-news.svg';
  if (!current) return null;
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden shadow-sm h-56 md:h-72">
        <img
          src={current.image_url || fallbackImg}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-md">
          {current.category_name || 'بدون دسته'}
        </span>
        <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
          <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
            {current.title}
          </h3>
          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
            {current.summary}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(current.published_at || current.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {current.views_count}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
              {index + 1} / {total}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIndex((index - 1 + total) % total)}
          className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer"
          title="قبلی"
        >
          <ChevronUp className="w-4 h-4 rotate-90" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((index + 1) % total)}
          className="absolute top-1/2 left-3 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer"
          title="بعدی"
        >
          <ChevronUp className="w-4 h-4 -rotate-90" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {newsList.map((n, i) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              i === index % total ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
            }`}
            title={n.title}
          />
        ))}
      </div>
    </div>
  );
};

/** ویجت گالری تصاویر — اتصال به وب‌سرویس رسانه */
const ImageGalleryWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<MediaFile>(() =>
    fetchDataSourceMedia({
      per_page: 100,
      folder_id: binding.folderFilter && binding.folderFilter !== 'all' ? binding.folderFilter : null,
      type: 'image'
    }).then((res) => res.data.slice(0, binding.limit || 8)),
    [binding.limit, binding.folderFilter]
  );

  const gallery = data || [];

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="gallery" count={4} />
      ) : gallery.length === 0 ? null : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {gallery.map((img) => (
            <div
              key={img.id}
              className="group relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs"
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                <span className="text-[11px] font-bold truncate">{img.name}</span>
                <span className="text-[9px] text-amber-300">{formatFileSize(img.size)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// بلوک‌های صفحات اختصاصی — اتصال به یک DedicatedPage مشخص (binding.dedicatedPageId)
// ==============================================================

/** پیام «هنوز پیکربندی نشده» — وقتی هنوز صفحهٔ اختصاصی از پنل تنظیمات انتخاب نشده باشد */
const DedicatedPageNotConfigured: React.FC = () => (
  <div className="py-6 text-center space-y-2 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-800 bg-violet-500/5">
    <div className="flex items-center justify-center gap-2 text-xs font-bold text-violet-600 dark:text-violet-400">
      <Building2 className="w-4 h-4" />
      <span>این بلوک هنوز به صفحهٔ اختصاصی متصل نشده</span>
    </div>
    <p className="text-[11px] text-slate-500 dark:text-slate-400">از پنل تنظیمات (Smart Binding) یک صفحهٔ اختصاصی انتخاب کنید</p>
  </div>
);

const DP_TYPE_DATE_LABEL: Record<string, string> = {
  event: 'تاریخ برگزاری',
  journal_issue: 'تاریخ انتشار'
};

/** کلاس شبکهٔ ستونی بر اساس تعداد ستون انتخاب‌شده در تنظیمات — برای بلوک‌های dp-* حالت grid */
const DP_GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-2 lg:grid-cols-6'
};
const dpGridColsClass = (cols?: number, fallback = 2): string =>
  DP_GRID_COLS_CLASS[Math.min(Math.max(Number(cols) || fallback, 1), 6)] || DP_GRID_COLS_CLASS[fallback];

/** ویجت محتوای صفحهٔ اختصاصی — خبر/اطلاعیه/مقاله/رویداد/نسخهٔ نشریه (نوع از contentType تعیین می‌شود) */
const DedicatedPageContentWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  contentType: 'news' | 'announcement' | 'journal_issue' | 'article' | 'event';
  dedicatedPageId?: number | null;
}> = ({ binding, containerStyle, contentType, dedicatedPageId }) => {
  const sortDir: 'asc' | 'desc' = binding.sortBy === 'date_asc' ? 'asc' : 'desc';
  const [modalItem, setModalItem] = useState<DedicatedPageContentItem | null>(null);
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data, error, retry } = useSmartData<DedicatedPageContentItem>(
    () =>
      dedicatedPageId
        ? fetchDedicatedPageContentsForWidget(dedicatedPageId, contentType, binding.limit || 6, sortDir)
        : Promise.resolve([]),
    [dedicatedPageId, contentType, binding.limit, sortDir]
  );

  if (!dedicatedPageId) {
    return (
      <div style={containerStyle}>
        <DedicatedPageNotConfigured />
      </div>
    );
  }

  const items = data || [];
  const isGrid = (binding.displayMode || 'grid') === 'grid';
  const dateLabel = DP_TYPE_DATE_LABEL[contentType];

  const renderCard = (item: DedicatedPageContentItem) => (
    <button
      key={item.id}
      type="button"
      onClick={() => {
        setModalItem(item);
        setIsModalFullscreen(false);
      }}
      className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-violet-500/40 transition-all overflow-hidden shadow-xs flex flex-col text-right cursor-pointer w-full"
    >
      {item.image_url && (
        <div className="h-28 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="p-3.5 space-y-1.5 flex-1 flex flex-col">
        <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">{item.title}</span>
        {item.summary && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{item.summary}</p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-auto pt-1.5">
          {item.published_date && (
            <span className="flex items-center gap-1" title={dateLabel}>
              <Clock className="w-3 h-3" />
              {formatFaDate(item.published_date)}
            </span>
          )}
          <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-bold">
            مشاهدهٔ جزئیات
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );

  return (
    <>
      <div style={containerStyle} className="space-y-4">
        {error ? (
          <SmartEmpty error={error} onRetry={retry} />
        ) : !data ? (
          <SmartSkeleton variant={isGrid ? 'cards' : 'list'} count={binding.limit || 6} />
        ) : items.length === 0 ? null : isGrid ? (
          <div className={`grid ${dpGridColsClass(binding.columnsCount, 2)} gap-3`}>{items.map(renderCard)}</div>
        ) : (
          <div className="space-y-2.5">{items.map(renderCard)}</div>
        )}
      </div>

      {/* Modal جزئیات — چون آیتم‌های صفحات اختصاصی مسیر اختصاصی در سایت عمومی ندارند */}
      {modalItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setModalItem(null)}
        >
          <div
            className={`bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto relative transition-all ${
              isModalFullscreen
                ? 'w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-w-none rounded-2xl'
                : 'max-w-4xl w-full max-h-[85vh] rounded-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {modalItem.image_url && (
              <div className={`bg-slate-100 dark:bg-slate-800 overflow-hidden ${isModalFullscreen ? 'h-[40vh]' : 'h-64'}`}>
                <img src={modalItem.image_url} alt={modalItem.title} className="w-full h-full object-contain" />
              </div>
            )}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{modalItem.title}</h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalFullscreen((v) => !v)}
                  title={isModalFullscreen ? 'خروج از حالت تمام‌صفحه' : 'نمایش تمام‌صفحه'}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-violet-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {isModalFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {modalItem.published_date && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatFaDate(modalItem.published_date)}</span>
                </div>
              )}

              {/* جزئیات اختصاصی رویداد — مدرس، زمان، مکان، ثبت‌نام و وضعیت */}
              {contentType === 'event' && modalItem.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                  {modalItem.metadata.instructor && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span>{modalItem.metadata.instructor}</span>
                    </div>
                  )}
                  {modalItem.metadata.event_time && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CalendarDays className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span>{modalItem.metadata.event_time}</span>
                    </div>
                  )}
                  {modalItem.metadata.location && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span>{modalItem.metadata.location}</span>
                    </div>
                  )}
                  {modalItem.metadata.event_status && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          modalItem.metadata.event_status === 'active'
                            ? 'bg-emerald-500'
                            : modalItem.metadata.event_status === 'held'
                              ? 'bg-slate-400'
                              : 'bg-rose-400'
                        }`}
                      />
                      <span>
                        {modalItem.metadata.event_status === 'active'
                          ? 'فعال'
                          : modalItem.metadata.event_status === 'held'
                            ? 'برگزار شده'
                            : 'غیرفعال'}
                      </span>
                    </div>
                  )}
                  {modalItem.metadata.registration_link && (
                    <a
                      href={modalItem.metadata.registration_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 font-bold sm:col-span-2"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span>لینک ثبت‌نام</span>
                    </a>
                  )}
                </div>
              )}

              {modalItem.content ? (
                <div
                  className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: modalItem.content }}
                />
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {modalItem.summary || 'بدون توضیحات'}
                </p>
              )}

              {/* گزارش تصویری */}
              {modalItem.gallery_images && modalItem.gallery_images.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Images className="w-3.5 h-3.5" />
                    <span>گزارش تصویری</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {modalItem.gallery_images.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <img src={url} alt={`${modalItem.title} ${idx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalItem.file_url && (
                <a
                  href={modalItem.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-violet-500/40 transition-all"
                >
                  <div className="w-9 h-9 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">دانلود فایل پیوست</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox — نمایش تمام‌صفحهٔ تصاویر گزارش تصویری */}
      {modalItem && lightboxIndex !== null && modalItem.gallery_images && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm select-none"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 text-white hover:bg-rose-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="absolute top-4 right-4 text-xs font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
            {lightboxIndex + 1} از {modalItem.gallery_images.length}
          </span>

          {modalItem.gallery_images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i! - 1 + modalItem.gallery_images!.length) % modalItem.gallery_images!.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          <img
            src={modalItem.gallery_images[lightboxIndex]}
            alt={`${modalItem.title} ${lightboxIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {modalItem.gallery_images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i! + 1) % modalItem.gallery_images!.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      )}
    </>
  );
};

/** ویجت گالری تصاویر صفحهٔ اختصاصی — تصاویر آیتم‌های نوع gallery، با فیلتر دسته‌بندی اختیاری */
const DedicatedPageGalleryWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
}> = ({ binding, containerStyle, dedicatedPageId }) => {
  const sortDir: 'asc' | 'desc' = binding.sortBy === 'date_asc' ? 'asc' : 'desc';

  const { data, error, retry } = useSmartData<DedicatedPageContentItem>(
    () =>
      dedicatedPageId
        ? fetchDedicatedPageContentsForWidget(dedicatedPageId, 'gallery', binding.limit || 12, sortDir)
        : Promise.resolve([]),
    [dedicatedPageId, binding.limit, sortDir]
  );

  if (!dedicatedPageId) {
    return (
      <div style={containerStyle}>
        <DedicatedPageNotConfigured />
      </div>
    );
  }

  const filtered =
    binding.categoryFilter && binding.categoryFilter !== 'all'
      ? (data || []).filter((item) => item.category_slug === binding.categoryFilter)
      : data || [];

  const images = filtered.flatMap((item) =>
    (item.gallery_images && item.gallery_images.length > 0 ? item.gallery_images : item.image_url ? [item.image_url] : []).map(
      (url) => ({ url, title: item.title })
    )
  );

  const isGridMode = (binding.displayMode || 'grid') === 'grid';

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="gallery" count={4} />
      ) : images.length === 0 ? null : isGridMode ? (
        <div className={`grid ${dpGridColsClass(binding.columnsCount, 4)} gap-3`}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                <span className="text-[11px] font-bold truncate">{img.title}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                <img src={img.url} alt={img.title} className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{img.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** ویجت اعضای شورای مرکزی و کادر اجرایی صفحهٔ اختصاصی */
const DedicatedPageMembersWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
}> = ({ binding, containerStyle, dedicatedPageId }) => {
  const { data, error, retry } = useSmartData<DedicatedPageMemberItem>(
    () => (dedicatedPageId ? fetchDedicatedPageMembersForWidget(dedicatedPageId) : Promise.resolve([])),
    [dedicatedPageId]
  );

  if (!dedicatedPageId) {
    return (
      <div style={containerStyle}>
        <DedicatedPageNotConfigured />
      </div>
    );
  }

  const ordered = binding.sortBy === 'date_asc' ? [...(data || [])].reverse() : data || [];
  const members = ordered.slice(0, binding.limit || 12);

  // موقعیت تصویر خودش هم جهت (بالا/راست/چپ) و هم چیدمان (کارتی چندستونه یا ردیفی تک‌ستونه) را تعیین می‌کند
  const position = binding.avatarPosition || 'top';
  const isMultiColumn = position === 'top' || position === 'card-right' || position === 'card-left';
  const reverseAvatar = position === 'left' || position === 'card-left';

  const avatarSrc = (m: DedicatedPageMemberItem) => m.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name);

  const renderRowCard = (m: DedicatedPageMemberItem) => (
    <div
      key={m.id}
      className={`p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs ${
        reverseAvatar ? 'flex-row-reverse' : ''
      }`}
    >
      <img src={avatarSrc(m)} alt={m.name} className="w-12 h-12 rounded-full object-cover border border-violet-500/30 bg-slate-100 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-black text-slate-900 dark:text-white truncate">{m.name}</div>
        {(m.role_title || m.field_of_study) && (
          <div className="text-[11px] text-violet-600 dark:text-violet-400 font-bold truncate">
            {m.role_title}
            {m.role_title && m.field_of_study ? ' · ' : ''}
            {m.field_of_study}
          </div>
        )}
        {m.email && <div className="text-[10px] text-slate-400 truncate">{m.email}</div>}
      </div>
    </div>
  );

  const renderStackedCard = (m: DedicatedPageMemberItem) => (
    <div
      key={m.id}
      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex flex-col items-center text-center gap-1.5 shadow-xs"
    >
      <img src={avatarSrc(m)} alt={m.name} className="w-16 h-16 rounded-full object-cover border border-violet-500/30 bg-slate-100" />
      <div className="text-xs font-black text-slate-900 dark:text-white truncate w-full">{m.name}</div>
      {(m.role_title || m.field_of_study) && (
        <div className="text-[11px] text-violet-600 dark:text-violet-400 font-bold truncate w-full">
          {m.role_title}
          {m.role_title && m.field_of_study ? ' · ' : ''}
          {m.field_of_study}
        </div>
      )}
      {m.email && <div className="text-[10px] text-slate-400 truncate w-full" dir="ltr">{m.email}</div>}
    </div>
  );

  const renderCard = position === 'top' ? renderStackedCard : renderRowCard;

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant={isMultiColumn ? 'cards' : 'list'} count={binding.limit || 6} />
      ) : members.length === 0 ? null : isMultiColumn ? (
        <div className={`grid ${dpGridColsClass(binding.columnsCount, 3)} gap-3`}>{members.map(renderCard)}</div>
      ) : (
        <div className="space-y-3">{members.map(renderCard)}</div>
      )}
    </div>
  );
};

/** ویجت مخزن اسناد و فایل‌ها — اتصال به وب‌سرویس رسانه */
const FileManagerWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<MediaFile>(() =>
    fetchDataSourceMedia({
      // Fetch a large page and let the server apply the type/folder filters —
      // otherwise a small per_page would cut the list BEFORE filtering and only
      // a few matching files would remain.
      per_page: 100,
      folder_id: binding.folderFilter && binding.folderFilter !== 'all' ? binding.folderFilter : null,
      type: binding.fileType || 'document'
    }).then((res) => res.data.slice(0, binding.limit || 6)),
    [binding.limit, binding.folderFilter, binding.fileType]
  );

  const files = data || [];
  const displayMode = binding.displayMode || 'list';

  const getExt = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase().slice(0, 4) : 'FILE';
  };

  const fileName = (file: MediaFile) => file.title || file.name;
  const isImageFile = (file: MediaFile) => (file.type || '').startsWith('image/');

  // ── تعداد کارت در هر ردیف (حالت شبکه‌ای / کادر فایلی) ──
  const cols = Math.min(Math.max(Number(binding.columnsCount) || 3, 1), 6);
  const gridCols =
    {
      1: 'sm:grid-cols-1 lg:grid-cols-1',
      2: 'sm:grid-cols-2 lg:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
      5: 'sm:grid-cols-2 lg:grid-cols-5',
      6: 'sm:grid-cols-2 lg:grid-cols-6'
    }[cols] || 'sm:grid-cols-2 lg:grid-cols-3';

  const fileBadge = (file: MediaFile, cls: string) =>
    isImageFile(file) ? (
      <img
        src={file.url}
        alt={file.name}
        loading="lazy"
        className={`rounded-lg object-cover shrink-0 ${cls}`}
      />
    ) : (
      <div className={`rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black uppercase shrink-0 ${cls}`}>
        {getExt(file.name)}
      </div>
    );

  if (error) {
    return (
      <div style={containerStyle}>
        <SmartEmpty error={error} onRetry={retry} />
      </div>
    );
  }
  if (!data) {
    return (
      <div style={containerStyle}>
        <SmartSkeleton
          variant={displayMode === 'table' ? 'table' : displayMode === 'grid' || displayMode === 'boxes' ? 'cards' : 'list'}
          count={binding.limit || 6}
        />
      </div>
    );
  }
  if (files.length === 0) return null;

  // ── حالت جدول (Table) ──
  if (displayMode === 'table') {
    return (
      <div style={containerStyle}>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                <th className="px-3 py-2.5 font-bold">نام سند</th>
                <th className="px-3 py-2.5 font-bold hidden sm:table-cell">توضیح</th>
                <th className="px-3 py-2.5 font-bold">حجم</th>
                <th className="px-3 py-2.5 font-bold text-center w-14">دانلود</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-teal-500/5 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      {fileBadge(file, 'p-1.5 text-[10px] w-8 h-8 flex items-center justify-center')}
                      <span className="truncate" title={file.name}>{fileName(file)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell max-w-[260px]">
                    {file.description ? (
                      <span className="line-clamp-2">{file.description}</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                      title="دانلود فایل"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── حالت شبکه کارتی (Grid) ──
  if (displayMode === 'grid') {
    return (
      <div style={containerStyle}>
        <div className={`grid grid-cols-1 ${gridCols} gap-3`}>
          {files.map((file) => (
            <div
              key={file.id}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-blue-500/30 hover:shadow-md transition-all flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {fileBadge(file, 'p-2.5 text-xs w-10 h-10 flex items-center justify-center')}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                    {fileName(file)}
                  </div>
                  <div className="text-[10px] text-slate-400">حجم: {formatFileSize(file.size)}</div>
                </div>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shrink-0"
                  title="دانلود فایل"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
              {file.description && (
                <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400 line-clamp-2 border-t border-gray-100 dark:border-slate-800 pt-2">
                  {file.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── حالت کادر کوچک فایلی (File Box) ──
  if (displayMode === 'boxes') {
    return (
      <div style={containerStyle}>
        <div className={`grid grid-cols-2 ${gridCols} gap-2.5`}>
          {files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-blue-500/40 hover:shadow-md transition-all flex items-center gap-2 min-w-0"
              title={file.name}
            >
              {isImageFile(file) ? (
                <img
                  src={file.url}
                  alt={file.name}
                  loading="lazy"
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black uppercase flex items-center justify-center text-[9px] shrink-0">
                  {getExt(file.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {fileName(file)}
                </div>
                <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <FileText className="w-2.5 h-2.5" />
                  <span className="truncate">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // ── حالت لیست (List) — پیش‌فرض ──
  return (
    <div style={containerStyle} className="space-y-4">
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {fileBadge(file, 'p-2 text-xs w-9 h-9 flex items-center justify-center')}
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                  {fileName(file)}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>حجم: {formatFileSize(file.size)}</span>
                </div>
                {file.description && (
                  <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {file.description}
                  </p>
                )}
              </div>
            </div>

            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shrink-0"
              title="دانلود فایل"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * ویجت «جاسازی فرم» — فرم منتخب از فرم‌ساز را به‌صورت واقعی (نه iframe) با همان
 * کامپوننت پاسخ‌دهی خودِ فرم‌ساز (FormRespondentView) رندر می‌کند.
 */
const FormEmbedWidget: React.FC<{
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ binding, containerStyle }) => {
  const [form, setForm] = useState<FormDefinition | null | undefined>(undefined);

  useEffect(() => {
    if (!binding.formId) {
      setForm(null);
      return;
    }
    let cancelled = false;
    setForm(undefined);
    fetchForm(binding.formId)
      .then((f) => {
        if (!cancelled) setForm(f);
      })
      .catch(() => {
        if (!cancelled) setForm(null);
      });
    return () => {
      cancelled = true;
    };
  }, [binding.formId]);

  if (!binding.formId) {
    return (
      <div style={containerStyle} className="p-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
        هنوز فرمی برای این بلوک انتخاب نشده — از پنل تنظیمات یک فرم منتشرشده انتخاب کنید.
      </div>
    );
  }
  if (form === undefined) {
    return (
      <div style={containerStyle} className="p-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
        در حال دریافت فرم...
      </div>
    );
  }
  if (form === null) {
    return (
      <div style={containerStyle} className="p-6 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 text-center">
        این فرم یافت نشد.
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <FormRespondentView form={form} isEmbedPreview />
    </div>
  );
};

// ==============================================================
// NEW STATIC BLOCKS — بلوک‌های جدید سازنده صفحه
// ==============================================================

/** آیکون‌های قابل انتخاب برای کارت اطلاعاتی / متن‌های دارای آیکون */
const iconMap: Record<string, React.ReactNode> = {
  map: <MapPin className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
  share: <Share2 className="w-5 h-5" />,
  chat: <MessageCircle className="w-5 h-5" />,
  link: <Link2 className="w-5 h-5" />,
  type: <Type className="w-5 h-5" />,
  columns: <Columns className="w-5 h-5" />,
  rows: <Rows className="w-5 h-5" />,
  images: <Images className="w-5 h-5" />,
  gauge: <Gauge className="w-5 h-5" />,
  compass: <Compass className="w-5 h-5" />,
  code: <Code2 className="w-5 h-5" />,
  quote: <Quote className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  send: <Send className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  hash: <Hash className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  check: <CheckCircle2 className="w-5 h-5" />,
  arrow: <ArrowLeft className="w-5 h-5" />,
  user: <User className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  dollar: <BadgeDollarSign className="w-5 h-5" />,
  external: <ExternalLink className="w-5 h-5" />,
  students: <UsersRound className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
  unlock: <LockOpen className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  grad: <GraduationCap className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  stat: <ChartNoAxesColumn className="w-5 h-5" />,
  monitor: <Monitor className="w-5 h-5" />,
  'file-check': <FileCheck className="w-5 h-5" />,
  'bookmark-check': <BookmarkCheck className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
  box: <Box className="w-5 h-5" />,
  'shield-check': <ShieldCheck className="w-5 h-5" />,
  'user-check': <UserCheck className="w-5 h-5" />,
  'file-text': <FileText className="w-5 h-5" />,
  'circle-question-mark': <CircleHelp className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  x: <X className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  telegram: <Send className="w-5 h-5" />,
  aparat: <AparatIcon className="w-5 h-5" />,
  bale: <BaleIcon className="w-5 h-5" />,
  eitaa: <EitaaIcon className="w-5 h-5" />,
  cafebazaar: <CafeBazaarIcon className="w-5 h-5" />,
  enamad: <EnamadIcon className="w-5 h-5" />,
  gap: <GapIcon className="w-5 h-5" />,
  sapp: <SappIcon className="w-5 h-5" />,
  shetab: <ShetabIcon className="w-5 h-5" />,
  adobeacrobatreader: <AdobeAcrobatReaderIcon className="w-5 h-5" />,
  adobeaftereffects: <AdobeAfterEffectsIcon className="w-5 h-5" />,
  adobeaudition: <AdobeAuditionIcon className="w-5 h-5" />,
  adobe: <AdobeIcon className="w-5 h-5" />,
};

/** استخراج گزینه‌ها از محتوای متنی (هر خط: برچسب|مقدار|...) */
const parseLines = (content: string, separators = '|،,;'): string[][] =>
  (content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(new RegExp(`[${separators}]`)).map((p) => p.trim()));

// ────────────────────────────────────────────────
// رندر آیکون‌ها (توکن [icon:name]) و متغیرهای صفحهٔ اختصاصی (توکن {{key}}) درج‌شده در متن
// ────────────────────────────────────────────────
const ICON_TOKEN_RE = /\[icon:([a-zA-Z-]+)\]/g;
const VARIABLE_TOKEN_RE = /\{\{(\w+)\}\}/g;

/** اندازه آیکون داخل متن */
const inlineIconClass = 'inline-block w-4 h-4 align-middle mx-1 shrink-0';

/** جایگزینی توکن‌های {{key}} با مقدار واقعی — اگر variables داده نشده باشد، متن دست‌نخورده می‌ماند */
const resolveVariableTokens = (text: string, variables?: Record<string, string>): string => {
  const content = text || '';
  if (!variables) return content;
  return content.replace(VARIABLE_TOKEN_RE, (match, key) => (key in variables ? variables[key] : match));
};

/** جایگزینی توکن‌های [icon:name] در متن ساده با کامپوننت آیکون (پس از حل متغیرها) */
const renderTextWithIcons = (content: string, variables?: Record<string, string>): ReactNode => {
  const parts = resolveVariableTokens(content, variables).split(ICON_TOKEN_RE);
  // split با گروه ضبط‌شده: [متن, نام, متن, نام, ...]
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const el = iconMap[part];
      if (!el) return `[icon:${part}]`;
      return cloneElement(el as ReactElement<any, any>, { className: inlineIconClass, key: `ic-${i}` });
    }
    return part;
  });
};

/** جایگزینی توکن‌های [icon:name] در HTML (ریش‌تکست) با SVG درون‌خطی (پس از حل متغیرها) */
const renderHtmlWithIcons = (html: string, variables?: Record<string, string>): string => {
  return resolveVariableTokens(html, variables).replace(ICON_TOKEN_RE, (match, name: string) => {
    const el = iconMap[name];
    if (!el) return match;
    try {
      return renderToStaticMarkup(cloneElement(el as ReactElement<any, any>, { className: inlineIconClass }));
    } catch {
      return match;
    }
  });
};

/** بلوک متن غنی WYSIWYG (محتوای HTML) */
const RichTextBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties; variables?: Record<string, string> }> = ({ widget, containerStyle, variables }) => (
  <div
    style={containerStyle}
    className="transition-all richtext-content"
    dangerouslySetInnerHTML={{
      __html:
        renderHtmlWithIcons(
          widget.content ||
            '<p>متن غنی خود را اینجا بنویسید — از HTML برای تیتر، پاراگراف، لینک و آیکون استفاده کنید.</p>',
          variables
        )
    }}
  />
);

/** کارت اطلاعاتی — آیکون + عنوان + متن با چیدمان‌ها و تنظیمات رنگی/سایزی */
const IconBoxBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const icon = iconMap[props.iconName || widget.iconName || 'sparkles'] || <Sparkles className="w-5 h-5" />;
  // چیدمان: stack (پیش‌فرض) | row (آیکون کنار عنوان، RTL) | row-reverse (LTR) | center (وسط‌چین)
  const layout = props.layout || 'stack';
  const isRow = layout === 'row' || layout === 'row-reverse';
  const iconSize = props.iconSize ?? 24;
  const titleSize = props.titleSize ?? 16;
  const descSize = props.descSize ?? 12;
  const rowIcon = cloneElement(icon as ReactElement<any, any>, {
    style: {
      width: iconSize,
      height: iconSize,
      color: props.iconColor || undefined
    },
    className: 'shrink-0'
  });
  const stackIcon = cloneElement(icon as ReactElement<any, any>, {
    style: {
      width: iconSize,
      height: iconSize,
      color: props.iconColor || undefined
    }
  });
  const iconWrap = (iconNode: ReactNode) => {
    const borderWidth = (props.iconBorderWidth ?? 1) > 0 ? (props.iconBorderWidth ?? 1) : 0;
    return (
      <div
        className="rounded-2xl flex items-center justify-center shrink-0"
        style={{
          width: iconSize + 24,
          height: iconSize + 24,
          backgroundColor: props.iconBgColor === 'transparent' ? undefined : props.iconBgColor || 'rgba(20,184,166,0.1)',
          color: props.iconColor || undefined,
          borderWidth,
          borderStyle: borderWidth > 0 ? 'solid' : undefined,
          borderColor: props.iconBorderColor === 'transparent' ? 'transparent' : props.iconBorderColor || 'rgba(20,184,166,0.2)'
        }}
      >
        {iconNode}
      </div>
    );
  };
  const titleEl = (
    <h3
      className="font-black"
      style={{
        color: props.titleColor || undefined,
        fontSize: titleSize,
        fontFamily: props.titleFont || undefined
      }}
    >
      {widget.title || 'عنوان کارت اطلاعاتی'}
    </h3>
  );
  const descEl = (
    <p
      className="leading-relaxed"
      style={{
        color: props.descColor || undefined,
        fontSize: descSize,
        fontFamily: props.descFont || undefined
      }}
    >
      {widget.content || 'توضیحات کوتاه این باکس در این بخش نمایش داده می‌شود.'}
    </p>
  );
  const buttonEl = props.buttonUrl && (
    <a
      href={props.buttonUrl}
      target={props.buttonTarget === 'new' ? '_blank' : undefined}
      rel={props.buttonTarget === 'new' ? 'noopener noreferrer' : undefined}
      className="mt-1 inline-flex items-center gap-1 font-black hover:gap-2 transition-all cursor-pointer"
      style={{ color: props.iconColor || undefined, fontSize: descSize }}
    >
      {props.buttonText || 'بیشتر بدانید'} <ArrowLeft className="w-3.5 h-3.5" />
    </a>
  );
  const textBlock = (
    <div className={`flex flex-col gap-1 ${isRow ? 'min-w-0' : ''}`} style={{ textAlign: layout === 'center' ? 'center' : undefined }}>
      {titleEl}
      {descEl}
      {buttonEl}
    </div>
  );
  // موقعیت کل کارت در ستون (راست/وسط/چپ/تمام‌عرض) — در RTL راست = شروع
  // maxWidth: وقتی متن بلندتر از ستون باشد fit-content کل عرض ستون را می‌گیرد و تراز دیده نمی‌شود؛
  // با این سقف کارت به پهنای ~عرض خواهر خودش می‌ماند و به سمت انتخابی می‌چسبد
  // فاصلهٔ خارجی دستی کاربر (margin-left/right) بر تراز cardAlign مقدم است — cardAlign فقط
  // سمتِ auto را پیشنهاد می‌کند؛ اگر کاربر همان سمت را دستی ست کرده باشد مقدارش حفظ می‌شود
  // (قبلاً marginInline: '0 auto' مقدار margin-left کاربر را نادیده می‌گرفت و در خروجی auto می‌ماند)
  const cardAlign = props.cardAlign || 'full';
  const wStyle = widget.settings.style || {};
  const mLeft = wStyle.marginLeft !== undefined ? `${wStyle.marginLeft}px` : undefined;
  const mRight = wStyle.marginRight !== undefined ? `${wStyle.marginRight}px` : undefined;
  const cardPosStyle: React.CSSProperties =
    cardAlign === 'center'
      ? { width: 'fit-content', maxWidth: 'calc(100% - 3.5rem)', minWidth: 'min-content', marginLeft: mLeft ?? 'auto', marginRight: mRight ?? 'auto' }
      : cardAlign === 'left'
        ? { width: 'fit-content', maxWidth: 'calc(100% - 3.5rem)', minWidth: 'min-content', marginRight: mRight ?? 'auto', marginLeft: mLeft ?? 0 }
        : cardAlign === 'right'
          ? { width: 'fit-content', maxWidth: 'calc(100% - 3.5rem)', minWidth: 'min-content', marginRight: mRight ?? 0, marginLeft: mLeft ?? 'auto' }
          : {};
  return (
    <div
      style={{ ...containerStyle, ...cardPosStyle }}
      className="p-6 rounded-2xl transition-all"
    >
      {layout === 'stack' && (
        <div className="flex flex-col items-start gap-3 text-right">
          {iconWrap(stackIcon)}
          {textBlock}
        </div>
      )}
      {layout === 'center' && (
        <div className="flex flex-col items-center gap-3 text-center">
          {iconWrap(stackIcon)}
          {textBlock}
        </div>
      )}
      {isRow && (
        <div className={`flex gap-4 text-right ${layout === 'row-reverse' ? 'flex-row-reverse' : 'flex-row'} items-start`}>
          {iconWrap(rowIcon)}
          {textBlock}
        </div>
      )}
    </div>
  );
};

/** دربرگیرنده (Container) — عمودی یا افقی؛ شامل زیربلوک‌ها */
const ContainerBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  vertical: boolean;
  depth: number;
  isEditorPreview: boolean;
  variables?: Record<string, string>;
}> = ({ widget, containerStyle, vertical, depth, isEditorPreview, variables }) => {
  const children: WidgetInstance[] = (widget.settings.customProps?.children as WidgetInstance[]) || [];
  const gap = (widget.settings.customProps?.gap as number) ?? 16;

  return (
    <div
      style={{
        ...containerStyle,
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        gap: `${gap}px`,
        flexWrap: vertical ? undefined : 'wrap',
      }}
      className={`rounded-2xl p-4 transition-all ${
        vertical
          ? 'flex-col'
          : 'flex-row items-stretch'
      }`}
    >
      {children.length === 0 ? (
        <div className="flex-1 min-h-[80px] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
          <Layers className="w-4 h-4 ml-1.5" />
          دربرگیرنده خالی — از پنل تنظیمات زیربلوک‌ها را مدیریت کنید
        </div>
      ) : (
        children.map((child) => (
          <div key={child.id} style={vertical ? undefined : { flex: 1, minWidth: 180 }} className={vertical ? undefined : 'flex'}>
            <WidgetRenderer
              widget={child}
              currentUserRole="all"
              isEditorPreview={isEditorPreview}
              depth={depth + 1}
              variables={variables}
            />
          </div>
        ))
      )}
    </div>
  );
};

/** اسلایدر تصویر — چرخش خودکار تصاویر */
/** اسلایدر تصویر — منبع رسانه (با عنوان) یا آدرس دستی؛ حالت اسلایدشو یا فهرست بندانگشتی + لایت‌باکس */
const ImageSliderBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  isEditorPreview?: boolean;
}> = ({ widget, containerStyle, isEditorPreview = false }) => {
  const props = widget.settings.customProps || {};
  const sliderMode = props.sliderMode === 'thumbs' ? 'thumbs' : 'slideshow';
  const source = props.sliderSource || 'media';
  const limit = Number(props.sliderLimit) || 10;
  const manualImages: string[] =
    (props.images as string[]) ||
    parseLines(widget.content || '').map((p) => p[0]).filter(Boolean) ||
    [];
  const folderFilter =
    props.mediaFolder && props.mediaFolder !== 'all' ? String(props.mediaFolder) : null;

  const { data, error, retry } = useSmartData<MediaFile>(
    () =>
      source === 'media'
        ? fetchDataSourceMedia({
            per_page: 100,
            folder_id: folderFilter,
            type: 'image'
          }).then((res) => res.data.slice(0, limit))
        : Promise.resolve([]),
    [source, folderFilter, limit]
  );

  // هر اسلاید: { url, title }
  const slides: { url: string; title: string }[] =
    source === 'media'
      ? (data || []).map((f) => ({ url: f.url, title: f.title || f.name }))
      : manualImages.map((u, i) => ({ url: u, title: `اسلاید ${i + 1}` }));

  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    if (isEditorPreview || sliderMode !== 'slideshow' || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 3500);
    return () => clearInterval(t);
  }, [slides.length, sliderMode, isEditorPreview]);

  // بستن لایت‌باکس با کلید Escape
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLightbox(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const loading = source === 'media' && !data && !error;

  if (loading) {
    return (
      <div style={containerStyle} className="space-y-4">
        <SmartSkeleton variant={sliderMode === 'thumbs' ? 'gallery' : 'table'} count={4} />
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div style={containerStyle} className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 aspect-video text-slate-400 text-xs">
        <Images className="w-5 h-5" />
        تصاویری برای اسلایدر تنظیم نشده است
      </div>
    );
  }

  // ── حالت فهرست بندانگشتی + لایت‌باکس ──
  if (sliderMode === 'thumbs') {
    return (
      <div style={containerStyle}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {slides.map((s, i) => (
            <button
              key={`${s.url}-${i}`}
              type="button"
              onClick={() => {
                if (isEditorPreview) return; // در پیش‌نمایش ویرایشگر غیرفعال است
                setLightbox(i);
              }}
              className={`group relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800 shadow-xs transition-all focus:outline-none ${isEditorPreview ? 'cursor-default' : 'hover:border-teal-500/50 hover:shadow-md cursor-pointer'}`}
              title={s.title}
            >
              <img
                src={s.url}
                alt={s.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/30 transition-colors" />
              {s.title && (
                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-slate-950/80 to-transparent">
                  <div className="text-[10px] font-bold text-white text-right truncate">{s.title}</div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* لایت‌باکس */}
        {lightbox !== null && slides[lightbox] && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
            <div
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={slides[lightbox].url}
                alt={slides[lightbox].title}
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
              {slides[lightbox].title && (
                <div className="mt-3 text-center text-white text-sm font-black">
                  {slides[lightbox].title}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setLightbox((lightbox - 1 + slides.length) % slides.length)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="قبلی"
                >
                  <ChevronUp className="w-5 h-5 rotate-90" />
                </button>
                <span className="text-white/80 text-xs font-bold tabular-nums">
                  {lightbox + 1} / {slides.length}
                </span>
                <button
                  type="button"
                  onClick={() => setLightbox((lightbox + 1) % slides.length)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="بعدی"
                >
                  <ChevronUp className="w-5 h-5 -rotate-90" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── حالت اسلایدشو ──
  return (
    <div style={containerStyle} className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 group">
      <img src={slides[index].url} alt={slides[index].title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
      {slides[index].title && (
        <div className="absolute bottom-3 right-4 text-white text-sm font-black drop-shadow">
          {slides[index].title}
        </div>
      )}
      <div className="absolute bottom-3 left-3 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (isEditorPreview) return; // در پیش‌نمایش ویرایشگر غیرفعال است
              setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all ${isEditorPreview ? 'cursor-default' : 'cursor-pointer'} ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            aria-label={`اسلاید ${i + 1}`}
          />
        ))}
      </div>
      <button
        onClick={() => {
          if (isEditorPreview) return; // در پیش‌نمایش ویرایشگر غیرفعال است
          setIndex((index - 1 + slides.length) % slides.length);
        }}
        className={`absolute top-1/2 right-2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/50 hover:bg-slate-950/75 text-white backdrop-blur-sm shadow-md transition-colors ${isEditorPreview ? 'cursor-default' : 'cursor-pointer'}`}
        aria-label="اسلاید قبلی"
      >
        <ChevronUp className="w-5 h-5 rotate-90" />
      </button>
      <button
        onClick={() => {
          if (isEditorPreview) return; // در پیش‌نمایش ویرایشگر غیرفعال است
          setIndex((index + 1) % slides.length);
        }}
        className={`absolute top-1/2 left-2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/50 hover:bg-slate-950/75 text-white backdrop-blur-sm shadow-md transition-colors ${isEditorPreview ? 'cursor-default' : 'cursor-pointer'}`}
        aria-label="اسلاید بعدی"
      >
        <ChevronDown className="w-5 h-5 rotate-90" />
      </button>
    </div>
  );
};

/** شمارنده — عدد متحرک با پیشوند/پسوند + آیکون و استایل کامل (رنگ/اندازه عدد، کپشن) */
const CounterBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  isEditorPreview?: boolean;
}> = ({ widget, containerStyle, isEditorPreview = false }) => {
  const props = widget.settings.customProps || {};
  const style = widget.settings.style || {};
  const target = Number(props.target ?? (parseFloat(widget.content) || 100));
  const prefix = props.prefix || '';
  const suffix = props.suffix || '+';
  const duration = Number(props.duration) || 1200;
  // رنگ عدد — تنظیم اختصاصی شمارنده یا رنگ متن عمومی ویجت
  const numberColor = props.numberColor || style.textColor || '#0f172a';
  const numberFontSize = props.numberFontSize ? `${props.numberFontSize}px` : undefined;
  const captionColor = props.captionColor || style.textColor || '#64748b';
  const captionFontSize = props.captionFontSize ? `${props.captionFontSize}px` : undefined;
  // کپشن: متن ویجت (content) اولویت دارد؛ وگرنه عنوان ویجت
  const hasRealContent = !!widget.content && widget.content !== 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.';
  const caption = hasRealContent ? widget.content : (widget.title || 'شمارنده آماری');
  const icon = props.icon ? iconMap[props.icon] : null;
  const iconColor = props.iconColor || numberColor;
  const iconSize = Number(props.iconSize) || 32;
  const layout = props.layout || 'stacked';
  const align = props.align || 'center';
  const alignCls =
    align === 'center' ? 'items-center text-center'
    : align === 'start' ? 'items-start text-start'
    : 'items-end text-end';
  // فاصله بین اجزا — تنظیم «فاصله بین اجزا (px)» در پنل
  const gap = Number(props.gap) || 6;
  const [value, setValue] = useState(0);

  useEffect(() => {
    // در ویرایشگر (استودیو) انیمیشن شمارش اجرا نمی‌شود — عدد نهایی بلافاصله نمایش داده می‌شود
    if (isEditorPreview) {
      setValue(target);
      return;
    }
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, isEditorPreview]);

  // عدد نهایی (شبح نامرئی) — باکس در طول انیمیشن کوچک/بزرگ نمی‌شود و از کارت بیرون نمی‌زند
  const finalStr = `${prefix}${target.toLocaleString('fa-IR')}${suffix}`;
  // صفرپرشدن به تعداد رقم‌های هدف — رقم‌ها سر جای خودشان عوض می‌شوند و پرش افقی/عمودی نمی‌کنند
  const digitCount = String(target).length;
  const toFaDigits = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]).replace(/,/g, '٬');
  const padded = String(value).padStart(digitCount, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const displayStr = `${prefix}${toFaDigits(padded)}${suffix}`;
  const iconEl = icon
    ? cloneElement(icon as ReactElement<any, any>, { className: '', style: { width: iconSize, height: iconSize } })
    : null;
  const numberBox = (
    <div
      className="relative font-black leading-none"
      style={{
        color: numberColor,
        fontSize: numberFontSize || undefined,
        maxWidth: '100%',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap'
      }}
    >
      <span className="invisible">{finalStr}</span>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color: numberColor }}>
        {displayStr}
      </span>
    </div>
  );

  return (
    <div style={{ ...containerStyle, gap: `${gap}px` }} className={`p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 flex flex-col ${alignCls}`}>
      {layout === 'inline' ? (
        <div className={`flex items-center ${align === 'center' ? 'justify-center' : ''}`} style={{ gap: `${gap}px` }}>
          {iconEl}
          {numberBox}
        </div>
      ) : (
        <>
          {iconEl ? (
            <div style={{ color: iconColor }} className="mb-1 flex items-center justify-center">
              {iconEl}
            </div>
          ) : null}
          {numberBox}
        </>
      )}
      {caption ? (
        <span className="font-bold whitespace-pre-line" style={{ color: captionColor, fontSize: captionFontSize || undefined }}>
          {caption}
        </span>
      ) : null}
    </div>
  );
};

/** پیمایشگر — فهرستی از نوشته‌ها/برگه‌ها/پست‌های تایپ‌های دلخواه */
const NavigatorBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const postType = props.postType || 'صفحه';
  const items: { label: string; url: string }[] =
    (props.items as { label: string; url: string }[]) ||
    parseLines(widget.content || '').map((p) => ({ label: p[0] || 'مورد', url: p[1] || '#' }));

  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-2">
        <Compass className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-black text-slate-900 dark:text-white">{widget.title || 'پیمایش سریع'}</span>
        <span className="mr-auto text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{postType}</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {(items.length ? items : [{ label: 'نمونه نوشته ۱', url: '#' }, { label: 'نمونه برگه ۲', url: '#' }]).map((item, i) => (
          <a
            key={i}
            href={item.url || '#'}
            className="flex items-center gap-2.5 px-4 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
          >
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <span className="flex-1 font-bold">{item.label}</span>
            <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />
          </a>
        ))}
      </div>
    </div>
  );
};

/** نوار راهبری — برند + لینک‌های منو با استایل کامل (رنگ/سایز/انیمیشن هر آیتم) */
const NavMenuBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  isEditorPreview?: boolean;
}> = ({ widget, containerStyle, isEditorPreview = false }) => {
  const props = widget.settings.customProps || {};
  const brand = props.brand || widget.title;
  const brandColor = props.brandColor || '#ffffff';
  const brandFontSize = props.brandFontSize ? `${props.brandFontSize}px` : undefined;
  const brandPosition = props.brandPosition || 'start';
  const menuPosition = props.menuPosition || 'start';
  const defaultItemColor = props.itemColor || '#e2e8f0';
  const defaultItemFontSize = props.itemFontSize || 13;
  const hoverColor = props.itemHoverColor || '#ffffff';
  const defaultAnimation = props.itemAnimation || 'underline';
  // آیتم‌های منو — اولویت: customProps.items ساختاریافته ← fallback: content (هر خط عنوان|لینک) ← legacy items
  const hasRealContent = !!widget.content && widget.content !== 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.';
  const contentItems = parseLines(widget.content || '').map((p) => ({ label: p[0] || 'مورد', url: p[1] || '#' }));
  const items: { label: string; url: string; color?: string; fontSize?: number; animation?: string; bold?: boolean }[] =
    (props.items as any[]) && (props.items as any[]).length > 0
      ? (props.items as any[])
      : hasRealContent && contentItems.length > 0
        ? contentItems
        : [];

  // استایل‌های داینامیک (هاور + انیمیشن) — اسکوپ‌شده با شناسهٔ ویجت
  const uid = `nm-${String(widget.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const animCss = `
.${uid} .nm-item{position:relative;transition:color .2s ease,transform .2s ease,opacity .2s ease}
.${uid} .nm-item:hover{color:${hoverColor}!important}
.${uid} .nm-anim-underline::after{content:'';position:absolute;bottom:-3px;right:0;width:0;height:2px;background:${hoverColor};transition:width .25s ease}
.${uid} .nm-anim-underline:hover::after{width:100%}
.${uid} .nm-anim-fade:hover{opacity:.6}
.${uid} .nm-anim-slide:hover{transform:translateY(-2px)}
${isEditorPreview ? '' : `.${uid} .nm-anim-pulse{animation:${uid}-pulse 2.2s ease-in-out infinite}
@keyframes ${uid}-pulse{0%,100%{opacity:1}50%{opacity:.55}}
`}`;

  // ترازبندی — برند در راست/وسط/چپ و تراز نوار منو
  let navCls = 'flex items-center gap-4 flex-wrap';
  if (brandPosition === 'center') {
    navCls += '';
  } else if (menuPosition === 'center') {
    navCls += ' mx-auto';
  } else if (menuPosition === 'end') {
    navCls += ' me-auto';
  } else {
    navCls += ' ms-auto';
  }

  return (
    <>
      <style>{animCss}</style>
      <div
        style={containerStyle}
        className={`flex items-center gap-4 flex-wrap py-1.5 ${brandPosition === 'center' ? 'justify-center' : ''}`}
      >
        {brand && brandPosition !== 'end' ? (
          <strong
            className="font-black whitespace-nowrap"
            style={{ color: brandColor, fontSize: brandFontSize }}
          >
            {brand}
          </strong>
        ) : null}
        <nav className={navCls}>
          {items.map((item, i) => {
            const anim = item.animation || defaultAnimation;
            const cls = [
              'nm-item',
              'font-bold',
              'cursor-pointer',
              anim && anim !== 'none' ? `nm-anim-${anim}` : ''
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <a
                key={i}
                href={item.url || '#'}
                className={cls}
                style={{
                  color: item.color || defaultItemColor,
                  fontSize: item.fontSize ? `${item.fontSize}px` : `${defaultItemFontSize}px`,
                  fontWeight: item.bold ? 900 : undefined
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        {brand && brandPosition === 'end' ? (
          <strong
            className="font-black whitespace-nowrap"
            style={{ color: brandColor, fontSize: brandFontSize }}
          >
            {brand}
          </strong>
        ) : null}
      </div>
    </>
  );
};

/** لیست زیرصفحه‌ها — زیرصفحه‌های صفحهٔ فعلی را از وب‌سرویس می‌خواند
 *  حالت «درختی» (tree): همهٔ نسل‌ها به‌صورت تودرتو.
 *  حالت «مستقیم» (direct): فقط زیرصفحه‌های مستقیم همین صفحه (هر صفحه در خودش). */
const ChildPagesBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  pageId?: number | null;
}> = ({ widget, containerStyle, pageId }) => {
  const props = widget.settings.customProps || {};
  const limit = Number(props.limit) || 12;
  const mode = props.mode === 'direct' ? 'direct' : 'tree';

  const { data, error, retry } = useSmartData<SmartPageTreeNode>(() =>
    pageId ? fetchSmartPageChildrenTree(pageId) : Promise.resolve([]),
    [pageId]
  );

  const children = (data || []).slice(0, limit);

  // ردیف بازگشتی — عنوان + نام زیرصفحه‌های آن (بدون تاریخ)
  // در محیط مدیریت، کلیک روی ردیف‌ها هیچ عملی انجام نمی‌دهد (فقط پیش‌نمایش بصری)
  const renderRow = (node: SmartPageTreeNode, depth: number): React.ReactNode => {
    const subs = mode === 'tree' ? node.children || [] : [];
    if (depth > 6) return null;
    return (
      <div key={node.id} className="min-w-0">
        <div
          className="flex items-center gap-2.5 px-4 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-default select-none"
          style={depth > 0 ? { paddingRight: `${18 + depth * 20}px` } : undefined}
        >
          <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <FileText className={`${depth > 0 ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          </span>
          <span className="flex-1 font-bold truncate">{node.title}</span>
          <ArrowLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        </div>
        {subs.length > 0 && (
          <div className="border-r border-teal-500/10 mr-5">
            {subs.map((sub) => renderRow(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // بدون pageId (صفحهٔ جدید هنوز ذخیره نشده) → ساختار نمونه نمایش داده می‌شود
  if (!pageId) {
    return (
      <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal-500" />
          {widget.title || 'لیست زیرصفحه‌ها'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          این ویجت زیرصفحه‌های این صفحه را به‌صورت خودکار فهرست می‌کند.
          ابتدا صفحه را ذخیره کنید تا فهرست واقعی نمایش داده شود.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {widget.title ? (
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal-500" />
          {widget.title}
        </h3>
      ) : null}
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <div className="grid gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          هنوز زیرصفحه‌ای برای این صفحه ساخته نشده است.
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {children.map((child) => renderRow(child, 0))}
          </div>
        </div>
      )}
    </div>
  );
};

/** نقشه — جاسازی نقشه گوگل */
/** آدرس جاسازی نقشه OpenStreetMap از روی مختصات دقیق (بدون نیاز به کلید API) */
const buildOsmEmbedUrl = (lat: number, lng: number, delta = 0.01): string => {
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
};

const MapBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const hasCoords = typeof props.latitude === 'number' && typeof props.longitude === 'number';
  const embedUrl = hasCoords
    ? buildOsmEmbedUrl(props.latitude, props.longitude)
    : props.embedUrl || widget.content || 'https://www.google.com/maps?q=Yazd&output=embed';

  return (
    <div style={containerStyle} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
      <iframe
        src={embedUrl}
        title={widget.title || 'نقشه'}
        className="w-full h-72 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-rose-500" />
        {props.address || widget.title || 'نشانی روی نقشه'}
      </div>
    </div>
  );
};

/** اطلاعات تماس */
const ContactInfoBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const rows: { icon: React.ReactNode; label: string; value: string; href?: string }[] = [
    { icon: <Phone className="w-4 h-4" />, label: 'تلفن', value: props.phone || '۰۳۵-۳۱۲۳۴۵۶۷', href: `tel:${props.phone || ''}` },
    { icon: <Mail className="w-4 h-4" />, label: 'ایمیل', value: props.email || 'info@example.ac.ir', href: `mailto:${props.email || ''}` },
    { icon: <MapPin className="w-4 h-4" />, label: 'نشانی', value: props.address || 'یزد، بلوار دانشگاه، دانشگاه علم و هنر' },
    { icon: <Clock className="w-4 h-4" />, label: 'ساعات کاری', value: props.workHours || 'شنبه تا چهارشنبه ۸ تا ۱۶' },
  ];

  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 space-y-3">
      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
        <Phone className="w-4 h-4 text-teal-500" />
        {widget.title || 'اطلاعات تماس'}
      </h3>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">{row.icon}</span>
          <span className="text-slate-400 w-16 shrink-0 font-bold">{row.label}</span>
          {row.href ? (
            <a href={row.href} className="font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 transition-colors cursor-pointer" dir="auto">
              {row.value}
            </a>
          ) : (
            <span className="font-bold text-slate-700 dark:text-slate-200" dir="auto">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/** HTML دلخواه */
const CustomHtmlBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => (
  <div
    style={containerStyle}
    className="transition-all custom-html-block"
    dangerouslySetInnerHTML={{
      __html:
        widget.content ||
        '<div style="padding:24px;border:2px dashed #94a3b8;border-radius:12px;text-align:center;color:#94a3b8;font-size:13px">HTML دلخواه خود را در پنل تنظیمات وارد کنید</div>'
    }}
  />
);

/** لینک‌های اجتماعی */
const SocialLinksBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const networks = ['telegram', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'];
  const labels: Record<string, string> = { telegram: 'تلگرام', instagram: 'اینستاگرام', twitter: 'توییتر', linkedin: 'لینکدین', youtube: 'یوتیوب', whatsapp: 'واتساپ' };
  const colors: Record<string, string> = { telegram: 'bg-sky-500', instagram: 'bg-pink-600', twitter: 'bg-sky-600', linkedin: 'bg-blue-700', youtube: 'bg-rose-600', whatsapp: 'bg-emerald-500' };
  const urls = props.urls as Record<string, string> | undefined;

  return (
    <div style={containerStyle} className="flex items-center gap-2.5">
      <span className="text-xs font-black text-slate-600 dark:text-slate-300">{widget.title || 'ما را دنبال کنید'}</span>
      {networks.map((n) => {
        const url = urls?.[n] || '#';
        return (
          <a
            key={n}
            href={url}
            title={labels[n]}
            className={`w-9 h-9 rounded-full ${colors[n]} text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all cursor-pointer`}
          >
            <Share2 className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
};

/** دکمه‌های اشتراک‌گذاری */
const ShareButtonsBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const url = props.pageUrl || (typeof window !== 'undefined' ? window.location.href : '#');
  const encoded = encodeURIComponent(url);
  const title = encodeURIComponent(widget.title || 'صفحه');
  const shareItems = [
    { label: 'تلگرام', color: 'bg-sky-500', href: `https://t.me/share/url?url=${encoded}&text=${title}` },
    { label: 'واتساپ', color: 'bg-emerald-500', href: `https://wa.me/?text=${title}%20${encoded}` },
    { label: 'توییتر', color: 'bg-sky-600', href: `https://twitter.com/intent/tweet?url=${encoded}&text=${title}` },
    { label: 'لینکدین', color: 'bg-blue-700', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { label: 'ایمیل', color: 'bg-slate-500', href: `mailto:?subject=${title}&body=${encoded}` },
  ];

  return (
    <div style={containerStyle} className="flex items-center gap-2">
      <span className="text-xs font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5 text-teal-500" />
        اشتراک‌گذاری:
      </span>
      {shareItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          title={item.label}
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-white hover:scale-105 transition-all cursor-pointer shadow-sm"
          style={{ backgroundColor: item.color }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
};

/** جدول قیمت */
const PricingTableBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const plans: { name: string; price: string; features: string[]; highlight?: boolean }[] =
    (props.plans as { name: string; price: string; features: string[]; highlight?: boolean }[]) ||
    [
      { name: 'پایه', price: 'رایگان', features: ['۱ نوشته', 'پشتیبانی ایمیل'] },
      { name: 'حرفه‌ای', price: '۱٬۵۰۰٬۰۰۰ تومان', features: ['۱۰ نوشته', 'پشتیبانی ۲۴/۷', 'گزارش پیشرفته'], highlight: true },
      { name: 'سازمانی', price: 'تماس بگیرید', features: ['نامحدود', 'مشاور اختصاصی'] },
    ];

  return (
    <div style={containerStyle}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`rounded-2xl p-5 border flex flex-col gap-3 transition-all ${
              plan.highlight
                ? 'border-teal-500 bg-gradient-to-b from-teal-500/10 to-transparent shadow-lg -translate-y-1'
                : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white">{plan.name}</span>
              {plan.highlight && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-teal-600 text-white">پیشنهادی</span>}
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{plan.price}</div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className={`mt-auto text-center py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                plan.highlight
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white text-slate-700 dark:text-slate-200'
              }`}
            >
              انتخاب این پلن
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/** نظر کاربر (Testimonial) */
const TestimonialBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-3">
      <Quote className="w-8 h-8 text-teal-500/40" />
      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
        {widget.content || 'تجربه کاربری یا نظر یک نفر از مخاطبان شما در این بخش نمایش داده می‌شود.'}
      </p>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 text-white flex items-center justify-center font-black text-sm">
          {(props.author || 'ک').slice(0, 1)}
        </div>
        <div>
          <div className="text-xs font-black text-slate-900 dark:text-white">{props.author || 'کاربر نمونه'}</div>
          <div className="text-[10px] text-slate-400">{props.role || 'دانشجوی دانشگاه'}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * رندر خواندنی (بدون قابلیت ویرایش/انتخاب) یک SectionInstance — برای پیش‌نمایش بوم، پیش‌نمایش زنده
 * و بلوک تب‌ها که باید محتوای تب فعال را نشان دهد. مشابه سبک‌تری از renderSectionBlock در Canvas.tsx
 * (که یک closure خصوصی است و اینجا در دسترس نیست) — بدون منطق انتخاب/کشیدن‌ورها.
 */
export const RenderSectionReadOnly: React.FC<{
  section: SectionInstance;
  depth?: number;
  currentUserRole?: UserRoleCondition;
  isEditorPreview?: boolean;
  pageId?: number | null;
  pageSlug?: string | null;
  variables?: Record<string, string>;
  dedicatedPageId?: number | null;
}> = ({ section, depth = 0, currentUserRole = 'all', isEditorPreview = false, pageId, pageSlug, variables, dedicatedPageId }) => {
  if (depth > 6) return null;

  // فیلتر کل سکشن بر اساس برچسب URL — همان مکانیزم ویجت‌ها (conditionalDisplay.urlParamKey/urlParamValue)،
  // برای سکشن‌هایی که باید یکجا (تیتر + همهٔ کارت‌های داخلشان) مخفی/نمایان شوند
  const [sectionUrlSearch, setSectionUrlSearch] = useState<string>(() => (typeof window !== 'undefined' ? window.location.search : ''));
  useEffect(() => {
    const onUrlChange = () => setSectionUrlSearch(window.location.search);
    window.addEventListener('popstate', onUrlChange);
    return () => window.removeEventListener('popstate', onUrlChange);
  }, []);

  const sectionCond = section.conditionalDisplay;
  const sectionFilterTags = sectionCond?.urlParamValue?.trim();
  const sectionFilterParamKey = sectionCond?.urlParamKey?.trim() || 'filter';
  const sectionActiveFilterValue = new URLSearchParams(sectionUrlSearch).get(sectionFilterParamKey);

  if (sectionCond?.enabled && sectionFilterTags && sectionActiveFilterValue && !isEditorPreview) {
    const allowedTags = sectionFilterTags.split(/\s+/);
    if (!allowedTags.includes(sectionActiveFilterValue)) {
      return null;
    }
  }

  // پس‌زمینهٔ لایه‌ای سکشن — همان منطق buildSectionBackgroundImage در Canvas.tsx: گرادیان (یا رنگ ساده
  // به‌صورت لایهٔ گرادیان یکنواخت) همیشه روی تصویر قرار می‌گیرد، تصویر پایین‌ترین لایه است، وگرنه
  // (وقتی هر دو backgroundColor/backgroundImage به‌صورت جداگانه ست شوند) تصویر رنگ را کاملاً می‌پوشاند.
  const bgLayers: string[] = [];
  if (section.backgroundGradient) {
    bgLayers.push(applyBackgroundOpacity(section.backgroundGradient, section.backgroundOpacity) || section.backgroundGradient);
  } else if (section.backgroundColor) {
    const c = applyBackgroundOpacity(section.backgroundColor, section.backgroundOpacity) || section.backgroundColor;
    bgLayers.push(`linear-gradient(135deg, ${c} 0%, ${c} 100%)`);
  }
  if (section.backgroundImage) {
    bgLayers.push(`url("${section.backgroundImage}")`);
  }
  const backgroundImageValue = bgLayers.length ? bgLayers.join(', ') : undefined;

  return (
    <div
      style={{
        backgroundColor:
          section.backgroundImage || section.backgroundGradient
            ? undefined
            : section.backgroundColor
              ? applyBackgroundOpacity(section.backgroundColor, section.backgroundOpacity)
              : undefined,
        backgroundImage: backgroundImageValue,
        backgroundPosition: section.backgroundImage ? section.backgroundPosition || 'center' : undefined,
        backgroundSize: section.backgroundImage ? section.backgroundSize || 'cover' : undefined,
        backgroundRepeat: section.backgroundImage ? section.backgroundRepeat || 'no-repeat' : undefined,
        paddingTop: section.paddingTop,
        paddingBottom: section.paddingBottom,
        paddingLeft: section.paddingLeft,
        paddingRight: section.paddingRight,
        boxShadow: resolveBoxShadow(section.boxShadow),
        borderTopLeftRadius: section.borderRadius?.topLeft,
        borderTopRightRadius: section.borderRadius?.topRight,
        borderBottomLeftRadius: section.borderRadius?.bottomLeft,
        borderBottomRightRadius: section.borderRadius?.bottomRight
      }}
      className="transition-all"
    >
      <div className={section.layout === 'boxed' ? 'max-w-[1200px] mx-auto px-4' : 'w-full px-4'}>
        <div className="grid grid-cols-12 gap-4">
          {section.columns.map((col) => (
            <div
              key={col.id}
              style={{ gridColumn: `span ${Math.min(12, Math.max(1, col.width))} / span ${Math.min(12, Math.max(1, col.width))}` }}
              className="space-y-4"
            >
              {getColumnBlocks(col).map((block) =>
                block.kind === 'widget' ? (
                  <WidgetRenderer
                    key={block.widget.id}
                    widget={block.widget}
                    currentUserRole={currentUserRole}
                    isEditorPreview={isEditorPreview}
                    depth={depth + 1}
                    pageId={pageId}
                    pageSlug={pageSlug}
                    variables={variables}
                    dedicatedPageId={dedicatedPageId}
                  />
                ) : (
                  <RenderSectionReadOnly
                    key={block.section.id}
                    section={block.section}
                    depth={depth + 1}
                    currentUserRole={currentUserRole}
                    isEditorPreview={isEditorPreview}
                    pageId={pageId}
                    pageSlug={pageSlug}
                    variables={variables}
                    dedicatedPageId={dedicatedPageId}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** تب‌ها — سوئیچ بین چند SectionInstance مستقل */
const TabsBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  isEditorPreview: boolean;
  pageId?: number | null;
  pageSlug?: string | null;
  variables?: Record<string, string>;
  dedicatedPageId?: number | null;
}> = ({ widget, containerStyle, isEditorPreview, pageId, pageSlug, variables, dedicatedPageId }) => {
  const [active, setActive] = useState(0);
  const tabs: { id: string; label: string; section: SectionInstance }[] = widget.settings.customProps?.tabs || [];

  if (tabs.length === 0) {
    return (
      <div style={containerStyle} className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-center text-xs text-slate-400">
        هنوز هیچ تبی برای این بلوک تعریف نشده است.
      </div>
    );
  }

  const activeTab = tabs[Math.min(active, tabs.length - 1)];

  return (
    <div style={containerStyle}>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2 mb-4">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(i)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              i === active
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab?.section && (
        <RenderSectionReadOnly
          section={activeTab.section}
          isEditorPreview={isEditorPreview}
          pageId={pageId}
          pageSlug={pageSlug}
          variables={variables}
          dedicatedPageId={dedicatedPageId}
        />
      )}
    </div>
  );
};

/** نقشه تعاملی — سوئیچ بین چند embed آماده */
const InteractiveMapBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const [active, setActive] = useState(0);
  const locations: { id: string; label: string; latitude?: number; longitude?: number; embedUrl?: string; address?: string }[] =
    widget.settings.customProps?.locations || [];

  if (locations.length === 0) {
    return (
      <div style={containerStyle} className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-center text-xs text-slate-400">
        هنوز هیچ مکانی برای این نقشه تعریف نشده است.
      </div>
    );
  }

  const activeLoc = locations[Math.min(active, locations.length - 1)];
  const activeEmbedUrl =
    activeLoc && typeof activeLoc.latitude === 'number' && typeof activeLoc.longitude === 'number'
      ? buildOsmEmbedUrl(activeLoc.latitude, activeLoc.longitude)
      : activeLoc?.embedUrl;

  return (
    <div style={containerStyle} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {locations.map((loc, i) => (
          <button
            key={loc.id}
            type="button"
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              i === active ? 'bg-slate-900 text-amber-400 shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <MapPin className={`w-3.5 h-3.5 ${i === active ? 'text-amber-400' : 'text-slate-400'}`} />
            {loc.label}
          </button>
        ))}
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800 bg-slate-900 h-[360px]">
        {activeEmbedUrl && (
          <iframe
            title={activeLoc.label}
            src={activeEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
        {activeLoc?.address && (
          <div className="absolute bottom-3 right-3 max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            {activeLoc.address}
          </div>
        )}
      </div>
    </div>
  );
};

/** جدول اکسل — داده‌های واردشده به‌صورت JSON ثابت (پردازش‌شده هنگام آپلود) با جستجوی اختیاری */
const ExcelTableBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');
  const props = widget.settings.customProps || {};
  const columns: string[] = props.columns || [];
  const rows: string[][] = props.rows || [];
  const enableSearch = props.enableSearch !== false;
  const maxHeight: number | undefined = props.maxHeight || undefined;
  const headerBgColor = props.headerBgColor || '#0f172a';
  const headerTextColor = props.headerTextColor || '#ffffff';
  const rowBgColor = props.rowBgColor || undefined;
  const rowAltBgColor = props.rowAltBgColor || undefined;
  const rowTextColor = props.rowTextColor || undefined;
  const groupByColumn: string = props.groupByColumn || '';
  const groupColIndex = groupByColumn ? columns.indexOf(groupByColumn) : -1;

  if (columns.length === 0) {
    return (
      <div style={containerStyle} className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-center text-xs text-slate-400">
        هنوز فایل اکسلی برای این بلوک آپلود نشده است.
      </div>
    );
  }

  const groupValues = groupColIndex >= 0 ? Array.from(new Set(rows.map((r) => r[groupColIndex]).filter(Boolean))) : [];

  const filteredRows = rows
    .filter((r) => (activeGroup === 'all' || groupColIndex < 0 ? true : r[groupColIndex] === activeGroup))
    .filter((r) => (search.trim() ? r.some((cell) => cell.toLowerCase().includes(search.trim().toLowerCase())) : true));

  return (
    <div style={containerStyle} className="space-y-3">
      {groupValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveGroup('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeGroup === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            همه
          </button>
          {groupValues.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setActiveGroup(v)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${activeGroup === v ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              {v}
            </button>
          ))}
        </div>
      )}
      {enableSearch && (
        <div className="relative max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در جدول..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      )}
      <div
        className="rounded-2xl border border-gray-200 dark:border-slate-800"
        style={{ overflowX: 'auto', overflowY: maxHeight ? 'auto' : undefined, maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
      >
        <table className="w-full text-right border-collapse text-xs">
          <thead style={{ backgroundColor: headerBgColor, color: headerTextColor, position: maxHeight ? 'sticky' : undefined, top: maxHeight ? 0 : undefined, zIndex: maxHeight ? 1 : undefined }} className="font-bold">
            <tr>
              {columns.map((c, i) => (
                <th key={i} className="p-3">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredRows.length > 0 ? (
              filteredRows.map((row, ri) => (
                <tr
                  key={ri}
                  className="hover:bg-teal-50/50 dark:hover:bg-teal-500/5 transition-colors"
                  style={{ backgroundColor: (ri % 2 === 1 ? rowAltBgColor : undefined) ?? rowBgColor }}
                >
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-3" style={{ color: rowTextColor }}>
                      <span className={rowTextColor ? undefined : 'text-slate-700 dark:text-slate-200'}>{cell}</span>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-slate-400 text-xs">
                  نتیجه‌ای یافت نشد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  currentUserRole = 'all',
  isEditorPreview = false,
  depth = 0,
  pageId,
  pageSlug,
  variables,
  dedicatedPageId
}) => {
  // خواندن Query String فعلی — برای فیلتر بر اساس برچسب (conditionalDisplay.urlParamKey/urlParamValue)
  // با popstate به‌روز می‌شود تا تغییر آدرس (بازگشت/جلو مرورگر، یا لینک‌های فیلتر) بدون رفرش کامل اثر کند
  const [urlSearch, setUrlSearch] = useState<string>(() => (typeof window !== 'undefined' ? window.location.search : ''));
  useEffect(() => {
    const onUrlChange = () => setUrlSearch(window.location.search);
    window.addEventListener('popstate', onUrlChange);
    return () => window.removeEventListener('popstate', onUrlChange);
  }, []);

  // Check conditional display
  const cond = widget.settings.conditionalDisplay;
  // برچسب‌های این ویجت (مثلاً "field-card degree-masters faculty-humanities") — هم برای فیلتر
  // بر اساس URL استفاده می‌شوند، هم به‌عنوان class واقعی روی عنصر رندرشده اعمال می‌شوند
  const filterTags = cond?.urlParamValue?.trim();
  const filterParamKey = cond?.urlParamKey?.trim() || 'filter';
  const activeFilterValue = new URLSearchParams(urlSearch).get(filterParamKey);
  // آیا این ویجت «فعال» است؟ برای styleOnly (چیپ/تب فیلتر) — یا تطابق برچسب، یا (matchWhenEmpty)
  // نبودِ هرگونه فیلتر در URL — بدون تأثیر بر نمایش/عدم‌نمایش ویجت
  const isActiveTagMatch = cond?.matchWhenEmpty
    ? !activeFilterValue
    : !!(filterTags && activeFilterValue && filterTags.split(/\s+/).includes(activeFilterValue));

  if (cond && cond.enabled && !isEditorPreview) {
    if (cond.userRole && cond.userRole !== 'all') {
      if (currentUserRole !== 'all' && currentUserRole !== cond.userRole) {
        return (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs text-center">
            [محتوا بر اساس نقش کاربر «{cond.userRole}» فیلتر شده است]
          </div>
        );
      }
    }
    if (filterTags && activeFilterValue && !cond.styleOnly) {
      const allowedTags = filterTags.split(/\s+/);
      if (!allowedTags.includes(activeFilterValue)) {
        return null;
      }
    }
  }

  const style: WidgetStyle =
    cond?.enabled && cond?.styleOnly && isActiveTagMatch && widget.settings.activeStyle
      ? { ...(widget.settings.style || {}), ...widget.settings.activeStyle }
      : widget.settings.style || {};
  const binding = widget.settings.binding || { dataSource: 'none' };
  // برای خط جداکننده، borderWidth/borderColor/borderStyle/borderRadius معنای «رنگ/ضخامت/نوع
  // خودِ خط» را دارند (روی خودِ <hr> اعمال می‌شوند در case مربوطه) نه یک قاب دور بلوک —
  // پس از اعمال آن‌ها به عنوان border جعبهٔ containerStyle صرف‌نظر می‌کنیم
  const isDivider = widget.type === 'divider';

  // راست‌چین/چپ‌چین/وسط‌چین کردن ویجتِ کوچک‌تر از عرض کامل — با auto کردن حاشیهٔ سمتِ مقابل
  // (فیزیکی، نه وابسته به RTL) — همان الگوی cardAlign در icon-box؛ اگر کاربر خودش حاشیهٔ آن
  // سمت را دستی تنظیم کرده باشد، به‌جای auto همان مقدار دستی حفظ می‌شود
  const alignMarginLeft =
    style.widthMode === 'center' || style.widthMode === 'right'
      ? 'auto'
      : style.marginLeft !== undefined ? `${style.marginLeft}px` : undefined;
  const alignMarginRight =
    style.widthMode === 'center' || style.widthMode === 'left'
      ? 'auto'
      : style.marginRight !== undefined ? `${style.marginRight}px` : undefined;

  // Calculate container inline style (تنظیمات لایه — هم‌سطح slider-studio)
  const containerStyle: React.CSSProperties = {
    color: style.textColor,
    backgroundColor: resolveBackgroundColor(style),
    backgroundImage: style.backgroundGradient ? style.backgroundGradient : undefined,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    textAlign: style.textAlign,
    lineHeight: style.lineHeight !== undefined ? style.lineHeight : undefined,
    letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
    textTransform: style.textTransform,
    paddingTop: style.paddingTop !== undefined ? `${style.paddingTop}px` : undefined,
    paddingBottom: style.paddingBottom !== undefined ? `${style.paddingBottom}px` : undefined,
    paddingLeft: style.paddingLeft !== undefined ? `${style.paddingLeft}px` : undefined,
    paddingRight: style.paddingRight !== undefined ? `${style.paddingRight}px` : undefined,
    marginTop: style.marginTop !== undefined ? `${style.marginTop}px` : undefined,
    marginBottom: style.marginBottom !== undefined ? `${style.marginBottom}px` : undefined,
    marginLeft: alignMarginLeft,
    marginRight: alignMarginRight,
    borderRadius: isDivider ? undefined : resolveBorderRadius(style),
    borderWidth: isDivider || style.borderWidth === undefined ? undefined : `${style.borderWidth}px`,
    borderColor: isDivider ? undefined : style.borderColor,
    borderStyle: isDivider || !style.borderWidth ? undefined : (style.borderStyle || 'solid'),
    boxShadow: resolveBoxShadow(style.shadow),
    opacity: style.opacity,
    maxWidth: style.maxWidth !== undefined ? `${style.maxWidth}px` : undefined,
    width: style.widthMode === 'auto' || style.widthMode === 'center' || style.widthMode === 'left' || style.widthMode === 'right' ? 'fit-content' : undefined
  };

  // State for accordions
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Dynamic Widget Rendering
  const renderedWidget: React.ReactNode = (() => {
  switch (widget.type) {
    // -------------------------------------------------------------
    // STATIC WIDGETS
    // -------------------------------------------------------------
    case 'heading':
      return (
        <div style={containerStyle} className="transition-all">
          <h2
            className="tracking-tight leading-tight"
            style={{
              fontSize: style.fontSize || '1.5rem',
              fontWeight: style.fontWeight || 900
            }}
          >
            {renderTextWithIcons(widget.content || widget.title, variables)}
          </h2>
        </div>
      );

    case 'text':
      return (
        <div style={containerStyle} className="transition-all leading-relaxed">
          <p
            className="whitespace-pre-line text-sm md:text-base"
            style={{ fontSize: style.fontSize || undefined }}
          >
            {renderTextWithIcons(widget.content || 'متن نمونه برای این ویجت قرار داده شده است.', variables)}
          </p>
        </div>
      );

    case 'image': {
      const frame = style.imageFrame;
      const squaredFrame = frame === 'square' || frame === 'circle';
      // شعاع گوشه فقط روی خود تصویر اعمال شود، نه روی بلوک/قالب دور آن
      const { borderRadius: _containerRadius, ...imgWrapperStyle } = containerStyle;
      return (
        <div
          style={imgWrapperStyle}
          className={`overflow-hidden transition-all ${
            squaredFrame ? 'aspect-square' : ''
          }`}
        >
          <img
            src={widget.imageUrl || '/placeholder-news.svg'}
            alt={widget.title}
            className={`transition-transform duration-300 ${
              style.imageHoverZoom !== false ? 'hover:scale-[1.02]' : ''
            } ${squaredFrame ? 'w-full h-full' : 'w-full h-auto'}`}
            style={{
              objectFit: style.objectFit || 'cover',
              borderRadius:
                frame === 'circle'
                  ? '9999px'
                  : resolveBorderRadius(style) || (frame === 'rounded' ? '16px' : undefined)
            }}
          />
        </div>
      );
    }

    case 'button': {
      // استایل ظاهری (رنگ پس‌زمینه/خط/سایه/پدینگ) فقط روی خود دکمه اعمال شود —
      // wrapper فقط چیدمان است؛ وگرنه رنگ/خطِ پشت دکمه به‌صورت باکس دیده می‌شود
      const {
        backgroundColor: _wrapBg,
        backgroundImage: _wrapBgImage,
        lineHeight: _wrapLh,
        borderRadius: _wrapBr,
        borderWidth: _wrapBw,
        borderColor: _wrapBc,
        borderStyle: _wrapBs,
        boxShadow: _wrapSh,
        paddingTop: _wrapPt,
        paddingBottom: _wrapPb,
        paddingLeft: _wrapPl,
        paddingRight: _wrapPr,
        ...buttonWrapperStyle
      } = containerStyle;
      // ترازبندی دکمه در سکشن — مثل ویجت عنوان: راست (پیش‌فرض RTL) / وسط / چپ
      const buttonJustify = style.fullWidth
        ? undefined
        : style.textAlign === 'center'
          ? 'center'
          : style.textAlign === 'left'
            ? 'flex-end'
            : 'flex-start';
      return (
        <div
          style={{
            ...buttonWrapperStyle,
            display: style.fullWidth ? undefined : 'flex',
            justifyContent: buttonJustify
          }}
          className={`transition-all ${style.fullWidth ? 'w-full' : ''}`}
        >
          <a
            href={widget.buttonUrl || '#'}
            target={widget.buttonTarget === 'new' ? '_blank' : undefined}
            rel={widget.buttonTarget === 'new' ? 'noopener noreferrer' : undefined}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-black text-sm transition-all ${
              style.fullWidth ? 'w-full' : ''
            }`}
            style={{
              backgroundColor: resolveBackgroundColor(style),
              backgroundImage: style.backgroundGradient ? style.backgroundGradient : undefined,
              color: style.textColor || undefined,
              borderRadius: resolveBorderRadius(style),
              borderWidth: style.borderWidth !== undefined ? `${style.borderWidth}px` : undefined,
              borderColor: style.borderColor,
              borderStyle: style.borderWidth ? (style.borderStyle || 'solid') : undefined,
              boxShadow: resolveBoxShadow(style.shadow),
              paddingTop: style.paddingTop !== undefined ? `${style.paddingTop}px` : undefined,
              paddingBottom: style.paddingBottom !== undefined ? `${style.paddingBottom}px` : undefined,
              paddingLeft: style.paddingLeft !== undefined ? `${style.paddingLeft}px` : undefined,
              paddingRight: style.paddingRight !== undefined ? `${style.paddingRight}px` : undefined,
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
              textTransform: style.textTransform
            }}
          >
            {widget.iconName && iconMap[widget.iconName] ? (
              cloneElement(iconMap[widget.iconName] as ReactElement<any, any>, {
                className: 'w-4 h-4 shrink-0',
                key: 'btn-icon'
              })
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span>{widget.buttonText || widget.content || 'دکمه اقدام'}</span>
          </a>
        </div>
      );
    }

    case 'video':
      return (
        <div
          style={{
            ...containerStyle,
            aspectRatio: style.aspectRatio || '16 / 9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="relative overflow-hidden bg-slate-900"
        >
          {widget.videoUrl ? (
            isDirectVideo(widget.videoUrl) ? (
              <video
                src={widget.videoUrl}
                poster={style.videoPoster || undefined}
                autoPlay={style.videoAutoplay}
                loop={style.videoLoop}
                muted={style.videoMuted}
                controls={style.videoControls !== false}
                playsInline
                className="w-full h-full object-cover"
                style={{ objectFit: style.objectFit || 'cover' }}
              />
            ) : (
              <iframe
                src={widget.videoUrl}
                title={widget.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="p-4 rounded-full bg-teal-500/20 text-teal-400">
                <Play className="w-8 h-8 fill-current" />
              </div>
              <span className="text-xs font-bold">پخش‌کننده ویدیوهای آموزشی</span>
            </div>
          )}
        </div>
      );

    case 'divider': {
      // وقتی خط تراز راست/چپ/وسط دارد (widthMode !== 'full')، عرض خودِ خط کوتاه‌تر از
      // ۱۰۰٪ می‌شود (پیش‌فرض ۵۰٪ یا حداکثر عرض دستی) و بلوکِ دربرگیرنده (containerStyle)
      // با marginLeft/marginRight محاسبه‌شده در بالا آن را به همان سمت می‌چسباند
      const isAligned = style.widthMode === 'left' || style.widthMode === 'right' || style.widthMode === 'center';
      const lineWidth = isAligned ? (style.maxWidth !== undefined ? `${style.maxWidth}px` : '50%') : '100%';
      const lineBorderStyle: 'solid' | 'dashed' | 'dotted' | 'none' = style.borderStyle || 'solid';
      return (
        <div style={containerStyle} className="py-3">
          <hr
            className={!style.borderColor ? 'border-slate-200 dark:border-slate-800' : ''}
            style={{
              width: lineWidth,
              borderTopWidth: `${style.borderWidth ?? 1}px`,
              borderTopColor: style.borderColor || undefined,
              borderTopStyle: lineBorderStyle
            }}
          />
        </div>
      );
    }

    case 'spacer':
      return <div style={{ height: `${style.paddingTop || 32}px` }} />;

    case 'accordion':
      return (
        <div style={containerStyle} className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full p-4 flex items-center justify-between text-right font-black text-sm text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <span>{widget.title || 'سوال یا لایه آکاردئونی'}</span>
            {accordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {accordionOpen && (
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/30">
              {widget.content || 'محتوای متنی آکاردئون در این بخش نمایش داده می‌شود.'}
            </div>
          )}
        </div>
      );

    case 'stat-card':
      return (
        <div style={containerStyle} className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 text-right flex flex-col gap-1">
          <div className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">{widget.title}</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{widget.content || '1,420+'}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">آمار به‌روزرسانی شده لحظه‌ای</span>
        </div>
      );

    // -------------------------------------------------------------
    // NEW STATIC BLOCKS — بلوک‌های جدید سازنده صفحه
    // -------------------------------------------------------------
    case 'richtext':
      return <RichTextBlock widget={widget} containerStyle={containerStyle} variables={variables} />;

    case 'icon-box':
      return <IconBoxBlock widget={widget} containerStyle={containerStyle} />;

    case 'vertical-container':
      return (
        <ContainerBlock
          widget={widget}
          containerStyle={containerStyle}
          vertical
          depth={depth}
          isEditorPreview={isEditorPreview}
          variables={variables}
        />
      );

    case 'horizontal-container':
      return (
        <ContainerBlock
          widget={widget}
          containerStyle={containerStyle}
          vertical={false}
          depth={depth}
          isEditorPreview={isEditorPreview}
          variables={variables}
        />
      );

    case 'image-slider':
      return <ImageSliderBlock widget={widget} containerStyle={containerStyle} isEditorPreview={isEditorPreview} />;

    case 'counter':
      return <CounterBlock widget={widget} containerStyle={containerStyle} isEditorPreview={isEditorPreview} />;

    case 'navigator':
      return <NavigatorBlock widget={widget} containerStyle={containerStyle} />;

    case 'nav-menu':
      return <NavMenuBlock widget={widget} containerStyle={containerStyle} isEditorPreview={isEditorPreview} />;

    case 'child-pages':
      return (
        <ChildPagesBlock
          widget={widget}
          containerStyle={containerStyle}
          pageId={pageId}
        />
      );

    case 'map':
      return <MapBlock widget={widget} containerStyle={containerStyle} />;

    case 'contact-info':
      return <ContactInfoBlock widget={widget} containerStyle={containerStyle} />;

    case 'custom-html':
      return <CustomHtmlBlock widget={widget} containerStyle={containerStyle} />;

    case 'social-links':
      return <SocialLinksBlock widget={widget} containerStyle={containerStyle} />;

    case 'share-buttons':
      return <ShareButtonsBlock widget={widget} containerStyle={containerStyle} />;

    case 'pricing-table':
      return <PricingTableBlock widget={widget} containerStyle={containerStyle} />;

    case 'testimonial':
      return <TestimonialBlock widget={widget} containerStyle={containerStyle} />;

    case 'callout':
      return (
        <div
          style={containerStyle}
          className="flex items-start gap-3 p-4 rounded-2xl border border-amber-300/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200"
        >
          <span className="p-2 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-300 shrink-0">
            {iconMap[widget.iconName || 'info'] || <Info className="w-5 h-5" />}
          </span>
          <div>
            <div className="text-sm font-black">{widget.title || 'یادآوری یا نکته مهم'}</div>
            <p className="text-xs leading-relaxed mt-1">{widget.content || 'این متن می‌تواند نکته، هشدار یا اطلاعیه مهم باشد.'}</p>
          </div>
        </div>
      );

    case 'icon':
      return (
        <div style={containerStyle} className="flex justify-center">
          <span className="p-4 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 inline-flex">
            {iconMap[widget.iconName || 'sparkles'] || <Sparkles className="w-6 h-6" />}
          </span>
        </div>
      );

    case 'tabs':
      return (
        <TabsBlock
          widget={widget}
          containerStyle={containerStyle}
          isEditorPreview={isEditorPreview}
          pageId={pageId}
          pageSlug={pageSlug}
          variables={variables}
          dedicatedPageId={dedicatedPageId}
        />
      );

    case 'interactive-map':
      return <InteractiveMapBlock widget={widget} containerStyle={containerStyle} />;

    case 'excel-table':
      return <ExcelTableBlock widget={widget} containerStyle={containerStyle} />;

    // -------------------------------------------------------------
    // SMART DYNAMIC WIDGETS — اتصال به وب‌سرویس‌های واقعی
    // (در حالت ویرایش فقط ساختار بلوک نمایش داده می‌شود؛ داده‌ها در پیش‌نمایش)
    // -------------------------------------------------------------
    case 'news-feed':
      return isEditorPreview ? null : <NewsFeedWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'image-gallery':
      return isEditorPreview ? null : <ImageGalleryWidget widget={widget} binding={binding} containerStyle={containerStyle} />;


    case 'file-manager':
      return isEditorPreview ? null : <FileManagerWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'form':
      return isEditorPreview ? (
        <div style={containerStyle} className="p-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
          {binding.formId
            ? 'جاسازی فرم — محتوای فرم در پیش‌نمایش/انتشار نمایش داده می‌شود'
            : 'هنوز فرمی برای این بلوک انتخاب نشده — از پنل تنظیمات یک فرم منتشرشده انتخاب کنید.'}
        </div>
      ) : (
        <FormEmbedWidget binding={binding} containerStyle={containerStyle} />
      );

    // بلوک‌های صفحات اختصاصی — اتصال به یک DedicatedPage مشخص (binding.dedicatedPageId)
    case 'dp-news':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="news" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-announcements':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="announcement" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-journal-issues':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="journal_issue" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-articles':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="article" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-events':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="event" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-gallery':
      return isEditorPreview ? null : (
        <DedicatedPageGalleryWidget widget={widget} binding={binding} containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-members':
      return isEditorPreview ? null : (
        <DedicatedPageMembersWidget widget={widget} binding={binding} containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} />
      );

    default:
      return (
        <div style={containerStyle} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
          ویجت انتخاب شده ({widget.type})
        </div>
      );
  }
  })();

  // برچسب‌ها را به‌عنوان class واقعی روی یک عنصر دربرگیرنده اعمال می‌کنیم — فقط وقتی برچسبی
  // ست شده باشد (بدون برچسب، هیچ عنصر اضافه‌ای دور ویجت اضافه نمی‌شود، یعنی صفر تغییر برای
  // ویجت‌های فعلی که از این قابلیت استفاده نمی‌کنند)
  if (filterTags) {
    return (
      <div className={filterTags} data-filter-tags={filterTags}>
        {renderedWidget}
      </div>
    );
  }

  return renderedWidget;
};
