import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/buttons';
import { DayPicker } from '@/components/day-picker';
import { Sheet } from '@/components/sheet';
import { recordInteraction } from '@/db/repository';
import { isSameLocalDay, startOfLocalDay } from '@/domain/dates';
import { useContactUpdate } from '@/hooks/use-contact-update';

/** Corriger la date du dernier échange (US-07 CA2, source `manual_edit`). */
export default function LastContactSheet() {
  const { t } = useTranslation();
  const { id, current } = useLocalSearchParams<{ id: string; current?: string }>();
  const save = useContactUpdate();
  const [today] = useState(() => startOfLocalDay(new Date()));
  const [day, setDay] = useState(() => (current ? startOfLocalDay(new Date(current)) : today));
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    const ok = await save((db, now) =>
      recordInteraction(
        db,
        {
          contactId: id,
          // Aujourd'hui : l'heure actuelle ; un autre jour : midi, pour rester dans ce jour quel que soit le fuseau.
          occurredAt: isSameLocalDay(day, now) ? now : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12),
          source: 'manual_edit',
        },
        now,
      ),
    );
    if (!ok) setSaving(false);
  };

  return (
    <Sheet title={t('contact.sheet.lastContact')} hint={t('contact.sheet.lastContactHint')}>
      <DayPicker value={day} max={today} onChange={setDay} />
      <View style={styles.button}>
        <PrimaryButton block disabled={saving} label={t('common.save')} onPress={() => void onSave()} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  button: { marginTop: 12 },
});
