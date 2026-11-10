import { describe, expect, it } from '@jest/globals';

import { day, makeContact, makeInteraction, NOW } from '../__fixtures__';
import { buildExport, ImportError, parseExport } from '../backup';
import { DEFAULT_SETTINGS } from '../types';

const marie = makeContact({ id: 'marie', displayName: 'Tantine Marie', phoneE164: '+237699123456', lastContactAt: day(-21) });

describe('buildExport', () => {
  it('suit le format du modèle de données, sans identifiants internes', () => {
    const interactions = [
      { ...makeInteraction(day(-21), 'weekly_review'), contactId: 'marie' },
      { ...makeInteraction(day(-40), 'initial_estimate'), contactId: 'marie' },
      { ...makeInteraction(day(-2)), contactId: 'autre' },
    ];
    const archived = makeContact({ id: 'x', archivedAt: day(-1) });
    const file = buildExport({ ...DEFAULT_SETTINGS, language: 'fr', pausedUntil: day(3) }, [marie, archived], interactions, NOW);

    expect(file).toMatchObject({ app: 'remember', exportVersion: 1, exportedAt: NOW.toISOString() });
    expect(file.settings).toEqual({
      language: 'fr',
      appearance: 'system',
      reminderTime: '18:00',
      maxRemindersPerDay: 2,
      snoozeDays: 2,
      minDaysBetweenReminders: 2,
      weeklyReviewEnabled: true,
      weeklyReviewWeekday: 7,
      weeklyReviewTime: '18:00',
    });
    expect(file.contacts).toEqual([
      {
        displayName: 'Tantine Marie',
        phoneE164: '+237699123456',
        frequencyDays: 14,
        preferredChannel: 'whatsapp',
        lastContactAt: day(-21).toISOString(),
        interactions: [
          { occurredAt: day(-40).toISOString(), source: 'initial_estimate', channel: null },
          { occurredAt: day(-21).toISOString(), source: 'weekly_review', channel: null },
        ],
      },
    ]);
  });
});

describe('parseExport', () => {
  const valid = () => buildExport(DEFAULT_SETTINGS, [marie], [], NOW);

  it('relit un export', () => {
    expect(parseExport(JSON.stringify(valid()), DEFAULT_SETTINGS)).toEqual(valid());
  });

  it('reprend les valeurs par défaut des réglages invalides', () => {
    const file = { ...valid(), settings: { maxRemindersPerDay: 9, reminderTime: '7h', language: 'fr' } };
    expect(parseExport(JSON.stringify(file), DEFAULT_SETTINGS).settings).toMatchObject({
      maxRemindersPerDay: 2,
      reminderTime: '18:00',
      language: 'fr',
    });
  });

  const reason = (text: string) => {
    try {
      parseExport(text, DEFAULT_SETTINGS);
      return 'ok';
    } catch (e) {
      return e instanceof ImportError ? e.reason : 'other';
    }
  };

  it('refuse un fichier qui n’est pas un export de Remember', () => {
    expect(reason('pas du json')).toBe('invalid');
    expect(reason(JSON.stringify({ app: 'autre', contacts: [] }))).toBe('invalid');
  });

  it('refuse un contact invalide plutôt que d’importer à moitié', () => {
    const file = valid();
    file.contacts[0] = { ...file.contacts[0], frequencyDays: 3 as 7 };
    expect(reason(JSON.stringify(file))).toBe('invalid');
  });

  it('signale un export d’une version plus récente', () => {
    expect(reason(JSON.stringify({ ...valid(), exportVersion: 2 }))).toBe('version');
  });
});
