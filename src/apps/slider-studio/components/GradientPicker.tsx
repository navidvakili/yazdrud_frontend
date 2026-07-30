import React, { useCallback, useMemo } from 'react';
import { Plus, Trash2, RotateCw } from 'lucide-react';

// ---- Types ----
interface ColorStop {
  color: string;
  position: number; // 0-100
}

interface GradientPickerProps {
  /** Current CSS gradient value (e.g. "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)") */
  value: string;
  /** Called with the new CSS gradient string */
  onChange: (cssGradient: string) => void;
}

// ---- Helpers ----

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';

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
      const posMatch = p.match(/(\S+)\s+([\d.]+)%/);
      if (posMatch) {
        return { color: posMatch[1], position: parseFloat(posMatch[2]) };
      }
      // fallback: no position → distribute evenly
      return { color: p, position: 0 };
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

/**
 * Build a CSS linear-gradient string from angle and stops.
 */
function buildGradient(angle: string, stops: ColorStop[]): string {
  const stopStr = stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ');
  return `linear-gradient(${angle}, ${stopStr})`;
}

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

  const addStop = useCallback(() => {
    if (stops.length >= 8) return; // reasonable limit
    // Insert between last two stops or at 100%
    const pos = stops.length > 1
      ? Math.min(100, stops[stops.length - 1].position + 10)
      : 100;
    const color = '#3b82f6';
    const next = [...stops, { color, position: Math.min(100, pos) }];
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

      {/* Color stops */}
      <div className="space-y-2 max-h-44 overflow-y-auto scrollbar-thin">
        {stops.map((stop, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* Color picker */}
            <input
              type="color"
              value={stop.color}
              onChange={(e) => handleStopColor(index, e.target.value)}
              className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 shrink-0"
            />
            {/* Hex text */}
            <input
              type="text"
              value={stop.color}
              onChange={(e) => handleStopColor(index, e.target.value)}
              className="w-24 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-[10px]"
            />
            {/* Position slider */}
            <input
              type="range"
              min={0}
              max={100}
              value={stop.position}
              onChange={(e) => handleStopPosition(index, parseInt(e.target.value))}
              className="flex-1 h-1 accent-teal-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 w-8 text-right font-mono">
              {stop.position}%
            </span>
            {/* Remove button */}
            {stops.length > 2 && (
              <button
                onClick={() => removeStop(index)}
                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg cursor-pointer shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Gradient direction / angle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-1">
          <RotateCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="range"
            min={0}
            max={360}
            value={angleNum}
            onChange={(e) => {
              const val = `${e.target.value}deg`;
              emit(val, stops);
            }}
            className="flex-1 h-1 accent-teal-500 cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 w-12 text-right font-mono">
            {angle}
          </span>
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
