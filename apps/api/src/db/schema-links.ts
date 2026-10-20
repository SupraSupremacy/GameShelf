import { pgTable, text, integer, primaryKey } from 'drizzle-orm/pg-core'
import { games, genres } from './schema-catalog'

/** Generos del juego. */
export const gameGenres = pgTable(
  'game_genres',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    genreId: integer('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.genreId] })],
)

/** En que tiendas existe este juego y a que direccion ir. */
export const gamePlatforms = pgTable(
  'game_platforms',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    provider: text('provider', {
      enum: ['steam', 'epic', 'gog'],
    }).notNull(),
    externalId: text('external_id'),
    storeUrl: text('store_url').notNull(),
  },
  (t) => [primaryKey({ columns: [t.gameId, t.provider] })],
)
