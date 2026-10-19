import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

/**
 * Control de expiracion de la cache de precios.
 * Evita pegarle a la API en cada request del comparador.
 */
export const priceCache = sqliteTable(
  'price_cache',
  {
    gameId: integer('game_id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [index('price_cache_expires_at').on(t.expiresAt)],
)

/** Registro de sincronizaciones, para mostrar estado y depurar errores. */
export const syncLogs = sqliteTable('sync_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  provider: text('provider', { enum: ['steam', 'epic', 'gog'] }).notNull(),
  status: text('status', { enum: ['ok', 'error', 'partial'] }).notNull(),
  itemsFound: integer('items_found').notNull().default(0),
  error: text('error'),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
})