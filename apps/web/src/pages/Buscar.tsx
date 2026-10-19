import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PROVIDER_LABELS } from '@gameshelf/shared'
import type { ProviderId, SearchResult } from '@gameshelf/shared'
import { api, ApiError, isRetryable } from '../lib/api'
import { GameCover } from '../components/GameCover'

type AddPhase = 'idle' | 'adding' | 'added' | 'already' | 'error'

export function BuscarPage() {
  const [q, setQ] = useState('')
  const [genero, setGenero] = useState('')
  const [items, setItems] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<unknown>(null)
  const [retryToken, setRetryToken] = useState(0)
  const [sel, setSel] = useState<Record<string, ProviderId>>({})
  const [phase, setPhase] = useState<Record<string, AddPhase>>({})

  useEffect(() => {
    const term = q.trim()
    const t = setTimeout(() => {
      setLoading(true)
      setSearchError(null)
      // Sin termino el API responde el catalogo completo, de forma que los
      // filtros se pueden usar antes de escribir.
      api
        .search(term)
        .then((r) => setItems(r.items))
        .catch((e) => setSearchError(e))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q, retryToken])

  const buscaAlgo = q.trim().length >= 1

  // Chips con contador por genero, calculados sobre los resultados actuales.
  const generos = [...new Set(items.flatMap((g) => g.genres))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
  const conteoGenero = (g: string): number =>
    items.reduce((n, x) => n + (x.genres.includes(g) ? 1 : 0), 0)

  const mostrar = genero ? items.filter((g) => g.genres.includes(genero)) : items
  const vacioPorGenero = items.length > 0 && mostrar.length === 0

  async function anadir(g: SearchResult) {
    const platform = sel[g.slug] ?? g.availableOn[0]
    if (!platform) return
    setPhase((p) => ({ ...p, [g.slug]: 'adding' }))
    try {
      await api.addGame({ itadId: g.itadId, slug: g.slug, title: g.title, platform })
      setPhase((p) => ({ ...p, [g.slug]: 'added' }))
    } catch (e) {
      // 409 significa que ya estaba: es el resultado deseado, no un fallo.
      const yaEsta = e instanceof ApiError && e.status === 409
      setPhase((p) => ({ ...p, [g.slug]: yaEsta ? 'already' : 'error' }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Buscar</h1>
        <p className="mt-2 text-sm text-shelf-400">Añade juegos a tu biblioteca desde el catálogo.</p>
      </div>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setGenero('')
        }}
        placeholder="Busca juegos..."
        className="w-full rounded-lg border border-shelf-800 bg-shelf-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
      />
      {loading && <p className="text-sm text-shelf-600">Buscando...</p>}
      {searchError ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <p className={isRetryable(searchError) ? 'text-red-400' : 'text-amber-400'}>
            {isRetryable(searchError)
              ? 'No se pudo consultar el catálogo. Revisa que el API esté activo.'
              : searchError instanceof Error
                ? searchError.message
                : 'La búsqueda no es válida.'}
          </p>
          {isRetryable(searchError) && (
            <button type="button" className="btn btn-ghost" onClick={() => setRetryToken((n) => n + 1)}>
              Reintentar
            </button>
          )}
        </div>
      ) : null}
      {!loading && !searchError && vacioPorGenero ? (
        <p className="text-sm text-shelf-600">
          Ningún resultado coincide con el género "{genero}".
        </p>
      ) : !loading && !searchError && buscaAlgo && items.length === 0 ? (
        <p className="text-sm text-shelf-600">Sin resultados para "{q.trim()}".</p>
      ) : null}
      {!loading && !searchError && generos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={chipFiltro(genero === '')}
            onClick={() => setGenero('')}
          >
            Todos ({items.length})
          </button>
          {generos.map((g) => (
            <button
              key={g}
              type="button"
              className={chipFiltro(genero === g)}
              onClick={() => setGenero(g)}
            >
              {g} ({conteoGenero(g)})
            </button>
          ))}
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mostrar.map((g) => {
          const estado: AddPhase = phase[g.slug] ?? 'idle'
          const ocupado = estado === 'adding' || estado === 'added' || estado === 'already'
          const [primera] = g.availableOn
          return (
            <li key={g.slug} className="card overflow-hidden">
              {g.id > 0 && (
                <Link to={`/comparar?gameId=${g.id}`} className="block">
                  <GameCover title={g.title} imageUrl={g.imageUrl} className="h-28 w-full" />
                </Link>
              )}
              <div className="p-3">
              <p className="font-medium">
                {g.title}
                {g.fromItad && <span className="chip ml-2">ITAD</span>}
              </p>
              <p className="text-xs text-shelf-600">{g.availableOn.join(', ')}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {g.availableOn.length > 1 ? (
                  <select
                    aria-label={`Tienda de ${g.title}`}
                    value={sel[g.slug] ?? primera ?? ''}
                    onChange={(e) =>
                      setSel((s) => ({ ...s, [g.slug]: e.target.value as ProviderId }))
                    }
                    className="rounded-lg border border-shelf-800 bg-shelf-900 px-2 py-1.5 text-xs outline-none focus:border-indigo-500"
                  >
                    {g.availableOn.map((p) => (
                      <option key={p} value={p}>
                        {PROVIDER_LABELS[p]}
                      </option>
                    ))}
                  </select>
                ) : primera ? (
                  <span className="chip">{PROVIDER_LABELS[primera]}</span>
                ) : null}
                <button
                  className="btn btn-primary ml-auto"
                  disabled={ocupado || !primera}
                  onClick={() => anadir(g)}
                >
                  {estado === 'adding'
                    ? 'Añadiendo...'
                    : ocupado
                      ? 'Añadido'
                      : 'Añadir a biblioteca'}
                </button>
              </div>
              {estado === 'already' && (
                <p className="mt-2 text-xs text-shelf-400">Ya estaba en tu biblioteca.</p>
              )}
              {estado === 'error' && (
                <p className="mt-2 text-xs text-red-400">No se pudo añadir. Inténtalo de nuevo.</p>
              )}
              </div>
            </li>
          )
        })}
      </ul>
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
