import { useEffect, useState } from 'react'
import type { AppInfo, SearchResult } from '@gameshelf/shared'
import { api } from '../lib/api'
import { DemoBadge } from '../components/DemoBadge'

const PROVEEDORES = ['steam', 'gog', 'epic'] as const

interface FilaProveedor {
  provider: string
  count: number
  estado: 'ok' | 'error'
}

/**
 * Pagina de estado de la Fase 0.
 *
 * No es decorativa: comprueba de extremo a extremo que el frontend llega
 * al API, que la base esta sembrada y que la busqueda del catalogo
 * responde. Si algo del monorepo se rompe, esta pagina lo delata.
 */
export function StatusPage() {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [salud, setSalud] = useState<'pendiente' | 'ok' | 'error'>('pendiente')
  const [proveedores, setProveedores] = useState<FilaProveedor[]>([])
  const [generos, setGeneros] = useState<string[]>([])
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState<SearchResult[] | null>(null)
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    api
      .info()
      .then((i) => {
        setInfo(i)
        setSalud('ok')
      })
      .catch(() => setSalud('error'))

    api
      .genres()
      .then((r) => setGeneros(r.genres))
      .catch(() => setGeneros([]))

    Promise.all(
      PROVEEDORES.map((p) =>
        api
          .providerPreview(p)
          .then((r) => ({ provider: r.provider, count: r.count, estado: 'ok' as const }))
          .catch(() => ({ provider: p, count: 0, estado: 'error' as const })),
      ),
    ).then(setProveedores)
  }, [])

  useEffect(() => {
    // El API exige dos caracteres: no tiene sentido gastarle la llamada.
    // No hace falta limpiar `resultados`; el render ya comprueba la longitud
    // antes de usarlos, y limpiarlo aqui seria un render en cascada.
    if (consulta.trim().length < 2) return

    const t = setTimeout(() => {
      setBuscando(true)
      api
        .search(consulta)
        .then((r) => setResultados(r.items))
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false))
    }, 250)
    return () => clearTimeout(t)
  }, [consulta])

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Base del proyecto funcionando
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-shelf-400">
          Monorepo, esquema SQLite migrado y catalogo sembrado. Esta pagina
          verifica el enlace completo frontend &rarr; API &rarr; base de datos.
          Las secciones de Login, Biblioteca y Comparador llegan en las fases
          siguientes.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-sm font-medium text-shelf-200">API</h2>
          <p className="mt-2 text-2xl font-semibold">
            {salud === 'ok' ? 'Conectada' : salud === 'error' ? 'Sin respuesta' : 'Comprobando...'}
          </p>
          {info && (
            <dl className="mt-3 space-y-1 text-xs text-shelf-400">
              <div className="flex justify-between gap-2">
                <dt>Region</dt>
                <dd>{info.defaultCountry}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Moneda</dt>
                <dd>{info.defaultCurrency}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>ITAD configurado</dt>
                <dd>{info.itadConfigured ? 'si' : 'no'}</dd>
              </div>
            </dl>
          )}
          <div className="mt-3">
            <DemoBadge info={info ?? undefined} />
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-medium text-shelf-200">Catalogo sembrado</h2>
          <dl className="mt-2 space-y-1 text-sm">
            {proveedores.map((p) => (
              <div key={p.provider} className="flex justify-between gap-2">
                <dt className="capitalize text-shelf-400">{p.provider}</dt>
                <dd className={p.estado === 'error' ? 'text-red-400' : 'font-medium'}>
                  {p.estado === 'error' ? 'error' : `${p.count} juegos`}
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-2 border-t border-shelf-800 pt-1">
              <dt className="text-shelf-400">Generos</dt>
              <dd className="font-medium">{generos.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <label htmlFor="q" className="text-sm font-medium text-shelf-200">
          Busqueda en el catalogo
        </label>
        <input
          id="q"
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="hollow, elden, disco..."
          className="mt-2 w-full rounded-lg border border-shelf-800 bg-shelf-900 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />

        <div className="mt-4">
          {consulta.trim().length < 2 ? (
            <p className="text-sm text-shelf-600">
              Escribe al menos dos caracteres para buscar.
            </p>
          ) : resultados === null ? (
            <p className="text-sm text-shelf-600">Escribe algo para buscar.</p>
          ) : buscando ? (
            <p className="text-sm text-shelf-600">Buscando...</p>
          ) : resultados.length === 0 ? (
            <p className="text-sm text-shelf-600">Sin resultados para "{consulta}".</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.map((g) => (
                <li key={g.slug} className="card p-3">
                  <p className="font-medium">{g.title}</p>
                  <p className="mt-0.5 text-xs text-shelf-600">{g.releaseDate}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.genres.slice(0, 3).map((gen) => (
                      <span key={gen} className="chip">
                        {gen}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-shelf-600">
                    Disponible en: {g.availableOn.join(', ')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}