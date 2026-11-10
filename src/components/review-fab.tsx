import { CalendarCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/theme/use-colors';

import { Badge } from './buttons';

type Props = { count: number; onPress: () => void };

/**
 * Bouton flottant du bilan, en bas à droite de l'accueil (US-14 CA7).
 * Rond sur iOS, carré arrondi (FAB Material 3) sur Android.
 */
export function ReviewFab({ count, onPress }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('home.reviewButton', { count })}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: insets.bottom + 16,
          backgroundColor: colors.accent,
          boxShadow: `0 8px 20px ${colors.accent}66`,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}>
      <CalendarCheck color={colors.onAccent} size={30} />
      <Badge>{count}</Badge>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 68,
    height: 68,
    borderRadius: Platform.OS === 'ios' ? 34 : 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
