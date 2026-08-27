import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Crop,
  RotateCw,
  FlipHorizontal,
  Sliders,
  Type,
  Save,
  Undo,
  ImageOff,
  Trash2,
  ImagePlus,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
  Lock,
  Unlock,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd
} from 'lucide-react';
import { GalleryAsset, toGalleryAsset } from './types';
import { getMediaStreamUrl, uploadMediaFile } from './api';
import { MediaManager } from '@/src/shared-components';

interface ImageEditorModalProps {
  asset: GalleryAsset | null;
  folderId?: string | null;
  localFile?: File | null; // ویرایش قبل از آپلود
  onLocalSaved?: (file: File) => void;
  onClose: () => void;
  onSave: (updatedAsset: GalleryAsset) => void;
}

type EditorTab = 'transform' | 'adjust' | 'watermark' | 'export';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CropDragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';
type EditorCropRatio = 'free' | '16:9' | '4:3' | '1:1' | '9:16';
type WmResizeMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';
type WmShadowKey = 'none' | 'soft' | 'medium' | 'strong';
type WmImagePosition = 'top' | 'bottom' | 'left' | 'right';

/** Single watermark: text + optional image positioned relative to the text. */
interface Watermark {
  id: string;
  text: string; // text content
  imageContent: string; // image URL ('' = no image)
  mediaId?: string;
  imagePosition: WmImagePosition; // image position relative to the text
  x: number; // % of image box (top-left)
  y: number; // % of image box (top-left)
  width: number; // % of image box
  height: number; // % of image box
  rotation: number; // degrees
  opacity: number; // 0-100
  // Typography
  fontFamily: string;
  fontSize: number; // px (display space, scaled on export)
  fontWeight: string | number;
  fontStyle: 'normal' | 'italic';
  textAlign: 'right' | 'center' | 'left';
  alignVertical: 'top' | 'center' | 'bottom';
  color: string;
  backgroundColor: string;
  padding: number; // px (display space, scaled on export)
  // Shared styling
  borderRadius: number; // px (display space, scaled on export)
  borderWidth: number; // px (display space, scaled on export)
  borderColor: string;
  shadow: WmShadowKey;
}

const WM_SHADOW_PRESETS: Record<
  WmShadowKey,
  { label: string; css: string; blur: number; offsetY: number; color: string }
> = {
  none: { label: 'بدون سایه', css: 'none', blur: 0, offsetY: 0, color: 'rgba(0,0,0,0)' },
  soft: { label: 'نرم', css: '0 2px 10px rgba(0,0,0,0.25)', blur: 10, offsetY: 2, color: 'rgba(0,0,0,0.25)' },
  medium: { label: 'متوسط', css: '0 4px 18px rgba(0,0,0,0.35)', blur: 18, offsetY: 4, color: 'rgba(0,0,0,0.35)' },
  strong: { label: 'قوی', css: '0 8px 28px rgba(0,0,0,0.5)', blur: 28, offsetY: 8, color: 'rgba(0,0,0,0.5)' }
};

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  asset,
  folderId = null,
  localFile,
  onLocalSaved,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('transform');

  // Transform states
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [cropPreset, setCropPreset] = useState<EditorCropRatio>('free');

  // Adjustments states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);

  // Watermark (یک لایه واحد: متن + تصویر اختیاری)
  const [watermark, setWatermark] = useState<Watermark | null>(null);
  const [wmPickerOpen, setWmPickerOpen] = useState(false);
  const [wmAspectLock, setWmAspectLock] = useState(true);
  const wmDragRef = useRef<{
    mode: WmResizeMode | 'rotate';
    start: Watermark;
    startP: { x: number; y: number };
    center?: { x: number; y: number };
  } | null>(null);

  // Crop states (percentages relative to the image box)
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, w: 100, h: 100 });
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(0);
  const dragRef = useRef<{
    mode: CropDragMode | null;
    start: CropRect | null;
    last: { x: number; y: number } | null;
  }>({ mode: null, start: null, last: null });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Reset editor state whenever a different asset (or local file) is opened
  useEffect(() => {
    if (!asset && !localFile) return;
    setActiveTab('transform');
    setRotation(0);
    setFlipH(false);
    setCropPreset('free');
    setCropRect({ x: 0, y: 0, w: 100, h: 100 });
    setNaturalDims(null);
    setWatermark(null);
    setWmPickerOpen(false);
    setWmAspectLock(true);
    wmDragRef.current = null;
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHue(0);
    setExporting(false);
    setExportError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, localFile?.name, localFile?.size, localFile?.lastModified]);

  // Track the preview area width so rotated images can be fitted without clipping.
  // The modal is always mounted (asset/localFile starts null), so the observer must (re)attach
  // whenever an asset or local file opens — otherwise previewW stays 0 and wide images get clipped.
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setPreviewW(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, localFile?.name, localFile?.size, localFile?.lastModified]);

  const handleResetAll = () => {
    setRotation(0);
    setFlipH(false);
    setBrightness(100);
    setContrast(100);
    setSaturate(100);
    setBlur(0);
    setHue(0);
  };

  const RATIO_VALUES: Record<string, number> = {
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '1:1': 1,
    '9:16': 9 / 16
  };

  const cropActive =
    cropRect.x > 0 || cropRect.y > 0 || cropRect.w < 100 || cropRect.h < 100;
  const ratioValue = cropPreset === 'free' ? null : RATIO_VALUES[cropPreset];
  const imgAspect =
    naturalDims && naturalDims.h ? naturalDims.w / naturalDims.h : null;
  const ratioPct = ratioValue && imgAspect ? ratioValue / imgAspect : null;

  const PREVIEW_MAX_H = 480;

  // Compute the fitted display size of the image (the layout box BEFORE the CSS rotation
  // is applied). The scale is computed against the *rotated* (effective) dimensions so that
  // after the transform rotates the image, its whole visible box fits inside the preview area.
  const computeFitted = () => {
    const natW = naturalDims?.w ?? 0;
    const natH = naturalDims?.h ?? 0;
    if (!natW || !natH) return null;
    const rotated = rotation % 180 !== 0;
    const effW = rotated ? natH : natW;
    const effH = rotated ? natW : natH;
    const availW = previewW || effW;
    const availH = PREVIEW_MAX_H;
    const scale = Math.min(availW / effW, availH / effH, 1);
    return {
      rotated,
      dispW: effW * scale,
      dispH: effH * scale
    };
  };

  // Convert a screen point to image-local percentages (inverse of the CSS rotate/flip transform)
  const imagePointToPercent = (clientX: number, clientY: number) => {
    const el = wrapperRef.current;
    if (!el) return { x: 50, y: 50 };
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = clientX - cx;
    const dy = clientY - cy;
    let ix = dx * cos + dy * sin;
    let iy = -dx * sin + dy * cos;
    if (flipH) ix = -ix;
    const fitted = computeFitted();
    const w = fitted ? fitted.dispW : rect.width;
    const h = fitted ? fitted.dispH : rect.height;
    return {
      x: Math.max(0, Math.min(100, ((ix / (w / 2 || 1)) + 1) * 50)),
      y: Math.max(0, Math.min(100, ((iy / (h / 2 || 1)) + 1) * 50))
    };
  };

  const clampRect = (r: CropRect): CropRect => {
    const w = Math.max(5, Math.min(100, r.w));
    const h = Math.max(5, Math.min(100, r.h));
    return {
      x: Math.max(0, Math.min(100 - w, r.x)),
      y: Math.max(0, Math.min(100 - h, r.y)),
      w,
      h
    };
  };

  const handleCropPreset = (ratio: EditorCropRatio) => {
    setCropPreset(ratio);
    if (ratio === 'free' || !imgAspect) {
      setCropRect({ x: 0, y: 0, w: 100, h: 100 });
      return;
    }
    const r = RATIO_VALUES[ratio] / imgAspect; // fw / fh
    let fw: number;
    let fh: number;
    if (r >= 1) {
      fw = 1;
      fh = 1 / r;
    } else {
      fh = 1;
      fw = r;
    }
    const w = fw * 100;
    const h = fh * 100;
    setCropRect({ x: (100 - w) / 2, y: (100 - h) / 2, w, h });
  };

  const startCropDrag = (e: React.PointerEvent, mode: CropDragMode) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // pointer capture unavailable — fall back to element-level move handlers
    }
    dragRef.current = {
      mode,
      start: { ...cropRect },
      last: imagePointToPercent(e.clientX, e.clientY)
    };
  };

  const moveCropDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !d.mode || !d.start) return;
    const p = imagePointToPercent(e.clientX, e.clientY);
    const s = d.start;
    if (d.mode === 'move') {
      const dx = p.x - (d.last?.x ?? p.x);
      const dy = p.y - (d.last?.y ?? p.y);
      setCropRect(clampRect({ x: s.x + dx, y: s.y + dy, w: s.w, h: s.h }));
      return;
    }
    // The fixed opposite corner (the corner NOT being dragged)
    const fixedX = d.mode.includes('w') ? s.x + s.w : s.x;
    const fixedY = d.mode.includes('n') ? s.y + s.h : s.y;
    let w = d.mode.includes('w') ? fixedX - p.x : p.x - fixedX;
    let h = d.mode.includes('n') ? fixedY - p.y : p.y - fixedY;
    const maxW = d.mode.includes('w') ? fixedX : 100 - fixedX;
    const maxH = d.mode.includes('n') ? fixedY : 100 - fixedY;
    w = Math.max(5, Math.min(w, maxW));
    h = Math.max(5, Math.min(h, maxH));
    if (ratioPct) {
      if (w / Math.max(h, 0.001) > ratioPct) w = h * ratioPct;
      else h = w / ratioPct;
      if (w > maxW) {
        w = maxW;
        h = w / ratioPct;
      }
      if (h > maxH) {
        h = maxH;
        w = h * ratioPct;
      }
      // keep the box above the 5% floor while preserving the ratio
      if (w < 5) {
        const k = 5 / w;
        w = 5;
        h *= k;
      }
      if (h < 5) {
        const k = 5 / h;
        h = 5;
        w *= k;
      }
    }
    setCropRect(
      clampRect({
        x: d.mode.includes('w') ? fixedX - w : fixedX,
        y: d.mode.includes('n') ? fixedY - h : fixedY,
        w,
        h
      })
    );
  };

  const endCropDrag = () => {
    dragRef.current = { mode: null, start: null, last: null };
  };

  // ---------- Watermark (یک لایه واحد: متن + تصویر اختیاری نسبت به متن) ----------
  const clampNum = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));

  const updateWatermark = (patch: Partial<Watermark>) => {
    setWatermark((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const removeWatermark = () => setWatermark(null);

  const addWatermark = () => {
    setWatermark({
      id: `wm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: 'متن واترمارک',
      imageContent: '',
      imagePosition: 'top',
      x: 35,
      y: 35,
      width: 42,
      height: 18,
      rotation: 0,
      opacity: 85,
      fontFamily: 'Vazirmatn, Tahoma, sans-serif',
      fontSize: 28,
      fontWeight: 800,
      fontStyle: 'normal',
      textAlign: 'center',
      alignVertical: 'center',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.45)',
      padding: 8,
      borderRadius: 12,
      borderWidth: 0,
      borderColor: '#ffffff',
      shadow: 'none'
    });
  };

  // Screen center of the watermark box (forward rotate/flip transform, inverse of imagePointToPercent)
  const wmScreenCenter = (wm: Watermark) => {
    const el = wrapperRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const fitted = computeFitted();
    const dw = fitted ? fitted.dispW : rect.width;
    const dh = fitted ? fitted.dispH : rect.height;
    const lx = ((wm.x + wm.width / 2) / 100 - 0.5) * dw;
    const ly = ((wm.y + wm.height / 2) / 100 - 0.5) * dh;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    let ix = lx * (flipH ? -1 : 1);
    const rx = ix * cos - ly * sin;
    const ry = ix * sin + ly * cos;
    return { x: cx + rx, y: cy + ry };
  };

  const startWmLayerDrag = (e: React.PointerEvent, wm: Watermark, mode: WmResizeMode) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // pointer capture unavailable
    }
    wmDragRef.current = {
      mode,
      start: { ...wm },
      startP: imagePointToPercent(e.clientX, e.clientY)
    };
  };

  const moveWmLayerDrag = (e: React.PointerEvent) => {
    const d = wmDragRef.current;
    if (!d) return;
    const p = imagePointToPercent(e.clientX, e.clientY);
    const s = d.start;
    let { x, y, width, height } = s;
    if (d.mode === 'move') {
      x = s.x + (p.x - d.startP.x);
      y = s.y + (p.y - d.startP.y);
    } else {
      // Corner resize with the opposite corner fixed
      const fixedX = d.mode.includes('w') ? s.x + s.width : s.x;
      const fixedY = d.mode.includes('n') ? s.y + s.height : s.y;
      let w = d.mode.includes('w') ? fixedX - p.x : p.x - fixedX;
      let h = d.mode.includes('n') ? fixedY - p.y : p.y - fixedY;
      const maxW = d.mode.includes('w') ? fixedX : 100 - fixedX;
      const maxH = d.mode.includes('n') ? fixedY : 100 - fixedY;
      w = Math.max(2, Math.min(w, maxW));
      h = Math.max(2, Math.min(h, maxH));
      if (wmAspectLock) {
        const ratio = s.width / s.height;
        if (w / h > ratio) {
          w = h * ratio;
          if (w > maxW) {
            w = maxW;
            h = w / ratio;
          }
        } else {
          h = w / ratio;
          if (h > maxH) {
            h = maxH;
            w = h * ratio;
          }
        }
        if (w < 2) {
          const k = 2 / w;
          w = 2;
          h *= k;
        }
        if (h < 2) {
          const k = 2 / h;
          h = 2;
          w *= k;
        }
      }
      x = d.mode.includes('w') ? fixedX - w : fixedX;
      y = d.mode.includes('n') ? fixedY - h : fixedY;
      width = w;
      height = h;
    }
    x = Math.max(0, Math.min(100 - width, x));
    y = Math.max(0, Math.min(100 - height, y));
    updateWatermark({ x, y, width, height });
  };

  const endWmLayerDrag = () => {
    wmDragRef.current = null;
  };

  const startWmRotate = (e: React.PointerEvent, wm: Watermark) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // pointer capture unavailable
    }
    wmDragRef.current = {
      mode: 'rotate',
      start: { ...wm },
      startP: { x: e.clientX, y: e.clientY },
      center: wmScreenCenter(wm)
    };
  };

  const moveWmRotate = (e: React.PointerEvent) => {
    const d = wmDragRef.current;
    if (!d || d.mode !== 'rotate' || !d.center) return;
    const a0 = (Math.atan2(d.startP.y - d.center.y, d.startP.x - d.center.x) * 180) / Math.PI;
    const a1 = (Math.atan2(e.clientY - d.center.y, e.clientX - d.center.x) * 180) / Math.PI;
    updateWatermark({ rotation: Math.round(d.start.rotation + (a1 - a0)) });
  };

  // Load an image with CORS enabled (needed for canvas export)
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('image-load-failed'));
      im.src = src;
    });

  // Render the edited image onto a canvas and upload it to the server as a NEW file.
  const handleExportSave = () => {
    if (!asset && !localFile) return;
    setExporting(true);
    setExportError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        // Crop region in the source image's pixel space (percentages of the original)
        const sx = img.naturalWidth * (cropRect.x / 100);
        const sy = img.naturalHeight * (cropRect.y / 100);
        const sw = img.naturalWidth * (cropRect.w / 100);
        const sh = img.naturalHeight * (cropRect.h / 100);
        const rotated = rotation % 180 !== 0;
        const canvas = document.createElement('canvas');
        canvas.width = rotated ? sh : sw;
        canvas.height = rotated ? sw : sh;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas-unsupported');

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, 1);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hue}deg)`;
        ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

        // Watermark (متن + تصویر اختیاری — یک لایه واحد)
        if (watermark) {
          // واترمارک نباید فیلترهای تصویر اصلی (روشنایی/بلور) را بگیرد
          ctx.filter = 'none';
          const pxScale =
            naturalDims?.w && fitted?.dispW ? naturalDims.w / fitted.dispW : 1;
          const wm = watermark;
          const w = img.naturalWidth * (wm.width / 100);
          const h = img.naturalHeight * (wm.height / 100);
          const cx = img.naturalWidth * ((wm.x + wm.width / 2) / 100) - sx - sw / 2;
          const cy = img.naturalHeight * ((wm.y + wm.height / 2) / 100) - sy - sh / 2;
          const shadow = WM_SHADOW_PRESETS[wm.shadow] ?? WM_SHADOW_PRESETS.none;
          const rad = Math.min((wm.borderRadius || 0) * pxScale, w / 2, h / 2);
          ctx.save();
          ctx.globalAlpha = wm.opacity / 100;
          ctx.translate(cx, cy);
          ctx.rotate((wm.rotation * Math.PI) / 180);

          // پس‌زمینه (پشت محتوا)
          if (wm.backgroundColor && wm.backgroundColor !== 'transparent') {
            ctx.fillStyle = wm.backgroundColor;
            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, rad);
            ctx.fill();
          }

          const pad = (wm.padding || 0) * pxScale;
          const gap = 6 * pxScale;
          const wmImg = wm.imageContent
            ? await loadImage(
                wm.mediaId ? getMediaStreamUrl({ id: wm.mediaId }) : wm.imageContent
              ).catch(() => null)
            : null;

          const fontSize = Math.max(6, (wm.fontSize || 28) * pxScale);
          ctx.font = `${wm.fontStyle === 'italic' ? 'italic ' : ''}${wm.fontWeight || 700} ${fontSize}px ${wm.fontFamily || 'Vazirmatn, Tahoma, sans-serif'}`;
          ctx.fillStyle = wm.color || '#ffffff';
          ctx.textAlign = wm.textAlign === 'right' ? 'right' : wm.textAlign === 'left' ? 'left' : 'center';

          // کشیدن متن داخل یک اسلات (با شکستن خودکار خطوط مانند پیش‌نمایش)
          const drawTextInSlot = (x0: number, y0: number, tw: number, th: number) => {
            if (tw <= 0 || th <= 0) return;
            ctx.save();
            ctx.beginPath();
            ctx.rect(x0, y0, tw, th);
            ctx.clip();
            const lines: string[] = [];
            for (const raw of String(wm.text || '').split('\n')) {
              const words = raw.split(/\s+/).filter(Boolean);
              let line = '';
              for (const word of words) {
                const test = line ? `${line} ${word}` : word;
                if (ctx.measureText(test).width <= tw || !line) line = test;
                else {
                  lines.push(line);
                  line = word;
                }
              }
              if (line || raw === '') lines.push(line);
            }
            const lineH = fontSize * 1.4;
            const totalH = lines.length * lineH;
            let startY: number;
            if (wm.alignVertical === 'top') startY = y0;
            else if (wm.alignVertical === 'bottom') startY = y0 + th - totalH;
            else startY = y0 + (th - totalH) / 2;
            const anchorX =
              wm.textAlign === 'right' ? x0 + tw : wm.textAlign === 'left' ? x0 : x0 + tw / 2;
            if (shadow.blur > 0) {
              ctx.shadowColor = shadow.color;
              ctx.shadowBlur = shadow.blur * pxScale;
              ctx.shadowOffsetY = shadow.offsetY * pxScale;
            }
            ctx.textBaseline = 'top';
            lines.forEach((line, i) => ctx.fillText(line, anchorX, startY + i * lineH));
            ctx.restore();
          };

          if (wmImg) {
            const vertical = wm.imagePosition === 'top' || wm.imagePosition === 'bottom';
            const innerW = w - pad * 2;
            const innerH = h - pad * 2;
            const slotW = vertical ? innerW : innerW * 0.35;
            const slotH = vertical ? innerH * 0.35 : innerH;
            const iw = wmImg.naturalWidth || wmImg.width || 1;
            const ih = wmImg.naturalHeight || wmImg.height || 1;
            const s = Math.min(slotW / iw, slotH / ih);
            const dw = iw * s;
            const dh = ih * s;
            let imgCX: number;
            let imgCY: number;
            let tx0: number;
            let ty0: number;
            let tw: number;
            let th: number;
            if (vertical) {
              const slotTop = wm.imagePosition === 'top' ? -h / 2 + pad : h / 2 - pad - slotH;
              imgCX = 0;
              imgCY = slotTop + slotH / 2;
              tx0 = -w / 2 + pad;
              ty0 = wm.imagePosition === 'top' ? slotTop + slotH + gap : -h / 2 + pad;
              tw = innerW;
              th = Math.max(0, innerH - slotH - gap);
            } else {
              const slotLeft = wm.imagePosition === 'left' ? -w / 2 + pad : w / 2 - pad - slotW;
              imgCX = slotLeft + slotW / 2;
              imgCY = 0;
              tx0 = wm.imagePosition === 'left' ? slotLeft + slotW + gap : -w / 2 + pad;
              ty0 = -h / 2 + pad;
              tw = Math.max(0, innerW - slotW - gap);
              th = innerH;
            }
            // سایه تصویر (پشت تصویر)
            if (shadow.blur > 0) {
              ctx.save();
              ctx.shadowColor = shadow.color;
              ctx.shadowBlur = shadow.blur * pxScale;
              ctx.shadowOffsetY = shadow.offsetY * pxScale;
              ctx.drawImage(wmImg, imgCX - dw / 2, imgCY - dh / 2, dw, dh);
              ctx.restore();
            }
            ctx.drawImage(wmImg, imgCX - dw / 2, imgCY - dh / 2, dw, dh);
            drawTextInSlot(tx0, ty0, tw, th);
          } else {
            drawTextInSlot(-w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2);
          }

          ctx.restore();
          // حاشیه خارج از کلیپ (کل کادر)
          if (wm.borderWidth > 0) {
            ctx.save();
            ctx.globalAlpha = wm.opacity / 100;
            ctx.translate(cx, cy);
            ctx.rotate((wm.rotation * Math.PI) / 180);
            ctx.beginPath();
            ctx.roundRect(-w / 2, -h / 2, w, h, rad);
            ctx.lineWidth = wm.borderWidth * pxScale;
            ctx.strokeStyle = wm.borderColor;
            ctx.stroke();
            ctx.restore();
          }
        }

        canvas.toBlob(async (blob) => {
          if (!blob) {
            setExportError('خطا در ساخت تصویر خروجی.');
            setExporting(false);
            return;
          }
          try {
            const srcName = localFile ? localFile.name : asset?.name || 'image';
            const fileName = srcName.replace(/\.[^.]+$/, '') + '-edited.png';
            const file = new File([blob], fileName, { type: 'image/png' });
            if (localFile && onLocalSaved) {
              onLocalSaved(file);
              onClose();
              return;
            }
            const targetFolderId =
              folderId === undefined || folderId === null || folderId === ''
                ? null
                : Number(folderId);
            const res = await uploadMediaFile(file, targetFolderId);
            setExporting(false);
            onSave(toGalleryAsset(res.data));
          } catch (e: any) {
            setExportError(e?.message || 'خطا در ذخیره روی سرور.');
            setExporting(false);
          }
        }, 'image/png');
      } catch (e) {
        setExportError('خطا در ساخت تصویر خروجی (ممکن است بارگذاری تصویر با محدودیت CORS مواجه شده باشد).');
        setExporting(false);
      }
    };
    img.onerror = () => {
      setExportError('امکان بارگذاری تصویر اصلی وجود ندارد.');
      setExporting(false);
    };
    // آدرس stream هدر CORS دارد تا canvas با crossOrigin قابل استفاده باشد
    img.src = localFile ? URL.createObjectURL(localFile) : getMediaStreamUrl(asset);
  };

  const filterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) blur(${blur}px) hue-rotate(${hue}deg)`;
  const fitted = computeFitted();

  return (
    <AnimatePresence>
      {(asset || localFile) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-[96vw] lg:max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
          >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                ویرایشگر تصویر
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                فایل: {(localFile ? localFile.name : asset?.name) || ''} ({localFile ? localFile.type : asset?.type})
                {localFile ? ' — پیش از آپلود' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAll}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Undo className="w-3.5 h-3.5" />
              <span>بازنشانی تغییرات</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Main Interactive Canvas Preview */}
          <div ref={previewRef} className="lg:col-span-8 bg-slate-950/90 relative flex items-center justify-center p-6 overflow-hidden min-h-[380px]">
            <div className="relative max-w-full max-h-[520px] flex items-center justify-center overflow-hidden transition-all duration-300">
              <div
                ref={wrapperRef}
                className="relative min-w-0 flex items-center justify-center"
                style={
                  fitted
                    ? {
                        width: fitted.rotated ? fitted.dispH : fitted.dispW,
                        height: fitted.rotated ? fitted.dispW : fitted.dispH
                      }
                    : undefined
                }
              >
                <img
                  src={localFile ? URL.createObjectURL(localFile) : asset.url}
                  alt={asset?.name || localFile?.name || ''}
                  onPointerDown={() => {
                    /* no-op: single watermark keeps selection */
                  }}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    if (el.naturalWidth) {
                      setNaturalDims({ w: el.naturalWidth, h: el.naturalHeight });
                    }
                  }}
                  className="block shrink-0 max-w-full max-h-[480px] w-auto h-auto object-contain rounded-xl shadow-2xl transition-all duration-200"
                  style={{
                    ...(fitted
                      ? { width: fitted.dispW, height: fitted.dispH, maxWidth: 'none', maxHeight: 'none' }
                      : {}),
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})`,
                    filter: filterStyle
                  }}
                />

                {/* Crop overlay — rotates/flips together with the image */}
                {(activeTab === 'transform' || cropActive) && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
                  >
                    <div
                      className="absolute border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                      style={{
                        left: `${cropRect.x}%`,
                        top: `${cropRect.y}%`,
                        width: `${cropRect.w}%`,
                        height: `${cropRect.h}%`
                      }}
                    >
                      {activeTab === 'transform' && (
                        <div
                          className="absolute inset-0 cursor-move touch-none select-none pointer-events-auto"
                          onPointerDown={(e) => startCropDrag(e, 'move')}
                          onPointerMove={moveCropDrag}
                          onPointerUp={endCropDrag}
                          onPointerCancel={endCropDrag}
                        >
                          {/* Rule-of-thirds grid */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/40" />
                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/40" />
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/40" />
                            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/40" />
                          </div>
                          {/* Corner handles */}
                          {(
                            [
                              { mode: 'nw', cls: '-left-1.5 -top-1.5', cur: 'nwse-resize' },
                              { mode: 'ne', cls: '-right-1.5 -top-1.5', cur: 'nesw-resize' },
                              { mode: 'sw', cls: '-left-1.5 -bottom-1.5', cur: 'nesw-resize' },
                              { mode: 'se', cls: '-right-1.5 -bottom-1.5', cur: 'nwse-resize' }
                            ] as { mode: CropDragMode; cls: string; cur: string }[]
                          ).map((h) => (
                            <div
                              key={h.mode}
                              className={`absolute w-3 h-3 rounded-sm bg-white border-2 border-teal-500 shadow-md touch-none ${h.cur} ${h.cls}`}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                startCropDrag(e, h.mode);
                              }}
                              onPointerMove={moveCropDrag}
                              onPointerUp={endCropDrag}
                              onPointerCancel={endCropDrag}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Watermark — یک لایه واحد (متن + تصویر اختیاری) */}
                {watermark && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
                  >
                    {(() => {
                      const wm = watermark;
                      const shadow = WM_SHADOW_PRESETS[wm.shadow] ?? WM_SHADOW_PRESETS.none;
                      const vertical = wm.imagePosition === 'top' || wm.imagePosition === 'bottom';
                      return (
                        <div
                          className="absolute pointer-events-auto select-none touch-none"
                          style={{
                            left: `${wm.x}%`,
                            top: `${wm.y}%`,
                            width: `${wm.width}%`,
                            height: `${wm.height}%`,
                            transform: `rotate(${wm.rotation}deg)`,
                            opacity: wm.opacity / 100,
                            cursor: 'move'
                          }}
                          onPointerDown={(e) => startWmLayerDrag(e, wm, 'move')}
                          onPointerMove={moveWmLayerDrag}
                          onPointerUp={endWmLayerDrag}
                          onPointerCancel={endWmLayerDrag}
                        >
                          <div
                            className="w-full h-full flex overflow-hidden"
                            style={{
                              flexDirection:
                                wm.imagePosition === 'top'
                                  ? 'column'
                                  : wm.imagePosition === 'bottom'
                                  ? 'column-reverse'
                                  : wm.imagePosition === 'left'
                                  ? 'row-reverse'
                                  : 'row',
                              alignItems: vertical ? 'center' : undefined,
                              justifyContent: vertical ? undefined : 'center',
                              gap: 6,
                              padding: wm.padding,
                              background:
                                wm.backgroundColor && wm.backgroundColor !== 'transparent'
                                  ? wm.backgroundColor
                                  : undefined,
                              borderRadius: wm.borderRadius,
                              border:
                                wm.borderWidth > 0
                                  ? `${wm.borderWidth}px solid ${wm.borderColor}`
                                  : undefined,
                              boxShadow: shadow.css === 'none' ? undefined : shadow.css
                            }}
                          >
                            {wm.imageContent && (
                              <div
                                className="flex items-center justify-center overflow-hidden shrink-0"
                                style={{
                                  width: vertical ? '100%' : '35%',
                                  height: vertical ? '35%' : '100%'
                                }}
                              >
                                <img
                                  src={wm.imageContent}
                                  alt=""
                                  draggable={false}
                                  className="pointer-events-none"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    objectFit: 'contain',
                                    borderRadius: 4
                                  }}
                                />
                              </div>
                            )}
                            <div
                              className="flex-1 min-w-0 min-h-0 flex overflow-hidden"
                              style={{
                                alignItems:
                                  wm.alignVertical === 'top'
                                    ? 'flex-start'
                                    : wm.alignVertical === 'bottom'
                                    ? 'flex-end'
                                    : 'center',
                                justifyContent:
                                  wm.textAlign === 'right'
                                    ? 'flex-end'
                                    : wm.textAlign === 'left'
                                    ? 'flex-start'
                                    : 'center',
                                textAlign: wm.textAlign,
                                fontFamily: wm.fontFamily,
                                fontSize: wm.fontSize,
                                fontWeight: wm.fontWeight,
                                fontStyle: wm.fontStyle,
                                color: wm.color,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                              }}
                            >
                              <span className="w-full">{wm.text}</span>
                            </div>
                          </div>
                          {/* Selection outline */}
                          <div className="absolute inset-0 pointer-events-none border-2 border-teal-400/90" />
                          {/* Rotate handle */}
                          <div
                            className="absolute -top-7 left-1/2 w-6 h-6 rounded-full bg-white border-2 border-teal-500 shadow-md cursor-grab active:cursor-grabbing touch-none"
                            style={{ transform: 'translateX(-50%)' }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              startWmRotate(e, wm);
                            }}
                            onPointerMove={moveWmRotate}
                            onPointerUp={endWmLayerDrag}
                            onPointerCancel={endWmLayerDrag}
                          >
                            <RotateCw className="w-3 h-3 text-teal-600 absolute inset-0 m-auto" />
                          </div>
                          {/* Corner resize handles */}
                          {(
                            [
                              { mode: 'nw', cls: '-left-1.5 -top-1.5', cur: 'nwse-resize' },
                              { mode: 'ne', cls: '-right-1.5 -top-1.5', cur: 'nesw-resize' },
                              { mode: 'sw', cls: '-left-1.5 -bottom-1.5', cur: 'nesw-resize' },
                              { mode: 'se', cls: '-right-1.5 -bottom-1.5', cur: 'nwse-resize' }
                            ] as { mode: 'nw' | 'ne' | 'sw' | 'se'; cls: string; cur: string }[]
                          ).map((h) => (
                            <div
                              key={h.mode}
                              className={`absolute w-3.5 h-3.5 rounded-sm bg-white border-2 border-teal-500 shadow-md touch-none ${h.cur} ${h.cls}`}
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                startWmLayerDrag(e, wm, h.mode);
                              }}
                              onPointerMove={moveWmLayerDrag}
                              onPointerUp={endWmLayerDrag}
                              onPointerCancel={endWmLayerDrag}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Canvas Badge */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[11px] flex items-center gap-2">
              <span>چرخش: {rotation}°</span>
              <span>•</span>
              <span>روشنایی: {brightness}%</span>
            </div>
          </div>

          {/* Right Controls Panel */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto">
            {/* Control Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950/40">
              <button
                onClick={() => setActiveTab('transform')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'transform'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="چرخش و برش"
              >
                <Crop className="w-4 h-4" />
                <span>برش</span>
              </button>

              <button
                onClick={() => setActiveTab('adjust')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'adjust'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="تنظیم رنگ و نور"
              >
                <Sliders className="w-4 h-4" />
                <span>تنظیمات</span>
              </button>

              <button
                onClick={() => setActiveTab('watermark')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'watermark'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="واترمارک"
              >
                <Type className="w-4 h-4" />
                <span>واترمارک</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  activeTab === 'export'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="ذخیره در سرور"
              >
                <Save className="w-4 h-4" />
                <span>ذخیره</span>
              </button>
            </div>

            {/* Controls Content */}
            <div className="p-5 flex-1 space-y-5">
              {activeTab === 'transform' && (
                <div className="space-y-5">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    چرخش و قرینه‌سازی
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>چرخش ۹۰ درجه</span>
                    </button>

                    <button
                      onClick={() => setFlipH((f) => !f)}
                      className={`p-3 rounded-2xl transition-all text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                        flipH
                          ? 'bg-teal-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <FlipHorizontal className="w-4 h-4" />
                      <span>قرینه‌سازی افقی</span>
                    </button>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-slate-800">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      نسبت ابعاد برش (Aspect Ratio):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['free', '16:9', '4:3', '1:1', '9:16'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => handleCropPreset(ratio)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            cropPreset === ratio
                              ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400 font-black'
                              : 'border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {ratio === 'free' ? 'آزاد' : ratio}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      برای برش، گوشه‌های کادر را بکشید؛ برای جابجایی کادر، داخل آن را بکشید. انتخاب نسبت ابعاد، کادر برش را محدود می‌کند.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'adjust' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    تنظیمات نور و فیلترهای رنگی
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>روشنایی (Brightness)</span>
                        <span className="text-teal-600">{brightness}%</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="50"
                        max="150"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>کنتراست (Contrast)</span>
                        <span className="text-teal-600">{contrast}%</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="50"
                        max="150"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>غلظت رنگ (Saturation)</span>
                        <span className="text-teal-600">{saturate}%</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="0"
                        max="200"
                        value={saturate}
                        onChange={(e) => setSaturate(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>ماتی و محوشدگی (Blur)</span>
                        <span className="text-teal-600">{blur}px</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="0"
                        max="10"
                        value={blur}
                        onChange={(e) => setBlur(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        <span>چرخش رنگ (Hue)</span>
                        <span className="text-teal-600">{hue}°</span>
                      </div>
                      <input
                        type="range"
                        dir="ltr"
                        min="0"
                        max="360"
                        value={hue}
                        onChange={(e) => setHue(Number(e.target.value))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'watermark' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    واترمارک
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    یک لایه واترمارک شامل متن و در صورت تمایل یک تصویر (بالا، پایین، چپ یا راست متن).
                  </p>

                  {!watermark ? (
                    <button
                      type="button"
                      onClick={addWatermark}
                      className="w-full py-2.5 px-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-teal-500/20 transition-all cursor-pointer"
                    >
                      <Type className="w-4 h-4" />
                      افزودن واترمارک
                    </button>
                  ) : (
                    <>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800 space-y-3">
                        {/* متن */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 block">متن واترمارک</label>
                          <textarea
                            rows={2}
                            value={watermark.text}
                            onChange={(e) => updateWatermark({ text: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                          />
                        </div>

                        {/* تصویر همراه متن */}
                        <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-purple-600 dark:text-purple-400">
                            <ImagePlus className="w-3.5 h-3.5" />
                            <span>تصویر همراه متن</span>
                          </div>
                          {watermark.imageContent ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={watermark.imageContent}
                                alt=""
                                className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-slate-700"
                              />
                              <div className="flex-1 flex flex-col gap-1">
                                <button
                                  type="button"
                                  onClick={() => setWmPickerOpen(true)}
                                  className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline text-right cursor-pointer"
                                >
                                  تغییر تصویر
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateWatermark({ imageContent: '', mediaId: undefined })}
                                  className="text-[10px] font-bold text-red-500 hover:underline text-right cursor-pointer"
                                >
                                  حذف تصویر
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setWmPickerOpen(true)}
                              className="w-full py-2 px-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-purple-500/20 transition-all cursor-pointer"
                            >
                              <ImagePlus className="w-4 h-4" />
                              افزودن تصویر به متن
                            </button>
                          )}
                          {watermark.imageContent && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                                موقعیت تصویر نسبت به متن
                              </span>
                              <div className="grid grid-cols-4 gap-1.5">
                                {(
                                  [
                                    { id: 'top', label: 'بالا', icon: <ArrowUp className="w-3.5 h-3.5" /> },
                                    { id: 'bottom', label: 'پایین', icon: <ArrowDown className="w-3.5 h-3.5" /> },
                                    { id: 'left', label: 'چپ', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
                                    { id: 'right', label: 'راست', icon: <ArrowRight className="w-3.5 h-3.5" /> }
                                  ] as const
                                ).map((p) => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => updateWatermark({ imagePosition: p.id })}
                                    className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                                      watermark.imagePosition === p.id
                                        ? 'bg-purple-500/10 border-purple-500 text-purple-600 dark:text-purple-400'
                                        : 'border-gray-200 dark:border-slate-800 text-slate-500'
                                    }`}
                                  >
                                    {p.icon}
                                    <span>{p.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Typography */}
                        <div className="pt-3 border-t border-gray-200 dark:border-slate-800 space-y-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-teal-600 dark:text-teal-400">
                            <Type className="w-3.5 h-3.5" />
                            <span>تایپوگرافی و فونت</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">نام فونت</span>
                              <select
                                value={watermark.fontFamily}
                                onChange={(e) => updateWatermark({ fontFamily: e.target.value })}
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                              >
                                <option value="Vazirmatn, Tahoma, sans-serif">وزیرمتن (فارسی)</option>
                                <option value="Poppins, sans-serif">Poppins</option>
                                <option value="Inter, sans-serif">Inter</option>
                                <option value="Impact, sans-serif">Impact (برجسته)</option>
                                <option value="Allemand, serif">Allemand</option>
                              </select>
                            </label>
                            <label className="block">
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">اندازه فونت (px)</span>
                              <input
                                type="number"
                                dir="ltr"
                                min={6}
                                max={300}
                                value={Math.round(watermark.fontSize)}
                                onChange={(e) =>
                                  updateWatermark({
                                    fontSize: clampNum(Number(e.target.value), 6, 300)
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                              />
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">رنگ متن</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={watermark.color}
                                  onChange={(e) => updateWatermark({ color: e.target.value })}
                                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                                />
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={watermark.color}
                                  onChange={(e) => updateWatermark({ color: e.target.value })}
                                  className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                                />
                              </div>
                            </label>
                            <label className="block">
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">وزن فونت</span>
                              <select
                                value={String(watermark.fontWeight)}
                                onChange={(e) => updateWatermark({ fontWeight: e.target.value })}
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                              >
                                <option value="400">عادی (400)</option>
                                <option value="600">نیمه‌برجسته (600)</option>
                                <option value="800">برجسته (800)</option>
                                <option value="900">فوق‌برجسته (900)</option>
                              </select>
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <label className="block">
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">سبک</span>
                              <select
                                value={watermark.fontStyle}
                                onChange={(e) =>
                                  updateWatermark({ fontStyle: e.target.value as 'normal' | 'italic' })
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                              >
                                <option value="normal">عادی</option>
                                <option value="italic">ایتالیک</option>
                              </select>
                            </label>
                            <label className="block">
                              <span className="text-[10px] font-bold text-slate-500 block mb-1">پدینگ (px)</span>
                              <input
                                type="number"
                                dir="ltr"
                                min={0}
                                max={60}
                                value={Math.round(watermark.padding)}
                                onChange={(e) =>
                                  updateWatermark({
                                    padding: clampNum(Number(e.target.value), 0, 60)
                                  })
                                }
                                className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                              />
                            </label>
                          </div>
                          {/* Text alignment */}
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">تراز افقی</span>
                            <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-1">
                              {(
                                [
                                  { id: 'right', icon: <AlignRight className="w-3.5 h-3.5" />, label: 'راست' },
                                  { id: 'center', icon: <AlignCenter className="w-3.5 h-3.5" />, label: 'وسط' },
                                  { id: 'left', icon: <AlignLeft className="w-3.5 h-3.5" />, label: 'چپ' }
                                ] as const
                              ).map((a) => (
                                <button
                                  key={a.id}
                                  onClick={() => updateWatermark({ textAlign: a.id })}
                                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    watermark.textAlign === a.id
                                      ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950'
                                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                  }`}
                                >
                                  {a.icon}
                                  <span>{a.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">تراز عمودی</span>
                            <div className="flex gap-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-1">
                              {(
                                [
                                  { id: 'top', icon: <AlignVerticalJustifyStart className="w-3.5 h-3.5" />, label: 'بالا' },
                                  { id: 'center', icon: <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />, label: 'وسط' },
                                  { id: 'bottom', icon: <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />, label: 'پایین' }
                                ] as const
                              ).map((a) => (
                                <button
                                  key={a.id}
                                  onClick={() => updateWatermark({ alignVertical: a.id })}
                                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    (watermark.alignVertical ?? 'center') === a.id
                                      ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950'
                                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                  }`}
                                >
                                  {a.icon}
                                  <span>{a.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer">
                              <input
                                type="color"
                                value={watermark.backgroundColor}
                                onChange={(e) => updateWatermark({ backgroundColor: e.target.value })}
                                className="w-8 h-8 rounded-lg cursor-pointer"
                              />
                              رنگ پس‌زمینه
                            </label>
                            <button
                              type="button"
                              onClick={() => updateWatermark({ backgroundColor: 'transparent' })}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                watermark.backgroundColor === 'transparent'
                                  ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                  : 'border-gray-200 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              بدون پس‌زمینه
                            </button>
                          </div>
                        </div>

                        {/* Position & Size */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500">اندازه و موقعیت</span>
                          <button
                            type="button"
                            title={wmAspectLock ? 'قفل نسبت ابعاد' : 'آزاد کردن نسبت ابعاد'}
                            onClick={() => setWmAspectLock((l) => !l)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              wmAspectLock
                                ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                : 'border-gray-200 dark:border-slate-800 text-slate-500'
                            }`}
                          >
                            {wmAspectLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {wmAspectLock ? 'نسبت قفل' : 'نسبت آزاد'}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">موقعیت X (%)</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={Math.round(watermark.x)}
                              onChange={(e) =>
                                updateWatermark({
                                  x: clampNum(Number(e.target.value), 0, 100 - watermark.width)
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">موقعیت Y (%)</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={Math.round(watermark.y)}
                              onChange={(e) =>
                                updateWatermark({
                                  y: clampNum(Number(e.target.value), 0, 100 - watermark.height)
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">عرض (%)</span>
                            <input
                              type="number"
                              min={2}
                              max={100}
                              value={Math.round(watermark.width)}
                              onChange={(e) =>
                                updateWatermark({
                                  width: clampNum(Number(e.target.value), 2, 100)
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">ارتفاع (%)</span>
                            <input
                              type="number"
                              min={2}
                              max={100}
                              value={Math.round(watermark.height)}
                              onChange={(e) =>
                                updateWatermark({
                                  height: clampNum(Number(e.target.value), 2, 100)
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </label>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Move className="w-3.5 h-3.5" />
                            چرخش: {watermark.rotation}°
                          </span>
                          <input
                            type="range"
                            dir="ltr"
                            min={-180}
                            max={180}
                            value={watermark.rotation}
                            onChange={(e) =>
                              updateWatermark({ rotation: Number(e.target.value) })
                            }
                            className="w-32 accent-teal-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            <span>شفافیت</span>
                            <span className="text-teal-600">{watermark.opacity}%</span>
                          </div>
                          <input
                            type="range"
                            dir="ltr"
                            min={10}
                            max={100}
                            value={watermark.opacity}
                            onChange={(e) =>
                              updateWatermark({ opacity: Number(e.target.value) })
                            }
                            className="w-full accent-teal-500 cursor-pointer"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">ضخامت حاشیه (px)</span>
                            <input
                              type="number"
                              min={0}
                              max={30}
                              value={watermark.borderWidth}
                              onChange={(e) =>
                                updateWatermark({
                                  borderWidth: clampNum(Number(e.target.value), 0, 30)
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">گوشه گرد (px)</span>
                            <input
                              type="number"
                              min={0}
                              max={200}
                              value={watermark.borderRadius}
                              onChange={(e) =>
                                updateWatermark({
                                  borderRadius: clampNum(Number(e.target.value), 0, 200)
                                })
                              }
                              className="w-full px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                            />
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 cursor-pointer">
                            <input
                              type="color"
                              value={watermark.borderColor}
                              onChange={(e) =>
                                updateWatermark({ borderColor: e.target.value })
                              }
                              className="w-8 h-8 rounded-lg cursor-pointer"
                            />
                            رنگ حاشیه
                          </label>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">سایه</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(Object.keys(WM_SHADOW_PRESETS) as WmShadowKey[]).map((key) => (
                              <button
                                key={key}
                                onClick={() => updateWatermark({ shadow: key })}
                                className={`p-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  watermark.shadow === key
                                    ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                    : 'border-gray-200 dark:border-slate-800 text-slate-500'
                                }`}
                              >
                                {WM_SHADOW_PRESETS[key].label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={removeWatermark}
                          className="w-full py-2 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف واترمارک
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'export' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    ذخیره تصویر ویرایش‌شده در سرور
                  </h4>

                  <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                    <Save className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
                    <p>
                      تمام تغییرات (چرخش، قرینه، فیلترها و واترمارک) اعمال و به‌صورت یک
                      فایل <span className="font-bold">PNG</span> جدید در سرور ذخیره می‌شود.
                    </p>
                  </div>

                  {exportError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                      <ImageOff className="w-4 h-4 shrink-0" />
                      <span>{exportError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleExportSave}
                    disabled={exporting}
                    className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {exporting ? 'در حال ذخیره روی سرور...' : 'ذخیره تصویر ویرایش‌شده در سرور (PNG)'}
                  </button>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    نسخه ویرایش‌شده به‌صورت یک فایل جدید در مخزن ذخیره می‌شود؛ نسخه اصلی دست‌نخورده باقی می‌ماند.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
          </motion.div>
        </div>
      )}

      {/* Media picker for watermark image (attached to the single watermark) */}
      <MediaManager
        open={wmPickerOpen}
        onClose={() => setWmPickerOpen(false)}
        onSelect={(url: string, file?: { id?: string; name?: string }) => {
          updateWatermark({ imageContent: url, mediaId: file?.id });
          setWmPickerOpen(false);
        }}
        filter="image"
        title="انتخاب تصویر واترمارک"
      />
    </AnimatePresence>
  );
};
