import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { games, userGames } from '../db/schema'
import { createPriceSource } from '../prices'
import { buildPriceRows } from '../prices/compare'
import { summarize } from '../prices/summary'
import type { GameDetail } from '@gameshelf/shared'

const ParamsSchema = z.object({ gameId: z.coerce.number().int().positive() })

export async function pricesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { gameId: string } }>('/prices/compare/:gameId', async (req, reply) => {
    const parse = ParamsSchema.safeParse(req.params)
    if (!parse.success) return reply.code(400).send({ error: 'ID inválido' })

    const gameId = parse.data.gameId
    const [g] = await db.select().from(games).where(eq(games.id, gameId)).limit(1)
    if (!g) return reply.code(404).send({ error: 'Juego no encontrado' })

    const source = createPriceSource()
    const resMap = await source.fetchPrices([gameId], { country: 'CL', currency: 'CLP' })
    const prices = resMap.get(gameId) ?? []

    // Qué tiendas ya lo tiene el usuario (demo: ninguno por defecto)
    const owned = await db.select({ p: userGames.platform }).from(userGames).where(eq(userGames.gameId, gameId))
    const ownedOn = owned.map((r) => r.p)

    const rows = buildPriceRows(prices, ownedOn)
    const summary = summarize(rows)

    const detail: GameDetail = {
      gameId: g.id,
      title: g.title,
      slug: g.slug,
      imageUrl: g.imageUrl,
      currency: 'CLP',
      country: 'CL',
      rows,
      ...summary,
      owned: ownedOn.length > 0,
      ownedOn,
      genres: [],
      platforms: [],
      fetchedAt: rows[0]?.fetchedAt ?? new Date().toISOString(),
    }
    return detail
  })
}