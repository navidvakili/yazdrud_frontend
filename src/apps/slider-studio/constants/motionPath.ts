// ── Motion Path Presets ────────────────────────────────────────────
// Predefined path templates for the slider-studio motion-path feature.
// Points are LAYER-RELATIVE (offset-path anchors at the element's own
// top-left corner, so adding layer.x/layer.y would double-shift).

export type MotionPathPresetMode = 'line' | 'arc' | 'turn' | 'shape' | 'loop' | 'figure8';

export const MOTION_PATH_PRESETS: { mode: MotionPathPresetMode; label: string; hint: string }[] = [
  { mode: 'line', label: 'خط', hint: 'یک خط مستقیم' },
  { mode: 'arc', label: 'قوس', hint: 'کمان نیم‌دایره' },
  { mode: 'turn', label: 'پیچ', hint: 'چرخش L شکل' },
  { mode: 'shape', label: 'مثلث', hint: 'مثلث بسته' },
  { mode: 'loop', label: 'دایره', hint: 'حلقه دایره‌ای' },
  { mode: 'figure8', label: 'حلقه ∞', hint: 'مسیر عدد ۸' },
];

/** Generate preset points centered on the layer, relative to its top-left. */
export function buildMotionPathPreset(
  mode: MotionPathPresetMode,
  w: number,
  h: number
): { x: number; y: number }[] {
  const cx = w / 2;
  const cy = h / 2;
  const extent = Math.max(160, Math.max(w, h) * 0.85);
  const pts: { x: number; y: number }[] = [];

  switch (mode) {
    case 'line':
      return [
        { x: Math.round(cx - extent), y: Math.round(cy) },
        { x: Math.round(cx + extent), y: Math.round(cy) },
      ];
    case 'arc': {
      const N = 16;
      for (let i = 0; i <= N; i++) {
        const a = Math.PI - (Math.PI * i) / N; // 180° → 0°
        pts.push({
          x: Math.round(cx + Math.cos(a) * extent),
          y: Math.round(cy - Math.sin(a) * extent * 0.7),
        });
      }
      return pts;
    }
    case 'turn':
      return [
        { x: Math.round(cx - extent), y: Math.round(cy) },
        { x: Math.round(cx), y: Math.round(cy) },
        { x: Math.round(cx + extent), y: Math.round(cy) },
        { x: Math.round(cx + extent), y: Math.round(cy + extent) },
      ];
    case 'shape': {
      // Equilateral triangle, closed (last point = first point)
      const N = 3;
      for (let i = 0; i <= N; i++) {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / N;
        pts.push({
          x: Math.round(cx + Math.cos(a) * extent),
          y: Math.round(cy + Math.sin(a) * extent),
        });
      }
      return pts;
    }
    case 'loop': {
      // Closed circle
      const N = 24;
      for (let i = 0; i <= N; i++) {
        const a = (Math.PI * 2 * i) / N;
        pts.push({
          x: Math.round(cx + Math.cos(a) * extent),
          y: Math.round(cy + Math.sin(a) * extent * 0.7),
        });
      }
      return pts;
    }
    case 'figure8': {
      // Lemniscate of Bernoulli (∞), closed
      const N = 24;
      for (let i = 0; i <= N; i++) {
        const a = (Math.PI * 2 * i) / N;
        const s = Math.sin(a);
        const denom = 1 + s * s;
        pts.push({
          x: Math.round(cx + (extent * Math.cos(a)) / denom),
          y: Math.round(cy + (extent * s * Math.cos(a)) / denom),
        });
      }
      return pts;
    }
  }
}
