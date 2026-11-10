import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ChannelIcon } from '@/components/channel-icon';
import { Group, GroupRow, RowValue } from '@/components/form';
import { Sheet } from '@/components/sheet';
import { updateContact } from '@/db/repository';
import type { Channel } from '@/domain/types';
import { useContactUpdate } from '@/hooks/use-contact-update';
import { availableChannels, CHANNELS } from '@/services/messaging';

/** Messagerie préférée (US-17 CA4) : les messageries non installées sont grisées (CA3). */
export default function ChannelSheet() {
  const { t } = useTranslation();
  const { id, current } = useLocalSearchParams<{ id: string; current?: Channel }>();
  const save = useContactUpdate();
  const [available, setAvailable] = useState<Channel[] | null>(null);

  useEffect(() => {
    availableChannels()
      .then(setAvailable)
      .catch(() => setAvailable(['sms', 'call']));
  }, []);

  return (
    <Sheet title={t('contact.sheet.channel')} hint={t('contact.sheet.channelHint')} footer={t('contact.sheet.alwaysAvailable')}>
      <Group>
        {CHANNELS.map((channel, i) => {
          const installed = available === null || available.includes(channel);
          return (
            <View key={channel} style={!installed && styles.disabled}>
              <GroupRow
                label={t(`channel.${channel}`)}
                leading={<ChannelIcon channel={channel} />}
                accessibilityRole="radio"
                selected={channel === current}
                last={i === CHANNELS.length - 1}
                trailing={installed ? undefined : <RowValue>{t('contact.sheet.notInstalled')}</RowValue>}
                onPress={
                  installed ? () => void save((db, now) => updateContact(db, id, { preferredChannel: channel }, now)) : undefined
                }
              />
            </View>
          );
        })}
      </Group>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.4 },
});
