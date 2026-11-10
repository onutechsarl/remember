import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

import { getDatabase } from '@/db/database';
import { getContact, getReminder, getSettings, snoozeContactReminder } from '@/db/repository';
import { applyLanguage } from '@/i18n';

import { availableChannels, conversationUrl, effectiveChannel } from './messaging';
import type { NotificationContent } from './notification-content';
import { ACTION_DONE, ACTION_MESSAGE, ACTION_SNOOZE } from './notifications';
import { noteInteraction, replan } from './planning';

/**
 * Réponses aux boutons des rappels (US-10, US-11, US-12). Une même réponse peut arriver par
 * plusieurs chemins (écouteur, tâche Android, dernière réponse au démarrage) : elle n'est
 * traitée qu'une fois, grâce à `scheduled_reminder.action` et à la liste ci-dessous.
 */
const inProgress = new Set<string>();

type ResponseLike = Pick<Notifications.NotificationResponse, 'actionIdentifier' | 'notification'>;

export function reminderData(response: ResponseLike): NotificationContent['data'] | null {
  const data = response.notification.request.content.data as Partial<NotificationContent['data']> | undefined;
  if (!data?.reminderId || !data.kind) return null;
  return { reminderId: data.reminderId, contactId: data.contactId ?? null, kind: data.kind };
}

/** Traite un bouton « Écrire », « C'est déjà fait » ou « Plus tard ». Les touchers simples sont ignorés ici. */
export async function handleReminderAction(response: ResponseLike): Promise<void> {
  const action = response.actionIdentifier;
  const data = reminderData(response);
  if (![ACTION_MESSAGE, ACTION_DONE, ACTION_SNOOZE].includes(action) || !data?.contactId) return;

  const key = `${data.reminderId}:${action}`;
  if (inProgress.has(key)) return;
  inProgress.add(key);

  try {
    const db = await getDatabase();
    if ((await getReminder(db, data.reminderId))?.action) return; // déjà traitée
    // Peut s'exécuter sans interface (tâche Android) : la langue sert aux notifications reprogrammées.
    await applyLanguage((await getSettings(db)).language);
    const now = new Date();

    if (action === ACTION_DONE) {
      await noteInteraction(db, { contactId: data.contactId, source: 'notification_done', reminderId: data.reminderId }, now);
    } else if (action === ACTION_SNOOZE) {
      await snoozeContactReminder(db, data.contactId, now, data.reminderId);
      await replan(db, now);
    } else {
      const contact = await getContact(db, data.contactId);
      if (!contact?.phoneE164) return;
      const channel = effectiveChannel(contact.preferredChannel, await availableChannels());
      // L'échange est noté avant d'ouvrir la messagerie (data-model.pdf, diagramme « Écrire sur WhatsApp »).
      await noteInteraction(
        db,
        { contactId: contact.id, source: 'notification_message', channel, reminderId: data.reminderId },
        now,
      );
      await Linking.openURL(conversationUrl(channel, contact.phoneE164));
    }

    // Android ne retire pas la notification après un bouton (US-11 CA3).
    await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => undefined);
  } catch (error) {
    console.error('Notification : action non traitée', error);
  } finally {
    inProgress.delete(key);
  }
}
