import type { FastifyInstance } from 'fastify'
import { env } from '../config/env'

/**
 * Rutas de estado. Sirven para verificar que el API esta vivo y para que
 * el frontend sepa con que modo esta corriendo.
 */
export async function appRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({ ok: true, timestamp: new Date().toISOString() }))

  app.get('/info', async () => ({
    name: 'Game Shelf API',
    demoMode: env.isDemo,
    pricesSource: env.pricesSource,
    itadConfigured: env.itadConfigured,
    defaultCountry: env.DEFAULT_COUNTRY,
    defaultCurrency: env.DEFAULT_CURRENCY,
  }))
}