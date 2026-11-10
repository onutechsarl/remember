import { Redirect, router, Stack, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChannelIcon } from '@/components/channel-icon';
import { PrimaryButton, TextButton } from '@/components/buttons';
import { Group, GroupFooter, GroupHeader, GroupRow, OptionCard, Tag } from '@/components/form';
import { getDatabase } from '@/db/database';
import { addContacts } from '@/db/repository';
import type { LastContactAnswer } from '@/domain/initial-estimate';
import { DEFAULT_FREQUENCY, FREQUENCIES, useAddFlow, type ContactSetup } from '@/hooks/add-flow';
import { defaultChannel } from '@/services/messaging';
import { getNotificationPermission, requestNotificationPermission } from '@/services/notifications';
import { replan } from '@/services/planning';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

const ANSWERS: readonly LastContactAnswer[] = ['this_week', 'this_month', 'longer', 'unknown'];

/**
 * Réglages d'un contact, un écran par contact sélectionné (US-05, US-06, US-17).
 * Chaque étape est un écran de la pile : le retour natif revient au contact précédent.
 */
export default function ContactSetupScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const flow = useAddFlow();
  const step = Number(useLocalSearchParams<{ step: string }>().step ?? 0);
  const [applyAll, setApplyAll] = useState(false);
  const [saving, setSaving] = useState(false);

  const contact = flow.selected[step];
  if (!contact) return <Redirect href="/add" />;

  const total = flow.selected.length;
  const isLast = step === total - 1;
  const setup = flow.setupOf(contact.deviceContactId);
  const update = (patch: Partial<ContactSetup>) => flow.updateSetup([contact.deviceContactId], patch);
  const ios = Platform.OS === 'ios';

  /** Enregistre tous les contacts sélectionnés ; `overrides` complète les réglages pas encore pris en compte. */
  const finish = async (overrides: Record<string, Partial<ContactSetup>> = {}) => {
    setSaving(true);
    try {
      const db = await getDatabase();
      const now = new Date();
      await addContacts(
        db,
        flow.selected.map((c) => {
          const s = { ...flow.setupOf(c.deviceContactId), ...overrides[c.deviceContactId] };
          return {
            deviceContactId: c.deviceContactId,
            displayName: c.name,
            phoneE164: c.phoneE164,
            frequencyDays: s.frequencyDays,
            preferredChannel: s.preferredChannel,
            lastContactAnswer: s.lastContactAnswer ?? 'unknown',
          };
        }),
        now,
      );
      await replan(db, now);
      // Premier ajout : les rappels passent par les notifications (US-03). L'écran d'explication
      // du premier lancement les demandera avant ; ici, on rattrape le cas où il a été passé.
      if ((await getNotificationPermission()) === 'undetermined') await requestNotificationPermission();
      flow.setSelected([]);
      router.dismissTo('/');
    } catch (error) {
      console.error('Ajout de contacts : erreur', error);
      Alert.alert(t('add.setup.saveError'));
      setSaving(false);
    }
  };

  const goNext = (overrides: Record<string, Partial<ContactSetup>> = {}) => {
    if (isLast) void finish(overrides);
    else router.push({ pathname: '/add/settings', params: { step: String(step + 1) } });
  };

  const onNext = () => {
    if (!applyAll) return goNext();
    // « Appliquer à tous » : fréquence et messagerie reportées sur les contacts suivants, puis fin de l'ajout (US-05 CA3, US-17 CA2).
    const shared = { frequencyDays: setup.frequencyDays, preferredChannel: setup.preferredChannel };
    const remaining = flow.selected.slice(step + 1).map((c) => c.deviceContactId);
    flow.updateSetup(remaining, shared);
    void finish(Object.fromEntries(remaining.map((id) => [id, shared])));
  };

  const onSkip = () => {
    // « Passer cette étape » : « Je ne sais pas » et valeurs par défaut (US-06 CA4).
    const defaults = { frequencyDays: DEFAULT_FREQUENCY, lastContactAnswer: null, preferredChannel: defaultChannel(flow.channels) };
    update(defaults);
    goNext({ [contact.deviceContactId]: defaults });
  };

  const background = ios ? colors.groupedBackground : colors.background;

  return (
    <View style={[styles.screen, { backgroundColor: background }]}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: background },
          headerTitleAlign: ios ? 'center' : 'left',
          headerTitle: () => (
            <View style={ios ? styles.titleCenter : undefined}>
              <Text style={[Type.name, { color: colors.text, fontSize: ios ? 17 : 22 }]} numberOfLines={1}>
                {contact.name}
              </Text>
              <Text style={[Type.caption, { color: colors.textSecondary, fontWeight: '400' }]}>
                {t(ios ? 'add.setup.step' : 'add.setup.stepAndroid', { current: step + 1, total })}
              </Text>
            </View>
          ),
        }}
      />
      <View style={[styles.progressTrack, { backgroundColor: ios ? colors.separator : colors.accentSoft }]}>
        <View style={[styles.progress, { width: `${((step + 1) / total) * 100}%`, backgroundColor: colors.accent }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GroupHeader>{t('add.setup.frequency')}</GroupHeader>
        <Group>
          {FREQUENCIES.map((days, i) => (
            <GroupRow
              key={days}
              label={t(`frequency.${days}`)}
              accessibilityRole="radio"
              selected={setup.frequencyDays === days}
              last={i === FREQUENCIES.length - 1}
              onPress={() => update({ frequencyDays: days })}
              trailing={days === DEFAULT_FREQUENCY ? <Tag label={t('add.setup.default')} tone="accent" /> : undefined}
            />
          ))}
        </Group>

        <GroupHeader>{t('add.setup.lastContact')}</GroupHeader>
        <View style={ios ? styles.cards : styles.chips}>
          {ANSWERS.map((answer) => (
            <View key={answer} style={ios ? styles.cardCell : undefined}>
              <OptionCard
                label={t(`add.setup.answer.${answer}`)}
                selected={setup.lastContactAnswer === answer}
                onPress={() => update({ lastContactAnswer: answer })}
              />
            </View>
          ))}
        </View>

        <GroupHeader>{t('add.setup.channel')}</GroupHeader>
        {contact.phoneE164 ? (
          <>
            <Group>
              <GroupRow
                label={t(`channel.${setup.preferredChannel}`)}
                leading={<ChannelIcon channel={setup.preferredChannel} />}
                trailing={
                  ios ? <ChevronRight color={colors.textSecondary} size={20} /> : <ChevronDown color={colors.text} size={22} />
                }
                last
                onPress={() => router.push({ pathname: '/add/channel', params: { id: contact.deviceContactId } })}
              />
            </Group>
            <GroupFooter>{t('add.setup.channelFooter')}</GroupFooter>
          </>
        ) : (
          <GroupFooter>{t('add.setup.noPhoneFooter')}</GroupFooter>
        )}

        {step < total - 1 && (
          <View style={styles.applyAll}>
            <Group>
              <GroupRow
                label={t('add.setup.applyAll')}
                accessibilityRole="switch"
                last
                onPress={() => setApplyAll((v) => !v)}
                trailing={
                  <Switch
                    value={applyAll}
                    onValueChange={setApplyAll}
                    trackColor={{ true: colors.accent, false: colors.fill }}
                    accessibilityLabel={t('add.setup.applyAll')}
                  />
                }
              />
            </Group>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <PrimaryButton
          block
          disabled={saving}
          label={t(isLast || applyAll ? 'add.setup.finish' : 'add.setup.next')}
          onPress={onNext}
        />
        <TextButton label={t('add.setup.skip')} onPress={onSkip} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  titleCenter: { alignItems: 'center' },
  progressTrack: { height: 4, borderRadius: 2, marginHorizontal: 20, overflow: 'hidden' },
  progress: { height: 4, borderRadius: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardCell: { width: '47%', flexGrow: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 4 },
  applyAll: { marginTop: 24 },
  footer: { paddingHorizontal: 20, paddingTop: 8, gap: 4 },
});
