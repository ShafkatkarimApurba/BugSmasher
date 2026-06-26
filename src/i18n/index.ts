import { en, type TranslationKey } from './en';
import { es } from './es';

export type LocaleId = 'en' | 'es';

const STORAGE_KEY = 'bugsmasher_locale';

const CATALOG: Record<LocaleId, Record<TranslationKey, string>> = { en, es };

let locale: LocaleId = loadLocale();

function loadLocale(): LocaleId {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === 'es' ? 'es' : 'en';
}

export function getLocale(): LocaleId {
  return locale;
}

export function setLocale(next: LocaleId): void {
  locale = next;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent('bugsmasher:locale', { detail: next }));
  }
}

export function t(key: TranslationKey): string {
  return CATALOG[locale][key] ?? CATALOG.en[key] ?? key;
}

export function subscribeLocale(listener: (l: LocaleId) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => listener((e as CustomEvent<LocaleId>).detail ?? locale);
  window.addEventListener('bugsmasher:locale', handler);
  return () => window.removeEventListener('bugsmasher:locale', handler);
}