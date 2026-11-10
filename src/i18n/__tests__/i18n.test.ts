import { describe, expect, it, jest } from '@jest/globals';

import i18n, { applyLanguage, resolveLanguage } from '..';
import en from '../en.json';
import fr from '../fr.json';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'de' }] }));

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

describe('traductions', () => {
  it('le français et l’anglais ont exactement les mêmes clés', () => {
    expect(keys(en).sort()).toEqual(keys(fr).sort());
  });

  it('utilise l’anglais quand la langue du téléphone n’est ni le français ni l’anglais (US-18 CA1)', () => {
    expect(resolveLanguage('system')).toBe('en');
    expect(resolveLanguage('fr')).toBe('fr');
  });

  it('accorde les durées selon la langue', async () => {
    await applyLanguage('fr');
    expect(i18n.t('home.daysAgoA11y', { count: 1 })).toBe('dernier échange noté il y a 1 jour');
    expect(i18n.t('frequency.14')).toBe('Toutes les 2 semaines');
    await applyLanguage('en');
    expect(i18n.t('home.daysAgoA11y', { count: 3 })).toBe('last contact noted 3 days ago');
  });
});
