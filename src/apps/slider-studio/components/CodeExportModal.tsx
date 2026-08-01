import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Code, Copy, Check, FileText, Smartphone, Laptop } from 'lucide-react';
import type { SliderProject } from '@/src/shared-types/slider-studio';
import { SHAPE_SVG_TEMPLATES } from '../constants/shapes';

function shapeFlatFill(layer: { backgroundColor?: string; backgroundGradient?: string }): string {
  if (layer.backgroundColor) return layer.backgroundColor;
  const g = layer.backgroundGradient;
  if (g) {
    const m = g.match(/#[0-9a-fA-F]{3,8}/g);
    if (m && m.length) return m[0];
  }
  return '#38bdf8';
}

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SliderProject;
}

export default function CodeExportModal({ isOpen, onClose, project }: CodeExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'html' | 'react'>('html');

  if (!isOpen) return null;

  const currentSlide = project.slides[0];

  // Generate Standalone HTML + CSS Code
  const generatedHtmlCode = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    .slider-container {
      position: relative;
      width: 100%;
      max-width: ${project.width}px;
      height: ${project.height}px;
      margin: 0 auto;
      overflow: hidden;
      border-radius: 24px;
      background: ${currentSlide.background.gradient || currentSlide.background.color};
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${currentSlide.layers
      .map(
        l => {
          const path = l.animation?.motionPath;
          const pathCss = path?.points && path.points.length >= 2
            ? `
      offset-path: path("M ${path.points[0].x} ${path.points[0].y} ${path.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')}");
      offset-anchor: 0% 0%;
      offset-rotate: 0deg;
      animation: mp-${l.id} ${Math.max(0.1, path.duration ?? l.animation?.inDuration ?? 2)}s ${l.animation?.inEasing ?? 'ease-out'} ${l.animation?.inDelay ?? 0}s infinite;`
            : '';
          return `
    #layer-${l.id} {
      position: absolute;
      left: ${l.x}px;
      top: ${l.y}px;
      width: ${l.width}px;
      height: ${l.height}px;
      font-size: ${l.fontSize}px;
      color: ${l.color};
      background: ${l.type === 'shape' ? 'transparent' : l.backgroundColor};
      border-radius: ${l.borderRadius ?? 0}px;
      border: ${l.type === 'shape' ? 'none' : `${l.borderWidth ?? 0}px solid ${l.borderColor ?? 'transparent'}`};
      padding: ${l.padding ?? '0px'};
      z-index: ${l.zIndex};
      transform: rotate(${l.rotation}deg);
      box-shadow: ${l.shadow || 'none'};
      transition: all 0.3s ease;${pathCss}
    }`;
        }
      )
      .join('\n')}
    ${currentSlide.layers
      .filter(l => l.animation?.motionPath?.points && l.animation.motionPath.points.length >= 2)
      .map(
        l => `
    @keyframes mp-${l.id} {
      from { offset-distance: 0%; }
      to   { offset-distance: 100%; }
    }`
      )
      .join('\n')}
  </style>
</head>
<body>

<div class="slider-container">
  ${currentSlide.layers
    .map(l => {
      if (l.type === 'image') {
        return `<img id="layer-${l.id}" src="${l.content}" alt="${l.name}" />`;
      }
      if (l.type === 'button') {
        return `<button id="layer-${l.id}">${l.content}</button>`;
      }
      if (l.type === 'shape') {
        const bw = l.borderWidth ?? 0;
        const bcol = l.borderColor && l.borderColor !== 'transparent' ? l.borderColor : 'transparent';
        const shape = l.shape ?? 'circle';
        const template = SHAPE_SVG_TEMPLATES[shape] ?? SHAPE_SVG_TEMPLATES.circle;
        return `<div id="layer-${l.id}" style="position:relative;">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute; inset:0; width:100%; height:100%;">${template(shapeFlatFill(l), bcol === 'transparent' ? 'transparent' : bcol, bw)}</svg>
        </div>`;
      }
      return `<div id="layer-${l.id}">${l.content}</div>`;
    })
    .join('\n  ')}
</div>

</body>
</html>`;

  // Generate React Component Code
  const generatedReactCode = `import React from 'react';

export default function InteractiveSlider() {
  return (
    <div className="relative w-full max-w-[${project.width}px] h-[${project.height}px] mx-auto overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
      ${currentSlide.layers
        .map(l => {
          return `<div
        key="${l.id}"
        style={{
          position: 'absolute',
          left: ${l.x},
          top: ${l.y},
          width: ${l.width},
          height: ${l.height},
          fontSize: '${l.fontSize}px',
          color: '${l.color}',
          backgroundColor: '${l.backgroundColor}',
          borderRadius: '${l.borderRadius ?? 0}px',
          border: '${l.borderWidth ?? 0}px solid ${l.borderColor ?? 'transparent'}',
          padding: '${l.padding ?? '0px'}',
          zIndex: ${l.zIndex},
          transform: 'rotate(${l.rotation}deg)'
        }}
      >
        ${l.content}
      </div>`;
        })
        .join('\n      ')}
    </div>
  );
}`;

  const currentCode = exportFormat === 'html' ? generatedHtmlCode : generatedReactCode;

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
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">دریافت کد خروجی استاندارد و سبک</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">تولید خودکار کد HTML/CSS/JS یا کامپوننت React قابل نصب</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportFormat('html')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                exportFormat === 'html'
                  ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              کد HTML + CSS خودمختار (Standalone)
            </button>
            <button
              onClick={() => setExportFormat('react')}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                exportFormat === 'react'
                  ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-slate-950 shadow-md shadow-teal-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              کامپوننت JSX / React
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-200 dark:text-emerald-950" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'کپی شد!' : 'کپی تمام کد'}</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <textarea
            readOnly
            rows={14}
            value={currentCode}
            className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs font-mono text-teal-700 dark:text-teal-300 focus:outline-none"
          />
        </div>
      </motion.div>
    </div>
  );
}
