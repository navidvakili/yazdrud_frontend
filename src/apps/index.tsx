// ============================================================
// App Route Registry — تجمیع مسیریابی تمام App ها
//
// هر App یک کامپوننت Lazy Load شده است که بر اساس moduleType
// انتخاب و رندر می‌شود.
// ============================================================

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';

// ===== تعریف App های اصلی با Lazy Loading =====
export const AppModules: Record<string, LazyExoticComponent<ComponentType<any>>> = {
  accounting: lazy(() => import('./accounting')),
  auth: lazy(() => import('./auth')),
  users: lazy(() => import('./users')),
  news: lazy(() => import('./news')),
  'county-projects': lazy(() => import('./county-projects')),
  'slider-studio': lazy(() => import('./slider-studio')),
  'development-timeline': lazy(() => import('./development-timeline')),
};

/**
 * نگاشت moduleType به App مربوطه
 * هر moduleType مشخص می‌کند کدام App باید رندر شود
 */
export const moduleToAppMap: Record<string, string> = {
  // Accounting App
  'finance': 'accounting',

  // Auth App
  'profile': 'auth',
  'change-password': 'auth',
  'sessions': 'auth',
  'admin-sessions': 'auth',

  // Users Management App
  'users': 'users',

  // News App
  'news': 'news',
  'news-create': 'news',
  'news-categories': 'news',
  'news-analytics': 'news',

  // County Projects App
  'county-projects': 'county-projects',

  // Slider Studio App
  'slider-studio': 'slider-studio',

  // Development Timeline App
  'development-timeline': 'development-timeline',

};

/**
 * برگرداندن App name برای یک moduleType
 */
export function resolveApp(moduleType: string): string {
  return moduleToAppMap[moduleType] || '';
}

/**
 * کامپوننت نمایش در هنگام بارگذاری (Fallback)
 */
export { default as ModuleRenderer } from './ModuleRenderer';

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-bold">در حال بارگذاری...</span>
      </div>
    </div>
  );
}

/**
 * Suspense wrapper برای Lazy Loaded components
 */
export function withSuspense(Component: ComponentType<any>, props: Record<string, any> = {}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
}
