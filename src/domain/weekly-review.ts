import { addDays, atLocalTime, daysBetween, isoWeekday, startOfLocalDay } from './dates';
import type { Settings, TrackedContact } from './types';
import { sortByUrgency, urgency } from './urgency';

/** Nombre maximum de cartes par bilan (US-14 CA6). */
export const MAX_REVIEW_CARDS = 20;

/** Un contact dont la date n'a pas bougé depuis ce nombre de jours passe au bilan (US-14 CA2). */
export const REVIEW_MIN_DAYS = 7;

/** Contacts à passer en revue, les plus urgents d'abord (US-14 CA2 et CA6). */
export function reviewCandidates<T extends TrackedContact>(contacts: T[], today: Date): T[] {
  const candidates = contacts.filter(
    (c) => c.archivedAt === null && daysBetween(c.lastContactAt, today) >= REVIEW_MIN_DAYS,
  );
  return sortByUrgency(candidates, today).slice(0, MAX_REVIEW_CARDS);
}

/** Dernier moment prévu pour le bilan (jour et heure des réglages) avant `now`. */
export function lastScheduledReviewAt(settings: Pick<Settings, 'weeklyReviewWeekday' | 'weeklyReviewTime'>, now: Date): Date {
  const daysSince = (isoWeekday(now) - settings.weeklyReviewWeekday + 7) % 7;
  const moment = atLocalTime(addDays(startOfLocalDay(now), -daysSince), settings.weeklyReviewTime);
  return moment > now ? atLocalTime(addDays(moment, -7), settings.weeklyReviewTime) : moment;
}

/**
 * Le bouton du bilan est-il affiché sur l'accueil ? (US-14 CA7) Oui à partir du moment prévu
 * pour le bilan, tant qu'il n'a pas été fait et qu'il reste des proches à passer en revue.
 */
export function isReviewAvailable(
  settings: Pick<Settings, 'weeklyReviewEnabled' | 'weeklyReviewWeekday' | 'weeklyReviewTime' | 'lastWeeklyReviewAt'>,
  candidateCount: number,
  now: Date,
): boolean {
  if (!settings.weeklyReviewEnabled || candidateCount === 0) return false;
  return settings.lastWeeklyReviewAt === null || settings.lastWeeklyReviewAt < lastScheduledReviewAt(settings, now);
}

export type ReviewAnswer = 'talked' | 'not_yet';

export type ReviewSummary = {
  /** Proches à jour à la fin du bilan (« 4 personnes à jour »). */
  upToDate: number;
  /** Proches toujours en retard (« 2 à recontacter »). */
  toContact: number;
};

/**
 * Récapitulatif de fin de bilan (US-14 CA5), calculé sur les contacts passés en revue.
 * « On s'est parlé » met le contact à jour ; « Non » ne modifie rien ; une carte sans réponse
 * (bilan interrompu) est comptée selon son état actuel.
 */
export function reviewSummary(
  reviewed: TrackedContact[],
  answers: ReadonlyMap<string, ReviewAnswer>,
  today: Date,
): ReviewSummary {
  let upToDate = 0;
  for (const contact of reviewed) {
    if (answers.get(contact.id) === 'talked' || urgency(contact, today) < 1) upToDate++;
  }
  return { upToDate, toContact: reviewed.length - upToDate };
}
