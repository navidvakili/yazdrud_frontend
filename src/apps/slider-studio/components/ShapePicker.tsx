// ============================================================
// ShapePicker — grid of shape buttons used in the add-layer
// menu and the Inspector. Each button previews the shape with
// the same clip-path used at render time.
// ============================================================
import type { ShapeType } from '@/src/shared-types/slider-studio';
import { SHAPE_CLIP_PATHS, SHAPE_LABELS, SHAPE_TYPES } from '../constants/shapes';

interface ShapePickerProps {
  value?: ShapeType;
  onChange: (shape: ShapeType) => void;
  columns?: number;
  compact?: boolean;
}

export default function ShapePicker({ value, onChange, columns = 6, compact = false }: ShapePickerProps) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {SHAPE_TYPES.map(shape => {
        const label = SHAPE_LABELS[shape];
        const faLabel = label.split(' (')[0];
        return (
          <button
            key={shape}
            type="button"
            onClick={() => onChange(shape)}
            title={label}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-colors cursor-pointer ${
              value === shape
                ? 'bg-teal-50 dark:bg-teal-500/20 border-teal-400 dark:border-teal-500/50'
                : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-500/40 hover:bg-teal-50/50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span
              className={`block bg-gradient-to-br from-teal-500 to-indigo-600 ${compact ? 'w-5 h-5' : 'w-7 h-7'}`}
              style={{ clipPath: SHAPE_CLIP_PATHS[shape] }}
            />
            <span className={`text-[9px] text-slate-600 dark:text-slate-300 leading-tight ${compact ? 'text-[8px]' : ''}`}>
              {faLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
