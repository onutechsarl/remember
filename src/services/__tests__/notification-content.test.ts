import { beforeAll, describe, expect, it, jest } from '@jest/globals';

import { day, makeContact, NOW } from '@/domain/__fixtures__';
import i18n, { applyLanguage } from '@/i18n';

import { agoText, notificationContent } from '../notification-content';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'fr' }] }));

const t = i18n.t.bind(i18n);
const reminder = (overrides: Partial<Parameters<typeof notificationContent>[0]>) => ({
  id: 'r1',
  contactId: 'marie',
  kind: 'reminder' as const,
  fireAt: day(0, 18),
  action: null,
  createdAt: NOW,
  ...overrides,
});

beforeAll(async () => {
  await applyLanguage('fr');
});

describe('agoText', () => {
  it.each([
    [0, 'aujourd’hui'],
    [1, 'hier'],
    [5, 'il y a 5 jours'],
    [21, 'il y a 3 semaines'],
    [75, 'il y a 2 mois'],
  ])('%i jours → %s', (days, expected) => {
    expect(agoText(days, t).replace("'", '’')).toBe(expected);
  });
});

describe('notificationContent', () => {
  const marie = makeContact({ id: 'marie', displayName: 'Tantine Marie', phoneE164: '+237699123456', lastContactAt: day(-21) });

  it('rédige le rappel comme la maquette, avec la catégorie de la messagerie', () => {
    expect(notificationContent(reminder({}), [marie], t, () => 'whatsapp')).toEqual({
      title: 'Tantine Marie',
      body: 'Pensez à prendre de ses nouvelles 💛\nDernier échange noté : il y a 3 semaines.',
      categoryIdentifier: 'reminder_whatsapp',
      data: { reminderId: 'r1', contactId: 'marie', kind: 'reminder' },
    });
  });

  it('compte l’ancienneté au moment où le rappel part', () => {
    const content = notificationContent(reminder({ fireAt: day(14, 18) }), [marie], t, () => 'sms');
    expect(content?.body).toContain('il y a 5 semaines');
    expect(content?.categoryIdentifier).toBe('reminder_sms');
  });

  it('n’a pas de bouton « Écrire » pour un contact sans numéro (US-10 CA4)', () => {
    const noPhone = { ...marie, phoneE164: null };
    expect(notificationContent(reminder({}), [noPhone], t, () => 'whatsapp')?.categoryIdentifier).toBe('reminder_no_phone');
  });

  it('ignore un rappel dont le contact n’existe plus', () => {
    expect(notificationContent(reminder({}), [], t, () => 'whatsapp')).toBeNull();
  });

  it('annonce le nombre de proches du bilan, et rien s’il n’y en a pas', () => {
    const review = reminder({ kind: 'weekly_review', contactId: null, fireAt: day(6, 18) });
    expect(notificationContent(review, [marie], t, () => 'sms')?.body).toBe(
      '1 proche à passer en revue. Ça prend 30 secondes ✨',
    );
    const recent = { ...marie, lastContactAt: day(5) };
    expect(notificationContent(review, [recent], t, () => 'sms')).toBeNull();
  });

  it('invite à rouvrir l’application en fin de cycle', () => {
    const reopen = reminder({ kind: 'reopen', contactId: null });
    expect(notificationContent(reopen, [], t, () => 'sms')?.body).toBe('Faites le point sur vos proches 💛');
  });
});
