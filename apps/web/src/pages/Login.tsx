import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useSession } from '../lib/session'

export function LoginPage() {
  const { user, login, loading } = useSession()
  const navigate = useNavigate()
  const [entrando, setEntrando] = useState<string | null>(null)
  const [error, setError] = useState(false)

  // Si ya hay sesion, no tiene sentido mostrar el login.
  if (!loading && user) return <Navigate to="/biblioteca" replace />

  async function handleLogin(username: string) {
    setEntrando(username)
    setError(false)
    try {
      await login(username)
      navigate('/biblioteca')
    } catch {
      setError(true)
    } finally {
      setEntrando(null)
    }
  }

  const ocupado = entrando !== null

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-shelf-400">
          Demo simulado: elige una cuenta para entrar a tu biblioteca. No hay contraseña.
        </p>
      </div>

      <div className="card space-y-2 p-4">
        <button
          className="btn btn-primary w-full"
          disabled={ocupado}
          onClick={() => handleLogin('casual')}
        >
          {entrando === 'casual' ? 'Entrando...' : 'Entrar como casual (demo)'}
        </button>
        <button
          className="btn btn-ghost w-full"
          disabled={ocupado}
          onClick={() => handleLogin('coleccionista')}
        >
          {entrando === 'coleccionista' ? 'Entrando...' : 'Entrar como coleccionista (demo)'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400">
          No se pudo iniciar sesión. Revisa que el API esté activo.
        </p>
      )}
    </div>
  )
}
