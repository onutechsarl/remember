import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { AvatarGradients } from '@/theme/colors';
import { useColors } from '@/theme/use-colors';
import { initials, stableIndex } from '@/utils/avatar';

type Props = {
  id: string;
  name: string;
  size?: number;
  /** Anneau de retard, comme les statuts WhatsApp (rouge ou ambre). */
  ringColor?: string;
};

const RING_WIDTH = 2.5;
const RING_GAP = 2.5;

/** Avatar rond : dégradé fixe par contact et initiales (maquettes, « Principes »). */
export function Avatar({ id, name, size = 56, ringColor }: Props) {
  const colors = useColors();
  const inner = ringColor ? size - 2 * (RING_WIDTH + RING_GAP) : size;
  const gradient = AvatarGradients[stableIndex(id, AvatarGradients.length)];

  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2 },
        ringColor && { borderWidth: RING_WIDTH, borderColor: ringColor, backgroundColor: colors.background },
      ]}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      <LinearGradient
        colors={gradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.center, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        <Text style={[styles.initials, { fontSize: inner * 0.38 }]} allowFontScaling={false}>
          {initials(name)}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFFFFF', fontWeight: '700' },
});
