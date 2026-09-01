import type { Database, JsStorageDb, Sqlite3Static, SqlValue } from '@sqlite.org/sqlite-wasm';
import { MoleculeDocument, cloneDocument } from './chemistry.models';

export type DatabaseState = 'idle' | 'loading' | 'ready' | 'fallback' | 'error';

export interface MolecularDatabaseStatus {
  state: DatabaseState;
  engine: string;
  persistence: 'sqlite-local' | 'memory' | 'local-storage';
  documentCount: number;
  bytes: number;
  message: string;
}

export interface DatabaseDocumentRecord {
  id: string;
  name: string;
  kind: 'autosave' | 'library';
  savedAt: string;
  document: MoleculeDocument;
}

export const INITIAL_DATABASE_STATUS: MolecularDatabaseStatus = {
  state: 'idle',
  engine: 'SQLite-WASM',
  persistence: 'local-storage',
  documentCount: 0,
  bytes: 0,
  message: 'Pendiente de inicialización',
};

export class MolecularDatabase {
  private db: Database | JsStorageDb | null = null;
  private sqlite: Sqlite3Static | null = null;
  private statusValue = INITIAL_DATABASE_STATUS;

  get status(): MolecularDatabaseStatus {
    return { ...this.statusValue };
  }

  async initialize(): Promise<MolecularDatabaseStatus> {
    if (this.db) return this.refreshStatus();
    this.statusValue = { ...this.statusValue, state: 'loading', message: 'Cargando motor WASM' };
    try {
      const { default: sqlite3InitModule } = await import('@sqlite.org/sqlite-wasm');
      this.sqlite = await sqlite3InitModule();
      const StorageDatabase = this.sqlite.oo1.JsStorageDb;
      this.db = StorageDatabase
        ? new StorageDatabase({ filename: 'local', flags: 'c' })
        : new this.sqlite.oo1.DB(':memory:', 'ct');
      this.db.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS molecular_documents (
          id TEXT NOT NULL,
          kind TEXT NOT NULL CHECK(kind IN ('autosave', 'library')),
          name TEXT NOT NULL,
          saved_at TEXT NOT NULL,
          payload TEXT NOT NULL,
          PRIMARY KEY (id, kind)
        );
        CREATE INDEX IF NOT EXISTS molecular_documents_kind_saved
          ON molecular_documents(kind, saved_at DESC);
        CREATE TABLE IF NOT EXISTS molecular_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      this.statusValue = {
        ...this.statusValue,
        state: 'ready',
        engine: `SQLite ${this.sqlite.version.libVersion}`,
        persistence: StorageDatabase ? 'sqlite-local' : 'memory',
        message: StorageDatabase
          ? 'Base SQL persistente en este dispositivo'
          : 'SQLite activo en memoria; se mantiene el respaldo local',
      };
      return this.refreshStatus();
    } catch (error) {
      this.statusValue = {
        ...this.statusValue,
        state: 'fallback',
        persistence: 'local-storage',
        message:
          error instanceof Error
            ? `Respaldo local activo: ${error.message}`
            : 'Respaldo local activo',
      };
      return this.status;
    }
  }

  saveDocument(
    document: MoleculeDocument,
    kind: DatabaseDocumentRecord['kind'],
    savedAt = new Date().toISOString(),
  ): MolecularDatabaseStatus {
    if (!this.db) return this.status;
    const source = cloneDocument(document);
    this.db.exec({
      sql: `INSERT INTO molecular_documents(id, kind, name, saved_at, payload)
        VALUES(?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(id, kind) DO UPDATE SET
          name = excluded.name,
          saved_at = excluded.saved_at,
          payload = excluded.payload`,
      bind: [source.id, kind, source.name, savedAt, JSON.stringify(source)],
    });
    return this.refreshStatus();
  }

  deleteDocument(id: string, kind: DatabaseDocumentRecord['kind']): MolecularDatabaseStatus {
    if (!this.db) return this.status;
    this.db.exec({
      sql: 'DELETE FROM molecular_documents WHERE id = ?1 AND kind = ?2',
      bind: [id, kind],
    });
    return this.refreshStatus();
  }

  listDocuments(kind: DatabaseDocumentRecord['kind']): DatabaseDocumentRecord[] {
    if (!this.db) return [];
    const rows: Record<string, SqlValue>[] = [];
    this.db.exec({
      sql: `SELECT id, name, kind, saved_at, payload
        FROM molecular_documents WHERE kind = ?1 ORDER BY saved_at DESC`,
      bind: [kind],
      rowMode: 'object',
      resultRows: rows,
    });
    return rows.flatMap((row) => {
      try {
        return [
          {
            id: String(row['id']),
            name: String(row['name']),
            kind: String(row['kind']) as DatabaseDocumentRecord['kind'],
            savedAt: String(row['saved_at']),
            document: cloneDocument(JSON.parse(String(row['payload'])) as MoleculeDocument),
          },
        ];
      } catch {
        return [];
      }
    });
  }

  private refreshStatus(): MolecularDatabaseStatus {
    if (!this.db) return this.status;
    const rows: Array<Record<string, SqlValue>> = [];
    this.db.exec({
      sql: 'SELECT COUNT(*) AS total FROM molecular_documents',
      rowMode: 'object',
      resultRows: rows,
    });
    const storageDb = this.db as JsStorageDb;
    this.statusValue = {
      ...this.statusValue,
      documentCount: Number(rows[0]?.['total'] ?? 0),
      bytes: typeof storageDb.storageSize === 'function' ? Number(storageDb.storageSize()) : 0,
    };
    return this.status;
  }
}
