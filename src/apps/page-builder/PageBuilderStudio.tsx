import React, { useState, useEffect } from 'react';
import {
  SmartPageSchema,
  SectionInstance,
  ColumnInstance,
  ColumnResponsiveWidths,
  WidgetInstance,
  WidgetType,
  GlobalStyles,
  Breakpoint,
  PageVersion,
  UserRoleCondition,
  PageTemplate,
  ColumnBlock,
  getColumnBlocks,
  setColumnBlocks
} from './builderTypes';
import { INITIAL_SMART_PAGE } from './mockData';
import { Canvas } from './Canvas';
import { InspectorPanel } from './InspectorPanel';
import { GlobalStyleModal } from './GlobalStyleModal';
import { TemplateModal } from './TemplateModal';
import { PreviewModal } from './PreviewModal';
import { ExportModal } from './ExportModal';
import { ComponentPickerModal } from './ComponentPickerModal';
import { TabSectionEditorModal } from './TabSectionEditorModal';
import { PagesList, buildPagePath } from './PagesList';
import { ConfirmDialog } from '@/src/shared-components/ConfirmDialog';
import { PageSettingsModal } from './PageSettingsModal';
import { ChildPagesManagerModal } from './ChildPagesManagerModal';
import {
  fetchSmartPages,
  fetchSmartPage,
  fetchSmartPageChildrenTree,
  createSmartPage,
  updateSmartPage,
  deleteSmartPage,
  duplicateSmartPage,
  SmartPageDto,
  SmartPageTreeNode
} from './api';
import { useLanguage } from '@/src/shared-utils/LanguageContext';
import {
  Save,
  Undo2,
  Redo2,
  Eye,
  Code,
  Palette,
  FolderPlus,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  CheckCircle,
  Clock,
  History,
  LayoutGrid,
  Sparkles,
  Layers,
  FileCode,
  ArrowRight,
  Plus,
  Settings2,
  Loader2,
  FolderTree,
  ChevronDown
} from 'lucide-react';

interface PageBuilderStudioProps {
  onBackToPortal?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** اگر تنظیم شود، استودیو مستقیماً همان صفحه را باز می‌کند (نه فهرست) — مثلاً هنگام ورود از «ویرایش لایوت» یک صفحهٔ اختصاصی */
  initialPageId?: string | number;
}

export const PageBuilderStudio: React.FC<PageBuilderStudioProps> = ({ onBackToPortal, initialPageId, onDirtyChange }) => {
  // زبان محتوای فعال — فهرست صفحات و ایجاد صفحهٔ جدید همیشه مطابق همین زبان است
  const { currentLang, languages } = useLanguage();

  // Main Page Schema state
  const [pageSchema, setPageSchema] = useState<SmartPageSchema>(INITIAL_SMART_PAGE);

  // Multi-page state (persisted via backend SmartPage API)
  const [pages, setPages] = useState<SmartPageDto[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  // متغیرهای صفحهٔ اختصاصی‌ای که صفحهٔ لایوت فعلی به آن متصل است (اگر باشد) — برای
  // حل توکن‌های {{key}} در ویجت‌های عنوان/متن، هم در بوم و هم در پیش‌نمایش
  const [dedicatedPageVariables, setDedicatedPageVariables] = useState<Record<string, string> | undefined>(undefined);
  /** شناسهٔ نمونهٔ صفحهٔ اختصاصیِ استفاده‌شده برای پیش‌نمایش بلوک‌های dp-* — وقتی این لایوت به یک نوع صفحهٔ اختصاصی متصل است */
  const [previewDedicatedPageId, setPreviewDedicatedPageId] = useState<number | undefined>(undefined);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);

  // View mode: card-list of pages (default) OR the builder editor
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');

  // Version history dropdown (moved from the removed right sidebar into the top bar)
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  // Delete confirmation dialog state
  const [pageToDelete, setPageToDelete] = useState<SmartPageDto | null>(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

  // Duplicate-to-another-language state
  const [duplicatingPageId, setDuplicatingPageId] = useState<number | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Child-pages manager (زیرصفحه‌ها فقط از داخل استودیوی صفحهٔ والد مدیریت می‌شوند)
  const [showChildPagesModal, setShowChildPagesModal] = useState(false);
  const [childPagesTree, setChildPagesTree] = useState<SmartPageTreeNode[]>([]);
  const [isLoadingChildPages, setIsLoadingChildPages] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [childCreateError, setChildCreateError] = useState<string | null>(null);

  // Load saved pages from backend on mount, and again whenever the active
  // content language changes (the list is scoped to one language at a time).
  useEffect(() => {
    let cancelled = false;
    setIsLoadingPages(true);
    fetchSmartPages({ per_page: 100, lang: currentLang })
      .then((res) => {
        if (cancelled) return;
        setPages(res.data);
        setIsLoadingPages(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoadingPages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentLang]);

  // Open the editor for a saved page
  const openEditor = (id: number) => {
    loadPage(id);
    setViewMode('editor');
    setShowVersionHistory(false);
  };

  // اگر با initialPageId باز شده باشیم (مثلاً از «ویرایش لایوت» یک صفحهٔ اختصاصی)،
  // مستقیماً همان صفحه را باز کن — نه فهرست را. با تغییر initialPageId (تب همان
  // ماژول برای رکورد دیگری دوباره استفاده شود) هم دوباره اجرا می‌شود.
  useEffect(() => {
    if (initialPageId !== undefined && initialPageId !== null) {
      openEditor(Number(initialPageId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPageId]);

  // Recursively ensure every column has a subSections array (heals legacy schemas
  // created before the key existed, preventing renderer crashes). Nested sections are
  // read from getColumnBlocks (blocks is the source of truth), not the raw subSections
  // field — otherwise a sub-block authored only in `blocks` (no mirrored `subSections`)
  // never gets recursed into, and its own descendants stay un-normalized.
  const normalizeSubSections = (sections: SectionInstance[]): SectionInstance[] =>
    sections.map((sec) => ({
      ...sec,
      columns: (sec.columns ?? []).map((col) => {
        const rawBlocks = getColumnBlocks(col);
        const normalizedSubs = normalizeSubSections(
          rawBlocks
            .filter((b): b is Extract<ColumnBlock, { kind: 'section' }> => b.kind === 'section')
            .map((b) => b.section)
        );
        const subById = new Map(normalizedSubs.map((s) => [s.id, s]));
        const finalBlocks: ColumnBlock[] = rawBlocks.map((b) =>
          b.kind === 'section' && subById.has(b.section.id) ? { ...b, section: subById.get(b.section.id)! } : b
        );
        const base: ColumnInstance = {
          ...col,
          widgets: Array.isArray(col.widgets) ? col.widgets : [],
        };
        // blocks را می‌سازد (اگر نبود) و subSections/widgets را از همان همگام می‌کند
        return setColumnBlocks(base, finalBlocks);
      }),
    }));

  // Load a saved page (full schema) and make it active
  const loadPage = async (id: number) => {
    try {
      const dto = await fetchSmartPage(id);
      const schema = (dto.schema ?? {}) as unknown as SmartPageSchema;
      const merged: SmartPageSchema = {
        ...schema,
        id: `page-${dto.id}`,
        title: dto.title ?? schema.title ?? 'صفحه بدون عنوان',
        slug: dto.slug ?? schema.slug ?? `page-${dto.id}`,
        status: dto.status ?? schema.status ?? 'draft',
        seo: dto.seo ?? schema.seo,
        updatedAt: dto.updated_at ?? schema.updatedAt,
      };
      merged.sections = normalizeSubSections(merged.sections ?? []);
      setActivePageId(dto.id!);
      setCurrentParentId(dto.parent_id ?? null);
      setPageSchema(merged);
      setUndoStack([]);
      setRedoStack([]);
      setIsPageDirty(false);
      setSelectedSectionId(merged.sections[0]?.id ?? null);
      setSelectedColumnId(merged.sections[0]?.columns[0]?.id ?? null);
      setSelectedWidgetId(merged.sections[0]?.columns[0]?.widgets[0]?.id ?? null);

      setDedicatedPageVariables(undefined);
      setPreviewDedicatedPageId(undefined);
    } catch {
      // ignore — keep current schema
    }
  };

  // Create a brand-new (unsaved) page
  const handleCreatePage = () => {
    const fresh = JSON.parse(JSON.stringify(INITIAL_SMART_PAGE)) as SmartPageSchema;
    fresh.id = `page-new-${Date.now()}`;
    fresh.slug = `page-${Date.now()}`;
    fresh.title = 'صفحه جدید';
    fresh.status = 'draft';
    fresh.seo = { title: '', description: '', keywords: '', og_image: '' };
    fresh.createdAt = new Date().toISOString().slice(0, 10);
    fresh.updatedAt = new Date().toISOString().slice(0, 10);
    fresh.versionHistory = [];
    fresh.sections = [];
    setActivePageId(null);
    setCurrentParentId(null);
    setDedicatedPageVariables(undefined);
    setPageSchema(fresh);
    setUndoStack([]);
    setRedoStack([]);
    setIsPageDirty(false);
    setSelectedSectionId(null);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
    setViewMode('editor');
    setShowVersionHistory(false);
    // Prompt user to fill title/slug/SEO right away
    setShowPageSettingsModal(true);
  };

  // Open the delete confirmation dialog for a page
  const handleDeleteRequest = (page: SmartPageDto) => {
    setPageToDelete(page);
  };

  // Actually delete after dialog confirmation
  const handleConfirmDeletePage = async () => {
    const id = pageToDelete?.id;
    if (!id) return;
    setIsDeletingPage(true);
    try {
      await deleteSmartPage(id);
      const remaining = pages.filter((p) => p.id !== id);
      setPages(remaining);
      if (activePageId === id) {
        // Deleted page was active in the editor → reset and return to the list
        setActivePageId(null);
        setPageSchema(JSON.parse(JSON.stringify(INITIAL_SMART_PAGE)));
        setUndoStack([]);
        setRedoStack([]);
        setViewMode('list');
      } else if (activePageId) {
        // حذف یک زیرصفحه → فهرست زیرصفحه‌های صفحهٔ باز به‌روز شود
        void loadChildPages(activePageId);
      }
      setPageToDelete(null);
    } catch {
      // keep dialog open on failure
    } finally {
      setIsDeletingPage(false);
    }
  };

  // کپی صفحه به یک زبان دیگر — چون هر زبان یک صفحهٔ مستقل است، این تنها راه
  // شروع سریع (بدون بازسازی چیدمان از صفر) برای ساخت نسخهٔ همان صفحه در زبان
  // دیگر است؛ نسخهٔ تازه همیشه پیش‌نویس است تا محتوایش ترجمه/بازبینی شود.
  const handleDuplicatePage = async (page: SmartPageDto, targetLang: string) => {
    if (!page.id) return;
    setDuplicatingPageId(page.id);
    setDuplicateError(null);
    try {
      await duplicateSmartPage(page.id, targetLang);
      // نسخهٔ تازه در زبان مقصد ساخته شده — اگر همان زبان فعلی است در فهرست هم نمایش داده شود
      if (targetLang === currentLang) {
        const list = await fetchSmartPages({ per_page: 100, lang: currentLang });
        setPages(list.data);
      }
    } catch (err) {
      setDuplicateError(err instanceof Error ? err.message : 'خطا در ایجاد نسخهٔ زبان دیگر');
    } finally {
      setDuplicatingPageId(null);
    }
  };

  // ---- مدیریت زیرصفحه‌ها (Child Pages) ----

  // بارگذاری زیرصفحه‌های یک صفحه برای نمایش در مدیر زیرصفحه‌ها
  const loadChildPages = async (id: number) => {
    setIsLoadingChildPages(true);
    try {
      setChildPagesTree(await fetchSmartPageChildrenTree(id));
    } catch {
      setChildPagesTree([]);
    } finally {
      setIsLoadingChildPages(false);
    }
  };

  // باز کردن مدیر زیرصفحه‌ها از داخل استودیوی صفحهٔ والد
  const handleOpenChildPages = () => {
    setChildCreateError(null);
    if (activePageId) void loadChildPages(activePageId);
    else setChildPagesTree([]);
    setShowChildPagesModal(true);
  };

  // ساخت زیرصفحهٔ جدید برای صفحهٔ فعلی — بلافاصله در ویرایشگر باز می‌شود
  const handleCreateChild = async (
    data: { title: string; slug: string; status: 'published' | 'draft' },
    parentId: number
  ) => {
    setIsCreatingChild(true);
    setChildCreateError(null);
    try {
      // sort_order = تعداد زیرصفحه‌های مستقیمِ همان والد (از روی درخت)
      const directChildCount = (nodes: SmartPageTreeNode[], targetId: number): number | null => {
        if (targetId === activePageId) return nodes.length;
        for (const n of nodes) {
          if (n.id === targetId) return n.children.length;
          const found = directChildCount(n.children, targetId);
          if (found !== null) return found;
        }
        return null;
      };
      const fresh = JSON.parse(JSON.stringify(INITIAL_SMART_PAGE)) as SmartPageSchema;
      fresh.id = `page-new-${Date.now()}`;
      fresh.slug = data.slug;
      fresh.title = data.title;
      fresh.status = data.status;
      fresh.seo = { title: '', description: '', keywords: '', og_image: '' };
      fresh.createdAt = new Date().toISOString().slice(0, 10);
      fresh.updatedAt = new Date().toISOString().slice(0, 10);
      fresh.versionHistory = [];
      fresh.sections = [];
      const res = await createSmartPage({
        title: data.title,
        slug: data.slug,
        parent_id: parentId,
        sort_order: directChildCount(childPagesTree, parentId) ?? 0,
        status: data.status,
        seo: { title: '', description: '', keywords: '', og_image: '' },
        schema: fresh as unknown as Record<string, unknown>,
        lang: currentLang,
      });
      // به‌روزرسانی فهرست‌ها و رفتن به طراحی زیرصفحهٔ تازه‌ساخته
      const list = await fetchSmartPages({ per_page: 100, lang: currentLang });
      setPages(list.data);
      void loadChildPages(activePageId!);
      setShowChildPagesModal(false);
      openEditor(res.data.id!);
    } catch (err) {
      setChildCreateError(err instanceof Error ? err.message : 'خطا در ایجاد زیرصفحه');
    } finally {
      setIsCreatingChild(false);
    }
  };

  // درخواست حذف یک زیرصفحه (دیالوگ تأیید مشترک با صفحات عادی)
  const handleDeleteChild = (page: SmartPageDto) => {
    handleDeleteRequest(page);
  };

  // Save page meta (title/slug/status/seo) — create or update
  const handleSavePageSettings = async (data: {
    title: string;
    slug: string;
    parent_id?: number | null;
    status: 'published' | 'draft';
    seo: { title?: string; description?: string; keywords?: string; og_image?: string };
  }) => {
    setIsSavingPage(true);
    try {
      const payload = {
        title: data.title,
        slug: data.slug,
        parent_id: data.parent_id ?? null,
        status: data.status,
        seo: data.seo,
        schema: JSON.parse(JSON.stringify(pageSchema)),
      };
      if (activePageId) {
        await updateSmartPage(activePageId, payload);
        setCurrentParentId(data.parent_id ?? null);
      } else {
        const res = await createSmartPage({ ...payload, lang: currentLang });
        setActivePageId(res.data.id!);
        setCurrentParentId(data.parent_id ?? null);
        setPageSchema((prev) => ({ ...prev, id: `page-${res.data.id}` }));
      }
      setPageSchema((prev) => ({
        ...prev,
        title: data.title,
        slug: data.slug,
        status: data.status,
        seo: data.seo,
      }));
      const list = await fetchSmartPages({ per_page: 100, lang: currentLang });
      setPages(list.data);
      setShowPageSettingsModal(false);
    } catch {
      // keep modal open on failure
    } finally {
      setIsSavingPage(false);
    }
  };

  // Undo / Redo history stack
  const [undoStack, setUndoStack] = useState<SmartPageSchema[]>([]);
  const [redoStack, setRedoStack] = useState<SmartPageSchema[]>([]);

  // Selection state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(pageSchema.sections[0]?.id || null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(pageSchema.sections[0]?.columns[0]?.id || null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(pageSchema.sections[0]?.columns[0]?.widgets[0]?.id || null);

  // Responsive Breakpoint
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('desktop');

  // Simulated User Role for testing
  const [currentUserRole, setCurrentUserRole] = useState<UserRoleCondition>('all');

  // Modals visibility
  const [showGlobalStylesModal, setShowGlobalStylesModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComponentPickerModal, setShowComponentPickerModal] = useState(false);
  const [pickerTargetInsertIndex, setPickerTargetInsertIndex] = useState<number | null>(null);
  const [pickerTargetColumnId, setPickerTargetColumnId] = useState<string | null>(null);
  // ویرایشگر محتوای یک تب (ویجت tabs) — کدام ویجت و کدام ایندکس تب
  const [editingTabWidgetId, setEditingTabWidgetId] = useState<string | null>(null);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);

  // Status notification state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLeaveListConfirm, setShowLeaveListConfirm] = useState(false);
  const [isPageDirty, setIsPageDirty] = useState(false);

  // Push state to undo stack before mutation
  const pushState = (newSchema: SmartPageSchema) => {
    setUndoStack(prev => [...prev.slice(-15), pageSchema]);
    setRedoStack([]);
    setPageSchema(newSchema);
    onDirtyChange?.(true);
    setIsPageDirty(true);
  };

  const handleBackToPageList = () => {
    if (isPageDirty) {
      setShowLeaveListConfirm(true);
      return;
    }
    setViewMode('list');
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [pageSchema, ...r]);
    setUndoStack(u => u.slice(0, -1));
    setPageSchema(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack(u => [...u, pageSchema]);
    setRedoStack(r => r.slice(1));
    setPageSchema(next);
  };

  // Selectors
  const handleSelectSection = (secId: string) => {
    setSelectedSectionId(secId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  const handleSelectColumn = (colId: string) => {
    setSelectedColumnId(colId);
    setSelectedWidgetId(null);
  };

  const handleSelectWidget = (wId: string) => {
    setSelectedWidgetId(wId);
  };

  // ============ Helpers بازگشتی — سکشن‌های تودرتو (بلوک و زیربلوک) ============

  /** زیربلوک‌های واقعی یک ستون — منبع اصلی «blocks» است، subSections فقط فالبک قدیمی؛
   *  هر جای این فایل که باید داخل زیربلوک‌های یک ستون بگردد باید از همین تابع استفاده کند،
   *  وگرنه سکشن‌هایی که فقط در blocks هستند (و در subSections تکرار نشده‌اند) در جستجوها
   *  دیده نمی‌شوند — همان چیزی که باعث خالی ماندن پالت تنظیمات برای زیربلوک‌های چندستونه می‌شد */
  const getColumnSubSections = (col: ColumnInstance): SectionInstance[] =>
    getColumnBlocks(col)
      .filter((b): b is Extract<ColumnBlock, { kind: 'section' }> => b.kind === 'section')
      .map((b) => b.section);

  /** جستجوی بازگشتی یک سکشن در کل درخت (سطح اصلی یا زیربلوک‌های داخل ستون‌ها) */
  const findSectionRecursive = (sections: SectionInstance[], id: string): SectionInstance | null => {
    for (const s of sections) {
      if (s.id === id) return s;
      for (const col of s.columns) {
        const found = findSectionRecursive(getColumnSubSections(col), id);
        if (found) return found;
      }
    }
    return null;
  };

  /** یافتن یک ویجت در هر جای درخت (سطح اصلی یا زیربلوک) — برای ویرایشگر محتوای تب */
  const findWidgetInTree = (sections: SectionInstance[], widgetId: string): WidgetInstance | null => {
    for (const sec of sections) {
      for (const col of sec.columns) {
        const blocks = getColumnBlocks(col);
        const found = blocks.find((b) => b.kind === 'widget' && b.widget.id === widgetId);
        if (found && found.kind === 'widget') return found.widget;
        const inSub = findWidgetInTree(getColumnSubSections(col), widgetId);
        if (inSub) return inSub;
      }
    }
    return null;
  };

  /** اعمال تابع روی همهٔ سکشن‌های درخت (بازگشتی) — ستون‌ها و زیربلوک‌ها حفظ می‌شوند.
   *  سکشن‌های داخل blocks هم با نسخهٔ جدید همگام می‌شوند */
  const mapSectionsRecursive = (
    sections: SectionInstance[],
    fn: (sec: SectionInstance) => SectionInstance
  ): SectionInstance[] =>
    sections.map((sec) => {
      const mapped = fn(sec);
      return {
        ...mapped,
        columns: (mapped.columns || []).map((col) => {
          const subs = getColumnSubSections(col);
          const newSubs = subs.length > 0 ? mapSectionsRecursive(subs, fn) : undefined;
          if (Array.isArray(col.blocks) && col.blocks.length > 0) {
            const subById = new Map((newSubs ?? []).map((s) => [s.id, s]));
            return {
              ...col,
              subSections: newSubs,
              blocks: col.blocks.map((b) =>
                b.kind === 'section' && subById.has(b.section.id)
                  ? { ...b, section: subById.get(b.section.id)! }
                  : b
              )
            };
          }
          return { ...col, subSections: newSubs };
        })
      };
    });

  /** حذف یک سکشن از هر جای درخت (سطح اصلی یا زیربلوک)
   *  نکته: blocks باید با subSections جدید همگام شوند — فقط فیلتر مستقیم کافی نیست،
   *  چون سکشنِ حذف‌شده می‌تواند داخل یک زیربلوکِ تودرتو باشد که خودش در blocks ستونِ والد
   *  نگهداری می‌شود؛ در آن صورت نسخهٔ قدیمیِ آن زیربلوک (که هنوز سکشن حذف‌شده را دارد)
   *  در blocks می‌ماند و در DOM رندر می‌شود (باعث «حذف نشدن» زیربلوک می‌شد). */
  const removeSectionRecursive = (sections: SectionInstance[], id: string): SectionInstance[] =>
    sections
      .filter((s) => s.id !== id)
      .map((s) => ({
        ...s,
        columns: (s.columns || []).map((col) => {
          const subs = getColumnSubSections(col);
          const newSubs = subs.length > 0 ? removeSectionRecursive(subs, id) : undefined;
          if (Array.isArray(col.blocks) && col.blocks.length > 0) {
            const subById = new Map((newSubs ?? []).map((sub) => [sub.id, sub]));
            return {
              ...col,
              subSections: newSubs,
              blocks: col.blocks
                .filter((b) => !(b.kind === 'section' && b.section.id === id))
                .map((b) =>
                  b.kind === 'section' && subById.has(b.section.id)
                    ? { ...b, section: subById.get(b.section.id)! }
                    : b
                )
            };
          }
          return { ...col, subSections: newSubs };
        })
      }));

  /** آیا سکشن sec حاوی سکشن id در زیردرخت خود است؟ (برای جابه‌جایی بلوک) */
  const containsSection = (sec: SectionInstance, id: string): boolean =>
    sec.id === id ||
    sec.columns.some((col) => getColumnSubSections(col).some((sub) => containsSection(sub, id)));

  /** آیا ستون colId در زیردرخت سکشن sec قرار دارد؟ (جلوگیری از تودرتویی خودارجاع) */
  const isColumnInSection = (sec: SectionInstance, colId: string): boolean =>
    sec.columns.some(
      (col) => col.id === colId || getColumnSubSections(col).some((sub) => isColumnInSection(sub, colId))
    );

  // Find currently selected items (بازگشتی — ویجت/ستون ممکن است داخل زیربلوک باشد)
  let currentSection: SectionInstance | null = selectedSectionId
    ? findSectionRecursive(pageSchema.sections, selectedSectionId)
    : null;
  let currentColumn: ColumnInstance | null = null;
  let currentWidget: WidgetInstance | null = null;

  const findSelection = (sections: SectionInstance[]): boolean => {
    for (const sec of sections) {
      if (sec.id === selectedSectionId) currentSection = sec;
      for (const col of sec.columns) {
        if (col.id === selectedColumnId) currentColumn = col;
        const wBlock = getColumnBlocks(col).find((b) => b.kind === 'widget' && b.widget.id === selectedWidgetId);
        if (wBlock && wBlock.kind === 'widget') {
          currentWidget = wBlock.widget;
          currentColumn = col;
          if (!currentSection) currentSection = sec;
          return true;
        }
        if (findSelection(getColumnSubSections(col))) return true;
      }
    }
    return !!currentWidget;
  };
  findSelection(pageSchema.sections);

  // Adding new Section
  /** عرض‌های واکنش‌گرای پیش‌فرض برای یک ستون — موبایل تک‌ستونه (تمام‌عرض) */
  const withWidths = (width: number): ColumnResponsiveWidths => ({
    desktop: width,
    tablet: width,
    mobile: 12
  });

  const handleAddSection = (layoutPreset: '1col' | '2col' | '3col' | '7-5' | '8-4') => {
    const newSecId = `section-${Date.now()}`;
    let columns: ColumnInstance[] = [];

    switch (layoutPreset) {
      case '1col':
        columns = [{ id: `col-${Date.now()}-1`, width: 12, widgets: [], subSections: [] }];
        break;
      case '2col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 6, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 6, widgets: [], subSections: [] }
        ];
        break;
      case '3col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 4, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 4, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-3`, width: 4, widgets: [], subSections: [] }
        ];
        break;
      case '7-5':
        columns = [
          { id: `col-${Date.now()}-1`, width: 7, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 5, widgets: [], subSections: [] }
        ];
        break;
      case '8-4':
        columns = [
          { id: `col-${Date.now()}-1`, width: 8, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 4, widgets: [], subSections: [] }
        ];
        break;
    }

    // responsive widths: mobile defaults to single column
    columns = columns.map((c) => ({ ...c, widths: withWidths(c.width) }));

    const newSec: SectionInstance = {
      id: newSecId,
      name: `سکشن جدید (${layoutPreset})`,
      layout: 'boxed',
      paddingTop: 40,
      paddingBottom: 40,
      columns,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };

    pushState({
      ...pageSchema,
      sections: [...pageSchema.sections, newSec]
    });

    setSelectedSectionId(newSecId);
    setSelectedColumnId(columns[0].id);
  };

  // Open Component Picker Modal
  const handleOpenComponentPicker = (targetInsertIndex?: number, targetColumnId?: string) => {
    setPickerTargetInsertIndex(targetInsertIndex !== undefined ? targetInsertIndex : null);
    setPickerTargetColumnId(targetColumnId !== undefined ? targetColumnId : null);
    setShowComponentPickerModal(true);
  };

  // Add section from modal at specific position
  const handleAddSectionFromModal = (preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => {
    const newSecId = `section-${Date.now()}`;
    let columns: ColumnInstance[] = [];

    switch (preset) {
      case '1col':
        columns = [{ id: `col-${Date.now()}-1`, width: 12, widgets: [], subSections: [] }];
        break;
      case '2col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 6, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 6, widgets: [], subSections: [] }
        ];
        break;
      case '3col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 4, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 4, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-3`, width: 4, widgets: [], subSections: [] }
        ];
        break;
      case '4col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 3, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 3, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-3`, width: 3, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-4`, width: 3, widgets: [], subSections: [] }
        ];
        break;
      case '7-5':
        columns = [
          { id: `col-${Date.now()}-1`, width: 7, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 5, widgets: [], subSections: [] }
        ];
        break;
      case '8-4':
        columns = [
          { id: `col-${Date.now()}-1`, width: 8, widgets: [], subSections: [] },
          { id: `col-${Date.now()}-2`, width: 4, widgets: [], subSections: [] }
        ];
        break;
    }

    // responsive widths: mobile defaults to single column
    columns = columns.map((c) => ({ ...c, widths: withWidths(c.width) }));

    const newSec: SectionInstance = {
      id: newSecId,
      name: `سکشن جدید (${preset})`,
      layout: 'boxed',
      paddingTop: 40,
      paddingBottom: 40,
      columns,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };

    const sectionsCopy = [...pageSchema.sections];
    const insertPos = pickerTargetInsertIndex !== null ? pickerTargetInsertIndex : sectionsCopy.length;
    sectionsCopy.splice(insertPos, 0, newSec);

    pushState({
      ...pageSchema,
      sections: sectionsCopy
    });

    setSelectedSectionId(newSecId);
    setSelectedColumnId(columns[0].id);
  };

  // Add widget from modal (into specific column or creating new section at position)
  const handleAddWidgetFromModal = (widgetType: WidgetType) => {
    if (pickerTargetColumnId) {
      handleAddWidget(widgetType, pickerTargetColumnId);
      return;
    }

    const newSecId = `section-${Date.now()}`;
    const newColId = `col-${Date.now()}-1`;
    const newWidgetId = `widget-${Date.now()}`;

    let title = 'عنوان ویجت جدید';
    let bindingDataSource: any = 'none';

    if (widgetType === 'announcements-feed') {
      title = 'اطلاعیه‌های متصل به سیستم';
      bindingDataSource = 'announcements';
    } else if (widgetType === 'news-feed') {
      title = 'آخرین اخبار دانشگاه';
      bindingDataSource = 'news';
    } else if (widgetType === 'image-gallery') {
      title = 'گالری آلبوم تصاویر';
      bindingDataSource = 'gallery';
    } else if (widgetType === 'achievements-timeline') {
      title = 'افتخارات و دستاوردها';
      bindingDataSource = 'awards';
    } else if (widgetType === 'staff-directory') {
      title = 'لیست اساتید و هیئت علمی';
      bindingDataSource = 'staff';
    } else if (widgetType === 'file-manager') {
      title = 'مخزن اسناد و فرم‌ها';
      bindingDataSource = 'files';
    } else if (widgetType === 'form') {
      title = 'فرم پیوست‌شده از فرم‌ساز';
      bindingDataSource = 'form';
    } else if (widgetType === 'dp-news') {
      title = 'خبرهای صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-announcements') {
      title = 'اطلاعیه‌های صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-journal-issues') {
      title = 'نسخه‌های نشریه';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-articles') {
      title = 'فهرست مقالات صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-gallery') {
      title = 'گالری تصاویر صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-events') {
      title = 'رویدادهای صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-members') {
      title = 'اعضای شورا و کادر اجرایی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'tabs') {
      title = 'تب‌های محتوا';
    } else if (widgetType === 'interactive-map') {
      title = 'نقشه تعاملی پردیس‌ها';
    } else if (widgetType === 'excel-table') {
      title = 'جدول وارد شده از اکسل';
    }

    // محتوای اولیه — نوار راهبری آیتم‌های منو را در فیلد جداگانهٔ content نگه می‌دارد (بدون متن پیش‌فرض)
    let initialContent = 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.';
    if (widgetType === 'nav-menu') initialContent = '';

    const newWidget: WidgetInstance = {
      id: newWidgetId,
      type: widgetType,
      title,
      content: initialContent,
      settings: {
        style: {
          paddingTop: 0,
          paddingBottom: 0,
          textAlign: 'right'
        },
        binding: {
          dataSource: bindingDataSource,
          limit: 4,
          displayMode: 'grid'
        },
        visibility: { desktop: true, tablet: true, mobile: true },
        conditionalDisplay: { enabled: false, userRole: 'all' }
      }
    };

    const newSec: SectionInstance = {
      id: newSecId,
      name: `سکشن ${title}`,
      layout: 'boxed',
      paddingTop: 32,
      paddingBottom: 32,
      columns: [
        {
          id: newColId,
          width: 12,
          widths: withWidths(12),
          widgets: [newWidget],
          subSections: []
        }
      ],
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };

    const sectionsCopy = [...pageSchema.sections];
    const insertPos = pickerTargetInsertIndex !== null ? pickerTargetInsertIndex : sectionsCopy.length;
    sectionsCopy.splice(insertPos, 0, newSec);

    pushState({
      ...pageSchema,
      sections: sectionsCopy
    });

    setSelectedSectionId(newSecId);
    setSelectedColumnId(newColId);
    setSelectedWidgetId(newWidgetId);
  };

  // Update Section Column Layout Preset (1col, 2col, 3col, 4col, 7-5, 8-4)
  const handleUpdateSectionColumnLayout = (secId: string, preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => {
    let targetWidths: number[] = [];
    switch (preset) {
      case '1col': targetWidths = [12]; break;
      case '2col': targetWidths = [6, 6]; break;
      case '3col': targetWidths = [4, 4, 4]; break;
      case '4col': targetWidths = [3, 3, 3, 3]; break;
      case '7-5': targetWidths = [7, 5]; break;
      case '8-4': targetWidths = [8, 4]; break;
    }

    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => {
      if (sec.id !== secId) return sec;

      const currentCols = sec.columns;
      const newColsCount = targetWidths.length;
      let newCols: ColumnInstance[] = [];

      if (currentCols.length === newColsCount) {
        newCols = currentCols.map((col, idx) => ({
          ...col,
          width: targetWidths[idx],
          widths: { ...col.widths, desktop: targetWidths[idx] }
        }));
      } else if (currentCols.length < newColsCount) {
        newCols = currentCols.map((col, idx) => ({
          ...col,
          width: targetWidths[idx],
          widths: { ...col.widths, desktop: targetWidths[idx] }
        }));
        for (let i = currentCols.length; i < newColsCount; i++) {
          newCols.push({
            id: `col-${secId}-${Date.now()}-${i}`,
            width: targetWidths[i],
            widths: { desktop: targetWidths[i] },
            widgets: [],
            subSections: []
          });
        }
      } else {
        const retainedCols: ColumnInstance[] = currentCols.slice(0, newColsCount).map((col, idx) => ({
          ...col,
          width: targetWidths[idx],
          widths: { ...col.widths, desktop: targetWidths[idx] }
        }));
        const overflowCols = currentCols.slice(newColsCount);
        const overflowBlocks = overflowCols.flatMap(c => getColumnBlocks(c));

        retainedCols[retainedCols.length - 1] = setColumnBlocks(retainedCols[retainedCols.length - 1], [
          ...getColumnBlocks(retainedCols[retainedCols.length - 1]),
          ...overflowBlocks
        ]);
        newCols = retainedCols;
      }

      return { ...sec, columns: newCols };
    });

    pushState({ ...pageSchema, sections: updatedSections });
  };

  // Update single column width for a specific breakpoint (responsive layout — بازگشتی)
  const handleUpdateColumnWidth = (secId: string, colId: string, bp: Breakpoint, value: number) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        columns: sec.columns.map(col => {
          if (col.id !== colId) return col;
          const widths: ColumnResponsiveWidths = {
            desktop: col.widths?.desktop ?? col.width,
            tablet: col.widths?.tablet,
            mobile: col.widths?.mobile
          };
          widths[bp] = value;
          return { ...col, widths, width: bp === 'desktop' ? value : col.width };
        })
      };
    });
    pushState({ ...pageSchema, sections: updatedSections });
  };

  const handleUpdateColumn = (secId: string, colId: string, patch: Partial<ColumnInstance>) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        columns: sec.columns.map(col => (col.id === colId ? { ...col, ...patch } : col))
      };
    });
    pushState({ ...pageSchema, sections: updatedSections });
  };

  // Adding new Widget
  const handleAddWidget = (widgetType: WidgetType, targetColumnId?: string) => {
    const colId = targetColumnId || selectedColumnId || pageSchema.sections[0]?.columns[0]?.id;
    if (!colId) return;

    const newWidgetId = `widget-${Date.now()}`;
    let title = 'عنوان ویجت جدید';
    let bindingDataSource: any = 'none';

    if (widgetType === 'announcements-feed') {
      title = 'اطلاعیه‌های متصل به سیستم';
      bindingDataSource = 'announcements';
    } else if (widgetType === 'news-feed') {
      title = 'آخرین اخبار دانشگاه';
      bindingDataSource = 'news';
    } else if (widgetType === 'image-gallery') {
      title = 'گالری آلبوم تصاویر';
      bindingDataSource = 'gallery';
    } else if (widgetType === 'achievements-timeline') {
      title = 'افتخارات و دستاوردها';
      bindingDataSource = 'awards';
    } else if (widgetType === 'staff-directory') {
      title = 'لیست اساتید و هیئت علمی';
      bindingDataSource = 'staff';
    } else if (widgetType === 'file-manager') {
      title = 'مخزن اسناد و فرم‌ها';
      bindingDataSource = 'files';
    } else if (widgetType === 'form') {
      title = 'فرم پیوست‌شده از فرم‌ساز';
      bindingDataSource = 'form';
    } else if (widgetType === 'dp-news') {
      title = 'خبرهای صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-announcements') {
      title = 'اطلاعیه‌های صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-journal-issues') {
      title = 'نسخه‌های نشریه';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-articles') {
      title = 'فهرست مقالات صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-gallery') {
      title = 'گالری تصاویر صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-events') {
      title = 'رویدادهای صفحهٔ اختصاصی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'dp-members') {
      title = 'اعضای شورا و کادر اجرایی';
      bindingDataSource = 'dedicated-page';
    } else if (widgetType === 'tabs') {
      title = 'تب‌های محتوا';
    } else if (widgetType === 'interactive-map') {
      title = 'نقشه تعاملی پردیس‌ها';
    } else if (widgetType === 'excel-table') {
      title = 'جدول وارد شده از اکسل';
    }

    // محتوای اولیه — نوار راهبری آیتم‌های منو را در فیلد جداگانهٔ content نگه می‌دارد (بدون متن پیش‌فرض)
    let initialContent = 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.';
    if (widgetType === 'nav-menu') initialContent = '';

    const newWidget: WidgetInstance = {
      id: newWidgetId,
      type: widgetType,
      title,
      content: initialContent,
      settings: {
        style: {
          paddingTop: 0,
          paddingBottom: 0,
          textAlign: 'right'
        },
        binding: {
          dataSource: bindingDataSource,
          limit: 4,
          displayMode: 'grid'
        },
        visibility: { desktop: true, tablet: true, mobile: true },
        conditionalDisplay: { enabled: false, userRole: 'all' }
      }
    };

    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        if (col.id === colId) {
          return setColumnBlocks(col, [...getColumnBlocks(col), { kind: 'widget', widget: newWidget }]);
        }
        return col;
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });

    setSelectedWidgetId(newWidgetId);
  };

  // Updating Widget (بازگشتی — ویجت داخل زیربلوک هم پشتیبانی می‌شود)
  const handleUpdateWidget = (updatedWidget: WidgetInstance) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        const blocks = getColumnBlocks(col);
        const changed = blocks.some(b => b.kind === 'widget' && b.widget.id === updatedWidget.id);
        if (!changed) return col;
        return setColumnBlocks(
          col,
          blocks.map(b => (b.kind === 'widget' && b.widget.id === updatedWidget.id ? { ...b, widget: updatedWidget } : b))
        );
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Updating Section (بازگشتی — زیربلوک‌ها هم پشتیبانی می‌شوند)
  const handleUpdateSection = (updatedSection: SectionInstance) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec =>
      sec.id === updatedSection.id ? updatedSection : sec
    );
    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Deleting Section (از هر جای درخت)
  const handleDeleteSection = (secId: string) => {
    const updatedSections = removeSectionRecursive(pageSchema.sections, secId);
    pushState({
      ...pageSchema,
      sections: updatedSections
    });

    if (selectedSectionId === secId) {
      setSelectedSectionId(null);
      setSelectedColumnId(null);
      setSelectedWidgetId(null);
    }
  };

  // Deleting Widget (بازگشتی)
  const handleDeleteWidget = (wId: string) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        const blocks = getColumnBlocks(col);
        if (!blocks.some(b => b.kind === 'widget' && b.widget.id === wId)) return col;
        return setColumnBlocks(
          col,
          blocks.filter(b => !(b.kind === 'widget' && b.widget.id === wId))
        );
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });

    if (selectedWidgetId === wId) {
      setSelectedWidgetId(null);
    }
  };

  // Moving Widget Up / Down inside column (بازگشتی) — روی لیست یکپارچه blocks
  const handleMoveWidget = (wId: string, direction: 'up' | 'down') => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        const blocks = getColumnBlocks(col);
        const index = blocks.findIndex(b => b.kind === 'widget' && b.widget.id === wId);
        if (index === -1) return col;

        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < newBlocks.length) {
          const temp = newBlocks[index];
          newBlocks[index] = newBlocks[targetIndex];
          newBlocks[targetIndex] = temp;
        }

        return setColumnBlocks(col, newBlocks);
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Duplicate widget (بازگشتی)
  const handleDuplicateWidget = (widget: WidgetInstance) => {
    const duplicated: WidgetInstance = {
      ...widget,
      id: `widget-${Date.now()}`,
      title: `${widget.title} (کپی)`
    };

    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        const blocks = getColumnBlocks(col);
        if (!blocks.some(b => b.kind === 'widget' && b.widget.id === widget.id)) return col;
        return setColumnBlocks(col, [...blocks, { kind: 'widget', widget: duplicated }]);
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Restore Snapshot Version
  const handleRestoreVersion = (ver: PageVersion) => {
    pushState(ver.schemaSnapshot);
  };

  // Save Draft Version
  const handleSaveDraftVersion = () => {
    const newVer: PageVersion = {
      id: `ver-${Date.now()}`,
      title: `پیش‌نویس دستی ${new Date().toLocaleTimeString('fa-IR')}`,
      timestamp: new Date().toLocaleDateString('fa-IR'),
      note: 'ذخیره نقطه بازگشت توسط کاربر در ویرایشگر',
      schemaSnapshot: JSON.parse(JSON.stringify(pageSchema))
    };

    setPageSchema({
      ...pageSchema,
      versionHistory: [newVer, ...pageSchema.versionHistory]
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Load preset template
  const handleSelectTemplate = (template: PageTemplate) => {
    pushState(template.schema);
  };

  // Save Page Action — persist full schema to backend (create or update)
  const savePageWithStatus = async (status: 'published' | 'draft') => {
    setIsSavingPage(true);
    try {
      const payload = {
        title: pageSchema.title,
        slug: pageSchema.slug,
        status,
        seo: pageSchema.seo,
        schema: JSON.parse(JSON.stringify(pageSchema)),
      };
      if (activePageId) {
        await updateSmartPage(activePageId, payload);
      } else {
        const res = await createSmartPage({ ...payload, lang: currentLang });
        setActivePageId(res.data.id!);
        setPageSchema((prev) => ({ ...prev, id: `page-${res.data.id}` }));
      }
      setPageSchema((prev) => ({ ...prev, status }));
      const list = await fetchSmartPages({ per_page: 100, lang: currentLang });
      setPages(list.data);
      setSaveSuccess(true);
      onDirtyChange?.(false);
      setIsPageDirty(false);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // API layer shows the error toast; keep editing
    } finally {
      setIsSavingPage(false);
    }
  };

  /** ذخیره به‌صورت پیش‌نویس (وضعیت draft) */
  const handleSaveDraft = () => savePageWithStatus('draft');

  /** ذخیره و انتشار (وضعیت published) */
  const handleSavePublish = () => savePageWithStatus('published');

  // Move widget to a target column (cross-section Drag & Drop — بازگشتی، روی لیست یکپارچه blocks)
  const handleMoveWidgetToColumn = (widgetId: string, targetColumnId: string, index?: number) => {
    let widgetToMove: WidgetInstance | null = null;
    let sourceColumnId: string | null = null;
    let sourceIndex = -1;

    // Remove widget from its source column (first pass — هر جای درخت)
    const removedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        const blocks = getColumnBlocks(col);
        const idx = blocks.findIndex(b => b.kind === 'widget' && b.widget.id === widgetId);
        if (idx !== -1) {
          const found = blocks[idx];
          if (found.kind !== 'widget') return col;
          widgetToMove = found.widget;
          sourceColumnId = col.id;
          sourceIndex = idx;
          const newBlocks = [...blocks];
          newBlocks.splice(idx, 1);
          return setColumnBlocks(col, newBlocks);
        }
        return col;
      })
    }));

    if (!widgetToMove) return;

    // Append/insert widget at the target column (second pass — بازگشتی)
    const finalSections = mapSectionsRecursive(removedSections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        if (col.id === targetColumnId) {
          const blocks = getColumnBlocks(col);
          let effectiveIndex =
            typeof index === 'number' ? Math.min(Math.max(index, 0), blocks.length) : blocks.length;
          // جابه‌جایی در همان ستون — حذف قبلی ایندکس‌ها را یکی به عقب برده است
          if (col.id === sourceColumnId && typeof index === 'number' && sourceIndex < index) {
            effectiveIndex = Math.min(Math.max(index - 1, 0), blocks.length);
          }
          const newBlocks = [...blocks];
          newBlocks.splice(effectiveIndex, 0, { kind: 'widget', widget: widgetToMove! });
          return setColumnBlocks(col, newBlocks);
        }
        return col;
      })
    }));

    pushState({ ...pageSchema, sections: finalSections });
    setSelectedWidgetId(widgetId);
  };

  // ============ جابه‌جایی سکشن (بلوک و زیربلوک) با کشیدن و رها کردن ============

  /**
   * انتقال یک سکشن به داخل ستون هدف (تبدیل به زیربلوک)
   * — جلوگیری از تودرتویی خودارجاع (سکشن داخل خودش)
   */
  const handleMoveSectionToColumn = (sectionId: string, targetColumnId: string, index?: number) => {
    const sec = findSectionRecursive(pageSchema.sections, sectionId);
    if (!sec) return;
    if (isColumnInSection(sec, targetColumnId)) return; // داخل خودش — ممنوع

    // موقعیت مبدأ (ستون و ایندکس) قبل از حذف — برای اصلاح ایندکس هنگام جابه‌جایی در همان ستون
    let sourceColumnId: string | null = null;
    let sourceIndex = -1;
    mapSectionsRecursive(pageSchema.sections, s => {
      s.columns.forEach(col => {
        const bi = getColumnBlocks(col).findIndex(b => b.kind === 'section' && b.section.id === sectionId);
        if (bi >= 0) {
          sourceColumnId = col.id;
          sourceIndex = bi;
        }
      });
      return s;
    });

    const removedSections = removeSectionRecursive(pageSchema.sections, sectionId);
    const clone = JSON.parse(JSON.stringify(sec)) as SectionInstance;

    const finalSections = mapSectionsRecursive(removedSections, s => ({
      ...s,
      columns: s.columns.map(col => {
        if (col.id !== targetColumnId) return col;
        // درج در ایندکس درخواستی (DnD قبل/بعد بلوک‌ها) — پیش‌فرض: انتهای فهرست
        const blocks = getColumnBlocks(col);
        let effectiveIndex =
          typeof index === 'number' ? Math.min(Math.max(index, 0), blocks.length) : blocks.length;
        // جابه‌جایی در همان ستون: بعد از حذف، فهرست یکی کوتاه‌تر شده — اگر مبدأ قبل از هدف بود یکی کم کن
        if (typeof index === 'number' && col.id === sourceColumnId && sourceIndex >= 0 && sourceIndex < index) {
          effectiveIndex = Math.min(Math.max(index - 1, 0), blocks.length);
        }
        const newBlocks = [...blocks];
        newBlocks.splice(effectiveIndex, 0, { kind: 'section', section: clone });
        return setColumnBlocks(col, newBlocks);
      })
    }));

    pushState({ ...pageSchema, sections: finalSections });
    setSelectedSectionId(sectionId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  /**
   * انتقال سکشن به سطح اصلی در ایندکس مشخص
   * — برای رها کردن روی خط‌جداکننده و دکمهٔ «خروج از بلوک»
   */
  const handleMoveSectionToTop = (sectionId: string, index?: number) => {
    const sec = findSectionRecursive(pageSchema.sections, sectionId);
    if (!sec) return;

    const removedSections = removeSectionRecursive(pageSchema.sections, sectionId);
    const clone = JSON.parse(JSON.stringify(sec)) as SectionInstance;

    const sectionsCopy = [...removedSections];
    const pos = index !== undefined ? Math.min(index, sectionsCopy.length) : sectionsCopy.length;
    sectionsCopy.splice(pos, 0, clone);

    pushState({ ...pageSchema, sections: sectionsCopy });
    setSelectedSectionId(sectionId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  /** خروج از بلوک: انتقال سکشن تودرتو به سطح اصلی، دقیقاً بعد از والد خود */
  const handleMoveSectionOut = (sectionId: string) => {
    const sec = findSectionRecursive(pageSchema.sections, sectionId);
    if (!sec) return;

    // والد سطح اصلی که این سکشن داخل زیردرخت آن است (یا خودش اگر سطح اصلی باشد)
    const topLevelIdx = pageSchema.sections.findIndex(
      s => s.id === sectionId || s.columns.some(col => getColumnSubSections(col).some(sub => containsSection(sub, sectionId)))
    );
    if (topLevelIdx === -1) return;

    const removedSections = removeSectionRecursive(pageSchema.sections, sectionId);
    const clone = JSON.parse(JSON.stringify(sec)) as SectionInstance;

    const sectionsCopy = [...removedSections];
    sectionsCopy.splice(topLevelIdx + 1, 0, clone);

    pushState({ ...pageSchema, sections: sectionsCopy });
    setSelectedSectionId(sectionId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  /** جابه‌جایی سکشن بالا/پایین درون والد خود (سطح اصلی یا بلوک‌های یک ستون — روی لیست یکپارچه blocks) */
  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    // ابتدا سطح اصلی
    const topIdx = pageSchema.sections.findIndex(s => s.id === sectionId);
    if (topIdx !== -1) {
      const target = direction === 'up' ? topIdx - 1 : topIdx + 1;
      if (target >= 0 && target < pageSchema.sections.length) {
        const copy = [...pageSchema.sections];
        const t = copy[topIdx];
        copy[topIdx] = copy[target];
        copy[target] = t;
        pushState({ ...pageSchema, sections: copy });
      }
      return;
    }

    // سپس زیربلوک‌ها (بازگشتی) — جابه‌جایی داخل لیست یکپارچه بلوک‌های ستون،
    // تا زیربلوک بتواند با ویجت‌های هم‌ستون نیز جابه‌جا شود
    let moved = false;
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => {
      if (moved) return sec;
      const newCols = sec.columns.map(col => {
        if (moved) return col;
        const blocks = getColumnBlocks(col);
        const idx = blocks.findIndex(b => b.kind === 'section' && b.section.id === sectionId);
        if (idx === -1) return col;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= blocks.length) return col;
        const copy = [...blocks];
        const t = copy[idx];
        copy[idx] = copy[target];
        copy[target] = t;
        moved = true;
        return setColumnBlocks(col, copy);
      });
      return { ...sec, columns: newCols };
    });

    if (moved) pushState({ ...pageSchema, sections: updatedSections });
  };

  /** افزودن زیربلوک جدید به داخل یک ستون */
  const handleAddSubSection = (columnId: string) => {
    const newSecId = `sub-section-${Date.now()}`;
    const newColId = `col-${Date.now()}-1`;
    const newSub: SectionInstance = {
      id: newSecId,
      name: 'زیربلوک جدید',
      layout: 'boxed',
      paddingTop: 24,
      paddingBottom: 24,
      columns: [{ id: newColId, width: 12, widths: withWidths(12), widgets: [], subSections: [] }],
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };

    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col =>
        col.id === columnId
          ? setColumnBlocks(col, [...getColumnBlocks(col), { kind: 'section', section: newSub }])
          : col
      )
    }));

    pushState({ ...pageSchema, sections: updatedSections });
    setSelectedSectionId(newSecId);
    setSelectedColumnId(newColId);
    setSelectedWidgetId(null);
  };

  // ---- مقادیر محاسبه‌شده برای هدر (زیرصفحه‌ها) ----
  const childCount = activePageId == null ? 0 : pages.filter((p) => p.parent_id === activePageId).length;
  const parentOfCurrent = currentParentId ? pages.find((p) => p.id === currentParentId) : undefined;

  return (
    <>
      {viewMode === 'list' ? (
        <PagesList
          pages={pages}
          isLoading={isLoadingPages}
          onBackToPortal={onBackToPortal}
          onCreatePage={handleCreatePage}
          onEditPage={(id) => openEditor(id)}
          onOpenSettings={async (id) => {
            // فقط دیالوگ تنظیمات باز شود — بدون رفتن به صفحه ویرایش
            await loadPage(id);
            setShowPageSettingsModal(true);
          }}
          onPreviewPage={async (id) => {
            await loadPage(id);
            setShowPreviewModal(true);
          }}
          onDeletePage={(page) => handleDeleteRequest(page)}
          languages={languages}
          currentLang={currentLang}
          onDuplicatePage={handleDuplicatePage}
          duplicatingPageId={duplicatingPageId}
          duplicateError={duplicateError}
        />
      ) : (
      <div className="flex flex-col flex-1 min-h-[480px] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden rtl text-right transition-colors">
      {/* ============================================================== */}
      {/* TOP APPLICATION BAR & WORKSPACE TOOLBAR */}
      {/* ============================================================== */}
      <header className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between z-30 shadow-xs">
        {/* Right Section: Title & Status */}
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="بازگشت به پورتال اصلی"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Back to the pages card list */}
          <button
            onClick={handleBackToPageList}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="بازگشت به فهرست صفحات"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <input
                type="text"
                value={pageSchema.title}
                onChange={(e) => pushState({ ...pageSchema, title: e.target.value })}
                className="text-sm font-black bg-transparent text-slate-900 dark:text-white border-b border-transparent hover:border-gray-300 dark:hover:border-slate-700 focus:border-teal-500 focus:outline-none px-1"
              />
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                  Intelligent Layout Engine
                </span>
                {parentOfCurrent && (
                  <button
                    onClick={() => openEditor(parentOfCurrent.id!)}
                    className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                    title="این صفحه زیرصفحه است — برای رفتن به صفحهٔ والد کلیک کنید"
                  >
                    <FolderTree className="w-3 h-3" />
                    زیرصفحهٔ {parentOfCurrent.title}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Page settings (title / slug / SEO) */}
          <button
            onClick={() => setShowPageSettingsModal(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="تنظیمات صفحه و سئو (عنوان، لینک، متادیتا)"
          >
            <Settings2 className="w-4 h-4 text-indigo-500" />
          </button>

          {/* Child-pages manager: زیرصفحه‌ها از داخل همین صفحه ساخته و مدیریت می‌شوند */}
          <button
            onClick={handleOpenChildPages}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="مدیریت زیرصفحه‌های این صفحه (ایجاد، باز کردن، حذف)"
          >
            <FolderTree className="w-4 h-4 text-teal-600" />
            {childCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 min-w-4 h-4 px-1 rounded-full bg-teal-600 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                {childCount}
              </span>
            )}
          </button>
        </div>

        {/* Center Section: Responsive Breakpoint Switcher & Undo/Redo */}
        <div className="flex items-center gap-4">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-500 disabled:opacity-30 cursor-pointer"
              title="واکشی قبلی (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-500 disabled:opacity-30 cursor-pointer"
              title="اعمال مجدد (Redo)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Breakpoint selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveBreakpoint('desktop')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
                activeBreakpoint === 'desktop' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
              }`}
              title="نمایش دسکتاپ"
            >
              <Monitor className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveBreakpoint('tablet')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
                activeBreakpoint === 'tablet' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
              }`}
              title="نمایش تبلت (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveBreakpoint('mobile')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
                activeBreakpoint === 'mobile' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
              }`}
              title="نمایش موبایل (390px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Left Section: Actions Bar */}
        <div className="flex items-center gap-2">
          {/* Version history dropdown (moved from the removed right sidebar) */}
          <div className="relative">
            <button
              onClick={() => setShowVersionHistory((v) => !v)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="تاریخچه نسخه‌ها"
            >
              <History className="w-4 h-4 text-purple-500" />
            </button>
            {showVersionHistory && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowVersionHistory(false)} />
                <div className="absolute top-full left-0 mt-2 z-50 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">پیش‌نویس‌ها و تاریخچه</span>
                    <button
                      onClick={handleSaveDraftVersion}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                    >
                      <Clock className="w-3 h-3" />
                      <span>ثبت نسخه</span>
                    </button>
                  </div>

                  {pageSchema.versionHistory.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-6">
                      هنوز نسخه‌ای ثبت نشده است
                    </div>
                  ) : (
                    pageSchema.versionHistory.map((ver) => (
                      <div
                        key={ver.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span className="truncate">{ver.title}</span>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 shrink-0">{ver.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{ver.note}</p>
                        <button
                          onClick={() => {
                            handleRestoreVersion(ver);
                            setShowVersionHistory(false);
                          }}
                          className="w-full py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                          <span>بازگردانی به این نسخه</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500/20 shadow-xs"
            title="کتابخانه قالب‌های آماده"
          >
            <FolderPlus className="w-4 h-4" />
            <span>کتابخانه قالب‌ها</span>
          </button>

          <button
            onClick={() => setShowGlobalStylesModal(true)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="استایل‌های سراسری"
          >
            <Palette className="w-4 h-4 text-teal-500" />
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="تولید کد خروجی"
          >
            <Code className="w-4 h-4 text-amber-500" />
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4 text-teal-500" />
            <span>پیش‌نمایش زنده</span>
          </button>

          {/* دکمهٔ ذخیره و انتشار (اسپلیت) — پیش‌نویس در منوی کشویی */}
          <div className="relative flex items-stretch rounded-xl shadow-md border border-teal-600 dark:border-teal-500">
            <button
              onClick={handleSavePublish}
              disabled={isSavingPage}
              className="px-5 py-2 rounded-r-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-60"
              title="ذخیره و انتشار"
            >
              {isSavingPage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white dark:text-slate-950" />
                  <span>ذخیره گردید</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره و انتشار</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowSaveMenu((v) => !v)}
              disabled={isSavingPage}
              className="px-2.5 rounded-l-xl bg-teal-700 dark:bg-teal-600 hover:bg-teal-800 dark:hover:bg-teal-700 text-white dark:text-slate-950 border-r border-white/25 dark:border-slate-950/20 flex items-center justify-center cursor-pointer transition-all disabled:opacity-60"
              title="گزینه‌های بیشتر ذخیره"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showSaveMenu ? 'rotate-180' : ''}`} />
            </button>

            {showSaveMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSaveMenu(false)} />
                <div className="absolute top-full left-0 mt-2 z-50 min-w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      handleSaveDraft();
                      setShowSaveMenu(false);
                    }}
                    disabled={isSavingPage}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
                    title="ذخیره به‌عنوان پیش‌نویس (بدون انتشار)"
                  >
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>ذخیره پیش‌نویس</span>
                    <span className="mr-auto text-[10px] text-slate-400 font-normal">بدون انتشار</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN WORKSPACE BODY (Sidebars + Center Canvas) */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Panel: Interactive Drag & Drop Canvas */}
        <Canvas
          pageSchema={pageSchema}
          pageId={activePageId}
          pageSlug={pageSchema.slug}
          activeBreakpoint={activeBreakpoint}
          selectedSectionId={selectedSectionId}
          selectedColumnId={selectedColumnId}
          selectedWidgetId={selectedWidgetId}
          currentUserRole={currentUserRole}
          onSelectSection={handleSelectSection}
          onSelectColumn={handleSelectColumn}
          onSelectWidget={handleSelectWidget}
          onAddWidget={handleAddWidget}
          onAddSection={handleAddSection}
          onOpenComponentPicker={handleOpenComponentPicker}
          onDeleteSection={handleDeleteSection}
          onDeleteWidget={handleDeleteWidget}
          onMoveWidget={handleMoveWidget}
          onMoveWidgetToColumn={handleMoveWidgetToColumn}
          onMoveSectionToColumn={handleMoveSectionToColumn}
          onMoveSectionToTop={handleMoveSectionToTop}
          onMoveSectionOut={handleMoveSectionOut}
          onMoveSection={handleMoveSection}
          onAddSubSection={handleAddSubSection}
        />

        {/* Left Panel: Property Inspector & Binding Panel */}
        <InspectorPanel
          selectedWidget={currentWidget}
          selectedColumn={currentColumn}
          selectedSection={currentSection}
          activeBreakpoint={activeBreakpoint}
          onUpdateWidget={handleUpdateWidget}
          onUpdateSection={handleUpdateSection}
          onUpdateSectionColumnLayout={handleUpdateSectionColumnLayout}
          onUpdateColumnWidth={handleUpdateColumnWidth}
          onUpdateColumn={handleUpdateColumn}
          onDeleteWidget={handleDeleteWidget}
          onDeleteSection={handleDeleteSection}
          onDuplicateWidget={handleDuplicateWidget}
          dedicatedPageId={previewDedicatedPageId}
          onEditTabSection={(widgetId, tabIndex) => {
            setEditingTabWidgetId(widgetId);
            setEditingTabIndex(tabIndex);
          }}
        />
      </div>
      </div>
      )}

      {/* ============================================================== */}
      {/* MODALS (rendered outside viewMode so they work from the list) */}
      {/* ============================================================== */}
      {showComponentPickerModal && (
        <ComponentPickerModal
          isOpen={showComponentPickerModal}
          targetInsertIndex={pickerTargetInsertIndex}
          targetColumnId={pickerTargetColumnId}
          onSelectWidget={(widgetType) => {
            handleAddWidgetFromModal(widgetType);
            setShowComponentPickerModal(false);
          }}
          onSelectSectionPreset={(preset) => {
            handleAddSectionFromModal(preset);
            setShowComponentPickerModal(false);
          }}
          onClose={() => setShowComponentPickerModal(false)}
        />
      )}
      {editingTabWidgetId !== null && editingTabIndex !== null && (() => {
        const editingTabWidget = findWidgetInTree(pageSchema.sections, editingTabWidgetId);
        const tabs = editingTabWidget?.settings.customProps?.tabs || [];
        const editingSection: SectionInstance | null = tabs[editingTabIndex]?.section ?? null;
        return (
          <TabSectionEditorModal
            open={!!editingTabWidget && !!editingSection}
            section={editingSection}
            tabLabel={tabs[editingTabIndex]?.label}
            onClose={() => {
              setEditingTabWidgetId(null);
              setEditingTabIndex(null);
            }}
            onSave={(updatedSection) => {
              if (!editingTabWidget) return;
              const newTabs = [...tabs];
              newTabs[editingTabIndex] = { ...newTabs[editingTabIndex], section: updatedSection };
              handleUpdateWidget({
                ...editingTabWidget,
                settings: {
                  ...editingTabWidget.settings,
                  customProps: { ...(editingTabWidget.settings.customProps || {}), tabs: newTabs }
                }
              });
              setEditingTabWidgetId(null);
              setEditingTabIndex(null);
            }}
          />
        );
      })()}
      {showGlobalStylesModal && (
        <GlobalStyleModal
          globalStyles={pageSchema.globalStyles}
          onSave={(updatedStyles) => {
            pushState({ ...pageSchema, globalStyles: updatedStyles });
          }}
          onClose={() => setShowGlobalStylesModal(false)}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          currentSchema={pageSchema}
          onSelectTemplate={handleSelectTemplate}
          onImportJson={(imported) => pushState(imported)}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {showPreviewModal && (
        <PreviewModal
          pageSchema={pageSchema}
          onClose={() => setShowPreviewModal(false)}
          variables={dedicatedPageVariables}
          dedicatedPageId={previewDedicatedPageId}
        />
      )}

      {showExportModal && (
        <ExportModal
          pageSchema={pageSchema}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showPageSettingsModal && (
        <PageSettingsModal
          page={{
            id: activePageId ?? undefined,
            title: pageSchema.title,
            slug: pageSchema.slug,
            parent_id: currentParentId,
            status: pageSchema.status,
            seo: pageSchema.seo,
            schema: pageSchema as unknown as Record<string, unknown>,
          }}
          language={
            (activePageId ? pages.find((p) => p.id === activePageId)?.language : undefined) ?? currentLang
          }
          pages={pages}
          isSaving={isSavingPage}
          onSave={handleSavePageSettings}
          onClose={() => setShowPageSettingsModal(false)}
        />
      )}

      {showChildPagesModal && (
        <ChildPagesManagerModal
          key={activePageId ?? 'new'}
          parentId={activePageId}
          parentTitle={pageSchema.title}
          parentSlug={pageSchema.slug}
          childrenTree={childPagesTree}
          isLoading={isLoadingChildPages}
          isCreating={isCreatingChild}
          createError={childCreateError}
          onCreateChild={(data, parentId) => void handleCreateChild(data, parentId)}
          onOpenChild={(id) => {
            setShowChildPagesModal(false);
            openEditor(id);
          }}
          onDeleteChild={handleDeleteChild}
          onClose={() => setShowChildPagesModal(false)}
        />
      )}

      {/* Delete confirmation dialog (replaces window.confirm) */}
      <ConfirmDialog
        open={!!pageToDelete}
        title={pageToDelete?.parent_id ? 'حذف زیرصفحه' : 'حذف صفحه'}
        message={
          pageToDelete ? (() => {
            const deletedChildCount = pages.filter((p) => p.parent_id === pageToDelete.id).length;
            return (
              `آیا از حذف «${pageToDelete.title}» (${buildPagePath(pageToDelete, pages)}) مطمئن هستید؟ این عملیات قابل بازگشت نیست.` +
              (deletedChildCount > 0
                ? `\nاین صفحه ${deletedChildCount} زیرصفحه دارد که همراه آن حذف خواهند شد.`
                : '')
            );
          })() : ''
        }
        confirmLabel="حذف"
        busy={isDeletingPage}
        onConfirm={handleConfirmDeletePage}
        onCancel={() => setPageToDelete(null)}
      />

      <ConfirmDialog
        open={showLeaveListConfirm}
        title="تغییرات ذخیره نشده"
        message="تغییرات صفحه هنوز ذخیره نشده‌اند. آیا می‌خواهید به فهرست صفحات برگردید؟"
        confirmLabel="بازگشت بدون ذخیره"
        cancelLabel="ادامه ویرایش"
        danger={false}
        onConfirm={() => {
          setShowLeaveListConfirm(false);
          setViewMode('list');
        }}
        onCancel={() => setShowLeaveListConfirm(false)}
      />
    </>
  );
};
