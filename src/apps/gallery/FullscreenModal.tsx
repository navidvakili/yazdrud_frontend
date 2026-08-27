// ============================================================
// FullscreenModal — نمایش فول‌اسکرین PDF و ویدیو
// ============================================================
// - ویدیو: با video.js (VideoPlayer) پخش می‌شود
// - PDF: با PdfViewer (رندر داخلی pdf.js روی canvas) نمایش داده می‌شود
// لایه بالاتر از دراور جزئیات (z-[60]) قرار می‌گیرد.

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Film } from 'lucide-react';
import { GalleryAsset } from './types';
import { VideoPlayer } from './VideoPlayer';
import { PdfViewer } from './PdfViewer';
import { getMediaStreamUrl } from './api';

interface FullscreenModalProps {
  asset: GalleryAsset;
  onClose: () => void;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({ asset, onClose }) => {
  const isPdf =
    (asset.type || '').toLowerCase().includes('pdf') ||
    (asset.name || '').toLowerCase().endsWith('.pdf');
  const isVideo = asset.fileType === 'video';

  // بستن با کلید Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex flex-col overflow-hidden select-none text-white rtl"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Control Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 z-10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/20 shrink-0">
              {isPdf ? <FileText className="w-4 h-4" /> : <Film className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-white truncate">{asset.name}</h3>
              <span className="text-[10px] text-slate-400">
                {asset.sizeFormatted} • {isPdf ? 'PDF' : 'ویدیو'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fullscreen Media Area */}
        <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
          {isVideo ? (
            <div
              className="aspect-video max-w-full"
              style={{
                // متناسب با ارتفاع در دسترس (هدر بالا + پدینگ) تا ویدئو و
                // کنترلبار آن همیشه داخل ناحیه اصلی بمانند و نسبت ۱۶:۹ حفظ شود.
                width: 'min(92vw, 1400px, calc((100dvh - 150px) * 1.7778))',
              }}
            >
              <VideoPlayer
                key={asset.id}
                src={getMediaStreamUrl(asset)}
                type={asset.type}
                autoPlay
                className="w-full h-full rounded-xl shadow-2xl overflow-hidden"
              />
            </div>
          ) : isPdf ? (
            <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900 shadow-2xl">
              <PdfViewer
                src={getMediaStreamUrl(asset)}
                downloadUrl={asset.url}
                title={asset.name}
              />
            </div>
          ) : (
            <div className="text-center text-slate-400 text-sm font-bold">
              نمایش فول‌اسکرین فقط برای فایل‌های PDF و ویدیو در دسترس است.
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
