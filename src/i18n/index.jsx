import { createContext, useContext, useState, useCallback } from 'react';
import en from './locales/en';
import pt from './locales/pt';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import it from './locales/it';
import zh from './locales/zh';
import ja from './locales/ja';
import ru from './locales/ru';
import ar from './locales/ar';

export const LOCALES = { en, pt, es, fr, de, it, zh, ja, ru, ar };

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'zh', label: '中文',        flag: '🇨🇳' },
  { code: 'ja', label: '日本語',      flag: '🇯🇵' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦' },
];

function getSystemLanguage() {
  const nav = navigator.language?.slice(0, 2) || 'en';
  return LOCALES[nav] ? nav : 'en';
}

function getSavedLanguage() {
  // Always default to English on first launch — user can change in onboarding
  return localStorage.getItem('ytdl-gui-lang') || 'en';
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLanguage);

  const setLang = useCallback((code) => {
    localStorage.setItem('ytdl-gui-lang', code);
    setLangState(code);
  }, []);

  // Dot-notation key lookup with fallback to English
  const t = useCallback((key, vars = {}) => {
    const locale = LOCALES[lang] || en;
    const parts = key.split('.');
    let val = parts.reduce((obj, k) => obj?.[k], locale);
    if (val === undefined) val = parts.reduce((obj, k) => obj?.[k], en);
    if (val === undefined) return key;
    // Simple variable interpolation: {{name}}
    return String(val).replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, languages: LANGUAGE_OPTIONS }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
