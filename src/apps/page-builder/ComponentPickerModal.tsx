import React, { useState } from 'react';
import { WidgetType } from './builderTypes';
import {
  X,
  Type,
  Layout,
  Image as ImageIcon,
  MousePointer,
  Video,
  Sparkles,
  ChevronDown,
  Minus,
  Bell,
  Newspaper,
  Award,
  Users,
  FileText,
  Grid,
  Search,
  Layers,
  Columns,
  Rows,
  Images,
  Gauge,
  Compass,
  MapPin,
  Phone,
  Code2,
  Share2,
  BadgeDollarSign,
  Quote,
  Info,
  StickyNote,
  MousePointerClick,
  PanelTop,
  PanelBottom,
  MessageSquareQuote,
  FolderTree,
  Building2,
  CalendarDays,
  UsersRound,
  BookOpen,
  FileSpreadsheet,
  Navigation,
  ClipboardList
} from 'lucide-react';

interface ComponentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWidget: (widgetType: WidgetType) => void;
  onSelectSectionPreset: (preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => void;
  targetInsertIndex?: number | null;
  targetColumnId?: string | null;
}

export const ComponentPickerModal: React.FC<ComponentPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectWidget,
  onSelectSectionPreset,
  targetInsertIndex,
  targetColumnId
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'widgets' | 'smart' | 'sections'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const widgetItems: { type: WidgetType; category: 'basic' | 'smart'; name: string; desc: string; icon: any; badge?: string }[] = [
    { type: 'heading', category: 'basic', name: 'عنوان تیتر (Heading)', desc: 'تیتر اصلی با تایپوگرافی برجسته و سایزهای متنوع', icon: Type },
    { type: 'text', category: 'basic', name: 'بلوک متنی (Text Block)', desc: 'پاراگراف‌ها و توضیحات متنی غنی', icon: Layout },
    { type: 'image', category: 'basic', name: 'تصویر (Image Banner)', desc: 'تصویر تک یا بنر با نسبت تصویر دلخواه', icon: ImageIcon },
    { type: 'button', category: 'basic', name: 'دکمه فراخوان (CTA Button)', desc: 'دکمه تعاملی جهت اتصال به لینک یا فرایند', icon: MousePointer },
    { type: 'video', category: 'basic', name: 'ویدیو پلیر (Video Player)', desc: 'پخش‌کننده ویدیوهای آپارات یا فایل مستقیم', icon: Video },
    { type: 'stat-card', category: 'basic', name: 'کارت آمار و آیکون (Stat Card)', desc: 'نمایش آمار و شاخص‌های کلیدی بصری', icon: Sparkles },
    { type: 'accordion', category: 'basic', name: 'آکاردئون FAQ', desc: 'لیست باز و بسته شونده سوالات متداول', icon: ChevronDown },
    { type: 'divider', category: 'basic', name: 'خط جداکننده (Divider)', desc: 'تفکیک‌کننده بخش‌های مختلف با استایل تمیز', icon: Minus },

    // NEW BASIC BLOCKS — بلوک‌های جدید
    { type: 'richtext', category: 'basic', name: 'بلاک متن غنی (WYSIWYG)', desc: 'ویرایشگر متن با HTML — تیتر، پاراگراف، لینک و آیکون', icon: StickyNote, badge: 'ویرایشگر پیشرفته' },
    { type: 'icon-box', category: 'basic', name: 'کارت اطلاعاتی (Info Card)', desc: 'آیکون + عنوان + توضیح برای ویژگی‌ها و خدمات', icon: MousePointerClick },
    { type: 'vertical-container', category: 'basic', name: 'دربرگیرنده عمودی (Vertical Container)', desc: 'چیدمان عمودی چند زیربلوک در یک قاب', icon: Rows },
    { type: 'horizontal-container', category: 'basic', name: 'دربرگیرنده افقی (Horizontal Container)', desc: 'چیدمان افقی چند زیربلوک در یک ردیف', icon: Columns },
    { type: 'image-slider', category: 'basic', name: 'اسلایدر تصویر (Image Slider)', desc: 'چرخش خودکار تصاویر با دکمه‌های پیمایش و نقاط', icon: Images, badge: 'کاروسل' },
    { type: 'counter', category: 'basic', name: 'شمارنده (Counter)', desc: 'عدد متحرک با پیشوند/پسوند برای آمار', icon: Gauge },
    { type: 'navigator', category: 'basic', name: 'پیمایشگر محتوا (Navigator)', desc: 'فهرست نوشته‌ها، برگه‌ها و پست‌های تایپ دلخواه', icon: Compass, badge: 'لیست' },
    { type: 'nav-menu', category: 'basic', name: 'نوار راهبری (Nav Menu)', desc: 'برند + لینک‌های منو برای نوار بالای صفحه', icon: PanelTop },
    { type: 'child-pages', category: 'basic', name: 'لیست زیرصفحه‌ها (Child Pages)', desc: 'فهرست خودکار زیرصفحه‌های این صفحه — مناسب صفحه‌های والد', icon: FolderTree, badge: 'سلسله‌مراتب' },
    { type: 'map', category: 'basic', name: 'نقشه (Map)', desc: 'جاسازی نقشه گوگل با نشانگر و نشانی', icon: MapPin, badge: 'جاسازی' },
    { type: 'contact-info', category: 'basic', name: 'اطلاعات تماس (Contact Info)', desc: 'تلفن، ایمیل، نشانی و ساعات کاری', icon: Phone },
    { type: 'custom-html', category: 'basic', name: 'HTML دلخواه (Custom HTML)', desc: 'کد HTML/اسکریپت دلخواه شما', icon: Code2, badge: 'کد' },
    { type: 'social-links', category: 'basic', name: 'لینک‌های اجتماعی (Social Links)', desc: 'آیکون‌های تلگرام، اینستاگرام، لینکدین و...', icon: Share2 },
    { type: 'share-buttons', category: 'basic', name: 'دکمه‌های اشتراک‌گذاری (Share)', desc: 'اشتراک صفحه در تلگرام، واتساپ و...', icon: Share2 },
    { type: 'pricing-table', category: 'basic', name: 'جدول قیمت (Pricing Table)', desc: 'پلن‌ها و تعرفه‌ها با پلن پیشنهادی', icon: BadgeDollarSign, badge: 'پلن‌ها' },
    { type: 'testimonial', category: 'basic', name: 'نظر کاربر (Testimonial)', desc: 'گفت‌قول و تجربه کاربران با امضا', icon: MessageSquareQuote },
    { type: 'callout', category: 'basic', name: 'یادآوری/هشدار (Callout)', desc: 'جعبه نکته یا هشدار رنگی', icon: Info },
    { type: 'icon', category: 'basic', name: 'آیکون (Icon)', desc: 'نمایش تک آیکون تزئینی', icon: Sparkles },
    { type: 'tabs', category: 'basic', name: 'تب‌ها (Tabs)', desc: 'محتوای چندگانه با سوئیچ بین چند تب — هر تب یک بخش کامل و مستقل', icon: Layers, badge: 'تعاملی' },
    { type: 'interactive-map', category: 'basic', name: 'نقشه تعاملی (Interactive Map)', desc: 'سوئیچ بین چند نقشه/مکان آماده با دکمه‌های انتخاب', icon: Navigation, badge: 'تعاملی' },
    { type: 'excel-table', category: 'basic', name: 'جدول اکسل (Excel Table)', desc: 'آپلود فایل اکسل و نمایش آن به‌صورت جدول قابل جستجو', icon: FileSpreadsheet, badge: 'آپلود' },

    // Smart items — فقط ماژول‌هایی که در این پروژه فعال‌اند (اخبار/گالری/فرم‌ساز)
    { type: 'news-feed', category: 'smart', name: 'خوراک داینامیک اخبار', desc: 'اتصال زنده به ماژول اخبار با گرید و اسلایدر', icon: Newspaper, badge: 'ماژول اخبار' },
    { type: 'image-gallery', category: 'smart', name: 'آلبوم و گالری تصاویری', desc: 'گالری شبکه‌ای رسانه‌ها و رویدادها', icon: ImageIcon, badge: 'گالری' },
    { type: 'file-manager', category: 'smart', name: 'مخزن اسناد و فرم‌ها', desc: 'لیست دانلود فایل‌ها و آیین‌نامه‌ها', icon: FileText, badge: 'مدیریت فایل' },
    { type: 'form', category: 'smart', name: 'جاسازی فرم (فرم‌ساز)', desc: 'نمایش و پرکردن یک فرم منتشرشده از فرم‌ساز، مستقیماً داخل این صفحه', icon: ClipboardList, badge: 'ماژول فرم‌ساز' }
  ];

  const sectionPresets: { preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4'; name: string; desc: string; columns: string }[] = [
    { preset: '1col', name: 'تک ستونه (1 Column)', desc: 'یک ستون کامل ۱۲ از ۱۲ برای محتوای اصلی', columns: '12' },
    { preset: '2col', name: 'دو ستونه مساوی (50 / 50)', desc: 'دو ستون برابر ۶ از ۱۲', columns: '6 + 6' },
    { preset: '3col', name: 'سه ستونه مساوی (33 / 33 / 33)', desc: 'سه ستون برابر ۴ از ۱۲', columns: '4 + 4 + 4' },
    { preset: '4col', name: 'چهار ستونه مساوی (25 / 25 / 25 / 25)', desc: 'چهار ستون برابر ۳ از ۱۲', columns: '3 + 3 + 3 + 3' },
    { preset: '7-5', name: 'دو ستونه نامساوی (70% / 30%)', desc: 'ستون اصلی ۷ و ستون کناری ۵', columns: '7 + 5' },
    { preset: '8-4', name: 'دو ستونه نامساوی (66% / 33%)', desc: 'ستون محتوایی ۸ و نوار ابزار ۴', columns: '8 + 4' }
  ];

  const filteredWidgets = widgetItems.filter(w => {
    const matchesSearch = w.name.includes(searchQuery) || w.desc.includes(searchQuery);
    if (!matchesSearch) return false;
    if (activeCategory === 'widgets') return w.category === 'basic';
    if (activeCategory === 'smart') return w.category === 'smart';
    if (activeCategory === 'sections') return false;
    return true;
  });

  const showSections = activeCategory === 'all' || activeCategory === 'sections';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in rtl text-right">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Grid className="w-5 h-5 text-teal-500" />
              <span>انتخاب و افزودن بلوک یا کامپوننت جدید</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {targetInsertIndex !== undefined && targetInsertIndex !== null
                ? `در حال افزودن بلوک به موقعیت شماره ${targetInsertIndex + 1} صفحه`
                : targetColumnId
                ? 'در حال افزودن ویجت مستقیم به ستون انتخاب‌شده'
                : 'کامپوننت یا چیدمان جدید را انتخاب نمایید'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در نام یا کارکرد کامپوننت‌ها..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeCategory === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              همه اجزا
            </button>
            <button
              onClick={() => setActiveCategory('widgets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeCategory === 'widgets'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ویجت‌های عمومی
            </button>
            <button
              onClick={() => setActiveCategory('smart')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeCategory === 'smart'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              ماژول‌های هوشمند
            </button>
            <button
              onClick={() => setActiveCategory('sections')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeCategory === 'sections'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              چیدمان ستونی سکشن
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
          {/* Section 1: Section Column Layout Presets */}
          {showSections && !searchQuery && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Columns className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">الگوهای ساختاری ستون‌ها (Section Layouts)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sectionPresets.map((sec) => (
                  <button
                    key={sec.preset}
                    onClick={() => {
                      onSelectSectionPreset(sec.preset);
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all text-right flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {sec.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          {sec.columns}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        {sec.desc}
                      </p>
                    </div>

                    {/* Visual Layout Columns Graphic */}
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 flex gap-1">
                      {sec.preset === '1col' && <div className="h-full w-full bg-indigo-500/30 rounded-xs" />}
                      {sec.preset === '2col' && (
                        <>
                          <div className="h-full w-1/2 bg-indigo-500/30 rounded-xs" />
                          <div className="h-full w-1/2 bg-indigo-500/30 rounded-xs" />
                        </>
                      )}
                      {sec.preset === '3col' && (
                        <>
                          <div className="h-full w-1/3 bg-indigo-500/30 rounded-xs" />
                          <div className="h-full w-1/3 bg-indigo-500/30 rounded-xs" />
                          <div className="h-full w-1/3 bg-indigo-500/30 rounded-xs" />
                        </>
                      )}
                      {sec.preset === '4col' && (
                        <>
                          <div className="h-full w-1/4 bg-indigo-500/30 rounded-xs" />
                          <div className="h-full w-1/4 bg-indigo-500/30 rounded-xs" />
                          <div className="h-full w-1/4 bg-indigo-500/30 rounded-xs" />
                          <div className="h-full w-1/4 bg-indigo-500/30 rounded-xs" />
                        </>
                      )}
                      {sec.preset === '7-5' && (
                        <>
                          <div className="h-full w-[58%] bg-indigo-500/30 rounded-xs" />
                          <div className="h-full w-[42%] bg-indigo-500/30 rounded-xs" />
                        </>
                      )}
                      {sec.preset === '8-4' && (
                        <>
                          <div className="h-full w-[66%] bg-indigo-500/30 rounded-xs" />
                          <div className="h-full w-[34%] bg-indigo-500/30 rounded-xs" />
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Smart Connected Modules */}
          {(activeCategory === 'all' || activeCategory === 'smart') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                    ماژول‌ها و ویجت‌های هوشمند (Smart Connected Modules)
                  </h4>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-bold border border-amber-500/20">
                  اتصال خودکار به پایگاه داده
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredWidgets.filter(w => w.category === 'smart').map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        onSelectWidget(item.type);
                        onClose();
                      }}
                      className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-teal-500/5 to-white dark:to-slate-900 border border-amber-500/20 dark:border-amber-500/30 hover:border-amber-500 hover:shadow-lg transition-all text-right flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0 border border-amber-500/20">
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[9px] font-bold border border-teal-500/20 shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Basic Content Widgets Grid */}
          {(activeCategory === 'all' || activeCategory === 'widgets') && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-teal-500" />
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  ویجت‌های عمومی و بصری (Basic UI Widgets)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredWidgets.filter(w => w.category === 'basic').map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => {
                        onSelectWidget(item.type);
                        onClose();
                      }}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-teal-500 hover:shadow-md transition-all text-right flex items-start gap-3 group cursor-pointer"
                    >
                      <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-colors shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 truncate">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
