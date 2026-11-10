import type { Interaction, TrackedContact } from '../types';

/** Lundi 19 octobre 2026, 10:00 (heure locale). */
export const NOW = new Date(2026, 9, 19, 10, 0);

/** Date locale relative à NOW : `day(-3)` = vendredi 16 octobre, 12:00. */
export const day = (offset: number, hours = 12, minutes = 0) => new Date(2026, 9, 19 + offset, hours, minutes);

export function makeContact(overrides: Partial<TrackedContact> & { id: string }): TrackedContact {
  return {
    deviceContactId: null,
    displayName: overrides.id,
    phoneE164: null,
    frequencyDays: 14,
    preferredChannel: 'whatsapp',
    lastContactAt: day(-1),
    lastContactSource: 'app_action',
    snoozedUntil: null,
    lastRemindedAt: null,
    createdAt: day(-100),
    updatedAt: day(-100),
    archivedAt: null,
    ...overrides,
  };
}

export function makeInteraction(occurredAt: Date, source: Interaction['source'] = 'app_action'): Interaction {
  return { id: String(occurredAt.getTime()), contactId: 'c', occurredAt, source, channel: null, createdAt: occurredAt };
}
