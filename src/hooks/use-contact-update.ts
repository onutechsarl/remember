import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { getDatabase } from '@/db/database';
import type { Db } from '@/db/repository';
import { replan } from '@/services/planning';

/** Exécute une modification depuis un panneau de la fiche, replanifie les rappels puis ferme le panneau. */
export function useContactUpdate() {
  const { t } = useTranslation();
  return async (change: (db: Db, now: Date) => Promise<unknown>): Promise<boolean> => {
    try {
      const db = await getDatabase();
      const now = new Date();
      await change(db, now);
      await replan(db, now);
      router.back();
      return true;
    } catch (error) {
      console.error('Fiche contact : modification impossible', error);
      Alert.alert(t('common.error'));
      return false;
    }
  };
}
