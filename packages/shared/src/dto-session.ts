import type { ProviderId } from './providers'
import type { GameStatus } from './status'

export interface LibraryStats {
  totalGames: number
  totalInvested: number
  currency: string
  byStatus: Record<GameStatus, number>
  byProvider: Record<ProviderId, number>
  /** Conteo por genero (un juego puede estar en varios generos). */
  byGenre: Record<string, number>
  /** Juegos con descuento activo en alguna tienda. */
  onSale: number
  /** Juegos cuyo precio actual es un minimo historico. */
  atHistoricalLow: number
  playtimeMinutes: number
}

export interface SessionUser {
  id: string
  username: string
  displayName: string
  avatarColor: string
  isDemo: boolean
  connectedProviders: ProviderId[]
}