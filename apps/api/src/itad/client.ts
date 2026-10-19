import { eq, inArray } from 'drizzle-orm'
import { env } from '../config/env'
import { db } from '../db/client'
import { games } from '../db/schema'

/**
 * Cliente de IsThereAnyDeal.
 *
 * Solo se instancia si hay ITAD_API_KEY. Su unico trabajo en esta fase es
 * traducir nuestros gameId locales a los itadId que exige su API, para no
 * depender de un catalogo duplicado.
 */
export class ItadClient {
  private cache = new Map<number, string | null>()

  /** gameId local -> itadId. Memoizado para no repetir consultas. */
  async mapLocalToItadIds(gameIds: number[]): Promise<Map<number, string>> {
    const pending = gameIds.filter((id) => !this.cache.has(id))
    if (pending.length > 0) {
      const rows = await db
        .select({ id: games.id, itadId: games.itadId })
        .from(games)
        .where(inArray(games.id, pending))

      const found = new Map(rows.map((r) => [r.id, r.itadId]))
      for (const id of pending) {
        this.cache.set(id, found.get(id) ?? null)
      }
    }

    const out = new Map<number, string>()
    for (const id of gameIds) {
      const itadId = this.cache.get(id)
      if (itadId && !itadId.startsWith('mock-')) out.set(id, itadId)
    }
    return out
  }

  /** Busca un juego por titulo. Devuelve null si ITAD no esta configurado. */
  async searchByTitle(title: string): Promise<{ id: string; title: string }[]> {
    if (!env.itadConfigured) return []
    const url = new URL(`${env.ITAD_API_BASE}/games/search/v1`)
    url.searchParams.set('title', title)
    url.searchParams.set('results', '10')

    const res = await fetch(url, {
      headers: { 'ITAD-API-Key': env.ITAD_API_KEY ?? '' },
    })
    if (!res.ok) return []

    const body = (await res.json()) as Array<{ id: string; title: string }>
    return body.map((g) => ({ id: g.id, title: g.title }))
  }
}

/** Instancia unica, o null si no hay key configurada. */
export const itadClient: ItadClient | null = env.itadConfigured ? new ItadClient() : null

export async function findGameByItadId(itadId: string) {
  return db.select().from(games).where(eq(games.itadId, itadId)).limit(1)
}