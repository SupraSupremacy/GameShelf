import type { NormalizedPrice, PriceRow, ProviderId } from '@gameshelf/shared'
import { PROVIDER_LABELS } from '@gameshelf/shared'

/**
 * Agrega las marcas de la tabla comparativa: que tienda tiene el precio mas
 * bajo, y si ese precio es un minimo historico.
 *
 * Se separa del route para poder testearla aislada: es la regla de negocio
 * central del proyecto.
 *
 * Empates: si dos tiendas empatan, gana la primera en el orden de
 * PROVIDERS (determinista, no arbitrario).
 */
export function buildPriceRows(
  prices: NormalizedPrice[],
  ownedOn: ProviderId[],
): PriceRow[] {
  const owned = new Set<ProviderId>(ownedOn)
  const rows = prices.map<PriceRow>((p) => ({
    provider: p.provider,
    currency: p.currency,
    basePrice: p.basePrice,
    finalPrice: p.finalPrice,
    discountPercent: p.discountPercent,
    historyLow: p.historyLow,
    storeLow: p.storeLow,
    url: p.url,
    fetchedAt: p.fetchedAt,
    owned: owned.has(p.provider),
    isBest: false,
  }))

  // Orden estable: primero el mas barato, luego por nombre de tienda.
  const ordered = [...rows].sort(
    (a, b) => a.finalPrice - b.finalPrice || PROVIDER_LABELS[a.provider].localeCompare(PROVIDER_LABELS[b.provider]),
  )

  const cheapest = ordered[0]
  if (cheapest) {
    const winner = rows.find((r) => r.provider === cheapest.provider)
    if (winner) winner.isBest = true
  }

  return rows
}