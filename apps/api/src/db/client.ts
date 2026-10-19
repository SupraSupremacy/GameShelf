import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import * as schema from './schema'
import { env } from '../config/env'

export type Db = BetterSQLite3Database<typeof schema>

/** Traduce `file:./data/x.db` a una ruta absoluta y crea el directorio. */
function resolveDbPath(url: string): string {
  const raw = url.replace(/^file:/, '')
  const abs = resolve(process.cwd(), raw)
  mkdirSync(dirname(abs), { recursive: true })
  return abs
}

export function createDb(url = env.DATABASE_URL): Db {
  const sqlite = new Database(resolveDbPath(url))
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

export const db: Db = createDb()