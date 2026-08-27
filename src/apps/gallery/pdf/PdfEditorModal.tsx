import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  RotateCw,
  RotateCcw,
  Trash2,
  Copy,
  Scissors,
  Download,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Combine,
  Split,
  FileOutput,
  Minimize2,
  Plus,
  Image as ImageIcon,
  FileSpreadsheet,
  FileType2,
  UploadCloud
} from 'lucide-react';
import { GalleryAsset, MediaFile, toGalleryAsset, formatBytes } from '../types';
import { getMediaStreamUrl, uploadMediaFile } from '../api';
import {
  fileToBytes,
  getPdfPageCount,
  renderPdfThumbs,
  rotatePages,
  deletePages,
  duplicatePages,
  extractPages,
  reorderPages,
  cropPages,
  mergePdfs,
  splitPdf,
  compressPdfLight,
  compressPdfRender,
  pdfToJpg,
  pdfToDocx,
  pdfToXlsx,
  zipBlobs,
  downloadBlob,
  isPdfName
} from './pdfEngine';

interface PdfEditorModalProps {
  asset: GalleryAsset | null;
  folderId?: string | null;
  localFile?: File | null; // ویرایش قبل از آپلود
  onLocalSaved?: (file: File) => void; // خروجی ویرایش قبل از آپلود
  onClose: () => void;
  onSave: (updatedAsset: GalleryAsset) => void;
  onSaveMany?: (updatedAssets: GalleryAsset[]) => void;
}

type EditorTab = 'pages' | 'crop' | 'merge' | 'split' | 'convert' | 'compress';
type CompressMode = 'light' | 'medium' | 'strong';
type ConvertTarget = 'jpg' | 'docx' | 'xlsx';
type ReverseFormat = 'docx' | 'xlsx' | 'pptx' | 'jpg' | 'png';

const faDigits = (s: string | number) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

const ActionButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  className?: string;
  title?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, variant = 'ghost', className = '', title, children }) => {
  const base =
    'py-2 px-3 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5';
  const styles =
    variant === 'primary'
      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
      : variant === 'danger'
        ? 'bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 hover:bg-red-500/20'
        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200';
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
};

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

/* ============================================================
   PdfEditorModal — ویرایشگر پی‌دی‌اف
   مشاهدهٔ همهٔ صفحات، مرتب‌سازی (کشیدن‌ورها)، چرخش، حذف، کپی،
   استخراج، برش (Crop)، ادغام، تقسیم، فشرده‌سازی و تبدیل
   (JPG/Word/Excel + تبدیل معکوس) — همگی سمت کلاینت.
   ============================================================ */
export const PdfEditorModal: React.FC<PdfEditorModalProps> = ({
  asset,
  folderId,
  localFile,
  onLocalSaved,
  onClose,
  onSave,
  onSaveMany
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('pages');

  /* working pdf */
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbs, setThumbs] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  /* selection & drag */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  /* crop */
  const [cropM, setCropM] = useState({ top: 0, bottom: 0, left: 0, right: 0 });

  /* merge */
  const [mergeItems, setMergeItems] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const [galleryPdfs, setGalleryPdfs] = useState<MediaFile[]>([]);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  /* split */
  const [splitMode, setSplitMode] = useState<'every' | 'ranges'>('every');
  const [splitEvery, setSplitEvery] = useState(2);
  const [splitRangesText, setSplitRangesText] = useState('');
  const [splitSaving, setSplitSaving] = useState(false);

  /* compress */
  const [compressMode, setCompressMode] = useState<CompressMode>('light');
  const [compressedResult, setCompressedResult] = useState<{ bytes: Uint8Array; size: number } | null>(null);

  /* convert */
  const [convertTarget, setConvertTarget] = useState<ConvertTarget>('jpg');
  const [convertDpi, setConvertDpi] = useState(150);
  const [converting, setConverting] = useState(false);
  const [reverseFile, setReverseFile] = useState<File | null>(null);
  const [reverseFormat, setReverseFormat] = useState<ReverseFormat>('jpg');
  const reverseInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const baseName = useMemo(() => {
    const n = localFile?.name || asset?.name || 'document';
    return n.replace(/\.pdf$/i, '');
  }, [asset?.name, localFile?.name]);

  /* ---------- load on asset/localFile change ---------- */
  useEffect(() => {
    setActiveTab('pages');
    setBytes(null);
    setPageCount(0);
    setThumbs([]);
    setSelected(new Set());
    setLoading(true);
    setLoadError(null);
    setNotice(null);
    setSaveError(null);
    setCropM({ top: 0, bottom: 0, left: 0, right: 0 });
    setMergeItems([]);
    setCompressedResult(null);
    setReverseFile(null);
    setSplitRangesText('');
    setSplitEvery(2);
    setSplitSaving(false);
    if (!asset && !localFile) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        let buf: Uint8Array;
        if (localFile) {
          buf = await fileToBytes(localFile);
        } else if (asset) {
          const res = await fetch(getMediaStreamUrl(asset));
          if (!res.ok) throw new Error('خطا در دریافت فایل از سرور.');
          buf = new Uint8Array(await res.arrayBuffer());
        } else {
          return;
        }
        if (cancelled) return;
        const n = await getPdfPageCount(buf);
        if (cancelled) return;
        setBytes(buf);
        setPageCount(n);
        const th = await renderPdfThumbs(buf);
        if (cancelled) return;
        setThumbs(th);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'خطا در بارگذاری فایل PDF.');
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, localFile?.name, localFile?.size, localFile?.lastModified]);

  /* ---------- apply a new working document + refresh thumbs ---------- */
  const applyResult = useCallback(async (result: { bytes: Uint8Array; size: number }) => {
    setBusy(true);
    setNotice(null);
    try {
      const n = await getPdfPageCount(result.bytes);
      setBytes(result.bytes);
      setPageCount(n);
      const th = await renderPdfThumbs(result.bytes);
      setThumbs(th);
      setSelected(new Set());
      setCompressedResult(null);
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'خطا در اعمال تغییرات.' });
    } finally {
      setBusy(false);
    }
  }, []);

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const selList = useMemo(() => [...selected].sort((a, b) => a - b), [selected]);

  /* ---------- page ops ---------- */
  const opRotate = async (clockwise: boolean) => {
    if (!bytes) return;
    const idxs = selList.length ? selList : Array.from({ length: pageCount }, (_, i) => i);
    const res = await rotatePages(bytes, idxs, clockwise);
    await applyResult(res);
  };

  const opDelete = async () => {
    if (!bytes || !selList.length) return;
    const res = await deletePages(bytes, selList);
    await applyResult(res);
  };

  const opDuplicate = async () => {
    if (!bytes || !selList.length) return;
    const res = await duplicatePages(bytes, selList);
    await applyResult(res);
  };

  const opExtract = async () => {
    if (!bytes || !selList.length) return;
    const res = await extractPages(bytes, selList);
    const file = new File([res.bytes], `${baseName}-extracted.pdf`, { type: 'application/pdf' });
    downloadBlob(file, file.name);
    setNotice({ kind: 'ok', text: `فایل PDF استخراج‌شده (${faDigits(res.size / 1024)} کیلوبایت) دانلود شد.` });
  };

  const opReorder = async (from: number, to: number) => {
    if (!bytes || from === to) return;
    const order = Array.from({ length: pageCount }, (_, i) => i);
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    const res = await reorderPages(bytes, order);
    await applyResult(res);
  };

  const opCrop = async (target: number[] | 'all') => {
    if (!bytes) return;
    if (cropM.top === 0 && cropM.bottom === 0 && cropM.left === 0 && cropM.right === 0) {
      setNotice({ kind: 'err', text: 'مقدار برش را ابتدا تنظیم کنید.' });
      return;
    }
    const res = await cropPages(bytes, target, cropM);
    await applyResult(res);
  };

  /* ---------- merge ---------- */
  const loadGalleryPdfs = async () => {
    if (galleryPdfs.length) return;
    try {
      const all = await (await import('../api')).fetchAllMedia();
      setGalleryPdfs(all.filter((m) => isPdfName(m.name) || (m.type || '').includes('pdf')));
    } catch {
      /* بی‌صدا */
    }
  };

  const addMergePdf = async (buf: Uint8Array, name: string) => {
    setMergeItems((prev) => [...prev, { name, bytes: buf }]);
  };

  const handleMergeLocalFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (isPdfName(f.name)) {
        const buf = await fileToBytes(f);
        await addMergePdf(buf, f.name);
      }
    }
  };

  const runMerge = async () => {
    if (!bytes || !mergeItems.length) {
      setNotice({ kind: 'err', text: 'حداقل یک فایل دیگر برای ادغام انتخاب کنید.' });
      return;
    }
    setBusy(true);
    try {
      const res = await mergePdfs([bytes, ...mergeItems.map((m) => m.bytes)]);
      const file = new File([res.bytes], `${baseName}-merged.pdf`, { type: 'application/pdf' });
      downloadBlob(file, file.name);
      setNotice({ kind: 'ok', text: 'فایل ادغام‌شده دانلود شد. برای ذخیره در مخزن از دکمهٔ «ذخیره» استفاده کنید.' });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'خطا در ادغام.' });
    } finally {
      setBusy(false);
    }
  };

  /* ---------- split ---------- */
  const splitRanges = useMemo((): [number, number][] => {
    if (splitMode === 'every') {
      const n = Math.max(1, splitEvery);
      const ranges: [number, number][] = [];
      for (let s = 1; s <= pageCount; s += n) {
        ranges.push([s, Math.min(pageCount, s + n - 1)]);
      }
      return ranges;
    }
    const out: [number, number][] = [];
    for (const part of splitRangesText.split(/[,،]/)) {
      const t = part.trim();
      if (!t) continue;
      const m = t.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        const a = Number(m[1]);
        const b = Number(m[2]);
        if (a >= 1 && b >= a && b <= pageCount) out.push([a, b]);
      } else if (/^\d+$/.test(t)) {
        const a = Number(t);
        if (a >= 1 && a <= pageCount) out.push([a, a]);
      }
    }
    return out;
  }, [splitMode, splitEvery, splitRangesText, pageCount]);

  const runSplitDownload = async () => {
    if (!bytes || !splitRanges.length) return;
    setBusy(true);
    try {
      const parts = await splitPdf(bytes, splitRanges);
      if (parts.length === 1) {
        downloadBlob(new Blob([parts[0].bytes], { type: 'application/pdf' }), `${baseName}-${parts[0].name}.pdf`);
      } else {
        const zip = await zipBlobs(
          parts.map((p) => ({ blob: new Blob([p.bytes], { type: 'application/pdf' }), name: `${baseName}-${p.name}.pdf` })),
          `${baseName}-split.zip`
        );
        downloadBlob(zip, `${baseName}-split.zip`);
      }
      setNotice({ kind: 'ok', text: `تقسیم به ${faDigits(parts.length)} بخش انجام شد و دانلود شد.` });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'خطا در تقسیم.' });
    } finally {
      setBusy(false);
    }
  };

  const runSplitSave = async () => {
    if (!bytes || !splitRanges.length) return;
    setSplitSaving(true);
    setSaveError(null);
    const targetFolderId = folderId === undefined || folderId === null || folderId === '' ? null : Number(folderId);
    try {
      const parts = await splitPdf(bytes, splitRanges);
      const saved: GalleryAsset[] = [];
      for (const p of parts) {
        const file = new File([p.bytes], `${baseName}-${p.name}.pdf`, { type: 'application/pdf' });
        const res = await uploadMediaFile(file, targetFolderId);
        saved.push(toGalleryAsset(res.data));
      }
      if (onSaveMany) onSaveMany(saved);
      else if (saved.length) onSave(saved[saved.length - 1]);
    } catch (e: any) {
      setSaveError(e?.message || 'خطا در ذخیرهٔ بخش‌های تقسیم‌شده.');
    } finally {
      setSplitSaving(false);
    }
  };

  /* ---------- compress ---------- */
  const runCompress = async () => {
    if (!bytes) return;
    setBusy(true);
    setNotice(null);
    try {
      let res: { bytes: Uint8Array; size: number };
      if (compressMode === 'light') {
        res = await compressPdfLight(bytes);
      } else {
        const dpi = compressMode === 'medium' ? 120 : 90;
        const q = compressMode === 'medium' ? 0.7 : 0.55;
        res = await compressPdfRender(bytes, { dpi, jpegQuality: q });
      }
      setCompressedResult(res);
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'خطا در فشرده‌سازی.' });
    } finally {
      setBusy(false);
    }
  };

  /* ---------- convert ---------- */
  const runConvertDownload = async () => {
    if (!bytes) return;
    setConverting(true);
    setNotice(null);
    try {
      const targetPages = selList.length ? selList.map((i) => i + 1) : 'all';
      if (convertTarget === 'jpg') {
        const imgs = await pdfToJpg(bytes, targetPages, { dpi: convertDpi, quality: 0.92 });
        if (imgs.length === 1) {
          downloadBlob(imgs[0].blob, imgs[0].name);
        } else {
          const zip = await zipBlobs(imgs, `${baseName}-jpg.zip`);
          downloadBlob(zip, `${baseName}-jpg.zip`);
        }
        setNotice({ kind: 'ok', text: `تبدیل به ${faDigits(imgs.length)} تصویر JPG انجام شد.` });
      } else if (convertTarget === 'docx') {
        const blob = await pdfToDocx(bytes, { dpi: Math.min(convertDpi, 150) });
        downloadBlob(blob, `${baseName}.docx`);
        setNotice({ kind: 'ok', text: 'تبدیل به Word انجام شد.' });
      } else {
        const blob = await pdfToXlsx(bytes);
        downloadBlob(blob, `${baseName}.xlsx`);
        setNotice({ kind: 'ok', text: 'تبدیل به Excel انجام شد.' });
      }
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'خطا در تبدیل.' });
    } finally {
      setConverting(false);
    }
  };

  /* تبدیل معکوس: تصویر → PDF (کاملاً سمت کلاینت) */
  const runReverseImage = async () => {
    if (!reverseFile) return;
    setConverting(true);
    setNotice(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const out = await PDFDocument.create();
      const buf = new Uint8Array(await reverseFile.arrayBuffer());
      const isPng = /\.png$/i.test(reverseFile.name);
      const img = isPng ? await out.embedPng(buf) : await out.embedJpg(buf);
      const page = out.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      const saved = await out.save({ useObjectStreams: true });
      const blob = new Blob([saved], { type: 'application/pdf' });
      downloadBlob(blob, `${reverseFile.name.replace(/\.[^.]+$/, '')}.pdf`);
      setNotice({ kind: 'ok', text: 'تبدیل تصویر به PDF انجام شد.' });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'خطا در تبدیل.' });
    } finally {
      setConverting(false);
    }
  };

  /* تبدیل معکوس: Word/Excel/PowerPoint → پنجرهٔ چاپ (Save as PDF مرورگر) */
  const runReverseOffice = async () => {
    if (!reverseFile) return;
    setConverting(true);
    setNotice(null);
    try {
      let html = '<div style="direction:rtl;font-family:Vazirmatn,sans-serif;padding:32px;color:#111">';
      if (reverseFormat === 'docx') {
        const { renderAsync } = await import('docx-preview');
        const holder = document.createElement('div');
        holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:900px;background:#fff';
        document.body.appendChild(holder);
        try {
          await renderAsync(reverseFile, holder, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true
          });
          html += holder.innerHTML;
        } finally {
          holder.remove();
        }
      } else if (reverseFormat === 'xlsx') {
        const XLSX = await import('xlsx');
        const data = await reverseFile.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        for (const name of wb.SheetNames) {
          const rows = XLSX.utils.sheet_to_json<string[]>(wb.Sheets[name], { header: 1 });
          html += `<h3>${name}</h3><table border="1" cellpadding="6" style="border-collapse:collapse;margin-bottom:24px">`;
          for (const r of rows.slice(0, 200)) {
            html += '<tr>' + (r || []).map((c) => `<td>${String(c ?? '').replace(/</g, '&lt;')}</td>`).join('') + '</tr>';
          }
          html += '</table>';
        }
      } else {
        const { init } = await import('pptx-preview');
        const holder = document.createElement('div');
        holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:960px;background:#fff';
        document.body.appendChild(holder);
        type PPTXPreviewer = Awaited<ReturnType<typeof init>>;
        let previewer: PPTXPreviewer | null = null;
        try {
          previewer = init(holder, { width: 960, height: 540, mode: 'list' });
          const buf = await reverseFile.arrayBuffer();
          await previewer.preview(buf);
          // اندکی صبر برای پایان رندر
          await new Promise((r) => setTimeout(r, 800));
          html += holder.innerHTML;
        } finally {
          previewer?.destroy?.();
          holder.remove();
        }
      }
      html += '</div>';
      const win = window.open('', '_blank', 'width=1000,height=800');
      if (!win) {
        setNotice({ kind: 'err', text: 'پاپ‌آپ مسدود شده است. اجازهٔ پنجرهٔ بازشو را بدهید.' });
        return;
      }
      win.document.write(
        `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${reverseFile.name}</title>
        <style>@page{size:A4;margin:12mm}body{margin:0;padding:24px;font-family:Vazirmatn,'Segoe UI',sans-serif}
        img{max-width:100%}table{width:100%;font-size:11px}.slide{page-break-after:always}</style></head><body>${html}</body></html>`
      );
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
      setNotice({ kind: 'ok', text: 'پیش‌نمایش آماده است؛ در پنجرهٔ بازشده «Save as PDF» را انتخاب کنید.' });
    } catch (e) {
      setNotice({ kind: 'err', text: e instanceof Error ? e.message : 'خطا در آماده‌سازی تبدیل.' });
    } finally {
      setConverting(false);
    }
  };

  const handleReverseFile = (f: File | null) => {
    setReverseFile(f);
    if (f) {
      const ext = (f.name.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
      const map: Record<string, ReverseFormat> = {
        doc: 'docx',
        docx: 'docx',
        xls: 'xlsx',
        xlsx: 'xlsx',
        ppt: 'pptx',
        pptx: 'pptx',
        jpg: 'jpg',
        jpeg: 'jpg',
        png: 'png',
        webp: 'jpg'
      };
      setReverseFormat(map[ext] || 'jpg');
    }
  };

  /* ---------- save ---------- */
  const handleSave = async () => {
    if (!bytes) return;
    setSaving(true);
    setSaveError(null);
    try {
      const file = new File([bytes], `${baseName}-edited.pdf`, { type: 'application/pdf' });
      if (localFile && onLocalSaved) {
        onLocalSaved(file);
        onClose();
        return;
      }
      const targetFolderId = folderId === undefined || folderId === null || folderId === '' ? null : Number(folderId);
      const res = await uploadMediaFile(file, targetFolderId);
      onSave(toGalleryAsset(res.data));
    } catch (e: any) {
      setSaveError(e?.message || 'خطا در ذخیرهٔ فایل.');
      setSaving(false);
    }
  };

  const handleDownloadCurrent = () => {
    if (!bytes) return;
    const blob = new Blob([bytes], { type: 'application/pdf' });
    downloadBlob(blob, `${baseName}-edited.pdf`);
  };

  /* ---------- render ---------- */
  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'pages', label: 'صفحات', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'crop', label: 'برش', icon: <Minimize2 className="w-3.5 h-3.5" /> },
    { id: 'merge', label: 'ادغام', icon: <Combine className="w-3.5 h-3.5" /> },
    { id: 'split', label: 'تقسیم', icon: <Split className="w-3.5 h-3.5" /> },
    { id: 'convert', label: 'تبدیل', icon: <FileOutput className="w-3.5 h-3.5" /> },
    { id: 'compress', label: 'فشرده‌سازی', icon: <Minimize2 className="w-3.5 h-3.5" /> }
  ];

  return (
    <>
      {(asset || localFile) && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden text-right"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                ویرایشگر پی‌دی‌اف
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {(localFile ? localFile.name : asset?.name) || ''}
                {localFile ? ' — فایل محلی (پیش از آپلود)' : ''} • {faDigits(pageCount)} صفحه
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 flex items-center gap-1.5 overflow-x-auto border-b border-gray-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-t-xl text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer border-b-2 ${
                activeTab === t.id
                  ? 'text-teal-600 dark:text-teal-400 border-teal-500 bg-white dark:bg-slate-900'
                  : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {(loading || busy) && (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              <span className="text-xs font-bold">
                {loading ? 'در حال بارگذاری و رندر صفحات...' : 'در حال پردازش...'}
              </span>
            </div>
          )}

          {!loading && !busy && loadError && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-xs font-bold text-red-500 max-w-md">{loadError}</p>
              <ActionButton onClick={onClose} variant="ghost">
                بستن
              </ActionButton>
            </div>
          )}

          {!loading && !busy && !loadError && bytes && (
            <>
              {notice && (
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border ${
                    notice.kind === 'ok'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                  }`}
                >
                  {notice.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  {notice.text}
                </div>
              )}

              {/* ===== صفحات ===== */}
              {activeTab === 'pages' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 ml-2">
                      {selList.length ? `${faDigits(selList.length)} صفحه انتخاب شد` : 'صفحه‌ها را انتخاب کنید'}
                    </span>
                    <ActionButton onClick={() => opRotate(true)} disabled={!selList.length} title="چرخش ۹۰ درجه ساعتگرد">
                      <RotateCw className="w-3.5 h-3.5" />
                      چرخش
                    </ActionButton>
                    <ActionButton onClick={() => opRotate(false)} disabled={!selList.length} title="چرخش ۹۰ درجه پادساعتگرد">
                      <RotateCcw className="w-3.5 h-3.5" />
                      چرخش معکوس
                    </ActionButton>
                    <ActionButton onClick={opDelete} disabled={!selList.length} variant="danger" title="حذف صفحات انتخاب‌شده">
                      <Trash2 className="w-3.5 h-3.5" />
                      حذف
                    </ActionButton>
                    <ActionButton onClick={opDuplicate} disabled={!selList.length} title="کپی (تکرار) صفحات انتخاب‌شده">
                      <Copy className="w-3.5 h-3.5" />
                      کپی
                    </ActionButton>
                    <ActionButton onClick={opExtract} disabled={!selList.length} title="استخراج صفحات انتخاب‌شده به PDF جدید">
                      <Scissors className="w-3.5 h-3.5" />
                      استخراج
                    </ActionButton>
                    <ActionButton
                      onClick={() =>
                        setSelected(selected.size === pageCount ? new Set() : new Set(Array.from({ length: pageCount }, (_, i) => i)))
                      }
                      title="انتخاب همه / پاک‌سازی"
                    >
                      {selected.size === pageCount ? 'پاک‌سازی انتخاب' : 'انتخاب همه'}
                    </ActionButton>
                    <span className="text-[10px] text-slate-400 mr-auto">
                      برای مرتب‌سازی، صفحه را بکشید و رها کنید
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {thumbs.map((th, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={() => setDragIdx(i)}
                        onDragEnter={() => setOverIdx(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragIdx !== null && overIdx !== null) {
                            opReorder(dragIdx, overIdx);
                          }
                          setDragIdx(null);
                          setOverIdx(null);
                        }}
                        onDragEnd={() => {
                          setDragIdx(null);
                          setOverIdx(null);
                        }}
                        onClick={() => toggleSelect(i)}
                        className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 ${
                          selected.has(i)
                            ? 'border-teal-500 ring-2 ring-teal-500/30'
                            : overIdx === i && dragIdx !== null
                              ? 'border-sky-400 ring-2 ring-sky-400/30'
                              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                        } ${dragIdx === i ? 'opacity-40' : ''}`}
                      >
                        {th ? (
                          <img src={th} alt={`صفحه ${i + 1}`} className="w-full h-auto block" />
                        ) : (
                          <div className="aspect-[3/4] flex items-center justify-center text-slate-400">
                            <FileText className="w-6 h-6" />
                          </div>
                        )}
                        <span
                          className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
                            selected.has(i)
                              ? 'bg-teal-600 text-white'
                              : 'bg-black/60 text-white'
                          }`}
                        >
                          {faDigits(i + 1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== برش ===== */}
              {activeTab === 'crop' && (
                <div className="max-w-md space-y-4">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-6">
                    حاشیه‌های اضافی را از صفحات حذف کنید تا اندازه‌ها یکدست شوند. مقادیر به‌صورت درصد از ابعاد صفحه است.
                  </p>
                  <SliderRow label="برش از بالا" value={cropM.top} min={0} max={50} unit="٪" onChange={(v) => setCropM((m) => ({ ...m, top: v }))} />
                  <SliderRow label="برش از پایین" value={cropM.bottom} min={0} max={50} unit="٪" onChange={(v) => setCropM((m) => ({ ...m, bottom: v }))} />
                  <SliderRow label="برش از راست" value={cropM.right} min={0} max={50} unit="٪" onChange={(v) => setCropM((m) => ({ ...m, right: v }))} />
                  <SliderRow label="برش از چپ" value={cropM.left} min={0} max={50} unit="٪" onChange={(v) => setCropM((m) => ({ ...m, left: v }))} />
                  <div className="flex items-center gap-2 pt-2">
                    <ActionButton variant="primary" onClick={() => opCrop('all')}>
                      <Minimize2 className="w-3.5 h-3.5" />
                      اعمال بر همهٔ صفحات
                    </ActionButton>
                    <ActionButton onClick={() => opCrop(selList)} disabled={!selList.length}>
                      اعمال بر صفحات انتخاب‌شده ({faDigits(selList.length)})
                    </ActionButton>
                  </div>
                </div>
              )}

              {/* ===== ادغام ===== */}
              {activeTab === 'merge' && (
                <div className="space-y-4">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-6">
                    فایل‌های PDF دیگر را به انتهای سند فعلی اضافه کنید؛ سپس نتیجه را دانلود یا ذخیره کنید.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton onClick={() => mergeInputRef.current?.click()}>
                      <Plus className="w-3.5 h-3.5" />
                      افزودن فایل محلی
                    </ActionButton>
                    <ActionButton onClick={() => { loadGalleryPdfs(); setShowGalleryPicker((s) => !s); }}>
                      <UploadCloud className="w-3.5 h-3.5" />
                      انتخاب از مخزن
                    </ActionButton>
                    <input
                      ref={mergeInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => { handleMergeLocalFiles(e.target.files); e.target.value = ''; }}
                    />
                    <ActionButton variant="primary" onClick={runMerge} disabled={!mergeItems.length || busy}>
                      <Combine className="w-3.5 h-3.5" />
                      ادغام و دانلود ({faDigits(mergeItems.length + 1)} فایل)
                    </ActionButton>
                  </div>

                  {showGalleryPicker && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                      {galleryPdfs.length === 0 && (
                        <p className="col-span-full text-[11px] text-slate-400">هیچ فایل PDF دیگری در مخزن نیست.</p>
                      )}
                      {galleryPdfs.map((m) => (
                        <button
                          key={m.id}
                          onClick={async () => {
                            const res = await fetch(getMediaStreamUrl(m));
                            if (!res.ok) return;
                            const buf = new Uint8Array(await res.arrayBuffer());
                            await addMergePdf(buf, m.name);
                            setShowGalleryPicker(false);
                          }}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-teal-500/50 text-right transition-all cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {mergeItems.length > 0 && (
                    <div className="space-y-2">
                      {mergeItems.map((m, idx) => (
                        <div
                          key={`${m.name}-${idx}`}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800"
                        >
                          <span className="text-[10px] font-black text-slate-400 w-5 text-center">{faDigits(idx + 2)}</span>
                          <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                          <span className="flex-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{m.name}</span>
                          <button
                            onClick={() => setMergeItems((prev) => prev.filter((_, k) => k !== idx))}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== تقسیم ===== */}
              {activeTab === 'split' && (
                <div className="max-w-xl space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={splitMode === 'every'}
                        onChange={() => setSplitMode('every')}
                        className="accent-teal-500"
                      />
                      هر چند صفحه
                    </label>
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={splitMode === 'ranges'}
                        onChange={() => setSplitMode('ranges')}
                        className="accent-teal-500"
                      />
                      بازه‌های دلخواه
                    </label>
                  </div>

                  {splitMode === 'every' ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={pageCount}
                        value={splitEvery}
                        onChange={(e) => setSplitEvery(Math.max(1, Number(e.target.value) || 1))}
                        className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white"
                      />
                      <span className="text-[11px] text-slate-500">صفحه در هر بخش</span>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        value={splitRangesText}
                        onChange={(e) => setSplitRangesText(e.target.value)}
                        placeholder={`مثال: 1-3, 5, 8-10 (شماره صفحات ۱ تا ${faDigits(pageCount)})`}
                        dir="ltr"
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white text-left"
                      />
                    </div>
                  )}

                  <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                    {splitRanges.length ? `${faDigits(splitRanges.length)} بخش ایجاد می‌شود` : 'بازهٔ معتبری وارد نشده است'}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton variant="primary" onClick={runSplitDownload} disabled={!splitRanges.length || busy}>
                      <Download className="w-3.5 h-3.5" />
                      دانلود (ZIP)
                    </ActionButton>
                    <ActionButton onClick={runSplitSave} disabled={!splitRanges.length || splitSaving}>
                      {splitSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      ذخیرهٔ همه در مخزن ({faDigits(splitRanges.length)} فایل)
                    </ActionButton>
                  </div>
                  {saveError && (
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {saveError}
                    </p>
                  )}
                </div>
              )}

              {/* ===== تبدیل ===== */}
              {activeTab === 'convert' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                      تبدیل PDF به:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          { id: 'jpg', label: 'تصویر JPG', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                          { id: 'docx', label: 'Word (DOCX)', icon: <FileType2 className="w-3.5 h-3.5" /> },
                          { id: 'xlsx', label: 'Excel (XLSX)', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> }
                        ] as { id: ConvertTarget; label: string; icon: React.ReactNode }[]
                      ).map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setConvertTarget(f.id)}
                          className={`px-3.5 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 border transition-all cursor-pointer ${
                            convertTarget === f.id
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {f.icon}
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">وضوح (DPI):</span>
                    {[72, 150, 300].map((d) => (
                      <button
                        key={d}
                        onClick={() => setConvertDpi(d)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                          convertDpi === d
                            ? 'bg-sky-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {faDigits(d)}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                      variant="primary"
                      onClick={runConvertDownload}
                      disabled={converting}
                    >
                      {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      تبدیل و دانلود ({selList.length ? `${faDigits(selList.length)} صفحه` : 'همهٔ صفحات'})
                    </ActionButton>
                  </div>

                  <div className="border-t border-gray-200 dark:border-slate-800 pt-5">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                      تبدیل معکوس به PDF:
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-6">
                      تصویر (JPG/PNG) به‌صورت مستقیم به PDF تبدیل می‌شود؛ برای Word/Excel/PowerPoint پیش‌نمایش باز می‌شود و با «Save as PDF» ذخیره کنید.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionButton onClick={() => reverseInputRef.current?.click()}>
                        <Plus className="w-3.5 h-3.5" />
                        انتخاب فایل
                      </ActionButton>
                      <input
                        ref={reverseInputRef}
                        type="file"
                        accept=".doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => { handleReverseFile(e.target.files?.[0] || null); e.target.value = ''; }}
                      />
                      {reverseFile && (
                        <>
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[220px]">
                            {reverseFile.name}
                          </span>
                          <ActionButton
                            variant="primary"
                            onClick={reverseFormat === 'jpg' || reverseFormat === 'png' ? runReverseImage : runReverseOffice}
                            disabled={converting}
                          >
                            {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileOutput className="w-3.5 h-3.5" />}
                            تبدیل به PDF
                          </ActionButton>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== فشرده‌سازی ===== */}
              {activeTab === 'compress' && (
                <div className="max-w-xl space-y-4">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-6">
                    کاهش حجم فایل برای ذخیره‌سازی یا ارسال آسان‌تر. حالت «سبک» کیفیت را حفظ می‌کند؛ حالت‌های «متوسط/قوی» صفحات را تصویرسازی می‌کنند (برای PDFهای اسکن‌شده عالی است).
                  </p>
                  <div className="space-y-2">
                    {(
                      [
                        { id: 'light', label: 'سبک (بازنویسی — بدون افت کیفیت)', desc: 'مناسب PDFهای متنی' },
                        { id: 'medium', label: 'متوسط (تصویرسازی ۱۲۰dpi — افت کم)', desc: 'مناسب اسناد ترکیبی' },
                        { id: 'strong', label: 'قوی (تصویرسازی ۹۰dpi — حداکثر کاهش)', desc: 'مناسب اسکن/تصویر' }
                      ] as { id: CompressMode; label: string; desc: string }[]
                    ).map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          compressMode === m.id
                            ? 'border-teal-500 bg-teal-500/5'
                            : 'border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={compressMode === m.id}
                          onChange={() => setCompressMode(m.id)}
                          className="accent-teal-500 mt-0.5"
                        />
                        <div>
                          <p className="text-[11px] font-black text-slate-800 dark:text-slate-200">{m.label}</p>
                          <p className="text-[10px] text-slate-400">{m.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton variant="primary" onClick={runCompress} disabled={busy}>
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Minimize2 className="w-3.5 h-3.5" />}
                      فشرده‌سازی
                    </ActionButton>
                    {compressedResult && (
                      <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        از {formatBytes(bytes.byteLength)} به {formatBytes(compressedResult.size)} رسید
                      </span>
                    )}
                  </div>

                  {compressedResult && (
                    <div className="flex flex-wrap items-center gap-2">
                      <ActionButton
                        variant="primary"
                        onClick={() => {
                          const blob = new Blob([compressedResult.bytes], { type: 'application/pdf' });
                          downloadBlob(blob, `${baseName}-compressed.pdf`);
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        دانلود نسخهٔ فشرده
                      </ActionButton>
                      <ActionButton
                        onClick={async () => {
                          setSaving(true);
                          setSaveError(null);
                          try {
                            const file = new File([compressedResult.bytes], `${baseName}-compressed.pdf`, {
                              type: 'application/pdf'
                            });
                            if (localFile && onLocalSaved) {
                              onLocalSaved(file);
                              onClose();
                              return;
                            }
                            const targetFolderId = folderId === undefined || folderId === null || folderId === '' ? null : Number(folderId);
                            const res = await uploadMediaFile(file, targetFolderId);
                            onSave(toGalleryAsset(res.data));
                          } catch (e: any) {
                            setSaveError(e?.message || 'خطا در ذخیره.');
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        ذخیره در مخزن
                      </ActionButton>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !loadError && bytes && (
          <div className="px-5 py-3.5 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <ActionButton onClick={handleDownloadCurrent} disabled={busy}>
                <Download className="w-3.5 h-3.5" />
                دانلود فایل فعلی
              </ActionButton>
              {saveError && (
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {saveError}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ActionButton onClick={onClose} variant="ghost">
                بستن
              </ActionButton>
              <ActionButton onClick={handleSave} variant="primary" disabled={saving || busy}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {localFile ? 'ذخیره و آماده‌سازی آپلود' : 'ذخیره به‌عنوان PDF جدید'}
              </ActionButton>
            </div>
          </div>
        )}
      </motion.div>
    </div>
      )}
    </>
  );
};
