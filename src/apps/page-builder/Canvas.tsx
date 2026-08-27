import React, { useState } from 'react';
import {
  SmartPageSchema,
  SectionInstance,
  ColumnInstance,
  WidgetInstance,
  Breakpoint,
  UserRoleCondition,
  DEFAULT_GLOBAL_STYLES,
  getColumnWidth,
  getWidgetTypeLabel,
  getColumnBlocks,
  resolveBoxShadow
} from './builderTypes';
import { WidgetRenderer, applyBackgroundOpacity } from './WidgetRenderer';
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Grid,
  EyeOff,
  Pencil,
  GripVertical,
  CornerUpLeft
} from 'lucide-react';

interface CanvasProps {
  pageSchema: SmartPageSchema;
  /** شناسه و slug صفحهٔ در حال ویرایش — برای ویجت‌های وابسته به خودِ صفحه (مثل child-pages) */
  pageId?: number | null;
  pageSlug?: string | null;
  activeBreakpoint: Breakpoint;
  selectedSectionId: string | null;
  selectedColumnId: string | null;
  selectedWidgetId: string | null;
  currentUserRole: UserRoleCondition;
  onSelectSection: (sectionId: string) => void;
  onSelectColumn: (columnId: string) => void;
  onSelectWidget: (widgetId: string) => void;
  onAddWidget: (widgetType: any, targetColumnId?: string) => void;
  onAddSection: (preset: '1col' | '2col' | '3col' | '7-5' | '8-4') => void;
  onOpenComponentPicker?: (targetInsertIndex?: number, targetColumnId?: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onDeleteWidget: (widgetId: string) => void;
  onMoveWidget: (widgetId: string, direction: 'up' | 'down') => void;
  onMoveWidgetToColumn?: (widgetId: string, targetColumnId: string, index?: number) => void;
  // جابه‌جایی سکشن (بلوک/زیربلوک)
  onMoveSectionToColumn?: (sectionId: string, targetColumnId: string, index?: number) => void;
  onMoveSectionToTop?: (sectionId: string, index?: number) => void;
  onMoveSectionOut?: (sectionId: string) => void;
  onMoveSection?: (sectionId: string, direction: 'up' | 'down') => void;
  onAddSubSection?: (columnId: string) => void;
}

/** حداکثر عمق تودرتو برای جلوگیری از رندر بینهایت */
const MAX_DEPTH = 6;

export const Canvas: React.FC<CanvasProps> = ({
  pageSchema,
  pageId,
  pageSlug,
  activeBreakpoint,
  selectedSectionId,
  selectedColumnId,
  selectedWidgetId,
  currentUserRole,
  onSelectSection,
  onSelectColumn,
  onSelectWidget,
  onAddWidget,
  onAddSection,
  onOpenComponentPicker,
  onDeleteSection,
  onDeleteWidget,
  onMoveWidget,
  onMoveWidgetToColumn,
  onMoveSectionToColumn,
  onMoveSectionToTop,
  onMoveSectionOut,
  onMoveSection,
  onAddSubSection
}) => {
  // Drag & Drop state — widget being dragged + column currently hovered (highlight)
  const [dragWidgetId, setDragWidgetId] = useState<string | null>(null);
  // سکشن (بلوک/زیربلوک) در حال کشیدن
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  // Divider (بین سکشن‌ها) که هم‌اکنون نشانهٔ رهاسازی روی آن است — مقدار: 'before' یا 'after:<secId>'
  const [dragOverDividerId, setDragOverDividerId] = useState<string | null>(null);
  const [dragInsertIndex, setDragInsertIndex] = useState<{ colId: string; index: number } | null>(null);

  /** ستون زیر نشانگر ماوس را پیدا می‌کند (برای رهاسازی روی هر نقطه از سکشن) */
  const resolveColumnIdAt = (e: React.DragEvent): string | undefined => {
    // ۱) اول از target خود رویداد — قابل‌اطمینان‌ترین منبع، حتی وقتی pointer خارج viewport است
    const t = e.target as Element | null;
    const fromTarget =
      t && typeof t.closest === 'function' ? (t.closest('[data-col-id]') as HTMLElement | null) : null;
    if (fromTarget?.dataset?.colId) return fromTarget.dataset.colId;
    // ۲) سپس elementFromPoint به‌عنوان پشتیبان (مثلاً وقتی target لایهٔ دیگر است)
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const colEl =
      el && typeof (el as Element).closest === 'function' ? (el as Element).closest('[data-col-id]') : null;
    return (colEl as HTMLElement | null)?.dataset?.colId;
  };

  /**
   * پس‌زمینهٔ لایه‌ای سکشن:
   * - گرادیان (یا رنگ ساده به‌صورت لایهٔ گرادیان یکنواخت) همیشه روی تصویر قرار می‌گیرد (اولین لایه = روی همه)
   * - تصویر پس‌زمینه پایین‌ترین لایه است
   * - شفافیت (backgroundOpacity) روی لایهٔ رنگی/گرادیان اعمال می‌شود تا تصویر از زیر آن دیده شود
   */
  const buildSectionBackgroundImage = (sec: SectionInstance): string | undefined => {
    const layers: string[] = [];
    if (sec.backgroundGradient) {
      layers.push(applyBackgroundOpacity(sec.backgroundGradient, sec.backgroundOpacity));
    } else if (sec.backgroundColor) {
      const c = applyBackgroundOpacity(sec.backgroundColor, sec.backgroundOpacity) || sec.backgroundColor;
      layers.push(`linear-gradient(135deg, ${c} 0%, ${c} 100%)`);
    }
    if (sec.backgroundImage) {
      layers.push(`url("${sec.backgroundImage}")`);
    }
    return layers.length ? layers.join(', ') : undefined;
  };

  /**
   * رندر بازگشتی یک سکشن (بلوک) — زیربلوک‌ها داخل ستون‌ها به‌صورت بازگشتی رندر می‌شوند
   * depth=0 یعنی بلوک سطح اصلی؛ depth>0 یعنی زیربلوک داخل ستون یک بلوک دیگر
   */
  const renderSectionBlock = (sec: SectionInstance, depth: number, secIdx: number, isTopLevel: boolean, totalBlocks?: number) => {
    const isSecSelected = selectedSectionId === sec.id;
    return (
      <div
        id={sec.bookmark || sec.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectSection(sec.id);
        }}
        onDragOver={(e) => {
          // رهاسازی روی هر نقطهٔ سکشن (حتی حاشیه/پدینگ) — ستون زیر نشانگر، وگرنه اولین ستون
          if (dragWidgetId || dragSectionId) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverColumnId(resolveColumnIdAt(e) ?? sec.columns[0]?.id ?? null);
            setDragOverDividerId(null);
          }
        }}
        onDragLeave={(e) => {
          const related = e.relatedTarget as Node | null;
          if (dragOverColumnId && (!related || !e.currentTarget.contains(related))) {
            setDragOverColumnId(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverColumnId(null);
          setDragOverDividerId(null);
          if (dragSectionId) {
            const colId = resolveColumnIdAt(e) ?? sec.columns[0]?.id;
            if (colId) {
              onMoveSectionToColumn?.(dragSectionId, colId);
            }
          } else if (dragWidgetId) {
            const colId = resolveColumnIdAt(e) ?? sec.columns[0]?.id;
            if (colId) {
              const idx = dragInsertIndex?.colId === colId ? dragInsertIndex.index : undefined;
              onMoveWidgetToColumn?.(dragWidgetId, colId, idx);
            }
          }
          setDragWidgetId(null);
          setDragSectionId(null);
          setDragInsertIndex(null);
        }}
        style={{
          // موقعیت و لایهٔ سکشن (fixed/sticky/relative + z-index)
          position: sec.position || undefined,
          zIndex: sec.zIndex || undefined,
          // برای fixed/sticky معمولاً چسبیدن به بالای صفحه کافی است
          top: sec.position === 'fixed' || sec.position === 'sticky' ? 0 : undefined,
          marginTop: sec.marginTop !== undefined ? `${sec.marginTop}px` : undefined,
          marginBottom: sec.marginBottom !== undefined ? `${sec.marginBottom}px` : undefined
        }}
        className={`relative group transition-all border-2 ${
          isSecSelected
            ? 'border-teal-500 shadow-lg'
            : depth > 0
              ? 'border-teal-500/25 hover:border-teal-500/50'
              : 'border-transparent hover:border-teal-500/40'
        }`}
      >
        {/* Section Label & Quick Toolbar on Hover/Select */}
        <div
          className={`absolute top-2 right-4 z-20 flex items-center gap-1.5 transition-opacity ${
            isSecSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {/* نوار نام بلوک — با کشیدن این نوار، کل بلوک جابه‌جا می‌شود */}
          <div
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              setDragSectionId(sec.id);
              setDragWidgetId(null);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', `section:${sec.id}`);
            }}
            onDragEnd={() => {
              setDragSectionId(null);
              setDragOverColumnId(null);
              setDragOverDividerId(null);
              setDragInsertIndex(null);
            }}
            title="برای جابه‌جایی بلوک بکشید — رها کردن روی یک ستون، آن را به زیربلوک آن ستون تبدیل می‌کند"
            className="px-2.5 py-1 rounded-lg bg-teal-600 text-white text-[10px] font-black shadow-md flex items-center gap-1 cursor-grab hover:bg-teal-700 select-none"
          >
            <GripVertical className="w-3 h-3" />
            {sec.name}
            {depth > 0 && <span className="opacity-80 text-[9px]">(زیربلوک)</span>}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveSection?.(sec.id, 'up');
            }}
            disabled={secIdx === 0}
            className="p-1 rounded-lg bg-slate-700 text-white hover:bg-slate-600 shadow-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="انتقال بلوک به بالا"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveSection?.(sec.id, 'down');
            }}
            disabled={typeof totalBlocks === 'number' && secIdx >= totalBlocks - 1}
            className="p-1 rounded-lg bg-slate-700 text-white hover:bg-slate-600 shadow-md cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="انتقال بلوک به پایین"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {depth > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveSectionOut?.(sec.id);
              }}
              className="p-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-md cursor-pointer"
              title="خروج از بلوک (انتقال به سطح اصلی، بعد از بلوک والد)"
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectSection(sec.id);
            }}
            className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-md cursor-pointer"
            title="ویرایش مشخصات سکشن در پنل تنظیمات"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSection(sec.id);
            }}
            className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md cursor-pointer"
            title="حذف سکشن"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section Content Container (Boxed or Full Width) — پس‌زمینه/سایه/گردی گوشه/پدینگ
            سکشن هم روی همین لایه اعمال می‌شود تا برای layout=boxed کل «کارت» باکس‌بندی شود،
            نه فقط گرید ستون‌ها */}
        <div
          className={sec.layout === 'boxed' ? 'max-w-[1200px] mx-auto px-4 md:px-6' : 'w-full px-4'}
          style={{
            backgroundColor:
              sec.backgroundImage || sec.backgroundGradient
                ? undefined
                : sec.backgroundColor
                  ? applyBackgroundOpacity(sec.backgroundColor, sec.backgroundOpacity)
                  : undefined,
            backgroundImage: buildSectionBackgroundImage(sec),
            // وقتی تصویر پس‌زمینه هست، پیش‌فرض cover/center/no-repeat — نه auto (وگرنه تصویر با اندازهٔ طبیعی کوچک دیده می‌شود)
            backgroundPosition: sec.backgroundImage ? sec.backgroundPosition || 'center' : undefined,
            backgroundSize: sec.backgroundImage ? sec.backgroundSize || 'cover' : undefined,
            backgroundRepeat: sec.backgroundImage ? sec.backgroundRepeat || 'no-repeat' : undefined,
            boxShadow: resolveBoxShadow(sec.boxShadow),
            paddingTop: `${sec.paddingTop}px`,
            paddingBottom: `${sec.paddingBottom}px`,
            paddingLeft: sec.paddingLeft !== undefined ? `${sec.paddingLeft}px` : undefined,
            paddingRight: sec.paddingRight !== undefined ? `${sec.paddingRight}px` : undefined,
            // شعاع گوشه‌های جداگانه (مانند فتوشاپ) — ترتیب CSS: TL TR BR BL
            borderRadius: sec.borderRadius
              ? [
                  sec.borderRadius.topLeft,
                  sec.borderRadius.topRight,
                  sec.borderRadius.bottomRight,
                  sec.borderRadius.bottomLeft
                ]
                  .map((v) => (v ? `${v}px` : '0px'))
                  .join(' ')
              : undefined
          }}
        >
          <div className="grid grid-cols-12 gap-4 md:gap-6">
            {sec.columns.map((col) => {
              const isColSelected = selectedColumnId === col.id;
              return (
                <div
                  key={col.id}
                  data-col-id={col.id}
                  style={{
                    gridColumn: `span ${getColumnWidth(col, activeBreakpoint)} / span ${getColumnWidth(col, activeBreakpoint)}`,
                    backgroundColor: col.style?.backgroundColor,
                    position: col.position || undefined,
                    zIndex: col.zIndex || undefined,
                    top: col.position === 'fixed' || col.position === 'sticky' ? `${col.offsetTop ?? 0}px` : undefined
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSection(sec.id);
                    onSelectColumn(col.id);
                  }}
                  onDragOver={(e) => {
                    // Allow drop on any column — highlight while dragging over (ویجت یا بلوک)
                    if (dragWidgetId || dragSectionId) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverColumnId(col.id);
                      setDragOverDividerId(null);
                      // فضای خالی ستون (نه روی یک بلوک) → نشانگر انتهای فهرست بلوک‌ها
                      const t = e.target as Element | null;
                      const inBlock =
                        t && typeof t.closest === 'function' ? t.closest('[data-block-kind]') : null;
                      if (!inBlock) {
                        setDragInsertIndex({ colId: col.id, index: getColumnBlocks(col).length });
                      }
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverColumnId === col.id) {
                      setDragOverColumnId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumnId(null);
                    setDragOverDividerId(null);
                    const idx = dragInsertIndex?.colId === col.id ? dragInsertIndex.index : undefined;
                    if (dragSectionId) {
                      // رها کردن یک بلوک روی ستون → تبدیل به زیربلوک (در ایندکس نشانگر)
                      onMoveSectionToColumn?.(dragSectionId, col.id, idx);
                    } else if (dragWidgetId) {
                      // Move the widget to this column (cross-section DnD) — index if hovering over a widget
                      onMoveWidgetToColumn?.(dragWidgetId, col.id, idx);
                    }
                    setDragWidgetId(null);
                    setDragSectionId(null);
                    setDragInsertIndex(null);
                  }}
                  className={`min-h-[100px] min-w-0 p-3 rounded-2xl border-2 transition-all flex flex-col justify-between relative group/col ${
                    isColSelected
                      ? 'border-indigo-500 bg-indigo-500/5'
                      : 'border-dashed border-gray-300 dark:border-slate-800 hover:border-indigo-400'
                  } ${
                    dragOverColumnId === col.id
                      ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/30'
                      : ''
                  }`}
                >
                  {/* Widgets + زیربلوک‌ها inside column — لیست یکپارچه blocks (ترتیب نمایش ملاک است) */}
                  <div className="space-y-4">
                    {getColumnBlocks(col).length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-gray-200 dark:border-slate-800/80 rounded-xl text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                        <span>ستون خالی است — بلوک یا کامپوننت را اینجا رها کنید</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenComponentPicker) {
                              onOpenComponentPicker(undefined, col.id);
                            } else {
                              onAddWidget('heading', col.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white text-slate-600 dark:text-slate-300 font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن کامپوننت</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {getColumnBlocks(col).map((block, bIdx) => {
                          if (block.kind === 'section') {
                            const sub = block.section;
                            const subIdx = bIdx;
                            return (
                              <div
                                key={sub.id}
                                data-block-kind="section"
                                className="relative"
                                onDragOver={(e) => {
                                  // DnD زیربلوک/ویجت — قبل/بعد این بلوک (فقط وقتی مستقیم روی خود بلوک هستیم؛
                                  // ویجت/زیربلوک داخلی ایندکس دقیق‌تری می‌گذارند)
                                  if ((dragWidgetId || dragSectionId) && dragSectionId !== sub.id) {
                                    const t = e.target as Element | null;
                                    const blockEl =
                                      t && typeof t.closest === 'function' ? t.closest('[data-block-kind]') : null;
                                    if (blockEl === e.currentTarget) {
                                      e.preventDefault();
                                      e.dataTransfer.dropEffect = 'move';
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const before = e.clientY < rect.top + rect.height / 2;
                                      setDragInsertIndex({ colId: col.id, index: before ? bIdx : bIdx + 1 });
                                      setDragOverColumnId(col.id);
                                      setDragOverDividerId(null);
                                    }
                                  }
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const before = e.clientY < rect.top + rect.height / 2;
                                  const idx = before ? bIdx : bIdx + 1;
                                  if (dragSectionId && dragSectionId !== sub.id) {
                                    onMoveSectionToColumn?.(dragSectionId, col.id, idx);
                                  } else if (dragWidgetId) {
                                    onMoveWidgetToColumn?.(dragWidgetId, col.id, idx);
                                  }
                                  setDragWidgetId(null);
                                  setDragSectionId(null);
                                  setDragOverColumnId(null);
                                  setDragOverDividerId(null);
                                  setDragInsertIndex(null);
                                }}
                              >
                                {/* نشانگر درج — قبل از این بلوک */}
                                {dragInsertIndex?.colId === col.id && dragInsertIndex.index === bIdx && (
                                  <div className="absolute -top-[9px] right-2 left-2 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_2px_rgba(20,184,166,0.45)] z-40 pointer-events-none" />
                                )}
                                {depth + 1 < MAX_DEPTH
                                  ? renderSectionBlock(sub, depth + 1, subIdx, false, getColumnBlocks(col).length)
                                  : null}
                              </div>
                            );
                          }
                          const widget = block.widget;
                          const wIdx = bIdx;
                          const isWidgetSel = selectedWidgetId === widget.id;
                          return (
                            <div
                              key={widget.id}
                              data-block-kind="widget"
                              draggable
                              onDragStart={(e) => {
                                setDragWidgetId(widget.id);
                                setDragSectionId(null);
                                setDragInsertIndex(null);
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', widget.id);
                              }}
                              onDragOver={(e) => {
                                // رها کردن بین بلوک‌ها — نصف بالایی = قبل، نصف پایینی = بعد (هم ویجت و هم زیربلوک)
                                if ((dragWidgetId && dragWidgetId !== widget.id) || dragSectionId) {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = 'move';
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const before = e.clientY < rect.top + rect.height / 2;
                                  setDragInsertIndex({ colId: col.id, index: before ? wIdx : wIdx + 1 });
                                  setDragOverColumnId(col.id);
                                  setDragOverDividerId(null);
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // محاسبه مستقیم ایندکس از مختصات نشانگر — state حین درگ ممکن است قدیمی باشد
                                const rect = e.currentTarget.getBoundingClientRect();
                                const before = e.clientY < rect.top + rect.height / 2;
                                const idx = before ? wIdx : wIdx + 1;
                                if (dragSectionId) {
                                  // رها کردن زیربلوک قبل/بعد این ویجت
                                  onMoveSectionToColumn?.(dragSectionId, col.id, idx);
                                } else if (dragWidgetId) {
                                  onMoveWidgetToColumn?.(dragWidgetId, col.id, idx);
                                }
                                setDragWidgetId(null);
                                setDragOverColumnId(null);
                                setDragOverDividerId(null);
                                setDragInsertIndex(null);
                              }}
                              onDragEnd={() => {
                                setDragWidgetId(null);
                                setDragOverColumnId(null);
                                setDragOverDividerId(null);
                                setDragInsertIndex(null);
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectSection(sec.id);
                                onSelectColumn(col.id);
                                onSelectWidget(widget.id);
                              }}
                              className={`relative group/widget rounded-xl transition-all border-2 ${
                                isWidgetSel
                                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                                  : 'border-transparent hover:border-amber-400/50'
                              } ${
                                dragWidgetId === widget.id
                                  ? 'opacity-40 cursor-grabbing'
                                  : 'cursor-grab'
                              }`}
                            >
                              {/* نشانگر درج — قبل از این ویجت */}
                              {dragInsertIndex?.colId === col.id && dragInsertIndex.index === wIdx && (
                                <div className="absolute -top-[9px] right-2 left-2 h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_2px_rgba(20,184,166,0.45)] z-40 pointer-events-none" />
                              )}
                              {/* برچسب نوع ویجت — همیشه نمایان تا نوع هر ویجت قابل‌تشخیص باشد */}
                              <div
                                className={`absolute -top-3 left-1/2 -translate-x-1/2 z-30 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black shadow-md whitespace-nowrap pointer-events-none transition-opacity ${
                                  isWidgetSel
                                    ? 'opacity-100'
                                    : 'opacity-60 group-hover/widget:opacity-100'
                                }`}
                                title={`نوع ویجت: ${getWidgetTypeLabel(widget.type)}`}
                              >
                                {getWidgetTypeLabel(widget.type)}
                              </div>
                              {/* Drag handle indicator on hover */}
                              <div
                                className={`absolute top-2 right-2 z-30 p-1 rounded-lg bg-slate-900/80 text-slate-300 border border-slate-700 backdrop-blur-md transition-opacity ${
                                  isWidgetSel
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover/widget:opacity-100'
                                }`}
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>

                              {/* Widget Hover Action Bar */}
                              <div
                                className={`absolute top-2 left-2 z-30 flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl text-white text-xs border border-slate-700 backdrop-blur-md transition-opacity ${
                                  isWidgetSel ? 'opacity-100' : 'opacity-0 group-hover/widget:opacity-100'
                                }`}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectSection(sec.id);
                                    onSelectColumn(col.id);
                                    onSelectWidget(widget.id);
                                  }}
                                  className="p-1 hover:text-amber-400 cursor-pointer"
                                  title="ویرایش مشخصات ویجت در پنل تنظیمات"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveWidget(widget.id, 'up');
                                  }}
                                  disabled={bIdx === 0}
                                  className="p-1 hover:text-amber-400 disabled:opacity-30 cursor-pointer"
                                  title="انتقال به بالا"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMoveWidget(widget.id, 'down');
                                  }}
                                  disabled={bIdx === getColumnBlocks(col).length - 1}
                                  className="p-1 hover:text-amber-400 disabled:opacity-30 cursor-pointer"
                                  title="انتقال به پایین"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteWidget(widget.id);
                                  }}
                                  className="p-1 hover:text-rose-400 cursor-pointer"
                                  title="حذف ویجت"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Render Widget */}
                              <WidgetRenderer
                                widget={widget}
                                currentUserRole={currentUserRole}
                                isEditorPreview={true}
                                pageId={pageId}
                                pageSlug={pageSlug}
                              />
                            </div>
                          );
                        })}

                        {/* نشانگر انتهای فهرست بلوک‌ها (افزودن بعد از آخرین بلوک) */}
                        {dragInsertIndex?.colId === col.id && dragInsertIndex.index === getColumnBlocks(col).length && (
                          <div className="h-1.5 rounded-full bg-teal-500 shadow-[0_0_8px_2px_rgba(20,184,166,0.45)] mt-1" />
                        )}
                      </>
                    )}
                  </div>

                  {/* Column Add Widget / Add Sub-Block Trigger Button at bottom */}
                  <div className="pt-2 flex flex-col items-center gap-1.5 opacity-0 group-hover/col:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenComponentPicker) {
                          onOpenComponentPicker(undefined, col.id);
                        } else {
                          onAddWidget('heading', col.id);
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer hover:bg-indigo-700"
                    >
                      <Plus className="w-3 h-3" />
                      <span>افزودن کامپوننت به این ستون</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddSubSection?.(col.id);
                      }}
                      className="px-3 py-1 rounded-lg bg-teal-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer hover:bg-teal-700"
                      title="ایجاد بلوک زیرمجموعه (زیربلوک) داخل این ستون"
                    >
                      <Layers className="w-3 h-3" />
                      <span>افزودن زیربلوک به این ستون</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Breakpoint container width calculator
  const getCanvasWidthClass = () => {
    switch (activeBreakpoint) {
      case 'tablet':
        return 'max-w-[768px] shadow-2xl my-6 rounded-3xl border border-gray-300 dark:border-slate-800';
      case 'mobile':
        return 'max-w-[390px] shadow-2xl my-6 rounded-3xl border border-gray-300 dark:border-slate-800';
      default:
        return 'w-full';
    }
  };

  // فال‌بک دفاعی — اگر شمای صفحه (مثلاً یک صفحهٔ لایوت تازه‌ساز) بدون globalStyles
  // بارگذاری شود، بوم نباید کرش کند
  const globalStyles = pageSchema.globalStyles || DEFAULT_GLOBAL_STYLES;

  return (
    <>
      {/* در بوم استودیو، انیمیشن‌های CSS اجرا نمی‌شوند (فریز در همان فریم) */}
      <style>{`
        .pb-editor-canvas *,
        .pb-editor-canvas *::before,
        .pb-editor-canvas *::after {
          animation-play-state: paused !important;
          animation-duration: 0s !important;
          transition-duration: 0.001s !important;
        }
      `}</style>
      <div
        className="flex-1 min-h-0 h-full w-full bg-slate-100 dark:bg-slate-950 overflow-auto p-4 md:p-8 pb-56 flex flex-col items-center select-none rtl text-right transition-all"
      onDragOver={(e) => {
        // رهاسازی روی فضای خالی بوم (خارج از سکشن‌ها) مجاز باشد
        if (dragWidgetId || dragSectionId) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOverColumnId(null);
        setDragOverDividerId(null);
        if (dragSectionId) {
          // رها کردن بلوک روی فضای خالی بوم → انتقال به انتهای صفحه
          onMoveSectionToTop?.(dragSectionId, pageSchema.sections.length);
        } else if (dragWidgetId) {
          const last = pageSchema.sections[pageSchema.sections.length - 1];
          const targetColId = last ? last.columns[last.columns.length - 1]?.id : undefined;
          if (targetColId) {
            onMoveWidgetToColumn?.(dragWidgetId, targetColId);
          }
        }
        setDragWidgetId(null);
        setDragSectionId(null);
      }}
    >
      {/* Canvas Frame Container — shrink-0 keeps natural height so the overflow-auto canvas scrolls (x & y) when sections exceed viewport */}
      <div
        className={`bg-white dark:bg-slate-900 transition-all duration-300 overflow-hidden mb-32 shrink-0 pb-editor-canvas ${getCanvasWidthClass()}`}
        style={{
          fontFamily: globalStyles.fontFamily,
          color: globalStyles.textColor,
          backgroundColor: globalStyles.backgroundColor || undefined
        }}
        onClickCapture={(e) => {
          // در بوم استودیو، لینک‌های داخلی نباید ناوبری شوند — فقط preventDefault،
          // تا رویداد همچنان به ویجت برسد و انتخاب ویجت انجام شود.
          const t = e.target as Element | null;
          const anchor = t && typeof t.closest === 'function' ? t.closest('a[href]') : null;
          if (anchor) {
            const href = anchor.getAttribute('href') || '';
            const isExternal = /^(https?:|mailto:|tel:|ftp:|javascript:)/i.test(href);
            if (!isExternal) {
              e.preventDefault();
            }
          }
        }}
        onDragOver={(e) => {
          if (dragWidgetId || dragSectionId) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverColumnId(null);
          setDragOverDividerId(null);
          if (dragSectionId) {
            // رها کردن بلوک روی قاب بوم → انتقال به انتهای صفحه
            onMoveSectionToTop?.(dragSectionId, pageSchema.sections.length);
          } else if (dragWidgetId) {
            const last = pageSchema.sections[pageSchema.sections.length - 1];
            const targetColId = last ? last.columns[last.columns.length - 1]?.id : undefined;
            if (targetColId) {
              onMoveWidgetToColumn?.(dragWidgetId, targetColId);
            }
          }
          setDragWidgetId(null);
          setDragSectionId(null);
        }}
      >
        {pageSchema.sections.length === 0 ? (
          <div className="p-16 text-center space-y-4 flex flex-col items-center justify-center min-h-[400px]">
            <div className="p-4 rounded-full bg-teal-500/10 text-teal-500">
              <Grid className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">بوم طراحی خالی است</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              جهت شروع طراحی، یک بلوک یا چیدمان جدید از طریق دیالوگ کامپوننت‌ها ایجاد نمایید.
            </p>
            <button
              onClick={() => onOpenComponentPicker ? onOpenComponentPicker(0) : onAddSection('1col')}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اولین بلوک صفحه</span>
            </button>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Divider button before the first section */}
            <div
              className={`relative my-2 group/divider py-2 flex items-center justify-center transition-colors rounded-xl ${
                dragOverDividerId === 'before'
                  ? 'bg-teal-500/20 ring-2 ring-teal-500'
                  : ''
              }`}
              onDragOver={(e) => {
                if (dragWidgetId || dragSectionId) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverDividerId('before');
                  setDragOverColumnId(null);
                }
              }}
              onDragLeave={(e) => {
                const related = e.relatedTarget as Node | null;
                if (dragOverDividerId === 'before' && (!related || !e.currentTarget.contains(related))) {
                  setDragOverDividerId(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOverColumnId(null);
                setDragOverDividerId(null);
                if (dragSectionId) {
                  // رها کردن بلوک روی خط‌جداکننده ابتدا → انتقال به ابتدای صفحه
                  onMoveSectionToTop?.(dragSectionId, 0);
                } else if (dragWidgetId) {
                  const first = pageSchema.sections[0];
                  const targetColId = first ? first.columns[0]?.id : undefined;
                  if (targetColId) {
                    onMoveWidgetToColumn?.(dragWidgetId, targetColId);
                  }
                }
                setDragWidgetId(null);
                setDragSectionId(null);
              }}
            >
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-dashed border-teal-500/30 group-hover/divider:border-teal-500 transition-colors" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenComponentPicker) {
                    onOpenComponentPicker(0);
                  } else {
                    onAddSection('1col');
                  }
                }}
                className="relative z-10 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md transition-transform transform hover:scale-105 cursor-pointer opacity-80 hover:opacity-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن بلوک جدید به ابتدا</span>
              </button>
            </div>
            {pageSchema.sections.map((sec, secIdx) => {
              // Check section visibility for active breakpoint
              if (!sec.visibility[activeBreakpoint]) {
                return (
                  <div key={sec.id}>
                    <div
                      onClick={() => onSelectSection(sec.id)}
                      className="p-3 bg-slate-200/60 dark:bg-slate-800/60 border border-dashed border-slate-400 text-xs text-slate-500 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 font-bold">
                        <EyeOff className="w-4 h-4" />
                        سکشن «{sec.name}» در حالت {activeBreakpoint} مخفی می‌باشد
                      </span>
                      <span className="text-[10px]">کلیک برای تنظیمات</span>
                    </div>

                    {/* Divider line after hidden section */}
                    <div
                      className={`relative my-2 group/divider py-2 flex items-center justify-center transition-colors rounded-xl ${
                        dragOverDividerId === 'after:' + sec.id
                          ? 'bg-teal-500/20 ring-2 ring-teal-500'
                          : ''
                      }`}
                      onDragOver={(e) => {
                        if (dragWidgetId || dragSectionId) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverDividerId('after:' + sec.id);
                          setDragOverColumnId(null);
                        }
                      }}
                      onDragLeave={(e) => {
                        const related = e.relatedTarget as Node | null;
                        if (
                          dragOverDividerId === 'after:' + sec.id &&
                          (!related || !e.currentTarget.contains(related))
                        ) {
                          setDragOverDividerId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverColumnId(null);
                        setDragOverDividerId(null);
                        if (dragSectionId) {
                          // رها کردن بلوک روی خط‌جداکننده → انتقال به سطح اصلی در این مکان
                          onMoveSectionToTop?.(dragSectionId, secIdx + 1);
                        } else if (dragWidgetId) {
                          const next = pageSchema.sections[secIdx + 1];
                          const targetColId = next
                            ? next.columns[0]?.id
                            : sec.columns[sec.columns.length - 1]?.id;
                          if (targetColId) {
                            onMoveWidgetToColumn?.(dragWidgetId, targetColId);
                          }
                        }
                        setDragWidgetId(null);
                        setDragSectionId(null);
                      }}
                    >
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-dashed border-teal-500/30 group-hover/divider:border-teal-500 transition-colors" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenComponentPicker) {
                            onOpenComponentPicker(secIdx + 1);
                          } else {
                            onAddSection('1col');
                          }
                        }}
                        className="relative z-10 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md transition-transform transform hover:scale-105 cursor-pointer opacity-80 hover:opacity-100"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن بلوک جدید در این مکان</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <React.Fragment key={sec.id}>
                  {renderSectionBlock(sec, 0, secIdx, true, pageSchema.sections.length)}

                  {/* Interactive Add Section Divider between blocks */}
                  <div
                    className={`relative my-2 group/divider py-2 flex items-center justify-center transition-colors rounded-xl ${
                      dragOverDividerId === 'after:' + sec.id
                        ? 'bg-teal-500/20 ring-2 ring-teal-500'
                        : ''
                    }`}
                    onDragOver={(e) => {
                      if (dragWidgetId || dragSectionId) {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverDividerId('after:' + sec.id);
                        setDragOverColumnId(null);
                      }
                    }}
                    onDragLeave={(e) => {
                      const related = e.relatedTarget as Node | null;
                      if (
                        dragOverDividerId === 'after:' + sec.id &&
                        (!related || !e.currentTarget.contains(related))
                      ) {
                        setDragOverDividerId(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverColumnId(null);
                      setDragOverDividerId(null);
                      if (dragSectionId) {
                        // رها کردن بلوک روی خط‌جداکننده → انتقال به سطح اصلی در این مکان
                        onMoveSectionToTop?.(dragSectionId, secIdx + 1);
                      } else if (dragWidgetId) {
                        const next = pageSchema.sections[secIdx + 1];
                        const targetColId = next
                          ? next.columns[0]?.id
                          : sec.columns[sec.columns.length - 1]?.id;
                        if (targetColId) {
                          onMoveWidgetToColumn?.(dragWidgetId, targetColId);
                        }
                      }
                      setDragWidgetId(null);
                      setDragSectionId(null);
                    }}
                  >
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-dashed border-teal-500/30 group-hover/divider:border-teal-500 transition-colors" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenComponentPicker) {
                          onOpenComponentPicker(secIdx + 1);
                        } else {
                          onAddSection('1col');
                        }
                      }}
                      className="relative z-10 px-3 py-1 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] flex items-center gap-1.5 shadow-md transition-transform transform hover:scale-105 cursor-pointer opacity-80 hover:opacity-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن بلوک جدید در این مکان</span>
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
};
