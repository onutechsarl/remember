import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Group, GroupRow, Tag } from '@/components/form';
import { Sheet } from '@/components/sheet';
import { DEFAULT_SETTINGS } from '@/domain/types';
import { useSettingsSheet } from '@/hooks/use-settings-sheet';

const CHOICES = [1, 2, 3, 4, 5] as const;

/** Nombre maximum de rappels par jour, de 1 à 5 (US-15 CA2). */
export default function MaxPerDaySheet() {
  const { t } = useTranslation();
  const current = Number(useLocalSearchParams<{ current?: string }>().current);
  const { save } = useSettingsSheet();

  return (
    <Sheet title={t('settings.maxPerDay')} footer={t('settings.maxHint')}>
      <Group>
        {CHOICES.map((count, i) => (
          <GroupRow
            key={count}
            label={t('settings.maxValue', { count })}
            accessibilityRole="radio"
            selected={count === current}
            last={i === CHOICES.length - 1}
            trailing={
              count === DEFAULT_SETTINGS.maxRemindersPerDay ? <Tag label={t('add.setup.default')} tone="accent" /> : undefined
            }
            onPress={() => void save({ maxRemindersPerDay: count })}
          />
        ))}
      </Group>
    </Sheet>
  );
}
