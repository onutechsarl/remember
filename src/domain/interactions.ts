import { addDays } from './dates';
import type { Settings, TrackedContact } from './types';

/**
 * Effet d'un échange noté sur le contact (data-model.pdf, « Enregistrement d'un échange »,
 * étapes 2 et 3). L'ajout de la ligne `interaction`, la replanification et le widget
 * sont faits par l'appelant.
 */
export function applyInteraction(
  contact: TrackedContact,
  interaction: { occurredAt: Date; source: TrackedContact['lastContactSource'] },
  now: Date,
): TrackedContact {
  const isNewer = interaction.occurredAt > contact.lastContactAt;
  return {
    ...contact,
    lastContactAt: isNewer ? interaction.occurredAt : contact.lastContactAt,
    lastContactSource: isNewer ? interaction.source : contact.lastContactSource,
    snoozedUntil: null,
    updatedAt: now,
  };
}

/**
 * Correction manuelle de la date du dernier échange depuis la fiche (US-07, source `manual_edit`).
 * Contrairement à `applyInteraction`, la date peut reculer.
 */
export function correctLastContact(contact: TrackedContact, lastContactAt: Date, now: Date): TrackedContact {
  return { ...contact, lastContactAt, lastContactSource: 'manual_edit', updatedAt: now };
}

/** Bouton « Plus tard » : pas de rappel avant `snooze_days` jours ; la date du dernier échange ne change pas (US-12). */
export function snoozeContact(contact: TrackedContact, settings: Pick<Settings, 'snoozeDays'>, now: Date): TrackedContact {
  return { ...contact, snoozedUntil: addDays(now, settings.snoozeDays), updatedAt: now };
}

/** Un rappel a été envoyé : sert à la règle « pas plus d'un rappel tous les 2 jours » (US-09 CA5). */
export function markReminded(contact: TrackedContact, firedAt: Date): TrackedContact {
  return { ...contact, lastRemindedAt: firedAt };
}
