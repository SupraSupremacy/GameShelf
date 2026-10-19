import type { FastifyReply, FastifyRequest } from 'fastify'
import { eq } from 'drizzle-orm'
import { db } from './db/client'
import { users } from './db/schema'
import { env } from './config/env'
import type { ProviderId, SessionUser } from '@gameshelf/shared'

/**
 * Sesion simulada con cookie firmada.
 *
 * No hay contrasena ni verificacion real: es el modo demo del prototipo. Pero
 * el usuario SI vive en una cookie httpOnly en vez de viajar por la query, asi
 * que el navegador no puede cambiarlo a mano y las rutas resuelven la sesion
 * de una sola forma.
 */

export const SESSION_COOKIE = 'gs_session'

/** Sin secreto configurado se usa uno fijo de desarrollo (solo demo). */
export const SESSION_SECRET = env.SESSION_SECRET ?? 'gameshelf-demo-secret'

export function setSessionCookie(reply: FastifyReply, userId: string): void {
  reply.setCookie(SESSION_COOKIE, userId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    signed: true,
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}

/** Id de usuario de la cookie de sesion, o null si no hay cookie valida. */
export function sessionUserId(req: FastifyRequest): string | null {
  const raw = req.cookies[SESSION_COOKIE]
  if (!raw) return null
  const unsigned = req.unsignCookie(raw)
  return unsigned.valid && unsigned.value ? unsigned.value : null
}

/** Usuario real de la sesion, buscado en la base. Null si no hay sesion. */
export async function sessionUser(req: FastifyRequest): Promise<SessionUser | null> {
  const userId = sessionUserId(req)
  if (!userId) return null
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user ? mapUser(user) : null
}

/** Fila de `users` -> contrato compartido. */
export function mapUser(u: {
  id: string
  username: string
  displayName: string
  avatarColor: string
  isDemo: boolean
}): SessionUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarColor: u.avatarColor,
    isDemo: u.isDemo,
    connectedProviders: [] as ProviderId[],
  }
}
