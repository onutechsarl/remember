/**
 * Couleurs de Remember, issues des maquettes graphiques
 * (REMEMBER-UI-IOS et REMEMBER-UI-AND, thèmes clair et sombre).
 */
export const Colors = {
  light: {
    background: '#FFFFFF',
    groupedBackground: '#F2F2F7',
    surface: '#FFFFFF',
    /** Fond des boutons ronds neutres (réglages) et des champs. */
    fill: '#EFEFF4',
    text: '#0B0B0C',
    textSecondary: '#8A8A8E',
    separator: '#E5E5EA',
    /** Chevrons « › » des lignes. */
    chevron: '#C4C4C7',
    accent: '#F76B15',
    accentText: '#D9530A',
    accentSoft: '#FFF0E5',
    /** Pastille « rappel envoyé sans échange » (widget, bilan). */
    accentMuted: '#FFD9BF',
    onAccent: '#FFFFFF',
    red: '#FF3B30',
    redText: '#E5261B',
    redSoft: '#FFE5E3',
    amber: '#FF9500',
    amberSoft: '#FFF4D6',
    amberText: '#8A6A2E',
    green: '#34C759',
  },
  dark: {
    background: '#000000',
    groupedBackground: '#000000',
    surface: '#1C1C1E',
    fill: '#2C2C2E',
    text: '#FFFFFF',
    textSecondary: '#98989F',
    separator: '#38383A',
    chevron: '#5B5B60',
    accent: '#FF7A2B',
    accentText: '#FF9A55',
    accentSoft: '#3A2414',
    accentMuted: '#5A3418',
    onAccent: '#FFFFFF',
    red: '#FF453A',
    redText: '#FF6961',
    redSoft: '#3D1A17',
    amber: '#FF9F0A',
    amberSoft: '#33270F',
    amberText: '#D9B77A',
    green: '#30D158',
  },
} as const;

export type ColorName = keyof typeof Colors.light;
export type Palette = { [K in ColorName]: string };

/** Dégradés des avatars : une couleur fixe par contact, identique dans les deux thèmes. */
export const AvatarGradients: readonly (readonly [string, string])[] = [
  ['#FFB46E', '#F76B15'],
  ['#5EE7D8', '#14B8A6'],
  ['#F9A8D4', '#EC4899'],
  ['#86EFAC', '#22C55E'],
  ['#C4B5FD', '#8B5CF6'],
  ['#93C5FD', '#3B82F6'],
];
