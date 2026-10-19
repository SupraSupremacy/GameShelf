import { describe, expect, it } from 'vitest'
import { MockPriceSource } from '../src/prices/mock-price-source'
import { MOCK_CATALOG } from '../src/providers/mock-catalog'

const fmt = (n: number) => (n / 100).toLocaleString('es-CL')

describe('MockPriceSource', () => {
  it('respeta la moneda pedida', async () => {
    const src = new MockPriceSource()
    const clp = await src.fetchPrices([2], { country: 'CL', currency: 'CLP' })
    const usd = await src.fetchPrices([2], { country: 'US', currency: 'USD' })

    for (const row of clp.get(2) ?? []) expect(row.currency).toBe('CLP')
    for (const row of usd.get(2) ?? []) expect(row.currency).toBe('USD')

    // La moneda desconocida cae a la de referencia sin romperse.
    const xyz = await src.fetchPrices([2], { country: 'CL', currency: 'XYZ' })
    expect(xyz.get(2)).toBeDefined()
  })

  it('convierte a pesos un precio que en dolares seria absurdo', async () => {
    const src = new MockPriceSource()
    const usd = await src.fetchPrices([2], { country: 'US', currency: 'USD' })
    const clp = await src.fetchPrices([2], { country: 'CL', currency: 'CLP' })

    const precioUsd = usd.get(2)?.[0]?.finalPrice ?? 0
    const precioClp = clp.get(2)?.[0]?.finalPrice ?? 0

    // Si no se convirtiera, CLP seria identico a USD y el peso chileno
    // mostraria el precio de un dolar como si fueran 47 pesos.
    expect(precioClp).toBeGreaterThan(precioUsd * 100)
  })

  it('no deja centavos sueltos en pesos', async () => {
    const src = new MockPriceSource()
    const res = await src.fetchPrices([1, 2, 3, 4, 5], { country: 'CL', currency: 'CLP' })

    for (const rows of res.values()) {
      for (const row of rows) {
        expect(row.basePrice % 100).toBe(0)
        expect(row.finalPrice % 100).toBe(0)
        expect(row.historyLow % 100).toBe(0)
      }
    }
  })

  it('es determinista salvo la marca de tiempo', async () => {
    const src = new MockPriceSource()
    const a = await src.fetchPrices([2, 3], { country: 'CL', currency: 'CLP' })
    const b = await src.fetchPrices([2, 3], { country: 'CL', currency: 'CLP' })

    const sinFecha = (m: Map<number, unknown[]>) =>
      JSON.stringify([...m].map(([id, rows]) => [
        id,
        (rows as Record<string, unknown>[]).map(({ fetchedAt: _f, ...r }) => r),
      ]))

    expect(sinFecha(a)).toBe(sinFecha(b))
  })

  it('devuelve una fila por tienda disponible en el catalogo', async () => {
    const src = new MockPriceSource()
    const res = await src.fetchPrices([1], { country: 'CL', currency: 'CLP' })
    const proveedores = (res.get(1) ?? []).map((r) => r.provider).sort()
    expect(proveedores).toEqual(['epic', 'steam'])
  })

  it('ignora un id fuera del catalogo en vez de romper', async () => {
    const src = new MockPriceSource()
    const res = await src.fetchPrices([9999], { country: 'CL', currency: 'CLP' })
    expect(res.size).toBe(0)
  })

  it('prepara precios creibles para el catalogo completo', async () => {
    const src = new MockPriceSource()
    const ids = Array.from({ length: MOCK_CATALOG.length }, (_, i) => i + 1)
    const res = await src.fetchPrices(ids, { country: 'CL', currency: 'CLP' })

    let conOferta = 0
    for (const rows of res.values()) {
      for (const r of rows) {
        expect(r.finalPrice).toBeGreaterThan(0)
        expect(r.finalPrice).toBeLessThanOrEqual(r.basePrice)
        if (r.discountPercent > 0) conOferta++
        expect(r.url).toMatch(/^https:\/\//)
      }
    }
    // La tabla comparativa solo es interesante si hay rebajas.
    expect(conOferta).toBeGreaterThan(0)
    console.log(`    ${MOCK_CATALOG.length} juegos, ${conOferta} filas con oferta, ejemplo: ${fmt(44452)} CLP`)
  })
})