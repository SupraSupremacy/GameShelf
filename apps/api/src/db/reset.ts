import { sql } from 'drizzle-orm'
import { db, isPglite } from './client'

/**
 * Borra los datos reiniciando las tablas de la app, sin tocar extensiones
 * ni el esquema `public` completo (Supabase guarda cosas ahi).
 *
 *        pnpm db:reset && pnpm db:seed
 */
const TABLES = [
  'user_games',
  'game_genres',
  'game_platforms',
  'price_cache',
  'sync_logs',
  'prices',
  'games',
  'genres',
  'users',
] as const

async function main(): Promise<void> {
  if (isPglite) {
    console.log('reset no aplica en modo test (PGlite es efimero).')
    return
  }

  const list = TABLES.join(', ')
  await db.execute(sql.raw(`drop table if exists ${list} cascade`))
  console.log(`Tablas borradas: ${list}`)
  console.log('Base de datos reiniciada. Corre `pnpm db:migrate && pnpm db:seed`.')
}

main().catch((error: unknown) => {
  console.error('Reset fallo:', error)
  process.exit(1)
})
