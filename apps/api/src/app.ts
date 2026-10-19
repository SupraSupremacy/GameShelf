import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import { env } from './config/env'
import { SESSION_SECRET } from './session'
import { appRoutes } from './routes/app'
import { gamesRoutes } from './routes/games'
import { authRoutes } from './routes/auth'
import { libraryRoutes } from './routes/library'
import { pricesRoutes } from './routes/prices'

/**
 * Construye la instancia de Fastify.
 * Se exporta separado del listen para poder usarla en tests sin abrir
 * un puerto.
 */
export async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
  })

  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? false : ['http://localhost:5173'],
    credentials: true,
  })
  await app.register(cookie, { secret: SESSION_SECRET })

  app.get('/', async () => ({
    name: 'Game Shelf API',
    docs: '/api/health',
  }))

  await app.register(appRoutes, { prefix: '/api' })
  await app.register(authRoutes, { prefix: '/api' })
  await app.register(gamesRoutes, { prefix: '/api' })
  await app.register(libraryRoutes, { prefix: '/api' })
  await app.register(pricesRoutes, { prefix: '/api' })

  return app
}