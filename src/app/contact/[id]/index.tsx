import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
  Bell,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock,
  History,
  Pencil,
  Phone,
  Repeat,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ChannelIcon, channelGlyph } from '@/components/channel-icon';
import { Group, GroupHeader, GroupRow, IconBadge, ROW_HEIGHT, ROW_INSET, RowValue } from '@/components/form';
import { getDatabase } from '@/db/database';
import { archiveContact } from '@/db/repository';
import { daysBetween } from '@/domain/dates';
import type { Interaction } from '@/domain/types';
import { urgency, urgencyLevel } from '@/domain/urgency';
import { useContact, type ContactData } from '@/hooks/use-contact';
import { effectiveChannel, openConversation } from '@/services/messaging';
import { noteInteraction, replan } from '@/services/planning';
import { RADIUS } from '@/theme/radius';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';
import { formatShortDate, formatUpcoming } from '@/utils/format';
import { formatPhone } from '@/utils/phone';

/** Fiche d'un contact suivi (US-07, US-17 CA4 et CA5). */
export default function ContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const colors = useColors();
  const { state, reload } = useContact(id);
  const background = Platform.OS === 'ios' ? colors.groupedBackground : colors.background;

  const editButton = (
    <Pressable
      onPress={() => router.push({ pathname: '/contact/[id]/edit', params: { id } })}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t('contact.edit')}>
      {Platform.OS === 'ios' ? (
        <Text style={[Type.body, { color: colors.accentText }]}>{t('contact.edit')}</Text>
      ) : (
        <Pencil color={colors.text} size={22} />
      )}
    </Pressable>
  );

  return (
    <View style={[styles.screen, { backgroundColor: background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: background },
          headerShadowVisible: false,
          headerRight: state.status === 'ready' ? () => editButton : undefined,
        }}
      />
      {state.status === 'ready' ? (
        <ContactDetails data={state.data} onChanged={() => void reload()} />
      ) : (
        <View style={styles.centered}>
          {state.status === 'loading' ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={[Type.body, { color: colors.textSecondary }]}>
              {t(state.status === 'missing' ? 'contact.notFound' : 'common.loadError')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function ContactDetails({ data, onChanged }: { data: ContactData; onChanged: () => void }) {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { contact, now } = data;
  const ios = Platform.OS === 'ios';

  const days = daysBetween(contact.lastContactAt, now);
  const level = urgencyLevel(urgency(contact, now));
  const ago =
    days <= 0 ? t('contact.ago.today') : days === 1 ? t('contact.ago.yesterday') : t('contact.ago.days', { count: days });
  const status = {
    ok: { bg: colors.fill, fg: colors.textSecondary, text: t('contact.ok', { ago }) },
    late: { bg: colors.amberSoft, fg: colors.amberText, text: t('contact.late', { ago }) },
    very_late: { bg: colors.redSoft, fg: colors.redText, text: t('contact.late', { ago }) },
  }[level];

  const channel = effectiveChannel(contact.preferredChannel, data.channels);
  const channelUninstalled = channel !== contact.preferredChannel;
  const phone = contact.phoneE164;

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      onChanged();
    } catch (error) {
      console.error('Fiche contact : action impossible', error);
      Alert.alert(t('common.error'));
    }
  };

  /** « Appeler » / « Écrire » : ouvre l'application native puis note l'échange (source app_action). */
  const reachOut = (preferred: typeof channel) =>
    run(async () => {
      if (!phone) return;
      const used = await openConversation(preferred, phone, data.channels);
      await noteInteraction(await getDatabase(), { contactId: contact.id, source: 'app_action', channel: used });
    });

  const markDone = () => run(async () => noteInteraction(await getDatabase(), { contactId: contact.id, source: 'app_action' }));

  const confirmStop = () =>
    Alert.alert(t('contact.stopConfirm.title', { name: contact.displayName }), t('contact.stopConfirm.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('contact.stopConfirm.confirm'),
        style: 'destructive',
        onPress: () =>
          void (async () => {
            const db = await getDatabase();
            await archiveContact(db, contact.id, new Date());
            await replan(db);
            router.back();
          })().catch(() => Alert.alert(t('common.error'))),
      },
    ]);

  const nextReminder = data.paused
    ? t('contact.paused')
    : data.nextReminder
      ? formatUpcoming(data.nextReminder, now, i18n.language, { today: t('contact.today'), tomorrow: t('contact.tomorrow') })
      : t('contact.noReminder');

  const chevron = ios ? <ChevronRight color={colors.chevron} size={18} strokeWidth={2.5} /> : undefined;
  const open = (sheet: 'frequency' | 'channel' | 'last-contact') => () =>
    router.push({
      pathname: `/contact/[id]/${sheet}`,
      params: {
        id: contact.id,
        current: {
          frequency: String(contact.frequencyDays),
          channel: contact.preferredChannel,
          'last-contact': contact.lastContactAt.toISOString(),
        }[sheet],
      },
    });

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.identity}>
        <Avatar id={contact.id} name={contact.displayName} size={96} />
        <Text style={[Type.largeTitle, styles.name, { color: colors.text }]} accessibilityRole="header">
          {contact.displayName}
        </Text>
        {phone && <Text style={[Type.body, { color: colors.textSecondary }]}>{formatPhone(phone)}</Text>}
        <View style={[styles.status, { backgroundColor: status.bg }]}>
          <Text style={[Type.caption, { color: status.fg }]}>{status.text}</Text>
        </View>
      </View>

      {!phone && <Notice text={t('contact.invalidPhone')} />}

      <View style={styles.actions}>
        {phone && <ActionTile icon={Phone} label={t('contact.call')} onPress={() => void reachOut('call')} />}
        {phone && channel !== 'call' && (
          <ActionTile
            icon={channelGlyph(channel)}
            label={t(`channel.${channel}`)}
            onPress={() => void reachOut(channel)}
          />
        )}
        <ActionTile icon={Check} label={t('contact.done')} onPress={() => void markDone()} />
      </View>

      {channelUninstalled && (
        <Notice text={t('contact.channelFallback', { channel: t(`channel.${contact.preferredChannel}`) })} />
      )}

      <View style={styles.section}>
        <Group>
          <GroupRow
            label={t('contact.frequency')}
            leading={<IconBadge icon={Repeat} />}
            trailing={
              <>
                <RowValue>{t(`frequency.${contact.frequencyDays}`)}</RowValue>
                {chevron}
              </>
            }
            onPress={open('frequency')}
          />
          {phone && (
            <GroupRow
              label={t('contact.channel')}
              leading={<ChannelIcon channel={contact.preferredChannel} />}
              trailing={
                <>
                  <RowValue>{t(`channel.${contact.preferredChannel}`)}</RowValue>
                  {chevron}
                </>
              }
              onPress={open('channel')}
            />
          )}
          <GroupRow
            label={t('contact.lastContact')}
            leading={<IconBadge icon={History} />}
            trailing={
              <>
                <RowValue>{`${t('home.daysAgo', { count: days })} · ${t('contact.correct')}`}</RowValue>
                {chevron}
              </>
            }
            onPress={open('last-contact')}
          />
          <GroupRow
            label={t('contact.nextReminder')}
            leading={<IconBadge icon={Bell} />}
            trailing={<RowValue>{nextReminder}</RowValue>}
            last
          />
        </Group>
      </View>

      {data.history.length > 0 && (
        <>
          <GroupHeader>{t('contact.history')}</GroupHeader>
          <Group>
            {data.history.map((item, i) => (
              <HistoryRow key={item.id} item={item} last={i === data.history.length - 1} language={i18n.language} />
            ))}
          </Group>
        </>
      )}

      <View style={styles.section}>
        <Group>
          <Pressable
            onPress={confirmStop}
            accessibilityRole="button"
            style={({ pressed }) => [styles.stop, pressed && { backgroundColor: colors.fill }]}>
            <Text style={[Type.body, { color: colors.red }]}>{t('contact.stop', { name: contact.displayName })}</Text>
          </Pressable>
        </Group>
      </View>
    </ScrollView>
  );
}

function ActionTile({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1, borderRadius: RADIUS.button, borderCurve: 'continuous' },
      ]}>
      <Icon color={colors.onAccent} size={26} />
      <Text style={[Type.name, { color: colors.onAccent, fontSize: 15 }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function Notice({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View style={[styles.notice, { backgroundColor: colors.amberSoft }]}>
      <TriangleAlert color={colors.amber} size={20} />
      <Text style={[Type.secondary, styles.noticeText, { color: colors.amberText }]}>{text}</Text>
    </View>
  );
}

function HistoryRow({ item, last, language }: { item: Interaction; last: boolean; language: string }) {
  const { t } = useTranslation();

  let label: string;
  let leading: React.ReactNode;
  if (item.channel === 'call') {
    label = t('contact.called');
    leading = <ChannelIcon channel="call" />;
  } else if (item.channel) {
    label = t('contact.wroteOn', { channel: t(`channel.${item.channel}`) });
    leading = <ChannelIcon channel={item.channel} />;
  } else {
    label = t(`contact.source.${item.source}`);
    const icon = item.source === 'weekly_review' ? CalendarCheck : item.source === 'initial_estimate' ? Clock : Check;
    leading = <IconBadge icon={icon} />;
  }

  return (
    <GroupRow label={label} leading={leading} trailing={<RowValue>{formatShortDate(item.occurredAt, language)}</RowValue>} last={last} />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { paddingHorizontal: 20 },
  identity: { alignItems: 'center', gap: 6, paddingTop: 4, paddingBottom: 20 },
  name: { fontSize: 30, textAlign: 'center', marginTop: 8 },
  status: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 80, paddingHorizontal: 6 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, marginBottom: 16, marginTop: 4 },
  noticeText: { flex: 1 },
  section: { marginTop: 24 },
  stop: { paddingHorizontal: ROW_INSET, minHeight: ROW_HEIGHT, justifyContent: 'center' },
});
