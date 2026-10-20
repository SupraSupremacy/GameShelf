import { describe, expect, it, beforeAll } from 'vitest'
import { PROVIDERS } from '@gameshelf/shared'

// En tests la base es PGlite en memoria; DATABASE_URL solo pasa el schema Zod.
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/gameshelf_test'
process.env.NODE_ENV = 'test'
process.env.PRICES_SOURCE = 'mock'
process.env.DEMO_MODE = 'true'

import { MOCK_CATALOG, MOCK_CATALOG_READY } from '../src/providers/mock-catalog'

describe('catalogo semilla', () => {
  it('tiene 120 juegos (38 originales + 82 de la ampliacion)', () => {
    expect(MOCK_CATALOG.length).toBe(120)
    expect(MOCK_CATALOG_READY.length).toBe(120)
  })

  it('no repite slugs ni titulos', () => {
    const slugs = MOCK_CATALOG.map((g) => g.slug)
    const titles = MOCK_CATALOG.map((g) => g.title)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('cada entrada tiene datos validos', () => {
    for (const game of MOCK_CATALOG) {
      expect(game.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(game.title.length).toBeGreaterThan(0)

      expect(game.genres.length).toBeGreaterThan(0)
      expect(new Set(game.genres).size).toBe(game.genres.length)
      for (const genre of game.genres) {
        expect(genre.length).toBeGreaterThan(0)
      }

      expect(Number.isInteger(game.baseHint)).toBe(true)
      expect(game.baseHint).toBeGreaterThan(0)

      expect(game.imageUrl).toBeNull()

      expect(game.availableOn.length).toBeGreaterThan(0)
      for (const provider of game.availableOn) {
        expect(PROVIDERS).toContain(provider)
      }
      for (const provider of game.onSale) {
        expect(game.availableOn).toContain(provider)
      }
    }
  })

  it('asigna itadIds unicos al normalizar', () => {
    const ids = MOCK_CATALOG_READY.map((g) => g.itadId)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('semilla contra la BD', () => {
  let seedSize = 0

beforeAll(
    async () => {
      const { runMigrations } = await import('../src/db/migrate-runner')
      const { seedCatalog } = await import('../src/db/seed-catalog')
      await runMigrations()
      // Se corre dos veces a proposito: el seed es idempotente y esto lo prueba.
      let last: Map<string, number> = new Map()
      for (let i = 0; i < 2; i++) last = await seedCatalog()
      seedSize = last.size
    },
    30_000,
  )

  it('inserta las 120 entradas sin duplicar al re-ejecutar', () => {
    expect(seedSize).toBe(120)
  })

  it('la BD no queda con slugs repetidos', async () => {
    const { sql } = await import('drizzle-orm')
    const { db } = await import('../src/db/client')
    const { games } = await import('../src/db/schema')
    const [row] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        distinct: sql<number>`cast(count(distinct slug) as int)`,
      })
      .from(games)
    expect(row?.total).toBe(120)
    expect(row?.distinct).toBe(120)
  })
})