import type { LibraryProvider, NormalizedGame } from '@gameshelf/shared'
import { MOCK_CATALOG_READY } from './mock-catalog'

/**
 * Proveedor de biblioteca simulado para GOG.
 *
 * Cuando exista integracion real se usa:
 *   GET embed.gog.com/account/getFilteredProducts?mediaType=1
 *   POST auth.gog.com/auth  (OAuth2 Authorization Code + PKCE)
 *
 * Ver detalle en ANALISIS-APIs.md
 */
export class GogMockProvider implements LibraryProvider {
  readonly id = 'gog' as const

  async listOwnedGames(): Promise<NormalizedGame[]> {
    return MOCK_CATALOG_READY.filter((g) => g.availableOn.includes('gog'))
  }
}