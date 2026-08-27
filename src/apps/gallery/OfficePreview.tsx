import React, { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, AlertCircle, Printer, ExternalLink, Image as ImageIcon, BarChart3 } from 'lucide-react';
import { isDocxName, isPptxName, isXlsxName } from './pdf/pdfEngine';
import type { XlsxPreviewData } from './xlsxPreview';

interface OfficePreviewProps {
  src: string; // آدرس استریم
  name: string;
  downloadUrl?: string;
}

/**
 * پیش‌نمایش اسناد اداری (Word / PowerPoint / Excel) در لایت‌باکس.
 * - docx:  docx-preview (renderAsync)
 * - pptx:  pptx-preview (init + preview با حالت list)
 * - xlsx:  ساخت HTML جدول با SheetJS
 * دکمهٔ «تبدیل به PDF» پیش‌نمایش را در پنجرهٔ چاپ مرورگر باز می‌کند (Save as PDF).
 */
export const OfficePreview: React.FC<OfficePreviewProps> = ({ src, name, downloadUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pptxRef = useRef<{ destroy: () => void } | null>(null);
  const urlRef = useRef<string[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [xlsxData, setXlsxData] = useState<XlsxPreviewData | null>(null);
  const [activeSheet, setActiveSheet] = useState(0);

  const isDocx = isDocxName(name);
  const isPptx = isPptxName(name);
  const isXlsx = isXlsxName(name);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('خطا در دریافت فایل از سرور.');
        const buf = new Uint8Array(await res.arrayBuffer());
        if (cancelled) return;
        setBytes(buf);
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'خطا در بارگذاری سند.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  /* رندر سند پس از دریافت بایت‌ها */
  useEffect(() => {
    if (!bytes || status !== 'ready') return;
    let cancelled = false;
    setXlsxData(null);
    (async () => {
      try {
        if (isDocx) {
          const { renderAsync } = await import('docx-preview');
          if (!containerRef.current) return;
          await renderAsync(new Blob([bytes]), containerRef.current, undefined, {
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            breakPages: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true
          });
        } else if (isPptx) {
          const { init } = await import('pptx-preview');
          if (!containerRef.current) return;
          containerRef.current.innerHTML = '';
          const previewer = init(containerRef.current, { width: 960, height: 540, mode: 'list' });
          pptxRef.current = previewer as unknown as { destroy: () => void };
          await previewer.preview(bytes.slice().buffer as ArrayBuffer);
          if (cancelled) pptxRef.current?.destroy?.();
        } else if (isXlsx) {
          const { buildXlsxPreview } = await import('./xlsxPreview');
          // آزادسازی Object URL های قبلی
          urlRef.current.forEach((u) => URL.revokeObjectURL(u));
          urlRef.current = [];
          const data = await buildXlsxPreview(bytes);
          if (cancelled) {
            data.sheets.forEach((s) => s.images.forEach((i) => URL.revokeObjectURL(i.url)));
            data.extraImages.forEach((i) => URL.revokeObjectURL(i.url));
            return;
          }
          urlRef.current = [
            ...data.sheets.flatMap((s) => s.images.map((i) => i.url)),
            ...data.extraImages.map((i) => i.url),
          ];
          setXlsxData(data);
          setActiveSheet(0);
        } else {
          throw new Error('فرمت سند پشتیبانی نمی‌شود.');
        }
        if (cancelled) return;
        setStatus('ready');
      } catch (e) {
        if (cancelled) return;
        setStatus('error');
        setError(e instanceof Error ? e.message : 'خطا در نمایش سند.');
      }
    })();
    return () => {
      cancelled = true;
      pptxRef.current?.destroy?.();
      pptxRef.current = null;
      urlRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bytes, status, isDocx, isPptx, isXlsx]);

  const esc = (v: unknown) =>
    String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /** تبدیل ایندکس ستون (۰-مبنا) به حرف ستون اکسل (A, B, ..., Z, AA, AB, ...) */
  const colLetter = (i: number) => {
    let n = i + 1;
    let s = '';
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };

  /** رندر یک برگهٔ اکسل (جدول + نمودارها + تصاویر) */
  const renderSheet = (sheet: XlsxPreviewData['sheets'][number]) => (
    <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm p-4">
      <h3 className="text-xs font-black text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5 text-teal-500" />
        {sheet.name}
      </h3>
      {sheet.rows.length > 0 ? (
        <div className="overflow-auto max-h-[45vh] border border-gray-200 dark:border-slate-800 rounded-lg">
          <table className="w-full text-[11px] border-collapse min-w-[400px]" dir="ltr">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-slate-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-2 py-1 text-slate-500 dark:text-slate-300 font-black min-w-[40px]">
                  #
                </th>
                {sheet.rows[0].map((_, ci) => (
                  <th
                    key={ci}
                    className="sticky top-0 z-10 bg-slate-200 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 px-2 py-1 text-center text-slate-500 dark:text-slate-300 font-black min-w-[70px]"
                  >
                    {colLetter(ci)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.rows.map((r, ri) => (
                <tr
                  key={ri}
                  className={
                    ri === 0
                      ? 'bg-teal-50/70 dark:bg-teal-950/30'
                      : 'odd:bg-slate-50/60 dark:odd:bg-slate-900/40'
                  }
                >
                  <td className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-1 text-center text-slate-400 dark:text-slate-500 font-bold min-w-[40px]">
                    {ri + 1}
                  </td>
                  {r.map((c, ci) => (
                    <td
                      key={ci}
                      className="border border-gray-200 dark:border-slate-800 px-2 py-1 text-slate-700 dark:text-slate-200 whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis"
                      dir="auto"
                    >
                      {esc(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-[11px] text-slate-400">این برگه خالی است.</p>
      )}

      {sheet.charts.length > 0 && (
        <div className="mt-3">
          <h4 className="text-[11px] font-black text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-teal-500" />
            نمودارها
          </h4>
          <div className="grid gap-3">
            {sheet.charts.map((c, i) => (
              <div key={i} className="rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                  {c.title || 'نمودار'}
                </div>
                <div className="bg-white dark:bg-slate-950 p-2" dangerouslySetInnerHTML={{ __html: c.svg }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {sheet.images.length > 0 && (
        <div className="mt-3">
          <h4 className="text-[11px] font-black text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
            تصاویر و شکل‌ها
          </h4>
          <div className="flex flex-wrap gap-3">
            {sheet.images.map((img, i) => (
              <figure key={i} className="rounded-lg border border-gray-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900">
                <img src={img.url} alt={img.name} className="max-h-44 max-w-full object-contain" />
                <figcaption className="text-[9px] text-slate-400 mt-1 text-center">{img.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const handlePrintToPdf = () => {
    const win = window.open('', '_blank', 'width=1000,height=800');
    if (!win) return;
    let inner = '';
    if (xlsxData) {
      for (const s of xlsxData.sheets) {
        inner += `<h2>${esc(s.name)}</h2>`;
        if (s.rows.length) {
          inner += `<table><thead><tr><th>#</th>${s.rows[0]
            .map((_, ci) => `<th>${colLetter(ci)}</th>`)
            .join('')}</tr></thead><tbody>${s.rows
            .map(
              (r, ri) =>
                `<tr><td>${ri + 1}</td>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`
            )
            .join('')}</tbody></table>`;
        } else {
          inner += '<p>این برگه خالی است.</p>';
        }
        s.charts.forEach((c) => (inner += `<div class="chart">${c.svg}</div>`));
        s.images.forEach((img) => (inner += `<img src="${img.url}" alt="${esc(img.name)}"/>`));
      }
      xlsxData.extraCharts.forEach((c) => (inner += `<div class="chart">${c.svg}</div>`));
      xlsxData.extraImages.forEach((img) => (inner += `<img src="${img.url}" alt="${esc(img.name)}"/>`));
    } else {
      const container = containerRef.current;
      if (!container) return;
      inner = container.innerHTML;
    }
    win.document.write(
      `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${name}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body { margin: 0; padding: 24px; font-family: Vazirmatn, 'Segoe UI', sans-serif; color: #111; }
        img { max-width: 100%; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
        td, th { border: 1px solid #ccc; padding: 4px 6px; }
        .slide { page-break-after: always; }
        .docx-wrapper { background: #fff !important; }
        .chart svg { max-width: 100%; height: auto; }
        .chart { page-break-inside: avoid; margin-bottom: 16px; }
      </style></head><body>${inner}</body></html>`
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden">
      {/* نوار ابزار */}
      <div className="px-3 py-2 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
        <FileText className="w-4 h-4 text-sky-500 shrink-0" />
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 truncate flex-1">{name}</span>
        <button
          onClick={handlePrintToPdf}
          disabled={status !== 'ready'}
          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Printer className="w-3 h-3" />
          تبدیل به PDF (چاپ)
        </button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            دانلود
          </a>
        )}
      </div>

      {/* بدنهٔ پیش‌نمایش */}
      <div className="flex-1 min-h-0 p-3 flex flex-col">
        {status === 'loading' && (
          <div className="h-full flex items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
            <span className="text-[11px] font-bold">در حال بارگذاری سند...</span>
          </div>
        )}
        {status === 'error' && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-[11px] font-bold text-red-500">{error}</p>
            <p className="text-[10px] text-slate-400">
              پیش‌نمایش در دسترس نیست؛ برای مشاهده، فایل را دانلود کنید.
            </p>
          </div>
        )}
        {status === 'ready' &&
          (isXlsx && xlsxData ? (
            <div className="flex flex-col h-full min-h-0">
              {/* تب برگه‌ها */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0" dir="rtl">
                {xlsxData.sheets.map((s, i) => (
                  <button
                    key={s.name}
                    onClick={() => setActiveSheet(i)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      i === activeSheet
                        ? 'bg-teal-600 text-white shadow'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              {/* محتوای برگهٔ فعال */}
              <div className="flex-1 min-h-0 overflow-auto">
                {renderSheet(xlsxData.sheets[activeSheet] ?? xlsxData.sheets[0])}

                {(xlsxData.extraImages.length > 0 || xlsxData.extraCharts.length > 0) && (
                  <div className="mt-4 border-t border-dashed border-slate-300 dark:border-slate-700 pt-3 pb-2">
                    <h4 className="text-[11px] font-black text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-teal-500" />
                      سایر تصاویر و نمودارها
                    </h4>
                    <div className="grid gap-3">
                      {xlsxData.extraCharts.map((c, i) => (
                        <div key={`c${i}`} className="rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                          <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                            {c.title || 'نمودار'}
                          </div>
                          <div className="bg-white dark:bg-slate-950 p-2" dangerouslySetInnerHTML={{ __html: c.svg }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {xlsxData.extraImages.map((img, i) => (
                        <figure key={`i${i}`} className="rounded-lg border border-gray-200 dark:border-slate-800 p-2 bg-slate-50 dark:bg-slate-900">
                          <img src={img.url} alt={img.name} className="max-h-44 max-w-full object-contain" />
                          <figcaption className="text-[9px] text-slate-400 mt-1 text-center">{img.name}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="mx-auto max-w-full bg-white dark:bg-slate-950 rounded-lg shadow-sm p-4 h-full overflow-auto"
              dir="auto"
            />
          ))}
      </div>
    </div>
  );
};
