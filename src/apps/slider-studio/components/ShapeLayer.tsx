// ============================================================
// ShapeLayer — renders a geometric `shape` layer.
//
// The fill (backgroundGradient / backgroundColor) is painted on
// an inner clipped div. The outline uses the double-clip trick:
// a slightly enlarged shape painted with the border color sits
// behind the fill, so the outline follows the clip-path exactly
// (a regular CSS border would be clipped away by the polygon).
// ============================================================
import type { Layer, ShapeType } from '@/src/shared-types/slider-studio';
import { SHAPE_CLIP_PATHS } from '../constants/shapes';

interface ShapeLayerProps {
  layer: Layer;
  /** Multiplier applied to the border width when the canvas is scaled. */
  scaleFactor?: number;
}

export default function ShapeLayer({ layer, scaleFactor = 1 }: ShapeLayerProps) {
  const shape: ShapeType = layer.shape ?? 'circle';
  const clip = SHAPE_CLIP_PATHS[shape] ?? SHAPE_CLIP_PATHS.circle;
  const bw = Math.max(0, (layer.borderWidth ?? 0) * scaleFactor);
  const borderColor =
    layer.borderColor && layer.borderColor !== 'transparent' ? layer.borderColor : null;
  const fill = layer.backgroundGradient || layer.backgroundColor || 'transparent';
  const fillOpacity = (layer.backgroundOpacity ?? 100) / 100;

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
