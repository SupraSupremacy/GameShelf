import { describe, expect, it, beforeAll } from 'vitest'

// En tests la base es PGlite en memoria; DATABASE_URL solo pasa el schema Zod.
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/gameshelf_test'
process.env.NODE_ENV = 'test'
process.env.PRICES_SOURCE = 'mock'
process.env.DEMO_MODE = 'true'

import type { FastifyInstance } from 'fastify'
import { MOCK_CATALOG } from '../src/providers/mock-catalog'

let app: FastifyInstance
/** Cookie de sesion de la cuenta casual, capturada al iniciar sesion. */
let cookie = ''

beforeAll(
    async () => {
      const { runMigrations } = await import('../src/db/migrate-runner')
      const { seedCatalog } = await import('../src/db/seed-catalog')
      const { seedUsers } = await import('../src/db/seed-users')
      const { buildServer } = await import('../src/app')

      await runMigrations()
      const gameIds = await seedCatalog()
      await seedUsers(gameIds)

      app = await buildServer()

      const login = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { username: 'casual' },
      })
      expect(login.statusCode).toBe(200)
      const session = login.cookies.find((c) => c.name === 'gs_session')
      if (!session) throw new Error('login no entrego cookie de sesion')
      cookie = `${session.name}=${session.value}`
    },
    30_000,
  )

/** inject con la cookie de sesion ya adjunta. */
function asUser(opts: Parameters<FastifyInstance['inject']>[0]) {
  return app.inject({
    ...opts,
    headers: { cookie, ...(opts.headers ?? {}) },
  })
}

describe('sesion con cookie', () => {
  it('auth/me devuelve el usuario de la cookie', async () => {
    const res = await asUser({ method: 'GET', url: '/api/auth/me' })
    expect(res.statusCode).toBe(200)
    expect(res.json().user.username).toBe('casual')
  })

  it('sin cookie la biblioteca responde 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/library' })
    expect(res.statusCode).toBe(401)
  })

  it('logout invalida la sesion', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/auth/logout' })
    expect(res.statusCode).toBe(200)
    const gone = res.cookies.find((c) => c.name === 'gs_session')
    expect(gone?.value).toBeFalsy()
  })
})

describe('filtro por genero', () => {
  it('filtra el listado por genero', async () => {
    // Del seed casual solo Hollow Knight y Celeste tienen Plataformas.
    const res = await asUser({ method: 'GET', url: '/api/library?genre=Plataformas' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBe(2)
    for (const item of body.items) {
      expect(item.genres).toContain('Plataformas')
    }
  })

  it('un genero sin juegos del usuario devuelve una lista vacia', async () => {
    const res = await asUser({ method: 'GET', url: '/api/library?genre=Western' })
    expect(res.statusCode).toBe(200)
    expect(res.json().items).toHaveLength(0)
    expect(res.json().total).toBe(0)
  })

  it('combina el genero con el resto de filtros', async () => {
    // Unico juego casual con RPG en estado playing: Disco Elysium.
    const res = await asUser({ method: 'GET', url: '/api/library?genre=RPG&status=playing' })
    expect(res.statusCode).toBe(200)
    const items = res.json().items as Array<{ slug: string; status: string }>
    expect(items).toHaveLength(1)
    expect(items[0].slug).toBe('disco-elysium')
    expect(items[0].status).toBe('playing')
  })

  it('stats incluye el conteo por genero del usuario', async () => {
    const res = await asUser({ method: 'GET', url: '/api/library/stats' })
    expect(res.statusCode).toBe(200)
    const { byGenre } = res.json()
    expect(byGenre.Indie).toBe(4)
    expect(byGenre.Plataformas).toBe(2)
    expect(byGenre.RPG).toBe(1)
  })
})

describe('rutas de biblioteca (CRUD)', () => {
  it('responde al listado del usuario de la sesion con su seed', async () => {
    const res = await asUser({ method: 'GET', url: '/api/library' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.total).toBeGreaterThan(0)
    expect(body.items[0]).toHaveProperty('title')
  })

  it('filtra por estado', async () => {
    const res = await asUser({ method: 'GET', url: '/api/library?status=finished' })
    expect(res.statusCode).toBe(200)
    for (const item of res.json().items) expect(item.status).toBe('finished')
  })

  it('filtra por tienda', async () => {
    const res = await asUser({ method: 'GET', url: '/api/library?provider=steam' })
    expect(res.statusCode).toBe(200)
    const items = res.json().items as Array<{ platforms: Array<{ provider: string }> }>
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.platforms.some((p) => p.provider === 'steam')).toBe(true)
    }
  })

  it('rechaza un filtro invalido con 400', async () => {
    const res = await asUser({ method: 'GET', url: '/api/library?status=inventado' })
    expect(res.statusCode).toBe(400)
  })

  it('POST /api/games da de alta por slug y devuelve la entrada', async () => {
    const res = await asUser({
      method: 'POST',
      url: '/api/games',
      payload: { slug: 'elden-ring', title: 'Elden Ring', platform: 'steam' },
    })
    expect(res.statusCode).toBe(201)
    const entry = res.json()
    expect(entry.gameId).toBeGreaterThan(0)
    expect(entry.title).toBeTruthy()
  })

  it('no duplica un juego ya en biblioteca (409)', async () => {
    const res = await asUser({
      method: 'POST',
      url: '/api/games',
      payload: { slug: 'elden-ring', title: 'Elden Ring', platform: 'gog' },
    })
    expect(res.statusCode).toBe(409)
  })

  it('falla con 404 si el titulo no existe en el catalogo', async () => {
    const res = await asUser({
      method: 'POST',
      url: '/api/games',
      payload: { title: 'Juego que no existe', platform: 'steam' },
    })
    expect(res.statusCode).toBe(404)
  })

  it('PATCH actualiza status, notas y precio pagado', async () => {
    const lib = await asUser({ method: 'GET', url: '/api/library' })
    const entry = lib.json().items.find((e: { slug: string }) => e.slug === 'hollow-knight')

    const res = await asUser({
      method: 'PATCH',
      url: `/api/library/${entry.gameId}`,
      payload: { status: 'playing', notes: 'Empezado hoy', pricePaid: 7900 },
    })
    expect(res.statusCode).toBe(200)
    const updated = res.json()
    expect(updated.status).toBe('playing')
    expect(updated.notes).toBe('Empezado hoy')
    expect(updated.pricePaid).toBe(7900)

    const stats = await asUser({ method: 'GET', url: '/api/library/stats' })
    expect(stats.json().byStatus.playing).toBeGreaterThan(0)
  })

  it('PATCH a otro estado y las stats lo reflejan al instante', async () => {
    const lib = await asUser({ method: 'GET', url: '/api/library' })
    const entry = lib.json().items.find((e: { slug: string }) => e.slug === 'celeste')
    expect(entry).toBeDefined()
    const anterior = entry.status as 'backlog' | 'playing' | 'finished' | 'abandoned'
    const nuevo = anterior === 'abandoned' ? 'playing' : 'abandoned'

    const antes = await asUser({ method: 'GET', url: '/api/library/stats' })
    const antesViejo = antes.json().byStatus[anterior] as number
    const antesNuevo = antes.json().byStatus[nuevo] as number

    const res = await asUser({
      method: 'PATCH',
      url: `/api/library/${entry.gameId}`,
      payload: { status: nuevo },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe(nuevo)

    const despues = await asUser({ method: 'GET', url: '/api/library/stats' })
    expect(despues.json().byStatus[nuevo]).toBe(antesNuevo + 1)
    expect(despues.json().byStatus[anterior]).toBe(antesViejo - 1)
  })

  it('PATCH devuelve 404 si el juego no esta en la biblioteca', async () => {
    const lib = await asUser({ method: 'GET', url: '/api/library' })
    const absent = await absentGameId(lib.json())
    const res = await asUser({
      method: 'PATCH',
      url: `/api/library/${absent}`,
      payload: { status: 'finished' },
    })
    expect(res.statusCode).toBe(404)
  })

  it('DELETE quita el juego y el listado ya no lo muestra', async () => {
    const lib = await asUser({ method: 'GET', url: '/api/library' })
    const entry = lib.json().items.find((e: { slug: string }) => e.slug === 'hollow-knight')

    const res = await asUser({ method: 'DELETE', url: `/api/library/${entry.gameId}` })
    expect(res.statusCode).toBe(200)

    const again = await asUser({ method: 'GET', url: '/api/library' })
    const slugs = again.json().items.map((e: { slug: string }) => e.slug)
    expect(slugs).not.toContain('hollow-knight')
  })

  it('DELETE devuelve 404 si ya no esta en la biblioteca', async () => {
    const lib = await asUser({ method: 'GET', url: '/api/library' })
    const absent = await absentGameId(lib.json())
    const res = await asUser({ method: 'DELETE', url: `/api/library/${absent}` })
    expect(res.statusCode).toBe(404)
  })

  it('la busqueda del catalogo devuelve ids resolubles para comparar', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/games/search?q=elden' })
    expect(res.statusCode).toBe(200)
    const items = res.json().items as Array<{ id: number }>
    expect(items.length).toBeGreaterThan(0)
    for (const g of items) expect(g.id).toBeGreaterThan(0)

    const uno = items[0].id
    const cmp = await app.inject({ method: 'GET', url: `/api/prices/compare/${uno}` })
    expect(cmp.statusCode).toBe(200)
    expect(cmp.json().rows.length).toBeGreaterThan(0)
  })

  it('sin termino lista el catalogo completo y con una letra encuentra', async () => {
    const sinTermino = await app.inject({ method: 'GET', url: '/api/games/search' })
    expect(sinTermino.statusCode).toBe(200)
    expect(sinTermino.json().items).toHaveLength(MOCK_CATALOG.length)

    const unaLetra = await app.inject({ method: 'GET', url: '/api/games/search?q=e' })
    expect(unaLetra.statusCode).toBe(200)
    expect(unaLetra.json().items.length).toBeGreaterThan(0)
  })
})

describe('alta desde ITAD', () => {
  it('crea el juego en el catalogo y lo da de alta (201)', async () => {
    const res = await asUser({
      method: 'POST',
      url: '/api/games',
      payload: { itadId: 'test-itad-nuevo', slug: 'titulo-nuevo', title: 'Titulo Nuevo', platform: 'steam' },
    })
    expect(res.statusCode).toBe(201)
    const entry = res.json()
    expect(entry.title).toBe('Titulo Nuevo')
    expect(entry.slug).toBe('titulo-nuevo')
  })

  it('resuelve por el itadId persistido y por eso no duplica (409)', async () => {
    const res = await asUser({
      method: 'POST',
      url: '/api/games',
      // Sin slug: debe resolverse por el itadId guardado en el catalogo.
      payload: { itadId: 'test-itad-nuevo', title: 'Titulo Nuevo', platform: 'gog' },
    })
    expect(res.statusCode).toBe(409)
  })

  it('un juego nuevo de ITAD no tiene precios en modo mock', async () => {
    const res = await asUser({
      method: 'POST',
      url: '/api/games',
      payload: { itadId: 'test-itad-otro', slug: 'otro-nuevo', title: 'Otro Nuevo', platform: 'steam' },
    })
    expect(res.statusCode).toBe(201)
    const { gameId } = res.json()

    // El simulador solo conoce la semilla; un juego traido de ITAD queda
    // sin precios y la pagina muestra el aviso vacio.
    const cmp = await app.inject({ method: 'GET', url: `/api/prices/compare/${gameId}` })
    expect(cmp.statusCode).toBe(200)
    expect(cmp.json().rows).toHaveLength(0)
  })

  it('sin clave ITAD la busqueda nunca mezcla resultados externos', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/games/search?q=nuevo' })
    expect(res.statusCode).toBe(200)
    const items = res.json().items as Array<{ fromItad?: boolean }>
    for (const g of items) expect(g.fromItad).toBeUndefined()
  })
})

/** Id de un juego real del catalogo que el usuario demo no tiene. */
async function absentGameId(lib: { items: Array<{ gameId: number }> }) {
  const owned = new Set(lib.items.map((e) => e.gameId))
  for (let id = 1; id <= MOCK_CATALOG.length; id++) {
    if (!owned.has(id)) return id
  }
  throw new Error('El usuario tiene todo el catalogo; no hay id ausente')
}

