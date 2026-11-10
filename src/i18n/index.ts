/**
 * Textes de l'application en français et en anglais (US-18).
 * Aucun texte n'est écrit en dur dans les composants : tout passe par `t()`.
 */
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { Settings } from '@/domain/types';

import en from './en.json';
import fr from './fr.json';

export const resources = { fr: { translation: fr }, en: { translation: en } } as const;

const i18n = createInstance();
export type Language = keyof typeof resources;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: (typeof resources)['fr'];
  }
}

/** Langue du téléphone si c'est le français ou l'anglais, l'anglais sinon (US-18 CA1). */
export function resolveLanguage(setting: Settings['language']): Language {
  if (setting !== 'system') return setting;
  return getLocales()[0]?.languageCode === 'fr' ? 'fr' : 'en';
}

/** Initialise i18next, ou change de langue s'il l'est déjà. */
export async function applyLanguage(setting: Settings['language']): Promise<Language> {
  const lng = resolveLanguage(setting);
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      initAsync: false,
    });
  } else if (i18n.language !== lng) {
    await i18n.changeLanguage(lng);
  }
  return lng;
}

export default i18n;
