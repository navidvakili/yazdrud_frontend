// ============================================================
// useTheme — مدیریت تم (تیره/روشن)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { THEME_STRING } from '@/src/shared-constants';
import { loginApi } from '@/src/login';

export function useTheme(viewState: 'login' | 'authenticated') {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(THEME_STRING) as 'light' | 'dark') || 'light'
  );

  // Apply theme to DOM + persist to localStorage + save to backend profile
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STRING, theme);
    // Persist theme to backend profile (silently, only when authenticated)
    if (viewState === 'authenticated') {
      loginApi.updateTheme(theme).catch(() => { /* ignore */ });
    }
  }, [theme, viewState]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { theme, setTheme, handleToggleTheme };
}
