import type { ProviderId } from './providers'
import type { GameStatus } from './status'

export interface PlatformRef {
  provider: ProviderId
  externalId: string | null
  storeUrl: string
}

/** Un juego dentro de la biblioteca del usuario. */
export interface LibraryEntry {
  gameId: number
  title: string
  slug: string
  imageUrl: string | null
  releaseDate: string | null
  genres: string[]
  platforms: PlatformRef[]
  status: GameStatus
  pricePaid: number | null
  acquiredAt: string | null
  playtimeMinutes: number
  notes: string | null
}