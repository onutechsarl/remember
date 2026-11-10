import { describe, expect, it } from '@jest/globals';

import { initialLastContactAt } from '../initial-estimate';
import { sortByUrgency, urgency, urgencyLevel } from '../urgency';

const today = new Date(2026, 9, 19);
const daysAgo = (n: number) => new Date(2026, 9, 19 - n);

describe('urgency', () => {
  it("vaut jours écoulés / fréquence (exemple de Tantine Marie)", () => {
    expect(urgency({ lastContactAt: daysAgo(21), frequencyDays: 14 }, today)).toBe(1.5);
  });

  it('classe le retard en trois niveaux', () => {
    expect(urgencyLevel(0.9)).toBe('ok');
    expect(urgencyLevel(1)).toBe('late');
    expect(urgencyLevel(1.5)).toBe('very_late');
  });

  it("trie par urgence décroissante", () => {
    const awa = { name: 'Awa', lastContactAt: daysAgo(9), frequencyDays: 7 as const };
    const maman = { name: 'Maman', lastContactAt: daysAgo(2), frequencyDays: 7 as const };
    const marie = { name: 'Marie', lastContactAt: daysAgo(21), frequencyDays: 14 as const };
    expect(sortByUrgency([maman, awa, marie], today).map((c) => c.name)).toEqual(['Marie', 'Awa', 'Maman']);
  });
});

describe('initialLastContactAt', () => {
  it("« Je ne sais pas » rend le contact immédiatement en retard", () => {
    const date = initialLastContactAt('unknown', 14, today);
    expect(urgency({ lastContactAt: date, frequencyDays: 14 }, today)).toBe(1);
  });

  it("« Ce mois-ci » correspond à 15 jours", () => {
    expect(initialLastContactAt('this_month', 30, today)).toEqual(daysAgo(15));
  });
});
