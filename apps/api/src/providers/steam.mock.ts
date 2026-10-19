import type { LibraryProvider, NormalizedGame } from '@gameshelf/shared'
import { MOCK_CATALOG_READY } from './mock-catalog'

/**
 * Proveedor de biblioteca simulado para Steam.
 *
 * Implementa el contrato `LibraryProvider`. Cuando exista una Steam API
 * key se crea `SteamLibraryProvider` con la misma firma:
 *
 *   IPlayerService/GetOwnedGames/v1/?key=..&steamid=..&include_appinfo=1
 *
 * Ver detalle en ANALISIS-APIs.md
 */
export class SteamMockProvider implements LibraryProvider {
  readonly id = 'steam' as const

  async listOwnedGames(): Promise<NormalizedGame[]> {
    return MOCK_CATALOG_READY.filter((g) => g.availableOn.includes('steam'))
  }
}