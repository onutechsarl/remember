/// <reference types="node" />

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { day, NOW } from '@/domain/__fixtures__';
import { planReminders } from '@/domain/reminder-planner';
import { buildExport } from '@/domain/backup';
import { DEFAULT_SETTINGS } from '@/domain/types';

import { createTestDb } from '../__fixtures__/test-db';
import {
  addContacts,
  archiveContact,
  getContact,
  getReminder,
  getSettings,
  listActiveContacts,
  listFiredReminderDates,
  listInteractions,
  nextReminderFor,
  recordInteraction,
  replaceAllData,
  replaceFutureReminders,
  snoozeContactReminder,
  syncLastRemindedAt,
  trackedKeys,
  updateContact,
  updateSettings,
  type Db,
  type NewContact,
} from '../repository';
import { migrate, MIGRATIONS, SCHEMA_VERSION } from '../schema';

jest.mock('expo-crypto', () => ({ randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID() }));

const marie: NewContact = {
  deviceContactId: 'dev-marie',
  displayName: 'Tantine Marie',
  phoneE164: '+237699123456',
  frequencyDays: 14,
  preferredChannel: 'whatsapp',
  lastContactAnswer: 'unknown',
};
const paul: NewContact = { ...marie, deviceContactId: 'dev-paul', displayName: 'Paul', phoneE164: '+33612345678', lastContactAnswer: 'this_week' };

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

describe('schéma', () => {
  it('crée la ligne de réglages avec les valeurs par défaut', async () => {
    expect(await getSettings(db)).toEqual(DEFAULT_SETTINGS);
  });

  it('enregistre la version du schéma et peut être relancé sans effet', async () => {
    await migrate(db);
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    expect(row?.user_version).toBe(SCHEMA_VERSION);
  });

  it('migre une base en version 1 sans perdre ses données', async () => {
    const old = await createTestDb();
    // Base créée par une version précédente : seulement la migration 1.
    const raw = (old as unknown as { raw: import('node:sqlite').DatabaseSync }).raw;
    raw.exec('DROP TABLE scheduled_reminder; DROP TABLE interaction; DROP TABLE tracked_contact; DROP TABLE settings;');
    raw.exec(MIGRATIONS[0]);
    raw.exec("UPDATE settings SET max_reminders_per_day = 4; PRAGMA user_version = 1;");

    await migrate(old);
    expect(await getSettings(old)).toMatchObject({ maxRemindersPerDay: 4, appearance: 'system' });
    const row = await old.getFirstAsync<{ user_version: number }>('PRAGMA user_version', []);
    expect(row?.user_version).toBe(2);
  });

  it('active les clés étrangères', async () => {
    await expect(
      db.runAsync("INSERT INTO interaction VALUES ('i', 'inconnu', 'x', 'app_action', NULL, 'x')", []),
    ).rejects.toThrow(/FOREIGN KEY/);
  });
});

describe('réglages', () => {
  it('met à jour seulement les champs donnés, booléens et dates compris', async () => {
    const updated = await updateSettings(db, { maxRemindersPerDay: 4, weeklyReviewEnabled: false, pausedUntil: day(5) });
    expect(updated).toEqual({ ...DEFAULT_SETTINGS, maxRemindersPerDay: 4, weeklyReviewEnabled: false, pausedUntil: day(5) });
  });
});

describe('contacts', () => {
  it('ajoute des contacts avec leur estimation initiale', async () => {
    const [created] = await addContacts(db, [marie], NOW);
    expect(await getContact(db, created.id)).toEqual(created);
    expect(created).toMatchObject({ lastContactAt: new Date(2026, 9, 5, 10), lastContactSource: 'initial_estimate' });
    expect(await listInteractions(db, { contactId: created.id })).toMatchObject([{ source: 'initial_estimate' }]);
  });

  it('ignore un contact déjà suivi, par identifiant ou par numéro', async () => {
    await addContacts(db, [marie], NOW);
    const created = await addContacts(db, [marie, { ...marie, deviceContactId: 'autre' }, paul], NOW);
    expect(created.map((c) => c.displayName)).toEqual(['Paul']);
    expect((await trackedKeys(db)).phones).toEqual(new Set([marie.phoneE164, paul.phoneE164]));
  });

  it('accepte plusieurs contacts sans numéro (US-04 CA3)', async () => {
    const noPhone = { ...marie, phoneE164: null };
    const created = await addContacts(db, [noPhone, { ...noPhone, deviceContactId: 'dev-2' }], NOW);
    expect(created).toHaveLength(2);
  });

  it('modifie la fréquence et la messagerie', async () => {
    const [created] = await addContacts(db, [marie], NOW);
    await updateContact(db, created.id, { frequencyDays: 30, preferredChannel: 'telegram' }, day(1));
    expect(await getContact(db, created.id)).toMatchObject({ frequencyDays: 30, preferredChannel: 'telegram', updatedAt: day(1) });
  });

  it('archive un contact sans perdre son historique, et permet de le suivre à nouveau', async () => {
    const [created] = await addContacts(db, [marie], NOW);
    await archiveContact(db, created.id, day(1));
    expect(await listActiveContacts(db)).toEqual([]);
    expect(await listInteractions(db, { contactId: created.id })).toHaveLength(1);
    expect(await addContacts(db, [marie], day(2))).toHaveLength(1);
  });

  it('liste les contacts actifs par ordre alphabétique', async () => {
    await addContacts(db, [marie, paul], NOW);
    expect((await listActiveContacts(db)).map((c) => c.displayName)).toEqual(['Paul', 'Tantine Marie']);
  });
});

describe('échanges', () => {
  it('note un échange depuis une notification et renseigne l’action du rappel', async () => {
    const [created] = await addContacts(db, [marie], NOW);
    const [reminder] = await replaceFutureReminders(db, [{ contactId: created.id, kind: 'reminder', fireAt: day(0, 18) }], NOW);
    await snoozeContactReminder(db, created.id, day(0, 18, 1));

    const updated = await recordInteraction(
      db,
      { contactId: created.id, occurredAt: day(1, 9), source: 'notification_message', channel: 'whatsapp', reminderId: reminder.id },
      day(1, 9),
    );

    expect(updated).toMatchObject({ lastContactAt: day(1, 9), lastContactSource: 'notification_message', snoozedUntil: null });
    expect(await getContact(db, created.id)).toEqual(updated);
    expect((await getReminder(db, reminder.id))?.action).toBe('message');
    expect(await listInteractions(db, { contactId: created.id, limit: 1 })).toMatchObject([
      { source: 'notification_message', channel: 'whatsapp' },
    ]);
  });

  it('une correction manuelle peut reculer la date', async () => {
    const [created] = await addContacts(db, [paul], NOW);
    const updated = await recordInteraction(db, { contactId: created.id, occurredAt: day(-40), source: 'manual_edit' }, NOW);
    expect(updated.lastContactAt).toEqual(day(-40));
  });

  it('annule tout si le contact n’existe pas', async () => {
    await expect(recordInteraction(db, { contactId: 'inconnu', occurredAt: NOW, source: 'app_action' }, NOW)).rejects.toThrow(
      /introuvable/,
    );
    expect(await listInteractions(db)).toEqual([]);
  });

  it('« Plus tard » reporte de snooze_days jours', async () => {
    const [created] = await addContacts(db, [marie], NOW);
    await updateSettings(db, { snoozeDays: 3 });
    const updated = await snoozeContactReminder(db, created.id, NOW);
    expect(updated.snoozedUntil).toEqual(new Date(2026, 9, 22, 10));
    expect(updated.lastContactAt).toEqual(created.lastContactAt);
  });

  it('filtre l’historique par date', async () => {
    const [created] = await addContacts(db, [marie], NOW);
    await recordInteraction(db, { contactId: created.id, occurredAt: day(2), source: 'weekly_review' }, day(2));
    expect((await listInteractions(db, { since: day(1) })).map((i) => i.source)).toEqual(['weekly_review']);
  });
});

describe('rappels programmés', () => {
  it('remplace les rappels futurs et garde les rappels passés', async () => {
    const contacts = await addContacts(db, [marie, paul], NOW);
    const settings = await getSettings(db);

    const first = await replaceFutureReminders(db, planReminders(contacts, settings, NOW), NOW);
    expect(first.length).toBeGreaterThan(0);

    // Le lendemain, le rappel de lundi 18:00 est parti ; on replanifie.
    const tuesday = day(1, 9);
    await syncLastRemindedAt(db, tuesday);
    const refreshed = await listActiveContacts(db);
    expect(refreshed.find((c) => c.displayName === 'Tantine Marie')?.lastRemindedAt).toEqual(day(0, 18));

    const second = await replaceFutureReminders(db, planReminders(refreshed, settings, tuesday), tuesday);
    const remaining = await db.getAllAsync<{ fire_at: string }>('SELECT fire_at FROM scheduled_reminder ORDER BY fire_at', []);
    expect(remaining).toHaveLength(second.length + 1);
    expect(await listFiredReminderDates(db, day(0, 0), tuesday)).toEqual([day(0, 18)]);

    // La règle des 2 jours est respectée : pas de rappel mardi pour Marie.
    const marieId = contacts.find((c) => c.displayName === 'Tantine Marie')?.id;
    const nextForMarie = second.find((r) => r.contactId === marieId);
    expect(nextForMarie?.fireAt).toEqual(day(2, 18));
  });

  it('purge les rappels de plus de 60 jours', async () => {
    await replaceFutureReminders(db, [{ contactId: null, kind: 'weekly_review', fireAt: day(-70) }], day(-71));
    await replaceFutureReminders(db, [], NOW);
    expect(await db.getAllAsync('SELECT * FROM scheduled_reminder', [])).toEqual([]);
  });

  it('donne le prochain rappel d’un contact', async () => {
    const [created] = await addContacts(db, [marie], NOW);
    await replaceFutureReminders(
      db,
      [
        { contactId: created.id, kind: 'reminder', fireAt: day(2, 18) },
        { contactId: created.id, kind: 'reminder', fireAt: day(0, 18) },
        { contactId: null, kind: 'weekly_review', fireAt: day(0, 12) },
      ],
      NOW,
    );
    expect(await nextReminderFor(db, created.id, NOW)).toEqual(day(0, 18));
    expect(await nextReminderFor(db, created.id, day(3))).toBeNull();
  });

  it('ignore les rappels planifiés dans le passé', async () => {
    const created = await replaceFutureReminders(db, [{ contactId: null, kind: 'reopen', fireAt: day(-1) }], NOW);
    expect(created).toEqual([]);
  });
});

describe('import', () => {
  it('remplace toutes les données et relie les contacts au répertoire par le numéro', async () => {
    const [created] = await addContacts(db, [marie, paul], NOW);
    await recordInteraction(db, { contactId: created.id, occurredAt: day(-3), source: 'weekly_review' }, day(-3));
    const settings = { ...(await getSettings(db)), maxRemindersPerDay: 4 };
    const file = buildExport(settings, await listActiveContacts(db), await listInteractions(db), NOW);

    // Nouveau téléphone : autre base, autres identifiants de répertoire.
    const other = await createTestDb();
    await addContacts(other, [{ ...marie, displayName: 'À remplacer', phoneE164: '+15145550199', deviceContactId: 'z' }], NOW);
    const count = await replaceAllData(other, file, new Map([['+237699123456', 'nouveau-id']]), day(1));

    expect(count).toBe(2);
    expect((await getSettings(other)).maxRemindersPerDay).toBe(4);
    const imported = await listActiveContacts(other);
    expect(imported.map((c) => c.displayName)).toEqual(['Paul', 'Tantine Marie']);
    const importedMarie = imported.find((c) => c.displayName === 'Tantine Marie');
    expect(importedMarie).toMatchObject({ deviceContactId: 'nouveau-id', lastContactSource: 'weekly_review' });
    expect(imported.find((c) => c.displayName === 'Paul')?.deviceContactId).toBeNull();
    expect(await listInteractions(other, { contactId: importedMarie?.id })).toHaveLength(2);
  });

  it('ne modifie rien si l’import échoue', async () => {
    await addContacts(db, [marie], NOW);
    const file = buildExport(DEFAULT_SETTINGS, [], [], NOW);
    // Deux contacts avec le même numéro : contrainte d'unicité violée au milieu de l'import.
    const duplicate = { displayName: 'A', phoneE164: '+33612345678', frequencyDays: 14 as const, preferredChannel: 'sms' as const, lastContactAt: NOW.toISOString(), interactions: [] };
    file.contacts = [duplicate, { ...duplicate, displayName: 'B' }];
    await expect(replaceAllData(db, file, new Map(), NOW)).rejects.toThrow(/UNIQUE/);
    expect((await listActiveContacts(db)).map((c) => c.displayName)).toEqual(['Tantine Marie']);
  });
});
