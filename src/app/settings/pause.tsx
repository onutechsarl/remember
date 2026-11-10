import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DayPicker } from '@/components/day-picker';
import { Group, GroupRow } from '@/components/form';
import { Sheet } from '@/components/sheet';
import { addDays, daysBetween, startOfLocalDay } from '@/domain/dates';
import { useSettingsSheet } from '@/hooks/use-settings-sheet';

/**
 * Pause de tous les rappels et du bilan (US-15 CA4) : les rappels reprennent le jour choisi.
 */
export default function PauseSheet() {
  const { t } = useTranslation();
  const { current } = useLocalSearchParams<{ current?: string }>();
  const { save, saving } = useSettingsSheet();
  const [today] = useState(() => startOfLocalDay(new Date()));
  const paused = !!current && daysBetween(today, new Date(current)) > 0;
  const [pickDate, setPickDate] = useState(false);
  const [until, setUntil] = useState(() => addDays(today, 7));

  const pauseFor = (days: number) => () => void save({ pausedUntil: addDays(today, days) });

  return (
    <Sheet
      title={t('settings.pause')}
      hint={t('settings.pauseHint')}
      confirm={
        pickDate ? { label: t('settings.pauseSave'), disabled: saving, onPress: () => void save({ pausedUntil: until }) } : undefined
      }>
      <Group>
        <GroupRow
          label={t(paused ? 'settings.pauseResume' : 'settings.pauseNone')}
          accessibilityRole="radio"
          selected={!paused && !pickDate}
          onPress={() => void save({ pausedUntil: null })}
        />
        <GroupRow label={t('settings.pauseWeek')} accessibilityRole="radio" onPress={pauseFor(7)} />
        <GroupRow label={t('settings.pauseTwoWeeks')} accessibilityRole="radio" onPress={pauseFor(14)} />
        <GroupRow label={t('settings.pauseMonth')} accessibilityRole="radio" onPress={pauseFor(30)} />
        <GroupRow
          label={t('settings.pauseDate')}
          accessibilityRole="radio"
          selected={pickDate}
          onPress={() => setPickDate(true)}
          last
        />
      </Group>
      {pickDate && <DayPicker value={until} min={addDays(today, 1)} max={addDays(today, 365)} onChange={setUntil} />}
    </Sheet>
  );
}
