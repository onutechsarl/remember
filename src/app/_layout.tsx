import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { getDatabase } from '@/db/database';
import { getSettings, updateSettings } from '@/db/repository';
import { OnboardingContext } from '@/hooks/onboarding';
import i18n, { applyLanguage } from '@/i18n';
import { reminderData } from '@/services/notification-responses';
import { setupNotificationCategories } from '@/services/notifications';
import { replan } from '@/services/planning';
import { applyAppearance } from '@/theme/appearance';
import { useColors } from '@/theme/use-colors';

void SplashScreen.preventAutoHideAsync();

/**
 * Ouverture de la base, langue de l'utilisateur, boutons des notifications dans cette langue,
 * puis replanification des rappels (architecture.pdf, « Fonctionnement des rappels »).
 * Renvoie vrai si le premier lancement a déjà été fait.
 */
async function startApp(): Promise<boolean> {
  try {
    const db = await getDatabase();
    const settings = await getSettings(db);
    applyAppearance(settings.appearance);
    await applyLanguage(settings.language);
    await setupNotificationCategories(i18n.t.bind(i18n)).catch((error: unknown) =>
      console.error('Démarrage : catégories de notification', error),
    );
    await replan(db);
    return settings.onboardingCompleted;
  } catch (error) {
    console.error('Démarrage : erreur', error);
    await applyLanguage('system'); // l'accueil affichera l'erreur et proposera de réessayer
    return true;
  }
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    void startApp().then((done) => {
      setOnboarded(done);
      SplashScreen.hide();
    });
  }, []);

  if (onboarded === null) return null;

  const completeOnboarding = async () => {
    try {
      await updateSettings(await getDatabase(), { onboardingCompleted: true });
    } catch (error) {
      console.error('Premier lancement : non enregistré', error);
    }
    setOnboarded(true);
  };

  const restartOnboarding = async () => {
    await updateSettings(await getDatabase(), { onboardingCompleted: false });
    setOnboarded(false);
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <OnboardingContext.Provider value={{ completeOnboarding, restartOnboarding }}>
          <AppStack onboarded={onboarded} />
        </OnboardingContext.Provider>
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

/**
 * Premier lancement (US-01) : tant qu'il n'est pas terminé, seul l'onboarding est accessible ;
 * ensuite, il ne l'est plus (routes protégées d'Expo Router).
 */
function AppStack({ onboarded }: { onboarded: boolean }) {
  const { t } = useTranslation();
  const colors = useColors();
  useNotificationNavigation();
  return (
    <Stack>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={onboarded}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
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
        <Stack.Screen name="settings/appearance" options={SHEET} />
      </Stack.Protected>
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
