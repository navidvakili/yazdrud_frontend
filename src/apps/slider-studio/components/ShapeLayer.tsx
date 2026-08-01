// ============================================================
// ShapeLayer — renders a geometric `shape` layer.
//
// Every shape is rendered from an inline-SVG template in a
// shared 0..100 viewBox (preserveAspectRatio="none"), so the
// same geometry works at any layer size and the outline is a
// real SVG stroke (uniform via vector-effect).
// ============================================================
import type { Layer, ShapeType } from '@/src/shared-types/slider-studio';
import { SHAPE_SVG_TEMPLATES } from '../constants/shapes';

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
  const bw = Math.max(0, (layer.borderWidth ?? 0) * scaleFactor);
  const borderColor =
    layer.borderColor && layer.borderColor !== 'transparent' ? layer.borderColor : null;
  const fillOpacity = (layer.backgroundOpacity ?? 100) / 100;
  const template = SHAPE_SVG_TEMPLATES[shape] ?? SHAPE_SVG_TEMPLATES.circle;

  return (
    <div className="w-full h-full" style={{ position: 'relative', pointerEvents: 'none' }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full absolute inset-0"
        style={{ opacity: fillOpacity }}
        dangerouslySetInnerHTML={{
          __html: template(shapeFlatFill(layer), borderColor ?? 'transparent', bw),
        }}
      />
    </div>
  );
}
