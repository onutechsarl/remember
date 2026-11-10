import { addDays, atLocalTime, daysBetween, isoWeekday, startOfLocalDay } from './dates';
import type { Settings, TrackedContact } from './types';
import { sortByUrgency, urgency } from './urgency';

/** Nombre de jours simulés à chaque planification (architecture.pdf, « 7 jours glissants »). */
export const PLANNING_DAYS = 7;

export type ReminderKind = 'reminder' | 'weekly_review' | 'reopen';

export type PlannedReminder = {
  /** null pour le bilan hebdomadaire et la relance d'ouverture. */
  contactId: string | null;
  /**
   * - `reminder` : rappel pour un contact ;
   * - `weekly_review` : bilan hebdomadaire ;
   * - `reopen` : dernière notification du cycle, qui invite à ouvrir l'application
   *   pour relancer la planification (« Faites le point sur vos proches »).
   */
  kind: ReminderKind;
  fireAt: Date;
};

type EligibilitySettings = Pick<Settings, 'minDaysBetweenReminders' | 'pausedUntil'>;

/** `date` est vide ou tombe au plus tard le jour `day` (comparaison en jours locaux). */
function isOnOrBefore(date: Date | null, day: Date): boolean {
  return date === null || daysBetween(date, day) >= 0;
}

/**
 * Un contact peut-il recevoir un rappel le jour `day` ?
 * (data-model.pdf, « Éligibilité à un rappel », conditions 1 à 5)
 */
export function isEligibleForReminder(
  contact: TrackedContact,
  settings: EligibilitySettings,
  day: Date,
  lastRemindedAt: Date | null = contact.lastRemindedAt,
): boolean {
  return (
    contact.archivedAt === null &&
    urgency(contact, day) >= 1 &&
    isOnOrBefore(contact.snoozedUntil, day) &&
    (lastRemindedAt === null || daysBetween(lastRemindedAt, day) >= settings.minDaysBetweenReminders) &&
    isOnOrBefore(settings.pausedUntil, day)
  );
}

/**
 * Simule les 7 prochains jours et renvoie les notifications à programmer, triées par date
 * (architecture.pdf, « Fonctionnement des rappels » ; data-model.pdf, « Éligibilité à un rappel »).
 *
 * La simulation suppose que l'utilisateur ne réagit à aucun rappel : chaque action
 * sur une notification relance de toute façon la planification.
 */
export function planReminders(contacts: TrackedContact[], settings: Settings, now: Date): PlannedReminder[] {
  const active = contacts.filter((c) => c.archivedAt === null);
  if (active.length === 0) return [];

  const planned: PlannedReminder[] = [];
  const simulatedLastReminded = new Map(active.map((c) => [c.id, c.lastRemindedAt]));
  const today = startOfLocalDay(now);

  for (let offset = 0; offset < PLANNING_DAYS; offset++) {
    const day = addDays(today, offset);

    const fireAt = atLocalTime(day, settings.reminderTime);
    if (fireAt > now) {
      const eligible = active.filter((c) =>
        isEligibleForReminder(c, settings, day, simulatedLastReminded.get(c.id) ?? null),
      );
      for (const contact of sortByUrgency(eligible, day).slice(0, settings.maxRemindersPerDay)) {
        planned.push({ contactId: contact.id, kind: 'reminder', fireAt });
        simulatedLastReminded.set(contact.id, day);
      }
    }

    const reviewAt = atLocalTime(day, settings.weeklyReviewTime);
    if (
      settings.weeklyReviewEnabled &&
      isoWeekday(day) === settings.weeklyReviewWeekday &&
      reviewAt > now &&
      isOnOrBefore(settings.pausedUntil, day)
    ) {
      planned.push({ contactId: null, kind: 'weekly_review', fireAt: reviewAt });
    }
  }

  // Si rien ne relance la planification pendant 7 jours, cette notification la relance.
  const reopenDay = addDays(today, PLANNING_DAYS);
  if (isOnOrBefore(settings.pausedUntil, reopenDay)) {
    planned.push({ contactId: null, kind: 'reopen', fireAt: atLocalTime(reopenDay, settings.reminderTime) });
  }

  return planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
