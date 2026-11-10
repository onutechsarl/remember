import { getLocales } from 'expo-localization';
import { Contact, ContactField, ContactsSortOrder, getPermissionsAsync, requestPermissionsAsync } from 'expo-contacts';

import { pickPhone } from '@/utils/phone';

/**
 * ContactsService — lecture du répertoire (US-02, US-04), accès limité d'iOS 18 compris.
 * On ne garde que le minimum : identifiant, nom affiché et numéro (architecture.pdf, « Confidentialité »).
 */

export type ContactsAccess = 'all' | 'limited' | 'denied' | 'undetermined';

export type DeviceContact = {
  deviceContactId: string;
  name: string;
  /** Numéro au format E.164, ou `null` s'il est absent ou non convertible. */
  phoneE164: string | null;
  /** Premier numéro tel qu'il est saisi dans le répertoire, pour l'affichage. */
  phoneRaw: string | null;
};

function toAccess(response: Awaited<ReturnType<typeof getPermissionsAsync>>): ContactsAccess {
  if (response.granted) return response.accessPrivileges === 'limited' ? 'limited' : 'all';
  return response.status === 'denied' ? 'denied' : 'undetermined';
}

export async function getContactsAccess(): Promise<ContactsAccess> {
  return toAccess(await getPermissionsAsync());
}

/** Affiche la demande système ; à appeler après l'écran d'explication (US-02 CA1). */
export async function requestContactsAccess(): Promise<ContactsAccess> {
  return toAccess(await requestPermissionsAsync());
}

/** Accès limité d'iOS 18 : propose d'autoriser d'autres contacts (US-02 CA4). */
export async function grantMoreContacts(): Promise<void> {
  await Contact.presentAccessPicker();
}

/** Pays du téléphone, pour lire les numéros sans indicatif. */
export function deviceCountry(): string | null {
  return getLocales()[0]?.regionCode ?? null;
}

/** Contacts du répertoire avec un nom ou un numéro, triés par nom. */
export async function readDeviceContacts(): Promise<DeviceContact[]> {
  const country = deviceCountry();
  // Tri fait ci-dessous. Ne pas utiliser ContactsSortOrder.UserDefault : dans expo-contacts 58, sa valeur
  // ('userDefault') est refusée par le module natif, qui attend 'useDefault'.
  const details = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES], {
    sortOrder: ContactsSortOrder.None,
  });

  return details
    .map((d) => {
      const phone = pickPhone(d.phones, country);
      const name = d.fullName?.trim() || phone.raw || '';
      return { deviceContactId: d.id, name, phoneE164: phone.e164, phoneRaw: phone.raw };
    })
    .filter((c) => c.name !== '')
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
