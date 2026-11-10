import { Stack } from 'expo-router';

export default function AddLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Ajouter des contacts' }} />
      <Stack.Screen name="settings" options={{ title: '' }} />
    </Stack>
  );
}
