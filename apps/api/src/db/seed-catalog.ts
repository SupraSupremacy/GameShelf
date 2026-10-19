import { eq } from 'drizzle-orm'
import type { ProviderId } from '@gameshelf/shared'
import { db } from './client'
import { games, genres, gameGenres, gamePlatforms } from './schema'
import { MOCK_CATALOG_READY } from '../providers/mock-catalog'

const STORE_URLS: Record<ProviderId, string> = {
  steam: 'https://store.steampowered.com/app/',
  epic: 'https://store.epicgames.com/',
  gog: 'https://www.gog.com/en/game/',
}

/**
 * Inserta catalogo y generos.
 * Idempotente: se puede correr varias veces sin duplicar nada.
 */
export async function seedCatalog(): Promise<Map<string, number>> {
  const genreIds = new Map<string, number>()
  const gameIds = new Map<string, number>()

  for (const entry of MOCK_CATALOG_READY) {
    for (const name of entry.genres) {
      if (genreIds.has(name)) continue
      await db.insert(genres).values({ name }).onConflictDoNothing()
      const [row] = await db.select().from(genres).where(eq(genres.name, name)).limit(1)
      if (row) genreIds.set(name, row.id)
    }
  }

  for (const entry of MOCK_CATALOG_READY) {
    await db
      .insert(games)
      .values({
        itadId: entry.itadId,
        slug: entry.slug,
        title: entry.title,
        releaseDate: entry.releaseDate,
        imageUrl: entry.imageUrl,
      })
      .onConflictDoNothing()

    const [game] = await db.select().from(games).where(eq(games.slug, entry.slug)).limit(1)
    if (!game) continue
    gameIds.set(entry.slug, game.id)

    for (const genre of entry.genres) {
      const genreId = genreIds.get(genre)
      if (genreId) {
        await db.insert(gameGenres).values({ gameId: game.id, genreId }).onConflictDoNothing()
      }
    }

    for (const provider of entry.availableOn) {
      await db
        .insert(gamePlatforms)
        .values({
          gameId: game.id,
          provider,
          externalId: null,
          storeUrl: `${STORE_URLS[provider]}${entry.slug}`,
        })
        .onConflictDoNothing()
    }
  }

  console.log(`Catalogo: ${gameIds.size} juegos, ${genreIds.size} generos`)
  return gameIds
}