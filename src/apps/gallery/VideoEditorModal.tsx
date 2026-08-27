import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Pause,
  Save,
  Undo,
  Film,
  Volume2,
  VolumeX,
  Scissors,
  Sparkles,
  AlertCircle,
  Loader2,
  SkipBack,
  SkipForward,
  RotateCcw,
  Music
} from 'lucide-react';
import { GalleryAsset, toGalleryAsset } from './types';
import { getMediaStreamUrl, uploadMediaFile } from './api';

interface VideoEditorModalProps {
  asset: GalleryAsset | null;
  folderId?: string | null;
  onClose: () => void;
  onSave: (updatedAsset: GalleryAsset) => void;
}

type EditorTab = 'trim' | 'audio' | 'effects' | 'export';

/* ---------- Effects presets (mirror image editor's تنظیمات tab) ---------- */
interface EffectPreset {
  id: string;
  label: string;
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  invert: number;
  blur: number;
}

const EFFECT_PRESETS: EffectPreset[] = [
  { id: 'none', label: 'بدون افکت', brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, blur: 0 },
  { id: 'bw', label: 'سیاه‌وسفید', brightness: 100, contrast: 100, saturate: 100, grayscale: 100, sepia: 0, hueRotate: 0, invert: 0, blur: 0 },
  { id: 'sepia', label: 'سپیا', brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 80, hueRotate: 0, invert: 0, blur: 0 },
  { id: 'vintage', label: 'کلاسیک', brightness: 96, contrast: 110, saturate: 90, grayscale: 0, sepia: 40, hueRotate: 0, invert: 0, blur: 0 },
  { id: 'vivid', label: 'پررنگ', brightness: 100, contrast: 115, saturate: 160, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, blur: 0 },
  { id: 'cool', label: 'سرد', brightness: 100, contrast: 105, saturate: 120, grayscale: 0, sepia: 0, hueRotate: 180, invert: 0, blur: 0 },
  { id: 'warm', label: 'گرم', brightness: 100, contrast: 102, saturate: 140, grayscale: 0, sepia: 25, hueRotate: -15, invert: 0, blur: 0 },
  { id: 'invert', label: 'منفی', brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 100, blur: 0 },
  { id: 'soft', label: 'ملایم', brightness: 108, contrast: 95, saturate: 90, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, blur: 0 }
];

/* ---------- Small helpers ---------- */
const faDigits = (s: string | number) =>
  String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

const formatTime = (sec: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

/* زمان‌بندی قاب‌به‌قاب: ساعت:دقیقه:ثانیه:فریم (برای مکانیابی دقیق فریم‌ها) */
const formatTimeFrame = (sec: number, fps: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const f = Math.max(1, Math.round(fps) || 25);
  const totalSec = Math.floor(sec);
  const frame = Math.floor((sec - totalSec) * f);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(frame).padStart(2, '0')}`;
};

/* ---------- Container-level audio detection ----------
   Some Chromium builds never decode audio from <video> elements in embedded
   webviews (webkitAudioDecodedByteCount stays 0 even for videos with sound),
   so runtime "decoded bytes" probes can false-negative. MP4/MOV box parsing
   is deterministic and needs no audio pipeline: we walk moov → trak → mdia →
   hdlr looking for a handler_type of 'soun'. */
function mp4HasAudioTrack(buf: ArrayBuffer): boolean | null {
  // true/false when the box tree is parseable, null when it isn't MP4/MOV.
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  if (u8.length < 12) return null;
  const ftyp = String.fromCharCode(u8[4], u8[5], u8[6], u8[7]);
  if (ftyp !== 'ftyp') return null;
  const handlers: string[] = [];
  const stack: Array<[number, number]> = [[0, u8.length]];
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let p = start;
    while (p + 8 <= end) {
      const size = dv.getUint32(p);
      let boxEnd = p + size;
      if (size === 1) {
        if (p + 16 > end) break;
        const hi = dv.getUint32(p + 8);
        const lo = dv.getUint32(p + 12);
        boxEnd = p + 8 + hi * 4294967296 + lo;
      } else if (size === 0) {
        boxEnd = end;
      } else if (size < 8) {
        break; // malformed
      }
      const type = String.fromCharCode(u8[p + 4], u8[p + 5], u8[p + 6], u8[p + 7]);
      if (type === 'hdlr' && p + 20 <= Math.min(boxEnd, end)) {
        handlers.push(String.fromCharCode(u8[p + 16], u8[p + 17], u8[p + 18], u8[p + 19]));
      } else if (type === 'moov' || type === 'trak' || type === 'mdia' || type === 'minf' || type === 'stbl' || type === 'udta' || type === 'edts') {
        stack.push([p + 8, Math.min(boxEnd, end)]);
      }
      if (boxEnd <= p || boxEnd > end) break; // out of range → stop this walk
      p = boxEnd;
    }
  }
  return handlers.includes('soun');
}

async function detectContainerAudio(asset: GalleryAsset | null): Promise<boolean | null> {
  // null = unknown (not MP4-family, or could not be parsed) → runtime probe fallback
  if (!asset) return null;
  const name = (asset.name || '').toLowerCase();
  if (!/\.(mp4|mov|m4v)$/.test(name)) return null;
  const url = getMediaStreamUrl(asset);
  // Small files: fetch the whole file for an authoritative parse.
  let total: number | null = null;
  try {
    const head = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    const cr = head.headers.get('Content-Range'); // "bytes 0-0/243256"
    if (cr) {
      const n = parseInt(cr.split('/')[1] || '', 10);
      if (isFinite(n)) total = n;
    }
  } catch {
    /* ignore */
  }
  if (total !== null && total > 0 && total <= 5 * 1024 * 1024) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const verdict = mp4HasAudioTrack(await r.arrayBuffer());
        if (verdict !== null) return verdict;
      }
    } catch {
      /* fall through to partial scan */
    }
  }
  // Larger files: scan head (faststart) + tail (moov at end) chunks.
  const parts: ArrayBuffer[] = [];
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-65535' } });
    if (r.ok) parts.push(await r.arrayBuffer());
  } catch {
    /* ignore */
  }
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=-1048576' } });
    if (r.ok) parts.push(await r.arrayBuffer());
  } catch {
    /* ignore */
  }
  if (!parts.length) return null;
  const findings = parts.map(mp4HasAudioTrack).filter((x): x is boolean => x !== null);
  if (findings.includes(true)) return true;
  // If we saw the complete file size above and it is small, the tail chunk
  // covered the whole file → absence of 'soun' is authoritative.
  if (total !== null && total <= 2 * 1024 * 1024 && findings.includes(false)) return false;
  return null;
}

interface FilterValues {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  invert: number;
  blur: number;
}

const buildFilter = (f: FilterValues) =>
  `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) ` +
  `grayscale(${f.grayscale}%) sepia(${f.sepia}%) hue-rotate(${f.hueRotate}deg) ` +
  `invert(${f.invert}%) blur(${f.blur}px)`;

const filterToPresetId = (f: FilterValues): string =>
  EFFECT_PRESETS.find(
    (p) =>
      p.brightness === f.brightness &&
      p.contrast === f.contrast &&
      p.saturate === f.saturate &&
      p.grayscale === f.grayscale &&
      p.sepia === f.sepia &&
      p.hueRotate === f.hueRotate &&
      p.invert === f.invert &&
      p.blur === f.blur
  )?.id ?? 'custom';

/* Top-level slider row (stable component type — avoids remount on drag) */
const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, unit, onChange }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <span className="text-slate-400 dark:text-slate-500">
        {faDigits(value)}
        {unit}
      </span>
    </div>
    <input
      type="range"
      dir="ltr"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-teal-500 cursor-pointer"
    />
  </div>
);

/* ============================================================
   VideoEditorModal
   امکانات: تایم‌لاین + برش، صدا (قطع/کم‌و‌زیاد)، افکت‌ها، ذخیره
   خروجی: پردازش سمت کلاینت — canvas.captureStream + MediaRecorder
   ============================================================ */
export const VideoEditorModal: React.FC<VideoEditorModalProps> = ({
  asset,
  folderId,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('trim');

  /* playback */
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState(true);
  /* نرخ فریم ویدئو — برای نمایش قاب‌به‌قاب روی تایم‌لاین */
  const [fps, setFps] = useState(25);
  const fpsRef = useRef(25);

  /* trim */
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  /* audio */
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100); // 0..200 (تقویت)

  /* effects */
  const [filters, setFilters] = useState<FilterValues>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    invert: 0,
    blur: 0
  });

  /* export */
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dragModeRef = useRef<'start' | 'end' | 'playhead' | null>(null);
  const audioProbedRef = useRef(false);
  /* null = unknown (container scan not done / not MP4); true/false = authoritative */
  const audioKnownRef = useRef<boolean | null>(null);
  const [, forceDragRender] = useState(0);

  const filterStyle = buildFilter(filters);
  const activePreset = filterToPresetId(filters);

  /* ---------- Reset on asset change ---------- */
  useEffect(() => {
    setActiveTab('trim');
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasAudio(true);
    setFps(25);
    fpsRef.current = 25;
    setTrimStart(0);
    setTrimEnd(0);
    setMuted(false);
    setVolume(100);
    setFilters({ brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0, invert: 0, blur: 0 });
    setExporting(false);
    setExportProgress(0);
    setExportError(null);
    dragModeRef.current = null;
    audioProbedRef.current = false;
    audioKnownRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, [asset?.id]);

  /* ---------- Authoritative audio detection (container parse) ---------- */
  useEffect(() => {
    if (!asset) return;
    let cancelled = false;
    detectContainerAudio(asset).then((verdict) => {
      if (cancelled || verdict === null) return;
      audioKnownRef.current = verdict;
      setHasAudio(verdict);
    });
    return () => {
      cancelled = true;
    };
  }, [asset?.id]);

  /* ---------- Frame-rate detection (for frame-precise timeline) ---------- */
  const probeFps = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const v = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: (now: number, meta: { mediaTime: number }) => void) => number;
    };
    if (typeof v.requestVideoFrameCallback !== 'function') return;
    let lastMediaTime: number | null = null;
    let done = false;
    const step = (_now: number, meta: { mediaTime: number }) => {
      if (done) return;
      if (lastMediaTime === null) {
        lastMediaTime = meta.mediaTime;
        v.requestVideoFrameCallback!(step);
        return;
      }
      const dt = meta.mediaTime - lastMediaTime;
      lastMediaTime = meta.mediaTime;
      if (dt > 0.0005 && dt < 2) {
        const f = Math.round(1 / dt);
        if (f >= 12 && f <= 120) {
          done = true;
          fpsRef.current = f;
          setFps(f);
          return;
        }
      }
      v.requestVideoFrameCallback!(step);
    };
    v.requestVideoFrameCallback(step);
  }, []);

  /* ---------- Metadata load ---------- */
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const d = video.duration || 0;
    setDuration(d);
    setTrimEnd(d);
    // Firefox/Safari expose audio-track info directly → authoritative.
    // Chrome has neither API, so the container scan (audioKnownRef) decides;
    // while it runs we keep the previous state (default true for unknown).
    let detected: boolean | null = null;
    try {
      if ('mozHasAudio' in video) {
        detected = Boolean((video as unknown as { mozHasAudio: boolean }).mozHasAudio);
      } else if ('audioTracks' in video) {
        const tracks = (video as unknown as { audioTracks: { length: number } }).audioTracks;
        detected = tracks.length > 0;
      }
    } catch {
      /* ignore */
    }
    if (detected !== null) {
      audioKnownRef.current = detected;
      setHasAudio(detected);
    } else if (audioKnownRef.current === null) {
      setHasAudio(true); // Chrome default until the container scan resolves
    }
    applyNativeVolume();
    probeFps(); // اولین تلاش برای تشخیص نرخ فریم (قاب‌ها هنگام پخش/سیک رندر می‌شوند)
  };

  /* when playback starts, keep trying to pin down the real fps */
  useEffect(() => {
    if (playing) probeFps();
  }, [playing, probeFps]);

  const applyNativeVolume = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = muted ? 0 : Math.min(volume / 100, 1);
    video.muted = muted;
  }, [muted, volume]);

  useEffect(() => {
    applyNativeVolume();
  }, [applyNativeVolume]);

  /* ---------- Time update / trim boundary ---------- */
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    // Fallback probe for containers the scan couldn't judge (webm, etc.):
    // webkit decodes audio bytes only during playback, so after a few frames
    // we can confirm (or rule out) an audio track. Skipped when the container
    // scan already gave an authoritative answer.
    if (
      audioKnownRef.current === null &&
      'webkitAudioDecodedByteCount' in video &&
      video.currentTime > 0.3 &&
      !audioProbedRef.current
    ) {
      audioProbedRef.current = true;
      const decoded = (video as unknown as { webkitAudioDecodedByteCount: number }).webkitAudioDecodedByteCount;
      audioKnownRef.current = decoded > 0;
      setHasAudio(decoded > 0);
    }
    if (playing && video.currentTime >= trimEnd) {
      video.pause();
      setPlaying(false);
    }
  };

  /* ---------- Playback controls ---------- */
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !asset || exporting) return;
    if (video.paused) {
      if (video.currentTime < trimStart || video.currentTime >= trimEnd - 0.05) {
        video.currentTime = trimStart;
      }
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  };

  const seekTo = (t: number) => {
    const video = videoRef.current;
    if (!video || !asset) return;
    video.currentTime = Math.max(0, Math.min(t, duration));
  };

  const seekTrimStart = () => seekTo(trimStart);
  const seekTrimEnd = () => seekTo(Math.max(trimStart, trimEnd - 0.05));

  /* ---------- Trim helpers ---------- */
  const setTrimFromCurrent = () => {
    setTrimStart(Math.min(currentTime, trimEnd - 0.1));
  };
  const setTrimEndFromCurrent = () => {
    setTrimEnd(Math.max(currentTime, trimStart + 0.1));
  };
  const resetTrim = () => {
    setTrimStart(0);
    setTrimEnd(duration || 0);
  };

  /* ---------- Timeline pointer interaction ---------- */
  const timeFromEvent = (clientX: number) => {
    const el = timelineRef.current;
    if (!el || !duration) return 0;
    const rect = el.getBoundingClientRect();
    const frac = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, frac)) * duration;
  };

  const handleTimelineDown = (e: React.PointerEvent) => {
    if (!duration || !timelineRef.current) return;
    const el = timelineRef.current;
    const rect = el.getBoundingClientRect();
    const t = timeFromEvent(e.clientX);
    // Pixel-based proximity: the handles are 8px wide and the playhead 2px,
    // so a click is only a handle-grab within a small radius around its
    // actual x position — everywhere else on the timeline just seeks.
    const px = (sec: number) => rect.left + (sec / duration) * rect.width;
    const R = 14; // grab radius in px
    const nearStart = Math.abs(e.clientX - px(trimStart)) <= R;
    const nearEnd = Math.abs(e.clientX - px(trimEnd)) <= R;
    const nearPlayhead = Math.abs(e.clientX - px(currentTime)) <= R;
    let mode: 'start' | 'end' | 'playhead' | null = null;
    if (nearStart) mode = 'start';
    else if (nearEnd) mode = 'end';
    else if (nearPlayhead) mode = 'playhead';
    if (mode === 'playhead') {
      seekTo(t);
    } else if (mode === 'start') {
      setTrimStart(Math.min(t, trimEnd - 0.1));
    } else if (mode === 'end') {
      setTrimEnd(Math.max(t, trimStart + 0.1));
    } else {
      seekTo(t);
    }
    if (mode) {
      dragModeRef.current = mode;
      forceDragRender((n) => n + 1);
    }
  };

  const handleTimelineMove = (e: React.PointerEvent) => {
    const dragMode = dragModeRef.current;
    if (!dragMode || !duration) return;
    const t = timeFromEvent(e.clientX);
    if (dragMode === 'playhead') {
      seekTo(t);
    } else if (dragMode === 'start') {
      setTrimStart(Math.min(t, trimEnd - 0.1));
    } else if (dragMode === 'end') {
      setTrimEnd(Math.max(t, trimStart + 0.1));
    }
  };

  const handleTimelineUp = () => {
    dragModeRef.current = null;
    forceDragRender((n) => n + 1);
  };

  /* ---------- Presets & sliders ---------- */
  const applyPreset = (p: EffectPreset) => {
    setFilters({
      brightness: p.brightness,
      contrast: p.contrast,
      saturate: p.saturate,
      grayscale: p.grayscale,
      sepia: p.sepia,
      hueRotate: p.hueRotate,
      invert: p.invert,
      blur: p.blur
    });
  };

  const resetAll = () => {
    resetTrim();
    setMuted(false);
    setVolume(100);
    applyPreset(EFFECT_PRESETS[0]);
    seekTo(0);
  };

  const clampVolume = (v: number) => Math.max(0, Math.min(200, Math.round(v)));

  /* ---------- Export (client-side rendering) ---------- */
  const handleExportSave = async () => {
    const video = videoRef.current;
    if (!video || !asset || exporting) return;
    if (!duration) {
      setExportError('ویدئو هنوز بارگذاری نشده است.');
      return;
    }
    const seg = trimEnd - trimStart;
    if (seg < 0.1) {
      setExportError('بازه برش معتبر نیست.');
      return;
    }

    setExporting(true);
    setExportProgress(0);
    setExportError(null);
    video.pause();
    setPlaying(false);

    try {
      const sourceUrl = getMediaStreamUrl(asset);
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('مرورگر شما از خروجی پشتیبانی نمی‌کند.');

      /* Hidden export video element (CORS via stream URL) */
      const exportVideo = document.createElement('video');
      exportVideo.crossOrigin = 'anonymous';
      exportVideo.preload = 'auto';
      exportVideo.playsInline = true;
      exportVideo.muted = false;
      exportVideo.src = sourceUrl;

      await new Promise<void>((resolve, reject) => {
        exportVideo.onloadedmetadata = () => resolve();
        exportVideo.onerror = () => reject(new Error('خطا در بارگذاری ویدئوی منبع برای خروجی.'));
        setTimeout(() => reject(new Error('مهلت بارگذاری ویدئوی منبع به پایان رسید.')), 20000);
      });

      /* Frame stream */
      const stream = canvas.captureStream(30);
      const videoTracks = stream.getVideoTracks();

      /* Audio decision — for MP4/MOV the container scan (audioKnownRef) is
         authoritative and needs no runtime probing (some embedded Chromium
         builds never decode audio bytes, which would false-negative). Only
         for containers the scan couldn't judge (webm, etc.) we decode a short
         playback and count decoded audio bytes — this prevents muxing a
         garbage audio track when the source has no audio at all. */
      let exportHasAudio = !muted && hasAudio;
      if (exportHasAudio && audioKnownRef.current === null && 'webkitAudioDecodedByteCount' in exportVideo) {
        try {
          exportVideo.muted = true;
          await exportVideo.play().catch(() => undefined);
          await new Promise((r) => setTimeout(r, 600));
          const decoded = (exportVideo as unknown as { webkitAudioDecodedByteCount: number })
            .webkitAudioDecodedByteCount;
          exportHasAudio = decoded > 0;
          exportVideo.pause();
          exportVideo.muted = muted;
        } catch {
          exportHasAudio = false;
        }
      }

      /* Audio: WebAudio gain → MediaStreamDestination (no speaker output) */
      let audioCtx: AudioContext | null = null;
      if (exportHasAudio) {
        try {
          audioCtx = new (window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
          const srcNode = audioCtx.createMediaElementSource(exportVideo);
          const gain = audioCtx.createGain();
          gain.gain.value = volume / 100;
          const dest = audioCtx.createMediaStreamDestination();
          srcNode.connect(gain);
          gain.connect(dest);
          // NOTE: intentionally NOT connecting to ctx.destination — export stays silent,
          // the recorded audio track carries the volume-adjusted sound.
          videoTracks.push(...dest.stream.getAudioTracks());
        } catch {
          audioCtx = null; // export without audio
        }
      }

      /* MediaRecorder — prefer MP4 (AVC) since some Chromium builds can't demux
         MediaRecorder webm output; fall back to webm where mp4 recording is unsupported. */
      const candidates = exportHasAudio
        ? [
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
          ]
        : [
            'video/mp4;codecs=avc1',
            'video/mp4',
            'video/webm',
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8'
          ];
      const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
      const bitsPerSec = Math.max(1_000_000, Math.min(8_000_000, Math.round(75_000_000 / seg)));
      const recorder = new MediaRecorder(new MediaStream(videoTracks), {
        mimeType,
        videoBitsPerSecond: bitsPerSec
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
      });

      /* Seek to trim start */
      exportVideo.currentTime = trimStart;
      await new Promise<void>((resolve) => {
        exportVideo.onseeked = () => resolve();
        setTimeout(resolve, 4000);
      });

      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => undefined);
      }

      recorder.start(250);

      await exportVideo.play().catch(() => undefined);

      /* Render loop */
      const t0 = performance.now();
      const renderFrame = () => {
        if (!recorder || recorder.state === 'inactive') return;
        ctx.filter = filterStyle;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(exportVideo, 0, 0, canvas.width, canvas.height);
        const progress = Math.min(1, (exportVideo.currentTime - trimStart) / seg);
        setExportProgress(Math.round(progress * 100));
        if (exportVideo.currentTime < trimEnd - 0.05 && !exportVideo.ended) {
          rafRef.current = requestAnimationFrame(renderFrame);
        } else {
          /* final frame */
          ctx.filter = filterStyle;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(exportVideo, 0, 0, canvas.width, canvas.height);
          setExportProgress(100);
          setTimeout(() => {
            try {
              recorder.stop();
            } catch {
              /* already stopped */
            }
          }, 120);
        }
      };
      rafRef.current = requestAnimationFrame(renderFrame);

      await stopped;

      const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const baseName = asset.name.replace(/\.[^.]+$/, '');
      const file = new File([blob], `${baseName}-edited.${ext}`, {
        type: mimeType.split(';')[0] || 'video/webm'
      });

      const res = await uploadMediaFile(file, folderId === undefined || folderId === null || folderId === '' ? null : Number(folderId));
      if (res && res.data) {
        onSave(toGalleryAsset(res.data));
      } else {
        throw new Error('پاسخ نامعتبر از سرور دریافت شد.');
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'خطای ناشناخته در ذخیره ویدئو.');
    } finally {
      setExporting(false);
      setExportProgress(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  /* ---------- Derived values ---------- */
  const seg = Math.max(0, trimEnd - trimStart);
  const trimStartPct = duration > 0 ? (trimStart / duration) * 100 : 0;
  const trimEndPct = duration > 0 ? (trimEnd / duration) * 100 : 100;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  /* ---------- Timeline time scale (تایم‌بندی) ---------- */
  // فاصلهٔ مناسب بین خطوط را انتخاب می‌کنیم تا حدود ۸ تا ۱۲ خط روی تایم‌لاین باشد.
  const tickInterval = (() => {
    const candidates = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1800, 3600];
    if (!duration) return 60;
    for (const c of candidates) {
      if (duration / c <= 12) return c;
    }
    return 3600;
  })();
  const ticks: number[] = [];
  if (duration > 0) {
    for (let t = tickInterval; t < duration; t += tickInterval) ticks.push(t);
  }

  const handleSlider = (key: keyof FilterValues, value: number) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <AnimatePresence>
      {asset && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-[96vw] lg:max-w-6xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* ---------- Header ---------- */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    ویرایشگر ویدئو
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    فایل: {asset.name} ({asset.type})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetAll}
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

            {/* ---------- Body ---------- */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
              {/* Preview + Timeline */}
              <div className="lg:col-span-8 bg-slate-950/90 relative flex flex-col p-6 overflow-hidden min-h-[380px]">
                {/* Video preview */}
                <div className="flex-1 flex items-center justify-center min-h-0">
                  <video
                    ref={videoRef}
                    src={getMediaStreamUrl(asset)}
                    crossOrigin="anonymous"
                    playsInline
                    preload="auto"
                    className="block max-w-full max-h-[440px] w-auto h-auto object-contain rounded-xl shadow-2xl"
                    style={{ filter: filterStyle }}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                  />
                </div>

                {/* Transport controls */}
                <div className="mt-4 space-y-3">
                  {/* Play / seek row */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={seekTrimStart}
                      disabled={!duration}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors disabled:opacity-40 cursor-pointer"
                      title="رفتن به شروع برش"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={togglePlay}
                      disabled={!duration || exporting}
                      className="w-12 h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-lg transition-colors disabled:opacity-40 cursor-pointer"
                      title={playing ? 'توقف' : 'پخش'}
                    >
                      {playing ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 translate-x-0.5" />
                      )}
                    </button>
                    <button
                      onClick={seekTrimEnd}
                      disabled={!duration}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors disabled:opacity-40 cursor-pointer"
                      title="رفتن به پایان برش"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    <div className="mx-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-[11px] font-bold tabular-nums" dir="ltr">
                      {faDigits(formatTimeFrame(currentTime, fps))} / {faDigits(formatTimeFrame(duration, fps))}
                    </div>

                    <button
                      onClick={() => setMuted((m) => !m)}
                      disabled={!hasAudio || exporting}
                      className={`p-2 rounded-xl transition-colors disabled:opacity-40 cursor-pointer ${
                        muted
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-white hover:bg-slate-700'
                      }`}
                      title={muted ? 'رفع قطع صدا' : 'قطع صدا'}
                    >
                      {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Timeline */}
                  <div>
                    <div
                      ref={timelineRef}
                      onPointerDown={handleTimelineDown}
                      onPointerMove={handleTimelineMove}
                      onPointerUp={handleTimelineUp}
                      onPointerCancel={handleTimelineUp}
                      className={`relative h-14 rounded-xl bg-slate-800/80 border border-slate-700/60 overflow-hidden touch-none select-none ${
                        duration ? 'cursor-pointer' : ''
                      }`}
                    >
                      {/* base strip */}
                      <div className="absolute inset-0 opacity-40" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 10%)' }} />
                      {/* time ticks */}
                      {duration > 0 &&
                        ticks.map((t) => (
                          <div
                            key={t}
                            className="absolute top-0 bottom-0 w-px bg-white/10"
                            style={{ left: `${(t / duration) * 100}%` }}
                          />
                        ))}
                      {/* trimmed segment */}
                      {duration > 0 && (
                        <div
                          className="absolute top-0 bottom-0 bg-teal-500/25 border-x-2 border-teal-400"
                          style={{ left: `${trimStartPct}%`, width: `${Math.max(0, trimEndPct - trimStartPct)}%` }}
                        />
                      )}
                      {/* playhead */}
                      {duration > 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                          style={{ left: `${playheadPct}%` }}
                        />
                      )}
                      {/* start handle */}
                      {duration > 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-2 bg-amber-400 cursor-ew-resize touch-none"
                          style={{ left: `${trimStartPct}%`, transform: 'translateX(-50%)' }}
                          title="دسته شروع برش"
                        />
                      )}
                      {/* end handle */}
                      {duration > 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-2 bg-amber-400 cursor-ew-resize touch-none"
                          style={{ left: `${trimEndPct}%`, transform: 'translateX(-50%)' }}
                          title="دسته پایان برش"
                        />
                      )}
                    </div>
                    {/* time scale labels */}
                    {duration > 0 && (
                      <div className="relative h-4 mt-1.5 select-none">
                        {ticks.map((t) => (
                          <span
                            key={t}
                            className="absolute -translate-x-1/2 text-[8px] font-bold text-slate-500 dark:text-slate-400 leading-none"
                            style={{ left: `${(t / duration) * 100}%` }}
                          >
                            {faDigits(formatTimeFrame(t, fps))}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* trim labels */}
                    <div className="flex items-center justify-between mt-1.5 text-[10px] font-bold text-slate-400" dir="ltr">
                      <span>شروع: {faDigits(formatTimeFrame(trimStart, fps))}</span>
                      <span className="text-teal-400">
                        بازه: {faDigits(formatTimeFrame(seg, fps))}
                      </span>
                      <span>پایان: {faDigits(formatTimeFrame(trimEnd, fps))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---------- Right Controls Panel ---------- */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto">
                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950/40">
                  <button
                    onClick={() => setActiveTab('trim')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'trim'
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="برش و تایم‌لاین"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>برش</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('audio')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'audio'
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="صدا"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>صدا</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('effects')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'effects'
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="افکت‌ها"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>افکت‌ها</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('export')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'export'
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="ذخیره"
                  >
                    <Save className="w-4 h-4" />
                    <span>ذخیره</span>
                  </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* -------- Trim tab -------- */}
                  {activeTab === 'trim' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        برش ویدئو
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        با کشیدن دسته‌های زرد روی تایم‌لاین (یا کلیک روی تایم‌لاین برای جابه‌جایی
                        پخش‌کننده) بخش موردنظر را مشخص کنید. فقط بخش بین دو دسته در خروجی
                        نهایی باقی می‌ماند.
                      </p>

                      <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          بازه برش
                        </span>
                        <span className="font-black" dir="ltr">
                          {faDigits(formatTimeFrame(trimStart, fps))} ← {faDigits(formatTimeFrame(seg, fps))} → {faDigits(formatTimeFrame(trimEnd, fps))}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={setTrimFromCurrent}
                          disabled={!duration}
                          className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                        >
                          <span className="block">شروع برش از اینجا</span>
                          <span className="block text-[10px] text-slate-400 font-normal mt-0.5" dir="ltr">
                            ({faDigits(formatTimeFrame(currentTime, fps))})
                          </span>
                        </button>
                        <button
                          onClick={setTrimEndFromCurrent}
                          disabled={!duration}
                          className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all disabled:opacity-40 cursor-pointer"
                        >
                          <span className="block">پایان برش تا اینجا</span>
                          <span className="block text-[10px] text-slate-400 font-normal mt-0.5" dir="ltr">
                            ({faDigits(formatTimeFrame(currentTime, fps))})
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={resetTrim}
                        disabled={!duration}
                        className="w-full py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        بازنشانی برش (کل ویدئو)
                      </button>

                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          توجه: خروجی به‌صورت زنده (real-time) پردازش می‌شود؛ به این معنی که
                          زمان ذخیره تقریباً برابر طول بخش انتخابی است.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* -------- Audio tab -------- */}
                  {activeTab === 'audio' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        تنظیمات صدا
                      </h4>

                      {!hasAudio && (
                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
                          <Music className="w-4 h-4 shrink-0" />
                          به‌نظر می‌رسد این ویدئو صدایی ندارد.
                        </div>
                      )}

                      <button
                        onClick={() => setMuted((m) => !m)}
                        disabled={!hasAudio}
                        className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border transition-all disabled:opacity-40 cursor-pointer ${
                          muted
                            ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                            : 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400'
                        }`}
                      >
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        {muted ? 'صدا قطع است — کلیک برای فعال‌سازی' : 'صدا فعال است — کلیک برای قطع'}
                      </button>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <span>میزان صدا</span>
                          <span className="text-slate-400 dark:text-slate-500">{faDigits(volume)}٪</span>
                        </div>
                        <input
                          type="range"
                          dir="ltr"
                          min={0}
                          max={200}
                          value={volume}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setVolume(v);
                            if (v > 0 && muted) setMuted(false);
                          }}
                          disabled={!hasAudio}
                          className="w-full accent-teal-500 cursor-pointer disabled:opacity-40"
                        />
                        <div dir="ltr" className="flex justify-between text-[9px] text-slate-400 font-bold">
                          <span>۰٪</span>
                          <span>۱۰۰٪ (عادی)</span>
                          <span>۲۰۰٪ (تقویت)</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400">پیش‌تنظیم‌های صدا</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'قطع', v: 0 },
                            { label: 'کم', v: 25 },
                            { label: 'معمولی', v: 50 },
                            { label: 'زیاد', v: 100 },
                            { label: 'تقویت', v: 150 }
                          ].map((p) => (
                            <button
                              key={p.label}
                              onClick={() => {
                                setVolume(p.v);
                                setMuted(p.v === 0);
                              }}
                              disabled={!hasAudio}
                              className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all disabled:opacity-40 cursor-pointer ${
                                volume === p.v
                                  ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                  : 'border-gray-200 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                        <Volume2 className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
                        <span>
                          تنظیم صدا در پیش‌نمایش (۰ تا ۱۰۰٪) و خروجی نهایی (۰ تا ۲۰۰٪) اعمال
                          می‌شود. «تقویت» بالای ۱۰۰٪ فقط در فایل خروجی شنیده می‌شود.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* -------- Effects tab -------- */}
                  {activeTab === 'effects' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        افکت‌های ویدئو
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        افکت‌ها روی پیش‌نمایش و فایل خروجی اعمال می‌شوند.
                      </p>

                      {/* Presets */}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1.5">پیش‌تنظیم‌ها</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {EFFECT_PRESETS.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => applyPreset(p)}
                              className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                activePreset === p.id
                                  ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                  : 'border-gray-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/40'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom sliders */}
                      <div className="space-y-3 pt-1 border-t border-gray-100 dark:border-slate-800">
                        <SliderRow label="روشنایی" value={filters.brightness} min={0} max={200} unit="٪" onChange={(v) => handleSlider('brightness', v)} />
                        <SliderRow label="کنتراست" value={filters.contrast} min={0} max={200} unit="٪" onChange={(v) => handleSlider('contrast', v)} />
                        <SliderRow label="اشباع رنگ" value={filters.saturate} min={0} max={200} unit="٪" onChange={(v) => handleSlider('saturate', v)} />
                        <SliderRow label="سیاه‌وسفید" value={filters.grayscale} min={0} max={100} unit="٪" onChange={(v) => handleSlider('grayscale', v)} />
                        <SliderRow label="سپیا" value={filters.sepia} min={0} max={100} unit="٪" onChange={(v) => handleSlider('sepia', v)} />
                        <SliderRow label="چرخش رنگ" value={filters.hueRotate} min={0} max={360} unit="°" onChange={(v) => handleSlider('hueRotate', v)} />
                        <SliderRow label="منفی" value={filters.invert} min={0} max={100} unit="٪" onChange={(v) => handleSlider('invert', v)} />
                        <SliderRow label="تار" value={filters.blur} min={0} max={10} unit="px" onChange={(v) => handleSlider('blur', v)} />
                      </div>
                    </div>
                  )}

                  {/* -------- Export tab -------- */}
                  {activeTab === 'export' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        ذخیره ویدئوی ویرایش‌شده در سرور
                      </h4>

                      <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                        <Save className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
                        <p>
                          تمام تغییرات (برش، صدا و افکت‌ها) اعمال و به‌صورت یک فایل{' '}
                          <span className="font-bold">MP4</span> جدید در سرور ذخیره می‌شود.
                          (در مرورگرهایی که ضبط MP4 را پشتیبانی نمی‌کنند، خروجی WEBM خواهد بود)
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                        <span className="font-bold">مشخصات خروجی</span>
                        <span className="text-[10px]">
                          {faDigits(formatTime(seg))} • {faDigits(videoRef.current?.videoWidth ?? 0)}×{faDigits(videoRef.current?.videoHeight ?? 0)}
                        </span>
                      </div>

                      {exportError && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{exportError}</span>
                        </div>
                      )}

                      {exporting && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-500" />
                              در حال پردازش ویدئو...
                            </span>
                            <span>{faDigits(exportProgress)}٪</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-teal-500 transition-all duration-150"
                              style={{ width: `${exportProgress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            در حین پردازش از این پنجره خارج نشوید.
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleExportSave}
                        disabled={exporting || !duration}
                        className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        {exporting
                          ? 'در حال ذخیره روی سرور...'
                          : 'ذخیره ویدئوی ویرایش‌شده در سرور (MP4)'}
                      </button>

                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        نسخه ویرایش‌شده به‌صورت یک فایل جدید در مخزن ذخیره می‌شود؛ نسخه اصلی
                        دست‌نخورده باقی می‌ماند.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
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
    </AnimatePresence>
  );
};
