import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getDatabase } from '@/db/database';
import { getSettings, updateSettings } from '@/db/repository';
import type { Settings } from '@/domain/types';
import i18n, { applyLanguage } from '@/i18n';
import { setupNotificationCategories } from '@/services/notifications';
import { replan } from '@/services/planning';

/**
 * Enregistre des réglages puis replanifie les rappels (US-15). Un changement de langue s'applique
 * tout de suite aux écrans, aux boutons des notifications et aux rappels déjà programmés (US-18 CA3).
 */
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = await getDatabase();
  const settings = await updateSettings(db, patch);
  if (patch.language !== undefined) {
    await applyLanguage(settings.language);
    await setupNotificationCategories(i18n.t.bind(i18n));
  }
  await replan(db);
  return settings;
}

/** Réglages actuels, relus à chaque retour sur l'écran (après un panneau). */
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);

  const reload = useCallback(
    () =>
      getDatabase()
        .then(getSettings)
        .then(setSettings)
        .catch((error: unknown) => console.error('Réglages : lecture impossible', error)),
    [],
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { settings, setSettings, reload };
}
