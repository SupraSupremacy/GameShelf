/** Estado global que la app necesita saber al arrancar. */
export interface AppInfo {
  name: string
  version: string
  demoMode: boolean
  pricesSource: 'itad' | 'mock'
  itadConfigured: boolean
  defaultCountry: string
  defaultCurrency: string
}

export type { Paginated } from './dto-price'
export type { PriceRow } from './dto-price'
export type { PriceComparison } from './dto-compare'
export type { PlatformRef, LibraryEntry } from './dto-library'
export type { SearchResult, GameDetail } from './dto-game'
export type { LibraryStats, SessionUser } from './dto-session'
export type { NormalizedGame } from './normalized-game'
export type { GameSource } from './game'
export type { NormalizedPrice } from './price'
export type { LibraryProvider } from './provider'

export { PROVIDERS, PROVIDER_LABELS, isProviderId } from './providers'
export type { ProviderId } from './providers'
export { GAME_STATUSES, GAME_STATUS_LABELS, isGameStatus } from './status'
export type { GameStatus } from './status'