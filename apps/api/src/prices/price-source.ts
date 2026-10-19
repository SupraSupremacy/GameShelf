import type { NormalizedPrice, ProviderId } from '@gameshelf/shared'

export interface PriceQuery {
  country: string
  currency: string
}

/**
 * Fuente de precios. Misma idea que `LibraryProvider`: permite que el
 * comparador no sepa si los datos vienen de IsThereAnyDeal o del
 * simulador.
 */
export interface PriceSource {
  readonly kind: 'itad' | 'mock'
  /** Precios de varios juegos a la vez. Key: gameId. */
  fetchPrices(
    gameIds: number[],
    query: PriceQuery,
  ): Promise<Map<number, NormalizedPrice[]>>
}

/** IDs de tienda en IsThereAnyDeal. Se resuelven en arranque, no hardcodeados. */
export const SHOP_FALLBACK: Record<ProviderId, number> = {
  steam: 61,
  gog: 35,
  epic: 27,
}