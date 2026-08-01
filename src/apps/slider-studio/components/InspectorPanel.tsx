import React, { useState } from 'react';
import GradientPicker from './GradientPicker';
import {
  Type,
  Move,
  Sparkles,
  Zap,
  MousePointer,
  Eye,
  Lock,
  Layers,
  Palette,
  LayoutGrid,
  Link,
  Plus,
  Trash2,
  Maximize2,
  RotateCw,
  Compass,
  Sliders,
  Smartphone,
  Tablet,
  Monitor,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Sun,
  Video,
  Shapes,
  Route
} from 'lucide-react';
import { MediaManager } from '@/src/shared-components';
import type { Layer, LayerType, AnimationPreset, AnimationEasing, InteractionTrigger, InteractionActionType, LayerInteraction, Slide, SlideBackground, BreakpointWidth } from '@/src/shared-types/slider-studio';
import ShapePicker from './ShapePicker';
import { MOTION_PATH_PRESETS } from '../constants/motionPath';
import type { MotionPathPresetMode } from '../constants/motionPath';

interface InspectorPanelProps {
  selectedLayer: Layer | null;
  onUpdateLayer: (updated: Layer) => void;
  onDeleteLayer: (layerId: string) => void;
  slide: Slide | null;
  onUpdateSlide: (updated: Slide) => void;
  allSlides: { id: string; title: string }[];
  canvasWidth: number;
  canvasHeight: number;
  /** Called when the user asks to draw a custom motion path on the canvas. */
  onStartPathDraw?: () => void;
  /** Called with a preset path mode to generate and save a motion path. */
  onApplyPathPreset?: (mode: MotionPathPresetMode) => void;
}

export default function InspectorPanel({
  selectedLayer,
  onUpdateLayer,
  onDeleteLayer,
  slide,
  onUpdateSlide,
  allSlides,
  canvasWidth,
  canvasHeight,
  onStartPathDraw,
  onApplyPathPreset
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'anim' | 'interaction' | 'parallax' | 'responsive'>('style');
  const [activeBreakpoint, setActiveBreakpoint] = useState<BreakpointWidth>('1240');
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'layer' | 'slideBg' | null>(null);

  // ---- Helper to handle media selection ----
  const handleMediaSelect = (url: string) => {
    if (mediaPickerTarget === 'layer' && selectedLayer) {
      onUpdateLayer({ ...selectedLayer, content: url });
    } else if (mediaPickerTarget === 'slideBg' && slide) {
      if (slide.background.type === 'video') {
        onUpdateSlide({ ...slide, background: { ...slide.background, videoUrl: url } });
      } else {
        onUpdateSlide({ ...slide, background: { ...slide.background, imageUrl: url } });
      }
    }
    setMediaPickerTarget(null);
  };

  if (!selectedLayer) {
    // ---- Slide-level settings when no layer is selected ----
    if (!slide) {
      return (
        <>
          <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 space-y-3 font-sans rtl transition-colors">
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 text-teal-600 dark:text-teal-400 border border-gray-200 dark:border-slate-700/50 shadow-xs">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">هیچ المانی انتخاب نشده است</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              برای ویرایش ویژگی‌ها، فونت، انیمیشن و تعاملات، روی یکی از لایه‌های بوم کلیک کنید.
            </p>
          </div>
          <MediaManager
            open={mediaPickerTarget === 'slideBg'}
            onClose={() => setMediaPickerTarget(null)}
            onSelect={handleMediaSelect}
            filter="image"
            title="انتخاب تصویر پس‌زمینه اسلاید"
          />
        </>
      );
    }

    // Helper updater for slide fields
    const updateSlideField = (field: keyof Slide, value: any) => {
      onUpdateSlide({ ...slide, [field]: value });
    };

    const updateSlideBackground = (bg: SlideBackground) => {
      onUpdateSlide({ ...slide, background: bg });
    };

    return (
      <>
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full text-slate-800 dark:text-slate-200 font-sans text-right rtl select-none overflow-hidden transition-colors">
        {/* Header Path */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono tracking-wider uppercase font-bold">Slide Settings</div>
            <div className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[180px]">تنظیمات اسلاید</div>
          </div>
        </div>

        {/* Slide Settings Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Slide Title */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
            <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
              <span>عنوان و مدت زمان اسلاید</span>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">عنوان اسلاید</label>
              <input
                type="text"
                value={slide.title}
                onChange={e => updateSlideField('title', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">مدت زمان نمایش (ثانیه)</label>
              <input
                type="number" dir="ltr"
                step="0.5"
                min="1"
                value={slide.duration}
                onChange={e => updateSlideField('duration', Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Transition */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
            <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
              <span>ترنزیشن (انتقال)</span>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">نوع ترنزیشن</label>
              <select
                value={slide.transition}
                onChange={e => updateSlideField('transition', e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
              >
                <option value="fade">Fade (محو شدن)</option>
                <option value="slideLeft">Slide Left (حرکت به چپ)</option>
                <option value="slideRight">Slide Right (حرکت به راست)</option>
                <option value="zoomOut">Zoom Out (زوم بیرون)</option>
                <option value="3dCube">3D Cube (مکعب سه بعدی)</option>
                <option value="blinds">Blinds (کرکره عمودی)</option>
                <option value="clipWipe">Clip Wipe (پاک شدن)</option>
                <option value="doors">Doors (درهای بازشونده)</option>
                <option value="iris">Iris (عنبیه)</option>
                <option value="irisClick">Iris Click (عنبیه سریع)</option>
                <option value="mixed">Mixed (ترکیبی)</option>
                <option value="pixels">Pixels (پیکسلی)</option>
                <option value="scope">Scope (دوربین)</option>
                <option value="shutter">Shutter (کرکره افقی)</option>
                <option value="staggerWipe">Stagger Wipe (پاک شدن پله‌ای)</option>
                <option value="wipe">Wipe (پاک شدن ساده)</option>
              </select>
            </div>
          </div>

          {/* Background Settings */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
            <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
              <span>پس‌زمینه اسلاید</span>
            </div>

            {/* Background Type */}
            <div>
              <label className="text-[10px] text-slate-500 dark:text-slate-400">نوع پس‌زمینه</label>
              <select
                value={slide.background.type}
                onChange={e => updateSlideBackground({ ...slide.background, type: e.target.value as SlideBackground['type'] })}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
              >
                <option value="color">رنگ ثابت</option>
                <option value="gradient">گرادینت</option>
                <option value="image">تصویر</option>
                <option value="video">ویدیو</option>
                <option value="particles">ذرات (پارتیکل)</option>
              </select>
            </div>

            {/* Color (for 'color' type) */}
            {slide.background.type === 'color' && (
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">رنگ پس‌زمینه</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={slide.background.color}
                    onChange={e => updateSlideBackground({ ...slide.background, color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={slide.background.color}
                    onChange={e => updateSlideBackground({ ...slide.background, color: e.target.value })}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            )}

            {/* Gradient (for 'gradient' type) */}
            {slide.background.type === 'gradient' && (
              <GradientPicker
                value={slide.background.gradient || ''}
                onChange={(css) => updateSlideBackground({ ...slide.background, gradient: css })}
              />
            )}

            {/* Image (for 'image' type) */}
            {slide.background.type === 'image' && (
              <>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">آدرس URL تصویر پس‌زمینه</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slide.background.imageUrl || ''}
                      onChange={e => updateSlideBackground({ ...slide.background, imageUrl: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:border-teal-500 focus:outline-none"
                      placeholder="https://..."
                    />
                    <button
                      onClick={() => setMediaPickerTarget('slideBg')}
                      className="shrink-0 p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 transition-colors cursor-pointer"
                      title="انتخاب تصویر از مدیریت رسانه"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Fallback color/gradient for when image hasn't loaded yet */}
                <div className="pt-1">
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">رنگ/گرادینت ذخیره (نمایش در زمان لود نشدن تصویر)</label>
                  <div className="mt-1.5">
                    <GradientPicker
                      value={slide.background.gradient || `linear-gradient(135deg, ${slide.background.color} 0%, ${slide.background.color} 100%)`}
                      onChange={(css) => updateSlideBackground({ ...slide.background, gradient: css })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Video (for 'video' type) */}
            {slide.background.type === 'video' && (
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">آدرس URL ویدیوی پس‌زمینه</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={slide.background.videoUrl || ''}
                    onChange={e => updateSlideBackground({ ...slide.background, videoUrl: e.target.value })}
                    className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:border-teal-500 focus:outline-none"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => setMediaPickerTarget('slideBg')}
                    className="shrink-0 p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 transition-colors cursor-pointer"
                    title="انتخاب ویدیو از مدیریت رسانه"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Particles (for 'particles' type) */}
            {slide.background.type === 'particles' && (
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">پریست ذرات</label>
                <select
                  value={slide.background.particlesPreset || 'stars'}
                  onChange={e => updateSlideBackground({ ...slide.background, particlesPreset: e.target.value as SlideBackground['particlesPreset'] })}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                >
                  <option value="stars">ستاره‌ها (Stars)</option>
                  <option value="bubbles">حباب (Bubbles)</option>
                  <option value="snow">برف (Snow)</option>
                  <option value="geometric">اشکال هندسی (Geometric)</option>
                  <option value="waves">امواج (Waves)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ---- Slide-level Interactions ---- */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-teal-600 dark:text-teal-400 text-[11px]">رویدادهای اسلاید</span>
            <button
              onClick={() => {
                const existing = slide.interactions || [];
                const newInt: LayerInteraction = {
                  id: `int-${Date.now()}`,
                  trigger: 'slideLoad',
                  action: 'jumpSlide',
                  targetSlideId: allSlides[0]?.id || ''
                };
                updateSlideField('interactions', [...existing, newInt]);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>افزودن رویداد</span>
            </button>
          </div>

          {(!slide.interactions || slide.interactions.length === 0) ? (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-center text-slate-500 text-[11px]">
              هیچ رویدادی برای اسلاید ثبت نشده است.
            </div>
          ) : (
            slide.interactions.map((int, idx) => (
              <div key={int.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-teal-600 dark:text-teal-400">
                  <span>رویداد {idx + 1}</span>
                  <button
                    onClick={() => {
                      const updated = (slide.interactions || []).filter(i => i.id !== int.id);
                      updateSlideField('interactions', updated);
                    }}
                    className="text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">رویداد (Trigger)</label>
                    <select
                      value={int.trigger}
                      onChange={e => {
                        const updated = (slide.interactions || []).map(item =>
                          item.id === int.id ? { ...item, trigger: e.target.value as InteractionTrigger } : item
                        );
                        updateSlideField('interactions', updated);
                      }}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                    >
                      <option value="slideLoad">بارگذاری اسلاید (Slide Load)</option>
                      <option value="click">کلیک (Click)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">عملیات (Action)</label>
                    <select
                      value={int.action}
                      onChange={e => {
                        const updated = (slide.interactions || []).map(item =>
                          item.id === int.id ? { ...item, action: e.target.value as InteractionActionType } : item
                        );
                        updateSlideField('interactions', updated);
                      }}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                    >
                      <option value="jumpSlide">پرش به اسلاید دیگر</option>
                      <option value="link">هدایت به لینک خارجی</option>
                    </select>
                  </div>
                </div>

                {int.action === 'jumpSlide' && (
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">اسلاید مقصد</label>
                    <select
                      value={int.targetSlideId || ''}
                      onChange={e => {
                        const updated = (slide.interactions || []).map(item =>
                          item.id === int.id ? { ...item, targetSlideId: e.target.value } : item
                        );
                        updateSlideField('interactions', updated);
                      }}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                    >
                      {allSlides.map(s => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {int.action === 'link' && (
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">آدرس URL مقصد</label>
                    <input
                      type="text"
                      value={int.targetUrl || ''}
                      onChange={e => {
                        const updated = (slide.interactions || []).map(item =>
                          item.id === int.id ? { ...item, targetUrl: e.target.value } : item
                        );
                        updateSlideField('interactions', updated);
                      }}
                      placeholder="https://..."
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <MediaManager
        open={mediaPickerTarget === 'slideBg'}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={handleMediaSelect}
        filter={slide.background.type === 'video' ? 'video' : 'image'}
        title={slide.background.type === 'video' ? 'انتخاب ویدیوی پس‌زمینه اسلاید' : 'انتخاب تصویر پس‌زمینه اسلاید'}
      />
      </>
    );
  }

  // Helper updater
  const updateField = (field: keyof Layer, value: any) => {
    onUpdateLayer({ ...selectedLayer, [field]: value });
  };

  const updateAnimField = (field: string, value: any) => {
    onUpdateLayer({
      ...selectedLayer,
      animation: { ...selectedLayer.animation, [field]: value }
    });
  };

  // Add Interaction
  const handleAddInteraction = () => {
    const newInteraction = {
      id: `int-${Date.now()}`,
      trigger: 'click' as InteractionTrigger,
      action: 'jumpSlide' as InteractionActionType,
      targetSlideId: allSlides[0]?.id || ''
    };
    onUpdateLayer({
      ...selectedLayer,
      interactions: [...selectedLayer.interactions, newInteraction]
    });
  };

  const handleRemoveInteraction = (id: string) => {
    onUpdateLayer({
      ...selectedLayer,
      interactions: selectedLayer.interactions.filter(i => i.id !== id)
    });
  };

  return (
    <>
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full text-slate-800 dark:text-slate-200 font-sans text-right rtl select-none overflow-hidden transition-colors">
      {/* Header Path */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono tracking-wider uppercase font-bold">Element Path</div>
          <input
            type="text"
            value={selectedLayer.name}
            onChange={e => updateField('name', e.target.value)}
            className="text-xs font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-500 dark:focus:border-teal-400 outline-none transition-colors max-w-[180px] truncate"
            dir="auto"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => updateField('locked', !selectedLayer.locked)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              selectedLayer.locked ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
            title="قفل کردن لایه"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={() => updateField('visible', !selectedLayer.visible)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              !selectedLayer.visible ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
            }`}
            title="نمایش/پنهان‌سازی"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteLayer(selectedLayer.id)}
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
            title="حذف لایه"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-5 p-1 bg-slate-100 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('style')}
          className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
            activeTab === 'style' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          استایل
        </button>
        <button
          onClick={() => setActiveTab('anim')}
          className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
            activeTab === 'anim' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          انیمیشن
        </button>
        <button
          onClick={() => setActiveTab('interaction')}
          className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
            activeTab === 'interaction' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          رویداد
        </button>
        <button
          onClick={() => setActiveTab('parallax')}
          className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
            activeTab === 'parallax' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          پارالاکس
        </button>
        <button
          onClick={() => setActiveTab('responsive')}
          className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
            activeTab === 'responsive' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          واکنشگرا
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-5 text-xs">
        {/* TAB 1: STYLE & CONTENT */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            {/* Layer Content */}
            <div className="space-y-1.5">
              <label className="text-slate-500 dark:text-slate-400 font-bold block text-[11px]">محتوای لایه / متن / لینک تصویر</label>
              {selectedLayer.type === 'text' || selectedLayer.type === 'button' ? (
                <textarea
                  rows={3}
                  value={selectedLayer.content}
                  onChange={e => updateField('content', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                />
              ) : selectedLayer.type === 'image' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedLayer.content}
                    onChange={e => updateField('content', e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:border-teal-500 focus:outline-none"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => setMediaPickerTarget('layer')}
                    className="shrink-0 p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 transition-colors cursor-pointer"
                    title="انتخاب تصویر از مدیریت رسانه"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : selectedLayer.type === 'video' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedLayer.content}
                    onChange={e => updateField('content', e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:border-teal-500 focus:outline-none"
                    placeholder="https://..."
                  />
                  <button
                    onClick={() => setMediaPickerTarget('layer')}
                    className="shrink-0 p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 transition-colors cursor-pointer"
                    title="انتخاب ویدئو از مدیریت رسانه"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              ) : selectedLayer.type === 'rectangle' || selectedLayer.type === 'shape' ? (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                  {selectedLayer.type === 'shape'
                    ? 'این لایه یک شکل هندسی است و محتوای متنی ندارد'
                    : 'این لایه رنگ است و محتوای متنی ندارد'}
                </div>
              ) : (
                <input
                  type="text"
                  value={selectedLayer.content}
                  onChange={e => updateField('content', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                />
              )}
            </div>

            {/* Shape Selector — choose another geometric preset for shape layers */}
            {selectedLayer.type === 'shape' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-2">
                <div className="font-extrabold text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-1 text-[11px]">
                  <Shapes className="w-3.5 h-3.5" />
                  <span>شکل هندسی (Shape)</span>
                </div>
                <ShapePicker value={selectedLayer.shape} onChange={s => updateField('shape', s)} columns={5} />
              </div>
            )}

            {/* Typography Controls */}
            {(selectedLayer.type === 'text' || selectedLayer.type === 'button') && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
                <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                  <Type className="w-3.5 h-3.5" />
                  <span>تایپوگرافی و فونت</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">نام فونت</label>
                    <select
                      value={selectedLayer.fontFamily}
                      onChange={e => updateField('fontFamily', e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                    >
                      <option value="Vazirmatn, sans-serif">وزیرمتن (فارسی)</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Impact, sans-serif">Impact (برجسته)</option>
                      <option value="Allemand, serif">Allemand</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">اندازه فونت (px)</label>
                    <input
                      type="number" dir="ltr"
                      value={selectedLayer.fontSize}
                      onChange={e => updateField('fontSize', Number(e.target.value))}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">رنگ متن</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedLayer.color}
                        onChange={e => updateField('color', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={selectedLayer.color}
                        onChange={e => updateField('color', e.target.value)}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">وزن فونت</label>
                    <select
                      value={selectedLayer.fontWeight}
                      onChange={e => updateField('fontWeight', e.target.value)}
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs cursor-pointer"
                    >
                      <option value="400">عادی (400)</option>
                      <option value="600">نیمه‌برجسته (600)</option>
                      <option value="800">برجسته (800)</option>
                      <option value="900">فوق‌برجسته (900)</option>
                    </select>
                  </div>
                </div>

                {/* Horizontal & Vertical Alignment */}
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">تراز افقی</label>
                  <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-1">
                    <button
                      onClick={() => updateField('textAlign', 'right')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLayer.textAlign === 'right' ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                      <span>راست</span>
                    </button>
                    <button
                      onClick={() => updateField('textAlign', 'center')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLayer.textAlign === 'center' ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      <span>وسط</span>
                    </button>
                    <button
                      onClick={() => updateField('textAlign', 'left')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedLayer.textAlign === 'left' ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>چپ</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400 mb-1 block">تراز عمودی</label>
                  <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-1">
                    <button
                      onClick={() => updateField('alignVertical', 'top')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        (selectedLayer.alignVertical ?? 'center') === 'top' ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
                      <span>بالا</span>
                    </button>
                    <button
                      onClick={() => updateField('alignVertical', 'center')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        (selectedLayer.alignVertical ?? 'center') === 'center' ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
                      <span>وسط</span>
                    </button>
                    <button
                      onClick={() => updateField('alignVertical', 'bottom')}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        (selectedLayer.alignVertical ?? 'center') === 'bottom' ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
                      <span>پایین</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Position & Dimensions */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
              <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                <Move className="w-3.5 h-3.5" />
                <span>موقعیت و ابعاد (X, Y, W, H)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">موقعیت X</label>
                  <input
                    type="number" dir="ltr"
                    value={selectedLayer.x}
                    onChange={e => updateField('x', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">موقعیت Y</label>
                  <input
                    type="number" dir="ltr"
                    value={selectedLayer.y}
                    onChange={e => updateField('y', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">عرض (Width)</label>
                  <input
                    type="number" dir="ltr"
                    value={selectedLayer.width}
                    onChange={e => updateField('width', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">ارتفاع (Height)</label>
                  <input
                    type="number" dir="ltr"
                    value={selectedLayer.height}
                    onChange={e => updateField('height', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">چرخش (درجه)</label>
                  <input
                    type="number" dir="ltr"
                    value={selectedLayer.rotation}
                    onChange={e => updateField('rotation', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">ترتیب لایه (Z-Index)</label>
                  <input
                    type="number" dir="ltr"
                    value={selectedLayer.zIndex}
                    onChange={e => updateField('zIndex', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Fill Slide Button */}
              <button
                onClick={() => {
                  onUpdateLayer({
                    ...selectedLayer,
                    x: 0,
                    y: 0,
                    width: canvasWidth,
                    height: canvasHeight
                  });
                }}
                className="w-full py-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 hover:bg-teal-100 dark:hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 font-extrabold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer border border-teal-200 dark:border-teal-500/30 transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>پر کردن اسلاید</span>
              </button>
            </div>

            {/* Background & Border */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
              <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                <Palette className="w-3.5 h-3.5" />
                <span>پس‌زمینه، خط دور و فاصله داخلی</span>
              </div>

              {/* Layer Background Type Selector */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">نوع پس‌زمینه</label>
                <select
                  value={
                    selectedLayer.backgroundColor === 'transparent' && !selectedLayer.backgroundGradient
                      ? 'transparent'
                      : selectedLayer.backgroundGradient
                      ? 'gradient'
                      : 'color'
                  }
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'transparent') {
                      onUpdateLayer({ ...selectedLayer, backgroundColor: 'transparent', backgroundGradient: undefined });
                    } else if (val === 'color') {
                      onUpdateLayer({ ...selectedLayer, backgroundColor: '#1e293b', backgroundGradient: undefined });
                    } else {
                      onUpdateLayer({ ...selectedLayer, backgroundColor: '#0f172a', backgroundGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' });
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                >
                  <option value="transparent">بدون (شفاف)</option>
                  <option value="color">رنگ ثابت</option>
                  <option value="gradient">گرادینت</option>
                </select>
              </div>

              {/* Solid Color Picker */}
              {selectedLayer.backgroundColor !== 'transparent' && !selectedLayer.backgroundGradient && (
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">رنگ پس‌زمینه</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedLayer.backgroundColor}
                      onChange={e => updateField('backgroundColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={selectedLayer.backgroundColor}
                      onChange={e => updateField('backgroundColor', e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}

              {/* Gradient Picker */}
              {selectedLayer.backgroundGradient && (
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">گرادینت پس‌زمینه</label>
                  <div className="mt-1">
                    <GradientPicker
                      value={selectedLayer.backgroundGradient}
                      onChange={(css) => updateField('backgroundGradient', css)}
                    />
                  </div>
                  {/* Fallback color for gradient */}
                  <div className="mt-2">
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">رنگ جایگزین</label>
                    <div className="flex items-center gap-2 mt-0.5">
                      <input
                        type="color"
                        value={selectedLayer.backgroundColor === 'transparent' ? '#0f172a' : selectedLayer.backgroundColor}
                        onChange={e => updateField('backgroundColor', e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                      />
                      <input
                        type="text"
                        value={selectedLayer.backgroundColor === 'transparent' ? '#0f172a' : selectedLayer.backgroundColor}
                        onChange={e => updateField('backgroundColor', e.target.value)}
                        className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Background Opacity Slider */}
              {selectedLayer.backgroundColor !== 'transparent' && (
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">شفافیت پس‌زمینه: {selectedLayer.backgroundOpacity ?? 100}%</label>
                  <input
                    type="range"
                    dir="ltr"
                    min="0"
                    max="100"
                    value={selectedLayer.backgroundOpacity ?? 100}
                    onChange={e => updateField('backgroundOpacity', Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-teal-600"
                  />
                </div>
              )}

              {/* Preview Swatch */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">پیش‌نمایش</label>
                <div
                  className="w-full h-8 rounded-xl border border-gray-300 dark:border-slate-700"
                  style={{
                    background: selectedLayer.backgroundGradient || selectedLayer.backgroundColor,
                    opacity: (selectedLayer.backgroundOpacity ?? 100) / 100,
                  }}
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">شعاع گردی (px)</label>
                <input
                  type="number" dir="ltr"
                  value={selectedLayer.borderRadius}
                  onChange={e => updateField('borderRadius', Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Border Width — auto-reveal a visible color when thickness is raised from 0 while the color is transparent (default) */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">ضخامت خط دور (px)</label>
                <input
                  type="number" dir="ltr"
                  min="0"
                  value={selectedLayer.borderWidth ?? 0}
                  onChange={e => {
                    const v = Math.max(0, Number(e.target.value));
                    const updates: Partial<Layer> = { borderWidth: v };
                    if (v > 0 && (!selectedLayer.borderColor || selectedLayer.borderColor === 'transparent')) {
                      updates.borderColor = '#ffffff';
                    }
                    onUpdateLayer({ ...selectedLayer, ...updates });
                  }}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Border Color */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">رنگ خط دور</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={!selectedLayer.borderColor || selectedLayer.borderColor === 'transparent' ? '#0f172a' : selectedLayer.borderColor}
                    onChange={e => updateField('borderColor', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                  />
                  <input
                    type="text"
                    value={selectedLayer.borderColor ?? 'transparent'}
                    onChange={e => updateField('borderColor', e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Padding — uniform (all sides), px appended automatically so the value is always valid CSS */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">فاصله داخلی (همه جهات - px)</label>
                <input
                  type="number" dir="ltr"
                  min="0"
                  value={(() => {
                    const p = parseFloat(String(selectedLayer.padding ?? '0'));
                    return Number.isFinite(p) && p > 0 ? p : 0;
                  })()}
                  onChange={e => updateField('padding', `${Math.max(0, Number(e.target.value))}px`)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Shadow Settings */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
              <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                <Sun className="w-3.5 h-3.5" />
                <span>تنظیمات سایه</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">نوع سایه</label>
                <select
                  value={(() => {
                    const s = selectedLayer.shadow;
                    if (s === 'none') return 'none';
                    if (s === '0 2px 4px rgba(0,0,0,0.1)') return 'soft';
                    if (s === '0 4px 8px rgba(0,0,0,0.15)') return 'medium';
                    if (s === '0 10px 20px rgba(0,0,0,0.25)') return 'hard';
                    return 'custom';
                  })()}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'none') updateField('shadow', 'none');
                    else if (val === 'soft') updateField('shadow', '0 2px 4px rgba(0,0,0,0.1)');
                    else if (val === 'medium') updateField('shadow', '0 4px 8px rgba(0,0,0,0.15)');
                    else if (val === 'hard') updateField('shadow', '0 10px 20px rgba(0,0,0,0.25)');
                    else if (val === 'custom') updateField('shadow', '0 0 15px rgba(59,130,246,0.5)');
                  }}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                >
                  <option value="none">بدون سایه</option>
                  <option value="soft">نرم (Soft)</option>
                  <option value="medium">متوسط (Medium)</option>
                  <option value="hard">سخت (Hard)</option>
                  <option value="custom">سفارشی</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">مقدار دلخواه CSS</label>
                <input
                  type="text" dir="ltr"
                  value={selectedLayer.shadow === 'none' ? '' : selectedLayer.shadow}
                  onChange={e => updateField('shadow', e.target.value || 'none')}
                  placeholder="مثال: 0 0 15px rgba(59,130,246,0.5)"
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANIMATIONS */}
        {activeTab === 'anim' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
              <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>انیمیشن ورودی (In-Animation)</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">پریست انیمیشن</label>
                <select
                  value={selectedLayer.animation.inPreset}
                  onChange={e => updateAnimField('inPreset', e.target.value as AnimationPreset)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                >
                  <option value="none">بدون انیمیشن</option>
                  <option value="fadeIn">Fade In (محو شدن)</option>
                  <option value="slideUp">Slide Up (حرکت از پایین)</option>
                  <option value="slideDown">Slide Down (حرکت از بالا)</option>
                  <option value="slideLeft">Slide Left (حرکت از راست به چپ)</option>
                  <option value="slideRight">Slide Right (حرکت از چپ به راست)</option>
                  <option value="zoomIn">Zoom In (زوم از داخل)</option>
                  <option value="zoomOut">Zoom Out (زوم از بیرون)</option>
                  <option value="bounceIn">Bounce In (پرش بانس)</option>
                  <option value="typewriter">Typewriter (تایپ رایتر)</option>
                  <option value="splitWord">Split Word (کلمات مجزا)</option>
                  <option value="splitChar">Split Char (حروف مجزا)</option>
                  <option value="reveal">Reveal (آشکار شدن)</option>
                  <option value="wave">Wave (موج)</option>
                  <option value="flicker">Flicker (سوسو زدن)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">مدت زمان (ثانیه)</label>
                  <input
                    type="number" dir="ltr"
                    step="0.1"
                    value={selectedLayer.animation.inDuration}
                    onChange={e => updateAnimField('inDuration', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">تأخیر شروع (ثانیه)</label>
                  <input
                    type="number" dir="ltr"
                    step="0.1"
                    value={selectedLayer.animation.inDelay}
                    onChange={e => updateAnimField('inDelay', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">منحنی نرم‌کننده (Easing)</label>
                <select
                  value={selectedLayer.animation.inEasing}
                  onChange={e => updateAnimField('inEasing', e.target.value as AnimationEasing)}
                  className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                >
                  <option value="easeOut">Ease Out (نرم و ملایم)</option>
                  <option value="easeIn">Ease In (نرم شروع)</option>
                  <option value="easeInOut">Ease In Out</option>
                  <option value="bounce">Bounce (فنری)</option>
                  <option value="elastic">Elastic (کشسان)</option>
                  <option value="linear">Linear (خطی)</option>
                </select>
              </div>
            </div>

            {/* Motion Path */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
              <div className="font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-[11px]">
                <Route className="w-3.5 h-3.5" />
                <span>مسیر حرکت سفارشی (Motion Path)</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                با رسم مسیر (یا انتخاب الگوی آماده)، لایه در طول نمایش اسلاید به‌صورت حلقوی روی آن حرکت می‌کند.
                خط مسیر روی بوم نمایش داده می‌شود؛ نقطه سبز = شروع و نقطه قرمز = پایان (قابل کشیدن)،
                و دستگیره‌های گوشهٔ کادر آبی، کل مسیر را به‌صورت یکپارچه بزرگ/کوچک می‌کنند.
              </p>

              {/* Preset path templates */}
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">الگوهای آماده</label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {MOTION_PATH_PRESETS.map(p => (
                    <button
                      key={p.mode}
                      onClick={() => onApplyPathPreset?.(p.mode)}
                      title={p.hint}
                      className="px-2 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedLayer.animation.motionPath && selectedLayer.animation.motionPath.points.length >= 2 ? (
                <>
                  <div>
                    <label className="text-[10px] text-slate-500 dark:text-slate-400">مدت هر دور (ثانیه)</label>
                    <input
                      type="number" dir="ltr"
                      step="0.1" min="0.1"
                      value={selectedLayer.animation.motionPath.duration ?? selectedLayer.animation.inDuration}
                      onChange={e =>
                        updateAnimField('motionPath', {
                          ...selectedLayer.animation.motionPath!,
                          duration: Number(e.target.value) || 2,
                        })
                      }
                      className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onStartPathDraw?.()}
                      className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] cursor-pointer"
                    >
                      ویرایش مسیر
                    </button>
                    <button
                      onClick={() => updateAnimField('motionPath', undefined)}
                      className="px-3 py-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-[11px] cursor-pointer"
                    >
                      حذف مسیر
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => onStartPathDraw?.()}
                  className="w-full px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Route className="w-3.5 h-3.5" />
                  رسم مسیر جدید
                </button>
              )}
            </div>

            {/* Out-Animation */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
              <div className="font-extrabold text-rose-500 dark:text-rose-400 flex items-center gap-1 text-[11px]">
                <RotateCw className="w-3.5 h-3.5" />
                <span>انیمیشن خروجی (Out-Animation)</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                اگر «بدون خروج» باشد، لایه تا انتهای زمان اسلاید روی صفحه می‌ماند. برای محو شدن در زمان مشخص، نوع خروج را انتخاب و زمان آن را تنظیم کنید.
              </p>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">نوع خروج</label>
                <select
                  value={selectedLayer.animation.outPreset || 'none'}
                  onChange={e => updateAnimField('outPreset', e.target.value as AnimationPreset)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                >
                  <option value="none">بدون خروج (تا انتهای اسلاید بماند)</option>
                  <option value="fadeIn">Fade Out (محو شدن)</option>
                  <option value="slideUp">Slide Up (خروج به بالا)</option>
                  <option value="slideDown">Slide Down (خروج به پایین)</option>
                  <option value="slideLeft">Slide Left (خروج به چپ)</option>
                  <option value="slideRight">Slide Right (خروج به راست)</option>
                  <option value="zoomIn">Zoom In (کوچک و محو)</option>
                  <option value="zoomOut">Zoom Out (بزرگ و محو)</option>
                  <option value="rotateIn">Rotate (چرخش و محو)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">تأخیر خروج (ثانیه)</label>
                  <input
                    type="number" dir="ltr" step="0.1" min="0"
                    value={selectedLayer.animation.outDelay}
                    onChange={e => updateAnimField('outDelay', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">مدت خروج (ثانیه)</label>
                  <input
                    type="number" dir="ltr" step="0.1" min="0"
                    value={selectedLayer.animation.outDuration}
                    onChange={e => updateAnimField('outDuration', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Hover Effects */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
              <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                <MousePointer className="w-3.5 h-3.5" />
                <span>افکت هاور ماوس (Hover Animation)</span>
              </div>

              <div>
                <select
                  value={selectedLayer.animation.hoverEffect || 'none'}
                  onChange={e => updateAnimField('hoverEffect', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                >
                  <option value="none">بدون افکت</option>
                  <option value="glow">Glow (درخشش نورانی)</option>
                  <option value="lift">Lift (صعود به بالا)</option>
                  <option value="tilt">Tilt (چرخش ۳ بعدی ۳D)</option>
                  <option value="scale">Scale (بزرگ‌نمایی)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INTERACTIONS */}
        {activeTab === 'interaction' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 dark:text-white text-xs">تعاملات و اکشن‌های کلیک/هاور</span>
              <button
                onClick={handleAddInteraction}
                className="px-3 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن اکشن</span>
              </button>
            </div>

            {selectedLayer.interactions.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-center text-slate-500 text-xs">
                هیچ تعاملی ثبت نشده است. روی دکمه «افزودن اکشن» کلیک کنید.
              </div>
            ) : (
              selectedLayer.interactions.map((int, idx) => (
                <div key={int.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    <span>اکشن شماره {idx + 1}</span>
                    <button
                      onClick={() => handleRemoveInteraction(int.id)}
                      className="text-rose-500 hover:text-rose-600 dark:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400">رویداد (Trigger)</label>
                      <select
                        value={int.trigger}
                        onChange={e => {
                          const updated = selectedLayer.interactions.map(item =>
                            item.id === int.id ? { ...item, trigger: e.target.value as InteractionTrigger } : item
                          );
                          updateField('interactions', updated);
                        }}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                      >
                        <option value="click">کلیک (Click)</option>
                        <option value="hover">هاور (Hover)</option>
                        <option value="scroll">اسکرول (Scroll)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400">عملیات (Action)</label>
                      <select
                        value={int.action}
                        onChange={e => {
                          const updated = selectedLayer.interactions.map(item =>
                            item.id === int.id ? { ...item, action: e.target.value as InteractionActionType } : item
                          );
                          updateField('interactions', updated);
                        }}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                      >
                        <option value="jumpSlide">پرش به اسلاید دیگر</option>
                        <option value="link">هدایت به لینک خارجی</option>
                      </select>
                    </div>
                  </div>

                  {int.action === 'jumpSlide' && (
                    <div>
                      <label className="text-[10px] text-slate-500 dark:text-slate-400">اسلاید مقصد</label>
                      <select
                        value={int.targetSlideId || ''}
                        onChange={e => {
                          const updated = selectedLayer.interactions.map(item =>
                            item.id === int.id ? { ...item, targetSlideId: e.target.value } : item
                          );
                          updateField('interactions', updated);
                        }}
                        className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs cursor-pointer"
                      >
                        {allSlides.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {int.action === 'link' && (
                    <>
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400">آدرس URL مقصد</label>
                        <input
                          type="text"
                          value={int.targetUrl || ''}
                          onChange={e => {
                            const updated = selectedLayer.interactions.map(item =>
                              item.id === int.id ? { ...item, targetUrl: e.target.value } : item
                            );
                            updateField('interactions', updated);
                          }}
                          placeholder="https://..."
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
                        <label className="text-[10px] text-slate-500 dark:text-slate-400">باز شدن در صفحه جدید</label>
                        <input
                          type="checkbox"
                          checked={int.openInNewTab !== false}
                          onChange={e => {
                            const updated = selectedLayer.interactions.map(item =>
                              item.id === int.id ? { ...item, openInNewTab: e.target.checked } : item
                            );
                            updateField('interactions', updated);
                          }}
                          className="w-4 h-4 accent-teal-600 dark:accent-teal-500 cursor-pointer"
                        />
                      </div>
                    </>
                  )}

                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: PARALLAX */}
        {activeTab === 'parallax' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
              <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                <Compass className="w-3.5 h-3.5" />
                <span>افکت حرکت پارالاکس ماوس (Mouse Track Parallax)</span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                با حرکت دادن نشانگر ماوس رو صفحه، این لایه بر اساس شدت عمق تعریف‌شده جابه‌جا می‌شود.
              </p>

              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300 mb-1">
                  <span>عمق پارالاکس:</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">{selectedLayer.animation.parallaxDepth || 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayer.animation.parallaxDepth || 0}
                  onChange={e => updateAnimField('parallaxDepth', Number(e.target.value))}
                  className="w-full accent-teal-600 dark:accent-teal-500 cursor-pointer"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: RESPONSIVE OVERRIDES */}
        {activeTab === 'responsive' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
              <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                <Sliders className="w-3.5 h-3.5" />
                <span>اورراید ویژه رزولوشن‌ها (Breakpoints)</span>
              </div>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-gray-200 dark:border-slate-800 text-[10px]">
                <button
                  onClick={() => setActiveBreakpoint('1240')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeBreakpoint === '1240' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  1240px
                </button>
                <button
                  onClick={() => setActiveBreakpoint('900')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeBreakpoint === '900' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  900px
                </button>
                <button
                  onClick={() => setActiveBreakpoint('768')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeBreakpoint === '768' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  768px
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                <span>مخفی‌سازی لایه در این سایز:</span>
                <input
                  type="checkbox"
                  checked={!!selectedLayer.responsiveOverrides?.[activeBreakpoint]?.hidden}
                  onChange={e => {
                    const currentOverrides = selectedLayer.responsiveOverrides || ({} as any);
                    const bpOverride = currentOverrides[activeBreakpoint] || {};
                    onUpdateLayer({
                      ...selectedLayer,
                      responsiveOverrides: {
                        ...currentOverrides,
                        [activeBreakpoint]: { ...bpOverride, hidden: e.target.checked }
                      }
                    });
                  }}
                  className="w-4 h-4 accent-teal-600 dark:accent-teal-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
      <MediaManager
        open={mediaPickerTarget === 'layer'}
        onClose={() => setMediaPickerTarget(null)}
        onSelect={handleMediaSelect}
        filter={selectedLayer.type === 'image' ? 'image' : selectedLayer.type === 'video' ? 'video' : 'all'}
        title={selectedLayer.type === 'image' ? 'انتخاب تصویر لایه' : selectedLayer.type === 'video' ? 'انتخاب ویدیوی لایه' : 'انتخاب رسانه لایه'}
      />
    </>
  );
}
