import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Monitor,
  Tablet,
  Smartphone,
  Sparkles,
  Volume2,
  Maximize2
} from 'lucide-react';
import type { SliderProject, Slide, BreakpointWidth } from '@/src/shared-types/slider-studio';
import AddonParticleCanvas from './AddonParticleCanvas';

interface InteractivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SliderProject;
}

export default function InteractivePreviewModal({
  isOpen,
  onClose,
  project
}: InteractivePreviewModalProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [deviceSize, setDeviceSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [keyCounter, setKeyCounter] = useState(0);

  const activeSlide: Slide = project.slides[currentSlideIndex] || project.slides[0];

  // Auto-play timer
  useEffect(() => {
    if (!isOpen || !isPlaying || project.slides.length <= 1) return;
    const slideDuration = (activeSlide.duration || 6) * 1000;
    const timer = setTimeout(() => {
      setCurrentSlideIndex(prev => (prev + 1) % project.slides.length);
      setKeyCounter(prev => prev + 1);
    }, slideDuration);

    return () => clearTimeout(timer);
  }, [isOpen, isPlaying, currentSlideIndex, activeSlide, project.slides.length]);

  // Execute slide-level 'slideLoad' interactions when the slide mounts
  useEffect(() => {
    if (!activeSlide.interactions) return;
    activeSlide.interactions.forEach(int => {
      if (int.trigger === 'slideLoad') {
        if (int.action === 'jumpSlide' && int.targetSlideId) {
          const targetIdx = project.slides.findIndex(s => s.id === int.targetSlideId);
          if (targetIdx !== -1) {
            setCurrentSlideIndex(targetIdx);
            setKeyCounter(prev => prev + 1);
          }
        } else if (int.action === 'link' && int.targetUrl) {
          window.open(int.targetUrl, '_blank');
        }
      }
    });
  }, [activeSlide.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle slide-level click interactions
  const handleSlideClick = () => {
    if (!activeSlide.interactions) return;
    activeSlide.interactions.forEach(int => {
      if (int.trigger === 'click') {
        if (int.action === 'jumpSlide' && int.targetSlideId) {
          const targetIdx = project.slides.findIndex(s => s.id === int.targetSlideId);
          if (targetIdx !== -1) {
            setCurrentSlideIndex(targetIdx);
            setKeyCounter(prev => prev + 1);
          }
        } else if (int.action === 'link' && int.targetUrl) {
          window.open(int.targetUrl, '_blank');
        }
      }
    });
  };

  if (!isOpen) return null;

  // Viewport sizes
  const viewportWidths = {
    desktop: project.width,
    tablet: 900,
    mobile: 480
  };

  const scaleFactor =
    deviceSize === 'desktop' ? 1 : deviceSize === 'tablet' ? 0.72 : 0.38;

  const handleNextSlide = () => {
    setCurrentSlideIndex(prev => (prev + 1) % project.slides.length);
    setKeyCounter(prev => prev + 1);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex(prev => (prev - 1 + project.slides.length) % project.slides.length);
    setKeyCounter(prev => prev + 1);
  };

  const handleReplay = () => {
    setKeyCounter(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl text-slate-900 dark:text-white font-sans rtl text-right transition-colors">
      {/* Top Preview Controls Bar */}
      <div className="flex items-center justify-between p-4 px-6 border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">{project.title} - پیش‌نمایش زنده</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              اسلاید {currentSlideIndex + 1} از {project.slides.length} ({activeSlide.title})
            </p>
          </div>
        </div>

        {/* Breakpoint Viewport Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setDeviceSize('desktop')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceSize === 'desktop'
                ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>دسکتاپ (1240px)</span>
          </button>
          <button
            onClick={() => setDeviceSize('tablet')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceSize === 'tablet'
                ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>تبلت (900px)</span>
          </button>
          <button
            onClick={() => setDeviceSize('mobile')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceSize === 'mobile'
                ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>موبایل (480px)</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReplay}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="اجرای مجدد انیمیشن"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              isPlaying ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' : 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'توقف پخش' : 'شروع پخش'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 text-slate-700 dark:text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Stage Canvas */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
        {/* Navigation Arrows */}
        {project.slides.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-teal-500 text-white hover:text-slate-950 border border-slate-700 shadow-2xl transition-all z-30 cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-teal-500 text-white hover:text-slate-950 border border-slate-700 shadow-2xl transition-all z-30 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Viewport Frame with AnimatePresence for transitions */}
        <AnimatePresence mode="wait">
        <motion.div
          key={`${activeSlide.id}-${keyCounter}`}
          {...(() => {
            const t = activeSlide.transition || 'fade';
            const variants: Record<string, any> = {
              fade:       { initial: { opacity: 0 },                animate: { opacity: 1 },                exit: { opacity: 0 } },
              slideLeft:  { initial: { opacity: 0, x: 200 },        animate: { opacity: 1, x: 0 },           exit: { opacity: 0, x: -200 } },
              slideRight: { initial: { opacity: 0, x: -200 },       animate: { opacity: 1, x: 0 },           exit: { opacity: 0, x: 200 } },
              zoomOut:    { initial: { opacity: 0, scale: 1.2 },    animate: { opacity: 1, scale: 1 },       exit: { opacity: 0, scale: 0.8 } },
              '3dCube':   { initial: { opacity: 0, rotateY: -45, scale: 0.9 }, animate: { opacity: 1, rotateY: 0, scale: 1 }, exit: { opacity: 0, rotateY: 45, scale: 0.9 } },
            };
            return variants[t] || variants.fade;
          })()}
          onClick={handleSlideClick}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            width: `${viewportWidths[deviceSize]}px`,
            height: `${project.height * scaleFactor}px`,
            background:
              activeSlide.background.type === 'image' || activeSlide.background.type === 'video'
                ? 'transparent'
                : activeSlide.background.gradient || activeSlide.background.color || '#0f172a',
            perspective: activeSlide.transition === '3dCube' ? '1200px' : undefined
          }}
          className="relative rounded-3xl overflow-hidden border-2 border-teal-500/30 shadow-2xl transition-all duration-300"
        >
          {/* Background Image - full when type is 'image', overlay otherwise */}
          {activeSlide.background.imageUrl && activeSlide.background.type === 'image' && (
            <img
              src={activeSlide.background.imageUrl}
              alt="slide background"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          )}

          {/* Particle Backdrop — show when type is 'particles' OR project addon is enabled */}
          {(project.addonParticles || activeSlide.background.type === 'particles') && (
            <AddonParticleCanvas preset={activeSlide.background.particlesPreset || 'stars'} opacity={0.6} />
          )}

          {/* Render Layers */}
          {activeSlide.layers
            .filter(l => l.visible)
            .map(layer => {
              // Calculate responsive overrides if present
              const override = layer.responsiveOverrides?.[
                (deviceSize === 'tablet' ? '900' : deviceSize === 'mobile' ? '576' : '1240') as BreakpointWidth
              ];

              if (override?.hidden) return null;

              const layerX = (override?.x ?? layer.x) * scaleFactor;
              const layerY = (override?.y ?? layer.y) * scaleFactor;
              const layerW = (override?.width ?? layer.width) * scaleFactor;
              const layerH = (override?.height ?? layer.height) * scaleFactor;
              const layerFontSize = (override?.fontSize ?? layer.fontSize) * scaleFactor;

              const animInPreset = layer.animation.inPreset;
              const animDuration = layer.animation.inDuration || 0.8;
              const animDelay = layer.animation.inDelay || 0;

              // Animation variants
              const getInitialAnimation = () => {
                const base = { rotate: layer.rotation };
                switch (animInPreset) {
                  case 'fadeIn':
                    return { ...base, opacity: 0 };
                  case 'slideUp':
                    return { ...base, opacity: 0, y: layerY + 80 };
                  case 'slideDown':
                    return { ...base, opacity: 0, y: layerY - 80 };
                  case 'slideLeft':
                    return { ...base, opacity: 0, x: layerX + 120 };
                  case 'slideRight':
                    return { ...base, opacity: 0, x: layerX - 120 };
                  case 'zoomIn':
                    return { ...base, opacity: 0, scale: 0.4 };
                  case 'zoomOut':
                    return { ...base, opacity: 0, scale: 1.5 };
                  default:
                    return { ...base, opacity: 0 };
                }
              };

              return (
                <motion.div
                  key={layer.id}
                  initial={getInitialAnimation()}
                  animate={{ opacity: layer.opacity, x: 0, y: 0, scale: 1, rotate: layer.rotation }}
                  transition={{
                    duration: animDuration,
                    delay: animDelay,
                    ease: layer.animation.inEasing === 'bounce' ? [0.68, -0.55, 0.265, 1.55] : 'easeOut'
                  }}
                  whileHover={
                    layer.animation.hoverEffect === 'glow'
                      ? { boxShadow: '0 0 25px rgba(56, 189, 248, 0.8)' }
                      : layer.animation.hoverEffect === 'lift'
                      ? { y: -8 }
                      : layer.animation.hoverEffect === 'tilt'
                      ? { rotate: 3, scale: 1.03 }
                      : {}
                  }
                  onClick={() => {
                    layer.interactions.forEach(int => {
                      if (int.action === 'jumpSlide' && int.targetSlideId) {
                        const targetIdx = project.slides.findIndex(s => s.id === int.targetSlideId);
                        if (targetIdx !== -1) {
                          setCurrentSlideIndex(targetIdx);
                          setKeyCounter(prev => prev + 1);
                        }
                      } else if (int.action === 'link' && int.targetUrl) {
                        window.open(int.targetUrl, '_blank');
                      }
                    });
                  }}
                  style={{
                    position: 'absolute',
                    left: `${layerX}px`,
                    top: `${layerY}px`,
                    width: `${layerW}px`,
                    height: `${layerH}px`,
                    fontSize: `${layerFontSize}px`,
                    fontFamily: layer.fontFamily,
                    fontWeight: layer.fontWeight,
                    color: layer.color,
                    backgroundColor: layer.backgroundColor,
                    borderRadius: `${layer.borderRadius * scaleFactor}px`,
                    padding: layer.padding,
                    zIndex: layer.zIndex,
                    boxShadow: layer.shadow,
                    cursor: layer.interactions.length > 0 ? 'pointer' : 'default'
                  }}
                  className="flex items-center justify-center transition-all duration-200"
                >
                  {layer.type === 'image' ? (
                    <img
                      src={layer.content}
                      alt={layer.name}
                      className="w-full h-full object-cover rounded-[inherit]"
                    />
                  ) : layer.type === 'video' ? (
                    <video
                      src={layer.content}
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-cover rounded-[inherit]"
                    />
                  ) : layer.type === 'button' ? (
                    <button className="w-full h-full font-black text-center flex items-center justify-center gap-2">
                      {layer.content}
                    </button>
                  ) : (
                    <div className="w-full h-full leading-snug">{layer.content}</div>
                  )}
                </motion.div>
              );
            })}
        </motion.div>
      </AnimatePresence>
      </div>

      {/* Bottom Indicator Dots */}
      <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/60 z-20">
        {project.slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => {
              setCurrentSlideIndex(idx);
              setKeyCounter(prev => prev + 1);
            }}
            className={`h-2.5 rounded-full transition-all cursor-pointer ${
              currentSlideIndex === idx ? 'w-8 bg-teal-600 dark:bg-teal-500' : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-500'
            }`}
            title={s.title}
          />
        ))}
      </div>
    </div>
  );
}
