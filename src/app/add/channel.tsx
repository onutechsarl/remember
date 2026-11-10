import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ChannelIcon } from '@/components/channel-icon';
import { Group, GroupRow } from '@/components/form';
import { Sheet } from '@/components/sheet';
import { useAddFlow } from '@/hooks/add-flow';

/** Panneau du choix de la messagerie habituelle : seules les messageries installées (US-17 CA1, CA3). */
export default function ChannelSheet() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const flow = useAddFlow();
  const current = flow.setupOf(id).preferredChannel;

  return (
    <Sheet title={t('add.setup.channel')} footer={t('add.setup.channelFooter')}>
      <Group>
        {flow.channels.map((channel, i) => (
          <GroupRow
            key={channel}
            label={t(`channel.${channel}`)}
            leading={<ChannelIcon channel={channel} />}
            accessibilityRole="radio"
            selected={channel === current}
            last={i === flow.channels.length - 1}
            onPress={() => {
              flow.updateSetup([id], { preferredChannel: channel });
              router.back();
            }}
          />
        ))}
      </Group>
    </Sheet>
  );
}
