import { describe, expect, it } from 'vitest'
import { generatePrice, generateHistoryLow } from '../src/providers/price-simulator'
import { MOCK_CATALOG } from '../src/providers/mock-catalog'

describe('generatePrice', () => {
  it('devuelve siempre lo mismo para la misma entrada', () => {
    const opciones = { baseHint: 5999, onSale: true, step: 50 }
    const a = generatePrice(2, 'steam', opciones)
    const b = generatePrice(2, 'steam', opciones)
    expect(a).toEqual(b)
  })

  it('no aplica descuento si la tienda no esta en oferta', () => {
    const { discountPercent, basePrice, finalPrice } = generatePrice(2, 'steam', {
      baseHint: 5999,
      onSale: false,
      step: 50,
    })
    expect(discountPercent).toBe(0)
    expect(finalPrice).toBe(basePrice)
  })

  it('aplica descuento si la tienda esta en oferta', () => {
    const { discountPercent, basePrice, finalPrice } = generatePrice(1, 'steam', {
      baseHint: 1990,
      onSale: true,
      step: 50,
    })
    expect(discountPercent).toBeGreaterThan(0)
    expect(finalPrice).toBeLessThan(basePrice)
  })

  it('redondea al multiplo del paso indicado', () => {
    // Con paso 100 (pesos enteros) nunca debe quedar un peso con centavos.
    const { basePrice, finalPrice } = generatePrice(3, 'gog', {
      baseHint: 44452,
      onSale: true,
      step: 100,
    })
    expect(basePrice % 100).toBe(0)
    expect(finalPrice % 100).toBe(0)
  })

  it('distingue tiendas distintas para el mismo juego', () => {
    const steam = generatePrice(2, 'steam', { baseHint: 5999, onSale: false, step: 50 })
    const gog = generatePrice(2, 'gog', { baseHint: 5999, onSale: false, step: 50 })
    expect(steam.basePrice).not.toBe(gog.basePrice)
  })
})

describe('generateHistoryLow', () => {
  it('nunca supera el precio actual', () => {
    for (let gameId = 1; gameId <= MOCK_CATALOG.length; gameId++) {
      for (const provider of ['steam', 'gog', 'epic'] as const) {
        const actual = 5000
        const minimo = generateHistoryLow(gameId, provider, actual, 50)
        expect(minimo).toBeLessThanOrEqual(actual)
        expect(minimo).toBeGreaterThan(0)
      }
    }
  })
})