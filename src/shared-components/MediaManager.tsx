// ============================================================
// MediaManager — مدیریت رسانه: آپلود، مشاهده و انتخاب فایل‌ها
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Upload, Image as ImageIcon, FileText, Trash2, Search,
  Grid3X3, Loader2, AlertCircle, CheckCircle2, Folder, Video as VideoIcon,
} from 'lucide-react';
import { APISendFiles } from '@/src/shared-utils/functions';
import { API } from '@/src/shared-utils/functions';
import { BACKEND_API_URL } from '@/src/shared-constants';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
  path?: string;
}

/** Normalize storage URLs to the frontend's backend base URL */
function resolveMediaUrl(url: string): string {
  if (!url) return url;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      return `${BACKEND_API_URL}${parsed.pathname}${parsed.search}`;
    }
    if (url.startsWith('/')) {
      return `${BACKEND_API_URL}${url}`;
    }
  } catch {
    // keep original
  }
  return url;
}

function normalizeMediaFile(file: MediaFile): MediaFile {
  return { ...file, url: resolveMediaUrl(file.url) };
}

interface MediaManagerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, file?: MediaFile) => void;
  /** فیلتر نوع فایل: image، video یا همه */
  filter?: 'image' | 'video' | 'all';
  /** عنوان دیالوگ */
  title?: string;
}

export default function MediaManager({
  open,
  onClose,
  onSelect,
  filter = 'image',
  title = 'مدیریت رسانه',
}: MediaManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Drops stale async responses (rapid page clicks, reopen while a previous
  // request is still in flight) so the latest request always wins.
  const loadSeqRef = useRef(0);
  // True right after the manager opens, so the page/search load effect does
  // NOT fire with the stale page value from the previous session.
  const openedRef = useRef(false);

  const isImage = (type: string) => type.startsWith('image/');
  const isVideo = (type: string) => type.startsWith('video/');

  // Load files
  const loadFiles = useCallback(async (requestedPage = 1, requestedSearch = '') => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('per_page', String(perPage));
      params.set('page', String(requestedPage));
      if (requestedSearch.trim() !== '') {
        params.set('search', requestedSearch.trim());
      }

      const data = await API<{
        data: MediaFile[];
        total: number;
        page: number;
        per_page: number;
        last_page: number;
      }>(`media?${params.toString()}`);
      // A newer load superseded this one — ignore its (stale) response.
      if (seq !== loadSeqRef.current) return;
      setFiles((data.data || []).map(normalizeMediaFile));
      setTotal(data.total || 0);
      setPage(data.page || requestedPage);
      setLastPage(data.last_page || Math.max(1, Math.ceil((data.total || 0) / perPage)));
    } catch (err: any) {
      if (seq !== loadSeqRef.current) return;
      setError(err.message || 'خطا در بارگذاری فایل‌ها');
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    if (open) {
      // Every fresh open starts from page 1 with a cleared search.
      setPage(1);
      setSearchQuery('');
      setDebouncedSearchQuery('');
      setSelectedFile(null);
      setError(null);
      setSuccessMsg(null);
      loadFiles(1, '');
      openedRef.current = true;
    } else {
      openedRef.current = false;
    }
  }, [open, loadFiles]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    // Skip the run triggered by the open transition itself — the open effect
    // above already loaded page 1 with the freshly reset state.
    if (!open || openedRef.current) {
      openedRef.current = false;
      return;
    }
    loadFiles(page, debouncedSearchQuery);
  }, [open, page, debouncedSearchQuery, loadFiles]);

  // Upload file
  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await APISendFiles<{ data: MediaFile; message: string }>('media/upload', formData);

      clearInterval(progressTimer);
      setUploadProgress(100);
      setSuccessMsg(result.message || 'فایل با موفقیت آپلود شد.');

      const uploaded = normalizeMediaFile(result.data);
      setSelectedFile(uploaded);
      await loadFiles(1, searchQuery);

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      const apiMessage = err.message || '';
      // Check both direct errors (from API function) and response.data.errors (from APISendFiles prior fix)
      const errors = err.errors || err.response?.data?.errors;
      let displayMessage = apiMessage;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstErr = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : null;
        if (firstErr) displayMessage = firstErr;
      } else if (apiMessage === 'The given data was invalid.') {
        displayMessage = 'فرمت فایل مجاز نیست. فرمت‌های مجاز: تصویر (jpg,png,webp) و ویدئو (mp4,webm,mov)';
      }
      setError(displayMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Delete file
  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`آیا از حذف فایل «${file.name}» اطمینان دارید؟`)) return;
    try {
      await API(`media/${file.id}`, { url: file.url }, 'DELETE');
      setFiles(prev => prev.filter(f => f.id !== file.id));
      if (selectedFile?.id === file.id) setSelectedFile(null);
      setSuccessMsg('فایل با موفقیت حذف شد.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'خطا در حذف فایل');
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  // Filter files by type only; search is handled server-side.
  const filteredFiles = files.filter(f => {
    if (filter === 'image' && !isImage(f.type)) return false;
    if (filter === 'video' && !isVideo(f.type)) return false;
    return true;
  });

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-[11px] text-gray-400">{filteredFiles.length} فایل</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              <div className="flex-1 max-w-sm">
                <div className="relative flex items-center gap-2">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="جستجوی فایل..."
                    className="w-full pr-24 pl-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setDebouncedSearchQuery('');
                        setPage(1);
                      }}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 whitespace-nowrap"
                    >
                      لغو
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>آپلود فایل</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={filter === 'image' ? 'image/*' : filter === 'video' ? 'video/*' : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = '';
              }}
            />
          </div>
          {loading && (
            <div className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400">
              {searchQuery ? 'در حال جستجو...' : 'در حال بارگذاری...'}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                <span className="text-xs text-gray-600 dark:text-gray-300">در حال آپلود...</span>
                <span className="text-[11px] font-mono text-teal-600">{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 mt-2 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Messages */}
          {(error || successMsg) && (
            <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-800">
              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 pb-28">
            {/* Drag & Drop Zone */}
            {files.length === 0 && !loading && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-teal-400'
                }`}
              >
                <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">
                  فایل را اینجا رها کنید
                </p>
                <p className="text-xs text-gray-400">
                  یا دکمه «آپلود فایل» را بزنید
                </p>
              </div>
            )}

            {/* Files Grid */}
            {filteredFiles.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`group relative rounded-2xl border-2 overflow-hidden transition-all ${
                      selectedFile?.id === file.id
                        ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-lg'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => setSelectedFile(file)}
                      className="aspect-square bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      {isImage(file.type) ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : isVideo(file.type) ? (
                        <div className="relative w-full h-full">
                          <video
                            src={file.url}
                            muted
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <VideoIcon className="w-8 h-8 text-white drop-shadow" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 p-4">
                          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                          <span className="text-[10px] text-gray-400 font-mono">{file.type.split('/').pop()}</span>
                        </div>
                      )}
                      {(isImage(file.type) || isVideo(file.type)) && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                          className="absolute top-2 left-2 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="نمایش پیش‌نمایش"
                        >
                          {isImage(file.type) ? <ImageIcon className="w-4 h-4" /> : <VideoIcon className="w-4 h-4" />}
                        </button>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-2 space-y-1">
                      <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[9px] text-gray-400 font-mono">{formatSize(file.size)}</p>
                    </div>

                    {/* Selection indicator */}
                    {selectedFile?.id === file.id && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-teal-500 text-white shadow-md">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                      title="حذف فایل"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Empty search */}
            {filteredFiles.length === 0 && !loading && total === 0 && (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400">فایلی یافت نشد</p>
              </div>
            )}

            {/* Loading */}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-[11px] text-gray-500 dark:text-gray-400">
                <span>
                  نمایش {Math.min((page - 1) * perPage + 1, total)} تا {Math.min(page * perPage, total)} از {total} فایل
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    قبلی
                  </button>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    {page} / {lastPage}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
                    disabled={page >= lastPage}
                    className="px-3 py-1 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    بعدی
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedFile && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    <span className="font-bold">انتخاب شده:</span>
                    <span className="text-gray-900 dark:text-white font-semibold truncate max-w-[200px]">{selectedFile.name}</span>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    if (selectedFile) {
                      onSelect(selectedFile.url, selectedFile);
                      onClose();
                    }
                  }}
                  disabled={!selectedFile}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedFile
                    ? isImage(selectedFile.type)
                      ? 'استفاده از تصویر'
                      : isVideo(selectedFile.type)
                      ? 'استفاده از ویدئو'
                      : 'استفاده از فایل'
                    : 'استفاده'}
                </button>
              </div>
            </div>
          </div>
          {previewFile && (
            <div
              onClick={() => setPreviewFile(null)}
              className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4"
            >
              <div className="relative max-w-[90vw] max-h-[90vh]">
                {isVideo(previewFile.type) ? (
                  <video
                    src={previewFile.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl bg-black"
                  />
                ) : (
                  <img
                    src={previewFile.url}
                    alt={previewFile.name}
                    className="max-w-full max-h-[90vh] rounded-3xl shadow-2xl"
                  />
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setPreviewFile(null); }}
                  className="absolute top-3 right-3 rounded-full bg-white/90 text-gray-800 p-2 hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
