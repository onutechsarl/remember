import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getDatabase } from '@/db/database';
import { getSettings, listActiveContacts } from '@/db/repository';
import type { TrackedContact } from '@/domain/types';
import { sortByUrgency, urgency } from '@/domain/urgency';
import { isReviewAvailable, reviewCandidates } from '@/domain/weekly-review';
import { noteInteraction } from '@/services/planning';
import { getNotificationPermission } from '@/services/notifications';

export type HomeData = {
  now: Date;
  /** « À recontacter » : urgence ≥ 1, la plus forte d'abord (US-08 CA2, CA3). */
  due: TrackedContact[];
  /** « Tout va bien » : contacts à jour. */
  ok: TrackedContact[];
  /** Nombre de proches du bilan, ou 0 si le bouton du bilan est masqué (US-14 CA7). */
  reviewCount: number;
  notificationsDenied: boolean;
};

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: HomeData };

async function loadHomeData(): Promise<HomeData> {
  const db = await getDatabase();
  const now = new Date();
  const [contacts, settings, permission] = [
    await listActiveContacts(db),
    await getSettings(db),
    await getNotificationPermission().catch(() => 'undetermined' as const),
  ];
  const sorted = sortByUrgency(contacts, now);
  const candidates = reviewCandidates(contacts, now).length;
  return {
    now,
    due: sorted.filter((c) => urgency(c, now) >= 1),
    ok: sorted.filter((c) => urgency(c, now) < 1),
    reviewCount: isReviewAvailable(settings, candidates, now) ? candidates : 0,
    notificationsDenied: permission === 'denied',
  };
}

/**
 * Données de l'accueil, rechargées quand l'écran reprend le focus
 * et quand l'application revient au premier plan (nouveau jour, autorisation modifiée).
 */
export function useHomeData() {
  const [state, setState] = useState<State>({ status: 'loading' });

  const reload = useCallback(async () => {
    try {
      setState({ status: 'ready', data: await loadHomeData() });
    } catch (error) {
      console.error('Accueil : chargement impossible', error);
      setState({ status: 'error' });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void reload();
    });
    return () => subscription.remove();
  }, [reload]);

  const markDone = useCallback(
    async (contactId: string) => {
      const db = await getDatabase();
      await noteInteraction(db, { contactId, source: 'app_action' });
      await reload();
    },
    [reload],
  );

  return { state, reload, markDone };
}
