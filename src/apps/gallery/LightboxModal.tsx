import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Music } from 'lucide-react';
import { GalleryAsset } from './types';
import { VideoPlayer } from './VideoPlayer';
import { PdfViewer } from './PdfViewer';
import { OfficePreview } from './OfficePreview';
import { getMediaStreamUrl } from './api';

interface LightboxModalProps {
  assets: GalleryAsset[];
  initialAssetId: string;
  onClose: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  assets,
  initialAssetId,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = assets.findIndex((a) => a.id === initialAssetId);
    return idx >= 0 ? idx : 0;
  });

  const currentAsset = assets[currentIndex] || assets[0];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handlePrev();
      if (e.key === 'ArrowLeft') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % assets.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + assets.length) % assets.length);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col justify-between overflow-hidden select-none text-white rtl">
      {/* Lightbox Top Control Bar */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-slate-300">
            {currentIndex + 1} از {assets.length}
          </span>
          <h3 className="text-xs font-black text-white truncate max-w-xs sm:max-w-md">
            {currentAsset?.name}
          </h3>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Preview Center Area */}
      <div className="relative flex-1 flex items-center justify-center p-6 overflow-hidden">
        {/* Nav Prev Button */}
        <button
          onClick={handlePrev}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Media Viewport */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAsset?.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="max-w-full max-h-full flex items-center justify-center"
          >
            {currentAsset?.fileType === 'image' && (
              <img
                src={currentAsset.url}
                alt={currentAsset.name}
                className="max-w-full max-h-[80vh] object-contain shadow-2xl rounded-xl transition-all duration-200"
              />
            )}

            {currentAsset?.fileType === 'video' && (
              <div
                className="aspect-video max-w-full"
                style={{
                  // متناسب با ارتفاع در دسترس (هدر + بندانگشتیها) تا کنترلبار
                  // هرگز بیرون ویدئو و داخل فوتر نیفتد؛ نسبت ۱۶:۹ حفظ میشود.
                  width: 'min(95vw, 1700px, calc((100dvh - 230px) * 1.7778))',
                }}
              >
                <VideoPlayer
                  key={currentAsset.id}
                  src={getMediaStreamUrl(currentAsset)}
                  type={currentAsset.type}
                  autoPlay
                  className="w-full h-full rounded-xl shadow-2xl overflow-hidden"
                />
              </div>
            )}

            {currentAsset?.fileType === 'audio' && (
              <div className="w-[min(92vw,520px)] rounded-2xl bg-slate-900/80 border border-white/10 shadow-2xl p-8 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Music className="w-9 h-9" />
                </div>
                <h4 className="text-sm font-black text-white truncate max-w-full">
                  {currentAsset.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {currentAsset.sizeFormatted}
                </span>
                <audio
                  key={currentAsset.id}
                  src={getMediaStreamUrl(currentAsset)}
                  controls
                  autoPlay
                  className="w-full h-11"
                />
              </div>
            )}

            {currentAsset?.fileType === 'document' &&
              /\.pdf$/i.test(currentAsset.name) && (
                <div className="w-[min(90vw,1100px)] h-[80vh] max-w-full max-h-[80vh] rounded-xl overflow-hidden bg-slate-900 shadow-2xl">
                  <PdfViewer
                    key={currentAsset.id}
                    src={getMediaStreamUrl(currentAsset)}
                    downloadUrl={currentAsset.url}
                    title={currentAsset.name}
                  />
                </div>
              )}

            {currentAsset?.fileType === 'document' &&
              /\.(docx?|pptx?|xlsx?)$/i.test(currentAsset.name) && (
                <div className="w-[min(90vw,1100px)] h-[80vh] max-w-full max-h-[80vh] rounded-xl overflow-hidden bg-slate-900 shadow-2xl">
                  <OfficePreview
                    key={currentAsset.id}
                    src={getMediaStreamUrl(currentAsset)}
                    name={currentAsset.name}
                    downloadUrl={currentAsset.url}
                  />
                </div>
              )}
          </motion.div>
        </AnimatePresence>

        {/* Nav Next Button */}
        <button
          onClick={handleNext}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all cursor-pointer z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

      </div>

      {/* Lightbox Bottom Thumbnails Track */}
      <div className="p-3 border-t border-white/10 bg-black/60 flex items-center justify-center gap-2 overflow-x-auto z-10">
        {assets.map((ast, idx) => (
          <button
            key={ast.id}
            onClick={() => setCurrentIndex(idx)}
            className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
              idx === currentIndex
                ? 'border-teal-500 scale-105 shadow-lg shadow-teal-500/30'
                : 'border-transparent opacity-50 hover:opacity-100'
            }`}
          >
            {ast.fileType === 'image' ? (
              <img src={ast.url} alt={ast.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400">
                <span className="text-[8px] font-bold">{ast.fileType}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
