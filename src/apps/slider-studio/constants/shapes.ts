// ============================================================
// Shape presets — اشکال قابل افزودن در Slider Studio
// Every shape is an inline-SVG template inside a shared 0..100
// viewBox, so the same geometry renders identically in the
// editor canvas, live preview, the code export and the public
// site. Symmetric shapes use preserveAspectRatio="xMidYMid
// meet" (see getShapePreserveAspect) so they never distort on
// non-square layers; the rest stretch to fill the box. CSS
// clip-paths are kept as a legacy reference (SHAPE_CLIP_PATHS)
// but are no longer used.
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
  blob: 'polygon(30% 0%, 70% 0%, 100% 20%, 100% 70%, 80% 100%, 20% 100%, 0% 70%, 0% 20%)',
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

/** SVG stroke attribute. vector-effect keeps the border uniform (screen
 *  pixels) on every side, even when the viewBox is stretched non-uniformly. */
const STROKE = (color: string, width: number) =>
  width > 0 ? ` vector-effect="non-scaling-stroke" stroke="${color}" stroke-width="${width}"` : '';

/** Shapes that must keep their natural proportions. They are rendered with
 *  preserveAspectRatio="xMidYMid meet" (centered, letterboxed) so circles
 *  stay round and icons stay undistorted on any layer size. Everything
 *  else uses "none" and stretches to fill the layer box. */
export const SYMMETRIC_SHAPES = new Set<ShapeType>([
  'circle', 'ellipse', 'triangle', 'diamond', 'pentagon',
  'hexagon', 'octagon', 'star', 'heart', 'semicircle',
  'quarterCircle', 'burst', 'blob', 'smiley', 'notAllowed',
  'thoughtBubble', 'divide', 'equals', 'minus', 'plus', 'cross', 'multiply',
]);

/** preserveAspectRatio value for a shape — symmetric shapes must not
 *  stretch, everything else fills the layer box. */
export function getShapePreserveAspect(shape: ShapeType): string {
  return SYMMETRIC_SHAPES.has(shape) ? 'xMidYMid meet' : 'none';
}

/** Inline-SVG template for EVERY shape — receives (fill, stroke, strokeWidth)
 *  and returns SVG markup in a shared 0..100 coordinate system. The shape
 *  geometry is a direct port of the legacy clip-path percentages, so shapes
 *  render at any layer size without distortion. */
export const SHAPE_SVG_TEMPLATES: Record<ShapeType, (fill: string, stroke: string, strokeWidth: number) => string> = {
  rectangle: (f, s, sw) => `<rect x="0" y="0" width="100" height="100" fill="${f}"${STROKE(s, sw)}/>`,
  circle: (f, s, sw) => `<circle cx="50" cy="50" r="50" fill="${f}"${STROKE(s, sw)}/>`,
  ellipse: (f, s, sw) => `<ellipse cx="50" cy="50" rx="50" ry="35" fill="${f}"${STROKE(s, sw)}/>`,
  triangle: (f, s, sw) => `<polygon points="50,0 100,100 0,100" fill="${f}"${STROKE(s, sw)}/>`,
  diamond: (f, s, sw) => `<polygon points="50,0 100,50 50,100 0,50" fill="${f}"${STROKE(s, sw)}/>`,
  pentagon: (f, s, sw) => `<polygon points="50,0 100,38 82,100 18,100 0,38" fill="${f}"${STROKE(s, sw)}/>`,
  hexagon: (f, s, sw) => `<polygon points="25,5 75,5 100,50 75,95 25,95 0,50" fill="${f}"${STROKE(s, sw)}/>`,
  octagon: (f, s, sw) => `<polygon points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30" fill="${f}"${STROKE(s, sw)}/>`,
  star: (f, s, sw) => `<polygon points="50,0 63,38 100,38 69,61 81,100 50,75 19,100 31,61 0,38 37,38" fill="${f}"${STROKE(s, sw)}/>`,
  heart: (f, s, sw) => `<path d="M50 90 C20 64 0 48 0 26 C0 10 12 0 26 0 C37 0 47 8 50 18 C53 8 63 0 74 0 C88 0 100 10 100 26 C100 48 80 64 50 90 Z" fill="${f}"${STROKE(s, sw)}/>`,
  parallelogram: (f, s, sw) => `<polygon points="25,0 100,0 75,100 0,100" fill="${f}"${STROKE(s, sw)}/>`,
  trapezoid: (f, s, sw) => `<polygon points="20,0 80,0 100,100 0,100" fill="${f}"${STROKE(s, sw)}/>`,
  cross: (f, s, sw) => `<path fill-rule="evenodd" d="M20 0 L80 0 L80 20 L100 20 L100 80 L80 80 L80 100 L20 100 L20 80 L0 80 L0 20 L20 20 Z" fill="${f}"${STROKE(s, sw)}/>`,
  arrowRight: (f, s, sw) => `<polygon points="0,20 60,20 60,0 100,50 60,100 60,80 0,80" fill="${f}"${STROKE(s, sw)}/>`,
  arrowLeft: (f, s, sw) => `<polygon points="40,0 40,20 100,20 100,80 40,80 40,100 0,50" fill="${f}"${STROKE(s, sw)}/>`,
  arrowUp: (f, s, sw) => `<polygon points="20,40 0,40 50,0 100,40 80,40 80,100 20,100" fill="${f}"${STROKE(s, sw)}/>`,
  arrowDown: (f, s, sw) => `<polygon points="20,0 80,0 80,60 100,60 50,100 0,60 20,60" fill="${f}"${STROKE(s, sw)}/>`,
  semicircle: (f, s, sw) => `<path d="M0 50 A50 50 0 0 1 100 50 Z" fill="${f}"${STROKE(s, sw)}/>`,
  quarterCircle: (f, s, sw) => `<path d="M100 100 L0 100 A100 100 0 0 1 100 0 Z" fill="${f}"${STROKE(s, sw)}/>`,
  burst: (f, s, sw) => `<polygon points="50,0 59.3,21.5 79.4,9.5 74.3,32.4 97.6,34.5 80,50 97.6,65.5 74.3,67.6 79.4,90.5 59.3,78.5 50,100 40.7,78.5 20.6,90.5 25.7,67.6 2.4,65.5 20,50 2.4,34.5 25.7,32.4 20.6,9.5 40.7,21.5" fill="${f}"${STROKE(s, sw)}/>`,
  blob: (f, s, sw) => `<polygon points="30,0 70,0 100,20 100,70 80,100 20,100 0,70 0,20" fill="${f}"${STROKE(s, sw)}/>`,
  chevronRight: (f, s, sw) => `<polygon points="75,0 100,50 75,100 0,100 25,50 0,0" fill="${f}"${STROKE(s, sw)}/>`,
  chevronLeft: (f, s, sw) => `<polygon points="25,0 100,0 75,50 100,100 25,100 0,50" fill="${f}"${STROKE(s, sw)}/>`,
  chevronUp: (f, s, sw) => `<polygon points="0,75 50,0 100,75 75,75 50,25 25,75" fill="${f}"${STROKE(s, sw)}/>`,
  chevronDown: (f, s, sw) => `<polygon points="0,25 25,25 50,75 75,25 100,25 50,100" fill="${f}"${STROKE(s, sw)}/>`,
  cloud: (f, s, sw) => {
    const o = STROKE(s, sw);
    return `<path d="
      M 15 78 
      C 5 78, 0 70, 4 60 
      C 6 54, 12 50, 18 50 
      C 14 42, 20 30, 32 28 
      C 40 26, 48 30, 52 36 
      C 56 26, 68 20, 78 26 
      C 88 32, 94 44, 90 54 
      C 96 56, 100 62, 96 70 
      C 92 78, 84 82, 76 82 
      L 24 82 
      C 18 82, 14 80, 15 78 Z" 
      fill="${f}"${o}
    />`;
  },
  lightningBolt: (f, s, sw) => `<polygon points="52,0 8,58 40,58 30,100 92,38 58,38" fill="${f}"${STROKE(s, sw)}/>`,
  plus: (f, s, sw) => `<path fill-rule="evenodd" d="M38 0 L62 0 L62 38 L100 38 L100 62 L62 62 L62 100 L38 100 L38 62 L0 62 L0 38 L38 38 Z" fill="${f}"${STROKE(s, sw)}/>`,
  minus: (f, s, sw) => `<rect x="0" y="42" width="100" height="16" fill="${f}"${STROKE(s, sw)}/>`,
  multiply: (f, s, sw) => {
    const o = STROKE(s, sw);
    return (
      `<rect x="38" y="0" width="24" height="100" transform="rotate(45 50 50)" fill="${f}"${o}/>` +
      `<rect x="38" y="0" width="24" height="100" transform="rotate(-45 50 50)" fill="${f}"${o}/>`
    );
  },
  speechBubble: (f, s, sw) => `<path d="M10 4 L90 4 A6 6 0 0 1 96 10 L96 56 A6 6 0 0 1 90 62 L58 62 L38 84 L44 62 L10 62 A6 6 0 0 1 4 56 L4 10 A6 6 0 0 1 10 4 Z" fill="${f}"${STROKE(s, sw)}/>`,
  thoughtBubble: (f, s, sw) => {
    const o = STROKE(s, sw);
    return (
      `<path d="M50 8 C60 4 76 6 82 18 C92 17 98 28 94 38 C100 44 98 56 90 58 C90 66 80 72 68 70 C60 76 40 76 32 70 C22 72 12 66 12 58 C4 56 2 46 6 40 C4 30 10 20 20 20 C24 8 40 6 50 8 Z" fill="${f}"${o}/>` +
      `<circle cx="14" cy="78" r="4.5" fill="${f}"/>` +
      `<circle cx="26" cy="84" r="7" fill="${f}"/>` +
      `<circle cx="40" cy="86" r="9.5" fill="${f}"/>`
    );
  },
  smiley: (f, s, sw) => {
    const d = s !== 'transparent' ? s : '#1e293b';
    return (
      `<circle cx="50" cy="50" r="46" fill="${f}"${STROKE(s, sw)}/>` +
      `<circle cx="30" cy="38" r="6.5" fill="${d}"/>` +
      `<circle cx="70" cy="38" r="6.5" fill="${d}"/>` +
      `<path d="M26 62 Q50 84 74 62" fill="none" stroke="${d}" stroke-width="7" stroke-linecap="round"/>`
    );
  },
  notAllowed: (f, s, sw) => {
    const o = STROKE(s, sw);
    const barColor = s !== 'transparent' ? s : '#dc2626';
    const borderWidth = sw > 0 ? sw : 4;

    return `
      <!-- دایره پس‌زمینه -->
      <circle cx="50" cy="50" r="46" fill="${f}"${o}/>
      <!-- دایره داخلی برای ایجاد حاشیه -->
      <circle cx="50" cy="50" r="42" fill="none" 
              stroke="${barColor}" stroke-width="2" 
              stroke-opacity="0.3"/>
      <!-- خط مورب اصلی -->
      <line x1="18" y1="18" x2="82" y2="82" 
            stroke="${barColor}" stroke-width="10" 
            stroke-linecap="round"/>
      <!-- سایه خط برای عمق بیشتر -->
      <line x1="18" y1="18" x2="82" y2="82" 
            stroke="rgba(0,0,0,0.1)" stroke-width="10" 
            stroke-linecap="round" transform="translate(0, 2)"/>
    `;
  },
  divide: (f, s, sw) => {
    const o = STROKE(s, sw);
    return (
      `<circle cx="50" cy="24" r="11" fill="${f}"${o}/>` +
      `<rect x="14" y="42" width="72" height="16" rx="8" fill="${f}"${o}/>` +
      `<circle cx="50" cy="76" r="11" fill="${f}"${o}/>`
    );
  },
  equals: (f, s, sw) => {
    const o = STROKE(s, sw);
    return (
      `<rect x="14" y="28" width="72" height="14" rx="7" fill="${f}"${o}/>` +
      `<rect x="14" y="58" width="72" height="14" rx="7" fill="${f}"${o}/>`
    );
  },
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
  'arrowRight',
  'arrowLeft',
  'arrowUp',
  'arrowDown',
  'semicircle',
  'quarterCircle',
  'burst',
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

/** Every shape now has an SVG template — kept for backward compatibility
 *  with renderers that switch on this list. 'blob' and 'cross' were removed
 *  from the picker (blob duplicated the cloud; cross duplicated 'plus');
 *  their templates stay as fallbacks for already-saved layers. */
export const SHAPE_SVG_TYPES: ShapeType[] = SHAPE_TYPES;
