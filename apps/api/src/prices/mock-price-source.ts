import type { NormalizedPrice } from '@gameshelf/shared'
import { MOCK_CATALOG } from '../providers/mock-catalog'
import { generatePrice, generateHistoryLow } from '../providers/price-simulator'
import type { PriceQuery, PriceSource } from './price-source'

const STORE_URLS: Record<string, string> = {
  steam: 'https://store.steampowered.com/app/',
  epic: 'https://store.epicgames.com/',
  gog: 'https://www.gog.com/en/game/',
}

/**
 * Tasas simuladas para convertir el precio de referencia a la moneda
 * pedida.
 *
 * El catalogo semilla esta escrito en centavos de USD: `baseHint: 5999`
 * es 59,99 dolares, que es lo que cuesta Elden Ring. Sin convertir, esa
 * misma cifra rotulada como CLP seria 59,99 pesos, un precio absurdo que
 * se nota en la demo.
 *
 * Son valores fijos y redondeados, NO cotizaciones reales. El unico origen
 * de precios de verdad es ItadPriceSource; estas tasas existen solo para
 * que el modo simulado se vea coherente en la moneda que se pide.
 */
const TASAS_SIMULADAS: Record<string, number> = {
  CLP: 950,
  USD: 1,
  EUR: 0.92,
  BRL: 5.4,
  ARS: 900,
  MXN: 18,
}

function tasaSimulada(desde: string, hasta: string): number {
  const origen = TASAS_SIMULADAS[desde.toUpperCase()]
  const destino = TASAS_SIMULADAS[hasta.toUpperCase()]
  // Si no se conoce alguna de las dos, no se convierte.
  if (!origen || !destino) return 1
  return destino / origen
}

/**
 * Incremento de redondeo por moneda, en la unidad pequena.
 *
 * El peso chileno no se usa fraccionado en la practica, asi que se redondea
 * a pesos enteros (100 centavos). En el resto se redondea a multiplos de 50
 * centavos, que es como aparecen los precios en las tiendas.
 */
const PASO_MONEDA: Record<string, number> = {
  CLP: 100,
  USD: 50,
  EUR: 50,
  BRL: 50,
  ARS: 100,
  MXN: 50,
}

function pasoDe(moneda: string): number {
  return PASO_MONEDA[moneda.toUpperCase()] ?? 50
}

/**
 * Fuente de precios ficticia.
 *
 * Genera precios deterministas a partir del catalogo semilla, de modo que
 * un mismo juego siempre muestre el mismo precio entre ejecuciones. El
 * objetivo es que la tabla comparativa sea creible y tenga casos
 * interesantes: una tienda cara, una en descuento, una en minimo historico.
 */
export class MockPriceSource implements PriceSource {
  readonly kind = 'mock' as const

  async fetchPrices(
    gameIds: number[],
    query: PriceQuery,
  ): Promise<Map<number, NormalizedPrice[]>> {
    const result = new Map<number, NormalizedPrice[]>()
    const tasa = tasaSimulada('USD', query.currency)
    const step = pasoDe(query.currency)

    for (const gameId of gameIds) {
      // gameId es 1-based y corresponde al indice del catalogo.
      const entry = MOCK_CATALOG[gameId - 1]
      if (!entry) continue

      const rows: NormalizedPrice[] = entry.availableOn.map((provider) => {
        const onSale = entry.onSale.includes(provider)
        const { basePrice, finalPrice, discountPercent } = generatePrice(gameId, provider, {
          baseHint: Math.round(entry.baseHint * tasa),
          onSale,
          step,
        })

        return {
          provider,
          currency: query.currency,
          basePrice,
          finalPrice,
          discountPercent,
          historyLow: generateHistoryLow(gameId, provider, finalPrice, step),
          storeLow: generateHistoryLow(gameId, provider, finalPrice, step),
          url: `${STORE_URLS[provider]}${entry.slug}`,
          fetchedAt: new Date().toISOString(),
        } satisfies NormalizedPrice
      })

      result.set(gameId, rows)
    }

    return result
  }
}