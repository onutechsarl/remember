import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import type { TFunction } from 'i18next';
import { Platform } from 'react-native';

import type { Channel } from '@/domain/types';

import { CHANNELS } from './messaging';
import type { NotificationContent } from './notification-content';

/**
 * ReminderScheduler — notifications locales (architecture.pdf, « Fonctionnement des rappels »,
 * « Boutons de la notification »).
 */

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

/** Boutons des rappels : identifiants reçus dans `response.actionIdentifier`. */
export const ACTION_MESSAGE = 'message';
export const ACTION_DONE = 'done';
export const ACTION_SNOOZE = 'snooze';

/** Canal Android des rappels et du bilan. */
export const ANDROID_CHANNEL_ID = 'reminders';

/** État de l'autorisation, sans la demander (US-03 CA2 : bandeau « Rappels désactivés »). */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  const { granted, status } = await Notifications.getPermissionsAsync();
  if (granted) return 'granted';
  return status === 'denied' ? 'denied' : 'undetermined';
}

/** Affiche la demande système (après l'écran d'explication, US-03 CA1). */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  const { granted, status } = await Notifications.requestPermissionsAsync();
  if (granted) return 'granted';
  return status === 'denied' ? 'denied' : 'undetermined';
}

/**
 * Canal Android et catégories de boutons, dans la langue de l'application. À refaire à chaque
 * démarrage et à chaque changement de langue (US-18 CA3).
 *
 * Le libellé d'un bouton est fixé par catégorie : une catégorie par messagerie, plus une sans
 * bouton « Écrire » pour les contacts sans numéro (US-10 CA4).
 * « Écrire » ouvre l'application (une messagerie ne peut être ouverte que depuis le premier plan) ;
 * « C'est déjà fait » et « Plus tard » fonctionnent sans l'ouvrir (US-11 CA2, US-12 CA3).
 */
export async function setupNotificationCategories(t: TFunction): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: t('reminder.channelName'),
      importance: AndroidImportance.HIGH,
    });
  }

  const quiet = { opensAppToForeground: false, isDestructive: false, isAuthenticationRequired: false };
  const done = { identifier: ACTION_DONE, buttonTitle: t('reminder.done'), options: quiet };
  const later = { identifier: ACTION_SNOOZE, buttonTitle: t('reminder.later'), options: quiet };
  const writeTitle = (channel: Channel) =>
    channel === 'call' ? t('reminder.call') : t('reminder.write', { channel: t(`channel.${channel}`) });

  await Promise.all([
    ...CHANNELS.map((channel) =>
      Notifications.setNotificationCategoryAsync(`reminder_${channel}`, [
        {
          identifier: ACTION_MESSAGE,
          buttonTitle: writeTitle(channel),
          options: { opensAppToForeground: true, isDestructive: false, isAuthenticationRequired: false },
        },
        done,
        later,
      ]),
    ),
    Notifications.setNotificationCategoryAsync('reminder_no_phone', [done, later]),
  ]);
}

/**
 * Déclencheur à la date et à l'heure **locales** : sur iOS, un déclencheur calendaire sans fuseau,
 * pour que 18:00 reste 18:00 après un changement de fuseau (architecture.pdf, « Fuseaux horaires »).
 * Android ne propose pas ce déclencheur : on programme la date absolue, recalculée à chaque
 * replanification (ouverture de l'application, action sur une notification).
 */
function triggerAt(date: Date): Notifications.NotificationTriggerInput {
  if (Platform.OS === 'ios') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      year: date.getFullYear(),
      month: date.getMonth() + 1, // composants de date iOS : mois de 1 à 12
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      repeats: false,
    };
  }
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: ANDROID_CHANNEL_ID };
}

/**
 * Remplace toutes les notifications programmées. L'identifiant de chaque notification est celui
 * de la ligne `scheduled_reminder`, ce qui permet de retrouver le rappel depuis une réponse.
 */
export async function scheduleNotifications(items: { fireAt: Date; content: NotificationContent }[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const { fireAt, content } of items) {
    await Notifications.scheduleNotificationAsync({
      identifier: content.data.reminderId,
      content: {
        title: content.title,
        body: content.body,
        data: content.data,
        categoryIdentifier: content.categoryIdentifier,
        sound: 'default',
      },
      trigger: triggerAt(fireAt),
    });
  }
}
