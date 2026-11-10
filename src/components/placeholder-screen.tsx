import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/theme/use-colors';

type Props = {
  title: string;
  /** User stories couvertes par l'écran (voir specifications.pdf). */
  stories: string;
};

/** Écran provisoire, en attendant le développement de chaque lot. */
export function PlaceholderScreen({ title, stories }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.stories, { color: colors.textSecondary }]}>{stories}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  stories: { fontSize: 15, textAlign: 'center' },
});
