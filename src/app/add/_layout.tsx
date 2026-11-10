import { router, Stack } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { AddFlowProvider } from '@/hooks/add-flow';
import { Type } from '@/theme/typography';
import { useColors } from '@/theme/use-colors';

/** Ajout de contacts (écran 3) : sélection, réglages par contact, choix de la messagerie. */
export default function AddLayout() {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <AddFlowProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: colors.accentText,
          headerTitleStyle: { color: colors.text, fontFamily: Type.name.fontFamily, fontWeight: '600' },
          headerStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="index" options={{ title: t('add.title'), headerLeft: () => <CloseFlowButton /> }} />
        <Stack.Screen name="settings" />
        <Stack.Screen
          name="channel"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: 'fitToContents',
            sheetGrabberVisible: true,
            headerShown: false,
          }}
        />
      </Stack>
    </AddFlowProvider>
  );
}

/** « ‹ Retour » sur iOS, flèche sur Android : quitte l'ajout et revient à l'accueil. */
function CloseFlowButton() {
  const { t } = useTranslation();
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t('add.back')}
      style={styles.back}>
      {Platform.OS === 'ios' ? (
        <>
          <ChevronLeft color={colors.accentText} size={28} strokeWidth={2.4} style={styles.chevron} />
          <Text style={[Type.body, { color: colors.accentText }]}>{t('add.back')}</Text>
        </>
      ) : (
        <ArrowLeft color={colors.text} size={24} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center' },
  chevron: { marginLeft: -8 },
});
