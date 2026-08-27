import React, { useState } from 'react';
import {
  Settings2,
  Type,
  CheckSquare,
  Layout,
  Sparkles,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
  Copy,
  Trash2,
  Plus,
  HelpCircle,
  Hash,
  Database,
  ShieldCheck,
  Smartphone,
  Monitor,
  Printer,
  Calculator,
  UserCheck,
  Globe,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  Percent,
  MapPin,
  PenTool,
  Star,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  Palette,
  GripVertical,
  X
} from 'lucide-react';
import {
  FormDefinition,
  FormField,
  FieldType,
  FieldValidation,
  FieldDatabaseConfig,
  FieldApiConfig,
  FieldVisibilityConfig
} from './types';

// انتخاب‌گر رنگ آیکون فیلد — سوآچ + کد رنگ + دکمهٔ بازگشت به رنگ پیش‌فرض همان نوع فیلد
const IconColorPicker: React.FC<{
  label: string;
  value?: string;
  defaultColor: string;
  onChange: (color: string | undefined) => void;
}> = ({ label, value, defaultColor, onChange }) => {
  const effective = value || defaultColor;
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative w-8 h-8 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden shrink-0">
          <div className="w-full h-full" style={{ backgroundColor: effective }} />
          <input
            type="color"
            value={effective}
            onChange={e => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="انتخاب رنگ آیکون"
          />
        </div>
        <input
          type="text"
          dir="ltr"
          value={value || ''}
          placeholder={defaultColor}
          onChange={e => onChange(e.target.value || undefined)}
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-left"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="shrink-0 p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
            title="بازگشت به رنگ پیش‌فرض"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

interface FormInspectorPanelProps {
  selectedField: FormField | null;
  form: FormDefinition;
  onUpdateField: (updated: FormField) => void;
  onDeleteField: (fieldId: string) => void;
  onDuplicateField: (field: FormField) => void;
}

type TabType = 'general' | 'validation' | 'layout' | 'advanced' | 'options';

export default function FormInspectorPanel({
  selectedField,
  form,
  onUpdateField,
  onDeleteField,
  onDuplicateField
}: FormInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null);
  const [dragOverOptionIndex, setDragOverOptionIndex] = useState<number | null>(null);

  if (!selectedField) {
    return (
      <div className="w-84 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 space-y-3 font-sans rtl transition-colors select-none">
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 text-teal-600 dark:text-teal-400 border border-gray-200 dark:border-slate-700/50 shadow-xs">
          <Settings2 className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">هیچ فیلدی انتخاب نشده است</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          برای دسترسی به تنظیمات عمومی، تنظیمات اختصاصی، اعتبارسنجی، چیدمان و تنظیمات پیشرفته، روی یکی از فیلدهای فرم در بوم طراحی کلیک کنید.
        </p>
      </div>
    );
  }

  // Update single top-level property
  const updateProp = <K extends keyof FormField>(prop: K, value: FormField[K]) => {
    onUpdateField({ ...selectedField, [prop]: value });
  };

  // Update validation sub-object
  const updateValidation = <K extends keyof FieldValidation>(key: K, value: FieldValidation[K]) => {
    onUpdateField({
      ...selectedField,
      validation: { ...(selectedField.validation || {}), [key]: value }
    });
  };

  // Update database config
  const updateDbConfig = <K extends keyof FieldDatabaseConfig>(key: K, value: FieldDatabaseConfig[K]) => {
    onUpdateField({
      ...selectedField,
      databaseConfig: { ...(selectedField.databaseConfig || {}), [key]: value }
    });
  };

  // Update API config
  const updateApiConfig = <K extends keyof FieldApiConfig>(key: K, value: FieldApiConfig[K]) => {
    onUpdateField({
      ...selectedField,
      apiConfig: { ...(selectedField.apiConfig || {}), [key]: value }
    });
  };

  // Update visibility config
  const updateVisibility = <K extends keyof FieldVisibilityConfig>(key: K, value: FieldVisibilityConfig[K]) => {
    onUpdateField({
      ...selectedField,
      visibility: { ...(selectedField.visibility || { showOnDesktop: true, showOnMobile: true, showOnPrint: true }), [key]: value }
    });
  };

  // Options Handlers for select, radio, checkbox
  const handleAddOption = () => {
    const currentOptions = selectedField.options || [];
    const newIdx = currentOptions.length + 1;
    const newOpt = {
      id: `opt_${Date.now()}`,
      label: `گزینه ${newIdx}`,
      value: `val_${newIdx}`
    };
    updateProp('options', [...currentOptions, newOpt]);
  };

  const handleUpdateOption = (index: number, label: string, value?: string) => {
    const currentOptions = [...(selectedField.options || [])];
    currentOptions[index] = {
      ...currentOptions[index],
      label,
      value: value !== undefined ? value : label
    };
    updateProp('options', currentOptions);
  };

  const handleDeleteOption = (index: number) => {
    const currentOptions = [...(selectedField.options || [])];
    currentOptions.splice(index, 1);
    updateProp('options', currentOptions);
  };

  // جابجایی گزینه‌ها با کشیدن‌و‌رهاکردن (DnD)
  const handleReorderOption = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const currentOptions = [...(selectedField.options || [])];
    const [moved] = currentOptions.splice(fromIndex, 1);
    currentOptions.splice(toIndex, 0, moved);
    updateProp('options', currentOptions);
  };

  const handleOptionDragStart = (index: number) => {
    setDraggedOptionIndex(index);
  };

  const handleOptionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverOptionIndex !== index) setDragOverOptionIndex(index);
  };

  const handleOptionDrop = (index: number) => {
    if (draggedOptionIndex !== null) {
      handleReorderOption(draggedOptionIndex, index);
    }
    setDraggedOptionIndex(null);
    setDragOverOptionIndex(null);
  };

  const handleOptionDragEnd = () => {
    setDraggedOptionIndex(null);
    setDragOverOptionIndex(null);
  };

  // Matrix Row & Col Handlers
  const handleAddMatrixRow = () => {
    const rows = selectedField.matrixRows || [];
    const newRow = { id: `r_${Date.now()}`, label: `معیار ${rows.length + 1}` };
    updateProp('matrixRows', [...rows, newRow]);
  };

  const handleUpdateMatrixRow = (index: number, label: string) => {
    const rows = [...(selectedField.matrixRows || [])];
    rows[index] = { ...rows[index], label };
    updateProp('matrixRows', rows);
  };

  const handleDeleteMatrixRow = (index: number) => {
    const rows = [...(selectedField.matrixRows || [])];
    rows.splice(index, 1);
    updateProp('matrixRows', rows);
  };

  const handleAddMatrixCol = () => {
    const cols = selectedField.matrixCols || [];
    const newCol = { id: `c_${Date.now()}`, label: `سطح ${cols.length + 1}`, score: cols.length + 1 };
    updateProp('matrixCols', [...cols, newCol]);
  };

  const handleUpdateMatrixCol = (index: number, label: string, score?: number) => {
    const cols = [...(selectedField.matrixCols || [])];
    cols[index] = { ...cols[index], label, score: score !== undefined ? score : cols[index].score };
    updateProp('matrixCols', cols);
  };

  const handleDeleteMatrixCol = (index: number) => {
    const cols = [...(selectedField.matrixCols || [])];
    cols.splice(index, 1);
    updateProp('matrixCols', cols);
  };

  const isChoiceField = ['select', 'radio', 'checkbox'].includes(selectedField.type);
  const isMatrixField = selectedField.type === 'matrix';

  const typeNameFa: Record<string, string> = {
    text: 'متن کوتاه',
    textarea: 'متن بلند',
    number: 'عددی',
    email: 'پست الکترونیک',
    phone: 'شماره تماس',
    password: 'گذرواژه',
    date: 'تاریخ',
    time: 'زمان و ساعت',
    datetime: 'تاریخ و زمان',
    select: 'منوی کشویی',
    radio: 'تک انتخابی (رادیویی)',
    checkbox: 'چند انتخابی',
    file: 'آپلود فایل',
    image: 'تصویر',
    currency: 'مبلغ / ریالی',
    percentage: 'درصدی',
    address: 'آدرس کامل',
    location: 'موقعیت نقشه',
    matrix: 'ماتریس / جدول',
    signature: 'امضای دیجیتال',
    rating: 'امتیازدهی / ستاره',
    color: 'انتخاب رنگ',
    url: 'آدرس اینترنتی (URL)',
    slider: 'اسلایدر بازه‌ای',
    heading: 'عنوان و سربرگ',
    divider: 'خط جداکننده',
    security: 'فیلد امنیتی (ضدربات)'
  };

  return (
    <div className="w-84 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full text-slate-800 dark:text-slate-200 font-sans text-right rtl select-none overflow-hidden transition-colors">
      {/* Header Info */}
      <div className="p-3.5 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
        <div className="min-w-0 pr-1">
          <div className="text-[10px] text-teal-600 dark:text-teal-400 tracking-wider uppercase font-bold flex items-center gap-1.5">
            <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded text-[9px]">
              {typeNameFa[selectedField.type] || selectedField.type}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400 text-[9px] dir-ltr truncate">#{selectedField.id}</span>
          </div>
          <div className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5 max-w-[190px]">
            {selectedField.label || 'فیلد بدون عنوان'}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateField(selectedField)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="تکثیر فیلد"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteField(selectedField.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
            title="حذف فیلد"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs overflow-x-auto scrollbar-none">
        {[
          { id: 'general', label: 'عمومی', icon: Type },
          ...(isChoiceField || isMatrixField ? [{ id: 'options', label: 'گزینه‌ها', icon: Layers }] : []),
          { id: 'validation', label: 'اعتبار', icon: CheckSquare },
          { id: 'layout', label: 'ظاهر', icon: Layout },
          { id: 'advanced', label: 'پیشرفته', icon: Sparkles }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex-1 py-2.5 px-2 text-[11px] font-bold border-b-2 flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-teal-600 dark:border-teal-400 text-teal-600 dark:text-teal-400 font-black bg-teal-50/50 dark:bg-teal-500/10'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panel Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        
        {/* ======================================================== */}
        {/* 1. GENERAL SETTINGS TAB */}
        {/* ======================================================== */}
        {activeTab === 'general' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                عنوان فیلد (Label):
              </label>
              <input
                type="text"
                value={selectedField.label}
                onChange={e => updateProp('label', e.target.value)}
                placeholder="عنوان نمایشی به کاربر..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>نام سیستمی / کلید متغیر (Field Key):</span>
                <span className="text-[9px] text-slate-400 font-normal">جهت API و پایگاه داده</span>
              </label>
              <input
                type="text"
                value={selectedField.systemKey || selectedField.id}
                onChange={e => updateProp('systemKey', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="مثال: student_national_code"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs dir-ltr text-left text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                متن راهنمای درون کادر (Placeholder):
              </label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={e => updateProp('placeholder', e.target.value)}
                placeholder="راهنمای طوسی‌رنگ داخل کادر ورودی..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                توضیحات تکمیلی و راهنما (Help Text):
              </label>
              <textarea
                rows={2}
                value={selectedField.helpText || ''}
                onChange={e => updateProp('helpText', e.target.value)}
                placeholder="توضیح یا دستورالعمل نحوه تکمیل که زیر فیلد ظاهر می‌شود..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                مقدار پیش‌فرض (Default Value):
              </label>
              <input
                type="text"
                value={selectedField.defaultValue || ''}
                onChange={e => updateProp('defaultValue', e.target.value)}
                placeholder="مقداری که به طور خودکار در فیلد قرار می‌گیرد..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Field States toggles */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                وضعیت‌های عمومی فیلد:
              </label>
              
              <div className="grid grid-cols-1 gap-2">
                <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">غیرفعال (Disabled)</span>
                      <span className="text-[10px] text-slate-400">امکان ورود اطلاعات ندارد و مات می‌شود</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.disabled || false}
                    onChange={e => updateProp('disabled', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                  />
                </label>

                <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">فقط خواندنی (Read-only)</span>
                      <span className="text-[10px] text-slate-400">کاربر مقدار را می‌بیند اما نمی‌تواند ویرایش کند</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.readOnly || false}
                    onChange={e => updateProp('readOnly', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                  />
                </label>

                <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">مخفی بودن پیش‌فرض (Hidden)</span>
                      <span className="text-[10px] text-slate-400">تا زمان برقراری شرط یا لاجیک در فرم پنهان است</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.hidden || false}
                    onChange={e => updateProp('hidden', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Step and Section */}
            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  گام و مرحله فرم (Step):
                </label>
                <select
                  value={selectedField.stepId || form.steps[0]?.id}
                  onChange={e => updateProp('stepId', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  {form.steps.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سطح دسترسی نمایش (Access Roles):
                </label>
                <select
                  value={(selectedField.accessRoles && selectedField.accessRoles[0]) || 'all'}
                  onChange={e => updateProp('accessRoles', [e.target.value])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="all">عمومی (همه تکمیل‌کنندگان)</option>
                  <option value="authenticated">فقط کاربران لاگین‌شده</option>
                  <option value="faculty">فقط اعضای هیئت علمی و اساتید</option>
                  <option value="student">فقط دانشجویان</option>
                  <option value="admin">فقط مدیران سیستم</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. TYPE-SPECIFIC SETTINGS TAB */}
        {/* ======================================================== */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            {/* Short text & Textarea */}
            {['text', 'textarea'].includes(selectedField.type) && (
              <div className="space-y-3">
                <div className="p-3 bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 rounded-2xl">
                  <span className="font-bold text-xs text-teal-800 dark:text-teal-300 block mb-1">تنظیمات نوع کاراکتر مجاز</span>
                  <select
                    value={selectedField.charTypeAllowed || 'any'}
                    onChange={e => updateProp('charTypeAllowed', e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-xs"
                  >
                    <option value="any">همه کاراکترها (آزاد)</option>
                    <option value="persian_letters">فقط حروف فارسی و فاصله</option>
                    <option value="english_letters">فقط حروف لاتین (انگلیسی)</option>
                    <option value="numeric">فقط ارقام و عدد</option>
                    <option value="alphanumeric">حروف و اعداد (بدون نماد خاص)</option>
                  </select>
                </div>

                {selectedField.type === 'textarea' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تعداد سطر پیش‌فرض کادر (Rows):
                      </label>
                      <input
                        type="number"
                        min={2}
                        max={20}
                        value={selectedField.rowsCount || 4}
                        onChange={e => updateProp('rowsCount', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                      />
                    </div>
                    <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">امکان تغییر اندازه کادر توسط کاربر</span>
                      <input
                        type="checkbox"
                        checked={selectedField.allowTextareaResize !== false}
                        onChange={e => updateProp('allowTextareaResize', e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Number, Slider, Currency, Percentage */}
            {['number', 'slider', 'currency', 'percentage'].includes(selectedField.type) && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      تعداد ارقام اعشار:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      value={selectedField.decimalPlaces !== undefined ? selectedField.decimalPlaces : 0}
                      onChange={e => updateProp('decimalPlaces', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      پسوند واحد:
                    </label>
                    <input
                      type="text"
                      value={selectedField.numberUnit || ''}
                      onChange={e => updateProp('numberUnit', e.target.value)}
                      placeholder="مثال: کیلوگرم، نفر، ساعت"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {selectedField.type === 'currency' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      واحد پول:
                    </label>
                    <select
                      value={selectedField.currencyUnit || 'تومان'}
                      onChange={e => updateProp('currencyUnit', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                    >
                      <option value="تومان">تومان</option>
                      <option value="ریال">ریال</option>
                      <option value="دلار">دلار ($)</option>
                      <option value="یورو">یورو (€)</option>
                    </select>
                  </div>
                )}

                <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">جداکننده ۳ رقمی هزارگان</span>
                    <span className="text-[10px] text-slate-400">نمایش مبالغ و اعداد بصورت ۱,۰۰۰,۰۰۰</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.useThousandSeparator !== false}
                    onChange={e => updateProp('useThousandSeparator', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>
              </div>
            )}

            {/* Email Field Settings */}
            {selectedField.type === 'email' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl space-y-2">
                  <span className="font-bold text-xs text-blue-800 dark:text-blue-300 block">محدودسازی دامنه‌های مجاز</span>
                  <input
                    type="text"
                    value={(selectedField.validation?.allowedDomains || []).join(', ')}
                    onChange={e => updateValidation('allowedDomains', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="مثال: ut.ac.ir, university.ir"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl text-xs dir-ltr text-left"
                  />
                  <span className="text-[10px] text-slate-500 block">دامنه‌ها را با کاما انگلیسی (,) جدا کنید</span>
                </div>

                <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">رد ایمیل‌های عمومی رایگان</span>
                    <span className="text-[10px] text-slate-400">عدم پذیرش Gmail، Yahoo، Outlook</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.validation?.blockFreeEmailProviders || false}
                    onChange={e => updateValidation('blockFreeEmailProviders', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>
              </div>
            )}

            {/* Phone Field Settings */}
            {selectedField.type === 'phone' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    قالب و فرمت شماره:
                  </label>
                  <select
                    value={selectedField.validation?.phoneFormat || 'iran_mobile'}
                    onChange={e => updateValidation('phoneFormat', e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="iran_mobile">موبایل ایران (شروع با ۰۹ - ۱۱ رقمی)</option>
                    <option value="iran_landline">تلفن ثابت با پیش‌شماره شهر</option>
                    <option value="international">بین‌المللی با کد کشور (+98...)</option>
                    <option value="custom">آزاد و بدون اعتبارسنجی خودکار</option>
                  </select>
                </div>
              </div>
            )}

            {/* Password Field Settings */}
            {selectedField.type === 'password' && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-2">
                  <span className="font-bold text-xs text-amber-800 dark:text-amber-300 block">قوانین پیچیدگی گذرواژه</span>
                  
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <span>حداقل یک حرف بزرگ انگلیسی (A-Z)</span>
                      <input
                        type="checkbox"
                        checked={selectedField.validation?.passwordRules?.requireUppercase || false}
                        onChange={e => updateValidation('passwordRules', {
                          ...(selectedField.validation?.passwordRules || { minLength: 8 }),
                          requireUppercase: e.target.checked
                        })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <span>حداقل یک عدد (0-9)</span>
                      <input
                        type="checkbox"
                        checked={selectedField.validation?.passwordRules?.requireNumbers || false}
                        onChange={e => updateValidation('passwordRules', {
                          ...(selectedField.validation?.passwordRules || { minLength: 8 }),
                          requireNumbers: e.target.checked
                        })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <span>حداقل یک کاراکتر ویژه (!@#$%...)</span>
                      <input
                        type="checkbox"
                        checked={selectedField.validation?.passwordRules?.requireSpecialChars || false}
                        onChange={e => updateValidation('passwordRules', {
                          ...(selectedField.validation?.passwordRules || { minLength: 8 }),
                          requireSpecialChars: e.target.checked
                        })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                      <span>الزام فیلد تکرار رمز عبور (Confirm)</span>
                      <input
                        type="checkbox"
                        checked={selectedField.validation?.passwordRules?.requireConfirmPassword || false}
                        onChange={e => updateValidation('passwordRules', {
                          ...(selectedField.validation?.passwordRules || { minLength: 8 }),
                          requireConfirmPassword: e.target.checked
                        })}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Date & Time Field Settings */}
            {['date', 'time', 'datetime'].includes(selectedField.type) && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع تقویم:
                  </label>
                  <select
                    value={selectedField.calendarType || 'jalali'}
                    onChange={e => updateProp('calendarType', e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="jalali">تقویم شمسی (خورشیدی هجری)</option>
                    <option value="gregorian">تقویم میلادی (Gregorian)</option>
                  </select>
                </div>

                <IconColorPicker
                  label="رنگ آیکون تقویم"
                  value={selectedField.iconColor}
                  defaultColor="#94a3b8"
                  onChange={c => updateProp('iconColor', c)}
                />

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مقدار تاریخ پیش‌فرض:
                  </label>
                  <select
                    value={selectedField.defaultDateOption || 'none'}
                    onChange={e => updateProp('defaultDateOption', e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="none">خالی</option>
                    <option value="today">تاریخ روز جاری (امروز)</option>
                    <option value="custom">تاریخ ثابت سفارشی</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-slate-800">
                  <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عدم اجازه انتخاب تاریخ‌های گذشته</span>
                    <input
                      type="checkbox"
                      checked={selectedField.validation?.disallowPastDates || false}
                      onChange={e => updateValidation('disallowPastDates', e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                  </label>

                  <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">عدم اجازه انتخاب تاریخ‌های آینده</span>
                    <input
                      type="checkbox"
                      checked={selectedField.validation?.disallowFutureDates || false}
                      onChange={e => updateValidation('disallowFutureDates', e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Dropdown / Radio / Checkbox specific settings */}
            {isChoiceField && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نحوه چیدمان گزینه‌ها:
                  </label>
                  <select
                    value={selectedField.choiceLayout || 'vertical'}
                    onChange={e => updateProp('choiceLayout', e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="vertical">عمودی (زیر هم)</option>
                    <option value="horizontal">افقی (کنار هم)</option>
                    <option value="grid_2_col">شبکه‌ای ۲ ستونه</option>
                  </select>
                </div>

                {selectedField.type === 'select' && (
                  <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">قابلیت جستجو در گزینه‌ها</span>
                      <span className="text-[10px] text-slate-400">نمایش کادر سرچ در منوی بازشونده (Combobox)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedField.allowSearchOptions || false}
                      onChange={e => updateProp('allowSearchOptions', e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                  </label>
                )}

                <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">امکان افزودن گزینه سفارشی (سایر)</span>
                    <span className="text-[10px] text-slate-400">کاربر می‌تواند گزینه دلخواه خود را تایپ کند</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.allowCreateCustomOption || false}
                    onChange={e => updateProp('allowCreateCustomOption', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>
              </div>
            )}

            {/* File & Image Upload Settings */}
            {['file', 'image'].includes(selectedField.type) && (
              <div className="space-y-3">
                <IconColorPicker
                  label="رنگ آیکون آپلود"
                  value={selectedField.iconColor}
                  defaultColor="#0d9488"
                  onChange={c => updateProp('iconColor', c)}
                />

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    پسوندهای مجاز برای آپلود:
                  </label>
                  <input
                    type="text"
                    value={(selectedField.validation?.allowedExtensions || []).join(', ')}
                    onChange={e => updateValidation('allowedExtensions', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder={selectedField.type === 'image' ? '.jpg, .png, .webp' : '.pdf, .docx, .zip, .xlsx'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs dir-ltr text-left"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      حداکثر حجم (MB):
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={selectedField.validation?.maxFileSizeMb || 10}
                      onChange={e => updateValidation('maxFileSizeMb', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      حداکثر تعداد فایل:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={selectedField.validation?.maxFilesCount || 1}
                      onChange={e => updateValidation('maxFilesCount', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {selectedField.type === 'image' && (
                  <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">نمایش پیش‌نمایش بندانگشتی تصویر</span>
                    <input
                      type="checkbox"
                      checked={selectedField.showImagePreview !== false}
                      onChange={e => updateProp('showImagePreview', e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Rating / Scale Settings */}
            {selectedField.type === 'rating' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع آیکون امتیاز:
                  </label>
                  <select
                    value={selectedField.ratingIconType || 'star'}
                    onChange={e => updateProp('ratingIconType', e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="star">ستاره (Stars ⭐)</option>
                    <option value="heart">قلب (Hearts ❤️)</option>
                    <option value="emoji">اموجی رضایت (🙂/😐/🙁)</option>
                    <option value="number">عددی (دکمه‌های ۱ تا ۵)</option>
                  </select>
                </div>

                <IconColorPicker
                  label="رنگ آیکون امتیاز"
                  value={selectedField.iconColor}
                  defaultColor="#fbbf24"
                  onChange={c => updateProp('iconColor', c)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      برچسب حداقل (۱):
                    </label>
                    <input
                      type="text"
                      value={selectedField.startRatingLabel || ''}
                      onChange={e => updateProp('startRatingLabel', e.target.value)}
                      placeholder="مثال: ضعیف"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      برچسب حداکثر (۵):
                    </label>
                    <input
                      type="text"
                      value={selectedField.endRatingLabel || ''}
                      onChange={e => updateProp('endRatingLabel', e.target.value)}
                      placeholder="مثال: عالی"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Digital Signature Settings */}
            {selectedField.type === 'signature' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    روش‌های مجاز امضا:
                  </label>
                  <select
                    value={selectedField.signaturePadType || 'draw'}
                    onChange={e => updateProp('signaturePadType', e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="draw">ترسیم دستی با قلم یا ماوس</option>
                    <option value="type">تایپ نام با فونت نستعلیق/رسمی</option>
                    <option value="upload">آپلود تصویر اسکن‌شده امضا</option>
                  </select>
                </div>
                <IconColorPicker
                  label="رنگ آیکون امضا"
                  value={selectedField.iconColor}
                  defaultColor="#0d9488"
                  onChange={c => updateProp('iconColor', c)}
                />
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ارتفاع کادر امضا (پیکسل):
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={400}
                    value={selectedField.signatureCanvasHeight || 160}
                    onChange={e => updateProp('signatureCanvasHeight', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* Security / Anti-bot Field Settings */}
            {selectedField.type === 'security' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نوع ظاهر و روش امنیتی:
                  </label>
                  <select
                    value={selectedField.securityType || 'image_captcha'}
                    onChange={e => updateProp('securityType', e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  >
                    <option value="image_captcha">کد امنیتی تصویری (CAPTCHA حروف و عدد)</option>
                    <option value="numeric_code">کد چندرقمی تصویری (فقط عدد)</option>
                    <option value="image_challenge">چالش تصویری (مسئله ریاضی ساده)</option>
                    <option value="honeypot">تله ضدربات نامرئی (Honeypot)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {selectedField.securityType === 'honeypot'
                      ? 'این نوع هیچ کادری برای کاربر واقعی نمایش نمی‌دهد و صرفاً ربات‌های خودکاری که همه فیلدها را پر می‌کنند شناسایی می‌کند.'
                      : 'کد به‌صورت تصویر (غیرقابل خواندن برای ربات) در سرور تولید و اعتبارسنجی نهایی نیز سمت سرور انجام می‌شود.'}
                  </p>
                </div>

                {selectedField.securityType !== 'honeypot' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          سبک نمایش:
                        </label>
                        <select
                          value={selectedField.securityStyle || 'boxed'}
                          onChange={e => updateProp('securityStyle', e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                        >
                          <option value="boxed">قاب‌دار (کارتی)</option>
                          <option value="card">کارت با سایه</option>
                          <option value="minimal">ساده و کم‌حجم</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          اندازه نمایش:
                        </label>
                        <select
                          value={selectedField.securitySize || 'md'}
                          onChange={e => updateProp('securitySize', e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                        >
                          <option value="sm">کوچک</option>
                          <option value="md">متوسط</option>
                          <option value="lg">بزرگ</option>
                        </select>
                      </div>
                    </div>

                    <IconColorPicker
                      label="رنگ اصلی قاب و دکمه"
                      value={selectedField.securityColor}
                      defaultColor="#0d9488"
                      onChange={c => updateProp('securityColor', c)}
                    />

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        متن دکمه دریافت/تازه‌سازی کد:
                      </label>
                      <input
                        type="text"
                        value={selectedField.securityButtonText || ''}
                        onChange={e => updateProp('securityButtonText', e.target.value)}
                        placeholder="دریافت کد جدید"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          تعداد کاراکتر کد:
                        </label>
                        <input
                          type="number"
                          min={3}
                          max={8}
                          value={selectedField.securityCodeLength || 5}
                          onChange={e => updateProp('securityCodeLength', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          زمان انقضا (ثانیه):
                        </label>
                        <input
                          type="number"
                          min={30}
                          max={600}
                          value={selectedField.securityExpirySeconds || 120}
                          onChange={e => updateProp('securityExpirySeconds', Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        حداکثر تعداد تلاش مجاز:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={selectedField.securityMaxAttempts || 4}
                        onChange={e => updateProp('securityMaxAttempts', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                      />
                    </div>

                    <label className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">حساس به بزرگی/کوچکی حروف</span>
                        <span className="text-[10px] text-slate-400">در صورت غیرفعال بودن، A و a یکسان پذیرفته می‌شوند</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedField.securityCaseSensitive || false}
                        onChange={e => updateProp('securityCaseSensitive', e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            {/* Address & Location Map Settings */}
            {['address', 'location'].includes(selectedField.type) && (
              <div className="space-y-2">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">اجزای فعال آدرس:</span>
                <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 text-xs">
                  <span>انتخاب استان و شهر</span>
                  <input
                    type="checkbox"
                    checked={selectedField.includeProvince !== false}
                    onChange={e => updateProp('includeProvince', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 text-xs">
                  <span>کد پستی ده‌رقمی</span>
                  <input
                    type="checkbox"
                    checked={selectedField.includePostalCode !== false}
                    onChange={e => updateProp('includePostalCode', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 text-xs">
                  <span>انتخاب مختصات از روی نقشه ماهواره‌ای</span>
                  <input
                    type="checkbox"
                    checked={selectedField.includeGeoCoordinates !== false}
                    onChange={e => updateProp('includeGeoCoordinates', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. OPTIONS & MATRIX TAB */}
        {/* ======================================================== */}
        {activeTab === 'options' && (
          <div className="space-y-4">
            {/* Choices list */}
            {isChoiceField && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
                    فهرست گزینه‌های قابل انتخاب:
                  </span>
                  <button
                    onClick={handleAddOption}
                    className="px-2.5 py-1 bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-teal-600 hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>افزودن گزینه</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {(selectedField.options || []).map((opt, idx) => (
                    <div
                      key={opt.id || idx}
                      draggable
                      onDragStart={() => handleOptionDragStart(idx)}
                      onDragOver={e => handleOptionDragOver(e, idx)}
                      onDrop={() => handleOptionDrop(idx)}
                      onDragEnd={handleOptionDragEnd}
                      className={`flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border transition-all ${
                        draggedOptionIndex === idx
                          ? 'opacity-40 border-dashed border-teal-400'
                          : dragOverOptionIndex === idx && draggedOptionIndex !== null && draggedOptionIndex !== idx
                          ? 'border-teal-500 ring-2 ring-teal-500/20'
                          : 'border-gray-200 dark:border-slate-800'
                      }`}
                    >
                      <span
                        className="p-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0"
                        title="برای جابجایی بکشید"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] text-slate-400 w-4 text-center">{idx + 1}</span>
                      <input
                        type="text"
                        value={opt.label}
                        onChange={e => handleUpdateOption(idx, e.target.value)}
                        placeholder={`گزینه ${idx + 1}`}
                        className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                      />
                      <button
                        onClick={() => handleDeleteOption(idx)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="حذف گزینه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matrix rows & cols */}
            {isMatrixField && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">سطرهای ماتریس (معیارها):</span>
                    <button
                      onClick={handleAddMatrixRow}
                      className="px-2 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-teal-100"
                    >
                      + سطر جدید
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(selectedField.matrixRows || []).map((r, i) => (
                      <div key={r.id || i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-gray-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={r.label}
                          onChange={e => handleUpdateMatrixRow(i, e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded"
                        />
                        <button onClick={() => handleDeleteMatrixRow(i)} className="text-slate-400 hover:text-rose-500 p-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">ستون‌های ماتریس (طیف پاسخ):</span>
                    <button
                      onClick={handleAddMatrixCol}
                      className="px-2 py-1 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-teal-100"
                    >
                      + ستون جدید
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(selectedField.matrixCols || []).map((c, i) => (
                      <div key={c.id || i} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-gray-200 dark:border-slate-800">
                        <input
                          type="text"
                          value={c.label}
                          onChange={e => handleUpdateMatrixCol(i, e.target.value)}
                          className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded"
                        />
                        <button onClick={() => handleDeleteMatrixCol(i)} className="text-slate-400 hover:text-rose-500 p-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. VALIDATION & RULES TAB */}
        {/* ======================================================== */}
        {activeTab === 'validation' && (
          <div className="space-y-3.5">
            {/* Required Switch */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  تکمیل الزامی (Required)
                </span>
                <span className="text-[10px] text-slate-500">
                  ثبت فرم بدون پاسخ به این فیلد امکان‌پذیر نخواهد بود
                </span>
              </div>
              <input
                type="checkbox"
                checked={selectedField.validation?.required || false}
                onChange={e => updateValidation('required', e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
            </div>

            {/* Min / Max Length for text */}
            {['text', 'textarea', 'password'].includes(selectedField.type) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل تعداد کاراکتر:
                  </label>
                  <input
                    type="number"
                    value={selectedField.validation?.minLength || ''}
                    onChange={e => updateValidation('minLength', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حداکثر تعداد کاراکتر:
                  </label>
                  <input
                    type="number"
                    value={selectedField.validation?.maxLength || ''}
                    onChange={e => updateValidation('maxLength', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* Min / Max for numbers / currency */}
            {['number', 'slider', 'currency', 'percentage'].includes(selectedField.type) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل مقدار عددی:
                  </label>
                  <input
                    type="number"
                    value={selectedField.validation?.min !== undefined ? selectedField.validation?.min : ''}
                    onChange={e => updateValidation('min', e.target.value !== '' ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حداکثر مقدار عددی:
                  </label>
                  <input
                    type="number"
                    value={selectedField.validation?.max !== undefined ? selectedField.validation?.max : ''}
                    onChange={e => updateValidation('max', e.target.value !== '' ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* Min / Max selection for checkbox */}
            {selectedField.type === 'checkbox' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حداقل گزینه‌های انتخابی:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={selectedField.validation?.minSelected || ''}
                    onChange={e => updateValidation('minSelected', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حداکثر گزینه‌های انتخابی:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={selectedField.validation?.maxSelected || ''}
                    onChange={e => updateValidation('maxSelected', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* Regex Pattern */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>الگوی اعتبارسنجی (Regex Pattern):</span>
                <span className="text-[9px] text-slate-400">Regular Expression</span>
              </label>
              <input
                type="text"
                value={selectedField.validation?.regexPattern || ''}
                onChange={e => updateValidation('regexPattern', e.target.value)}
                placeholder="مثال: ^[0-9]{10}$"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs dir-ltr text-left"
              />
            </div>

            {/* Custom Error Message */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                پیام خطای سفارشی:
              </label>
              <input
                type="text"
                value={selectedField.validation?.customErrorMessage || ''}
                onChange={e => updateValidation('customErrorMessage', e.target.value)}
                placeholder="متنی که در صورت عدم رعایت شرایط نمایش داده می‌شود..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. LAYOUT & APPEARANCE TAB */}
        {/* ======================================================== */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                عرض فیلد در فرم (Grid Span):
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { val: '100%', label: '۱۰۰٪ تمام‌عرض' },
                  { val: '50%', label: '۵۰٪ نیم‌صفحه' },
                  { val: '33%', label: '۳۳٪ یک‌سوم' }
                ].map(w => (
                  <button
                    key={w.val}
                    type="button"
                    onClick={() => updateProp('columnWidth', w.val as any)}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      (selectedField.columnWidth || '100%') === w.val
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility per Device */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl space-y-2">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">نمایش بر اساس نوع دستگاه و چاپ:</span>
              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    <span>نمایش در دسکتاپ و لپ‌تاپ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.visibility?.showOnDesktop !== false}
                    onChange={e => updateVisibility('showOnDesktop', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    <span>نمایش در موبایل و تبلت</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.visibility?.showOnMobile !== false}
                    onChange={e => updateVisibility('showOnMobile', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span>نمایش در خروجی چاپی / PDF فرم</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.visibility?.showOnPrint !== false}
                    onChange={e => updateVisibility('showOnPrint', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                کلاس‌های CSS سفارشی (Tailwind / Custom):
              </label>
              <input
                type="text"
                value={selectedField.className || ''}
                onChange={e => updateProp('className', e.target.value)}
                placeholder="مثال: border-teal-500 bg-teal-50/20 font-bold"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs dir-ltr text-left"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. ADVANCED & DATABASE SETTINGS TAB */}
        {/* ======================================================== */}
        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Auto-calculation / Formula */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
                  <Calculator className="w-3.5 h-3.5 text-teal-600" />
                  <span>محاسبه خودکار (فرمول ریاضی)</span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedField.autoCalculationEnabled || false}
                  onChange={e => updateProp('autoCalculationEnabled', e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                />
              </div>

              {selectedField.autoCalculationEnabled && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    فرمول محاسبه (بر اساس کلید سایر فیلدها):
                  </label>
                  <input
                    type="text"
                    value={selectedField.formula || ''}
                    onChange={e => updateProp('formula', e.target.value)}
                    placeholder="مثال: (field_1 * 0.20) + (field_2 * 0.80)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs dir-ltr text-left"
                  />
                </div>
              )}
            </div>

            {/* Auto-fill / Prefill from User Profile */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>پر شدن خودکار (Auto-fill Prefill)</span>
              </div>
              <select
                value={selectedField.prefillSource || 'none'}
                onChange={e => updateProp('prefillSource', e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs"
              >
                <option value="none">بدون پر شدن خودکار</option>
                <option value="user_fullname">نام و نام خانوادگی کاربر وارد شده</option>
                <option value="user_email">پست الکترونیک کاربر</option>
                <option value="user_phone">شماره همراه کاربر</option>
                <option value="user_national_id">کد ملی کاربر</option>
                <option value="user_role">نقش کاربری در سیستم</option>
                <option value="query_param">دریافت از پارامتر URL (Query Param)</option>
              </select>

              {selectedField.prefillSource === 'query_param' && (
                <input
                  type="text"
                  value={selectedField.prefillQueryParam || ''}
                  onChange={e => updateProp('prefillQueryParam', e.target.value)}
                  placeholder="نام پارامتر URL، مثال: ref_code"
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs dir-ltr text-left"
                />
              )}
            </div>

            {/* External API Data Source */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
                  <Globe className="w-3.5 h-3.5 text-purple-600" />
                  <span>منبع داده پویا از وب‌سرویس (REST API)</span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedField.apiConfig?.enabled || false}
                  onChange={e => updateApiConfig('enabled', e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                />
              </div>

              {selectedField.apiConfig?.enabled && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                  <input
                    type="text"
                    value={selectedField.apiConfig?.endpointUrl || ''}
                    onChange={e => updateApiConfig('endpointUrl', e.target.value)}
                    placeholder="https://api.domain.com/v1/options"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs dir-ltr text-left"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={selectedField.apiConfig?.labelKey || 'title'}
                      onChange={e => updateApiConfig('labelKey', e.target.value)}
                      placeholder="کلید عنوان: title"
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-[11px] dir-ltr"
                    />
                    <input
                      type="text"
                      value={selectedField.apiConfig?.valueKey || 'id'}
                      onChange={e => updateApiConfig('valueKey', e.target.value)}
                      placeholder="کلید مقدار: id"
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-[11px] dir-ltr"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Database & Security Hardening */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold text-xs">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>پیکربندی پایگاه داده و امنیت داده</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  نام ستون جدول دیتابیس (DB Column Name):
                </label>
                <input
                  type="text"
                  value={selectedField.databaseConfig?.dbColumnName || selectedField.systemKey || selectedField.id}
                  onChange={e => updateDbConfig('dbColumnName', e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs dir-ltr text-left"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">
                    نوع فیلد در SQL:
                  </label>
                  <select
                    value={selectedField.databaseConfig?.dbDataType || 'VARCHAR'}
                    onChange={e => updateDbConfig('dbDataType', e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-[11px] dir-ltr"
                  >
                    <option value="VARCHAR">VARCHAR</option>
                    <option value="INTEGER">INTEGER</option>
                    <option value="DECIMAL">DECIMAL</option>
                    <option value="TEXT">TEXT</option>
                    <option value="JSON">JSON</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="TIMESTAMP">TIMESTAMP</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={selectedField.databaseConfig?.isIndexed || false}
                      onChange={e => updateDbConfig('isIndexed', e.target.checked)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="text-[11px] font-bold">ایندکس در DB</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>ذخیره‌سازی رمزنگاری‌شده (Encrypted)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.databaseConfig?.isEncrypted || false}
                    onChange={e => updateDbConfig('isEncrypted', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>ماسک‌سازی مقدار در گزارش‌ها (Masking)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.databaseConfig?.maskInUi || false}
                    onChange={e => updateDbConfig('maskInUi', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>ثبت لاگ تغییرات و حسابرسی (Audit Trail)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedField.auditTrailEnabled !== false}
                    onChange={e => updateProp('auditTrailEnabled', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
