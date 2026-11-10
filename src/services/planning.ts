import {
  getSettings,
  listActiveContacts,
  recordInteraction,
  replaceFutureReminders,
  syncLastRemindedAt,
  type Db,
  type RecordInteractionInput,
} from '@/db/repository';
import { planReminders } from '@/domain/reminder-planner';
import i18n from '@/i18n';

import { availableChannels, effectiveChannel } from './messaging';
import { notificationContent } from './notification-content';
import { scheduleNotifications } from './notifications';

/**
 * Replanifie les 7 prochains jours (architecture.pdf, « Fonctionnement des rappels ») :
 * à l'ouverture de l'application et après chaque échange, report ou changement de réglage.
 * 1. recopie les rappels déjà envoyés ; 2. simule les 7 jours ; 3. enregistre les rappels ;
 * 4. reprogramme les notifications.
 */
export async function replan(db: Db, now = new Date()) {
  await syncLastRemindedAt(db, now);
  const contacts = await listActiveContacts(db);
  const settings = await getSettings(db);
  const reminders = await replaceFutureReminders(db, planReminders(contacts, settings, now), now);

  // Une erreur de programmation ne doit pas empêcher l'enregistrement d'un échange :
  // la planification est refaite à la prochaine ouverture.
  try {
    const channels = await availableChannels().catch(() => null);
    const t = i18n.t.bind(i18n);
    await scheduleNotifications(
      reminders.flatMap((reminder) => {
        const content = notificationContent(reminder, contacts, t, (c) =>
          channels ? effectiveChannel(c.preferredChannel, channels) : c.preferredChannel,
        );
        return content ? [{ fireAt: reminder.fireAt, content }] : [];
      }),
    );
  } catch (error) {
    console.error('Planification : notifications non programmées', error);
  }
  return reminders;
}

/** Note un échange puis replanifie (data-model.pdf, « Enregistrement d'un échange », étapes 1 à 5). */
export async function noteInteraction(db: Db, input: Omit<RecordInteractionInput, 'occurredAt'>, now = new Date()) {
  const contact = await recordInteraction(db, { ...input, occurredAt: now }, now);
  await replan(db, now);
  return contact;
}
