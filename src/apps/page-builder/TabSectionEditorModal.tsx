import React, { useState } from 'react';
import {
  SectionInstance,
  ColumnInstance,
  WidgetInstance,
  WidgetType,
  Breakpoint,
  SmartPageSchema,
  DEFAULT_GLOBAL_STYLES,
  getColumnBlocks,
  setColumnBlocks
} from './builderTypes';
import { Canvas } from './Canvas';
import { InspectorPanel } from './InspectorPanel';
import { ComponentPickerModal } from './ComponentPickerModal';
import { X, Check } from 'lucide-react';

interface TabSectionEditorModalProps {
  open: boolean;
  section: SectionInstance | null;
  tabLabel?: string;
  onClose: () => void;
  onSave: (updatedSection: SectionInstance) => void;
}

/**
 * ویرایشگر محتوای یک تب — یک نمونهٔ کوچک و مستقل از Canvas+InspectorPanel که فقط روی
 * همان یک SectionInstance کار می‌کند، بدون هیچ تغییری در Canvas.tsx یا PageBuilderStudio.tsx.
 * منطق افزودن/حذف/جابه‌جایی ویجت و زیربلوک از PageBuilderStudio.tsx کپی و به یک بخش محدود شده است.
 */
export const TabSectionEditorModal: React.FC<TabSectionEditorModalProps> = ({ open, section, tabLabel, onClose, onSave }) => {
  const [localSection, setLocalSection] = useState<SectionInstance | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('desktop');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTargetColumnId, setPickerTargetColumnId] = useState<string | null>(null);

  // همگام‌سازی سکشن محلی هنگام باز شدن مودال با تب انتخاب‌شده
  React.useEffect(() => {
    if (open && section) {
      setLocalSection(section);
      setSelectedSectionId(section.id);
      setSelectedColumnId(section.columns[0]?.id ?? null);
      setSelectedWidgetId(null);
    }
  }, [open, section]);

  if (!open || !localSection) return null;

  const withWidths = (width: number) => ({ desktop: width, tablet: width, mobile: 12 });

  const mapColumns = (sec: SectionInstance, fn: (col: ColumnInstance) => ColumnInstance): SectionInstance => ({
    ...sec,
    columns: sec.columns.map((col) => {
      const mapped = fn(col);
      return {
        ...mapped,
        subSections: mapped.subSections ? mapped.subSections.map((sub) => mapColumnsRecursive(sub, fn)) : mapped.subSections
      };
    })
  });

  // بازگشتی برای زیربلوک‌های تودرتو — blocks و subSections را هماهنگ نگه می‌دارد
  function mapColumnsRecursive(sec: SectionInstance, fn: (col: ColumnInstance) => ColumnInstance): SectionInstance {
    const mappedSec = mapColumns(sec, fn);
    return {
      ...mappedSec,
      columns: mappedSec.columns.map((col) => {
        if (Array.isArray(col.blocks) && col.blocks.length > 0) {
          const subById = new Map((col.subSections ?? []).map((s) => [s.id, s]));
          return {
            ...col,
            blocks: col.blocks.map((b) => (b.kind === 'section' && subById.has(b.section.id) ? { ...b, section: subById.get(b.section.id)! } : b))
          };
        }
        return col;
      })
    };
  }

  const findColumnAndUpdate = (sec: SectionInstance, colId: string, updater: (col: ColumnInstance) => ColumnInstance): SectionInstance =>
    mapColumnsRecursive(sec, (col) => (col.id === colId ? updater(col) : col));

  const findColumnRecursive = (sec: SectionInstance, colId: string): ColumnInstance | null => {
    for (const col of sec.columns) {
      if (col.id === colId) return col;
      for (const sub of col.subSections || []) {
        const found = findColumnRecursive(sub, colId);
        if (found) return found;
      }
    }
    return null;
  };

  const findWidgetRecursive = (sec: SectionInstance, widgetId: string): { widget: WidgetInstance; column: ColumnInstance } | null => {
    for (const col of sec.columns) {
      const blocks = getColumnBlocks(col);
      const found = blocks.find((b) => b.kind === 'widget' && b.widget.id === widgetId);
      if (found && found.kind === 'widget') return { widget: found.widget, column: col };
      for (const sub of col.subSections || []) {
        const r = findWidgetRecursive(sub, widgetId);
        if (r) return r;
      }
    }
    return null;
  };

  const findSectionRecursive = (sec: SectionInstance, id: string): SectionInstance | null => {
    if (sec.id === id) return sec;
    for (const col of sec.columns) {
      for (const sub of col.subSections || []) {
        const found = findSectionRecursive(sub, id);
        if (found) return found;
      }
    }
    return null;
  };

  const removeSectionRecursive = (sec: SectionInstance, id: string): SectionInstance => ({
    ...sec,
    columns: sec.columns.map((col) => {
      const newSubs = (col.subSections || []).filter((s) => s.id !== id).map((s) => removeSectionRecursive(s, id));
      if (Array.isArray(col.blocks) && col.blocks.length > 0) {
        const subById = new Map(newSubs.map((s) => [s.id, s]));
        return {
          ...col,
          subSections: newSubs,
          blocks: col.blocks
            .filter((b) => !(b.kind === 'section' && b.section.id === id))
            .map((b) => (b.kind === 'section' && subById.has(b.section.id) ? { ...b, section: subById.get(b.section.id)! } : b))
        };
      }
      return { ...col, subSections: newSubs };
    })
  });

  const currentColumn = selectedColumnId ? findColumnRecursive(localSection, selectedColumnId) : null;
  const found = selectedWidgetId ? findWidgetRecursive(localSection, selectedWidgetId) : null;
  const currentWidget = found?.widget ?? null;
  const currentSection = selectedSectionId ? findSectionRecursive(localSection, selectedSectionId) : localSection;

  const presetWidths = (preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4'): number[] => {
    switch (preset) {
      case '1col': return [12];
      case '2col': return [6, 6];
      case '3col': return [4, 4, 4];
      case '4col': return [3, 3, 3, 3];
      case '7-5': return [7, 5];
      case '8-4': return [8, 4];
    }
  };

  const buildColumns = (widths: number[]): ColumnInstance[] =>
    widths.map((w, i) => ({ id: `col-${Date.now()}-${i}`, width: w, widths: withWidths(w), widgets: [], subSections: [] }));

  const addNestedSection = (preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4', targetColumnId?: string | null) => {
    const colId = targetColumnId || selectedColumnId || localSection.columns[0]?.id;
    if (!colId) return;
    const newSub: SectionInstance = {
      id: `sub-section-${Date.now()}`,
      name: 'زیربلوک جدید',
      layout: 'boxed',
      paddingTop: 24,
      paddingBottom: 24,
      columns: buildColumns(presetWidths(preset)),
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };
    setLocalSection(
      findColumnAndUpdate(localSection, colId, (col) => setColumnBlocks(col, [...getColumnBlocks(col), { kind: 'section', section: newSub }]))
    );
    setSelectedSectionId(newSub.id);
    setSelectedColumnId(newSub.columns[0].id);
    setSelectedWidgetId(null);
  };

  const handleAddWidget = (widgetType: WidgetType, targetColumnId?: string) => {
    const colId = targetColumnId || selectedColumnId || localSection.columns[0]?.id;
    if (!colId) return;
    const newWidgetId = `widget-${Date.now()}`;
    const newWidget: WidgetInstance = {
      id: newWidgetId,
      type: widgetType,
      title: 'عنوان ویجت جدید',
      content: 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.',
      settings: {
        style: { paddingTop: 0, paddingBottom: 0, textAlign: 'right' },
        binding: { dataSource: 'none', limit: 4, displayMode: 'grid' },
        visibility: { desktop: true, tablet: true, mobile: true },
        conditionalDisplay: { enabled: false, userRole: 'all' }
      }
    };
    setLocalSection(
      findColumnAndUpdate(localSection, colId, (col) => setColumnBlocks(col, [...getColumnBlocks(col), { kind: 'widget', widget: newWidget }]))
    );
    setSelectedWidgetId(newWidgetId);
  };

  const handleUpdateWidget = (updated: WidgetInstance) => {
    setLocalSection(
      mapColumnsRecursive(localSection, (col) => {
        const blocks = getColumnBlocks(col);
        if (!blocks.some((b) => b.kind === 'widget' && b.widget.id === updated.id)) return col;
        return setColumnBlocks(col, blocks.map((b) => (b.kind === 'widget' && b.widget.id === updated.id ? { ...b, widget: updated } : b)));
      })
    );
  };

  const handleDeleteWidget = (widgetId: string) => {
    setLocalSection(
      mapColumnsRecursive(localSection, (col) => {
        const blocks = getColumnBlocks(col);
        if (!blocks.some((b) => b.kind === 'widget' && b.widget.id === widgetId)) return col;
        return setColumnBlocks(col, blocks.filter((b) => !(b.kind === 'widget' && b.widget.id === widgetId)));
      })
    );
    if (selectedWidgetId === widgetId) setSelectedWidgetId(null);
  };

  const handleMoveWidget = (widgetId: string, direction: 'up' | 'down') => {
    setLocalSection(
      mapColumnsRecursive(localSection, (col) => {
        const blocks = getColumnBlocks(col);
        const index = blocks.findIndex((b) => b.kind === 'widget' && b.widget.id === widgetId);
        if (index === -1) return col;
        const newBlocks = [...blocks];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (target >= 0 && target < newBlocks.length) {
          const t = newBlocks[index];
          newBlocks[index] = newBlocks[target];
          newBlocks[target] = t;
        }
        return setColumnBlocks(col, newBlocks);
      })
    );
  };

  const handleDuplicateWidget = (widget: WidgetInstance) => {
    const duplicated: WidgetInstance = { ...widget, id: `widget-${Date.now()}`, title: `${widget.title} (کپی)` };
    setLocalSection(
      mapColumnsRecursive(localSection, (col) => {
        const blocks = getColumnBlocks(col);
        if (!blocks.some((b) => b.kind === 'widget' && b.widget.id === widget.id)) return col;
        return setColumnBlocks(col, [...blocks, { kind: 'widget', widget: duplicated }]);
      })
    );
  };

  const handleDeleteSection = (secId: string) => {
    if (secId === localSection.id) return; // نمی‌توان خود سکشن ریشهٔ تب را حذف کرد — حذف تب از لیست تب‌ها در پنل تنظیمات انجام می‌شود
    const updated = removeSectionRecursive(localSection, secId);
    setLocalSection(updated);
    if (selectedSectionId === secId) setSelectedSectionId(updated.id);
    if (selectedColumnId && findColumnRecursive(updated, selectedColumnId) === null) {
      setSelectedColumnId(updated.columns[0]?.id ?? null);
      setSelectedWidgetId(null);
    }
  };

  const handleUpdateSection = (updated: SectionInstance) => {
    if (updated.id === localSection.id) {
      setLocalSection({ ...updated, columns: localSection.columns.map((c, i) => updated.columns[i] ?? c) });
      return;
    }
    const replaceRecursive = (sec: SectionInstance): SectionInstance => ({
      ...sec,
      columns: sec.columns.map((col) => ({
        ...col,
        subSections: (col.subSections || []).map((sub) => (sub.id === updated.id ? updated : replaceRecursive(sub))),
        blocks: col.blocks?.map((b) => (b.kind === 'section' && b.section.id === updated.id ? { ...b, section: updated } : b))
      }))
    });
    setLocalSection(replaceRecursive(localSection));
  };

  const handleUpdateSectionColumnLayout = (secId: string, preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => {
    const targetWidths = presetWidths(preset);
    const applyToSection = (sec: SectionInstance): SectionInstance => {
      if (sec.id !== secId) {
        return {
          ...sec,
          columns: sec.columns.map((col) => ({ ...col, subSections: (col.subSections || []).map(applyToSection) }))
        };
      }
      const currentCols = sec.columns;
      let newCols: ColumnInstance[];
      if (currentCols.length <= targetWidths.length) {
        newCols = currentCols.map((col, idx) => ({ ...col, width: targetWidths[idx], widths: { ...col.widths, desktop: targetWidths[idx] } }));
        for (let i = currentCols.length; i < targetWidths.length; i++) {
          newCols.push({ id: `col-${secId}-${Date.now()}-${i}`, width: targetWidths[i], widths: withWidths(targetWidths[i]), widgets: [], subSections: [] });
        }
      } else {
        const retained: ColumnInstance[] = currentCols.slice(0, targetWidths.length).map((col, idx) => ({ ...col, width: targetWidths[idx], widths: { ...col.widths, desktop: targetWidths[idx] } }));
        const overflowBlocks = currentCols.slice(targetWidths.length).flatMap((c) => getColumnBlocks(c));
        retained[retained.length - 1] = setColumnBlocks(retained[retained.length - 1], [...getColumnBlocks(retained[retained.length - 1]), ...overflowBlocks]);
        newCols = retained;
      }
      return { ...sec, columns: newCols };
    };
    setLocalSection(applyToSection(localSection));
  };

  const handleUpdateColumnWidth = (secId: string, colId: string, bp: Breakpoint, value: number) => {
    const applyToSection = (sec: SectionInstance): SectionInstance => ({
      ...sec,
      columns: sec.columns.map((col) => {
        if (col.id !== colId) return { ...col, subSections: (col.subSections || []).map(applyToSection) };
        const widths = { desktop: col.widths?.desktop ?? col.width, tablet: col.widths?.tablet, mobile: col.widths?.mobile };
        (widths as any)[bp] = value;
        return { ...col, widths, width: bp === 'desktop' ? value : col.width };
      })
    });
    setLocalSection(applyToSection(localSection));
  };

  const handleUpdateColumn = (secId: string, colId: string, patch: Partial<ColumnInstance>) => {
    const applyToSection = (sec: SectionInstance): SectionInstance => ({
      ...sec,
      columns: sec.columns.map((col) => {
        if (col.id !== colId) return { ...col, subSections: (col.subSections || []).map(applyToSection) };
        return { ...col, ...patch };
      })
    });
    setLocalSection(applyToSection(localSection));
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="w-full h-full max-w-[1600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <span>ویرایش محتوای تب</span>
            {tabLabel && <span className="text-teal-600 dark:text-teal-400">— {tabLabel}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> انصراف
            </button>
            <button
              type="button"
              onClick={() => onSave(localSection)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> ذخیره و بستن
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          <Canvas
            pageSchema={
              {
                id: 'tab-editor',
                title: tabLabel || 'ویرایش تب',
                slug: 'tab-editor',
                status: 'draft',
                createdAt: '',
                updatedAt: '',
                version: 1,
                globalStyles: DEFAULT_GLOBAL_STYLES,
                sections: [localSection],
                versionHistory: []
              } as SmartPageSchema
            }
            activeBreakpoint={activeBreakpoint}
            selectedSectionId={selectedSectionId}
            selectedColumnId={selectedColumnId}
            selectedWidgetId={selectedWidgetId}
            currentUserRole="all"
            onSelectSection={setSelectedSectionId}
            onSelectColumn={setSelectedColumnId}
            onSelectWidget={setSelectedWidgetId}
            onAddWidget={handleAddWidget}
            onAddSection={(preset) => addNestedSection(preset, null)}
            onOpenComponentPicker={(_insertIndex, targetColumnId) => {
              setPickerTargetColumnId(targetColumnId ?? selectedColumnId);
              setShowPicker(true);
            }}
            onDeleteSection={handleDeleteSection}
            onDeleteWidget={handleDeleteWidget}
            onMoveWidget={handleMoveWidget}
            onAddSubSection={(columnId) => addNestedSection('1col', columnId)}
          />

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
          />
        </div>
      </div>

      <ComponentPickerModal
        isOpen={showPicker}
        targetColumnId={pickerTargetColumnId}
        onSelectWidget={(widgetType) => {
          handleAddWidget(widgetType, pickerTargetColumnId || undefined);
          setShowPicker(false);
        }}
        onSelectSectionPreset={(preset) => {
          addNestedSection(preset, pickerTargetColumnId);
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />
    </div>
  );
};
