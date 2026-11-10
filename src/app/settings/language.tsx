import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Group, GroupRow, RowValue } from '@/components/form';
import { Sheet } from '@/components/sheet';
import type { Settings } from '@/domain/types';
import { useSettingsSheet } from '@/hooks/use-settings-sheet';
import { resolveLanguage } from '@/i18n';

const CHOICES: readonly Settings['language'][] = ['system', 'fr', 'en'];

/** Langue de l'application (US-18 CA2, CA3). Les noms des langues restent dans leur propre langue. */
export default function LanguageSheet() {
  const { t } = useTranslation();
  const current = (useLocalSearchParams<{ current?: Settings['language'] }>().current ?? 'system') as Settings['language'];
  const { save } = useSettingsSheet();
  const native = { fr: 'Français', en: 'English' } as const;

  return (
    <Sheet title={t('settings.language')} footer={t('settings.languageHint')}>
      <Group>
        {CHOICES.map((choice, i) => (
          <GroupRow
            key={choice}
            label={choice === 'system' ? t('settings.languageSystem') : native[choice]}
            accessibilityRole="radio"
            selected={choice === current}
            last={i === CHOICES.length - 1}
            trailing={choice === 'system' ? <RowValue>{native[resolveLanguage('system')]}</RowValue> : undefined}
            onPress={() => void save({ language: choice })}
          />
        ))}
      </Group>
    </Sheet>
  );
}
