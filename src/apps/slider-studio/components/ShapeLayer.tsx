// ============================================================
// ShapeLayer — renders a geometric `shape` layer.
//
// Most shapes are clip-path based: the fill (backgroundGradient /
// backgroundColor) is painted on an inner clipped div, and the
// outline uses the double-clip trick (a slightly enlarged shape
// painted with the border color sits behind the fill). Complex
// shapes with holes/internal details (smiley, not-allowed, ...)
// are rendered with inline SVG instead.
// ============================================================
import type { Layer, ShapeType } from '@/src/shared-types/slider-studio';
import { SHAPE_CLIP_PATHS, SHAPE_SVG_TEMPLATES, SHAPE_SVG_TYPES } from '../constants/shapes';

interface ShapeLayerProps {
  layer: Layer;
  /** Multiplier applied to the border width when the canvas is scaled. */
  scaleFactor?: number;
}

/** Flatten a gradient to its first color so SVG fills stay valid. */
function shapeFlatFill(layer: Layer): string {
  if (layer.backgroundColor && layer.backgroundColor !== 'transparent') return layer.backgroundColor;
  if (layer.backgroundGradient) {
    const m = layer.backgroundGradient.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
    if (m && m.length) return m[0];
  }
  return '#38bdf8';
}

export default function ShapeLayer({ layer, scaleFactor = 1 }: ShapeLayerProps) {
  const shape: ShapeType = layer.shape ?? 'circle';
  const clip = SHAPE_CLIP_PATHS[shape] ?? SHAPE_CLIP_PATHS.circle;
  const bw = Math.max(0, (layer.borderWidth ?? 0) * scaleFactor);
  const borderColor =
    layer.borderColor && layer.borderColor !== 'transparent' ? layer.borderColor : null;
  const fill = layer.backgroundGradient || layer.backgroundColor || 'transparent';
  const fillOpacity = (layer.backgroundOpacity ?? 100) / 100;

  // ── SVG-based complex shapes ─────────────────────────────
  if (SHAPE_SVG_TYPES.includes(shape)) {
    const svg = SHAPE_SVG_TEMPLATES[shape](
      shapeFlatFill(layer),
      borderColor ?? 'transparent',
      bw
    );
    return (
      <div className="w-full h-full" style={{ position: 'relative', pointerEvents: 'none' }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full absolute inset-0"
          style={{ opacity: fillOpacity }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ position: 'relative', pointerEvents: 'none' }}>
      {/* Outline — border-color shape clipped to the full layer box */}
      {bw > 0 && borderColor && (
        <div style={{ position: 'absolute', inset: 0, background: borderColor, clipPath: clip }} />
      )}
      {/* Fill — slightly inset so the outline ring stays visible inside the box */}
      <div
        style={{
          position: 'absolute',
          inset: bw,
          background: fill,
          opacity: fillOpacity,
          clipPath: clip,
        }}
      />
    </div>
  );
}
