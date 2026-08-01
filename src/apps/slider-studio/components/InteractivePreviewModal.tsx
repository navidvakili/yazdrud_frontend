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
import AutoPlayVideo from './AutoPlayVideo';
import { resolveStorageUrl } from '@/src/shared-utils';

interface InteractivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SliderProject;
}

// ── Text Animation Helpers ─────────────────────────────────────────

/** Detect Persian/Arabic script characters */
const HAS_PERSIAN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Split text into animatable units.
 * For Persian/Arabic: split by word (preserves joining forms).
 * For Latin: split by individual character.
 */
function splitTextUnits(text: string): string[] {
  if (HAS_PERSIAN.test(text)) {
    const parts = text.split(/(\s+)/).filter(Boolean);
    // Merge consecutive whitespace with their preceding word
    const merged: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      if (/^\s+$/.test(parts[i]) && merged.length > 0) {
        merged[merged.length - 1] += parts[i];
      } else {
        merged.push(parts[i]);
      }
    }
    return merged;
  }
  return [...text];
}

// ── Text Animation Components ──────────────────────────────────────

function TypewriterText({ text, duration, delay }: { text: string; duration: number; delay: number }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const totalChars = text.length;

  useEffect(() => {
    if (!text) return;
    setVisibleCount(0);
    const startTimer = setTimeout(() => {
      if (totalChars === 0) return;
      const charTime = Math.max((duration * 1000) / totalChars, 20);
      const interval = setInterval(() => {
        setVisibleCount(prev => {
          if (prev >= totalChars) { clearInterval(interval); return prev; }
          return prev + 1;
        });
      }, charTime);
      return () => clearInterval(interval);
    }, delay * 1000);
    return () => { clearTimeout(startTimer); };
  }, [text, duration, delay, totalChars]);

  return (
    <span dir="auto">
      <span>{text.slice(0, visibleCount)}</span>
      {visibleCount < totalChars && (
        <span className="inline-block w-[2px] h-[1em] bg-current animate-pulse mr-0.5 align-middle" />
      )}
    </span>
  );
}

function SplitWordText({ text, duration, delay }: { text: string; duration: number; delay: number }) {
  const words = text.split(' ');
  const stagger = words.length > 1 ? duration / words.length : duration;
  return (
    <span className="inline-flex flex-wrap" style={{ gap: '0.25em' }} dir="auto">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: Math.min(stagger, 0.5), delay: delay + i * stagger, ease: 'easeOut' }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

function SplitCharText({ text, duration, delay }: { text: string; duration: number; delay: number }) {
  const units = splitTextUnits(text);
  const stagger = units.length > 1 ? duration / units.length : duration;
  return (
    <span dir="auto">
      {units.map((unit, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: Math.min(stagger, 0.4), delay: delay + i * stagger, ease: 'easeOut' }}
          className="inline-block"
          style={{ whiteSpace: 'pre' as const }}
        >
          {unit}
        </motion.span>
      ))}
    </span>
  );
}

function RevealText({ text, duration, delay }: { text: string; duration: number; delay: number }) {
  return (
    <div className="overflow-hidden" style={{ display: 'inline-block' }}>
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration, delay, ease: 'easeOut' }}
      >
        {text}
      </motion.div>
    </div>
  );
}

function WaveText({ text, duration, delay }: { text: string; duration: number; delay: number }) {
  const units = splitTextUnits(text);
  const stagger = units.length > 1 ? (duration * 0.6) / units.length : duration;
  return (
    <span dir="auto">
      {units.map((unit, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: [40, -15, 0] }}
          transition={{ duration: 0.6, delay: delay + i * stagger, ease: 'easeOut', times: [0, 0.6, 1] }}
          className="inline-block"
          style={{ whiteSpace: 'pre' as const }}
        >
          {unit}
        </motion.span>
      ))}
    </span>
  );
}

function FlickerText({ text, duration, delay }: { text: string; duration: number; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.2, 1, 0.3, 1] }}
      transition={{ duration: duration || 1.5, delay, ease: 'linear', times: [0, 0.15, 0.3, 0.5, 0.7, 1] }}
    >
      {text}
    </motion.span>
  );
}

const TEXT_ANIM_PRESETS = new Set(['typewriter', 'splitWord', 'splitChar', 'reveal', 'wave', 'flicker']);

function isTextAnimationPreset(preset: string): boolean {
  return TEXT_ANIM_PRESETS.has(preset);
}

function TextAnimContent({ text, preset, duration, delay }: { text: string; preset: string; duration: number; delay: number }) {
  switch (preset) {
    case 'typewriter': return <TypewriterText text={text} duration={duration} delay={delay} />;
    case 'splitWord':  return <SplitWordText  text={text} duration={duration} delay={delay} />;
    case 'splitChar':  return <SplitCharText  text={text} duration={duration} delay={delay} />;
    case 'reveal':     return <RevealText     text={text} duration={duration} delay={delay} />;
    case 'wave':       return <WaveText       text={text} duration={duration} delay={delay} />;
    case 'flicker':    return <FlickerText    text={text} duration={duration} delay={delay} />;
    default:           return <>{text}</>;
  }
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
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [playbackTime, setPlaybackTime] = useState(0);

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

  // Playback clock — drives per-layer visibility windows so layers leave the
  // screen at the same time as in the editor timeline.
  useEffect(() => {
    if (!isOpen || !isPlaying) return;
    setPlaybackTime(0);
    const interval = setInterval(() => {
      setPlaybackTime(t => Number((t + 0.05).toFixed(2)));
    }, 50);
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, currentSlideIndex, keyCounter]);

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
              fade:        { initial: { opacity: 0 },                          animate: { opacity: 1 },                     exit: { opacity: 0 } },
              slideLeft:   { initial: { opacity: 0, x: 200 },                  animate: { opacity: 1, x: 0 },               exit: { opacity: 0, x: -200 } },
              slideRight:  { initial: { opacity: 0, x: -200 },                 animate: { opacity: 1, x: 0 },               exit: { opacity: 0, x: 200 } },
              zoomOut:     { initial: { opacity: 0, scale: 1.2 },              animate: { opacity: 1, scale: 1 },           exit: { opacity: 0, scale: 0.8 } },
              '3dCube':    { initial: { opacity: 0, rotateY: -45, scale: 0.9 }, animate: { opacity: 1, rotateY: 0, scale: 1 }, exit: { opacity: 0, rotateY: 45, scale: 0.9 } },
              blinds:      { initial: { opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' }, animate: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }, exit: { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' } },
              clipWipe:    { initial: { clipPath: 'inset(0 0 0 100%)' },       animate: { clipPath: 'inset(0 0 0 0%)' },     exit: { clipPath: 'inset(0 0 100% 0)' } },
              doors:       { initial: { opacity: 0, clipPath: 'inset(0 50% 0 50%)' }, animate: { opacity: 1, clipPath: 'inset(0 0% 0 0%)' }, exit: { opacity: 0, clipPath: 'inset(50% 0 50% 0)' } },
              iris:        { initial: { clipPath: 'circle(0% at 50% 50%)' },   animate: { clipPath: 'circle(100% at 50% 50%)' }, exit: { clipPath: 'circle(0% at 50% 50%)' } },
              irisClick:   { initial: { clipPath: 'circle(0% at 50% 50%)' },   animate: { clipPath: 'circle(100% at 50% 50%)' }, exit: { clipPath: 'circle(0% at 50% 50%)' } },
              mixed:       { initial: { opacity: 0, scale: 1.1, rotate: -5 },  animate: { opacity: 1, scale: 1, rotate: 0 },  exit: { opacity: 0, scale: 0.9, rotate: 5 } },
              pixels:      { initial: { opacity: 0, clipPath: 'inset(45% 45% 45% 45% round 20px)' }, animate: { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 0px)' }, exit: { opacity: 0, clipPath: 'inset(45% 45% 45% 45% round 20px)' } },
              scope:       { initial: { clipPath: 'circle(0% at 50% 50%)' },   animate: { clipPath: 'circle(100% at 50% 50%)' }, exit: { clipPath: 'circle(0% at 50% 50%)' } },
              shutter:     { initial: { clipPath: 'inset(50% 0% 50% 0%)' },    animate: { clipPath: 'inset(0% 0% 0% 0%)' },  exit: { clipPath: 'inset(50% 0% 50% 0%)' } },
              staggerWipe: { initial: { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, animate: { opacity: 1, clipPath: 'inset(0 0 0 0)' }, exit: { opacity: 0, clipPath: 'inset(100% 0 0 0)' } },
              wipe:        { initial: { clipPath: 'inset(0 100% 0 0)' },       animate: { clipPath: 'inset(0 0% 0 0)' },     exit: { clipPath: 'inset(0 0 0 100%)' } },
            };
            return variants[t] || variants.fade;
          })()}
          onClick={handleSlideClick}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            setMousePos({
              x: Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2))),
              y: Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2))),
            });
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            width: `${viewportWidths[deviceSize]}px`,
            height: `${project.height * scaleFactor}px`,
            background:
              activeSlide.background.gradient || activeSlide.background.color || '#0f172a',
            perspective: activeSlide.transition === '3dCube' || activeSlide.transition === 'doors' ? '1200px' : undefined
          }}
          className="relative rounded-3xl overflow-hidden border-2 border-teal-500/30 shadow-2xl transition-all duration-300"
        >
          {/* Background Image - full when type is 'image', overlay otherwise */}
          {activeSlide.background.imageUrl && activeSlide.background.type === 'image' && (
            <img
              src={resolveStorageUrl(activeSlide.background.imageUrl)}
              alt="slide background"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          )}

          {/* Background Video — full when type is 'video' */}
          {activeSlide.background.type === 'video' && activeSlide.background.videoUrl && (
            <AutoPlayVideo
              src={activeSlide.background.videoUrl}
              playing={isPlaying}
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

              // Exit window — the layer leaves the screen after its exit animation
              const hasOut = (layer.animation.outPreset || 'none') !== 'none' && (layer.animation.outDuration || 0) > 0;
              const windowEnd = hasOut
                ? animDelay + animDuration + (layer.animation.outDelay || 0) + (layer.animation.outDuration || 0)
                : null;
              const isWindowEnded = windowEnd !== null && playbackTime >= windowEnd;

              const inEase =
                layer.animation.inEasing === 'bounce' ? [0.68, -0.55, 0.265, 1.55] as const
                : layer.animation.inEasing === 'elastic' ? [0.68, -0.6, 0.32, 1.55] as const
                : layer.animation.inEasing === 'easeInOut' ? [0.42, 0, 0.58, 1] as const
                : layer.animation.inEasing === 'easeIn' ? [0.4, 0, 1, 1] as const
                : layer.animation.inEasing === 'linear' ? 'linear'
                : 'easeOut';

              // Animation variants
              const getInitialAnimation = () => {
                const base = { rotate: layer.rotation };
                switch (animInPreset) {
                  case 'none':
                    return { ...base, opacity: layer.opacity ?? 1 };
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
                  case 'bounceIn':
                    return { ...base, opacity: 0, scale: 0.6 };
                  case 'typewriter':
                  case 'splitWord':
                  case 'splitChar':
                  case 'reveal':
                  case 'wave':
                  case 'flicker':
                    return { ...base, opacity: 1 };
                  default:
                    return { ...base, opacity: 0 };
                }
              };

              const animKey = `${layer.id}-anim-${layer.animation.inPreset}-${layer.animation.inDuration}-${layer.animation.inDelay}-${layer.animation.inEasing}`;

              return (
                <motion.div
                  key={animKey}
                  initial={getInitialAnimation()}
                  animate={isWindowEnded ? { opacity: 0 } : { opacity: layer.opacity, x: 0, y: 0, scale: 1, rotate: layer.rotation }}
                  transition={isWindowEnded
                    ? { duration: Math.max(0.2, layer.animation.outDuration || 0.5), delay: 0, ease: 'easeIn' }
                    : { duration: animDuration, delay: animDelay, ease: inEase }}
                  whileHover={
                    layer.animation.hoverEffect === 'glow'
                      ? { boxShadow: '0 0 25px rgba(56, 189, 248, 0.8)' }
                      : layer.animation.hoverEffect === 'lift'
                      ? { y: -8 }
                      : layer.animation.hoverEffect === 'tilt'
                      ? { rotate: 3, scale: 1.03 }
                      : layer.animation.hoverEffect === 'scale'
                      ? { scale: 1.08 }
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
                        window.open(int.targetUrl, int.openInNewTab !== false ? '_blank' : '_self');
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
                    borderRadius: `${(layer.borderRadius ?? 0) * scaleFactor}px`,
                    border: `${(layer.borderWidth ?? 0) * scaleFactor}px solid ${layer.borderColor ?? 'transparent'}`,
                    padding: layer.padding ?? '0px',
                    zIndex: layer.zIndex,
                    boxShadow: layer.shadow,
                    cursor: layer.interactions.length > 0 ? 'pointer' : 'default'
                  }}
                  className="transition-all duration-200"
                >
                  {/* Parallax inner */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    ...(layer.animation.parallaxDepth ? {
                      transform: `translate(${mousePos.x * (layer.animation.parallaxDepth / 100) * 40}px, ${mousePos.y * (layer.animation.parallaxDepth / 100) * 40}px)`,
                      transition: 'transform 0.15s ease-out',
                    } : {}),
                  }}>
                  {/* Layer Background */}
                  {(layer.backgroundColor !== 'transparent' || layer.backgroundGradient) && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: layer.backgroundGradient || layer.backgroundColor,
                        borderRadius: `${(layer.borderRadius ?? 0) * scaleFactor}px`,
                        opacity: layer.backgroundOpacity !== undefined ? layer.backgroundOpacity / 100 : 1,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  {/* Layer Content */}
                  <div className="w-full h-full flex items-center justify-center relative z-[1]">
                    {layer.type === 'image' ? (
                      <img
                        src={resolveStorageUrl(layer.content)}
                        alt={layer.name}
                        className="w-full h-full object-cover rounded-[inherit]"
                      />
                    ) : layer.type === 'video' ? (
                      <AutoPlayVideo
                        src={layer.content}
                        playing={isPlaying}
                        className="w-full h-full object-cover rounded-[inherit]"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex relative z-[1]"
                        style={{
                          alignItems: layer.alignVertical === 'top' ? 'flex-start' : layer.alignVertical === 'bottom' ? 'flex-end' : 'center',
                          justifyContent: layer.textAlign === 'right' ? 'right' : layer.textAlign === 'left' ? 'left' : 'center',
                          textAlign: layer.textAlign || 'center',
                          ...(layer.type === 'button' ? { gap: '0.5rem' } : {}),
                        }}
                      >
                        {layer.type === 'button' ? (
                          <button className="w-full h-full cursor-pointer" style={{ background: 'none', border: 'none', color: 'inherit' }}>
                            {layer.content}
                          </button>
                        ) : isTextAnimationPreset(animInPreset) ? (
                          <div className="w-full leading-snug flex" style={{ justifyContent: layer.textAlign === 'right' ? 'right' : layer.textAlign === 'left' ? 'left' : 'center' }}>
                            <TextAnimContent text={layer.content} preset={animInPreset} duration={animDuration} delay={animDelay} />
                          </div>
                        ) : (
                          <div className="w-full leading-snug">{layer.content}</div>
                        )}
                      </div>
                    )}
                  </div>
                  </div>{/* end parallax */}
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
