import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client'
import { games, userGames, gameGenres, genres, gamePlatforms } from '../db/schema'
import { eq, and, desc, sql, inArray } from 'drizzle-orm'
import { GAME_STATUSES, PROVIDERS } from '@gameshelf/shared'
import type { LibraryEntry, LibraryStats, Paginated, GameStatus, ProviderId } from '@gameshelf/shared'
import { sessionUserId } from '../session'
import { slugFromTitle } from '../slug'

const AddGameSchema = z.object({
  itadId: z.string().nullable().optional(),
  slug: z.string().min(1).optional(),
  title: z.string().min(1),
  platform: z.enum(['steam', 'epic', 'gog']),
  pricePaid: z.number().int().nonnegative().nullable().optional(),
})

const UpdateSchema = z.object({
  status: z.enum(['backlog', 'playing', 'finished', 'abandoned']).optional(),
  pricePaid: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().nullable().optional(),
  playtimeMinutes: z.number().int().nonnegative().optional(),
})

const ParamsSchema = z.object({ gameId: z.coerce.number().int().positive() })

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(GAME_STATUSES).optional(),
  provider: z.enum(PROVIDERS).optional(),
  genre: z.string().min(1).optional(),
})

type EntryRow = {
  gameId: number
  status: string
  pricePaid: number | null
  acquiredAt: string | null
  playtimeMinutes: number
  notes: string | null
  title: string
  slug: string
  imageUrl: string | null
  releaseDate: string | null
}

/** Completa una fila de biblioteca con sus generos y plataformas. */
async function hydrate(row: EntryRow): Promise<LibraryEntry> {
  const plats = await db
    .select({
      provider: gamePlatforms.provider,
      externalId: gamePlatforms.externalId,
      storeUrl: gamePlatforms.storeUrl,
    })
    .from(gamePlatforms)
    .where(eq(gamePlatforms.gameId, row.gameId))
  const gens = await db
    .select({ name: genres.name })
    .from(gameGenres)
    .innerJoin(genres, eq(genres.id, gameGenres.genreId))
    .where(eq(gameGenres.gameId, row.gameId))

  return {
    gameId: row.gameId,
    title: row.title,
    slug: row.slug,
    imageUrl: row.imageUrl,
    releaseDate: row.releaseDate,
    genres: gens.map((g) => g.name),
    platforms: plats,
    status: row.status as GameStatus,
    pricePaid: row.pricePaid,
    acquiredAt: row.acquiredAt,
    playtimeMinutes: row.playtimeMinutes,
    notes: row.notes,
  }
}

/** Entrada completa de la biblioteca, o null si ese usuario no lo tiene. */
async function findEntry(userId: string, gameId: number): Promise<LibraryEntry | null> {
  const [row] = await db
    .select({
      gameId: userGames.gameId,
      status: userGames.status,
      pricePaid: userGames.pricePaid,
      acquiredAt: userGames.acquiredAt,
      playtimeMinutes: userGames.playtimeMinutes,
      notes: userGames.notes,
      title: games.title,
      slug: games.slug,
      imageUrl: games.imageUrl,
      releaseDate: games.releaseDate,
    })
    .from(userGames)
    .innerJoin(games, eq(games.id, userGames.gameId))
    .where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)))
    .limit(1)

  return row ? hydrate(row) : null
}

/**
 * Resuelve un juego del catalogo a partir de lo que manda el frontend.
 *
 * Orden: itadId (identidad estable entre tiendas), luego slug exacto, luego
 * titulo sin distinguir mayusculas, y por ultimo el slug derivado del titulo.
 * Si ninguna coincide el juego no existe: se responde 404 en vez de inventar
 * un id, que era el fallback anterior (caia siempre en el juego 1).
 */
async function resolveCatalogGame(data: {
  itadId?: string | null
  slug?: string
  title: string
}) {
  if (data.itadId) {
    const [byItad] = await db.select().from(games).where(eq(games.itadId, data.itadId)).limit(1)
    if (byItad) return byItad
  }
  if (data.slug) {
    const [bySlug] = await db.select().from(games).where(eq(games.slug, data.slug)).limit(1)
    if (bySlug) return bySlug
  }

  const title = data.title.trim()
  const [byTitle] = await db
    .select()
    .from(games)
    .where(sql`lower(${games.title}) = ${title.toLowerCase()}`)
    .limit(1)
  if (byTitle) return byTitle

  const guess = title.toLowerCase().replace(/\s+/g, '-')
  const [byGuess] = await db.select().from(games).where(eq(games.slug, guess)).limit(1)
  return byGuess ?? null
}

/**
 * Agrega un juego nuevo al catalogo a partir de un id de ITAD real.
 *
 * Se usa cuando el alta llega con un itadId que no esta en la base (resulta
 * de la busqueda en IsThereAnyDeal). Es la unica via de ampliar el catalogo
 * sin editar la semilla; los `itadId` mock (`mock-*`) nunca pasan por aqui.
 */
async function createCatalogGame(data: { itadId: string; slug?: string; title: string }) {
  const title = data.title.trim()
  let slug = data.slug?.trim()
  if (!slug) slug = slugFromTitle(title)

  // Si el slug derivado choca con otro juego, se usa el itadId (unico y apto
  // para URL) en su lugar.
  const [cerrado] = await db.select({ id: games.id }).from(games).where(eq(games.slug, slug)).limit(1)
  if (cerrado) slug = data.itadId

  await db.insert(games).values({ itadId: data.itadId, slug, title }).onConflictDoNothing()
  const [row] = await db.select().from(games).where(eq(games.itadId, data.itadId)).limit(1)
  return row ?? null
}

export async function libraryRoutes(app: FastifyInstance): Promise<void> {
  app.get('/library', async (req, reply) => {
    const userId = sessionUserId(req)
    if (!userId) return reply.code(401).send({ error: 'Sesion requerida' })

    const parse = ListQuerySchema.safeParse(req.query)
    if (!parse.success) return reply.code(400).send({ error: 'Filtros invalidos' })
    const { page, limit, status, provider, genre } = parse.data

    const filters = [eq(userGames.userId, userId)]
    if (status) filters.push(eq(userGames.status, status))
    if (provider) filters.push(eq(userGames.platform, provider))
    if (genre) {
      // Subquery de ids para no duplicar filas con los joins: cada juego
      // puede tener varios generos, y aqui solo interesan los que lo tienen.
      const genreRows = await db
        .select({ gameId: gameGenres.gameId })
        .from(gameGenres)
        .innerJoin(genres, eq(genres.id, gameGenres.genreId))
        .where(eq(genres.name, genre))
      const gameIds = genreRows.map((r) => r.gameId)

      // Si nadie en el catalogo tiene ese genero no hay nada que buscar.
      if (gameIds.length === 0) {
        const res: Paginated<LibraryEntry> = {
          items: [],
          total: 0,
          page,
          limit,
          pageCount: 1,
        }
        return res
      }
      filters.push(inArray(userGames.gameId, gameIds))
    }
    const where = and(...filters)

    const all = await db
      .select({
        gameId: userGames.gameId,
        status: userGames.status,
        pricePaid: userGames.pricePaid,
        acquiredAt: userGames.acquiredAt,
        playtimeMinutes: userGames.playtimeMinutes,
        notes: userGames.notes,
        title: games.title,
        slug: games.slug,
        imageUrl: games.imageUrl,
        releaseDate: games.releaseDate,
      })
      .from(userGames)
      .innerJoin(games, eq(games.id, userGames.gameId))
      .where(where)
      .orderBy(desc(userGames.createdAt), games.title)
      .offset((page - 1) * limit)
      .limit(limit)

    const totalQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(userGames)
      .where(where)
    const total = totalQuery[0]?.count ?? all.length

    const items: LibraryEntry[] = await Promise.all(all.map(hydrate))

    const pageCount = Math.ceil(total / limit) || 1
    const res: Paginated<LibraryEntry> = {
      items,
      total,
      page,
      limit,
      pageCount,
    }
    return res
  })

  app.get('/library/stats', async (req, reply) => {
    const userId = sessionUserId(req)
    if (!userId) return reply.code(401).send({ error: 'Sesion requerida' })

    const rows = await db
      .select()
      .from(userGames)
      .where(eq(userGames.userId, userId))

    const totalGames = rows.length
    const totalInvested = rows.reduce((sum, r) => sum + (r.pricePaid ?? 0), 0)
    const byStatus: Record<GameStatus, number> = { backlog: 0, playing: 0, finished: 0, abandoned: 0 }
    const byProvider: Record<ProviderId, number> = { steam: 0, epic: 0, gog: 0 }
    let playtimeMinutes = 0
    for (const r of rows) {
      if (byStatus[r.status] !== undefined) byStatus[r.status]++
      if (byProvider[r.platform] !== undefined) byProvider[r.platform]++
      playtimeMinutes += r.playtimeMinutes
    }

    // Un juego cuenta una vez por cada genero que tenga.
    const genreRows = await db
      .select({ name: genres.name })
      .from(userGames)
      .innerJoin(gameGenres, eq(gameGenres.gameId, userGames.gameId))
      .innerJoin(genres, eq(genres.id, gameGenres.genreId))
      .where(eq(userGames.userId, userId))
    const byGenre: Record<string, number> = {}
    for (const r of genreRows) byGenre[r.name] = (byGenre[r.name] ?? 0) + 1

    const stats: LibraryStats = {
      totalGames,
      totalInvested,
      currency: 'CLP',
      byStatus,
      byProvider,
      byGenre,
      onSale: 0,
      atHistoricalLow: 0,
      playtimeMinutes,
    }
    return stats
  })

  app.post('/games', async (req, reply) => {
    const userId = sessionUserId(req)
    if (!userId) return reply.code(401).send({ error: 'Sesion requerida' })
    const parse = AddGameSchema.safeParse(req.body)
    if (!parse.success) return reply.code(400).send({ error: 'Datos invalidos' })

    let game = await resolveCatalogGame(parse.data)
    if (!game) {
      // Si el frontend envio un id de ITAD real (una busqueda ITAD), el juego
      // se crea en el catalogo al darlo de alta la primera vez.
      const itadId = parse.data.itadId?.trim()
      if (!itadId || itadId.startsWith('mock-')) {
        return reply.code(404).send({ error: 'Juego no encontrado en el catalogo' })
      }
      game = await createCatalogGame({ itadId, slug: parse.data.slug, title: parse.data.title })
      if (!game) {
        return reply.code(404).send({ error: 'Juego no encontrado en el catalogo' })
      }
    }

    const [exists] = await db
      .select({ id: userGames.id })
      .from(userGames)
      .where(and(eq(userGames.userId, userId), eq(userGames.gameId, game.id)))
      .limit(1)
    if (exists) return reply.code(409).send({ error: 'Ya en biblioteca' })

    await db.insert(userGames).values({
      userId,
      gameId: game.id,
      platform: parse.data.platform,
      pricePaid: parse.data.pricePaid ?? null,
      source: 'manual',
    })

    const entry = await findEntry(userId, game.id)
    return reply.code(201).send(entry)
  })

  app.patch('/library/:gameId', async (req, reply) => {
    const params = ParamsSchema.safeParse(req.params)
    if (!params.success) return reply.code(400).send({ error: 'ID invalido' })
    const parse = UpdateSchema.safeParse(req.body)
    if (!parse.success) return reply.code(400).send({ error: 'Datos invalidos' })

    const userId = sessionUserId(req)
    if (!userId) return reply.code(401).send({ error: 'Sesion requerida' })
    const gameId = params.data.gameId

    const current = await findEntry(userId, gameId)
    if (!current) return reply.code(404).send({ error: 'Juego no esta en la biblioteca' })

    const patch = parse.data
    if (Object.keys(patch).length > 0) {
      await db
        .update(userGames)
        .set(patch)
        .where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)))
    }

    const updated = await findEntry(userId, gameId)
    return updated
  })

  app.delete('/library/:gameId', async (req, reply) => {
    const params = ParamsSchema.safeParse(req.params)
    if (!params.success) return reply.code(400).send({ error: 'ID invalido' })

    const userId = sessionUserId(req)
    if (!userId) return reply.code(401).send({ error: 'Sesion requerida' })
    const gameId = params.data.gameId

    const current = await findEntry(userId, gameId)
    if (!current) return reply.code(404).send({ error: 'Juego no esta en la biblioteca' })

    await db
      .delete(userGames)
      .where(and(eq(userGames.userId, userId), eq(userGames.gameId, gameId)))

    return { ok: true as const }
  })
}
