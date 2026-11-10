import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RADIUS } from '@/theme/radius';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

import { IconBadge } from './form';

type Props = { icon: LucideIcon; title: string; body: string; onPress: () => void };

/** Bandeau d'alerte sur fond ambre pâle, par exemple « Rappels désactivés » (US-03 CA2). */
export function NoticeBanner({ icon: Icon, title, body, onPress }: Props) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      style={({ pressed }) => [styles.banner, { backgroundColor: colors.amberSoft, opacity: pressed ? 0.8 : 1 }]}>
      <IconBadge icon={Icon} size={40} />
      <View style={styles.texts}>
        <Text style={[Type.name, { color: colors.text }]}>{title}</Text>
        <Text style={[Type.secondary, { color: colors.amberText }]}>{body}</Text>
      </View>
      <ChevronRight color={colors.amberText} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: RADIUS.card, borderCurve: 'continuous', padding: 14, marginHorizontal: 20 },
  texts: { flex: 1, gap: 2 },
});
