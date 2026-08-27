import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Play,
  Pause,
  Save,
  Undo,
  Redo,
  Music,
  Scissors,
  Sparkles,
  Mic,
  Square,
  AlertCircle,
  Loader2,
  SkipBack,
  SkipForward,
  Copy,
  ClipboardPaste,
  Trash2,
  Wand2,
  Volume2,
  Eraser
} from 'lucide-react';
import { GalleryAsset, toGalleryAsset } from '../types';
import { getMediaStreamUrl, uploadMediaFile } from '../api';
import {
  fetchAudioBuffer,
  computePeaks,
  sliceBuffer,
  removeRegion,
  insertAt,
  concatBuffers,
  applyGainRegion,
  applyFadeRegion,
  normalizePeak,
  renderEffects,
  computeNoiseProfile,
  reduceNoise,
  encodeWav,
  encodeFlac,
  encodeMp3,
  encodeViaRecorder,
  pickRecordMime,
  DEFAULT_EQ,
  DEFAULT_COMP,
  type EqParams,
  type CompParams
} from './audioEngine';

interface AudioEditorModalProps {
  asset: GalleryAsset | null;
  folderId?: string | null;
  localFile?: File | null; // ویرایش قبل از آپلود
  onLocalSaved?: (file: File) => void;
  onClose: () => void;
  onSave: (updatedAsset: GalleryAsset) => void;
}

type EditorTab = 'edit' | 'effects' | 'record' | 'export';
type ExportFormat = 'mp3' | 'wav' | 'flac' | 'm4a';

/* ---------- Small helpers ---------- */
const faDigits = (s: string | number) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

const formatTime = (sec: number) => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const dbToFactor = (db: number) => Math.pow(10, db / 20);

/* Slider row — همان کامپوننت پایدار ویرایشگر ویدئو */
const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  step?: number;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, unit, step = 1, onChange }) => (
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
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-teal-500 cursor-pointer"
    />
  </div>
);

const ActionButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, variant = 'ghost', className = '', children }) => {
  const base =
    'py-2 px-3 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5';
  const styles =
    variant === 'primary'
      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
      : variant === 'danger'
        ? 'bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 hover:bg-red-500/20'
        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200';
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
};

/* ============================================================
   AudioEditorModal
   امکانات: تایم‌لاین + موج‌نما، انتخاب ناحیه، برش/کپی/چسباندن/نگه‌داشتن،
   محو (Fade)، تقویت/نرمال‌سازی، EQ/فشرده‌سازی/حذف نویز، ضبط میکروفون،
   و خروجی MP3/WAV/FLAC/M4A به‌صورت فایل جدید روی سرور.
   ============================================================ */
export const AudioEditorModal: React.FC<AudioEditorModalProps> = ({
  asset,
  folderId,
  localFile,
  onLocalSaved,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('edit');

  /* working audio */
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* playback */
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  /* selection (ثانیه) */
  const [sel, setSel] = useState<{ start: number; end: number } | null>(null);

  /* clipboard + undo/redo */
  const clipboardRef = useRef<AudioBuffer | null>(null);
  const [hasClipboard, setHasClipboard] = useState(false);
  const [undoStack, setUndoStack] = useState<AudioBuffer[]>([]);
  const [redoStack, setRedoStack] = useState<AudioBuffer[]>([]);

  /* effects (پیش‌نمایش زنده + پخت در خروجی) */
  const [gainPct, setGainPct] = useState(100); // 0..200
  const [eq, setEq] = useState<EqParams>(DEFAULT_EQ);
  const [comp, setComp] = useState<CompParams>(DEFAULT_COMP);

  /* noise reduction */
  const [noiseProfile, setNoiseProfile] = useState<Float32Array | null>(null);
  const [noiseAmount, setNoiseAmount] = useState(1);
  const [noiseMsg, setNoiseMsg] = useState<string | null>(null);

  /* recording */
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recError, setRecError] = useState<string | null>(null);
  const [recDoneMsg, setRecDoneMsg] = useState<string | null>(null);

  /* export */
  const [exportFormat, setExportFormat] = useState<ExportFormat>('mp3');
  const [mp3Kbps, setMp3Kbps] = useState(192);
  const [wavBitDepth, setWavBitDepth] = useState<16 | 32>(16);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  /* refs */
  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const chainRef = useRef<{
    dispose: () => void;
    nodes: {
      gain: GainNode;
      lo: BiquadFilterNode;
      mid: BiquadFilterNode;
      hi: BiquadFilterNode;
      comp: DynamicsCompressorNode;
    };
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const playStartRef = useRef(0);
  const playOffsetRef = useRef(0);
  const currentTimeRef = useRef(0);
  const playingRef = useRef(false);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const paramsRef = useRef({ gain: 1, eq: DEFAULT_EQ, comp: DEFAULT_COMP });
  const compEnabledRef = useRef(DEFAULT_COMP.enabled);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const dragModeRef = useRef<'playhead' | 'selStart' | 'selEnd' | 'selNew' | null>(null);
  const dragAnchorRef = useRef(0);
  const dragStartXRef = useRef(0);
  const selAnchorRef = useRef(0);
  const [, forceRender] = useState(0);

  const recRef = useRef<{
    rec: MediaRecorder | null;
    chunks: Blob[];
    stream: MediaStream | null;
    iv: number;
    t0: number;
  } | null>(null);

  /* ---------- refs sync ---------- */
  useEffect(() => {
    bufferRef.current = buffer;
  }, [buffer]);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  const gainFactor = dbToFactor(gainPct - 100); // 100% → 0dB
  useEffect(() => {
    paramsRef.current = { gain: gainFactor, eq, comp };
  }, [gainFactor, eq, comp]);

  /* ---------- Context ---------- */
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => undefined);
    }
    return ctxRef.current;
  }, []);

  /* ---------- Load on asset change ---------- */
  useEffect(() => {
    setActiveTab('edit');
    setBuffer(null);
    setLoading(true);
    setLoadError(null);
    setPlaying(false);
    setCurrentTime(0);
    currentTimeRef.current = 0;
    setSel(null);
    setNoiseProfile(null);
    setNoiseMsg(null);
    setRecDoneMsg(null);
    setExporting(false);
    setExportProgress(0);
    setExportError(null);
    setExportFormat('mp3');
    setMp3Kbps(192);
    setWavBitDepth(16);
    setGainPct(100);
    setEq(DEFAULT_EQ);
    setComp(DEFAULT_COMP);
    setFadeIn(0);
    setFadeOut(0);
    setAmpDb(0);
    setNormDb(-3);
    setNoiseAmount(1);
    clipboardRef.current = null;
    setHasClipboard(false);
    setUndoStack([]);
    setRedoStack([]);
    stopPlayback();
    if (!asset && !localFile) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = localFile
          ? URL.createObjectURL(localFile)
          : getMediaStreamUrl(asset);
        const b = await fetchAudioBuffer(getCtx(), url);
        if (cancelled) return;
        setBuffer(b);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'خطا در بارگذاری فایل صوتی.');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, localFile?.name, localFile?.size, localFile?.lastModified]);

  /* ---------- Playback ---------- */
  const stopPlayback = useCallback(() => {
    if (chainRef.current) {
      chainRef.current.dispose();
      chainRef.current = null;
    }
    srcRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const playFrom = useCallback(
    (offset: number) => {
      const b = bufferRef.current;
      if (!b) return;
      const ctx = getCtx();
      stopPlayback();
      const t = Math.max(0, Math.min(offset, Math.max(0, b.duration - 0.01)));
      const src = ctx.createBufferSource();
      src.buffer = b;
      const gain = ctx.createGain();
      gain.gain.value = paramsRef.current.gain;
      const lo = ctx.createBiquadFilter();
      lo.type = 'lowshelf';
      lo.frequency.value = 120;
      lo.gain.value = paramsRef.current.eq.low;
      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1;
      mid.gain.value = paramsRef.current.eq.mid;
      const hi = ctx.createBiquadFilter();
      hi.type = 'highshelf';
      hi.frequency.value = 6000;
      hi.gain.value = paramsRef.current.eq.high;
      const compNode = ctx.createDynamicsCompressor();
      compNode.threshold.value = paramsRef.current.comp.threshold;
      compNode.ratio.value = paramsRef.current.comp.ratio;
      compNode.knee.value = paramsRef.current.comp.knee;
      compNode.attack.value = paramsRef.current.comp.attack;
      compNode.release.value = paramsRef.current.comp.release;
      src.connect(gain);
      gain.connect(lo);
      lo.connect(mid);
      mid.connect(hi);
      if (paramsRef.current.comp.enabled) {
        hi.connect(compNode);
        compNode.connect(ctx.destination);
      } else {
        hi.connect(ctx.destination);
      }
      const dispose = () => {
        try {
          src.disconnect();
          gain.disconnect();
          lo.disconnect();
          mid.disconnect();
          hi.disconnect();
          compNode.disconnect();
        } catch {
          /* ignore */
        }
      };
      chainRef.current = { dispose, nodes: { gain, lo, mid, hi, comp: compNode } };
      srcRef.current = src;
      playStartRef.current = ctx.currentTime;
      playOffsetRef.current = t;
      src.onended = () => stopPlayback();
      src.start(0, t);
      playingRef.current = true;
      setPlaying(true);
      const tick = () => {
        if (!srcRef.current || !bufferRef.current) return;
        const t2 = playOffsetRef.current + (ctx.currentTime - playStartRef.current);
        if (t2 >= bufferRef.current.duration) {
          stopPlayback();
          return;
        }
        currentTimeRef.current = t2;
        setCurrentTime(t2);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [getCtx, stopPlayback]
  );

  const togglePlay = () => {
    if (!buffer) return;
    if (playing) {
      stopPlayback();
    } else {
      playFrom(currentTimeRef.current);
    }
  };

  /* پارامترهای افکت زنده روی زنجیرهٔ پخش اعمال می‌شوند */
  useEffect(() => {
    const chain = chainRef.current;
    if (!chain || !playingRef.current) return;
    const p = paramsRef.current;
    chain.nodes.gain.gain.value = p.gain;
    chain.nodes.lo.gain.value = p.eq.low;
    chain.nodes.mid.gain.value = p.eq.mid;
    chain.nodes.hi.gain.value = p.eq.high;
    chain.nodes.comp.threshold.value = p.comp.threshold;
    chain.nodes.comp.ratio.value = p.comp.ratio;
    chain.nodes.comp.knee.value = p.comp.knee;
    chain.nodes.comp.attack.value = p.comp.attack;
    chain.nodes.comp.release.value = p.comp.release;
    if (compEnabledRef.current !== p.comp.enabled) {
      compEnabledRef.current = p.comp.enabled;
      // تغییر مسیر فشرده‌ساز نیاز به بازسازی زنجیره دارد
      const t = currentTimeRef.current;
      stopPlayback();
      playFrom(t);
    }
  }, [gainFactor, eq, comp, playFrom, stopPlayback]);

  useEffect(() => {
    return () => {
      stopPlayback();
      recRef.current?.stream?.getTracks().forEach((t) => t.stop());
      if (ctxRef.current) ctxRef.current.close().catch(() => undefined);
    };
  }, [stopPlayback]);

  /* ---------- Derived ---------- */
  const duration = buffer?.duration ?? 0;
  const selStart = sel ? Math.min(sel.start, sel.end) : null;
  const selEnd = sel ? Math.max(sel.start, sel.end) : null;
  const hasSelection = selStart !== null && selEnd !== null && selEnd - selStart > 0.01;
  const selLen = hasSelection && selStart !== null && selEnd !== null ? selEnd - selStart : 0;

  const peaks = useMemo(
    () => (buffer ? computePeaks(buffer, 320) : null),
    [buffer]
  );

  /* ---------- Undo / edits ---------- */
  const pushUndo = (prev: AudioBuffer) => {
    setUndoStack((s) => {
      const n = [...s, prev];
      const budget = 256 * 1024 * 1024; // ~۲۵۶ مگابایت سقف حافظه
      const out: AudioBuffer[] = [];
      let used = 0;
      for (let i = n.length - 1; i >= 0; i--) {
        const bytes = n[i].numberOfChannels * n[i].length * 4;
        if (used + bytes > budget) break;
        out.unshift(n[i]);
        used += bytes;
      }
      return out.slice(-12);
    });
    setRedoStack([]);
  };

  const applyEdit = (next: AudioBuffer, playheadAt?: number) => {
    if (!buffer) return;
    pushUndo(buffer);
    setBuffer(next);
    stopPlayback();
    const t = playheadAt !== undefined ? playheadAt : Math.min(currentTimeRef.current, next.duration);
    currentTimeRef.current = t;
    setCurrentTime(t);
  };

  const undo = () => {
    if (!undoStack.length || !buffer) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((s) => [...s, buffer]);
    setUndoStack((s) => s.slice(0, -1));
    setBuffer(prev);
    stopPlayback();
    const t = Math.min(currentTimeRef.current, prev.duration);
    currentTimeRef.current = t;
    setCurrentTime(t);
  };

  const redo = () => {
    if (!redoStack.length || !buffer) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, buffer]);
    setRedoStack((s) => s.slice(0, -1));
    setBuffer(next);
    stopPlayback();
    const t = Math.min(currentTimeRef.current, next.duration);
    currentTimeRef.current = t;
    setCurrentTime(t);
  };

  /* ---------- Region edits ---------- */
  const region = (): { s: number; e: number } => {
    if (selStart !== null && selEnd !== null && hasSelection) return { s: selStart, e: selEnd };
    return { s: 0, e: duration };
  };

  const secToSamples = (sec: number) => Math.max(0, Math.round(sec * (buffer?.sampleRate ?? 44100)));

  const handleCut = () => {
    if (!buffer || !hasSelection || selStart === null || selEnd === null) return;
    clipboardRef.current = sliceBuffer(getCtx(), buffer, secToSamples(selStart), secToSamples(selEnd));
    setHasClipboard(true);
    const next = removeRegion(getCtx(), buffer, selStart, selEnd);
    applyEdit(next, selStart);
    setSel(null);
  };

  const handleCopy = () => {
    if (!buffer || !hasSelection || selStart === null || selEnd === null) return;
    clipboardRef.current = sliceBuffer(getCtx(), buffer, secToSamples(selStart), secToSamples(selEnd));
    setHasClipboard(true);
  };

  const handlePaste = () => {
    if (!buffer || !clipboardRef.current) return;
    const clip = clipboardRef.current;
    const at = currentTimeRef.current;
    const next = insertAt(getCtx(), buffer, at, clip);
    applyEdit(next, at + clip.duration);
  };

  const handleDelete = () => {
    if (!buffer || !hasSelection || selStart === null || selEnd === null) return;
    const next = removeRegion(getCtx(), buffer, selStart, selEnd);
    applyEdit(next, selStart);
    setSel(null);
  };

  const handleTrim = () => {
    if (!buffer || !hasSelection || selStart === null || selEnd === null) return;
    const next = sliceBuffer(getCtx(), buffer, secToSamples(selStart), secToSamples(selEnd));
    applyEdit(next, 0);
    setSel(null);
  };

  /* ---------- Fades / gain / normalize ---------- */
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [ampDb, setAmpDb] = useState(0);
  const [normDb, setNormDb] = useState(-3);

  const handleApplyFade = () => {
    if (!buffer) return;
    const { s, e } = region();
    const next = applyFadeRegion(getCtx(), buffer, fadeIn, fadeOut, s, e);
    applyEdit(next);
    setFadeIn(0);
    setFadeOut(0);
  };

  const handleApplyAmp = () => {
    if (!buffer || ampDb === 0) return;
    const { s, e } = region();
    const next = applyGainRegion(getCtx(), buffer, dbToFactor(ampDb), s, e);
    applyEdit(next);
  };

  const handleNormalize = () => {
    if (!buffer) return;
    const { s, e } = region();
    const { buffer: next } = normalizePeak(getCtx(), buffer, normDb, s, e);
    applyEdit(next);
  };

  /* ---------- Noise reduction ---------- */
  const handleCaptureNoise = () => {
    if (!buffer || !hasSelection || selStart === null || selEnd === null) {
      setNoiseMsg('ابتدا روی تایم‌لاین، فقط ناحیه‌ای که نویز دارد را انتخاب کنید.');
      return;
    }
    const len = selEnd - selStart;
    if (len < 0.1) {
      setNoiseMsg('ناحیه انتخاب‌شده خیلی کوتاه است (حداقل ۰.۱ ثانیه).');
      return;
    }
    const prof = computeNoiseProfile(buffer, selStart, selEnd);
    setNoiseProfile(prof);
    setNoiseMsg(`نمونه نویز از ناحیه انتخاب‌شده گرفته شد (${formatTime(len)}).`);
  };

  const handleApplyNoise = () => {
    if (!buffer || !noiseProfile) return;
    const next = reduceNoise(getCtx(), buffer, noiseProfile, noiseAmount, 0, duration);
    applyEdit(next);
    setNoiseMsg('حذف نویز اعمال شد. می‌توانید با دکمه بازگشت (Undo) آن را بردارید.');
  };

  /* ---------- Recording ---------- */
  const toggleRecord = async () => {
    if (recording) {
      const r = recRef.current;
      if (r) {
        window.clearInterval(r.iv);
        try {
          if (r.rec && r.rec.state !== 'inactive') r.rec.stop();
        } catch {
          /* ignore */
        }
      }
      return;
    }
    if (!buffer) return;
    stopPlayback();
    setRecError(null);
    setRecDoneMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickRecordMime();
      let rec: MediaRecorder;
      try {
        rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch {
        rec = new MediaRecorder(stream);
      }
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = (rec.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(chunks, { type });
        (async () => {
          try {
            if (!blob.size) {
              setRecError('هیچ صدایی ضبط نشد (میکروفون یا ورودی صدا را بررسی کنید).');
              return;
            }
            const ab = await blob.arrayBuffer();
            const ctx = getCtx();
            const recBuf = await ctx.decodeAudioData(ab);
            const at = currentTimeRef.current;
            const next = insertAt(getCtx(), bufferRef.current!, at, recBuf);
            applyEdit(next, at + recBuf.duration);
            setRecDoneMsg(
              `ضبط ${formatTime(recBuf.duration)} در موقعیت پخش‌نما درج شد (قابل بازگشت).`
            );
          } catch {
            setRecError('خطا در پردازش صدای ضبط‌شده.');
          }
        })();
        recRef.current = null;
      };
      rec.start(250);
      recRef.current = { rec, chunks, stream, iv: 0, t0: performance.now() };
      setRecording(true);
      setRecTime(0);
      const iv = window.setInterval(() => {
        const r = recRef.current;
        if (r) setRecTime((performance.now() - r.t0) / 1000);
      }, 200);
      if (recRef.current) recRef.current.iv = iv;
    } catch {
      setRecError('دسترسی به میکروفون ممکن نشد (مجوز را بررسی کنید).');
    }
  };

  /* ---------- Timeline interaction ---------- */
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
    const px = (sec: number) => rect.left + (sec / duration) * rect.width;
    const R = 12;
    const nearPlayhead = Math.abs(e.clientX - px(currentTimeRef.current)) <= R;
    const nearSelStart =
      selStart !== null && Math.abs(e.clientX - px(selStart)) <= R;
    const nearSelEnd = selEnd !== null && Math.abs(e.clientX - px(selEnd)) <= R;
    dragStartXRef.current = e.clientX;
    selAnchorRef.current = t;
    if (nearSelStart) dragModeRef.current = 'selStart';
    else if (nearSelEnd) dragModeRef.current = 'selEnd';
    else if (nearPlayhead) dragModeRef.current = 'playhead';
    else dragModeRef.current = 'selNew';
    dragAnchorRef.current = t;
    forceRender((n) => n + 1);
  };

  const handleTimelineMove = (e: React.PointerEvent) => {
    const mode = dragModeRef.current;
    if (!mode || !duration) return;
    const t = timeFromEvent(e.clientX);
    if (mode === 'playhead') {
      currentTimeRef.current = t;
      setCurrentTime(t);
    } else if (mode === 'selNew') {
      setSel({ start: Math.min(selAnchorRef.current, t), end: Math.max(selAnchorRef.current, t) });
    } else if (mode === 'selStart') {
      setSel((prev) => ({ start: t, end: prev?.end ?? t }));
    } else if (mode === 'selEnd') {
      setSel((prev) => ({ start: prev?.start ?? t, end: t }));
    }
  };

  const handleTimelineUp = (e: React.PointerEvent) => {
    const mode = dragModeRef.current;
    dragModeRef.current = null;
    if (mode === 'selNew' && Math.abs(e.clientX - dragStartXRef.current) < 4) {
      // کلیک ساده → فقط جابه‌جایی پخش‌نما
      const t = timeFromEvent(e.clientX);
      currentTimeRef.current = t;
      setCurrentTime(t);
    }
    forceRender((n) => n + 1);
  };

  const seekTo = (t: number) => {
    const tt = Math.max(0, Math.min(t, duration));
    currentTimeRef.current = tt;
    setCurrentTime(tt);
  };

  const selectAll = () => {
    if (duration <= 0) return;
    setSel({ start: 0, end: duration });
  };
  const clearSelection = () => setSel(null);

  /* ---------- Export ---------- */
  const handleExportSave = async () => {
    const b = bufferRef.current;
    if (!b || exporting) return;
    setExporting(true);
    setExportProgress(0);
    setExportError(null);
    stopPlayback();
    try {
      const baked = await renderEffects(b, {
        gain: gainFactor,
        eq,
        comp
      });
      let blob: Blob;
      let ext: string;
      let type: string;
      switch (exportFormat) {
        case 'mp3':
          blob = await encodeMp3(baked, mp3Kbps, setExportProgress);
          ext = 'mp3';
          type = 'audio/mpeg';
          break;
        case 'wav':
          blob = encodeWav(baked, wavBitDepth);
          ext = 'wav';
          type = 'audio/wav';
          setExportProgress(100);
          break;
        case 'flac':
          blob = encodeFlac(baked);
          ext = 'flac';
          type = 'audio/flac';
          setExportProgress(100);
          break;
        case 'm4a':
          blob = await encodeViaRecorder(baked, 'audio/mp4', setExportProgress);
          ext = 'm4a';
          type = 'audio/mp4';
          break;
      }
      if (!blob.size) throw new Error('کدگذاری خروجی خالی بود؛ فرمت دیگری را امتحان کنید.');
      const baseName = (localFile ? localFile.name : asset?.name || 'audio').replace(/\.[^.]+$/, '');
      const file = new File([blob], `${baseName}-edited.${ext}`, { type });
      if (localFile && onLocalSaved) {
        onLocalSaved(file);
        onClose();
        return;
      }
      const res = await uploadMediaFile(
        file,
        folderId === undefined || folderId === null || folderId === '' ? null : Number(folderId)
      );
      if (res && res.data) {
        onSave(toGalleryAsset(res.data));
      } else {
        throw new Error('پاسخ نامعتبر از سرور دریافت شد.');
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'خطای ناشناخته در ذخیره صدا.');
    } finally {
      setExporting(false);
      setExportProgress(0);
    }
  };

  /* ---------- Timeline rendering data ---------- */
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
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const selStartPct = duration > 0 && selStart !== null ? (selStart / duration) * 100 : 0;
  const selEndPct = duration > 0 && selEnd !== null ? (selEnd / duration) * 100 : 0;
  const bins = peaks ? peaks.maxs.length : 0;

  return (
    <AnimatePresence>
      {(asset || localFile) && (
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
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    ویرایشگر صدا
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    فایل: {(localFile ? localFile.name : asset?.name) || ''} ({localFile ? localFile.type : asset?.type})
                    {localFile ? ' — پیش از آپلود' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={undo}
                  disabled={!undoStack.length}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="بازگشت (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={!redoStack.length}
                  className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="جلو (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4" />
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
              {/* Timeline / waveform */}
              <div className="lg:col-span-8 bg-slate-950/90 relative flex flex-col p-6 overflow-hidden min-h-[380px]">
                {loading && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
                    <span className="text-xs font-bold">در حال بارگذاری فایل صوتی...</span>
                  </div>
                )}
                {!loading && loadError && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-red-400">
                    <AlertCircle className="w-8 h-8" />
                    <span className="text-xs font-bold max-w-sm text-center">{loadError}</span>
                  </div>
                )}
                {!loading && !loadError && buffer && (
                  <>
                    {/* Transport */}
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => seekTo(0)}
                        disabled={!duration}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors disabled:opacity-40 cursor-pointer"
                        title="شروع فایل"
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
                        onClick={() => seekTo(duration)}
                        disabled={!duration}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors disabled:opacity-40 cursor-pointer"
                        title="پایان فایل"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                      <div
                        className="mx-2 px-3 py-1.5 rounded-xl bg-slate-800 text-white text-[11px] font-bold tabular-nums"
                        dir="ltr"
                      >
                        {faDigits(formatTime(currentTime))} / {faDigits(formatTime(duration))}
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-teal-300 text-[11px] font-bold tabular-nums" dir="ltr">
                        {faDigits(formatTime(selLen))} انتخاب
                      </div>
                    </div>

                    {/* Timeline + waveform */}
                    <div className="mt-4 flex-1 min-h-0 flex flex-col">
                      <div
                        ref={timelineRef}
                        onPointerDown={handleTimelineDown}
                        onPointerMove={handleTimelineMove}
                        onPointerUp={handleTimelineUp}
                        onPointerCancel={handleTimelineUp}
                        className={`relative h-32 rounded-xl bg-slate-900/80 border border-slate-700/60 overflow-hidden touch-none select-none ${
                          duration ? 'cursor-crosshair' : ''
                        }`}
                        dir="ltr"
                      >
                        {/* waveform bars */}
                        {peaks &&
                          Array.from({ length: bins }, (_, i) => {
                            const mn = peaks.mins[i];
                            const mx = peaks.maxs[i];
                            const top = (1 - mx) * 50;
                            const h = Math.max(1.5, (mx - mn) * 50);
                            const inSel =
                              selStart !== null &&
                              selEnd !== null &&
                              (i / bins) * duration >= selStart &&
                              (i / bins) * duration <= selEnd;
                            return (
                              <div
                                key={i}
                                className={`absolute bottom-1/2 translate-y-1/2 ${inSel ? 'bg-teal-400/80' : 'bg-slate-500/70'}`}
                                style={{
                                  left: `${(i / bins) * 100}%`,
                                  width: `${100 / bins}%`,
                                  top: `${top}%`,
                                  height: `${h}%`
                                }}
                              />
                            );
                          })}
                        {/* selection tint */}
                        {hasSelection && selStart !== null && selEnd !== null && (
                          <div
                            className="absolute top-0 bottom-0 bg-teal-500/15 border-x border-teal-400/70 pointer-events-none"
                            style={{
                              left: `${selStartPct}%`,
                              width: `${Math.max(0, selEndPct - selStartPct)}%`
                            }}
                          />
                        )}
                        {/* time ticks */}
                        {ticks.map((t) => (
                          <div
                            key={t}
                            className="absolute top-0 bottom-0 w-px bg-white/10"
                            style={{ left: `${(t / duration) * 100}%` }}
                          />
                        ))}
                        {/* selection handles */}
                        {hasSelection && selStart !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-1.5 bg-amber-400 cursor-ew-resize touch-none"
                            style={{ left: `${selStartPct}%`, transform: 'translateX(-50%)' }}
                            title="شروع ناحیه"
                          />
                        )}
                        {hasSelection && selEnd !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-1.5 bg-amber-400 cursor-ew-resize touch-none"
                            style={{ left: `${selEndPct}%`, transform: 'translateX(-50%)' }}
                            title="پایان ناحیه"
                          />
                        )}
                        {/* playhead */}
                        {duration > 0 && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] pointer-events-none"
                            style={{ left: `${playheadPct}%` }}
                          />
                        )}
                      </div>
                      {/* time labels */}
                      {duration > 0 && (
                        <div className="relative h-4 mt-1.5 select-none" dir="ltr">
                          {ticks.map((t) => (
                            <span
                              key={t}
                              className="absolute -translate-x-1/2 text-[8px] font-bold text-slate-500 dark:text-slate-400 leading-none"
                              style={{ left: `${(t / duration) * 100}%` }}
                            >
                              {faDigits(formatTime(t))}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-1.5 text-[10px] font-bold text-slate-400" dir="ltr">
                        <span>۰:۰۰</span>
                        <span className="text-teal-400">پخش‌نما: {faDigits(formatTime(currentTime))}</span>
                        <span>{faDigits(formatTime(duration))}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* ---------- Right Controls Panel ---------- */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full overflow-y-auto">
                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-950/40">
                  <button
                    onClick={() => setActiveTab('edit')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'edit'
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="ویرایش و تایم‌لاین"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>ویرایش</span>
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
                    onClick={() => setActiveTab('record')}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      activeTab === 'record'
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="ضبط"
                  >
                    <Mic className="w-4 h-4" />
                    <span>ضبط</span>
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
                  {/* -------- Edit tab -------- */}
                  {activeTab === 'edit' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        ویرایش صدا
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        روی تایم‌لاین بکشید تا ناحیه‌ای انتخاب شود؛ دسته‌های زرد را می‌توان
                        جابه‌جا کرد و کلیک ساده، پخش‌نما را منتقل می‌کند.
                      </p>

                      {/* selection status */}
                      <div className="p-3 rounded-2xl bg-teal-500/5 border border-teal-500/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                        <span className="font-bold text-teal-600 dark:text-teal-400">
                          ناحیه انتخاب‌شده
                        </span>
                        <span className="font-black" dir="ltr">
                          {hasSelection
                            ? `${faDigits(formatTime(selStart ?? 0))} ← ${faDigits(formatTime(selLen))} → ${faDigits(formatTime(selEnd ?? 0))}`
                            : '—'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <ActionButton onClick={selectAll} disabled={!duration}>
                          انتخاب کل
                        </ActionButton>
                        <ActionButton onClick={clearSelection} disabled={!hasSelection}>
                          <Eraser className="w-3.5 h-3.5" />
                          پاک‌کردن انتخاب
                        </ActionButton>
                      </div>

                      {/* Cut / Copy / Paste / Delete / Trim */}
                      <div className="grid grid-cols-2 gap-2">
                        <ActionButton
                          onClick={handleCut}
                          disabled={!hasSelection}
                          variant="primary"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          برش
                        </ActionButton>
                        <ActionButton onClick={handleCopy} disabled={!hasSelection}>
                          <Copy className="w-3.5 h-3.5" />
                          کپی
                        </ActionButton>
                        <ActionButton onClick={handlePaste} disabled={!hasClipboard}>
                          <ClipboardPaste className="w-3.5 h-3.5" />
                          چسباندن
                        </ActionButton>
                        <ActionButton onClick={handleDelete} disabled={!hasSelection} variant="danger">
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </ActionButton>
                        <ActionButton
                          onClick={handleTrim}
                          disabled={!hasSelection}
                          className="col-span-2"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          نگه‌داشتن فقط ناحیه انتخاب‌شده (Trim)
                        </ActionButton>
                      </div>

                      {hasClipboard && (
                        <p className="text-[10px] text-slate-400 text-center">
                          کلیپ‌بورد آماده است — برای چسباندن، پخش‌نما را در محل دلخواه قرار دهید.
                        </p>
                      )}

                      {/* Fades */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5" />
                          محو شدن (Fade)
                        </p>
                        <SliderRow
                          label="محو ورود (Fade In)"
                          value={fadeIn}
                          min={0}
                          max={10}
                          step={0.1}
                          unit="ث"
                          onChange={setFadeIn}
                        />
                        <SliderRow
                          label="محو خروج (Fade Out)"
                          value={fadeOut}
                          min={0}
                          max={10}
                          step={0.1}
                          unit="ث"
                          onChange={setFadeOut}
                        />
                        <ActionButton
                          onClick={handleApplyFade}
                          disabled={!buffer || (fadeIn === 0 && fadeOut === 0)}
                          variant="primary"
                          className="w-full"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          اعمال محو ({hasSelection ? 'روی ناحیه' : 'کل فایل'})
                        </ActionButton>
                      </div>

                      {/* Amplify / Normalize */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400">تنظیم صدا</p>
                        <SliderRow
                          label="تقویت (Amplify)"
                          value={ampDb}
                          min={-20}
                          max={20}
                          step={0.5}
                          unit="dB"
                          onChange={setAmpDb}
                        />
                        <ActionButton
                          onClick={handleApplyAmp}
                          disabled={!buffer || ampDb === 0}
                          className="w-full"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          اعمال تقویت ({hasSelection ? 'روی ناحیه' : 'کل فایل'})
                        </ActionButton>
                        <SliderRow
                          label="هدف نرمال‌سازی (Normalize)"
                          value={normDb}
                          min={-20}
                          max={-1}
                          step={0.5}
                          unit="dBFS"
                          onChange={setNormDb}
                        />
                        <ActionButton
                          onClick={handleNormalize}
                          disabled={!buffer}
                          className="w-full"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          نرمال‌سازی ({hasSelection ? 'ناحیه' : 'کل فایل'})
                        </ActionButton>
                      </div>
                    </div>
                  )}

                  {/* -------- Effects tab -------- */}
                  {activeTab === 'effects' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        افکت‌های صوتی
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        این افکت‌ها به‌صورت زنده در پخش شنیده می‌شوند و هنگام ذخیره روی فایل
                        نهایی اعمال می‌شوند.
                      </p>

                      {/* EQ */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400">یکسان‌سازی (EQ)</p>
                        <SliderRow
                          label="باس (Low)"
                          value={eq.low}
                          min={-12}
                          max={12}
                          unit="dB"
                          onChange={(v) => setEq((p) => ({ ...p, low: v }))}
                        />
                        <SliderRow
                          label="میانه (Mid)"
                          value={eq.mid}
                          min={-12}
                          max={12}
                          unit="dB"
                          onChange={(v) => setEq((p) => ({ ...p, mid: v }))}
                        />
                        <SliderRow
                          label="زیر (High)"
                          value={eq.high}
                          min={-12}
                          max={12}
                          unit="dB"
                          onChange={(v) => setEq((p) => ({ ...p, high: v }))}
                        />
                        <button
                          onClick={() => setEq(DEFAULT_EQ)}
                          className="w-full py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-slate-500 transition-colors cursor-pointer"
                        >
                          بازنشانی EQ
                        </button>
                      </div>

                      {/* Compression */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-400">
                            فشرده‌سازی (Compression)
                          </p>
                          <button
                            onClick={() => setComp((p) => ({ ...p, enabled: !p.enabled }))}
                            className={`w-10 h-5 rounded-full transition-colors cursor-pointer relative ${
                              comp.enabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                                comp.enabled ? 'left-0.5' : 'right-0.5'
                              }`}
                            />
                          </button>
                        </div>
                        {comp.enabled && (
                          <>
                            <SliderRow
                              label="آستانه (Threshold)"
                              value={comp.threshold}
                              min={-60}
                              max={0}
                              unit="dB"
                              onChange={(v) => setComp((p) => ({ ...p, threshold: v }))}
                            />
                            <SliderRow
                              label="نسبت (Ratio)"
                              value={comp.ratio}
                              min={1}
                              max={20}
                              step={0.5}
                              unit=":1"
                              onChange={(v) => setComp((p) => ({ ...p, ratio: v }))}
                            />
                            <SliderRow
                              label="زانو (Knee)"
                              value={comp.knee}
                              min={0}
                              max={40}
                              unit="dB"
                              onChange={(v) => setComp((p) => ({ ...p, knee: v }))}
                            />
                            <SliderRow
                              label="حمله (Attack)"
                              value={comp.attack}
                              min={0}
                              max={1}
                              step={0.001}
                              unit="s"
                              onChange={(v) => setComp((p) => ({ ...p, attack: v }))}
                            />
                            <SliderRow
                              label="آزادسازی (Release)"
                              value={comp.release}
                              min={0}
                              max={1}
                              step={0.01}
                              unit="s"
                              onChange={(v) => setComp((p) => ({ ...p, release: v }))}
                            />
                          </>
                        )}
                      </div>

                      {/* Noise reduction */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Eraser className="w-3.5 h-3.5" />
                          حذف نویز (Noise Reduction)
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          ۱) روی تایم‌لاین، فقط قسمتی را که نویز دارد انتخاب کنید. ۲) نمونه بگیرید.
                          ۳) مقدار حذف را تنظیم و اعمال کنید.
                        </p>
                        <ActionButton
                          onClick={handleCaptureNoise}
                          disabled={!buffer}
                          className="w-full"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          گرفتن نمونه نویز از ناحیه انتخاب‌شده
                        </ActionButton>
                        {noiseProfile && (
                          <>
                            <SliderRow
                              label="مقدار حذف نویز"
                              value={noiseAmount}
                              min={0}
                              max={2}
                              step={0.1}
                              unit=""
                              onChange={setNoiseAmount}
                            />
                            <ActionButton
                              onClick={handleApplyNoise}
                              variant="primary"
                              className="w-full"
                            >
                              <Wand2 className="w-3.5 h-3.5" />
                              اعمال حذف نویز (کل فایل)
                            </ActionButton>
                          </>
                        )}
                        {noiseMsg && (
                          <p className="text-[10px] text-teal-600 dark:text-teal-400 leading-relaxed">
                            {noiseMsg}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* -------- Record tab -------- */}
                  {activeTab === 'record' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        ضبط از میکروفون
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        صدای ضبط‌شده پس از توقف، در موقعیت پخش‌نما درج می‌شود (با دکمه بازگشت
                        قابل حذف است).
                      </p>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex flex-col items-center gap-3">
                        <button
                          onClick={toggleRecord}
                          disabled={!buffer || exporting}
                          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all cursor-pointer disabled:opacity-40 ${
                            recording
                              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                              : 'bg-teal-600 hover:bg-teal-700'
                          }`}
                          title={recording ? 'توقف ضبط' : 'شروع ضبط'}
                        >
                          {recording ? (
                            <Square className="w-6 h-6 text-white fill-current" />
                          ) : (
                            <Mic className="w-7 h-7 text-white" />
                          )}
                        </button>
                        <div className="text-lg font-black text-slate-700 dark:text-slate-200 tabular-nums" dir="ltr">
                          {faDigits(formatTime(recTime))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          {recording ? 'در حال ضبط...' : 'برای شروع ضبط کلیک کنید'}
                        </span>
                      </div>

                      {recError && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{recError}</span>
                        </div>
                      )}
                      {recDoneMsg && (
                        <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold">
                          {recDoneMsg}
                        </div>
                      )}
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        خروجی ضبط بسته به مرورگر، Opus/WebM یا AAC/M4A است و سپس به قالب کاری
                        (بافر) تبدیل و درج می‌شود.
                      </p>
                    </div>
                  )}

                  {/* -------- Export tab -------- */}
                  {activeTab === 'export' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                        ذخیره صدا در سرور
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        تمام تغییرات (برش، محو، تقویت، EQ، فشرده‌سازی و حذف نویز) اعمال و به‌صورت
                        یک فایل جدید ذخیره می‌شود.
                      </p>

                      {/* format cards */}
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            { id: 'mp3', label: 'MP3' },
                            { id: 'wav', label: 'WAV' },
                            { id: 'flac', label: 'FLAC' },
                            { id: 'm4a', label: 'M4A (AAC)' }
                          ] as { id: ExportFormat; label: string }[]
                        ).map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setExportFormat(f.id)}
                            className={`py-2 px-3 rounded-xl border text-[11px] font-black transition-all cursor-pointer ${
                              exportFormat === f.id
                                ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                : 'border-gray-200 dark:border-slate-800 text-slate-500 hover:border-teal-500/40'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      {exportFormat === 'mp3' && (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-2">
                          <p className="text-[10px] font-bold text-slate-400">نرخ بیت MP3</p>
                          <div className="flex gap-2">
                            {[128, 192, 320].map((k) => (
                              <button
                                key={k}
                                onClick={() => setMp3Kbps(k)}
                                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                  mp3Kbps === k
                                    ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                    : 'border-gray-200 dark:border-slate-800 text-slate-500'
                                }`}
                              >
                                {faDigits(k)} kbps
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {exportFormat === 'wav' && (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-2">
                          <p className="text-[10px] font-bold text-slate-400">عمق بیت WAV</p>
                          <div className="flex gap-2">
                            {([16, 32] as const).map((b) => (
                              <button
                                key={b}
                                onClick={() => setWavBitDepth(b)}
                                className={`flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                  wavBitDepth === b
                                    ? 'bg-teal-500/10 border-teal-500 text-teal-600 dark:text-teal-400'
                                    : 'border-gray-200 dark:border-slate-800 text-slate-500'
                                }`}
                              >
                                {faDigits(b)}-bit {b === 32 ? '(float)' : ''}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                        <span className="font-bold">مشخصات خروجی</span>
                        <span className="text-[10px]">
                          {faDigits(formatTime(duration))} • {faDigits(buffer?.sampleRate ?? 0)} Hz
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
                              در حال کدگذاری صدا...
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
                            {exportFormat === 'm4a'
                              ? 'خروجی M4A به‌صورت زمان واقعی ساخته می‌شود؛ مدت‌زمان تقریباً برابر طول فایل است.'
                              : 'در حین پردازش از این پنجره خارج نشوید.'}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleExportSave}
                        disabled={exporting || !buffer}
                        className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        {exporting
                          ? 'در حال ذخیره روی سرور...'
                          : `ذخیره فایل جدید (${exportFormat.toUpperCase()})`}
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
