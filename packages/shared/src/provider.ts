import type { ProviderId } from './providers'
import type { NormalizedGame } from './normalized-game'

/**
 * Contrato que debe cumplir todo proveedor de biblioteca.
 *
 * Hoy solo hay implementaciones mock. Cuando exista una API key de Steam
 * o GOG se agrega `SteamLibraryProvider` implementando esta misma
 * interfaz, y el resto del sistema no cambia.
 */
export interface LibraryProvider {
  readonly id: ProviderId
  listOwnedGames(): Promise<NormalizedGame[]>
}