import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Group, GroupRow, Tag } from '@/components/form';
import { Sheet } from '@/components/sheet';
import { updateContact } from '@/db/repository';
import type { FrequencyDays } from '@/domain/types';
import { DEFAULT_FREQUENCY, FREQUENCIES } from '@/hooks/add-flow';
import { useContactUpdate } from '@/hooks/use-contact-update';

/** Modifier la fréquence d'un contact (US-05 CA4). */
export default function FrequencySheet() {
  const { t } = useTranslation();
  const { id, current } = useLocalSearchParams<{ id: string; current?: string }>();
  const save = useContactUpdate();
  const selected = Number(current) as FrequencyDays;

  return (
    <Sheet title={t('contact.sheet.frequency')}>
      <Group>
        {FREQUENCIES.map((days, i) => (
          <GroupRow
            key={days}
            label={t(`frequency.${days}`)}
            accessibilityRole="radio"
            selected={days === selected}
            last={i === FREQUENCIES.length - 1}
            trailing={days === DEFAULT_FREQUENCY ? <Tag label={t('add.setup.default')} tone="accent" /> : undefined}
            onPress={() => void save((db, now) => updateContact(db, id, { frequencyDays: days }, now))}
          />
        ))}
      </Group>
    </Sheet>
  );
}
