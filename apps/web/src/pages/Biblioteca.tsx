import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GAME_STATUSES,
  GAME_STATUS_LABELS,
  PROVIDERS,
  PROVIDER_LABELS,
} from '@gameshelf/shared'
import type { GameStatus, LibraryEntry, LibraryStats, Paginated, ProviderId } from '@gameshelf/shared'
import { api } from '../lib/api'
import { GameCover } from '../components/GameCover'

/** Precio en centavos -> "$1.990" (formato chileno, sin decimales). */
function fmt(n: number): string {
  return `$${(n / 100).toLocaleString('es-CL')}`
}

export function BibliotecaPage() {
  const [data, setData] = useState<Paginated<LibraryEntry> | null>(null)
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [status, setStatus] = useState<'' | GameStatus>('')
  const [provider, setProvider] = useState<'' | ProviderId>('')
  const [genero, setGenero] = useState('')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [estadoError, setEstadoError] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    // El 0 saca el setState del cuerpo sincrono del efecto, igual que en
    // Comparar: asi no hay renders en cascada.
    const t = setTimeout(() => {
      if (!vivo) return
      setLoading(true)
      setError(false)
      api
        .library({ page, status: status || undefined, provider: provider || undefined, genre: genero || undefined })
        .then((d) => {
          if (vivo) setData(d)
        })
        .catch(() => {
          if (vivo) setError(true)
        })
        .finally(() => {
          if (vivo) setLoading(false)
        })
    }, 0)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [page, status, provider, genero, reload])

  useEffect(() => {
    api
      .libraryStats()
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  function cambiarStatus(v: '' | GameStatus) {
    setStatus(v)
    setPage(1)
  }

  async function cambiarEstado(j: LibraryEntry, nuevo: GameStatus) {
    if (nuevo === j.status) return
    setSavingId(j.gameId)
    setEstadoError(null)
    try {
      await api.updateGame(j.gameId, { status: nuevo })
      // Respuesta instantanea: la tarjeta cambia ya, sin pasar por skeletons.
      setData((d) =>
        d
          ? {
              ...d,
              items: d.items.map((item) =>
                item.gameId === j.gameId ? { ...item, status: nuevo } : item,
              ),
            }
          : d,
      )
      // Refresco silencioso para que un filtro de estado activo saque el juego
      // de la vista y las stats cuenten bien, sin el flash de carga completo.
      api
        .library({
          page,
          status: status || undefined,
          provider: provider || undefined,
          genre: genero || undefined,
        })
        .then(setData)
        .catch(() => {})
      api.libraryStats().then(setStats).catch(() => {})
    } catch {
      // El select es controlado por `data`: al no tocarlo, vuelve solo al valor
      // anterior y se muestra el aviso.
      setEstadoError('No se pudo cambiar el estado. Intenta de nuevo.')
    } finally {
      setSavingId(null)
    }
  }

  function cambiarProvider(v: '' | ProviderId) {
    setProvider(v)
    setPage(1)
  }

  function cambiarGenero(v: string) {
    setGenero(v)
    setPage(1)
  }

  const hayFiltros = status !== '' || provider !== '' || genero !== ''

  const generos = stats
    ? Object.entries(stats.byGenre)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([nombre]) => nombre)
    : []
  const items = data?.items ?? []

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
        <p className="mt-2 text-sm text-shelf-400">
          Tus juegos añadidos manualmente o desde el catálogo.
        </p>
      </section>

      {stats && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-4">
            <h2 className="text-xs text-shelf-400">Total</h2>
            <p className="mt-1 text-2xl font-semibold">{stats.totalGames}</p>
          </div>
          <div className="card p-4">
            <h2 className="text-xs text-shelf-400">Invertido</h2>
            <p className="mt-1 text-2xl font-semibold">{fmt(stats.totalInvested)}</p>
          </div>
          <div className="card p-4">
            <h2 className="text-xs text-shelf-400">Jugando</h2>
            <p className="mt-1 text-2xl font-semibold">{stats.byStatus.playing}</p>
          </div>
          <div className="card p-4">
            <h2 className="text-xs text-shelf-400">Terminados</h2>
            <p className="mt-1 text-2xl font-semibold">{stats.byStatus.finished}</p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={chipFiltro(status === '')}
            onClick={() => cambiarStatus('')}
          >
            Todos{stats ? ` (${stats.totalGames})` : ''}
          </button>
          {GAME_STATUSES.map((s) => (
            <button key={s} className={chipFiltro(status === s)} onClick={() => cambiarStatus(s)}>
              {GAME_STATUS_LABELS[s]}
              {stats ? ` (${stats.byStatus[s]})` : ''}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className={chipFiltro(provider === '')}
            onClick={() => cambiarProvider('')}
          >
            Todas las tiendas
          </button>
          {PROVIDERS.map((p) => (
            <button
              key={p}
              className={chipFiltro(provider === p)}
              onClick={() => cambiarProvider(p)}
            >
              {PROVIDER_LABELS[p]}
              {stats ? ` (${stats.byProvider[p]})` : ''}
            </button>
          ))}
        </div>
        {stats && generos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={chipFiltro(genero === '')}
              onClick={() => cambiarGenero('')}
            >
              Todos los géneros
            </button>
            {generos.map((g) => (
              <button
                key={g}
                className={chipFiltro(genero === g)}
                onClick={() => cambiarGenero(g)}
              >
                {g}
                {` (${stats.byGenre[g]})`}
              </button>
            ))}
          </div>
        )}
      </section>

      {estadoError && (
        <div className="card flex items-center justify-between p-4">
          <p className="text-sm text-red-400">{estadoError}</p>
          <button className="btn btn-ghost" onClick={() => setEstadoError(null)}>
            Cerrar
          </button>
        </div>
      )}

      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-shelf-800/40" />
          ))}
        </section>
      ) : error ? (
        <div className="card p-4">
          <p className="text-sm text-red-400">
            No se pudo cargar la biblioteca. Revisa que el API esté activo.
          </p>
          <button className="btn btn-ghost mt-3" onClick={() => setReload((r) => r + 1)}>
            Reintentar
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-6 text-center">
          {hayFiltros ? (
            <>
              <p className="text-sm text-shelf-400">Ningún juego coincide con los filtros.</p>
              <button
                className="btn btn-ghost mt-3"
                onClick={() => {
                  cambiarStatus('')
                  cambiarProvider('')
                  cambiarGenero('')
                }}
              >
                Limpiar filtros
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-shelf-400">Tu biblioteca está vacía.</p>
              <Link to="/buscar" className="btn btn-primary mt-3">
                Buscar juegos
              </Link>
            </>
          )}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((j) => (
            <article key={j.gameId} className="card overflow-hidden">
              <Link to={`/comparar?gameId=${j.gameId}`} className="block">
                <GameCover title={j.title} imageUrl={j.imageUrl} className="h-36 w-full" />
              </Link>
              <div className="space-y-2 p-3">
                <h3 className="truncate font-medium" title={j.title}>
                  {j.title}
                </h3>
                <p className="truncate text-xs text-shelf-600">
                  {j.genres.slice(0, 2).join(', ') || 'Sin géneros'}
                </p>
                <div className="flex items-center justify-between">
                  <select
                    aria-label={`Estado de ${j.title}`}
                    value={j.status}
                    disabled={savingId === j.gameId}
                    onChange={(e) => cambiarEstado(j, e.target.value as GameStatus)}
                    className="rounded-full border border-shelf-800 bg-shelf-900 px-2 py-0.5 text-xs text-shelf-200 outline-none focus:border-indigo-500 disabled:opacity-60"
                  >
                    {GAME_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {GAME_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-shelf-400">
                    {j.pricePaid !== null ? fmt(j.pricePaid) : '—'}
                  </span>
                </div>
                <Link
                  to={`/comparar?gameId=${j.gameId}`}
                  className="btn btn-ghost w-full border border-shelf-800"
                >
                  Comparar
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && !error && data && data.pageCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <span className="text-sm text-shelf-400">
            Página {data.page} de {data.pageCount}
          </span>
          <button
            className="btn btn-ghost"
            disabled={page >= data.pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}

/** Estilo de los botones de filtro (mismo aspecto que .chip). */
function chipFiltro(activo: boolean): string {
  const base =
    'inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-xs transition-colors'
  return activo
    ? `${base} bg-indigo-500 text-white`
    : `${base} bg-shelf-800 text-shelf-200 hover:bg-shelf-700`
}
