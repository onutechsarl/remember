import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

type Props = { icon: LucideIcon; title: string; body: string; onPress: () => void };

/** Bandeau d'alerte ambre, par exemple « Rappels désactivés » (US-03 CA2). */
export function NoticeBanner({ icon: Icon, title, body, onPress }: Props) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      style={({ pressed }) => [styles.banner, { backgroundColor: colors.amberSoft, opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: colors.amber }]}>
        <Icon color="#FFFFFF" size={22} />
      </View>
      <View style={styles.texts}>
        <Text style={[Type.name, { color: colors.text }]}>{title}</Text>
        <Text style={[Type.secondary, { color: colors.amberText }]}>{body}</Text>
      </View>
      <ChevronRight color={colors.amberText} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginHorizontal: 20 },
  icon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
});
