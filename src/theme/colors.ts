/**
 * Couleurs de Remember, issues des maquettes graphiques
 * (REMEMBER-UI-IOS et REMEMBER-UI-AND, thèmes clair et sombre).
 */
export const Colors = {
  light: {
    background: '#FFFFFF',
    groupedBackground: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#0B0B0C',
    textSecondary: '#8A8A8E',
    separator: '#E5E5EA',
    accent: '#F76B15',
    accentText: '#D9530A',
    accentSoft: '#FFF0E5',
    onAccent: '#FFFFFF',
    red: '#FF3B30',
    amber: '#FF9500',
    green: '#34C759',
  },
  dark: {
    background: '#000000',
    groupedBackground: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#98989F',
    separator: '#38383A',
    accent: '#FF7A2B',
    accentText: '#FF9A55',
    accentSoft: '#3A2414',
    onAccent: '#FFFFFF',
    red: '#FF453A',
    amber: '#FF9F0A',
    green: '#30D158',
  },
} as const;

export type ColorName = keyof typeof Colors.light;
