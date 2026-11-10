/**
 * Types métier, alignés sur le modèle de données (data-model.pdf, REMEMBER-DD).
 * Ce dossier ne dépend ni de React, ni d'Expo : il se teste sans téléphone.
 */

export type Channel = 'whatsapp' | 'telegram' | 'signal' | 'viber' | 'sms' | 'call';

export type InteractionSource =
  | 'initial_estimate'
  | 'notification_message'
  | 'notification_done'
  | 'app_action'
  | 'weekly_review'
  | 'manual_edit'
  | 'android_call_log'
  | 'android_notification';

export type FrequencyDays = 7 | 14 | 30 | 60 | 90;

export type TrackedContact = {
  id: string;
  deviceContactId: string | null;
  displayName: string;
  phoneE164: string | null;
  frequencyDays: FrequencyDays;
  preferredChannel: Channel;
  lastContactAt: Date;
  lastContactSource: InteractionSource;
  snoozedUntil: Date | null;
  lastRemindedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
};

export type Interaction = {
  id: string;
  contactId: string;
  occurredAt: Date;
  source: InteractionSource;
  channel: Channel | null;
  createdAt: Date;
};

export type Settings = {
  language: 'system' | 'fr' | 'en';
  reminderTime: string; // HH:MM, heure locale
  maxRemindersPerDay: number; // 1 à 5
  snoozeDays: number;
  minDaysBetweenReminders: number;
  weeklyReviewEnabled: boolean;
  weeklyReviewWeekday: number; // 1 = lundi … 7 = dimanche
  weeklyReviewTime: string; // HH:MM
  pausedUntil: Date | null;
  onboardingCompleted: boolean;
  /** Fin du dernier bilan hebdomadaire : le bouton du bilan disparaît ensuite (US-14 CA7). */
  lastWeeklyReviewAt: Date | null;
};

export const DEFAULT_SETTINGS: Settings = {
  language: 'system',
  reminderTime: '18:00',
  maxRemindersPerDay: 2,
  snoozeDays: 2,
  minDaysBetweenReminders: 2,
  weeklyReviewEnabled: true,
  weeklyReviewWeekday: 7,
  weeklyReviewTime: '18:00',
  pausedUntil: null,
  onboardingCompleted: false,
  lastWeeklyReviewAt: null,
};
