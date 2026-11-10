import { daysBetween } from './dates';
import type { TrackedContact } from './types';
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
