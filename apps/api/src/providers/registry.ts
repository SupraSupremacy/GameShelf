import type { LibraryProvider } from '@gameshelf/shared'
import { SteamMockProvider } from './steam.mock'
import { GogMockProvider } from './gog.mock'
import { EpicMockProvider } from './epic.mock'

/**
 * Registro de proveedores disponibles.
 *
 * Punto unico de swapping: hoy todos son mock. Cuando se agregue una
 * implementacion real, se selecciona aqui segun si la API key esta
 * configurada, sin tocar ningun otro archivo del sistema.
 */
const REGISTRY: Record<string, () => LibraryProvider> = {
  steam: () => new SteamMockProvider(),
  gog: () => new GogMockProvider(),
  epic: () => new EpicMockProvider(),
}

export function getLibraryProvider(id: string): LibraryProvider {
  const factory = REGISTRY[id]
  if (!factory) {
    throw new Error(`Proveedor desconocido: ${id}`)
  }
  return factory()
}

export { SteamMockProvider, GogMockProvider, EpicMockProvider }