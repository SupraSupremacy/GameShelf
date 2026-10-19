import type { ProviderId } from './providers'
import type { PriceRow } from './dto-price'

/** Resultado completo de comparar un titulo entre tiendas. */
export interface PriceComparison {
  gameId: number
  title: string
  slug: string
  imageUrl: string | null
  currency: string
  country: string
  rows: PriceRow[]
  /** Tienda con el precio mas bajo, o null si no hay datos. */
  bestProvider: ProviderId | null
  /** Precio final en la tienda mas barata. */
  bestFinalPrice: number | null
  /** Cuanto se ahorra comprando en la mejor tienda en vez de la mas cara. */
  potentialSavings: number
  /** true si el precio actual esta en o por debajo del minimo historico. */
  atHistoricalLow: boolean
  /** true si el usuario ya posee el juego en alguna tienda. */
  ownedSomewhere: boolean
  fetchedAt: string
}