import React, { useEffect, useState } from 'react';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Calendar,
  Clock,
  ListFilter,
  CheckSquare,
  CircleDot,
  CheckCircle2,
  Table,
  Upload,
  SlidersHorizontal,
  PenTool,
  Plus,
  Trash2,
  Copy,
  Layers,
  Search,
  GripVertical,
  Star,
  ChevronDown,
  Award,
  MoveUp,
  MoveDown,
  Sparkles,
  X,
  Lock,
  DollarSign,
  Percent,
  Compass,
  Palette,
  Globe,
  Home,
  ArrowDown,
  MapPin,
  Columns,
  Columns2,
  Columns3,
  LogOut,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { FormDefinition, FormField, FieldType, FormStep, FormLayoutBlock, FormLayoutColumn } from './types';
import FormInspectorPanel from './FormInspectorPanel';

interface FormBuilderCanvasProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
  activeBreakpoint?: '1240' | '1024' | '768' | '380';
  scrollToFieldId?: string | null;
}

const FIELD_PALETTE: {
  category: string;
  items: { type: FieldType; label: string; icon: any; color: string; desc: string }[];
}[] = [
  {
    category: 'ورودی‌های متنی و هویتی',
    items: [
      { type: 'text', label: 'متن تک‌خطی', icon: Type, color: 'text-teal-600 dark:text-teal-400', desc: 'نام، نام خانوادگی، عنوان' },
      { type: 'textarea', label: 'متن چندخطی (توضیحات)', icon: AlignLeft, color: 'text-cyan-600 dark:text-cyan-400', desc: 'شرح، بازخورد، بیوگرافی' },
      { type: 'number', label: 'ورودی عددی', icon: Hash, color: 'text-amber-600 dark:text-amber-400', desc: 'سن، کد ملی، تعداد' },
      { type: 'email', label: 'پست الکترونیکی', icon: Mail, color: 'text-blue-600 dark:text-blue-400', desc: 'ایمیل با اعتبارسنجی دامنه' },
      { type: 'phone', label: 'شماره همراه / ثابت', icon: Phone, color: 'text-emerald-600 dark:text-emerald-400', desc: 'موبایل ۱۱ رقمی یا بین‌المللی' },
      { type: 'password', label: 'گذرواژه و رمز عبور', icon: Lock, color: 'text-rose-600 dark:text-rose-400', desc: 'رمز عبور با قوانین پیچیدگی' }
    ]
  },
  {
    category: 'انتخابی، چندگزینه‌ای و آبشاری',
    items: [
      { type: 'select', label: 'منوی کشویی (Dropdown)', icon: ListFilter, color: 'text-indigo-600 dark:text-indigo-400', desc: 'انتخاب یک گزینه با قابلیت جستجو' },
      { type: 'radio', label: 'تک انتخابی (Radio)', icon: CircleDot, color: 'text-purple-600 dark:text-purple-400', desc: 'دکمه‌های رادیویی با چیدمان افقی/عمودی' },
      { type: 'checkbox', label: 'چند انتخابی (Checkbox)', icon: CheckSquare, color: 'text-violet-600 dark:text-violet-400', desc: 'انتخاب همزمان چند مورد با محدودیت' },
      { type: 'yesno', label: 'کلید دوحالته (بله / خیر)', icon: CheckCircle2, color: 'text-rose-600 dark:text-rose-400', desc: 'پاسخ‌های دوتایی قطعی و تاییدیه' },
      { type: 'cascading', label: 'انتخاب وابسته (آبشاری)', icon: Layers, color: 'text-sky-600 dark:text-sky-400', desc: 'استان/شهر یا دانشکده/گروه' }
    ]
  },
  {
    category: 'تاریخ، زمان و مالی',
    items: [
      { type: 'date', label: 'تاریخ (شمسی / میلادی)', icon: Calendar, color: 'text-teal-600 dark:text-teal-400', desc: 'انتخاب تاریخ روز یا تقویم' },
      { type: 'time', label: 'ساعت و زمان', icon: Clock, color: 'text-sky-600 dark:text-sky-400', desc: 'فرمت ۲۴ ساعته یا ۱۲ ساعته' },
      { type: 'currency', label: 'مبلغ و ریالی', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', desc: 'تومان، ریال، دلار با ۳ رقم اعشار' },
      { type: 'percentage', label: 'درصد و ضریب', icon: Percent, color: 'text-amber-600 dark:text-amber-400', desc: 'مقادیر درصدی از ۰ تا ۱۰۰٪' }
    ]
  },
  {
    category: 'ارزشیابی، فایل و پیشرفته',
    items: [
      { type: 'rating', label: 'نمره‌دهی ستاره‌ای (Rating)', icon: Star, color: 'text-amber-500', desc: 'رضایت‌سنجی ۱ تا ۵ ستاره یا قلب' },
      { type: 'matrix', label: 'ماتریس لیکرت (Likert Table)', icon: Table, color: 'text-teal-500', desc: 'ارزیابی چند معیار همزمان' },
      { type: 'slider', label: 'اسلایدر پیوسته عددی', icon: SlidersHorizontal, color: 'text-indigo-500', desc: 'انتخاب بازه‌ای از مقادیر' },
      { type: 'file', label: 'بارگذاری مدارک و فایل', icon: Upload, color: 'text-orange-500', desc: 'PDF، تصویر، زیپ با محدودیت حجم' },
      { type: 'signature', label: 'امضای دیجیتال کاربر', icon: PenTool, color: 'text-emerald-500', desc: 'تاییدیه با قلم لمسی یا ماوس' },
      { type: 'address', label: 'آدرس و کد پستی', icon: Home, color: 'text-indigo-600', desc: 'شامل استان، شهر و کدپستی' },
      { type: 'location', label: 'موقعیت نقشه (GPS)', icon: MapPin, color: 'text-rose-500', desc: 'انتخاب نقطه جغرافیایی روی نقشه' },
      { type: 'color', label: 'انتخاب رنگ (Color Picker)', icon: Palette, color: 'text-pink-500', desc: 'کدهای رنگی HEX / RGB' },
      { type: 'url', label: 'پیوند وب‌سایت (URL)', icon: Globe, color: 'text-blue-500', desc: 'آدرس اینترنتی معتبر با https' }
    ]
  },
  {
    category: 'امنیت و ضدربات',
    items: [
      { type: 'security', label: 'فیلد امنیتی (کپچا و ضدربات)', icon: ShieldCheck, color: 'text-red-600 dark:text-red-400', desc: 'کد امنیتی تصویری، کد چندرقمی، چالش تصویری یا تله ضدربات' }
    ]
  }
];

export const FormBuilderCanvas: React.FC<FormBuilderCanvasProps> = ({
  form,
  onChange,
  activeBreakpoint = '1240',
  scrollToFieldId = null
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    form.fields[0]?.id || null
  );
  const [activeStepId, setActiveStepId] = useState<string>(
    form.steps[0]?.id || 's1'
  );
  const [paletteSearch, setPaletteSearch] = useState('');
  const [newFieldId, setNewFieldId] = useState<string | null>(null);
  const [isAddStepDialogOpen, setIsAddStepDialogOpen] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');

  // Drag-and-Drop state tracking
  const [draggedPaletteType, setDraggedPaletteType] = useState<{ type: FieldType; label: string } | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [draggedBlockPreset, setDraggedBlockPreset] = useState<{ columns: 1 | 2 | 3 } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<{ blockId: string; columnId: string } | null>(null);

  const selectedField = form.fields.find(f => f.id === selectedFieldId) || null;

  useEffect(() => {
    const fieldId = scrollToFieldId || newFieldId;
    if (!fieldId) return;

    requestAnimationFrame(() => {
      document.getElementById(`form-field-${fieldId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    });
  }, [scrollToFieldId, newFieldId, form.fields.length]);

  // Filtered fields in active step
  const currentStepFields = form.fields.filter(
    f => f.stepId === activeStepId || (!f.stepId && activeStepId === form.steps[0]?.id)
  );

  // گروه‌بندی فیلدهای این گام به فیلدهای مستقل و بلوک‌های ستونی (برای رندر بوم)
  type RenderGroup =
    | { kind: 'field'; field: FormField; startIndex: number; endIndex: number }
    | { kind: 'block'; block: FormLayoutBlock; fieldCount: number; startIndex: number; endIndex: number };

  // گذر ۱: فیلدهای مستقل و بلوک‌هایی که حداقل یک فیلد دارند (لنگرشان همان اولین فیلد عضو است)
  type PopulatedGroup =
    | { kind: 'field'; field: FormField }
    | { kind: 'block'; block: FormLayoutBlock; fieldCount: number };

  const consumedByBlock = new Set<string>();
  const populatedGroups: PopulatedGroup[] = [];
  currentStepFields.forEach(field => {
    if (consumedByBlock.has(field.id)) return;
    const block = field.layoutBlockId
      ? form.layoutBlocks.find(b => b.id === field.layoutBlockId && b.stepId === activeStepId)
      : undefined;
    if (block) {
      let fieldCount = 0;
      block.columns.forEach(col => col.fieldIds.forEach(fid => {
        consumedByBlock.add(fid);
        fieldCount++;
      }));
      populatedGroups.push({ kind: 'block', block, fieldCount });
    } else {
      populatedGroups.push({ kind: 'field', field });
    }
  });

  // گذر ۲: بلوک‌های خالی (بدون هیچ فیلدی) این گام را بر اساس لنگر afterFieldId در جای درست درج می‌کنیم
  const mergedGroups: PopulatedGroup[] = [...populatedGroups];
  form.layoutBlocks
    .filter(b => b.stepId === activeStepId && b.columns.every(c => c.fieldIds.length === 0))
    .forEach(block => {
      const anchorId = block.afterFieldId;
      let insertAt = 0;
      if (anchorId) {
        const idx = mergedGroups.findIndex(g =>
          (g.kind === 'field' && g.field.id === anchorId) ||
          (g.kind === 'block' && g.block.columns.some(c => c.fieldIds.includes(anchorId)))
        );
        insertAt = idx >= 0 ? idx + 1 : mergedGroups.length;
      }
      mergedGroups.splice(insertAt, 0, { kind: 'block', block, fieldCount: 0 });
    });

  // گذر ۳: محاسبهٔ ایندکس تخت (برای drop-zoneها و شمارهٔ Q) — بلوک‌های خالی هیچ ایندکسی مصرف نمی‌کنند
  let runningFlatIndex = 0;
  const renderGroups: RenderGroup[] = mergedGroups.map(group => {
    const startIndex = runningFlatIndex;
    if (group.kind === 'field') {
      runningFlatIndex += 1;
    } else {
      runningFlatIndex += group.fieldCount;
    }
    return { ...group, startIndex, endIndex: runningFlatIndex };
  });

  // Helper: create a new field instance
  const createNewFieldInstance = (type: FieldType, label: string, targetStepId: string): FormField => {
    const base: FormField = {
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      label: `سوال جدید ${form.fields.length + 1}: ${label}`,
      placeholder: 'متن راهنما را وارد کنید...',
      stepId: targetStepId,
      columnWidth: '100%',
      validation: { required: false },
      options: ['گزینه ۱', 'گزینه ۲', 'گزینه ۳'].map((lbl, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        label: lbl,
        value: `val_${idx + 1}`
      }))
    };

    if (type === 'security') {
      return {
        ...base,
        placeholder: undefined,
        helpText: 'برای تایید انسانی بودن، کد نمایش‌داده‌شده را وارد کنید.',
        options: undefined,
        validation: { required: true },
        securityType: 'image_captcha',
        securityStyle: 'boxed',
        securitySize: 'md',
        securityButtonText: 'دریافت کد جدید',
        securityMaxAttempts: 4,
        securityExpirySeconds: 120,
        securityCodeLength: 5,
        securityCaseSensitive: false
      };
    }

    return base;
  };

  // Add field to current step at specific index or at end
  const handleAddField = (type: FieldType, label: string, insertAtStepIndex?: number) => {
    const newField = createNewFieldInstance(type, label, activeStepId);

    if (insertAtStepIndex !== undefined && insertAtStepIndex >= 0) {
      // Find global position corresponding to this step index
      const otherStepFields = form.fields.filter(
        f => f.stepId !== activeStepId && (f.stepId || activeStepId !== form.steps[0]?.id)
      );
      const stepFields = [...currentStepFields];
      stepFields.splice(insertAtStepIndex, 0, newField);

      // Reassemble fields preserving step structure
      const updatedFields: FormField[] = [];
      form.steps.forEach(st => {
        if (st.id === activeStepId) {
          updatedFields.push(...stepFields);
        } else {
          updatedFields.push(...form.fields.filter(f => f.stepId === st.id));
        }
      });

      onChange({ ...form, fields: updatedFields });
    } else {
      const updatedFields = [...form.fields, newField];
      onChange({ ...form, fields: updatedFields });
    }
    setSelectedFieldId(newField.id);
    setNewFieldId(newField.id);
  };

  // Reorder existing field to a new step index
  const handleReorderFieldToStepIndex = (sourceFieldId: string, targetIndex: number) => {
    const sourceField = form.fields.find(f => f.id === sourceFieldId);
    if (!sourceField) return;

    // Remove source field from step fields
    const stepFields = currentStepFields.filter(f => f.id !== sourceFieldId);
    // Insert at target index
    const clampedTarget = Math.max(0, Math.min(targetIndex, stepFields.length));
    stepFields.splice(clampedTarget, 0, { ...sourceField, stepId: activeStepId });

    // Reconstruct full form fields
    const updatedFields: FormField[] = [];
    form.steps.forEach(st => {
      if (st.id === activeStepId) {
        updatedFields.push(...stepFields);
      } else {
        updatedFields.push(...form.fields.filter(f => f.id !== sourceFieldId && f.stepId === st.id));
      }
    });

    onChange({ ...form, fields: updatedFields });
    setSelectedFieldId(sourceFieldId);
  };

  // ===== بلوک‌های ستونی (چیدمان تک/دو/سه‌ستونهٔ مساوی) =====

  // وقتی آخرین فیلد یک بلوک برداشته می‌شود، شناسهٔ فیلدِ درست‌قبل از آن را برمی‌گرداند
  // تا به‌عنوان لنگر موقعیتِ بلوکِ (اکنون) خالی ذخیره شود و بلوک جابه‌جا نشود.
  const computeAfterFieldIdFor = (fieldId: string): string | null => {
    const idx = currentStepFields.findIndex(f => f.id === fieldId);
    if (idx <= 0) return null;
    return currentStepFields[idx - 1].id;
  };

  // درج یک فیلد جدید در بازهٔ پیوستهٔ فیلدهای یک بلوک در آرایهٔ form.fields.
  // اگر بلوک هنوز هیچ فیلدی نداشته باشد (بلوک خالی)، بر اساس لنگر afterFieldId آن درج می‌شود.
  const insertFieldIntoBlockSpan = (fields: FormField[], newField: FormField, blockId: string): FormField[] => {
    const lastIdx = fields.reduce((acc, f, i) => (f.layoutBlockId === blockId ? i : acc), -1);
    if (lastIdx !== -1) {
      return [...fields.slice(0, lastIdx + 1), newField, ...fields.slice(lastIdx + 1)];
    }

    const block = form.layoutBlocks.find(b => b.id === blockId);
    const anchorId = block?.afterFieldId;
    if (anchorId) {
      const anchorIdx = fields.findIndex(f => f.id === anchorId);
      if (anchorIdx !== -1) {
        return [...fields.slice(0, anchorIdx + 1), newField, ...fields.slice(anchorIdx + 1)];
      }
    }
    if (!anchorId) {
      const stepStartIdx = fields.findIndex(f => f.stepId === activeStepId);
      if (stepStartIdx !== -1) {
        return [...fields.slice(0, stepStartIdx), newField, ...fields.slice(stepStartIdx)];
      }
    }
    return [...fields, newField];
  };

  // افزودن بلوک جدید (۱، ۲ یا ۳ ستونهٔ مساوی) — بدون فیلد؛ فیلدها بعداً داخل ستون‌ها تعریف می‌شوند
  const handleAddBlock = (columnCount: 1 | 2 | 3, insertAtStepIndex?: number) => {
    const blockId = `blk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const columns: FormLayoutColumn[] = Array.from({ length: columnCount }, (_, i) => ({
      id: `col_${blockId}_${i + 1}`,
      fieldIds: []
    }));

    // موقعیت بلوکِ خالی را با شناسهٔ فیلدِ پیش از آن لنگر می‌کنیم (طبق محل drop یا انتهای گام برای کلیک)
    let afterFieldId: string | null = null;
    if (insertAtStepIndex !== undefined && insertAtStepIndex > 0) {
      afterFieldId = currentStepFields[insertAtStepIndex - 1]?.id ?? null;
    } else if (insertAtStepIndex === undefined) {
      afterFieldId = currentStepFields[currentStepFields.length - 1]?.id ?? null;
    }

    const newBlock: FormLayoutBlock = { id: blockId, stepId: activeStepId, columns, afterFieldId };
    onChange({ ...form, layoutBlocks: [...form.layoutBlocks, newBlock] });
  };

  // افزودن یک فیلد نو مستقیماً داخل یک ستون از بلوک (رها کردن آیتم پالت روی ستون)
  const handleAddFieldToColumn = (type: FieldType, label: string, blockId: string, columnId: string) => {
    const newField = createNewFieldInstance(type, label, activeStepId);
    newField.layoutBlockId = blockId;
    newField.layoutColumnId = columnId;
    const updatedFields = insertFieldIntoBlockSpan(form.fields, newField, blockId);
    const updatedBlocks = form.layoutBlocks.map(b =>
      b.id === blockId
        ? { ...b, columns: b.columns.map(c => (c.id === columnId ? { ...c, fieldIds: [...c.fieldIds, newField.id] } : c)) }
        : b
    );
    onChange({ ...form, fields: updatedFields, layoutBlocks: updatedBlocks });
    setSelectedFieldId(newField.id);
    setNewFieldId(newField.id);
  };

  // انتقال یک فیلد موجود (مستقل یا از بلوک/ستون دیگر) به یک ستون از بلوک
  const handleMoveFieldToColumn = (fieldId: string, targetBlockId: string, targetColumnId: string) => {
    const field = form.fields.find(f => f.id === fieldId);
    if (!field) return;
    const sourceBlockId = field.layoutBlockId;
    if (sourceBlockId === targetBlockId && field.layoutColumnId === targetColumnId) return;

    let updatedBlocks = form.layoutBlocks.map(b =>
      b.id === sourceBlockId
        ? { ...b, columns: b.columns.map(c => ({ ...c, fieldIds: c.fieldIds.filter(id => id !== fieldId) })) }
        : b
    );
    if (sourceBlockId && sourceBlockId !== targetBlockId) {
      const srcBlock = updatedBlocks.find(b => b.id === sourceBlockId);
      if (srcBlock && srcBlock.columns.every(c => c.fieldIds.length === 0)) {
        const anchorId = computeAfterFieldIdFor(fieldId);
        updatedBlocks = updatedBlocks.map(b => (b.id === sourceBlockId ? { ...b, afterFieldId: anchorId } : b));
      }
    }
    updatedBlocks = updatedBlocks.map(b =>
      b.id === targetBlockId
        ? { ...b, columns: b.columns.map(c => (c.id === targetColumnId ? { ...c, fieldIds: [...c.fieldIds, fieldId] } : c)) }
        : b
    );

    let updatedFields = form.fields.filter(f => f.id !== fieldId);
    const movedField: FormField = { ...field, layoutBlockId: targetBlockId, layoutColumnId: targetColumnId, stepId: activeStepId };
    updatedFields = insertFieldIntoBlockSpan(updatedFields, movedField, targetBlockId);

    onChange({ ...form, fields: updatedFields, layoutBlocks: updatedBlocks });
    setSelectedFieldId(fieldId);
  };

  // خروج یک فیلد از بلوک و تبدیل آن به فیلد مستقل (بدون حذف پیکربندی فیلد).
  // اگر این آخرین فیلد بلوک بود، بلوک حذف نمی‌شود — خالی می‌ماند تا بعداً فیلدی دیگر در آن تعریف شود.
  const handleRemoveFieldFromBlock = (fieldId: string) => {
    const field = form.fields.find(f => f.id === fieldId);
    if (!field || !field.layoutBlockId) return;
    const blockId = field.layoutBlockId;
    const anchorId = computeAfterFieldIdFor(fieldId);
    const updatedFields = form.fields.map(f =>
      f.id === fieldId ? { ...f, layoutBlockId: undefined, layoutColumnId: undefined } : f
    );
    const updatedBlocks = form.layoutBlocks.map(b => {
      if (b.id !== blockId) return b;
      const columns = b.columns.map(c => ({ ...c, fieldIds: c.fieldIds.filter(id => id !== fieldId) }));
      const isNowEmpty = columns.every(c => c.fieldIds.length === 0);
      return { ...b, columns, ...(isNowEmpty ? { afterFieldId: anchorId } : {}) };
    });
    onChange({ ...form, fields: updatedFields, layoutBlocks: updatedBlocks });
  };

  // حذف کامل یک بلوک — فیلدهای عضو حذف نمی‌شوند، فقط به فیلد مستقل تبدیل می‌شوند
  const handleDeleteBlock = (blockId: string) => {
    const block = form.layoutBlocks.find(b => b.id === blockId);
    if (!block) return;
    const memberCount = block.columns.reduce((acc, c) => acc + c.fieldIds.length, 0);
    if (memberCount > 0 && !window.confirm(`این بلوک شامل ${memberCount} فیلد است. با حذف بلوک، فیلدها به‌صورت مستقل باقی می‌مانند و حذف نمی‌شوند. ادامه می‌دهید؟`)) {
      return;
    }
    const updatedFields = form.fields.map(f =>
      f.layoutBlockId === blockId ? { ...f, layoutBlockId: undefined, layoutColumnId: undefined } : f
    );
    const updatedBlocks = form.layoutBlocks.filter(b => b.id !== blockId);
    onChange({ ...form, fields: updatedFields, layoutBlocks: updatedBlocks });
  };

  // Drag and Drop Event Handlers

  // خواندن بار دادهٔ درگ مستقیماً از dataTransfer مرورگر — پشتیبان state، برای لحظهٔ drop
  type DragPayload =
    | { source: 'palette'; type: FieldType; label: string }
    | { source: 'block-palette'; columns: 1 | 2 | 3 }
    | { source: 'canvas'; fieldId: string };

  const parseDragPayload = (e: React.DragEvent): DragPayload | null => {
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return null;
      return JSON.parse(raw) as DragPayload;
    } catch {
      return null;
    }
  };

  const handlePaletteDragStart = (e: React.DragEvent, type: FieldType, label: string) => {
    setDraggedPaletteType({ type, label });
    setDraggedFieldId(null);
    setDraggedBlockPreset(null);
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'palette', type, label }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleBlockPaletteDragStart = (e: React.DragEvent, columns: 1 | 2 | 3) => {
    setDraggedBlockPreset({ columns });
    setDraggedPaletteType(null);
    setDraggedFieldId(null);
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'block-palette', columns }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleColumnDragOver = (e: React.DragEvent, blockId: string, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = draggedPaletteType ? 'copy' : 'move';
    if (!dragOverColumn || dragOverColumn.blockId !== blockId || dragOverColumn.columnId !== columnId) {
      setDragOverColumn({ blockId, columnId });
    }
  };

  const handleColumnDrop = (e: React.DragEvent, blockId: string, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    const payload = parseDragPayload(e);
    const paletteType = draggedPaletteType || (payload?.source === 'palette' ? { type: payload.type, label: payload.label } : null);
    const fieldId = draggedFieldId || (payload?.source === 'canvas' ? payload.fieldId : null);
    if (paletteType) {
      handleAddFieldToColumn(paletteType.type, paletteType.label, blockId, columnId);
    } else if (fieldId) {
      handleMoveFieldToColumn(fieldId, blockId, columnId);
    }
    setDraggedPaletteType(null);
    setDraggedFieldId(null);
  };

  const handleFieldDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    setDraggedPaletteType(null);
    setDraggedBlockPreset(null);
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'canvas', fieldId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverZone = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = draggedPaletteType || draggedBlockPreset ? 'copy' : 'move';
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDropOnZone = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetIndex(null);

    // علاوه بر state، بار دادهٔ خامِ dataTransfer را هم می‌خوانیم — چون در برخی مرورگرها/سناریوها
    // (مثلاً کشیدن از دور، بین ری‌رندرهای پی‌درپی) ممکن است state هنوز به‌روزرسانی نشده باشد
    // ولی payload بومی مرورگر همیشه در لحظهٔ drop در دسترس است.
    const payload = parseDragPayload(e);
    const paletteType = draggedPaletteType || (payload?.source === 'palette' ? { type: payload.type, label: payload.label } : null);
    const blockPreset = draggedBlockPreset || (payload?.source === 'block-palette' ? { columns: payload.columns } : null);
    const fieldId = draggedFieldId || (payload?.source === 'canvas' ? payload.fieldId : null);

    if (paletteType) {
      handleAddField(paletteType.type, paletteType.label, targetIndex);
    } else if (blockPreset) {
      handleAddBlock(blockPreset.columns, targetIndex);
    } else if (fieldId) {
      handleReorderFieldToStepIndex(fieldId, targetIndex);
    }
    setDraggedPaletteType(null);
    setDraggedBlockPreset(null);
    setDraggedFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedPaletteType(null);
    setDraggedFieldId(null);
    setDraggedBlockPreset(null);
    setDropTargetIndex(null);
    setDragOverColumn(null);
  };

  // Duplicate field
  const handleDuplicateField = (field: FormField) => {
    const dup: FormField = {
      ...field,
      id: `f_${Date.now()}`,
      label: `${field.label} (کپی)`
    };

    if (field.layoutBlockId && field.layoutColumnId) {
      const blockId = field.layoutBlockId;
      const columnId = field.layoutColumnId;
      const updatedFields = insertFieldIntoBlockSpan(form.fields, dup, blockId);
      const updatedBlocks = form.layoutBlocks.map(b =>
        b.id === blockId
          ? { ...b, columns: b.columns.map(c => (c.id === columnId ? { ...c, fieldIds: [...c.fieldIds, dup.id] } : c)) }
          : b
      );
      onChange({ ...form, fields: updatedFields, layoutBlocks: updatedBlocks });
    } else {
      const updatedFields = [...form.fields, dup];
      onChange({ ...form, fields: updatedFields });
    }
    setSelectedFieldId(dup.id);
  };

  // Delete field
  const handleDeleteField = (fieldId: string) => {
    const deletedField = form.fields.find(f => f.id === fieldId);
    const anchorId = deletedField?.layoutBlockId ? computeAfterFieldIdFor(fieldId) : null;
    const updatedFields = form.fields.filter(f => f.id !== fieldId);
    let updatedBlocks = form.layoutBlocks;
    if (deletedField?.layoutBlockId) {
      const blockId = deletedField.layoutBlockId;
      updatedBlocks = updatedBlocks.map(b => {
        if (b.id !== blockId) return b;
        const columns = b.columns.map(c => ({ ...c, fieldIds: c.fieldIds.filter(id => id !== fieldId) }));
        const isNowEmpty = columns.every(c => c.fieldIds.length === 0);
        return { ...b, columns, ...(isNowEmpty ? { afterFieldId: anchorId } : {}) };
      });
    }
    onChange({ ...form, fields: updatedFields, layoutBlocks: updatedBlocks });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(updatedFields[0]?.id || null);
    }
  };

  // Update field
  const handleUpdateField = (updatedField: FormField) => {
    const updatedFields = form.fields.map(f => (f.id === updatedField.id ? updatedField : f));
    onChange({ ...form, fields: updatedFields });
  };

  // Reorder field up/down
  const handleMoveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentFields = [...form.fields];
    const index = currentFields.findIndex(f => f.id === fieldId);
    if (index < 0) return;
    if (direction === 'up' && index > 0) {
      const temp = currentFields[index];
      currentFields[index] = currentFields[index - 1];
      currentFields[index - 1] = temp;
      onChange({ ...form, fields: currentFields });
    } else if (direction === 'down' && index < currentFields.length - 1) {
      const temp = currentFields[index];
      currentFields[index] = currentFields[index + 1];
      currentFields[index + 1] = temp;
      onChange({ ...form, fields: currentFields });
    }
  };

  // Add step
  const handleAddStep = () => {
    setNewStepTitle(`گام ${form.steps.length + 1}`);
    setIsAddStepDialogOpen(true);
  };

  const handleConfirmAddStep = () => {
    const title = newStepTitle.trim();
    if (!title) return;

    const newStep: FormStep = {
      id: `s_${Date.now()}`,
      title,
      order: form.steps.length + 1
    };
    onChange({ ...form, steps: [...form.steps, newStep] });
    setActiveStepId(newStep.id);
    setIsAddStepDialogOpen(false);
  };

  const handleDeleteStep = (stepId: string) => {
    if (form.steps.length <= 1) return;

    const remainingSteps = form.steps.filter(step => step.id !== stepId);
    const fallbackStepId = remainingSteps[0].id;
    const updatedFields = form.fields.map(field =>
      field.stepId === stepId ? { ...field, stepId: fallbackStepId } : field
    );
    const updatedSteps = remainingSteps.map((step, index) => ({ ...step, order: index + 1 }));

    onChange({ ...form, steps: updatedSteps, fields: updatedFields });
    if (activeStepId === stepId) setActiveStepId(fallbackStepId);
  };

  // Canvas Max Width based on breakpoint
  const getMaxWidthClass = () => {
    switch (activeBreakpoint) {
      case '380': return 'max-w-xs';
      case '768': return 'max-w-xl';
      case '1024': return 'max-w-3xl';
      default: return 'max-w-4xl';
    }
  };

  const activeStep = form.steps.find(step => step.id === activeStepId);
  const updateActiveStepPresentation = (mode: 'all' | 'pagination', fieldsPerPage?: number) => {
    if (!activeStep) return;
    const updatedSteps = form.steps.map(step =>
      step.id === activeStep.id
        ? {
            ...step,
            presentation: {
              mode,
              ...(mode === 'pagination' ? { fieldsPerPage: Math.max(1, fieldsPerPage || 1) } : {})
            }
          }
        : step
    );
    onChange({ ...form, steps: updatedSteps });
  };

  // در نمایش «صفحه‌بندی» گام، بلوک‌های ستونی نباید اعمال شوند
  const columnsBlockedByPagination = activeStep?.presentation?.mode === 'pagination';

  // کارت یک فیلد — هم برای فیلد مستقل و هم برای فیلد داخل ستون یک بلوک استفاده می‌شود
  const renderFieldCard = (field: FormField, displayIndex: number, inBlock: boolean = false) => {
    const isSelected = selectedFieldId === field.id;
    const isBeingDragged = draggedFieldId === field.id;

    return (
      <div
        id={`form-field-${field.id}`}
        draggable
        onDragStart={e => handleFieldDragStart(e, field.id)}
        onDragEnd={handleDragEnd}
        onClick={() => setSelectedFieldId(field.id)}
        className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all cursor-pointer relative group ${
          isBeingDragged
            ? 'opacity-40 border-dashed border-teal-400 scale-[0.98]'
            : isSelected
            ? 'border-2 border-teal-600 dark:border-teal-500 shadow-xl ring-4 ring-teal-500/10'
            : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 shadow-xs'
        }`}
      >
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="برای جابجایی بکشید (DnD)"
            >
              <GripVertical className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/20 px-2.5 py-0.5 rounded-lg border border-teal-200 dark:border-teal-500/30">
              Q{displayIndex + 1}
            </span>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">
              {field.label}
            </h4>
            {field.validation?.required && (
              <span className="text-[10px] text-red-500 font-bold bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-md">
                * ضروری
              </span>
            )}
            {field.points ? (
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Award className="w-3 h-3" /> {field.points} نمره
              </span>
            ) : null}
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            {!inBlock && (
              <>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleMoveField(field.id, 'up');
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                  title="حرکت به بالا"
                >
                  <MoveUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleMoveField(field.id, 'down');
                  }}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                  title="حرکت به پایین"
                >
                  <MoveDown className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {inBlock && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleRemoveFieldFromBlock(field.id);
                }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
                title="خروج از بلوک (تبدیل به فیلد مستقل)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={e => {
                e.stopPropagation();
                handleDuplicateField(field);
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700"
              title="کپی فیلد"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                handleDeleteField(field.id);
              }}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-slate-400 hover:text-red-600"
              title="حذف"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Realistic Field Component Visual Simulation */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3.5 text-xs">
          {['text', 'email', 'phone', 'number', 'password', 'currency', 'percentage', 'url'].includes(field.type) && (
            <div className="px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400 flex items-center justify-between">
              <span>{field.placeholder || 'پاسخ کاربر در این محل قرار می‌گیرد...'}</span>
              {field.numberUnit && (
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                  {field.numberUnit}
                </span>
              )}
              {field.type === 'currency' && (
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                  {field.currencyUnit || 'تومان'}
                </span>
              )}
            </div>
          )}

          {field.type === 'textarea' && (
            <div className="px-3 py-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400 h-16">
              {field.placeholder || 'کادر متن چندخطی و توضیحات تفصیلی...'}
            </div>
          )}

          {field.type === 'select' && (
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400">
              <span>{field.placeholder || 'انتخاب کنید...'}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          )}

          {field.type === 'radio' && (
            <div className="space-y-2">
              {(field.options || ['گزینه الف', 'گزینه ب']).map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                    {oIdx === 0 && <div className="w-2 h-2 rounded-full bg-teal-600"></div>}
                  </div>
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
          )}

          {field.type === 'checkbox' && (
            <div className="space-y-2">
              {(field.options || ['گزینه ۱', 'گزینه ۲']).map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <div className="w-4 h-4 rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center">
                    {oIdx === 0 && <CheckCircle2 className="w-3 h-3 text-teal-600" />}
                  </div>
                  <span>{opt.label}</span>
                </div>
              ))}
            </div>
          )}

          {field.type === 'rating' && (
            <div className="flex items-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map(st => (
                <Star
                  key={st}
                  className={`w-5 h-5 ${st <= 4 ? '' : 'text-slate-300 dark:text-slate-700'}`}
                  style={st <= 4 ? { color: field.iconColor || '#fbbf24', fill: field.iconColor || '#fbbf24' } : undefined}
                />
              ))}
              <span className="text-xs text-slate-400 mr-2">(۴ از ۵)</span>
            </div>
          )}

          {field.type === 'matrix' && (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-right">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-slate-800 text-slate-500">
                    <th className="py-1">معیار</th>
                    <th className="py-1 text-center">عالی</th>
                    <th className="py-1 text-center">خوب</th>
                    <th className="py-1 text-center">متوسط</th>
                    <th className="py-1 text-center">ضعیف</th>
                  </tr>
                </thead>
                <tbody>
                  {(field.matrixRows || [{ id: '1', label: 'کیفیت تدریس' }]).map(r => (
                    <tr key={r.id} className="border-b border-gray-100 dark:border-slate-800/50">
                      <td className="py-1.5 font-bold text-slate-700 dark:text-slate-300">{r.label}</td>
                      <td className="py-1.5 text-center"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 mx-auto"></div></td>
                      <td className="py-1.5 text-center"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 mx-auto"></div></td>
                      <td className="py-1.5 text-center"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 mx-auto"></div></td>
                      <td className="py-1.5 text-center"><div className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-slate-700 mx-auto"></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {['file', 'image'].includes(field.type) && (
            <div className="border border-dashed border-gray-300 dark:border-slate-700 rounded-xl p-4 text-center text-slate-400">
              <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: field.iconColor || '#0d9488' }} />
              <span>برای بارگذاری فایل کلیک کنید یا فایل را اینجا بکشید</span>
            </div>
          )}

          {field.type === 'signature' && (
            <div className="border border-gray-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 text-center text-slate-400 flex items-center justify-center gap-2">
              <PenTool className="w-4 h-4" style={{ color: field.iconColor || '#0d9488' }} />
              <span>محل امضای دیجیتال کاربر</span>
            </div>
          )}

          {['date', 'time', 'datetime'].includes(field.type) && (
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400">
              <span>{field.calendarType === 'gregorian' ? 'انتخاب تاریخ میلادی' : 'انتخاب تاریخ خورشیدی (شمسی)'}</span>
              <Calendar className="w-4 h-4" style={{ color: field.iconColor || '#94a3b8' }} />
            </div>
          )}

          {field.type === 'security' && field.securityType === 'honeypot' && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-dashed border-amber-300 dark:border-amber-900/50 rounded-xl text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                این فیلد به‌عمد نامرئی است — در فرم نهایی هیچ کادری برای کاربر واقعی نمایش داده نمی‌شود و فقط ربات‌های خودکار را شناسایی می‌کند.
              </span>
            </div>
          )}

          {field.type === 'security' && field.securityType !== 'honeypot' && (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono tracking-[0.25em] text-slate-400 shrink-0"
                style={{ height: field.securitySize === 'lg' ? 52 : field.securitySize === 'sm' ? 34 : 42, minWidth: 100 }}
              >
                {field.securityType === 'image_challenge' ? '۷ + ۴ = ؟' : 'A7K9P'}
              </div>
              <div className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-slate-400 shrink-0">
                <RotateCw className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 text-slate-400">
                {field.placeholder || 'کد را وارد کنید'}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // کارت یک بلوک ستونی — یک ردیف گرید با N ستون هم‌عرض
  const renderBlockGroup = (block: FormLayoutBlock, groupStartIndex: number) => {
    const fieldsMap = new Map(form.fields.map(f => [f.id, f] as const));
    let runningIndex = groupStartIndex;

    return (
      <div
        key={block.id}
        className="p-4 rounded-3xl bg-indigo-50/40 dark:bg-indigo-500/5 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 space-y-3"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-1.5">
            {block.columns.length === 1 && <Columns className="w-3.5 h-3.5" />}
            {block.columns.length === 2 && <Columns2 className="w-3.5 h-3.5" />}
            {block.columns.length === 3 && <Columns3 className="w-3.5 h-3.5" />}
            بلوک {block.columns.length}ستونه
          </span>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDeleteBlock(block.id);
            }}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-slate-400 hover:text-red-600"
            title="حذف بلوک (فیلدها مستقل باقی می‌مانند)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${block.columns.length}, minmax(0, 1fr))` }}>
          {block.columns.map(column => {
            const isDragOver = dragOverColumn?.blockId === block.id && dragOverColumn?.columnId === column.id;
            const columnFields = column.fieldIds
              .map(fid => fieldsMap.get(fid))
              .filter((f): f is FormField => Boolean(f));

            return (
              <div
                key={column.id}
                onDragOver={e => handleColumnDragOver(e, block.id, column.id)}
                onDrop={e => handleColumnDrop(e, block.id, column.id)}
                className={`space-y-3 min-h-[6rem] rounded-2xl p-1 transition-all ${
                  isDragOver ? 'bg-indigo-100/70 dark:bg-indigo-500/15 ring-2 ring-indigo-400' : ''
                }`}
              >
                {columnFields.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-indigo-200 dark:border-indigo-500/30 rounded-2xl flex items-center justify-center text-center text-[11px] text-indigo-400 dark:text-indigo-500 px-2">
                    برای افزودن فیلد، یک المان را اینجا رها کنید
                  </div>
                ) : (
                  columnFields.map(colField => {
                    const cardIndex = runningIndex;
                    runningIndex += 1;
                    return <React.Fragment key={colField.id}>{renderFieldCard(colField, cardIndex, true)}</React.Fragment>;
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden relative select-none rtl text-right h-full">
      {/* LEFT SIDEBAR: PALETTE LIST ONLY (NO STRUCTURE TAB AS REQUESTED) */}
      <div className="w-72 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full text-slate-800 dark:text-slate-200 select-none transition-colors shrink-0">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/50">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">مخزن المان‌های فرم</h3>
              <p className="text-[10px] text-slate-400">کلیک یا کشیدن و رها کردن (DnD)</p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
            {FIELD_PALETTE.reduce((acc, cat) => acc + cat.items.length, 0)} المان
          </span>
        </div>

        {/* Palette Search and Field Categories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={paletteSearch}
              onChange={e => setPaletteSearch(e.target.value)}
              placeholder="جستجوی فیلد و المان..."
              className="w-full pr-8 pl-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {FIELD_PALETTE.map((cat, cIdx) => {
            const filteredItems = cat.items.filter(
              it => it.label.includes(paletteSearch) || it.desc.includes(paletteSearch)
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={cIdx} className="space-y-1.5">
                <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 px-1 block">
                  {cat.category}
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {filteredItems.map(item => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={e => handlePaletteDragStart(e, item.type, item.label)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleAddField(item.type, item.label)}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-gray-200/80 dark:border-slate-800/80 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-500/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all text-right group cursor-grab active:cursor-grabbing shadow-2xs hover:shadow-xs"
                    >
                      <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 ${item.color}`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          {item.label}
                        </span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {item.desc}
                        </span>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 shrink-0 opacity-50 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Layout Blocks — چیدمان ستونی */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 px-1 block">
              چیدمان ستونی
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  { columns: 1 as const, label: 'بلوک تک‌ستونه', icon: Columns },
                  { columns: 2 as const, label: 'بلوک دو ستونه مساوی', icon: Columns2 },
                  { columns: 3 as const, label: 'بلوک سه ستونه مساوی', icon: Columns3 }
                ]
              ).map(preset => (
                <div
                  key={preset.columns}
                  draggable={!columnsBlockedByPagination}
                  onDragStart={e => !columnsBlockedByPagination && handleBlockPaletteDragStart(e, preset.columns)}
                  onDragEnd={handleDragEnd}
                  onClick={() => !columnsBlockedByPagination && handleAddBlock(preset.columns)}
                  title={columnsBlockedByPagination ? 'در نمایش «صفحه‌بندی» این گام، بلوک ستونی قابل افزودن نیست' : undefined}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-bold transition-all text-right group shadow-2xs ${
                    columnsBlockedByPagination
                      ? 'border-gray-200/60 dark:border-slate-800/60 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                      : 'border-gray-200/80 dark:border-slate-800/80 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 text-slate-700 dark:text-slate-300 cursor-grab active:cursor-grabbing hover:shadow-xs'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 text-indigo-600 dark:text-indigo-400">
                    <preset.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block truncate font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {preset.label}
                    </span>
                  </div>
                  <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 shrink-0 opacity-50 group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER VIEWPORT STAGE CANVAS */}
      <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950/80 overflow-hidden relative">
        {/* Step Tabs Sub-bar */}
        <div className="h-11 border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 flex items-center justify-between text-xs z-10 shrink-0">
          <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
            <span className="text-slate-500 font-bold text-[11px] ml-2 shrink-0">گام‌های فرم:</span>
            {form.steps.map(step => (
              <button
                key={step.id}
                onClick={() => setActiveStepId(step.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeStepId === step.id
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-slate-700'
                }`}
              >
                <span>{step.title}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 text-[10px]">
                  {form.fields.filter(f => f.stepId === step.id).length}
                </span>
                {form.steps.length > 1 && (
                  <span
                    role="button"
                    onClick={event => {
                      event.stopPropagation();
                      handleDeleteStep(step.id);
                    }}
                    className="p-0.5 rounded-md hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300"
                    title="حذف گام"
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                )}
              </button>
            ))}

            <button
              onClick={handleAddStep}
              className="p-1 px-2.5 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-500 dark:hover:text-slate-950 transition-colors cursor-pointer border border-teal-200 dark:border-teal-500/30 flex items-center gap-1 text-[11px] font-bold"
              title="افزودن گام جدید"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن گام</span>
            </button>

            {activeStep && (
              <div className="flex items-center gap-1.5 mr-2 shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="font-bold">نمایش:</span>
                <select
                  value={activeStep.presentation?.mode || 'all'}
                  onChange={event => updateActiveStepPresentation(event.target.value as 'all' | 'pagination', activeStep.presentation?.fieldsPerPage)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300"
                  title="نحوه نمایش سؤالات این گام"
                >
                  <option value="all">همه سؤالات</option>
                  <option value="pagination">صفحه‌بندی</option>
                </select>
                {activeStep.presentation?.mode === 'pagination' && (
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={activeStep.presentation.fieldsPerPage || 1}
                    onChange={event => updateActiveStepPresentation('pagination', Number(event.target.value))}
                    className="w-12 px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[10px] text-center text-slate-700 dark:text-slate-300"
                    title="تعداد سؤال در هر صفحه"
                  />
                )}
              </div>
            )}
          </div>

        </div>

        {/* Canvas Body with Dot-Grid Background */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] flex justify-center">
          <div className={`w-full ${getMaxWidthClass()} transition-all duration-300 space-y-4 pb-12`}>
            {/* Form Header Banner Preview Card */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-2 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-500/30">
                  {form.type === 'quiz' ? 'آزمون آنلاین' : form.type === 'survey' ? 'پرسشنامه و نظرسنجی' : 'فرم داده‌آمایی'}
                </span>
                <span className="text-xs text-slate-400">
                  نسخه {form.version} • {form.steps.find(s => s.id === activeStepId)?.title || 'گام فعال'}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {form.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {form.description}
              </p>
            </div>

            {/* Top Drop Zone (Before first question) */}
            <div
              onDragOver={e => handleDragOverZone(e, 0)}
              onDrop={e => handleDropOnZone(e, 0)}
              className={`transition-all duration-200 rounded-2xl flex items-center justify-center ${
                dropTargetIndex === 0
                  ? 'h-14 bg-teal-50 dark:bg-teal-950/40 border-2 border-dashed border-teal-500 text-teal-600 dark:text-teal-400 shadow-md font-bold text-xs gap-2'
                  : 'h-2 hover:h-5 opacity-0 hover:opacity-100 bg-teal-500/10 border border-dashed border-teal-300/60 dark:border-teal-700/60'
              }`}
            >
              {dropTargetIndex === 0 && (
                <>
                  <ArrowDown className="w-4 h-4 animate-bounce" />
                  <span>رها کردن برای افزودن / جابجایی فیلد در ابتدای فرم</span>
                </>
              )}
            </div>

            {/* Pagination gate notice */}
            {columnsBlockedByPagination && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <Columns className="w-4 h-4 shrink-0" />
                <span>چیدمان ستونی در نمایش «صفحه‌بندی» این گام اعمال نمی‌شود و فیلدها به‌صورت تک‌ستونه نمایش داده خواهند شد.</span>
              </div>
            )}

            {/* Questions List */}
            {renderGroups.length === 0 ? (
              <div
                onDragOver={e => handleDragOverZone(e, 0)}
                onDrop={e => handleDropOnZone(e, 0)}
                className={`text-center py-16 border-2 border-dashed rounded-3xl p-8 space-y-3 transition-all ${
                  dropTargetIndex === 0
                    ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40'
                    : 'border-gray-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-500/30">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                  هیچ سؤالی در این گام وجود ندارد
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  از ستون سمت راست یک المان را کلیک کنید یا آن را بکشید و در این کادر رها کنید (Drag & Drop).
                </p>
              </div>
            ) : (
              renderGroups.map(group => {
                return (
                  <React.Fragment key={group.kind === 'block' ? group.block.id : group.field.id}>
                    {group.kind === 'field'
                      ? renderFieldCard(group.field, group.startIndex)
                      : renderBlockGroup(group.block, group.startIndex)}

                    {/* Intermediate Drop Zone between groups */}
                    <div
                      onDragOver={e => handleDragOverZone(e, group.endIndex)}
                      onDrop={e => handleDropOnZone(e, group.endIndex)}
                      className={`transition-all duration-200 rounded-2xl flex items-center justify-center ${
                        dropTargetIndex === group.endIndex
                          ? 'h-14 bg-teal-50 dark:bg-teal-950/40 border-2 border-dashed border-teal-500 text-teal-600 dark:text-teal-400 shadow-md font-bold text-xs gap-2'
                          : 'h-2 hover:h-5 opacity-0 hover:opacity-100 bg-teal-500/10 border border-dashed border-teal-300/60 dark:border-teal-700/60'
                      }`}
                    >
                      {dropTargetIndex === group.endIndex && (
                        <>
                          <ArrowDown className="w-4 h-4 animate-bounce" />
                          <span>رها کردن برای افزودن / جابجایی فیلد در موقعیت {group.endIndex + 1}</span>
                        </>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            )}

            {/* Bottom Add Question Button */}
            <div className="pt-2">
              <button
                onClick={() => handleAddField('text', 'متن')}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 rounded-3xl text-xs font-black text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center justify-center gap-2 transition-all bg-white/50 dark:bg-slate-900/50 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن سوال جدید به این گام</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: INSPECTOR PROPERTY PANEL */}
      <FormInspectorPanel
        selectedField={selectedField}
        form={form}
        onUpdateField={handleUpdateField}
        onDeleteField={handleDeleteField}
        onDuplicateField={handleDuplicateField}
      />

      {isAddStepDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-5 text-right">
            <div className="flex items-center justify-between gap-3 mb-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">افزودن گام جدید</h3>
              <button
                onClick={() => setIsAddStepDialogOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                title="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              عنوان گام
            </label>
            <input
              autoFocus
              value={newStepTitle}
              onChange={event => setNewStepTitle(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') handleConfirmAddStep();
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              placeholder="مثال: اطلاعات شخصی"
            />
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setIsAddStepDialogOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                لغو
              </button>
              <button
                onClick={handleConfirmAddStep}
                disabled={!newStepTitle.trim()}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold"
              >
                افزودن گام
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
