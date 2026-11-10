import { randomUUID } from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';

import { initialLastContactAt, type LastContactAnswer } from '@/domain/initial-estimate';
import { applyInteraction, correctLastContact, snoozeContact } from '@/domain/interactions';
import type { PlannedReminder } from '@/domain/reminder-planner';
import type { ExportFile } from '@/domain/backup';
import { addDays } from '@/domain/dates';
import type { Channel, FrequencyDays, Interaction, InteractionSource, Settings, TrackedContact } from '@/domain/types';

import {
  contactFromRow,
  contactToParams,
  interactionFromRow,
  reminderFromRow,
  SETTINGS_COLUMNS,
  settingsFromRow,
  toIso,
  type ContactRow,
  type InteractionRow,
  type ReminderAction,
  type ScheduledReminder,
  type ScheduledReminderRow,
  type SettingsRow,
} from './mappers';

/**
 * Accès aux données (data-model.pdf). Chaque fonction reçoit la base en paramètre :
 * `getDatabase()` dans l'application, une base en mémoire dans les tests.
 * Les paramètres SQL sont toujours passés sous forme de tableau.
 */
export type Db = Pick<SQLiteDatabase, 'execAsync' | 'runAsync' | 'getFirstAsync' | 'getAllAsync' | 'withTransactionAsync'>;

/** Les rappels passés sont conservés 60 jours (data-model.pdf, table scheduled_reminder). */
export const REMINDER_RETENTION_DAYS = 60;

const CONTACT_COLUMNS =
  'id, device_contact_id, display_name, phone_e164, frequency_days, preferred_channel, last_contact_at, ' +
  'last_contact_source, snoozed_until, last_reminded_at, created_at, updated_at, archived_at';

// ─── Réglages ────────────────────────────────────────────────────────────────

export async function getSettings(db: Db): Promise<Settings> {
  const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1', []);
  if (!row) throw new Error('Ligne settings absente : la base n’a pas été migrée');
  return settingsFromRow(row);
}

export async function updateSettings(db: Db, patch: Partial<Settings>): Promise<Settings> {
  const entries = (Object.keys(patch) as (keyof Settings)[]).filter((k) => patch[k] !== undefined);
  if (entries.length > 0) {
    const sets = entries.map((k) => `${SETTINGS_COLUMNS[k][0]} = ?`).join(', ');
    const values = entries.map((k) => (SETTINGS_COLUMNS[k][1] as (v: unknown) => string | number | null)(patch[k]));
    await db.runAsync(`UPDATE settings SET ${sets} WHERE id = 1`, values);
  }
  return getSettings(db);
}

// ─── Contacts suivis ─────────────────────────────────────────────────────────

export async function listActiveContacts(db: Db): Promise<TrackedContact[]> {
  const rows = await db.getAllAsync<ContactRow>(
    `SELECT ${CONTACT_COLUMNS} FROM tracked_contact WHERE archived_at IS NULL ORDER BY display_name COLLATE NOCASE`,
    [],
  );
  return rows.map(contactFromRow);
}

export async function getContact(db: Db, id: string): Promise<TrackedContact | null> {
  const row = await db.getFirstAsync<ContactRow>(`SELECT ${CONTACT_COLUMNS} FROM tracked_contact WHERE id = ?`, [id]);
  return row ? contactFromRow(row) : null;
}

async function requireContact(db: Db, id: string): Promise<TrackedContact> {
  const contact = await getContact(db, id);
  if (!contact) throw new Error(`Contact introuvable : ${id}`);
  return contact;
}

async function saveContact(db: Db, c: TrackedContact): Promise<void> {
  await db.runAsync(
    `UPDATE tracked_contact SET device_contact_id = ?, display_name = ?, phone_e164 = ?, frequency_days = ?,
       preferred_channel = ?, last_contact_at = ?, last_contact_source = ?, snoozed_until = ?, last_reminded_at = ?,
       created_at = ?, updated_at = ?, archived_at = ? WHERE id = ?`,
    [...contactToParams(c).slice(1), c.id],
  );
}

/** Identifiants du répertoire et numéros déjà suivis, pour marquer les contacts dans la sélection (US-04 CA4). */
export async function trackedKeys(db: Db): Promise<{ deviceContactIds: Set<string>; phones: Set<string> }> {
  const rows = await db.getAllAsync<{ device_contact_id: string | null; phone_e164: string | null }>(
    'SELECT device_contact_id, phone_e164 FROM tracked_contact WHERE archived_at IS NULL',
    [],
  );
  return {
    deviceContactIds: new Set(rows.flatMap((r) => (r.device_contact_id ? [r.device_contact_id] : []))),
    phones: new Set(rows.flatMap((r) => (r.phone_e164 ? [r.phone_e164] : []))),
  };
}

export type NewContact = {
  deviceContactId: string | null;
  displayName: string;
  phoneE164: string | null;
  frequencyDays: FrequencyDays;
  preferredChannel: Channel;
  /** Réponse à « Quand vous êtes-vous parlé pour la dernière fois ? » ; `unknown` si l'étape est passée (US-06 CA4). */
  lastContactAnswer: LastContactAnswer;
};

/**
 * Ajoute des contacts à suivre, avec l'estimation initiale enregistrée comme premier échange
 * (data-model.pdf, « Ajout de contacts »). Un contact déjà suivi (même identifiant du répertoire
 * ou même numéro) est ignoré (US-04 CA4). Renvoie les contacts réellement créés.
 */
export async function addContacts(db: Db, inputs: NewContact[], now: Date): Promise<TrackedContact[]> {
  const created: TrackedContact[] = [];
  await db.withTransactionAsync(async () => {
    const { deviceContactIds, phones } = await trackedKeys(db);
    for (const input of inputs) {
      if (
        (input.deviceContactId && deviceContactIds.has(input.deviceContactId)) ||
        (input.phoneE164 && phones.has(input.phoneE164))
      ) {
        continue;
      }
      const contact: TrackedContact = {
        id: randomUUID(),
        deviceContactId: input.deviceContactId,
        displayName: input.displayName,
        phoneE164: input.phoneE164,
        frequencyDays: input.frequencyDays,
        preferredChannel: input.preferredChannel,
        lastContactAt: initialLastContactAt(input.lastContactAnswer, input.frequencyDays, now),
        lastContactSource: 'initial_estimate',
        snoozedUntil: null,
        lastRemindedAt: null,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      };
      await db.runAsync(
        `INSERT INTO tracked_contact (${CONTACT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        contactToParams(contact),
      );
      await insertInteraction(db, contact.id, contact.lastContactAt, 'initial_estimate', null, now);
      if (input.deviceContactId) deviceContactIds.add(input.deviceContactId);
      if (input.phoneE164) phones.add(input.phoneE164);
      created.push(contact);
    }
  });
  return created;
}

export type ContactPatch = Partial<
  Pick<TrackedContact, 'displayName' | 'phoneE164' | 'deviceContactId' | 'frequencyDays' | 'preferredChannel'>
>;

/** Modifie la fréquence, la messagerie préférée ou la copie des informations du répertoire (US-05 CA4, US-17 CA4). */
export async function updateContact(db: Db, id: string, patch: ContactPatch, now: Date): Promise<TrackedContact> {
  const updated: TrackedContact = { ...(await requireContact(db, id)), ...patch, updatedAt: now };
  await saveContact(db, updated);
  return updated;
}

/** Arrêter de suivre : le contact est archivé, son historique est conservé (US-07 CA3). */
export async function archiveContact(db: Db, id: string, now: Date): Promise<void> {
  await db.runAsync('UPDATE tracked_contact SET archived_at = ?, updated_at = ? WHERE id = ?', [toIso(now), toIso(now), id]);
}

// ─── Échanges ────────────────────────────────────────────────────────────────

async function insertInteraction(
  db: Db,
  contactId: string,
  occurredAt: Date,
  source: InteractionSource,
  channel: Channel | null,
  now: Date,
): Promise<void> {
  await db.runAsync(
    'INSERT INTO interaction (id, contact_id, occurred_at, source, channel, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [randomUUID(), contactId, toIso(occurredAt), source, channel, toIso(now)],
  );
}

const ACTION_BY_SOURCE: Partial<Record<InteractionSource, ReminderAction>> = {
  notification_message: 'message',
  notification_done: 'done',
};

export type RecordInteractionInput = {
  contactId: string;
  occurredAt: Date;
  source: Exclude<InteractionSource, 'initial_estimate'>;
  channel?: Channel | null;
  /** Rappel à l'origine de l'échange, si l'action vient d'une notification. */
  reminderId?: string;
};

/**
 * Note un échange (data-model.pdf, « Enregistrement d'un échange », étapes 1 à 4).
 * Une correction manuelle (`manual_edit`) peut faire reculer la date ; les autres sources non.
 * La replanification et le widget (étapes 5 et 6) sont à la charge de l'appelant.
 */
export async function recordInteraction(db: Db, input: RecordInteractionInput, now: Date): Promise<TrackedContact> {
  let updated!: TrackedContact;
  await db.withTransactionAsync(async () => {
    const contact = await requireContact(db, input.contactId);
    await insertInteraction(db, contact.id, input.occurredAt, input.source, input.channel ?? null, now);
    updated =
      input.source === 'manual_edit'
        ? correctLastContact(contact, input.occurredAt, now)
        : applyInteraction(contact, { occurredAt: input.occurredAt, source: input.source }, now);
    await saveContact(db, updated);
    const action = ACTION_BY_SOURCE[input.source];
    if (input.reminderId && action) await setReminderAction(db, input.reminderId, action);
  });
  return updated;
}

/** Bouton « Plus tard » (US-12) : report de `snooze_days` jours, sans toucher au dernier échange. */
export async function snoozeContactReminder(
  db: Db,
  contactId: string,
  now: Date,
  reminderId?: string,
): Promise<TrackedContact> {
  let updated!: TrackedContact;
  await db.withTransactionAsync(async () => {
    const contact = await requireContact(db, contactId);
    updated = snoozeContact(contact, await getSettings(db), now);
    await saveContact(db, updated);
    if (reminderId) await setReminderAction(db, reminderId, 'snooze');
  });
  return updated;
}

/** Historique des échanges, du plus récent au plus ancien (US-07 CA4 ; série du widget). */
export async function listInteractions(
  db: Db,
  options: { contactId?: string; since?: Date; limit?: number } = {},
): Promise<Interaction[]> {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (options.contactId) {
    where.push('contact_id = ?');
    params.push(options.contactId);
  }
  if (options.since) {
    where.push('occurred_at >= ?');
    params.push(toIso(options.since));
  }
  const sql =
    'SELECT * FROM interaction' +
    (where.length ? ` WHERE ${where.join(' AND ')}` : '') +
    ' ORDER BY occurred_at DESC' +
    (options.limit ? ` LIMIT ${Math.floor(options.limit)}` : '');
  const rows = await db.getAllAsync<InteractionRow>(sql, params);
  return rows.map(interactionFromRow);
}

// ─── Rappels programmés ──────────────────────────────────────────────────────

export async function getReminder(db: Db, id: string): Promise<ScheduledReminder | null> {
  const row = await db.getFirstAsync<ScheduledReminderRow>('SELECT * FROM scheduled_reminder WHERE id = ?', [id]);
  return row ? reminderFromRow(row) : null;
}

export async function setReminderAction(db: Db, id: string, action: ReminderAction): Promise<void> {
  await db.runAsync('UPDATE scheduled_reminder SET action = ? WHERE id = ?', [action, id]);
}

/**
 * Recopie dans `tracked_contact.last_reminded_at` la date des rappels déjà déclenchés,
 * pour la règle « pas plus d'un rappel tous les 2 jours ». À appeler avant de replanifier.
 */
export async function syncLastRemindedAt(db: Db, now: Date): Promise<void> {
  await db.runAsync(
    `UPDATE tracked_contact SET last_reminded_at = fired.last_fire
       FROM (SELECT contact_id, MAX(fire_at) AS last_fire FROM scheduled_reminder
             WHERE kind = 'reminder' AND fire_at <= ? GROUP BY contact_id) AS fired
     WHERE fired.contact_id = tracked_contact.id
       AND (tracked_contact.last_reminded_at IS NULL OR tracked_contact.last_reminded_at < fired.last_fire)`,
    [toIso(now)],
  );
}

/**
 * Remplace les rappels futurs par la nouvelle planification et purge ceux de plus de 60 jours.
 * Les rappels passés sont conservés : ils servent aux pastilles du widget.
 * Renvoie les rappels créés, avec l'identifiant à utiliser pour chaque notification.
 */
export async function replaceFutureReminders(db: Db, planned: PlannedReminder[], now: Date): Promise<ScheduledReminder[]> {
  const created: ScheduledReminder[] = planned
    .filter((p) => p.fireAt > now)
    .map((p) => ({ id: randomUUID(), contactId: p.contactId, kind: p.kind, fireAt: p.fireAt, action: null, createdAt: now }));

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM scheduled_reminder WHERE fire_at > ?', [toIso(now)]);
    await db.runAsync('DELETE FROM scheduled_reminder WHERE fire_at < ?', [toIso(addDays(now, -REMINDER_RETENTION_DAYS))]);
    for (const r of created) {
      await db.runAsync(
        'INSERT INTO scheduled_reminder (id, contact_id, kind, fire_at, action, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
        [r.id, r.contactId, r.kind, toIso(r.fireAt), toIso(now)],
      );
    }
  });
  return created;
}

/** Dates des rappels de contact déjà déclenchés depuis `since` (pastilles « missed » du widget). */
export async function listFiredReminderDates(db: Db, since: Date, now: Date): Promise<Date[]> {
  const rows = await db.getAllAsync<{ fire_at: string }>(
    "SELECT fire_at FROM scheduled_reminder WHERE kind = 'reminder' AND fire_at >= ? AND fire_at <= ? ORDER BY fire_at",
    [toIso(since), toIso(now)],
  );
  return rows.map((r) => new Date(r.fire_at));
}

/** Prochain rappel programmé pour un contact (US-07 CA1), ou `null`. */
export async function nextReminderFor(db: Db, contactId: string, now: Date): Promise<Date | null> {
  const row = await db.getFirstAsync<{ fire_at: string }>(
    "SELECT fire_at FROM scheduled_reminder WHERE contact_id = ? AND kind = 'reminder' AND fire_at > ? ORDER BY fire_at LIMIT 1",
    [contactId, toIso(now)],
  );
  return row ? new Date(row.fire_at) : null;
}

/** Ajoute un rappel isolé (rappel de test en développement), sans toucher à la planification. */
export async function insertReminder(
  db: Db,
  reminder: Pick<ScheduledReminder, 'contactId' | 'kind' | 'fireAt'>,
  now: Date,
): Promise<ScheduledReminder> {
  const created: ScheduledReminder = { id: randomUUID(), ...reminder, action: null, createdAt: now };
  await db.runAsync(
    'INSERT INTO scheduled_reminder (id, contact_id, kind, fire_at, action, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
    [created.id, created.contactId, created.kind, toIso(created.fireAt), toIso(now)],
  );
  return created;
}

// ─── Import ──────────────────────────────────────────────────────────────────

/**
 * Remplace toutes les données par celles d'un fichier d'export (US-16 CA2), en une transaction :
 * en cas d'erreur, rien n'est modifié.
 * @param deviceIdByPhone identifiants du répertoire du téléphone, par numéro E.164 (US-16 CA3).
 */
export async function replaceAllData(
  db: Db,
  file: ExportFile,
  deviceIdByPhone: ReadonlyMap<string, string>,
  now: Date,
): Promise<number> {
  await db.withTransactionAsync(async () => {
    await db.execAsync('DELETE FROM scheduled_reminder; DELETE FROM interaction; DELETE FROM tracked_contact;');
    await updateSettings(db, { ...file.settings, pausedUntil: null, lastWeeklyReviewAt: null });

    for (const c of file.contacts) {
      const interactions = [...c.interactions].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
      const latest = interactions.at(-1);
      const lastContactAt = new Date(c.lastContactAt);
      const contact: TrackedContact = {
        id: randomUUID(),
        deviceContactId: c.phoneE164 ? (deviceIdByPhone.get(c.phoneE164) ?? null) : null,
        displayName: c.displayName,
        phoneE164: c.phoneE164,
        frequencyDays: c.frequencyDays,
        preferredChannel: c.preferredChannel,
        lastContactAt,
        lastContactSource:
          latest && new Date(latest.occurredAt).getTime() === lastContactAt.getTime() ? latest.source : 'manual_edit',
        snoozedUntil: null,
        lastRemindedAt: null,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      };
      await db.runAsync(
        `INSERT INTO tracked_contact (${CONTACT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        contactToParams(contact),
      );
      for (const i of interactions) {
        await insertInteraction(db, contact.id, new Date(i.occurredAt), i.source, i.channel, now);
      }
    }
  });
  return file.contacts.length;
}

/**
 * Développement : prépare un bilan de test. Tous les contacts suivis passent à « dernier échange
 * il y a `daysAgo` jours », et la date du dernier bilan est effacée (le bouton de l'accueil réapparaît).
 */
export async function resetForReviewTest(db: Db, now: Date, daysAgo = 10): Promise<void> {
  const date = toIso(addDays(now, -daysAgo));
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "UPDATE tracked_contact SET last_contact_at = ?, last_contact_source = 'manual_edit', updated_at = ? WHERE archived_at IS NULL",
      [date, toIso(now)],
    );
    await db.runAsync('UPDATE settings SET last_weekly_review_at = NULL WHERE id = 1', []);
  });
}
