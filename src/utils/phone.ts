import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/**
 * Numéros de téléphone (architecture.pdf, « Numéros de téléphone ») : le répertoire mélange
 * numéros locaux et étrangers ; un numéro sans indicatif est lu avec le pays du téléphone.
 */

/** Convertit un numéro au format E.164 (« +237699123456 »), ou `null` s'il n'est pas valide. */
export function toE164(raw: string, defaultCountry: string | null): string | null {
  const phone = parsePhoneNumberFromString(raw, (defaultCountry?.toUpperCase() as CountryCode) ?? undefined);
  return phone?.isValid() ? phone.number : null;
}

/** Affiche un numéro E.164 au format international lisible (« +237 6 99 12 34 56 »). */
export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}

type RawPhone = { label?: string; number?: string };

const MOBILE_LABEL = /mobile|cell|iphone|portable|main/i;

/**
 * Choisit le numéro à utiliser pour un contact : le premier mobile valide, sinon le premier
 * numéro valide. `raw` garde le premier numéro saisi, pour l'afficher même s'il n'est pas valide.
 */
export function pickPhone(
  phones: readonly RawPhone[] | null | undefined,
  defaultCountry: string | null,
): { e164: string | null; raw: string | null } {
  const numbers = (phones ?? []).filter((p): p is RawPhone & { number: string } => !!p.number?.trim());
  if (numbers.length === 0) return { e164: null, raw: null };

  const valid = numbers
    .map((p) => ({ label: p.label ?? '', e164: toE164(p.number, defaultCountry) }))
    .filter((p): p is { label: string; e164: string } => p.e164 !== null);
  const best = valid.find((p) => MOBILE_LABEL.test(p.label)) ?? valid[0];
  return { e164: best?.e164 ?? null, raw: numbers[0].number };
}
