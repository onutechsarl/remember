/** Heures locales « HH:MM » (heure des rappels et du bilan, data-model.pdf, table settings). */

/** « 18:00 » → date du jour à 18:00 (heure locale). */
export function timeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/** Date → « HH:MM » en heure locale. */
export function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
