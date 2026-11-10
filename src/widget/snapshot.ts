import { isCurrentWeekDone, mascotMood, streakWeeks, weekDayStates, type DayState, type MascotMood } from '@/domain/streak';
import type { Interaction, TrackedContact } from '@/domain/types';
import { sortByUrgency, urgency } from '@/domain/urgency';

/** Nombre maximum de proches affichés dans le widget moyen (US-19 CA1). */
export const WIDGET_MAX_CONTACTS = 3;

/**
 * Instantané écrit par l'application et lu par le widget
 * (data-model.pdf, « Instantané du widget »).
 */
export type WidgetSnapshot = {
  version: 1;
  updatedAt: string;
  language: 'fr' | 'en';
  streakWeeks: number;
  mascotMood: MascotMood;
  week: [DayState, DayState, DayState, DayState, DayState, DayState, DayState];
  dueContacts: { id: string; name: string }[];
};

type SnapshotInput = {
  contacts: TrackedContact[];
  interactions: Pick<Interaction, 'occurredAt' | 'source'>[];
  /** Dates de déclenchement des rappels (`scheduled_reminder` de type `reminder`). */
  firedReminders: Date[];
  language: 'fr' | 'en';
  now: Date;
};

/** Calcule l'instantané : toute la logique reste ici, le widget ne fait qu'afficher. */
export function buildWidgetSnapshot({ contacts, interactions, firedReminders, language, now }: SnapshotInput): WidgetSnapshot {
  const streak = streakWeeks(interactions, now);
  const due = contacts.filter((c) => c.archivedAt === null && urgency(c, now) >= 1);

  return {
    version: 1,
    updatedAt: now.toISOString(),
    language,
    streakWeeks: streak,
    mascotMood: mascotMood(streak, isCurrentWeekDone(interactions, now)),
    week: weekDayStates(interactions, firedReminders, now),
    dueContacts: sortByUrgency(due, now)
      .slice(0, WIDGET_MAX_CONTACTS)
      .map((c) => ({ id: c.id, name: c.displayName })),
  };
}
