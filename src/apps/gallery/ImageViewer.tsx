// ============================================================
// ImageViewer — نمایش فول‌اسکرین تصویر (همانند پروژه HRM)
// ============================================================
// - زوم با دکمه‌ها و اسکرول ماوس (۰.۵x تا ۳x)
// - چرخش ۹۰ درجه (راست/چپ)
// - بازنشانی و دانلود
// - جابه‌جایی با درگ هنگام زوم
// - بستن با Escape یا دکمه بستن

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  RefreshCw,
} from 'lucide-react';

interface ImageViewerProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export const ImageViewer: React.FC<ImageViewerProps> = ({ open, onClose, imageUrl, title }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));

  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const handleRotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = title || 'document.jpg';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
      window.open(imageUrl, '_blank');
    }
  };

  // زوم با اسکرول ماوس
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((prevZoom) => Math.min(Math.max(prevZoom + delta, MIN_ZOOM), MAX_ZOOM));
  }, []);

  // درگ برای جابه‌جایی تصویر هنگام زوم
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // بستن با Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // وقتی زوم به ۱ برگردد، موقعیت صفر شود
  useEffect(() => {
    if (zoom === 1) setPosition({ x: 0, y: 0 });
  }, [zoom]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex flex-col overflow-hidden select-none text-white rtl"
          role="dialog"
          aria-modal="true"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Top Control Bar */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-black text-white truncate">{title}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="بزرگ‌نمایی"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="کوچک‌نمایی"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotateRight}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="چرخش به راست"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleRotateLeft}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="چرخش به چپ"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="بازنشانی"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="دانلود"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleClose}
                className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer mr-1.5"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Image Area */}
          <div className="relative flex-1 overflow-hidden flex items-center justify-center">
            <img
              src={imageUrl}
              alt={title}
              draggable={false}
              onMouseDown={handleMouseDown}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
