/**
 * Mise en place des notifications, chargée avant tout le reste (point d'entrée index.ts) :
 * c'est ce module que le système exécute quand l'utilisateur touche un bouton app fermée
 * (risque R1, architecture.pdf).
 *
 * - Android : un bouton touché app en arrière-plan ou fermée lance la tâche ci-dessous.
 * - iOS : l'application est réveillée en arrière-plan et reçoit la réponse par l'écouteur ;
 *   si elle arrive avant l'écouteur, on la récupère avec la dernière réponse.
 */
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { handleReminderAction } from '@/services/notification-responses';

const NOTIFICATION_TASK = 'remember-notification-actions';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Android seulement : sur iOS, `registerTaskAsync` sert aux notifications push en arrière-plan
// (mode `remote-notification`), que Remember n'utilise pas ; les boutons y passent par l'écouteur.
if (Platform.OS === 'android') {
  TaskManager.defineTask<Notifications.NotificationTaskPayload>(NOTIFICATION_TASK, async ({ data, error }) => {
    if (error || !data || !('actionIdentifier' in data)) return;
    await handleReminderAction(data);
  });

  Notifications.registerTaskAsync(NOTIFICATION_TASK).catch((error: unknown) =>
    console.error('Notifications : tâche non enregistrée', error),
  );
}

Notifications.addNotificationResponseReceivedListener((response) => {
  void handleReminderAction(response);
});

const last = Notifications.getLastNotificationResponse();
if (last) void handleReminderAction(last);
