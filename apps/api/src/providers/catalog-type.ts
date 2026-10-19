import type { NormalizedGame, ProviderId } from '@gameshelf/shared'

/**
 * Entrada del catalogo semilla.
 *
 * `baseHint` es el precio de referencia en centavos que usa el simulador
 * para derivar el precio de cada tienda. `onSale` indica en que tiendas
 * hay descuento activo, para que la tabla comparativa muestre casos
 * interesantes (mismo juego, tres precios muy distintos).
 *
 * `itadId` es opcional a proposito: en el catalogo semilla se genera
 * despues con `withFakeItadId`. Solo el catalogo que viene de una fuente
 * real lo trae desde el principio, y ahi si es obligatorio.
 */
export interface CatalogEntry extends Omit<NormalizedGame, 'itadId'> {
  itadId?: string | null
  baseHint: number
  onSale: ProviderId[]
}

/**
 * Rellena los itadId con un placeholder estable para el modo simulado.
 *
 * El objeto se construye campo por campo: con un spread, las pistas del
 * simulador (`baseHint`, `onSale`) travelling como propiedades de mas
 * hasta las respuestas del API. Se listan a mano para que el catalogo
 * publico no exponga como son los precios simulados.
 */
export function withFakeItadId(
  entry: CatalogEntry,
  index: number,
): NormalizedGame {
  const suffix = String(index).padStart(12, '0')
  return {
    itadId: `mock-00000000-0000-4000-8000-${suffix}`,
    slug: entry.slug,
    title: entry.title,
    releaseDate: entry.releaseDate,
    imageUrl: entry.imageUrl,
    genres: entry.genres,
    availableOn: entry.availableOn,
  }
}