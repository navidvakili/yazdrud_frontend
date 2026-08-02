// ============================================================
// LanguageContext — Context برای زبان محتوای فعال
// ============================================================
// این Context زبان مقصد محتوا را در کل نرم‌افزار به اشتراک می‌گذارد.
// نکته: در frontend نرم‌افزار زبان رابط کاربری تغییر نمی‌کند؛
// فقط محتواهای زبان مقصد نمایش داده می‌شوند.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Language } from '@/src/shared-types';
import { fetchLanguages } from '@/src/shared-api/languages';

const LANG_STORAGE_KEY = 'contentLanguage';

interface LanguageContextValue {
  /** List of all languages from the backend */
  languages: Language[];
  /** Currently selected content language code (defaults to 'fa') */
  currentLang: string;
  /** Set the active content language */
  setCurrentLang: (code: string) => void;
  /** Reload the languages list from the backend */
  reloadLanguages: () => Promise<void>;
  /** Look up a language by code */
  getLanguage: (code: string) => Language | undefined;
  /** Loading state for the initial languages fetch */
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLang, setCurrentLangState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LANG_STORAGE_KEY) || 'fa';
    }
    return 'fa';
  });
  const [loading, setLoading] = useState(true);

  const reloadLanguages = useCallback(async () => {
    try {
      const data = await fetchLanguages({ per_page: 100 });
      const list = data?.data || [];
      setLanguages(list);
      // If the current language no longer exists, fall back to the default
      if (list.length > 0 && !list.some((l) => l.code === currentLang)) {
        const def = list.find((l) => l.is_default) || list[0];
        if (def) setCurrentLangState(def.code);
      }
    } catch (err) {
      console.error('Error loading languages:', err);
    } finally {
      setLoading(false);
    }
  }, [currentLang]);

  useEffect(() => {
    reloadLanguages();
  }, [reloadLanguages]);

  const setCurrentLang = useCallback((code: string) => {
    setCurrentLangState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_STORAGE_KEY, code);
    }
  }, []);

  const getLanguage = useCallback(
    (code: string) => languages.find((l) => l.code === code),
    [languages]
  );

  return (
    <LanguageContext.Provider
      value={{ languages, currentLang, setCurrentLang, reloadLanguages, getLanguage, loading }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback outside the provider (e.g. during tests)
    return {
      languages: [],
      currentLang: 'fa',
      setCurrentLang: () => {},
      reloadLanguages: async () => {},
      getLanguage: () => undefined,
      loading: false,
    };
  }
  return ctx;
}
