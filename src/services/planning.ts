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

/**
 * Replanifie les 7 prochains jours (architecture.pdf, « Fonctionnement des rappels ») :
 * à l'ouverture de l'application et après chaque échange, report ou changement de réglage.
 * Lot 4 : programmer ensuite les notifications correspondantes avec expo-notifications.
 */
export async function replan(db: Db, now = new Date()) {
  await syncLastRemindedAt(db, now);
  const contacts = await listActiveContacts(db);
  const settings = await getSettings(db);
  return replaceFutureReminders(db, planReminders(contacts, settings, now), now);
}

/** Note un échange puis replanifie (data-model.pdf, « Enregistrement d'un échange », étapes 1 à 5). */
export async function noteInteraction(db: Db, input: Omit<RecordInteractionInput, 'occurredAt'>, now = new Date()) {
  const contact = await recordInteraction(db, { ...input, occurredAt: now }, now);
  await replan(db, now);
  return contact;
}
