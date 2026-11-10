import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { NotificationIllustration, OnboardingPage } from '@/components/onboarding';
import { useOnboarding } from '@/hooks/onboarding';
import { requestNotificationPermission } from '@/services/notifications';

/**
 * Exemple de rappel, puis demande d'autorisation des notifications (US-03 CA1). « Plus tard » mène
 * à l'accueil, qui affiche alors le bandeau « Rappels désactivés » si elles sont refusées (CA2).
 */
export default function NotificationsPermissionScreen() {
  const { t } = useTranslation();
  const { completeOnboarding } = useOnboarding();
  const [asking, setAsking] = useState(false);

  const enable = async () => {
    setAsking(true);
    await requestNotificationPermission().catch(() => undefined);
    await completeOnboarding();
  };

  return (
    <OnboardingPage
      page={2}
      illustration={<NotificationIllustration />}
      title={t('onboarding.notificationsTitle')}
      body={t('onboarding.notificationsBody')}
      action={{ label: t('onboarding.notificationsAction'), onPress: () => void enable(), disabled: asking }}
      secondary={{ label: t('onboarding.later'), onPress: () => void completeOnboarding() }}
    />
  );
}
