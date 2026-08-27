import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SmartPageSchema, SectionInstance, getColumnWidth, getColumnBlocks, resolveBoxShadow } from './builderTypes';
import { applyBackgroundOpacity } from './WidgetRenderer';
import { X, Code, Copy, Check, Download } from 'lucide-react';

interface ExportModalProps {
  pageSchema: SmartPageSchema;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ pageSchema, onClose }) => {
  const [exportFormat, setExportFormat] = useState<'react' | 'html' | 'json'>('react');
  const [copied, setCopied] = useState(false);

  /**
   * استایل CSS پس‌زمینهٔ سکشن (لایه‌بندی: رنگ/گرادیان روی تصویر)
   */
  const sectionBackgroundStyle = (sec: SectionInstance): string => {
    const layers: string[] = [];
    if (sec.backgroundGradient) {
      layers.push(applyBackgroundOpacity(sec.backgroundGradient, sec.backgroundOpacity));
    } else if (sec.backgroundColor) {
      const c = applyBackgroundOpacity(sec.backgroundColor, sec.backgroundOpacity) || sec.backgroundColor;
      layers.push(`linear-gradient(135deg, ${c} 0%, ${c} 100%)`);
    }
    if (sec.backgroundImage) {
      layers.push(`url(&quot;${sec.backgroundImage}&quot;)`);
    }
    const bgImage = layers.length ? `background-image: ${layers.join(', ')};` : '';
    const bgColor =
      sec.backgroundImage || sec.backgroundGradient || !sec.backgroundColor
        ? ''
        : `background-color: ${sec.backgroundColor};`;
    const bgPos = sec.backgroundImage
      ? `background-position: ${sec.backgroundPosition || 'center'}; background-size: ${sec.backgroundSize || 'cover'}; background-repeat: ${sec.backgroundRepeat || 'no-repeat'};`
      : '';
    const pos =
      sec.position && sec.position !== 'static'
        ? `position: ${sec.position}; z-index: ${sec.zIndex || 1}; top: 0;`
        : '';
    const shadow = resolveBoxShadow(sec.boxShadow)
      ? `box-shadow: ${resolveBoxShadow(sec.boxShadow)};`
      : '';
    return `${bgColor} ${bgImage} ${bgPos} ${pos} ${shadow}`;
  };

    /** Recursive section -> JSX (nested sub-sections inside columns are emitted too — ترتیب blocks ملاک است) */
  const renderReactSection = (sec: SectionInstance, depth: number): string => {
    const pad = '  '.repeat(2 + depth * 2);
    return `${pad}<section className="page-section py-10">
${pad}  <div className="${sec.layout === 'boxed' ? 'max-w-[1200px] mx-auto px-4' : 'w-full px-4'}">
${pad}    <div className="grid grid-cols-12 gap-6">
${sec.columns
  .map((col) => {
    const blocks = getColumnBlocks(col)
      .map((block) => {
        if (block.kind === 'section') return renderReactSection(block.section, depth + 2);
        const w = block.widget;
        return `${pad}        {/* Widget: ${w.title} (${w.type}) */}
${pad}        <div className="widget-block my-3">
${pad}          ${w.type === 'heading' ? `<h2 className="text-2xl font-black">${w.content}</h2>` : ''}
${pad}          ${w.type === 'text' ? `<p className="text-sm leading-relaxed">${w.content}</p>` : ''}
${pad}          ${w.type === 'button' ? (() => { const _st = w.settings?.style || {}; const _bg = _st.backgroundColor ? ` style="background-color: ${_st.backgroundColor};${_st.textColor ? ` color: ${_st.textColor};` : ''}"` : ''; return `<a href="${w.buttonUrl || '#'}" className="inline-block px-6 py-3 rounded-xl font-bold"${_bg}>${w.buttonText || 'Action Button'}</a>`; })() : ''}
${pad}          ${w.type.includes('feed') || w.type.includes('staff') || w.type.includes('file') ? `<div className="dynamic-module-bound border rounded-2xl p-4">[Smart Binding: ${w.type}]</div>` : ''}
${pad}        </div>`;
      })
      .join(`\n${pad}        `);
    return `${pad}      <div className="col-span-${getColumnWidth(col, 'mobile')} md:col-span-${getColumnWidth(col, 'tablet')} lg:col-span-${getColumnWidth(col, 'desktop')}">
${pad}        ${blocks}
${pad}      </div>`;
  })
  .join('\n')}
${pad}    </div>
${pad}  </div>
${pad}</section>`;
  };

  /** Recursive section -> HTML (nested sub-sections inside columns are emitted too — ترتیب blocks ملاک است) */
  const renderHtmlSection = (sec: SectionInstance, depth: number): string => {
    const pad = '  '.repeat(2 + depth * 2);
    return `${pad}<section id="${sec.bookmark || sec.id}" style="${sectionBackgroundStyle(sec)} margin-top: ${sec.marginTop ?? 0}px; margin-bottom: ${sec.marginBottom ?? 0}px; padding-top: ${sec.paddingTop}px; padding-bottom: ${sec.paddingBottom}px; padding-left: ${sec.paddingLeft ?? 0}px; padding-right: ${sec.paddingRight ?? 0}px;">
${pad}  <div class="${sec.layout === 'boxed' ? 'max-w-[1200px] mx-auto px-4' : 'w-full px-4'}">
${pad}    <div class="grid grid-cols-12 gap-6">
${sec.columns
  .map((col) => {
    const blocks = getColumnBlocks(col)
      .map((block) => {
        if (block.kind === 'section') return renderHtmlSection(block.section, depth + 2);
        const w = block.widget;
        return `<div class="mb-4">
${pad}          <p class="text-xs text-slate-600">${w.content}</p>
${pad}        </div>`;
      })
      .join(`\n${pad}        `);
    return `${pad}      <div class="col-span-${getColumnWidth(col, 'mobile')} md:col-span-${getColumnWidth(col, 'tablet')} lg:col-span-${getColumnWidth(col, 'desktop')}">
${pad}        ${blocks}
${pad}      </div>`;
  })
  .join('\n')}
${pad}    </div>
${pad}  </div>
${pad}</section>`;
  };

  const generateReactCode = () => {
    return `import React from 'react';

// Generated by Smart Page Builder (Intelligent Layout Engine)
// Page: ${pageSchema.title}

export default function SmartPage() {
  return (
    <div className="smart-page-wrapper w-full font-sans rtl text-right bg-white dark:bg-slate-900">
      {/* Sections rendering */}
      ${pageSchema.sections.map((sec) => renderReactSection(sec, 0)).join('\n')}
    </div>
  );
}`;
  };

  const generateHtmlCode = () => {
    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${pageSchema.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <style>
    body { font-family: 'Vazirmatn', sans-serif; }
  </style>
</head>
<body class="bg-slate-50 text-slate-900">
  <main className="w-full">
    ${pageSchema.sections.map((sec) => renderHtmlSection(sec, 0)).join('\n')}
  </main>
</body>
</html>`;
  };

const currentCode =
    exportFormat === 'react'
      ? generateReactCode()
      : exportFormat === 'html'
      ? generateHtmlCode()
      : JSON.stringify(pageSchema, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md rtl text-right transition-colors">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">دریافت کد خروجی صفحه (Code Export Engine)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">تولید خودکار کامپوننت React، کد HTML و Schema درایور</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportFormat('react')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                exportFormat === 'react' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
              }`}
            >
              کامپوننت JSX / React
            </button>
            <button
              onClick={() => setExportFormat('html')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                exportFormat === 'html' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
              }`}
            >
              کد HTML + Tailwind
            </button>
            <button
              onClick={() => setExportFormat('json')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                exportFormat === 'json' ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md' : 'text-slate-500'
              }`}
            >
              ساختار JSON Schema
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300 dark:text-emerald-950" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد!' : 'کپی تمام کد'}</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <textarea
            readOnly
            rows={14}
            value={currentCode}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-teal-700 dark:text-teal-300 focus:outline-none"
          />
        </div>
      </motion.div>
    </div>
  );
};
