import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChannelIcon } from '@/components/channel-icon';
import { Group, GroupFooter, GroupHeader, GroupRow } from '@/components/form';
import { useAddFlow } from '@/hooks/add-flow';
import { useColors } from '@/theme/use-colors';

/** Panneau du choix de la messagerie habituelle : seules les messageries installées (US-17 CA1, CA3). */
export default function ChannelSheet() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const flow = useAddFlow();
  const current = flow.setupOf(id).preferredChannel;

  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: Platform.OS === 'ios' ? colors.groupedBackground : colors.background, paddingBottom: insets.bottom + 16 },
      ]}>
      <GroupHeader>{t('add.setup.channel')}</GroupHeader>
      <Group>
        {flow.channels.map((channel, i) => (
          <GroupRow
            key={channel}
            label={t(`channel.${channel}`)}
            leading={<ChannelIcon channel={channel} round={Platform.OS === 'android'} />}
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
      <GroupFooter>{t('add.setup.channelFooter')}</GroupFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { paddingHorizontal: 20, paddingTop: 8 },
});
