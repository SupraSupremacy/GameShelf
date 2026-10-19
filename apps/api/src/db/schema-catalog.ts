import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * Un juego del catalogo, unico por titulo normalizado.
 * `itadId` permite unir el mismo titulo entre tiendas sin fuzzy matching.
 */
export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itadId: text('itad_id').unique(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  releaseDate: text('release_date'),
  imageUrl: text('image_url'),
})

export const genres = sqliteTable('genres', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})