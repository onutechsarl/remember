import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme/use-colors';

export const INDEX_LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '#'] as const;

/**
 * Section visée par une lettre : la lettre elle-même si elle a des contacts, sinon la suivante qui en a,
 * sinon la dernière section (comme l'index de l'app Contacts).
 */
export function targetSection(letter: string, available: readonly string[]): number {
  if (available.length === 0) return -1;
  const start = INDEX_LETTERS.indexOf(letter as (typeof INDEX_LETTERS)[number]);
  for (const candidate of INDEX_LETTERS.slice(start)) {
    const index = available.indexOf(candidate);
    if (index !== -1) return index;
  }
  return available.length - 1;
}

type Props = {
  /** Lettres des sections présentes, dans l'ordre de la liste. */
  sections: readonly string[];
  onSelect: (sectionIndex: number) => void;
  /** Libellé lu par VoiceOver / TalkBack pour chaque lettre, avec `{{letter}}`. */
  letterLabel: (letter: string) => string;
};

/** Index alphabétique sur le bord droit : toucher une lettre fait défiler la liste jusqu'à sa section. */
export function AlphabetIndex({ sections, onSelect, letterLabel }: Props) {
  const colors = useColors();
  return (
    <View style={styles.index}>
      {INDEX_LETTERS.map((letter) => {
        const present = sections.includes(letter);
        return (
          <Pressable
            key={letter}
            onPress={() => onSelect(targetSection(letter, sections))}
            hitSlop={{ left: 14, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={letterLabel(letter)}
            style={({ pressed }) => [styles.slot, pressed && { backgroundColor: colors.accentSoft }]}>
            <Text
              style={[styles.letter, { color: present ? colors.accentText : colors.textSecondary }]}
              allowFontScaling={false}>
              {letter}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  index: {
    position: 'absolute',
    right: 2,
    top: 8,
    bottom: 8,
    width: 24,
    justifyContent: 'center',
  },
  // Les lettres se partagent la hauteur disponible, jusqu'à 26 px chacune.
  slot: { flex: 1, maxHeight: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  letter: { fontSize: 12, fontWeight: '600' },
});
