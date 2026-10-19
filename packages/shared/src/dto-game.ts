import type { ProviderId } from './providers'
import type { PriceComparison } from './dto-compare'
import type { PlatformRef } from './dto-library'

/** Resultado de busqueda para dar de alta un juego. */
export interface SearchResult {
  /** Id numerico en el catalogo (necesario para poder comparar precios). */
  id: number
  itadId: string | null
  slug: string
  title: string
  releaseDate: string | null
  imageUrl: string | null
  genres: string[]
  availableOn: ProviderId[]
  /** true si el resultado viene de ITAD y aun no existe en el catalogo local. */
  fromItad?: boolean
}

/** Detalle de un juego, con su tabla de precios. */
export interface GameDetail extends PriceComparison {
  genres: string[]
  platforms: PlatformRef[]
  owned: boolean
  ownedOn: ProviderId[]
}