/**
 * Textes de l'application en français et en anglais (US-18).
 * Bibliothèques prévues : i18next, react-i18next, expo-localization.
 */
import en from './en.json';
import fr from './fr.json';

export const resources = { fr, en } as const;
export type Language = keyof typeof resources;
