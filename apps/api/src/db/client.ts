import postgres from 'postgres'
import { drizzle as drizzlePg, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { PGlite } from '@electric-sql/pglite'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import * as schema from './schema'
import { env } from '../config/env'

/**
 * Tipo publico de la base. Es el de postgres-js (Postgres/Supabase). En tests
 * se usa PGlite (Postgres en proceso) y se castea a este tipo: comparten el
 * mismo dialecto pg y la misma API de query builder, solo cambia el driver.
 */
export type Db = PostgresJsDatabase<typeof schema>

/** En tests se levanta PGlite en memoria en vez de conectarse a Supabase. */
export const isPglite = env.NODE_ENV === 'test'

function createPglite(): Db {
  const client = new PGlite()
  return drizzlePglite(client, { schema }) as unknown as Db
}

function createPostgres(url: string): Db {
  // `prepare: false` es obligatorio con el transaction pooler de Supabase y
  // seguro con el session pooler. `ssl: require` cifra la conexion.
  const client = postgres(url, { prepare: false, ssl: 'require' })
  return drizzlePg(client, { schema })
}

export function createDb(): Db {
  if (isPglite) return createPglite()
  return createPostgres(env.DATABASE_URL)
}

export const db: Db = createDb()
