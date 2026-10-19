import type { NormalizedPrice } from '@gameshelf/shared'
import { env } from '../config/env'
import type { PriceSource } from './price-source'
import { MockPriceSource } from './mock-price-source'
import { ItadPriceSource } from './itad-price-source'
import type { ItadClient } from '../itad/client'

/**
 * Elige la fuente de precios segun la configuracion.
 *
 * Con ITAD_API_KEY ausente cae a la fuente simulada, de modo que la demo
 * nunca se queda sin datos ni revienta por falta de credenciales.
 */
export function createPriceSource(itad?: ItadClient): PriceSource {
  if (env.pricesSource === 'itad' && itad) {
    return new ItadPriceSource((gameIds) => itad.mapLocalToItadIds(gameIds))
  }
  return new MockPriceSource()
}

export type { PriceSource, PriceQuery } from './price-source'
export { MockPriceSource } from './mock-price-source'
export { ItadPriceSource } from './itad-price-source'
export { buildPriceRows } from './compare'
export { summarize, type ComparisonSummary } from './summary'
export type { NormalizedPrice }