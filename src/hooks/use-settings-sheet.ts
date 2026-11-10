import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import type { Settings } from '@/domain/types';

import { saveSettings } from './use-settings';

/** Enregistre depuis un panneau des réglages, puis le ferme. */
export function useSettingsSheet() {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const save = async (patch: Partial<Settings>) => {
    setSaving(true);
    try {
      await saveSettings(patch);
      router.back();
    } catch (error) {
      console.error('Réglages : enregistrement impossible', error);
      Alert.alert(t('common.error'));
      setSaving(false);
    }
  };
  return { save, saving };
}
