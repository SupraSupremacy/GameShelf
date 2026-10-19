import type { ProviderId } from './providers'

/**
 * Precio normalizado.
 *
 * IMPORTANTE: todos los montos son enteros en la unidad minima de la
 * moneda (centavos). Nunca punto flotante, para no arrastrar errores de
 * redondeo al comparar precios. El formateo a texto ocurre en el frontend.
 */
export interface NormalizedPrice {
  provider: ProviderId
  currency: string
  /** Precio regular en centavos */
  basePrice: number
  /** Precio actual en centavos */
  finalPrice: number
  /** 0 a 100 */
  discountPercent: number
  /** Minimo historico entre todas las tiendas, centavos. */
  historyLow: number | null
  /** Minimo historico dentro de esta tienda, centavos. */
  storeLow: number | null
  url: string
  /** ISO 8601 */
  fetchedAt: string
}