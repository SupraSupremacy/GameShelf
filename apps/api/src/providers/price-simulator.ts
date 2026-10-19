import { createHash } from 'node:crypto'
import type { ProviderId } from '@gameshelf/shared'

/**
 * Opciones del simulador de precios.
 *
 * `step` es el incremento minimo al que se redondea el resultado, en la
 * unidad pequena de la moneda. Las tiendas no venden a 44.452,50 pesos ni a
 * 18,73 dolares: redondean a pesos enteros o a multiplos de 50 centavos.
 * El paso lo decide quien llama, porque el simulador no sabe de monedas.
 */
export interface PriceSimOptions {
  /** Precio de referencia ya convertido a la moneda de destino. */
  baseHint: number
  /** Si la tienda tiene descuento activo. */
  onSale: boolean
  /** Incremento de redondeo en la unidad pequena. */
  step: number
}

/**
 * Genera precios ficticios pero coherentes para un juego en una tienda.
 *
 * Es determinista: la misma semilla produce siempre el mismo precio, para
 * que la demo sea reproducible entre ejecuciones y los tests sean estables.
 * No usa azar ni la hora actual.
 *
 * El objetivo pedagogico es que la tabla comparativa muestre un caso
 * interesante: una tienda claramente mas cara y otra con descuento real.
 */
export function generatePrice(
  gameId: number,
  provider: ProviderId,
  options: PriceSimOptions,
): { basePrice: number; finalPrice: number; discountPercent: number } {
  const seed = hash(`${gameId}:${provider}`)
  const { baseHint, onSale, step } = options

  // Deriva un desvio determinista del precio "sugerido".
  const drift = 0.7 + (seed % 60) / 100 // 0.70 a 1.29
  const basePrice = redondear(Math.max(199, baseHint * drift), step)

  if (!onSale) {
    return { basePrice, finalPrice: basePrice, discountPercent: 0 }
  }

  // Descuentos tipicos de tienda: 10 a 85 por ciento.
  const cut = [10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85][seed % 12] ?? 20
  const discountPercent = cut
  const finalPrice = redondear(
    Math.max(99, (basePrice * (100 - discountPercent)) / 100),
    step,
  )

  return { basePrice, finalPrice, discountPercent }
}

/**
 * Minimo historico coherente con el precio actual.
 *
 * Siempre menor que el precio vigente: un "historico" mas caro que el
 * precio de hoy no es un minimo historico y confunde la tabla comparativa.
 */
export function generateHistoryLow(
  gameId: number,
  provider: ProviderId,
  currentPrice: number,
  step = 50,
): number {
  const seed = hash(`low:${gameId}:${provider}`)
  const factor = 0.55 + (seed % 30) / 100 // 0.55 a 0.84
  return Math.min(redondear(currentPrice * factor, step), currentPrice)
}

/** Redondea al multiplo de `step` mas cercano. */
function redondear(valor: number, step: number): number {
  return Math.round(valor / step) * step
}

function hash(input: string): number {
  return parseInt(createHash('sha256').update(input).digest('hex').slice(0, 8), 16)
}