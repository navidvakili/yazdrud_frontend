import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RotateCcw, Clock, Layers, Sparkles } from 'lucide-react';
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

  // Convert time to percentage on ruler
  const getPercent = (sec: number) => Math.min(100, Math.max(0, (sec / maxDuration) * 100));

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
            <span>{isPlaying ? 'توقف' : 'پخش انیمیشن'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="توقف کامل و بازگشت به شروع"
          >
            <Square className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 font-mono text-xs bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-800">
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
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Track Names Column */}
        <div className="w-56 bg-slate-50 dark:bg-slate-900/70 border-l border-gray-200 dark:border-slate-800 overflow-y-auto">
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
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-gray-200 dark:border-slate-800">
                  {layer.animation.inPreset}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Time Grid & Bars */}
        <div className="flex-1 overflow-x-auto relative flex flex-col bg-white dark:bg-slate-950">
          {/* Time Ruler Top Header */}
          <div className="h-7 border-b border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 relative flex items-center font-mono text-[10px] text-slate-500">
            {Array.from({ length: Math.ceil(maxDuration) + 1 }).map((_, i) => (
              <div
                key={i}
                style={{ right: `${getPercent(i)}%` }}
                className="absolute top-0 bottom-0 flex flex-col items-center justify-center border-r border-gray-200 dark:border-slate-800/50 pr-1"
              >
                <span>{i}s</span>
              </div>
            ))}
          </div>

          {/* Time Scrubber Red Cursor Line */}
          <div
            style={{ right: `${getPercent(currentTime)}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_10px_#f43f5e]"
          >
            <div className="w-3 h-3 bg-rose-500 rounded-full -mr-1.25 -mt-1 shadow-lg" />
          </div>

          {/* Layer Tracks */}
          <div className="flex-1 overflow-y-auto relative">
            {slide.layers.map(layer => {
              const isSelected = selectedLayerId === layer.id;
              const delay = layer.animation.inDelay || 0;
              const duration = layer.animation.inDuration || 0.8;

              const leftPercent = getPercent(delay);
              const widthPercent = getPercent(duration);

              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`h-10 border-b border-gray-200 dark:border-slate-800/40 relative flex items-center cursor-pointer ${
                    isSelected ? 'bg-slate-100/80 dark:bg-slate-900/60' : ''
                  }`}
                >
                  {/* Duration Bar */}
                  <div
                    style={{
                      right: `${leftPercent}%`,
                      width: `${widthPercent}%`
                    }}
                    className={`h-6 rounded-lg transition-all flex items-center justify-between px-2 text-[10px] font-mono shadow-xs ${
                      isSelected
                        ? 'bg-gradient-to-l from-teal-500 to-cyan-400 text-slate-950 font-black border border-teal-300'
                        : 'bg-indigo-600 text-white dark:bg-indigo-600/60 dark:text-indigo-100 border border-indigo-400 dark:border-indigo-500/40'
                    }`}
                  >
                    <span className="truncate">{duration.toFixed(1)}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
