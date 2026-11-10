import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';

import { Group, GroupHeader, GroupRow } from '@/components/form';
import { Sheet } from '@/components/sheet';
import { TimePicker } from '@/components/time-picker';
import { useSettingsSheet } from '@/hooks/use-settings-sheet';
import { formatWeekday } from '@/utils/format';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** Jour et heure du bilan hebdomadaire (US-15 CA3, US-14 CA1). */
export default function ReviewTimeSheet() {
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ weekday?: string; time?: string }>();
  const [weekday, setWeekday] = useState(Number(params.weekday ?? 7));
  const [time, setTime] = useState(params.time ?? '18:00');
  const { save, saving } = useSettingsSheet();

  return (
    <ScrollView>
      <Sheet
        title={t('settings.reviewDayTime')}
        confirm={{
          label: t('common.save'),
          disabled: saving,
          onPress: () => void save({ weeklyReviewWeekday: weekday, weeklyReviewTime: time }),
        }}>
        <GroupHeader>{t('settings.reviewDay')}</GroupHeader>
        <Group>
          {WEEKDAYS.map((day, i) => (
            <GroupRow
              key={day}
              label={formatWeekday(day, i18n.language, 'long')}
              accessibilityRole="radio"
              selected={day === weekday}
              last={i === WEEKDAYS.length - 1}
              onPress={() => setWeekday(day)}
            />
          ))}
        </Group>
        <GroupHeader>{t('settings.reviewTime')}</GroupHeader>
        <TimePicker value={time} onChange={setTime} />
      </Sheet>
    </ScrollView>
  );
}
