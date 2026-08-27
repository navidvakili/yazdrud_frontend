// ============================================================
// PdfViewer — نمایشگر داخلی PDF (بدون PDF Viewer مرورگر)
// ============================================================
// - رندر با موتور pdf.js (pdfjs-dist) روی canvas داخل خود نرم‌افزار
// - بدون <iframe>؛ نماینده کاملاً «درونی» است (internal viewer)
// - برای رندر باید src آدرس stream بک‌اند باشد (هدر CORS دارد)
//   تا pdf.js بتواند بایت‌های فایل را fetch کند.
// - نوار ابزار: صفحه‌بندی، زوم، اندازه متناسب عرض، چرخش، دانلود و تب جدید

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Maximize,
  RefreshCw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// پیکربندی worker موتور pdf.js؛ فایل worker توسط Vite به‌عنوان asset منتشر می‌شود
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.25;

interface PdfViewerProps {
  /** آدرس برای رندر — باید هدر CORS داشته باشد (stream بک‌اند) */
  src: string;
  /** آدرس مستقیم فایل (برای دانلود / باز کردن در تب جدید) */
  downloadUrl?: string;
  /** نام فایل (نمایش در نوار ابزار) */
  title?: string;
  /** کلاس روی ظرف (سایزدهی) */
  className?: string;
  /** استایل سفارشی */
  style?: React.CSSProperties;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  src,
  downloadUrl,
  title,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  // zoom = ضریب روی «اندازه متناسب عرض»؛ ۱ یعنی متناسب عرض
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  // اندازه‌گیری عرض ظرف برای حالت «اندازه متناسب عرض»
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitScale = pageWidth > 0 && containerWidth > 0 ? containerWidth / pageWidth : 1;
  const scale = Math.min(Math.max(fitScale * zoom, MIN_SCALE), MAX_SCALE);

  const handleZoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, MAX_SCALE));
  const handleZoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, MIN_SCALE));
  const handleFit = () => setZoom(1);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handlePrevPage = useCallback(() => {
    setPageNumber((p) => Math.max(p - 1, 1));
  }, []);
  const handleNextPage = useCallback(() => {
    setPageNumber((p) => Math.min(p + 1, numPages));
  }, [numPages]);

  // ناوبری صفحه با کلیدهای جهت (RTL: فلش راست = صفحه قبل، فلش چپ = صفحه بعد)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handlePrevPage();
      if (e.key === 'ArrowLeft') handleNextPage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrevPage, handleNextPage]);

  const handleDocLoad = ({ numPages: pages }: PDFDocumentProxy) => {
    setNumPages(pages);
    setPageNumber(1);
  };

  const handlePageLoad = (page: PDFPageProxy) => {
    const viewport = page.getViewport({ scale: 1, rotation });
    setPageWidth(viewport.width);
  };

  const handleRetry = () => {
    setError(null);
    setNumPages(0);
    setPageNumber(1);
    setZoom(1);
    setRotation(0);
    setPageWidth(0);
    setRetryKey((k) => k + 1);
  };

  const btn =
    'p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0';

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 overflow-hidden ${className ?? ''}`}
      style={{ width: '100%', height: '100%', ...style }}
    >
      {/* نوار ابزار */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10 bg-slate-950/80 shrink-0 select-none">
        <div className="flex items-center gap-2 min-w-0">
          {title && (
            <span className="text-[11px] font-black text-white truncate max-w-[160px]">{title}</span>
          )}
          {numPages > 0 && (
            <span className="text-[10px] text-slate-400 shrink-0">
              صفحه {pageNumber} از {numPages}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* صفحه قبل / بعد */}
          <button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1}
            className={btn}
            title="صفحه قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={pageNumber >= numPages || numPages === 0}
            className={btn}
            title="صفحه بعد"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

          {/* زوم و چرخش */}
          <button onClick={handleZoomOut} disabled={!numPages} className={btn} title="کوچک‌نمایی">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-slate-300 w-11 text-center shrink-0">
            {Math.round(scale * 100)}٪
          </span>
          <button onClick={handleZoomIn} disabled={!numPages} className={btn} title="بزرگ‌نمایی">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleFit} disabled={!numPages} className={btn} title="اندازه متناسب عرض">
            <Maximize className="w-4 h-4" />
          </button>
          <button onClick={handleRotate} disabled={!numPages} className={btn} title="چرخش ۹۰ درجه">
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/10 mx-1 shrink-0" />

          {/* دانلود / تب جدید */}
          <a href={downloadUrl ?? src} className={btn} title="دانلود فایل">
            <Download className="w-4 h-4" />
          </a>
          <a
            href={downloadUrl ?? src}
            target="_blank"
            rel="noreferrer"
            className={btn}
            title="باز کردن در تب جدید"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* ناحیه رندر */}
      <div className="flex-1 min-h-0 overflow-auto bg-slate-950/60 p-4">
        <Document
          key={retryKey}
          file={src}
          className="flex flex-col items-center gap-3 w-full"
          onLoadSuccess={handleDocLoad}
          onLoadError={(err) => setError(err?.message || 'خطا در بارگذاری PDF')}
          loading={
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 className="w-7 h-7 text-teal-400 animate-spin" />
              <span className="text-xs font-bold">در حال بارگذاری PDF...</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-xs font-bold text-red-300 max-w-xs">
                {error ?? 'خطا در بارگذاری PDF'}
              </p>
              <button
                onClick={handleRetry}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                تلاش مجدد
              </button>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onLoadSuccess={handlePageLoad}
            canvasBackground="#ffffff"
            className="shadow-xl rounded overflow-hidden bg-white shrink-0"
            loading={null}
          />
        </Document>
      </div>
    </div>
  );
};
