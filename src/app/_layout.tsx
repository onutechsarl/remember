import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { getDatabase } from '@/db/database';
import { getSettings } from '@/db/repository';
import i18n, { applyLanguage } from '@/i18n';
import { reminderData } from '@/services/notification-responses';
import { setupNotificationCategories } from '@/services/notifications';
import { replan } from '@/services/planning';
import { useColors } from '@/theme/use-colors';

void SplashScreen.preventAutoHideAsync();

/**
 * Ouverture de la base, langue de l'utilisateur, boutons des notifications dans cette langue,
 * puis replanification des rappels (architecture.pdf, « Fonctionnement des rappels »).
 */
async function startApp(): Promise<void> {
  try {
    const db = await getDatabase();
    await applyLanguage((await getSettings(db)).language);
    await setupNotificationCategories(i18n.t.bind(i18n)).catch((error: unknown) =>
      console.error('Démarrage : catégories de notification', error),
    );
    await replan(db);
  } catch (error) {
    console.error('Démarrage : erreur', error);
    await applyLanguage('system'); // l'accueil affichera l'erreur et proposera de réessayer
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void startApp().finally(() => {
      setReady(true);
      SplashScreen.hide();
    });
  }, []);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppStack />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Toucher la notification elle-même (et non un bouton) : la fiche du contact (US-13),
 * ou le bilan pour la notification hebdomadaire.
 */
function useNotificationNavigation() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const data = reminderData(response);
    if (data?.kind === 'reminder' && data.contactId) {
      router.push({ pathname: '/contact/[id]', params: { id: data.contactId } });
    } else if (data?.kind === 'weekly_review') {
      router.push('/review');
    }
    // Sinon la réponse reviendrait au prochain démarrage.
    void Notifications.clearLastNotificationResponseAsync();
  }, [response]);
}

function AppStack() {
  const { t } = useTranslation();
  const colors = useColors();
  useNotificationNavigation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ headerShown: false }} />
      <Stack.Screen name="contact/[id]/index" options={{ title: '', headerBackTitle: t('contact.back') }} />
      <Stack.Screen name="contact/[id]/frequency" options={SHEET} />
      <Stack.Screen name="contact/[id]/channel" options={SHEET} />
      <Stack.Screen name="contact/[id]/last-contact" options={SHEET} />
      <Stack.Screen name="contact/[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="review" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen
        name="settings/index"
        options={{
          // Petit titre centré, comme l'app Réglages d'iOS.
          title: t('common.settings'),
          headerTitleAlign: 'center',
          headerBackTitle: t('settings.back'),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Platform.OS === 'ios' ? colors.groupedBackground : colors.background },
        }}
      />
      <Stack.Screen name="settings/reminder-time" options={SHEET} />
      <Stack.Screen name="settings/max-per-day" options={SHEET} />
      <Stack.Screen name="settings/pause" options={SHEET} />
      <Stack.Screen name="settings/review" options={{ ...SHEET, sheetAllowedDetents: [0.9] }} />
      <Stack.Screen name="settings/language" options={SHEET} />
    </Stack>
  );
}

/** Panneau qui monte du bas, à la hauteur de son contenu. */
const SHEET = {
  presentation: 'formSheet',
  sheetAllowedDetents: 'fitToContents',
  sheetGrabberVisible: true,
  headerShown: false,
} as const;

const styles = StyleSheet.create({
  root: { flex: 1 },
});
