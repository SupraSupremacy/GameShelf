import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { createDb } from './client'

/**
 * Aplica las migraciones pendientes.
 * Se ejecuta antes de levantar el servidor (script `db:migrate`), asi el
 * esquema siempre esta al dia y nunca aparece "no such table".
 */
export function runMigrations(db = createDb()): void {
  migrate(db, { migrationsFolder: './src/db/migrations' })
}