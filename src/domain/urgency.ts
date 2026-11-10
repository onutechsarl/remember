import { daysBetween } from './dates';
import type { TrackedContact } from './types';

export type UrgencyLevel = 'ok' | 'late' | 'very_late';

type UrgencyInput = Pick<TrackedContact, 'lastContactAt' | 'frequencyDays'>;

/** Urgence = jours écoulés / fréquence (data-model.pdf, « Calcul de l'urgence »). */
export function urgency(contact: UrgencyInput, today: Date): number {
  return daysBetween(contact.lastContactAt, today) / contact.frequencyDays;
}

/** Vert sous 1, orange de 1 à 1,5, rouge à partir de 1,5. */
export function urgencyLevel(value: number): UrgencyLevel {
  if (value < 1) return 'ok';
  if (value < 1.5) return 'late';
  return 'very_late';
}

/** Tri de la liste : urgence décroissante, puis jours écoulés décroissants. */
export function sortByUrgency<T extends UrgencyInput>(contacts: T[], today: Date): T[] {
  return [...contacts].sort(
    (a, b) =>
      urgency(b, today) - urgency(a, today) ||
      daysBetween(b.lastContactAt, today) - daysBetween(a.lastContactAt, today),
  );
}
