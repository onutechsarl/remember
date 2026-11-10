import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContactsIllustration, OnboardingPage } from '@/components/onboarding';
import { useOnboarding } from '@/hooks/onboarding';
import { requestContactsAccess } from '@/services/contacts';

/**
 * Explication avant la demande d'accès aux contacts (US-02 CA1, CA2). Refusé ou limité, on continue :
 * l'écran d'ajout gère ces cas (message, lien vers les Réglages, « Gérer » pour l'accès limité).
 */
export default function ContactsPermissionScreen() {
  const { t } = useTranslation();
  const { completeOnboarding } = useOnboarding();
  const [asking, setAsking] = useState(false);

  const allow = async () => {
    setAsking(true);
    await requestContactsAccess().catch(() => undefined);
    setAsking(false);
    router.push('/onboarding/notifications');
  };

  return (
    <OnboardingPage
      page={1}
      illustration={<ContactsIllustration />}
      title={t('onboarding.contactsTitle')}
      body={t('onboarding.contactsBody')}
      action={{ label: t('onboarding.contactsAction'), onPress: () => void allow(), disabled: asking }}
      onSkip={() => void completeOnboarding()}
    />
  );
}
