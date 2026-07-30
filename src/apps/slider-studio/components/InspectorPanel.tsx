import React, { useState } from 'react';
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
  Monitor
} from 'lucide-react';
import type { Layer, LayerType, AnimationPreset, AnimationEasing, InteractionTrigger, InteractionActionType, Slide, SlideBackground, BreakpointWidth } from '@/src/shared-types/slider-studio';

interface InspectorPanelProps {
  selectedLayer: Layer | null;
  onUpdateLayer: (updated: Layer) => void;
  onDeleteLayer: (layerId: string) => void;
  slide: Slide | null;
  onUpdateSlide: (updated: Slide) => void;
  allSlides: { id: string; title: string }[];
}

export default function InspectorPanel({
  selectedLayer,
  onUpdateLayer,
  onDeleteLayer,
  slide,
  onUpdateSlide,
  allSlides
}: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'style' | 'anim' | 'interaction' | 'parallax' | 'responsive'>('style');
  const [activeBreakpoint, setActiveBreakpoint] = useState<BreakpointWidth>('1240');

  if (!selectedLayer) {
    // ---- Slide-level settings when no layer is selected ----
    if (!slide) {
      return (
        <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 space-y-3 font-sans rtl transition-colors">
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/80 text-teal-600 dark:text-teal-400 border border-gray-200 dark:border-slate-700/50 shadow-xs">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">هیچ المانی انتخاب نشده است</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            برای ویرایش ویژگی‌ها، فونت، انیمیشن و تعاملات، روی یکی از لایه‌های بوم کلیک کنید.
          </p>
        </div>
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
                type="number"
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
              <>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">رنگ پایه</label>
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
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">مقدار گرادینت CSS</label>
                  <textarea
                    rows={2}
                    value={slide.background.gradient}
                    onChange={e => updateSlideBackground({ ...slide.background, gradient: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:border-teal-500 focus:outline-none"
                    placeholder="linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
                  />
                </div>
              </>
            )}

            {/* Image (for 'image' type) */}
            {slide.background.type === 'image' && (
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">آدرس URL تصویر پس‌زمینه</label>
                <input
                  type="text"
                  value={slide.background.imageUrl || ''}
                  onChange={e => updateSlideBackground({ ...slide.background, imageUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:border-teal-500 focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            )}

            {/* Video (for 'video' type) */}
            {slide.background.type === 'video' && (
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">آدرس URL ویدیوی پس‌زمینه</label>
                <input
                  type="text"
                  value={slide.background.videoUrl || ''}
                  onChange={e => updateSlideBackground({ ...slide.background, videoUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:border-teal-500 focus:outline-none"
                  placeholder="https://..."
                />
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
      </div>
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
    <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full text-slate-800 dark:text-slate-200 font-sans text-right rtl select-none overflow-hidden transition-colors">
      {/* Header Path */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono tracking-wider uppercase font-bold">Element Path</div>
          <div className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[180px]">{selectedLayer.name}</div>
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
              ) : (
                <input
                  type="text"
                  value={selectedLayer.content}
                  onChange={e => updateField('content', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                />
              )}
            </div>

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
                      type="number"
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
                    type="number"
                    value={selectedLayer.x}
                    onChange={e => updateField('x', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">موقعیت Y</label>
                  <input
                    type="number"
                    value={selectedLayer.y}
                    onChange={e => updateField('y', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">عرض (Width)</label>
                  <input
                    type="number"
                    value={selectedLayer.width}
                    onChange={e => updateField('width', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">ارتفاع (Height)</label>
                  <input
                    type="number"
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
                    type="number"
                    value={selectedLayer.rotation}
                    onChange={e => updateField('rotation', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">ترتیب لایه (Z-Index)</label>
                  <input
                    type="number"
                    value={selectedLayer.zIndex}
                    onChange={e => updateField('zIndex', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Background & Border */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800/80 space-y-3">
              <div className="font-extrabold text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                <Palette className="w-3.5 h-3.5" />
                <span>رنگ پس‌زمینه و شعاع گردی</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">رنگ پس‌زمینه</label>
                  <input
                    type="text"
                    value={selectedLayer.backgroundColor}
                    onChange={e => updateField('backgroundColor', e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">شعاع گردی (px)</label>
                  <input
                    type="number"
                    value={selectedLayer.borderRadius}
                    onChange={e => updateField('borderRadius', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
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
                  <option value="fadeIn">Fade In (محو شدن)</option>
                  <option value="slideUp">Slide Up (حرکت از پایین)</option>
                  <option value="slideDown">Slide Down (حرکت از بالا)</option>
                  <option value="slideLeft">Slide Left (حرکت از راست به چپ)</option>
                  <option value="slideRight">Slide Right (حرکت از چپ به راست)</option>
                  <option value="zoomIn">Zoom In (زوم از داخل)</option>
                  <option value="zoomOut">Zoom Out (زوم از بیرون)</option>
                  <option value="bounceIn">Bounce In (پرش بانس)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">مدت زمان (ثانیه)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedLayer.animation.inDuration}
                    onChange={e => updateAnimField('inDuration', Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 dark:text-slate-400">تأخیر شروع (ثانیه)</label>
                  <input
                    type="number"
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
                  <option value="bounce">Bounce (فنری)</option>
                  <option value="easeInOut">Ease In Out</option>
                  <option value="linear">Linear (خطی)</option>
                </select>
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
                        <option value="openModal">باز کردن پاپ‌آپ</option>
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
  );
}
