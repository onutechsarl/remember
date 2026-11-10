/// <reference types="node" />

import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { Db } from '../repository';
import { migrate } from '../schema';

/**
 * Base SQLite en mémoire pour les tests, via le module `node:sqlite` de Node.js,
 * exposée avec la même interface que `expo-sqlite`.
 */
export async function createTestDb(): Promise<Db & { raw: DatabaseSync }> {
  const raw = new DatabaseSync(':memory:');
  const params = (p: unknown): SQLInputValue[] => (p === undefined ? [] : Array.isArray(p) ? p : [p as SQLInputValue]);
  const plain = <T>(row: T): T => (row ? { ...row } : row);

  const db = {
    raw,
    execAsync: async (source: string) => {
      raw.exec(source);
    },
    runAsync: async (source: string, p?: unknown) => {
      const result = raw.prepare(source).run(...params(p));
      return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
    },
    getFirstAsync: async (source: string, p?: unknown) => plain(raw.prepare(source).get(...params(p))) ?? null,
    getAllAsync: async (source: string, p?: unknown) => raw.prepare(source).all(...params(p)).map(plain),
    withTransactionAsync: async (task: () => Promise<void>) => {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  };

  await migrate(db as unknown as Db);
  return db as unknown as Db & { raw: DatabaseSync };
}
