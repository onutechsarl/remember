import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Remember' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="add" options={{ headerShown: false }} />
        <Stack.Screen name="contact/[id]" options={{ title: '' }} />
        <Stack.Screen name="review" options={{ presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Réglages' }} />
      </Stack>
    </ThemeProvider>
  );
}
