import { Check, Search, type LucideIcon } from 'lucide-react-native';
import { createContext, useContext, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { RADIUS } from '@/theme/radius';
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
  const inset = useContext(InSheetContext) && Platform.OS === 'ios' && styles.sheetText;
  return Platform.OS === 'ios' ? (
    <Text style={[Type.groupHeader, styles.groupHeader, inset, { color: colors.textSecondary }]} accessibilityRole="header">
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
  const inset = useContext(InSheetContext) && Platform.OS === 'ios' && styles.sheetText;
  return (
    <Text style={[Type.caption, styles.groupFooter, inset, { color: colors.textSecondary, fontWeight: '400' }]}>{children}</Text>
  );
}

/** Marge intérieure gauche et droite des lignes : 20 sur iOS (cartes très arrondies), 16 sur Android. */
export const ROW_INSET = Platform.OS === 'ios' ? 20 : 16;

/** Hauteur minimale d'une ligne : un peu plus aérée sur iOS, comme les Réglages. */
export const ROW_HEIGHT = Platform.OS === 'ios' ? 56 : 52;

/** Vrai dans un panneau qui monte du bas (fourni par `Sheet`). */
export const InSheetContext = createContext(false);

/**
 * Groupe de lignes.
 * - iOS : carte blanche très arrondie, comme les listes groupées d'iOS 26 (Réglages) ; dans un
 *   panneau, décalée de 16 des bords.
 * - Android : carte orange pâle arrondie sur un écran ; pleine largeur dans un panneau (Material 3).
 */
export function Group({ children }: { children: ReactNode }) {
  const colors = useColors();
  const inSheet = useContext(InSheetContext);
  if (Platform.OS !== 'ios') {
    return (
      <View style={[inSheet ? styles.flushGroup : styles.group, { backgroundColor: inSheet ? colors.surface : colors.accentSoft }]}>
        {children}
      </View>
    );
  }
  return (
    <View style={[styles.group, inSheet && styles.sheetGroup, { backgroundColor: colors.surface }]}>{children}</View>
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
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: RADIUS.field, paddingHorizontal: 12, minHeight: 44 },
  searchInput: { flex: 1, paddingVertical: 10 },
  mark: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  groupHeader: { paddingHorizontal: ROW_INSET, paddingTop: 22, paddingBottom: 8 },
  groupFooter: { paddingHorizontal: ROW_INSET, paddingTop: 8 },
  // Dans un panneau iOS : carte décalée de 16 + marge du texte des lignes.
  sheetText: { paddingHorizontal: 16 + ROW_INSET },
  group: { borderRadius: RADIUS.card, borderCurve: 'continuous', overflow: 'hidden' },
  sheetGroup: { marginHorizontal: 16 },
  flushGroup: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: ROW_INSET, gap: 14, minHeight: ROW_HEIGHT },
  rowContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: ROW_INSET, minHeight: ROW_HEIGHT },
  rowLabel: { flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badge: { alignItems: 'center', justifyContent: 'center' },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
    borderRadius: RADIUS.field,
    borderCurve: 'continuous',
    borderWidth: 1.5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: RADIUS.small,
    borderWidth: 1,
  },
});

/**
 * Pastille d'icône en tête de ligne, identique dans toute l'app : icône orange sur fond orange pâle
 * (carré arrondi sur iOS, cercle sur Android). Pas de couleur par ligne, messageries comprises.
 */
export function IconBadge({ icon: Icon, size = 32 }: { icon: LucideIcon; size?: number }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: Platform.OS === 'ios' ? size / 4 : size / 2 },
        { backgroundColor: colors.accentSoft },
      ]}>
      <Icon color={colors.accent} size={size * 0.58} strokeWidth={2} />
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
