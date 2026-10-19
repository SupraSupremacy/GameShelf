import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core'
import { games } from './schema-catalog'

/**
 * Un juego en la biblioteca de un usuario.
 *
 * Un mismo juego no puede estar duplicado para un usuario: se posee o no,
 * sin importar en que tienda este. El `unique` lo garantiza a nivel de
 * base de datos, no solo en el codigo.
 *
 * Todos los montos son enteros en centavos. Nunca punto flotante.
 */
export const userGames = sqliteTable(
  'user_games',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id').notNull(),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    platform: text('platform', { enum: ['steam', 'epic', 'gog'] }).notNull(),
    status: text('status', {
      enum: ['backlog', 'playing', 'finished', 'abandoned'],
    })
      .notNull()
      .default('backlog'),
    pricePaid: integer('price_paid'),
    acquiredAt: text('acquired_at'),
    playtimeMinutes: integer('playtime_minutes').notNull().default(0),
    notes: text('notes'),
    source: text('source', { enum: ['api', 'manual'] })
      .notNull()
      .default('manual'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [unique('user_games_user_game').on(t.userId, t.gameId)],
)