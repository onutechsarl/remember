import { describe, expect, it } from '@jest/globals';

import { buildWidgetSnapshot } from '@/widget/snapshot';

import { applyInteraction, correctLastContact, snoozeContact } from '../interactions';
import { DEFAULT_SETTINGS } from '../types';
import { isReviewAvailable, lastScheduledReviewAt, MAX_REVIEW_CARDS, reviewCandidates, reviewSummary } from '../weekly-review';
import { day, makeContact, makeInteraction, NOW } from '../__fixtures__';

describe('applyInteraction', () => {
  const contact = makeContact({ id: 'a', lastContactAt: day(-10), snoozedUntil: day(1) });

  it('met à jour la date et la source si l’échange est plus récent, et lève le report', () => {
    const updated = applyInteraction(contact, { occurredAt: NOW, source: 'notification_done' }, NOW);
    expect(updated).toMatchObject({ lastContactAt: NOW, lastContactSource: 'notification_done', snoozedUntil: null });
  });

  it('ne recule pas la date pour un échange plus ancien', () => {
    const updated = applyInteraction(contact, { occurredAt: day(-20), source: 'weekly_review' }, NOW);
    expect(updated.lastContactAt).toEqual(day(-10));
    expect(updated.lastContactSource).toBe('app_action');
  });

  it('une correction manuelle peut reculer la date', () => {
    expect(correctLastContact(contact, day(-30), NOW).lastContactAt).toEqual(day(-30));
  });
});

describe('snoozeContact', () => {
  it('reporte de 2 jours sans toucher au dernier échange', () => {
    const contact = makeContact({ id: 'a', lastContactAt: day(-20) });
    const snoozed = snoozeContact(contact, DEFAULT_SETTINGS, NOW);
    expect(snoozed.snoozedUntil).toEqual(new Date(2026, 9, 21, 10, 0));
    expect(snoozed.lastContactAt).toEqual(day(-20));
  });
});

describe('bilan hebdomadaire', () => {
  it('ne garde que les contacts sans nouvelles depuis 7 jours, les plus urgents d’abord', () => {
    const contacts = [
      makeContact({ id: 'recent', lastContactAt: day(-6) }),
      makeContact({ id: 'semaine', lastContactAt: day(-7) }),
      makeContact({ id: 'urgent', lastContactAt: day(-30) }),
      makeContact({ id: 'archive', lastContactAt: day(-30), archivedAt: day(-1) }),
    ];
    expect(reviewCandidates(contacts, NOW).map((c) => c.id)).toEqual(['urgent', 'semaine']);
  });

  it('limite le bilan à 20 cartes', () => {
    const contacts = Array.from({ length: 30 }, (_, i) => makeContact({ id: `c${i}`, lastContactAt: day(-10 - i) }));
    const cards = reviewCandidates(contacts, NOW);
    expect(cards).toHaveLength(MAX_REVIEW_CARDS);
    expect(cards[0].id).toBe('c29');
  });

  it('résume « X à jour, Y à recontacter »', () => {
    const reviewed = [
      makeContact({ id: 'a', lastContactAt: day(-20) }),
      makeContact({ id: 'b', lastContactAt: day(-20) }),
      makeContact({ id: 'c', lastContactAt: day(-8) }),
    ];
    const answers = new Map([
      ['a', 'talked' as const],
      ['b', 'not_yet' as const],
    ]);
    expect(reviewSummary(reviewed, answers, NOW)).toEqual({ upToDate: 2, toContact: 1 });
  });
});

describe('bouton du bilan', () => {
  // Bilan prévu le dimanche à 18:00 ; NOW = lundi 19 octobre, donc le dernier bilan prévu est le dimanche 18 à 18:00.
  it('trouve le dernier moment prévu pour le bilan', () => {
    expect(lastScheduledReviewAt(DEFAULT_SETTINGS, NOW)).toEqual(day(-1, 18));
    expect(lastScheduledReviewAt(DEFAULT_SETTINGS, day(6, 18))).toEqual(day(6, 18));
    expect(lastScheduledReviewAt(DEFAULT_SETTINGS, day(6, 17))).toEqual(day(-1, 18));
  });

  it('s’affiche tant que le bilan prévu n’a pas été fait', () => {
    expect(isReviewAvailable(DEFAULT_SETTINGS, 3, NOW)).toBe(true);
    expect(isReviewAvailable({ ...DEFAULT_SETTINGS, lastWeeklyReviewAt: day(-1, 20) }, 3, NOW)).toBe(false);
    expect(isReviewAvailable({ ...DEFAULT_SETTINGS, lastWeeklyReviewAt: day(-1, 20) }, 3, day(6, 18))).toBe(true);
  });

  it('ne s’affiche pas sans proche à passer en revue ni si le bilan est désactivé', () => {
    expect(isReviewAvailable(DEFAULT_SETTINGS, 0, NOW)).toBe(false);
    expect(isReviewAvailable({ ...DEFAULT_SETTINGS, weeklyReviewEnabled: false }, 3, NOW)).toBe(false);
  });
});

describe('buildWidgetSnapshot', () => {
  it('assemble la série, l’humeur de Mémo, la semaine et 3 proches au maximum', () => {
    const contacts = ['a', 'b', 'c', 'd'].map((id, i) => makeContact({ id, lastContactAt: day(-20 - i) }));
    contacts.push(makeContact({ id: 'ajour', lastContactAt: day(-1) }));
    const snapshot = buildWidgetSnapshot({
      contacts,
      interactions: [makeInteraction(day(-2))],
      firedReminders: [],
      language: 'fr',
      now: NOW,
    });
    expect(snapshot).toMatchObject({
      version: 1,
      streakWeeks: 1,
      mascotMood: 'nudge',
      week: ['none', 'none', 'none', 'none', 'none', 'none', 'none'],
      dueContacts: [
        { id: 'd', name: 'd' },
        { id: 'c', name: 'c' },
        { id: 'b', name: 'b' },
      ],
    });
  });
});
