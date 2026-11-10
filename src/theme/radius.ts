import { Platform } from 'react-native';

/**
 * Arrondis de l'app, en courbe continue sur iOS (`borderCurve: 'continuous'`).
 * iOS : cartes très arrondies, comme les Réglages d'iOS 26 ; Android : arrondis de Material 3.
 */
export const RADIUS = {
  /** Cartes, groupes de lignes, tuiles, bandeaux. */
  card: Platform.OS === 'ios' ? 26 : 24,
  /** Grande carte du bilan. */
  largeCard: 32,
  /** Boutons rectangulaires (le bouton principal Android reste une pilule). */
  button: 16,
  /** Champs et options : recherche, cartes « Dernier échange ». */
  field: 12,
  /** Petits éléments : étiquettes, puces. */
  small: 8,
} as const;
