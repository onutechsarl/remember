import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrate } from './schema';

const DATABASE_NAME = 'remember.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

/**
 * Connexion unique à la base, migrée à la première ouverture.
 *
 * On n'utilise pas `SQLiteProvider` : les actions sur les notifications (« C'est déjà fait »,
 * « Plus tard ») s'exécutent sans que l'interface soit montée, donc hors de tout contexte React.
 */
export function getDatabase(): Promise<SQLiteDatabase> {
  databasePromise ??= openDatabaseAsync(DATABASE_NAME)
    .then(async (db) => {
      await migrate(db);
      return db;
    })
    .catch((error: unknown) => {
      databasePromise = null; // nouvel essai au prochain appel
      throw error;
    });
  return databasePromise;
}
