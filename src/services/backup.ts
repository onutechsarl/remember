import { getDocumentAsync } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

import { getSettings, listActiveContacts, listInteractions, replaceAllData, type Db } from '@/db/repository';
import { buildExport, parseExport, type ExportFile } from '@/domain/backup';
import { DEFAULT_SETTINGS } from '@/domain/types';

import { getContactsAccess, readDeviceContacts } from './contacts';
import { replan } from './planning';

/**
 * Export et import des données au format JSON (US-16), partagés par le menu du système
 * (e-mail, Drive, Fichiers…).
 */

/** Crée le fichier d'export et ouvre le menu de partage (US-16 CA1). */
export async function exportData(db: Db, dialogTitle: string): Promise<void> {
  const now = new Date();
  const file = buildExport(await getSettings(db), await listActiveContacts(db), await listInteractions(db), now);
  const output = new File(Paths.cache, `remember-${now.toISOString().slice(0, 10)}.json`);
  output.create({ overwrite: true });
  await output.write(JSON.stringify(file, null, 2));
  await shareAsync(output.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle });
}

/** Fait choisir un fichier et le vérifie, sans rien modifier. `null` si l'utilisateur annule. */
export async function pickExportFile(): Promise<ExportFile | null> {
  const result = await getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled) return null;
  return parseExport(await new File(result.assets[0].uri).text(), DEFAULT_SETTINGS);
}

/**
 * Remplace les données par celles du fichier (US-16 CA2), après confirmation de l'appelant.
 * Les contacts sont reliés au répertoire du téléphone par leur numéro, si l'accès est autorisé (CA3).
 */
export async function importData(db: Db, file: ExportFile): Promise<number> {
  const access = await getContactsAccess().catch(() => 'denied' as const);
  const deviceIdByPhone = new Map<string, string>();
  if (access === 'all' || access === 'limited') {
    for (const c of await readDeviceContacts()) {
      if (c.phoneE164 && !deviceIdByPhone.has(c.phoneE164)) deviceIdByPhone.set(c.phoneE164, c.deviceContactId);
    }
  }
  const now = new Date();
  const count = await replaceAllData(db, file, deviceIdByPhone, now);
  await replan(db, now);
  return count;
}
