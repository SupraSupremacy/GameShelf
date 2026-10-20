import { pgTable, text, serial } from 'drizzle-orm/pg-core'

/**
 * Un juego del catalogo, unico por titulo normalizado.
 * `itadId` permite unir el mismo titulo entre tiendas sin fuzzy matching.
 */
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  itadId: text('itad_id').unique(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  releaseDate: text('release_date'),
  imageUrl: text('image_url'),
})

export const genres = pgTable('genres', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
})
