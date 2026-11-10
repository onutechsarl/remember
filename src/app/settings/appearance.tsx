import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Group, GroupRow } from '@/components/form';
import { Sheet } from '@/components/sheet';
import type { Settings } from '@/domain/types';
import { useSettingsSheet } from '@/hooks/use-settings-sheet';

const CHOICES: readonly Settings['appearance'][] = ['system', 'light', 'dark'];

/** Mode clair ou sombre : « Automatique » (par défaut) suit le réglage du téléphone. */
export default function AppearanceSheet() {
  const { t } = useTranslation();
  const current = (useLocalSearchParams<{ current?: Settings['appearance'] }>().current ?? 'system') as Settings['appearance'];
  const { save } = useSettingsSheet();

  return (
    <Sheet title={t('settings.appearance')} footer={t('settings.appearanceHint')}>
      <Group>
        {CHOICES.map((choice, i) => (
          <GroupRow
            key={choice}
            label={t(`settings.appearance_${choice}`)}
            accessibilityRole="radio"
            selected={choice === current}
            last={i === CHOICES.length - 1}
            onPress={() => void save({ appearance: choice })}
          />
        ))}
      </Group>
    </Sheet>
  );
}
