// ============================================================
// SliderStudioApp — ویرایشگر اسلایدر هوشمند
// مستقیماً پروژه جاری (همان اسلایدر وب‌سایت) را باز می‌کند
// ============================================================

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import ToastNotification from '@/src/shared-components/ToastNotification';
import { fetchCurrentProject, updateProject } from './api';
import SliderStudioEditor from './components/SliderStudio';
import type { SliderProject } from '@/src/shared-types/slider-studio';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

export default function SliderStudioApp() {
  const { currentLang } = useLanguage();

  // ===== Editor state =====
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectData, setProjectData] = useState<SliderProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== Toast =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Load current project on mount =====
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchCurrentProject(currentLang);
        if (cancelled) return;
        const project = res?.data;
        if (project?.id) {
          setProjectId(project.id);
          if (project.project_data) {
            const data = typeof project.project_data === 'string'
              ? JSON.parse(project.project_data)
              : project.project_data;
            // Ensure createdAt/updatedAt for SliderProject type
            if (!data.createdAt) data.createdAt = project.created_at || '';
            if (!data.updatedAt) data.updatedAt = project.updated_at || '';
            setProjectData(data);
          } else {
            setError('داده‌های پروژه معتبر نیست');
          }
        } else {
          setError('پروژه‌ای یافت نشد');
        }
      } catch (err: any) {
        if (cancelled) return;
        const msg = err.message || 'خطا در بارگذاری پروژه';
        setError(msg);
        showToast(msg, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [currentLang]);

  // ===== Save (always updates the existing single project) =====
  const handleSaveProject = async (project: SliderProject) => {
    if (!projectId) {
      showToast('شناسه پروژه یافت نشد', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: project.title,
        description: project.description,
        project_data: JSON.stringify(project),
        is_active: true,
        lang: currentLang,
      };
      await updateProject(projectId, payload);
      showToast('اسلایدر با موفقیت ذخیره شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره اسلایدر', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-white rtl">
      {toast && (
        <ToastNotification toast={toast} />
      )}

      {/* ===== Content ===== */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            <span className="mr-3 text-sm text-gray-500">در حال بارگذاری اسلایدر...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-4">
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
              <Loader2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300">خطا در بارگذاری اسلایدر</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
              {error}
            </p>
            <button
              onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              تلاش مجدد
            </button>
          </div>
        ) : (
          <SliderStudioEditor
            initialProject={projectData}
            onSave={handleSaveProject}
          />
        )}
      </div>
    </div>
  );
}
