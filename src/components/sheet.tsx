import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

import { GlassIconButton, PrimaryButton } from './buttons';
import { InSheetContext, ROW_INSET } from './form';

type Confirm = { label: string; onPress: () => void; disabled?: boolean };

type Props = {
  title: string;
  hint?: string;
  footer?: string;
  /** Validation du panneau : bouton ✓ en haut à droite sur iOS, bouton principal en bas sur Android. */
  confirm?: Confirm;
  children: ReactNode;
};

/**
 * Contenu d'un panneau qui monte du bas (présentation `formSheet`).
 * - iOS (comme sur un iPhone récent) : barre du haut avec ✕ rond à gauche, titre centré et ✓ orange
 *   à droite ; listes en cartes très arrondies décalées des bords.
 * - Android (Material 3) : titre, listes pleine largeur, bouton de validation en bas.
 */
export function Sheet({ title, hint, footer, confirm, children }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';

  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: ios ? colors.groupedBackground : colors.background, paddingBottom: insets.bottom + 16 },
      ]}>
      {ios ? (
        <View style={styles.bar}>
          <GlassIconButton icon={X} size={40} onPress={() => router.back()} accessibilityLabel={t('common.cancel')} />
          <Text style={[Type.name, styles.barTitle, { color: colors.text }]} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {confirm ? (
            <CircleButton kind="confirm" label={confirm.label} onPress={confirm.onPress} disabled={confirm.disabled} />
          ) : (
            <View style={styles.circle} />
          )}
        </View>
      ) : (
        <Text style={[Type.sectionTitle, styles.androidTitle, { color: colors.text }]} accessibilityRole="header">
          {title}
        </Text>
      )}

      {hint && <Text style={[Type.secondary, styles.text, styles.hint, { color: colors.textSecondary }]}>{hint}</Text>}
      <InSheetContext.Provider value>{children}</InSheetContext.Provider>
      {footer && <Text style={[Type.caption, styles.text, styles.footer, { color: colors.textSecondary }]}>{footer}</Text>}

      {!ios && confirm && (
        <SheetPadding>
          <PrimaryButton block label={confirm.label} onPress={confirm.onPress} disabled={confirm.disabled} />
        </SheetPadding>
      )}
    </View>
  );
}

function CircleButton({
  kind,
  label,
  onPress,
  disabled,
}: {
  kind: 'close' | 'confirm';
  label?: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const confirm = kind === 'confirm';
  const Icon = confirm ? Check : X;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={confirm ? label : t('common.cancel')}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.circle,
        { backgroundColor: confirm ? colors.accent : colors.fill, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}>
      <Icon color={confirm ? colors.onAccent : colors.text} size={20} strokeWidth={2.6} />
    </Pressable>
  );
}

/** Marge horizontale des éléments qui ne vont pas d'un bord à l'autre dans un panneau. */
export function SheetPadding({ children }: { children: ReactNode }) {
  return <View style={styles.padding}>{children}</View>;
}

const styles = StyleSheet.create({
  sheet: { paddingTop: Platform.OS === 'ios' ? 14 : 20, gap: 4 },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  barTitle: { flex: 1, textAlign: 'center', marginHorizontal: 8 },
  circle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  androidTitle: { paddingHorizontal: 24, paddingBottom: 8 },
  // Aligné sur le texte des lignes : carte décalée de 16 sur iOS, pleine largeur sur Android.
  text: { paddingHorizontal: Platform.OS === 'ios' ? 16 + ROW_INSET : ROW_INSET },
  hint: { paddingBottom: 8 },
  footer: { paddingTop: 8, fontWeight: '400' },
  padding: { paddingHorizontal: 20, paddingTop: 12 },
});
