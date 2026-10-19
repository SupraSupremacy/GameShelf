import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'
import { games } from './schema-catalog'

/**
 * Precio de un juego en una tienda, en una moneda.
 * Centavos enteros. Guardamos de mas por si despues se compara entre
 * monedas distintas.
 */
export const prices = sqliteTable(
  'prices',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    provider: text('provider', {
      enum: ['steam', 'epic', 'gog'],
    }).notNull(),
    currency: text('currency').notNull(),
    basePrice: integer('base_price').notNull(),
    finalPrice: integer('final_price').notNull(),
    discountPercent: integer('discount_percent').notNull().default(0),
    historyLow: integer('history_low'),
    storeLow: integer('store_low'),
    url: text('url').notNull(),
    fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [unique('prices_game_provider_currency').on(t.gameId, t.provider, t.currency)],
)