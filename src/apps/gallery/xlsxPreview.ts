// ============================================================
// xlsxPreview.ts — پیش‌نمایش پیشرفته اکسل
// - سلول‌های هر برگه (SheetJS)
// - تصاویر جاسازی‌شده (نمودارِ تصویری، شکل، لوگو و…) از بستهٔ ZIP
// - نمودارهای بومی اکسل (bar/line/pie/doughnut/area/scatter)
//   با رندر SVG از دادهٔ کش‌شده در chart XML
// ============================================================
import JSZip from 'jszip';

export interface XlsxImage {
  url: string; // Object URL
  name: string; // نام فایل رسانه (مثل image1.png)
}

export interface XlsxChart {
  title: string;
  svg: string;
}

export interface XlsxSheet {
  name: string;
  rows: string[][];
  empty: boolean;
  images: XlsxImage[];
  charts: XlsxChart[];
}

export interface XlsxPreviewData {
  sheets: XlsxSheet[];
  extraImages: XlsxImage[];
  extraCharts: XlsxChart[];
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ------------------------------------------------------------
// استخراج تصاویر بسته (xl/media) و نگاشت آن‌ها به برگه‌ها از طریق
// xl/drawings/* + فایل‌های _rels
// ------------------------------------------------------------
interface DrawingInfo {
  images: string[]; // مسیرهای عادی‌شدهٔ media (مثل xl/media/image1.png)
  charts: string[]; // مسیرهای chart (مثل xl/charts/chart1.xml)
}

function normalizeTarget(target: string): string {
  // «../media/image1.png» → «xl/media/image1.png»
  let t = target.replace(/\\/g, '/').replace(/^\.\.\//, '');
  if (!/^xl\//i.test(t)) t = `xl/${t}`;
  return t.toLowerCase();
}

async function mapMedia(zip: JSZip): Promise<{
  sheetDrawings: Map<number, string[]>; // شاخص برگه → مسیرهای drawing
  drawings: Map<string, DrawingInfo>;
}> {
  const drawings = new Map<string, DrawingInfo>();
  const sheetDrawings = new Map<number, string[]>();

  // rels هر drawing: rId → target (تصویر یا نمودار)
  const drawingRels = Object.keys(zip.files).filter((p) =>
    /^xl\/drawings\/_rels\/drawing\d+\.xml\.rels$/i.test(p)
  );
  for (const relPath of drawingRels) {
    const relXml = await zip.file(relPath)!.async('string');
    const relMap = new Map<string, string>();
    for (const m of relXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      relMap.set(m[1], m[2]);
    }
    const drawingPath = relPath
      .replace(/\/_rels\//i, '/')
      .replace(/\.rels$/i, '')
      .toLowerCase();
    const info: DrawingInfo = { images: [], charts: [] };
    // محتوای خود drawing: blip (تصویر) و chart
    const drawEntry = zip.file(drawingPath);
    if (drawEntry) {
      const drawXml = await drawEntry.async('string');
      for (const m of drawXml.matchAll(/<a:blip[^>]*r:embed="([^"]+)"/g)) {
        const t = relMap.get(m[1]);
        if (t) info.images.push(normalizeTarget(t));
      }
      for (const m of drawXml.matchAll(/<c:chart[^>]*r:id="([^"]+)"/g)) {
        const t = relMap.get(m[1]);
        if (t) info.charts.push(normalizeTarget(t));
      }
    }
    drawings.set(drawingPath, info);
  }

  // rels هر worksheet: rId → target drawing
  const sheetRels = Object.keys(zip.files).filter((p) =>
    /^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/i.test(p)
  );
  for (const relPath of sheetRels) {
    const relXml = await zip.file(relPath)!.async('string');
    const relMap = new Map<string, string>();
    for (const m of relXml.matchAll(/<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)) {
      relMap.set(m[1], m[2]);
    }
    const sheetIdx = parseInt(relPath.match(/sheet(\d+)\.xml\.rels$/i)![1], 10) - 1;
    const sheetPath = relPath.replace(/\/_rels\//i, '/').replace(/\.rels$/i, '').toLowerCase();
    const entry = zip.file(sheetPath);
    if (!entry) continue;
    const sheetXml = await entry.async('string');
    const list: string[] = [];
    for (const m of sheetXml.matchAll(/<drawing[^>]*r:id="([^"]+)"/g)) {
      const t = relMap.get(m[1]);
      if (t) list.push(normalizeTarget(t));
    }
    if (list.length) sheetDrawings.set(sheetIdx, list);
  }

  return { sheetDrawings, drawings };
}

// ------------------------------------------------------------
// رندر نمودارهای بومی اکسل به SVG (از دادهٔ کش‌شده)
// ------------------------------------------------------------
interface ChartSeries {
  name: string;
  cats: string[];
  vals: number[];
  color: string;
}

interface ParsedChart {
  kind: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter';
  horizontal: boolean;
  title: string;
  series: ChartSeries[];
  scatterPts?: { x: number; y: number }[][]; // برای scatter
}

const CHART_COLORS = [
  '#4f8ef7', '#f7a64f', '#7ac74f', '#e5577b',
  '#9b7bf7', '#4fd6c7', '#f7d84f', '#b0b6c1',
];

function textOf(el: Element | undefined | null): string {
  if (!el) return '';
  const v = el.getElementsByTagNameNS('*', 'v')[0];
  if (v) return v.textContent ?? '';
  return (el.textContent ?? '').trim();
}

function ptsOf(el: Element | undefined | null): string[] {
  if (!el) return [];
  return [...el.getElementsByTagNameNS('*', 'pt')].map(
    (pt) => pt.getElementsByTagNameNS('*', 'v')[0]?.textContent ?? ''
  );
}

function numsOf(el: Element | undefined | null): number[] {
  return ptsOf(el).map((s) => parseFloat(String(s).replace(/,/g, '')) || 0);
}

function seriesColor(ser: Element, idx: number): string {
  const srgb = ser.querySelector('[val]')?.getAttribute('val');
  if (srgb && /^[0-9a-fA-F]{6}$/.test(srgb)) return `#${srgb.toLowerCase()}`;
  const solid = ser.getElementsByTagNameNS('*', 'srgbClr')[0]?.getAttribute('val');
  if (solid && /^[0-9a-fA-F]{6}$/.test(solid)) return `#${solid.toLowerCase()}`;
  return CHART_COLORS[idx % CHART_COLORS.length];
}

function parseChartXml(xml: string): ParsedChart | null {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) return null;

  let kind: ParsedChart['kind'] | null = null;
  let horizontal = false;
  let chartEl: Element | null = null;

  const barEl = doc.getElementsByTagNameNS('*', 'barChart')[0];
  const lineEl = doc.getElementsByTagNameNS('*', 'lineChart')[0];
  const pieEl = doc.getElementsByTagNameNS('*', 'pieChart')[0];
  const doughEl = doc.getElementsByTagNameNS('*', 'doughnutChart')[0];
  const areaEl = doc.getElementsByTagNameNS('*', 'areaChart')[0];
  const scatterEl = doc.getElementsByTagNameNS('*', 'scatterChart')[0];

  if (barEl) {
    kind = 'bar';
    horizontal = (barEl.getAttribute('barDir') || 'col') === 'bar';
    chartEl = barEl;
  } else if (lineEl) {
    kind = 'line';
    chartEl = lineEl;
  } else if (pieEl) {
    kind = 'pie';
    chartEl = pieEl;
  } else if (doughEl) {
    kind = 'doughnut';
    chartEl = doughEl;
  } else if (areaEl) {
    kind = 'area';
    chartEl = areaEl;
  } else if (scatterEl) {
    kind = 'scatter';
    chartEl = scatterEl;
  }
  if (!kind || !chartEl) return null;

  const titleEl = doc.getElementsByTagNameNS('*', 'title')[0];
  const title = titleEl
    ? [...titleEl.getElementsByTagNameNS('*', 't')].map((t) => t.textContent ?? '').join(' ').trim()
    : '';

  const series: ChartSeries[] = [];
  const scatterPts: { x: number; y: number }[][] = [];
  for (const ser of [...chartEl.getElementsByTagNameNS('*', 'ser')]) {
    const name = textOf(ser.getElementsByTagNameNS('*', 'tx')[0]) || `سری ${series.length + 1}`;
    const color = seriesColor(ser, series.length);
    if (kind === 'scatter') {
      const xs = numsOf(ser.getElementsByTagNameNS('*', 'xVal')[0]);
      const ys = numsOf(ser.getElementsByTagNameNS('*', 'yVal')[0]);
      scatterPts.push(xs.map((x, i) => ({ x, y: ys[i] ?? 0 })));
      series.push({ name, cats: [], vals: [], color });
    } else {
      const cats = ptsOf(ser.getElementsByTagNameNS('*', 'cat')[0]);
      const vals = numsOf(ser.getElementsByTagNameNS('*', 'val')[0]);
      series.push({ name, cats, vals, color });
    }
  }
  if (!series.length) return null;
  if (kind === 'scatter' && !scatterPts.length) return null;

  return { kind, horizontal, title, series, scatterPts };
}

function svgText(x: number, y: number, text: string, size = 12, anchor: string, fill = '#334155') {
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" font-family="Vazirmatn, 'Segoe UI', Tahoma, sans-serif">${esc(text)}</text>`;
}

function legendHtml(items: { name: string; color: string }[], x: number, y: number): string {
  let s = '';
  items.forEach((it, i) => {
    const lx = x + i * 130;
    s += `<rect x="${lx}" y="${y - 8}" width="10" height="10" rx="2" fill="${it.color}"/>`;
    s += svgText(lx + 14, y + 2, it.name, 10, 'start');
  });
  return s;
}

function renderBarSvg(p: ParsedChart): string {
  const W = 640, H = 360, mL = 56, mR = 16, mT = 40, mB = 44;
  const pw = W - mL - mR, ph = H - mT - mB;
  // اتحاد دسته‌ها
  const cats: string[] = [];
  p.series.forEach((s) => s.cats.forEach((c) => { if (c !== '' && !cats.includes(c)) cats.push(c); }));
  const nCats = Math.max(cats.length, 1);
  const maxV = Math.max(1, ...p.series.flatMap((s) => s.vals).filter((v) => v > 0));
  let body = '';
  const nSer = p.series.length;

  if (!p.horizontal) {
    const groupW = pw / nCats;
    const barW = Math.min((groupW * 0.8) / Math.max(nSer, 1), 44);
    const baseY = mT + ph;
    p.series.forEach((s, si) => {
      s.vals.forEach((v, ci) => {
        const h = Math.max(1, (v / maxV) * ph);
        const x = mL + ci * groupW + (groupW - barW * nSer) / 2 + si * barW;
        body += `<rect x="${x.toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" fill="${s.color}" rx="1.5"/>`;
      });
    });
    // محور و برچسب دسته‌ها
    body += `<line x1="${mL}" y1="${baseY}" x2="${mL + pw}" y2="${baseY}" stroke="#cbd5e1" stroke-width="1"/>`;
    cats.forEach((c, ci) => {
      const cx = mL + ci * groupW + groupW / 2;
      body += svgText(cx, baseY + 16, c, 10, 'middle');
    });
  } else {
    const groupH = ph / nCats;
    const barH = Math.min((groupH * 0.8) / Math.max(nSer, 1), 30);
    p.series.forEach((s, si) => {
      s.vals.forEach((v, ci) => {
        const w = Math.max(1, (v / maxV) * pw);
        const y = mT + ci * groupH + (groupH - barH * nSer) / 2 + si * barH;
        body += `<rect x="${mL}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${barH.toFixed(1)}" fill="${s.color}" rx="1.5"/>`;
      });
    });
    cats.forEach((c, ci) => {
      const cy = mT + ci * groupH + groupH / 2;
      body += svgText(mL - 8, cy + 3, c, 10, 'end');
    });
  }

  const legend = legendHtml(p.series.map((s) => ({ name: s.name, color: s.color })), mL, mT - 12);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.title || 'نمودار')}">` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    (p.title ? svgText(W / 2, 22, p.title, 15, 'middle', '#0f172a') : '') +
    legend + body + `</svg>`;
}

function renderLineSvg(p: ParsedChart, filled: boolean): string {
  const W = 640, H = 360, mL = 56, mR = 16, mT = 40, mB = 44;
  const pw = W - mL - mR, ph = H - mT - mB;
  const cats: string[] = [];
  p.series.forEach((s) => s.cats.forEach((c) => { if (c !== '' && !cats.includes(c)) cats.push(c); }));
  const nCats = Math.max(cats.length, 1);
  const maxV = Math.max(1, ...p.series.flatMap((s) => s.vals));
  const baseY = mT + ph;
  let body = '';
  p.series.forEach((s, si) => {
    const pts = s.vals
      .map((v, ci) => {
        const x = nCats === 1 ? mL + pw / 2 : mL + (ci / (nCats - 1)) * pw;
        const y = baseY - (v / maxV) * ph;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    if (filled) {
      const poly = `${mL},${baseY} ${pts} ${(mL + pw).toFixed(1)},${baseY}`;
      body += `<polygon points="${poly}" fill="${s.color}" opacity="0.18"/>`;
    }
    body += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    s.vals.forEach((v, ci) => {
      const x = nCats === 1 ? mL + pw / 2 : mL + (ci / (nCats - 1)) * pw;
      const y = baseY - (v / maxV) * ph;
      body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="#fff" stroke="${s.color}" stroke-width="2"/>`;
    });
  });
  body += `<line x1="${mL}" y1="${baseY}" x2="${mL + pw}" y2="${baseY}" stroke="#cbd5e1" stroke-width="1"/>`;
  cats.forEach((c, ci) => {
    const cx = nCats === 1 ? mL + pw / 2 : mL + (ci / (nCats - 1)) * pw;
    body += svgText(cx, baseY + 16, c, 10, 'middle');
  });
  const legend = legendHtml(p.series.map((s) => ({ name: s.name, color: s.color })), mL, mT - 12);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.title || 'نمودار')}">` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    (p.title ? svgText(W / 2, 22, p.title, 15, 'middle', '#0f172a') : '') +
    legend + body + `</svg>`;
}

function renderPieSvg(p: ParsedChart, doughnut: boolean): string {
  const W = 640, H = 360, cx = W / 2, cy = H / 2 + 10;
  const r = Math.min(W, H) / 2 - 70;
  const inner = doughnut ? r * 0.55 : 0;
  const vals = p.series[0].vals.filter((v) => v > 0);
  const total = vals.reduce((a, b) => a + b, 0) || 1;
  let body = '';
  let a0 = -90;
  vals.forEach((v, i) => {
    const sweep = (v / total) * 360;
    const a1 = a0 + sweep;
    const rad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(rad(a0));
    const y1 = cy + r * Math.sin(rad(a0));
    const x2 = cx + r * Math.cos(rad(a1));
    const y2 = cy + r * Math.sin(rad(a1));
    const large = sweep > 180 ? 1 : 0;
    const color = p.series[0].color === CHART_COLORS[0] ? CHART_COLORS[i % CHART_COLORS.length] : p.series[0].color;
    if (inner > 0) {
      const ix1 = cx + inner * Math.cos(rad(a1));
      const iy1 = cy + inner * Math.sin(rad(a1));
      const ix2 = cx + inner * Math.cos(rad(a0));
      const iy2 = cy + inner * Math.sin(rad(a0));
      body += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${ix1.toFixed(1)} ${iy1.toFixed(1)} A ${inner} ${inner} 0 ${large} 0 ${ix2.toFixed(1)} ${iy2.toFixed(1)} Z" fill="${color}"/>`;
    } else {
      body += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${color}"/>`;
    }
    // برچسب درصد
    const mid = ((a0 + a1) / 2) * (Math.PI / 180);
    const lr = inner > 0 ? (r + inner) / 2 : r * 0.68;
    const lx = cx + lr * Math.cos(mid);
    const ly = cy + lr * Math.sin(mid);
    const pct = Math.round((v / total) * 100);
    body += svgText(lx, ly + 4, `${pct}٪`, 11, 'middle', '#fff');
    a0 = a1;
  });
  const name = p.series[0].name;
  const legend =
    name && p.series[0].cats.length
      ? legendHtml(
          p.series[0].cats.map((c, i) => ({ name: c, color: p.series[0].color === CHART_COLORS[0] ? CHART_COLORS[i % CHART_COLORS.length] : p.series[0].color })),
          W / 2 - 130,
          H - 18
        )
      : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.title || 'نمودار')}">` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    (p.title ? svgText(W / 2, 22, p.title, 15, 'middle', '#0f172a') : '') +
    body + legend + `</svg>`;
}

function renderScatterSvg(p: ParsedChart): string {
  const W = 640, H = 360, mL = 56, mR = 16, mT = 40, mB = 44;
  const pw = W - mL - mR, ph = H - mT - mB;
  const all = p.scatterPts!.flat();
  const xs = all.map((q) => q.x), ys = all.map((q) => q.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1, spanY = maxY - minY || 1;
  let body = '';
  p.scatterPts!.forEach((pts, si) => {
    const s = p.series[si];
    const sorted = [...pts].sort((a, b) => a.x - b.x);
    if (sorted.length > 1) {
      const line = sorted
        .map((q) => {
          const x = mL + ((q.x - minX) / spanX) * pw;
          const y = mT + ph - ((q.y - minY) / spanY) * ph;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
      body += `<polyline points="${line}" fill="none" stroke="${s.color}" stroke-width="2" opacity="0.7"/>`;
    }
    pts.forEach((q) => {
      const x = mL + ((q.x - minX) / spanX) * pw;
      const y = mT + ph - ((q.y - minY) / spanY) * ph;
      body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${s.color}" stroke="#fff" stroke-width="1.5"/>`;
    });
  });
  body += `<line x1="${mL}" y1="${mT + ph}" x2="${mL + pw}" y2="${mT + ph}" stroke="#cbd5e1"/>`;
  body += `<line x1="${mL}" y1="${mT}" x2="${mL}" y2="${mT + ph}" stroke="#cbd5e1"/>`;
  const legend = legendHtml(p.series.map((s) => ({ name: s.name, color: s.color })), mL, mT - 12);
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.title || 'نمودار')}">` +
    `<rect width="${W}" height="${H}" fill="#ffffff"/>` +
    (p.title ? svgText(W / 2, 22, p.title, 15, 'middle', '#0f172a') : '') +
    legend + body + `</svg>`;
}

function renderChart(p: ParsedChart): string {
  if (p.kind === 'bar') return renderBarSvg(p);
  if (p.kind === 'line') return renderLineSvg(p, false);
  if (p.kind === 'area') return renderLineSvg(p, true);
  if (p.kind === 'pie' || p.kind === 'doughnut') return renderPieSvg(p, p.kind === 'doughnut');
  if (p.kind === 'scatter') return renderScatterSvg(p);
  return '';
}

// ------------------------------------------------------------
// ساخت کل پیش‌نمایش
// ------------------------------------------------------------
export async function buildXlsxPreview(bytes: Uint8Array): Promise<XlsxPreviewData> {
  const XLSX = await import('xlsx');
  const zip = await JSZip.loadAsync(bytes);

  // --- برگه‌ها و سلول‌ها ---
  const wb = XLSX.read(bytes, { type: 'array' });
  const sheets: XlsxSheet[] = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const rows: string[][] = [];
    let empty = true;
    if (ws && ws['!ref']) {
      const json = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null)[]>(ws, {
        header: 1,
        defval: '',
        raw: true,
      });
      json.slice(0, 500).forEach((r) => {
        if (r && r.some((c) => c !== '' && c != null)) empty = false;
        rows.push((r || []).slice(0, 80).map((c) => (c == null ? '' : String(c))));
      });
      if (!rows.length) empty = true;
    }
    return { name, rows, empty, images: [], charts: [] };
  });

  // --- تصاویر و نمودارها ---
  const { sheetDrawings, drawings } = await mapMedia(zip);

  const mediaFiles = Object.keys(zip.files).filter((p) => /^xl\/media\/[^/]+$/i.test(p));
  const mediaByNorm = new Map(mediaFiles.map((p) => [p.toLowerCase(), p]));

  // تبدیل blob به data URL — چون CSP پروژه فقط data: را در img-src مجاز می‌داند (blob: مسدود است)
  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });

  // بارگذاری محتوای هر drawing برای برگه‌هایش
  for (const [sheetIdx, drawPaths] of sheetDrawings) {
    const sheet = sheets[sheetIdx];
    if (!sheet) continue;
    for (const dp of drawPaths) {
      const info = drawings.get(dp);
      if (!info) continue;
      for (const mPath of info.images) {
        const real = mediaByNorm.get(mPath);
        if (!real) continue;
        const blob = await zip.file(real)!.async('blob');
        sheet.images.push({ url: await blobToDataUrl(blob), name: real.split('/').pop()! });
      }
      for (const cPath of info.charts) {
        const entry = zip.file(cPath);
        if (!entry) continue;
        const xml = await entry.async('string');
        const parsed = parseChartXml(xml);
        if (parsed) sheet.charts.push({ title: parsed.title, svg: renderChart(parsed) });
      }
    }
  }

  // تصاویر/نمودارهایی که به برگه‌ای نگاشت نشدند
  const extraImages: XlsxImage[] = [];
  const extraCharts: XlsxChart[] = [];
  const usedMedia = new Set<string>();
  sheets.forEach((s) => s.images.forEach((i) => usedMedia.add(i.name)));
  for (const real of mediaFiles) {
    if (usedMedia.has(real.split('/').pop()!)) continue;
    const blob = await zip.file(real)!.async('blob');
    extraImages.push({ url: await blobToDataUrl(blob), name: real.split('/').pop()! });
  }
  const usedCharts = new Set(sheets.flatMap((s) => s.charts.map((c) => c.title)));
  const chartFiles = Object.keys(zip.files).filter((p) => /^xl\/charts\/chart\d+\.xml$/i.test(p));
  for (const cp of chartFiles) {
    const xml = await zip.file(cp)!.async('string');
    const parsed = parseChartXml(xml);
    if (parsed && !usedCharts.has(parsed.title)) {
      extraCharts.push({ title: parsed.title, svg: renderChart(parsed) });
    }
  }

  return { sheets, extraImages, extraCharts };
}
