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
  star: 'polygon(50% 0%, 63% 38%, 100% 38%, 69% 61%, 81% 100%, 50% 75%, 19% 100%, 31% 61%, 0% 38%, 37% 38%)',
  heart: 'polygon(50% 30%, 61% 12%, 75% 8%, 92% 14%, 100% 30%, 97% 48%, 87% 63%, 50% 100%, 13% 63%, 3% 48%, 0% 30%, 8% 14%, 25% 8%, 39% 12%)',
  parallelogram: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
  trapezoid: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
  cross: 'polygon(20% 0%, 80% 0%, 80% 20%, 100% 20%, 100% 80%, 80% 80%, 80% 100%, 20% 100%, 20% 80%, 0% 80%, 0% 20%, 20% 20%)',
  arrowRight: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)',
  arrowLeft: 'polygon(40% 0%, 40% 20%, 100% 20%, 100% 80%, 40% 80%, 40% 100%, 0% 50%)',
  arrowUp: 'polygon(20% 40%, 0% 40%, 50% 0%, 100% 40%, 80% 40%, 80% 100%, 20% 100%)',
  arrowDown: 'polygon(20% 0%, 80% 0%, 80% 60%, 100% 60%, 50% 100%, 0% 60%, 20% 60%)',
  semicircle: 'circle(50% at 50% 0%)',
  quarterCircle: 'circle(50% at 100% 100%)',
  burst: 'polygon(50% 0%, 59.3% 21.5%, 79.4% 9.5%, 74.3% 32.4%, 97.6% 34.5%, 80% 50%, 97.6% 65.5%, 74.3% 67.6%, 79.4% 90.5%, 59.3% 78.5%, 50% 100%, 40.7% 78.5%, 20.6% 90.5%, 25.7% 67.6%, 2.4% 65.5%, 20% 50%, 2.4% 34.5%, 25.7% 32.4%, 20.6% 9.5%, 40.7% 21.5%)',
  blob: 'polygon(15% 20%, 30% 5%, 55% 0%, 80% 10%, 100% 30%, 95% 60%, 85% 85%, 60% 100%, 35% 95%, 10% 80%, 0% 55%, 5% 30%)',
  chevronRight: 'polygon(75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 0%)',
  chevronLeft: 'polygon(25% 0%, 100% 0%, 75% 50%, 100% 100%, 25% 100%, 0% 50%)',
  chevronUp: 'polygon(0% 75%, 50% 0%, 100% 75%, 75% 75%, 50% 25%, 25% 75%)',
  chevronDown: 'polygon(0% 25%, 25% 25%, 50% 75%, 75% 25%, 100% 25%, 50% 100%)',
  cloud: 'polygon(22% 78%, 8% 78%, 4% 64%, 12% 56%, 8% 42%, 20% 30%, 34% 28%, 42% 16%, 58% 16%, 66% 28%, 80% 26%, 94% 36%, 100% 52%, 94% 62%, 100% 70%, 88% 78%)',
  lightningBolt: 'polygon(52% 0%, 8% 58%, 40% 58%, 30% 100%, 92% 38%, 58% 38%)',
  plus: 'polygon(38% 0%, 62% 0%, 62% 38%, 100% 38%, 100% 62%, 62% 62%, 62% 100%, 38% 100%, 38% 62%, 0% 62%, 0% 38%, 38% 38%)',
  minus: 'polygon(0% 42%, 100% 42%, 100% 58%, 0% 58%)',
  multiply: 'polygon(39% 0%, 61% 0%, 100% 39%, 100% 61%, 61% 100%, 39% 100%, 0% 61%, 0% 39%)',
  speechBubble: 'polygon(6% 0%, 94% 0%, 100% 6%, 100% 70%, 52% 70%, 42% 88%, 36% 70%, 0% 70%, 0% 6%)',
  thoughtBubble: 'circle(50% 45% at 56% 40%)',
  smiley: 'circle(46% at 50% 50%)',
  notAllowed: 'circle(46% at 50% 50%)',
  divide: 'circle(11% at 50% 26%)',
  equals: 'inset(30% 0% 30% 0%)',
};

/** Shapes rendered with inline SVG (holes / internal details).
 *  Function receives (fill, stroke, strokeWidth) and returns SVG markup. */
export const SHAPE_SVG_TEMPLATES: Partial<Record<ShapeType, (fill: string, stroke: string, strokeWidth: number) => string>> = {
  smiley: (f, s, sw) => {
    const d = s !== 'transparent' ? s : '#1e293b';
    return (
      `<circle cx="50" cy="50" r="46" fill="${f}"${sw > 0 ? ` stroke="${s}" stroke-width="${sw}"` : ''}/>` +
      `<circle cx="30" cy="38" r="6.5" fill="${d}"/>` +
      `<circle cx="70" cy="38" r="6.5" fill="${d}"/>` +
      `<path d="M26 62 Q50 84 74 62" fill="none" stroke="${d}" stroke-width="7" stroke-linecap="round"/>`
    );
  },
  notAllowed: (f, s, sw) => {
    const bar = s !== 'transparent' ? s : 'rgba(255,255,255,0.95)';
    return (
      `<circle cx="50" cy="50" r="46" fill="${f}"${sw > 0 ? ` stroke="${s}" stroke-width="${sw}"` : ''}/>` +
      `<path d="M29.8 24.2 L75.8 70.2 L70.2 75.8 L24.2 29.8 Z" fill="${bar}"/>`
    );
  },
  thoughtBubble: (f, s, sw) => {
    const o = sw > 0 ? ` stroke="${s}" stroke-width="${sw}"` : '';
    return (
      `<circle cx="55" cy="42" r="34" fill="${f}"${o}/>` +
      `<circle cx="14" cy="82" r="5" fill="${f}"/>` +
      `<circle cx="27" cy="86" r="8" fill="${f}"/>` +
      `<circle cx="41" cy="86" r="11" fill="${f}"/>`
    );
  },
  divide: (f, s, sw) => {
    const o = sw > 0 ? ` stroke="${s}" stroke-width="${sw}"` : '';
    return (
      `<circle cx="50" cy="26" r="12" fill="${f}"${o}/>` +
      `<rect x="14" y="44" width="72" height="14" rx="7" fill="${f}"${o}/>`
    );
  },
  equals: (f, s, sw) => {
    const o = sw > 0 ? ` stroke="${s}" stroke-width="${sw}"` : '';
    return (
      `<rect x="14" y="28" width="72" height="14" rx="7" fill="${f}"${o}/>` +
      `<rect x="14" y="58" width="72" height="14" rx="7" fill="${f}"${o}/>`
    );
  },
};

/** Shapes that use the inline-SVG templates above. */
export const SHAPE_SVG_TYPES: ShapeType[] = ['smiley', 'notAllowed', 'thoughtBubble', 'divide', 'equals'];

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
  cloud: 'ابر (Cloud)',
  lightningBolt: 'صاعقه (Lightning)',
  plus: 'جمع (Plus)',
  minus: 'منفی (Minus)',
  multiply: 'ضرب (Multiply)',
  speechBubble: 'حباب گفتگو (Speech Bubble)',
  thoughtBubble: 'حباب فکر (Thought Bubble)',
  smiley: 'چهره خندان (Smiley)',
  notAllowed: 'ممنوع (Not Allowed)',
  divide: 'تقسیم (Divide)',
  equals: 'مساوی (Equals)',
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
  'cloud',
  'lightningBolt',
  'plus',
  'minus',
  'multiply',
  'speechBubble',
  'thoughtBubble',
  'smiley',
  'notAllowed',
  'divide',
  'equals',
];
