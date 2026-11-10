import { Linking } from 'react-native';

import type { Channel } from '@/domain/types';

/**
 * MessagingService — messageries prises en charge (architecture.pdf, « Messageries prises en charge »).
 * Les schémas sont déclarés dans `LSApplicationQueriesSchemes` (iOS) et dans les `queries`
 * du manifeste Android (plugin `plugins/with-messaging-queries.js`) pour pouvoir tester leur présence.
 */

export const CHANNELS: readonly Channel[] = ['whatsapp', 'telegram', 'signal', 'viber', 'sms', 'call'];

/** Schéma qui permet de savoir si l'application est installée. SMS et appel sont toujours disponibles. */
export const CHANNEL_SCHEMES: Partial<Record<Channel, string>> = {
  whatsapp: 'whatsapp',
  telegram: 'tg',
  signal: 'sgnl',
  viber: 'viber',
};

export const DEFAULT_CHANNEL: Channel = 'whatsapp';

/** Messageries installées sur le téléphone, dans l'ordre d'affichage (US-17 CA3). */
export async function availableChannels(): Promise<Channel[]> {
  const installed = await Promise.all(
    CHANNELS.map(async (channel) => {
      const scheme = CHANNEL_SCHEMES[channel];
      if (!scheme) return true;
      return Linking.canOpenURL(`${scheme}://`).catch(() => false);
    }),
  );
  return CHANNELS.filter((_, i) => installed[i]);
}

/** Messagerie proposée par défaut : WhatsApp s'il est installé, le SMS sinon (US-17 CA2, CA5). */
export function defaultChannel(available: readonly Channel[]): Channel {
  return available.includes(DEFAULT_CHANNEL) ? DEFAULT_CHANNEL : 'sms';
}
