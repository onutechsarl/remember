import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OnboardingPage, WelcomeIllustration } from '@/components/onboarding';
import { useOnboarding } from '@/hooks/onboarding';

/** Présentation (US-01) : le message clé, et « Passer » pour aller directement à l'app. */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { completeOnboarding } = useOnboarding();
  return (
    <OnboardingPage
      page={0}
      illustration={<WelcomeIllustration />}
      title={t('onboarding.welcomeTitle')}
      body={t('onboarding.welcomeBody')}
      action={{ label: t('onboarding.continue'), onPress: () => router.push('/onboarding/contacts') }}
      onSkip={() => void completeOnboarding()}
    />
  );
}
