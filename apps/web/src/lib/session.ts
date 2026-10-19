import { createContext, useContext } from 'react'
import type { SessionUser } from '@gameshelf/shared'

/**
 * Estado de sesion del frontend.
 *
 * El usuario vive en una cookie httpOnly que el navegador no puede leer, asi
 * que la unica fuente de verdad es `GET /api/auth/me`. Este contexto lo
 * consulta una sola vez y lo comparte con toda la app.
 */
export interface SessionState {
  user: SessionUser | null
  loading: boolean
  login: (username: string) => Promise<void>
  loginDemo: () => Promise<void>
  logout: () => Promise<void>
}

export const SessionContext = createContext<SessionState | null>(null)

export function useSession(): SessionState {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de SessionProvider')
  return ctx
}
