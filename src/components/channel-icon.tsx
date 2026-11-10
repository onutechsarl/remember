import { MessageCircle, MessageSquare, MessageSquareText, Phone, PhoneCall, Send, type LucideIcon } from 'lucide-react-native';

import type { Channel } from '@/domain/types';

import { IconBadge } from './form';

/** Pictogramme de chaque messagerie ; la pastille est la même que pour toutes les icônes de l'app. */
const CHANNEL_GLYPH: Record<Channel, LucideIcon> = {
  whatsapp: MessageCircle,
  telegram: Send,
  signal: MessageSquare,
  viber: PhoneCall,
  sms: MessageSquareText,
  call: Phone,
};

/** Pictogramme seul d'une messagerie (bouton « Écrire » de la fiche). */
export function channelGlyph(channel: Channel): LucideIcon {
  return CHANNEL_GLYPH[channel];
}

/** Icône de messagerie en tête de ligne. */
export function ChannelIcon({ channel, size = 32 }: { channel: Channel; size?: number }) {
  return <IconBadge icon={CHANNEL_GLYPH[channel]} size={size} />;
}
