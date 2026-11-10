import { describe, expect, it } from '@jest/globals';

import { formatShortDate, formatUpcoming } from '../format';

const now = new Date(2026, 9, 19, 10, 0); // lundi 19 octobre 2026
const labels = { today: 'Aujourd’hui', tomorrow: 'Demain' };

describe('formatUpcoming', () => {
  it('dit « Aujourd’hui » et « Demain »', () => {
    expect(formatUpcoming(new Date(2026, 9, 19, 18, 0), now, 'fr', labels)).toBe('Aujourd’hui, 18:00');
    expect(formatUpcoming(new Date(2026, 9, 20, 18, 0), now, 'fr', labels)).toBe('Demain, 18:00');
  });

  it('donne le jour et la date au-delà', () => {
    expect(formatUpcoming(new Date(2026, 9, 21, 18, 0), now, 'fr', labels)).toBe('mer. 21 oct., 18:00');
  });
});

describe('formatShortDate', () => {
  it('suit la langue', () => {
    expect(formatShortDate(new Date(2026, 8, 28), 'fr')).toBe('28 sept.');
    expect(formatShortDate(new Date(2026, 8, 28), 'en')).toBe('Sep 28');
  });
});
