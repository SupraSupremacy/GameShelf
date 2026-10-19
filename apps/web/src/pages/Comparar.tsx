import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PROVIDER_LABELS } from '@gameshelf/shared'
import type { GameDetail, LibraryEntry, SearchResult } from '@gameshelf/shared'
import { api } from '../lib/api'

/** Precio en centavos -> "$1.990" (formato chileno, sin decimales). */
function fmt(n: number | null): string {
  if (n === null) return '—'
  return `$${(n / 100).toLocaleString('es-CL')}`
}

export function CompararPage() {
  const [params, setParams] = useSearchParams()
  const gameId = Number(params.get('gameId') ?? '') || null

  const [lib, setLib] = useState<LibraryEntry[]>([])
  const [detail, setDetail] = useState<GameDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    api
      .library({ limit: 100 })
      .then((p) => setLib(p.items))
      .catch(() => setLib([]))
  }, [])

  useEffect(() => {
    if (!gameId) return
    let viva = true
    // El 0 difiere el reset al mismo hueco donde se hace la carga, sin
    // llamar setState sincronamente dentro del efecto.
    const t = setTimeout(() => {
      setDetail(null)
      setError(null)
      setLoading(true)
      api
        .compare(gameId)
        .then((d) => {
          if (viva) setDetail(d)
        })
        .catch(() => {
          if (viva) setError('No se pudo cargar la comparación.')
        })
        .finally(() => {
          if (viva) setLoading(false)
        })
    }, 0)
    return () => {
      clearTimeout(t)
      viva = false
    }
  }, [gameId])

  useEffect(() => {
    if (q.trim().length < 1) return
    const t = setTimeout(() => {
      setSearching(true)
      api
        .search(q)
        .then((r) => setResults(r.items))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  function elegir(id: number | null) {
    if (id) setParams({ gameId: String(id) })
    else setParams({})
  }

  const mostrarBusqueda = q.trim().length >= 1 ? results : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comparar precios</h1>
        <p className="mt-2 text-sm text-shelf-400">
          Precio actual del título en Steam, Epic Games Store y GOG, con la rebaja y el mínimo histórico.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <label htmlFor="desde-biblioteca" className="text-sm font-medium text-shelf-200">
            Desde tu biblioteca
          </label>
          <select
            id="desde-biblioteca"
            value={gameId ?? ''}
            onChange={(e) => elegir(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 w-full rounded-lg border border-shelf-800 bg-shelf-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">Elige un juego...</option>
            {lib.map((j) => (
              <option key={j.gameId} value={j.gameId}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="desde-catalogo" className="text-sm font-medium text-shelf-200">
            O del catálogo
          </label>
          <input
            id="desde-catalogo"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="hollow, elden, disco..."
            className="mt-1 w-full rounded-lg border border-shelf-800 bg-shelf-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
          />
          {q.trim().length === 0 && (
            <p className="mt-1 text-xs text-shelf-600">
              Sin texto no se muestra nada; una letra es suficiente para buscar.
            </p>
          )}
          {searching && <p className="mt-1 text-xs text-shelf-600">Buscando...</p>}
          {mostrarBusqueda !== null && !searching && mostrarBusqueda.length === 0 && (
            <p className="mt-1 text-xs text-shelf-600">Sin resultados para "{q.trim()}".</p>
          )}
          {mostrarBusqueda !== null && mostrarBusqueda.length > 0 && !searching && (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {mostrarBusqueda.map((g) => (
                <li key={g.slug}>
                  <button
                    className="btn btn-ghost w-full justify-start border border-shelf-800"
                    onClick={() => elegir(g.id)}
                  >
                    <span className="truncate">{g.title}</span>
                    <span className="ml-auto shrink-0 text-xs text-shelf-600">
                      {g.availableOn.length} tienda(s)
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {!gameId ? (
        <div className="card p-4">
          <p className="text-sm text-shelf-600">
            Selecciona un juego para ver el mejor precio entre las tres tiendas.
          </p>
        </div>
      ) : loading ? (
        <p className="text-sm text-shelf-600">Cargando precios...</p>
      ) : error ? (
        <div className="card p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : detail && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">{detail.title}</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-4">
              <h3 className="text-xs text-shelf-400">Mejor tienda</h3>
              <p className="mt-1 text-xl font-semibold">
                {detail.bestProvider ? PROVIDER_LABELS[detail.bestProvider] : '—'}
              </p>
            </div>
            <div className="card p-4">
              <h3 className="text-xs text-shelf-400">Mejor precio</h3>
              <p className="mt-1 text-xl font-semibold">{fmt(detail.bestFinalPrice)}</p>
            </div>
            <div className="card p-4">
              <h3 className="text-xs text-shelf-400">Ahorro vs. más cara</h3>
              <p className="mt-1 text-xl font-semibold">{fmt(detail.potentialSavings)}</p>
            </div>
            <div className="card p-4">
              <h3 className="text-xs text-shelf-400">Min. histórico</h3>
              <p className="mt-1 text-xl font-semibold">
                {detail.atHistoricalLow ? '¡Precio bajo!' : 'No'}
              </p>
            </div>
          </div>

          {detail.ownedSomewhere && (
            <div className="card p-4">
              <p className="text-sm text-shelf-400">
                Ya tienes este juego en {detail.ownedOn.map((p) => PROVIDER_LABELS[p]).join(', ')}.
                Comparar igual te sirve para saber si pagaste bien.
              </p>
            </div>
          )}

          {detail.rows.length === 0 ? (
            <div className="card p-4">
              <p className="text-sm text-shelf-600">
                Sin datos de precios para este juego. Si viene de ITAD, configura
                <code className="mx-1 rounded bg-shelf-900 px-1">ITAD_API_KEY</code>
                para ver los precios reales.
              </p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-shelf-400">
                    <th className="px-3 py-2">Tienda</th>
                    <th className="px-3 py-2">Precio base</th>
                    <th className="px-3 py-2">Precio final</th>
                    <th className="px-3 py-2">Oferta</th>
                    <th className="px-3 py-2">Mín. histórico</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {detail.rows.map((r) => (
                    <tr key={r.provider} className="border-t border-shelf-800">
                      <td className="px-3 py-2">
                        <span className="flex flex-wrap items-center gap-2">
                          {PROVIDER_LABELS[r.provider]}
                          {r.owned && <span className="chip">La tienes</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-shelf-400">{fmt(r.basePrice)}</td>
                      <td className="px-3 py-2 font-semibold">
                        <span className="flex flex-wrap items-center gap-2">
                          {fmt(r.finalPrice)}
                          {r.isBest && <span className="chip text-indigo-300">Mejor precio</span>}
                        </span>
                      </td>
                      <td className="px-3 py-2">{r.discountPercent > 0 ? `-${r.discountPercent}%` : '—'}</td>
                      <td className="px-3 py-2 text-shelf-400">{fmt(r.historyLow)}</td>
                      <td className="px-3 py-2 text-right">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Ir a la tienda
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}