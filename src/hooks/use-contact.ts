import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getDatabase } from '@/db/database';
import { getContact, getSettings, listInteractions, nextReminderFor } from '@/db/repository';
import { daysBetween } from '@/domain/dates';
import type { Channel, Interaction, TrackedContact } from '@/domain/types';
import { availableChannels } from '@/services/messaging';

/** Nombre d'échanges affichés dans l'historique de la fiche (US-07 CA4). */
export const HISTORY_SIZE = 10;

export type ContactData = {
  now: Date;
  contact: TrackedContact;
  history: Interaction[];
  nextReminder: Date | null;
  /** Rappels en pause aujourd'hui (US-15 CA4). */
  paused: boolean;
  /** Messageries installées (US-17 CA3, CA5). */
  channels: Channel[];
};

type State = { status: 'loading' } | { status: 'missing' } | { status: 'error' } | { status: 'ready'; data: ContactData };

async function loadContact(id: string): Promise<ContactData | null> {
  const db = await getDatabase();
  const now = new Date();
  const contact = await getContact(db, id);
  if (!contact || contact.archivedAt) return null;
  const settings = await getSettings(db);
  return {
    now,
    contact,
    history: await listInteractions(db, { contactId: id, limit: HISTORY_SIZE }),
    nextReminder: await nextReminderFor(db, id, now),
    paused: settings.pausedUntil !== null && daysBetween(now, settings.pausedUntil) > 0,
    channels: await availableChannels(),
  };
}

/** Données de la fiche, rechargées au retour sur l'écran (après un panneau) et au premier plan. */
export function useContact(id: string) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const reload = useCallback(
    () =>
      loadContact(id)
        .then((data) => setState(data ? { status: 'ready', data } : { status: 'missing' }))
        .catch((error: unknown) => {
          console.error('Fiche contact : chargement impossible', error);
          setState({ status: 'error' });
        }),
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => next === 'active' && void reload());
    return () => subscription.remove();
  }, [reload]);

  return { state, reload };
}
