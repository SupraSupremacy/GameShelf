import { Link, Outlet, useNavigate } from 'react-router-dom'
import { DemoBadge } from './components/DemoBadge'
import { useSession } from './lib/session'

export function AppLayout() {
  const { user, logout } = useSession()
  const navigate = useNavigate()

  async function salir() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-shelf-800 bg-shelf-900/60">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Game<span className="text-indigo-400">Shelf</span>
          </Link>
          <nav className="ml-6 flex items-center gap-3 text-sm">
            <Link to="/biblioteca" className="text-shelf-300 hover:text-white">
              Biblioteca
            </Link>
            <Link to="/buscar" className="text-shelf-300 hover:text-white">
              Buscar
            </Link>
            <Link to="/comparar" className="text-shelf-300 hover:text-white">
              Comparar
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden items-center gap-2 text-sm text-shelf-300 sm:flex">
                  <span
                    aria-hidden
                    className="inline-block h-6 w-6 rounded-full"
                    style={{ background: user.avatarColor }}
                  />
                  {user.displayName}
                </span>
                <button className="btn btn-ghost" onClick={salir}>
                  Salir
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-ghost">
                Entrar
              </Link>
            )}
            <DemoBadge />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-shelf-600">
        Prototipo educativo. Datos y precios simulados.
      </footer>
    </div>
  )
}
