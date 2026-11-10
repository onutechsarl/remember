import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

type Props = { title: string; hint?: string; children: ReactNode; footer?: string };

/** Contenu d'un panneau qui monte du bas (présentation `formSheet`). */
export function Sheet({ title, hint, children, footer }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: Platform.OS === 'ios' ? colors.groupedBackground : colors.background, paddingBottom: insets.bottom + 16 },
      ]}>
      <Text style={[Type.name, styles.title, { color: colors.text }]} accessibilityRole="header">
        {title}
      </Text>
      {hint && <Text style={[Type.secondary, styles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
      {children}
      {footer && <Text style={[Type.caption, styles.footer, { color: colors.textSecondary }]}>{footer}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { paddingHorizontal: 20, paddingTop: 20, gap: 4 },
  title: { textAlign: 'center', fontSize: 18, marginBottom: 4 },
  hint: { paddingHorizontal: 16, paddingBottom: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 8, fontWeight: '400' },
});
