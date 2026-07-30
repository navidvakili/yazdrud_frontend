import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Type,
  Image as ImageIcon,
  Square,
  Play,
  Video,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Layers,
  Sparkles,
  Download,
  Settings,
  FolderOpen,
  Code,
  Sliders,
  Monitor,
  Tablet,
  Smartphone,
  Search,
  Maximize2,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Grid,
  Zap,
  CheckCircle2,
  ArrowRight,
  MousePointer,
  HelpCircle,
  Clock,
  Sparkle
} from 'lucide-react';
import type { SliderProject, Slide, Layer, LayerType, BreakpointWidth } from '@/src/shared-types/slider-studio';
import { INITIAL_SLIDER_PROJECTS } from '../data/presetTemplates';
import InspectorPanel from './InspectorPanel';
import TimelineBar from './TimelineBar';
import AddonParticleCanvas from './AddonParticleCanvas';
import TemplateLibraryModal from './TemplateLibraryModal';
import CodeExportModal from './CodeExportModal';
import InteractivePreviewModal from './InteractivePreviewModal';

interface SliderStudioProps {
  initialProject?: SliderProject | null;
  onSave?: (project: SliderProject) => void;
  onBack?: () => void;
}

export default function SliderStudio({ initialProject, onSave, onBack }: SliderStudioProps) {
  // Project State
  const [project, setProject] = useState<SliderProject>(
    () => initialProject || INITIAL_SLIDER_PROJECTS[0]
  );
  const [activeSlideId, setActiveSlideId] = useState<string>(
    () => initialProject?.slides[0]?.id || INITIAL_SLIDER_PROJECTS[0].slides[0].id
  );
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    () => {
      const firstSlide = initialProject?.slides[0];
      return firstSlide?.layers[0]?.id
        || INITIAL_SLIDER_PROJECTS[0].slides[0].layers[0]?.id
        || null;
    }
  );

  // Sync state when initialProject changes (e.g. after async load)
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
      setActiveSlideId(
        initialProject.slides[0]?.id || INITIAL_SLIDER_PROJECTS[0].slides[0].id
      );
      setSelectedLayerId(
        initialProject.slides[0]?.layers[0]?.id
          || INITIAL_SLIDER_PROJECTS[0].slides[0].layers[0]?.id
          || null
      );
    }
  }, [initialProject]);

  // Sidebar visibility
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);

  // Timeline & Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showTimeline, setShowTimeline] = useState<boolean>(true);

  // Viewport & Breakpoints
  const [activeBreakpoint, setActiveBreakpoint] = useState<BreakpointWidth>('1240');
  const [layerSearchQuery, setLayerSearchQuery] = useState<string>('');

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Dragging layer state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; layerX: number; layerY: number } | null>(null);

  // Active slide reference
  const activeSlide: Slide =
    project.slides.find(s => s.id === activeSlideId) || project.slides[0];

  // Selected layer reference
  const selectedLayer: Layer | null =
    activeSlide.layers.find(l => l.id === selectedLayerId) || null;

  // Viewport widths
  const viewportWidths: Record<BreakpointWidth, number> = {
    '1240': 1240,
    '1024': 1024,
    '900': 900,
    '768': 768,
    '576': 576,
    '380': 380
  };

  const canvasWidth = viewportWidths[activeBreakpoint];
  const canvasHeight = project.height;

  // Layer Update Handler
  const handleUpdateLayer = (updated: Layer) => {
    const updatedLayers = activeSlide.layers.map(l => (l.id === updated.id ? updated : l));
    const updatedSlides = project.slides.map(s => (s.id === activeSlide.id ? { ...s, layers: updatedLayers } : s));
    setProject({ ...project, slides: updatedSlides });
  };

  // Add New Layer
  const handleAddLayer = (type: LayerType) => {
    const newLayerId = `layer-${Date.now()}`;
    let newContent = 'متن جدید';
    if (type === 'image') newContent = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=600';
    if (type === 'button') newContent = 'دکمه اقدام به عمل';
    if (type === 'video') newContent = 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-digital-grid-41235-large.mp4';

    const newLayer: Layer = {
      id: newLayerId,
      name: `لایه ${type.toUpperCase()} ${activeSlide.layers.length + 1}`,
      type,
      x: 150 + activeSlide.layers.length * 20,
      y: 150 + activeSlide.layers.length * 20,
      width: type === 'button' ? 200 : type === 'image' || type === 'video' ? 360 : 300,
      height: type === 'button' ? 55 : type === 'image' || type === 'video' ? 240 : 80,
      rotation: 0,
      opacity: 1,
      zIndex: activeSlide.layers.length + 10,
      locked: false,
      visible: true,
      content: newContent,
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: type === 'button' ? 16 : 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'right',
      color: type === 'button' ? '#0f172a' : '#ffffff',
      backgroundColor: type === 'button' ? '#38bdf8' : 'transparent',
      borderRadius: type === 'button' ? 16 : 0,
      borderWidth: 0,
      borderColor: 'transparent',
      padding: '0px',
      shadow: 'none',
      animation: {
        inPreset: 'fadeIn',
        inDuration: 0.8,
        inDelay: 0.2,
        inEasing: 'easeOut',
        outPreset: 'none' as any,
        outDuration: 0.5,
        outDelay: 5.0,
        hoverEffect: type === 'button' ? 'glow' : 'none',
        parallaxDepth: 20
      },
      interactions: []
    };

    const updatedLayers = [...activeSlide.layers, newLayer];
    const updatedSlides = project.slides.map(s => (s.id === activeSlide.id ? { ...s, layers: updatedLayers } : s));
    setProject({ ...project, slides: updatedSlides });
    setSelectedLayerId(newLayerId);
  };

  // Delete Layer
  const handleDeleteLayer = (layerId: string) => {
    const updatedLayers = activeSlide.layers.filter(l => l.id !== layerId);
    const updatedSlides = project.slides.map(s => (s.id === activeSlide.id ? { ...s, layers: updatedLayers } : s));
    setProject({ ...project, slides: updatedSlides });
    if (selectedLayerId === layerId) {
      setSelectedLayerId(updatedLayers[0]?.id || null);
    }
  };

  // Add Slide
  const handleAddSlide = () => {
    const newSlideId = `slide-${Date.now()}`;
    const newSlide: Slide = {
      id: newSlideId,
      title: `اسلاید شماره ${project.slides.length + 1}`,
      duration: 6.0,
      transition: 'fade',
      background: {
        type: 'gradient',
        color: '#0f172a',
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
      },
      layers: []
    };

    setProject({ ...project, slides: [...project.slides, newSlide] });
    setActiveSlideId(newSlideId);
  };

  // Canvas Mouse Down Drag
  const handleMouseDownLayer = (e: React.MouseEvent, layer: Layer) => {
    if (layer.locked) return;
    e.stopPropagation();
    setSelectedLayerId(layer.id);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: layer.x,
      layerY: layer.y
    };
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !selectedLayer || selectedLayer.locked) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    handleUpdateLayer({
      ...selectedLayer,
      x: Math.round(dragStartRef.current.layerX + deltaX),
      y: Math.round(dragStartRef.current.layerY + deltaY)
    });
  };

  const handleMouseUpCanvas = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Filtered Layers in Left Sidebar
  const filteredLayers = activeSlide.layers.filter(l =>
    l.name.toLowerCase().includes(layerSearchQuery.toLowerCase())
  );

  return (
    <div
      onMouseMove={handleMouseMoveCanvas}
      onMouseUp={handleMouseUpCanvas}
      className="flex flex-col h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden select-none rtl text-right transition-colors"
    >
      {/* 1. TOP STUDIO HEADER TOOLBAR */}
      <div className="h-14 border-b border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 flex items-center justify-between px-4 z-20 shadow-xs">
        {/* Brand Logo & Name + Back/Save */}
        <div className="flex items-center gap-3">
          {(onBack || onSave) && (
            <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-gray-200 dark:border-slate-700">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                  title="بازگشت"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              {onSave && (
                <button
                  onClick={() => onSave(project)}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ذخیره اسلایدر</span>
                </button>
              )}
            </div>
          )}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-600 dark:from-teal-500 dark:to-indigo-500 flex items-center justify-center font-black text-lg text-white shadow-md shadow-teal-500/20">
            Q
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>سیستم هوشمند اسلایدر و سازنده محتوا</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] border border-teal-200 dark:border-teal-500/30 font-mono font-bold">
                v1.0 Pro
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Visual Timeline Editor &amp; revolution engine</p>
          </div>
        </div>

        {/* Center Breakpoint & Design Mode Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 text-[11px] font-extrabold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Design Mode</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
            {(['1240', '1024', '900', '768', '576', '380'] as BreakpointWidth[]).map(bp => (
              <button
                key={bp}
                onClick={() => setActiveBreakpoint(bp)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                  activeBreakpoint === bp
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {bp}px
              </button>
            ))}
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>کتابخانه قالب‌ها</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Code className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>دریافت کد</span>
          </button>

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-4 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-black text-xs transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>پیش‌نمایش زنده</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-TOOLBAR FOR LAYERS & SLIDES */}
      <div className="h-11 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 flex items-center justify-between text-xs z-10">
        {/* Left Add Layer Menu */}
        <div className="flex items-center gap-1">
          <span className="text-slate-500 font-bold text-[11px] ml-2">افزودن لایه:</span>
          <button
            onClick={() => handleAddLayer('text')}
            className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs"
          >
            <Type className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>متن</span>
          </button>
          <button
            onClick={() => handleAddLayer('image')}
            className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs"
          >
            <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>تصویر</span>
          </button>
          <button
            onClick={() => handleAddLayer('button')}
            className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs"
          >
            <Square className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>دکمه</span>
          </button>
          <button
            onClick={() => handleAddLayer('video')}
            className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs"
          >
            <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>ویدیو</span>
          </button>
        </div>

        {/* Sidebar Toggle & Right Slide Switcher */}
        <div className="flex items-center gap-2">
          {/* Toggle sidebars */}
          <button
            onClick={() => setShowLeftSidebar(prev => !prev)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer border ${
              showLeftSidebar
                ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="نمایش/مخفی‌سازی پنل لایه‌ها"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRightSidebar(prev => !prev)}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer border ${
              showRightSidebar
                ? 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30'
                : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="نمایش/مخفی‌سازی پنل تنظیمات"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1"></div>
          <span className="text-slate-500 font-bold text-[11px]">مدیریت اسلایدها:</span>
          <div className="flex items-center gap-1">
            {project.slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSlideId(s.id)}
                className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  activeSlideId === s.id
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-slate-800'
                }`}
              >
                اسلاید {idx + 1}
              </button>
            ))}
            <button
              onClick={handleAddSlide}
              className="p-1 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-500 dark:hover:text-slate-950 transition-colors cursor-pointer border border-teal-200 dark:border-teal-500/30"
              title="افزودن اسلاید جدید"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE (LEFT TREE, CANVAS STAGE, RIGHT INSPECTOR) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR: LAYER HIERARCHY TREE */}
        {showLeftSidebar && (
        <div className="w-64 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col h-full text-slate-800 dark:text-slate-200 select-none">
          <div className="p-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>ساختار لایه‌ها ({activeSlide.layers.length})</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="p-2 border-b border-gray-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={layerSearchQuery}
                onChange={e => setLayerSearchQuery(e.target.value)}
                placeholder="جستجوی لایه..."
                className="w-full pr-8 pl-3 py-1.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredLayers.map(layer => {
              const isSelected = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`p-2.5 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-500/20 border border-teal-300 dark:border-teal-500/40 text-teal-800 dark:text-teal-300 font-extrabold shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {layer.type === 'text' && <Type className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                    {layer.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                    {layer.type === 'button' && <Square className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    {layer.type === 'video' && <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                    <span className="truncate">{layer.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleUpdateLayer({ ...layer, visible: !layer.visible });
                      }}
                      className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleUpdateLayer({ ...layer, locked: !layer.locked });
                      }}
                      className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <Lock className={`w-3.5 h-3.5 ${layer.locked ? 'text-amber-500' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* CENTER CANVAS STAGE */}
        <div className="flex-1 bg-slate-200/80 dark:bg-slate-950 overflow-auto p-8 flex items-center justify-center relative">
          {/* Slide Stage Container */}
          <div
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              background: activeSlide.background.gradient || activeSlide.background.color || '#0f172a'
            }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-300 dark:border-slate-800 transition-all duration-300"
          >
            {/* Particle Canvas Addon */}
            {project.addonParticles && (
              <AddonParticleCanvas preset={activeSlide.background.particlesPreset || 'stars'} opacity={0.6} />
            )}

            {/* Background Image overlay if specified */}
            {activeSlide.background.imageUrl && (
              <img
                src={activeSlide.background.imageUrl}
                alt="slide bg"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-30 mix-blend-overlay"
              />
            )}

            {/* Render Stage Layers */}
            {activeSlide.layers
              .filter(l => l.visible)
              .map(layer => {
                const isSelected = selectedLayerId === layer.id;

                return (
                  <div
                    key={layer.id}
                    onMouseDown={e => handleMouseDownLayer(e, layer)}
                    style={{
                      position: 'absolute',
                      left: `${layer.x}px`,
                      top: `${layer.y}px`,
                      width: `${layer.width}px`,
                      height: `${layer.height}px`,
                      fontSize: `${layer.fontSize}px`,
                      fontFamily: layer.fontFamily,
                      fontWeight: layer.fontWeight,
                      color: layer.color,
                      backgroundColor: layer.backgroundColor,
                      borderRadius: `${layer.borderRadius}px`,
                      padding: layer.padding,
                      zIndex: layer.zIndex,
                      transform: `rotate(${layer.rotation}deg)`,
                      boxShadow: layer.shadow
                    }}
                    className={`group/layer flex items-center justify-center transition-shadow cursor-move select-none ${
                      isSelected ? 'ring-2 ring-teal-400 ring-offset-2 ring-offset-slate-900 shadow-2xl' : ''
                    }`}
                  >
                    {/* Layer Content View */}
                    {layer.type === 'image' ? (
                      <img
                        src={layer.content}
                        alt={layer.name}
                        className="w-full h-full object-cover rounded-[inherit] pointer-events-none"
                      />
                    ) : layer.type === 'video' ? (
                      <video
                        src={layer.content}
                        autoPlay
                        loop
                        muted
                        className="w-full h-full object-cover rounded-[inherit] pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-center font-bold">
                        {layer.content}
                      </div>
                    )}

                    {/* Inline Selected Controls Toolbar */}
                    {isSelected && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-teal-500/50 p-1 rounded-xl flex items-center gap-1 text-[10px] text-slate-800 dark:text-white shadow-xl z-50">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteLayer(layer.id);
                          }}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleUpdateLayer({ ...layer, locked: !layer.locked });
                          }}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                          title="قفل"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* RIGHT SIDEBAR: INSPECTOR PANEL */}
        {showRightSidebar && (
        <InspectorPanel
          selectedLayer={selectedLayer}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          allSlides={project.slides.map(s => ({ id: s.id, title: s.title }))}
        />
        )}
      </div>

      {/* 4. BOTTOM ANIMATION TIMELINE ENGINE */}
      {showTimeline && (
        <TimelineBar
          slide={activeSlide}
          selectedLayerId={selectedLayerId}
          onSelectLayer={id => setSelectedLayerId(id)}
          onUpdateLayer={handleUpdateLayer}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      )}

      {/* MODALS */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectProject={proj => {
          setProject(proj);
          setActiveSlideId(proj.slides[0].id);
          setSelectedLayerId(proj.slides[0].layers[0]?.id || null);
        }}
        currentProject={project}
      />

      <CodeExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
      />

      <InteractivePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        project={project}
      />
    </div>
  );
}
