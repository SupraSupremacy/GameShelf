import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/session'

/** Envuelve paginas que necesitan sesion: sin usuario redirige a /login. */
export function RequireSession({ children }: { children: ReactNode }) {
  const { user, loading } = useSession()

  if (loading) return <p className="text-sm text-shelf-600">Cargando sesión...</p>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
