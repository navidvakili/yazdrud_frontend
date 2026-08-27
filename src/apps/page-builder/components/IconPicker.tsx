import { useState } from 'react';
import type { SVGProps, ComponentType } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Share2,
  MessageCircle,
  Link2,
  Type,
  Columns,
  Rows,
  Images,
  Gauge,
  Compass,
  Code2,
  Quote,
  Info,
  Send,
  Globe,
  Hash,
  Heart,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Users,
  User,
  BadgeDollarSign,
  Search,
  Ban,
  ExternalLink,
  UsersRound,
  BookOpen,
  Award,
  LockOpen,
  Lock,
  GraduationCap,
  ChartNoAxesColumn,
  Monitor,
  FileCheck,
  BookmarkCheck,
  Layers,
  Box,
  ShieldCheck,
  UserCheck,
  FileText,
  CircleHelp,
  Linkedin,
  Instagram,
  Youtube,
  type LucideIcon,
} from 'lucide-react';
import {
  EitaaIcon,
  BaleIcon,
  CafeBazaarIcon,
  EnamadIcon,
  GapIcon,
  SappIcon,
  ShetabIcon,
  AdobeAcrobatReaderIcon,
  AdobeAfterEffectsIcon,
  AdobeAuditionIcon,
  AdobeIcon,
  AparatIcon,
} from './BrandIcons';

/** آیکون‌های قابل انتخاب — منبع واحد برای صفحه‌ساز و کارت اطلاعاتی */
export const ICON_CHOICES: string[] = [
  'sparkles', 'map', 'phone', 'mail', 'share', 'chat', 'link', 'type',
  'columns', 'rows', 'images', 'gauge', 'compass', 'code', 'quote',
  'info', 'send', 'globe', 'hash', 'heart', 'clock', 'check', 'arrow', 'user', 'users', 'dollar',
  'external', 'students', 'book', 'award', 'unlock', 'lock', 'grad',
  'stat', 'monitor', 'file-check', 'bookmark-check', 'layers', 'box',
  'shield-check', 'user-check', 'file-text', 'circle-question-mark',
  'linkedin', 'instagram', 'x', 'youtube', 'telegram',
  'aparat', 'bale', 'eitaa', 'cafebazaar', 'enamad', 'gap', 'sapp',
  'shetab', 'adobeacrobatreader', 'adobeaftereffects', 'adobeaudition', 'adobe'
];

/** نگاشت نام آیکون به کامپوننت — برای پیش‌نمایش انتخابگر (و مصرف‌کنندگان دیگر مثل آمارهای معرفی صفحه اصلی) */
export const ICON_COMPONENTS: Record<string, LucideIcon | ComponentType<SVGProps<SVGSVGElement>>> = {
  sparkles: Sparkles,
  map: MapPin,
  phone: Phone,
  mail: Mail,
  share: Share2,
  chat: MessageCircle,
  link: Link2,
  type: Type,
  columns: Columns,
  rows: Rows,
  images: Images,
  gauge: Gauge,
  compass: Compass,
  code: Code2,
  quote: Quote,
  info: Info,
  send: Send,
  globe: Globe,
  hash: Hash,
  heart: Heart,
  clock: Clock,
  check: CheckCircle2,
  arrow: ArrowLeft,
  user: User,
  users: Users,
  dollar: BadgeDollarSign,
  external: ExternalLink,
  students: UsersRound,
  book: BookOpen,
  award: Award,
  unlock: LockOpen,
  lock: Lock,
  grad: GraduationCap,
  stat: ChartNoAxesColumn,
  monitor: Monitor,
  'file-check': FileCheck,
  'bookmark-check': BookmarkCheck,
  layers: Layers,
  box: Box,
  'shield-check': ShieldCheck,
  'user-check': UserCheck,
  'file-text': FileText,
  'circle-question-mark': CircleHelp,
  linkedin: Linkedin,
  instagram: Instagram,
  x: X,
  youtube: Youtube,
  telegram: Send,
  aparat: AparatIcon,
  bale: BaleIcon,
  eitaa: EitaaIcon,
  cafebazaar: CafeBazaarIcon,
  enamad: EnamadIcon,
  gap: GapIcon,
  sapp: SappIcon,
  shetab: ShetabIcon,
  adobeacrobatreader: AdobeAcrobatReaderIcon,
  adobeaftereffects: AdobeAfterEffectsIcon,
  adobeaudition: AdobeAuditionIcon,
  adobe: AdobeIcon,
};

interface IconPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  title?: string;
  /** نام آیکون فعلی برای هایلایت */
  value?: string;
}

/** انتخابگر آیکون — شبکه‌ای از آیکون‌های lucide با جستجو */
export const IconPicker: React.FC<IconPickerProps> = ({ open, onClose, onSelect, title = 'انتخاب آیکون', value }) => {
  const [query, setQuery] = useState('');

  if (!open) return null;

  const filtered = ICON_CHOICES.filter((n) => n.includes(query.trim().toLowerCase()) || !query.trim());

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[420px] max-w-[92vw] max-h-[70vh] bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span>{title}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              dir="rtl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی آیکون..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-6 gap-2">
            {filtered.map((name) => {
              const Icon = ICON_COMPONENTS[name] || Sparkles;
              const active = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelect(name)}
                  title={name}
                  className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-500/15 border-teal-500/50 text-teal-600 dark:text-teal-400'
                      : 'bg-slate-50 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[8px] text-slate-400 truncate w-full text-center">{name}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">آیکونی یافت نشد</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => onSelect('')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            حذف آیکون
          </button>
          <span className="text-[10px] text-slate-400">{filtered.length} آیکون</span>
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
