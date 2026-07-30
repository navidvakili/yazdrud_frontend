import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
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
  Unlock,
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
  Sparkle,
  GripVertical,
  AlertTriangle,
  Move,
  RotateCw,
  X
} from 'lucide-react';
import type { SliderProject, Slide, Layer, LayerType, BreakpointWidth } from '@/src/shared-types/slider-studio';
import { INITIAL_SLIDER_PROJECTS } from '../data/presetTemplates';
import InspectorPanel from './InspectorPanel';
import TimelineBar from './TimelineBar';
import AddonParticleCanvas from './AddonParticleCanvas';
import TemplateLibraryModal from './TemplateLibraryModal';
import CodeExportModal from './CodeExportModal';
import InteractivePreviewModal from './InteractivePreviewModal';
import { MediaManager } from '@/src/shared-components';
import { regenerateSlideIds, localizeSlideImages } from '../utils/templateUtils';

// ── Text Animation Helpers ─────────────────────────────────────────

/** Detect Persian/Arabic script characters */
const HAS_PERSIAN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

function splitTextUnits(text: string): string[] {
  if (HAS_PERSIAN.test(text)) {
    const parts = text.split(/(\s+)/).filter(Boolean);
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

// ── Text Animation Sub-components (currentTime-driven) ────────────

function TypewriterText({ text, duration, delay, currentTime }: { text: string; duration: number; delay: number; currentTime?: number }) {
  const totalChars = text.length;
  let visibleCount: number;
  if (currentTime !== undefined) {
    const elapsed = currentTime - delay;
    if (elapsed <= 0) visibleCount = 0;
    else if (elapsed >= duration) visibleCount = totalChars;
    else visibleCount = Math.min(totalChars, Math.floor((elapsed / duration) * totalChars));
  } else {
    // fallback when no currentTime — show full text
    visibleCount = totalChars;
  }
  return (<span dir="auto"><span>{text.slice(0, visibleCount)}</span>{visibleCount < totalChars && <span className="inline-block w-[2px] h-[1em] bg-current animate-pulse mr-0.5 align-middle" />}</span>);
}

function SplitWordText({ text, duration, delay, currentTime }: { text: string; duration: number; delay: number; currentTime?: number }) {
  const words = text.split(' ');
  const stagger = words.length > 1 ? duration / words.length : duration;
  const perWordDuration = Math.min(stagger, 0.5);
  return (<span className="inline-flex flex-wrap" style={{ gap: '0.25em' }} dir="auto">{words.map((word, i) => {
    const wordDelay = delay + i * stagger;
    const wordEnd = wordDelay + perWordDuration;
    let opacity = 1, y = 0;
    if (currentTime !== undefined) {
      if (currentTime < wordDelay) { opacity = 0; y = 20; }
      else if (currentTime < wordEnd) {
        const p = (currentTime - wordDelay) / perWordDuration;
        opacity = p; y = 20 * (1 - p);
      }
      // else fully visible (default values)
    }
    return (<span key={i} style={{ opacity, transform: `translateY(${y}px)`, display: 'inline-block', transition: 'none' }}>{word}</span>);
  })}</span>);
}

function SplitCharText({ text, duration, delay, currentTime }: { text: string; duration: number; delay: number; currentTime?: number }) {
  const units = splitTextUnits(text);
  const stagger = units.length > 1 ? duration / units.length : duration;
  const perUnitDuration = Math.min(stagger, 0.4);
  return (<span dir="auto">{units.map((unit, i) => {
    const unitDelay = delay + i * stagger;
    const unitEnd = unitDelay + perUnitDuration;
    let opacity = 1, y = 0, rotateX = 0;
    if (currentTime !== undefined) {
      if (currentTime < unitDelay) { opacity = 0; y = 30; rotateX = -90; }
      else if (currentTime < unitEnd) {
        const p = (currentTime - unitDelay) / perUnitDuration;
        opacity = p; y = 30 * (1 - p); rotateX = -90 * (1 - p);
      }
    }
    return (<span key={i} style={{ opacity, transform: `translateY(${y}px) rotateX(${rotateX}deg)`, display: 'inline-block', whiteSpace: 'pre' as const }}>{unit}</span>);
  })}</span>);
}

function RevealText({ text, duration, delay, currentTime }: { text: string; duration: number; delay: number; currentTime?: number }) {
  let progress = 1;
  if (currentTime !== undefined) {
    const elapsed = currentTime - delay;
    if (elapsed <= 0) progress = 0;
    else if (elapsed >= duration) progress = 1;
    else progress = elapsed / duration;
  }
  return (<div className="overflow-hidden" style={{ display: 'inline-block' }}><div style={{ clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)` }}>{text}</div></div>);
}

function WaveText({ text, duration, delay, currentTime }: { text: string; duration: number; delay: number; currentTime?: number }) {
  const units = splitTextUnits(text);
  const stagger = units.length > 1 ? (duration * 0.6) / units.length : duration;
  const perUnitDuration = 0.6;
  return (<span dir="auto">{units.map((unit, i) => {
    const unitDelay = delay + i * stagger;
    const t1 = unitDelay;
    const t2 = unitDelay + perUnitDuration * 0.6; // peak of bounce
    const t3 = unitDelay + perUnitDuration;       // end
    let y = 0;
    if (currentTime !== undefined) {
      if (currentTime < t1) { y = 40; }
      else if (currentTime < t2) {
        const p = (currentTime - t1) / (t2 - t1);
        y = 40 + (-15 - 40) * p; // 40 → -15
      }
      else if (currentTime < t3) {
        const p = (currentTime - t2) / (t3 - t2);
        y = -15 + (15) * p; // -15 → 0
      }
    }
    return (<span key={i} style={{ opacity: currentTime !== undefined && currentTime < t1 ? 0 : 1, transform: `translateY(${y}px)`, display: 'inline-block', whiteSpace: 'pre' as const }}>{unit}</span>);
  })}</span>);
}

function FlickerText({ text, duration, delay, currentTime }: { text: string; duration: number; delay: number; currentTime?: number }) {
  let opacity = 1;
  if (currentTime !== undefined) {
    const elapsed = currentTime - delay;
    const d = duration || 1.5;
    if (elapsed <= 0) opacity = 0;
    else if (elapsed >= d) opacity = 1;
    else {
      const keyframes = [0, 1, 0.2, 1, 0.3, 1];
      const times = [0, 0.15, 0.3, 0.5, 0.7, 1];
      const p = elapsed / d;
      // Find the two keyframes to interpolate between
      let idx = times.length - 2;
      for (let j = 0; j < times.length - 1; j++) {
        if (p >= times[j] && p < times[j + 1]) { idx = j; break; }
      }
      const t0 = times[idx], t1 = times[idx + 1];
      const localP = t1 === t0 ? 0 : (p - t0) / (t1 - t0);
      opacity = keyframes[idx] + (keyframes[idx + 1] - keyframes[idx]) * localP;
    }
  }
  return (<span style={{ opacity }}>{text}</span>);
}

const TEXT_ANIM_PRESETS = new Set(['typewriter', 'splitWord', 'splitChar', 'reveal', 'wave', 'flicker']);

function TextAnimContent({ text, preset, duration, delay, currentTime }: { text: string; preset: string; duration: number; delay: number; currentTime?: number }) {
  switch (preset) {
    case 'typewriter': return <TypewriterText text={text} duration={duration} delay={delay} currentTime={currentTime} />;
    case 'splitWord':  return <SplitWordText  text={text} duration={duration} delay={delay} currentTime={currentTime} />;
    case 'splitChar':  return <SplitCharText  text={text} duration={duration} delay={delay} currentTime={currentTime} />;
    case 'reveal':     return <RevealText     text={text} duration={duration} delay={delay} currentTime={currentTime} />;
    case 'wave':       return <WaveText       text={text} duration={duration} delay={delay} currentTime={currentTime} />;
    case 'flicker':    return <FlickerText    text={text} duration={duration} delay={delay} currentTime={currentTime} />;
    default:           return <>{text}</>;
  }
}

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
      // Clear undo/redo history on project load
      historyRef.current = [];
      futureRef.current = [];
      setUndoRedoVersion(v => v + 1);
    }
  }, [initialProject]);

  // ── Undo / Redo ───────────────────────────────────────────────
  const MAX_HISTORY = 50;
  const historyRef = useRef<SliderProject[]>([]);
  const futureRef = useRef<SliderProject[]>([]);
  const lastHistoryTimeRef = useRef(0);
  const [undoRedoVersion, setUndoRedoVersion] = useState(0);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  const updateProject = useCallback((newProject: SliderProject) => {
    const now = Date.now();
    // Coalesce rapid changes (within 400ms) into one history entry
    if (now - lastHistoryTimeRef.current < 400 && historyRef.current.length > 0) {
      // Replace the last history entry instead of adding a new one
      historyRef.current[historyRef.current.length - 1] = project;
    } else {
      historyRef.current = [...historyRef.current.slice(-(MAX_HISTORY - 1)), project];
    }
    lastHistoryTimeRef.current = now;
    futureRef.current = [];
    setProject(newProject);
    setUndoRedoVersion(v => v + 1);
  }, [project]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, project];
    lastHistoryTimeRef.current = 0; // reset coalesce timer
    setProject(prev);
    setUndoRedoVersion(v => v + 1);
  }, [project]);

  const handleRedo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    historyRef.current = [...historyRef.current, project];
    lastHistoryTimeRef.current = 0; // reset coalesce timer
    setProject(next);
    setUndoRedoVersion(v => v + 1);
  }, [project]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const handleConfirmDelete = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  // Sidebar visibility
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightSidebar, setShowRightSidebar] = useState<boolean>(true);

  // Timeline & Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showTimeline, setShowTimeline] = useState<boolean>(true);

  // Mouse position for parallax (normalized -1..1)
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Media picker for layer content
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'image' | 'video' | null>(null);
  const [pendingMediaLayerId, setPendingMediaLayerId] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Reset timeline to 0 when playback starts (sync before paint to avoid flash)
  useLayoutEffect(() => {
    if (isPlaying) {
      setCurrentTime(0);
    }
  }, [isPlaying]);

  // Viewport & Breakpoints
  const [activeBreakpoint, setActiveBreakpoint] = useState<BreakpointWidth>('1240');
  const [layerSearchQuery, setLayerSearchQuery] = useState<string>('');

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isLocalizingTemplate, setIsLocalizingTemplate] = useState(false);
  const [localizingMessage, setLocalizingMessage] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Dragging layer state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; layerX: number; layerY: number } | null>(null);

  // Resize state
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
    handle: string; // 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se'
  } | null>(null);

  // Rotate state
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const rotateStartRef = useRef<{
    centerX: number;
    centerY: number;
    startAngle: number;
    startRotation: number;
  } | null>(null);

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
    const existing = activeSlide.layers.find(l => l.id === updated.id);
    const animChanged = existing && JSON.stringify(existing.animation) !== JSON.stringify(updated.animation);
    const updatedLayers = activeSlide.layers.map(l => (l.id === updated.id ? updated : l));
    const updatedSlides = project.slides.map(s => (s.id === activeSlide.id ? { ...s, layers: updatedLayers } : s));
    updateProject({ ...project, slides: updatedSlides });
    // Reset timeline when animation settings change while playing,
    // so the user immediately sees the new delay/easing take effect
    if (animChanged && isPlaying) {
      setCurrentTime(0);
    }
  };

  // Slide Update Handler
  const handleUpdateSlide = (updated: Slide) => {
    const updatedSlides = project.slides.map(s => (s.id === updated.id ? updated : s));
    updateProject({ ...project, slides: updatedSlides });
    // Also sync selectedLayer if the updated slide is now the active one
    if (updated.id === activeSlideId) {
      if (selectedLayerId && !updated.layers.find(l => l.id === selectedLayerId)) {
        setSelectedLayerId(updated.layers[0]?.id || null);
      }
    }
  };

  // Add New Layer
  const handleAddLayer = (type: LayerType) => {
    const newLayerId = `layer-${Date.now()}`;
    let newContent = 'متن جدید';
    if (type === 'button') newContent = 'دکمه اقدام به عمل';

    // For image/video/rectangle, don't add default content
    if (type === 'image' || type === 'video' || type === 'rectangle') {
      newContent = '';
    }

    const newLayer: Layer = {
      id: newLayerId,
      name: type === 'rectangle'
        ? `لایه رنگ ${activeSlide.layers.length + 1}`
        : `لایه ${type.toUpperCase()} ${activeSlide.layers.length + 1}`,
      type,
      x: type === 'rectangle' ? 0 : 150 + activeSlide.layers.length * 20,
      y: type === 'rectangle' ? 0 : 150 + activeSlide.layers.length * 20,
      width: type === 'rectangle' ? canvasWidth : type === 'button' ? 200 : type === 'image' || type === 'video' ? 360 : 300,
      height: type === 'rectangle' ? project.height : type === 'button' ? 55 : type === 'image' || type === 'video' ? 240 : 80,
      rotation: 0,
      opacity: 1,
      zIndex: activeSlide.layers.length + 1,
      locked: false,
      visible: true,
      content: newContent,
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: type === 'button' ? 16 : 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'right',
      alignVertical: 'center',
      color: type === 'button' ? '#0f172a' : '#ffffff',
      backgroundColor: type === 'button' ? '#38bdf8' : type === 'rectangle' ? '#1e293b' : 'transparent',
      backgroundOpacity: 100,
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
        parallaxDepth: 0
      },
      interactions: []
    };

    // Unshift so new layer appears at top of tree (front)
    const updatedLayers = [newLayer, ...activeSlide.layers];
    const updatedSlides = project.slides.map(s => (s.id === activeSlide.id ? { ...s, layers: updatedLayers } : s));
    updateProject({ ...project, slides: updatedSlides });
    setSelectedLayerId(newLayerId);

    // Open MediaManager for image/video layers
    if (type === 'image' || type === 'video') {
      setPendingMediaLayerId(newLayerId);
      setMediaPickerTarget(type);
    }
  };

  // ---- Actual mutation helpers (used by confirm callbacks) ----

  const doDeleteLayer = (layerId: string) => {
    const updatedLayers = activeSlide.layers.filter(l => l.id !== layerId);
    const updatedSlides = project.slides.map(s => (s.id === activeSlide.id ? { ...s, layers: updatedLayers } : s));
    updateProject({ ...project, slides: updatedSlides });
    if (selectedLayerId === layerId) {
      setSelectedLayerId(updatedLayers[0]?.id || null);
    }
  };

  const doDeleteSlide = (slideId: string) => {
    if (project.slides.length <= 1) return;
    const updatedSlides = project.slides.filter(s => s.id !== slideId);
    updateProject({ ...project, slides: updatedSlides });
    if (activeSlideId === slideId) {
      const newActiveId = updatedSlides[0]?.id || project.slides[0].id;
      setActiveSlideId(newActiveId);
      const newSlide = updatedSlides.find(s => s.id === newActiveId);
      setSelectedLayerId(newSlide?.layers[0]?.id || null);
    }
  };

  // Show confirmation then delete
  const handleDeleteLayer = (layerId: string) => {
    const layer = activeSlide.layers.find(l => l.id === layerId);
    handleConfirmDelete(
      `آیا از حذف لایه «${layer?.name || layerId}» اطمینان دارید؟`,
      () => doDeleteLayer(layerId)
    );
  };

  const handleDeleteSlide = (slideId: string) => {
    const slide = project.slides.find(s => s.id === slideId);
    handleConfirmDelete(
      `آیا از حذف ${slide?.title || 'اسلاید'} اطمینان دارید؟`,
      () => doDeleteSlide(slideId)
    );
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

    updateProject({ ...project, slides: [...project.slides, newSlide] });
    setActiveSlideId(newSlideId);
  };

  // Add Template Slides (append to existing project with localized images)
  const handleAddTemplateSlides = async (templateProj: SliderProject) => {
    setIsLocalizingTemplate(true);
    setLocalizingMessage('در حال دریافت و ذخیره تصاویر قالب...');

    try {
      // 1. Regenerate all IDs to avoid collisions
      const freshSlides = regenerateSlideIds(templateProj.slides);

      // 2. Download external images & upload them to the server
      const localizedSlides = await localizeSlideImages(freshSlides);

      // 3. Append slides to the current project
      const updatedSlides = [...project.slides, ...localizedSlides];
      updateProject({ ...project, slides: updatedSlides });

      // 4. Activate the first newly added slide
      const firstNewSlide = localizedSlides[0];
      if (firstNewSlide) {
        setActiveSlideId(firstNewSlide.id);
        setSelectedLayerId(firstNewSlide.layers[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to add template slides:', err);
    } finally {
      setIsLocalizingTemplate(false);
      setLocalizingMessage('');
    }
  };

  // Move Layer Up in the list (earlier index → appears higher)
  const handleMoveLayerUp = (layerId: string) => {
    const layers = [...activeSlide.layers];
    const idx = layers.findIndex(l => l.id === layerId);
    if (idx > 0) {
      [layers[idx], layers[idx - 1]] = [layers[idx - 1], layers[idx]];
      // Top of tree (idx 0) = highest zIndex (front), bottom = lowest (back)
      const reindexed = layers.map((l, i) => ({ ...l, zIndex: layers.length - i }));
      const updatedSlides = project.slides.map(s =>
        s.id === activeSlide.id ? { ...s, layers: reindexed } : s
      );
      updateProject({ ...project, slides: updatedSlides });
    }
  };

  // Move Layer Down in the list (later index → appears lower)
  const handleMoveLayerDown = (layerId: string) => {
    const layers = [...activeSlide.layers];
    const idx = layers.findIndex(l => l.id === layerId);
    if (idx < layers.length - 1) {
      [layers[idx], layers[idx + 1]] = [layers[idx + 1], layers[idx]];
      // Top of tree (idx 0) = highest zIndex (front), bottom = lowest (back)
      const reindexed = layers.map((l, i) => ({ ...l, zIndex: layers.length - i }));
      const updatedSlides = project.slides.map(s =>
        s.id === activeSlide.id ? { ...s, layers: reindexed } : s
      );
      updateProject({ ...project, slides: updatedSlides });
    }
  };

  // ---- Drag-and-drop state & handlers ----

  const dragItemRef = useRef<{ type: 'layer' | 'slide'; id: string; fromIndex: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'before' | 'after'>('before');

  // ---- Layer drag-and-drop ----

  const handleLayerDragStart = (layerId: string, index: number) => {
    dragItemRef.current = { type: 'layer', id: layerId, fromIndex: index };
  };

  const handleLayerDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDragOverPosition(e.clientY < midY ? 'before' : 'after');
  };

  const handleLayerDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const drag = dragItemRef.current;
    if (!drag || drag.type !== 'layer') return;
    const actualIndex = dragOverPosition === 'after' ? toIndex + 1 : toIndex;
    if (drag.fromIndex === actualIndex) return;
    // If dropping after but the target is after the source, adjust
    let adjustedIndex = actualIndex;
    if (drag.fromIndex < actualIndex) adjustedIndex--;
    const layers = [...activeSlide.layers];
    const [removed] = layers.splice(drag.fromIndex, 1);
    layers.splice(adjustedIndex, 0, removed);
    // Recalculate zIndex: top of tree (idx 0) = highest zIndex (front),
    // bottom of tree = lowest zIndex (back)
    const reindexed = layers.map((l, idx) => ({ ...l, zIndex: layers.length - idx }));
    const updatedSlides = project.slides.map(s =>
      s.id === activeSlide.id ? { ...s, layers: reindexed } : s
    );
    updateProject({ ...project, slides: updatedSlides });
    dragItemRef.current = null;
    setDragOverIndex(null);
    setDragOverPosition('before');
  };

  // ---- Slide drag-and-drop ----

  const handleSlideDragStart = (slideId: string, index: number) => {
    dragItemRef.current = { type: 'slide', id: slideId, fromIndex: index };
  };

  const handleSlideDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    setDragOverPosition(e.clientX < midX ? 'before' : 'after');
  };

  const handleSlideDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const drag = dragItemRef.current;
    if (!drag || drag.type !== 'slide') return;
    const actualIndex = dragOverPosition === 'after' ? toIndex + 1 : toIndex;
    if (drag.fromIndex === actualIndex) return;
    let adjustedIndex = actualIndex;
    if (drag.fromIndex < actualIndex) adjustedIndex--;
    const slides = [...project.slides];
    const [removed] = slides.splice(drag.fromIndex, 1);
    slides.splice(adjustedIndex, 0, removed);
    updateProject({ ...project, slides });
    dragItemRef.current = null;
    setDragOverIndex(null);
    setDragOverPosition('before');
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

  const handleMouseUpCanvas = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    dragStartRef.current = null;
    resizeStartRef.current = null;
    rotateStartRef.current = null;
  };

  // Resize handler
  const handleMouseDownResize = (e: React.MouseEvent, layer: Layer, handle: string) => {
    if (layer.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedLayerId(layer.id);
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startWidth: layer.width,
      startHeight: layer.height,
      startX: layer.x,
      startY: layer.y,
      handle,
    };
  };

  // Rotate handler
  const handleMouseDownRotate = (e: React.MouseEvent, layer: Layer) => {
    if (layer.locked) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedLayerId(layer.id);
    setIsRotating(true);
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    rotateStartRef.current = {
      centerX,
      centerY,
      startAngle,
      startRotation: layer.rotation,
    };
  };

  // Updated mouse move to handle all three operations
  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    // --- Move (drag) ---
    if (isDragging && dragStartRef.current && selectedLayer && !selectedLayer.locked) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      handleUpdateLayer({
        ...selectedLayer,
        x: Math.round(dragStartRef.current.layerX + deltaX),
        y: Math.round(dragStartRef.current.layerY + deltaY),
      });
      return;
    }

    // --- Resize ---
    if (isResizing && resizeStartRef.current && selectedLayer && !selectedLayer.locked) {
      const rs = resizeStartRef.current;
      const deltaX = e.clientX - rs.x;
      const deltaY = e.clientY - rs.y;
      let newX = rs.startX;
      let newY = rs.startY;
      let newW = rs.startWidth;
      let newH = rs.startHeight;

      const handle = rs.handle;
      if (handle.includes('e')) newW = Math.max(20, rs.startWidth + deltaX);
      if (handle.includes('w')) { newW = Math.max(20, rs.startWidth - deltaX); newX = rs.startX + rs.startWidth - newW; }
      if (handle.includes('s')) newH = Math.max(20, rs.startHeight + deltaY);
      if (handle.includes('n')) { newH = Math.max(20, rs.startHeight - deltaY); newY = rs.startY + rs.startHeight - newH; }

      handleUpdateLayer({ ...selectedLayer, x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
      return;
    }

    // --- Rotate ---
    if (isRotating && rotateStartRef.current && selectedLayer && !selectedLayer.locked) {
      const rs = rotateStartRef.current;
      const angle = Math.atan2(e.clientY - rs.centerY, e.clientX - rs.centerX) * (180 / Math.PI);
      const newRotation = rs.startRotation + (angle - rs.startAngle);
      handleUpdateLayer({ ...selectedLayer, rotation: Math.round(newRotation) });
      return;
    }
  };

  // ---- Animation Playback Helpers ----

  /** Compute the Framer Motion animate state for a layer based on playback position */
  const computeLayerPlaybackState = (layer: Layer): {
    opacity: number;
    x: number;
    y: number;
    scale: number;
    rotate: number;
  } => {
    // Final/resting state (fully visible, no transform)
    const finalState = {
      opacity: layer.opacity,
      x: 0,
      y: 0,
      scale: 1,
      rotate: layer.rotation,
    };

    if (!isPlaying) return finalState;

    const { inDelay = 0, inDuration = 0.8, inPreset = 'fadeIn' } = layer.animation;
    if (inPreset === 'none' || inDuration === 0) return finalState;

    const elapsed = currentTime - inDelay;

    // Before animation starts (hidden at initial state)
    if (elapsed <= 0) {
      switch (inPreset) {
        case 'fadeIn':    return { ...finalState, opacity: 0 };
        case 'slideUp':   return { ...finalState, opacity: 0, y: 80 };
        case 'slideDown': return { ...finalState, opacity: 0, y: -80 };
        case 'slideLeft': return { ...finalState, opacity: 0, x: -120 };
        case 'slideRight':return { ...finalState, opacity: 0, x: 120 };
        case 'zoomIn':    return { ...finalState, opacity: 0, scale: 0.4 };
        case 'zoomOut':   return { ...finalState, opacity: 0, scale: 1.5 };
        case 'rotateIn':  return { ...finalState, opacity: 0, scale: 0.8, rotate: layer.rotation - 20 };
        // Text animation presets — visible from start, inner component handles animation
        case 'typewriter':
        case 'splitWord':
        case 'splitChar':
        case 'reveal':
        case 'wave':
        case 'flicker':
          return finalState;
        default:          return { ...finalState, opacity: 0 };
      }
    }

    // Animation completed – final/resting state
    if (elapsed >= inDuration) return finalState;

    // During animation – interpolate by progress
    const progress = elapsed / inDuration;
    // Compute easing based on layer setting
    const easingFn = (t: number) => {
      switch (layer.animation.inEasing) {
        case 'linear': return t;
        case 'easeIn': return t * t;
        case 'easeInOut': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        case 'bounce': {
          const n1 = 7.5625; const d1 = 2.75;
          if (t < 1 / d1) return n1 * t * t;
          else if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
          else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
          else return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
        case 'elastic': {
          const c4 = (2 * Math.PI) / 3;
          return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }
        default: return 1 - Math.pow(1 - t, 3); // easeOut
      }
    };
    const eased = easingFn(progress);

    switch (inPreset) {
      case 'fadeIn':
        return { ...finalState, opacity: eased * layer.opacity };
      case 'slideUp':
        return { ...finalState, opacity: eased * layer.opacity, y: 80 * (1 - eased) };
      case 'slideDown':
        return { ...finalState, opacity: eased * layer.opacity, y: -80 * (1 - eased) };
      case 'slideLeft':
        return { ...finalState, opacity: eased * layer.opacity, x: -120 * (1 - eased) };
      case 'slideRight':
        return { ...finalState, opacity: eased * layer.opacity, x: 120 * (1 - eased) };
      case 'zoomIn':
        return { ...finalState, opacity: eased * layer.opacity, scale: 0.4 + 0.6 * eased };
      case 'zoomOut':
        return { ...finalState, opacity: eased * layer.opacity, scale: 1.5 - 0.5 * eased };
      case 'rotateIn':
        return {
          ...finalState,
          opacity: eased * layer.opacity,
          scale: 0.8 + 0.2 * eased,
          rotate: layer.rotation - 20 * (1 - eased),
        };
      // Text animation presets — always at final state, inner component handles animation
      case 'typewriter':
      case 'splitWord':
      case 'splitChar':
      case 'reveal':
      case 'wave':
      case 'flicker':
        return finalState;
      default:
        return { ...finalState, opacity: eased * layer.opacity };
    }
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
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      await (onSave(project) as unknown as Promise<void>);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ذخیره اسلایدر</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
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
        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="واگرد (Ctrl+Z)"
          >
            <RotateCw className="w-4 h-4 scale-x-[-1]" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="ازنو (Ctrl+Shift+Z / Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1" />

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
          <button
            onClick={() => handleAddLayer('rectangle')}
            className="px-3 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border border-gray-200 dark:border-slate-800 shadow-xs"
          >
            <Square className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>رنگ</span>
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
            {project.slides.map((s, idx) => {
              const isDragOver = dragOverIndex === idx;
              return (
              <div
                key={s.id}
                draggable
                onDragStart={() => handleSlideDragStart(s.id, idx)}
                onDragOver={e => handleSlideDragOver(e, idx)}
                onDrop={e => handleSlideDrop(e, idx)}
                onDragEnd={() => { dragItemRef.current = null; setDragOverIndex(null); setDragOverPosition('before'); }}
                className={`relative group/slidetab flex items-center gap-0.5 px-2 py-1 rounded-xl font-bold transition-all cursor-pointer select-none ${
                  activeSlideId === s.id
                    ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-gray-200 dark:border-slate-800'
                }`}
              >
              {isDragOver && dragOverPosition === 'before' && <div className="absolute right-0 top-1 bottom-1 w-[3px] bg-teal-500 rounded-full -mr-0.5 z-10 shadow-sm shadow-teal-400/50" />}
              {isDragOver && dragOverPosition === 'after' && <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-teal-500 rounded-full -ml-0.5 z-10 shadow-sm shadow-teal-400/50" />}
                <span className="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity" title="درگ برای جابجایی">
                  <GripVertical className="w-3 h-3" />
                </span>
                <span
                  onClick={() => setActiveSlideId(s.id)}
                  className="cursor-pointer"
                  title={s.title || `اسلاید ${idx + 1}`}
                >اسلاید {idx + 1}</span>
                {project.slides.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteSlide(s.id); }}
                    className="p-0.5 rounded-full bg-rose-500/80 text-white opacity-0 group-hover/slidetab:opacity-100 hover:bg-rose-600 transition-all cursor-pointer ml-0.5"
                    title="حذف اسلاید"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            )})}
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
            {filteredLayers.map((layer, idx) => {
              const isSelected = selectedLayerId === layer.id;
              const isDragOver = dragOverIndex === idx;
              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={() => handleLayerDragStart(layer.id, idx)}
                  onDragOver={e => handleLayerDragOver(e, idx)}
                  onDrop={e => handleLayerDrop(e, idx)}
                  onDragEnd={() => { dragItemRef.current = null; setDragOverIndex(null); setDragOverPosition('before'); }}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`relative p-2.5 rounded-2xl flex items-center justify-between text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-teal-50 dark:bg-teal-500/20 border border-teal-300 dark:border-teal-500/40 text-teal-800 dark:text-teal-300 font-extrabold shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-transparent'
                  }`}
                >
                  {isDragOver && dragOverPosition === 'before' && <div className="absolute top-0 left-2 right-2 h-[3px] bg-teal-500 rounded-full -translate-y-1/2 z-10 shadow-sm shadow-teal-400/50" />}
                  {isDragOver && dragOverPosition === 'after' && <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-teal-500 rounded-full translate-y-1/2 z-10 shadow-sm shadow-teal-400/50" />}
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing" title="درگ برای جابجایی">
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                    {layer.type === 'text' && <Type className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                    {layer.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />}
                    {layer.type === 'button' && <Square className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    {layer.type === 'video' && <Video className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                    {layer.type === 'rectangle' && <Square className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />}
                    <span className="truncate">{layer.name}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleUpdateLayer({ ...layer, visible: !layer.visible });
                      }}
                      className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      title="نمایش/مخفی"
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleUpdateLayer({ ...layer, locked: !layer.locked });
                      }}
                      className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      title="قفل/باز"
                    >
                      {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleMoveLayerUp(layer.id);
                      }}
                      className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      title="جابجایی به بالا"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleMoveLayerDown(layer.id);
                      }}
                      className="p-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      title="جابجایی به پایین"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteLayer(layer.id);
                      }}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg cursor-pointer"
                      title="حذف لایه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {/* Bottom drop zone for layers */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOverIndex(filteredLayers.length); setDragOverPosition('after'); }}
              onDrop={e => handleLayerDrop(e, filteredLayers.length - 1)}
              onDragEnd={() => { dragItemRef.current = null; setDragOverIndex(null); setDragOverPosition('before'); }}
              className={`relative h-4 rounded-2xl transition-colors ${dragOverIndex === filteredLayers.length ? 'bg-teal-100/50 dark:bg-teal-500/10' : ''}`}
            >
              {dragOverIndex === filteredLayers.length && (
                <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-teal-500 rounded-full translate-y-1/2 z-10 shadow-sm shadow-teal-400/50" />
              )}
            </div>
          </div>
        </div>
        )}

        {/* CENTER CANVAS STAGE — scrollable when layers overflow */}
        <div className="flex-1 bg-slate-200/80 dark:bg-slate-950 relative overflow-hidden"
             onClick={() => setSelectedLayerId(null)}>
          {/* Scrollable viewport */}
          <div className="absolute inset-0 overflow-auto p-8 flex items-start justify-center">
          {/* Slide Stage Container */}
          <div
            data-stage-container
            onClick={e => { e.stopPropagation(); setSelectedLayerId(null); }}
            onMouseMove={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              setMousePos({
                x: Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2))),
                y: Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2))),
              });
            }}
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              background:
                activeSlide.background.gradient || activeSlide.background.color || '#0f172a'
            }}
            className="relative rounded-3xl shadow-2xl border-2 border-gray-300 dark:border-slate-800 shrink-0"
          >
            {/* Background Image - full when type is 'image', overlay otherwise */}
            {activeSlide.background.imageUrl && activeSlide.background.type === 'image' && (
              <img
                src={activeSlide.background.imageUrl}
                alt="slide bg"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Particle Canvas — show when type is 'particles' OR project addon is enabled */}
            {(project.addonParticles || activeSlide.background.type === 'particles') && (
              <AddonParticleCanvas preset={activeSlide.background.particlesPreset || 'stars'} opacity={0.6} />
            )}

            {/* Render Stage Layers */}
            {activeSlide.layers
              .filter(l => l.visible)
              .map(layer => {
                const isSelected = selectedLayerId === layer.id;

                const animState = computeLayerPlaybackState(layer);

                const HANDLE_SIZE = 10;

                // Resize handle positions relative to layer
                const handles = [
                  { id: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
                  { id: 'n',  x: '50%', y: 0, cursor: 'ns-resize', transform: 'translateX(-50%)' },
                  { id: 'ne', x: '100%', y: 0, cursor: 'nesw-resize', transform: 'translate(-100%, 0)' },
                  { id: 'w',  x: 0, y: '50%', cursor: 'ew-resize', transform: 'translateY(-50%)' },
                  { id: 'e',  x: '100%', y: '50%', cursor: 'ew-resize', transform: 'translate(-100%, -50%)' },
                  { id: 'sw', x: 0, y: '100%', cursor: 'nesw-resize', transform: 'translate(0, -100%)' },
                  { id: 's',  x: '50%', y: '100%', cursor: 'ns-resize', transform: 'translate(-50%, -100%)' },
                  { id: 'se', x: '100%', y: '100%', cursor: 'nwse-resize', transform: 'translate(-100%, -100%)' },
                ];

                return (
                  <motion.div
                    key={layer.id}
                    onMouseDown={e => handleMouseDownLayer(e, layer)}
                    initial={false}
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
                      opacity: layer.animation.inPreset === 'none' ? (layer.opacity ?? 1) : undefined,
                      borderRadius: `${layer.borderRadius}px`,
                      padding: layer.padding,
                      zIndex: layer.zIndex,
                      boxShadow: layer.shadow,
                    }}
                    animate={animState}
                    transition={isPlaying
                      ? { duration: 0.02, ease: 'linear' }
                      : { duration: 0 }
                    }
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
                    className={`group/layer cursor-move select-none overflow-hidden`}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Parallax inner wrapper */}
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
                          borderRadius: 'inherit',
                          opacity: layer.backgroundOpacity !== undefined ? layer.backgroundOpacity / 100 : 1,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    {/* Layer Content View */}
                    <div className="w-full h-full flex items-center justify-center relative z-[1]">
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
                      ) : layer.type === 'rectangle' ? (
                        <div className="w-full h-full" />
                      ) : (
                        <div
                          className="w-full h-full flex relative z-[1]"
                          style={{
                            alignItems: layer.alignVertical === 'top' ? 'flex-start' : layer.alignVertical === 'bottom' ? 'flex-end' : 'center',
                            justifyContent: layer.textAlign === 'right' ? 'right' : layer.textAlign === 'left' ? 'left' : 'center',
                            textAlign: layer.textAlign || 'center',
                          }}
                        >
                          {layer.animation.inPreset && TEXT_ANIM_PRESETS.has(layer.animation.inPreset) ? (
                            <TextAnimContent
                              text={layer.content}
                              preset={layer.animation.inPreset}
                              duration={layer.animation.inDuration || 0.5}
                              delay={isPlaying ? (layer.animation.inDelay || 0) : 0}
                              currentTime={currentTime}
                            />
                          ) : (
                            layer.content
                          )}
                        </div>
                      )}
                    </div>
                    </div>{/* end parallax wrapper */}

                    {/* ===== FreeTransform Bounding Box (when selected) ===== */}
                    {isSelected && (
                      <>
                        {/* Resize handles */}
                        {handles.map(h => (
                          <div
                            key={h.id}
                            onMouseDown={e => handleMouseDownResize(e, layer, h.id)}
                            style={{
                              position: 'absolute',
                              left: typeof h.x === 'number' ? `${h.x}px` : h.x,
                              top: typeof h.y === 'number' ? `${h.y}px` : h.y,
                              width: HANDLE_SIZE,
                              height: HANDLE_SIZE,
                              transform: h.transform || 'none',
                              marginLeft: typeof h.x === 'number' ? -HANDLE_SIZE / 2 : 0,
                              marginTop: typeof h.y === 'number' ? -HANDLE_SIZE / 2 : 0,
                              cursor: h.cursor,
                            }}
                            className="bg-white border-2 border-teal-500 rounded-sm shadow-md z-50 hover:scale-125 transition-transform"
                          />
                        ))}

                        {/* Rotation handle (above top-center) */}
                        <div
                          onMouseDown={e => handleMouseDownRotate(e, layer)}
                          style={{
                            position: 'absolute',
                            left: '50%',
                            top: `${-HANDLE_SIZE - 32}px`,
                            transform: 'translateX(-50%)',
                            cursor: 'grab',
                            touchAction: 'none',
                          }}
                          className="flex flex-col items-center z-50 group/rotate"
                        >
                          {/* Dashed line connecting rotate handle to box */}
                          <div className="w-px h-6 bg-teal-400/60 group-hover/rotate:bg-teal-400 transition-colors" />
                          {/* Visible handle */}
                          <div className="w-9 h-9 rounded-full bg-teal-500 border-2 border-white shadow-lg flex items-center justify-center hover:bg-teal-400 hover:scale-110 active:scale-95 transition-all">
                            <RotateCw className="w-5 h-5 text-white" />
                          </div>
                          {/* Extended invisible hit area */}
                          <div
                            style={{
                              position: 'absolute',
                              left: '50%',
                              top: '50%',
                              transform: 'translate(-50%, -50%)',
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              cursor: 'grab',
                              touchAction: 'none',
                            }}
                            onMouseDown={e => handleMouseDownRotate(e, layer)}
                          />
                        </div>

                        {/* Inline Selected Controls Toolbar */}
                        <div
                          onMouseDown={e => e.stopPropagation()}
                          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-teal-500/50 p-1 rounded-xl flex items-center gap-1 text-[10px] text-slate-800 dark:text-white shadow-xl z-50"
                        >
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteLayer(layer.id); }}
                            className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleUpdateLayer({ ...layer, locked: !layer.locked }); }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="قفل"
                          >
                            {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold px-1 select-none">
                            {layer.width}×{layer.height}
                          </span>
                        </div>
                      </>
                    )}
                  </motion.div>
                );
              })}
          </div>
          {/* END scrollable viewport */}
        </div>
        </div>

        {/* RIGHT SIDEBAR: INSPECTOR PANEL */}
        {showRightSidebar && (
        <InspectorPanel
          selectedLayer={selectedLayer}
          onUpdateLayer={handleUpdateLayer}
          onDeleteLayer={handleDeleteLayer}
          slide={activeSlide}
          onUpdateSlide={handleUpdateSlide}
          allSlides={project.slides.map(s => ({ id: s.id, title: s.title }))}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
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
          updateProject(proj);
          setActiveSlideId(proj.slides[0].id);
          setSelectedLayerId(proj.slides[0].layers[0]?.id || null);
        }}
        onAddTemplateSlides={handleAddTemplateSlides}
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

      {/* CONFIRMATION DIALOG */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 max-w-sm w-full mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">تأیید حذف</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-rose-500/20"
                >
                  تأیید حذف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Loading Overlay */}
      <AnimatePresence>
        {isLocalizingTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-700 p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4"
            >
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-teal-200 dark:border-teal-800" />
                <div className="absolute inset-0 rounded-full border-4 border-teal-600 dark:border-teal-400 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white text-center">
                {localizingMessage}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                تصاویر قالب در حال ذخیره بر روی سرور می‌باشد. لطفاً صبر کنید...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Manager for layer content */}
      <MediaManager
        open={mediaPickerTarget !== null}
        onClose={() => {
          setMediaPickerTarget(null);
          setPendingMediaLayerId(null);
        }}
        onSelect={(url: string) => {
          if (pendingMediaLayerId) {
            const layer = activeSlide.layers.find(l => l.id === pendingMediaLayerId);
            if (layer) {
              handleUpdateLayer({ ...layer, content: url });
            }
          }
          setMediaPickerTarget(null);
          setPendingMediaLayerId(null);
        }}
        filter={mediaPickerTarget === 'image' ? 'image' : 'all'}
        title={mediaPickerTarget === 'image' ? 'انتخاب تصویر لایه' : 'انتخاب ویدئوی لایه'}
      />
    </div>
  );
}
