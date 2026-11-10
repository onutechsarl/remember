import { Switch } from 'react-native';

import { useColors } from '@/theme/use-colors';

/**
 * Interrupteur. Android (et web) : `Switch` de React Native. iOS : toggle.ios.tsx (SwiftUI), car sur
 * iOS 26 l'interrupteur natif est plus grand que la taille connue de React Native et se décale.
 * Ce fichier et sa variante iOS exportent exactement les mêmes noms.
 */
export type ToggleProps = { value: boolean; onValueChange: (value: boolean) => void; accessibilityLabel: string };

export function Toggle({ value, onValueChange, accessibilityLabel }: ToggleProps) {
  const colors = useColors();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: colors.accent, false: colors.fill }}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
