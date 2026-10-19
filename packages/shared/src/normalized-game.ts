import type { ProviderId } from './providers'

/**
 * Juego normalizado. Un proveedor lo describe asi, sin importar de que
 * tienda vino. `itadId` permite unir el mismo titulo entre tiendas sin
 * hacer matching por texto.
 */
export interface NormalizedGame {
  itadId: string | null
  slug: string
  title: string
  releaseDate: string | null
  genres: string[]
  imageUrl: string | null
  availableOn: ProviderId[]
}