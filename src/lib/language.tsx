import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AppLanguage = 'en' | 'id';

const LANGUAGE_STORAGE_KEY = 'psikotest:language';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function loadStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'id' ? 'id' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    setLanguageState(loadStoredLanguage());
  }, []);

  function setLanguage(nextLanguage: AppLanguage) {
    setLanguageState(nextLanguage);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }
  }

  function toggleLanguage() {
    setLanguage(language === 'en' ? 'id' : 'en');
  }

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
