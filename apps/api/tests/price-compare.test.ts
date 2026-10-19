import { describe, expect, it } from 'vitest'
import type { NormalizedPrice, ProviderId } from '@gameshelf/shared'
import { buildPriceRows } from '../src/prices/compare'
import { summarize } from '../src/prices/summary'

function precio(
  provider: ProviderId,
  finalPrice: number,
  overrides: Partial<NormalizedPrice> = {},
): NormalizedPrice {
  return {
    provider,
    currency: 'CLP',
    basePrice: finalPrice,
    finalPrice,
    discountPercent: 0,
    historyLow: null,
    storeLow: null,
    url: `https://example.com/${provider}`,
    fetchedAt: '2026-10-11T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildPriceRows', () => {
  it('marca isBest solo en la tienda mas barata', () => {
    const rows = buildPriceRows(
      [precio('steam', 5000), precio('epic', 4000), precio('gog', 6000)],
      [],
    )

    expect(rows.filter((r) => r.isBest)).toHaveLength(1)
    expect(rows.find((r) => r.isBest)?.provider).toBe('epic')
  })

  it('resuelve un empate por el orden de PROVIDERS, no por el de entrada', () => {
    // epic (indice 1) va antes que gog (indice 2) en PROVIDERS: gana epic.
    const a = buildPriceRows([precio('gog', 5000), precio('epic', 5000)], [])
    const b = buildPriceRows([precio('epic', 5000), precio('gog', 5000)], [])

    expect(a.find((r) => r.isBest)?.provider).toBe('epic')
    expect(b.find((r) => r.isBest)?.provider).toBe('epic')
  })

  it('marca owned por tienda segun ownedOn, no en todas', () => {
    const rows = buildPriceRows(
      [precio('steam', 5000), precio('gog', 4000), precio('epic', 4500)],
      ['steam', 'gog'],
    )

    expect(rows.find((r) => r.provider === 'steam')?.owned).toBe(true)
    expect(rows.find((r) => r.provider === 'gog')?.owned).toBe(true)
    expect(rows.find((r) => r.provider === 'epic')?.owned).toBe(false)
  })

  it('devuelve lista vacia sin precios, aunque haya tiendas con el juego', () => {
    expect(buildPriceRows([], ['steam'])).toEqual([])
  })
})

describe('summarize', () => {
  it('resume la mejor tienda y su precio final', () => {
    const rows = buildPriceRows(
      [precio('steam', 5000), precio('epic', 4000), precio('gog', 6000)],
      [],
    )
    const s = summarize(rows)

    expect(s.bestProvider).toBe('epic')
    expect(s.bestFinalPrice).toBe(4000)
  })

  it('calcula el ahorro potencial como max(finalPrice) menos el mejor', () => {
    const rows = buildPriceRows(
      [precio('steam', 5000), precio('epic', 4000), precio('gog', 6000)],
      [],
    )

    expect(summarize(rows).potentialSavings).toBe(2000)
  })

  it('no reporta ahorro cuando solo hay una tienda', () => {
    const rows = buildPriceRows([precio('steam', 5000)], [])
    expect(summarize(rows).potentialSavings).toBe(0)
  })

  it('marca atHistoricalLow cuando el mejor precio iguala el minimo historico', () => {
    const rows = buildPriceRows(
      [
        precio('epic', 4000, { historyLow: 4000 }),
        precio('steam', 5000, { historyLow: 4500 }),
      ],
      [],
    )

    expect(summarize(rows).atHistoricalLow).toBe(true)
  })

  it('no marca atHistoricalLow si el minimo historico queda por debajo', () => {
    const rows = buildPriceRows(
      [
        precio('epic', 4000, { historyLow: 3000 }),
        precio('steam', 5000, { historyLow: 4500 }),
      ],
      [],
    )

    expect(summarize(rows).atHistoricalLow).toBe(false)
  })

  it('marca ownedSomewhere si el usuario tiene el juego en alguna tienda', () => {
    const conDatos = buildPriceRows([precio('epic', 4000), precio('steam', 5000)], ['steam'])
    expect(summarize(conDatos).ownedSomewhere).toBe(true)
  })

  it('devuelve valores neutros con la lista vacia', () => {
    expect(summarize([])).toEqual({
      bestProvider: null,
      bestFinalPrice: null,
      atHistoricalLow: false,
      potentialSavings: 0,
      ownedSomewhere: false,
    })
  })
})
