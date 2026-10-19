import type { PriceRow, ProviderId } from '@gameshelf/shared'

export interface ComparisonSummary {
  bestProvider: ProviderId | null
  bestFinalPrice: number | null
  atHistoricalLow: boolean
  /** Quanto se ahorra comprando en la mejor tienda en vez de la mas cara. */
  potentialSavings: number
  ownedSomewhere: boolean
}

/**
 * Resume la comparacion para las tarjetas y estadisticas.
 * Funcion pura: no toca base de datos ni red.
 */
export function summarize(rows: PriceRow[]): ComparisonSummary {
  if (rows.length === 0) {
    return {
      bestProvider: null,
      bestFinalPrice: null,
      atHistoricalLow: false,
      potentialSavings: 0,
      ownedSomewhere: false,
    }
  }

  const best = rows.find((r) => r.isBest) ?? rows.reduce((a, b) => (a.finalPrice <= b.finalPrice ? a : b))
  const prices = rows.map((r) => r.finalPrice)
  const max = Math.max(...prices)
  const savings = Math.max(0, max - best.finalPrice)

  const atHistoricalLow = rows.some(
    (r) => r.isBest && r.historyLow !== null && best.finalPrice <= r.historyLow,
  )

  return {
    bestProvider: best.provider,
    bestFinalPrice: best.finalPrice,
    atHistoricalLow,
    potentialSavings: savings,
    ownedSomewhere: rows.some((r) => r.owned),
  }
}