import React, { useState } from 'react';
import { Settings, Palette, ShieldCheck, Save } from 'lucide-react';
import { FormDefinition, FormStatus } from './types';
import { FormThemeEditor } from './FormThemeEditor';
import { FormResultSharingStudio } from './FormResultSharingStudio';

interface FormSettingsModalProps {
  form: FormDefinition;
  isOpen: boolean;
  onClose: () => void;
  onChange: (updatedForm: FormDefinition) => void;
  onChangeStatus: (status: FormStatus) => void | Promise<void>;
  isChangingStatus: boolean;
  onSave: () => void | Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

type SettingsTab = 'theme' | 'sharing';

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'theme', label: 'پوسته', icon: Palette },
  { id: 'sharing', label: 'اشتراک و انتشار', icon: ShieldCheck }
];

export const FormSettingsModal: React.FC<FormSettingsModalProps> = ({
  form,
  isOpen,
  onClose,
  onChange,
  onChangeStatus,
  isChangingStatus,
  onSave,
  isSaving,
  hasUnsavedChanges
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('theme');

  if (!isOpen) return null;

  const handleUpdateField = (key: 'description', value: string) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[88vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تنظیمات فرم</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                پوسته و بخش اشتراک‌گذاری و انتشار فرم را از اینجا مدیریت کنید
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold">
            &times;
          </button>
        </div>

        {/* Tabs Strip */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap text-xs font-bold border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 max-w-2xl">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => handleUpdateField('description', e.target.value)}
                  placeholder="توضیح مختصری درباره‌ی هدف این فرم و راهنمای تکمیل آن بنویسید..."
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-xs resize-none"
                />
              </div>
              <FormThemeEditor form={form} onChange={onChange} />
            </div>
          )}

          {activeTab === 'sharing' && (
            <FormResultSharingStudio
              form={form}
              onChange={onChange}
              onChangeStatus={onChangeStatus}
              isChangingStatus={isChangingStatus}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
          >
            بستن
          </button>
          <button
            onClick={() => void onSave()}
            disabled={!hasUnsavedChanges || isSaving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'در حال ذخیره...' : 'ذخیره فرم'}
          </button>
        </div>
      </div>
    </div>
  );
};
