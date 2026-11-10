import { describe, expect, it } from '@jest/globals';

import { initials, stableIndex } from '../avatar';

describe('initials', () => {
  it.each([
    ['Tantine Marie', 'TM'],
    ['Awa', 'AW'],
    ['Paul (cousin)', 'PC'],
    ['  élodie   ndiaye ', 'ÉN'],
    ['😀', '?'],
    ['', '?'],
  ])('%s → %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});

describe('stableIndex', () => {
  it('donne toujours la même couleur au même contact, dans les bornes', () => {
    const index = stableIndex('6f1c-abc', 6);
    expect(stableIndex('6f1c-abc', 6)).toBe(index);
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(6);
  });
});
