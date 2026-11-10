import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Schéma SQLite (data-model.pdf, « Dictionnaire de données »).
 * Dates stockées en texte ISO 8601, en UTC.
 */
export const SCHEMA_VERSION = 1;

const CREATE_TABLES_V1 = `
CREATE TABLE IF NOT EXISTS tracked_contact (
  id TEXT PRIMARY KEY NOT NULL,
  device_contact_id TEXT,
  display_name TEXT NOT NULL,
  phone_e164 TEXT,
  frequency_days INTEGER NOT NULL CHECK (frequency_days > 0),
  preferred_channel TEXT NOT NULL DEFAULT 'whatsapp',
  last_contact_at TEXT NOT NULL,
  last_contact_source TEXT NOT NULL,
  snoozed_until TEXT,
  last_reminded_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_contact_archived ON tracked_contact (archived_at);
CREATE INDEX IF NOT EXISTS idx_contact_last ON tracked_contact (last_contact_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_phone ON tracked_contact (phone_e164) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS interaction (
  id TEXT PRIMARY KEY NOT NULL,
  contact_id TEXT NOT NULL REFERENCES tracked_contact (id),
  occurred_at TEXT NOT NULL,
  source TEXT NOT NULL,
  channel TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interaction_contact ON interaction (contact_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_interaction_occurred ON interaction (occurred_at);

CREATE TABLE IF NOT EXISTS scheduled_reminder (
  id TEXT PRIMARY KEY NOT NULL,
  contact_id TEXT REFERENCES tracked_contact (id),
  kind TEXT NOT NULL,
  fire_at TEXT NOT NULL,
  action TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reminder_fire ON scheduled_reminder (fire_at);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  language TEXT NOT NULL DEFAULT 'system',
  reminder_time TEXT NOT NULL DEFAULT '18:00',
  max_reminders_per_day INTEGER NOT NULL DEFAULT 2,
  snooze_days INTEGER NOT NULL DEFAULT 2,
  min_days_between_reminders INTEGER NOT NULL DEFAULT 2,
  weekly_review_enabled INTEGER NOT NULL DEFAULT 1,
  weekly_review_weekday INTEGER NOT NULL DEFAULT 7,
  weekly_review_time TEXT NOT NULL DEFAULT '18:00',
  paused_until TEXT,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  schema_version INTEGER NOT NULL DEFAULT 1
);
INSERT OR IGNORE INTO settings (id) VALUES (1);
`;

/** MIGRATIONS[i] fait passer le schéma de la version i à la version i + 1. */
const MIGRATIONS: string[] = [CREATE_TABLES_V1];

type MigratableDb = Pick<SQLiteDatabase, 'execAsync' | 'getFirstAsync' | 'withTransactionAsync'>;

/**
 * Crée ou met à jour le schéma. La version courante est lue dans `PRAGMA user_version`
 * et recopiée dans `settings.schema_version` (data-model.pdf, table settings).
 */
export async function migrate(db: MigratableDb): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version > SCHEMA_VERSION) {
    throw new Error(`Base en version ${version}, plus récente que l'application (${SCHEMA_VERSION})`);
  }

  while (version < SCHEMA_VERSION) {
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`UPDATE settings SET schema_version = ${next}; PRAGMA user_version = ${next};`);
    });
    version = next;
  }
}
