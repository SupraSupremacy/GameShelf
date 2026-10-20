import { env } from './config/env'
import { buildServer } from './app'
import { runMigrations } from './db/migrate-runner'

/**
 * Punto de entrada del API.
 *
 * Migra antes de escuchar: asi el esquema siempre esta listo y nunca
 * aparece "no such table" en el primer request.
 */
async function main(): Promise<void> {
  await runMigrations()

  const app = await buildServer()

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    console.log(`API lista en http://localhost:${env.PORT}`)
    console.log(`Precios: ${env.pricesSource} | Demo: ${env.isDemo ? 'si' : 'no'}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

main()