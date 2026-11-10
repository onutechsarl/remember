import type { Channel, FrequencyDays, Interaction, InteractionSource, Settings, TrackedContact } from './types';

/**
 * Fichier d'export (data-model.pdf, « Format d'export » ; US-16).
 * Les identifiants internes et ceux du répertoire ne sont pas exportés : à l'import, le lien avec
 * le répertoire du nouveau téléphone se fait par le numéro (US-16 CA3).
 */
export const EXPORT_VERSION = 1;

export type ExportedInteraction = { occurredAt: string; source: InteractionSource; channel: Channel | null };

export type ExportedContact = {
  displayName: string;
  phoneE164: string | null;
  frequencyDays: FrequencyDays;
  preferredChannel: Channel;
  lastContactAt: string;
  interactions: ExportedInteraction[];
};

export type ExportedSettings = Omit<Settings, 'pausedUntil' | 'onboardingCompleted' | 'lastWeeklyReviewAt'>;

export type ExportFile = {
  app: 'remember';
  exportVersion: number;
  exportedAt: string;
  settings: ExportedSettings;
  contacts: ExportedContact[];
};

export function buildExport(
  settings: Settings,
  contacts: readonly TrackedContact[],
  interactions: readonly Interaction[],
  now: Date,
): ExportFile {
  const { pausedUntil: _p, onboardingCompleted: _o, lastWeeklyReviewAt: _l, ...exported } = settings;
  return {
    app: 'remember',
    exportVersion: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    settings: exported,
    contacts: contacts
      .filter((c) => c.archivedAt === null)
      .map((c) => ({
        displayName: c.displayName,
        phoneE164: c.phoneE164,
        frequencyDays: c.frequencyDays,
        preferredChannel: c.preferredChannel,
        lastContactAt: c.lastContactAt.toISOString(),
        interactions: interactions
          .filter((i) => i.contactId === c.id)
          .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
          .map((i) => ({ occurredAt: i.occurredAt.toISOString(), source: i.source, channel: i.channel })),
      })),
  };
}

export class ImportError extends Error {
  constructor(readonly reason: 'invalid' | 'version') {
    super(`Import impossible : ${reason}`);
  }
}

const FREQUENCIES = new Set([7, 14, 30, 60, 90]);
const CHANNELS = new Set(['whatsapp', 'telegram', 'signal', 'viber', 'sms', 'call']);
const SOURCES = new Set([
  'initial_estimate',
  'notification_message',
  'notification_done',
  'app_action',
  'weekly_review',
  'manual_edit',
  'android_call_log',
  'android_notification',
]);

const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const isTime = (v: unknown): v is string => typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v);
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function checkSettings(raw: unknown, defaults: Settings): ExportedSettings {
  const s = isObject(raw) ? raw : {};
  const int = (v: unknown, min: number, max: number, fallback: number) =>
    Number.isInteger(v) && (v as number) >= min && (v as number) <= max ? (v as number) : fallback;
  return {
    language: s.language === 'fr' || s.language === 'en' || s.language === 'system' ? s.language : defaults.language,
    reminderTime: isTime(s.reminderTime) ? s.reminderTime : defaults.reminderTime,
    maxRemindersPerDay: int(s.maxRemindersPerDay, 1, 5, defaults.maxRemindersPerDay),
    snoozeDays: int(s.snoozeDays, 1, 30, defaults.snoozeDays),
    minDaysBetweenReminders: int(s.minDaysBetweenReminders, 1, 30, defaults.minDaysBetweenReminders),
    weeklyReviewEnabled: typeof s.weeklyReviewEnabled === 'boolean' ? s.weeklyReviewEnabled : defaults.weeklyReviewEnabled,
    weeklyReviewWeekday: int(s.weeklyReviewWeekday, 1, 7, defaults.weeklyReviewWeekday),
    weeklyReviewTime: isTime(s.weeklyReviewTime) ? s.weeklyReviewTime : defaults.weeklyReviewTime,
  };
}

function checkContact(raw: unknown): ExportedContact {
  if (!isObject(raw)) throw new ImportError('invalid');
  const { displayName, phoneE164, frequencyDays, preferredChannel, lastContactAt, interactions } = raw;
  if (
    typeof displayName !== 'string' ||
    !displayName.trim() ||
    !(phoneE164 === null || (typeof phoneE164 === 'string' && /^\+\d{6,15}$/.test(phoneE164))) ||
    !FREQUENCIES.has(frequencyDays as number) ||
    !CHANNELS.has(preferredChannel as string) ||
    !isDate(lastContactAt)
  ) {
    throw new ImportError('invalid');
  }
  const list = Array.isArray(interactions) ? interactions : [];
  return {
    displayName: displayName.trim(),
    phoneE164,
    frequencyDays: frequencyDays as FrequencyDays,
    preferredChannel: preferredChannel as Channel,
    lastContactAt,
    interactions: list.map((i) => {
      if (!isObject(i) || !isDate(i.occurredAt) || !SOURCES.has(i.source as string)) throw new ImportError('invalid');
      const channel = i.channel ?? null;
      if (channel !== null && !CHANNELS.has(channel as string)) throw new ImportError('invalid');
      return { occurredAt: i.occurredAt, source: i.source as InteractionSource, channel: channel as Channel | null };
    }),
  };
}

/**
 * Lit et vérifie un fichier d'export. Un réglage absent ou invalide reprend sa valeur par défaut ;
 * un contact invalide rend tout le fichier invalide (on ne fait pas d'import partiel).
 */
export function parseExport(text: string, defaults: Settings): ExportFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError('invalid');
  }
  if (!isObject(raw) || raw.app !== 'remember' || !Array.isArray(raw.contacts)) throw new ImportError('invalid');
  if (typeof raw.exportVersion !== 'number' || raw.exportVersion > EXPORT_VERSION) throw new ImportError('version');
  return {
    app: 'remember',
    exportVersion: raw.exportVersion,
    exportedAt: isDate(raw.exportedAt) ? raw.exportedAt : new Date(0).toISOString(),
    settings: checkSettings(raw.settings, defaults),
    contacts: raw.contacts.map(checkContact),
  };
}
