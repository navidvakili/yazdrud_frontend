import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  X,
  Shapes
} from 'lucide-react';
import type { SliderProject, Slide, Layer, LayerType, BreakpointWidth, ShapeType } from '@/src/shared-types/slider-studio';
import ShapePicker from './ShapePicker';
import ShapeLayer from './ShapeLayer';
import { SHAPE_LABELS } from '../constants/shapes';
import { MOTION_PATH_PRESETS, buildMotionPathPreset } from '../constants/motionPath';
import type { MotionPathPresetMode } from '../constants/motionPath';
import { INITIAL_SLIDER_PROJECTS } from '../data/presetTemplates';
import InspectorPanel from './InspectorPanel';
import TimelineBar from './TimelineBar';
import AddonParticleCanvas from './AddonParticleCanvas';
import TemplateLibraryModal from './TemplateLibraryModal';
import CodeExportModal from './CodeExportModal';
import InteractivePreviewModal from './InteractivePreviewModal';
import AutoPlayVideo from './AutoPlayVideo';
import { resolveStorageUrl } from '@/src/shared-utils';
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

/**
 * Guard against projects with no slides (e.g. a backend-created empty project).
 * Seeds the editor with the default template's slides so the UI never
 * renders an undefined active slide.
 */
function ensureSlides(project: SliderProject): SliderProject {
  if (!project.slides || project.slides.length === 0) {
    return {
      ...project,
      slides: INITIAL_SLIDER_PROJECTS[0].slides.map(slide => ({ ...slide })),
    };
  }
  return project;
}

export default function SliderStudio({ initialProject, onSave, onBack }: SliderStudioProps) {
  // Project State
  const [project, setProject] = useState<SliderProject>(
    () => ensureSlides(initialProject || INITIAL_SLIDER_PROJECTS[0])
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
      setProject(ensureSlides(initialProject));
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
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [draftPath, setDraftPath] = useState<{ x: number; y: number }[]>([]);

  // Motion-path overlay & drag state (draggable start/end/any point handles)
  const stageRef = useRef<HTMLDivElement>(null);
  const pathOverlayRef = useRef<SVGSVGElement>(null);
  const pathDragRef = useRef<{ index: number; source: 'draft' | 'saved' } | null>(null);
  // Suppresses the click that follows a handle drag (which would otherwise
  // deselect the layer or append a stray point to the draft path).
  const suppressStageClickRef = useRef(false);

  // Media picker for layer content
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'image' | 'video' | null>(null);
  const [pendingMediaLayerId, setPendingMediaLayerId] = useState<string | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // NOTE: no reset of currentTime on play — pausing mid-playback freezes the
  // timeline at currentTime, and pressing play again resumes from that frame.
  // A fresh start (timeline at 0) and STOP are handled by the stop button in
  // TimelineBar (setCurrentTime(0)); the ticker wraps at maxDuration.

  // Viewport & Breakpoints
  const [activeBreakpoint, setActiveBreakpoint] = useState<BreakpointWidth>('1240');
  const [layerSearchQuery, setLayerSearchQuery] = useState<string>('');

  // Modals state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [isLocalizingTemplate, setIsLocalizingTemplate] = useState(false);
  const [localizingMessage, setLocalizingMessage] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  // Shapes menu (add-layer toolbar popover)
  const [showShapeMenu, setShowShapeMenu] = useState<boolean>(false);

  // Slide switcher — always rendered as a dropdown so it never overflows the toolbar
  const [slidesMenuOpen, setSlidesMenuOpen] = useState<boolean>(false);
  const slidesMenuBtnRef = useRef<HTMLButtonElement>(null);
  const slidesToolbarRef = useRef<HTMLDivElement>(null);
  const [slidesMenuPos, setSlidesMenuPos] = useState<{ top: number; left: number; flip: boolean } | null>(null);

  // Position the dropdown panel inside the visible content area.
  // The panel is `fixed`, so clamp it to the sub-toolbar's bounds (the app is
  // narrower than the viewport because of the surrounding app chrome), otherwise
  // the left side of the panel — and the delete button — would end up hidden
  // under the app's side bars.
  const repositionSlidesMenu = useCallback(() => {
    const btn = slidesMenuBtnRef.current;
    const area = slidesToolbarRef.current;
    if (!btn || !area) return;
    const rect = btn.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    const panelW = 320; // w-80
    const panelH = 320; // max-h-[320px]
    const gap = 6;
    const openDown = rect.bottom + gap + panelH <= window.innerHeight;
    const top = openDown ? rect.bottom + gap : Math.max(areaRect.top + 4, rect.top - gap - panelH);
    // Keep the whole panel inside the toolbar's horizontal bounds
    const left = Math.max(areaRect.left + 4, Math.min(rect.right - panelW, areaRect.right - panelW - 4));
    setSlidesMenuPos({ top, left, flip: !openDown });
  }, []);

  const toggleSlidesMenu = () => {
    if (!slidesMenuOpen) repositionSlidesMenu();
    setSlidesMenuOpen(o => !o);
  };

  // Close the slides dropdown with Escape
  useEffect(() => {
    if (!slidesMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSlidesMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slidesMenuOpen]);

  // Re-position the panel if the window is resized while open
  useEffect(() => {
    if (!slidesMenuOpen) return;
    repositionSlidesMenu();
    window.addEventListener('resize', repositionSlidesMenu);
    return () => window.removeEventListener('resize', repositionSlidesMenu);
  }, [slidesMenuOpen, repositionSlidesMenu]);

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
    project.slides.find(s => s.id === activeSlideId)
    || project.slides[0]
    || INITIAL_SLIDER_PROJECTS[0].slides[0];

  const activeSlideIndex = Math.max(0, project.slides.findIndex(s => s.id === activeSlideId));

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

  // Add a geometric shape layer (centered on the canvas)
  const handleAddShape = (shape: ShapeType) => {
    const newLayerId = `layer-${Date.now()}`;
    const size = Math.round(Math.min(200, Math.min(canvasWidth, project.height) * 0.35));
    const faLabel = SHAPE_LABELS[shape].split(' (')[0];
    const newLayer: Layer = {
      id: newLayerId,
      name: `${faLabel} ${activeSlide.layers.length + 1}`,
      type: 'shape',
      shape,
      x: Math.round((canvasWidth - size) / 2),
      y: Math.round((project.height - size) / 2),
      width: size,
      height: size,
      rotation: 0,
      opacity: 1,
      zIndex: activeSlide.layers.length + 1,
      locked: false,
      visible: true,
      content: '',
      fontFamily: 'Vazirmatn, sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      alignVertical: 'center',
      color: '#ffffff',
      backgroundColor: '#38bdf8',
      backgroundOpacity: 100,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '#ffffff',
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
        hoverEffect: 'none',
        parallaxDepth: 0
      },
      interactions: []
    };

    const updatedLayers = [newLayer, ...activeSlide.layers];
    const updatedSlides = project.slides.map(s => (s.id === activeSlide.id ? { ...s, layers: updatedLayers } : s));
    updateProject({ ...project, slides: updatedSlides });
    setSelectedLayerId(newLayerId);
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

  // ---- Motion Path Drawing Helpers ----

  const startPathDraw = () => {
    setDraftPath(selectedLayer?.animation.motionPath?.points ?? []);
    setIsDrawingPath(true);
  };

  const cancelPathDraw = () => {
    setIsDrawingPath(false);
    setDraftPath([]);
  };

  const finishPathDraw = () => {
    if (selectedLayer && draftPath.length >= 2) {
      handleUpdateLayer({
        ...selectedLayer,
        animation: {
          ...selectedLayer.animation,
          motionPath: {
            points: draftPath,
            duration: selectedLayer.animation.inDuration || 2,
          },
        },
      });
    }
    setIsDrawingPath(false);
    setDraftPath([]);
  };

  /** Apply a preset motion path (line/arc/turn/shape/loop/figure-8) for the
   *  selected layer. When `save` is true the path is saved immediately (used
   *  from the inspector); otherwise it becomes the in-progress draft so the
   *  user can still tweak it on the canvas before finishing. */
  const applyPathPreset = (mode: MotionPathPresetMode, save = false) => {
    if (!selectedLayer) return;
    const pts = buildMotionPathPreset(mode, selectedLayer.width, selectedLayer.height);
    if (save) {
      handleUpdateLayer({
        ...selectedLayer,
        animation: {
          ...selectedLayer.animation,
          motionPath: { points: pts, duration: selectedLayer.animation.inDuration || 2 },
        },
      });
      setIsDrawingPath(false);
      setDraftPath([]);
    } else {
      setDraftPath(pts);
      setIsDrawingPath(true);
    }
  };

  /** Convert a pointer event to layer-relative stage coordinates. */
  const stagePointFromEvent = (e: { clientX: number; clientY: number }) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || !selectedLayer) return null;
    return {
      x: Math.round(e.clientX - rect.left - selectedLayer.x),
      y: Math.round(e.clientY - rect.top - selectedLayer.y),
    };
  };

  /** Start dragging a path point handle (start / end / any point). */
  const handlePathPointDown = (
    e: React.PointerEvent,
    index: number,
    source: 'draft' | 'saved'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    pathOverlayRef.current?.setPointerCapture(e.pointerId);
    pathDragRef.current = { index, source };
  };

  const handlePathPointMove = (e: React.PointerEvent) => {
    const drag = pathDragRef.current;
    if (!drag) return;
    const pt = stagePointFromEvent(e);
    if (!pt) return;
    if (drag.source === 'draft') {
      setDraftPath(prev => prev.map((p, i) => (i === drag.index ? pt : p)));
    } else if (selectedLayer?.animation.motionPath) {
      const mp = selectedLayer.animation.motionPath;
      handleUpdateLayer({
        ...selectedLayer,
        animation: {
          ...selectedLayer.animation,
          motionPath: {
            ...mp,
            points: mp.points.map((p, i) => (i === drag.index ? pt : p)),
          },
        },
      });
    }
  };

  const handlePathPointUp = (e: React.PointerEvent) => {
    if (pathDragRef.current) {
      pathDragRef.current = null;
      suppressStageClickRef.current = true;
      window.setTimeout(() => { suppressStageClickRef.current = false; }, 150);
      if (pathOverlayRef.current?.hasPointerCapture(e.pointerId)) {
        pathOverlayRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  /** Stage click: while drawing a motion path it adds a point (relative to the
   *  selected layer's top-left); otherwise it deselects the layer. Clicking
   *  right after dragging a path handle is ignored. */
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (suppressStageClickRef.current || pathDragRef.current) return;
    if (isDrawingPath) {
      if (!selectedLayer) return;
      const rect = stageRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDraftPath(prev => [
        ...prev,
        { x: Math.round(x - selectedLayer.x), y: Math.round(y - selectedLayer.y) },
      ]);
      return;
    }
    setSelectedLayerId(null);
  };

  // ---- Animation Playback Helpers ----

  /** Compute the Framer Motion animate state for a layer based on playback position
   *  (base transforms; motion-path offset is applied by computeLayerPlaybackState). */
  const computeBasePlaybackState = (layer: Layer): {
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

    // Design/editing view (not playing and timeline at 0): show the final layout.
    // Paused mid-playback (currentTime > 0): keep computing from currentTime so
    // the animation freezes at the exact frame instead of snapping to the end.
    if (!isPlaying && currentTime === 0) return finalState;

    const {
      inDelay = 0,
      inDuration = 0.8,
      inPreset = 'fadeIn',
      outPreset = 'none',
      outDuration = 0,
      outDelay = 0,
    } = layer.animation;
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

    // Compute easing based on layer setting (shared by in & out interpolation)
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

    // Timeline window: the layer is on screen from inDelay until the end of its
    // in-animation, plus an optional out-animation tail (outDelay + outDuration).
    // When no out animation is configured the layer stays visible until the
    // slide itself ends.
    const hasOut = (outPreset || 'none') !== 'none' && outDuration > 0;
    const holdEnd = inDuration + outDelay;
    const totalEnd = holdEnd + (hasOut ? outDuration : 0);

    // In-animation completed — hold, then play the out-animation if configured.
    // With NO exit animation the layer stays visible until the slide ends.
    if (elapsed >= inDuration) {
      if (!hasOut) return finalState;
      if (elapsed < holdEnd) return finalState; // hold phase
      if (elapsed >= totalEnd) return { ...finalState, opacity: 0 }; // window ended
      const outProgress = Math.min(1, (elapsed - holdEnd) / outDuration);
      const outEased = easingFn(outProgress);
      const outState = { ...finalState, opacity: (1 - outEased) * layer.opacity };
      switch (outPreset) {
        case 'slideUp':    return { ...outState, y: -80 * outEased };
        case 'slideDown':  return { ...outState, y: 80 * outEased };
        case 'slideLeft':  return { ...outState, x: 120 * outEased };
        case 'slideRight': return { ...outState, x: -120 * outEased };
        case 'zoomIn':     return { ...outState, scale: 1 + 0.5 * outEased };
        case 'zoomOut':    return { ...outState, scale: 1 - 0.6 * outEased };
        case 'rotateIn':   return { ...outState, scale: 1 - 0.2 * outEased, rotate: layer.rotation - 20 * outEased };
        default:           return outState; // fade-style exit
      }
    }

    // During in-animation – interpolate by progress
    const progress = elapsed / inDuration;
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

  /** Interpolate a point along a polyline path at normalized time t ∈ [0,1]
   *  (evenly spaced by segment length, so speed is constant along the path). */
  const interpolatePathPoint = (points: { x: number; y: number }[], t: number) => {
    const n = points.length;
    if (n === 0) return { x: 0, y: 0 };
    if (n === 1) return points[0];
    const segLens: number[] = [];
    let total = 0;
    for (let i = 1; i < n; i++) {
      const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      segLens.push(d);
      total += d;
    }
    if (total === 0) return points[0];
    let target = t * total;
    for (let i = 0; i < segLens.length; i++) {
      if (target <= segLens[i] || i === segLens.length - 1) {
        const segT = segLens[i] === 0 ? 0 : target / segLens[i];
        return {
          x: points[i].x + (points[i + 1].x - points[i].x) * segT,
          y: points[i].y + (points[i + 1].y - points[i].y) * segT,
        };
      }
      target -= segLens[i];
    }
    return points[n - 1];
  };

  /** Playback state + motion-path override: while a motionPath is configured the
   *  layer loops along the path (x/y replaced with path coordinates). */
  const computeLayerPlaybackState = (layer: Layer) => {
    const state = computeBasePlaybackState(layer);
    const mp = layer.animation.motionPath;
    if (!mp || !mp.points || mp.points.length < 2) return state;
    const elapsed = currentTime - (layer.animation.inDelay ?? 0);
    const loopDur = Math.max(0.1, mp.duration ?? layer.animation.inDuration ?? 2);
    if (elapsed <= 0) return state; // before the window — keep base state (hidden)
    const t = (elapsed % loopDur) / loopDur;
    const p = interpolatePathPoint(mp.points, t);
    return { ...state, x: p.x, y: p.y };
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
      <div ref={slidesToolbarRef} className="h-11 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 flex items-center justify-between text-xs z-10">
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

          {/* Shapes dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowShapeMenu(prev => !prev)}
              className={`px-3 py-1 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer border shadow-xs transition-colors ${
                showShapeMenu
                  ? 'border-teal-400 dark:border-teal-500/60 text-teal-700 dark:text-teal-300'
                  : 'border-gray-200 dark:border-slate-800'
              }`}
            >
              <Shapes className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
              <span>اشکال</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
            {showShapeMenu && (
              <>
                {/* Click-away backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setShowShapeMenu(false)} />
                <div className="absolute z-50 top-full right-0 mt-2 w-80 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl">
                  <div className="text-[11px] font-black text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                    <Shapes className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                    <span>افزودن شکل (Add Shape)</span>
                  </div>
                  <ShapePicker
                    value={undefined}
                    columns={5}
                    onChange={shape => {
                      handleAddShape(shape);
                      setShowShapeMenu(false);
                    }}
                  />
                </div>
              </>
            )}
          </div>
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
          <div className="relative">
            {/* Slide switcher — always rendered as a dropdown so it never overflows the toolbar */}
            <div className="flex items-center gap-1">
              <button
                ref={slidesMenuBtnRef}
                onClick={toggleSlidesMenu}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black transition-all cursor-pointer select-none bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-xs"
                title="نمایش همه اسلایدها"
              >
                <span>اسلاید {activeSlideIndex + 1} از {project.slides.length}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${slidesMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={handleAddSlide}
                className="p-1 rounded-xl bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-500 dark:hover:text-slate-950 transition-colors cursor-pointer border border-teal-200 dark:border-teal-500/30"
                title="افزودن اسلاید جدید"
              >
                <Plus className="w-4 h-4" />
              </button>

              {slidesMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setSlidesMenuOpen(false)} />
                  <div
                    className="fixed z-50 w-80 max-h-[320px] overflow-y-auto overflow-x-hidden rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl p-1.5 space-y-0.5"
                    style={{ top: slidesMenuPos?.top ?? 0, left: slidesMenuPos?.left ?? 0 }}
                  >
                    {project.slides.map((s, idx) => {
                      const isActive = activeSlideId === s.id;
                      const isDragOver = dragOverIndex === idx;
                      return (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={() => handleSlideDragStart(s.id, idx)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverIndex(idx);
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDragOverPosition(e.clientY < rect.top + rect.height / 2 ? 'before' : 'after');
                          }}
                          onDrop={e => handleSlideDrop(e, idx)}
                          onDragEnd={() => { dragItemRef.current = null; setDragOverIndex(null); setDragOverPosition('before'); }}
                          onClick={() => { setActiveSlideId(s.id); setSlidesMenuOpen(false); }}
                          className={`relative flex items-center gap-2 px-2 py-1.5 rounded-xl font-bold transition-all cursor-pointer select-none ${
                            isActive
                              ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {isDragOver && dragOverPosition === 'before' && <div className="absolute top-0 left-2 right-2 h-[3px] bg-teal-500 rounded-full -translate-y-1/2 z-10" />}
                          {isDragOver && dragOverPosition === 'after' && <div className="absolute bottom-0 left-2 right-2 h-[3px] bg-teal-500 rounded-full translate-y-1/2 z-10" />}
                          <span className="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity shrink-0" title="درگ برای جابجایی">
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <span className="truncate flex-1" title={s.title || `اسلاید ${idx + 1}`}>
                            {s.title || `اسلاید ${idx + 1}`}
                          </span>
                          <span className="text-[10px] opacity-60 shrink-0">{idx + 1}</span>
                          {project.slides.length > 1 && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteSlide(s.id); }}
                              className="p-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-300/50 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all cursor-pointer shrink-0"
                              title="حذف اسلاید"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
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
                    {layer.type === 'shape' && <Shapes className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400 shrink-0" />}
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
          {/* Motion-path draw toolbar */}
          {isDrawingPath && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg px-4 py-2"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                رسم مسیر حرکت: کلیک = نقطه جدید، نقاط را بکشید
                {draftPath.length > 0 && ` (${draftPath.length} نقطه)`}
              </span>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" /> شروع</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> پایان</span>
                <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-400" /> نقاط میانی</span>
              </div>
              {/* Preset path templates */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">الگو:</span>
                {MOTION_PATH_PRESETS.map(p => (
                  <button
                    key={p.mode}
                    onClick={() => applyPathPreset(p.mode)}
                    title={p.hint}
                    className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={() => setDraftPath([])}
                  title="رسم آزاد نقطه‌به‌نقطه"
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  رسم آزاد
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={finishPathDraw}
                  disabled={draftPath.length < 2}
                  className="px-3 py-1 rounded-xl bg-teal-600 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  پایان مسیر
                </button>
                <button
                  onClick={() => setDraftPath([])}
                  disabled={draftPath.length === 0}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  پاک کردن
                </button>
                <button
                  onClick={cancelPathDraw}
                  className="px-3 py-1 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
          {/* Scrollable viewport */}
          <div className="absolute inset-0 overflow-auto p-8 flex items-start justify-center">
          {/* Slide Stage Container */}
          <div
            ref={stageRef}
            data-stage-container
            onClick={handleStageClick}
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
                src={resolveStorageUrl(activeSlide.background.imageUrl)}
                alt="slide bg"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Background Video — full when type is 'video' */}
            {activeSlide.background.type === 'video' && activeSlide.background.videoUrl && (
              <AutoPlayVideo
                src={activeSlide.background.videoUrl}
                playing={isPlaying}
                startFromZero={currentTime === 0}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            )}

            {/* Particle Canvas — show when type is 'particles' OR project addon is enabled */}
            {(project.addonParticles || activeSlide.background.type === 'particles') && (
              <AddonParticleCanvas preset={activeSlide.background.particlesPreset || 'stars'} opacity={0.6} />
            )}

          {/* Motion-path overlay — ALWAYS visible so the user can see the
              dashed path the layer will travel along. Selected layer =
              prominent with draggable handles (green start, red end); other
              layers = dimmer dashed lines. */}
          <svg
            ref={pathOverlayRef}
            className="absolute inset-0"
            style={{ zIndex: 10000, pointerEvents: 'none', width: '100%', height: '100%' }}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onPointerMove={handlePathPointMove}
            onPointerUp={handlePathPointUp}
            onPointerCancel={handlePathPointUp}
          >
            {/* Other layers with a motion path (dashed, dimmer) */}
            {activeSlide.layers
              .filter(l => l.id !== selectedLayerId && l.visible && l.animation?.motionPath?.points?.length >= 2)
              .map(l => (
                <polyline
                  key={l.id}
                  points={l.animation.motionPath!.points.map(p => `${p.x + l.x},${p.y + l.y}`).join(' ')}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  opacity={0.8}
                />
              ))}

            {/* Selected layer path (saved or draft) with draggable handles */}
            {(() => {
              if (!selectedLayer) return null;
              const points = isDrawingPath ? draftPath : selectedLayer.animation?.motionPath?.points;
              if (!points || points.length < 2) return null;
              return (
                <g>
                  <polyline
                    points={points.map(p => `${p.x + selectedLayer.x},${p.y + selectedLayer.y}`).join(' ')}
                    fill="none"
                    stroke={isDrawingPath ? '#f472b6' : '#818cf8'}
                    strokeWidth={2.5}
                    strokeDasharray={isDrawingPath ? '6 4' : '7 5'}
                  />
                  {points.map((p, i) => {
                    const isStart = i === 0;
                    const isEnd = i === points.length - 1;
                    const hx = p.x + selectedLayer.x;
                    const hy = p.y + selectedLayer.y;
                    return (
                      <g key={i}>
                        <circle
                          cx={hx}
                          cy={hy}
                          r={isStart ? 7 : isEnd ? 6 : 4}
                          fill={isStart ? '#10b981' : isEnd ? '#ef4444' : '#818cf8'}
                          stroke="#ffffff"
                          strokeWidth={2}
                          style={{
                            pointerEvents: 'auto',
                            cursor: 'grab',
                            touchAction: 'none',
                          }}
                          onPointerDown={e => handlePathPointDown(e, i, isDrawingPath ? 'draft' : 'saved')}
                        />
                        {(isStart || isEnd) && (
                          <text
                            x={hx + (isStart ? 10 : -10)}
                            y={hy + (isStart ? 24 : 24)}
                            fontSize={11}
                            fontWeight={700}
                            fill={isStart ? '#10b981' : '#ef4444'}
                            stroke="#ffffff"
                            strokeWidth={0.5}
                            textAnchor={isStart ? 'start' : 'end'}
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                          >
                            {isStart ? 'شروع' : 'پایان'}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })()}
          </svg>

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
                      borderRadius: `${layer.borderRadius ?? 0}px`,
                      // Shapes draw their own outline inside ShapeLayer (a CSS
                      // border here would stay rectangular and be clipped away).
                      border: layer.type === 'shape' ? 'none' : `${layer.borderWidth ?? 0}px solid ${layer.borderColor ?? 'transparent'}`,
                      padding: layer.padding ?? '0px',
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
                    {/* Layer Background — for shapes the fill lives inside
                        ShapeLayer (it must be clipped by the shape geometry) */}
                    {(layer.type !== 'shape' && (layer.backgroundColor !== 'transparent' || layer.backgroundGradient)) && (
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
                      {layer.type === 'shape' ? (
                        <ShapeLayer layer={layer} />
                      ) : layer.type === 'image' ? (
                        <img
                          src={resolveStorageUrl(layer.content)}
                          alt={layer.name}
                          className="w-full h-full object-cover rounded-[inherit] pointer-events-none"
                        />
                      ) : layer.type === 'video' ? (
                        <AutoPlayVideo
                          src={layer.content}
                          playing={isPlaying}
                          startFromZero={currentTime === 0}
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
                              delay={isPlaying || currentTime > 0 ? (layer.animation.inDelay || 0) : 0}
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
          onStartPathDraw={startPathDraw}
          onApplyPathPreset={mode => applyPathPreset(mode, true)}
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
        filter={mediaPickerTarget === 'image' ? 'image' : 'video'}
        title={mediaPickerTarget === 'image' ? 'انتخاب تصویر لایه' : 'انتخاب ویدئوی لایه'}
      />
    </div>
  );
}
