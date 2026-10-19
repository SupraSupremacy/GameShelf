import type { ProviderId } from './providers'

/** Fila de la tabla comparativa de una tienda. */
export interface PriceRow {
  provider: ProviderId
  currency: string
  basePrice: number
  finalPrice: number
  discountPercent: number
  historyLow: number | null
  storeLow: number | null
  url: string
  fetchedAt: string
  /** El usuario ya tiene este juego en esta tienda. */
  owned: boolean
  /** Es el precio mas bajo entre las tiendas consultadas. */
  isBest: boolean
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pageCount: number
}