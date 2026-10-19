import type { LibraryProvider, NormalizedGame } from '@gameshelf/shared'
import { MOCK_CATALOG_READY } from './mock-catalog'

/**
 * Proveedor de biblioteca simulado para Epic Games Store.
 *
 * A diferencia de Steam y GOG, Epic NO tiene API publica. Se verifico en
 * la investigacion (ANALISIS-APIs.md):
 *   - store.epicgames.com/graphql  -> 403 / 404 (endpoint movido)
 *   - pagina HTML de producto      -> 403 (anti-bot por fingerprint TLS)
 *   - EOS Ecom API                 -> solo para desarrolladores de juegos
 *
 * Por eso la biblioteca de Epic es de alta manual, y el comparador de
 * precios si lo cubre (via IsThereAnyDeal).
 */
export class EpicMockProvider implements LibraryProvider {
  readonly id = 'epic' as const

  async listOwnedGames(): Promise<NormalizedGame[]> {
    return MOCK_CATALOG_READY.filter((g) => g.availableOn.includes('epic'))
  }
}