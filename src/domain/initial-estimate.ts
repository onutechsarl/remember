import { addDays } from './dates';
import type { FrequencyDays } from './types';

export type LastContactAnswer = 'this_week' | 'this_month' | 'longer' | 'unknown';

/** Réponse donnée à l'ajout d'un contact (US-06) → date du dernier échange. */
export function initialLastContactAt(answer: LastContactAnswer, frequencyDays: FrequencyDays, today: Date): Date {
  switch (answer) {
    case 'this_week':
      return addDays(today, -3);
    case 'this_month':
      return addDays(today, -15);
    case 'longer':
      return addDays(today, -60);
    case 'unknown':
      return addDays(today, -frequencyDays);
  }
}
