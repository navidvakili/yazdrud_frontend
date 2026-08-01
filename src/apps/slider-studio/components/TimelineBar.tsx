import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, Sparkles } from 'lucide-react';
import type { Layer, Slide } from '@/src/shared-types/slider-studio';

interface TimelineBarProps {
  slide: Slide;
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (updated: Layer) => void;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export default function TimelineBar({
  slide,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  currentTime,
  setCurrentTime,
  isPlaying,
  setIsPlaying
}: TimelineBarProps) {
  const maxDuration = slide.duration || 6.0;

  // Playback timer ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= maxDuration) {
          return 0; // Loop back
        }
        return Number((prev + 0.05).toFixed(2));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, maxDuration, setCurrentTime]);

  // ── Horizontal zoom: fixed pixels-per-second so long slides scroll ──
  // With % widths a 66s slide is squeezed into the panel and later times
  // become unreadable — we now use a fixed scale + horizontal scroll.
  const PX_PER_SEC = 24;
  const LABELS_WIDTH = 224; // w-56 = 14rem = 224px
  const tracksWidth = maxDuration * PX_PER_SEC;

  /** Convert a viewport X coordinate to a timeline time (seconds).
   *  Uses the tracks element rect (which accounts for scroll), so it works
   *  whether the timeline is scrolled or not. */
  const timeFromClientX = (clientX: number) => {
    const el = tracksRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(maxDuration, (rect.right - clientX) / PX_PER_SEC));
  };

  // ── Seek: move the playhead by dragging it or clicking the ruler ──
  const [isSeeking, setIsSeeking] = useState(false);
  useEffect(() => {
    if (!isSeeking) return;
    const move = (e: MouseEvent) => {
      setCurrentTime(timeFromClientX(e.clientX));
    };
    const up = () => {
      setIsSeeking(false);
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 0);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };
  }, [isSeeking, maxDuration]);

  // ── Drag-to-resize timeline bars ─────────────────────────────────
  const [dragState, setDragState] = useState<{ layerId: string; handle: 'left' | 'right' } | null>(null);
  const trackAreaRef = useRef<HTMLDivElement>(null);
  const rulerScrollRef = useRef<HTMLDivElement>(null);
  // Suppresses the click that follows a drag (bar resize or playhead scrub)
  const justDraggedRef = useRef(false);
  // Tracks area (right of the labels column) — the coordinate system that the
  // ruler ticks, layer bars and the playhead all share. The labels column (w-56)
  // is excluded so times map 1:1 to the ruler.
  const tracksRef = useRef<HTMLDivElement>(null);

  /** True when the layer has a configured exit (out) animation. */
  const hasOutAnim = (layer: Layer) =>
    (layer.animation.outPreset || 'none') !== 'none' && (layer.animation.outDuration || 0) > 0;

  /** Extra time after the in-animation while the layer is still on screen:
   *  outDelay + outDuration — counted ONLY when an exit animation is configured
   *  (the dormant outDelay=5 default must not affect layers that stay until the
   *  end of the slide — that was the bug that made every bar show 5.8s). */
  const getLayerTail = (layer: Layer) => {
    if (!hasOutAnim(layer)) return 0;
    return (layer.animation.outDelay || 0) + (layer.animation.outDuration || 0);
  };

  const slideRef = useRef(slide);
  slideRef.current = slide;
  const updateRef = useRef(onUpdateLayer);
  updateRef.current = onUpdateLayer;
  const maxDurRef = useRef(maxDuration);
  maxDurRef.current = maxDuration;

  useEffect(() => {
    if (!dragState) return;
    const handleMouseMove = (e: MouseEvent) => {
      // Measure against the tracks area ONLY (excludes the w-56 labels column)
      // so the dragged time matches the ruler and the playhead exactly.
      const time = timeFromClientX(e.clientX);
      const layer = slideRef.current.layers.find(l => l.id === dragState.layerId);
      if (!layer) return;
      const inDelay = layer.animation.inDelay || 0;
      const inDuration = layer.animation.inDuration || 0.8;
      const tail = getLayerTail(layer);
      const windowEnd = hasOutAnim(layer) ? inDelay + inDuration + tail : maxDurRef.current;
      if (dragState.handle === 'left') {
        // Dragging the bar's end → set when the layer leaves the screen.
        if (hasOutAnim(layer)) {
          const outDur = layer.animation.outDuration || 0;
          const newOutDelay = Math.max(0, Math.min(
            time - inDelay - inDuration - outDur,
            Math.max(0, maxDurRef.current - inDelay - inDuration - outDur)
          ));
          updateRef.current({
            ...layer,
            animation: { ...layer.animation, outDelay: Number(newOutDelay.toFixed(2)) }
          });
        } else {
          // No exit animation: shortening the bar enables a fade-out at that time.
          const outDur = 0.5;
          const newOutDelay = Math.max(0, time - inDelay - inDuration - outDur);
          updateRef.current({
            ...layer,
            animation: {
              ...layer.animation,
              outPreset: 'fadeIn', // rendered as a fade-out
              outDuration: outDur,
              outDelay: Number(newOutDelay.toFixed(2)),
            }
          });
        }
      } else {
        // Dragging the bar's start → changes the start delay
        const newDelay = Math.max(0, Math.min(time, Math.max(0, windowEnd - 0.1)));
        updateRef.current({
          ...layer,
          animation: { ...layer.animation, inDelay: Number(newDelay.toFixed(2)) }
        });
      }
    };
    const handleMouseUp = () => {
      setDragState(null);
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 0);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  return (
    <div className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 text-slate-800 dark:text-white font-sans text-xs select-none flex flex-col h-56 rtl text-right transition-colors">
      {/* Timeline Header Controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              isPlaying
                ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                : 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md shadow-teal-500/20'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'توقف موقت (Pause)' : 'پخش انیمیشن (Play)'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="توقف کامل و بازگشت به شروع (Stop & Rewind)"
          >
            <Square className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 font-mono text-xs bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800" title="زمان فعلی / Current Time">
            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="text-teal-700 dark:text-teal-300 font-bold">{currentTime.toFixed(2)}s</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="text-slate-500 dark:text-slate-400">{maxDuration.toFixed(1)}s</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>تایم‌لاین انیمیشن سینمایی لایه‌ها (Timeline Animation Engine)</span>
        </div>
      </div>

      {/* Main Timeline Tracks Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Fixed header row: labels spacer + time ruler (scrolls horizontally) */}
        <div className="flex shrink-0">
          <div className="w-56 shrink-0 bg-slate-50 dark:bg-slate-900/70 border-l border-gray-200 dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
            <span>زمان (Time)</span>
          </div>
          <div ref={rulerScrollRef} className="flex-1 overflow-hidden">
            <div
              className="relative h-7 border-b border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 font-mono text-[9px] text-slate-500 cursor-pointer"
              style={{ width: tracksWidth }}
              onClick={e => setCurrentTime(timeFromClientX(e.clientX))}
              title="برای جابجایی خط زمان کلیک کنید / Click to seek"
            >
              {/* Minor ticks every second */}
              {Array.from({ length: Math.ceil(maxDuration) + 1 }).map((_, i) => (
                <div
                  key={i}
                  style={{ right: i * PX_PER_SEC }}
                  className="absolute top-0 bottom-0 border-r border-gray-200 dark:border-slate-800/40"
                />
              ))}
              {/* Labels every 5 seconds */}
              {Array.from({ length: Math.floor(maxDuration / 5) + 1 }).map((_, k) => (
                <div
                  key={k}
                  style={{ right: k * 5 * PX_PER_SEC }}
                  className="absolute top-0 bottom-0 flex items-center justify-center border-r border-gray-300 dark:border-slate-700/60"
                >
                  <span className="pr-1 bg-slate-50/70 dark:bg-slate-900/50">{k * 5}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable area — horizontal scroll for long slides, labels stay pinned */}
        <div
          ref={trackAreaRef}
          className="flex-1 overflow-auto relative"
          onScroll={() => {
            if (rulerScrollRef.current && trackAreaRef.current) {
              rulerScrollRef.current.scrollLeft = trackAreaRef.current.scrollLeft;
            }
          }}
        >
          <div className="flex relative min-h-full" style={{ minWidth: LABELS_WIDTH + tracksWidth }}>
            {/* Track Labels — pinned while the tracks scroll */}
            <div className="w-56 shrink-0 sticky right-0 z-10 bg-slate-50 dark:bg-slate-900/70 border-l border-gray-200 dark:border-slate-800">
              <div className="h-7 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-3 text-[9px] font-bold text-slate-500 dark:text-slate-400">
                <span>لایه‌ها (Layers)</span>
                <span>انیمیشن (Anim)</span>
              </div>
              {slide.layers.map(layer => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => onSelectLayer(layer.id)}
                    className={`h-10 px-3 flex items-center justify-between border-b border-gray-200 dark:border-slate-800/60 cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold border-l-2 border-l-teal-600 dark:border-l-teal-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="truncate text-[11px]">{layer.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800" title="انیمیشن ورود / In-Anim">
                      {layer.animation.inPreset} (In)
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right Tracks */}
            <div ref={tracksRef} className="relative bg-white dark:bg-slate-950" style={{ width: tracksWidth, minHeight: '100%' }}>
              {/* Time Scrubber — draggable playhead */}
              <div
                style={{ right: currentTime * PX_PER_SEC }}
                onMouseDown={e => {
                  e.stopPropagation();
                  setIsSeeking(true);
                }}
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 cursor-ew-resize shadow-[0_0_10px_#f43f5e]"
                title="خط زمان را بکشید / Drag to scrub"
              >
                <div className="w-3 h-3 bg-rose-500 rounded-full -mr-1.25 -mt-1 shadow-lg" />
              </div>

              {slide.layers.map(layer => {
                const isSelected = selectedLayerId === layer.id;
                const delay = layer.animation.inDelay || 0;
                const inDuration = layer.animation.inDuration || 0.8;
                const tail = getLayerTail(layer);
                // Full presence window: with an exit animation it ends after the
                // out-tail; without one the layer stays until the slide ends.
                const windowEnd = hasOutAnim(layer) ? delay + inDuration + tail : maxDuration;
                const windowDur = Math.max(0.1, windowEnd - delay);
                const barLeft = delay * PX_PER_SEC;
                const barWidth = Math.max(2, windowDur * PX_PER_SEC);
                const inWidth = Math.max(0, inDuration * PX_PER_SEC);

                return (
                  <div
                    key={layer.id}
                    onClick={e => {
                      if (justDraggedRef.current) return;
                      onSelectLayer(layer.id);
                      setCurrentTime(timeFromClientX(e.clientX));
                    }}
                    className={`h-10 border-b border-gray-200 dark:border-slate-800/40 relative flex items-center cursor-pointer ${
                      isSelected ? 'bg-slate-100/80 dark:bg-slate-900/60' : ''
                    }`}
                  >
                    {/* Duration Bar */}
                    <div
                      style={{
                        right: barLeft,
                        width: barWidth,
                      }}
                      className={`group h-6 rounded-lg transition-all flex items-center justify-between px-1 text-[10px] font-mono shadow-xs relative overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-l from-teal-500 to-cyan-400 text-slate-950 font-black border border-teal-300'
                          : 'bg-indigo-600 text-white dark:bg-indigo-600/60 dark:text-indigo-100 border border-indigo-400 dark:border-indigo-500/40'
                      }`}
                    >
                      {/* Muted portion — hold / exit, or "visible until slide end" */}
                      <div
                        className="absolute inset-y-0 left-0 bg-black opacity-25 pointer-events-none"
                        style={{ width: `${barWidth > 0 ? Math.max(0, (1 - inWidth / barWidth) * 100) : 0}%` }}
                      />

                      {/* Left drag handle — changes when the layer leaves */}
                      <div
                        onMouseDown={e => {
                          e.stopPropagation();
                          setDragState({ layerId: layer.id, handle: 'left' });
                        }}
                        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="انتهای نوار = زمان خروج لایه / Bar end (layer exit)"
                      >
                        <div className="w-0.5 h-4 rounded-full bg-white/80" />
                      </div>

                      <span className="truncate mx-3 pointer-events-none select-none">{windowDur.toFixed(1)}s</span>

                      {/* Right drag handle — changes delay */}
                      <div
                        onMouseDown={e => {
                          e.stopPropagation();
                          setDragState({ layerId: layer.id, handle: 'right' });
                        }}
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="آغاز نوار = تأخیر شروع لایه / Bar start (delay)"
                      >
                        <div className="w-0.5 h-4 rounded-full bg-white/80" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
