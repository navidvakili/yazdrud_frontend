// ============================================================
// CountyProjectsManagement — مدیریت نقشه پروژه‌های عمرانی
//
// امکان ویرایش آمار ۱۲ شهرستان استان در یک صفحه با ذخیره‌سازی
// تکی یا گروهی.
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Map, Save, Search, CheckCircle2, AlertCircle, Loader2,
  Building2, Route, FileText, Percent, ToggleLeft, ToggleRight,
  ExternalLink, Eye, EyeOff,
} from 'lucide-react';
import type { CountyProject } from '@/src/shared-types';
import ToastNotification from '@/src/shared-components/ToastNotification';
import {
  fetchCountyProjects,
  updateCountyProject,
  updateCountyProjectsBatch,
} from './api';

interface CountyProjectsManagementProps {
  user?: any;
  activeTabId?: string;
  moduleId?: string;
}

export default function CountyProjectsManagement(_props: CountyProjectsManagementProps) {
  // ===== Data State =====
  const [counties, setCounties] = useState<CountyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | 'batch' | null>(null);

  // ===== Search =====
  const [searchQuery, setSearchQuery] = useState('');

  // ===== Toast =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Fetch Data =====
  const loadCounties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCountyProjects({ per_page: 50 });
      setCounties(data.data);
    } catch (err: any) {
      console.error('Error loading county projects:', err);
      showToast('خطا در دریافت اطلاعات شهرستان‌ها', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCounties();
  }, [loadCounties]);

  // ===== Filtered List =====
  const filteredCounties = counties.filter((c) =>
    !searchQuery || c.county_name.includes(searchQuery) || c.county_id.includes(searchQuery)
  );

  // ===== Field Update (local state) =====
  const updateLocalField = (id: number, field: keyof CountyProject, value: any) => {
    setCounties((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // ===== Save Single County =====
  const handleSaveSingle = async (county: CountyProject) => {
    setSaving(county.id);
    try {
      const result = await updateCountyProject(county.id, county);
      setCounties((prev) =>
        prev.map((c) => (c.id === county.id ? { ...c, ...result.data } : c))
      );
      showToast(`اطلاعات شهرستان ${county.county_name} با موفقیت ذخیره شد`);
    } catch (err: any) {
      showToast(err?.message || 'خطا در ذخیره اطلاعات', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ===== Save All =====
  const handleSaveAll = async () => {
    setSaving('batch');
    try {
      const batch = counties.map((c) => ({
        id: c.id,
        road_projects_count: c.road_projects_count,
        housing_units_count: c.housing_units_count,
        urban_plans_count: c.urban_plans_count,
        road_progress: c.road_progress,
        housing_progress: c.housing_progress,
        urban_progress: c.urban_progress,
        has_active_road_project: c.has_active_road_project,
        has_housing_workshop: c.has_housing_workshop,
        description: c.description,
        is_active: c.is_active,
      }));
      await updateCountyProjectsBatch(batch);
      showToast('تمام اطلاعات شهرستان‌ها با موفقیت ذخیره شد');
    } catch (err: any) {
      showToast(err?.message || 'خطا در ذخیره اطلاعات', 'error');
    } finally {
      setSaving(null);
    }
  };

  // ===== Render =====
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-sm font-bold">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      {/* Toast */}
      <ToastNotification toast={toast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
            <Map className="w-7 h-7 text-teal-500" />
            <span>مدیریت نقشه پروژه‌های عمرانی</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            ویرایش آمار و اطلاعات ۱۲ شهرستان استان یزد برای نمایش در نقشه تعاملی سایت
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAll}
            disabled={saving === 'batch'}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-600/50 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            {saving === 'batch' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>ذخیره همه</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجوی شهرستان..."
          className="w-full pr-10 pl-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
        />
      </div>

      {/* Counties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredCounties.map((county) => (
            <motion.div
              key={county.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white dark:bg-gray-800/80 rounded-2xl border shadow-sm overflow-hidden transition-all ${
                county.is_active
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-red-200 dark:border-red-900/50 opacity-75'
              }`}
            >
              {/* County Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-8 rounded-full bg-teal-500"></span>
                  <h3 className="font-bold text-gray-800 dark:text-white">
                    شهرستان {county.county_name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {/* Active toggle */}
                  <button
                    onClick={() =>
                      updateLocalField(county.id, 'is_active', !county.is_active)
                    }
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
                      county.is_active
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                    title={county.is_active ? 'فعال' : 'غیرفعال'}
                  >
                    {county.is_active ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                    <span>{county.is_active ? 'فعال' : 'غیرفعال'}</span>
                  </button>
                  {/* Save single */}
                  <button
                    onClick={() => handleSaveSingle(county)}
                    disabled={saving === county.id}
                    className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-all disabled:opacity-50 cursor-pointer"
                    title="ذخیره"
                  >
                    {saving === county.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="p-4 space-y-3">
                {/* Row 1: Counts */}
                <div className="grid grid-cols-3 gap-2">
                  <FieldInput
                    icon={<Route className="w-3.5 h-3.5 text-amber-600" />}
                    label="طرح راه‌سازی"
                    value={county.road_projects_count}
                    onChange={(v) => updateLocalField(county.id, 'road_projects_count', v)}
                  />
                  <FieldInput
                    icon={<Building2 className="w-3.5 h-3.5 text-teal-600" />}
                    label="واحد مسکن"
                    value={county.housing_units_count}
                    onChange={(v) => updateLocalField(county.id, 'housing_units_count', v)}
                  />
                  <FieldInput
                    icon={<FileText className="w-3.5 h-3.5 text-indigo-600" />}
                    label="طرح تفصیلی"
                    value={county.urban_plans_count}
                    onChange={(v) => updateLocalField(county.id, 'urban_plans_count', v)}
                  />
                </div>

                {/* Row 2: Progress Percentages */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Percent className="w-3 h-3" />
                    <span>شاخص پیشرفت پروژه‌ها (درصد)</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <ProgressInput
                      label="راه‌سازی"
                      value={county.road_progress}
                      color="bg-amber-500"
                      onChange={(v) => updateLocalField(county.id, 'road_progress', v)}
                    />
                    <ProgressInput
                      label="مسکن ملی"
                      value={county.housing_progress}
                      color="bg-teal-500"
                      onChange={(v) => updateLocalField(county.id, 'housing_progress', v)}
                    />
                    <ProgressInput
                      label="شهرسازی"
                      value={county.urban_progress}
                      color="bg-indigo-500"
                      onChange={(v) => updateLocalField(county.id, 'urban_progress', v)}
                    />
                  </div>
                </div>

                {/* Row 3: Boolean Flags */}
                <div className="flex gap-3">
                  <ToggleField
                    label="پروژه فعال راه‌سازی"
                    value={county.has_active_road_project}
                    onChange={(v) => updateLocalField(county.id, 'has_active_road_project', v)}
                  />
                  <ToggleField
                    label="کارگاه انبوه‌سازی مسکن"
                    value={county.has_housing_workshop}
                    onChange={(v) => updateLocalField(county.id, 'has_housing_workshop', v)}
                  />
                </div>

                {/* Row 4: Description */}
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-1">
                    توضیحات
                  </label>
                  <textarea
                    value={county.description || ''}
                    onChange={(e) => updateLocalField(county.id, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
                    placeholder="توضیحات این شهرستان..."
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCounties.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-bold">هیچ شهرستانی یافت نشد</p>
        </div>
      )}
    </div>
  );
}

// ========== Sub-components ==========

/** A small numeric input field */
function FieldInput({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-2 border border-gray-100 dark:border-gray-700/50">
      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        className="w-full bg-transparent text-sm font-bold text-gray-800 dark:text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

/** A progress percentage input with visual bar */
function ProgressInput({
  label,
  value,
  color,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-2 border border-gray-100 dark:border-gray-700/50">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-[10px] font-mono font-bold text-gray-700 dark:text-gray-300">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mb-1.5">
        <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-teal-500"
      />
    </div>
  );
}

/** A toggle switch for boolean fields */
function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex-1 ${
        value
          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
      }`}
    >
      {value ? (
        <ToggleRight className="w-4 h-4" />
      ) : (
        <ToggleLeft className="w-4 h-4" />
      )}
      <span>{label}</span>
      <span className={`mr-auto font-mono ${value ? 'text-teal-600' : 'text-gray-400'}`}>
        {value ? 'بلی' : 'خیر'}
      </span>
    </button>
  );
}
