import { daysBetween } from '@/domain/dates';

/**
 * Formats de date selon la langue de l'application (US-18 CA4).
 * Les libellés (« Aujourd'hui », « Demain ») viennent des traductions, passés par l'appelant.
 */

/** « 28 sept. » / « Sep 28 ». */
export function formatShortDate(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' }).format(date);
}

/** « 18:00 » / « 6:00 PM ». */
export function formatTime(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language, { hour: 'numeric', minute: '2-digit' }).format(date);
}

/** « Aujourd'hui, 18:00 », « Demain, 18:00 », puis « mer. 12 nov., 18:00 ». */
export function formatUpcoming(
  date: Date,
  now: Date,
  language: string,
  labels: { today: string; tomorrow: string },
): string {
  const time = formatTime(date, language);
  const days = daysBetween(now, date);
  if (days === 0) return `${labels.today}, ${time}`;
  if (days === 1) return `${labels.tomorrow}, ${time}`;
  const day = new Intl.DateTimeFormat(language, { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  return `${day}, ${time}`;
}
