import { describe, expect, it } from '@jest/globals';

import { targetSection } from '../alphabet-index';

describe('targetSection', () => {
  const sections = ['A', 'B', 'M', 'P', 'T', '#'];

  it('va à la lettre si elle a des contacts', () => {
    expect(targetSection('M', sections)).toBe(2);
  });

  it('va à la section suivante sinon', () => {
    expect(targetSection('C', sections)).toBe(2);
    expect(targetSection('U', sections)).toBe(5);
  });

  it('va à la dernière section après la dernière lettre', () => {
    expect(targetSection('Z', ['A', 'B'])).toBe(1);
  });

  it('ne fait rien sans section', () => {
    expect(targetSection('A', [])).toBe(-1);
  });
});
