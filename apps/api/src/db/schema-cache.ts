import { pgTable, text, integer, serial, timestamp, index } from 'drizzle-orm/pg-core'

/**
 * Control de expiracion de la cache de precios.
 * Evita pegarle a la API en cada request del comparador.
 */
export const priceCache = pgTable(
  'price_cache',
  {
    gameId: integer('game_id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('price_cache_expires_at').on(t.expiresAt)],
)

/** Registro de sincronizaciones, para mostrar estado y depurar errores. */
export const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  provider: text('provider', { enum: ['steam', 'epic', 'gog'] }).notNull(),
  status: text('status', { enum: ['ok', 'error', 'partial'] }).notNull(),
  itemsFound: integer('items_found').notNull().default(0),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
})
