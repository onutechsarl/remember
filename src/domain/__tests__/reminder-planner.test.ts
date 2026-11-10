import { describe, expect, it } from '@jest/globals';

import { isEligibleForReminder, planReminders } from '../reminder-planner';
import { DEFAULT_SETTINGS, type Settings } from '../types';
import { day, makeContact, NOW } from '../__fixtures__';

const settings: Settings = { ...DEFAULT_SETTINGS, weeklyReviewEnabled: false };

const reminders = (planned: ReturnType<typeof planReminders>) =>
  planned.filter((p) => p.kind === 'reminder').map((p) => [p.contactId, p.fireAt.getDate()]);

describe('isEligibleForReminder', () => {
  const late = makeContact({ id: 'late', lastContactAt: day(-14), frequencyDays: 14 });

  it('accepte un contact en retard sans report ni rappel récent', () => {
    expect(isEligibleForReminder(late, settings, day(0))).toBe(true);
  });

  it('refuse un contact à jour', () => {
    expect(isEligibleForReminder(makeContact({ id: 'ok', lastContactAt: day(-13) }), settings, day(0))).toBe(false);
  });

  it('refuse un contact archivé', () => {
    expect(isEligibleForReminder({ ...late, archivedAt: day(-1) }, settings, day(0))).toBe(false);
  });

  it('respecte « Plus tard » jusqu’au jour du report inclus', () => {
    const snoozed = { ...late, snoozedUntil: day(2, 9) };
    expect(isEligibleForReminder(snoozed, settings, day(1))).toBe(false);
    expect(isEligibleForReminder(snoozed, settings, day(2))).toBe(true);
  });

  it('attend 2 jours entre deux rappels', () => {
    expect(isEligibleForReminder({ ...late, lastRemindedAt: day(-1, 18) }, settings, day(0))).toBe(false);
    expect(isEligibleForReminder({ ...late, lastRemindedAt: day(-2, 18) }, settings, day(0))).toBe(true);
  });

  it('ne rappelle personne pendant une pause', () => {
    expect(isEligibleForReminder(late, { ...settings, pausedUntil: day(3) }, day(2))).toBe(false);
    expect(isEligibleForReminder(late, { ...settings, pausedUntil: day(3) }, day(3))).toBe(true);
  });
});

describe('planReminders', () => {
  it('ne programme rien sans contact suivi', () => {
    expect(planReminders([], settings, NOW)).toEqual([]);
  });

  it('programme à l’heure locale choisie, à partir d’aujourd’hui si l’heure n’est pas passée', () => {
    const late = makeContact({ id: 'a', lastContactAt: day(-20) });
    const [first] = planReminders([late], settings, NOW);
    expect(first.fireAt).toEqual(day(0, 18, 0));
  });

  it('commence demain si l’heure du jour est passée', () => {
    const late = makeContact({ id: 'a', lastContactAt: day(-20) });
    const [first] = planReminders([late], settings, day(0, 19));
    expect(first.fireAt).toEqual(day(1, 18, 0));
  });

  it('rappelle une même personne au plus tous les 2 jours', () => {
    const late = makeContact({ id: 'a', lastContactAt: day(-20) });
    expect(reminders(planReminders([late], settings, NOW))).toEqual([
      ['a', 19],
      ['a', 21],
      ['a', 23],
      ['a', 25],
    ]);
  });

  it('garde les N plus urgents et reporte les autres aux jours suivants', () => {
    const contacts = [
      makeContact({ id: 'peu', lastContactAt: day(-15), frequencyDays: 14 }),
      makeContact({ id: 'tres', lastContactAt: day(-40), frequencyDays: 14 }),
      makeContact({ id: 'moyen', lastContactAt: day(-25), frequencyDays: 14 }),
    ];
    const plan = reminders(planReminders(contacts, settings, NOW));
    expect(plan.slice(0, 3)).toEqual([
      ['tres', 19],
      ['moyen', 19],
      ['peu', 20],
    ]);
  });

  it('tient compte d’un contact qui deviendra en retard pendant la semaine', () => {
    const soon = makeContact({ id: 'bientot', lastContactAt: day(-11), frequencyDays: 14 });
    expect(reminders(planReminders([soon], settings, NOW))[0]).toEqual(['bientot', 22]);
  });

  it('reste sous la limite iOS de 64 notifications au réglage maximum', () => {
    const contacts = Array.from({ length: 30 }, (_, i) => makeContact({ id: `c${i}`, lastContactAt: day(-60) }));
    const plan = planReminders(contacts, { ...DEFAULT_SETTINGS, maxRemindersPerDay: 5 }, NOW);
    expect(plan.filter((p) => p.kind === 'reminder')).toHaveLength(35);
    expect(plan.length).toBeLessThanOrEqual(64);
  });

  it('programme le bilan hebdomadaire le jour et à l’heure choisis', () => {
    const contact = makeContact({ id: 'a' });
    const plan = planReminders([contact], { ...DEFAULT_SETTINGS, weeklyReviewTime: '19:30' }, NOW);
    const reviews = plan.filter((p) => p.kind === 'weekly_review');
    expect(reviews).toEqual([{ contactId: null, kind: 'weekly_review', fireAt: day(6, 19, 30) }]);
  });

  it('termine le cycle par une notification qui invite à rouvrir l’application', () => {
    const plan = planReminders([makeContact({ id: 'a' })], settings, NOW);
    expect(plan.at(-1)).toEqual({ contactId: null, kind: 'reopen', fireAt: day(7, 18, 0) });
  });

  it('renvoie des notifications triées par date', () => {
    const contacts = [makeContact({ id: 'a', lastContactAt: day(-30) })];
    const plan = planReminders(contacts, DEFAULT_SETTINGS, NOW);
    const times = plan.map((p) => p.fireAt.getTime());
    expect(times).toEqual([...times].sort((x, y) => x - y));
  });
});
