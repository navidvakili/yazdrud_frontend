// ============================================================
// Slider Studio & Visual Editor Types
// ============================================================

export type LayerType = 'text' | 'image' | 'button' | 'video' | 'svg' | 'shape' | 'group' | 'customHtml';

export type AnimationEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic';

export type AnimationPreset =
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'zoomIn'
  | 'zoomOut'
  | 'rotateIn'
  | 'bounceIn'
  | 'typewriter'
  | 'none';

export type InteractionTrigger = 'click' | 'hover' | 'scroll' | 'slideLoad';

export type InteractionActionType =
  | 'link'
  | 'jumpSlide'
  | 'toggleAnimation'
  | 'playVideo'
  | 'openModal'
  | 'changeStyle';

export interface LayerInteraction {
  id: string;
  trigger: InteractionTrigger;
  action: InteractionActionType;
  targetUrl?: string;
  targetSlideId?: string;
  targetLayerId?: string;
  customJs?: string;
}

export type BreakpointWidth = '1240' | '1024' | '900' | '768' | '576' | '380';

export interface LayerResponsiveOverride {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  hidden?: boolean;
}

export interface LayerAnimation {
  inPreset: AnimationPreset;
  inDuration: number;
  inDelay: number;
  inEasing: AnimationEasing;
  outPreset: AnimationPreset;
  outDuration: number;
  outDelay: number;
  hoverEffect?: 'scale' | 'lift' | 'glow' | 'tilt' | 'none';
  parallaxDepth?: number;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  groupId?: string;
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fontStyle: 'normal' | 'italic';
  textAlign: 'right' | 'center' | 'left' | 'justify';
  color: string;
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundOpacity?: number; // 0-100, default 100
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  padding: string;
  shadow: string;
  animation: LayerAnimation;
  interactions: LayerInteraction[];
  responsiveOverrides?: Record<BreakpointWidth, LayerResponsiveOverride>;
  dynamicBinding?: string;
}

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image' | 'video' | 'particles';
  color: string;
  gradient: string;
  imageUrl?: string;
  videoUrl?: string;
  particlesPreset?: 'stars' | 'bubbles' | 'snow' | 'geometric' | 'waves';
}

export interface Slide {
  id: string;
  title: string;
  duration: number;
  background: SlideBackground;
  layers: Layer[];
  transition: 'fade' | 'slideLeft' | 'slideRight' | 'zoomOut' | '3dCube';
  interactions?: LayerInteraction[];
}

export interface SliderProject {
  id: string;
  title: string;
  description: string;
  width: number;
  height: number;
  autoPlay: boolean;
  loop: boolean;
  scrollSnap: boolean;
  addonParticles: boolean;
  addonWave: boolean;
  addonTextMorph: boolean;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}
