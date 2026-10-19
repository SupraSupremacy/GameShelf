import type { FastifyInstance } from 'fastify'
import { inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { games } from '../db/schema'
import { getLibraryProvider } from '../providers/registry'
import { allGenres } from '../providers/mock-catalog'
import { itadClient } from '../itad/client'
import { slugFromTitle } from '../slug'
import { PROVIDERS } from '@gameshelf/shared'
import type { SearchResult } from '@gameshelf/shared'

/**
 * Busqueda de juegos para el alta manual.
 * Permite que el usuario explore el catalogo y elija donde lo tiene.
 *
 * Con clave de ITAD configurada, ademas del catalogo local se consulta
 * IsThereAnyDeal y esos resultados llegan marcados con `fromItad`: todavia
 * no existen en la base, y el alta los crea la primera vez.
 */
export async function gamesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/games/genres', async () => ({ genres: allGenres() }))

  app.get<{ Querystring: { q?: string } }>('/games/search', async (req) => {
    const q = (req.query.q ?? '').trim().toLowerCase()

    // Import dinamico para no cargar el catalogo si no se usa.
    const { MOCK_CATALOG_READY } = await import('../providers/mock-catalog')

    // Sin termino se lista el catalogo completo para que los filtros (p. ej.
    // el de genero) se puedan usar antes de escribir. Con termino, coincide.
    const matches = q
      ? MOCK_CATALOG_READY.filter(
          (g) => g.title.toLowerCase().includes(q) || g.slug.includes(q),
        ).slice(0, 20)
      : MOCK_CATALOG_READY

    // El catalogo en memoria no tiene el id numerico de la base. Se resuelve
    // en una sola consulta para que el frontend no tenga que adivinarlo.
    const slugs = matches.map((g) => g.slug)
    const idRows = slugs.length > 0
      ? await db.select({ slug: games.slug, id: games.id }).from(games).where(inArray(games.slug, slugs))
      : []
    const idBySlug = new Map(idRows.map((r) => [r.slug, r.id]))

    const items: SearchResult[] = matches.map((g) => ({
      id: idBySlug.get(g.slug) ?? -1,
      itadId: g.itadId,
      slug: g.slug,
      title: g.title,
      releaseDate: g.releaseDate,
      imageUrl: g.imageUrl,
      genres: g.genres,
      availableOn: g.availableOn,
    }))

    // Solo con clave ITAD se busca fuera del catalogo local, y solo para
    // terminos suficientemente largos (una letra es demasiado ruido puntual).
    if (itadClient && q.length >= 2) {
      const itadMatches = await itadClient.searchByTitle(q)

      // Un titulo que ya existe en la base (agregado por ITAD antes) se
      // devuelve como resultado local con su id, para poder comparar.
      // Los que no estan llegan marcados para que el alta los cree.
      const existentes = new Map(
        itadMatches.length > 0
          ? (
              await db
                .select()
                .from(games)
                .where(inArray(games.itadId, itadMatches.map((m) => m.id)))
            ).map((r) => [r.itadId, r] as const)
          : [],
      )

      for (const m of itadMatches) {
        if (items.length >= 20) break
        const local = existentes.get(m.id)
        if (local) {
          items.push({
            id: local.id,
            itadId: local.itadId,
            slug: local.slug,
            title: local.title,
            releaseDate: local.releaseDate,
            imageUrl: local.imageUrl,
            genres: [],
            // No se sabe en que tiendas esta; el selector usa el catalogo completo.
            availableOn: [...PROVIDERS],
          })
        } else {
          items.push({
            id: -1,
            itadId: m.id,
            slug: slugFromTitle(m.title),
            title: m.title,
            releaseDate: null,
            imageUrl: null,
            genres: [],
            availableOn: [...PROVIDERS],
            fromItad: true,
          })
        }
      }
    }

    return { items }
  })

  app.get<{ Params: { provider: string } }>('/providers/:provider/preview', async (req) => {
    const provider = getLibraryProvider(req.params.provider)
    const games = await provider.listOwnedGames()
    return { provider: provider.id, count: games.length }
  })
}