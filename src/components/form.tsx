import { Check, Search, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

/** Champ de recherche arrondi et gris d'iOS (maquettes, « Principes »). */
export function SearchField(props: TextInputProps) {
  const colors = useColors();
  return (
    <View style={[styles.search, { backgroundColor: colors.fill }]}>
      <Search color={colors.textSecondary} size={20} />
      <TextInput
        {...props}
        style={[Type.body, styles.searchInput, { color: colors.text }]}
        placeholderTextColor={colors.textSecondary}
        clearButtonMode="while-editing"
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
}

/**
 * Case de sélection multiple : cercle coché sur iOS (comme WhatsApp), case carrée sur Android.
 * `disabled` : cercle plein grisé (contact déjà suivi).
 */
export function SelectionMark({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  const colors = useColors();
  const radius = Platform.OS === 'ios' ? 13 : 5;
  if (disabled) return <View style={[styles.mark, { borderRadius: radius, backgroundColor: colors.fill }]} />;
  return (
    <View
      style={[
        styles.mark,
        { borderRadius: radius },
        checked ? { backgroundColor: colors.accent } : { borderWidth: 1.5, borderColor: colors.textSecondary },
      ]}>
      {checked && <Check color={colors.onAccent} size={17} strokeWidth={3} />}
    </View>
  );
}

/** Titre de groupe : majuscules grises sur iOS, texte orange sur Android. */
export function GroupHeader({ children }: { children: string }) {
  const colors = useColors();
  return Platform.OS === 'ios' ? (
    <Text style={[Type.groupHeader, styles.groupHeader, { color: colors.textSecondary }]} accessibilityRole="header">
      {children}
    </Text>
  ) : (
    <Text style={[Type.name, styles.groupHeader, { color: colors.accentText }]} accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Note sous un groupe. */
export function GroupFooter({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[Type.caption, styles.groupFooter, { color: colors.textSecondary, fontWeight: '400' }]}>{children}</Text>;
}

/** Groupe de lignes sur fond blanc arrondi (listes groupées d'iOS). */
export function Group({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.group, { backgroundColor: Platform.OS === 'ios' ? colors.surface : colors.accentSoft }]}>{children}</View>
  );
}

type RowProps = {
  label: string;
  onPress?: () => void;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  last?: boolean;
  accessibilityRole?: 'button' | 'radio' | 'switch';
};

/** Ligne d'un groupe. En choix unique : coche à droite sur iOS, bouton radio à gauche sur Android. */
export function GroupRow({ label, onPress, leading, trailing, selected, last, accessibilityRole = 'button' }: RowProps) {
  const colors = useColors();
  const isChoice = accessibilityRole === 'radio';
  const radio = isChoice && Platform.OS === 'android' && (
    <View style={[styles.radio, { borderColor: selected ? colors.accent : colors.textSecondary }]}>
      {selected && <View style={[styles.radioDot, { backgroundColor: colors.accent }]} />}
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={isChoice ? { checked: !!selected } : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.fill }]}>
      {radio}
      {leading}
      <View
        style={[
          styles.rowContent,
          !last && Platform.OS === 'ios' && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
        ]}>
        <Text style={[Type.body, styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
          {label}
        </Text>
        {trailing}
        {isChoice && Platform.OS === 'ios' && selected && <Check color={colors.accent} size={22} strokeWidth={2.5} />}
      </View>
    </Pressable>
  );
}

/** Petite étiquette (« par défaut », « Déjà suivi »). */
export function Tag({ label, tone }: { label: string; tone: 'accent' | 'neutral' }) {
  const colors = useColors();
  return (
    <View style={[styles.tag, { backgroundColor: tone === 'accent' ? colors.accentSoft : colors.fill }]}>
      <Text style={[Type.caption, { color: tone === 'accent' ? colors.accentText : colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

/** Option sous forme de carte (iOS) ou de puce de filtre Material (Android) : « Dernier échange ». */
export function OptionCard({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  const ios = Platform.OS === 'ios';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={[
        ios ? styles.card : styles.chip,
        selected
          ? { backgroundColor: colors.accentSoft, borderColor: ios ? colors.accent : colors.accentSoft }
          : { backgroundColor: ios ? colors.surface : 'transparent', borderColor: ios ? colors.surface : colors.textSecondary },
      ]}>
      {selected && <Check color={selected ? colors.accentText : colors.text} size={18} strokeWidth={2.5} />}
      <Text style={[Type.name, { color: selected ? colors.accentText : colors.text, fontSize: 16 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 12, minHeight: 44 },
  searchInput: { flex: 1, paddingVertical: 10 },
  mark: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  groupHeader: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 8 },
  groupFooter: { paddingHorizontal: 16, paddingTop: 8 },
  group: { borderRadius: Platform.OS === 'ios' ? 14 : 24, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 12, minHeight: 52 },
  rowContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 16, minHeight: 52 },
  rowLabel: { flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badge: { width: 32, height: 32, borderRadius: Platform.OS === 'ios' ? 8 : 16, alignItems: 'center', justifyContent: 'center' },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
});

/** Icône blanche dans un petit carré coloré (iOS) ou un cercle (Android), en tête de ligne. */
export function IconBadge({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Icon color="#FFFFFF" size={19} strokeWidth={2.2} />
    </View>
  );
}

/** Valeur grise à droite d'une ligne (« Toutes les 2 semaines », « Aujourd'hui, 18:00 »). */
export function RowValue({ children }: { children: string }) {
  const colors = useColors();
  return (
    <Text style={[Type.body, styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>
      {children}
    </Text>
  );
}
