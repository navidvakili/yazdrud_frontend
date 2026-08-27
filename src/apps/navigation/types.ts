export type MenuLocation = string;

export type ItemType = 'internal' | 'external' | 'custom';

export type InternalSource =
  | 'CMS Pages'
  | 'Page Builder'
  | 'News'
  | 'News Categories'
  | 'Announcements'
  | 'Announcement Categories'
  | 'Articles'
  | 'Article Categories'
  | 'Events'
  | 'Products'
  | 'Services'
  | 'Downloads'
  | 'Forms'
  | 'Surveys'
  | 'Galleries'
  | 'Custom Components'
  | 'Categories'
  | 'Tags';

export type CmsSourceScope = 'single_item' | 'category_group' | 'page_builder' | 'tag';

export type DisplayMode = 'simple' | 'dropdown' | 'mega_menu';

export type BadgeType = 'New' | 'Hot' | 'Featured' | 'Custom';

export type AccessRole =
  | 'Public User'
  | 'Authenticated User'
  | 'Student'
  | 'Employee'
  | 'Administrator'
  | 'Custom Roles';

export type MobileBehavior = 'Accordion Menu' | 'Hamburger Menu' | 'Slide Menu';

export interface BadgeConfig {
  enabled: boolean;
  text: string;
  type: BadgeType;
  color?: string; // e.g., 'bg-red-500', 'bg-amber-500'
}

export interface SchedulingConfig {
  enabled: boolean;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'inactive';
}

export type FooterItemType =
  | 'text'
  | 'address'
  | 'link'
  | 'social'
  | 'image'
  | 'button'
  | 'email'
  | 'certificate';

export interface FooterMapButton {
  text: string;
  icon: string;
  action: 'show_map' | 'open_url';
  url?: string;
}

export interface FooterSocialLink {
  id: string;
  label: string;
  url: string;
  icon: string;
  hoverColor?: string;
}

export interface NavigationItemSettings {
  icon?: string;
  svgIcon?: string;
  thumbnail?: string;
  hoverImage?: string;
  description?: string;
  cssClass?: string;
  customStyle?: string;
  badge?: BadgeConfig;
  accessRules: AccessRole[];
  scheduling?: SchedulingConfig;
  /** نوع آیتم فوتر — برای بلوک‌هایgeneral فوتر */
  footerItemType?: FooterItemType;
  address?: string;
  phone?: string;
  fax?: string;
  mapButton?: FooterMapButton;
  buttonText?: string;
  buttonUrl?: string;
  buttonIcon?: string;
  platform?: string;
  hoverColor?: string;
  imageUrl?: string;
  imageAlt?: string;
  emailAddress?: string;
  certificateType?: string;
  certificateImage?: string | null;
  socialLinks?: FooterSocialLink[];
}

export interface MegaMenuLinkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  badge?: string;
  description?: string;
}

export interface MegaMenuColumn {
  id: string;
  title: string;
  type: 'links' | 'image' | 'banner' | 'html' | 'content_widget';
  widthSpan: number; // 1 to 12
  links?: MegaMenuLinkItem[];
  imageUrl?: string;
  imageAlt?: string;
  imageLink?: string;
  imageCaption?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerButtonText?: string;
  bannerButtonLink?: string;
  customHtml?: string;
  widgetType?: 'Latest Contents' | 'Featured Content' | 'Recent News' | 'Popular Forms';
}

export interface MegaMenuConfig {
  columnsCount: number; // 1 to 6
  columns: MegaMenuColumn[];
  featuredImage?: {
    enabled: boolean;
    url: string;
    alt: string;
    link?: string;
    caption?: string;
  };
  banner?: {
    enabled: boolean;
    image: string;
    title: string;
    subtitle: string;
    link: string;
    buttonText: string;
  };
  htmlWidget?: {
    enabled: boolean;
    htmlContent: string;
  };
  contentWidget?: {
    enabled: boolean;
    type: 'Latest Contents' | 'Featured Content' | 'Recent News' | 'Popular Forms';
    itemsCount: number;
  };
}

export interface NavigationItem {
  id: string;
  menuId: string;
  parentId: string | null;
  title: string;
  titleEn?: string;
  itemType: ItemType;
  internalSource?: InternalSource;
  targetUrl: string;
  target: '_self' | '_blank';
  rel?: 'nofollow' | 'noopener' | 'noreferrer';
  displayType: DisplayMode;
  sortOrder: number;
  status: 'active' | 'inactive';
  settings: NavigationItemSettings;
  megaMenuConfig?: MegaMenuConfig;
  children?: NavigationItem[];
}

export interface NavigationMenu {
  id: number | string;
  name: string;
  slug: string;
  location: MenuLocation;
  /** زبان از ساختار اصلی چندزبانه سیستم مدیریت تعیین می‌شود */
  language: string;
  status: 'active' | 'draft' | 'archived';
  version: number;
  sortOrder?: number;
  sort_order?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  mobileBehavior?: MobileBehavior;
  items: NavigationItem[];
}

export interface MenuVersionHistory {
  id: string;
  menuId: string;
  version: number;
  changedBy: string;
  timestamp: string;
  changeSummary: string;
  itemsSnapshot: NavigationItem[];
}

export interface CmsSourceItem {
  id: string;
  title: string;
  type: InternalSource;
  url: string;
  category?: string;
  categoryPath?: string;
  scope?: CmsSourceScope;
  itemCount?: number;
  icon?: string;
}
