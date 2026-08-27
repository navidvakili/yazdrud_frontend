// ============================================================
// Site Navigation API — ارتباط ماژول ناوبری با وب‌سرویس
// ============================================================
// این ماژول منوهای پوسته سایت اصلی را تعریف می‌کند. داده‌ها از همان
// وب‌سرویس بک‌اند (که سایت اصلی نیز از آن استفاده می‌کند) دریافت
// می‌شود؛ یعنی مستقیماً به سایت اصلی متصل نمی‌شویم و همه‌چیز از
// طریق API مدیریت برقرار می‌شود.

import { API } from '@/src/shared-utils/functions';
import type { NavigationMenu, CmsSourceItem, MenuLocation } from './types';
import { fetchNews, fetchCategories } from '../news/api';

// ==================== Site Navigation (وب‌سرویس منوها) ====================

/**
 * دریافت همه منوهای سایت برای زبان جاری
 */
export async function fetchSiteMenus(lang: string): Promise<NavigationMenu[]> {
  const res = await API<{ data: NavigationMenu[] }>(`site-navigation?lang=${encodeURIComponent(lang)}`);
  const items = res.data || [];
  return [...items].sort((a, b) => {
    const aOrder = Number(a.sortOrder ?? a.sort_order ?? 0);
    const bOrder = Number(b.sortOrder ?? b.sort_order ?? 0);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a.location).localeCompare(String(b.location), 'fa');
  });
}

/**
 * دریافت منوی یک موقعیت خاص (در صورت نبود، در بک‌اند ساخته می‌شود)
 */
export async function fetchMenuByLocation(location: string, lang: string): Promise<NavigationMenu> {
  const res = await API<{ data: NavigationMenu }>(
    `site-navigation/location/${encodeURIComponent(location)}?lang=${encodeURIComponent(lang)}`
  );
  return res.data;
}

/**
 * ذخیره منو (ایجاد در صورت نداشتن id، در غیر این صورت به‌روزرسانی)
 */
export async function saveSiteMenu(menu: NavigationMenu, lang: string): Promise<NavigationMenu> {
  const payload = {
    location: menu.location,
    name: menu.name,
    slug: menu.slug,
    items: menu.items,
    status: menu.status,
    sort_order: Number(menu.sortOrder ?? menu.sort_order ?? 0),
    lang,
  };

  if (menu.id && typeof menu.id === 'number') {
    const res = await API<{ data: NavigationMenu; message?: string }>(
      `site-navigation/${menu.id}`,
      payload,
      'PUT'
    );
    return res.data;
  }

  const res = await API<{ data: NavigationMenu; message?: string }>('site-navigation', payload, 'POST');
  return res.data;
}

/**
 * انتشار منو (نسخه جدید + فعال شدن برای نمایش عمومی)
 */
export async function publishSiteMenu(id: number): Promise<NavigationMenu> {
  const res = await API<{ data: NavigationMenu; message?: string }>(
    `site-navigation/${id}/publish`,
    {},
    'POST'
  );
  return res.data;
}

/**
 * حذف منو
 */
export async function deleteSiteMenu(id: number): Promise<void> {
  await API<{ message: string }>(`site-navigation/${id}`, {}, 'DELETE');
}

// ==================== منابع محتوایی سایت اصلی (CMS Source Palette) ====================

interface Paginated<T> {
  data: T[];
}

/**
 * دریافت منابع محتوایی واقعی سایت اصلی از وب‌سرویس بک‌اند
 * (اخبار، اطلاعیه‌ها، صفحات، دانشکده‌ها، رشته‌ها و ...)
 */
export async function fetchCmsSources(lang: string): Promise<CmsSourceItem[]> {
  const per_page = 30;
  const sources: CmsSourceItem[] = [];

  // اخبار منفرد
  try {
    const res = await fetchNews({ per_page, lang });
    const news = (res as Paginated<{ id: number; title: string; category_name: string | null }>).data || [];
    news.forEach(n => {
      sources.push({
        id: `news_${n.id}`,
        title: `خبر: ${n.title}`,
        type: 'News',
        url: `/news/${n.id}`,
        category: 'اخبار',
        categoryPath: n.category_name ? `اخبار > ${n.category_name}` : 'اخبار',
        scope: 'single_item',
      });
    });
  } catch (e) {
    console.warn('خطا در دریافت اخبار:', e);
  }

  // دسته‌بندی اخبار
  try {
    const res = await fetchCategories(lang);
    const cats = (res as { data: { id: number; name: string; slug: string; news_count?: number }[] }).data || [];
    cats.forEach(c => {
      sources.push({
        id: `news_cat_${c.id}`,
        title: `دسته‌بندی اخبار: ${c.name}`,
        type: 'News Categories',
        url: `/news?category=${c.slug}`,
        category: 'گروه اخبار',
        categoryPath: 'اخبار > دسته‌بندی',
        scope: 'category_group',
        itemCount: c.news_count,
      });
    });
  } catch (e) {
    console.warn('خطا در دریافت دسته‌بندی اخبار:', e);
  }

  return sources;
}

