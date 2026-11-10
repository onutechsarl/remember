import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Sheet } from '@/components/sheet';
import { TimePicker } from '@/components/time-picker';
import { useSettingsSheet } from '@/hooks/use-settings-sheet';

/** Heure des rappels, en heure locale (US-15 CA1, US-09 CA2). */
export default function ReminderTimeSheet() {
  const { t } = useTranslation();
  const { current } = useLocalSearchParams<{ current?: string }>();
  const [time, setTime] = useState(current ?? '18:00');
  const { save, saving } = useSettingsSheet();

  return (
    <Sheet
      title={t('settings.reminderTime')}
      hint={t('settings.reminderTimeHint')}
      confirm={{ label: t('common.save'), disabled: saving, onPress: () => void save({ reminderTime: time }) }}>
      <TimePicker value={time} onChange={setTime} />
    </Sheet>
  );
}
