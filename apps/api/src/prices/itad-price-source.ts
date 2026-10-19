import type { NormalizedPrice, ProviderId } from '@gameshelf/shared'
import { env } from '../config/env'
import { SHOP_FALLBACK, type PriceQuery, type PriceSource } from './price-source'

/** Respuesta de POST /games/prices/v3 (recorte de lo que nos interesa). */
interface ItadPriceResponse {
  id: string
  historyLow?: { all?: { amountInt?: number; currency?: string } }
  deals?: Array<{
    shop?: { id?: number; name?: string }
    price?: { amountInt?: number; currency?: string }
    regular?: { amountInt?: number; currency?: string }
    cut?: number
    url?: string
    timestamp?: string
  }>
}

/** Descubre los IDs reales de tienda. Si falla, usa los de respaldo. */
let shopIds: Record<ProviderId, number> | null = null

async function resolveShopIds(): Promise<Record<ProviderId, number>> {
  if (shopIds) return shopIds
  try {
    const res = await fetch(`${env.ITAD_API_BASE}/shops/v1`, {
      headers: { 'ITAD-API-Key': env.ITAD_API_KEY ?? '' },
    })
    if (!res.ok) throw new Error(String(res.status))
    const body = (await res.json()) as Record<string, string>
    shopIds = {
      steam: Number(body['steam'] ?? SHOP_FALLBACK.steam),
      gog: Number(body['gog'] ?? SHOP_FALLBACK.gog),
      epic: Number(body['epicgames'] ?? SHOP_FALLBACK.epic),
    }
  } catch {
    shopIds = SHOP_FALLBACK
  }
  return shopIds
}

/**
 * Fuente de precios real via IsThereAnyDeal.
 *
 * Solo se usa si hay ITAD_API_KEY. Segun sus terminos de servicio hay que
 * enlazar a isthereanydeal.com y NO quitar las etiquetas de afiliado de
 * las URLs, por eso conservamos el campo `url` tal cual viene.
 */
export class ItadPriceSource implements PriceSource {
  readonly kind = 'itad' as const

  constructor(private readonly getItadIds: (gameIds: number[]) => Promise<Map<number, string>>) {}

  async fetchPrices(
    gameIds: number[],
    query: PriceQuery,
  ): Promise<Map<number, NormalizedPrice[]>> {
    const result = new Map<number, NormalizedPrice[]>()
    if (gameIds.length === 0) return result

    const ids = await resolveShopIds()
    const shopParam = [ids.steam, ids.gog, ids.epic].join(',')

    // Endpoint: acepta hasta 200 juegos por request.
    for (let i = 0; i < gameIds.length; i += 200) {
      const batch = gameIds.slice(i, i + 200)
      const itadIds = await this.getItadIds(batch)
      if (itadIds.size === 0) continue

      const res = await fetch(`${env.ITAD_API_BASE}/games/prices/v3?country=${query.country}&shops=${shopParam}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ITAD-API-Key': env.ITAD_API_KEY ?? '',
        },
        body: JSON.stringify([...itadIds.values()]),
      })

      if (!res.ok) throw new Error(`ITAD respondio ${res.status}`)
      const rows = (await res.json()) as ItadPriceResponse[]
      const byItadId = new Map([...itadIds].map(([gameId, itadId]) => [itadId, gameId]))

      for (const row of rows) {
        const gameId = byItadId.get(row.id)
        if (gameId === undefined) continue

        const nameToProvider: Record<string, ProviderId> = {
          Steam: 'steam',
          GOG: 'gog',
          'Epic Games Store': 'epic',
        }
        const deals = (row.deals ?? []).filter((d) => d.price?.amountInt !== undefined)
        const mapped = deals.map((d): NormalizedPrice => {
          const provider = nameToProvider[d.shop?.name ?? ''] ?? 'steam'
          return {
            provider,
            currency: d.price?.currency ?? query.currency,
            basePrice: d.regular?.amountInt ?? d.price?.amountInt ?? 0,
            finalPrice: d.price?.amountInt ?? 0,
            discountPercent: d.cut ?? 0,
            historyLow: row.historyLow?.all?.amountInt ?? null,
            storeLow: null,
            url: d.url ?? '',
            fetchedAt: d.timestamp ?? new Date().toISOString(),
          }
        })

        if (mapped.length > 0) result.set(gameId, mapped)
      }
    }

    return result
  }
}