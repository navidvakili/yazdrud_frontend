// ============================================================
// pdfEngine — موتور ویرایش PDF (سمت کلاینت)
// ============================================================
// - pdf-lib: دستکاری صفحات (چرخش/حذف/کپی/استخراج/برش/ادغام/تقسیم)
// - pdf.js (pdfjs-dist): رندر بندانگشتی، استخراج متن، رندر برای فشرده‌سازی/تبدیل
// - docx / xlsx / jszip: تبدیل PDF به Word / Excel / JPG
// همه‌چیز در مرورگر انجام می‌شود؛ خروجی یا دانلود می‌شود یا به‌عنوان دارایی جدید آپلود.

import { PDFDocument, degrees } from 'pdf-lib';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';

// worker فقط یک‌بار تنظیم می‌شود (PdfViewer هم آن را تنظیم می‌کند)
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = workerUrl;
}

export type PdfMargins = { top: number; bottom: number; left: number; right: number }; // 0..1

/* ---------- ابزارهای پایه ---------- */

/** خواندن فایل به Uint8Array */
export async function fileToBytes(file: File | Blob): Promise<Uint8Array> {
  const buf = await file.arrayBuffer();
  return new Uint8Array(buf);
}

/** بارگذاری سند کاری با pdf-lib */
export async function loadPdf(bytes: Uint8Array) {
  return PDFDocument.load(bytes, { ignoreEncryption: true });
}

export async function getPdfPageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const n = doc.getPageCount();
  await doc.save({ useObjectStreams: true }).catch(() => undefined);
  return n;
}

/* ---------- رندر با pdf.js ---------- */

async function openPdfjs(bytes: Uint8Array): Promise<PDFDocumentProxy> {
  return getDocument({ data: bytes.slice() }).promise;
}

/**
 * رندر صفحه به canvas (با چرخش خودکار صفحه).
 * @param pageNum شماره صفحه ۱-پایه
 * @param scale ضریب مقیاس (۷۲ نقطه = ۱)
 */
export async function renderPdfPageToCanvas(
  bytes: Uint8Array,
  pageNum: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const doc = await openPdfjs(bytes);
  try {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d در دسترس نیست.');
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return canvas;
  } finally {
    doc.destroy();
  }
}

/** رندر یک صفحه از یک سند بازِ pdf.js به dataURL */
async function renderPageToDataUrl(doc: PDFDocumentProxy, pageNum: number, maxHeight: number): Promise<string | null> {
  try {
    const page = await doc.getPage(pageNum);
    const vp = page.getViewport({ scale: 1 });
    const scale = Math.min(3, maxHeight / vp.height);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.75);
  } catch {
    return null;
  }
}

/** رندر بندانگشتی (dataURL) — با سقف ارتفاع برای سرعت */
export async function renderPdfThumbs(
  bytes: Uint8Array,
  maxHeight = 220,
  maxCount = 300
): Promise<(string | null)[]> {
  const doc = await openPdfjs(bytes);
  try {
    const total = Math.min(doc.numPages, maxCount);
    const out: (string | null)[] = new Array(doc.numPages).fill(null);
    await Promise.all(
      Array.from({ length: total }, async (_, i) => {
        out[i] = await renderPageToDataUrl(doc, i + 1, maxHeight);
      })
    );
    return out;
  } finally {
    doc.destroy();
  }
}

/** استخراج متن صفحه (برای تبدیل به Excel) */
export async function getPdfPageText(bytes: Uint8Array, pageNum: number): Promise<string> {
  const doc = await openPdfjs(bytes);
  try {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let lastY: number | null = null;
    let line = '';
    const items = (content.items as { str: string; transform: number[] }[])
      .filter((it) => it.str)
      .sort((a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]);
    for (const it of items) {
      const y = it.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        lines.push(line.trim());
        line = '';
      }
      line += it.str + ' ';
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    return lines.join('\n');
  } finally {
    doc.destroy();
  }
}

/* ---------- عملیات صفحه (pdf-lib) ---------- */

export interface PdfSaveResult {
  bytes: Uint8Array;
  size: number;
}

async function saveDoc(doc: PDFDocument): Promise<PdfSaveResult> {
  const bytes = await doc.save({ useObjectStreams: true });
  return { bytes, size: bytes.byteLength };
}

/** چرخش صفحات انتخابی (۹۰ درجه ساعتگرد/پادساعتگرد) */
export async function rotatePages(
  bytes: Uint8Array,
  indices: number[], // ۰-پایه
  clockwise: boolean
): Promise<PdfSaveResult> {
  const doc = await loadPdf(bytes);
  for (const i of indices) {
    const page = doc.getPage(i);
    const cur = page.getRotation().angle;
    const next = (cur + (clockwise ? 90 : -90) + 360) % 360;
    page.setRotation(degrees(next));
  }
  return saveDoc(doc);
}

/** حذف صفحات */
export async function deletePages(bytes: Uint8Array, indices: number[]): Promise<PdfSaveResult> {
  const doc = await loadPdf(bytes);
  for (const i of [...indices].sort((a, b) => b - a)) doc.removePage(i);
  return saveDoc(doc);
}

/** کپی (تکرار) صفحات — هر صفحهٔ انتخابی یک نسخه پشت خودش */
export async function duplicatePages(bytes: Uint8Array, indices: number[]): Promise<PdfSaveResult> {
  const doc = await loadPdf(bytes);
  const src = await loadPdf(bytes);
  const sorted = [...indices].sort((a, b) => a - b);
  const copied = await doc.copyPages(src, sorted);
  sorted.forEach((origIdx, k) => {
    doc.insertPage(origIdx + 1, copied[k]);
  });
  return saveDoc(doc);
}

/** استخراج صفحات انتخاب‌شده به یک PDF جدید */
export async function extractPages(bytes: Uint8Array, indices: number[]): Promise<PdfSaveResult> {
  const out = await PDFDocument.create();
  const src = await loadPdf(bytes);
  const pages = await out.copyPages(src, [...indices].sort((a, b) => a - b));
  pages.forEach((p) => out.addPage(p));
  return saveDoc(out);
}

/** مرتب‌سازی مجدد صفحات (آرایهٔ جدید ترتیب) */
export async function reorderPages(bytes: Uint8Array, order: number[]): Promise<PdfSaveResult> {
  const out = await PDFDocument.create();
  const src = await loadPdf(bytes);
  const pages = await out.copyPages(src, order);
  pages.forEach((p) => out.addPage(p));
  return saveDoc(out);
}

/**
 * برش (Crop): حذف حاشیه از صفحات.
 * margins مقادیر نسبی ۰..۱ از ابعاد صفحه (نسبت به اندازهٔ اصلی).
 */
export async function cropPages(
  bytes: Uint8Array,
  indices: number[] | 'all',
  margins: PdfMargins
): Promise<PdfSaveResult> {
  const doc = await loadPdf(bytes);
  const list = indices === 'all' ? doc.getPages().map((_, i) => i) : indices;
  for (const i of list) {
    const page = doc.getPage(i);
    const box = page.getMediaBox();
    const w = box.width;
    const h = box.height;
    const x = box.x + w * margins.left;
    const y = box.y + h * margins.bottom;
    const nw = Math.max(1, w - w * (margins.left + margins.right));
    const nh = Math.max(1, h - h * (margins.top + margins.bottom));
    page.setMediaBox(x, y, nw, nh);
  }
  return saveDoc(doc);
}

/* ---------- ادغام و تقسیم ---------- */

/** ادغام چند PDF (به ترتیب ورودی) */
export async function mergePdfs(pdfs: Uint8Array[]): Promise<PdfSaveResult> {
  const out = await PDFDocument.create();
  for (const b of pdfs) {
    const src = await loadPdf(b);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return saveDoc(out);
}

/**
 * تقسیم PDF — هر بازه [شروع، پایان] ۱-پایه یک فایل جدا می‌سازد.
 * خروجی: آرایه‌ای از { bytes, name } که name = بازهٔ صفحات.
 */
export async function splitPdf(
  bytes: Uint8Array,
  ranges: [number, number][]
): Promise<{ bytes: Uint8Array; name: string }[]> {
  const parts: { bytes: Uint8Array; name: string }[] = [];
  const src = await loadPdf(bytes);
  for (const [s, e] of ranges) {
    const out = await PDFDocument.create();
    const indices = Array.from({ length: e - s + 1 }, (_, k) => s - 1 + k);
    const pages = await out.copyPages(src, indices);
    pages.forEach((p) => out.addPage(p));
    const saved = await saveDoc(out);
    parts.push({ bytes: saved.bytes, name: `صفحات-${s}-تا-${e}` });
  }
  return parts;
}

/* ---------- فشرده‌سازی ---------- */

/** فشرده‌سازی سبک: بازنویسی جریان‌ها با pdf-lib */
export async function compressPdfLight(bytes: Uint8Array): Promise<PdfSaveResult> {
  const doc = await loadPdf(bytes);
  return saveDoc(doc);
}

/**
 * فشرده‌سازی قوی: رندر صفحات به JPEG با کیفیت پایین‌تر و ساخت PDF جدید.
 * برای PDFهای تصویری/اسکن‌شده بسیار مؤثر است.
 */
export async function compressPdfRender(
  bytes: Uint8Array,
  opts: { dpi: number; jpegQuality: number }
): Promise<PdfSaveResult> {
  const src = await loadPdf(bytes);
  const out = await PDFDocument.create();
  const n = src.getPageCount();
  for (let i = 0; i < n; i++) {
    const canvas = await renderPdfPageToCanvas(bytes, i + 1, opts.dpi / 72);
    const jpegBytes = new Uint8Array(
      await new Promise<ArrayBuffer>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? b.arrayBuffer().then(resolve) : reject(new Error('خطا در رندر صفحه'))),
          'image/jpeg',
          opts.jpegQuality
        );
      })
    );
    const img = await out.embedJpg(jpegBytes);
    const ptsW = canvas.width / (opts.dpi / 72);
    const ptsH = canvas.height / (opts.dpi / 72);
    const page = out.addPage([ptsW, ptsH]);
    page.drawImage(img, { x: 0, y: 0, width: ptsW, height: ptsH });
  }
  return saveDoc(out);
}

/* ---------- تبدیل ---------- */

/** تبدیل صفحات به تصاویر JPG — خروجی zip اگر بیش از یک صفحه باشد */
export async function pdfToJpg(
  bytes: Uint8Array,
  pageIndices: number[] | 'all',
  opts: { dpi: number; quality: number }
): Promise<{ blob: Blob; name: string }[]> {
  const doc = await openPdfjs(bytes);
  const pages = pageIndices === 'all' ? Array.from({ length: doc.numPages }, (_, i) => i + 1) : pageIndices;
  const out: { blob: Blob; name: string }[] = [];
  try {
    for (const p of pages) {
      const canvas = await renderPdfPageToCanvas(bytes, p, opts.dpi / 72);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('خطا در ساخت JPG'))), 'image/jpeg', opts.quality)
      );
      out.push({ blob, name: `صفحه-${p}.jpg` });
    }
    return out;
  } finally {
    doc.destroy();
  }
}

export async function zipBlobs(items: { blob: Blob; name: string }[], zipName: string): Promise<Blob> {
  const zip = new JSZip();
  items.forEach((it) => zip.file(it.name, it.blob));
  return zip.generateAsync({ type: 'blob' });
}

/** تبدیل PDF به Word (docx) — هر صفحه یک تصویر تمام‌عرض (وفاداری کامل از جمله فارسی) */
export async function pdfToDocx(
  bytes: Uint8Array,
  opts: { dpi: number }
): Promise<Blob> {
  const { Document: DocxDocument, Packer, ImageRun, Paragraph, TextRun } = await import('docx');
  const src = await loadPdf(bytes);
  const n = src.getPageCount();
  const children: InstanceType<typeof Paragraph>[] = [];
  for (let i = 0; i < n; i++) {
    const canvas = await renderPdfPageToCanvas(bytes, i + 1, opts.dpi / 72);
    const jpegBytes = await new Promise<Uint8Array>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? b.arrayBuffer().then((ab) => resolve(new Uint8Array(ab))) : reject(new Error('خطا در رندر'))),
        'image/jpeg',
        0.92
      )
    );
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: jpegBytes,
            type: 'jpg',
            transformation: { width: Math.round(canvas.width / 2), height: Math.round(canvas.height / 2) },
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }
  const docx = new DocxDocument({
    sections: [{ children }],
    styles: {
      default: {
        document: {
          run: { font: 'Vazirmatn', size: 22 },
        },
      },
    },
  });
  const buf = await Packer.toBlob(docx);
  return buf;
}

/** تبدیل PDF به Excel (xlsx) — متن هر صفحه در یک شیت */
export async function pdfToXlsx(bytes: Uint8Array): Promise<Blob> {
  const XLSX = await import('xlsx');
  const src = await loadPdf(bytes);
  const n = src.getPageCount();
  const wb = XLSX.utils.book_new();
  for (let i = 0; i < n; i++) {
    const text = await getPdfPageText(bytes, i + 1);
    const rows = text.split('\n').map((l) => [l]);
    const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [['']]);
    const name = `صفحه ${i + 1}`.slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }
  const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Blob([arr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/** ذخیرهٔ blob به‌صورت دانلود در مرورگر */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** تشخیص اینکه فایل یک PDF است */
export const isPdfName = (name: string) => /\.pdf$/i.test(name);
export const isDocxName = (name: string) => /\.docx?$/i.test(name);
export const isPptxName = (name: string) => /\.pptx?$/i.test(name);
export const isXlsxName = (name: string) => /\.xlsx?$/i.test(name);

export type { PDFDocumentProxy, PDFPageProxy };
