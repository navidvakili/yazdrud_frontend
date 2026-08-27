import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

// ---- Types ----
interface ColorStop {
  /** همیشه hex شش‌رقمی — شفافیت جدا در alpha نگه داشته می‌شود تا هر نقطه اسلایدر شفافیت مستقل داشته باشد */
  color: string;
  position: number; // 0-100 — محدودهٔ پخش این رنگ روی گرادیان
  alpha: number; // 0-100 — شفافیت این نقطه (۱۰۰ = کاملاً کدر، ۰ = کاملاً شفاف)
}

interface GradientPickerProps {
  /** Current CSS gradient value (e.g. "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)") */
  value: string;
  /** Called with the new CSS gradient string */
  onChange: (cssGradient: string) => void;
}

// ---- Helpers ----

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';

const isValidHex6 = (s: string): boolean => /^#[0-9a-fA-F]{6}$/.test(s.trim());

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('');

/** رنگ یک نقطهٔ گرادیان را به {hex, alpha 0-100} تجزیه می‌کند — hex/rgb/rgba/transparent را می‌شناسد */
function parseStopColor(raw: string, fallbackHex: string): { color: string; alpha: number } {
  const c = raw.trim();
  if (c.toLowerCase() === 'transparent') return { color: fallbackHex, alpha: 0 };
  const rgbaMatch = c.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    return { color: rgbToHex(+r, +g, +b), alpha: a !== undefined ? Math.round(parseFloat(a) * 100) : 100 };
  }
  if (isValidHex6(c)) return { color: c, alpha: 100 };
  // رنگ نامعتبر/خالی (مثلاً باقی‌ماندهٔ ویرایش دستی ناقص) — به‌جای خراب‌کردن کل رشته، رنگ پیش‌فرض با نمایان بودن کامل
  return { color: fallbackHex, alpha: 100 };
}

/**
 * Parse a CSS linear-gradient string into angle + color stops.
 * Falls back to default on failure.
 */
function parseGradient(css: string): { angle: string; stops: ColorStop[] } {
  try {
    const trimmed = css.trim();
    const match = trimmed.match(/linear-gradient\(\s*([^,]+?)\s*,\s*(.+)\s*\)/);
    if (!match) return parseGradient(DEFAULT_GRADIENT);

    let angle = match[1].trim();
    const stopsRaw = match[2].trim();

    // Split stops carefully (handling commas inside rgba/hsla)
    const parts = splitStops(stopsRaw);

    const stops: ColorStop[] = parts.map((part) => {
      const p = part.trim();
      // موقعیت همیشه یک درصد در انتهای رشته است — حتی اگر رنگ قبل از آن خالی/نامعتبر باشد. قبلاً این
      // رگرسیون را داشت: نیازمند «رنگ سپس فاصله سپس درصد» بود، پس یک رنگ خالی (مثلاً باقی‌ماندهٔ ویرایش
      // دستی ناقص) کل رشته را به‌جای رنگ غلط تفسیر می‌کرد و موقعیت را صفر می‌گذاشت — با ادیت بعدی
      // (مثلاً کشیدن اسلایدر موقعیت) این رشتهٔ خراب («0% 39%») ذخیره می‌شد و گرادیان کلاً نامعتبر می‌شد.
      const posMatch = p.match(/^(.*?)\s*([\d.]+)%\s*$/);
      const colorRaw = posMatch ? posMatch[1].trim() : p;
      const position = posMatch ? parseFloat(posMatch[2]) : 0;
      const { color, alpha } = parseStopColor(colorRaw, '#0f172a');
      return { color, position, alpha };
    });

    // Normalize positions if they're all 0 (meaning they came from fallback)
    const allZero = stops.every((s) => s.position === 0);
    if (allZero && stops.length > 1) {
      stops.forEach((s, i) => {
        s.position = Math.round((i / (stops.length - 1)) * 100);
      });
    }

    return { angle, stops };
  } catch {
    return parseGradient(DEFAULT_GRADIENT);
  }
}

/**
 * Split color-stop list by comma, respecting parentheses nesting.
 */
function splitStops(raw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of raw) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/** hex شش‌رقمی + آلفای ۰-۱۰۰ → رشتهٔ rgba (یا خودِ hex وقتی آلفا کامل است، برای خروجی تمیزتر) */
function stopColorToCss(hex: string, alpha: number): string {
  if (alpha >= 100) return isValidHex6(hex) ? hex : hex;
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, alpha)) / 100})`;
}

/**
 * Build a CSS linear-gradient string from angle and stops — هر نقطه با آلفای خودش
 * (اگر کمتر از ۱۰۰٪ باشد) تا شفافیت مستقل هر نقطه هم در خروجی و هم در پیش‌نمایش دیده شود.
 */
function buildGradient(angle: string, stops: ColorStop[]): string {
  const stopStr = stops
    .map((s) => `${stopColorToCss(s.color, s.alpha)} ${s.position}%`)
    .join(', ');
  return `linear-gradient(${angle}, ${stopStr})`;
}

// ---- Circular angle dial (مانند فتوشاپ) ----
// CSS gradient angle semantics: 0deg = به بالا، 90deg = راست، 180deg = پایین، 270deg = چپ (ساعت‌گرد)

const DIAL_SIZE = 64;
const DIAL_CENTER = DIAL_SIZE / 2;
const DIAL_RADIUS = DIAL_SIZE / 2 - 6;

/** تبدیل زاویهٔ گرادیان (درجه) به مختصات نقطهٔ روی دایره (x,y با مبدأ بالا-چپ) */
const angleToPoint = (deg: number): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180;
  return {
    x: DIAL_CENTER + DIAL_RADIUS * Math.sin(rad),
    y: DIAL_CENTER - DIAL_RADIUS * Math.cos(rad)
  };
};

/** تبدیل موقعیت اشاره‌گر (نسبت به مرکز دایره) به زاویهٔ گرادیان ۰ تا ۳۶۰ درجه */
const pointToAngle = (px: number, py: number): number => {
  const dx = px - DIAL_CENTER;
  const dy = py - DIAL_CENTER;
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg) % 360;
};

interface AngleDialProps {
  angle: number;
  onAngleChange: (deg: number) => void;
}

/** دایرهٔ زاویهٔ گرادیان — با خط جهت‌نما از مرکز به لبه که قابل کشیدن است */
const AngleDial: React.FC<AngleDialProps> = ({ angle, onAngleChange }) => {
  const dialRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = dialRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      onAngleChange(pointToAngle(px, py));
    },
    [onAngleChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const tip = angleToPoint(angle);

  return (
    <div
      ref={dialRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative shrink-0 touch-none select-none rounded-full cursor-pointer ${
        dragging ? 'ring-2 ring-teal-400/50' : ''
      }`}
      style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
      title="زاویهٔ گرادیان — روی دایره بکشید"
    >
      <svg width={DIAL_SIZE} height={DIAL_SIZE} viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`} className="block">
        {/* حلقهٔ بیرونی */}
        <circle
          cx={DIAL_CENTER}
          cy={DIAL_CENTER}
          r={DIAL_RADIUS}
          fill="none"
          strokeWidth={1.5}
          className="stroke-slate-300 dark:stroke-slate-600"
        />
        {/* نشانگرهای زاویه (هر ۳۰ درجه) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const deg = i * 30;
          const pOuter = angleToPoint(deg);
          const innerR = DIAL_RADIUS - (deg % 90 === 0 ? 7 : 3.5);
          const rad = (deg * Math.PI) / 180;
          const x2 = DIAL_CENTER + innerR * Math.sin(rad);
          const y2 = DIAL_CENTER - innerR * Math.cos(rad);
          return (
            <line
              key={i}
              x1={pOuter.x}
              y1={pOuter.y}
              x2={x2}
              y2={y2}
              strokeWidth={deg % 90 === 0 ? 1.5 : 1}
              className={deg % 90 === 0 ? 'stroke-slate-500 dark:stroke-slate-400' : 'stroke-slate-300 dark:stroke-slate-600'}
            />
          );
        })}
        {/* خط جهت‌نما از مرکز به لبه */}
        <line
          x1={DIAL_CENTER}
          y1={DIAL_CENTER}
          x2={tip.x}
          y2={tip.y}
          strokeWidth={2.5}
          strokeLinecap="round"
          className="stroke-teal-500 dark:stroke-teal-400"
        />
        {/* نقطهٔ مرکز */}
        <circle cx={DIAL_CENTER} cy={DIAL_CENTER} r={3} className="fill-teal-500 dark:fill-teal-400" />
        {/* نقطهٔ انتهای خط */}
        <circle cx={tip.x} cy={tip.y} r={3.5} className="fill-teal-500 dark:fill-teal-400" />
      </svg>
      {/* برچسب زاویه داخل دایره */}
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 pointer-events-none">
        {angle}°
      </span>
    </div>
  );
};

// ---- Component ----

export default function GradientPicker({ value, onChange }: GradientPickerProps) {
  const parsed = useMemo(() => {
    const result = parseGradient(value || DEFAULT_GRADIENT);
    // Validate angle
    const angleNum = parseFloat(result.angle);
    if (isNaN(angleNum)) result.angle = '135deg';
    return result;
  }, [value]);

  const { angle, stops } = parsed;

  const emit = useCallback(
    (newAngle: string, newStops: ColorStop[]) => {
      onChange(buildGradient(newAngle, newStops));
    },
    [onChange]
  );

  const handleAngleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      // Ensure 'deg' suffix
      const num = parseFloat(val);
      if (!isNaN(num)) {
        val = `${Math.round(num)}deg`;
      }
      emit(val, stops);
    },
    [stops, emit]
  );

  const handleStopColor = useCallback(
    (index: number, color: string) => {
      const next = stops.map((s, i) => (i === index ? { ...s, color } : s));
      emit(angle, next);
    },
    [stops, angle, emit]
  );

  const handleStopPosition = useCallback(
    (index: number, position: number) => {
      const clamped = Math.max(0, Math.min(100, position));
      const next = stops.map((s, i) => (i === index ? { ...s, position: clamped } : s));
      emit(angle, next);
    },
    [stops, angle, emit]
  );

  const handleStopAlpha = useCallback(
    (index: number, alpha: number) => {
      const clamped = Math.max(0, Math.min(100, alpha));
      const next = stops.map((s, i) => (i === index ? { ...s, alpha: clamped } : s));
      emit(angle, next);
    },
    [stops, angle, emit]
  );

  const addStop = useCallback(() => {
    if (stops.length >= 8) return; // reasonable limit
    // Insert between last two stops or at 100%
    const pos = stops.length > 1
      ? Math.min(100, stops[stops.length - 1].position + 10)
      : 100;
    const color = '#3b82f6';
    const next = [...stops, { color, position: Math.min(100, pos), alpha: 100 }];
    emit(angle, next);
  }, [stops, angle, emit]);

  const removeStop = useCallback(
    (index: number) => {
      if (stops.length <= 2) return; // minimum 2 stops
      const next = stops.filter((_, i) => i !== index);
      emit(angle, next);
    },
    [stops, angle, emit]
  );

  const angleNum = parseFloat(angle) || 135;

  return (
    <div className="space-y-3">
      {/* Preview strip */}
      <div
        className="h-8 rounded-xl border border-gray-300 dark:border-slate-700"
        style={{ background: buildGradient(angle, stops) }}
      />

      {/* Color stops — هر نقطه: رنگ (با کد hex)، شفافیت٪ و محدودهٔ پخش٪ مستقل از هم */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin">
        {stops.map((stop, index) => (
          <div
            key={index}
            className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-2 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              {/* Color picker */}
              <input
                type="color"
                value={/^#[0-9a-fA-F]{6}$/.test(stop.color) ? stop.color : '#000000'}
                onChange={(e) => handleStopColor(index, e.target.value)}
                className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
                title="رنگ نقطه"
              />
              {/* Hex text */}
              <input
                type="text"
                value={stop.color}
                onChange={(e) => handleStopColor(index, e.target.value)}
                placeholder="#rrggbb"
                title="کد رنگ (hex)"
                dir="ltr"
                className="w-20 min-w-0 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[10px]"
              />
              <span className="flex-1 text-[10px] font-bold text-slate-400 dark:text-slate-500">نقطهٔ {index + 1}</span>
              {/* Remove button */}
              {stops.length > 2 && (
                <button
                  onClick={() => removeStop(index)}
                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg cursor-pointer shrink-0"
                  title="حذف این نقطه"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Opacity slider — ۱۰۰٪ = کاملاً کدر، ۰٪ = کاملاً شفاف (برای محوشدن یک سمت گرادیان) */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-14 shrink-0">شفافیت</label>
              <input
                type="range"
                min={0}
                max={100}
                value={stop.alpha}
                onChange={(e) => handleStopAlpha(index, parseInt(e.target.value))}
                className="min-w-0 flex-1 h-1 accent-teal-500 cursor-pointer"
                dir="ltr"
              />
              <span className="text-[10px] text-slate-500 w-8 shrink-0 text-right font-mono">{stop.alpha}%</span>
            </div>

            {/* Position slider — محدودهٔ پخش این رنگ روی طول گرادیان */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 w-14 shrink-0">محدودهٔ پخش</label>
              <input
                type="range"
                min={0}
                max={100}
                value={stop.position}
                onChange={(e) => handleStopPosition(index, parseInt(e.target.value))}
                className="min-w-0 flex-1 h-1 accent-teal-500 cursor-pointer"
                dir="ltr"
              />
              <span className="text-[10px] text-slate-500 w-8 shrink-0 text-right font-mono">{stop.position}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient direction / angle — دایرهٔ زاویه مانند فتوشاپ */}
      <div className="flex items-center gap-3">
        <AngleDial
          angle={angleNum}
          onAngleChange={(deg) => emit(`${deg}deg`, stops)}
        />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
              زاویه گرادیان
            </label>
            <span className="text-[10px] text-slate-500 w-10 shrink-0 text-left font-mono" dir="ltr">
              {angle}
            </span>
          </div>
          {/* اسلایدر دقیق‌تر به‌عنوان گزینهٔ دوم (اختیاری — کنترل ظریف) */}
          <input
            type="range"
            min={0}
            max={360}
            value={angleNum}
            onChange={(e) => {
              const val = `${e.target.value}deg`;
              emit(val, stops);
            }}
            className="w-full h-1 accent-teal-500 cursor-pointer"
            dir="ltr"
          />
        </div>

        {/* Add stop button */}
        {stops.length < 8 && (
          <button
            onClick={addStop}
            className="shrink-0 p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 cursor-pointer"
            title="افزودن رنگ"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
