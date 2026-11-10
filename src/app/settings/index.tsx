import Constants from 'expo-constants';
import { router } from 'expo-router';
import {
  Bell,
  BellRing,
  Calendar,
  CalendarCheck,
  ChevronRight,
  Clock,
  Download,
  Globe,
  Lock,
  Pause,
  RotateCcw,
  Sparkles,
  Upload,
  type LucideIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toggle } from '@/components/toggle';
import { Group, GroupHeader, GroupRow, IconBadge, RowValue } from '@/components/form';
import { getDatabase } from '@/db/database';
import { resetForReviewTest } from '@/db/repository';
import { daysBetween } from '@/domain/dates';
import { ImportError } from '@/domain/backup';
import { useOnboarding } from '@/hooks/onboarding';
import { saveSettings, useSettings } from '@/hooks/use-settings';
import { exportData, importData, pickExportFile } from '@/services/backup';
import { replan, scheduleTestReminder } from '@/services/planning';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';
import { formatShortDate, formatTime, formatWeekday } from '@/utils/format';
import { timeToDate } from '@/utils/time';

type Sheet = 'reminder-time' | 'max-per-day' | 'pause' | 'review' | 'language';

/** Réglages (écran 6 ; US-15, US-16, US-18). */
export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, setSettings, reload } = useSettings();
  const { restartOnboarding } = useOnboarding();
  const ios = Platform.OS === 'ios';
  const background = ios ? colors.groupedBackground : colors.background;

  if (!settings) {
    return (
      <View style={[styles.centered, { backgroundColor: background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const lang = i18n.language;
  const now = new Date();
  const paused = settings.pausedUntil !== null && daysBetween(now, settings.pausedUntil) > 0;
  const params: Record<Sheet, Record<string, string>> = {
    'reminder-time': { current: settings.reminderTime },
    'max-per-day': { current: String(settings.maxRemindersPerDay) },
    pause: settings.pausedUntil ? { current: settings.pausedUntil.toISOString() } : {},
    review: { weekday: String(settings.weeklyReviewWeekday), time: settings.weeklyReviewTime },
    language: { current: settings.language },
  };
  const open = (sheet: Sheet) => () => router.push({ pathname: `/settings/${sheet}`, params: params[sheet] });
  const chevron = ios ? <ChevronRight color={colors.chevron} size={18} strokeWidth={2.5} /> : undefined;
  const value = (text: string) => (
    <>
      <RowValue>{text}</RowValue>
      {chevron}
    </>
  );
  const row = (icon: LucideIcon) => <IconBadge icon={icon} />;

  const onExport = async () => {
    try {
      await exportData(await getDatabase(), t('settings.export'));
    } catch (error) {
      console.error('Export : erreur', error);
      Alert.alert(t('settings.exportError'));
    }
  };

  const onImport = async () => {
    let file;
    try {
      file = await pickExportFile();
    } catch (error) {
      const reason = error instanceof ImportError ? error.reason : null;
      Alert.alert(t(reason === 'version' ? 'settings.importVersion' : 'settings.importInvalid'));
      return;
    }
    if (!file) return;
    const count = file.contacts.length;
    Alert.alert(t('settings.importConfirm.title'), t('settings.importConfirm.body', { count }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.importConfirm.confirm'),
        style: 'destructive',
        onPress: () =>
          void (async () => {
            try {
              await importData(await getDatabase(), file);
              // La langue importée s'applique aux écrans et aux boutons des notifications.
              setSettings(await saveSettings({ language: file.settings.language }));
              Alert.alert(t('settings.importDone', { count }));
            } catch (error) {
              console.error('Import : erreur', error);
              Alert.alert(t('settings.importError'));
              void reload();
            }
          })(),
      },
    ]);
  };

  const onPrepareReview = async () => {
    const db = await getDatabase();
    await resetForReviewTest(db, new Date());
    await replan(db);
    Alert.alert(t('settings.reviewPrepared'));
  };

  const onTestReminder = async () => {
    const scheduled = await scheduleTestReminder(await getDatabase());
    Alert.alert(t(scheduled ? 'settings.testScheduled' : 'settings.testNoContact'));
  };

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
      <GroupHeader>{t('settings.reminders')}</GroupHeader>
      <Group>
        <GroupRow
          label={t('settings.reminderTime')}
          leading={row(Clock)}
          trailing={value(formatTime(timeToDate(settings.reminderTime), lang))}
          onPress={open('reminder-time')}
        />
        <GroupRow
          label={t('settings.maxPerDay')}
          leading={row(Bell)}
          trailing={value(t('settings.maxValue', { count: settings.maxRemindersPerDay }))}
          onPress={open('max-per-day')}
        />
        <GroupRow
          label={t('settings.pause')}
          leading={row(Pause)}
          trailing={value(
            paused && settings.pausedUntil
              ? t('settings.pausedUntil', { date: formatShortDate(settings.pausedUntil, lang) })
              : t('settings.pauseOff'),
          )}
          onPress={open('pause')}
          last
        />
      </Group>

      <GroupHeader>{t('settings.review')}</GroupHeader>
      <Group>
        <GroupRow
          label={t('settings.review')}
          leading={row(CalendarCheck)}
          accessibilityRole="switch"
          last={!settings.weeklyReviewEnabled}
          trailing={
            <Toggle
              value={settings.weeklyReviewEnabled}
              onValueChange={(enabled) => {
                setSettings({ ...settings, weeklyReviewEnabled: enabled });
                void saveSettings({ weeklyReviewEnabled: enabled }).then(setSettings);
              }}
              accessibilityLabel={t('settings.review')}
            />
          }
        />
        {settings.weeklyReviewEnabled && (
          <GroupRow
            label={t('settings.reviewDayTime')}
            leading={row(Calendar)}
            trailing={value(
              `${formatWeekday(settings.weeklyReviewWeekday, lang)} ${formatTime(timeToDate(settings.weeklyReviewTime), lang)}`,
            )}
            onPress={open('review')}
            last
          />
        )}
      </Group>

      <GroupHeader>{t('settings.language')}</GroupHeader>
      <Group>
        <GroupRow
          label={t('settings.language')}
          leading={row(Globe)}
          trailing={value(
            settings.language === 'system' ? t('settings.languageSystem') : t(`language.${settings.language}`),
          )}
          onPress={open('language')}
          last
        />
      </Group>

      <GroupHeader>{t('settings.data')}</GroupHeader>
      <Group>
        <GroupRow label={t('settings.export')} leading={row(Upload)} trailing={chevron} onPress={() => void onExport()} />
        <GroupRow
          label={t('settings.import')}
          leading={row(Download)}
          trailing={chevron}
          onPress={() => void onImport()}
          last
        />
      </Group>

      <View style={styles.privacy}>
        <Lock color={colors.textSecondary} size={16} />
        <Text style={[Type.caption, styles.privacyText, { color: colors.textSecondary }]}>
          {t('settings.privacy')}
          {'\n'}
          {t('settings.version', { version: Constants.expoConfig?.version ?? '' })}
        </Text>
      </View>

      {__DEV__ && (
        <>
          <GroupHeader>{t('settings.dev')}</GroupHeader>
          <Group>
            <GroupRow label={t('settings.testReminder')} leading={row(BellRing)} onPress={() => void onTestReminder()} />
            <GroupRow label={t('settings.openReview')} leading={row(CalendarCheck)} onPress={() => router.push('/review')} />
            <GroupRow label={t('settings.restartOnboarding')} leading={row(Sparkles)} onPress={() => void restartOnboarding()} />
            <GroupRow
              label={t('settings.prepareReview')}
              leading={row(RotateCcw)}
              onPress={() => void onPrepareReview()}
              last
            />
          </Group>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20 },
  privacy: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  privacyText: { flex: 1, fontWeight: '400', lineHeight: 18 },
});
