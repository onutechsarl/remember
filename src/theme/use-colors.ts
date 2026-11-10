import { useColorScheme } from 'react-native';

import { Colors, type Palette } from './colors';

/** Renvoie la palette du thème actif (clair ou sombre). */
export function useColors(): Palette {
  return useColorScheme() === 'dark' ? Colors.dark : Colors.light;
}
