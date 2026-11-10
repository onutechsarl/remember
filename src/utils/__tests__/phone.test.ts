import { describe, expect, it } from '@jest/globals';

import { formatPhone, pickPhone, toE164 } from '../phone';

describe('toE164', () => {
  it('lit un numéro local avec le pays du téléphone', () => {
    expect(toE164('06 12 34 56 78', 'FR')).toBe('+33612345678');
    expect(toE164('6 99 12 34 56', 'CM')).toBe('+237699123456');
  });

  it('garde l’indicatif d’un numéro étranger', () => {
    expect(toE164('+237 6 99 12 34 56', 'FR')).toBe('+237699123456');
    expect(toE164('00221 77 123 45 67', 'FR')).toBe('+221771234567');
  });

  it('refuse un numéro invalide ou un pays inconnu pour un numéro local', () => {
    expect(toE164('12', 'FR')).toBeNull();
    expect(toE164('06 12 34 56 78', null)).toBeNull();
  });
});

describe('pickPhone', () => {
  it('préfère le mobile valide', () => {
    const phones = [
      { label: 'home', number: '01 23 45 67 89' },
      { label: 'mobile', number: '06 12 34 56 78' },
    ];
    expect(pickPhone(phones, 'FR')).toEqual({ e164: '+33612345678', raw: '01 23 45 67 89' });
  });

  it('prend le premier numéro valide sinon', () => {
    expect(pickPhone([{ number: 'abc' }, { number: '+1 514 555 0199' }], 'FR').e164).toBe('+15145550199');
  });

  it('gère les contacts sans numéro ou au numéro invalide', () => {
    expect(pickPhone(undefined, 'FR')).toEqual({ e164: null, raw: null });
    expect(pickPhone([{ number: '  ' }], 'FR')).toEqual({ e164: null, raw: null });
    expect(pickPhone([{ number: '123' }], 'FR')).toEqual({ e164: null, raw: '123' });
  });
});

describe('formatPhone', () => {
  it('affiche le format international', () => {
    expect(formatPhone('+237699123456')).toBe('+237 6 99 12 34 56');
  });
});
