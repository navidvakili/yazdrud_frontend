import React, { useState, useEffect, useRef } from 'react';
import {
  WidgetInstance,
  SectionInstance,
  ColumnInstance,
  WidgetStyle,
  WidgetDataBinding,
  ConditionalDisplayRule,
  UserRoleCondition,
  Breakpoint,
  getColumnWidth,
  getWidgetTypeLabel
} from './builderTypes';
import {
  fetchDataSourceNewsCategories,
  fetchDataSourceMediaFolders,
  fetchDedicatedPageTaxonomiesForWidget,
  type DedicatedPageTaxonomyOption
} from './api';
import GradientPicker from '../slider-studio/components/GradientPicker';
import MediaManager from '@/src/shared-components/MediaManager';
import WysiwygEditor, { type WysiwygEditorHandle } from '@/src/shared-components/WysiwygEditor';
import IconPicker, { ICON_CHOICES } from './components/IconPicker';
import type { NewsCategory } from '@/src/shared-types';
import type { MediaFolderDto } from '../gallery/types';
import { fetchForms } from '../forms/api';
import {
  Sliders,
  Paintbrush,
  Database,
  Shield,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Plus,
  Monitor,
  Tablet,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  Link,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Grid,
  List,
  Layers,
  Image as ImageIcon,
  Bookmark as BookmarkIcon,
  X,
  Maximize2,
  Minimize2,
  Check,
  Pencil,
  Upload,
  FileSpreadsheet,
  FileX,
  Pin as PinIcon,
  Languages
} from 'lucide-react';
import { toPersianDigits } from '@/src/shared-utils/formatters';

// ── سایه‌های آماده (هم‌سطح slider-studio) ──
const SHADOW_SM = '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)';
const SHADOW_MD = '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)';
const SHADOW_LG = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)';

// ── جعبهٔ انتخاب رنگ — وقتی رنگ حذف شده باشد چهارخانهٔ ترانسپرنت نمایش می‌دهد ──
/** اگر مقدار undefined/transparent باشد، الگوی چهارخانهٔ شفاف (مثل نرم‌افزارهای تصویری) دیده می‌شود */
const ColorBox: React.FC<{
  value?: string;
  onChange: (color: string) => void;
  className?: string;
  /** آیا دکمهٔ × (حذف رنگ) نمایش داده شود؟ پیش‌فرض: وقتی مقدار فعلی رنگ دارد */
  clearable?: boolean;
}> = ({ value, onChange, className = '', clearable }) => {
  const empty = !value || value === 'transparent';
  // ورودی بومی <input type=color> فقط #rrggbb می‌پذیرد — rgba/rgb را به هگز تبدیل می‌کنیم
  // تا colorpicker همان رنگ مؤثر (مثلاً پیش‌فرض سبز کم‌رنگ) را نشان دهد نه سفید
  const toInputHex = (v?: string): string => {
    if (!v || v === 'transparent') return '#ffffff';
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
    const m = v.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      const [r, g, b] = m[1].split(',').map((s) => Math.round(Number(s.trim())));
      if (![r, g, b].some(Number.isNaN)) {
        return `#${[r, g, b]
          .map((n) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0'))
          .join('')}`;
      }
    }
    return '#ffffff';
  };
  const inputHex = toInputHex(value);
  const showClear = clearable !== undefined ? clearable : !empty;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 shrink-0 p-1 w-8 h-8 ${className}`}
      title={empty ? 'شفاف (بدون رنگ)' : 'برای حذف رنگ روی × بزنید'}
    >
      <div
        className="w-full h-full rounded-lg"
        style={{
          backgroundColor: empty ? undefined : value,
          backgroundImage: empty
            ? 'conic-gradient(#d8dee6 0 25%, #ffffff 0 50%, #d8dee6 0 75%, #ffffff 0)'
            : undefined,
          backgroundSize: empty ? '12px 12px' : undefined
        }}
      />
      <input
        type="color"
        value={inputHex}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {showClear && !empty && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-0.5 left-0.5 z-10 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-rose-500 hover:border-rose-400 transition-all cursor-pointer"
          title="حذف رنگ (بازگشت به پیش‌فرض/شفاف)"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
};

/** استخراج گزینه‌ها از محتوای متنی (هر خط: برچسب|مقدار|...) */
const parseLines = (content: string, separators = '|،,;'): string[][] =>
  (content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(new RegExp(`[${separators}]`)).map((p) => p.trim()));

interface InspectorPanelProps {
  selectedWidget: WidgetInstance | null;
  selectedColumn: ColumnInstance | null;
  selectedSection: SectionInstance | null;
  activeBreakpoint?: Breakpoint;
  onUpdateWidget: (updated: WidgetInstance) => void;
  onUpdateSection: (updated: SectionInstance) => void;
  onUpdateSectionColumnLayout?: (sectionId: string, preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => void;
  onUpdateColumnWidth?: (sectionId: string, columnId: string, bp: Breakpoint, value: number) => void;
  /** به‌روزرسانی خصوصیات یک ستون (مثلاً موقعیت چسبان/ثابت برای سایدبار) — نه کل سکشن */
  onUpdateColumn?: (sectionId: string, columnId: string, patch: Partial<ColumnInstance>) => void;
  onDeleteWidget: (widgetId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDuplicateWidget: (widget: WidgetInstance) => void;
  /** شناسهٔ نمونهٔ صفحهٔ اختصاصیِ متصل به این لایوت — برای دسته‌بندی‌های بلوک گالری صفحات اختصاصی */
  dedicatedPageId?: number;
  /** درخواست باز کردن ویرایشگر محتوای یک تب (ویجت tabs) — مودال واقعی در PageBuilderStudio.tsx مانت می‌شود
   *  تا از circular import بین InspectorPanel و TabSectionEditorModal (که خودِ InspectorPanel را رندر می‌کند) جلوگیری شود */
  onEditTabSection?: (widgetId: string, tabIndex: number) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedWidget,
  selectedColumn,
  selectedSection,
  activeBreakpoint = 'desktop',
  onUpdateWidget,
  onUpdateSection,
  onUpdateSectionColumnLayout,
  onUpdateColumnWidth,
  onUpdateColumn,
  onDeleteWidget,
  onDeleteSection,
  onDuplicateWidget,
  dedicatedPageId,
  onEditTabSection
}) => {
  const [inspectorTab, setInspectorTab] = useState<'content' | 'style' | 'logic'>('content');
  const [colBp, setColBp] = useState<Breakpoint>('desktop');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'sectionBg' | 'widgetImage' | 'videoPoster' | null>(null);
  const [excelUploading, setExcelUploading] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  /** دیالوگ نسخهٔ کامل ویرایشگر متن غنی (WYSIWYG) */
  const [richtextFullscreen, setRichtextFullscreen] = useState(false);

  // کپی مستعار — قبل از هر Narrowing تا در دیالوگ fullscreen نوع کامل حفظ شود
  const fullscreenWidget = selectedWidget;

  // ── انتخابگر آیکون برای متن / دکمه / شمارنده / کارت اطلاعاتی ──
  const [iconPickerState, setIconPickerState] = useState<{ open: boolean; mode: 'text' | 'button' | 'richtext' | 'counter' | 'icon-box' }>({ open: false, mode: 'text' });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [cursorRange, setCursorRange] = useState<{ start: number; end: number } | null>(null);

  // refs ویرایشگر متن غنی (پایه در پنل و کامل در دیالوگ) — برای درج توکن آیکون
  const richtextEditorRef = useRef<WysiwygEditorHandle | null>(null);
  const richtextFullscreenEditorRef = useRef<WysiwygEditorHandle | null>(null);
  /** کدام ویرایشگر متن غنی درخواست درج آیکون داده است */
  const iconTargetRef = useRef<'inline' | 'fullscreen'>('inline');

  /** درج توکن آیکون در محتوای متنی (heading / text / richtext) */
  const insertIconToken = (iconName: string) => {
    if (!iconName) {
      setIconPickerState({ open: false, mode: 'text' });
      return;
    }
    const token = `[icon:${iconName}]`;
    const content = selectedWidget?.content || '';
    if (cursorRange && textareaRef.current) {
      const start = Math.min(cursorRange.start, content.length);
      const end = Math.min(cursorRange.end, content.length);
      const next = content.slice(0, start) + token + content.slice(end);
      onUpdateWidget({ ...selectedWidget!, content: next });
      // پس از رندر، مکان‌نما را بعد از توکن بگذار
      setTimeout(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          const pos = start + token.length;
          ta.setSelectionRange(pos, pos);
        }
      }, 0);
    } else {
      onUpdateWidget({ ...selectedWidget!, content: content + (content ? ' ' : '') + token });
    }
    setIconPickerState({ open: false, mode: 'text' });
  };

  /** تبدیل ارقام انگلیسی به فارسی در محتوای متنی (heading / text / accordion) —
   * اگر بخشی از textarea انتخاب شده باشد فقط همان، وگرنه کل متن */
  const convertContentDigitsToPersian = () => {
    if (!selectedWidget) return;
    const content = selectedWidget.content || '';
    const ta = textareaRef.current;
    const hasSelection = ta && ta.selectionStart !== ta.selectionEnd;
    if (hasSelection && ta) {
      const { selectionStart: start, selectionEnd: end } = ta;
      const next = content.slice(0, start) + toPersianDigits(content.slice(start, end)) + content.slice(end);
      onUpdateWidget({ ...selectedWidget, content: next });
      requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start, end); });
    } else {
      onUpdateWidget({ ...selectedWidget, content: toPersianDigits(content) });
    }
  };

  /** انتخاب آیکون برای دکمه */
  const selectButtonIcon = (iconName: string) => {
    if (selectedWidget) {
      onUpdateWidget({ ...selectedWidget, iconName: iconName || undefined });
    }
    setIconPickerState({ open: false, mode: 'button' });
  };

  /** درج آیکون در ویرایشگر متن غنی (WYSIWYG) — از طریق ref در محل مکان‌نما */
  const insertRichtextIcon = (iconName: string) => {
    const ref = iconTargetRef.current === 'fullscreen' ? richtextFullscreenEditorRef : richtextEditorRef;
    if (iconName) {
      ref.current?.insertIconToken(iconName);
    }
    setIconPickerState({ open: false, mode: 'text' });
  };

  // ── Data-source option lists (گروه‌ها و دسته‌بندی‌ها از وب‌سرویس) ──
  const [newsCategories, setNewsCategories] = useState<NewsCategory[]>([]);
  const [announcementGroups, setAnnouncementGroups] = useState<string[]>([]);
  const [mediaFolders, setMediaFolders] = useState<MediaFolderDto[]>([]);
  const [dataSourceError, setDataSourceError] = useState<string | null>(null);

  const activeDataSource = selectedWidget?.settings.binding.dataSource;
  const isDedicatedPageWidget = !!selectedWidget && selectedWidget.type.startsWith('dp-');
  const isFormWidget = !!selectedWidget && selectedWidget.type === 'form';

  // ── فهرست فرم‌های منتشرشده — فقط وقتی widget انتخاب‌شده از نوع 'form' است واکشی می‌شود ──
  const [availableForms, setAvailableForms] = useState<{ id: string; slug: string; title: string }[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);

  useEffect(() => {
    if (!isFormWidget) return;
    let cancelled = false;
    setIsLoadingForms(true);
    fetchForms({ per_page: 200, status: 'published,page_builder_only' })
      .then(result => {
        if (!cancelled) setAvailableForms(result.data.map(f => ({ id: f.id, slug: f.slug, title: f.title })));
      })
      .catch(err => {
        console.error('Failed to load forms for the picker:', err);
        if (!cancelled) setAvailableForms([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingForms(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isFormWidget]);

  useEffect(() => {
    let cancelled = false;
    setDataSourceError(null);

    if (activeDataSource === 'news') {
      fetchDataSourceNewsCategories()
        .then((cats) => { if (!cancelled) setNewsCategories(cats); })
        .catch(() => { if (!cancelled) setDataSourceError('خطا در دریافت دسته‌بندی اخبار'); });
    } else if (activeDataSource === 'gallery' || activeDataSource === 'files') {
      fetchDataSourceMediaFolders()
        .then((folders) => { if (!cancelled) setMediaFolders(folders); })
        .catch(() => { if (!cancelled) setDataSourceError('خطا در دریافت پوشه‌های رسانه'); });
    }

    return () => { cancelled = true; };
  }, [activeDataSource]);

  // ── بلوک گالری صفحهٔ اختصاصی: دسته‌بندی‌های صفحهٔ اختصاصیِ متصل به این لایوت ──
  // (بلوک‌های dp-* دیگر صفحه را دستی انتخاب نمی‌کنند — همان صفحه‌ای که این لایوت به آن متصل است)
  const [dedicatedPageTaxonomies, setDedicatedPageTaxonomies] = useState<DedicatedPageTaxonomyOption[]>([]);

  useEffect(() => {
    if (selectedWidget?.type !== 'dp-gallery' || !dedicatedPageId) {
      setDedicatedPageTaxonomies([]);
      return;
    }
    let cancelled = false;
    fetchDedicatedPageTaxonomiesForWidget(dedicatedPageId)
      .then((taxs) => { if (!cancelled) setDedicatedPageTaxonomies(taxs); })
      .catch(() => { if (!cancelled) setDedicatedPageTaxonomies([]); });
    return () => { cancelled = true; };
  }, [selectedWidget?.type, dedicatedPageId]);

  if (!selectedWidget && !selectedSection) {
    return (
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none rtl text-right">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
          <Sliders className="w-8 h-8" />
        </div>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-1">پنل تنظیمات و هوشمندی</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          برای ویرایش خصوصیات، تغییر استایل یا اتصال به ماژول داده، روی یکی از ویجت‌ها یا سکشن‌های بوم کلیک کنید.
        </p>
      </div>
    );
  }

  // ── دیالوگ نسخهٔ کامل ویرایشگر متن غنی (WYSIWYG) ──
  // این دیالوگ باید قبل از شاخهٔ ویجت/سکشن قرار بگیرد تا با کلیک روی دکمهٔ بزرگ‌نمایی نمایش داده شود
  if (richtextFullscreen && fullscreenWidget) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/70 backdrop-blur-sm select-none rtl text-right">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-teal-500" />
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">ویرایشگر کامل متن غنی</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  نوع ویجت: {getWidgetTypeLabel(fullscreenWidget.type)} — همهٔ ابزارها در دسترس است
                </p>
              </div>
            </div>
            <button
              onClick={() => setRichtextFullscreen(false)}
              className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
              title="بستن (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full Editor */}
          <div className="flex-1 overflow-y-auto p-4">
            <WysiwygEditor
              ref={richtextFullscreenEditorRef}
              content={fullscreenWidget.content}
              onChange={(html) => onUpdateWidget({ ...fullscreenWidget, content: html })}
              placeholder="متن غنی را بنویسید — تیتر، پاراگراف، لینک، تصویر و جدول..."
              minHeight="60vh"
              mode="full"
              onRequestCompact={() => setRichtextFullscreen(false)}
              showIconButton
              onRequestIcon={() => {
                iconTargetRef.current = 'fullscreen';
                setIconPickerState({ open: true, mode: 'text' });
              }}
            />
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between shrink-0">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              تغییرات به‌صورت زنده روی بوم اعمال می‌شود.
            </p>
            <button
              onClick={() => setRichtextFullscreen(false)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              اعمال و بستن
            </button>
          </div>
        </div>

        {/* انتخابگر آیکون — برای نسخهٔ کامل هم در دسترس است */}
        <IconPicker
          open={iconPickerState.open}
          onClose={() => setIconPickerState({ open: false, mode: 'text' })}
          title="انتخاب آیکون متن"
          onSelect={insertRichtextIcon}
        />
      </div>
    );
  }

  // ==============================================================
  // WIDGET INSPECTION LOGIC
  // ==============================================================
  if (selectedWidget) {
    const handleStyleChange = (key: keyof WidgetStyle, val: any) => {
      const newStyle: WidgetStyle = { ...selectedWidget.settings.style, [key]: val };
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          style: newStyle
        }
      });
    };

    const handleBindingChange = (key: keyof WidgetDataBinding, val: any) => {
      const newBinding: WidgetDataBinding = { ...selectedWidget.settings.binding, [key]: val };
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          binding: newBinding
        }
      });
    };

    const handleVisibilityToggle = (device: 'desktop' | 'tablet' | 'mobile') => {
      const vis = { ...selectedWidget.settings.visibility };
      vis[device] = !vis[device];
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          visibility: vis
        }
      });
    };

    const handleConditionalChange = (key: keyof ConditionalDisplayRule, val: any) => {
      const cond = { ...selectedWidget.settings.conditionalDisplay, [key]: val };
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          conditionalDisplay: cond
        }
      });
    };

    /** به‌روزرسانی فیلدهای سفارشی (customProps) بلوک */
    const updateCustomProps = (patch: Record<string, any>) => {
      onUpdateWidget({
        ...selectedWidget,
        settings: {
          ...selectedWidget.settings,
          customProps: {
            ...(selectedWidget.settings.customProps || {}),
            ...patch
          }
        }
      });
    };

    const customProps = selectedWidget.settings.customProps || {};

    /** افزودن تب جدید به ویجت تب‌ها — هر تب یک SectionInstance کامل و مستقل دارد */
    const addTab = () => {
      const tabs = [...(customProps.tabs || [])];
      const n = tabs.length + 1;
      const newColId = `col-${Date.now()}-1`;
      tabs.push({
        id: `tab-${Date.now()}`,
        label: `تب ${n}`,
        section: {
          id: `tab-section-${Date.now()}`,
          name: `محتوای تب ${n}`,
          layout: 'boxed',
          paddingTop: 24,
          paddingBottom: 24,
          columns: [{ id: newColId, width: 12, widths: { desktop: 12, tablet: 12, mobile: 12 }, widgets: [], subSections: [] }],
          visibility: { desktop: true, tablet: true, mobile: true },
          conditionalDisplay: { enabled: false, userRole: 'all' }
        }
      });
      updateCustomProps({ tabs });
    };

    const removeTab = (idx: number) => {
      const tabs = [...(customProps.tabs || [])];
      tabs.splice(idx, 1);
      updateCustomProps({ tabs });
    };

    const moveTab = (idx: number, dir: -1 | 1) => {
      const tabs = [...(customProps.tabs || [])];
      const target = idx + dir;
      if (target < 0 || target >= tabs.length) return;
      const t = tabs[idx];
      tabs[idx] = tabs[target];
      tabs[target] = t;
      updateCustomProps({ tabs });
    };

    /** افزودن/ویرایش/حذف مکان‌های ویجت نقشه تعاملی */
    const addLocation = () => {
      const locations = [...(customProps.locations || [])];
      locations.push({ id: `loc-${Date.now()}`, label: `مکان ${locations.length + 1}`, latitude: undefined, longitude: undefined, embedUrl: '', address: '' });
      updateCustomProps({ locations });
    };

    const updateLocation = (idx: number, patch: Record<string, any>) => {
      const locations = [...(customProps.locations || [])];
      locations[idx] = { ...locations[idx], ...patch };
      updateCustomProps({ locations });
    };

    const removeLocation = (idx: number) => {
      const locations = [...(customProps.locations || [])];
      locations.splice(idx, 1);
      updateCustomProps({ locations });
    };

    const moveLocation = (idx: number, dir: -1 | 1) => {
      const locations = [...(customProps.locations || [])];
      const target = idx + dir;
      if (target < 0 || target >= locations.length) return;
      const t = locations[idx];
      locations[idx] = locations[target];
      locations[target] = t;
      updateCustomProps({ locations });
    };

    /** آیتم‌های منوی نوار راهبری — اولویت: customProps.items ساختاریافته ← fallback: content (هر خط عنوان|لینک) ← [] */
    const navItems: { label: string; url: string; color?: string; fontSize?: number; animation?: string; bold?: boolean }[] =
      (customProps.items as any[]) && (customProps.items as any[]).length > 0
        ? (customProps.items as any[])
        : parseLines(
            selectedWidget.content && selectedWidget.content !== 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.'
              ? selectedWidget.content
              : ''
          ).map((p) => ({ label: p[0] || 'مورد', url: p[1] || '#' }));

    return (
      <>
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full select-none rtl text-right">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>ویرایش ویجت</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">{selectedWidget.title || selectedWidget.type}</div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicateWidget(selectedWidget)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-500 cursor-pointer"
              title="تکثیر ویجت"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteWidget(selectedWidget.id)}
              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
              title="حذف ویجت"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-around border-b border-gray-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-1">
          <button
            onClick={() => setInspectorTab('content')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              inspectorTab === 'content'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>محتوا و داده</span>
          </button>
          <button
            onClick={() => setInspectorTab('style')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              inspectorTab === 'style'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>ظاهر و استایل</span>
          </button>
          <button
            onClick={() => setInspectorTab('logic')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
              inspectorTab === 'logic'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>شرایط هوشمند</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* TAB 1: CONTENT & DATA BINDING */}
          {inspectorTab === 'content' && (
            <div className="space-y-4">
              {/* Common Title & Content Inputs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عنوان ویجت</label>
                  <span
                    className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black whitespace-nowrap"
                    title={`نوع ویجت: ${getWidgetTypeLabel(selectedWidget.type)}`}
                  >
                    {getWidgetTypeLabel(selectedWidget.type)}
                  </span>
                </div>
                <input
                  type="text"
                  value={selectedWidget.title}
                  onChange={(e) => onUpdateWidget({ ...selectedWidget, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {(selectedWidget.type === 'heading' || selectedWidget.type === 'text' || selectedWidget.type === 'accordion') && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">محتوای متنی</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const ta = textareaRef.current;
                          setCursorRange(ta ? { start: ta.selectionStart, end: ta.selectionEnd } : null);
                          setIconPickerState({ open: true, mode: 'text' });
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                        title="درج آیکون در متن (توکن [icon:name])"
                      >
                        <Sparkles className="w-3 h-3" />
                        درج آیکون
                      </button>
                      <button
                        type="button"
                        onClick={convertContentDigitsToPersian}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                        title="تبدیل اعداد انگلیسی به فارسی (روی متن انتخاب‌شده یا کل متن)"
                      >
                        <Languages className="w-3 h-3" />
                        تبدیل اعداد
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={4}
                    value={selectedWidget.content}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-400">برای درج آیکون یا متغیرِ صفحهٔ اختصاصی در دل متن، از دکمه‌های بالا استفاده کنید.</p>
                </div>
              )}

              {selectedWidget.type === 'stat-card' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">مقدار آمار</label>
                  <input
                    type="text"
                    value={selectedWidget.content}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                    placeholder="مثال: ۱,۴۲۰+"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[10px] text-slate-400">این مقدار همراه با «عنوان ویجت» (به‌عنوان برچسب بالای کارت) روی کارت آمار نمایش داده می‌شود.</p>
                </div>
              )}

              {selectedWidget.type === 'image' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آدرس اینترنتی تصویر (URL)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={selectedWidget.imageUrl || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, imageUrl: e.target.value })}
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-teal-600 dark:text-teal-400 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('widgetImage')}
                      className="shrink-0 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white transition-all cursor-pointer"
                      title="انتخاب از مدیریت رسانه"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {selectedWidget.type === 'button' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عنوان روی دکمه</label>
                    <input
                      type="text"
                      value={selectedWidget.buttonText || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, buttonText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آیکون دکمه (اختیاری)</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIconPickerState({ open: true, mode: 'button' })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          selectedWidget.iconName
                            ? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400'
                            : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400'
                        }`}
                      >
                        {selectedWidget.iconName ? (
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            {selectedWidget.iconName}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" />
                            انتخاب آیکون
                          </span>
                        )}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {selectedWidget.iconName && (
                        <button
                          type="button"
                          onClick={() => onUpdateWidget({ ...selectedWidget, iconName: undefined })}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          title="حذف آیکون"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لینک مقصد دکمه (HREF)</label>
                    <input
                      type="text"
                      value={selectedWidget.buttonUrl || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, buttonUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 cursor-pointer">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">باز شدن لینک در تب/صفحهٔ جدید</span>
                    <input
                      type="checkbox"
                      checked={selectedWidget.buttonTarget === 'new'}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, buttonTarget: e.target.checked ? 'new' : 'self' })}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                  </label>
                </>
              )}

              {selectedWidget.type === 'video' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آدرس اینترنتی ویدیو (URL)</label>
                    <input
                      type="text"
                      value={selectedWidget.videoUrl || ''}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, videoUrl: e.target.value })}
                      placeholder="https://... (لینک جاسازی یا فایل mp4)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-teal-600 dark:text-teal-400 focus:outline-none focus:border-teal-500"
                    />
                    <p className="text-[10px] text-slate-400">لینک جاسازی (iframe) یا فایل مستقیم mp4/webm/ogg</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ابعاد قاب (Aspect Ratio)</label>
                    <select
                      value={selectedWidget.settings.style.aspectRatio || '16 / 9'}
                      onChange={(e) => handleStyleChange('aspectRatio', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="16 / 9">۱۶ به ۹ (سینمایی)</option>
                      <option value="4 / 3">۴ به ۳</option>
                      <option value="1 / 1">۱ به ۱ (مربعی)</option>
                      <option value="auto">خودکار</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: 'videoAutoplay', label: 'پخش خودکار' },
                      { key: 'videoLoop', label: 'حلقه تکرار' },
                      { key: 'videoMuted', label: 'بی‌صدا' }
                    ] as const).map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedWidget.settings.style[key] === true}
                          onChange={(e) => handleStyleChange(key, e.target.checked)}
                          className="accent-teal-600 w-4 h-4"
                        />
                        {label}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedWidget.settings.style.videoControls !== false}
                        onChange={(e) => handleStyleChange('videoControls', e.target.checked)}
                        className="accent-teal-600 w-4 h-4"
                      />
                      نمایش کنترل‌ها
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تصویر پوستر (Poster) — اختیاری</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedWidget.settings.style.videoPoster || ''}
                        onChange={(e) => handleStyleChange('videoPoster', e.target.value)}
                        placeholder="https://... تصویر قبل از پخش"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setMediaPickerTarget('videoPoster')}
                        className="shrink-0 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white transition-all cursor-pointer"
                        title="انتخاب از مدیریت رسانه"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* ────────────────────────────────────────────────
                   NEW BLOCK TYPES — محتوای بلوک‌های جدید
              ──────────────────────────────────────────────── */}

              {/* ریش‌تکست / بلاک متن WYSIWYG */}
              {selectedWidget.type === 'richtext' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    محتوای HTML (ویرایشگر غنی)
                  </label>
                  <WysiwygEditor
                    ref={richtextEditorRef}
                    content={selectedWidget.content}
                    onChange={(html) => onUpdateWidget({ ...selectedWidget, content: html })}
                    placeholder="متن غنی را بنویسید — تیتر، پاراگراف، لینک، تصویر و جدول..."
                    minHeight="240px"
                    mode="basic"
                    showMaximize
                    onRequestFullscreen={() => setRichtextFullscreen(true)}
                    showIconButton
                    showVariableButton
                    onRequestIcon={() => {
                      iconTargetRef.current = 'inline';
                      setIconPickerState({ open: true, mode: 'richtext' });
                    }}
                  />
                  <p className="text-[10px] text-slate-400">
                    ویرایشگر WYSIWYG هم‌سطح مدیریت خبر — برای دسترسی به همهٔ ابزارها دکمهٔ بزرگ‌نمایی را بزنید.
                  </p>
                </div>
              )}

              {/* کارت اطلاعاتی */}
              {selectedWidget.type === 'icon-box' && (
                <>
                  {/* آیکون — با IconPicker */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آیکون</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIconPickerState({ open: true, mode: 'icon-box' })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          customProps.iconName || selectedWidget.iconName
                            ? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400'
                            : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        {customProps.iconName || selectedWidget.iconName || 'انتخاب آیکون'}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {(customProps.iconName || selectedWidget.iconName) && (
                        <button
                          type="button"
                          onClick={() => updateCustomProps({ iconName: undefined })}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          title="حذف آیکون"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* نوع چیدمان */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نوع چیدمان</label>
                    <select
                      value={customProps.layout || 'stack'}
                      onChange={(e) => updateCustomProps({ layout: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="stack">آیکون بالا — عنوان و توضیح زیر آن (عمودی)</option>
                      <option value="row">آیکون کنار عنوان — توضیح زیر (راست‌به‌چپ)</option>
                      <option value="row-reverse">آیکون کنار عنوان — توضیح زیر (چپ‌به‌راست)</option>
                      <option value="center">وسط‌چین — آیکون، عنوان و توضیح وسط</option>
                    </select>
                  </div>

                  {/* موقعیت کل کارت در ستون */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">موقعیت کارت در ستون</label>
                    <select
                      value={customProps.cardAlign || 'full'}
                      onChange={(e) => updateCustomProps({ cardAlign: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="full">تمام عرض ستون (پیش‌فرض)</option>
                      <option value="right">سمت راست</option>
                      <option value="center">وسط</option>
                      <option value="left">سمت چپ</option>
                    </select>
                  </div>

                  {/* تنظیمات آیکون */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ آیکون</label>
                      <ColorBox
                        value={customProps.iconColor || selectedWidget.settings.style.textColor || '#0f172a'}
                        onChange={(c) => updateCustomProps({ iconColor: c || undefined })}
                        className="w-full h-9"
                        clearable={!!customProps.iconColor}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اندازه آیکون (px)</label>
                      <input
                        type="number"
                        min={0}
                        value={customProps.iconSize ?? 24}
                        onChange={(e) => updateCustomProps({ iconSize: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ پس‌زمینه آیکون</label>
                    <ColorBox
                      value={customProps.iconBgColor === 'transparent' ? undefined : customProps.iconBgColor || 'rgba(20,184,166,0.1)'}
                      onChange={(c) => updateCustomProps({ iconBgColor: c === '' ? 'transparent' : c })}
                      className="w-full h-9"
                      clearable
                    />
                    <p className="text-[10px] text-slate-400">برای شفاف‌کردن پس‌زمینه، روی × داخل جعبهٔ رنگ بزنید.</p>
                  </div>

                  {/* خط دور آیکون */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ خط دور آیکون</label>
                      <ColorBox
                        value={customProps.iconBorderColor === 'transparent' ? undefined : customProps.iconBorderColor || 'rgba(20,184,166,0.2)'}
                        onChange={(c) => updateCustomProps({ iconBorderColor: c === '' ? 'transparent' : c })}
                        className="w-full h-9"
                        clearable
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ضخامت خط دور (px)</label>
                      <input
                        type="number"
                        min={0}
                        value={customProps.iconBorderWidth ?? 1}
                        onChange={(e) => updateCustomProps({ iconBorderWidth: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">برای حذف خط دور آیکون، ضخامت را ۰ کنید.</p>

                  {/* تنظیمات عنوان */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عنوان</label>
                    <div className="flex items-center gap-2">
                      <ColorBox
                        value={customProps.titleColor || selectedWidget.settings.style.textColor || '#0f172a'}
                        onChange={(c) => updateCustomProps({ titleColor: c || undefined })}
                        className="w-9 h-9"
                        clearable={!!customProps.titleColor}
                      />
                      <input
                        type="number"
                        min={0}
                        value={customProps.titleSize ?? 16}
                        onChange={(e) => updateCustomProps({ titleSize: parseInt(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        title="اندازه عنوان (px)"
                        placeholder="اندازه (px)"
                      />
                    </div>
                    <select
                      value={customProps.titleFont || 'Vazirmatn, sans-serif'}
                      onChange={(e) => updateCustomProps({ titleFont: e.target.value === 'Vazirmatn, sans-serif' ? undefined : e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="Vazirmatn, sans-serif">فونت عنوان: وزیرمتن (پیش‌فرض)</option>
                      <option value="Poppins, sans-serif">فونت عنوان: Poppins</option>
                      <option value="Inter, sans-serif">فونت عنوان: Inter</option>
                      <option value="Impact, sans-serif">فونت عنوان: Impact (برجسته)</option>
                      <option value="Allemand, serif">فونت عنوان: Allemand</option>
                    </select>
                  </div>

                  {/* تنظیمات توضیح */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">توضیح</label>
                    <div className="flex items-center gap-2">
                      <ColorBox
                        value={customProps.descColor || selectedWidget.settings.style.textColor || '#0f172a'}
                        onChange={(c) => updateCustomProps({ descColor: c || undefined })}
                        className="w-9 h-9"
                        clearable={!!customProps.descColor}
                      />
                      <input
                        type="number"
                        min={0}
                        value={customProps.descSize ?? 12}
                        onChange={(e) => updateCustomProps({ descSize: parseInt(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        title="اندازه توضیح (px)"
                        placeholder="اندازه (px)"
                      />
                    </div>
                    <select
                      value={customProps.descFont || 'Vazirmatn, sans-serif'}
                      onChange={(e) => updateCustomProps({ descFont: e.target.value === 'Vazirmatn, sans-serif' ? undefined : e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="Vazirmatn, sans-serif">فونت توضیح: وزیرمتن (پیش‌فرض)</option>
                      <option value="Poppins, sans-serif">فونت توضیح: Poppins</option>
                      <option value="Inter, sans-serif">فونت توضیح: Inter</option>
                      <option value="Impact, sans-serif">فونت توضیح: Impact (برجسته)</option>
                      <option value="Allemand, serif">فونت توضیح: Allemand</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">توضیح باکس</label>
                    <textarea
                      rows={3}
                      value={selectedWidget.content}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">متن دکمه (اختیاری)</label>
                    <input
                      type="text"
                      value={customProps.buttonText || ''}
                      onChange={(e) => updateCustomProps({ buttonText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لینک دکمه (اختیاری)</label>
                    <input
                      type="text"
                      value={customProps.buttonUrl || ''}
                      onChange={(e) => updateCustomProps({ buttonUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 cursor-pointer">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">باز شدن لینک در تب/صفحهٔ جدید</span>
                    <input
                      type="checkbox"
                      checked={customProps.buttonTarget === 'new'}
                      onChange={(e) => updateCustomProps({ buttonTarget: e.target.checked ? 'new' : 'self' })}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                  </label>
                </>
              )}

              {/* دربرگیرنده‌ها (عمودی/افقی) */}
              {(selectedWidget.type === 'vertical-container' || selectedWidget.type === 'horizontal-container') && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله بین زیربلوک‌ها (px)</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={customProps.gap ?? 16}
                      onChange={(e) => updateCustomProps({ gap: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">زیربلوک‌ها (هر خط یک آدرس تصویر یا متن)</label>
                    <textarea
                      rows={4}
                      value={(customProps.children || []).map((c: any) => c.content).join('\n')}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                        const children = lines.map((line, i) => ({
                          id: `child-${Date.now()}-${i}`,
                          type: 'text' as any,
                          title: `زیربلوک ${i + 1}`,
                          content: line,
                          settings: {
                            style: { textAlign: 'right' as const },
                            binding: { dataSource: 'none' as const },
                            visibility: { desktop: true, tablet: true, mobile: true },
                            conditionalDisplay: { enabled: false, userRole: 'all' as any }
                          }
                        }));
                        updateCustomProps({ children });
                      }}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {/* اسلایدر تصویر */}
              {selectedWidget.type === 'image-slider' && (
                <div className="space-y-3">
                  {/* منبع تصاویر */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      منبع تصاویر
                    </label>
                    <select
                      value={customProps.sliderSource || 'media'}
                      onChange={(e) => updateCustomProps({ sliderSource: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="media">مدیریت دارایی‌های دیجیتال (با عنوان)</option>
                      <option value="manual">آدرس دستی تصاویر</option>
                    </select>
                  </div>

                  {(customProps.sliderSource || 'media') === 'media' ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        پوشه رسانه (اختیاری)
                      </label>
                      <select
                        value={customProps.mediaFolder || 'all'}
                        onChange={(e) => updateCustomProps({ mediaFolder: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="all">همه پوشه‌ها</option>
                        {mediaFolders.map((f) => (
                          <option key={f.id} value={String(f.id)}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        تصاویر به همراه عنوان از رسانه دریافت می‌شوند.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        آدرس تصاویر (هر خط یک URL)
                      </label>
                      <textarea
                        rows={5}
                        value={(customProps.images || []).join('\n')}
                        onChange={(e) => {
                          const urls = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                          updateCustomProps({ images: urls });
                        }}
                        placeholder={'https://example.com/1.jpg\nhttps://example.com/2.jpg'}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                      />
                    </div>
                  )}

                  {/* حالت نمایش */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      حالت نمایش
                    </label>
                    <select
                      value={customProps.sliderMode || 'slideshow'}
                      onChange={(e) => updateCustomProps({ sliderMode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="slideshow">اسلایدشو (نمایش متوالی)</option>
                      <option value="thumbs">فهرست بندانگشتی + مشاهده Lightbox</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      حداکثر تعداد تصویر
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={customProps.sliderLimit || 10}
                      onChange={(e) => updateCustomProps({ sliderLimit: parseInt(e.target.value) || 10 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* شمارنده */}
              {selectedWidget.type === 'counter' && (
                <>
                  {/* آیکون شمارنده */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آیکون (اختیاری)</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIconPickerState({ open: true, mode: 'counter' })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          customProps.icon
                            ? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400'
                            : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-500 hover:text-teal-600 dark:hover:text-teal-400'
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        {customProps.icon || 'انتخاب آیکون'}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {customProps.icon && (
                        <button
                          type="button"
                          onClick={() => updateCustomProps({ icon: undefined })}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                          title="حذف آیکون"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">مقدار عددی هدف</label>
                    <input
                      type="number"
                      min={0}
                      value={customProps.target ?? 100}
                      onChange={(e) => updateCustomProps({ target: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">مدت زمان انیمیشن (میلی‌ثانیه)</label>
                    <input
                      type="number"
                      min={300}
                      max={5000}
                      step={100}
                      value={customProps.duration ?? 1200}
                      onChange={(e) => updateCustomProps({ duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پیشوند</label>
                      <input
                        type="text"
                        value={customProps.prefix || ''}
                        onChange={(e) => updateCustomProps({ prefix: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پسوند</label>
                      <input
                        type="text"
                        value={customProps.suffix ?? '+'}
                        onChange={(e) => updateCustomProps({ suffix: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  {/* رنگ و اندازه عدد + رنگ آیکون */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ عدد</label>
                      <ColorBox
                        value={customProps.numberColor || selectedWidget.settings.style.textColor}
                        onChange={(c) => updateCustomProps({ numberColor: c })}
                        className="w-full h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ آیکون</label>
                      <ColorBox
                        value={customProps.iconColor || customProps.numberColor || selectedWidget.settings.style.textColor}
                        onChange={(c) => updateCustomProps({ iconColor: c })}
                        className="w-full h-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اندازه عدد (px)</label>
                      <input
                        type="number"
                        min={12}
                        max={120}
                        value={customProps.numberFontSize || 36}
                        onChange={(e) => updateCustomProps({ numberFontSize: parseInt(e.target.value) || 36 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اندازه کپشن (px)</label>
                      <input
                        type="number"
                        min={10}
                        max={48}
                        value={customProps.captionFontSize || 12}
                        onChange={(e) => updateCustomProps({ captionFontSize: parseInt(e.target.value) || 12 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  {/* اندازه آیکون + فاصله بین اجزا */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اندازه آیکون (px)</label>
                      <input
                        type="number"
                        min={8}
                        max={128}
                        value={customProps.iconSize ?? 32}
                        onChange={(e) => updateCustomProps({ iconSize: parseInt(e.target.value) || 32 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله بین اجزا (px)</label>
                      <input
                        type="number"
                        min={0}
                        max={48}
                        value={customProps.gap ?? 6}
                        onChange={(e) => updateCustomProps({ gap: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  {/* چیدمان (عمودی/افقی) + تراز محتوا */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حالت چیدمان</label>
                      <select
                        value={customProps.layout || 'stacked'}
                        onChange={(e) => updateCustomProps({ layout: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="stacked">عمودی (آیکون بالا)</option>
                        <option value="inline">افقی (آیکون کنار عدد)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تراز محتوا</label>
                      <select
                        value={customProps.align || 'center'}
                        onChange={(e) => updateCustomProps({ align: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="center">وسط</option>
                        <option value="start">راست</option>
                        <option value="end">چپ</option>
                      </select>
                    </div>
                  </div>
                  {/* متن زیر عدد (کپشن) — به‌جای عنوان ویجت */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      متن زیر عدد (کپشن) — به‌جای عنوان ویجت نمایش داده می‌شود
                    </label>
                    <textarea
                      rows={2}
                      value={
                        selectedWidget.content && selectedWidget.content !== 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.'
                          ? selectedWidget.content
                          : ''
                      }
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                      placeholder="مثلاً: دانشجویان فعال"
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ کپشن</label>
                    <ColorBox
                      value={customProps.captionColor || selectedWidget.settings.style.textColor}
                      onChange={(c) => updateCustomProps({ captionColor: c })}
                      className="w-full h-9"
                    />
                  </div>
                </>
              )}

              {/* پیمایشگر */}
              {selectedWidget.type === 'navigator' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تایپ محتوا</label>
                    <select
                      value={customProps.postType || 'صفحه'}
                      onChange={(e) => updateCustomProps({ postType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="صفحه">برگه‌ها (صفحات)</option>
                      <option value="نوشته">نوشته‌ها (بلاگ)</option>
                      <option value="خبر">اخبار</option>
                      <option value="اطلاعیه">اطلاعیه‌ها</option>
                      <option value="دسته">دسته‌بندی دلخواه</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      فهرست آیتم‌ها (هر خط: عنوان|لینک)
                    </label>
                    <textarea
                      rows={5}
                      value={(customProps.items || []).map((i: any) => `${i.label}|${i.url}`).join('\n')}
                      onChange={(e) => {
                        const items = e.target.value
                          .split('\n')
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [label, url] = line.split('|');
                            return { label: label || 'مورد', url: url || '#' };
                          });
                        updateCustomProps({ items });
                      }}
                      placeholder={'صفحه اصلی|/\nدرباره ما|/about'}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                    />
                  </div>
                </>
              )}

              {/* تب‌ها — هر تب یک SectionInstance کامل و مستقل دارد */}
              {selectedWidget.type === 'tabs' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تب‌ها</label>
                  {(customProps.tabs || []).map((tab: any, idx: number) => (
                    <div key={tab.id} className="rounded-xl border border-gray-200 dark:border-slate-800 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tab.label}
                          onChange={(e) => {
                            const tabs = [...(customProps.tabs || [])];
                            tabs[idx] = { ...tabs[idx], label: e.target.value };
                            updateCustomProps({ tabs });
                          }}
                          placeholder="برچسب تب"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => moveTab(idx, -1)}
                          disabled={idx === 0}
                          title="جابه‌جایی به بالا"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTab(idx, 1)}
                          disabled={idx === (customProps.tabs || []).length - 1}
                          title="جابه‌جایی به پایین"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTab(idx)}
                          title="حذف تب"
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditTabSection && onEditTabSection(selectedWidget.id, idx)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        ویرایش محتوای این تب
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTab}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> افزودن تب جدید
                  </button>
                  {(customProps.tabs || []).length === 0 && (
                    <p className="text-[10px] text-slate-400">هنوز هیچ تبی اضافه نشده — با دکمه بالا اولین تب را بسازید.</p>
                  )}
                </div>
              )}

              {/* نقشه تعاملی — سوئیچ بین چند مکان، هرکدام با مختصات دقیق یا لینک جاسازی دستی */}
              {selectedWidget.type === 'interactive-map' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">مکان‌ها</label>
                  {(customProps.locations || []).map((loc: any, idx: number) => (
                    <div key={loc.id} className="rounded-xl border border-gray-200 dark:border-slate-800 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={loc.label}
                          onChange={(e) => updateLocation(idx, { label: e.target.value })}
                          placeholder="برچسب مکان"
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                        <button type="button" onClick={() => moveLocation(idx, -1)} disabled={idx === 0} title="جابه‌جایی به بالا" className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 cursor-pointer">
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => moveLocation(idx, 1)} disabled={idx === (customProps.locations || []).length - 1} title="جابه‌جایی به پایین" className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 disabled:opacity-30 cursor-pointer">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => removeLocation(idx)} title="حذف مکان" className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="any"
                          value={loc.latitude ?? ''}
                          onChange={(e) => updateLocation(idx, { latitude: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                          placeholder="عرض جغرافیایی (Lat)"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                        <input
                          type="number"
                          step="any"
                          value={loc.longitude ?? ''}
                          onChange={(e) => updateLocation(idx, { longitude: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                          placeholder="طول جغرافیایی (Lng)"
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={loc.address || ''}
                        onChange={(e) => updateLocation(idx, { address: e.target.value })}
                        placeholder="نشانی نمایشی (اختیاری)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                      <input
                        type="text"
                        value={loc.embedUrl || ''}
                        onChange={(e) => updateLocation(idx, { embedUrl: e.target.value })}
                        placeholder="لینک embed دستی (فقط در نبود مختصات استفاده می‌شود)"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] text-indigo-500 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLocation}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> افزودن مکان جدید
                  </button>
                  <p className="text-[10px] text-slate-400">با پر کردن عرض/طول جغرافیایی، نقشه دقیقاً روی همان مختصات ساخته می‌شود (اولویت با مختصات است). در غیر این صورت لینک embed دستی استفاده می‌شود.</p>
                </div>
              )}

              {/* جدول اکسل — آپلود و پردازش یک‌باره در همین‌جا */}
              {selectedWidget.type === 'excel-table' && (
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فایل اکسل (ردیف اول = سرستون‌ها)</label>
                  {(customProps.rows || []).length > 0 ? (
                    <div className="rounded-xl border border-gray-200 dark:border-slate-800 p-3 space-y-2 bg-slate-50 dark:bg-slate-950">
                      <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold truncate">{customProps.sourceFileName || 'فایل اکسل'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {(customProps.columns || []).length} ستون، {(customProps.rows || []).length} ردیف
                      </p>
                      <button
                        type="button"
                        onClick={() => updateCustomProps({ columns: [], rows: [], sourceFileName: undefined })}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                      >
                        <FileX className="w-3.5 h-3.5" /> پاکسازی و آپلود مجدد
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer hover:border-teal-500 hover:text-teal-600 transition-all">
                      <Upload className="w-6 h-6" />
                      <span className="text-xs font-bold">{excelUploading ? 'در حال پردازش فایل...' : 'انتخاب فایل اکسل (.xlsx)'}</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        disabled={excelUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          setExcelError(null);
                          setExcelUploading(true);
                          try {
                            const XLSX = await import('xlsx');
                            const bytes = await file.arrayBuffer();
                            const wb = XLSX.read(bytes, { type: 'array' });
                            const ws = wb.Sheets[wb.SheetNames[0]];
                            const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
                            if (!rawRows.length) throw new Error('فایل خالی است');
                            const columns = (rawRows[0] || []).map((c: any) => String(c ?? ''));
                            const dataRows = rawRows.slice(1).map((r) => columns.map((_: string, i: number) => String(r[i] ?? '')));
                            updateCustomProps({ columns, rows: dataRows, sourceFileName: file.name });
                          } catch (err) {
                            setExcelError('خواندن فایل اکسل ناموفق بود — قالب فایل را بررسی کنید.');
                          } finally {
                            setExcelUploading(false);
                          }
                        }}
                      />
                    </label>
                  )}
                  {excelError && <p className="text-[10px] text-rose-500 font-bold">{excelError}</p>}
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customProps.enableSearch !== false}
                      onChange={(e) => updateCustomProps({ enableSearch: e.target.checked })}
                      className="accent-teal-600 w-4 h-4"
                    />
                    نمایش کادر جستجو در بالای جدول
                  </label>

                  {/* اسکرول برای داده‌های طولانی */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حداکثر ارتفاع جدول برای اسکرول عمودی (px) — خالی = بدون محدودیت</label>
                    <input
                      type="number"
                      min={0}
                      value={customProps.maxHeight ?? ''}
                      onChange={(e) => updateCustomProps({ maxHeight: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                      placeholder="مثلاً 420"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                    <p className="text-[10px] text-slate-400">با تعیین ارتفاع، هدر جدول ثابت (sticky) می‌ماند و بدنه به‌صورت عمودی اسکرول می‌شود.</p>
                  </div>

                  {/* رنگ‌بندی هدر و رکوردها */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ‌بندی هدر و رکوردها</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">پس‌زمینه هدر</span>
                        <ColorBox value={customProps.headerBgColor || '#0f172a'} onChange={(c) => updateCustomProps({ headerBgColor: c })} className="w-full h-9" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">متن هدر</span>
                        <ColorBox value={customProps.headerTextColor || '#ffffff'} onChange={(c) => updateCustomProps({ headerTextColor: c })} className="w-full h-9" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">پس‌زمینه ردیف‌ها</span>
                        <ColorBox value={customProps.rowBgColor || ''} onChange={(c) => updateCustomProps({ rowBgColor: c || undefined })} className="w-full h-9" clearable />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">پس‌زمینه ردیف‌های زوج (راه‌راه)</span>
                        <ColorBox value={customProps.rowAltBgColor || ''} onChange={(c) => updateCustomProps({ rowAltBgColor: c || undefined })} className="w-full h-9" clearable />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">رنگ متن ردیف‌ها</span>
                        <ColorBox value={customProps.rowTextColor || ''} onChange={(c) => updateCustomProps({ rowTextColor: c || undefined })} className="w-full h-9" clearable />
                      </div>
                    </div>
                  </div>

                  {/* تقسیم‌بندی داده‌ها بر اساس یکی از ستون‌ها */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تقسیم‌بندی داده‌ها بر اساس ستون (فیلتر گروهی)</label>
                    <select
                      value={customProps.groupByColumn || ''}
                      onChange={(e) => updateCustomProps({ groupByColumn: e.target.value || undefined })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">بدون تقسیم‌بندی</option>
                      {(customProps.columns || []).map((c: string) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">با انتخاب یک ستون، بالای جدول دکمه‌های فیلتر بر اساس مقادیر یکتای همان ستون نمایش داده می‌شود.</p>
                  </div>
                </div>
              )}

              {/* نوار راهبری (منو) */}
              {selectedWidget.type === 'nav-menu' && (
                <>
                  {/* ── عنوان برند ── */}
                  <div className="rounded-xl border border-gray-200 dark:border-slate-800 p-3 space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عنوان برند</label>
                    <input
                      type="text"
                      value={customProps.brand || ''}
                      onChange={(e) => updateCustomProps({ brand: e.target.value })}
                      placeholder="معاونت آموزشی و تحصیلات تکمیلی"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">رنگ برند</label>
                        <ColorBox
                          value={customProps.brandColor}
                          onChange={(c) => updateCustomProps({ brandColor: c })}
                          className="w-full h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">اندازه (px)</label>
                        <input
                          type="number"
                          min={10}
                          max={64}
                          value={customProps.brandFontSize || 14}
                          onChange={(e) => updateCustomProps({ brandFontSize: parseInt(e.target.value) || 14 })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">موقعیت برند</label>
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                        {([
                          { v: 'start', l: 'راست' },
                          { v: 'center', l: 'وسط' },
                          { v: 'end', l: 'چپ' }
                        ] as const).map(({ v, l }) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => updateCustomProps({ brandPosition: v })}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                              (customProps.brandPosition || 'start') === v ? 'bg-teal-500 text-slate-950' : 'text-slate-500'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── آیتم‌های منو ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آیتم‌های منو</label>
                      <button
                        type="button"
                        onClick={() => updateCustomProps({ items: [...navItems, { label: '', url: '#' }] })}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        افزودن آیتم
                      </button>
                    </div>
                    {navItems.map((item, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 dark:border-slate-800 p-2.5 space-y-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 shrink-0 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-black flex items-center justify-center">
                            {i + 1}
                          </span>
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => {
                              const next = [...navItems];
                              next[i] = { ...next[i], label: e.target.value };
                              updateCustomProps({ items: next });
                            }}
                            placeholder="عنوان (مثلاً: درباره ما)"
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                          />
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => {
                              const next = [...navItems];
                              [next[i - 1], next[i]] = [next[i], next[i - 1]];
                              updateCustomProps({ items: next });
                            }}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-all"
                            title="انتقال به بالا"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={i === navItems.length - 1}
                            onClick={() => {
                              const next = [...navItems];
                              [next[i], next[i + 1]] = [next[i + 1], next[i]];
                              updateCustomProps({ items: next });
                            }}
                            className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-teal-600 dark:hover:text-teal-400 cursor-pointer transition-all"
                            title="انتقال به پایین"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateCustomProps({ items: navItems.filter((_, idx) => idx !== i) })}
                            className="p-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                            title="حذف آیتم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          dir="ltr"
                          value={item.url}
                          onChange={(e) => {
                            const next = [...navItems];
                            next[i] = { ...next[i], url: e.target.value };
                            updateCustomProps({ items: next });
                          }}
                          placeholder="/about یا #services"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 dark:text-indigo-400 focus:outline-none focus:border-teal-500"
                        />
                        <div className="grid grid-cols-2 gap-1.5 items-end">
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-slate-400 block">رنگ</label>
                            <ColorBox
                              value={item.color}
                              onChange={(c) => {
                                const next = [...navItems];
                                next[i] = { ...next[i], color: c };
                                updateCustomProps({ items: next });
                              }}
                              className="w-full h-7"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-slate-400 block">اندازه (px)</label>
                            <input
                              type="number"
                              min={10}
                              max={48}
                              value={item.fontSize ?? ''}
                              placeholder="13"
                              onChange={(e) => {
                                const v = parseInt(e.target.value);
                                const next = [...navItems];
                                next[i] = { ...next[i], fontSize: Number.isNaN(v) ? undefined : v };
                                updateCustomProps({ items: next });
                              }}
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 items-end">
                          <div className="space-y-0.5">
                            <label className="text-[9px] font-bold text-slate-400 block">انیمیشن</label>
                            <select
                              value={item.animation || ''}
                              onChange={(e) => {
                                const next = [...navItems];
                                next[i] = { ...next[i], animation: e.target.value || undefined };
                                updateCustomProps({ items: next });
                              }}
                              className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                            >
                              <option value="">پیش‌فرض</option>
                              <option value="none">بدون انیمیشن</option>
                              <option value="underline">خط زیرین</option>
                              <option value="fade">محو شدن</option>
                              <option value="slide">جابجایی</option>
                              <option value="pulse">تپش</option>
                            </select>
                          </div>
                          <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!item.bold}
                              onChange={(e) => {
                                const next = [...navItems];
                                next[i] = { ...next[i], bold: e.target.checked };
                                updateCustomProps({ items: next });
                              }}
                              className="accent-teal-600 w-3.5 h-3.5"
                            />
                            ضخیم
                          </label>
                        </div>
                      </div>
                    ))}
                    {navItems.length === 0 && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-3 text-center leading-relaxed">
                        هنوز آیتمی ندارید — با «افزودن آیتم» شروع کنید.
                      </p>
                    )}
                  </div>

                  {/* ── تنظیمات پیش‌فرض آیتم‌ها ── */}
                  <div className="rounded-xl border border-gray-200 dark:border-slate-800 p-3 space-y-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تنظیمات پیش‌فرض آیتم‌ها</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">رنگ متن</label>
                        <ColorBox
                          value={customProps.itemColor}
                          onChange={(c) => updateCustomProps({ itemColor: c })}
                          className="w-full h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">رنگ هاور</label>
                        <ColorBox
                          value={customProps.itemHoverColor}
                          onChange={(c) => updateCustomProps({ itemHoverColor: c })}
                          className="w-full h-8"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">اندازه متن (px)</label>
                        <input
                          type="number"
                          min={10}
                          max={48}
                          value={customProps.itemFontSize || 13}
                          onChange={(e) => updateCustomProps({ itemFontSize: parseInt(e.target.value) || 13 })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">انیمیشن</label>
                        <select
                          value={customProps.itemAnimation || 'underline'}
                          onChange={(e) => updateCustomProps({ itemAnimation: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="none">بدون انیمیشن</option>
                          <option value="underline">خط زیرین</option>
                          <option value="fade">محو شدن</option>
                          <option value="slide">جابجایی</option>
                          <option value="pulse">تپش</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">تراز نوار منو</label>
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                        {([
                          { v: 'start', l: 'راست' },
                          { v: 'center', l: 'وسط' },
                          { v: 'end', l: 'چپ' }
                        ] as const).map(({ v, l }) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => updateCustomProps({ menuPosition: v })}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                              (customProps.menuPosition || 'start') === v ? 'bg-teal-500 text-slate-950' : 'text-slate-500'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    برای نوار چسبان، وضعیت «چسبان (sticky)» را از بخش موقعیت سکشن انتخاب کنید و پس‌زمینه را روی همان سکشن تنظیم کنید.
                  </p>
                </>
              )}

              {/* لیست زیرصفحه‌ها */}
              {selectedWidget.type === 'child-pages' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      نحوهٔ نمایش
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCustomProps({ mode: 'tree' })}
                        className={`text-right px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          (customProps.mode ?? 'tree') === 'tree'
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-teal-500/40'
                        }`}
                      >
                        درختی — همهٔ زیرمجموعه‌ها زیر همین صفحه
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCustomProps({ mode: 'direct' })}
                        className={`text-right px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                          customProps.mode === 'direct'
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-300'
                            : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-teal-500/40'
                        }`}
                      >
                        هر صفحه فقط زیرصفحه‌های خودش
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      حداکثر تعداد زیرصفحه‌ها (Limit)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={customProps.limit ?? 12}
                      onChange={(e) =>
                        updateCustomProps({ limit: Math.max(1, Math.min(100, parseInt(e.target.value) || 12)) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                    در حالت درختی، زیر هر زیرصفحه نام زیرصفحه‌های آن نیز به‌صورت تودرتو فهرست می‌شود؛ در حالت دوم، هر صفحه فقط زیرصفحه‌های مستقیم خودش را نشان می‌دهد.
                  </p>
                </>
              )}

              {/* نقشه */}
              {selectedWidget.type === 'map' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عرض جغرافیایی (Latitude)</label>
                      <input
                        type="number"
                        step="any"
                        value={customProps.latitude ?? ''}
                        onChange={(e) => updateCustomProps({ latitude: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                        placeholder="31.8967"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">طول جغرافیایی (Longitude)</label>
                      <input
                        type="number"
                        step="any"
                        value={customProps.longitude ?? ''}
                        onChange={(e) => updateCustomProps({ longitude: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                        placeholder="54.3562"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">با پر کردن عرض/طول جغرافیایی، نقشه دقیقاً روی همان مختصات با یک نشانگر ساخته می‌شود (اولویت با مختصات است). برای موقعیت‌یابی مختصات از گوگل‌مپ (کلیک راست روی نقطه) استفاده کنید.</p>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لینک جاسازی نقشه (Embed URL) — در صورت خالی بودن مختصات بالا</label>
                    <input
                      type="text"
                      value={customProps.embedUrl || ''}
                      onChange={(e) => updateCustomProps({ embedUrl: e.target.value })}
                      placeholder="https://www.google.com/maps?q=Yazd&output=embed"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نشانی نمایشی</label>
                    <input
                      type="text"
                      value={customProps.address || ''}
                      onChange={(e) => updateCustomProps({ address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {/* اطلاعات تماس */}
              {selectedWidget.type === 'contact-info' && (
                <>
                  {(
                    [
                      ['phone', 'تلفن'],
                      ['email', 'ایمیل'],
                      ['address', 'نشانی'],
                      ['workHours', 'ساعات کاری']
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label}</label>
                      <input
                        type="text"
                        value={customProps[key] || ''}
                        onChange={(e) => updateCustomProps({ [key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  ))}
                </>
              )}

              {/* HTML دلخواه */}
              {selectedWidget.type === 'custom-html' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">کد HTML / اسکریپت</label>
                  <textarea
                    rows={7}
                    value={selectedWidget.content}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                    placeholder={'<div>کد دلخواه شما...</div>'}
                    className="w-full p-3 rounded-xl bg-slate-950 text-xs text-emerald-400 border border-gray-800 focus:outline-none focus:border-teal-500 leading-relaxed"
                    dir="ltr"
                  />
                </div>
              )}

              {/* لینک‌های اجتماعی */}
              {selectedWidget.type === 'social-links' && (
                <>
                  <p className="text-[10px] text-slate-400">آدرس شبکه‌های اجتماعی را وارد کنید (خالی = نمایش آیکون بدون لینک)</p>
                  {(
                    [
                      ['telegram', 'تلگرام'],
                      ['instagram', 'اینستاگرام'],
                      ['twitter', 'توییتر'],
                      ['linkedin', 'لینکدین'],
                      ['youtube', 'یوتیوب'],
                      ['whatsapp', 'واتساپ']
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{label}</label>
                      <input
                        type="text"
                        value={(customProps.urls || {})[key] || ''}
                        onChange={(e) =>
                          updateCustomProps({ urls: { ...(customProps.urls || {}), [key]: e.target.value } })
                        }
                        placeholder="https://..."
                        dir="ltr"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  ))}
                </>
              )}

              {/* دکمه‌های اشتراک‌گذاری */}
              {selectedWidget.type === 'share-buttons' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    لینک صفحه برای اشتراک (اختیاری — خالی = آدرس فعلی)
                  </label>
                  <input
                    type="text"
                    value={customProps.pageUrl || ''}
                    onChange={(e) => updateCustomProps({ pageUrl: e.target.value })}
                    dir="ltr"
                    placeholder="https://sau.ac.ir/page"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-indigo-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {/* جدول قیمت */}
              {selectedWidget.type === 'pricing-table' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400">
                    هر خط یک پلن: نام|قیمت|ویژگی۱،ویژگی۲|پیشنهادی(اختیاری yes)
                  </p>
                  <textarea
                    rows={6}
                    value={(customProps.plans || []).map((p: any) => `${p.name}|${p.price}|${(p.features || []).join('،')}|${p.highlight ? 'yes' : 'no'}`).join('\n')}
                    onChange={(e) => {
                      const plans = e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((line) => {
                          const parts = line.split('|');
                          return {
                            name: parts[0] || 'پلن',
                            price: parts[1] || 'رایگان',
                            features: (parts[2] || '').split(/[،,]/).map((f) => f.trim()).filter(Boolean),
                            highlight: (parts[3] || '').trim() === 'yes'
                          };
                        });
                      updateCustomProps({ plans });
                    }}
                    placeholder={'پایه|رایگان|۱ نوشته\nحرفه‌ای|۱۵۰۰۰۰۰|۱۰ نوشته،پشتیبانی|yes'}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 leading-relaxed"
                  />
                </div>
              )}

              {/* نظر کاربر */}
              {selectedWidget.type === 'testimonial' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">متن نظر</label>
                    <textarea
                      rows={3}
                      value={selectedWidget.content}
                      onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نام کاربر</label>
                      <input
                        type="text"
                        value={customProps.author || ''}
                        onChange={(e) => updateCustomProps({ author: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نقش کاربر</label>
                      <input
                        type="text"
                        value={customProps.role || ''}
                        onChange={(e) => updateCustomProps({ role: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* کال‌اوت / آیکون — انتخاب آیکون */}
              {(selectedWidget.type === 'callout' || selectedWidget.type === 'icon') && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">آیکون</label>
                  <select
                    value={selectedWidget.iconName || 'info'}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, iconName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {ICON_CHOICES.map((ic) => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedWidget.type === 'callout' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">متن کال‌اوت</label>
                  <textarea
                    rows={3}
                    value={selectedWidget.content}
                    onChange={(e) => onUpdateWidget({ ...selectedWidget, content: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              {/* DATA BINDING CONTROLS FOR DYNAMIC WIDGETS — بلوک‌های dp-* و form از بخش‌های جداگانهٔ زیر استفاده می‌کنند */}
              {!isDedicatedPageWidget && !isFormWidget && (
              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
                  <Database className="w-3.5 h-3.5" />
                  <span>تنظیمات ماژول و اتصال داده (Smart Binding)</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">منبع داده متصل</label>
                  <select
                    value={selectedWidget.settings.binding.dataSource}
                    onChange={(e) => handleBindingChange('dataSource', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="none">بدون اتصال به ماژول (استاتیک)</option>
                    <option value="announcements">ماژول اطلاعیه‌های دانشگاهی</option>
                    <option value="news">ماژول مدیریت اخبار و مقالات</option>
                    <option value="gallery">آلبوم گالری رسانه‌ها</option>
                    <option value="awards">ماژول افتخارات و جوایز</option>
                    <option value="staff">سامانه پرسنلی اساتید و مدیران</option>
                    <option value="files">مدیریت فایل و مخزن اسناد</option>
                  </select>
                </div>

                {selectedWidget.settings.binding.dataSource !== 'none' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حداکثر تعداد آیتم‌ها</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={selectedWidget.settings.binding.limit || 4}
                        onChange={(e) => handleBindingChange('limit', parseInt(e.target.value) || 4)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حالت چیدمان و ساختار نمایش</label>
                      <select
                        value={selectedWidget.settings.binding.displayMode || (activeDataSource === 'files' ? 'list' : 'grid')}
                        onChange={(e) => handleBindingChange('displayMode', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        {activeDataSource === 'files' ? (
                          <>
                            <option value="list">لیست فایل‌ها (List)</option>
                            <option value="grid">شبکه کارتی (Grid)</option>
                            <option value="boxes">کادر کوچک فایلی (File Box)</option>
                            <option value="table">جدول کامل (Table)</option>
                          </>
                        ) : activeDataSource === 'news' ? (
                          <>
                            <option value="list">نمایش لیستی (List)</option>
                            <option value="grid">نمایش شبکه‌ای / کارتی (Grid)</option>
                            <option value="grid-overlay">کارت با عنوان روی تصویر (Overlay)</option>
                            <option value="featured">نمایش برجسته / ویژه (Featured)</option>
                            <option value="carousel">خبرهای ویژه (Carousel)</option>
                            <option value="timeline">خط زمانی اخبار (Timeline)</option>
                            <option value="numbered-list">لیست شماره‌دار (Numbered List)</option>
                            <option value="horizontal-list">لیست افقی (Horizontal List)</option>
                            <option value="masonry">چیدمان موزاییکی (Masonry)</option>
                            <option value="date-based">گروه‌بندی بر اساس تاریخ (Date-based)</option>
                            <option value="ticker">تیک خبر فوری (Breaking News / Ticker)</option>
                            <option value="tabbed">خبرهای زبانه‌دار (Tabbed)</option>
                            <option value="accordion">اخبار آکاردئونی (Accordion)</option>
                            <option value="load-more">نمایش بیشتر (Load More)</option>
                            <option value="infinite-scroll">اسکرول بی‌نهایت (Infinite Scroll)</option>
                            <option value="mixed">چیدمان کنار هم (Sidebar / Mixed)</option>
                            <option value="multi-section">اخبار چندبخشی (Multi-Section)</option>
                            <option value="combined">اخبار ترکیبی (Combined)</option>
                            <option value="date-badge">اخبار با تاریخ برجسته (Date Badge)</option>
                            <option value="magazine">نمایش مجله‌ای (Magazine)</option>
                            <option value="full-width-slider">اسلایدشو تمام عرض (Full-width Slider)</option>
                            <option value="featured-list">خبر اصلی + اخبار فرعی (Featured + Sub)</option>
                          </>
                        ) : (
                          <>
                            <option value="grid">شبکه‌ای (Grid)</option>
                            <option value="list">لیست عمودی (List)</option>
                            <option value="carousel">اسلایدر کروسل (Carousel)</option>
                            <option value="masonry">موزاییکی (Masonry)</option>
                            <option value="timeline">تایم‌لاین زمانی (Timeline)</option>
                            <option value="table">جدول همراه با سورت (Table)</option>
                          </>
                        )}
                      </select>
                    </div>

                    {/* ── نوع فایل‌های نمایشی ویجت مخزن اسناد ── */}
                    {activeDataSource === 'files' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          نوع فایل‌های نمایشی
                        </label>
                        <select
                          value={selectedWidget.settings.binding.fileType || 'document'}
                          onChange={(e) => handleBindingChange('fileType', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="document">اسناد (غیر تصویری)</option>
                          <option value="all">همه انواع فایل</option>
                          <option value="image">فقط تصاویر</option>
                          <option value="video">فقط ویدیوها</option>
                          <option value="audio">فقط صداها</option>
                        </select>
                      </div>
                    )}

                    {/* ── تعداد کارت در هر ردیف (حالت شبکه‌ای / کادر فایلی) ── */}
                    {(activeDataSource === 'files' &&
                      ['grid', 'boxes'].includes(
                        selectedWidget.settings.binding.displayMode || 'list'
                      )) ||
                    (activeDataSource === 'news' &&
                      ['grid', 'grid-overlay', 'masonry', 'infinite-scroll', 'mixed'].includes(
                        selectedWidget.settings.binding.displayMode || 'grid'
                      )) ? (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            تعداد کارت در هر ردیف
                          </label>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => handleBindingChange('columnsCount', n)}
                                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                  (selectedWidget.settings.binding.columnsCount || 3) === n
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-teal-500/40'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}

                    {/* ── نمایش تصویر در لیست اخبار ── */}
                    {activeDataSource === 'news' &&
                      (selectedWidget.settings.binding.displayMode || 'grid') === 'list' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            نمایش تصویر در لیست اخبار
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              handleBindingChange('newsListImage', !selectedWidget.settings.binding.newsListImage)
                            }
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                              selectedWidget.settings.binding.newsListImage
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <span>لیست با تصویر بندانگشتی</span>
                            <span
                              className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${
                                selectedWidget.settings.binding.newsListImage ? 'bg-teal-400/60' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                  selectedWidget.settings.binding.newsListImage ? 'left-0.5' : 'left-5'
                                }`}
                              />
                            </span>
                          </button>
                        </div>
                      )}

                    {/* ── گروه‌ها و دسته‌بندی‌ها از وب‌سرویس ── */}
                    {activeDataSource === 'news' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          دسته‌بندی خبر (اتصال به گروه)
                        </label>
                        <select
                          value={selectedWidget.settings.binding.categoryFilter || 'all'}
                          onChange={(e) => handleBindingChange('categoryFilter', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="all">همه دسته‌بندی‌ها</option>
                          {newsCategories.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeDataSource === 'announcements' && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            گروه اطلاعیه (اتصال به گروه)
                          </label>
                          <select
                            value={selectedWidget.settings.binding.categoryFilter || 'all'}
                            onChange={(e) => handleBindingChange('categoryFilter', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="all">همه گروه‌ها</option>
                            {announcementGroups.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            فیلتر اولویت (فوری / عادی)
                          </label>
                          <select
                            value={selectedWidget.settings.binding.priorityFilter || 'all'}
                            onChange={(e) => handleBindingChange('priorityFilter', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="all">همه</option>
                            <option value="urgent">فقط فوری</option>
                            <option value="standard">فقط عادی</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            نحوه باز شدن اطلاعیه با کلیک
                          </label>
                          <select
                            value={selectedWidget.settings.binding.openMode || 'self'}
                            onChange={(e) => handleBindingChange('openMode', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="self">در صفحه جاری</option>
                            <option value="new">در صفحه جدید (تب جدید)</option>
                            <option value="modal">در پنجره modal</option>
                          </select>
                        </div>
                      </>
                    )}

                    {(activeDataSource === 'gallery' || activeDataSource === 'files') && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          پوشه رسانه (اختیاری)
                        </label>
                        <select
                          value={selectedWidget.settings.binding.folderFilter || 'all'}
                          onChange={(e) => handleBindingChange('folderFilter', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="all">همه پوشه‌ها</option>
                          {mediaFolders.map((f) => (
                            <option key={f.id} value={String(f.id)}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {activeDataSource === 'staff' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          نوع اعضا
                        </label>
                        <select
                          value={selectedWidget.settings.binding.departmentFilter || 'faculty_member'}
                          onChange={(e) => handleBindingChange('departmentFilter', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="faculty_member">اعضای هیئت علمی</option>
                          <option value="visiting_professor">اساتید مدعو</option>
                          <option value="staff">کارکنان</option>
                          <option value="student">دانشجویان</option>
                        </select>
                      </div>
                    )}

                    {dataSourceError && (
                      <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {dataSourceError}
                      </p>
                    )}
                  </>
                )}
              </div>
              )}

              {/* بلوک‌های صفحات اختصاصی — همیشه دادهٔ همان صفحهٔ اختصاصیِ متصل به این لایوت را نمایش می‌دهند؛ فقط نحوهٔ نمایش قابل تنظیم است */}
              {isDedicatedPageWidget && (
                <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-violet-600 dark:text-violet-400">
                    <Database className="w-3.5 h-3.5" />
                    <span>تنظیمات نمایش (متصل به صفحهٔ اختصاصیِ این لایوت)</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حداکثر تعداد آیتم‌ها</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedWidget.settings.binding.limit || 6}
                      onChange={(e) => handleBindingChange('limit', parseInt(e.target.value) || 6)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {selectedWidget.type !== 'dp-members' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حالت چیدمان</label>
                      <select
                        value={selectedWidget.settings.binding.displayMode || 'grid'}
                        onChange={(e) => handleBindingChange('displayMode', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="grid">شبکه‌ای (Grid)</option>
                        <option value="list">لیست عمودی (List)</option>
                      </select>
                    </div>
                  )}

                  {(selectedWidget.type === 'dp-members'
                    ? ['top', 'card-right', 'card-left'].includes(selectedWidget.settings.binding.avatarPosition || 'top')
                    : (selectedWidget.settings.binding.displayMode || 'grid') === 'grid') && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">تعداد ستون در هر ردیف</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => handleBindingChange('columnsCount', n)}
                            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              (selectedWidget.settings.binding.columnsCount || (selectedWidget.type === 'dp-gallery' ? 4 : selectedWidget.type === 'dp-members' ? 3 : 2)) === n
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-violet-500/40'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ترتیب نمایش</label>
                    <select
                      value={selectedWidget.settings.binding.sortBy === 'date_asc' ? 'date_asc' : 'date_desc'}
                      onChange={(e) => handleBindingChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                    >
                      <option value="date_desc">نزولی (جدیدترین ابتدا)</option>
                      <option value="date_asc">صعودی (قدیمی‌ترین ابتدا)</option>
                    </select>
                  </div>

                  {selectedWidget.type === 'dp-members' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">موقعیت تصویر</label>
                      <select
                        value={selectedWidget.settings.binding.avatarPosition || 'top'}
                        onChange={(e) => handleBindingChange('avatarPosition', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="top">تصویر بالا، جزئیات پایین (کارتی)</option>
                        <option value="card-right">تصویر راست، جزئیات چپ (کارتی)</option>
                        <option value="card-left">تصویر چپ، جزئیات راست (کارتی)</option>
                        <option value="right">تصویر راست، جزئیات چپ (ردیفی)</option>
                        <option value="left">تصویر چپ، جزئیات راست (ردیفی)</option>
                      </select>
                    </div>
                  )}

                  {selectedWidget.type === 'dp-gallery' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">دسته‌بندی گالری (اختیاری)</label>
                      <select
                        value={selectedWidget.settings.binding.categoryFilter || 'all'}
                        onChange={(e) => handleBindingChange('categoryFilter', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="all">همه دسته‌بندی‌ها</option>
                        {dedicatedPageTaxonomies.map((t) => (
                          <option key={t.id} value={t.slug}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                      {!dedicatedPageId && (
                        <p className="text-[10px] text-slate-400">
                          این لایوت هنوز به یک نوع صفحهٔ اختصاصی متصل نشده — دسته‌بندی‌ها پس از اتصال لایوت نمایش داده می‌شوند.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* بلوک «جاسازی فرم» — یک فرم منتشرشده از فرم‌ساز را انتخاب و مستقیماً در این صفحه نمایش می‌دهد */}
              {isFormWidget && (
                <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-teal-600 dark:text-teal-400">
                    <Database className="w-3.5 h-3.5" />
                    <span>اتصال به فرم‌ساز</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فرم منتشرشده</label>
                    <select
                      value={selectedWidget.settings.binding.formId || ''}
                      onChange={(e) => {
                        const chosen = availableForms.find((f) => f.id === e.target.value);
                        const newBinding: WidgetDataBinding = {
                          ...selectedWidget.settings.binding,
                          formId: chosen?.id || '',
                          formSlug: chosen?.slug || ''
                        };
                        onUpdateWidget({
                          ...selectedWidget,
                          settings: { ...selectedWidget.settings, binding: newBinding }
                        });
                      }}
                      disabled={isLoadingForms}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <option value="">{isLoadingForms ? 'در حال دریافت فهرست فرم‌ها...' : 'انتخاب کنید'}</option>
                      {availableForms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.title}
                        </option>
                      ))}
                    </select>
                    {!isLoadingForms && availableForms.length === 0 && (
                      <p className="text-[10px] text-slate-400">
                        هیچ فرم منتشرشده‌ای در فرم‌ساز یافت نشد. ابتدا یک فرم بسازید و آن را منتشر کنید.
                      </p>
                    )}
                    {!selectedWidget.settings.binding.formId && availableForms.length > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        تا وقتی فرمی انتخاب نشود، این بلوک در صفحهٔ عمومی چیزی نمایش نمی‌دهد.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STYLES & TYPOGRAPHY */}
          {inspectorTab === 'style' && (
            <div className="space-y-4">
              {/* Text Color & Background Color — برای خط جداکننده معنا ندارد */}
              {selectedWidget.type !== 'divider' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ متن</label>
                    <input
                      type="color"
                      value={selectedWidget.settings.style.textColor || '#000000'}
                      onChange={(e) => handleStyleChange('textColor', e.target.value)}
                      className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-800 cursor-pointer bg-slate-50 dark:bg-slate-950 p-1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ پس‌زمینه</label>
                    <div className="flex items-center gap-1.5">
                      <ColorBox
                        value={selectedWidget.settings.style.backgroundColor}
                        onChange={(color) => handleStyleChange('backgroundColor', color)}
                        className="flex-1 min-w-0 h-9"
                      />
                      <button
                        type="button"
                        title="حذف رنگ پس‌زمینه"
                        onClick={() => handleStyleChange('backgroundColor', undefined)}
                        className="px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shrink-0"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Widget Background Gradient — colorpicker with stops + angle — برای خط جداکننده معنا ندارد */}
              {selectedWidget.type !== 'divider' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    گرادیان پس‌زمینه ویجت (اختیاری)
                  </label>
                  {selectedWidget.settings.style.backgroundGradient ? (
                    <>
                      <GradientPicker
                        value={selectedWidget.settings.style.backgroundGradient}
                        onChange={(css) => handleStyleChange('backgroundGradient', css)}
                      />
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleStyleChange('backgroundGradient', undefined)}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                        >
                          حذف گرادیان
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { label: 'تیره', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
                        { label: 'آبی تیره', value: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' },
                        { label: 'سرمه‌ای', value: 'linear-gradient(135deg, #0f766e 0%, #1e1b4b 100%)' },
                        { label: 'نقره‌ای', value: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handleStyleChange('backgroundGradient', preset.value)}
                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Font Size & Weight — برای خط جداکننده معنا ندارد */}
              {selectedWidget.type !== 'divider' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">اندازه قلم</label>
                    <input
                      type="text"
                      placeholder="e.g. 18px"
                      value={selectedWidget.settings.style.fontSize || ''}
                      onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">وزن متنی</label>
                    <select
                      value={selectedWidget.settings.style.fontWeight || '400'}
                      onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="400">عادی (400)</option>
                      <option value="600">نیمه ضخیم (600)</option>
                      <option value="700">ضخیم (700)</option>
                      <option value="900">بسیار ضخیم (900)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Text Alignment — برای خط جداکننده معنا ندارد (به‌جای آن تراز راست/چپ خودِ خط پایین‌تر است) */}
              {selectedWidget.type !== 'divider' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">ترازبندی متن</label>
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
                    <button
                      onClick={() => handleStyleChange('textAlign', 'right')}
                      className={`flex-1 py-1.5 rounded-lg flex justify-center text-xs font-bold cursor-pointer ${
                        selectedWidget.settings.style.textAlign === 'right' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'
                      }`}
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStyleChange('textAlign', 'center')}
                      className={`flex-1 py-1.5 rounded-lg flex justify-center text-xs font-bold cursor-pointer ${
                        selectedWidget.settings.style.textAlign === 'center' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'
                      }`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStyleChange('textAlign', 'left')}
                      className={`flex-1 py-1.5 rounded-lg flex justify-center text-xs font-bold cursor-pointer ${
                        selectedWidget.settings.style.textAlign === 'left' ? 'bg-teal-500 text-slate-950' : 'text-slate-500'
                      }`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── تنظیمات لایه (هم‌سطح slider-studio) ── */}

              {/* Typography extras for text-like widgets */}
              {(selectedWidget.type === 'text' || selectedWidget.type === 'heading' || selectedWidget.type === 'richtext' || selectedWidget.type === 'button') && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نام فونت</label>
                    <select
                      value={selectedWidget.settings.style.fontFamily || 'Vazirmatn, sans-serif'}
                      onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="Vazirmatn, sans-serif">وزیرمتن (فارسی)</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Impact, sans-serif">Impact (برجسته)</option>
                      <option value="Allemand, serif">Allemand</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* فاصله خط برای دکمه معنا ندارد و مثل padding عمل می‌کند */}
                    {selectedWidget.type !== 'button' && (
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله خط (Line Height)</label>
                        <input
                          type="number"
                          step={0.1}
                          min={0.5}
                          max={3}
                          value={typeof selectedWidget.settings.style.lineHeight === 'number' ? selectedWidget.settings.style.lineHeight : 1.6}
                          onChange={(e) => handleStyleChange('lineHeight', parseFloat(e.target.value) || 1.6)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله حروف (px)</label>
                      <input
                        type="number"
                        value={selectedWidget.settings.style.letterSpacing || 0}
                        onChange={(e) => handleStyleChange('letterSpacing', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حالت حروف</label>
                    <select
                      value={selectedWidget.settings.style.textTransform || 'none'}
                      onChange={(e) => handleStyleChange('textTransform', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="none">عادی</option>
                      <option value="uppercase">بزرگ (UPPERCASE)</option>
                      <option value="lowercase">کوچک (lowercase)</option>
                      <option value="capitalize">اول حرف بزرگ</option>
                    </select>
                  </div>
                </>
              )}

              {/* Padding — all sides — برای خط جداکننده معنا ندارد */}
              {selectedWidget.type !== 'divider' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ بالا (px)</label>
                    <input
                      type="number"
                      value={selectedWidget.settings.style.paddingTop || 0}
                      onChange={(e) => handleStyleChange('paddingTop', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ پایین (px)</label>
                    <input
                      type="number"
                      value={selectedWidget.settings.style.paddingBottom || 0}
                      onChange={(e) => handleStyleChange('paddingBottom', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ راست (px)</label>
                    <input
                      type="number"
                      value={selectedWidget.settings.style.paddingRight || 0}
                      onChange={(e) => handleStyleChange('paddingRight', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ چپ (px)</label>
                    <input
                      type="number"
                      value={selectedWidget.settings.style.paddingLeft || 0}
                      onChange={(e) => handleStyleChange('paddingLeft', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* Margin — all sides */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله خارجی بالا (px)</label>
                  <input
                    type="number"
                    value={selectedWidget.settings.style.marginTop || 0}
                    onChange={(e) => handleStyleChange('marginTop', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله خارجی پایین (px)</label>
                  <input
                    type="number"
                    value={selectedWidget.settings.style.marginBottom || 0}
                    onChange={(e) => handleStyleChange('marginBottom', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله خارجی راست (px)</label>
                  <input
                    type="number"
                    value={selectedWidget.settings.style.marginRight || 0}
                    onChange={(e) => handleStyleChange('marginRight', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله خارجی چپ (px)</label>
                  <input
                    type="number"
                    value={selectedWidget.settings.style.marginLeft || 0}
                    onChange={(e) => handleStyleChange('marginLeft', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Per-corner border radius — Photoshop style — برای خط جداکننده معنا ندارد */}
              {selectedWidget.type !== 'divider' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">شعاع گوشه‌ها (px) — مانند فتوشاپ</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block">بالا راست</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedWidget.settings.style.borderRadiusTopRight || 0}
                        onChange={(e) => handleStyleChange('borderRadiusTopRight', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block">بالا چپ</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedWidget.settings.style.borderRadiusTopLeft || 0}
                        onChange={(e) => handleStyleChange('borderRadiusTopLeft', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پایین راست</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedWidget.settings.style.borderRadiusBottomRight || 0}
                        onChange={(e) => handleStyleChange('borderRadiusBottomRight', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پایین چپ</label>
                      <input
                        type="number"
                        min={0}
                        value={selectedWidget.settings.style.borderRadiusBottomLeft || 0}
                        onChange={(e) => handleStyleChange('borderRadiusBottomLeft', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Border — width / style / color — برای خط جداکننده معنای «رنگ/ضخامت/نوع خودِ خط» را می‌دهد */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {selectedWidget.type === 'divider' ? 'ضخامت خط (px)' : 'ضخامت خط دور (px)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={selectedWidget.settings.style.borderWidth || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const defaultColor = selectedWidget.type === 'divider' ? '#94a3b8' : '#ffffff';
                      const updates: Partial<WidgetStyle> = { borderWidth: val };
                      if (val > 0 && (!selectedWidget.settings.style.borderColor || selectedWidget.settings.style.borderColor === 'transparent')) {
                        updates.borderColor = defaultColor;
                      }
                      handleStyleChange('borderWidth', updates.borderWidth);
                      if (updates.borderColor) handleStyleChange('borderColor', updates.borderColor);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نوع خط</label>
                  <select
                    value={selectedWidget.settings.style.borderStyle || 'solid'}
                    onChange={(e) => handleStyleChange('borderStyle', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="solid">توپر (Solid)</option>
                    <option value="dashed">خط‌چین (Dashed)</option>
                    <option value="dotted">نقطه‌چین (Dotted)</option>
                    <option value="none">بدون خط</option>
                  </select>
                </div>
              </div>
              {(selectedWidget.type === 'divider' || (selectedWidget.settings.style.borderWidth || 0) > 0) && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {selectedWidget.type === 'divider' ? 'رنگ خط' : 'رنگ خط دور'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={!selectedWidget.settings.style.borderColor || selectedWidget.settings.style.borderColor === 'transparent' ? (selectedWidget.type === 'divider' ? '#94a3b8' : '#0f172a') : selectedWidget.settings.style.borderColor}
                      onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={selectedWidget.settings.style.borderColor ?? 'transparent'}
                      onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* Shadow */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">سایه</label>
                <select
                  value={(() => {
                    const s = selectedWidget.settings.style.shadow;
                    if (!s || s === 'none') return 'none';
                    if (s === SHADOW_SM) return 'soft';
                    if (s === SHADOW_MD) return 'medium';
                    if (s === SHADOW_LG) return 'hard';
                    return 'custom';
                  })()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'none') handleStyleChange('shadow', 'none');
                    else if (val === 'soft') handleStyleChange('shadow', SHADOW_SM);
                    else if (val === 'medium') handleStyleChange('shadow', SHADOW_MD);
                    else if (val === 'hard') handleStyleChange('shadow', SHADOW_LG);
                    else if (val === 'custom') handleStyleChange('shadow', '0 0 15px rgba(59,130,246,0.5)');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="none">بدون سایه</option>
                  <option value="soft">نرم (Soft)</option>
                  <option value="medium">متوسط (Medium)</option>
                  <option value="hard">سخت (Hard)</option>
                  <option value="custom">سفارشی</option>
                </select>
                {selectedWidget.settings.style.shadow && selectedWidget.settings.style.shadow !== 'none' && (
                  <input
                    type="text"
                    dir="ltr"
                    value={selectedWidget.settings.style.shadow}
                    onChange={(e) => handleStyleChange('shadow', e.target.value || 'none')}
                    placeholder="مثال: 0 0 15px rgba(59,130,246,0.5)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                )}
              </div>

              {/* Background opacity + preview swatch */}
              {(selectedWidget.settings.style.backgroundColor || selectedWidget.settings.style.backgroundGradient) && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    شفافیت پس‌زمینه: {selectedWidget.settings.style.backgroundOpacity ?? 100}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={selectedWidget.settings.style.backgroundOpacity ?? 100}
                    onChange={(e) => handleStyleChange('backgroundOpacity', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-teal-600"
                  />
                  <div
                    className="w-full h-8 rounded-xl border border-gray-300 dark:border-slate-700"
                    style={{
                      background: selectedWidget.settings.style.backgroundGradient || selectedWidget.settings.style.backgroundColor || 'transparent',
                      opacity: (selectedWidget.settings.style.backgroundOpacity ?? 100) / 100
                    }}
                  />
                </div>
              )}

              {/* Object fit — image only */}
              {selectedWidget.type === 'image' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حالت نمایش تصویر (Object Fit)</label>
                    <select
                      value={selectedWidget.settings.style.objectFit || 'cover'}
                      onChange={(e) => handleStyleChange('objectFit', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="cover">پوشش کامل (Cover)</option>
                      <option value="contain">درون قاب (Contain)</option>
                      <option value="fill">کشیده (Fill)</option>
                      <option value="none">حجم اصلی (None)</option>
                      <option value="scale-down">کوچک‌تر (Scale-down)</option>
                    </select>
                  </div>

                  {/* کادر تصویر — مستطیل/گوشه‌گرد/مربع/دایره (روی خود تصویر اعمال می‌شود) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">شکل تصویر (کادر قاب)</label>
                    <select
                      value={selectedWidget.settings.style.imageFrame || ''}
                      onChange={(e) => handleStyleChange('imageFrame', e.target.value || undefined)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="">خودکار / مستطیل</option>
                      <option value="rounded">گوشه‌گرد</option>
                      <option value="square">مربع</option>
                      <option value="circle">دایره</option>
                    </select>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">شعاع گوشه‌ها روی خود تصویر اعمال می‌شود (نه روی بلوک)</p>
                  </div>

                  {/* انیمیشن زوم هنگام هاور — تصویر */}
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedWidget.settings.style.imageHoverZoom !== false}
                      onChange={(e) => handleStyleChange('imageHoverZoom', e.target.checked)}
                      className="accent-teal-600 w-4 h-4"
                    />
                    انیمیشن زوم هنگام هاور
                  </label>
                </>
              )}

              {/* Button — full width */}
              {selectedWidget.type === 'button' && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedWidget.settings.style.fullWidth === true}
                    onChange={(e) => handleStyleChange('fullWidth', e.target.checked)}
                    className="accent-teal-600 w-4 h-4"
                  />
                  تمام‌عرض (کشیدن دکمه به کل ستون)
                </label>
              )}

              {/* Width mode — همه ویجت‌ها (تمام‌عرض/اندازه محتوا/وسط‌چین/راست‌چین/چپ‌چین — برای خط جداکننده همان تراز راست و چپ خط است) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {selectedWidget.type === 'divider' ? 'ترازبندی خط' : 'حالت عرض'}
                </label>
                <select
                  value={selectedWidget.settings.style.widthMode || 'full'}
                  onChange={(e) => handleStyleChange('widthMode', e.target.value as 'full' | 'auto' | 'center' | 'left' | 'right')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="full">تمام‌عرض (پیش‌فرض)</option>
                  <option value="auto">اندازه محتوا</option>
                  <option value="center">اندازه محتوا — وسط‌چین</option>
                  <option value="right">اندازه محتوا — راست‌چین</option>
                  <option value="left">اندازه محتوا — چپ‌چین</option>
                </select>
              </div>

              {/* Max width */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">حداکثر عرض ویجت (px) — خالی = خودکار</label>
                <input
                  type="number"
                  min={0}
                  value={selectedWidget.settings.style.maxWidth || ''}
                  onChange={(e) => handleStyleChange('maxWidth', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SMART LOGIC & RULES */}
          {inspectorTab === 'logic' && (
            <div className="space-y-4">
              {/* Responsive Device Visibility */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نمایش در دستگاه‌های مختلف</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleVisibilityToggle('desktop')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs cursor-pointer ${
                      selectedWidget.settings.visibility.desktop
                        ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>دسکتاپ</span>
                  </button>

                  <button
                    onClick={() => handleVisibilityToggle('tablet')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs cursor-pointer ${
                      selectedWidget.settings.visibility.tablet
                        ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <Tablet className="w-4 h-4" />
                    <span>تبلت</span>
                  </button>

                  <button
                    onClick={() => handleVisibilityToggle('mobile')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs cursor-pointer ${
                      selectedWidget.settings.visibility.mobile
                        ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>موبایل</span>
                  </button>
                </div>
              </div>

              {/* Conditional Display Rule */}
              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">شرط نمایش (نقش کاربر / برچسب فیلتر)</span>
                  <input
                    type="checkbox"
                    checked={selectedWidget.settings.conditionalDisplay?.enabled || false}
                    onChange={(e) => handleConditionalChange('enabled', e.target.checked)}
                    className="accent-teal-500 w-4 h-4 cursor-pointer"
                  />
                </div>

                {selectedWidget.settings.conditionalDisplay?.enabled && (
                  <div className="space-y-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نمایش فقط برای نقش:</label>
                      <select
                        value={selectedWidget.settings.conditionalDisplay?.userRole || 'all'}
                        onChange={(e) => handleConditionalChange('userRole', e.target.value as UserRoleCondition)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="all">همه کاربران (عمومی)</option>
                        <option value="student">فقط دانشجویان</option>
                        <option value="professor">فقط اساتید</option>
                        <option value="admin">فقط مدیران سیستم</option>
                        <option value="guest">فقط کاربران مهمان (وارد نشده)</option>
                      </select>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-slate-800">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        برچسب‌های این بلوک (برای فیلتر با Query String)
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={selectedWidget.settings.conditionalDisplay?.urlParamValue || ''}
                        onChange={(e) => handleConditionalChange('urlParamValue', e.target.value)}
                        placeholder="field-card degree-masters faculty-humanities"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                      />
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        چند برچسب را با فاصله جدا کنید — هم به‌عنوان class روی همین بلوک اعمال می‌شوند، هم مبنای فیلتر قرار می‌گیرند: اگر مقدار پارامتر URL برابر یکی از این برچسب‌ها بود، بلوک نمایش داده می‌شود؛ اگر خالی بگذارید، این بلوک همیشه نمایش داده می‌شود.
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 shrink-0">نام پارامتر در URL:</span>
                        <input
                          type="text"
                          dir="ltr"
                          value={selectedWidget.settings.conditionalDisplay?.urlParamKey || 'filter'}
                          onChange={(e) => handleConditionalChange('urlParamKey', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-[11px] font-mono text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* انتخاب تصویر از مدیریت رسانه — ویجت تصویر و پوستر ویدیو */}
      <MediaManager
        open={mediaPickerTarget === 'widgetImage'}
        onClose={() => setMediaPickerTarget(null)}
        filter="image"
        title="انتخاب تصویر"
        onSelect={(url) => {
          onUpdateWidget({ ...selectedWidget, imageUrl: url });
          setMediaPickerTarget(null);
        }}
      />
      <MediaManager
        open={mediaPickerTarget === 'videoPoster'}
        onClose={() => setMediaPickerTarget(null)}
        filter="image"
        title="انتخاب تصویر پوستر ویدیو"
        onSelect={(url) => {
          handleStyleChange('videoPoster', url);
          setMediaPickerTarget(null);
        }}
      />

      {/* انتخابگر آیکون — متن و دکمه و شمارنده و کارت اطلاعاتی */}
      <IconPicker
        open={iconPickerState.open}
        onClose={() => setIconPickerState({ open: false, mode: iconPickerState.mode })}
        title={
          iconPickerState.mode === 'button'
            ? 'انتخاب آیکون دکمه'
            : iconPickerState.mode === 'counter'
              ? 'انتخاب آیکون شمارنده'
              : iconPickerState.mode === 'icon-box'
                ? 'انتخاب آیکون کارت اطلاعاتی'
                : iconPickerState.mode === 'richtext'
                  ? 'انتخاب آیکون متن (ویرایشگر غنی)'
                  : 'انتخاب آیکون متن'
        }
        value={
          iconPickerState.mode === 'button'
            ? selectedWidget.iconName
            : iconPickerState.mode === 'counter'
              ? customProps.icon
              : iconPickerState.mode === 'icon-box'
                ? customProps.iconName || selectedWidget.iconName
                : undefined
        }
        onSelect={
          iconPickerState.mode === 'button'
            ? selectButtonIcon
            : iconPickerState.mode === 'counter'
              ? (iconName: string) => {
                  updateCustomProps({ icon: iconName || undefined });
                  setIconPickerState({ open: false, mode: 'counter' });
                }
              : iconPickerState.mode === 'icon-box'
                ? (iconName: string) => {
                    updateCustomProps({ iconName: iconName || undefined });
                    setIconPickerState({ open: false, mode: 'icon-box' });
                  }
                : iconPickerState.mode === 'richtext'
                  ? insertRichtextIcon
                  : insertIconToken
        }
      />
      </>
    );
  }

  // ==============================================================
  // SECTION INSPECTION LOGIC
  // ==============================================================
  if (selectedSection) {
    return (
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full select-none rtl text-right">
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-500" />
              <span>تنظیمات سکشن</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">{selectedSection.name}</div>
          </div>

          <button
            onClick={() => onDeleteSection(selectedSection.id)}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
            title="حذف سکشن"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">نام سکشن</label>
            <input
              type="text"
              value={selectedSection.name}
              onChange={(e) => onUpdateSection({ ...selectedSection, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">عرض سکشن (Layout)</label>
            <select
              value={selectedSection.layout}
              onChange={(e) => onUpdateSection({ ...selectedSection, layout: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="boxed">محدود شده به کادر (Boxed Container)</option>
              <option value="full-width">تمام صفحه (Full Width)</option>
            </select>
          </div>

          {onUpdateSectionColumnLayout && (
            <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                الگوی چیدمان ستون‌ها ({activeBreakpoint === 'mobile' ? 'موبایل' : activeBreakpoint === 'tablet' ? 'تبلت' : 'دسکتاپ'})
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '1col')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 bg-teal-500/30 rounded-xs" />
                  <span className="text-[10px]">۱ ستونه</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '2col')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-1/2 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/2 h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۲ ستونه</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '3col')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-1/3 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/3 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/3 h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۳ ستونه</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '4col')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-1/4 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/4 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/4 h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-1/4 h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۴ ستونه</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '7-5')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-[60%] h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-[40%] h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۷ به ۵</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSectionColumnLayout(selectedSection.id, '8-4')}
                  className="p-2 rounded-xl border bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 hover:border-teal-500 text-xs font-bold text-slate-800 dark:text-slate-200 text-center flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="w-full h-3 flex gap-0.5">
                    <span className="w-[66%] h-full bg-teal-500/30 rounded-xs" />
                    <span className="w-[34%] h-full bg-teal-500/30 rounded-xs" />
                  </span>
                  <span className="text-[10px]">۸ به ۴</span>
                </button>
              </div>

              {onUpdateColumnWidth && (
                <>
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800/60">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        عرض ستون‌ها در هر دستگاه (Responsive)
                      </label>
                      <div className="flex items-center gap-1">
                        {([
                          { bp: 'desktop' as Breakpoint, label: 'دسکتاپ', Icon: Monitor },
                          { bp: 'tablet' as Breakpoint, label: 'تبلت', Icon: Tablet },
                          { bp: 'mobile' as Breakpoint, label: 'موبایل', Icon: Smartphone }
                        ]).map(({ bp, label, Icon }) => (
                          <button
                            key={bp}
                            type="button"
                            onClick={() => setColBp(bp)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                              colBp === bp
                                ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/40'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-1">
                    {selectedSection.columns.map((col, idx) => {
                      const current = getColumnWidth(col, colBp);
                      return (
                        <div key={col.id} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-500 w-14 shrink-0">ستون {idx + 1}</span>
                          <input
                            type="range"
                            min={1}
                            max={12}
                            value={current}
                            onChange={(e) => onUpdateColumnWidth(selectedSection.id, col.id, colBp, Number(e.target.value))}
                            className="flex-1 accent-teal-600 cursor-pointer"
                          />
                          <span className="text-[10px] font-black text-teal-600 dark:text-teal-400 w-8 text-center">{current}</span>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                      در موبایل به‌صورت پیش‌فرض همه ستون‌ها تمام‌عرض (تک‌ستونه) می‌شوند؛ این مقدار را می‌توانید تغییر دهید.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {selectedColumn && onUpdateColumn && (
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PinIcon className="w-3.5 h-3.5 text-teal-500" />
                موقعیت ستون انتخاب‌شده (سایدبار چسبان/ثابت)
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">موقعیت</label>
                  <select
                    value={selectedColumn.position || 'static'}
                    onChange={(e) =>
                      onUpdateColumn(selectedSection.id, selectedColumn.id, {
                        position: (e.target.value || 'static') as ColumnInstance['position']
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="static">معمولی (static)</option>
                    <option value="relative">نسبی (relative)</option>
                    <option value="sticky">چسبان (sticky)</option>
                    <option value="fixed">ثابت (fixed)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">لایه (z-index)</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedColumn.zIndex ?? ''}
                    placeholder="خودکار"
                    onChange={(e) =>
                      onUpdateColumn(selectedSection.id, selectedColumn.id, {
                        zIndex: e.target.value === '' ? undefined : parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {(selectedColumn.position === 'sticky' || selectedColumn.position === 'fixed') && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">فاصله از بالا هنگام چسبیدن (px)</label>
                  <input
                    type="number"
                    min={0}
                    value={selectedColumn.offsetTop ?? 0}
                    onChange={(e) =>
                      onUpdateColumn(selectedSection.id, selectedColumn.id, {
                        offsetTop: parseInt(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                برخلاف «موقعیت سکشن» که کل ردیف را می‌چسباند، این فقط همین ستون را کنار ستون‌های دیگر چسبان/ثابت می‌کند — مناسب سایدبار میانبرها که هنگام اسکرول محتوای اصلی ثابت می‌ماند. با «چسبان (sticky)» ستون فقط تا پایان ارتفاع سکشن با شما همراه است.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">رنگ پس‌زمینه سکشن</label>
            <div className="flex items-center gap-1.5">
              <ColorBox
                value={selectedSection.backgroundColor}
                onChange={(color) => onUpdateSection({ ...selectedSection, backgroundColor: color })}
                className="flex-1 min-w-0 h-9"
              />
              <button
                type="button"
                title="حذف رنگ پس‌زمینه سکشن"
                onClick={() => onUpdateSection({ ...selectedSection, backgroundColor: undefined })}
                className="px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shrink-0"
              >
                حذف
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              گرادیان پس‌زمینه (اختیاری — جایگزین رنگ ساده می‌شود)
            </label>
            {selectedSection.backgroundGradient ? (
              <>
                <GradientPicker
                  value={selectedSection.backgroundGradient}
                  onChange={(css) => onUpdateSection({ ...selectedSection, backgroundGradient: css })}
                />
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => onUpdateSection({ ...selectedSection, backgroundGradient: undefined })}
                    className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  >
                    حذف گرادیان
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { label: 'تیره', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
                  { label: 'آبی تیره', value: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' },
                  { label: 'سرمه‌ای', value: 'linear-gradient(135deg, #0f766e 0%, #1e1b4b 100%)' },
                  { label: 'نقرهای', value: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onUpdateSection({ ...selectedSection, backgroundGradient: preset.value })}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* شفافیت پس‌زمینه سکشن (رنگ یا گرادیان) */}
          {(selectedSection.backgroundColor || selectedSection.backgroundGradient) && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                شفافیت پس‌زمینه سکشن: {selectedSection.backgroundOpacity ?? 100}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedSection.backgroundOpacity ?? 100}
                onChange={(e) => onUpdateSection({ ...selectedSection, backgroundOpacity: Number(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-teal-600"
              />
              <div
                className="w-full h-8 rounded-xl border border-gray-300 dark:border-slate-700"
                style={{
                  background: selectedSection.backgroundGradient || selectedSection.backgroundColor || 'transparent',
                  opacity: (selectedSection.backgroundOpacity ?? 100) / 100
                }}
              />
            </div>
          )}

          {/* تصویر پس‌زمینه سکشن (به همراه position/size/repeat) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              تصویر پس‌زمینه سکشن (اختیاری)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                dir="ltr"
                placeholder="https://... یا انتخاب از رسانه"
                value={selectedSection.backgroundImage || ''}
                onChange={(e) => onUpdateSection({ ...selectedSection, backgroundImage: e.target.value || undefined })}
                className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setMediaPickerTarget('sectionBg')}
                className="shrink-0 p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500 hover:text-white transition-all cursor-pointer"
                title="انتخاب از مدیریت رسانه"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              {selectedSection.backgroundImage && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdateSection({
                      ...selectedSection,
                      backgroundImage: undefined,
                      backgroundPosition: undefined,
                      backgroundSize: undefined,
                      backgroundRepeat: undefined
                    })
                  }
                  className="shrink-0 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  title="حذف تصویر پس‌زمینه"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {selectedSection.backgroundImage && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block">موقعیت (Position)</label>
                  <select
                    value={selectedSection.backgroundPosition || 'center'}
                    onChange={(e) => onUpdateSection({ ...selectedSection, backgroundPosition: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="center">وسط (center)</option>
                    <option value="top">بالا (top)</option>
                    <option value="bottom">پایین (bottom)</option>
                    <option value="left">چپ (left)</option>
                    <option value="right">راست (right)</option>
                    <option value="top left">بالا چپ</option>
                    <option value="top right">بالا راست</option>
                    <option value="bottom left">پایین چپ</option>
                    <option value="bottom right">پایین راست</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block">اندازه (Size)</label>
                  <select
                    value={selectedSection.backgroundSize || 'cover'}
                    onChange={(e) => onUpdateSection({ ...selectedSection, backgroundSize: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="cover">پوشش کامل (cover)</option>
                    <option value="contain">درون قاب (contain)</option>
                    <option value="auto">خودکار (auto)</option>
                    <option value="100% 100%">کشیدن کامل (100% 100%)</option>
                    <option value="50%">نصف عرض (50%)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block">تکرار (Repeat)</label>
                  <select
                    value={selectedSection.backgroundRepeat || 'no-repeat'}
                    onChange={(e) => onUpdateSection({ ...selectedSection, backgroundRepeat: e.target.value })}
                    className="w-full px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="no-repeat">بدون تکرار</option>
                    <option value="repeat">تکرار کامل</option>
                    <option value="repeat-x">تکرار افقی</option>
                    <option value="repeat-y">تکرار عمودی</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پیش‌نمایش</label>
                  <div
                    className="w-full h-10 rounded-xl border border-gray-200 dark:border-slate-800"
                    style={{
                      backgroundImage: `url("${selectedSection.backgroundImage}")`,
                      backgroundPosition: selectedSection.backgroundPosition || 'center',
                      backgroundSize: selectedSection.backgroundSize || 'cover',
                      backgroundRepeat: selectedSection.backgroundRepeat || 'no-repeat'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* نشانک سکشن (Bookmark) — برای لینک‌های #anchor */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BookmarkIcon className="w-3.5 h-3.5" />
              نشانک سکشن (Bookmark)
            </label>
            <input
              type="text"
              dir="ltr"
              placeholder="services — بدون # (برای لینک #services)"
              value={selectedSection.bookmark || ''}
              onChange={(e) => onUpdateSection({ ...selectedSection, bookmark: e.target.value || undefined })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
              با تعیین نشانک، دکمه‌ها و لینک‌های دارای <span dir="ltr">href="#نشانک"</span> به این سکشن اسکرول می‌کنند.
            </p>
          </div>

          {/* شعاع گوشه‌های سکشن — مانند فتوشاپ (TL/TR/BL/BR) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              شعاع گوشه‌های سکشن (px)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block">بالا راست</label>
                <input
                  type="number"
                  min={0}
                  value={selectedSection.borderRadius?.topRight ?? 0}
                  onChange={(e) =>
                    onUpdateSection({
                      ...selectedSection,
                      borderRadius: {
                        ...selectedSection.borderRadius,
                        topRight: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block">بالا چپ</label>
                <input
                  type="number"
                  min={0}
                  value={selectedSection.borderRadius?.topLeft ?? 0}
                  onChange={(e) =>
                    onUpdateSection({
                      ...selectedSection,
                      borderRadius: {
                        ...selectedSection.borderRadius,
                        topLeft: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پایین راست</label>
                <input
                  type="number"
                  min={0}
                  value={selectedSection.borderRadius?.bottomRight ?? 0}
                  onChange={(e) =>
                    onUpdateSection({
                      ...selectedSection,
                      borderRadius: {
                        ...selectedSection.borderRadius,
                        bottomRight: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block">پایین چپ</label>
                <input
                  type="number"
                  min={0}
                  value={selectedSection.borderRadius?.bottomLeft ?? 0}
                  onChange={(e) =>
                    onUpdateSection({
                      ...selectedSection,
                      borderRadius: {
                        ...selectedSection.borderRadius,
                        bottomLeft: parseInt(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* موقعیت و لایهٔ سکشن — fixed/sticky/relative + z-index */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">موقعیت سکشن</label>
              <select
                value={selectedSection.position || 'static'}
                onChange={(e) =>
                  onUpdateSection({
                    ...selectedSection,
                    position: (e.target.value || 'static') as SectionInstance['position']
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              >
                <option value="static">معمولی (static)</option>
                <option value="relative">نسبی (relative)</option>
                <option value="sticky">چسبان (sticky)</option>
                <option value="fixed">ثابت (fixed)</option>
              </select>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                چسبان/ثابت: سکشن هنگام اسکرول بالای صفحه می‌ماند (مانند نوار راهبری).
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">لایه (z-index)</label>
              <input
                type="number"
                min={0}
                value={selectedSection.zIndex ?? ''}
                placeholder="خودکار"
                onChange={(e) =>
                  onUpdateSection({
                    ...selectedSection,
                    zIndex: e.target.value === '' ? undefined : parseInt(e.target.value) || 0
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                مقدار بالاتر = روی سکشن‌های دیگر قرار می‌گیرد.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله خارجی بالا (px)</label>
              <input
                type="number"
                value={selectedSection.marginTop ?? ''}
                placeholder="0"
                onChange={(e) => onUpdateSection({ ...selectedSection, marginTop: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                مقدار منفی، بلوک را روی بلوک قبلی می‌کشد (با z-index و موقعیت نسبی).
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">فاصله خارجی پایین (px)</label>
              <input
                type="number"
                value={selectedSection.marginBottom ?? ''}
                placeholder="0"
                onChange={(e) => onUpdateSection({ ...selectedSection, marginBottom: e.target.value === '' ? undefined : parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ بالا (px)</label>
              <input
                type="number"
                min={0}
                value={selectedSection.paddingTop}
                onChange={(e) => onUpdateSection({ ...selectedSection, paddingTop: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ پایین (px)</label>
              <input
                type="number"
                min={0}
                value={selectedSection.paddingBottom}
                onChange={(e) => onUpdateSection({ ...selectedSection, paddingBottom: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* پدینگ راست/چپ — داخل سکشن (کنار ستون‌ها) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ راست (px)</label>
              <input
                type="number"
                min={0}
                value={selectedSection.paddingRight ?? 0}
                onChange={(e) => onUpdateSection({ ...selectedSection, paddingRight: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">پدینگ چپ (px)</label>
              <input
                type="number"
                min={0}
                value={selectedSection.paddingLeft ?? 0}
                onChange={(e) => onUpdateSection({ ...selectedSection, paddingLeft: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* سایهٔ بلوک — پریست یا سفارشی */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">سایه بلوک</label>
            <select
              value={(() => {
                const s = selectedSection.boxShadow;
                if (!s || s === 'none') return 'none';
                if (s === SHADOW_SM) return 'soft';
                if (s === SHADOW_MD) return 'medium';
                if (s === SHADOW_LG) return 'hard';
                return 'custom';
              })()}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'none') onUpdateSection({ ...selectedSection, boxShadow: 'none' });
                else if (val === 'soft') onUpdateSection({ ...selectedSection, boxShadow: SHADOW_SM });
                else if (val === 'medium') onUpdateSection({ ...selectedSection, boxShadow: SHADOW_MD });
                else if (val === 'hard') onUpdateSection({ ...selectedSection, boxShadow: SHADOW_LG });
                else if (val === 'custom') onUpdateSection({ ...selectedSection, boxShadow: '0 0 15px rgba(59,130,246,0.5)' });
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="none">بدون سایه</option>
              <option value="soft">نرم (Soft)</option>
              <option value="medium">متوسط (Medium)</option>
              <option value="hard">سخت (Hard)</option>
              <option value="custom">سفارشی</option>
            </select>
            {selectedSection.boxShadow && selectedSection.boxShadow !== 'none' && (
              <input
                type="text"
                dir="ltr"
                value={selectedSection.boxShadow}
                onChange={(e) => onUpdateSection({ ...selectedSection, boxShadow: e.target.value || 'none' })}
                placeholder="مثال: 0 0 15px rgba(59,130,246,0.5)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
              />
            )}
          </div>

          <MediaManager
            open={mediaPickerTarget === 'sectionBg'}
            onClose={() => setMediaPickerTarget(null)}
            filter="image"
            title="انتخاب تصویر پس‌زمینه سکشن"
            onSelect={(url) => {
              onUpdateSection({ ...selectedSection, backgroundImage: url });
              setMediaPickerTarget(null);
            }}
          />
        </div>
      </div>
    );
  }

  return null;
};
