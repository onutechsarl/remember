import { MessageCircle, MessageSquare, MessageSquareText, Phone, Send, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Channel } from '@/domain/types';

/** Icône et couleur de chaque messagerie (maquettes, planche des composants). */
const CHANNEL_STYLE: Record<Channel, { icon: LucideIcon; color: string }> = {
  whatsapp: { icon: MessageCircle, color: '#25D366' },
  telegram: { icon: Send, color: '#2AABEE' },
  signal: { icon: MessageSquare, color: '#3A76F0' },
  viber: { icon: Phone, color: '#7360F2' },
  sms: { icon: MessageSquareText, color: '#34C759' },
  call: { icon: Phone, color: '#34C759' },
};

/** Icône blanche dans un carré (iOS) ou un cercle (Android) à la couleur de la messagerie. */
export function ChannelIcon({ channel, size = 36, round = false }: { channel: Channel; size?: number; round?: boolean }) {
  const { icon: Icon, color } = CHANNEL_STYLE[channel];
  return (
    <View
      style={[styles.box, { width: size, height: size, borderRadius: round ? size / 2 : size * 0.24, backgroundColor: color }]}>
      <Icon color="#FFFFFF" size={size * 0.56} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
