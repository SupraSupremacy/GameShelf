import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eq, asc } from 'drizzle-orm'
import { db } from '../db/client'
import { users } from '../db/schema'
import {
  clearSessionCookie,
  mapUser,
  sessionUser,
  setSessionCookie,
} from '../session'

const LoginSchema = z.object({
  username: z.string().min(1),
})

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/auth/login', async (req, reply) => {
    const parse = LoginSchema.safeParse(req.body)
    if (!parse.success) {
      return reply.code(400).send({ error: 'Usuario requerido' })
    }

    const { username } = parse.data
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
    if (!user) {
      return reply.code(401).send({ error: 'Usuario no encontrado' })
    }

    setSessionCookie(reply, user.id)
    return { user: mapUser(user) }
  })

  app.post('/auth/demo', async (_req, reply) => {
    const [user] = await db.select().from(users).orderBy(asc(users.username)).limit(1)
    if (!user) return { user: null }
    setSessionCookie(reply, user.id)
    return { user: mapUser(user) }
  })

  app.get('/auth/me', async (req) => ({ user: await sessionUser(req) }))

  app.post('/auth/logout', async (_req, reply) => {
    clearSessionCookie(reply)
    return { ok: true as const }
  })
}
