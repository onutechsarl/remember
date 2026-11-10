import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

type RoundProps = {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  /** `accent` : bouton orange (« + ») ; `neutral` : fond gris (réglages, sans fond sur Android). */
  variant: 'accent' | 'neutral';
};

/** Bouton rond d'en-tête (maquettes, planche des composants). */
export function RoundIconButton({ icon: Icon, onPress, accessibilityLabel, variant }: RoundProps) {
  const colors = useColors();
  const accent = variant === 'accent';
  const background = accent ? colors.accent : Platform.OS === 'ios' ? colors.fill : 'transparent';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [styles.round, { backgroundColor: background, opacity: pressed ? 0.7 : 1 }]}>
      <Icon color={accent ? colors.onAccent : colors.text} size={accent ? 24 : 22} strokeWidth={accent ? 2.5 : 2} />
    </Pressable>
  );
}

type PrimaryProps = {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
};

/** Bouton principal : orange, texte blanc ; coins arrondis sur iOS, pilule sur Android. */
export function PrimaryButton({ label, onPress, icon: Icon }: PrimaryProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.primary, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}>
      {Icon && <Icon color={colors.onAccent} size={22} />}
      <Text style={[Type.button, { color: colors.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

/** Pastille de comptage posée sur un bouton. */
export function Badge({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.badge, { backgroundColor: colors.background }]}>
      <Text style={[Type.caption, { color: colors.accentText }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 28,
    borderRadius: Platform.OS === 'ios' ? 16 : 27,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.18)',
  },
});
