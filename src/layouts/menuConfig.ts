// ============================================================
// Menu Configuration — types, icon mapping, and utilities
// ============================================================

import {
  User, Lock, Award, Users, BookOpen, Briefcase, Coins, CheckCircle,
  Calendar, DollarSign, FileText, Smile, MessageSquare as MessageSquareIcon,
  Sparkles, Heart, CreditCard, Building, Folder, ShieldCheck, Layers,
  Upload, Settings, Clock, Home, GraduationCap, Bell, HelpCircle,
  Search, X, LogOut, Plus, LayoutDashboard, ChevronLeft, Globe,
  type LucideIcon,
} from 'lucide-react';
import type { PortalNotification } from '@/src/layouts/types';

// ========== Types ==========

export interface SubmenuItem {
  label: string;
  targetId: string;
  title: string;
  iconName: string;
}

export interface MenuCategory {
  key: string;
  title: string;
  icon: LucideIcon;
  submenus: SubmenuItem[];
  /** For categories without submenus — targetId to directly open a tab */
  targetId?: string;
  iconName?: string;
}

// ========== FontAwesome → Lucide icon name mapping ==========
export const faToLucideName: Record<string, string> = {
  'fa fa-user': 'User',
  'fa fa-users': 'Users',
  'fa fa-lock': 'Lock',
  'fa fa-book': 'BookOpen',
  'fa fa-graduation-cap': 'GraduationCap',
  'fa fa-dollar': 'DollarSign',
  'fa fa-money': 'DollarSign',
  'fa fa-file-text': 'FileText',
  'fa fa-calendar': 'Calendar',
  'fa fa-home': 'Home',
  'fa fa-building': 'Building',
  'fa fa-heart': 'Heart',
  'fa fa-credit-card': 'CreditCard',
  'fa fa-bell': 'Bell',
  'fa fa-cog': 'Settings',
  'fa fa-gear': 'Settings',
  'fa fa-search': 'Search',
  'fa fa-plus': 'Plus',
  'fa fa-check': 'Check',
  'fa fa-times': 'X',
  'fa fa-close': 'X',
  'fa fa-info-circle': 'HelpCircle',
  'fa fa-question-circle': 'HelpCircle',
  'fa fa-exclamation-triangle': 'AlertCircle',
  'fa fa-envelope': 'MessageSquare',
  'fa fa-comment': 'MessageSquare',
  'fa fa-comments': 'MessageSquare',
  'fa fa-folder': 'Folder',
  'fa fa-folder-open': 'Folder',
  'fa fa-upload': 'Upload',
  'fa fa-download': 'Upload',
  'fa fa-shield': 'ShieldCheck',
  'fa fa-layers': 'Layers',
  'fa fa-clock': 'Clock',
  'fa fa-award': 'Award',
  'fa fa-globe': 'Globe',
  'fa fa-briefcase': 'Briefcase',
  'fa fa-check-circle': 'CheckCircle',
  'fa fa-smile': 'Smile',
  'fa fa-sparkles': 'Sparkles',
  'fa fa-flag': 'Folder',
};

// ========== Utility Functions ==========

/** Extract a module targetId from a URL path.
 *  e.g. "/thesis/mali" → "thesis-mali",  "#" → fallback slug from title */
export function urlToTargetId(url: string, titleFallback?: string): string {
  const path = url.split('?')[0].replace(/^\//, '');
  if (path) return path;
  // For "#" URLs, generate a slug from the title
  if (titleFallback) {
    return titleFallback
      .replace(/[^آ-یa-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();
  }
  return 'home';
}

/** Resolve a LucideIcon by name string */
export function resolveIcon(name: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    User, Lock, Award, Users, BookOpen, Briefcase, Coins, CheckCircle,
    Calendar, DollarSign, FileText, Smile, MessageSquare: MessageSquareIcon,
    Sparkles, Heart, CreditCard, Building, Folder, ShieldCheck, Layers,
    Upload, Settings, Clock, Home, GraduationCap, Bell, HelpCircle,
    Search, X, LogOut, Plus, LayoutDashboard, ChevronLeft,
  };
  return iconMap[name] || Folder;
}

// ========== Default Data ==========

export const defaultNotifications: PortalNotification[] = [
  { id: 'nt-1', title: 'تمدید مهلت انتخاب واحد نیمسال جاری', body: 'بر اساس مجوز دپارتمان آموزش کل، فرصت انتخاب واحد تا فردا ساعت ۲۴ تمدید شد.', date: '۱۴۰۵/۰۳/۱۹', read: false, type: 'info' },
  { id: 'nt-2', title: 'ثبت نهایی سوابق و نمرات کارنامه', body: 'نمرات نهایی دروس در پرونده الکترونیک دانشجو ثبت قطعی گردید.', date: '۱۴۰۵/۰۳/۱۷', read: false, type: 'success' },
  { id: 'nt-3', title: 'اطلاعیه پرداخت مابقی اقساط شهریه', body: 'دانشجویان محترم جهت نهایی‌سازی گواهی اخذ امتحان، نسبت به پرداخت مابقی بدهی اقدام نمایند.', date: '۱۴۰۵/۰۳/۱۵', read: true, type: 'warning' },
];
