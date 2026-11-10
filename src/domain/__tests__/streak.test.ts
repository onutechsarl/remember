import { describe, expect, it } from '@jest/globals';

import { mascotMood, streakWeeks, weekDayStates } from '../streak';
import { day, makeInteraction, NOW } from '../__fixtures__';

// NOW = lundi 19 octobre 2026 ; la semaine en cours va du 19 au 25.
const midweek = day(3, 20); // jeudi 22, 20:00

describe('streakWeeks', () => {
  it('vaut 0 sans échange', () => {
    expect(streakWeeks([], NOW)).toBe(0);
  });

  it('compte les semaines consécutives depuis la semaine dernière', () => {
    const interactions = [day(-1), day(-10), day(-16)].map((d) => makeInteraction(d));
    expect(streakWeeks(interactions, NOW)).toBe(3);
  });

  it('ajoute la semaine en cours quand elle est réussie', () => {
    const interactions = [day(1), day(-1)].map((d) => makeInteraction(d));
    expect(streakWeeks(interactions, midweek)).toBe(2);
  });

  it('ne casse pas la série tant que la semaine en cours n’est pas terminée', () => {
    expect(streakWeeks([makeInteraction(day(-3))], midweek)).toBe(1);
  });

  it('repart de zéro après une semaine sans échange', () => {
    const interactions = [day(-1), day(-15)].map((d) => makeInteraction(d));
    expect(streakWeeks(interactions, NOW)).toBe(1);
  });

  it('ignore l’estimation donnée à l’ajout', () => {
    expect(streakWeeks([makeInteraction(day(-2), 'initial_estimate')], NOW)).toBe(0);
  });

  it('compte le dimanche soir dans sa semaine (du lundi au dimanche)', () => {
    expect(streakWeeks([makeInteraction(day(-1, 23, 59))], NOW)).toBe(1);
  });
});

describe('weekDayStates', () => {
  it('distingue échange noté, rappel sans échange et jour à venir', () => {
    const interactions = [makeInteraction(day(0, 9)), makeInteraction(day(2, 8), 'initial_estimate')];
    const fired = [day(0, 18), day(1, 18), day(2, 18), day(4, 18)];
    expect(weekDayStates(interactions, fired, day(2, 19))).toEqual([
      'done',
      'missed',
      'missed',
      'none',
      'none',
      'none',
      'none',
    ]);
  });

  it('ne compte pas un rappel d’aujourd’hui qui n’est pas encore parti', () => {
    expect(weekDayStates([], [day(0, 18)], NOW)[0]).toBe('none');
  });
});

describe('mascotMood', () => {
  it('s’impatiente quand rien n’est noté cette semaine', () => {
    expect(mascotMood(10, false)).toBe('nudge');
  });

  it('est contente quand la semaine est réussie', () => {
    expect(mascotMood(4, true)).toBe('happy');
  });

  it('fait la fête à 10, 25 et 52 semaines', () => {
    expect([10, 25, 52].map((n) => mascotMood(n, true))).toEqual(['party', 'party', 'party']);
  });
});
