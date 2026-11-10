import type { ReminderKind } from '@/domain/reminder-planner';
import type {
  Channel,
  FrequencyDays,
  Interaction,
  InteractionSource,
  Settings,
  TrackedContact,
} from '@/domain/types';

/** Conversion entre les lignes SQLite (snake_case, dates ISO UTC) et les types du domaine. */

export type ContactRow = {
  id: string;
  device_contact_id: string | null;
  display_name: string;
  phone_e164: string | null;
  frequency_days: number;
  preferred_channel: string;
  last_contact_at: string;
  last_contact_source: string;
  snoozed_until: string | null;
  last_reminded_at: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type InteractionRow = {
  id: string;
  contact_id: string;
  occurred_at: string;
  source: string;
  channel: string | null;
  created_at: string;
};

export type SettingsRow = {
  language: string;
  reminder_time: string;
  max_reminders_per_day: number;
  snooze_days: number;
  min_days_between_reminders: number;
  weekly_review_enabled: number;
  weekly_review_weekday: number;
  weekly_review_time: string;
  paused_until: string | null;
  onboarding_completed: number;
};

export type ReminderAction = 'message' | 'done' | 'snooze';

export type ScheduledReminderRow = {
  id: string;
  contact_id: string | null;
  kind: string;
  fire_at: string;
  action: string | null;
  created_at: string;
};

export type ScheduledReminder = {
  id: string;
  contactId: string | null;
  kind: ReminderKind;
  fireAt: Date;
  action: ReminderAction | null;
  createdAt: Date;
};

export const toIso = (date: Date): string => date.toISOString();
export const toIsoOrNull = (date: Date | null): string | null => (date ? date.toISOString() : null);
const toDate = (iso: string): Date => new Date(iso);
const toDateOrNull = (iso: string | null): Date | null => (iso ? new Date(iso) : null);

export function contactFromRow(row: ContactRow): TrackedContact {
  return {
    id: row.id,
    deviceContactId: row.device_contact_id,
    displayName: row.display_name,
    phoneE164: row.phone_e164,
    frequencyDays: row.frequency_days as FrequencyDays,
    preferredChannel: row.preferred_channel as Channel,
    lastContactAt: toDate(row.last_contact_at),
    lastContactSource: row.last_contact_source as InteractionSource,
    snoozedUntil: toDateOrNull(row.snoozed_until),
    lastRemindedAt: toDateOrNull(row.last_reminded_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
    archivedAt: toDateOrNull(row.archived_at),
  };
}

/** Valeurs dans l'ordre des colonnes de `tracked_contact`. */
export function contactToParams(c: TrackedContact): (string | number | null)[] {
  return [
    c.id,
    c.deviceContactId,
    c.displayName,
    c.phoneE164,
    c.frequencyDays,
    c.preferredChannel,
    toIso(c.lastContactAt),
    c.lastContactSource,
    toIsoOrNull(c.snoozedUntil),
    toIsoOrNull(c.lastRemindedAt),
    toIso(c.createdAt),
    toIso(c.updatedAt),
    toIsoOrNull(c.archivedAt),
  ];
}

export function interactionFromRow(row: InteractionRow): Interaction {
  return {
    id: row.id,
    contactId: row.contact_id,
    occurredAt: toDate(row.occurred_at),
    source: row.source as InteractionSource,
    channel: row.channel as Channel | null,
    createdAt: toDate(row.created_at),
  };
}

export function settingsFromRow(row: SettingsRow): Settings {
  return {
    language: row.language as Settings['language'],
    reminderTime: row.reminder_time,
    maxRemindersPerDay: row.max_reminders_per_day,
    snoozeDays: row.snooze_days,
    minDaysBetweenReminders: row.min_days_between_reminders,
    weeklyReviewEnabled: row.weekly_review_enabled === 1,
    weeklyReviewWeekday: row.weekly_review_weekday,
    weeklyReviewTime: row.weekly_review_time,
    pausedUntil: toDateOrNull(row.paused_until),
    onboardingCompleted: row.onboarding_completed === 1,
  };
}

/** Colonne SQL de chaque réglage, et conversion de sa valeur. */
export const SETTINGS_COLUMNS: { [K in keyof Settings]: [column: string, toSql: (v: Settings[K]) => string | number | null] } = {
  language: ['language', (v) => v],
  reminderTime: ['reminder_time', (v) => v],
  maxRemindersPerDay: ['max_reminders_per_day', (v) => v],
  snoozeDays: ['snooze_days', (v) => v],
  minDaysBetweenReminders: ['min_days_between_reminders', (v) => v],
  weeklyReviewEnabled: ['weekly_review_enabled', (v) => (v ? 1 : 0)],
  weeklyReviewWeekday: ['weekly_review_weekday', (v) => v],
  weeklyReviewTime: ['weekly_review_time', (v) => v],
  pausedUntil: ['paused_until', toIsoOrNull],
  onboardingCompleted: ['onboarding_completed', (v) => (v ? 1 : 0)],
};

export function reminderFromRow(row: ScheduledReminderRow): ScheduledReminder {
  return {
    id: row.id,
    contactId: row.contact_id,
    kind: row.kind as ReminderKind,
    fireAt: toDate(row.fire_at),
    action: row.action as ReminderAction | null,
    createdAt: toDate(row.created_at),
  };
}
