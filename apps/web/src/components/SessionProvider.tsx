import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { SessionUser } from '@gameshelf/shared'
import { api } from '../lib/api'
import { SessionContext, type SessionState } from '../lib/session'

/** Consulta la sesion al arrancar y la comparte con el resto de la app. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let vivo = true
    api
      .me()
      .then((r) => {
        if (vivo) setUser(r.user)
      })
      .catch(() => {
        if (vivo) setUser(null)
      })
      .finally(() => {
        if (vivo) setLoading(false)
      })
    return () => {
      vivo = false
    }
  }, [])

  const login = useCallback(async (username: string) => {
    const r = await api.login(username)
    setUser(r.user)
  }, [])

  const loginDemo = useCallback(async () => {
    const r = await api.loginDemo()
    setUser(r.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // Aunque el API falle, la sesion local se limpia igual.
    }
    setUser(null)
  }, [])

  const value = useMemo<SessionState>(
    () => ({ user, loading, login, loginDemo, logout }),
    [user, loading, login, loginDemo, logout],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
