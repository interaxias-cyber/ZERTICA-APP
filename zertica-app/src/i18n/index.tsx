import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '@/api/types';
import { ApiError } from '@/api/client';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { en } from './en';
import { es } from './es';

const dictionaries = { es, en } as const;

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<typeof es>;
type Params = Record<string, string | number>;

function lookup(lang: Language, key: string): string | undefined {
  let node: any = dictionaries[lang];
  for (const part of key.split('.')) {
    node = node?.[part];
    if (node === undefined) return undefined;
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(text: string, params?: Params) {
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''));
}

interface I18nValue {
  language: Language;
  /** null mientras no se ha elegido idioma en este dispositivo. */
  hasChosenLanguage: boolean | null;
  setLanguage: (lang: Language) => Promise<void>;
  /** Cambia el idioma mostrado sin guardarlo (vista previa en la selección inicial). */
  previewLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Params) => string;
  /** Traduce un error de la API por su código estable (RNF08). */
  errorMessage: (error: unknown) => string;
  /** Traduce el código de un error de campo. */
  fieldMessage: (code: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>('es');
  const [hasChosenLanguage, setHasChosen] = useState<boolean | null>(null);

  useEffect(() => {
    storage.get(STORAGE_KEYS.language).then((stored) => {
      if (stored === 'es' || stored === 'en') {
        setLang(stored);
        setHasChosen(true);
      } else {
        setHasChosen(false);
      }
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLang(lang);
    setHasChosen(true);
    await storage.set(STORAGE_KEYS.language, lang);
  }, []);

  const previewLanguage = useCallback((lang: Language) => setLang(lang), []);

  const t = useCallback(
    (key: TranslationKey, params?: Params) => interpolate(lookup(language, key) ?? lookup('es', key) ?? key, params),
    [language],
  );

  const errorMessage = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) {
        return lookup(language, `errors.${error.code}`) ?? error.message ?? lookup(language, 'errors.UNKNOWN_ERROR')!;
      }
      return lookup(language, 'errors.UNKNOWN_ERROR')!;
    },
    [language],
  );

  const fieldMessage = useCallback(
    (code: string) => lookup(language, `validation.${code}`) ?? lookup(language, 'validation.INVALID_FORMAT')!,
    [language],
  );

  const value = useMemo(
    () => ({ language, hasChosenLanguage, setLanguage, previewLanguage, t, errorMessage, fieldMessage }),
    [language, hasChosenLanguage, setLanguage, previewLanguage, t, errorMessage, fieldMessage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de I18nProvider');
  return ctx;
}
