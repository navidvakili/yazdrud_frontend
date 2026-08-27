// ============================================================
// PageVariables — دکمهٔ «درج متغیر» و ابزار درج در محل نشانگر
// (همانند دکمهٔ درج آیکون: یک توکن {{...}} در محل نشانگر درج می‌کند
// که در نمایش نهایی، با مقدار واقعی صفحه جایگزین می‌شود)
// ============================================================

import React, { useState } from 'react';
import { Braces, X } from 'lucide-react';

export interface PageContentVariable {
  key: string;
  label: string;
  token: string;
}

export const PAGE_CONTENT_VARIABLES: PageContentVariable[] = [
  { key: 'pageType', label: 'نوع صفحه', token: '{{pageType}}' },
  { key: 'title', label: 'عنوان کامل صفحه', token: '{{title}}' },
  { key: 'shortTitle', label: 'عنوان کوتاه', token: '{{shortTitle}}' },
  { key: 'shortDescription', label: 'توضیح کوتاه / شعار', token: '{{shortDescription}}' },
  { key: 'fullDescription', label: 'توضیحات کامل و معرفی اهداف', token: '{{fullDescription}}' },
  { key: 'url', label: 'آدرس صفحه', token: '{{url}}' },
  { key: 'ownerName', label: 'نام و نام خانوادگی مسئول صفحه', token: '{{ownerName}}' },
  { key: 'ownerRole', label: 'سمت مسئول صفحه', token: '{{ownerRole}}' },
  { key: 'ownerPhone', label: 'شماره تلفن مسئول صفحه', token: '{{ownerPhone}}' },
  { key: 'ownerEmail', label: 'پست الکترونیک مسئول صفحه', token: '{{ownerEmail}}' }
];

/** درج یک رشته در محل نشانگر (cursor) داخل input/textarea، با حفظ موقعیت نشانگر پس از درج */
export function insertAtCursor(
  el: HTMLInputElement | HTMLTextAreaElement | null,
  current: string,
  token: string,
  setValue: (next: string) => void
): void {
  if (!el) {
    setValue(current + token);
    return;
  }
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? current.length;
  const next = current.slice(0, start) + token + current.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    const pos = start + token.length;
    el.setSelectionRange(pos, pos);
  });
}

interface VariableInsertButtonProps {
  onInsert: (token: string) => void;
  label?: string;
}

/**
 * دکمه «درج متغیر» — همانند دکمه درج آیکون. برخلاف نسخهٔ قبلی (منوی dropdown با
 * موقعیت‌دهی absolute)، اینجا از یک دیالوگ ثابت و وسط‌چین (مثل IconPicker) استفاده
 * می‌شود تا در پنل‌های باریک (مثل تنظیمات ویجت در Page Builder) باعث اسکرول افقی نشود.
 */
export function VariableInsertButton({ onInsert, label = 'درج متغیر' }: VariableInsertButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-[11px] font-bold flex items-center gap-1 transition-colors"
        title="درج متغیر صفحه اختصاصی — در نمایش نهایی با مقدار واقعی جایگزین می‌شود"
      >
        <Braces className="w-3 h-3" />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-[380px] max-w-[92vw] max-h-[70vh] bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
                <Braces className="w-4 h-4 text-indigo-500" />
                <span>درج متغیر صفحهٔ اختصاصی</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-2 overflow-y-auto flex-1">
              {PAGE_CONTENT_VARIABLES.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => {
                    onInsert(v.token);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <span>{v.label}</span>
                  <span className="font-mono text-[10px] text-slate-400 dir-ltr">{v.token}</span>
                </button>
              ))}
            </div>

            {/* Footer note */}
            <div className="px-4 py-2.5 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <p className="text-[10px] text-slate-400">
                در نمایش نهایی، این متغیرها با مقدار واقعی صفحهٔ اختصاصی جایگزین می‌شوند.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
