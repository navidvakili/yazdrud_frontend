import React, { useRef, useState } from 'react';
import { X, Upload, Loader2, CheckCircle2, AlertCircle, FileText, Edit2 } from 'lucide-react';
import { Folder as FolderType, MediaFile, formatBytes } from './types';
import { uploadMediaFile } from './api';
import { PdfEditorModal } from './pdf/PdfEditorModal';
import { ImageEditorModal } from './ImageEditorModal';
import { AudioEditorModal } from './audio/AudioEditorModal';

interface UploadModalProps {
  folders: FolderType[];
  activeFolderId: string | null;
  onClose: () => void;
  onUploaded: (files: MediaFile[]) => void;
}

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  folders,
  activeFolderId,
  onClose,
  onUploaded
}) => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [folderId, setFolderId] = useState<string>(activeFolderId || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<UploadItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** ویرایش قبل از آپلود برای PDF/تصویر/صدا پشتیبانی می‌شود */
  const canEditBeforeUpload = (f: File) => {
    const name = f.name.toLowerCase();
    const mime = (f.type || '').toLowerCase();
    if (/\.pdf$/i.test(name)) return true;
    if (mime.startsWith('image/')) return true;
    if (mime.startsWith('audio/')) return true;
    return false;
  };

  const handleLocalSaved = (id: string, file: File) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, file } : i)));
    setEditingItem(null);
  };

  const closeEditorSafe = () => setEditingItem(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const newItems: UploadItem[] = Array.from(fileList).map((f, i) => ({
      id: `${Date.now()}-${i}-${f.name}`,
      file: f,
      status: 'pending'
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleStartUpload = async () => {
    if (items.length === 0 || isUploading) return;
    setIsUploading(true);
    setError(null);
    const uploaded: MediaFile[] = [];
    const targetFolderId = folderId === '' ? null : Number(folderId);

    for (const item of items) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i)));
      try {
        const res = await uploadMediaFile(item.file, targetFolderId);
        uploaded.push(res.data);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'done' } : i)));
      } catch (e: any) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: 'error', error: e?.message || 'خطا در آپلود فایل' }
              : i
          )
        );
      }
    }

    setIsUploading(false);
    if (uploaded.length > 0) {
      onUploaded(uploaded);
    } else {
      setError('هیچ فایلی آپلود نشد. لطفاً دوباره تلاش کنید.');
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const doneCount = items.filter((i) => i.status === 'done').length;
  const errorCount = items.filter((i) => i.status === 'error').length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md rtl">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden text-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                آپلود فایل جدید
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                بارگذاری مستقیم روی سرور (Media Manager)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Folder select */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
              مقصد (پوشه مجازی):
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="">— بدون پوشه (ریشه) —</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-teal-500 bg-teal-500/5'
                : 'border-gray-300 dark:border-slate-700 hover:border-teal-500/60 hover:bg-slate-50 dark:hover:bg-slate-950'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <Upload className="w-8 h-8 mx-auto text-teal-500 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              برای انتخاب فایل کلیک کنید یا فایل‌ها را اینجا رها کنید
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              تصاویر، ویدیوها، صداها و اسناد — چند فایل همزمان مجاز است
            </p>
          </div>

          {/* File list */}
          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 flex items-center gap-3 text-xs"
                >
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shrink-0">
                    <FileText className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {formatBytes(item.file.size)}
                    </p>
                  </div>
                  {item.status === 'pending' && (
                    <>
                      {canEditBeforeUpload(item.file) && (
                        <button
                          onClick={() => setEditingItem(item)}
                          className="px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 text-[10px] font-bold flex items-center gap-1 hover:bg-sky-500/20 transition-all cursor-pointer shrink-0"
                          title="ویرایش قبل از آپلود"
                        >
                          <Edit2 className="w-3 h-3" />
                          ویرایش
                        </button>
                      )}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {item.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-teal-500 animate-spin shrink-0" />
                  )}
                  {item.status === 'done' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-1 text-red-500 shrink-0" title={item.error}>
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-bold">خطا</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}

          {doneCount > 0 && !isUploading && (
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              ✓ {doneCount} فایل با موفقیت آپلود شد.
              {errorCount > 0 && ` ${errorCount} فایل ناموفق.`}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-40"
          >
            بستن
          </button>
          <button
            onClick={handleStartUpload}
            disabled={items.length === 0 || isUploading}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال آپلود...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                شروع آپلود ({items.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* ویرایش قبل از آپلود — ویرایشگرها با فایل محلی باز می‌شوند */}
      {editingItem && (
        <>
          {/\.pdf$/i.test(editingItem.file.name) && (
            <PdfEditorModal
              asset={null}
              localFile={editingItem.file}
              onLocalSaved={(f) => handleLocalSaved(editingItem.id, f)}
              onClose={closeEditorSafe}
              onSave={() => undefined}
            />
          )}
          {(editingItem.file.type || '').toLowerCase().startsWith('image/') && (
            <ImageEditorModal
              asset={null}
              localFile={editingItem.file}
              onLocalSaved={(f) => handleLocalSaved(editingItem.id, f)}
              onClose={closeEditorSafe}
              onSave={() => undefined}
            />
          )}
          {(editingItem.file.type || '').toLowerCase().startsWith('audio/') && (
            <AudioEditorModal
              asset={null}
              localFile={editingItem.file}
              onLocalSaved={(f) => handleLocalSaved(editingItem.id, f)}
              onClose={closeEditorSafe}
              onSave={() => undefined}
            />
          )}
        </>
      )}
    </div>
  );
};
