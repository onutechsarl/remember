import { Stack } from 'expo-router';

/** Premier lancement (écran 1) : 3 écrans, affichés une seule fois (US-01, US-02, US-03). */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, gestureEnabled: true }} />;
}
