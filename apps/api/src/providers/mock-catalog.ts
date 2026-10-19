import type { NormalizedGame } from '@gameshelf/shared'
import { CATALOG_A } from './catalog-a'
import { CATALOG_B } from './catalog-b'
import { CATALOG_C } from './catalog-c'
import { CATALOG_D } from './catalog-d'
import { CATALOG_E } from './catalog-e'
import { CATALOG_F } from './catalog-f'
import { withFakeItadId, type CatalogEntry } from './catalog-type'

/**
 * Semilla del catalogo simulado.
 *
 * Son las entradas tal cual estan escritas en los archivos de catalogo:
 * sin `itadId` y con los metadatos del simulador (`baseHint`, `onSale`).
 * La consume el generador de precios, que necesita esas pistas, y el seed.
 * Los lotes d/e/f amplian la semilla a 120 juegos (BETA).
 */
export const MOCK_CATALOG: CatalogEntry[] = [
  ...CATALOG_A,
  ...CATALOG_B,
  ...CATALOG_C,
  ...CATALOG_D,
  ...CATALOG_E,
  ...CATALOG_F,
]

/**
 * El mismo catalogo ya normalizado, con `itadId` asignado.
 *
 * Es lo que consumen los proveedores mock, la busqueda y el seed, porque
 * para todos esos el juego ya es un `NormalizedGame` mas.
 */
export const MOCK_CATALOG_READY: NormalizedGame[] = MOCK_CATALOG.map(withFakeItadId)

/**
 * Generos presentes en el catalogo, ordenados para el filtro de la UI.
 *
 * Se deduplica con un Set y se ordena con `localeCompare` en espanol para
 * que las tildes y la enye se ordenen donde corresponde y no al final.
 */
export function allGenres(): string[] {
  const set = new Set<string>()
  for (const game of MOCK_CATALOG) {
    for (const genre of game.genres) set.add(genre)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'))
}