// ============================================================
// Shape presets — اشکال قابل افزودن در Slider Studio
// Each shape is a CSS clip-path so the same geometry renders
// identically in the editor canvas, live preview and the public
// site (no SVG dependency).
// ============================================================
import type { ShapeType } from '@/src/shared-types/slider-studio';

/** CSS clip-path for every shape (percentages — scale with the layer box). */
export const SHAPE_CLIP_PATHS: Record<ShapeType, string> = {
  rectangle: 'inset(0% 0% 0% 0%)',
  circle: 'circle(50% at 50% 50%)',
  ellipse: 'ellipse(50% 35% at 50% 50%)',
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  hexagon: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
  octagon: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  heart: 'polygon(50% 30%, 61% 12%, 75% 8%, 100% 13%, 100% 40%, 91% 56%, 50% 100%, 9% 56%, 0% 40%, 0% 13%, 25% 8%, 39% 12%)',
  parallelogram: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
  trapezoid: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
  cross: 'polygon(20% 0%, 80% 0%, 80% 20%, 100% 20%, 100% 80%, 80% 80%, 80% 100%, 20% 100%, 20% 80%, 0% 80%, 0% 20%, 20% 20%)',
  arrowRight: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
  arrowLeft: 'polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%)',
  arrowUp: 'polygon(20% 40%, 0% 40%, 50% 0%, 100% 40%, 80% 40%, 80% 100%, 20% 100%)',
  arrowDown: 'polygon(20% 0%, 80% 0%, 80% 60%, 100% 60%, 50% 100%, 0% 60%, 20% 60%)',
  semicircle: 'circle(50% at 50% 0%)',
  quarterCircle: 'circle(50% at 100% 100%)',
  burst: 'polygon(50% 0%, 57% 25%, 84% 7%, 77% 33%, 100% 50%, 77% 67%, 84% 93%, 57% 75%, 50% 100%, 43% 75%, 16% 93%, 23% 67%, 0% 50%, 23% 33%, 16% 7%, 43% 25%)',
  blob: 'polygon(15% 20%, 30% 5%, 55% 0%, 80% 10%, 100% 30%, 95% 60%, 85% 85%, 60% 100%, 35% 95%, 10% 80%, 0% 55%, 5% 30%)',
  chevronRight: 'polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)',
  chevronLeft: 'polygon(25% 0%, 100% 0%, 75% 50%, 100% 100%, 25% 100%, 0% 50%)',
  chevronUp: 'polygon(0% 75%, 50% 0%, 100% 75%, 75% 75%, 50% 25%, 25% 75%)',
  chevronDown: 'polygon(0% 25%, 25% 25%, 50% 75%, 75% 25%, 100% 25%, 50% 100%)',
};

/** Persian + English label for each shape. */
export const SHAPE_LABELS: Record<ShapeType, string> = {
  rectangle: 'مربع (Rectangle)',
  circle: 'دایره (Circle)',
  ellipse: 'بیضی (Ellipse)',
  triangle: 'مثلث (Triangle)',
  diamond: 'لوزی (Diamond)',
  pentagon: 'پنج‌ضلعی (Pentagon)',
  hexagon: 'شش‌ضلعی (Hexagon)',
  octagon: 'هشت‌ضلعی (Octagon)',
  star: 'ستاره (Star)',
  heart: 'قلب (Heart)',
  parallelogram: 'متوازی‌الاضلاع (Parallelogram)',
  trapezoid: 'ذوزنقه (Trapezoid)',
  cross: 'بعلاوه (Cross)',
  arrowRight: 'فلش راست (Arrow Right)',
  arrowLeft: 'فلش چپ (Arrow Left)',
  arrowUp: 'فلش بالا (Arrow Up)',
  arrowDown: 'فلش پایین (Arrow Down)',
  semicircle: 'نیم‌دایره (Semicircle)',
  quarterCircle: 'ربع دایره (Quarter Circle)',
  burst: 'انفجار (Burst)',
  blob: 'ابر (Blob)',
  chevronRight: 'شورون راست (Chevron Right)',
  chevronLeft: 'شورون چپ (Chevron Left)',
  chevronUp: 'شورون بالا (Chevron Up)',
  chevronDown: 'شورون پایین (Chevron Down)',
};

/** Ordered list of shapes for pickers. */
export const SHAPE_TYPES: ShapeType[] = [
  'rectangle',
  'circle',
  'ellipse',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'octagon',
  'star',
  'heart',
  'parallelogram',
  'trapezoid',
  'cross',
  'arrowRight',
  'arrowLeft',
  'arrowUp',
  'arrowDown',
  'semicircle',
  'quarterCircle',
  'burst',
  'blob',
  'chevronRight',
  'chevronLeft',
  'chevronUp',
  'chevronDown',
];
