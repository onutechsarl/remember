const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Début du jour local (les calculs « en jours » se font en dates locales). */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Nombre de jours calendaires locaux écoulés entre deux dates. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfLocalDay(to).getTime() - startOfLocalDay(from).getTime()) / MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Jour de la semaine au format du modèle de données : 1 = lundi … 7 = dimanche. */
export function isoWeekday(date: Date): number {
  return date.getDay() === 0 ? 7 : date.getDay();
}

/** Lundi (00:00, heure locale) de la semaine qui contient `date`. */
export function startOfLocalWeek(date: Date): Date {
  return addDays(startOfLocalDay(date), 1 - isoWeekday(date));
}

/** Même jour local, à l'heure locale `HH:MM` (18:00 reste 18:00 dans tous les fuseaux). */
export function atLocalTime(day: Date, time: string): Date {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Heure invalide : ${time}`);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(match[1]), Number(match[2]));
}

/** `a` tombe-t-il le même jour local que `b` ? */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return daysBetween(a, b) === 0;
}
