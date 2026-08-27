import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  FileText,
  Link,
  Code,
  Download,
  Trash2,
  Edit2,
  Copy,
  Check,
  Folder,
  Calendar,
  HardDrive,
  Tag as TagIcon,
  Maximize,
  Pencil,
  Save,
  Loader2
} from 'lucide-react';
import { GalleryAsset, Folder as FolderType, formatDate } from './types';
import { VideoPlayer } from './VideoPlayer';
import { PdfViewer } from './PdfViewer';
import { OfficePreview } from './OfficePreview';
import { FullscreenModal } from './FullscreenModal';
import { ImageViewer } from './ImageViewer';
import { getMediaStreamUrl, updateMediaMetadata } from './api';

interface AssetDetailsDrawerProps {
  asset: GalleryAsset;
  folders: FolderType[];
  onClose: () => void;
  onDelete: (asset: GalleryAsset) => void;
  /** ثبت فایل در یک یا چند پوشه مجازی — آرایه خالی یعنی بدون پوشه
   *  می‌تواند Promise برگرداند؛ true یعنی موفق، false یعنی خطا (والد alert می‌کند) */
  onMove: (asset: GalleryAsset, folderIds: number[]) => Promise<boolean> | void;
  onOpenEditor?: () => void;
  /** بعد از ذخیره عنوان/توضیح — والد باید state خود را به‌روز کند */
  onUpdateMetadata?: (asset: GalleryAsset) => void;
}

export const AssetDetailsDrawer: React.FC<AssetDetailsDrawerProps> = ({
  asset,
  folders,
  onClose,
  onDelete,
  onMove,
  onOpenEditor,
  onUpdateMetadata
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'embed'>('info');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>(() => {
    const ids = asset.folder_ids && asset.folder_ids.length > 0
      ? asset.folder_ids
      : asset.folder_id !== null && asset.folder_id !== undefined
        ? [asset.folder_id]
        : [];
    return ids.map(String);
  });
  const [editTitle, setEditTitle] = useState(asset.title || '');
  const [editDescription, setEditDescription] = useState(asset.description || '');
  const [savingMeta, setSavingMeta] = useState(false);
  const [metaSaved, setMetaSaved] = useState(false);
  const [savingGroups, setSavingGroups] = useState(false);
  const [groupsSaved, setGroupsSaved] = useState(false);

  const handleCopyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const currentFolderNames = folders
    .filter((f) => selectedFolderIds.includes(String(f.id)))
    .map((f) => f.name);

  const isPdf =
    (asset.type || '').toLowerCase().includes('pdf') ||
    (asset.name || '').toLowerCase().endsWith('.pdf');

  const isOfficeDoc =
    asset.fileType === 'document' &&
    !isPdf &&
    /\.(docx?|pptx?|xlsx?)$/i.test(asset.name || '');

  const handleMoveClick = async () => {
    if (savingGroups) return;
    const targets = selectedFolderIds.map(Number);
    setSavingGroups(true);
    setGroupsSaved(false);
    try {
      const ok = await onMove(asset, targets);
      if (ok !== false) {
        setGroupsSaved(true);
        setTimeout(() => setGroupsSaved(false), 3000);
      }
    } finally {
      setSavingGroups(false);
    }
  };

  const handleSaveMetadata = async () => {
    setSavingMeta(true);
    setMetaSaved(false);
    try {
      const res = await updateMediaMetadata(asset, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      onUpdateMetadata?.({ ...asset, title: res.data.title, description: res.data.description });
      setMetaSaved(true);
      setTimeout(() => setMetaSaved(false), 2500);
    } catch {
      /* خطا در والد یا همین‌جا نادیده گرفته می‌شود — والد می‌تواند alert کند */
    } finally {
      setSavingMeta(false);
    }
  };

  const htmlSnippet = `<img 
  src="${asset.url}" 
  alt="${asset.name}" 
  loading="lazy" 
  decoding="async"
/>`;

  return (
    <motion.div
      initial={{ x: '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full sm:w-[460px] bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 h-full flex flex-col shadow-2xl z-[60] select-none text-right rtl"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase border border-teal-500/20 shrink-0">
            {asset.fileType}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
              {asset.name}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {asset.sizeFormatted} • {asset.type}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Image / Media Header Preview */}
      <div
        className={`relative bg-slate-950/90 ${isPdf || isOfficeDoc ? 'h-72' : 'h-52'} flex items-center justify-center p-3 overflow-hidden border-b border-gray-200 dark:border-slate-800`}
      >
        {asset.fileType === 'image' && (
          <img
            src={asset.url}
            alt={asset.name}
            className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
          />
        )}
        {asset.fileType === 'video' && (
          <VideoPlayer
            key={asset.id}
            src={getMediaStreamUrl(asset)}
            type={asset.type}
            className="max-h-full max-w-full rounded-lg shadow-lg overflow-hidden"
          />
        )}
        {asset.fileType === 'audio' && (
          <div className="flex flex-col items-center justify-center text-amber-500 gap-2">
            <FileText className="w-16 h-16" />
            <span className="text-xs font-bold text-white">{asset.name}</span>
            <audio src={getMediaStreamUrl(asset)} controls className="w-4/5" />
          </div>
        )}
        {asset.fileType === 'document' && isPdf && (
          <div className="w-full h-full flex flex-col gap-2">
            <div className="flex-1 min-h-0 overflow-hidden rounded-lg bg-white">
              <PdfViewer
                src={getMediaStreamUrl(asset)}
                downloadUrl={asset.url}
                title={asset.name}
              />
            </div>
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white text-[11px] font-bold transition-all shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>مشاهده PDF در تب جدید</span>
            </a>
          </div>
        )}
        {isOfficeDoc && (
          <div className="w-full h-full rounded-lg overflow-hidden">
            <OfficePreview
              src={getMediaStreamUrl(asset)}
              name={asset.name}
              downloadUrl={asset.url}
            />
          </div>
        )}
        {asset.fileType === 'document' && !isPdf && !isOfficeDoc && (
          <div className="flex flex-col items-center justify-center text-amber-500 gap-2">
            <FileText className="w-16 h-16" />
            <span className="text-xs font-bold text-white">{asset.name}</span>
          </div>
        )}

        {(asset.fileType === 'image' || asset.fileType === 'video' || (asset.fileType === 'document' && isPdf)) && (
          <button
            onClick={() => {
              if (asset.fileType === 'image') setShowImageViewer(true);
              else setShowFullscreen(true);
            }}
            className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-teal-600 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer z-10"
            title="نمایش فول‌اسکرین"
          >
            <Maximize className="w-3.5 h-3.5" />
            <span>نمایش فول‌اسکرین</span>
          </button>
        )}

        {(asset.fileType === 'image' ||
          asset.fileType === 'video' ||
          asset.fileType === 'audio' ||
          (asset.fileType === 'document' && isPdf)) &&
          onOpenEditor && (
            <button
              onClick={onOpenEditor}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>
                {asset.fileType === 'video'
                  ? 'ویرایش ویدئو'
                  : asset.fileType === 'audio'
                    ? 'ویرایش صدا'
                    : asset.fileType === 'document' && isPdf
                      ? 'ویرایش پی‌دی‌اف'
                      : 'ویرایش تصویر'}
              </span>
            </button>
          )}
      </div>

      {/* Fullscreen Modal (video.js / PDF) */}
      {showFullscreen && (
        <FullscreenModal asset={asset} onClose={() => setShowFullscreen(false)} />
      )}

      {/* Image Viewer (مشابه HRM — زوم/چرخش/دانلود) */}
      {showImageViewer && (
        <ImageViewer
          open={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          imageUrl={asset.url}
          title={asset.name}
        />
      )}

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 p-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          اطلاعات فایل
        </button>

        <button
          onClick={() => setActiveTab('embed')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'embed'
              ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          کد خروجی
        </button>
      </div>

      {/* Drawer Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* TAB 1: FILE INFO */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block mb-0.5">نام فایل</span>
              <span className="font-bold text-slate-900 dark:text-white break-all">{asset.name}</span>
            </div>

            {/* Title / Description — نمایش در ویجت مخزن اسناد */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block font-bold flex items-center gap-1">
                  <Pencil className="w-3 h-3" />
                  عنوان و توضیح (نمایش در ویجت مخزن اسناد)
                </span>
                {metaSaved && (
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    ذخیره شد
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={asset.name}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
                {!editTitle.trim() && (
                  <p className="text-[10px] text-slate-400 -mt-1">
                    در صورت خالی بودن، نام فایل در ویجت نمایش داده می‌شود.
                  </p>
                )}
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  placeholder="توضیح کوتاه درباره فایل (اختیاری)..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>
              <button
                onClick={handleSaveMetadata}
                disabled={savingMeta}
                className="w-full px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                ذخیره عنوان و توضیح
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  حجم فایل
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{asset.sizeFormatted}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  نوع فرمت
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{asset.type}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  تاریخ بارگذاری
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatDate(asset.created_at)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  گروه‌ها (پوشه‌های مجازی)
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentFolderNames.length > 0 ? currentFolderNames.join('، ') : '— بدون پوشه —'}
                </span>
              </div>
            </div>

            {/* Move to folders (multi-select — a file can belong to several groups) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 block font-bold">
                ثبت در گروه‌ها (می‌توانید چند پوشه را انتخاب کنید):
              </span>
              {folders.length === 0 ? (
                <p className="text-[11px] text-slate-400">هنوز پوشه‌ای ساخته نشده است.</p>
              ) : (
                <div className="max-h-44 overflow-y-auto space-y-1.5 pl-1">
                  {folders.map((f) => {
                    const checked = selectedFolderIds.includes(String(f.id));
                    return (
                      <label
                        key={f.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs font-bold ${
                          checked
                            ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-300'
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-500/30'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedFolderIds((prev) =>
                              checked
                                ? prev.filter((id) => id !== String(f.id))
                                : [...prev, String(f.id)]
                            )
                          }
                          className="accent-teal-500 rounded cursor-pointer"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: f.color || '#0d9488' }}
                        />
                        <span className="truncate">{f.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMoveClick}
                  disabled={savingGroups}
                  className="flex-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {savingGroups ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingGroups ? 'در حال ذخیره…' : 'ذخیره گروه‌ها'}
                </button>
                {groupsSaved && (
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    ذخیره شد
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMBED & CODES */}
        {activeTab === 'embed' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>تگ HTML:</span>
                <button
                  onClick={() => handleCopyCode(htmlSnippet, 'html')}
                  className="text-teal-600 dark:text-teal-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  کپی تگ HTML
                </button>
              </div>
              <textarea
                readOnly
                rows={4}
                value={htmlSnippet}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-950 text-emerald-400 text-[11px] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>لینک مستقیم فایل:</span>
                <button
                  onClick={() => handleCopyCode(asset.url, 'url')}
                  className="text-teal-600 dark:text-teal-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  کپی لینک
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={asset.url}
                  className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-[11px] focus:outline-none"
                />
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl text-teal-600 hover:bg-teal-500/10 transition-colors"
                  title="باز کردن در تب جدید"
                >
                  <Link className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <Code className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
              <p className="leading-relaxed">
                این فایل از طریق سرویس مدیریت رسانه (Media Manager) در دسترس است. برای استفاده در صفحات پرتال، لینک مستقیم را در تگ img قرار دهید.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-2">
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>دانلود فایل</span>
        </a>

        <button
          onClick={() => onDelete(asset)}
          className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-500/20"
          title="حذف دائمی فایل"
        >
          <Trash2 className="w-4 h-4" />
          <span>حذف</span>
        </button>
      </div>
    </motion.div>
  );
};
