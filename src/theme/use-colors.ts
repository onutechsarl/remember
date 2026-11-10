import { useColorScheme } from 'react-native';

import { Colors } from './colors';

/** Renvoie la palette du thème actif (clair ou sombre). */
export function useColors() {
  return useColorScheme() === 'dark' ? Colors.dark : Colors.light;
}
