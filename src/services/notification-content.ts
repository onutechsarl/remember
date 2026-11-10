import type { TFunction } from 'i18next';

import type { ScheduledReminder } from '@/db/mappers';
import { daysBetween } from '@/domain/dates';
import type { Channel, TrackedContact } from '@/domain/types';
import { reviewCandidates } from '@/domain/weekly-review';

/**
 * Contenu des notifications (maquettes, écran 0 ; US-09 CA4, US-10, US-14 CA1).
 * Les textes sont rédigés au moment de la programmation, dans la langue de l'application.
 */

/** Boutons d'un rappel : un par messagerie (le libellé est fixé par catégorie), plus « sans numéro ». */
export type ReminderCategory = `reminder_${Channel}` | 'reminder_no_phone';

export type NotificationContent = {
  title: string;
  body: string;
  categoryIdentifier?: ReminderCategory;
  data: { reminderId: string; contactId: string | null; kind: ScheduledReminder['kind'] };
};

/** « il y a 5 jours », « il y a 3 semaines », « il y a 2 mois ». Ne prétend pas à plus de précision. */
export function agoText(days: number, t: TFunction): string {
  if (days <= 0) return t('contact.ago.today');
  if (days === 1) return t('contact.ago.yesterday');
  if (days < 14) return t('contact.ago.days', { count: days });
  if (days < 60) return t('contact.ago.weeks', { count: Math.floor(days / 7) });
  return t('contact.ago.months', { count: Math.floor(days / 30) });
}

/**
 * Contenu d'une notification programmée, ou `null` s'il n'y a rien à dire
 * (contact supprimé entre-temps, bilan sans personne à passer en revue).
 * @param channelOf messagerie réellement utilisable pour un contact (SMS si la préférée est désinstallée).
 */
export function notificationContent(
  reminder: ScheduledReminder,
  contacts: readonly TrackedContact[],
  t: TFunction,
  channelOf: (contact: TrackedContact) => Channel,
): NotificationContent | null {
  const data = { reminderId: reminder.id, contactId: reminder.contactId, kind: reminder.kind };

  if (reminder.kind === 'reminder') {
    const contact = contacts.find((c) => c.id === reminder.contactId);
    if (!contact) return null;
    return {
      title: contact.displayName,
      body: t('reminder.reminderBody', { ago: agoText(daysBetween(contact.lastContactAt, reminder.fireAt), t) }),
      categoryIdentifier: contact.phoneE164 ? `reminder_${channelOf(contact)}` : 'reminder_no_phone',
      data,
    };
  }

  if (reminder.kind === 'weekly_review') {
    // Proches qui seront à passer en revue au moment du bilan, si rien n'est noté d'ici là.
    const count = reviewCandidates(
      contacts.filter((c) => c.archivedAt === null),
      reminder.fireAt,
    ).length;
    if (count === 0) return null;
    return { title: t('reminder.reviewTitle'), body: t('reminder.reviewBody', { count }), data };
  }

  return { title: t('reminder.reopenTitle'), body: t('reminder.reopenBody'), data };
}
