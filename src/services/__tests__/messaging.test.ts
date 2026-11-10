import { describe, expect, it, jest } from '@jest/globals';

import { conversationUrl, defaultChannel, effectiveChannel } from '../messaging';

jest.mock('react-native', () => ({ Linking: { canOpenURL: jest.fn(), openURL: jest.fn() } }));

describe('conversationUrl', () => {
  it.each([
    ['whatsapp', 'https://wa.me/237699123456'],
    ['telegram', 'https://t.me/+237699123456'],
    ['signal', 'https://signal.me/#p/+237699123456'],
    ['viber', 'viber://chat?number=%2B237699123456'],
    ['sms', 'sms:+237699123456'],
    ['call', 'tel:+237699123456'],
  ] as const)('%s → %s', (channel, url) => {
    expect(conversationUrl(channel, '+237699123456')).toBe(url);
  });
});

describe('messagerie utilisée', () => {
  it('bascule sur le SMS si la messagerie préférée n’est plus installée', () => {
    expect(effectiveChannel('viber', ['whatsapp', 'sms', 'call'])).toBe('sms');
    expect(effectiveChannel('whatsapp', ['whatsapp', 'sms', 'call'])).toBe('whatsapp');
  });

  it('propose WhatsApp par défaut, ou le SMS s’il n’est pas installé', () => {
    expect(defaultChannel(['whatsapp', 'sms', 'call'])).toBe('whatsapp');
    expect(defaultChannel(['telegram', 'sms', 'call'])).toBe('sms');
  });
});
