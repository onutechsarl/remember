import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { getDatabase } from '@/db/database';
import { getSettings } from '@/db/repository';
import { applyLanguage } from '@/i18n';
import { replan } from '@/services/planning';

void SplashScreen.preventAutoHideAsync();

/** Ouverture de la base, langue de l'utilisateur, puis replanification des rappels (architecture.pdf). */
async function startApp(): Promise<void> {
  try {
    const db = await getDatabase();
    await applyLanguage((await getSettings(db)).language);
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

function AppStack() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ headerShown: false }} />
      <Stack.Screen name="contact/[id]" options={{ title: '' }} />
      <Stack.Screen name="review" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: t('common.settings') }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
