import postgres from 'postgres'
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js'
import { migrate as migratePg } from 'drizzle-orm/postgres-js/migrator'
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator'
import type { PgliteDatabase } from 'drizzle-orm/pglite'
import * as schema from './schema'
import { db, isPglite } from './client'
import { env } from '../config/env'

/**
 * Aplica las migraciones pendientes.
 * Se ejecuta antes de levantar el servidor (script `db:migrate`), asi el
 * esquema siempre esta al dia y nunca aparece "relation does not exist".
 *
 * En tests reutiliza la conexion PGlite exportada para que el resto del
 * codigo vea la misma base en memoria. En Postgres abre una conexion de un
 * solo socket (max: 1), como recomienda el migrator de postgres-js.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = './src/db/migrations'

  if (isPglite) {
    await migratePglite(db as unknown as PgliteDatabase<typeof schema>, { migrationsFolder })
    return
  }

  const client = postgres(env.DATABASE_URL, { prepare: false, ssl: 'require', max: 1 })
  try {
    await migratePg(drizzlePg(client, { schema }), { migrationsFolder })
  } finally {
    await client.end()
  }
}
