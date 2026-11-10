import * as Notifications from 'expo-notifications';

/**
 * ReminderScheduler — programmation des notifications locales et catégories d'actions.
 * La programmation elle-même arrive au lot 4 ; ce module expose pour l'instant l'état de l'autorisation.
 */

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

/** État de l'autorisation, sans la demander (US-03 CA2 : bandeau « Rappels désactivés »). */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  const { granted, status } = await Notifications.getPermissionsAsync();
  if (granted) return 'granted';
  return status === 'denied' ? 'denied' : 'undetermined';
}
