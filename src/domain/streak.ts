import { addDays, isSameLocalDay, startOfLocalDay, startOfLocalWeek } from './dates';
import type { Interaction } from './types';

export type DayState = 'done' | 'missed' | 'none';
export type MascotMood = 'happy' | 'nudge' | 'party';

/** Séries célébrées par la mascotte (US-19 CA11). */
export const STREAK_MILESTONES = [10, 25, 52] as const;

type InteractionInput = Pick<Interaction, 'occurredAt' | 'source'>;

/** Seuls les vrais échanges comptent : l'estimation donnée à l'ajout ne compte pas (US-19 CA2). */
function countsForStreak(interaction: InteractionInput): boolean {
  return interaction.source !== 'initial_estimate';
}

/** Ensemble des semaines (clé = lundi local en ms) contenant au moins un échange qui compte. */
function successfulWeeks(interactions: InteractionInput[]): Set<number> {
  return new Set(interactions.filter(countsForStreak).map((i) => startOfLocalWeek(i.occurredAt).getTime()));
}

/** La semaine en cours (lundi → dimanche) contient-elle déjà un échange qui compte ? */
export function isCurrentWeekDone(interactions: InteractionInput[], today: Date): boolean {
  return successfulWeeks(interactions).has(startOfLocalWeek(today).getTime());
}

/**
 * Série de « semaines de lien » (data-model.pdf, « Calcul de la série ») : semaines réussies
 * consécutives en remontant depuis la semaine dernière, plus la semaine en cours si elle est
 * déjà réussie. Une semaine en cours pas encore réussie ne casse pas la série.
 */
export function streakWeeks(interactions: InteractionInput[], today: Date): number {
  const weeks = successfulWeeks(interactions);
  const currentWeek = startOfLocalWeek(today);

  let streak = weeks.has(currentWeek.getTime()) ? 1 : 0;
  for (let week = addDays(currentWeek, -7); weeks.has(week.getTime()); week = addDays(week, -7)) {
    streak++;
  }
  return streak;
}

/**
 * État des 7 jours de la semaine en cours, du lundi au dimanche (US-19 CA4) :
 * `done` si un échange est noté ce jour-là, `missed` si un rappel a été déclenché sans échange,
 * `none` sinon (y compris pour les jours à venir).
 *
 * @param firedReminders dates de déclenchement des `scheduled_reminder` de type `reminder`.
 */
export function weekDayStates(
  interactions: InteractionInput[],
  firedReminders: Date[],
  now: Date,
): [DayState, DayState, DayState, DayState, DayState, DayState, DayState] {
  const monday = startOfLocalWeek(now);
  const today = startOfLocalDay(now);
  const counted = interactions.filter(countsForStreak);
  const fired = firedReminders.filter((d) => d <= now);

  const state = (offset: number): DayState => {
    const day = addDays(monday, offset);
    if (day > today) return 'none';
    if (counted.some((i) => isSameLocalDay(i.occurredAt, day))) return 'done';
    if (fired.some((d) => isSameLocalDay(d, day))) return 'missed';
    return 'none';
  };

  return [state(0), state(1), state(2), state(3), state(4), state(5), state(6)];
}

/** Expression de Mémo dans le petit widget (data-model.pdf, champ `mascotMood`). */
export function mascotMood(streak: number, currentWeekDone: boolean): MascotMood {
  if (!currentWeekDone) return 'nudge';
  return (STREAK_MILESTONES as readonly number[]).includes(streak) ? 'party' : 'happy';
}
