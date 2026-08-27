import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Globe,
  Layers,
  Sparkles,
  Shield,
  Calendar,
  Image as ImageIcon,
  Check,
  Search,
  ExternalLink,
  Code,
  Tag,
  Eye,
  Sliders,
  Type,
  Newspaper,
  FolderTree,
  FileText,
  Megaphone,
  BookOpen,
  Info,
  LayoutGrid,
  Loader2,
  MapPin,
  Phone,
  Printer
} from 'lucide-react';
import IconPicker from './components/IconPicker';
import {
  NavigationItem,
  ItemType,
  InternalSource,
  CmsSourceScope,
  CmsSourceItem,
  DisplayMode,
  BadgeType,
  AccessRole,
  NavigationItemSettings,
  MenuLocation,
  FooterItemType
} from './types';

interface MenuItemEditorModalProps {
  item: NavigationItem;
  menuLocation?: MenuLocation;
  /** منابع CMS واقعی سایت اصلی که از وب‌سرویس بک‌اند دریافت شده‌اند */
  cmsSources: CmsSourceItem[];
  /** وضعیت بارگذاری منابع از وب‌سرویس */
  sourcesLoading?: boolean;
  onSave: (updatedItem: NavigationItem) => void;
  onClose: () => void;
}

const BADGE_TYPES: BadgeType[] = ['New', 'Hot', 'Featured', 'Custom'];
const ACCESS_ROLES: AccessRole[] = [
  'Public User',
  'Authenticated User',
  'Student',
  'Employee',
  'Administrator',
  'Custom Roles'
];

export const MenuItemEditorModal: React.FC<MenuItemEditorModalProps> = ({
  item,
  menuLocation,
  cmsSources,
  sourcesLoading = false,
  onSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'display' | 'badge_style' | 'access_schedule'>('general');

  // Form Fields
  const [title, setTitle] = useState(item.title);
  const [titleEn, setTitleEn] = useState(item.titleEn || '');
  const [itemType, setItemType] = useState<ItemType>(item.itemType);
  const [internalSource, setInternalSource] = useState<InternalSource | 'ALL'>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'all' | CmsSourceScope>('all');
  const [selectedSource, setSelectedSource] = useState<CmsSourceItem | null>(null);
  const [targetUrl, setTargetUrl] = useState(item.targetUrl);
  const [target, setTarget] = useState<'_self' | '_blank'>(item.target);
  const [rel, setRel] = useState<'nofollow' | 'noopener' | 'noreferrer' | undefined>(item.rel);
  const [displayType, setDisplayType] = useState<DisplayMode>(item.displayType);

  // Settings
  const [icon, setIcon] = useState(item.settings.icon || item.settings.buttonIcon || 'link');
  const [description, setDescription] = useState(item.settings.description || '');
  const [cssClass, setCssClass] = useState(item.settings.cssClass || '');
  const [customStyle, setCustomStyle] = useState(item.settings.customStyle || '');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'general' | 'footerButton'>('general');
  const [footerItemType, setFooterItemType] = useState<FooterItemType>(item.settings.footerItemType || 'text');
  const [footerText, setFooterText] = useState(item.settings.description || item.title || '');
  const [footerButtonText, setFooterButtonText] = useState(item.settings.buttonText || '');
  const [footerButtonUrl, setFooterButtonUrl] = useState(item.settings.buttonUrl || '');
  const [footerButtonIcon, setFooterButtonIcon] = useState(item.settings.buttonIcon || item.settings.icon || 'link');
  const [footerAddress, setFooterAddress] = useState(item.settings.address || '');
  const [footerPhone, setFooterPhone] = useState(item.settings.phone || '');
  const [footerFax, setFooterFax] = useState(item.settings.fax || '');
  const [footerImageUrl, setFooterImageUrl] = useState(item.settings.imageUrl || '');
  const [footerImageAlt, setFooterImageAlt] = useState(item.settings.imageAlt || '');

  // Badge
  const [badgeEnabled, setBadgeEnabled] = useState(item.settings.badge?.enabled || false);
  const [badgeText, setBadgeText] = useState(item.settings.badge?.text || 'جدید');
  const [badgeType, setBadgeType] = useState<BadgeType>(item.settings.badge?.type || 'New');

  // Access
  const [accessRules, setAccessRules] = useState<AccessRole[]>(
    item.settings.accessRules || ['Public User', 'Student', 'Employee', 'Administrator']
  );

  // Scheduling
  const [scheduleEnabled, setScheduleEnabled] = useState(item.settings.scheduling?.enabled || false);
  const [startDate, setStartDate] = useState(item.settings.scheduling?.startDate || '');
  const [endDate, setEndDate] = useState(item.settings.scheduling?.endDate || '');

  // Search filter for internal source items
  const [sourceSearch, setSourceSearch] = useState('');

  // منابع از وب‌سرویس (داده‌های واقعی سایت اصلی) دریافت می‌شوند — بدون اتصال مستقیم به سایت اصلی
  const filteredSources = cmsSources.filter(s => {
    const matchesSource = internalSource === 'ALL' || s.type === internalSource;
    const matchesScope = scopeFilter === 'all' || s.scope === scopeFilter;
    const matchesSearch =
      s.title.toLowerCase().includes(sourceSearch.toLowerCase()) ||
      (s.categoryPath && s.categoryPath.toLowerCase().includes(sourceSearch.toLowerCase()));
    return matchesSource && matchesScope && matchesSearch;
  });

  const handleSelectSourceItem = (source: CmsSourceItem) => {
    setSelectedSource(source);
    setTargetUrl(source.url);
    if (!title || title === 'آیتم جدید' || title === 'آیتم جدید منو') {
      setTitle(source.title);
    }
  };

  const handleIconSelect = (iconName: string) => {
    if (iconPickerTarget === 'footerButton') {
      setFooterButtonIcon(iconName || 'link');
      setIcon(iconName || icon || 'link');
    } else {
      setIcon(iconName || 'link');
    }
    setIconPickerOpen(false);
    setIconPickerTarget('general');
  };

  const toggleAccessRole = (role: AccessRole) => {
    if (accessRules.includes(role)) {
      setAccessRules(accessRules.filter(r => r !== role));
    } else {
      setAccessRules([...accessRules, role]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSettings: NavigationItemSettings = {
      ...item.settings,
      icon,
      description: menuLocation && menuLocation.includes('Footer') ? footerText : description,
      cssClass,
      customStyle,
      badge: badgeEnabled
        ? { enabled: true, text: badgeText, type: badgeType }
        : undefined,
      accessRules,
      scheduling: scheduleEnabled
        ? { enabled: true, startDate, endDate, status: 'active' }
        : undefined,
      footerItemType: menuLocation && menuLocation.includes('Footer') ? footerItemType : item.settings.footerItemType,
      address: menuLocation && menuLocation.includes('Footer') ? footerAddress : item.settings.address,
      phone: menuLocation && menuLocation.includes('Footer') ? footerPhone : item.settings.phone,
      fax: menuLocation && menuLocation.includes('Footer') ? footerFax : item.settings.fax,
      buttonText: menuLocation && menuLocation.includes('Footer') ? footerButtonText : item.settings.buttonText,
      buttonUrl: menuLocation && menuLocation.includes('Footer') ? footerButtonUrl : item.settings.buttonUrl,
      buttonIcon: menuLocation && menuLocation.includes('Footer') ? footerButtonIcon : item.settings.buttonIcon,
      imageUrl: menuLocation && menuLocation.includes('Footer') ? footerImageUrl : item.settings.imageUrl,
      imageAlt: menuLocation && menuLocation.includes('Footer') ? footerImageAlt : item.settings.imageAlt,
      mapButton: menuLocation && menuLocation.includes('Footer') && footerButtonUrl
        ? { text: footerButtonText || title, icon: footerButtonIcon || 'link', action: 'open_url', url: footerButtonUrl }
        : item.settings.mapButton,
    };

    const updatedItem: NavigationItem = {
      ...item,
      title,
      titleEn,
      itemType,
      internalSource: itemType === 'internal'
        ? (internalSource === 'ALL' ? 'CMS Pages' : internalSource)
        : undefined,
      targetUrl,
      target,
      rel,
      displayType,
      settings: updatedSettings
    };

    onSave(updatedItem);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                تنظیمات آیتم منو: {title || 'آیتم منو'}
              </h3>
              <p className="text-xs text-slate-500">
                تعیین لینک، منبع CMS، نوع نمایش (ساده، دراپ‌داون، مگامنو) و سطح دسترسی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-900/30 text-xs font-bold">
          {[
            { id: 'general', label: 'اطلاعات اصلی و لینک', icon: LinkIcon },
            { id: 'display', label: 'حالت نمایش (مگامنو/دراپ‌داون)', icon: Layers },
            { id: 'badge_style', label: 'آیکون، بج و ظاهر', icon: Sparkles },
            { id: 'access_schedule', label: 'دسترسی و زمان‌بندی', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: General & Link */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    عنوان آیتم (فارسی) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="مثال: دانشکده‌ها"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    عنوان انگلیسی (English Title)
                  </label>
                  <input
                    type="text"
                    value={titleEn}
                    onChange={e => setTitleEn(e.target.value)}
                    placeholder="e.g. Faculties"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs dir-ltr text-left"
                  />
                </div>
              </div>

              {/* Item Type Selector */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200">
                  نوع منبع لینک (Link Source Type):
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'internal', label: 'لینک داخلی CMS', desc: 'صفحات، اخبار، فرم‌ها' },
                    { id: 'external', label: 'لینک خارجی', desc: 'وبسایت‌های بیرونی' },
                    { id: 'custom', label: 'مسیر سفارشی (Route)', desc: 'آدرس مستقیم URL' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setItemType(t.id as ItemType)}
                      className={`p-3 rounded-2xl border text-right transition-all ${
                        itemType === t.id
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="text-xs">{t.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Source Picker */}
              {itemType === 'internal' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FolderTree className="w-4 h-4 text-teal-600" />
                      منبع و نوع محتوای CMS:
                    </label>

                    {/* Source Module Dropdown */}
                    <select
                      value={internalSource}
                      onChange={e => setInternalSource(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                    >
                      <option value="ALL">✨ تمامی منابع CMS</option>
                      <option value="CMS Pages">📄 صفحات اصلی CMS</option>
                      <option value="Page Builder">🧩 صفحه‌ساز (Page Builder)</option>
                      <option value="News">📰 اخبار (خبر منفرد)</option>
                      <option value="News Categories">📂 دسته‌بندی اخبار (گروه خبری)</option>
                      <option value="Announcements">📣 اطلاعیه‌ها (اطلاعیه منفرد)</option>
                      <option value="Announcement Categories">📂 دسته‌بندی اطلاعیه‌ها</option>
                      <option value="Articles">📚 مقالات (مقاله منفرد)</option>
                      <option value="Article Categories">📂 دسته‌بندی مقالات</option>
                      <option value="Events">📅 رویدادها</option>
                      <option value="Services">🛠️ خدمات الکترونیک</option>
                      <option value="Downloads">📥 آیین‌نامه‌ها و دانلود</option>
                      <option value="Forms">📝 فرم‌ها</option>
                      <option value="Categories">📁 سایر دسته‌بندی‌ها</option>
                      <option value="Tags">🏷️ تگ‌ها و برچسب‌ها</option>
                    </select>
                  </div>

                  {/* Scope Granularity Filter Tabs */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                    {[
                      { id: 'all', label: 'همه موارد', icon: LayoutGrid },
                      { id: 'single_item', label: '📄 خبر/محتوای منفرد', icon: Newspaper },
                      { id: 'category_group', label: '📁 دسته‌بندی و گروه اخبار', icon: FolderTree },
                      { id: 'page_builder', label: '🧩 صفحه‌ساز', icon: Sparkles },
                      { id: 'tag', label: '🏷️ تگ و برچسب', icon: Tag }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setScopeFilter(tab.id as any)}
                        className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                          scopeFilter === tab.id
                            ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search box for sources */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="جستجو در عنوان خبر، دسته‌بندی، اطلاعیه یا صفحه‌ساز..."
                      value={sourceSearch}
                      onChange={e => setSourceSearch(e.target.value)}
                      className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>

                  {/* Source List with Badges & Metadata — از وب‌سرویس */}
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {sourcesLoading ? (
                      <p className="p-4 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        در حال دریافت منابع از وب‌سرویس...
                      </p>
                    ) : filteredSources.length === 0 ? (
                      <p className="p-4 text-center text-slate-400 text-[11px]">
                        هیچ محتوایی مطابق با فیلتر انتخابی از وب‌سرویس یافت نشد.
                      </p>
                    ) : (
                      filteredSources.map(s => {
                        const isSelected = targetUrl === s.url;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSelectSourceItem(s)}
                            className={`w-full text-right p-2.5 rounded-xl flex items-center justify-between text-xs transition-all border ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {/* Scope Badge */}
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : s.scope === 'category_group'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                    : s.scope === 'page_builder'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : s.scope === 'tag'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                              >
                                {s.scope === 'category_group'
                                  ? '📁 دسته‌بندی/گروه'
                                  : s.scope === 'page_builder'
                                  ? '🧩 صفحه‌ساز'
                                  : s.scope === 'tag'
                                  ? '🏷️ تگ'
                                  : '📄 محتوای منفرد'}
                              </span>

                              <span>{s.title}</span>

                              {s.itemCount !== undefined && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                                    isSelected
                                      ? 'bg-white/30 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  ({s.itemCount} مورد)
                                </span>
                              )}
                            </div>

                            <span
                              className={`text-[10px] font-mono dir-ltr ${
                                isSelected ? 'opacity-90' : 'text-slate-400'
                              }`}
                            >
                              {s.url}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Selected Source Overview Card */}
                  {selectedSource && (
                    <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-teal-600" />
                          منبع CMS انتخاب شده:
                        </span>
                        <span className="px-2 py-0.5 bg-teal-600 text-white rounded-md text-[10px]">
                          {selectedSource.scope === 'category_group'
                            ? 'لینک به گروه و دسته‌بندی اخبار/اطلاعیه'
                            : selectedSource.scope === 'page_builder'
                            ? 'لینک به صفحه طراحی شده با صفحه‌ساز'
                            : selectedSource.scope === 'tag'
                            ? 'لینک به برچسب موضوعی'
                            : 'لینک مستقیم به خبر یا اطلاعیه خاص'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {selectedSource.title}
                      </div>
                      {selectedSource.categoryPath && (
                        <div className="text-[10px] text-teal-700 dark:text-teal-300">
                          مسیر دسته‌بندی: {selectedSource.categoryPath}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Target URL field */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  آدرس مقصد (Target URL) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={targetUrl}
                    onChange={e => setTargetUrl(e.target.value)}
                    placeholder="/about-us یا https://example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono dir-ltr text-left"
                  />
                </div>
              </div>

              {/* Target Window & Rel Attribute */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    نحوه باز شدن لینک
                  </label>
                  <select
                    value={target}
                    onChange={e => setTarget(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="_self">در همین پنجره (Open Same Window)</option>
                    <option value="_blank">در پنجره جدید (Open New Window)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    صفت Rel (SEO Security)
                  </label>
                  <select
                    value={rel || ''}
                    onChange={e => setRel((e.target.value || undefined) as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="">پیش‌فرض (خالی)</option>
                    <option value="nofollow">nofollow</option>
                    <option value="noopener">noopener</option>
                    <option value="noreferrer">noreferrer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Display Mode (Mega Menu vs Dropdown) */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <label className="block font-bold text-slate-800 dark:text-slate-200">
                حالت نمایش زیرمنو (Display Mode):
              </label>

              <div className="grid grid-cols-3 gap-4">
                {[
                  {
                    id: 'simple',
                    title: 'منوی ساده تک‌سطحی',
                    desc: 'نمایش به صورت لینک معمولی بدون زیرمنو'
                  },
                  {
                    id: 'dropdown',
                    title: 'منوی کشویی (Dropdown)',
                    desc: 'زیرمنوی چندسطحی با افکت انیمیشن'
                  },
                  {
                    id: 'mega_menu',
                    title: 'مگا منو (Mega Menu)',
                    desc: 'شبکه‌بندی چندستونه با تصویر، بنر و بلاک‌های لینک'
                  }
                ].map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setDisplayType(mode.id as DisplayMode)}
                    className={`p-4 rounded-2xl border text-right transition-all space-y-2 ${
                      displayType === mode.id
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 font-bold shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs">{mode.title}</span>
                      {displayType === mode.id && <Check className="w-4 h-4 text-teal-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 font-normal leading-relaxed">
                      {mode.desc}
                    </p>
                  </button>
                ))}
              </div>

              {displayType === 'mega_menu' && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>مگا منو فعال شد!</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    پس از ذخیره این فرم، می‌توانید با کلیک روی دکمه «طراحی مگا منو» در کنار این آیتم، تعداد ستون‌ها، تصویر شاخص، بنرهای تبلیغاتی و بلاک‌های HTML را به صورت بصری ویرایش کنید.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Badge & Styling */}
          {activeTab === 'badge_style' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    انتخاب آیکون
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIconPickerTarget('general');
                      setIconPickerOpen(true);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-right"
                  >
                    <span>{icon || 'انتخاب آیکون'}</span>
                    <Sparkles className="w-4 h-4 text-teal-600" />
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    کلاس CSS سفارشی (CSS Class)
                  </label>
                  <input
                    type="text"
                    value={cssClass}
                    onChange={e => setCssClass(e.target.value)}
                    placeholder="custom-menu-item highlight-btn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono dir-ltr text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  توضیحات کوتاه (زیرعنوان آیتم در منو)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="توضیح مختصر درباره این بخش..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {menuLocation && menuLocation.includes('Footer') && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-4">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-extrabold">
                    <Sparkles className="w-4 h-4" />
                    <span>ساخت محتوای فوتر به‌صورت دستی</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">نوع محتوا</label>
                    <select
                      value={footerItemType}
                      onChange={e => setFooterItemType(e.target.value as FooterItemType)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    >
                      <option value="text">متن با آیکون</option>
                      <option value="address">آدرس / اطلاعات تماس</option>
                      <option value="button">دکمه / لینک</option>
                      <option value="image">تصویر</option>
                      <option value="social">شبکه اجتماعی</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">متن / توضیح</label>
                    <textarea
                      value={footerText}
                      onChange={e => setFooterText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">آیکون فوتر</label>
                      <button
                        type="button"
                        onClick={() => {
                          setIconPickerTarget('footerButton');
                          setIconPickerOpen(true);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      >
                        <span>{footerButtonIcon || icon || 'انتخاب آیکون'}</span>
                        <Sparkles className="w-4 h-4 text-teal-600" />
                      </button>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">متن دکمه</label>
                      <input
                        value={footerButtonText}
                        onChange={e => setFooterButtonText(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">لینک دکمه</label>
                    <input
                      value={footerButtonUrl}
                      onChange={e => setFooterButtonUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono dir-ltr text-left"
                    />
                  </div>

                  {(footerItemType === 'address' || footerItemType === 'button') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500" /> آدرس</label>
                        <textarea value={footerAddress} onChange={e => setFooterAddress(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-500" /> تلفن</label>
                        <input value={footerPhone} onChange={e => setFooterPhone(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                      </div>
                    </div>
                  )}

                  {footerItemType === 'address' && (
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5"><Printer className="w-3.5 h-3.5 text-slate-500" /> فکس</label>
                      <input value={footerFax} onChange={e => setFooterFax(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                    </div>
                  )}

                  {(footerItemType === 'image' || footerItemType === 'social') && (
                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">URL تصویر</label>
                        <input value={footerImageUrl} onChange={e => setFooterImageUrl(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono dir-ltr text-left" />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">متن جایگزین تصویر</label>
                        <input value={footerImageAlt} onChange={e => setFooterImageAlt(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Badge Configuration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={badgeEnabled}
                    onChange={e => setBadgeEnabled(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>نمایش بج (Badge) روی آیتم منو</span>
                </label>

                {badgeEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        متن بج
                      </label>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={e => setBadgeText(e.target.value)}
                        placeholder="جدید، داغ، ویژه"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        نوع و رنگ بج
                      </label>
                      <select
                        value={badgeType}
                        onChange={e => setBadgeType(e.target.value as BadgeType)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                      >
                        <option value="New">New (جدید - آبی/سبز)</option>
                        <option value="Hot">Hot (داغ - قرمز)</option>
                        <option value="Featured">Featured (ویژه - طلایی)</option>
                        <option value="Custom">Custom (سفارشی)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Access Control & Scheduling */}
          {activeTab === 'access_schedule' && (
            <div className="space-y-6">
              {/* Access Control Roles */}
              <div className="space-y-3">
                <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-600" />
                  محدودیت نمایش بر اساس نقش کاربران (Visibility Rules):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ACCESS_ROLES.map(role => {
                    const isChecked = accessRules.includes(role);
                    return (
                      <label
                        key={role}
                        onClick={() => toggleAccessRole(role)}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${
                          isChecked
                            ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 text-teal-900 dark:text-teal-200 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-teal-600"
                        />
                        <span>{role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Scheduling Dates */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={e => setScheduleEnabled(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>زمان‌بندی انتشار و فعال‌سازی خودکار</span>
                </label>

                {scheduleEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تاریخ و زمان شروع نمایش
                      </label>
                      <input
                        type="text"
                        placeholder="۱۴۰۵/۰۶/۰۱ - ۰۸:۰۰"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        تاریخ انقضا و پایان نمایش
                      </label>
                      <input
                        type="text"
                        placeholder="۱۴۰۵/۰۶/۳۰ - ۲۴:۰۰"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> ذخیره تغییرات آیتم
            </button>
          </div>
        </form>
      </div>
      <IconPicker
        open={iconPickerOpen}
        onClose={() => {
          setIconPickerOpen(false);
          setIconPickerTarget('general');
        }}
        onSelect={handleIconSelect}
        title="انتخاب آیکون"
        value={iconPickerTarget === 'footerButton' ? (footerButtonIcon || icon || '') : (icon || '')}
      />
    </div>
  );
};
